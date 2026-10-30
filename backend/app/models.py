from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

# SQLAlchemy instance shared across the app package
db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='student', nullable=False)  # 'student', 'staff', 'admin'
    verification_status = db.Column(db.String(20), default='approved', nullable=False)  # 'approved', 'pending', 'rejected'

    # Essential academic & profile details
    full_name = db.Column(db.String(100), nullable=True)
    department = db.Column(db.String(100), nullable=True)  # e.g. 'Computer Science & Engineering'
    graduation_year = db.Column(db.Integer, nullable=True)  # e.g. 2027
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    uploaded_materials = db.relationship('StudyMaterial', foreign_keys='StudyMaterial.uploader_id', back_populates='uploader', cascade='all, delete-orphan')
    reviewed_materials = db.relationship('StudyMaterial', foreign_keys='StudyMaterial.approved_by_id', back_populates='approver')

    # Convenience property for backward compatibility with 'major'
    @property
    def major(self):
        return self.department

    @major.setter
    def major(self, value):
        self.department = value

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'verification_status': self.verification_status,
            'full_name': self.full_name or self.username,
            'department': self.department,
            'major': self.department,
            'graduation_year': self.graduation_year,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Department(db.Model):
    __tablename__ = 'departments'

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(20), unique=True, nullable=False, index=True)  # e.g. CSE, ECE, MECH, CIVIL, IT, AIDS
    name = db.Column(db.String(100), unique=True, nullable=False)  # e.g. Computer Science & Engineering
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    subjects = db.relationship('Subject', back_populates='department', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'name': self.name
        }


class Subject(db.Model):
    __tablename__ = 'subjects'

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(30), nullable=True, index=True)  # e.g. CS301
    name = db.Column(db.String(150), nullable=False, index=True)  # e.g. Data Structures and Algorithms
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id', ondelete='CASCADE'), nullable=True)
    semester = db.Column(db.String(20), nullable=False)  # e.g. "Semester 3"
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    department = db.relationship('Department', back_populates='subjects')

    def to_dict(self):
        return {
            'id': self.id,
            'code': self.code,
            'name': self.name,
            'department_id': self.department_id,
            'department_code': self.department.code if self.department else None,
            'department_name': self.department.name if self.department else None,
            'semester': self.semester
        }


class StudyMaterial(db.Model):
    __tablename__ = 'study_materials'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    material_type = db.Column(db.String(100), nullable=False, index=True)  # Textbook PDF, Lab Manual, Lab Program, Lecture Notes, Previous Year Question Paper, Study Material

    # Academic metadata
    department = db.Column(db.String(100), nullable=False, index=True)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id', ondelete='SET NULL'), nullable=True)
    year = db.Column(db.String(30), nullable=False, index=True)  # 1st Year, 2nd Year, 3rd Year, 4th Year
    semester = db.Column(db.String(30), nullable=False, index=True)  # Semester 1 to Semester 8
    subject = db.Column(db.String(150), nullable=False, index=True)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id', ondelete='SET NULL'), nullable=True)

    # File storage references
    original_filename = db.Column(db.String(255), nullable=False)
    storage_filename = db.Column(db.String(255), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)  # In bytes
    mime_type = db.Column(db.String(100), default='application/pdf', nullable=False)

    # Approval workflow: Pending Approval is default for all student uploads
    approval_status = db.Column(db.String(20), default='pending', nullable=False, index=True)  # pending, approved, rejected
    rejection_reason = db.Column(db.Text, nullable=True)

    # Associations
    uploader_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    approved_by_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    reviewed_at = db.Column(db.DateTime, nullable=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    uploader = db.relationship('User', foreign_keys=[uploader_id], back_populates='uploaded_materials')
    approver = db.relationship('User', foreign_keys=[approved_by_id], back_populates='reviewed_materials')
    dept_rel = db.relationship('Department', foreign_keys=[department_id])
    subject_rel = db.relationship('Subject', foreign_keys=[subject_id])

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'material_type': self.material_type,
            'department': self.department,
            'department_id': self.department_id,
            'year': self.year,
            'semester': self.semester,
            'subject': self.subject,
            'subject_id': self.subject_id,
            'original_filename': self.original_filename,
            'file_size': self.file_size,
            'mime_type': self.mime_type,
            'approval_status': self.approval_status,
            'rejection_reason': self.rejection_reason,
            'uploader_id': self.uploader_id,
            'uploader_name': self.uploader.full_name or self.uploader.username if self.uploader else 'Unknown',
            'uploader_username': self.uploader.username if self.uploader else 'unknown',
            'uploader_role': self.uploader.role if self.uploader else 'student',
            'uploader_department': self.uploader.department if self.uploader else None,
            'approved_by_id': self.approved_by_id,
            'approved_by_name': self.approver.full_name or self.approver.username if self.approver else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
