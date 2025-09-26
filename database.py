import sqlite3
from datetime import datetime
import hashlib

DATABASE_NAME = 'eduwatch.db'

def get_db_connection():
    """Create and return a database connection."""
    conn = sqlite3.connect(DATABASE_NAME)
    conn.row_factory = sqlite3.Row  # This allows us to access columns by name
    return conn

def init_database():
    """Initialize the database with required tables."""
    conn = get_db_connection()
    
    try:
        # Create users table with status field
        conn.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                full_name TEXT NOT NULL,
                email TEXT,
                contact_number TEXT,
                address TEXT,
                status TEXT,
                is_admin BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create attendance_records table
        conn.execute('''
            CREATE TABLE IF NOT EXISTS attendance_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                full_name TEXT NOT NULL,
                subject TEXT NOT NULL,
                status TEXT NOT NULL,
                timestamp TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        
        # Create departments table (renamed to subjects for consistency)
        conn.execute('''
            CREATE TABLE IF NOT EXISTS subjects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        
        # Insert default admin and test user if they don't exist
        create_default_users(conn)
        create_default_subjects(conn)
        
        print("Database initialized successfully!")
        
    except sqlite3.Error as e:
        print(f"Database error: {e}")
        conn.rollback()
    finally:
        conn.close()

def hash_password(password):
    """Hash password using SHA-256 (in production, use bcrypt or similar)."""
    return hashlib.sha256(password.encode()).hexdigest()

def create_default_users(conn):
    """Create default users if they don't exist."""
    try:
        # Check if admin user exists
        admin_exists = conn.execute(
            "SELECT id FROM users WHERE username = ?", ("admin",)
        ).fetchone()
        
        if not admin_exists:
            hashed_admin_password = hash_password("admin123")
            conn.execute('''
                INSERT INTO users (username, password, full_name, email, contact_number, address, status, is_admin)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', ("admin", hashed_admin_password, "System Administrator", "admin@eduwatch.com", "+1234567890", "Admin Office", "Full Time", 1))
        
        # Check if test user exists
        test_user_exists = conn.execute(
            "SELECT id FROM users WHERE username = ?", ("outis",)
        ).fetchone()
        
        if not test_user_exists:
            hashed_test_password = hash_password("123123")
            conn.execute('''
                INSERT INTO users (username, password, full_name, email, contact_number, address, status, is_admin)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', ("outis", hashed_test_password, "Nathaniel Saclolo", "nathaniel@eduwatch.com", "+0987654321", "Circulo Verde, Quezon", "Full Time", 0))
        
        conn.commit()
        print("Default users created successfully!")
        
    except sqlite3.Error as e:
        print(f"Error creating default users: {e}")

def create_default_subjects(conn):
    """Create default subjects."""
    default_subjects = [
        ("Mathematics", "Mathematics and Algebra"),
        ("English", "English Language and Literature"),
        ("Science", "General Science"),
        ("History", "World and Local History"),
        ("Computer Science", "Programming and Information Technology"),
        ("Physics", "Physics and Applied Sciences"),
        ("Chemistry", "Chemistry and Laboratory Sciences"),
        ("Biology", "Biology and Life Sciences"),
        ("Geography", "Physical and Human Geography"),
        ("Literature", "Literature and Reading"),
        ("Art", "Visual Arts and Creative Expression"),
        ("Music", "Music Theory and Performance"),
        ("Physical Education", "Sports and Physical Fitness"),
        ("Economics", "Economics and Business Studies"),
        ("Psychology", "Psychology and Human Behavior")
    ]
    
    try:
        for subject_name, subject_desc in default_subjects:
            # Check if subject already exists
            exists = conn.execute(
                "SELECT id FROM subjects WHERE name = ?", (subject_name,)
            ).fetchone()
            
            if not exists:
                conn.execute('''
                    INSERT INTO subjects (name, description)
                    VALUES (?, ?)
                ''', (subject_name, subject_desc))
        
        conn.commit()
        print("Default subjects created successfully!")
        
    except sqlite3.Error as e:
        print(f"Error creating default subjects: {e}")

def migrate_json_data():
    """Migrate existing JSON data to SQLite (optional)."""
    import json
    import os
    
    if not os.path.exists('db.json'):
        print("No JSON file found to migrate.")
        return
    
    try:
        with open('db.json', 'r') as f:
            data = json.load(f)
        
        conn = get_db_connection()
        
        # Migrate users
        users_data = data.get('users', {})
        for username, user_info in users_data.items():
            # Check if user already exists
            exists = conn.execute(
                "SELECT id FROM users WHERE username = ?", (username,)
            ).fetchone()
            
            if not exists:
                conn.execute('''
                    INSERT INTO users (username, password, full_name, status, is_admin)
                    VALUES (?, ?, ?, ?, ?)
                ''', (
                    username,
                    user_info['password'],  # Already hashed in JSON
                    user_info['full_name'],
                    "Full Time",  # Default status for migrated users
                    user_info['is_admin']
                ))
        
        # Migrate attendance records
        attendance_data = data.get('attendance_records', [])
        for record in attendance_data:
            conn.execute('''
                INSERT INTO attendance_records (full_name, subject, status, timestamp)
                VALUES (?, ?, ?, ?)
            ''', (
                record['name'],
                record.get('subject', record.get('department', 'General')),  # Use subject if available, fallback to department
                record['status'],
                record['timestamp']
            ))
        
        conn.commit()
        conn.close()
        
        # Backup the JSON file
        os.rename('db.json', 'db.json.backup')
        print("JSON data migrated successfully! JSON file backed up as db.json.backup")
        
    except Exception as e:
        print(f"Error migrating JSON data: {e}")

def add_subject_column_to_existing_db():
    """Add subject column to existing attendance_records table if it doesn't exist."""
    conn = get_db_connection()
    try:
        # Check if subject column exists in attendance_records
        cursor = conn.execute("PRAGMA table_info(attendance_records)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'subject' not in columns and 'department' in columns:
            print("Migrating department column to subject column...")
            # Add subject column
            conn.execute('ALTER TABLE attendance_records ADD COLUMN subject TEXT')
            # Copy data from department column to subject column
            conn.execute('UPDATE attendance_records SET subject = department WHERE subject IS NULL')
            conn.commit()
            print("Subject column added and data migrated successfully!")
            
        elif 'subject' not in columns and 'department' not in columns:
            print("Adding subject column to attendance_records table...")
            conn.execute('ALTER TABLE attendance_records ADD COLUMN subject TEXT')
            conn.commit()
            print("Subject column added successfully!")
        else:
            print("Subject column already exists in attendance_records.")
            
        # Check if subjects table exists, if not create it
        cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='subjects';")
        if not cursor.fetchone():
            print("Creating subjects table...")
            conn.execute('''
                CREATE TABLE subjects (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE NOT NULL,
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            conn.commit()
            create_default_subjects(conn)
            print("Subjects table created successfully!")
        else:
            print("Subjects table already exists.")
            
    except sqlite3.Error as e:
        print(f"Error adding subject column: {e}")
    finally:
        conn.close()

def clean_duplicate_columns():
    """Remove duplicate department column if both department and subject exist."""
    conn = get_db_connection()
    try:
        # Check what columns exist in attendance_records
        cursor = conn.execute("PRAGMA table_info(attendance_records)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'department' in columns and 'subject' in columns:
            print("Found both department and subject columns. Cleaning up...")
            
            # Create new table without department column
            conn.execute('''
                CREATE TABLE attendance_records_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    full_name TEXT NOT NULL,
                    subject TEXT NOT NULL,
                    status TEXT NOT NULL,
                    timestamp TIMESTAMP NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                )
            ''')
            
            # Copy data from old table to new table, using subject column
            conn.execute('''
                INSERT INTO attendance_records_new (id, user_id, full_name, subject, status, timestamp, created_at)
                SELECT id, user_id, full_name, 
                       COALESCE(subject, department) as subject, 
                       status, timestamp, created_at
                FROM attendance_records
            ''')
            
            # Drop old table and rename new table
            conn.execute('DROP TABLE attendance_records')
            conn.execute('ALTER TABLE attendance_records_new RENAME TO attendance_records')
            
            conn.commit()
            print("Successfully removed duplicate department column!")
        else:
            print("No duplicate columns found.")
            
    except sqlite3.Error as e:
        print(f"Error cleaning duplicate columns: {e}")
    finally:
        conn.close()

def add_status_column_to_existing_db():
    """Add status column to existing users table if it doesn't exist."""
    conn = get_db_connection()
    try:
        # Check if status column exists
        cursor = conn.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'status' not in columns:
            print("Adding status column to users table...")
            conn.execute('ALTER TABLE users ADD COLUMN status TEXT DEFAULT "Full Time"')
            conn.commit()
            print("Status column added successfully!")
        else:
            print("Status column already exists.")
            
    except sqlite3.Error as e:
        print(f"Error adding status column: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    # Initialize database when script is run directly
    init_database()
    # Add status column if upgrading from older version
    add_status_column_to_existing_db()
    # Add subject column and subjects table if upgrading from older version
    add_subject_column_to_existing_db()
    # Clean up duplicate columns (remove department column if both exist)
    clean_duplicate_columns()
    # Optionally migrate existing JSON data
    migrate_json_data()