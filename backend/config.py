import os
SECRET_KEY = os.getenv('FLASK_SECRET_KEY', 'default_secret_key')  # Default in case the env var is not set
MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.example.com')
MAIL_PORT = int(os.getenv('MAIL_PORT', 587))  # Convert to integer
MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'True') == 'True'  # Convert to boolean
MAIL_USERNAME = os.getenv('MAIL_USERNAME')
MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER')
