from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os
import json
from datetime import datetime

app = Flask(__name__)
CORS(app)  # Cross-Origin Resource Sharing etkinleştir

# Veritabanı bağlantısı
DB_PATH = 'appointments.db'

# Veritabanını oluştur
def init_db():
    if not os.path.exists(DB_PATH):
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Hastalar tablosu
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS patients (
            tc_number TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT,
            phone TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        # Randevular tablosu
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_tc TEXT NOT NULL,
            patient_name TEXT NOT NULL,
            doctor_id TEXT NOT NULL,
            doctor_name TEXT NOT NULL,
            department TEXT NOT NULL,
            appointment_date TEXT NOT NULL,
            formatted_date TEXT,
            formatted_time TEXT,
            symptoms TEXT,
            status TEXT DEFAULT 'confirmed',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_tc) REFERENCES patients (tc_number)
        )
        ''')
        
        conn.commit()
        conn.close()
        print("Veritabanı başarıyla oluşturuldu.")

# API routes
@app.route('/api/appointments/create', methods=['POST'])
def create_appointment():
    try:
        data = request.json
        
        # Gerekli alanları kontrol et
        required_fields = ['patient_tc', 'patient_name', 'doctor_id', 'doctor_name', 'department', 'appointment_date']
        for field in required_fields:
            if field not in data:
                return jsonify({"success": False, "message": f"Missing required field: {field}"}), 400
        
        # Veritabanı bağlantısı
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Hasta tablosunda yoksa ekle
        cursor.execute("SELECT * FROM patients WHERE tc_number = ?", (data['patient_tc'],))
        if not cursor.fetchone():
            cursor.execute(
                "INSERT INTO patients (tc_number, name) VALUES (?, ?)",
                (data['patient_tc'], data['patient_name'])
            )
        
        # Randevu ekle
        cursor.execute('''
        INSERT INTO appointments 
        (patient_tc, patient_name, doctor_id, doctor_name, department, appointment_date, 
        formatted_date, formatted_time, symptoms, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data['patient_tc'],
            data['patient_name'],
            data['doctor_id'],
            data['doctor_name'],
            data['department'],
            data['appointment_date'],
            data.get('formatted_date', ''),
            data.get('formatted_time', ''),
            data.get('symptoms', ''),
            data.get('status', 'confirmed')
        ))
        
        # Son eklenen randevunun ID'sini al
        appointment_id = cursor.lastrowid
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "success": True,
            "message": "Appointment created successfully",
            "appointment_id": appointment_id
        })
        
    except Exception as e:
        print(f"Error creating appointment: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

@app.route('/api/appointments/patient/<tc_number>', methods=['GET'])
def get_patient_appointments(tc_number):
    try:
        # Veritabanı bağlantısı
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row  # Dict benzeri sonuçlar için
        cursor = conn.cursor()
        
        # Hastanın randevularını al
        cursor.execute('''
        SELECT * FROM appointments 
        WHERE patient_tc = ? 
        ORDER BY appointment_date DESC
        ''', (tc_number,))
        
        appointments = []
        for row in cursor.fetchall():
            appointment = dict(row)
            appointments.append(appointment)
        
        conn.close()
        
        return jsonify({
            "success": True,
            "appointments": appointments
        })
        
    except Exception as e:
        print(f"Error fetching appointments: {e}")
        return jsonify({"success": False, "message": str(e)}), 500

# API SERVER başlat
if __name__ == '__main__':
    init_db()
    print("API server running at http://localhost:8000")
    app.run(host='0.0.0.0', port=8000, debug=True) 