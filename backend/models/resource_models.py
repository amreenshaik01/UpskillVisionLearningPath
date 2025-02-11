from models import db  
from datetime import datetime


# Resources Model
class Resource(db.Model):
    __tablename__ = 'resources'
    resource_id = db.Column(db.Integer, primary_key=True)
    module_id = db.Column(db.Integer, db.ForeignKey('modules.module_id', ondelete='CASCADE'), nullable=False)
    resource_title = db.Column(db.String(100), nullable=False)
    resource_type = db.Column(db.Enum('link', 'file', 'text'), nullable=False)
    resource_content = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)