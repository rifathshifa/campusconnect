from flask import Blueprint, jsonify, request, send_from_directory, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, User, Department, Subject, StudyMaterial
import os
import uuid
from werkzeug.utils import secure_filename
from datetime import datetime

api_bp = Blueprint('api', __name__)

# Base upload directories
UPLOAD_FOLDER = os.path.join(os.path.abspath(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'uploads')
STUDY_MATERIALS_FOLDER = os.path.join(UPLOAD_FOLDER, 'study_materials')

os.makedirs(STUDY_MATERIALS_FOLDER, exist_ok=True)

DEFAULT_DEPARTMENTS = [
    {"code": "CSE", "name": "Computer Science & Engineering"},
    {"code": "IT", "name": "Information Technology"},
    {"code": "ECE", "name": "Electronics & Communication Engineering"},
    {"code": "EEE", "name": "Electrical & Electronics Engineering"},
    {"code": "MECH", "name": "Mechanical Engineering"},
    {"code": "CIVIL", "name": "Civil Engineering"},
    {"code": "AIDS", "name": "Artificial Intelligence & Data Science"}
]

MATERIAL_TYPES = [
    "Textbook PDF",
    "Lab Manual",
    "Lab Program",
    "Lecture Notes",
    "Previous Year Question Paper",
    "Study Material"
]

SEMESTERS = [
    "Semester 1", "Semester 2", "Semester 3", "Semester 4",
    "Semester 5", "Semester 6", "Semester 7", "Semester 8"
]

YEARS = [
    "1st Year", "2nd Year", "3rd Year", "4th Year"
]


# =====================================================================
# SYSTEM & HEALTH CHECK
# =====================================================================

@api_bp.route('/health', methods=['GET'])
@api_bp.route('/status', methods=['GET'])
def health_check():
    """System health check verifying database and storage connectivity."""
    db_status = 'ok'
    db_type = 'postgresql' if 'postgresql' in current_app.config.get('SQLALCHEMY_DATABASE_URI', '') else 'sqlite'
    try:
        db.session.execute(db.text('SELECT 1'))
    except Exception as e:
        db_status = f'error: {str(e)}'

    storage_writable = os.access(STUDY_MATERIALS_FOLDER, os.W_OK)

    return jsonify({
        'status': 'healthy' if db_status == 'ok' else 'degraded',
        'database': {
            'status': db_status,
            'type': db_type
        },
        'storage': {
            'accessible': storage_writable,
            'path': STUDY_MATERIALS_FOLDER
        },
        'timestamp': datetime.utcnow().isoformat()
    }), 200 if db_status == 'ok' else 503


# =====================================================================
# DASHBOARD ENDPOINT
# =====================================================================

@api_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def dashboard():
    """Essential study materials dashboard metrics for authenticated user."""
    current_user_id = get_jwt_identity()
    user = db.session.get(User, int(current_user_id))
    if not user:
        return jsonify({'message': 'Unauthorized'}), 401

    is_staff = user.role in ['staff', 'admin']

    # Total approved materials across the college
    approved_count = StudyMaterial.query.filter_by(approval_status='approved').count()

    # User's own uploads
    my_uploads = StudyMaterial.query.filter_by(uploader_id=user.id).order_by(StudyMaterial.created_at.desc()).limit(10).all()
    my_uploads_count = StudyMaterial.query.filter_by(uploader_id=user.id).count()
    my_approved_count = StudyMaterial.query.filter_by(uploader_id=user.id, approval_status='approved').count()
    my_pending_count = StudyMaterial.query.filter_by(uploader_id=user.id, approval_status='pending').count()

    # Recent approved materials
    recent_approved = StudyMaterial.query.filter_by(approval_status='approved').order_by(StudyMaterial.created_at.desc()).limit(6).all()

    # Staff-specific data
    pending_materials = []
    pending_count = 0
    if is_staff:
        pending_items = StudyMaterial.query.filter_by(approval_status='pending').order_by(StudyMaterial.created_at.desc()).all()
        pending_count = len(pending_items)
        pending_materials = [m.to_dict() for m in pending_items[:10]]

    return jsonify({
        'user': user.to_dict(),
        'counts': {
            'approved_materials': approved_count,
            'my_uploads': my_uploads_count,
            'my_approved': my_approved_count,
            'my_pending': my_pending_count,
            'pending_review': pending_count
        },
        'my_recent_uploads': [m.to_dict() for m in my_uploads],
        'recent_materials': [m.to_dict() for m in recent_approved],
        'pending_approvals': pending_materials
    }), 200


# =====================================================================
# USER PROFILE ENDPOINT
# =====================================================================

@api_bp.route('/user/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update essential profile information (name, department, graduation year)."""
    current_user_id = get_jwt_identity()
    user = db.session.get(User, int(current_user_id))
    if not user:
        return jsonify({'message': 'Unauthorized'}), 401

    data = request.get_json() or {}
    full_name = data.get('full_name')
    department = data.get('department') or data.get('major')
    graduation_year = data.get('graduation_year')

    if full_name:
        user.full_name = full_name.strip()
    if department:
        user.department = department.strip()
    if graduation_year:
        try:
            user.graduation_year = int(graduation_year)
        except ValueError:
            return jsonify({'message': 'Graduation year must be a valid integer.'}), 400

    try:
        db.session.commit()
        return jsonify({
            'message': 'Profile updated successfully.',
            'user': user.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error updating profile', 'details': str(e)}), 500


# =====================================================================
# COLLEGE STUDY MATERIALS LIBRARY ENDPOINTS
# =====================================================================

@api_bp.route('/study-materials/meta', methods=['GET'])
@jwt_required()
def get_study_materials_meta():
    """Return academic metadata: departments, semesters, years, material types, and existing subjects."""
    current_user_id = get_jwt_identity()
    user = db.session.get(User, int(current_user_id))
    if not user:
        return jsonify({'message': 'Unauthorized'}), 401

    try:
        db_depts = Department.query.order_by(Department.name.asc()).all()
        departments = [d.to_dict() for d in db_depts] if db_depts else DEFAULT_DEPARTMENTS

        subjects = []
        db_subjects = Subject.query.order_by(Subject.name.asc()).all()
        for s in db_subjects:
            subjects.append({
                'name': s.name,
                'code': s.code,
                'department': s.department.name if s.department else None,
                'semester': s.semester
            })

        # Distinct subjects from study_materials
        existing_subjs = db.session.query(StudyMaterial.subject, StudyMaterial.department, StudyMaterial.semester).distinct().all()
        existing_names = {s['name'].lower() for s in subjects}
        for sub, dept, sem in existing_subjs:
            if sub and sub.strip().lower() not in existing_names:
                subjects.append({
                    'name': sub.strip(),
                    'code': '',
                    'department': dept,
                    'semester': sem
                })
                existing_names.add(sub.strip().lower())

        return jsonify({
            'departments': departments,
            'subjects': subjects,
            'semesters': SEMESTERS,
            'years': YEARS,
            'material_types': MATERIAL_TYPES
        }), 200
    except Exception as e:
        return jsonify({'message': 'Error retrieving metadata', 'details': str(e)}), 500


@api_bp.route('/study-materials', methods=['GET'])
@jwt_required()
def get_study_materials():
    """
    List study materials with academic filtering and role-based access control.
    - Non-staff/students can ONLY see approved materials in 'browse', or their own in 'my_uploads'.
    - Staff/admins can see all materials, filter by pending/approved/rejected, and approve/reject.
    """
    current_user_id = get_jwt_identity()
    user = db.session.get(User, int(current_user_id))
    if not user:
        return jsonify({'message': 'Unauthorized'}), 401

    tab = request.args.get('tab', 'browse')
    department = request.args.get('department')
    year = request.args.get('year')
    semester = request.args.get('semester')
    subject = request.args.get('subject')
    material_type = request.args.get('material_type')
    search = request.args.get('search')
    status_filter = request.args.get('status')

    query = StudyMaterial.query

    if tab == 'my_uploads':
        # Student's own uploads (can see their own pending, approved, and rejected materials)
        query = query.filter(StudyMaterial.uploader_id == user.id)
        if status_filter and status_filter != 'All':
            query = query.filter(StudyMaterial.approval_status == status_filter)
    elif tab == 'pending':
        # Staff approval dashboard: only authorized staff or admin
        if user.role not in ['staff', 'admin']:
            return jsonify({'message': 'Access denied. Only authorized staff can view pending approvals.'}), 403
        query = query.filter(StudyMaterial.approval_status == 'pending')
    else:
        # 'browse' tab
        # STRICT RULE: Non-staff/admin students can ONLY view approved study materials!
        if user.role not in ['staff', 'admin']:
            query = query.filter(StudyMaterial.approval_status == 'approved')
        else:
            if status_filter and status_filter != 'All':
                query = query.filter(StudyMaterial.approval_status == status_filter)
            elif not status_filter:
                query = query.filter(StudyMaterial.approval_status == 'approved')

    # Apply academic filters
    if department and department != 'All':
        query = query.filter(StudyMaterial.department == department)
    if year and year != 'All':
        query = query.filter(StudyMaterial.year == year)
    if semester and semester != 'All':
        query = query.filter(StudyMaterial.semester == semester)
    if material_type and material_type != 'All':
        query = query.filter(StudyMaterial.material_type == material_type)
    if subject and subject != 'All':
        query = query.filter(StudyMaterial.subject.ilike(f"%{subject.strip()}%"))

    # Search filter (title, subject, description, department)
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            (StudyMaterial.title.ilike(term)) |
            (StudyMaterial.subject.ilike(term)) |
            (StudyMaterial.description.ilike(term)) |
            (StudyMaterial.department.ilike(term))
        )

    materials = query.order_by(StudyMaterial.created_at.desc()).all()

    # Counts for quick tabs
    approved_count = StudyMaterial.query.filter_by(approval_status='approved').count()
    my_uploads_count = StudyMaterial.query.filter_by(uploader_id=user.id).count()
    pending_count = StudyMaterial.query.filter_by(approval_status='pending').count() if user.role in ['staff', 'admin'] else 0

    return jsonify({
        'materials': [m.to_dict() for m in materials],
        'counts': {
            'approved': approved_count,
            'my_uploads': my_uploads_count,
            'pending': pending_count
        }
    }), 200


@api_bp.route('/study-materials/upload', methods=['POST'])
@jwt_required()
def upload_study_material():
    """
    Upload study material for the college library.
    Every upload requires staff approval before students can access it.
    Validates PDF format, file size, and all required academic fields.
    """
    current_user_id = get_jwt_identity()
    user = db.session.get(User, int(current_user_id))
    if not user:
        return jsonify({'message': 'Unauthorized'}), 401

    if 'file' not in request.files:
        return jsonify({'message': 'PDF file is required.'}), 400

    file = request.files['file']
    if not file or file.filename == '':
        return jsonify({'message': 'No file was selected.'}), 400

    title = request.form.get('title', '').strip()
    subject = request.form.get('subject', '').strip()
    semester = request.form.get('semester', '').strip()
    material_type = request.form.get('material_type', '').strip()
    department = request.form.get('department', '').strip()
    year = request.form.get('year', '').strip()
    description = request.form.get('description', '').strip()

    # Required field validations
    if not title:
        return jsonify({'message': 'Title is required.'}), 400
    if not subject:
        return jsonify({'message': 'Subject is required.'}), 400
    if not semester:
        return jsonify({'message': 'Semester is required.'}), 400
    if not material_type:
        return jsonify({'message': 'Material type is required.'}), 400
    if not department:
        return jsonify({'message': 'Department is required.'}), 400
    if not year:
        return jsonify({'message': 'Year is required.'}), 400

    if material_type not in MATERIAL_TYPES:
        return jsonify({'message': f'Invalid material type. Allowed: {", ".join(MATERIAL_TYPES)}'}), 400

    # Validate PDF extension
    original_filename = file.filename
    ext = original_filename.rsplit('.', 1)[-1].lower() if '.' in original_filename else ''
    if ext != 'pdf':
        return jsonify({'message': 'Invalid file format. Only PDF files (.pdf) are accepted.'}), 400

    # Inspect PDF magic bytes (%PDF)
    header = file.stream.read(5)
    file.stream.seek(0)
    if not header.startswith(b'%PDF'):
        return jsonify({'message': 'Corrupted or invalid PDF file. File content does not match PDF signature.'}), 400

    # Validate file size (max 50 MB)
    MAX_FILE_SIZE = 50 * 1024 * 1024
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.stream.seek(0)

    if file_size <= 0:
        return jsonify({'message': 'The uploaded file is empty.'}), 400
    if file_size > MAX_FILE_SIZE:
        return jsonify({'message': f'File exceeds the 50MB size limit ({file_size / (1024*1024):.1f}MB).'}), 400

    try:
        unique_id = uuid.uuid4().hex
        storage_filename = f"{unique_id}_{secure_filename(original_filename)}"
        file_path = os.path.join(STUDY_MATERIALS_FOLDER, storage_filename)
        file.save(file_path)

        # STRICT INSTRUCTION: Student uploads must NEVER become publicly available immediately.
        # Every uploaded document must have Pending Approval status.
        # Students must not have permission to approve their own uploads.
        approval_status = 'pending'

        new_material = StudyMaterial(
            title=title,
            description=description,
            material_type=material_type,
            department=department,
            year=year,
            semester=semester,
            subject=subject,
            original_filename=original_filename,
            storage_filename=storage_filename,
            file_size=file_size,
            mime_type='application/pdf',
            approval_status=approval_status,
            uploader_id=user.id
        )

        db.session.add(new_material)
        db.session.commit()

        return jsonify({
            'message': 'Study material uploaded successfully. It is pending staff approval before becoming available to other students.',
            'material': new_material.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error saving study material', 'details': str(e)}), 500


@api_bp.route('/study-materials/pending', methods=['GET'])
@jwt_required()
def get_pending_study_materials():
    """Retrieve all pending study materials for staff review."""
    current_user_id = get_jwt_identity()
    user = db.session.get(User, int(current_user_id))
    if not user or user.role not in ['staff', 'admin']:
        return jsonify({'message': 'Access denied. Only authorized staff accounts can view pending approvals.'}), 403

    pending_materials = StudyMaterial.query.filter_by(approval_status='pending').order_by(StudyMaterial.created_at.desc()).all()
    return jsonify({
        'materials': [m.to_dict() for m in pending_materials]
    }), 200


@api_bp.route('/study-materials/<int:id>/approve', methods=['POST'])
@jwt_required()
def approve_study_material(id):
    """Staff approves an uploaded study material."""
    current_user_id = get_jwt_identity()
    user = db.session.get(User, int(current_user_id))
    if not user or user.role not in ['staff', 'admin']:
        return jsonify({'message': 'Access denied. Only authorized staff accounts can approve study materials.'}), 403

    material = db.session.get(StudyMaterial, int(id))
    if not material:
        return jsonify({'message': 'Study material not found.'}), 404

    try:
        material.approval_status = 'approved'
        material.approved_by_id = user.id
        material.reviewed_at = datetime.utcnow()
        material.rejection_reason = None
        db.session.commit()

        return jsonify({
            'message': f'"{material.title}" has been approved and published to the College Library.',
            'material': material.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Database error while approving', 'details': str(e)}), 500


@api_bp.route('/study-materials/<int:id>/reject', methods=['POST'])
@jwt_required()
def reject_study_material(id):
    """Staff rejects an uploaded study material with reason."""
    current_user_id = get_jwt_identity()
    user = db.session.get(User, int(current_user_id))
    if not user or user.role not in ['staff', 'admin']:
        return jsonify({'message': 'Access denied. Only authorized staff accounts can reject study materials.'}), 403

    material = db.session.get(StudyMaterial, int(id))
    if not material:
        return jsonify({'message': 'Study material not found.'}), 404

    data = request.get_json() or {}
    reason = data.get('reason', '').strip()
    if not reason:
        reason = 'Does not meet college study material criteria or quality standards.'

    try:
        material.approval_status = 'rejected'
        material.approved_by_id = user.id
        material.reviewed_at = datetime.utcnow()
        material.rejection_reason = reason
        db.session.commit()

        return jsonify({
            'message': f'"{material.title}" has been rejected.',
            'material': material.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Database error while rejecting', 'details': str(e)}), 500


@api_bp.route('/study-materials/<int:id>/preview', methods=['GET'])
@jwt_required()
def preview_study_material(id):
    """Preview study material PDF inline (in-browser / modal)."""
    current_user_id = get_jwt_identity()
    user = db.session.get(User, int(current_user_id))
    if not user:
        return jsonify({'message': 'Unauthorized'}), 401

    material = db.session.get(StudyMaterial, int(id))
    if not material:
        return jsonify({'message': 'Study material not found.'}), 404

    # Security check:
    # If not approved, only staff/admin or the uploader can preview.
    if material.approval_status != 'approved':
        if user.role not in ['staff', 'admin'] and material.uploader_id != user.id:
            return jsonify({'message': 'Access denied. Document is pending staff approval.'}), 403

    try:
        return send_from_directory(
            directory=STUDY_MATERIALS_FOLDER,
            path=material.storage_filename,
            as_attachment=False,
            mimetype='application/pdf'
        )
    except Exception as e:
        return jsonify({'message': 'Error loading PDF preview', 'details': str(e)}), 500


@api_bp.route('/study-materials/<int:id>/download', methods=['GET'])
@jwt_required()
def download_study_material(id):
    """
    Download approved PDF file.
    STRICT RULE: Only approved materials should be visible and downloadable by students.
    """
    current_user_id = get_jwt_identity()
    user = db.session.get(User, int(current_user_id))
    if not user:
        return jsonify({'message': 'Unauthorized'}), 401

    material = db.session.get(StudyMaterial, int(id))
    if not material:
        return jsonify({'message': 'Study material not found.'}), 404

    # Non-staff/admin students can ONLY download approved files (or their own upload)
    if material.approval_status != 'approved':
        if user.role not in ['staff', 'admin'] and material.uploader_id != user.id:
            return jsonify({'message': 'Access denied. Only approved materials can be downloaded.'}), 403

    try:
        dl_name = material.original_filename
        if not dl_name.lower().endswith('.pdf'):
            dl_name += '.pdf'

        return send_from_directory(
            directory=STUDY_MATERIALS_FOLDER,
            path=material.storage_filename,
            as_attachment=True,
            download_name=dl_name,
            mimetype='application/pdf'
        )
    except Exception as e:
        return jsonify({'message': 'Error sending file', 'details': str(e)}), 500


@api_bp.route('/study-materials/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_study_material(id):
    """Delete a study material (uploader if pending/rejected, or staff/admin)."""
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    if not user:
        return jsonify({'message': 'Unauthorized'}), 401

    material = db.session.get(StudyMaterial, int(id))
    if not material:
        return jsonify({'message': 'Study material not found.'}), 404

    # Permissions
    if user.role not in ['staff', 'admin'] and material.uploader_id != user.id:
        return jsonify({'message': 'Access denied.'}), 403

    try:
        file_path = os.path.join(STUDY_MATERIALS_FOLDER, material.storage_filename)
        if os.path.exists(file_path):
            os.remove(file_path)

        db.session.delete(material)
        db.session.commit()
        return jsonify({'message': 'Study material deleted successfully.'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error deleting study material', 'details': str(e)}), 500
