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

module_blueprint = Blueprint("module", __name__)


@module_blueprint.route('/api/complete-module', methods=['POST'])
def complete_module():
    data = request.json
    user_id = data.get('user_id')
    module_id = data.get('module_id')

    if not user_id or not module_id:
        return jsonify({'message': 'Missing user_id or module_id'}), 400

    progress = Progress.query.filter_by(user_id=user_id, module_id=module_id).first()
    if not progress:
        return jsonify({'message': 'No progress record found for this user and module.'}), 404

    progress.completion_status = 'completed'
    db.session.commit()

    return jsonify({'message': 'Module completed successfully.'}), 200


# Add Module to a Course
@module_blueprint.route('/api/add-module', methods=['POST'])
def add_module():
    data = request.json
    course_id = int(data.get('course_id'))
    module_title = data.get('module_title')
    learning_points = data.get('learning_points', '')  
    order_no = int(data.get('order_no'))

    # Validate input
    if not course_id or not isinstance(course_id, int):
        return jsonify({'message': 'Invalid course_id provided.'}), 400
    if not module_title:
        return jsonify({'message': 'Module title is required.'}), 400
    if order_no is None or not isinstance(order_no, int):
        return jsonify({'message': 'Invalid order_no provided.'}), 400

    course = Course.query.get(course_id)
    if not course:
        return jsonify({'message': 'Course not found.'}), 404

    # Add the new module to the course
    new_module = Module(course_id=course_id, 
                        module_title=module_title, 
                        learning_points=learning_points, 
                        order_no=order_no)
    db.session.add(new_module)
    db.session.commit()

    return jsonify({'message': 'Module added successfully to the course.'}), 200


@module_blueprint.route('/api/courses/<int:course_id>/next-order', methods=['GET'])
def get_next_order_number(course_id):
    max_order = db.session.query(db.func.max(Module.order_no)).filter_by(course_id=course_id).scalar() or 0
    return jsonify({'next_order': max_order + 1})


@module_blueprint.route('/api/course-modules/<int:course_id>', methods=['GET'])
def get_course_modules(course_id):
    course = Course.query.get(course_id)
    if not course:
        return jsonify({'message': 'Course not found.'}), 404

    modules = Module.query.filter_by(course_id=course_id).order_by(Module.order_no).all()
    if not modules:
        return jsonify({'message': 'No modules found for this course.'}), 404

    module_list = [{
        'module_id': module.module_id,
        'module_title': module.module_title,
        'learning_points': module.learning_points,
        'order_no': module.order_no
    } for module in modules]

    return jsonify({'modules': module_list}), 200


# Update Module
@module_blueprint.route('/api/modules/<int:module_id>', methods=['PUT'])
def update_module(module_id):
    data = request.json
    module = Module.query.get(module_id)

    if not module:
        return jsonify({'message': 'Module not found.'}), 404

    module.module_title = data.get('module_title', module.module_title)
    module.learning_points = data.get('learning_points', module.learning_points)
    module.order_no = data.get('order_no', module.order_no)

    db.session.commit()
    return jsonify({'message': 'Module updated successfully.'}), 200
