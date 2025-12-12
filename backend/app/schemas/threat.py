from pydantic import BaseModel
from typing import List

class LogSourceOut(BaseModel):
    id: int
    file_name: str
    uploaded_at: str

class HuntRequest(BaseModel):
    analysis_id: int = None  # optional: if chosen from existing analysis
    # logs: List[str] = None   # optional: raw lines
    model: str = "qwen3:8b"
    query: str = ""