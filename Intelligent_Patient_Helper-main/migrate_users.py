"""
Bu script, localStorage'daki kullanıcıları NeonDB veritabanına aktarır.
Kullanım: 
1. JSON dosyasını oluşturun (kullanıcıları kopyalayın ve users.json dosyasına yapıştırın)
2. python migrate_users.py komutunu çalıştırın
"""

import os
import json
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

# NeonDB bağlantı bilgileri (doğrudan tanımlı)
DATABASE_URL = "postgresql://neondb_owner:npg_uBr4kN1VvOTf@ep-late-king-a5aqj7tw-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

def connect_to_db():
    """Veritabanına bağlan"""
    # Veritabanına bağlan
    try:
        print("Connecting to NeonDB...")
        conn = psycopg2.connect(DATABASE_URL)
        print("Successfully connected to NeonDB")
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

def create_tables(conn):
    """Gerekli tabloları oluştur (eğer yoksa)"""
    try:
        cursor = conn.cursor()

        # Patients tablosunu oluştur
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

        # Appointments tablosunu oluştur
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS appointments (
                id SERIAL PRIMARY KEY,
                patient_id INTEGER REFERENCES patients(id),
                department VARCHAR(100) NOT NULL,
                doctor_name VARCHAR(100) NOT NULL,
                doctor_id VARCHAR(100) NOT NULL,
                appointment_date TIMESTAMP NOT NULL,
                symptoms TEXT,
                status VARCHAR(20) DEFAULT 'scheduled',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        conn.commit()
        cursor.close()
        print("Tables created successfully")
        return True
    except Exception as e:
        print(f"Error creating tables: {e}")
        return False

def migrate_users(conn, users_data):
    """Kullanıcı verilerini veritabanına migrate et"""
    success_count = 0
    failure_count = 0
    
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    for tc_number, user_data in users_data.items():
        try:
            # Kullanıcının zaten var olup olmadığını kontrol et
            cursor.execute("SELECT id FROM patients WHERE tc_number = %s", (tc_number,))
            exists = cursor.fetchone()
            
            if exists:
                print(f"Patient {tc_number} already exists, skipping")
                continue
                
            # Doğum tarihi yok ise varsayılan ata
            dob = user_data.get("date_of_birth", "1990-01-01")
            
            # Kullanıcıyı veritabanına ekle
            cursor.execute("""
                INSERT INTO patients (tc_number, name, date_of_birth, phone, email)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, tc_number, name, date_of_birth, phone, email
            """, (
                tc_number,
                user_data.get("name", "Unknown Name"),
                dob,
                user_data.get("phone", "1234567890"),
                user_data.get("email", "unknown@example.com")
            ))
            
            new_patient = cursor.fetchone()
            print(f"Successfully migrated user {tc_number}")
            success_count += 1
            
        except Exception as e:
            print(f"Error migrating user {tc_number}: {e}")
            failure_count += 1
    
    conn.commit()
    cursor.close()
    
    return {
        "success_count": success_count,
        "failure_count": failure_count
    }

def main():
    # Veritabanına bağlan
    conn = connect_to_db()
    if not conn:
        print("Failed to connect to database. Exiting.")
        return
    
    # Tabloları oluştur
    if not create_tables(conn):
        print("Failed to create tables. Exiting.")
        conn.close()
        return
    
    # users.json dosyasını kontrol et, yoksa oluştur
    if not os.path.exists("users.json"):
        print("users.json file not found.")
        print("Creating an empty users.json file. Please add your users data and run this script again.")
        with open("users.json", "w") as f:
            json.dump({
                "12345678901": {
                    "name": "John Doe",
                    "date_of_birth": "1990-01-01",
                    "phone": "5551234567",
                    "email": "john@example.com"
                }
            }, f, indent=4)
        return
    
    # Kullanıcı verilerini yükle
    try:
        with open("users.json", "r") as f:
            users_data = json.load(f)
        
        print(f"Loaded {len(users_data)} users from users.json")
        
        # Kullanıcıları migrate et
        result = migrate_users(conn, users_data)
        
        print(f"Migration complete. {result['success_count']} users migrated successfully, {result['failure_count']} failed.")
        
    except Exception as e:
        print(f"Error loading users data: {e}")
    
    finally:
        conn.close()
        print("Database connection closed")

if __name__ == "__main__":
    main() 