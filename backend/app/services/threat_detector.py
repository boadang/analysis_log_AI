# backend/app/services/threat_detector.py
import re
from typing import Dict, Any, List

class ThreatDetector:
    """
    Phát hiện các mối đe dọa cơ bản từ log đã parse.
    Có thể mở rộng rules theo nhu cầu.
    """

    THREAT_RULES = {
        "SQL Injection": r"(UNION|SELECT|DROP|INSERT|OR 1=1|--)",
        "Local File Inclusion": r"(\.\./\.\./|\.\./)",
        "Remote Command Execution": r"(;|&&|\|\||`|system\()",
        "Suspicious URL": r"(http[s]?://[^\s]+)",
        "XSS": r"(<script>|</script>|javascript:)",
    }

    @staticmethod
    def detect(parsed_log: Dict[str, Any], raw_log: str = "") -> Dict[str, Any]:
        """
        Trả về dict gồm:
        {
            'threats': [list threat name],
            'details': {threat_name: snippet detected}
        }
        """
        threats_found: List[str] = []
        details: Dict[str, str] = {}

        # check each rule
        for threat_name, pattern in ThreatDetector.THREAT_RULES.items():
            if re.search(pattern, raw_log, re.IGNORECASE):
                threats_found.append(threat_name)
                details[threat_name] = raw_log[:200]  # chỉ lấy preview

        return {"threats": threats_found, "details": details}

    @staticmethod
    def detect_batch(parsed_logs: List[Dict[str, Any]], raw_logs: List[str]) -> List[Dict[str, Any]]:
        """
        Detect threats cho batch log
        """
        results = []
        for parsed, raw in zip(parsed_logs, raw_logs):
            results.append(ThreatDetector.detect(parsed, raw))
        return results
