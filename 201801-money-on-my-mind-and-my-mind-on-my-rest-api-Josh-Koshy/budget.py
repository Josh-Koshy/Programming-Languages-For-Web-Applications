import os
import collections

from flask import Flask
from flask import render_template

from flask_restful import reqparse, Api, Resource, fields, marshal_with

from datetime import datetime

from models import db, Category, Purchase

app = Flask(__name__)
api = Api(app)

DEBUG = True
SECRET_KEY = 'development key'

SQLALCHEMY_DATABASE_URI = 'sqlite:///' + os.path.join(app.root_path, 'budget.db')
SQLALCHEMY_TRACK_MODIFICATIONS = False

app.config.from_object(__name__)

db.init_app(app)

category_fields = {
    'c_id': fields.Integer,
    'name': fields.String,
    'value': fields.Float
}

purchase_fields = {
    'p_id': fields.Integer,
    'description': fields.String,
    'value': fields.Float,
    'category': fields.Integer,
    'date': fields.String,
}

cat_parser = reqparse.RequestParser()
cat_parser.add_argument('name')
cat_parser.add_argument('value')

pur_parser = reqparse.RequestParser()
pur_parser.add_argument('description')
pur_parser.add_argument('value')
pur_parser.add_argument('category')
pur_parser.add_argument('date')


class CategoryData(object):
    def __init__(self, c_id, name, value):
        self.c_id = c_id
        self.name = name
        self.value = value


class PurchaseData(object):
    def __init__(self, p_id, value, date, category, description):
        self.p_id = p_id
        self.value = value
        self.date = date
        self.category = category
        self.description = description


class Purchases(Resource):
    @marshal_with(purchase_fields)
    def get(self):
        newPurchases = []
        allPurchases = Purchase.query.order_by(Purchase.date).all()

        for purchase in allPurchases:
            newPurchases.append(PurchaseData(p_id=purchase.p_id,value=purchase.value, date=purchase.date, category=purchase.category, description=purchase.description))

        return newPurchases, 200

    @marshal_with(purchase_fields)
    def post(self):
        args = pur_parser.parse_args()
        db.session.add(Purchase(description=args['description'],
                                value=args['value'], category=args['category'],
                                date=datetime.strptime(args['date'], '%Y-%m-%d').date()))
        db.session.commit()

        newPurchases = Purchase.query.filter_by(description=args['description'],
                                           value=args['value'], category=args['category'],
                                           date=args['date']).order_by(Purchase.p_id.desc()).first()
        newPurchases = PurchaseData(p_id=newPurchases.p_id,
                               value=newPurchases.value, date=newPurchases.date, category=newPurchases.category, description=newPurchases.description)

        return newPurchases, 201

    def put(self):
        args = pur_parser.parse_args()
        purchases = Purchase.query.filter_by(p_id=args['description']).first()

        purchases.value = args['value']
        purchases.category = args['category']
        purchases.date = datetime.strptime(args['date'], '%Y-%m-%d').date()
        db.session.commit()

        return 'Modify Purchase Successful', 201

    def delete(self):
        args = pur_parser.parse_args()
        purchases = Purchase.query.filter_by(p_id=args['description']).first()

        db.session.delete(purchases)
        db.session.commit()

        return 'Delete Purchase Successful', 204


class Categories(Resource):
    @marshal_with(category_fields)
    def get(self):
        cat_all = Category.query.all()
        cat_new = []

        for cat in cat_all:
            cat_new.append(CategoryData(c_id=cat.c_id, name=cat.name,
                                        value=cat.value))

        return cat_new, 200

    @marshal_with(category_fields)
    def post(self):
        args = cat_parser.parse_args()
        db.session.add(Category(name=args['name'], value=args['value']))
        db.session.commit()

        cat_new = Category.query.filter_by(name=args['name']).first()
        cat_new = CategoryData(c_id=cat_new.c_id, name=cat_new.name,
                               value=cat_new.value)

        return cat_new, 201

    def put(self):
        args = cat_parser.parse_args()
        cat = Category.query.filter_by(c_id=args['name']).first()

        cat.value = args['value']
        db.session.commit()

        return 'Modify Category Successful', 201

    def delete(self):
        args = cat_parser.parse_args()
        purs = Purchase.query.filter_by(category=args['name']).all()
        cat = Category.query.filter_by(c_id=args['name']).first()

        for pur in purs:
            pur.category = 1
            db.session.commit()

        db.session.delete(cat)
        db.session.commit()

        return 'Deleted Category', 204


@app.cli.command('initdb')
def initdb_command():
    db.create_all()
    db.session.add(Category(name="Uncategorized",
                            value="0.00"))
    db.session.commit()
    print('Initialized database.')


@app.route('/')
def index():
    return render_template('index.html', title="Home")


api.add_resource(Categories, '/cats')
api.add_resource(Purchases, '/purchases')

if __name__ == "__main__":
    app.run(host="0.0.0.0", debug=True, threaded=True)
