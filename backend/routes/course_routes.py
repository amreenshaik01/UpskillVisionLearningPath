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

course_blueprint = Blueprint("course", __name__)


@course_blueprint.route('/api/courses', methods=['POST'])
def create_course():
    """
    Create a new course with validation and error handling.
    """
    data = request.get_json()

    # Validation
    required_fields = ['course_name', 'description', 'start_date', 'end_date', 'instructor_id']
    missing_fields = [field for field in required_fields if not data.get(field)]
    if missing_fields:
        return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400

    # Extract data
    course_name = data.get('course_name')
    description = data.get('description')
    instructor_id = data.get('instructor_id')

    try:
        # Parse dates
        start_date = datetime.strptime(data.get('start_date'), "%Y-%m-%d")
        end_date = datetime.strptime(data.get('end_date'), "%Y-%m-%d")
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400

    # Validate instructor
    instructor = User.query.filter_by(user_id=instructor_id, role_id=3).first()
    if not instructor:
        return jsonify({'error': 'Invalid instructor ID or the user is not an instructor'}), 400

    try:
        # Create a new course
        new_course = Course(
            course_name=course_name,
            description=description,
            start_date=start_date,
            end_date=end_date,
            instructor_id=instructor_id
        )
        db.session.add(new_course)
        db.session.commit()

        return jsonify({
            "course_id": new_course.course_id,  # Assuming course_id is the primary key
            "message": "Course created successfully"
        }), 201
    except Exception as e:
        db.session.rollback()  # Rollback in case of an error
        return jsonify({"error": f"Failed to create course: {str(e)}"}), 500


@course_blueprint.route('/api/courses', methods=['GET'])
def get_courses():
    user_id = request.args.get('user_id')  # Get the user ID from the request
    
    courses = Course.query.all()
    
    if not courses:
        return jsonify({'message': 'No courses available.'}), 200
    
    # Fetch the user's enrollment status for all courses
    user_courses = {}
    if user_id:
        user_courses_query = UserCourse.query.filter_by(user_id=user_id).all()
        user_courses = {uc.course_id: uc.status for uc in user_courses_query}
    
    courses_list = []
    for course in courses:
        # Fetch the instructor based on the instructor_id in the course table
        instructor = User.query.get(course.instructor_id)
        
        # If the instructor exists, include their first and last name in the response
        instructor_name = f"{instructor.first_name} {instructor.last_name}" if instructor else "Unknown Instructor"
        
        # Format the start_date and end_date to display only the date part (YYYY-MM-DD)
        start_date = course.start_date.strftime('%Y-%m-%d') if course.start_date else "Unknown"
        end_date = course.end_date.strftime('%Y-%m-%d') if course.end_date else "Unknown"
        
        # Get enrollment and completion statuses
        user_status = user_courses.get(course.course_id, {})
        enrollment_status = user_status.get('status', "Not Enrolled")
        
        # Append the course data with instructor information and formatted dates
        courses_list.append({
            'course_id': course.course_id,
            'course_name': course.course_name,
            'description': course.description,
            'start_date': start_date,
            'end_date': end_date,
            'instructor_name': instructor_name,  # Add the instructor's name
            'enrollment_status': enrollment_status  # Add enrollment status
        })
    
    return jsonify(courses_list), 200


@course_blueprint.route('/api/user_courses', methods=['GET'])
def get_user_courses():
    user_id = request.args.get('user_id')  # Get user_id from request parameters

    # Fetch user courses and all courses in one go
    user_courses = {uc.course_id: uc.status for uc in UserCourse.query.filter_by(user_id=user_id).all()}
    all_courses = Course.query.all()

    courses_list = []
    for course in all_courses:
        enrollment_status = user_courses.get(course.course_id, "Not Enrolled")
        if enrollment_status == "completed":
            enrollment_status = "Completed"
        elif enrollment_status == "enrolled":
            enrollment_status = "Enrolled"

        instructor = User.query.get(course.instructor_id)
        instructor_name = f"{instructor.first_name} {instructor.last_name}" if instructor else "Unknown Instructor"

        courses_list.append({
            'course_id': course.course_id,
            'course_name': course.course_name,
            'description': course.description,
            'start_date': course.start_date.strftime('%Y-%m-%d'),
            'end_date': course.end_date.strftime('%Y-%m-%d'),
            'instructor_name': instructor_name,
            'enrollment_status': enrollment_status
        })

    return jsonify(courses_list), 200


@course_blueprint.route('/api/enroll', methods=['POST'])
def enroll_course():
    data = request.json
    user_id = data.get('user_id')
    course_id = data.get('course_id')

    # Validate user_id
    if not user_id or not isinstance(user_id, int):
        return jsonify({'message': 'Invalid user_id provided.'}), 400
    
    # Validate course_id
    if not course_id or not isinstance(course_id, int):
        return jsonify({'message': 'Invalid course_id provided.'}), 400
    
    # Check if the user is already enrolled
    existing_enrollment = UserCourse.query.filter_by(user_id=user_id, course_id=course_id).first()
    if existing_enrollment:
        return jsonify({'message': 'User is already enrolled in this course.'}), 400

    # Enroll the user in the course
    new_enrollment = UserCourse(user_id=user_id, course_id=course_id, status='enrolled')
    db.session.add(new_enrollment)
    
    user = User.query.get(user_id)
    user.enrollment_count += 1
    
    course = Course.query.get(course_id)
    course.enrollment_count += 1
    
    # Create an entry in the Progress table to track the user's progress in the course
    modules = Module.query.filter_by(course_id=course_id).all()
    for module in modules:
        new_progress = Progress(user_id=user_id, module_id=module.module_id, completion_status='not started')
        db.session.add(new_progress)
    
    db.session.commit()
    
    return jsonify({'message': 'User successfully enrolled in the course and progress is initialized.'}), 200


@course_blueprint.route('/api/enroll', methods=['GET'])
def get_enrolled_courses():
    user_id = request.args.get('user_id', type=int)

    # Validate user_id
    if not user_id:
        return jsonify({'message': 'User ID is required.'}), 400

    # Fetch enrolled courses for the user
    enrolled_courses = db.session.query(Course).join(UserCourse).filter(
        UserCourse.user_id == user_id, UserCourse.status == 'enrolled'
    ).all()
    
    print(enrolled_courses)  # Log the output to confirm


    if not enrolled_courses:
        return jsonify([]), 200

    # Serialize the courses
    serialized_courses = []
    for course in enrolled_courses:
        # Fetch the instructor's name
        instructor = User.query.get(course.instructor_id)
        instructor_name = f"{instructor.first_name} {instructor.last_name}" if instructor else "Unknown Instructor"

        # Add the serialized course
        serialized_courses.append({
            'course_id': course.course_id,
            'course_name': course.course_name,
            'description': course.description,
            'start_date': course.start_date.strftime('%Y-%m-%d') if course.start_date else 'TBD',
            'end_date': course.end_date.strftime('%Y-%m-%d') if course.end_date else 'TBD',
            'instructor_name': instructor_name,
            'enrollment_status': 'enrolled',  # Always 'Enrolled' since we're filtering enrolled courses
        })

    return jsonify(serialized_courses), 200


@course_blueprint.route('/api/unenroll', methods=['POST'])
def unenroll_course():
    data = request.json
    user_id = data.get('user_id')
    course_id = data.get('course_id')

    # Check if the user is enrolled in the course
    enrollment = UserCourse.query.filter_by(user_id=user_id, course_id=course_id).first()
    if not enrollment:
        return jsonify({'message': 'User is not enrolled in this course.'}), 404

    # Remove the enrollment
    db.session.delete(enrollment)
    
    user = User.query.get(user_id)
    user.enrollment_count -= 1
    
    course = Course.query.get(course_id)
    course.enrollment_count -= 1
    
    db.session.commit()

    return jsonify({'message': 'User successfully unenrolled from the course.'}), 200


@course_blueprint.route('/api/unenrolled', methods=['GET'])
def get_unenrolled_courses():
    user_id = request.args.get('user_id', type=int)

    # Validate user_id
    if not user_id:
        return jsonify({'message': 'User ID is required.'}), 400

    # Get all courses where the user is not enrolled
    enrolled_courses = db.session.query(Course).join(UserCourse).filter(
        UserCourse.user_id == user_id, UserCourse.status == 'enrolled'
    ).all()

    completed_courses = db.session.query(Course).join(UserCourse).filter(
        UserCourse.user_id == user_id, UserCourse.status == 'completed'
    ).all()

    # Get a list of course IDs that the user is enrolled in or completed
    enrolled_course_ids = {course.course_id for course in enrolled_courses}
    completed_course_ids = {course.course_id for course in completed_courses}

    # Combine both lists to exclude all courses that are either enrolled or completed
    excluded_course_ids = enrolled_course_ids.union(completed_course_ids)

    # Fetch courses that the user is not enrolled in or completed
    unenrolled_courses = db.session.query(Course).filter(Course.course_id.notin_(excluded_course_ids)).all()

    # If no unenrolled courses are found
    if not unenrolled_courses:
        return jsonify([]), 200

    user_courses = {uc.course_id: uc.status for uc in UserCourse.query.filter_by(user_id=user_id).all()}

    courses_list = []
    for course in unenrolled_courses:
        enrollment_status = user_courses.get(course.course_id, "Not Enrolled")
        if enrollment_status == "completed":
            enrollment_status = "Completed"
        elif enrollment_status == "enrolled":
            enrollment_status = "Enrolled"

        instructor = User.query.get(course.instructor_id)
        instructor_name = f"{instructor.first_name} {instructor.last_name}" if instructor else "Unknown Instructor"

        # Serialize the courses
        courses_list.append({
            'course_id': course.course_id,
            'course_name': course.course_name,
            'description': course.description,
            'start_date': course.start_date.strftime('%Y-%m-%d'),
            'end_date': course.end_date.strftime('%Y-%m-%d'),
            'instructor_name': instructor_name,
            'enrollment_status': enrollment_status
        })

    return jsonify(courses_list), 200


@course_blueprint.route('/api/complete', methods=['POST'])
def complete_course():
    data = request.json
    user_id = data.get('user_id')
    course_id = data.get('course_id')

    # Check if the user is enrolled in the course
    enrollment = UserCourse.query.filter_by(user_id=user_id, course_id=course_id).first()
    if not enrollment or enrollment.status != 'enrolled':
        return jsonify({'message': 'User is not currently enrolled in this course.'}), 400

    # Update the status to 'completed'
    enrollment.status = 'completed'
    enrollment.completion_date = db.func.current_timestamp()
    
    user = User.query.get(user_id)
    user.courses_completed += 1
    
    
    db.session.commit()

    return jsonify({'message': 'Course successfully marked as completed.'}), 200


@course_blueprint.route('/api/completed', methods=['GET'])
def get_completed_courses():
    user_id = request.args.get('user_id', type=int)

    # Validate user_id
    if not user_id:
        return jsonify({'message': 'User ID is required.'}), 400

    # Fetch completed courses for the user
    completed_courses = db.session.query(Course).join(UserCourse).filter(
        UserCourse.user_id == user_id, UserCourse.status == 'completed'
    ).all()

    if not completed_courses:
        return jsonify([]), 200

    # Serialize the courses
    serialized_courses = []
    for course in completed_courses:
        # Fetch the instructor's name
        instructor = User.query.get(course.instructor_id)
        instructor_name = f"{instructor.first_name} {instructor.last_name}" if instructor else "Unknown Instructor"

        # Add the serialized course
        serialized_courses.append({
            'course_id': course.course_id,
            'course_name': course.course_name,
            'description': course.description,
            'start_date': course.start_date.strftime('%Y-%m-%d') if course.start_date else 'TBD',
            'end_date': course.end_date.strftime('%Y-%m-%d') if course.end_date else 'TBD',
            'instructor_name': instructor_name,
            'enrollment_status': 'Completed'  # Mark as "Completed"
        })

    return jsonify(serialized_courses), 200


@course_blueprint.route('/api/courses/<int:course_id>', methods=['GET'])
def get_course(course_id):
    course = Course.query.get(course_id)
    if not course:
        return make_response('Course not found', 404)

    # Calculate duration in weeks if both dates are available
    duration_weeks = None
    if course.start_date and course.end_date:
        start_date = course.start_date
        end_date = course.end_date
        duration_weeks = (end_date - start_date).days // 7
        
    # Debug the date formats
    print("Start Date:", course.start_date)  # Check actual format
    print("End Date:", course.end_date)      # Check actual format
        
    course_data = {
        'course_id': course.course_id,
        'course_name': course.course_name,
        'description': course.description,
        'start_date': course.start_date.strftime("%Y-%m-%d") if course.start_date else None,
        'end_date': course.end_date.strftime("%Y-%m-%d") if course.end_date else None,
        'duration_weeks': duration_weeks,
        'instructor_id': course.instructor_id
    }

    return jsonify(course_data), 200


@course_blueprint.route('/api/courses/<int:course_id>', methods=['PUT'])
def update_course(course_id):
    data = request.get_json()
    course = Course.query.get(course_id)
    
    if not course:
        return make_response('Course not found', 404)

    course.course_name = data.get('course_name', course.course_name)
    course.description = data.get('description', course.description)
    course.start_date = data.get('start_date', course.start_date)
    course.end_date = data.get('end_date', course.end_date)
    course.instructor_id = data.get('instructor_id', course.instructor_id)

    db.session.commit()

    return jsonify({'message': 'Course updated successfully'}), 200


@course_blueprint.route('/api/courses/<int:course_id>', methods=['DELETE'])
def delete_course(course_id):
    course = Course.query.get(course_id)
    
    if not course:
        return make_response('Course not found', 404)

    db.session.delete(course)
    db.session.commit()

    return jsonify({'message': 'Course deleted successfully'}), 200


@course_blueprint.route('/api/instructors', methods=['GET'])
def get_instructors():
    try:
        instructors = User.query.filter_by(role_id=3).all()
        instructors_data = [
            {
                "user_id": instructor.user_id,
                "first_name": instructor.first_name,
                "last_name": instructor.last_name,
            }
            for instructor in instructors
        ]
        return jsonify(instructors_data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


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


@course_blueprint.route('/api/courses/notify', methods=['POST'])
def send_course_notification():
    # Extract course_id from the request body
    course_id = request.json.get('course_id')
    if not course_id:
        return jsonify({"message": "Course ID is required"}), 400

    # Retrieve the course from the database
    course = Course.query.get(course_id)
    if not course:
        return jsonify({"message": "Course not found"}), 404

    # Prepare the email content
    subject = f"New Course Available: {course.course_name}"
    body = f"""Dear team,

A new course has been created:

Title: {course.course_name}
Description: {course.description}
Start Date: {course.start_date}
End Date: {course.end_date}
Instructor: {course.instructor.username}

Enroll now to take part in this learning opportunity.
"""
    # Fetch all users to notify
    users = User.query.all()  # Adjust filtering as necessary
    for user in users:
        send_email(user.email, subject, body)

    return jsonify({"message": "Notification sent successfully"}), 200


@course_blueprint.route('/api/courses/update-notify', methods=['POST'])
def send_course_update_notification():
    # Extract course_id from the request body
    course_id = request.json.get('course_id')
    if not course_id:
        return jsonify({"message": "Course ID is required"}), 400

    # Retrieve the course from the database
    course = Course.query.get(course_id)
    if not course:
        return jsonify({"message": "Course not found"}), 404

    # Prepare the email content
    subject = f"Course Updated: {course.course_name}"
    body = f"""Dear team,

The following course has been updated:

Title: {course.course_name}
Description: {course.description}
Start Date: {course.start_date}
End Date: {course.end_date}
Instructor: {course.instructor.username}

Enroll now to take part in this learning opportunity.
"""
    # Fetch all users to notify
    users = User.query.all()  # Adjust filtering as necessary
    for user in users:
        send_email(user.email, subject, body)

    return jsonify({"message": "Notification sent successfully"}), 200


@course_blueprint.route('/api/courses/delete-notify', methods=['POST'])
def send_delete_course_notification():
    # Extract course_id from the request body
    course_id = request.json.get('course_id')
    if not course_id:
        return jsonify({"message": "Course ID is required"}), 400

    # Retrieve the course from the database
    course = Course.query.get(course_id)
    if not course:
        return jsonify({"message": "Course not found"}), 404

    # Prepare the email content
    subject = f"Course Deleted: {course.course_name}"
    body = f"""Dear team,

The following course has been deleted:

Title: {course.course_name}
Description: {course.description}
Start Date: {course.start_date}
End Date: {course.end_date}
Instructor: {course.instructor.username}

"""
    # Fetch all users to notify
    users = User.query.all()  # Adjust filtering as necessary
    for user in users:
        send_email(user.email, subject, body)

    return jsonify({"message": "Notification sent successfully"}), 200


@course_blueprint.route('/api/course-details/<int:course_id>', methods=['GET'])
def fetch_detailed_course(course_id):
    user_id = request.args.get('user_id')

    if not user_id:
        return jsonify({'message': 'User ID is required.'}), 400

    enrollment = Progress.query.filter_by(user_id=user_id).join(Module).filter(Module.course_id == course_id).first()
    if not enrollment:
        return jsonify({'message': 'User is not enrolled in this course.'}), 403

    course = Course.query.get(course_id)
    if not course:
        return jsonify({'message': 'Course not found.'}), 404

    modules = Module.query.filter_by(course_id=course_id).order_by(Module.order_no).all()

    module_data = []
    for module in modules:
        progress = Progress.query.filter_by(user_id=user_id, module_id=module.module_id).first()

        resources = Resource.query.filter_by(module_id=module.module_id).all()
        resource_data = []
        completed_resources = 0
        
        for res in resources:
            resource_completed = (
        progress.resources_completed and isinstance(progress.resources_completed, (list, set)) and res.resource_id in progress.resources_completed
    ) if progress else False


            if resource_completed:
                completed_resources_count += 1

            resource_data.append({
                'resource_id': res.resource_id,
                'resource_title': res.resource_title,
                'resource_type': res.resource_type,
                'resource_content': res.resource_content,
                'completed': resource_completed  
            })

        # Determine the module's completion status based on resource completion
        all_resources_completed = len(resources) == completed_resources
        module_completion_status = 'completed' if all_resources_completed else progress.completion_status if progress else 'not started'

        # Fetch quiz 
        quiz = Quiz.query.filter_by(module_id=module.module_id).first()
        
        module_data.append({
            'module_id': module.module_id,
            'module_title': module.module_title,
            'learning_points': module.learning_points,
            'completion_status': module_completion_status,
            'resources': resource_data,
            'quiz_id': quiz.quiz_id if quiz else None 
        })

    return jsonify({
        'course_name': course.course_name,
        'description': course.description,
        'modules': module_data
    }), 200



@course_blueprint.route('/api/review', methods=['POST'])
def submit_course_review():
    # Get data from request
    data = request.get_json()
    user_id = data.get('user_id')
    course_id = data.get('course_id')
    rating = data.get('rating')
    review_text = data.get('review_text')

    # Validate the input data
    if not user_id or not course_id or not rating:
        return jsonify({'error': 'user_id, course_id, and rating are required.'}), 400

    # Validate that user is enrolled in the course
    enrolled_course = db.session.query(UserCourse).filter_by(user_id=user_id, course_id=course_id, status='enrolled').first()
    if not enrolled_course:
        return jsonify({'error': 'User is not enrolled in the specified course.'}), 400

    # Create a new course review
    new_review = CourseReview(
        course_id=course_id,
        user_id=user_id,
        rating=rating,
        review_text=review_text
    )

    try:
        db.session.add(new_review)
        db.session.commit()
        return jsonify({'message': 'Review submitted successfully!'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@course_blueprint.route('/api/course-reviews', methods=['GET'])
def get_course_reviews():
    course_id = request.args.get('course_id', type=int)

    if not course_id:
        return jsonify({'error': 'Course ID is required.'}), 400

    # Fetch reviews for the specified course
    reviews = db.session.query(CourseReview, User.first_name, User.last_name).join(User, User.user_id == CourseReview.user_id).filter(CourseReview.course_id == course_id).all()

    if not reviews:
        return jsonify({'message': 'No reviews found for this course.'}), 404

    # Format the reviews
    review_list = [{
        'user_name': f"{review.first_name} {review.last_name}",
        'rating': review.CourseReview.rating,
        'review_text': review.CourseReview.review_text,
        'created_at': review.CourseReview.created_at.strftime('%Y-%m-%d')
    } for review in reviews]

    return jsonify(review_list), 200