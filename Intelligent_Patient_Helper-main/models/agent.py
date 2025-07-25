from typing import Optional, Dict, Any
from models.patient import Patient


class Agent:
    """
    Tüm ajanlar için temel sınıf.
    """

    def __init__(self, agent_name: str):
        self.agent_name = agent_name

    def process(self, patient: Optional[Patient] = None) -> None:
        """
        Ana işlem metodu. Her ajan kendi uygulamasını sağlayacak.

        Args:
            patient (Patient, optional): İşlenecek hasta nesnesi
        """
        pass  # Her ajan kendi mantığını uygulayacak
