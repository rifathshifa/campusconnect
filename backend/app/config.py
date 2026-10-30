import os
from datetime import timedelta
from dotenv import load_dotenv

# Ensure .env is loaded
load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev_secret_key_12345')
    
    # PostgreSQL database URI config, fallback to SQLite for local development
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL', 
        'sqlite:///' + os.path.join(os.path.abspath(os.path.dirname(__file__)), 'campusconnect.db')
    )
    # Fix for newer SQLAlchemy versions with Heroku-style postgresql:// URIs
    if SQLALCHEMY_DATABASE_URI.startswith("postgres://"):
        SQLALCHEMY_DATABASE_URI = SQLALCHEMY_DATABASE_URI.replace("postgres://", "postgresql://", 1)
        
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Engine options for connection pooling (robust Postgres connections)
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 280,
    }
    
    # JWT Extended config
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt_secret_key_67890')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=2)
    
    # Gemini API Key configuration
    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')

    # SMTP configuration for real email sending
    SMTP_SERVER = os.environ.get('SMTP_SERVER', '')
    SMTP_PORT = int(os.environ.get('SMTP_PORT', 587))
    SMTP_USERNAME = os.environ.get('SMTP_USERNAME', '')
    SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
    SMTP_USE_TLS = os.environ.get('SMTP_USE_TLS', 'True').lower() in ('true', '1', 't')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER', SMTP_USERNAME)

