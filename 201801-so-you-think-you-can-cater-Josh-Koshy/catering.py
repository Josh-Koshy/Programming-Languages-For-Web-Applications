import os

from flask import Flask, render_template, request, url_for, redirect
from flask import session, g

from werkzeug import check_password_hash, generate_password_hash
from datetime import date, timedelta

from flask_wtf import FlaskForm
from wtforms import SubmitField, HiddenField
from wtforms.fields.html5 import DateField
from wtforms_components import DateRange

from models import db, User, Event, Job

# create our little application :)
app = Flask(__name__)

# configuration
DEBUG = True
SECRET_KEY = 'for the developer'

SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(app.root_path, 'catering.db')
SQLALCHEMY_TRACK_MODIFICATIONS = False

app.config.from_object(__name__)
app.config.from_envvar('CATERERS_SETTINGS', silent=True)

db.init_app(app)


class SchedForm(FlaskForm):
    date = DateField('date', validators=[DateRange(min=date.today() +
                                                       timedelta(days=1))])
    submit = SubmitField('Submit')


class CancelForm(FlaskForm):
    date = HiddenField('date')
    cancel = SubmitField('Cancel')


@app.cli.command('initdb')
def initdb_command():
    db.create_all()
    db.session.add(User(user_type='1', username='owner', name='Owner', pw=generate_password_hash('pass')))
    db.session.commit()
    print('Initialized the database.')


def get_user_id(username):
    """Convenience method to look up the id for a username."""
    rv = User.query.filter_by(username=username).first()
    return rv.id if rv else None


def get_event_id(event_date):
    """Convenience method to look up the id for a event."""
    rv = Event.query.filter_by(event_date=event_date).first()
    return rv.event_date if rv else None


@app.before_request
def before_request():
    g.user = None
    if 'user_id' in session:
        g.user = User.query.filter_by(user_id=session['user_id']).first()


@app.route('/')
def default():
    if not g.user:
        return redirect(url_for('login'))
    return redirect(url_for('dashboard', user_id=session['user_id']))


@app.route('/login/', methods=['GET', 'POST'])
def login():
    if g.user:
        return redirect(url_for('dashboard', user_id=session['user_id']))
    error = None
    if request.method == 'POST':
        user = User.query.filter_by(username=request.form['user']).first()
        if user is None:
            error = 'Invalid username'
        elif not check_password_hash(user.pw, request.form['password']):
            error = 'Invalid password'
        else:
            session['user_id'] = user.user_id
            return redirect(url_for('dashboard', user_id=session['user_id']))
    return render_template('login.html', title='Login', error=error)


@app.route('/logout/')
def logout():
    if not g.user:
        return redirect(url_for('login'))
    session.pop('user_id', None)
    return render_template('logoutPage.html', title='Logout')


@app.route('/dashboard/', methods=['GET', 'POST'])
def dashboard():
    if not g.user:
        return redirect(url_for('login'))
    if g.user.user_type == '3':
        return redirect(url_for('client_dashboard'))
    error = None
    if request.method == 'POST':
        job = Job.query.filter_by(job_date=request.form['event'],
                                  job_worker=g.user.user_id).first()
        if job is None:
            db.session.add(Job(job_date=request.form['event'],
                                  job_worker=g.user.user_id))
            db.session.commit()
            error = 'You have successfully signed up for event.'
    events = Event.query.order_by(Event.event_date).all()
    users = User.query.all()
    return render_template('company_dashboard.html', level=g.user.user_type,
                           events=events, users=users, error=error, user_id=session['user_id'], title='Dashboard')


@app.route('/client_dashboard/', methods=['GET', 'POST'])
def client_dashboard():
    if not g.user:
        return redirect(url_for('login'))
    error = None
    alert = None
    sched = SchedForm(prefix='sched')
    cancl = CancelForm(prefix='cancl')
    if request.method == 'POST' and sched.validate():
        if get_event_id(sched.date.data) is not None:
            error = 'Error: That date is unavailable'
        else:
            db.session.add(Event(client_id=g.user.user_id, event_date=sched.date.data))
            db.session.commit()
            error = 'Your event is scheduled.'
    elif request.method == 'POST' and not cancl.validate() and not sched.validate():
        error = 'Error: That date is unavailable.'
    if request.method == 'POST' and cancl.validate():
        print(cancl.date.data)
        event = Event.query.filter_by(event_id=cancl.date.data).first()
        if event is not None:
            Job.query.filter_by(job_date=event.event_date).delete(synchronize_session=False)
            Event.query.filter_by(event_id=event.event_id).delete(synchronize_session=False)
            db.session.commit()
            alert = 'Event is cancelled.'
    events = Event.query.order_by(Event.event_date).all()
    return render_template('client_dashboard.html', events=events, cancl=cancl,
                           sched=sched, user_id=session['user_id'], error=error, level=g.user.user_type,
                           alert=alert)


@app.route('/register/', methods=['GET', 'POST'])
def register():
    error = None
    if request.method == 'POST':
        if not request.form['username']:
            error = 'You have to enter a username.'
        elif not request.form['name']:
            error = 'You have to enter a name.'
        elif not request.form['password']:
            error = 'You have to enter a password.'
        elif request.form['password'] != request.form['password_check']:
            error = 'The two passwords do not match.'
        elif get_user_id(request.form['username']) is not None:
            error = 'The username is already taken.'
        elif g.user:
            db.session.add(User(user_type='2', username=request.form['username'], name=request.form['name'],
                                pw=generate_password_hash(request.form['password'])))
            db.session.commit()
            return redirect(url_for('register_success'))
        else:
            db.session.add(User(user_type='3', username=request.form['username'], name=request.form['name'],
                                pw=generate_password_hash(request.form['password'])))
            db.session.commit()
            return redirect(url_for('register_success'))
    return render_template('register.html', title='Register', error=error)


@app.route('/register_success/')
def register_success():
    if not g.user:
        return redirect(url_for('login'))
    return render_template('register_success.html')
