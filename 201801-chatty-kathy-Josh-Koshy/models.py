from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class Chatroom(db.Model):
    chat_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(24), unique=True, nullable=False)
    admin = db.Column(db.String(16), db.ForeignKey('user.username'))

    messages = db.relationship('Message', backref='messages', lazy=True)

    def __init__(self, name, admin):
        self.name = name
        self.admin = admin


class Message(db.Model):
    msg_id = db.Column(db.Integer, primary_key=True)
    author = db.Column(db.String(16), db.ForeignKey('user.username'),
                       nullable=False)
    chatroom = db.Column(db.Integer, db.ForeignKey('chatroom.chat_id'),
                         nullable=False)
    contents = db.Column(db.String(1024), nullable=False)

    time = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    def __init__(self, author, chatroom, contents):
        self.author = author
        self.chatroom = chatroom
        self.contents = contents

class User(db.Model):
    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(16), index=True, unique=True, nullable=False)
    name = db.Column(db.String(32), unique=True, nullable=False)
    pw_hash = db.Column(db.String(64), nullable=False)
    chatroom = db.relationship('Chatroom', backref='chatrooms', lazy=True)
    messages = db.relationship('Message', backref='published', lazy=True)

    def __init__(self, username, name, pw_hash):
        self.username = username
        self.name = name
        self.pw_hash = pw_hash
