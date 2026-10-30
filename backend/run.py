import os
from dotenv import load_dotenv

# Load custom environment variables from .env file if it exists
load_dotenv()

from app import create_app

app = create_app()

if __name__ == '__main__':
    # Flask runs on port 5000 by default (or PORT env var)
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV', 'development').lower() != 'production' and os.environ.get('DEBUG', 'true').lower() in ('true', '1')
    app.run(host='0.0.0.0', port=port, debug=debug)
