# CampusConnect 🎓

CampusConnect is a full-stack campus collaboration platform featuring academic tools, clubs, event management, timetable scheduling, attendance tracking, an AI study assistant, and file sharing.

## 🚀 Tech Stack

- **Frontend**: React (Vite), Tailwind CSS / Vanilla CSS, Lucide Icons, Axios
- **Backend**: Python (Flask, Flask-SQLAlchemy, Flask-JWT-Extended, Flask-CORS)
- **Database**: SQLite (Local development) / PostgreSQL (Production ready)

## 📁 Project Structure

```text
campusconnect/
├── backend/
│   ├── app/                # Flask application package
│   │   ├── routes/         # API routes (auth, clubs, events, timetable, etc.)
│   │   ├── utils/          # Helper utilities & AI assistant integrations
│   │   ├── models.py       # SQLAlchemy database models
│   │   └── config.py       # Configuration settings
│   ├── uploads/            # Uploaded files and resources
│   ├── requirements.txt    # Python dependencies
│   ├── run.py              # Backend entrypoint
│   └── seed.py             # Database seeder script
├── frontend/
│   ├── src/                # React source code (components, pages, context)
│   ├── package.json        # Frontend dependencies
│   └── vite.config.js      # Vite build configuration
└── start.bat               # Windows launcher script for both services
```

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18+) & npm
- Python (v3.9+)

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/rifathshifa/campusconnect.git
   cd campusconnect
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate

   pip install -r requirements.txt
   python seed.py   # Initialize database with sample data
   python run.py    # Runs Flask server at http://localhost:5000
   ```

3. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm run dev      # Runs Vite dev server at http://localhost:5173
   ```

4. **One-click Run (Windows):**
   Simply double-click `start.bat` in the root directory to start both the frontend and backend servers automatically.
