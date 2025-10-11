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
        
        # Create subjects table WITHOUT time fields
        conn.execute('''
            CREATE TABLE IF NOT EXISTS subjects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')

# Create schedules table
        conn.execute('''
            CREATE TABLE IF NOT EXISTS schedules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            subject_id INTEGER NOT NULL,
            day_of_week TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (subject_id) REFERENCES subjects (id) ON DELETE CASCADE,
            UNIQUE(user_id, subject_id, day_of_week, start_time)
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
    """Create default IT/Computer Science subjects."""
    default_subjects = [
        ("Programming Fundamentals", "Introduction to programming concepts and basic coding"),
        ("Data Structures and Algorithms", "Fundamental data structures and algorithmic thinking"),
        ("Database Management Systems", "Database design, SQL, and database administration"),
        ("Computer Networks", "Network protocols, architecture, and administration"),
        ("Software Engineering", "Software development lifecycle and project management"),
        ("Web Development", "Frontend and backend web technologies"),
        ("Mobile Application Development", "iOS, Android, and cross-platform mobile apps"),
        ("Cybersecurity", "Information security, ethical hacking, and system protection"),
        ("Artificial Intelligence", "AI concepts, machine learning basics, and applications"),
        ("Machine Learning", "Advanced ML algorithms and data science techniques"),
        ("System Administration", "Server management, cloud computing, and DevOps"),
        ("Computer Architecture", "Hardware design, processor architecture, and system organization"),
        ("Operating Systems", "OS concepts, process management, and system programming"),
        ("Object-Oriented Programming", "OOP principles using Java, C#, or Python"),
        ("Computer Graphics", "3D modeling, game development, and visual computing"),
        ("Human-Computer Interaction", "UI/UX design and user experience principles"),
        ("Information Systems", "Business systems analysis and enterprise solutions"),
        ("Discrete Mathematics", "Mathematical foundations for computer science"),
        ("Computer Ethics", "Professional ethics and social implications of technology"),
        ("Capstone Project", "Final year project and thesis work")
    ]
    
    try:
        for subject_name, subject_desc in default_subjects:
            exists = conn.execute(
                "SELECT id FROM subjects WHERE name = ?", (subject_name,)
            ).fetchone()
            
            if not exists:
                conn.execute('''
                    INSERT INTO subjects (name, description)
                    VALUES (?, ?)
                ''', (subject_name, subject_desc))
        
        conn.commit()
        print("IT/Computer Science subjects created successfully!")
        
    except sqlite3.Error as e:
        print(f"Error creating IT/CS subjects: {e}")

def add_subject_column_to_existing_db():
    """Add subject column to existing attendance_records table if it doesn't exist."""
    conn = get_db_connection()
    try:
        cursor = conn.execute("PRAGMA table_info(attendance_records)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'subject' not in columns and 'department' in columns:
            print("Migrating department column to subject column...")
            conn.execute('ALTER TABLE attendance_records ADD COLUMN subject TEXT')
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
        cursor = conn.execute("PRAGMA table_info(attendance_records)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'department' in columns and 'subject' in columns:
            print("Found both department and subject columns. Cleaning up...")
            
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
            
            conn.execute('''
                INSERT INTO attendance_records_new (id, user_id, full_name, subject, status, timestamp, created_at)
                SELECT id, user_id, full_name, 
                       COALESCE(subject, department) as subject, 
                       status, timestamp, created_at
                FROM attendance_records
            ''')
            
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
    init_database()
    add_status_column_to_existing_db()
    add_subject_column_to_existing_db()
    clean_duplicate_columns()