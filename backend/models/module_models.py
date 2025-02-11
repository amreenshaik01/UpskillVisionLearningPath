from models import db  
from datetime import datetime


# Modules Model
class Module(db.Model):
    __tablename__ = 'modules'
    module_id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.course_id', ondelete='CASCADE'), index=True, nullable=False)
    module_title = db.Column(db.String(100), nullable=False)
    learning_points = db.Column(db.Text, nullable=True)
    order_no = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)