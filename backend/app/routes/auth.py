from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, decode_token
from datetime import timedelta
from app.models import db, User

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    role = data.get('role', 'student')
    full_name = data.get('full_name')
    major = data.get('major')
    graduation_year = data.get('graduation_year')
    
    if not username or not email or not password:
        return jsonify({'message': 'Missing username, email, or password'}), 400
        
    if role not in ['student', 'staff', 'club_leader', 'admin']:
        return jsonify({'message': 'Invalid role specified'}), 400
        
    if User.query.filter_by(username=username).first():
        return jsonify({'message': 'Username already exists'}), 400
        
    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'Email already registered'}), 400
        
    try:
        grad_yr = None
        if graduation_year:
            try:
                grad_yr = int(graduation_year)
            except ValueError:
                return jsonify({'message': 'Graduation year must be a number'}), 400

        dept = major or data.get('department')
        new_user = User(
            username=username, 
            email=email,
            role=role,
            verification_status='approved',
            full_name=full_name or username,
            department=dept,
            graduation_year=grad_yr
        )
        new_user.set_password(password)
        db.session.add(new_user)
        db.session.commit()
        
        # Automatically generate access token upon successful registration
        access_token = create_access_token(identity=str(new_user.id))
        
        return jsonify({
            'message': 'User registered successfully',
            'access_token': access_token,
            'user': new_user.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Database error occurred', 'details': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'message': 'Email and password are required'}), 400
        
    user = User.query.filter_by(email=email).first()
    
    if not user or not user.check_password(password):
        return jsonify({'message': 'Invalid email or password'}), 401
        
    access_token = create_access_token(identity=str(user.id))
    
    return jsonify({
        'message': 'Login successful',
        'access_token': access_token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_profile():
    current_user_id = get_jwt_identity()
    user = db.session.get(User, int(current_user_id))
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
        
    return jsonify({
        'user': user.to_dict()
    }), 200

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json() or {}
    email = data.get('email')
    
    if not email:
        return jsonify({'message': 'Email is required'}), 400
        
    user = User.query.filter_by(email=email).first()
    
    if not user:
        return jsonify({'message': 'If the email exists, a password reset link has been sent.'}), 200
        
    reset_token = create_access_token(
        identity=str(user.id),
        expires_delta=timedelta(minutes=15),
        additional_claims={'purpose': 'password_reset', 'email': email}
    )
    
    reset_link = f"http://localhost:5173/reset-password?token={reset_token}"
    
    from flask import current_app
    smtp_server = current_app.config.get('SMTP_SERVER')
    smtp_username = current_app.config.get('SMTP_USERNAME')
    smtp_password = current_app.config.get('SMTP_PASSWORD')
    
    # If SMTP is configured, we try to send a real email.
    if smtp_server and smtp_username and smtp_password:
        try:
            from app.utils.email import send_reset_email
            send_reset_email(email, reset_link)
            print("\n" + "="*80)
            print(f"REAL PASSWORD RESET EMAIL SENT TO: {email}")
            print(f"Reset Link: {reset_link}")
            print("="*80 + "\n")
            
            return jsonify({
                'message': 'If the email exists, a password reset link has been sent.'
            }), 200
        except Exception as e:
            print("\n" + "="*80)
            print(f"FAILED TO SEND PASSWORD RESET EMAIL TO: {email}")
            print(f"Error: {e}")
            print("="*80 + "\n")
            return jsonify({
                'message': 'Failed to send password reset email. Please try again later or contact support.',
                'details': str(e)
            }), 500
    else:
        # Development / Simulation mode (SMTP not configured)
        print("\n" + "="*80)
        print(f"PASSWORD RESET REQUEST FOR (SIMULATED): {email}")
        print(f"Reset Link: {reset_link}")
        print("Note: Configure SMTP in backend/.env to send real emails.")
        print("="*80 + "\n")
        
        return jsonify({
            'message': 'If the email exists, a password reset link has been sent.',
            'reset_token': reset_token,
            'reset_link': reset_link
        }), 200


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json() or {}
    token = data.get('token')
    new_password = data.get('password')
    
    if not token or not new_password:
        return jsonify({'message': 'Token and new password are required'}), 400
        
    try:
        decoded = decode_token(token)
        
        if decoded.get('type') != 'access' or decoded.get('sub') is None:
            return jsonify({'message': 'Invalid reset token'}), 400
            
        if decoded.get('purpose') != 'password_reset':
            return jsonify({'message': 'Invalid token purpose'}), 400
            
        user_id = decoded.get('sub')
        user = User.query.get(int(user_id))
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
            
        user.set_password(new_password)
        db.session.commit()
        
        return jsonify({'message': 'Password reset successful'}), 200
    except Exception as e:
        return jsonify({'message': 'Invalid or expired token', 'details': str(e)}), 400
