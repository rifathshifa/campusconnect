import os
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from app.config import Config
from app.models import db

def get_frontend_dist_dir():
    """Find the frontend dist directory across different deployment layouts."""
    candidates = [
        # 1. Standard repo root layout: backend/app/../../frontend/dist
        os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', 'dist')),
        # 2. Current working directory / frontend / dist
        os.path.abspath(os.path.join(os.getcwd(), 'frontend', 'dist')),
        # 3. Inside backend directory: backend/dist
        os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'dist')),
        # 4. Current working directory / dist
        os.path.abspath(os.path.join(os.getcwd(), 'dist')),
    ]
    for path in candidates:
        if os.path.isdir(path) and os.path.exists(os.path.join(path, 'index.html')):
            return path
    # If not built yet, return the default path
    return candidates[0]

def create_app(config_class=Config):
    frontend_dist_dir = get_frontend_dist_dir()
    
    app = Flask(
        __name__,
        static_folder=None  # Explicit handling to avoid route masking
    )
    app.config.from_object(config_class)

    # Initialize extensions
    CORS(app)  # Enables cross-origin requests
    db.init_app(app)
    JWTManager(app)

    # Register API blueprints
    from app.routes.auth import auth_bp
    from app.routes.api import api_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(api_bp, url_prefix='/api')

    # Frontend serving and SPA client-side routing catch-all
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_frontend(path):
        # Never catch unmatched API endpoints
        if path.startswith('api'):
            return jsonify({
                "error": "Not Found",
                "message": f"API endpoint '/{path}' not found"
            }), 404

        # Serve existing static asset (e.g. /assets/index-xxx.js, /favicon.svg)
        if frontend_dist_dir and os.path.isdir(frontend_dist_dir):
            target_file = os.path.join(frontend_dist_dir, path)
            if path and os.path.exists(target_file) and not os.path.isdir(target_file):
                return send_from_directory(frontend_dist_dir, path)

            # Serve index.html for SPA routes (e.g. /, /dashboard, /login, /register)
            index_path = os.path.join(frontend_dist_dir, 'index.html')
            if os.path.exists(index_path):
                return send_from_directory(frontend_dist_dir, 'index.html')

        # Fallback when frontend dist is not built
        return jsonify({
            "status": "online",
            "message": "CampusConnect Backend API is live.",
            "note": "Frontend dist folder not found. Build the frontend with 'npm --prefix frontend run build'."
        }), 200

    # Automatically create database tables for SQLite/PostgreSQL
    with app.app_context():
        try:
            db.create_all()
            print("Database tables initialized successfully.")
        except Exception as e:
            print(f"Database initialization warning (make sure database is reachable): {e}")

    return app
