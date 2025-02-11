from flask import Blueprint

from .user_routes import user_blueprint
from .course_routes import course_blueprint
from .module_routes import module_blueprint
from .progress_routes import progress_blueprint
from .quiz_routes import quiz_blueprint
from .resource_routes import resource_blueprint

# Create a main blueprint that includes all individual blueprints
main_blueprint = Blueprint('main', __name__)

# Register the individual blueprints with the main blueprint
main_blueprint.register_blueprint(user_blueprint)
main_blueprint.register_blueprint(course_blueprint)
main_blueprint.register_blueprint(module_blueprint)
main_blueprint.register_blueprint(progress_blueprint)
main_blueprint.register_blueprint(quiz_blueprint)
main_blueprint.register_blueprint(resource_blueprint)
