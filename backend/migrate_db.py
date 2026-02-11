import sqlite3
import os

db_path = 'unstoppable_minds.db'

def migrate():
    if not os.path.exists(db_path):
        print(f"Database {db_path} not found.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Helper function to add column if not exists
    def add_column(table, column, definition):
        try:
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {definition};")
            print(f"Success: Added column '{column}' to table '{table}'.")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print(f"Skip: column '{column}' already exists in '{table}'.")
            else:
                print(f"Error adding column '{column}' to '{table}': {e}")

    # 1. Update Course table
    add_column('courses', 'is_programming', 'BOOLEAN DEFAULT 0')
    add_column('courses', 'tutor_id', 'INTEGER REFERENCES users(id)')

    # 2. Update Module table
    add_column('modules', 'description', 'TEXT')
    add_column('modules', 'expected_outcome', 'TEXT')

    # 3. Create SubTopic table
    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sub_topics (
                id INTEGER PRIMARY KEY,
                module_id INTEGER REFERENCES modules(id),
                title VARCHAR(255) NOT NULL,
                content TEXT,
                practice_code TEXT,
                'order' INTEGER DEFAULT 0
            );
        """)
        print("Success: Created table 'sub_topics'.")
    except sqlite3.OperationalError as e:
        print(f"Error creating sub_topics: {e}")

    # 4. Create StudentPerformance table
    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS student_performance (
                id INTEGER PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                course_id INTEGER REFERENCES courses(id),
                sub_topic_id INTEGER REFERENCES sub_topics(id),
                attempts INTEGER DEFAULT 0,
                duration_seconds INTEGER DEFAULT 0,
                passed BOOLEAN DEFAULT 0,
                last_attempt DATETIME
            );
        """)
        print("Success: Created table 'student_performance'.")
    except sqlite3.OperationalError as e:
        print(f"Error creating student_performance: {e}")

    # 5. Update GeneratedContent table
    add_column('generated_content', 'updated_at', 'DATETIME')
    add_column('generated_content', 'status', "VARCHAR(50) DEFAULT 'pending'")

    # 6. Create UserSettings table
    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS user_settings (
                user_id INTEGER PRIMARY KEY REFERENCES users(id),
                account_identity TEXT,
                security_access TEXT,
                privacy_sharing TEXT,
                notifications TEXT,
                learning_preferences TEXT,
                teaching_controls TEXT,
                skill_evaluation TEXT,
                billing_monetization TEXT,
                integrations_api TEXT,
                system_institutional TEXT,
                last_updated DATETIME
            );
        """)
        print("Success: Created table 'user_settings'.")
    except sqlite3.OperationalError as e:
        print(f"Error creating user_settings: {e}")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()
