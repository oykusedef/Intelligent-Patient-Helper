import random
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv
import os

# Çevre değişkenlerini yükle
load_dotenv()

# Veritabanı bağlantı bilgileri
DATABASE_URL = os.getenv("DATABASE_URL")

# Hastalık ve ilaç listeleri
DISEASES = [
    "Hipertansiyon", "Tip 2 Diyabet", "Astım", "Migren", "Artrit",
    "Kronik Bronşit", "Gastrit", "Anemi", "Hipertiroidi", "Depresyon"
]

MEDICATIONS = {
    "Hipertansiyon": ["Lisinopril", "Amlodipin", "Metoprolol"],
    "Tip 2 Diyabet": ["Metformin", "Glimepirid", "İnsülin"],
    "Astım": ["Salbutamol", "Flutikazon", "Montelukast"],
    "Migren": ["Sumatriptan", "Propranolol", "Topiramat"],
    "Artrit": ["İbuprofen", "Naproksen", "Metotreksat"],
    "Kronik Bronşit": ["Azitromisin", "Amoksisilin", "Klaritromisin"],
    "Gastrit": ["Omeprazol", "Ranitidin", "Pantoprazol"],
    "Anemi": ["Demir Sülfat", "Folik Asit", "B12 Vitamini"],
    "Hipertiroidi": ["Metimazol", "Propranolol", "Levotiroksin"],
    "Depresyon": ["Sertralin", "Fluoksetin", "Venlafaksin"]
}

NOTES = [
    "Hasta düzenli ilaç kullanımına devam ediyor.",
    "Hasta şikayetlerinde azalma gözlemlendi.",
    "Hasta kontrollerini düzenli olarak yapıyor.",
    "Hasta diyet programına uyum sağlıyor.",
    "Hasta egzersiz programına devam ediyor.",
    "Hasta sigarayı bıraktı.",
    "Hasta alkol kullanımını azalttı.",
    "Hasta stres yönetimi konusunda ilerleme kaydetti.",
    "Hasta uyku düzeni iyileşti.",
    "Hasta kilo vermeye başladı."
]


def create_health_history_table():
    """Sağlık geçmişi tablosunu oluşturur"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()

        # Önce tabloyu sil (eğer varsa)
        cursor.execute("DROP TABLE IF EXISTS health_history;")

        # Yeni tabloyu oluştur
        cursor.execute("""
            CREATE TABLE health_history (
                id SERIAL PRIMARY KEY,
                patient_id INTEGER REFERENCES patients(id),
                disease VARCHAR(100) NOT NULL,
                diagnosis_date DATE NOT NULL,
                medication VARCHAR(100),
                medication_dosage VARCHAR(50),
                medication_frequency VARCHAR(50),
                medical_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        conn.commit()
        print("Sağlık geçmişi tablosu başarıyla oluşturuldu.")

    except Exception as e:
        print(f"Tablo oluşturma hatası: {e}")
    finally:
        if conn:
            conn.close()


def get_existing_patients():
    """Mevcut hastaları getirir"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor(cursor_factory=RealDictCursor)

        cursor.execute("SELECT id, tc_number, created_at FROM patients")
        patients = cursor.fetchall()

        return patients
    except Exception as e:
        print(f"Hasta getirme hatası: {e}")
        return []
    finally:
        if conn:
            conn.close()


def generate_health_history(patient_id, registration_date):
    """Hasta için sağlık geçmişi oluşturur"""
    health_records = []

    # Kayıt tarihinden önceki bir tarih seç
    max_days_ago = (datetime.now() - registration_date).days
    if max_days_ago < 30:  # Yeni hasta
        return []

    # 1-3 arası hastalık seç
    num_diseases = random.randint(1, 3)
    selected_diseases = random.sample(DISEASES, num_diseases)

    for disease in selected_diseases:
        # Teşhis tarihi (kayıt tarihinden önce)
        days_ago = random.randint(30, max_days_ago)
        diagnosis_date = datetime.now() - timedelta(days=days_ago)

        # İlaç bilgileri
        medication = random.choice(MEDICATIONS[disease])
        dosage = f"{random.randint(1, 5)}00mg"
        frequency = random.choice(
            ["Günde 1 kez", "Günde 2 kez", "Günde 3 kez", "İhtiyaç halinde"])

        # Tıbbi notlar
        medical_notes = random.choice(NOTES)

        health_records.append({
            "patient_id": patient_id,
            "disease": disease,
            "diagnosis_date": diagnosis_date.date(),
            "medication": medication,
            "medication_dosage": dosage,
            "medication_frequency": frequency,
            "medical_notes": medical_notes
        })

    return health_records


def insert_health_history(health_records):
    """Sağlık geçmişi kayıtlarını veritabanına ekler"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()

        for record in health_records:
            cursor.execute("""
                INSERT INTO health_history 
                (patient_id, disease, diagnosis_date, medication, medication_dosage, medication_frequency, medical_notes)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                record["patient_id"],
                record["disease"],
                record["diagnosis_date"],
                record["medication"],
                record["medication_dosage"],
                record["medication_frequency"],
                record["medical_notes"]
            ))

        conn.commit()
        print(f"{len(health_records)} sağlık geçmişi kaydı başarıyla eklendi.")

    except Exception as e:
        print(f"Kayıt ekleme hatası: {e}")
    finally:
        if conn:
            conn.close()


def main():
    # Tabloyu oluştur
    create_health_history_table()

    # Mevcut hastaları al
    patients = get_existing_patients()

    # Her hasta için sağlık geçmişi oluştur
    for patient in patients:
        registration_date = patient["created_at"]
        health_records = generate_health_history(
            patient["id"], registration_date)

        if health_records:
            insert_health_history(health_records)


if __name__ == "__main__":
    main()
