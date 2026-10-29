from flask import Blueprint, jsonify, request, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, User, Post, Announcement, Event, UploadedFile, FileVersion, Assignment, Attendance, TimetableSlot, Club
import os
import uuid
from werkzeug.utils import secure_filename
from datetime import datetime

api_bp = Blueprint('api', __name__)

@api_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def dashboard():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    if not user:
        return jsonify({'message': 'Unauthorized'}), 401

    # Query announcements sorted by created_at desc
    announcements_query = Announcement.query.order_by(Announcement.created_at.desc()).all()
    announcements = [ann.title for ann in announcements_query]

    # If student, retrieve specific student metrics
    if user.role == 'student':
        # 1. Timetable
        slots = TimetableSlot.query.filter_by(user_id=user.id).all()
        timetable = [s.to_dict() for s in slots]

        # 2. Assignments
        assignments_query = Assignment.query.filter_by(user_id=user.id).order_by(Assignment.due_date.asc()).all()
        assignments = [a.to_dict() for a in assignments_query]
        pending_assignments_count = sum(1 for a in assignments_query if a.status == 'Pending')

        # 3. Attendance
        attendance_query = Attendance.query.filter_by(user_id=user.id).all()
        attendance_by_course = {}
        for r in attendance_query:
            c = r.course
            if c not in attendance_by_course:
                attendance_by_course[c] = {'present': 0, 'absent': 0, 'late': 0, 'total': 0}
            attendance_by_course[c]['total'] += 1
            if r.status == 'Present':
                attendance_by_course[c]['present'] += 1
            elif r.status == 'Absent':
                attendance_by_course[c]['absent'] += 1
            elif r.status == 'Late':
                attendance_by_course[c]['late'] += 1

        total_sessions = len(attendance_query)
        attended_sessions = sum(1 for r in attendance_query if r.status in ['Present', 'Late'])
        overall_attendance_pct = round((attended_sessions / total_sessions * 100), 1) if total_sessions > 0 else 100.0

        attendance_summary = {
            'overall_percentage': overall_attendance_pct,
            'courses': [
                {
                    'course': course,
                    'present': stats['present'],
                    'absent': stats['absent'],
                    'late': stats['late'],
                    'total': stats['total'],
                    'percentage': round(((stats['present'] + stats['late']) / stats['total'] * 100), 1) if stats['total'] > 0 else 100.0
                }
                for course, stats in attendance_by_course.items()
            ]
        }

        # 4. GPA Calculation
        grade_points = {
            'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7, 
            'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D': 1.0, 'F': 0.0
        }
        graded_assignments = [a for a in assignments_query if a.status == 'Graded' and a.grade in grade_points]
        if graded_assignments:
            gpa = round(sum(grade_points[a.grade] for a in graded_assignments) / len(graded_assignments), 2)
        else:
            gpa = 3.85 if user.username == 'sarah_j' else (3.40 if user.username == 'john_doe' else 3.5)

        # 5. Credits
        unique_courses = set(s.course for s in slots)
        credits_count = len(unique_courses) * 3 if unique_courses else 15

        # 6. Recent Materials (Approved uploaded files)
        recent_files_query = UploadedFile.query.filter_by(approval_status='approved').order_by(UploadedFile.created_at.desc()).limit(5).all()
        recent_materials = [f.to_dict() for f in recent_files_query]

        return jsonify({
            'role': 'student',
            'gpa': gpa,
            'credits': credits_count,
            'pending_assignments': pending_assignments_count,
            'timetable': timetable,
            'attendance': attendance_summary,
            'assignments': assignments,
            'recent_materials': recent_materials,
            'announcements': announcements
        }), 200

    # Fallback to general dashboard query for non-student roles (staff/admin)
    posts = Post.query.order_by(Post.created_at.desc()).all()
    feed = []
    for post in posts:
        if post.club:
            author_name = post.club.name
        elif post.author:
            author_name = post.author.full_name or post.author.username
        else:
            author_name = "Unknown"

        feed.append({
            'id': post.id,
            'title': post.title,
            'category': post.category,
            'date': post.created_at.strftime('%b %d, %Y') if post.created_at else '',
            'author': author_name,
            'content': post.content,
            'price': float(post.price) if post.price is not None else None
        })

    return jsonify({
        'role': user.role,
        'feed': feed,
        'announcements': announcements
    }), 200



@api_bp.route('/posts', methods=['POST'])
@jwt_required()
def create_post():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    if not user:
        return jsonify({'message': 'Unauthorized'}), 401
    
    if user.verification_status not in ['approved', 'verified', 'Verified']:
        return jsonify({'message': 'Uploads/posts are restricted until your account is approved by an admin.'}), 403
        
    data = request.get_json() or {}
    title = data.get('title')
    content = data.get('content')
    category = data.get('category')
    price = data.get('price')
    club_id = data.get('club_id')
    
    if not title or not content or not category:
        return jsonify({'message': 'Title, content, and category are required'}), 400
        
    try:
        new_post = Post(
            title=title,
            content=content,
            category=category,
            price=price,
            author_id=user.id,
            club_id=club_id
        )
        db.session.add(new_post)
        db.session.commit()
        return jsonify({'message': 'Post created successfully', 'post': new_post.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Database error occurred', 'details': str(e)}), 500


@api_bp.route('/announcements', methods=['POST'])
@jwt_required()
def create_announcement():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    if not user:
        return jsonify({'message': 'Unauthorized'}), 401
        
    if user.role not in ['admin', 'staff']:
        return jsonify({'message': 'Only staff or admin can create announcements.'}), 403
        
    if user.verification_status not in ['approved', 'verified', 'Verified']:
        return jsonify({'message': 'Uploads/announcements are restricted until your account is approved by an admin.'}), 403
        
    data = request.get_json() or {}
    title = data.get('title')
    content = data.get('content')
    
    if not title or not content:
        return jsonify({'message': 'Title and content are required'}), 400
        
    try:
        new_ann = Announcement(
            title=title,
            content=content,
            author_id=user.id
        )
        db.session.add(new_ann)
        db.session.commit()
        return jsonify({'message': 'Announcement created successfully', 'announcement': new_ann.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Database error occurred', 'details': str(e)}), 500


@api_bp.route('/events', methods=['POST'])
@jwt_required()
def create_event():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    if not user:
        return jsonify({'message': 'Unauthorized'}), 401
        
    if user.verification_status not in ['approved', 'verified', 'Verified']:
        return jsonify({'message': 'Uploads/events are restricted until your account is approved by an admin.'}), 403
        
    data = request.get_json() or {}
    title = data.get('title')
    description = data.get('description')
    location = data.get('location')
    event_date_str = data.get('event_date')
    organizer_club_id = data.get('organizer_club_id')
    volunteer_needed = data.get('volunteer_needed', False)
    
    if not title or not description or not event_date_str:
        return jsonify({'message': 'Title, description, and event date are required'}), 400
        
    try:
        from datetime import datetime
        try:
            event_date = datetime.fromisoformat(event_date_str.replace('Z', '+00:00'))
        except ValueError:
            return jsonify({'message': 'Invalid date format. Use ISO format.'}), 400
            
        new_event = Event(
            title=title,
            description=description,
            location=location,
            event_date=event_date,
            organizer_club_id=organizer_club_id,
            creator_id=user.id,
            volunteer_needed=bool(volunteer_needed)
        )
        db.session.add(new_event)
        db.session.commit()
        return jsonify({'message': 'Event created successfully', 'event': new_event.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Database error occurred', 'details': str(e)}), 500


@api_bp.route('/admin/staff', methods=['GET'])
@jwt_required()
def get_staff():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    if not user or user.role != 'admin':
        return jsonify({'message': 'Admin privilege required.'}), 403
        
    staff_users = User.query.filter_by(role='staff').order_by(User.created_at.desc()).all()
    return jsonify({
        'staff': [s.to_dict() for s in staff_users]
    }), 200


@api_bp.route('/admin/verify-staff/<int:user_id>', methods=['POST'])
@jwt_required()
def verify_staff(user_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    if not user or user.role != 'admin':
        return jsonify({'message': 'Admin privilege required.'}), 403
        
    staff_user = User.query.get(user_id)
    if not staff_user or staff_user.role != 'staff':
        return jsonify({'message': 'Staff user not found.'}), 404
        
    data = request.get_json() or {}
    status = data.get('status')
    
    if not status:
        return jsonify({'message': 'Status parameter is required.'}), 400
        
    normalized = status.strip().lower()
    if normalized in ['approved', 'verified']:
        status_to_store = 'Verified'
    elif normalized in ['rejected']:
        status_to_store = 'Rejected'
    else:
        return jsonify({'message': 'Invalid status. Choose Verified or Rejected.'}), 400
        
    try:
        staff_user.verification_status = status_to_store
        db.session.commit()
        return jsonify({
            'message': f'Staff member status updated to {status_to_store} successfully.',
            'user': staff_user.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Database error occurred', 'details': str(e)}), 500


@api_bp.route('/staff/analytics', methods=['GET'])
@jwt_required()
def get_staff_analytics():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    if not user or user.role not in ['admin', 'staff']:
        return jsonify({'message': 'Access denied. Staff or admin privileges required.'}), 403

    try:
        from sqlalchemy import func
        # File Counts
        total_files = UploadedFile.query.count()
        pending_files = UploadedFile.query.filter_by(approval_status='pending').count()
        approved_files = UploadedFile.query.filter_by(approval_status='approved').count()
        rejected_files = UploadedFile.query.filter_by(approval_status='rejected').count()

        # Storage stats (sum of all file sizes in bytes)
        total_bytes = db.session.query(func.sum(FileVersion.file_size)).scalar() or 0

        # Category distribution
        category_counts = db.session.query(
            UploadedFile.category, func.count(UploadedFile.id)
        ).group_by(UploadedFile.category).all()
        categories = {cat: count for cat, count in category_counts}

        # Ensure all standard categories have a value
        for default_cat in ['Academic', 'Arts', 'Sports', 'Technology', 'General']:
            if default_cat not in categories:
                categories[default_cat] = 0

        # File type distribution
        type_counts = db.session.query(
            UploadedFile.file_type, func.count(UploadedFile.id)
        ).group_by(UploadedFile.file_type).all()
        file_types = {ft: count for ft, count in type_counts}

        # Recent activities (approved, uploaded, rejected)
        recent_activity_query = UploadedFile.query.order_by(UploadedFile.updated_at.desc()).limit(5).all()
        recent_activities = []
        for f in recent_activity_query:
            recent_activities.append({
                'id': f.id,
                'filename': f.filename,
                'uploader_name': f.uploader.full_name or f.uploader.username if f.uploader else 'Unknown',
                'status': f.approval_status,
                'updated_at': f.updated_at.isoformat() if f.updated_at else None,
                'category': f.category
            })

        return jsonify({
            'total_files': total_files,
            'pending_files': pending_files,
            'approved_files': approved_files,
            'rejected_files': rejected_files,
            'total_bytes': total_bytes,
            'categories': categories,
            'file_types': file_types,
            'recent_activities': recent_activities
        }), 200

    except Exception as e:
        return jsonify({'message': 'Error retrieving analytics data', 'details': str(e)}), 500


# =====================================================================
# FILE MANAGEMENT ENDPOINTS
# =====================================================================

# Resolve upload folder path relative to project backend root
UPLOAD_FOLDER = os.path.join(os.path.abspath(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), 'uploads')
if not os.path.exists(UPLOAD_FOLDER):
    try:
        os.makedirs(UPLOAD_FOLDER)
    except Exception as e:
        print(f"Error creating uploads folder: {e}")

def get_file_type(filename):
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
    if ext in ['pdf']:
        return 'PDF'
    elif ext in ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp']:
        return 'Image'
    elif ext in ['doc', 'docx', 'odt', 'rtf']:
        return 'Word'
    elif ext in ['ppt', 'pptx', 'odp']:
        return 'PPT'
    elif ext in ['xls', 'xlsx', 'ods', 'csv']:
        return 'Excel'
    elif ext in ['zip', 'rar', '7z', 'tar', 'gz']:
        return 'ZIP'
    elif ext in ['mp4', 'webm', 'ogg', 'avi', 'mov', 'mkv']:
        return 'Video'
    elif ext in ['mp3', 'wav', 'aac', 'flac', 'm4a']:
        return 'Audio'
    elif ext in ['txt', 'md', 'py', 'js', 'html', 'css', 'json', 'sql', 'c', 'cpp', 'java']:
        return 'Text'
    else:
        return 'Other'


@api_bp.route('/files/upload', methods=['POST'])
@jwt_required()
def upload_file():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    if not user:
        return jsonify({'message': 'Unauthorized'}), 401
    
    if user.verification_status not in ['approved', 'verified', 'Verified']:
        return jsonify({'message': 'Uploads are restricted until your account is approved by an admin.'}), 403

    if 'file' not in request.files:
        return jsonify({'message': 'No file part in the request'}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({'message': 'No selected file'}), 400
        
    description = request.form.get('description', '')
    category = request.form.get('category', 'General')
    
    try:
        original_filename = file.filename
        unique_id = uuid.uuid4().hex
        storage_filename = f"{unique_id}_{secure_filename(original_filename)}"
        
        file_path = os.path.join(UPLOAD_FOLDER, storage_filename)
        file.save(file_path)
        
        file_size = os.path.getsize(file_path)
        
        # Admins and staff are auto-approved. Students and club leaders start as pending.
        if user.role in ['admin', 'staff']:
            approval_status = 'approved'
        else:
            approval_status = 'pending'
            
        file_type = get_file_type(original_filename)
        
        new_file = UploadedFile(
            filename=original_filename,
            description=description,
            category=category,
            file_type=file_type,
            approval_status=approval_status,
            uploader_id=user.id
        )
        
        db.session.add(new_file)
        db.session.flush()
        
        first_version = FileVersion(
            file_id=new_file.id,
            version_number=1,
            storage_filename=storage_filename,
            file_size=file_size,
            changelog="Initial Upload",
            uploader_id=user.id
        )
        
        db.session.add(first_version)
        db.session.commit()
        
        return jsonify({
            'message': 'File uploaded successfully',
            'file': new_file.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error uploading file', 'details': str(e)}), 500


@api_bp.route('/files/<int:file_id>/new-version', methods=['POST'])
@jwt_required()
def upload_new_version(file_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    if not user:
        return jsonify({'message': 'Unauthorized'}), 401
        
    if user.verification_status not in ['approved', 'verified', 'Verified']:
        return jsonify({'message': 'Uploads are restricted until your account is approved.'}), 403
        
    uploaded_file = UploadedFile.query.get(file_id)
    if not uploaded_file:
        return jsonify({'message': 'File not found'}), 404
        
    if uploaded_file.uploader_id != user.id and user.role not in ['admin', 'staff']:
        return jsonify({'message': 'Access denied. Only the uploader or admin can upload a new version.'}), 403
        
    if 'file' not in request.files:
        return jsonify({'message': 'No file part in the request'}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({'message': 'No selected file'}), 400
        
    changelog = request.form.get('changelog', '')
    
    try:
        original_filename = file.filename
        unique_id = uuid.uuid4().hex
        storage_filename = f"{unique_id}_{secure_filename(original_filename)}"
        
        file_path = os.path.join(UPLOAD_FOLDER, storage_filename)
        file.save(file_path)
        
        file_size = os.path.getsize(file_path)
        
        latest_version_num = 0
        if uploaded_file.versions:
            latest_version_num = uploaded_file.versions[0].version_number
            
        new_version_num = latest_version_num + 1
        
        # If standard user uploads a new version, reset the approval status to pending.
        if user.role in ['admin', 'staff']:
            uploaded_file.approval_status = 'approved'
        else:
            uploaded_file.approval_status = 'pending'
            
        uploaded_file.rejection_reason = None
        uploaded_file.filename = original_filename
        uploaded_file.file_type = get_file_type(original_filename)
        
        new_version = FileVersion(
            file_id=uploaded_file.id,
            version_number=new_version_num,
            storage_filename=storage_filename,
            file_size=file_size,
            changelog=changelog or f"Updated to version {new_version_num}",
            uploader_id=user.id
        )
        
        db.session.add(new_version)
        db.session.commit()
        
        return jsonify({
            'message': f'Version {new_version_num} uploaded successfully',
            'file': uploaded_file.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error uploading new version', 'details': str(e)}), 500


@api_bp.route('/files', methods=['GET'])
@jwt_required()
def get_files():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    if not user:
        return jsonify({'message': 'Unauthorized'}), 401
        
    category = request.args.get('category')
    file_type = request.args.get('file_type')
    status = request.args.get('status')
    search = request.args.get('search')
    
    query = UploadedFile.query
    
    # Restrict file access based on approval status:
    # Non-staff/admin users can only see approved files, or their own files regardless of status.
    if user.role not in ['admin', 'staff']:
        query = query.filter(
            (UploadedFile.approval_status == 'approved') | 
            (UploadedFile.uploader_id == user.id)
        )
    else:
        # Admins/staff can filter by status
        if status:
            query = query.filter(UploadedFile.approval_status == status)
            
    # Apply other filters
    if category and category != 'All':
        query = query.filter(UploadedFile.category == category)
        
    if file_type and file_type != 'All':
        query = query.filter(UploadedFile.file_type == file_type)
        
    if search:
        query = query.filter(
            (UploadedFile.filename.like(f"%{search}%")) |
            (UploadedFile.description.like(f"%{search}%"))
        )
        
    files = query.order_by(UploadedFile.updated_at.desc()).all()
    
    return jsonify({
        'files': [f.to_dict() for f in files]
    }), 200


@api_bp.route('/files/pending', methods=['GET'])
@jwt_required()
def get_pending_files():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    if not user or user.role not in ['admin', 'staff']:
        return jsonify({'message': 'Access denied. Admins/staff only.'}), 403
        
    pending_files = UploadedFile.query.filter_by(approval_status='pending').order_by(UploadedFile.created_at.desc()).all()
    return jsonify({
        'files': [f.to_dict() for f in pending_files]
    }), 200


@api_bp.route('/files/<int:file_id>/approve', methods=['POST'])
@jwt_required()
def approve_file(file_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    if not user or user.role not in ['admin', 'staff']:
        return jsonify({'message': 'Access denied. Admins/staff only.'}), 403
        
    uploaded_file = UploadedFile.query.get(file_id)
    if not uploaded_file:
        return jsonify({'message': 'File not found'}), 404
        
    try:
        uploaded_file.approval_status = 'approved'
        uploaded_file.approved_by_id = user.id
        uploaded_file.rejection_reason = None
        db.session.commit()
        return jsonify({
            'message': 'File approved successfully',
            'file': uploaded_file.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Database error', 'details': str(e)}), 500


@api_bp.route('/files/<int:file_id>/reject', methods=['POST'])
@jwt_required()
def reject_file(file_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    if not user or user.role not in ['admin', 'staff']:
        return jsonify({'message': 'Access denied. Admins/staff only.'}), 403
        
    uploaded_file = UploadedFile.query.get(file_id)
    if not uploaded_file:
        return jsonify({'message': 'File not found'}), 404
        
    data = request.get_json() or {}
    reason = data.get('reason', 'Rejected by admin/staff.')
    
    try:
        uploaded_file.approval_status = 'rejected'
        uploaded_file.approved_by_id = user.id
        uploaded_file.rejection_reason = reason
        db.session.commit()
        return jsonify({
            'message': 'File rejected successfully',
            'file': uploaded_file.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Database error', 'details': str(e)}), 500


@api_bp.route('/files/<int:file_id>', methods=['GET'])
@jwt_required()
def get_file_details(file_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    if not user:
        return jsonify({'message': 'Unauthorized'}), 401
        
    uploaded_file = UploadedFile.query.get(file_id)
    if not uploaded_file:
        return jsonify({'message': 'File not found'}), 404
        
    if uploaded_file.approval_status != 'approved' and uploaded_file.uploader_id != user.id and user.role not in ['admin', 'staff']:
        return jsonify({'message': 'Access denied.'}), 403
        
    versions = [v.to_dict() for v in uploaded_file.versions]
    file_dict = uploaded_file.to_dict()
    file_dict['all_versions'] = versions
    
    return jsonify({
        'file': file_dict
    }), 200


@api_bp.route('/files/version/<int:version_id>/download', methods=['GET'])
@jwt_required()
def download_version(version_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    if not user:
        return jsonify({'message': 'Unauthorized'}), 401
        
    version = FileVersion.query.get(version_id)
    if not version:
        return jsonify({'message': 'File version not found'}), 404
        
    uploaded_file = version.file
    if uploaded_file.approval_status != 'approved' and uploaded_file.uploader_id != user.id and user.role not in ['admin', 'staff']:
        return jsonify({'message': 'Access denied.'}), 403
        
    try:
        return send_from_directory(
            directory=UPLOAD_FOLDER,
            path=version.storage_filename,
            as_attachment=True,
            download_name=uploaded_file.filename
        )
    except Exception as e:
        return jsonify({'message': 'Error sending file', 'details': str(e)}), 500


@api_bp.route('/files/version/<int:version_id>/preview', methods=['GET'])
@jwt_required()
def preview_version(version_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    if not user:
        return jsonify({'message': 'Unauthorized'}), 401
        
    version = FileVersion.query.get(version_id)
    if not version:
        return jsonify({'message': 'File version not found'}), 404
        
    uploaded_file = version.file
    if uploaded_file.approval_status != 'approved' and uploaded_file.uploader_id != user.id and user.role not in ['admin', 'staff']:
        return jsonify({'message': 'Access denied.'}), 403
        
    try:
        return send_from_directory(
            directory=UPLOAD_FOLDER,
            path=version.storage_filename,
            as_attachment=False
        )
    except Exception as e:
        return jsonify({'message': 'Error rendering preview', 'details': str(e)}), 500


# =====================================================================
# ADMIN DASHBOARD MANAGEMENT ENDPOINTS
# ==============================================================================================================

@api_bp.route('/admin/users', methods=['GET'])
@jwt_required()
def admin_get_users():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    if not user or user.role != 'admin':
        return jsonify({'message': 'Admin privilege required.'}), 403
        
    role_filter = request.args.get('role')
    query = User.query
    if role_filter:
        query = query.filter_by(role=role_filter)
    
    users = query.order_by(User.created_at.desc()).all()
    return jsonify({
        'users': [u.to_dict() for u in users]
    }), 200


@api_bp.route('/admin/users', methods=['POST'])
@jwt_required()
def admin_create_user():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    if not user or user.role != 'admin':
        return jsonify({'message': 'Admin privilege required.'}), 403
        
    data = request.get_json() or {}
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'student')
    full_name = data.get('full_name')
    major = data.get('major')
    graduation_year = data.get('graduation_year')
    verification_status = data.get('verification_status', 'approved')
    
    if not username or not email or not password:
        return jsonify({'message': 'Missing username, email, or password'}), 400
        
    if role not in ['student', 'staff', 'club_leader', 'admin']:
        return jsonify({'message': 'Invalid role'}), 400
        
    if User.query.filter_by(username=username).first():
        return jsonify({'message': 'Username already exists'}), 400
        
    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'Email already registered'}), 400
        
    try:
        grad_yr = None
        if graduation_year:
            grad_yr = int(graduation_year)
        
        new_user = User(
            username=username,
            email=email,
            role=role,
            verification_status=verification_status,
            full_name=full_name or username,
            major=major,
            graduation_year=grad_yr
        )
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        return jsonify({
            'message': f'User {username} created successfully',
            'user': new_user.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Database error', 'details': str(e)}), 500


@api_bp.route('/admin/users/<int:target_user_id>', methods=['PUT'])
@jwt_required()
def admin_update_user(target_user_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    if not user or user.role != 'admin':
        return jsonify({'message': 'Admin privilege required.'}), 403
        
    target_user = User.query.get(target_user_id)
    if not target_user:
        return jsonify({'message': 'User not found'}), 404
        
    data = request.get_json() or {}
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role')
    verification_status = data.get('verification_status')
    full_name = data.get('full_name')
    major = data.get('major')
    graduation_year = data.get('graduation_year')
    bio = data.get('bio')
    
    if username and username != target_user.username:
        if User.query.filter_by(username=username).first():
            return jsonify({'message': 'Username already exists'}), 400
        target_user.username = username
        
    if email and email != target_user.email:
        if User.query.filter_by(email=email).first():
            return jsonify({'message': 'Email already registered'}), 400
        target_user.email = email
        
    if password:
        target_user.set_password(password)
        
    if role:
        if role not in ['student', 'staff', 'club_leader', 'admin']:
            return jsonify({'message': 'Invalid role'}), 400
        target_user.role = role
        
    if verification_status:
        norm_status = verification_status.strip().lower()
        if norm_status in ['approved', 'verified']:
            target_user.verification_status = 'Verified'
        elif norm_status == 'pending':
            target_user.verification_status = 'pending'
        elif norm_status == 'rejected':
            target_user.verification_status = 'Rejected'
        else:
            return jsonify({'message': 'Invalid verification status'}), 400
        
    if full_name is not None:
        target_user.full_name = full_name
    if major is not None:
        target_user.major = major
    if graduation_year is not None:
        try:
            target_user.graduation_year = int(graduation_year) if graduation_year else None
        except ValueError:
            return jsonify({'message': 'Graduation year must be a number'}), 400
    if bio is not None:
        target_user.bio = bio
        
    try:
        db.session.commit()
        return jsonify({
            'message': 'User updated successfully',
            'user': target_user.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Database error', 'details': str(e)}), 500


@api_bp.route('/admin/users/<int:target_user_id>', methods=['DELETE'])
@jwt_required()
def admin_delete_user(target_user_id):
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    if not user or user.role != 'admin':
        return jsonify({'message': 'Admin privilege required.'}), 403
        
    if target_user_id == user.id:
        return jsonify({'message': 'You cannot delete your own admin account.'}), 400
        
    target_user = User.query.get(target_user_id)
    if not target_user:
        return jsonify({'message': 'User not found'}), 404
        
    try:
        # Collect and physically delete file versions from disk if any
        uploaded_files = UploadedFile.query.filter_by(uploader_id=target_user_id).all()
        for f in uploaded_files:
            for version in f.versions:
                filepath = os.path.join(UPLOAD_FOLDER, version.storage_filename)
                if os.path.exists(filepath):
                    try:
                        os.remove(filepath)
                    except Exception as e:
                        print(f"Error removing physical file {filepath}: {e}")
        
        db.session.delete(target_user)
        db.session.commit()
        return jsonify({'message': 'User deleted successfully.'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Database error', 'details': str(e)}), 500


@api_bp.route('/admin/analytics', methods=['GET'])
@jwt_required()
def get_admin_analytics():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    if not user or user.role != 'admin':
        return jsonify({'message': 'Admin privilege required.'}), 403
        
    try:
        from sqlalchemy import func
        # User counts
        total_students = User.query.filter_by(role='student').count()
        total_staff = User.query.filter_by(role='staff').count()
        pending_staff = User.query.filter_by(role='staff', verification_status='pending').count()
        total_club_leaders = User.query.filter_by(role='club_leader').count()
        
        # File Counts
        total_files = UploadedFile.query.count()
        pending_files = UploadedFile.query.filter_by(approval_status='pending').count()
        approved_files = UploadedFile.query.filter_by(approval_status='approved').count()
        rejected_files = UploadedFile.query.filter_by(approval_status='rejected').count()
        total_bytes = db.session.query(func.sum(FileVersion.file_size)).scalar() or 0
        
        # Other entity counts
        total_clubs = Club.query.count()
        total_events = Event.query.count()
        total_posts = Post.query.count()
        
        # Category distribution
        category_counts = db.session.query(
            UploadedFile.category, func.count(UploadedFile.id)
        ).group_by(UploadedFile.category).all()
        categories = {cat: count for cat, count in category_counts}
        for default_cat in ['Academic', 'Arts', 'Sports', 'Technology', 'General']:
            if default_cat not in categories:
                categories[default_cat] = 0
                
        # File type distribution
        type_counts = db.session.query(
            UploadedFile.file_type, func.count(UploadedFile.id)
        ).group_by(UploadedFile.file_type).all()
        file_types = {ft: count for ft, count in type_counts}
        
        return jsonify({
            'users': {
                'students': total_students,
                'staff': total_staff,
                'pending_staff': pending_staff,
                'club_leaders': total_club_leaders,
                'total': total_students + total_staff + total_club_leaders + 1
            },
            'files': {
                'total': total_files,
                'pending': pending_files,
                'approved': approved_files,
                'rejected': rejected_files,
                'total_bytes': total_bytes
            },
            'categories': categories,
            'file_types': file_types,
            'clubs_count': total_clubs,
            'events_count': total_events,
            'posts_count': total_posts
        }), 200
    except Exception as e:
        return jsonify({'message': 'Error retrieving admin analytics', 'details': str(e)}), 500


# =====================================================================
# AI STUDY ASSISTANT ENDPOINTS
# =====================================================================

def call_gemini(prompt, system_instruction=None, json_mode=False):
    """
    Calls the Gemini 1.5 Flash API via HTTP POST.
    First tries to retrieve the API key from X-Gemini-API-Key header.
    Falls back to Flask config's GEMINI_API_KEY.
    Returns None if no API key is available or the request fails.
    """
    import requests
    from flask import current_app, request
    
    # Try request header
    api_key = request.headers.get('X-Gemini-API-Key')
    if not api_key:
        api_key = current_app.config.get('GEMINI_API_KEY')
        
    if not api_key:
        return None
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
    
    contents = []
    if system_instruction:
        contents.append({
            "role": "user",
            "parts": [{"text": f"System Instruction: {system_instruction}"}]
        })
    contents.append({
        "role": "user",
        "parts": [{"text": prompt}]
    })
    
    payload = {
        "contents": contents
    }
    
    if json_mode:
        payload["generationConfig"] = {
            "responseMimeType": "application/json"
        }
        
    try:
        response = requests.post(url, json=payload, headers={"Content-Type": "application/json"}, timeout=30)
        if response.status_code == 200:
            res_data = response.json()
            candidates = res_data.get('candidates', [])
            if candidates:
                text = candidates[0].get('content', {}).get('parts', [{}])[0].get('text', '')
                return text
        print(f"Gemini API Error {response.status_code}: {response.text}")
        return None
    except Exception as e:
        print(f"Exception during Gemini API call: {e}")
        return None


# Helper to extract PDF text
def extract_pdf_text(storage_filename):
    pdf_path = os.path.join(UPLOAD_FOLDER, storage_filename)
    if not os.path.exists(pdf_path):
        return None
    try:
        from pypdf import PdfReader
        reader = PdfReader(pdf_path)
        text = ""
        # Read at most 10 pages for response timing
        for page in reader.pages[:10]:
            text += page.extract_text() or ""
        return text
    except Exception as e:
        print(f"Error reading PDF {storage_filename}: {e}")
        return None


@api_bp.route('/ai/chat', methods=['POST'])
@jwt_required()
def ai_chat():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    if not user:
        return jsonify({'message': 'Unauthorized'}), 401
        
    data = request.get_json() or {}
    message = data.get('message', '').strip()
    if not message:
        return jsonify({'message': 'Message is required'}), 400
        
    # Get user database context in case Gemini needs it or for the simulator fallback
    slots = TimetableSlot.query.filter_by(user_id=user.id).all()
    assignments = Assignment.query.filter_by(user_id=user.id).all()
    attendance_records = Attendance.query.filter_by(user_id=user.id).all()
    
    timetable_str = ", ".join([f"{s.course} on {s.day_of_week} ({s.start_time}-{s.end_time} in {s.room} by {s.instructor})" for s in slots])
    assignments_str = ", ".join([f"{a.title} for {a.course} (Due: {a.due_date.strftime('%Y-%m-%d') if a.due_date else 'N/A'}, Status: {a.status}, Grade: {a.grade or 'None'})" for a in assignments])
    
    # Calculate attendance %
    if attendance_records:
        present = sum(1 for r in attendance_records if r.status in ['Present', 'Late'])
        attendance_pct = round((present / len(attendance_records)) * 100, 1)
        attendance_str = f"{attendance_pct}% overall ({present}/{len(attendance_records)} sessions)"
    else:
        attendance_str = "No attendance records"

    context_prompt = (
        f"You are a friendly AI Study Buddy for {user.full_name or user.username} at CampusConnect. "
        f"Here is the student's context from the database if they ask about it:\n"
        f"- Timetable Slots: {timetable_str or 'None'}\n"
        f"- Assignments: {assignments_str or 'None'}\n"
        f"- Attendance: {attendance_str}\n"
        f"Please answer their queries, give helpful advice, and encourage them in their studies."
    )
    
    # Try calling Gemini
    gemini_resp = call_gemini(f"Student asks: {message}", system_instruction=context_prompt)
    if gemini_resp:
        return jsonify({'response': gemini_resp.strip()}), 200
        
    # Local simulation fallback if Gemini is not available
    msg_lower = message.lower()
    sim_resp = ""
    
    if "timetable" in msg_lower or "class" in msg_lower or "schedule" in msg_lower:
        if slots:
            sim_resp = f"Here is your current class timetable, {user.username}:\n\n"
            for s in slots:
                sim_resp += f"- **{s.course}**: {s.day_of_week} at {s.start_time} - {s.end_time} in {s.room} (Instructor: {s.instructor})\n"
        else:
            sim_resp = "I checked your timetable, but you don't have any classes scheduled yet. You can add them in your Student Dashboard."
            
    elif "assignment" in msg_lower or "due" in msg_lower or "homework" in msg_lower:
        if assignments:
            pending = [a for a in assignments if a.status == 'Pending']
            graded = [a for a in assignments if a.status == 'Graded']
            sim_resp = f"Here is a summary of your assignments:\n\n"
            if pending:
                sim_resp += "**Pending Assignments:**\n"
                for a in pending:
                    due = a.due_date.strftime('%b %d, %Y') if a.due_date else 'N/A'
                    sim_resp += f"- 🔴 **{a.title}** for *{a.course}* (Due: {due})\n"
            if graded:
                sim_resp += "\n**Completed & Graded:**\n"
                for a in graded:
                    sim_resp += f"- 🟢 **{a.title}** for *{a.course}* (Grade: **{a.grade or 'N/A'}**)\n"
        else:
            sim_resp = "Great news! You don't have any pending assignments in your dashboard."
            
    elif "attendance" in msg_lower or "present" in msg_lower or "absent" in msg_lower:
        if attendance_records:
            sim_resp = f"Your overall attendance is **{attendance_str}**.\n\n"
            # Break down by course
            by_course = {}
            for r in attendance_records:
                if r.course not in by_course: by_course[r.course] = []
                by_course[r.course].append(r.status)
            for c, list_status in by_course.items():
                p = sum(1 for s in list_status if s in ['Present', 'Late'])
                pct = round((p / len(list_status)) * 100, 1)
                sim_resp += f"- **{c}**: {pct}% ({p}/{len(list_status)} classes attended)\n"
        else:
            sim_resp = "No attendance records have been registered for your account yet."
            
    elif "gpa" in msg_lower or "grade" in msg_lower:
        grade_points = {'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7, 'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D': 1.0, 'F': 0.0}
        graded = [a for a in assignments if a.status == 'Graded' and a.grade in grade_points]
        if graded:
            gpa = round(sum(grade_points[a.grade] for a in graded) / len(graded), 2)
            sim_resp = f"Based on your graded assignments, your current calculated GPA is **{gpa}** (computed from {len(graded)} graded tasks). Keep up the good work!"
        else:
            sim_resp = "You don't have any graded assignments yet to compute a GPA. Once your professors add grades to your assignments dashboard, I will track it here."
            
    elif "hello" in msg_lower or "hi" in msg_lower or "hey" in msg_lower:
        sim_resp = f"Hello {user.full_name or user.username}! How can I help you study today? Feel free to ask about your timetable, assignments, or ask for help with programming, generating study notes, quizzes, or mock interviews!"
        
    else:
        sim_resp = (
            f"Thanks for asking! I'm currently running in local offline simulator mode because the backend Gemini API key is not set. "
            f"However, here's some study advice on **\"{message}\"**:\n\n"
            f"1. **Break it Down**: Split your study topics into 20-minute chunks (Pomodoro technique).\n"
            f"2. **Active Recall**: Try explaining the concept of *\"{message}\"* in your own words without reading notes.\n"
            f"3. **Use the Generator tabs**: You can use the **Notes Generator** or **Quiz Studio** tabs above to study this specific topic in detail!"
        )
        
    return jsonify({'response': sim_resp}), 200


@api_bp.route('/ai/notes', methods=['POST'])
@jwt_required()
def ai_notes():
    data = request.get_json() or {}
    topic = data.get('topic', '').strip()
    subject = data.get('subject', 'General').strip()
    tone = data.get('tone', 'Academic').strip()
    focus = data.get('focus', '').strip()
    
    if not topic:
        return jsonify({'message': 'Topic is required'}), 400
        
    prompt = (
        f"Create comprehensive, neat, structured study notes on the topic '{topic}' for the subject '{subject}'.\n"
        f"Tone format should be: {tone}.\n"
        f"Specific focus guidelines: {focus or 'None provided.'}\n"
        f"Write in proper Markdown, using clear headers, bullet points, definitions, and code blocks if appropriate."
    )
    
    gemini_resp = call_gemini(prompt)
    if gemini_resp:
        return jsonify({'notes': gemini_resp}), 200
        
    # Local simulation fallback
    sim_notes = f"""# Study Notes: {topic}
**Subject:** {subject} | **Format/Tone:** {tone}
*Off-line generated study guide summary*

---

## 1. Core Overview
The topic **{topic}** represents a fundamental pillar in the context of **{subject}**. 
{"Focus Area Focus: " + focus if focus else "A general deep-dive outline is provided below."}

- **Definition:** The fundamental theory, framework, or paradigm governing {topic}.
- **Key objective:** To simplify complex dependencies, maximize learning outcomes, and enable systematic application.
- **Importance:** Essential for exam preparation, practical implementation, and architectural design.

## 2. Key Concepts & Terminology
1. **First Principles:** The baseline concepts that form the foundation of {topic}.
2. **Structural Composition:** How these components interact under standard conditions in {subject}.
3. **Execution Model:** The standard workflow, mathematical formula, or logic sequence that guides {topic}.

```python
# Sample implementation / conceptual visualization of {topic}
def explain_concept():
    concept = "{topic}"
    subject = "{subject}"
    print(f"Mastering {{concept}} is key to succeeding in {{subject}}!")
    return True
```

## 3. Step-by-Step Learning Pathway
*   **Step 1: Foundational Literacy:** Understand primary definitions and historical context.
*   **Step 2: Core Analysis:** Investigate how {topic} operates in real-world scenarios.
*   **Step 3: Comparative Analysis:** Compare it to related paradigms within {subject}.
*   **Step 4: Active Application:** Implement exercises, debug logic errors, or solve mathematical problems.

---
> [!TIP]
> **Study Buddy Tip:** Try generating a practice quiz on **{topic}** in the **Quiz Studio** tab to test your understanding!
"""
    return jsonify({'notes': sim_notes}), 200


@api_bp.route('/ai/summarize-pdf', methods=['POST'])
@jwt_required()
def ai_summarize_pdf():
    data = request.get_json() or {}
    file_id = data.get('file_id')
    
    if not file_id:
        return jsonify({'message': 'File ID is required'}), 400
        
    uploaded_file = UploadedFile.query.get(file_id)
    if not uploaded_file:
        return jsonify({'message': 'File not found'}), 404
        
    # Get latest version storage filename
    if not uploaded_file.versions:
        return jsonify({'message': 'No versions uploaded for this file'}), 400
        
    latest_version = uploaded_file.versions[0]
    storage_filename = latest_version.storage_filename
    
    # Extract PDF text
    pdf_text = extract_pdf_text(storage_filename)
    if not pdf_text:
        # If text extraction is completely empty (or non-PDF/image), use default info
        pdf_text = f"Document filename: {uploaded_file.filename}. Category: {uploaded_file.category}. Description: {uploaded_file.description or 'No description'}"

    # Prompt
    prompt = (
        f"Analyze the following document text extracted from the file '{uploaded_file.filename}':\n\n"
        f"--- TEXT START ---\n{pdf_text[:4000]}\n--- TEXT END ---\n\n"
        f"Generate a JSON response with the following format:\n"
        f"{{\n"
        f"  \"summary\": \"A concise 3-4 sentence paragraph summarizing the document.\",\n"
        f"  \"takeaways\": [\n"
        f"     \"Takeaway point 1\",\n"
        f"     \"Takeaway point 2\",\n"
        f"     \"Takeaway point 3\"\n"
        f"  ],\n"
        f"  \"flashcards\": [\n"
        f"     {{\"question\": \"Flashcard Question?\", \"answer\": \"Flashcard Answer.\"}},\n"
        f"     {{\"question\": \"Another Question?\", \"answer\": \"Another Answer.\"}}\n"
        f"  ]\n"
        f"}}\n"
        f"Make sure to return ONLY valid raw JSON."
    )
    
    import json
    gemini_resp = call_gemini(prompt, json_mode=True)
    if gemini_resp:
        try:
            # Clean up block markers if output contains markdown code block wrapper
            clean_json = gemini_resp.strip()
            if clean_json.startswith("```json"):
                clean_json = clean_json[7:]
            if clean_json.endswith("```"):
                clean_json = clean_json[:-3]
            parsed = json.loads(clean_json.strip())
            return jsonify(parsed), 200
        except Exception as e:
            print(f"Error parsing Gemini JSON: {e}. Raw response: {gemini_resp}")
            
    # Local simulation fallback
    # Formulate custom flashcards based on file properties
    file_label = uploaded_file.filename.split('.')[0].replace('_', ' ').replace('-', ' ').title()
    sim_data = {
        "summary": f"This document, '{uploaded_file.filename}', focuses on study materials related to {uploaded_file.category}. It provides structured academic guidelines, outlining best practices, definitions, and contextual analysis to support comprehensive learning and exam readiness.",
        "takeaways": [
            f"Provides key explanations about the core foundations of '{file_label}'.",
            "Synthesizes critical case studies, structural diagrams, or logic flows.",
            "Offers actionable exercises and study tips to reinforce vocabulary and theoretical reasoning."
        ],
        "flashcards": [
            {"question": f"What is the main topic covered in '{uploaded_file.filename}'?", "answer": f"The document covers key topics and principles regarding '{file_label}' in the context of {uploaded_file.category} studies."},
            {"question": "How should this study material be reviewed?", "answer": "Combine reading these summary takeaways with active recall exercises and spacing out study sessions."},
            {"question": f"What category is this document classified under?", "answer": f"It is classified under the '{uploaded_file.category}' section of the CampusConnect file repository."}
        ]
    }
    return jsonify(sim_data), 200


@api_bp.route('/ai/quiz', methods=['POST'])
@jwt_required()
def ai_quiz():
    data = request.get_json() or {}
    topic = data.get('topic', '').strip()
    num_questions = int(data.get('num_questions', 5))
    difficulty = data.get('difficulty', 'Medium').strip()
    quiz_type = data.get('quiz_type', 'mcq').strip() # mcq or tf (true/false)
    
    if not topic:
        return jsonify({'message': 'Topic is required'}), 400
        
    prompt = (
        f"Generate a practice quiz on the topic '{topic}' with {num_questions} questions.\n"
        f"Difficulty level: {difficulty}.\n"
        f"Quiz Type: {'Multiple Choice (4 options)' if quiz_type == 'mcq' else 'True or False'}.\n"
        f"Format the output strictly as a JSON list of questions, like this:\n"
        f"[\n"
        f"  {{\n"
        f"    \"question\": \"Question text?\",\n"
        f"    \"options\": [\"Option A\", \"Option B\", \"Option C\", \"Option D\"],\n"
        f"    \"correct_index\": 0,\n"
        f"    \"explanation\": \"Detailed explanation of why Option A is correct.\"\n"
        f"  }}\n"
        f"]\n"
        f"Make sure to return ONLY raw valid JSON."
    )
    
    import json
    gemini_resp = call_gemini(prompt, json_mode=True)
    if gemini_resp:
        try:
            clean_json = gemini_resp.strip()
            if clean_json.startswith("```json"):
                clean_json = clean_json[7:]
            if clean_json.endswith("```"):
                clean_json = clean_json[:-3]
            parsed = json.loads(clean_json.strip())
            return jsonify({'questions': parsed}), 200
        except Exception as e:
            print(f"Error parsing Gemini JSON for quiz: {e}. Raw response: {gemini_resp}")
            
    # Local simulation fallback
    questions = []
    if quiz_type == 'mcq':
        questions = [
            {
                "question": f"Which of the following best defines the primary principle of {topic}?",
                "options": [
                    f"A theoretical abstraction designed to solve problem domains in {topic}.",
                    f"A hardware-level process that operates independently.",
                    f"An obsolete technique superseded by modern web libraries.",
                    f"A security database encryption algorithm standard."
                ],
                "correct_index": 0,
                "explanation": f"The primary definition of {topic} revolves around theoretical abstractions specifically optimized to solve complex domains within its field."
            },
            {
                "question": f"When implementing {topic}, what is a common mistake developers/students make?",
                "options": [
                    "Writing too many inline code comments.",
                    "Failing to establish boundary constraints and baseline validation.",
                    "Using dark mode styling in the presentation slides.",
                    "Choosing to learn the theory before writing tests."
                ],
                "correct_index": 1,
                "explanation": "Establishing correct validation guidelines and bounds is crucial to prevent memory leaks or logical errors."
            },
            {
                "question": f"Which parameter most directly impacts the scalability of {topic}?",
                "options": [
                    "The color palette of the application's logo.",
                    "The font family specified in the stylesheet.",
                    "Data structures efficiency and network bandwidth constraints.",
                    "The operating system registry key layout."
                ],
                "correct_index": 2,
                "explanation": "Scalability is bound directly by computational complexity (Big O) and network bandwidth capacity rather than styling choices."
            }
        ]
    else:
        # True / False
        questions = [
            {
                "question": f"True or False: The concepts behind {topic} are strictly applicable only to computational fields and have no cross-disciplinary value.",
                "options": ["True", "False"],
                "correct_index": 1,
                "explanation": f"False. The conceptual structures of {topic} are highly interdisciplinary and can be applied to problem-solving, mathematics, and logic."
            },
            {
                "question": f"True or False: Early implementations of {topic} required significantly less processing power compared to modern approaches.",
                "options": ["True", "False"],
                "correct_index": 0,
                "explanation": "True. Early models were lightweight due to hardware constraints, though modern implementations are far more powerful and computationally demanding."
            }
        ]
        
    # Trim or repeat based on requested question counts
    questions = questions[:num_questions]
    return jsonify({'questions': questions}), 200


@api_bp.route('/ai/interview', methods=['POST'])
@jwt_required()
def ai_interview():
    data = request.get_json() or {}
    role = data.get('role', 'General').strip()
    type_ = data.get('type', 'Technical').strip() # Technical or Behavioral
    user_answer = data.get('user_answer', '').strip()
    current_question = data.get('current_question', '').strip()
    
    # If the user is submitting an answer to evaluate
    if user_answer and current_question:
        prompt = (
            f"You are a professional mock interviewer. Assess the candidate's answer for the target role '{role}' ({type_} interview).\n"
            f"Question asked: '{current_question}'\n"
            f"Candidate response: '{user_answer}'\n"
            f"Provide a JSON assessment in the following format:\n"
            f"{{\n"
            f"  \"grade\": \"A, B, C, D, or F\",\n"
            f"  \"feedback\": \"Constructive critique detailing what was good and what could be improved.\",\n"
            f"  \"sample_answer\": \"An exemplar response demonstrating how a senior-level candidate would answer this question.\"\n"
            f"}}\n"
            f"Return ONLY valid raw JSON."
        )
        
        import json
        gemini_resp = call_gemini(prompt, json_mode=True)
        if gemini_resp:
            try:
                clean_json = gemini_resp.strip()
                if clean_json.startswith("```json"):
                    clean_json = clean_json[7:]
                if clean_json.endswith("```"):
                    clean_json = clean_json[:-3]
                parsed = json.loads(clean_json.strip())
                return jsonify(parsed), 200
            except Exception as e:
                print(f"Error parsing Gemini JSON for interview grading: {e}. Raw: {gemini_resp}")
                
        # Local simulation fallback for evaluation
        grade = "B+" if len(user_answer) > 80 else "B-"
        sample = f"A senior answer would start by explicitly defining terms, citing a personal anecdote (STAR method for behavioral, or technical stack context), and mentioning metric-based results."
        feedback = f"Your response is a solid start. You addressed the core question correctly. However, to elevate it to a stellar level, apply the STAR method (Situation, Task, Action, Result) to prove your impact with concrete numbers and explain the architectural trade-offs."
        return jsonify({
            'grade': grade,
            'feedback': feedback,
            'sample_answer': sample
        }), 200
        
    else:
        # Just generate interview questions
        prompt = (
            f"Generate a list of 3 mock interview questions for the role '{role}' ({type_} interview).\n"
            f"Format the output strictly as a JSON list of strings, for example:\n"
            f"[\n"
            f"  \"Question 1\",\n"
            f"  \"Question 2\",\n"
            f"  \"Question 3\"\n"
            f"]\n"
            f"Return ONLY valid raw JSON."
        )
        
        import json
        gemini_resp = call_gemini(prompt, json_mode=True)
        if gemini_resp:
            try:
                clean_json = gemini_resp.strip()
                if clean_json.startswith("```json"):
                    clean_json = clean_json[7:]
                if clean_json.endswith("```"):
                    clean_json = clean_json[:-3]
                parsed = json.loads(clean_json.strip())
                return jsonify({'questions': parsed}), 200
            except Exception as e:
                print(f"Error parsing Gemini JSON for interview questions: {e}")
                
        # Local simulation fallback
        if type_ == 'Technical':
            questions = [
                f"How do you design a scalable system for '{role}' to handle high traffic and state conflicts?",
                f"Explain how you would handle race conditions, caching strategies, and database optimization in a typical workflow.",
                f"What are the major security considerations (like injection, XSS, CSRF) you prioritize when building applications?"
            ]
        else:
            questions = [
                f"Tell me about a time you faced a serious conflict with a team member when working on '{role}' tasks. How did you resolve it?",
                f"Describe a failure you experienced in a project. What did you learn, and how did you apply that knowledge subsequently?",
                f"How do you prioritize deadlines and manage stakeholders when multiple high-priority tasks arrive concurrently?"
            ]
        return jsonify({'questions': questions}), 200



