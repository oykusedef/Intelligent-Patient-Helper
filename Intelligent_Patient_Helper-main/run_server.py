import subprocess
import threading
import time

def run_api_server():
    """
    FastAPI sunucusunu başlatır
    """
    print("FastAPI sunucusu başlatılıyor (port 8005)...")
    subprocess.run(["python", "modified_main.py"], check=True)

def run_http_server():
    """
    HTTP dosya sunucusunu başlatır
    """
    print("HTTP dosya sunucusu başlatılıyor (port 8000)...")
    subprocess.run(["python", "-m", "http.server", "8000"], check=True)

if __name__ == "__main__":
    print("İki sunucu da başlatılıyor...")
    
    # İki sunucuyu ayrı thread'lerde başlat
    api_thread = threading.Thread(target=run_api_server)
    http_thread = threading.Thread(target=run_http_server)
    
    api_thread.daemon = True
    http_thread.daemon = True
    
    api_thread.start()
    http_thread.start()
    
    try:
        # Ana thread çalışmaya devam etsin
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nSunucular durduruluyor...")
        print("Programdan çıkılıyor. Ctrl+C ile sunucu durduruldu.") 