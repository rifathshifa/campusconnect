from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from app.config import Config
from app.models import db

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    CORS(app)  # Enables cross-origin requests from the React frontend
    db.init_app(app)
    JWTManager(app)

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.api import api_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(api_bp, url_prefix='/api')

    # Automatically create database tables for SQLite/PostgreSQL
    with app.app_context():
        try:
            db.create_all()
            print("Database tables initialized successfully.")
        except Exception as e:
            print(f"Database initialization warning (make sure database is reachable): {e}")

    return app
