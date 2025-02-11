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


resource_blueprint = Blueprint("resource", __name__)


@resource_blueprint.route('/api/add-resource', methods=['POST'])
def add_resource():
    data = request.json
    module_id = data.get('module_id')
    resource_title = data.get('resource_title')
    resource_type = data.get('resource_type')  
    resource_content = data.get('resource_content')  

    # Validate module_id
    module = Module.query.get(module_id)
    if not module:
        return jsonify({'message': 'Module not found.'}), 404

    # Validate other fields
    if not resource_title or not resource_type or not resource_content:
        return jsonify({'message': 'Invalid input fields.'}), 400

    # Validate resource_type
    if resource_type not in ['link', 'file', 'text']:
        return jsonify({'message': "Invalid resource_type. Must be 'link', 'file', or 'text'."}), 400

    # For 'link' and 'file', validate URL format
    if resource_type in ['link', 'file']:
        if not resource_content.startswith(('http://', 'https://')):
            return jsonify({'message': 'Invalid URL. Must start with http:// or https://'}), 400

    new_resource = Resource(
        module_id=module_id,
        resource_title=resource_title,
        resource_type=resource_type,
        resource_content=resource_content
    )
    db.session.add(new_resource)
    db.session.commit()

    return jsonify({'message': 'Resource added successfully.', 'resource_id': new_resource.resource_id}), 200


@resource_blueprint.route('/api/complete-resource', methods=['POST'])
def complete_resource():
    data = request.json
    user_id = data.get('user_id')
    resource_id = data.get('resource_id')

    if not user_id or not resource_id:
        return jsonify({'message': 'Missing user_id or resource_id'}), 400

    resource = Resource.query.get(resource_id)
    if not resource:
        return jsonify({'message': 'Resource not found.'}), 404

    user_progress_for_resource = Progress.query.filter_by(user_id=user_id, module_id=resource.module_id).first()
    if not user_progress_for_resource:
        return jsonify({'message': 'No progress record found for this user and module.'}), 404

    if user_progress_for_resource.resources_completed >= Resource.query.filter_by(module_id=resource.module_id).count():
        return jsonify({'message': 'All resources for this module are already completed.'}), 400

    module_resources = Resource.query.filter_by(module_id=resource.module_id).count()
    completed_resources = user_progress_for_resource.resources_completed + 1
    user_progress_for_resource.resources_completed = completed_resources

    if completed_resources == module_resources:
        user_progress_for_resource.completion_status = 'completed'

    db.session.commit()

    return jsonify({
        'message': 'Resource marked as completed.',
        'resources_completed': completed_resources,
        'completion_status': user_progress_for_resource.completion_status
    }), 200


# Update Resource
@resource_blueprint.route('/api/resources/<int:resource_id>', methods=['PUT'])
def update_resource(resource_id):
    data = request.json
    resource = Resource.query.get(resource_id)

    if not resource:
        return jsonify({'message': 'Resource not found.'}), 404

    resource.resource_title = data.get('resource_title', resource.resource_title)
    resource.resource_content = data.get('resource_content', resource.resource_content)

    db.session.commit()
    return jsonify({'message': 'Resource updated successfully.'}), 200
