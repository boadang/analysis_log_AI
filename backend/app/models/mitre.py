from sqlalchemy import Column, String, Text
from .base import Base


class MitreTechnique(Base):
    """
    MITRE ATT&CK reference table
    """

    __tablename__ = "mitre_techniques"

    id = Column(String(20), primary_key=True)  # T1059.001
    name = Column(String(255), nullable=False)
    tactic = Column(String(100), nullable=False)
    description = Column(Text)
