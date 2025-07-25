import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_connection():
    try:
        # Get connection string from environment variable
        database_url = os.getenv("DATABASE_URL")
        
        if not database_url:
            print("ERROR: DATABASE_URL environment variable not set")
            return False
        
        print(f"Connecting to database with URL: {database_url}")
        
        # Connect to Neon DB
        conn = psycopg2.connect(database_url)
        conn.autocommit = True
        
        print("Connected to Neon Database successfully!")
        
        # Create tables if they don't exist
        cursor = conn.cursor()
        
        # Create patients table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS patients (
                id SERIAL PRIMARY KEY,
                tc_number VARCHAR(11) UNIQUE NOT NULL,
                name VARCHAR(100) NOT NULL,
                date_of_birth DATE NOT NULL,
                phone VARCHAR(20) NOT NULL,
                email VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        print("Tables created or already exist")
        
        # Test inserting a patient
        try:
            cursor.execute("""
                INSERT INTO patients (tc_number, name, date_of_birth, phone, email)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, tc_number, name
            """, (
                "11122233344",
                "Test Patient",
                "2000-01-01",
                "5551234567",
                "test@example.com"
            ))
            
            new_patient = cursor.fetchone()
            print(f"Test patient inserted: {new_patient}")
        except psycopg2.errors.UniqueViolation:
            print("Test patient already exists (tc_number 11122233344)")
            
        # List all patients
        cursor.execute("SELECT id, tc_number, name FROM patients")
        all_patients = cursor.fetchall()
        print("\nAll patients in database:")
        for patient in all_patients:
            print(f"ID: {patient[0]}, TC: {patient[1]}, Name: {patient[2]}")
        
        cursor.close()
        conn.close()
        
        return True
    except Exception as e:
        print(f"Database connection or operation error: {e}")
        return False

if __name__ == "__main__":
    print("Testing database connection...")
    test_connection() 