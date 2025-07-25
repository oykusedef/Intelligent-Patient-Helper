"""
Bu script hem backend hem de frontend sunucularını aynı anda başlatır.
Kullanım: python start_app.py
"""

import subprocess
import threading
import os
import time
import sys

# Get the Python executable path
PYTHON_EXECUTABLE = sys.executable

def run_backend():
    """Backend API sunucusunu başlatır."""
    print("Backend API sunucusu başlatılıyor (8005 portu)...")
    try:
        # Install required packages first
        subprocess.run([PYTHON_EXECUTABLE, "-m", "pip", "install", "openai==1.12.0", "uvicorn", "fastapi", "psycopg2-binary"], check=True)
        
        # Start the backend server with uvicorn
        subprocess.run([PYTHON_EXECUTABLE, "-m", "uvicorn", "modified_main:app", "--host", "0.0.0.0", "--port", "8005", "--reload"], check=True)
    except Exception as e:
        print(f"Backend sunucusu başlatılırken hata: {e}")
        print("Lütfen aşağıdaki komutları manuel olarak çalıştırın:")
        print(f"{PYTHON_EXECUTABLE} -m pip install openai==1.12.0 uvicorn fastapi psycopg2-binary")
        print(f"{PYTHON_EXECUTABLE} -m uvicorn modified_main:app --host 0.0.0.0 --port 8005 --reload")

def run_frontend():
    """Frontend HTTP sunucusunu başlatır."""
    print("Frontend HTTP sunucusu başlatılıyor (8000 portu)...")
    try:
        subprocess.run([PYTHON_EXECUTABLE, "-m", "http.server", "8000"], check=True)
    except Exception as e:
        print(f"Frontend sunucusu başlatılırken hata: {e}")

def main():
    """Backend ve frontend sunucularını ayrı thread'lerde başlatır."""
    print("Intelligent Patient Helper uygulaması başlatılıyor...")
    print(f"Using Python: {PYTHON_EXECUTABLE}")
    
    # Backend thread'ini başlat
    backend_thread = threading.Thread(target=run_backend)
    backend_thread.daemon = True  # Ana program sonlandığında bu thread de sonlanır
    backend_thread.start()
    
    # Backend'in başlaması için biraz bekle
    time.sleep(2)
    
    # Frontend thread'ini başlat
    frontend_thread = threading.Thread(target=run_frontend)
    frontend_thread.daemon = True  # Ana program sonlandığında bu thread de sonlanır
    frontend_thread.start()
    
    print("\nSunucular başlatıldı!")
    print("Backend API: http://localhost:8005")
    print("Frontend: http://localhost:8000")
    print("\nUygulamayı kullanmak için tarayıcınızda http://localhost:8000/index.html adresini açın")
    print("\nUygulamayı durdurmak için Ctrl+C tuşlarına basın.\n")
    
    try:
        # Ana thread'i canlı tut
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nUygulama kapatılıyor...")

if __name__ == "__main__":
    main() 