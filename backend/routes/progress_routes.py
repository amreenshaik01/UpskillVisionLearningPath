from flask import Blueprint, render_template, request, jsonify, make_response, session
from werkzeug.security import generate_password_hash, check_password_hash
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from hashlib import sha256
from routes.user_routes import *
from routes.course_routes import *
from routes.module_routes import *
from routes.progress_routes import *
from routes.quiz_routes import *
from routes.resource_routes import *
from models.user_models import *
from models.course_models import *
from models.module_models import *
from models.progress_models import *
from models.quiz_models import *
from models.resource_models import *


progress_blueprint = Blueprint("progress", __name__)


# User Progress Overview
@progress_blueprint.route('/api/progress', methods=['GET'])
def user_progress_overview():
    participants = User.query.filter_by(role_id=4).all()
    progress_data = []

    for participant in participants:
        progress = Progress.query.filter_by(user_id=participant.user_id).all()
        for p in progress:
            module = Module.query.get(p.module_id)
            if module:
                progress_data.append({
                    'user_id': participant.user_id,
                    'username': participant.username,
                    'module_title': module.module_title,
                    'completion_status': p.completion_status,
                    'quiz_score': p.quiz_score,
                    'resources_completed': p.resources_completed,
                    'pass_fail_status':p.pass_fail_status,
                    'correct_answers': p.correct_answers,  
                    'incorrect_answers': p.incorrect_answers, 
                    'skipped_answers': p.skipped_answers  
                })

    return jsonify(progress_data), 200


# User Progress for Individual User
@progress_blueprint.route('/api/progress/user/<int:user_id>', methods=['GET'])
def user_progress(user_id):
    # Fetch progress for the specified user
    progress = Progress.query.filter_by(user_id=user_id).all()
    if not progress:
        return jsonify({'message': 'No progress found for this user.'}), 404

    progress_data = []
    for p in progress:
        module = Module.query.get(p.module_id)
        if module:
            progress_data.append({
                'module_title': module.module_title,
                'completion_status': p.completion_status,
                'quiz_score': p.quiz_score,
                'resources_completed': p.resources_completed,
                'pass_fail_status': p.pass_fail_status,
                'correct_answers': p.correct_answers,
                'incorrect_answers': p.incorrect_answers,
                'skipped_answers': p.skipped_answers
            })

    return jsonify(progress_data), 200




@progress_blueprint.route('/api/hr/performance', methods=['GET'])
def get_filtered_performance():
    # Get the filter parameters from the query string
    course_name = request.args.get('course')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    query = db.session.query(Course)  # Querying the Course model

    # Apply filters based on the provided query parameters
    if course_name:
        query = query.filter(Course.course_name.ilike(f'%{course_name}%'))  # Use ilike for case-insensitive search
    if start_date:
        query = query.filter(Course.start_date >= datetime.strptime(start_date, '%Y-%m-%d').date())  # Convert string to date
    if end_date:
        query = query.filter(Course.end_date <= datetime.strptime(end_date, '%Y-%m-%d').date())  # Convert string to date

    filtered_data = query.all()

    # Manually create a dictionary for each course
    courses_list = []
    for course in filtered_data:
        courses_list.append({
            'course_id': course.course_id,
            'course_name': course.course_name,
            'description': course.description,
            'start_date': course.start_date.strftime('%Y-%m-%d'),
            'end_date': course.end_date.strftime('%Y-%m-%d'),
            'enrollment_count': course.enrollment_count,
            'instructor_id': course.instructor_id
        })

    # Return the filtered data as JSON
    return jsonify(courses_list)


@progress_blueprint.route('/api/hr/participants/course-status', methods=['GET'])
def get_course_status():
    participants = User.query.filter_by(role_id=4).all()  # Fetch participants only
    participant_data = []

    for participant in participants:
        user_id = participant.user_id

        # Fetch enrolled (active) courses
        active_courses = db.session.query(Course.course_name).join(UserCourse).filter(
            UserCourse.user_id == user_id,
            UserCourse.status == 'enrolled'
        ).all()

        # Fetch completed courses
        completed_courses = db.session.query(Course.course_name).join(UserCourse).filter(
            UserCourse.user_id == user_id,
            UserCourse.status == 'completed'
        ).all()

        # Convert list of tuples to list of strings
        active_courses_list = [course[0] for course in active_courses]
        completed_courses_list = [course[0] for course in completed_courses]

        participant_data.append({
            "user_id": user_id,
            "name": f"{participant.first_name} {participant.last_name}",
            "active_courses": active_courses_list,  
            "completed_courses": completed_courses_list  
        })

    return jsonify(participant_data)



@progress_blueprint.route('/api/manager/performance', methods=['GET'])
def get_manager_filtered_performance():
    # Get the filter parameters from the query string
    manager_id = request.args.get('manager_id', type=int)  # Get the logged-in manager's ID
    course_name = request.args.get('course')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    if not manager_id:
        return jsonify({"error": "Missing manager_id"}), 400

    # Fetch the department managed by the logged-in manager
    manager_department = Department.query.filter_by(manager_id=manager_id).first()

    if not manager_department:
        return jsonify({"error": "Manager is not assigned to any department"}), 404

    department_id = manager_department.department_id  # Get department ID

    # Fetch participants (role_id = 4) from the same department
    department_participants = (
        db.session.query(User.user_id)
        .join(UserDepartment, User.user_id == UserDepartment.user_id)
        .filter(UserDepartment.department_id == department_id, User.role_id == 4)
        .all()
    )

    participant_ids = [p.user_id for p in department_participants]  # Extract user IDs

    if not participant_ids:
        return jsonify({"message": "No participants found in this department"}), 404

    # Query the Course model and filter enrollments
    query = (
        db.session.query(Course.course_id, Course.course_name, Course.description, 
                         Course.start_date, Course.end_date, Course.instructor_id, 
                         db.func.count(UserCourse.user_id).label("enrollment_count"))
        .join(UserCourse, Course.course_id == UserCourse.course_id)
        .filter(UserCourse.user_id.in_(participant_ids))  # Only count enrollments for department participants
        .group_by(Course.course_id)
    )

    # Apply filters based on the provided query parameters
    if course_name:
        query = query.filter(Course.course_name.ilike(f'%{course_name}%'))  # Case-insensitive search
    if start_date:
        query = query.filter(Course.start_date >= datetime.strptime(start_date, '%Y-%m-%d').date())
    if end_date:
        query = query.filter(Course.end_date <= datetime.strptime(end_date, '%Y-%m-%d').date())

    filtered_data = query.all()

    # Convert results to a dictionary
    courses_list = []
    for course in filtered_data:
        courses_list.append({
            'course_id': course.course_id,
            'course_name': course.course_name,
            'description': course.description,
            'start_date': course.start_date.strftime('%Y-%m-%d'),
            'end_date': course.end_date.strftime('%Y-%m-%d'),
            'enrollment_count': course.enrollment_count,  # Only enrollments from the manager's department
            'instructor_id': course.instructor_id
        })

    # Return the filtered data as JSON
    return jsonify(courses_list), 200


@progress_blueprint.route('/api/manager/participants/course-status', methods=['GET'])
def get_manager_course_status():
    manager_id = request.args.get('manager_id', type=int)  # Get manager ID from query params

    if not manager_id:
        return jsonify({"error": "Missing manager_id"}), 400

    # Fetch the department managed by the logged-in manager
    manager_department = Department.query.filter_by(manager_id=manager_id).first()

    if not manager_department:
        return jsonify({"error": "Manager is not assigned to any department"}), 404

    department_id = manager_department.department_id  # Get department ID

    # Fetch participants (role_id = 4) from the same department
    participants = (
        db.session.query(User)
        .join(UserDepartment, User.user_id == UserDepartment.user_id)
        .filter(UserDepartment.department_id == department_id, User.role_id == 4)
        .all()
    )

    if not participants:
        return jsonify({"message": "No participants found in this department"}), 404

    participant_data = []
    for participant in participants:
        user_id = participant.user_id

        # Fetch active courses
        active_courses = db.session.query(Course.course_name).join(UserCourse).filter(
            UserCourse.user_id == user_id, UserCourse.status == 'enrolled'
        ).all()

        # Fetch completed courses
        completed_courses = db.session.query(Course.course_name).join(UserCourse).filter(
            UserCourse.user_id == user_id, UserCourse.status == 'completed'
        ).all()

        # Convert list of tuples to list of strings
        active_courses_list = [course[0] for course in active_courses]
        completed_courses_list = [course[0] for course in completed_courses]

        participant_data.append({
            "user_id": user_id,
            "name": f"{participant.first_name} {participant.last_name}",
            "active_courses": active_courses_list,
            "completed_courses": completed_courses_list
        })

    return jsonify(participant_data), 200


@progress_blueprint.route('/api/manager/course-leaderboard', methods=['GET'])
def get_manager_course_leaderboard():
    manager_id = request.args.get('manager_id', type=int)  # Get the logged-in manager's ID

    if not manager_id:
        return jsonify({"error": "Missing manager_id"}), 400

    # Fetch the department managed by the logged-in manager
    manager_department = Department.query.filter_by(manager_id=manager_id).first()

    if not manager_department:
        return jsonify({"error": "Manager is not assigned to any department"}), 404

    department_id = manager_department.department_id  # Get department ID

    # Fetch participants (role_id = 4) from the same department
    department_participants = (
        db.session.query(User.user_id)
        .join(UserDepartment, User.user_id == UserDepartment.user_id)
        .filter(UserDepartment.department_id == department_id, User.role_id == 4)
        .all()
    )

    participant_ids = [p.user_id for p in department_participants]  # Extract user IDs

    if not participant_ids:
        return jsonify({"message": "No participants found in this department"}), 404

    # Query to count completed courses for each participant
    leaderboard_query = (
        db.session.query(
            User.user_id, User.first_name, User.last_name, db.func.count(UserCourse.enrollment_id).label('completed_courses_count')
        )
        .join(UserCourse, User.user_id == UserCourse.user_id)
        .filter(UserCourse.user_id.in_(participant_ids), UserCourse.status == 'completed')  # Filter for completed courses only
        .group_by(User.user_id)
        .order_by(db.desc('completed_courses_count'))  # Sort by the number of completed courses (descending)
    )

    leaderboard_data = leaderboard_query.all()

    # Create the leaderboard list
    leaderboard = [
        {
            'user_id': user_id,
            'name': f"{first_name} {last_name}",
            'completed_courses_count': completed_courses_count
        }
        for user_id, first_name, last_name, completed_courses_count in leaderboard_data
    ]

    return jsonify(leaderboard), 200


@progress_blueprint.route('/api/hr/course-leaderboard', methods=['GET'])
def get_hr_course_leaderboard():
    # Fetch all participants (role_id = 4) across departments
    participants = (
        db.session.query(User.user_id, User.first_name, User.last_name)
        .filter(User.role_id == 4)  # Only participants
        .all()
    )

    if not participants:
        return jsonify({"message": "No participants found"}), 404

    # Fetch completed courses for each participant
    leaderboard_query = (
        db.session.query(
            User.user_id, 
            User.first_name, 
            User.last_name, 
            db.func.count(UserCourse.enrollment_id).label('completed_courses_count')
        )
        .join(UserCourse, User.user_id == UserCourse.user_id)
        .filter(UserCourse.status == 'completed')  # Only consider completed courses
        .group_by(User.user_id)
        .order_by(db.desc('completed_courses_count'))  # Sort by number of completed courses (descending)
    )

    leaderboard_data = leaderboard_query.all()

    # Create the leaderboard list for HR
    leaderboard = [
        {
            'user_id': user_id,
            'name': f"{first_name} {last_name}",
            'completed_courses_count': completed_courses_count
        }
        for user_id, first_name, last_name, completed_courses_count in leaderboard_data
    ]

    return jsonify(leaderboard), 200