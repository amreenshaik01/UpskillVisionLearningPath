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


user_blueprint = Blueprint("user", __name__)


otp_storage = {}
def generate_otp():
    return random.randint(100000, 999999)


@user_blueprint.route('/')
def home():
    return render_template('index.html')


@user_blueprint.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    user_id = data.get('user_id')
    role_id = data.get('role_id')  

    # Verify the user
    user = User.query.filter_by(email=email).first()

    if not user:
        return make_response('User does not exist', 401)
    
    # Check if the user's role matches the requested role
    if user.role_id != int(role_id):
        return make_response('Invalid role for the requested access.', 400)
    
    # Check if the user is approved
    if not user.is_approved:
        return make_response('Your account is pending approval. Please wait for HR to approve your account.', 403)

    stored_salt = user.salt
    entered_password_hash = sha256((password + stored_salt).encode('utf-8')).hexdigest()

    if entered_password_hash != user.password_hash:
        return make_response('Invalid email or password', 401)
    
    otp = generate_otp()
    global otp_storage
    otp_storage[user.email] = otp
    send_otp_email(user.email, otp)

    session['otp'] = otp
    session['email'] = user.email  
    session['role_id'] = user.role_id
    session['user_id'] = user.user_id  
    
    print(session)

    return jsonify({
    'message': 'Login successful. Please enter the OTP sent to your email for verification.',
    'user_id': user.user_id,
    'role_id': user.role_id
})
    

@user_blueprint.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'message': 'Logged out successfully'}), 200


def send_otp_email(user_email, otp):
    sender_email = "tanayshah9045@gmail.com"  
    sender_password = "swju lauj yhlj gpji"
    recipient_email = user_email

    message = MIMEMultipart()
    message["From"] = sender_email
    message["To"] = recipient_email
    message["Subject"] = "Your OTP for Login"

    body = f"Your OTP for login is: {otp}"
    message.attach(MIMEText(body, "plain"))

    try:
        server = smtplib.SMTP_SSL("smtp.gmail.com", 465)
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, recipient_email, message.as_string())
        server.close()
        print("OTP sent successfully!")
    except Exception as e:
        print(f"Error: {e}")


def send_email(to_email, subject, body):
    sender_email = "tanayshah9045@gmail.com"  
    sender_password = "swju lauj yhlj gpji"   

    message = MIMEMultipart()
    message["From"] = sender_email
    message["To"] = to_email
    message["Subject"] = subject
    message.attach(MIMEText(body, "plain"))

    try:
        server = smtplib.SMTP_SSL("smtp.gmail.com", 465)
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, to_email, message.as_string())
        server.quit()
    except Exception as e:
        print(f"Error sending email: {e}")


@user_blueprint.route('/api/generate-otp', methods=['POST'])
def generate_otp1():
    data = request.get_json()
    email = data.get('email')

    user = User.query.filter_by(email=email).first()

    if not user:
        return make_response('Email not found', 400)

    # Generate OTP
    otp = generate_otp()
    otp_storage[email] = otp

    # Send OTP to user's email
    send_otp_email(user.email, otp)

    return jsonify({'message': 'OTP sent to your email!'}), 200



@user_blueprint.route('/api/verify-otp', methods=['POST'])
def verify_otp():
    data = request.get_json()
    otp_entered = data.get('otp')
    email = data.get('email')

    # Check if the OTP and email are provided
    if otp_entered is None or email is None:
        return make_response('OTP and email are required', 400)

    # Retrieve the stored OTP
    global otp_storage
    stored_otp = otp_storage.get(email)

    # Print the stored OTP and the entered OTP
    print(f"Stored OTP: {stored_otp}, Entered OTP: {otp_entered}")

    # Ensure the entered OTP is an integer for comparison
    try:
        otp_entered = int(otp_entered)  
    except ValueError:
        return make_response('OTP must be a valid integer', 400)

    # Check if OTP matches
    if stored_otp is None or stored_otp != otp_entered:
        return make_response('Invalid OTP', 401)

    # Clear OTP from storage after verification
    del otp_storage[email]

    return jsonify({'message': 'OTP verified successfully, you are logged in!'})


@user_blueprint.route('/api/password-reset/request', methods=['POST'])
def password_reset_request():
    data = request.get_json()
    email = data.get('email')
    new_password = data.get('new_password')

    user = User.query.filter_by(email=email).first()

    if not user:
        return make_response('Email not found', 400)

    # Hash the new password before saving it
    hashed_password = generate_password_hash(new_password)

    # Update the user's password in the database
    user.password_hash = hashed_password
    db.session.commit()

    return jsonify({'message': 'Password reset successful'}), 200


@user_blueprint.route('/api/get_user_role', methods=['GET'])
def get_user_role():
    data = request.json
    email = data.get('email')
    if not email:
        print("No email in session") 
        return make_response(jsonify({'message': 'User not logged in.'}), 401)

    user = User.query.filter_by(email=email).first()
    if not user:
        print(f"User with email {email} not found.") 
        return make_response(jsonify({'message': 'User does not exist.'}), 404)

    print(f"User found: {user.username}, Role: {user.role_id}, User ID: {user.user_id}") 
    return jsonify({
        'role': user.role_id,
        'user_id': user.user_id
    }), 200


@user_blueprint.route('/api/users', methods=['POST'])
def create_user():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role_id = data.get('role_id')
    first_name = data.get('first_name') 
    last_name = data.get('last_name')   
    

    # Validate data
    if not all([username, email, password, role_id, first_name, last_name]):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Password hashing
    salt = 'random_salt'
    password_hash = sha256((password + salt).encode('utf-8')).hexdigest()
    
    # Create a new user
    user = User(
        username=username,
        email=email,
        password_hash=password_hash,
        salt=salt,
        role_id=role_id,
        first_name=first_name,  
        last_name=last_name,     
        is_approved=False
    )

    try:
        db.session.add(user)
        db.session.commit()
        return jsonify({'message': 'Registration successful. Awaiting approval.'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Error: {str(e)}'}), 500


@user_blueprint.route('/api/users/approve/<int:user_id>', methods=['PUT'])
def approve_user(user_id):
    user = User.query.get_or_404(user_id)
    if user.is_approved:
        return jsonify({'message': 'User is already approved.'}), 400
    
    user.is_approved = True
    db.session.commit()
    
    send_approval_email(user.email)
    
    return jsonify({'message': 'User approved successfully.'}), 200


def send_approval_email(user_email):
    sender_email = "tanayshah9045@gmail.com"  
    sender_password = "swju lauj yhlj gpji" 
    recipient_email = user_email

    message = MIMEMultipart()
    message["From"] = sender_email
    message["To"] = recipient_email
    message["Subject"] = "Your Account Has Been Approved"

    body = "Congratulations! Your account has been approved. You can now log in to the system."
    message.attach(MIMEText(body, "plain"))

    try:
        server = smtplib.SMTP_SSL("smtp.gmail.com", 465)
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, recipient_email, message.as_string())
        server.close()
        print("Approval email sent successfully!")
    except Exception as e:
        print(f"Error: {e}")


@user_blueprint.route('/api/users/pending', methods=['GET'])
def get_pending_users():
    pending_users = User.query.filter_by(is_approved=False).all()
    if not pending_users:
        return jsonify({'message': 'No users pending approval.'}), 200
    
    users_data = [
        {
            'id': user.user_id,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'email': user.email,
            'role_id': user.role_id,
            'role_name': user.role.role_name  # Assuming a relationship exists
        }
        for user in pending_users
    ]
    
    return jsonify({'pending_users': users_data}), 200


@user_blueprint.route('/api/users', methods=['GET'])
def get_users():
    users = User.query.all()
    users_list = [{'user_id': user.user_id, 'username': user.username, 'email': user.email, 'role_id': user.role_id,'first_name': user.first_name,'last_name': user.last_name} for user in users]
    return jsonify(users_list), 200


@user_blueprint.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Return user details along with their role
    return jsonify({
        "user_id": user.user_id,
        "username": user.username,
        "email": user.email,
        "role_id": user.role_id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "role_name": user.role.role_name if user.role else "No Role"
    }), 200


@user_blueprint.route('/api/roles', methods=['GET'])
def get_roles():
    roles = Role.query.all()
    roles_list = [{'role_id': role.role_id, 'role_name': role.role_name, 'description': role.description} for role in roles]
    return jsonify(roles_list), 200


@user_blueprint.route('/api/users/<int:user_id>/role', methods=['PUT'])
def update_user_role(user_id):
    # Find the user by user_id
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Retrieve the new role_id from the request JSON
    data = request.get_json()
    new_role_id = data.get('role_id')

    # Validate if the new role_id exists
    new_role = Role.query.get(new_role_id)
    if not new_role:
        return jsonify({"error": "Role not found"}), 404

    # Update the user's role_id (no need to modify the Role table)
    user.role_id = new_role_id
    db.session.commit()

    return jsonify({
        "message": "User role updated successfully",
        "user_id": user.user_id,
        "current_role": user.role.role_name if user.role else "None",
        "new_role": new_role.role_name
    }), 200



@user_blueprint.route('/api/users/<int:user_id>/assign-role', methods=['PUT'])
def assign_role(user_id):
    data = request.get_json()
    role_id = data.get('role_id')

    user = User.query.get(user_id)
    if not user:
        return make_response('User not found', 404)

    user.role_id = role_id
    db.session.commit()

    return jsonify({'message': 'Role assigned to user'}), 200


@user_blueprint.route('/api/roles', methods=['POST'])
def create_role():
    data = request.get_json()
    role_name = data.get('role_name')
    description = data.get('description')

    role = Role(role_name=role_name, description=description)
    db.session.add(role)
    db.session.commit()

    return jsonify({'message': 'Role created successfully'}), 201


@user_blueprint.route('/api/users-manager', methods=['GET'])
def get_users_manager():
    role_id = request.args.get('role', type=int)  # Get role_id from query params
    
    query = User.query
    if role_id is not None:
        query = query.filter_by(role_id=role_id)  # Filter users by role_id if provided
    
    users = query.all()
    users_list = [
        {
            'user_id': user.user_id,
            'username': user.username,
            'email': user.email,
            'role_id': user.role_id,
            'first_name': user.first_name,
            'last_name': user.last_name
        }
        for user in users
    ]
    
    return jsonify(users_list), 200


from sqlalchemy.exc import IntegrityError


# Role constants
ROLE_MANAGER = 2  # Adjust based on your actual role IDs
ROLE_PARTICIPANT = 4  # Adjust based on your actual role IDs

# Create a department and assign a manager (only HR should call this)
@user_blueprint.route('/api/departments', methods=['POST'])
def create_department():
    data = request.get_json()
    department_name = data.get('department_name')
    manager_id = data.get('manager_id')

    if not department_name or not manager_id:
        return jsonify({"error": "Department name and manager ID are required."}), 400

    # Check if the user exists and is a manager
    manager = User.query.filter_by(user_id=manager_id, role_id=ROLE_MANAGER).first()
    if not manager:
        return jsonify({"error": "Manager not found or user is not a manager."}), 404

    # Create department
    department = Department(department_name=department_name, manager_id=manager_id)
    try:
        db.session.add(department)
        db.session.commit()
        
        # Fetch manager's full name (first and last name)
        manager_name = f"{manager.first_name} {manager.last_name}"
        
        return jsonify({
            "message": "Department created successfully.",
            "department_id": department.department_id,
            "department_name": department.department_name,
            "manager_name": manager_name  # Include manager's full name
        }), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Department already exists."}), 400


# Fetch all departments (GET method)
@user_blueprint.route('/api/departments', methods=['GET'])
def get_departments():
    departments = Department.query.all()
    departments_list = [
        {
            'department_id': department.department_id,
            'department_name': department.department_name,
            'manager_id': department.manager_id,
            'manager_name': f"{department.manager.first_name} {department.manager.last_name}",
            'participants_count': len(
                db.session.query(User)
                .join(UserDepartment, UserDepartment.user_id == User.user_id)
                .filter(UserDepartment.department_id == department.department_id)
                .all()
            )  
        }
        for department in departments
    ]
    return jsonify(departments_list), 200

# Delete a department by ID
@user_blueprint.route('/api/departments/<int:department_id>', methods=['DELETE'])
def delete_department(department_id):
    department = Department.query.get(department_id)
    
    if not department:
        return jsonify({"error": "Department not found."}), 404

    # Delete all associated records in the UserDepartment table (if necessary)
    db.session.query(UserDepartment).filter_by(department_id=department_id).delete()

    # Delete the department
    db.session.delete(department)
    db.session.commit()

    return jsonify({"message": "Department deleted successfully."}), 200



# Assign a new manager to a department
@user_blueprint.route('/api/departments/<int:department_id>/manager', methods=['PUT'])
def assign_manager(department_id):
    data = request.get_json()
    manager_id = data.get('manager_id')

    if not manager_id:
        return jsonify({"error": "Manager ID is required."}), 400

    # Check if department exists
    department = Department.query.get(department_id)
    if not department:
        return jsonify({"error": "Department not found."}), 404

    # Check if user exists and is a manager
    manager = User.query.filter_by(user_id=manager_id, role_id=ROLE_MANAGER).first()
    if not manager:
        return jsonify({"error": "Manager not found or user is not a manager."}), 404

    # Update manager for the department
    department.manager_id = manager_id
    db.session.commit()

    return jsonify({"message": "Manager assigned successfully."}), 200


@user_blueprint.route('/api/managers', methods=['GET'])
def get_managers():
    try:
        # Fetch all users with the "Manager" role
        managers = User.query.join(Role).filter(Role.role_id == 2).all()  # Assuming role_id 2 is for managers
        
        # Return a list of available managers
        return jsonify([{
            'user_id': manager.user_id,  # Fixed to use the correct user_id
            'first_name': manager.first_name,
            'last_name': manager.last_name
        } for manager in managers])
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500



@user_blueprint.route('/api/departments/<int:department_id>/change-manager', methods=['PUT'])
def change_manager(department_id):
    try:
        # Get the department by ID
        department = Department.query.get(department_id)
        
        if not department:
            return jsonify({'error': 'Department not found'}), 404
        
        # Get the new manager from the request
        data = request.get_json()
        new_manager_id = data.get('manager_id')
        
        print(f"Changing manager for department {department_id} to manager {new_manager_id}")
        
        # Find the new manager
        new_manager = User.query.get(new_manager_id)
        
        if not new_manager or new_manager.role_id != 2:  # Ensure it's a manager role
            return jsonify({'error': 'Invalid manager selected'}), 400
        
        # Update the department's manager
        department.manager_id = new_manager.user_id
        db.session.commit()  # Commit changes to the database
        
        return jsonify({
            'message': 'Manager updated successfully',
            'department_name': department.department_name,
            'new_manager_name': f'{new_manager.first_name} {new_manager.last_name}'
        })
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({'error': str(e)}), 500


@user_blueprint.route('/api/manager/users', methods=['GET'])
def get_manager_users():
    user_id = request.args.get('user_id', type=int)
    role_id = request.args.get('role_id', type=int)
    
    # Check if user_id and role_id are provided
    if not user_id or not role_id:
        return jsonify({'message': 'Missing user_id or role_id'}), 400

    # Find the department managed by the given user_id (manager)
    manager_department = Department.query.filter_by(manager_id=user_id).first()
    
    # If no department is found, return an error message
    if not manager_department:
        return jsonify({'message': 'Manager is not assigned to any department'}), 404

    # Get the department_id from the manager's department
    department_id = manager_department.department_id
    department_name = manager_department.department_name  # Fetch department name
    
    # Now, find the manager's name using the user_id
    manager = User.query.filter_by(user_id=user_id).first()
    if not manager:
        return jsonify({'message': 'Manager not found in the user table'}), 404
    
    manager_name = f"{manager.first_name} {manager.last_name}"  # Combine first and last name
    
    
    # Now, find all users in the same department
    users = (
        db.session.query(User)
        .join(UserDepartment, User.user_id == UserDepartment.user_id)
        .filter(UserDepartment.department_id == department_id)
        .all()
    )

    # If no users are found in the department, return a message
    if not users:
        return jsonify({'message': 'No users found in this department'}), 404

    # Convert user data to JSON (only select relevant fields)
    user_list = [
        {
            "user_id": user.user_id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
        }
        for user in users
    ]

    # Return department name along with users and manager name
    return jsonify({
        "department": department_name,
        "manager": manager_name,  # Include manager name in the response
        "users": user_list
    }), 200
    
    
# Get all participants in the system (role 4 is for participants)
@user_blueprint.route('/api/participants', methods=['GET'])
def get_all_participants():
    try:
        participants = User.query.filter_by(role_id=ROLE_PARTICIPANT).all()
        return jsonify([{
            'user_id': participant.user_id,
            'first_name': participant.first_name,
            'last_name': participant.last_name,
        } for participant in participants]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Get participants of a specific department
@user_blueprint.route('/api/departments/<int:department_id>/participants', methods=['GET'])
def get_participants_of_department(department_id):
    department = Department.query.get(department_id)
    if not department:
        return jsonify({"error": "Department not found."}), 404

    participants = (
        db.session.query(User)
        .join(UserDepartment, UserDepartment.user_id == User.user_id)
        .filter(UserDepartment.department_id == department_id)
        .all()
    )

    return jsonify([{
        'user_id': participant.user_id,
        'first_name': participant.first_name,
        'last_name': participant.last_name,
    } for participant in participants]), 200


# Add participant to department
@user_blueprint.route('/api/departments/<int:department_id>/participants', methods=['POST'])
def assign_participants(department_id):
    data = request.get_json()
    participant_ids = data.get('participant_ids')

    if not participant_ids or not isinstance(participant_ids, list):
        return jsonify({"error": "List of participant IDs is required."}), 400

    department = Department.query.get(department_id)
    if not department:
        return jsonify({"error": "Department not found."}), 404

    for participant_id in participant_ids:
        participant = User.query.filter_by(user_id=participant_id, role_id=ROLE_PARTICIPANT).first()
        if not participant:
            return jsonify({"error": f"User {participant_id} is not a participant or does not exist."}), 400

        user_department = UserDepartment(user_id=participant_id, department_id=department_id)
        db.session.add(user_department)

    try:
        db.session.commit()
        return jsonify({"message": "Participants assigned successfully."}), 200
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Error assigning participants. Some users might already be assigned."}), 500


# Remove participant from department
@user_blueprint.route('/api/departments/<int:department_id>/participants/<int:user_id>', methods=['DELETE'])
def remove_participant_from_department(department_id, user_id):
    department = Department.query.get(department_id)
    if not department:
        return jsonify({"error": "Department not found."}), 404

    participant = User.query.filter_by(user_id=user_id).first()
    if not participant:
        return jsonify({"error": "Participant not found."}), 404

    user_department = UserDepartment.query.filter_by(user_id=user_id, department_id=department_id).first()
    if not user_department:
        return jsonify({"error": "Participant not assigned to this department."}), 400

    try:
        db.session.delete(user_department)
        db.session.commit()
        return jsonify({"message": "Participant removed successfully."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
