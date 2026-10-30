# CampusConnect 🎓
### College Digital Study Materials Library

CampusConnect is a production-ready, full-stack college academic portal designed specifically for sharing and accessing verified study materials digitally. Students can upload textbooks, lab manuals, lab programs, lecture notes, and previous year question papers. Every student upload is reviewed and verified by college staff before becoming visible to the campus.

---

## 🚀 Technology Stack

- **Frontend**: React (Vite 8), Vanilla CSS / Custom Design System, Bootstrap 5, Lucide Icons
- **Backend**: Python 3.9+ (Flask, Flask-SQLAlchemy, Flask-JWT-Extended, Flask-CORS, Gunicorn)
- **Database**: PostgreSQL (Production ready) / SQLite (Persistent local fallback)
- **File Storage**: Persistent storage in `backend/uploads/study_materials/` with cryptographic UUID naming and PDF validation
- **Authentication**: JWT with Role-Based Access Control (Student vs Staff vs Admin)

---

## 🏛️ Core Features

### 1. Student Features
- **Browse Verified Materials**: View and search faculty-approved materials categorized by Department, Year, Semester, and Material Type.
- **Academic Filters**: Filter by department (CSE, IT, ECE, EEE, MECH, CIVIL, AIDS), academic year (1st to 4th Year), semester (1 to 8), and material type.
- **Upload Study Material**: Upload PDF resources (Textbook PDFs, Lab Manuals, Lab Programs, Lecture Notes, Previous Year Question Papers).
- **Mandatory Approval Workflow**: Every upload starts with `Pending Approval` status.
- **My Uploads Status Tracker**: Real-time status tracking (`Pending Approval`, `Approved`, or `Rejected` with staff feedback).
- **Secure PDF Preview & Download**: In-browser PDF preview and authenticated downloads for approved materials.
- **Strict Isolation**: Students can never access pending or rejected materials of other students.

### 2. Staff & Faculty Review System
- **Moderation Dashboard**: Dedicated `Pending Approvals` tab with pending count badge.
- **PDF Preview**: Preview submitted student PDFs directly in the browser before taking action.
- **One-Click Approval**: Publish verified materials directly to the public college library.
- **Rejection with Feedback**: Reject unsuitable submissions and provide a clear rejection reason for the student.
- **Staff-Only Authority**: Only authorized staff/admin accounts can approve or reject uploads; students are strictly forbidden (403 Forbidden).

---

## 📁 Project Structure

```text
campusconnect/
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── api.py           # Study materials, dashboard, health-check APIs
│   │   │   └── auth.py          # User registration, login, JWT management
│   │   ├── models.py            # User, Department, Subject, StudyMaterial
│   │   ├── config.py            # PostgreSQL connection & environment loading
│   │   └── __init__.py          # Flask app initialization & CORS setup
│   ├── uploads/
│   │   └── study_materials/     # Persistent storage for uploaded PDF files
│   ├── test_study_materials.py  # Automated E2E test suite (7 tests)
│   ├── requirements.txt         # Production Python dependencies
│   ├── run.py                   # Backend entrypoint (WSGI / dev server)
│   ├── seed.py                  # Database initialization & seeding script
│   ├── .env.example             # Safe template for production secrets
│   └── .env                     # Local environment file (never committed)
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable Navbar, Footer, Loader, ErrorBoundary
│   │   ├── context/             # AuthContext, ThemeContext, ToastContext
│   │   ├── pages/
│   │   │   ├── StudyMaterials.jsx # Complete Study Materials Library & Review UI
│   │   │   ├── Dashboard.jsx      # Streamlined student & staff dashboard
│   │   │   ├── Home.jsx           # Landing page
│   │   │   ├── Login.jsx          # Login portal
│   │   │   └── Register.jsx       # Student & Staff registration
│   │   ├── App.jsx              # Main routing & protected routes
│   │   └── index.css            # Custom theme & responsive CSS tokens
│   ├── .env.example             # Safe frontend production template
│   ├── package.json             # Node dependencies & Vite build scripts
│   └── vite.config.js           # Vite configuration
├── start.bat                    # One-click Windows starter script
└── .gitignore                   # Multi-tier secret and artifact protection
```

---

## 🛠️ Local Development Quickstart

### Prerequisites
- Node.js (v18+) & npm
- Python (v3.9+)
- PostgreSQL (optional for local dev; SQLite fallback is included automatically)

### 1. Backend Setup
```bash
cd backend
python -m venv venv

# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt

# Run automated tests
python test_study_materials.py

# Initialize and seed database
python seed.py

# Run backend development server
python run.py
```
Backend runs at: `http://localhost:5000`
Health-check: `http://localhost:5000/api/health`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at: `http://localhost:5173`

### 3. One-Click Starter (Windows)
Double-click `start.bat` in the root folder to launch both servers simultaneously.

---

## 🌐 Production Deployment Guide

### Environment Variables

#### Backend (`backend/.env`):
| Variable | Description | Example |
| :--- | :--- | :--- |
| `SECRET_KEY` | Flask cryptographic session key | `32+ character random string` |
| `JWT_SECRET_KEY` | JWT token signing key | `32+ character random string` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/dbname` |
| `FLASK_ENV` | Environment mode | `production` |
| `PORT` | Listening port (default 5000) | `5000` |
| `CORS_ORIGINS` | Permitted frontend domains | `https://your-frontend.vercel.app` |

#### Frontend (`frontend/.env`):
| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base API endpoint URL | `https://your-backend-api.com/api` |

### Deploying Backend (Render / Railway / AWS / Ubuntu VPS)
```bash
cd backend
pip install -r requirements.txt
python seed.py # (or db.create_all() initializes automatically on first run)

# Production command using Gunicorn:
gunicorn -w 4 -b 0.0.0.0:5000 "run:app"
```

### Deploying Frontend (Vercel / Netlify / Cloudflare Pages)
```bash
cd frontend
npm install
npm run build
```
Upload the generated `dist/` directory to your static host.

---

## 👥 Default Seed Credentials for Testing

| Role | Username | Email | Password |
| :--- | :--- | :--- | :--- |
| **Admin** | `rifathshifa` | `rifathshifa.mr@gmail.com` | `shifa@123!` |
| **Staff Reviewer** | `approved_staff` | `approved_staff@campusconnect.edu` | `password123` |
| **Senior Student** | `sarah_j` | `sarah.jenkins@campusconnect.edu` | `password123` |
| **Junior Student** | `john_doe` | `john.doe@campusconnect.edu` | `password123` |
