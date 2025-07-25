from datetime import datetime
from typing import Optional, Dict, List, Any


class Patient:
    """
    Hasta bilgilerini taşıyan sınıf.
    SQLAlchemy yerine basit bir veri sınıfı olarak uygulanmıştır.
    """

    def __init__(self,
                 tc_number: str = None,
                 name: str = None,
                 email: str = None,
                 phone: str = None,
                 date_of_birth: datetime = None,
                 gender: str = None,
                 address: str = None,
                 emergency_contact: Dict = None,
                 id: int = None,
                 symptoms: str = None,
                 medical_history: str = None):

        self.id = id
        self.tc_number = tc_number
        self.name = name
        self.email = email
        self.phone = phone
        self.date_of_birth = date_of_birth
        self.gender = gender
        self.address = address
        self.emergency_contact = emergency_contact or {}
        self.symptoms = symptoms
        self.medical_history = medical_history
        self.created_at = datetime.now()
        self.updated_at = datetime.now()

    def get_details(self) -> str:
        """Hasta detaylarını döndürür"""
        return f"TC: {self.tc_number}, İsim: {self.name}, Yaş: {self._calculate_age()}"

    def set_details(self, details: Dict[str, Any]) -> None:
        """Hasta detaylarını günceller"""
        for key, value in details.items():
            if hasattr(self, key):
                setattr(self, key, value)
        self.updated_at = datetime.now()

    def _calculate_age(self) -> int:
        """Yaş hesaplar"""
        if not self.date_of_birth:
            return 0
        today = datetime.now()
        return today.year - self.date_of_birth.year - ((today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day))

    def to_dict(self) -> Dict[str, Any]:
        """Sınıfı sözlük biçimine dönüştürür"""
        return {
            "id": self.id,
            "tc_number": self.tc_number,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "date_of_birth": self.date_of_birth.isoformat() if self.date_of_birth else None,
            "gender": self.gender,
            "address": self.address,
            "emergency_contact": self.emergency_contact,
            "symptoms": self.symptoms,
            "medical_history": self.medical_history
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Patient':
        """Sözlükten Patient nesnesi oluşturur"""
        if "date_of_birth" in data and isinstance(data["date_of_birth"], str):
            try:
                data["date_of_birth"] = datetime.fromisoformat(
                    data["date_of_birth"])
            except ValueError:
                data["date_of_birth"] = None

        return cls(**data)
