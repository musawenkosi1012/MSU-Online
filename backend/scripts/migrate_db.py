import sqlite3
import os

DB_PATH = "unstoppable_minds.db"

def migrate():
    print(f"Migrating {DB_PATH}...")
    if not os.path.exists(DB_PATH):
        print("Database not found. Skipping migration (it will be created fresh).")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Check if column exists
        cursor.execute("PRAGMA table_info(courses)")
        columns = [info[1] for info in cursor.fetchall()]
        
        if "credit_value" not in columns:
            print("Adding 'credit_value' column to 'courses' table...")
            cursor.execute("ALTER TABLE courses ADD COLUMN credit_value INTEGER DEFAULT 3")
            conn.commit()
            print("Migration successful: credit_value added.")
        else:
            print("'credit_value' column already exists.")

        # Check for topic_id in student_performance
        cursor.execute("PRAGMA table_info(student_performance)")
        sp_columns = [info[1] for info in cursor.fetchall()]

        if "topic_id" not in sp_columns:
            print("Adding 'topic_id' column to 'student_performance' table...")
            cursor.execute("ALTER TABLE student_performance ADD COLUMN topic_id VARCHAR(100)")
            cursor.execute("CREATE INDEX ix_student_performance_topic_id ON student_performance (topic_id)")
            conn.commit()
            print("Migration successful: topic_id added.")
        else:
            print("'topic_id' column already exists.")

        if "mastery" not in sp_columns:
            print("Adding 'mastery' column to 'student_performance' table...")
            cursor.execute("ALTER TABLE student_performance ADD COLUMN mastery FLOAT DEFAULT 0.0")
            conn.commit()
            print("Migration successful: mastery added.")
        else:
            print("'mastery' column already exists.")

        # Check for assessments table
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='assessments'")
        if not cursor.fetchone():
            print("Creating 'assessments' table...")
            cursor.execute('''
                CREATE TABLE assessments (
                    id VARCHAR(100) PRIMARY KEY,
                    course_id INTEGER,
                    topic_id VARCHAR(100),
                    type VARCHAR(50),
                    content_json TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(course_id) REFERENCES courses(id)
                )
            ''')
            cursor.execute("CREATE INDEX ix_assessments_topic_id ON assessments (topic_id)")
            conn.commit()
            print("Migration successful: assessments table created.")
        else:
            print("'assessments' table already exists.")
            
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
