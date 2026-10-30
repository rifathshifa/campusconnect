import os
import sys
from dotenv import load_dotenv

# Ensure backend directory is in sys.path
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend')
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Load environment variables
load_dotenv(os.path.join(backend_dir, '.env'))
load_dotenv()

# Explicitly load create_app from backend/app/__init__.py to prevent naming collision with app.py
import importlib.util
backend_init = os.path.join(backend_dir, 'app', '__init__.py')
spec = importlib.util.spec_from_file_location("backend_app", backend_init)
backend_app = importlib.util.module_from_spec(spec)
sys.modules["app"] = backend_app
spec.loader.exec_module(backend_app)

create_app = backend_app.create_app
app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV', 'development').lower() != 'production' and os.environ.get('DEBUG', 'true').lower() in ('true', '1')
    app.run(host='0.0.0.0', port=port, debug=debug)
