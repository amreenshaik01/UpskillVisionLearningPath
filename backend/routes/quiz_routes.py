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


quiz_blueprint = Blueprint("quiz", __name__)

@quiz_blueprint.route('/api/quizzes', methods=['POST'])
def add_quiz():
    data = request.json
    module_id = data.get('module_id')
    quiz_title = data.get('quiz_title')
    total_score = data.get('total_score')
    passing_score = data.get('passing_score')

    quiz = Quiz(module_id=module_id, quiz_title=quiz_title, total_score=total_score, passing_score=passing_score)
    db.session.add(quiz)
    db.session.commit()

    return jsonify({'message': 'Quiz added successfully.','quiz_id': quiz.quiz_id}), 200


@quiz_blueprint.route('/api/quizzes/<int:quiz_id>/questions', methods=['POST'])
def add_question(quiz_id):
    data = request.json
    question_text = data.get('question_text')
    question_type = data.get('question_type')  # For example: "mcq"
    
    # Make sure the quiz exists before adding questions
    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({'message': 'Quiz not found.'}), 404
    
    # Create a new question
    question = QuizQuestion(quiz_id=quiz_id, question_text=question_text, question_type=question_type)
    db.session.add(question)
    db.session.commit()
    
    return jsonify({'message': 'Question added successfully.', 'question_id' : question.question_id}), 200

@quiz_blueprint.route('/api/questions/<int:question_id>/answers', methods=['POST'])
def add_answer(question_id):
    data = request.json
    answer_text = data.get('answer_text')
    is_correct = data.get('is_correct')  # True/False
    
    # Make sure the question exists before adding answers
    question = QuizQuestion.query.get(question_id)
    if not question:
        return jsonify({'message': 'Question not found.'}), 404
    
    # Create a new answer
    answer = QuizAnswer(question_id=question_id, answer_text=answer_text, is_correct=is_correct)
    db.session.add(answer)
    db.session.commit()
    
    return jsonify({'message': 'Answer added successfully.'}), 200


@quiz_blueprint.route('/api/get-quizzes/<int:quiz_id>/<int:module_id>', methods=['GET'])
def get_quiz(quiz_id, module_id):
    # Validate quiz existence
    quiz = Quiz.query.filter_by(quiz_id=quiz_id, module_id=module_id).join(Module).filter(
        Module.module_id == module_id
    ).first()

    if not quiz:
        return jsonify({'message': 'Quiz not found or does not belong to the specified module/course.'}), 404

    # Fetch questions and answers for the quiz
    questions = QuizQuestion.query.filter_by(quiz_id=quiz_id).all()
    questions_data = []

    for question in questions:
        # Fetch answers for the question
        answers = QuizAnswer.query.filter_by(question_id=question.question_id).all()
        # Prepare answers data (exclude 'is_correct' to prevent revealing correct answers)
        answers_data = [{'answer_id': ans.answer_id, 'answer_text': ans.answer_text} for ans in answers]
        questions_data.append({
            'question_id': question.question_id,
            'question_text': question.question_text,
            'question_type': question.question_type,
            'answers': answers_data
        })

    # Construct response
    return jsonify({
        'quiz_title': quiz.quiz_title,
        'questions': questions_data,
        'module_id': module_id
    }), 200


@quiz_blueprint.route('/api/modules/<int:module_id>/quizzes', methods=['GET'])
def get_quizzes_by_module(module_id):
    quizzes = Quiz.query.filter_by(module_id=module_id).all()
    if not quizzes:
        return jsonify({'message': 'No quizzes found for this module.'}), 404

    quizzes_data = [{'quiz_id': quiz.quiz_id, 'quiz_title': quiz.quiz_title, 'total_score': quiz.total_score, 'passing_score': quiz.passing_score} for quiz in quizzes]
    return jsonify({'quizzes': quizzes_data}), 200


@quiz_blueprint.route('/api/quizzes/<int:quiz_id>/submit', methods=['POST'])
def quiz_submission(quiz_id):
    data = request.json
    user_id = data.get('user_id')
    answers = data.get('answers', {})  # Default to an empty dictionary if answers is not provided

    quiz = Quiz.query.get(quiz_id)
    if not quiz:
        return jsonify({'message': 'Quiz not found.'}), 404

    score = 0
    correct_answers_count = 0
    incorrect_answers_count = 0

    # Get all questions for the quiz
    all_questions = QuizQuestion.query.filter_by(quiz_id=quiz_id).all()
    skipped_answers_count = len(all_questions)  # Assume all questions are skipped initially

    for question in all_questions:
        question_id = question.question_id
        answer_text = answers.get(str(question_id), "")  # Get the submitted answer for this question

        correct_answers = QuizAnswer.query.filter_by(question_id=question_id, is_correct=True).all()
        correct_answer_texts = [ans.answer_text for ans in correct_answers]

        if answer_text == "":
            continue  # Leave this as skipped
        elif answer_text in correct_answer_texts:
            score += 1
            correct_answers_count += 1  # Track correct answers
        else:
            incorrect_answers_count += 1  # Track incorrect answers

        skipped_answers_count -= 1  # Decrease skipped count if this question was answered

    progress = Progress.query.filter_by(user_id=user_id, module_id=quiz.module_id).first()
    if not progress:
        return jsonify({'message': 'Module progress not found.'}), 404

    # Determine pass/fail status
    pass_fail_status = 'Pass' if score >= quiz.passing_score else 'Fail'

    # Update progress
    progress.quiz_score = score
    progress.pass_fail_status = pass_fail_status
    progress.correct_answers = correct_answers_count if correct_answers_count > 0 else None
    progress.incorrect_answers = incorrect_answers_count if incorrect_answers_count > 0 else None
    progress.skipped_answers = skipped_answers_count if skipped_answers_count > 0 else None

    db.session.commit()

    return jsonify({
        'message': 'Quiz submitted successfully.',
        'score': score,
        'status': pass_fail_status,
        'correct_answers': correct_answers_count,
        'incorrect_answers': incorrect_answers_count,
        'skipped_answers': skipped_answers_count
    }), 200


@quiz_blueprint.route('/api/quiz-performance', methods=['GET'])
def get_quiz_performance():
    user_id = request.args.get('user_id')
    module_id = request.args.get('module_id')

    progress = Progress.query.filter_by(user_id=user_id, module_id=module_id).first()
    if not progress:
        return jsonify({'message': 'User progress not found for this module.'}), 404

    return jsonify({
        'user_id': user_id,
        'module_id': module_id,
        'quiz_score': progress.quiz_score,
        'completion_status': progress.completion_status,
        'pass_fail_status': progress.pass_fail_status  # Added pass/fail status
    }), 200
