from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class User(db.Model):
    user_id = db.Column(db.Integer, primary_key=True)
    user_type = db.Column(db.String(1), nullable=False)
    username = db.Column(db.String(32), index=True, unique=True, nullable=False)
    name = db.Column(db.String(45), nullable=False)
    pw = db.Column(db.String(64), nullable=False)

    events = db.relationship('Event', backref='client', lazy=True)
    job = db.relationship('Job', backref='working', lazy=True)

    def __init__(self, user_type, username, name, pw):
        self.user_type = user_type
        self.username = username
        self.name = name
        self.pw = pw

    def __repr__(self):
        return '<User {}>'.format(self.username)


class Job(db.Model):
    job_id = db.Column(db.Integer, primary_key=True)
    job_date = db.Column(db.String(10), db.ForeignKey('event.event_date'))
    job_worker = db.Column(db.Integer, db.ForeignKey('user.user_id'))

    def __init__(self, job_date, job_worker):
        self.job_date = job_date
        self.job_worker = job_worker

    def __repr__(self):
        return '<Job {}>'.format(self.job_date)


class Event(db.Model):
    event_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.user_id'))
    event_date = db.Column(db.String(10), unique=True, nullable=False)

    job = db.relationship('Job', backref='workers', lazy=True)

    def __init__(self, client_id, event_date):
        self.user_id = client_id
        self.event_date = event_date

    def __repr__(self):
        return '<Event {}>'.format(self.event_id)



