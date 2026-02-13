import os
import pymysql
from dotenv import load_dotenv

# Load .env file
load_dotenv()

# Build connection details from .env
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "4000"))
DB_USER = os.getenv("DB_USER", "root")
DB_PASS = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "MSU-ONLINE")
SSL_CA = os.getenv("DB_SSL_CA")

# Resolve SSL path if present
if SSL_CA and not os.path.isabs(SSL_CA):
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    potential_paths = [
        os.path.abspath(SSL_CA),
        os.path.join(backend_dir, SSL_CA),
        os.path.join(backend_dir, "certs", os.path.basename(SSL_CA))
    ]
    for p in potential_paths:
        if os.path.exists(p):
            SSL_CA = p
            break

def create_db():
    print(f"Connecting to {DB_HOST}:{DB_PORT} as {DB_USER}...")
    try:
        # Connection params
        params = {
            "host": DB_HOST,
            "port": DB_PORT,
            "user": DB_USER,
            "password": DB_PASS,
            "autocommit": True
        }
        
        # Add SSL if CA exists
        if SSL_CA and os.path.exists(SSL_CA):
            print(f"Using SSL CA: {SSL_CA}")
            params["ssl"] = {"ca": SSL_CA, "check_hostname": False}

        # Connect to MySQL (without database specified)
        conn = pymysql.connect(**params)
        cursor = conn.cursor()
        
        # Create database
        print(f"Creating database '{DB_NAME}' if not exists...")
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{DB_NAME}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        print(f"SUCCESS: Database '{DB_NAME}' is ready.")
        
        conn.close()
        return True
    except Exception as e:
        print(f"ERROR creating database: {e}")
        return False

if __name__ == "__main__":
    create_db()
