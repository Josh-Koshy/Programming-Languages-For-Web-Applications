import flask_sqlalchemy

db = flask_sqlalchemy.SQLAlchemy()


class Purchase(db.Model):
    p_id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(1024), nullable=False)
    value = db.Column(db.Float, nullable=False)
    category = db.Column(db.Integer, db.ForeignKey('category.c_id'),
                         nullable=True)
    date = db.Column(db.Date, nullable=False)

    def __init__(self, description, value, category, date):
        self.description = description
        self.value = value
        self.category = category
        self.date = date


class Category(db.Model):
    c_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(24), nullable=False)
    value = db.Column(db.Float, nullable=False)

    purchases = db.relationship('Purchase', backref='thingsPurchased', lazy=True)

    def __init__(self, name, value):
        self.name = name
        self.value = value
