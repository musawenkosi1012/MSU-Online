import os
import pymysql

# Connection details from your installer log
DB_HOST = "localhost"
DB_PORT = 2004
DB_USER = "root"
DB_PASS = "root" 
DB_NAME = "msu_online"

def create_db():
    try:
        # Connect to MySQL (without database specified)
        conn = pymysql.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASS
        )
        cursor = conn.cursor()
        
        # Create database
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        print(f"SUCCESS: Database '{DB_NAME}' is ready on port {DB_PORT}.")
        
        conn.close()
        return True
    except Exception as e:
        print(f"ERROR creating database: {e}")
        return False

if __name__ == "__main__":
    create_db()
