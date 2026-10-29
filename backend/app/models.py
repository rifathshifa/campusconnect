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
    role = db.Column(db.String(20), default='student', nullable=False) # e.g. student, admin, club_leader
    verification_status = db.Column(db.String(20), default='approved', nullable=False) # approved, pending, rejected
    
    # Profile details
    full_name = db.Column(db.String(100))
    bio = db.Column(db.Text)
    major = db.Column(db.String(100))
    graduation_year = db.Column(db.Integer)
    avatar_url = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    memberships = db.relationship('ClubMembership', back_populates='user', cascade='all, delete-orphan')
    rsvps = db.relationship('EventRSVP', back_populates='user', cascade='all, delete-orphan')
    posts = db.relationship('Post', back_populates='author', cascade='all, delete-orphan')
    comments = db.relationship('Comment', back_populates='author', cascade='all, delete-orphan')

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
            'full_name': self.full_name,
            'bio': self.bio,
            'major': self.major,
            'graduation_year': self.graduation_year,
            'avatar_url': self.avatar_url,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Club(db.Model):
    __tablename__ = 'clubs'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False, index=True)
    description = db.Column(db.Text)
    category = db.Column(db.String(50)) # e.g. Academic, Arts, Sports, Technology
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    logo_url = db.Column(db.String(255))
    banner_url = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    creator = db.relationship('User', backref='created_clubs')
    members = db.relationship('ClubMembership', back_populates='club', cascade='all, delete-orphan')
    events = db.relationship('Event', back_populates='organizer_club', cascade='all, delete-orphan')
    posts = db.relationship('Post', back_populates='club')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'category': self.category,
            'creator_id': self.creator_id,
            'logo_url': self.logo_url,
            'banner_url': self.banner_url,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class ClubMembership(db.Model):
    __tablename__ = 'club_memberships'

    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id', ondelete='CASCADE'), primary_key=True)
    role = db.Column(db.String(30), default='member', nullable=False) # e.g. member, officer, leader
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    user = db.relationship('User', back_populates='memberships')
    club = db.relationship('Club', back_populates='members')

    def to_dict(self):
        return {
            'user_id': self.user_id,
            'club_id': self.club_id,
            'role': self.role,
            'joined_at': self.joined_at.isoformat() if self.joined_at else None
        }


class Event(db.Model):
    __tablename__ = 'events'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=False)
    location = db.Column(db.String(150))
    event_date = db.Column(db.DateTime, nullable=False)
    organizer_club_id = db.Column(db.Integer, db.ForeignKey('clubs.id', ondelete='CASCADE'), nullable=True)
    creator_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    volunteer_needed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    organizer_club = db.relationship('Club', back_populates='events')
    creator = db.relationship('User')
    rsvps = db.relationship('EventRSVP', back_populates='event', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'location': self.location,
            'event_date': self.event_date.isoformat() if self.event_date else None,
            'organizer_club_id': self.organizer_club_id,
            'organizer_club_name': self.organizer_club.name if self.organizer_club else None,
            'creator_id': self.creator_id,
            'volunteer_needed': self.volunteer_needed,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class EventRSVP(db.Model):
    __tablename__ = 'event_rsvps'

    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id', ondelete='CASCADE'), primary_key=True)
    status = db.Column(db.String(20), default='going', nullable=False) # e.g. going, interested, declined
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('User', back_populates='rsvps')
    event = db.relationship('Event', back_populates='rsvps')

    def to_dict(self):
        return {
            'user_id': self.user_id,
            'event_id': self.event_id,
            'status': self.status,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }


class Post(db.Model):
    __tablename__ = 'posts'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    content = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(30), nullable=False) # e.g. Events, Clubs, Volunteer, Marketplace, Discussions
    price = db.Column(db.Numeric(10, 2), nullable=True) # Used for marketplace posts
    author_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    club_id = db.Column(db.Integer, db.ForeignKey('clubs.id', ondelete='SET NULL'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    author = db.relationship('User', back_populates='posts')
    club = db.relationship('Club', back_populates='posts')
    comments = db.relationship('Comment', back_populates='post', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'category': self.category,
            'price': float(self.price) if self.price is not None else None,
            'author_id': self.author_id,
            'author_name': self.author.full_name or self.author.username if self.author else 'Unknown',
            'club_id': self.club_id,
            'club_name': self.club.name if self.club else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Comment(db.Model):
    __tablename__ = 'comments'

    id = db.Column(db.Integer, primary_key=True)
    post_id = db.Column(db.Integer, db.ForeignKey('posts.id', ondelete='CASCADE'), nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    post = db.relationship('Post', back_populates='comments')
    author = db.relationship('User', back_populates='comments')

    def to_dict(self):
        return {
            'id': self.id,
            'post_id': self.post_id,
            'author_id': self.author_id,
            'author_name': self.author.full_name or self.author.username if self.author else 'Unknown',
            'content': self.content,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Announcement(db.Model):
    __tablename__ = 'announcements'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    content = db.Column(db.Text, nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=True)

    # Relationships
    author = db.relationship('User')

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'author_id': self.author_id,
            'author_name': self.author.full_name or self.author.username if self.author else 'System',
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None
        }


class UploadedFile(db.Model):
    __tablename__ = 'uploaded_files'

    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(50), default='General') # Academic, Arts, Sports, Technology, General
    file_type = db.Column(db.String(50), nullable=False) # PDF, Image, Word, PPT, ZIP, Video, Audio, Text, Other
    approval_status = db.Column(db.String(20), default='pending', nullable=False) # pending, approved, rejected
    rejection_reason = db.Column(db.String(255), nullable=True)
    uploader_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    approved_by_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    uploader = db.relationship('User', foreign_keys=[uploader_id], backref=db.backref('uploaded_files', lazy=True))
    approver = db.relationship('User', foreign_keys=[approved_by_id])
    versions = db.relationship('FileVersion', back_populates='file', cascade='all, delete-orphan', order_by='desc(FileVersion.version_number)')

    def to_dict(self):
        latest_version = self.versions[0] if self.versions else None
        return {
            'id': self.id,
            'filename': self.filename,
            'description': self.description,
            'category': self.category,
            'file_type': self.file_type,
            'approval_status': self.approval_status,
            'rejection_reason': self.rejection_reason,
            'uploader_id': self.uploader_id,
            'uploader_name': self.uploader.full_name or self.uploader.username if self.uploader else 'Unknown',
            'approved_by_id': self.approved_by_id,
            'approved_by_name': self.approver.full_name or self.approver.username if self.approver else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'latest_version': latest_version.to_dict() if latest_version else None,
            'versions_count': len(self.versions)
        }


class FileVersion(db.Model):
    __tablename__ = 'file_versions'

    id = db.Column(db.Integer, primary_key=True)
    file_id = db.Column(db.Integer, db.ForeignKey('uploaded_files.id', ondelete='CASCADE'), nullable=False)
    version_number = db.Column(db.Integer, nullable=False)
    storage_filename = db.Column(db.String(255), nullable=False)
    file_size = db.Column(db.Integer, nullable=False) # in bytes
    changelog = db.Column(db.String(255), nullable=True)
    uploader_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    file = db.relationship('UploadedFile', back_populates='versions')
    uploader = db.relationship('User')

    def to_dict(self):
        return {
            'id': self.id,
            'file_id': self.file_id,
            'version_number': self.version_number,
            'storage_filename': self.storage_filename,
            'file_size': self.file_size,
            'changelog': self.changelog,
            'uploader_id': self.uploader_id,
            'uploader_name': self.uploader.full_name or self.uploader.username if self.uploader else 'Unknown',
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    


class Assignment(db.Model):
    __tablename__ = 'assignments'

    id = db.Column(db.Integer, primary_key=True)
    course = db.Column(db.String(100), nullable=False)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    due_date = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(30), default='Pending', nullable=False) # e.g. Pending, Submitted, Graded
    grade = db.Column(db.String(10), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)

    # Relationship
    user = db.relationship('User', backref=db.backref('assignments', lazy=True, cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'id': self.id,
            'course': self.course,
            'title': self.title,
            'description': self.description,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'status': self.status,
            'grade': self.grade,
            'user_id': self.user_id
        }


class Attendance(db.Model):
    __tablename__ = 'attendance'

    id = db.Column(db.Integer, primary_key=True)
    course = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(20), default='Present', nullable=False) # e.g. Present, Absent, Late
    date = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)

    # Relationship
    user = db.relationship('User', backref=db.backref('attendance_records', lazy=True, cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'id': self.id,
            'course': self.course,
            'status': self.status,
            'date': self.date.isoformat() if self.date else None,
            'user_id': self.user_id
        }


class TimetableSlot(db.Model):
    __tablename__ = 'timetable_slots'

    id = db.Column(db.Integer, primary_key=True)
    course = db.Column(db.String(100), nullable=False)
    day_of_week = db.Column(db.String(20), nullable=False) # e.g. Monday, Tuesday, etc.
    start_time = db.Column(db.String(10), nullable=False) # e.g. "09:00"
    end_time = db.Column(db.String(10), nullable=False) # e.g. "10:30"
    room = db.Column(db.String(50), nullable=False) # e.g. "Tech Hall 402"
    instructor = db.Column(db.String(100), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)

    # Relationship
    user = db.relationship('User', backref=db.backref('timetable_slots', lazy=True, cascade='all, delete-orphan'))

    def to_dict(self):
        return {
            'id': self.id,
            'course': self.course,
            'day_of_week': self.day_of_week,
            'start_time': self.start_time,
            'end_time': self.end_time,
            'room': self.room,
            'instructor': self.instructor,
            'user_id': self.user_id
        }

