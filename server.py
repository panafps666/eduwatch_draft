# Import necessary libraries
from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from datetime import datetime
import hashlib
from database import get_db_connection, init_database

# Initialize the Flask application
app = Flask(__name__)

# Enable CORS for all routes, allowing your frontend to connect
CORS(app)

# Initialize database on startup
init_database()

# --- Helper functions ---

def hash_password(password):
    """Hash password using SHA-256."""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password, hashed_password):
    """Verify password against hash."""
    return hash_password(password) == hashed_password

def get_user_by_username(username):
    """Get user by username from database."""
    conn = get_db_connection()
    user = conn.execute(
        'SELECT * FROM users WHERE username = ?', (username,)
    ).fetchone()
    conn.close()
    return user

def get_user_by_id(user_id):
    """Get user by ID from database."""
    conn = get_db_connection()
    user = conn.execute(
        'SELECT * FROM users WHERE id = ?', (user_id,)
    ).fetchone()
    conn.close()
    return user

# --- API Endpoints ---

@app.route('/api/register', methods=['POST'])
def register():
    """Endpoint for user registration."""
    data = request.json
    username = data.get('username')
    password = data.get('password')
    full_name = data.get('fullName')
    email = data.get('email', '')
    contact = data.get('contact', '')
    address = data.get('address', '')
    status = data.get('status', '')  # New status field
    is_admin = data.get('isAdmin', False)

    if not username or not password or not full_name:
        return jsonify({'success': False, 'message': 'Username, password, and full name are required.'}), 400

    if not status:
        return jsonify({'success': False, 'message': 'Status is required.'}), 400
    
    if not email:
        return jsonify({'success': False, 'message': 'Email is required.'}), 400
    
    if not contact:
        return jsonify({'success': False, 'message': 'Contact number is required.'}), 400
    
    if not address:
        return jsonify({'success': False, 'message': 'Address is required.'}), 400

    # Check if user already exists
    if get_user_by_username(username):
        return jsonify({'success': False, 'message': 'Username already exists.'}), 409

    try:
        conn = get_db_connection()
        hashed_password = hash_password(password)
        
        # Check if status column exists, if not add it
        try:
            conn.execute('ALTER TABLE users ADD COLUMN status TEXT')
            conn.commit()
        except sqlite3.Error:
            # Column already exists, ignore the error
            pass
        
        conn.execute('''
            INSERT INTO users (username, password, full_name, email, contact_number, address, status, is_admin)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (username, hashed_password, full_name, email, contact, address, status, is_admin))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Account created successfully!'}), 201
    
    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return jsonify({'success': False, 'message': 'Database error occurred. Please try again.'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    """Endpoint for user login."""
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'success': False, 'message': 'Username and password are required.'}), 400

    user = get_user_by_username(username)
    if not user or not verify_password(password, user['password']):
        return jsonify({'success': False, 'message': 'Invalid username or password.'}), 401

    # Successful login, return user data
    return jsonify({
        'success': True,
        'message': 'Login successful!',
        'user': {
            'id': user['id'],
            'username': user['username'],
            'full_name': user['full_name'],
            'is_admin': bool(user['is_admin'])
        }
    }), 200

@app.route('/api/attendance', methods=['POST'])
def mark_attendance():
    """Endpoint to mark user attendance."""
    data = request.json
    full_name = data.get('full_name')
    status = data.get('status')
    department = data.get('department')
    subject = data.get('subject')  # New subject field
    timestamp = data.get('timestamp')

    if not all([full_name, timestamp]):
        return jsonify({'success': False, 'message': 'Missing data for attendance record.'}), 400

    try:
        conn = get_db_connection()
        
        # Get user ID and status from users table
        user = conn.execute(
            'SELECT id, status FROM users WHERE full_name = ?', (full_name,)
        ).fetchone()
        
        if not user:
            conn.close()
            return jsonify({'success': False, 'message': 'User not found.'}), 404
        
        user_id = user['id']
        user_status = user['status']  # Get the actual user status from registration
        
        # Add subject column if it doesn't exist
        try:
            conn.execute('ALTER TABLE attendance_records ADD COLUMN subject TEXT')
            conn.commit()
        except sqlite3.Error:
            pass
        
        conn.execute('''
            INSERT INTO attendance_records (user_id, full_name, department, subject, status, timestamp)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (user_id, full_name, department or 'General', subject or department, user_status, timestamp))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Attendance marked successfully!'}), 201
    
    except sqlite3.Error as e:
        print(f"Attendance error: {e}")
        return jsonify({'success': False, 'message': 'Database error occurred.'}), 500

@app.route('/api/dashboard', methods=['GET'])
def get_dashboard_data():
    """Endpoint to get all attendance records with proper user status."""
    try:
        conn = get_db_connection()
        records = conn.execute('''
            SELECT ar.*, u.username, u.status as user_status
            FROM attendance_records ar
            LEFT JOIN users u ON ar.user_id = u.id
            ORDER BY ar.timestamp DESC
        ''').fetchall()
        conn.close()
        
        # Convert to list of dictionaries
        attendance_list = []
        for record in records:
            attendance_list.append({
                'id': record['id'],
                'name': record['full_name'],
                'department': record['department'],
                'subject': record['subject'] if 'subject' in record.keys() and record['subject'] else record['department'],
                'status': record['status'],  # This is the attendance status
                'user_status': record['user_status'] or 'Unknown',  # This is the user's employment status
                'timestamp': record['timestamp'],
                'username': record['username']
            })
        
        return jsonify({'attendance': attendance_list}), 200
    
    except sqlite3.Error as e:
        print(f"Dashboard error: {e}")
        return jsonify({'success': False, 'message': 'Database error occurred.'}), 500

# --- Admin API Endpoints ---

@app.route('/api/admin/users', methods=['GET'])
def get_all_users():
    """Endpoint for admin to get all user data."""
    try:
        conn = get_db_connection()
        users = conn.execute('''
            SELECT id, username, full_name, email, contact_number, address, status, is_admin, created_at
            FROM users
            ORDER BY created_at DESC
        ''').fetchall()
        conn.close()
        
        user_list = []
        for user in users:
            user_list.append({
                'id': user['id'],
                'username': user['username'],
                'full_name': user['full_name'],
                'email': user['email'],
                'contact_number': user['contact_number'],
                'address': user['address'],
                'status': user['status'],
                'is_admin': bool(user['is_admin']),
                'created_at': user['created_at']
            })
        
        return jsonify({'users': user_list}), 200
    
    except sqlite3.Error as e:
        return jsonify({'success': False, 'message': 'Database error occurred.'}), 500

@app.route('/api/admin/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    """Endpoint for admin to update user information."""
    data = request.json
    
    try:
        conn = get_db_connection()
        
        # Check if user exists
        user = conn.execute('SELECT id FROM users WHERE id = ?', (user_id,)).fetchone()
        if not user:
            conn.close()
            return jsonify({'success': False, 'message': 'User not found.'}), 404
        
        # Update user information
        conn.execute('''
            UPDATE users 
            SET full_name = ?, email = ?, contact_number = ?, address = ?, status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (data.get('full_name'), data.get('email'), data.get('contact_number'), 
              data.get('address'), data.get('status'), user_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'User updated successfully!'}), 200
    
    except sqlite3.Error as e:
        print(f"Update user error: {e}")
        return jsonify({'success': False, 'message': 'Database error occurred.'}), 500

@app.route('/api/admin/clear_attendance', methods=['DELETE'])
def clear_all_attendance():
    """Endpoint for admin to clear all attendance records."""
    try:
        conn = get_db_connection()
        conn.execute('DELETE FROM attendance_records')
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'All attendance records have been cleared.'}), 200
    
    except sqlite3.Error as e:
        return jsonify({'success': False, 'message': 'Database error occurred.'}), 500

# --- Subject Management API Endpoints ---

@app.route('/api/subjects', methods=['GET'])
def get_subjects():
    """Endpoint to get all subjects."""
    try:
        conn = get_db_connection()
        
        # Create subjects table if it doesn't exist
        conn.execute('''
            CREATE TABLE IF NOT EXISTS subjects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Insert default subjects if table is empty
        count = conn.execute('SELECT COUNT(*) as count FROM subjects').fetchone()['count']
        if count == 0:
            default_subjects = [
                ('Mathematics', 'Mathematics and Algebra'),
                ('English', 'English Language and Literature'),
                ('Science', 'General Science'),
                ('History', 'World and Local History'),
                ('Computer Science', 'Programming and IT'),
                ('Physics', 'Physics and Applied Sciences'),
                ('Chemistry', 'Chemistry and Laboratory Sciences'),
                ('Biology', 'Biology and Life Sciences'),
                ('Geography', 'Physical and Human Geography'),
                ('Literature', 'Literature and Reading'),
                ('Art', 'Visual Arts and Creative Expression'),
                ('Music', 'Music Theory and Performance'),
                ('Physical Education', 'Sports and Physical Fitness'),
                ('Economics', 'Economics and Business Studies'),
                ('Psychology', 'Psychology and Human Behavior')
            ]
            
            for name, desc in default_subjects:
                conn.execute('INSERT INTO subjects (name, description) VALUES (?, ?)', (name, desc))
        
        subjects = conn.execute('SELECT * FROM subjects ORDER BY name').fetchall()
        conn.commit()
        conn.close()
        
        subject_list = []
        for subject in subjects:
            subject_list.append({
                'id': subject['id'],
                'name': subject['name'],
                'description': subject['description']
            })
        
        return jsonify({'subjects': subject_list}), 200
    
    except sqlite3.Error as e:
        print(f"Subjects error: {e}")
        return jsonify({'success': False, 'message': 'Database error occurred.'}), 500

@app.route('/api/subjects', methods=['POST'])
def add_subject():
    """Endpoint for admin to add a new subject."""
    data = request.json
    name = data.get('name')
    description = data.get('description', '')
    
    if not name:
        return jsonify({'success': False, 'message': 'Subject name is required.'}), 400
    
    try:
        conn = get_db_connection()
        conn.execute('INSERT INTO subjects (name, description) VALUES (?, ?)', (name, description))
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Subject added successfully!'}), 201
    
    except sqlite3.IntegrityError:
        return jsonify({'success': False, 'message': 'Subject already exists.'}), 409
    except sqlite3.Error as e:
        print(f"Add subject error: {e}")
        return jsonify({'success': False, 'message': 'Database error occurred.'}), 500

# --- Profile API Endpoints ---

@app.route('/api/profile/update', methods=['PUT'])
def update_profile():
    """Endpoint to update user profile information."""
    data = request.json
    current_username = data.get('currentUsername')
    new_username = data.get('newUsername')
    full_name = data.get('fullName')
    email = data.get('email', '')
    contact = data.get('contact', '')
    address = data.get('address', '')
    status = data.get('status', '')

    if not all([current_username, new_username, full_name]):
        return jsonify({'success': False, 'message': 'Username and full name are required.'}), 400

    try:
        conn = get_db_connection()
        
        # Check if current user exists
        current_user = conn.execute(
            'SELECT * FROM users WHERE username = ?', (current_username,)
        ).fetchone()
        
        if not current_user:
            conn.close()
            return jsonify({'success': False, 'message': 'User not found.'}), 404
        
        # Check if new username already exists (unless it's the same)
        if new_username != current_username:
            existing_user = conn.execute(
                'SELECT id FROM users WHERE username = ?', (new_username,)
            ).fetchone()
            
            if existing_user:
                conn.close()
                return jsonify({'success': False, 'message': 'Username already exists.'}), 409
        
        # Update user information
        try:
            conn.execute('''
                UPDATE users 
                SET username = ?, full_name = ?, email = ?, contact_number = ?, address = ?, status = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (new_username, full_name, email, contact, address, status, current_user['id']))
        except sqlite3.Error:
            conn.execute('''
                UPDATE users 
                SET username = ?, full_name = ?, email = ?, contact_number = ?, address = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (new_username, full_name, email, contact, address, current_user['id']))
        
        # Update attendance records with new name if full name changed
        if full_name != current_user['full_name']:
            conn.execute('''
                UPDATE attendance_records 
                SET full_name = ?
                WHERE user_id = ?
            ''', (full_name, current_user['id']))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Profile updated successfully!'}), 200
    
    except sqlite3.Error as e:
        print(f"Profile update error: {e}")
        return jsonify({'success': False, 'message': 'Database error occurred.'}), 500

@app.route('/api/profile/<username>', methods=['GET'])
def get_profile(username):
    """Endpoint to get user profile information."""
    user = get_user_by_username(username)
    
    if not user:
        return jsonify({'success': False, 'message': 'User not found.'}), 404

    user_data = {
        'id': user['id'],
        'username': user['username'],
        'full_name': user['full_name'],
        'is_admin': bool(user['is_admin']),
        'created_at': user['created_at']
    }
    
    # Safely get optional fields
    try:
        user_data['email'] = user['email'] if user['email'] else ''
    except (KeyError, TypeError):
        user_data['email'] = ''
    
    try:
        user_data['contact_number'] = user['contact_number'] if user['contact_number'] else ''
    except (KeyError, TypeError):
        user_data['contact_number'] = ''
    
    try:
        user_data['address'] = user['address'] if user['address'] else ''
    except (KeyError, TypeError):
        user_data['address'] = ''
    
    try:
        user_data['status'] = user['status'] if user['status'] else 'Full Time'
    except (KeyError, TypeError):
        user_data['status'] = 'Full Time'

    return jsonify({
        'success': True,
        'user': user_data
    }), 200

# --- Statistics API Endpoints ---

@app.route('/api/stats', methods=['GET'])
def get_statistics():
    """Endpoint to get system statistics."""
    try:
        conn = get_db_connection()
        
        # Get total users
        total_users = conn.execute('SELECT COUNT(*) as count FROM users').fetchone()['count']
        
        # Get total attendance records
        total_attendance = conn.execute('SELECT COUNT(*) as count FROM attendance_records').fetchone()['count']
        
        # Get today's attendance
        today = datetime.now().strftime('%Y-%m-%d')
        today_attendance = conn.execute(
            'SELECT COUNT(*) as count FROM attendance_records WHERE DATE(timestamp) = ?', (today,)
        ).fetchone()['count']
        
        # Get attendance by user status
        status_stats = conn.execute('''
            SELECT u.status, COUNT(*) as count 
            FROM attendance_records ar
            JOIN users u ON ar.user_id = u.id
            WHERE DATE(ar.timestamp) = ? 
            GROUP BY u.status
        ''', (today,)).fetchall()
        
        conn.close()
        
        status_breakdown = {}
        for stat in status_stats:
            status_breakdown[stat['status']] = stat['count']
        
        return jsonify({
            'total_users': total_users,
            'total_attendance': total_attendance,
            'today_attendance': today_attendance,
            'status_breakdown': status_breakdown
        }), 200
    
    except sqlite3.Error as e:
        return jsonify({'success': False, 'message': 'Database error occurred.'}), 500

@app.route('/api/subjects/<int:subject_id>', methods=['DELETE'])
def delete_subject(subject_id):
    """Endpoint for admin to delete a subject."""
    try:
        conn = get_db_connection()
        
        # Check if subject exists
        subject = conn.execute('SELECT id FROM subjects WHERE id = ?', (subject_id,)).fetchone()
        if not subject:
            conn.close()
            return jsonify({'success': False, 'message': 'Subject not found.'}), 404
        
        # Delete the subject
        conn.execute('DELETE FROM subjects WHERE id = ?', (subject_id,))
        # Also remove from user_subjects if the table exists
        try:
            conn.execute('DELETE FROM user_subjects WHERE subject_id = ?', (subject_id,))
        except sqlite3.Error:
            pass  # Table might not exist yet
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Subject deleted successfully!'}), 200
    
    except sqlite3.Error as e:
        print(f"Delete subject error: {e}")
        return jsonify({'success': False, 'message': 'Database error occurred.'}), 500

@app.route('/api/admin/users/<int:user_id>/subjects', methods=['GET'])
def get_user_subjects(user_id):
    """Get subjects assigned to a specific user."""
    try:
        conn = get_db_connection()
        
        # Create user_subjects table if it doesn't exist
        conn.execute('''
            CREATE TABLE IF NOT EXISTS user_subjects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                subject_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (subject_id) REFERENCES subjects (id),
                UNIQUE(user_id, subject_id)
            )
        ''')
        
        # Get user's assigned subjects
        user_subjects = conn.execute('''
            SELECT s.id, s.name
            FROM subjects s
            JOIN user_subjects us ON s.id = us.subject_id
            WHERE us.user_id = ?
            ORDER BY s.name
        ''', (user_id,)).fetchall()
        
        conn.close()
        
        subject_list = []
        for subject in user_subjects:
            subject_list.append({
                'id': subject['id'],
                'name': subject['name']
            })
        
        return jsonify({'subjects': subject_list}), 200
    
    except sqlite3.Error as e:
        print(f"Get user subjects error: {e}")
        return jsonify({'success': False, 'message': 'Database error occurred.'}), 500

@app.route('/api/admin/users/<int:user_id>/subjects', methods=['PUT'])
def update_user_subjects(user_id):
    """Update subjects assigned to a specific user."""
    data = request.json
    subject_ids = data.get('subject_ids', [])
    
    try:
        conn = get_db_connection()
        
        # Create user_subjects table if it doesn't exist
        conn.execute('''
            CREATE TABLE IF NOT EXISTS user_subjects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                subject_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (subject_id) REFERENCES subjects (id),
                UNIQUE(user_id, subject_id)
            )
        ''')
        
        # Remove all existing subject assignments for this user
        conn.execute('DELETE FROM user_subjects WHERE user_id = ?', (user_id,))
        
        # Add new subject assignments
        for subject_id in subject_ids:
            try:
                conn.execute('''
                    INSERT INTO user_subjects (user_id, subject_id)
                    VALUES (?, ?)
                ''', (user_id, subject_id))
            except sqlite3.IntegrityError:
                # Subject assignment already exists, skip
                pass
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'User subjects updated successfully!'}), 200
    
    except sqlite3.Error as e:
        print(f"Update user subjects error: {e}")
        return jsonify({'success': False, 'message': 'Database error occurred.'}), 500

@app.route('/api/users/<int:user_id>/subjects', methods=['GET'])
def get_user_available_subjects(user_id):
    """Get subjects available to a specific user for attendance."""
    try:
        conn = get_db_connection()
        
        # Check if user_subjects table exists
        tables = conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='user_subjects'").fetchone()
        
        if tables:
            # If user has assigned subjects, return only those
            user_subjects = conn.execute('''
                SELECT s.id, s.name, s.description
                FROM subjects s
                JOIN user_subjects us ON s.id = us.subject_id
                WHERE us.user_id = ?
                ORDER BY s.name
            ''', (user_id,)).fetchall()
            
            if user_subjects:
                subject_list = []
                for subject in user_subjects:
                    subject_list.append({
                        'id': subject['id'],
                        'name': subject['name'],
                        'description': subject['description']
                    })
                conn.close()
                return jsonify({'subjects': subject_list}), 200
        
        # If no specific assignments, return all subjects
        all_subjects = conn.execute('SELECT * FROM subjects ORDER BY name').fetchall()
        conn.close()
        
        subject_list = []
        for subject in all_subjects:
            subject_list.append({
                'id': subject['id'],
                'name': subject['name'],
                'description': subject['description']
            })
        
        return jsonify({'subjects': subject_list}), 200
    
    except sqlite3.Error as e:
        print(f"Get user available subjects error: {e}")
        return jsonify({'success': False, 'message': 'Database error occurred.'}), 500

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    """Simple health check endpoint."""
    return jsonify({'status': 'healthy', 'message': 'EduWatch API is running'}), 200

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'success': False, 'message': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'success': False, 'message': 'Internal server error'}), 500

# Run the Flask app
if __name__ == '__main__':
    print("Starting EduWatch Server...")
    print("Database: eduwatch.db")
    print("Server: http://127.0.0.1:5000")
    print("Health check: http://127.0.0.1:5000/api/health")
    app.run(debug=True, host='0.0.0.0', port=5000)