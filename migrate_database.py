import sqlite3
from database import get_db_connection

def migrate_subjects_table():
    """Remove time columns from subjects table if they exist."""
    conn = get_db_connection()
    
    try:
        # Check current structure
        cursor = conn.execute("PRAGMA table_info(subjects)")
        columns = [column[1] for column in cursor.fetchall()]
        
        print("Current subjects table columns:", columns)
        
        has_time_columns = 'start_time' in columns or 'end_time' in columns
        
        if has_time_columns:
            print("\n⚠️  Found time columns in subjects table!")
            print("📦 Creating clean subjects table...")
            
            # Create new subjects table without time columns
            conn.execute('''
                CREATE TABLE subjects_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE NOT NULL,
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            # Copy data (excluding time columns)
            conn.execute('''
                INSERT INTO subjects_new (id, name, description, created_at)
                SELECT id, name, description, created_at
                FROM subjects
            ''')
            
            # Drop old table and rename new one
            conn.execute('DROP TABLE subjects')
            conn.execute('ALTER TABLE subjects_new RENAME TO subjects')
            
            conn.commit()
            print("✅ Successfully removed time columns from subjects table!")
            print("✅ Subjects now only store name and description")
        else:
            print("\n✅ Subjects table is already correct (no time columns)")
        
        # Verify schedules table exists
        cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='schedules'")
        if not cursor.fetchone():
            print("\n❌ WARNING: Schedules table doesn't exist!")
            print("   Run: python database.py")
        else:
            print("✅ Schedules table exists")
        
        print("\n🎉 Migration complete!")
        
    except sqlite3.Error as e:
        print(f"❌ Error during migration: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    print("="*50)
    print("  DATABASE MIGRATION SCRIPT")
    print("="*50)
    migrate_subjects_table()