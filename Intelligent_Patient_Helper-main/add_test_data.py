import psycopg2
from psycopg2.extras import RealDictCursor

# Veritabanı bağlantısı
DATABASE_URL = "postgresql://neondb_owner:npg_uBr4kN1VvOTf@ep-late-king-a5aqj7tw-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

def main():
    try:
        print("Veritabanına bağlanılıyor...")
        conn = psycopg2.connect(DATABASE_URL)
        print("Bağlantı başarılı!")
        
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # 1. Test hastası ekleme (varsa güncelleme)
        print("Test hastası ekleniyor...")
        cursor.execute("""
            INSERT INTO patients (tc_number, name, date_of_birth, phone, email)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (tc_number) DO UPDATE 
            SET name = EXCLUDED.name,
                date_of_birth = EXCLUDED.date_of_birth,
                phone = EXCLUDED.phone,
                email = EXCLUDED.email
            RETURNING id
        """, ('55555555555', 'Test Hasta', '1990-01-01', '5551234567', 'test@example.com'))
        
        patient_result = cursor.fetchone()
        patient_id = patient_result['id'] if patient_result else None
        
        if patient_id:
            print(f"Hasta eklendi veya güncellendi. ID: {patient_id}")
            
            # 2. Test randevusu ekleme
            print("Test randevusu ekleniyor...")
            cursor.execute("""
                INSERT INTO appointments (patient_id, department, doctor_name, doctor_id, appointment_date, symptoms)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id
            """, (
                patient_id,
                'Neurology',
                'Dr. Olivia Martinez', 
                'D_MARTINEZ',
                '2025-05-01 15:00:00',
                'headache'
            ))
            
            appointment_result = cursor.fetchone()
            appointment_id = appointment_result['id'] if appointment_result else None
            
            if appointment_id:
                print(f"Randevu eklendi. ID: {appointment_id}")
            else:
                print("Randevu eklenemedi!")
        else:
            print("Hasta eklenemedi veya bulunamadı!")
        
        # İşlemi kaydet
        conn.commit()
        print("İşlemler başarıyla tamamlandı ve kaydedildi.")
        
    except Exception as e:
        print(f"Hata: {e}")
    finally:
        if 'conn' in locals():
            conn.close()
            print("Veritabanı bağlantısı kapatıldı.")

if __name__ == "__main__":
    main() 