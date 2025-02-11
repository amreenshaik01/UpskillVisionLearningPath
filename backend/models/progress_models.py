from models import db  
from datetime import datetime


class Progress(db.Model):
    __tablename__ = 'progress'  # Corrected the tablename syntax
    progress_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    module_id = db.Column(db.Integer, db.ForeignKey('modules.module_id', ondelete='CASCADE'), nullable=False)
    completion_status = db.Column(db.Enum('not started', 'in progress', 'completed'), default='not started')
    resources_completed = db.Column(db.Integer, default=0)
    quiz_score = db.Column(db.Integer, default=0)
    correct_answers = db.Column(db.Integer, default=0)  # New column
    incorrect_answers = db.Column(db.Integer, default=0)  # New column
    skipped_answers = db.Column(db.Integer, default=0)  # New column
    pass_fail_status = db.Column(db.String(10))  # Store pass/fail status
    last_updated = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
