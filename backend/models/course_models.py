from models import db  
from datetime import datetime


class Course(db.Model):
    __tablename__ = 'courses'
    course_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    course_name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    enrollment_count = db.Column(db.Integer, default=0)
    instructor_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    instructor = db.relationship('User', backref='courses')

    def __repr__(self):
        return f"Course('{self.course_name}', '{self.start_date}', '{self.end_date}')"


class UserCourse(db.Model):
    __tablename__ = 'user_courses'
    enrollment_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.course_id'), nullable=False)
    enrollment_date = db.Column(db.DateTime, default=datetime.utcnow)
    completion_date = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.Enum('enrolled', 'completed', 'dropped'), default='enrolled')


# Course Reviews Model
class CourseReview(db.Model):
    __tablename__ = 'course_reviews'
    review_id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.course_id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    review_text = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# Course Leaderboard Model
class CourseLeaderboard(db.Model):
    __tablename__ = 'course_leaderboard'
    leaderboard_id = db.Column(db.Integer, primary_key=True)
    course_id = db.Column(db.Integer, db.ForeignKey('courses.course_id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    score = db.Column(db.Integer, default=0)
    user_rank = db.Column(db.Integer, nullable=True)


# Course Tags Model
class CourseTag(db.Model):
    __tablename__ = 'course_tags'
    tag_id = db.Column(db.Integer, primary_key=True)
    tag_name = db.Column(db.String(50), unique=True, nullable=False)


# Course Tag Mapping Model
class CourseTagMapping(db.Model):
    __tablename__ = 'course_tag_mapping'
    course_id = db.Column(db.Integer, db.ForeignKey('courses.course_id'), primary_key=True)
    tag_id = db.Column(db.Integer, db.ForeignKey('course_tags.tag_id'), primary_key=True)
