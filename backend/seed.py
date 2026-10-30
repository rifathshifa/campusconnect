import sys
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv()

# Add backend directory to Python path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app import create_app
from app.models import db, User, Department, Subject, StudyMaterial

app = create_app()

def create_sample_pdf(filepath, title_text, subject_text, type_text):
    """Generate a valid, standard PDF-1.4 binary file for realistic document previews."""
    clean_title = "".join(c if ord(c) < 128 else ' ' for c in title_text)[:60]
    clean_subj = "".join(c if ord(c) < 128 else ' ' for c in subject_text)[:50]
    clean_type = "".join(c if ord(c) < 128 else ' ' for c in type_text)[:40]
    pdf_bytes = (
        b"%PDF-1.4\n"
        b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
        b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n"
        b"3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n"
        b"4 0 obj\n<< /Length 200 >>\nstream\n"
        b"BT\n/F1 18 Tf\n50 720 Td\n(" + clean_title.encode('latin1') + b") Tj\n"
        b"/F1 13 Tf\n0 -30 Td\n(Subject: " + clean_subj.encode('latin1') + b") Tj\n"
        b"0 -24 Td\n(Material Type: " + clean_type.encode('latin1') + b") Tj\n"
        b"0 -24 Td\n(CampusConnect Digital Study Materials Library) Tj\n"
        b"0 -24 Td\n(Exclusively for Authenticated College Students & Staff) Tj\n"
        b"ET\nendstream\nendobj\n"
        b"5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
        b"xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000244 00000 n \n0000000494 00000 n \n"
        b"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n573\n%%EOF\n"
    )
    with open(filepath, 'wb') as f:
        f.write(pdf_bytes)
    return len(pdf_bytes)


def seed_db():
    print("Connecting to the database...")
    with app.app_context():
        # Ensure tables are created
        print("Recreating database tables for clean state...")
        db.drop_all()
        db.create_all()

        # 1. Seed Users (Admin, Staff, Students)
        print("Seeding Users...")
        users_data = [
            {
                'username': 'rifathshifa',
                'email': 'rifathshifa.mr@gmail.com',
                'password': 'shifa@123!',
                'role': 'admin',
                'full_name': 'Administrator',
                'department': 'Computer Science & Engineering',
                'graduation_year': 2026
            },
            {
                'username': 'approved_staff',
                'email': 'approved_staff@campusconnect.edu',
                'password': 'password123',
                'role': 'staff',
                'full_name': 'Prof. Robert Miller (Staff)',
                'department': 'Computer Science & Engineering',
                'graduation_year': None
            },
            {
                'username': 'sarah_j',
                'email': 'sarah.jenkins@campusconnect.edu',
                'password': 'password123',
                'role': 'student',
                'full_name': 'Sarah Jenkins (Senior)',
                'department': 'Computer Science & Engineering',
                'graduation_year': 2027
            },
            {
                'username': 'john_doe',
                'email': 'john.doe@campusconnect.edu',
                'password': 'password123',
                'role': 'student',
                'full_name': 'John Doe (Junior)',
                'department': 'Computer Science & Engineering',
                'graduation_year': 2028
            }
        ]

        users = {}
        for ud in users_data:
            user = User(
                username=ud['username'],
                email=ud['email'],
                role=ud['role'],
                verification_status='approved',
                full_name=ud['full_name'],
                department=ud['department'],
                graduation_year=ud.get('graduation_year')
            )
            user.set_password(ud['password'])
            db.session.add(user)
            users[ud['username']] = user
        db.session.commit()
        print(f"Successfully seeded {len(users_data)} users.")

        # 2. Seed Departments
        print("Seeding College Departments...")
        depts_data = [
            {"code": "CSE", "name": "Computer Science & Engineering"},
            {"code": "IT", "name": "Information Technology"},
            {"code": "ECE", "name": "Electronics & Communication Engineering"},
            {"code": "EEE", "name": "Electrical & Electronics Engineering"},
            {"code": "MECH", "name": "Mechanical Engineering"},
            {"code": "CIVIL", "name": "Civil Engineering"},
            {"code": "AIDS", "name": "Artificial Intelligence & Data Science"}
        ]
        dept_objs = {}
        for d in depts_data:
            dept = Department(code=d['code'], name=d['name'])
            db.session.add(dept)
            dept_objs[d['code']] = dept
        db.session.flush()

        # 3. Seed Subjects
        print("Seeding Academic Subjects...")
        subjects_data = [
            {"code": "CS301", "name": "Data Structures & Algorithms", "dept": "CSE", "sem": "Semester 3"},
            {"code": "CS402", "name": "Database Management Systems", "dept": "CSE", "sem": "Semester 4"},
            {"code": "CS404", "name": "Operating Systems & Kernels", "dept": "CSE", "sem": "Semester 4"},
            {"code": "CS501", "name": "Computer Networks & Protocols", "dept": "CSE", "sem": "Semester 5"},
            {"code": "IT302", "name": "Object-Oriented Programming (Java/C++)", "dept": "IT", "sem": "Semester 3"},
            {"code": "EC401", "name": "Digital Signal Processing", "dept": "ECE", "sem": "Semester 4"},
            {"code": "EC502", "name": "VLSI Design & Embedded Systems", "dept": "ECE", "sem": "Semester 5"},
            {"code": "EE301", "name": "Electric Circuit Theory & Machines", "dept": "EEE", "sem": "Semester 3"},
            {"code": "ME303", "name": "Thermodynamics & Fluid Mechanics", "dept": "MECH", "sem": "Semester 3"},
            {"code": "CE501", "name": "Structural Analysis & Concrete Design", "dept": "CIVIL", "sem": "Semester 5"},
            {"code": "AD601", "name": "Machine Learning & Neural Networks", "dept": "AIDS", "sem": "Semester 6"}
        ]
        for s in subjects_data:
            subj = Subject(
                code=s['code'],
                name=s['name'],
                department_id=dept_objs[s['dept']].id,
                semester=s['sem']
            )
            db.session.add(subj)
        db.session.flush()

        # 4. Seed Study Materials
        print("Seeding Study Materials (Approved & Pending)...")
        upload_folder = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'uploads', 'study_materials')
        os.makedirs(upload_folder, exist_ok=True)

        materials_data = [
            {
                "title": "DBMS Complete Handwritten Lecture Notes (Unit 1 to 5)",
                "description": "Comprehensive notes covering ER Modeling, Relational Algebra, SQL normalization (1NF-BCNF), and Transaction Management.",
                "material_type": "Lecture Notes",
                "department": "Computer Science & Engineering",
                "year": "2nd Year",
                "semester": "Semester 4",
                "subject": "Database Management Systems",
                "uploader": "sarah_j",
                "approval_status": "approved",
                "approved_by": "approved_staff",
                "file_name": "DBMS_Complete_Lecture_Notes.pdf"
            },
            {
                "title": "Data Structures & Algorithms Laboratory Manual & Solutions",
                "description": "Official lab experiments with complete C++ implementations for Stacks, Queues, Binary Trees, Graph BFS/DFS, and Shortest Paths.",
                "material_type": "Lab Manual",
                "department": "Computer Science & Engineering",
                "year": "2nd Year",
                "semester": "Semester 3",
                "subject": "Data Structures & Algorithms",
                "uploader": "sarah_j",
                "approval_status": "approved",
                "approved_by": "approved_staff",
                "file_name": "DSA_Lab_Manual_Full_Code.pdf"
            },
            {
                "title": "Computer Networks Previous 5 Years Solved Question Papers",
                "description": "Solved question papers from 2019-2024 university examinations with marked answer schemes and routing diagram explanations.",
                "material_type": "Previous Year Question Paper",
                "department": "Computer Science & Engineering",
                "year": "3rd Year",
                "semester": "Semester 5",
                "subject": "Computer Networks & Protocols",
                "uploader": "rifathshifa",
                "approval_status": "approved",
                "approved_by": "approved_staff",
                "file_name": "CN_Solved_University_Papers_2019_2024.pdf"
            },
            {
                "title": "Operating Systems Standard Textbook Reference Guide (Silberschatz)",
                "description": "Chapter-wise distilled summaries and problem sets covering CPU scheduling, Deadlocks, Virtual Memory Paging, and RAID.",
                "material_type": "Textbook PDF",
                "department": "Computer Science & Engineering",
                "year": "2nd Year",
                "semester": "Semester 4",
                "subject": "Operating Systems & Kernels",
                "uploader": "sarah_j",
                "approval_status": "approved",
                "approved_by": "approved_staff",
                "file_name": "Operating_Systems_Concepts_Guide.pdf"
            },
            {
                "title": "Digital Signal Processing Filter Design Lab Programs",
                "description": "Tested MATLAB / Octave scripts for Butterworth and Chebyshev IIR and FIR filter design with frequency response plots.",
                "material_type": "Lab Program",
                "department": "Electronics & Communication Engineering",
                "year": "2nd Year",
                "semester": "Semester 4",
                "subject": "Digital Signal Processing",
                "uploader": "sarah_j",
                "approval_status": "approved",
                "approved_by": "approved_staff",
                "file_name": "DSP_MATLAB_Lab_Programs.pdf"
            },
            {
                "title": "Machine Learning End-to-End Cheatsheet & Summary Notes",
                "description": "Quick reference formulas for Supervised, Unsupervised learning, Gradient Descent, Backpropagation, and evaluation metrics.",
                "material_type": "Study Material",
                "department": "Artificial Intelligence & Data Science",
                "year": "3rd Year",
                "semester": "Semester 6",
                "subject": "Machine Learning & Neural Networks",
                "uploader": "rifathshifa",
                "approval_status": "approved",
                "approved_by": "approved_staff",
                "file_name": "ML_Neural_Networks_Quick_Cheatsheet.pdf"
            },
            # Pending uploads for Staff Approval Workflow
            {
                "title": "VLSI Design Verilog HDL Code Snippets & Testbenches",
                "description": "Uploaded by student John Doe for review. Contains Verilog code for 32-bit ALU and Finite State Machines.",
                "material_type": "Lab Program",
                "department": "Electronics & Communication Engineering",
                "year": "3rd Year",
                "semester": "Semester 5",
                "subject": "VLSI Design & Embedded Systems",
                "uploader": "john_doe",
                "approval_status": "pending",
                "approved_by": None,
                "file_name": "VLSI_Verilog_Codes_ALU.pdf"
            },
            {
                "title": "Thermodynamics 2024 Mid-Semester Model Question Paper",
                "description": "Uploaded by student John Doe. Solved numericals on Rankine cycles and heat pump efficiencies.",
                "material_type": "Previous Year Question Paper",
                "department": "Mechanical Engineering",
                "year": "2nd Year",
                "semester": "Semester 3",
                "subject": "Thermodynamics & Fluid Mechanics",
                "uploader": "john_doe",
                "approval_status": "pending",
                "approved_by": None,
                "file_name": "Thermodynamics_Model_Paper_2024.pdf"
            }
        ]

        import uuid
        for m in materials_data:
            unique_storage = f"sample_{uuid.uuid4().hex[:12]}_{m['file_name']}"
            pdf_path = os.path.join(upload_folder, unique_storage)
            size_bytes = create_sample_pdf(pdf_path, m['title'], m['subject'], m['material_type'])

            uploader_user = users[m['uploader']]
            approver_user = users[m['approved_by']] if m['approved_by'] else None

            mat = StudyMaterial(
                title=m['title'],
                description=m['description'],
                material_type=m['material_type'],
                department=m['department'],
                year=m['year'],
                semester=m['semester'],
                subject=m['subject'],
                original_filename=m['file_name'],
                storage_filename=unique_storage,
                file_size=size_bytes,
                mime_type='application/pdf',
                approval_status=m['approval_status'],
                uploader_id=uploader_user.id,
                approved_by_id=approver_user.id if approver_user else None,
                reviewed_at=datetime.utcnow() if approver_user else None,
                created_at=datetime.utcnow() - timedelta(days=2 if m['approval_status'] == 'approved' else 0)
            )
            db.session.add(mat)

        db.session.commit()
        print(f"Successfully seeded {len(materials_data)} study materials.")
        print("Database initialized and ready for production!")


if __name__ == '__main__':
    seed_db()
