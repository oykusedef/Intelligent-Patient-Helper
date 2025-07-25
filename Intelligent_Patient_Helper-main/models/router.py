from typing import List, Optional
from models.agent import Agent
from models.patient import Patient


class Router:
    """
    Hastaları ilgili ajanlara yönlendiren sınıf.
    """

    def __init__(self):
        self.router_id = None  # Otomatik oluşturulacak veya atanacak
        self.agents = []  # Agent listesi

    def add_agent(self, agent: Agent) -> None:
        """
        Router'a bir ajan ekler.

        Args:
            agent (Agent): Eklenecek ajan
        """
        self.agents.append(agent)

    def route(self, patient: Optional[Patient] = None) -> None:
        """
        Hastayı uygun ajanlara yönlendirir.

        Args:
            patient (Patient, optional): Yönlendirilecek hasta
        """
        if not patient:
            print("Uyarı: Hasta bilgisi olmadan yönlendirme yapılıyor.")
            return

        print(
            f"Router: {patient.tc_number} TC numaralı hasta {len(self.agents)} ajana yönlendiriliyor.")
        for agent in self.agents:
            try:
                # Her bir ajanı hasta bilgisi ile işle
                agent.process(patient)
            except Exception as e:
                print(f"Ajan işleme hatası ({agent.agent_name}): {str(e)}")
                # Hataya rağmen diğer ajanlarla devam et
