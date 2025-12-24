import re
from typing import List, Dict, Any

class LogParser:
    """
    Chuyển raw log từ firewall / syslog thành dict có cấu trúc.
    Hỗ trợ nhiều loại firewall: FortiGate, PaloAlto, Cisco, Checkpoint
    """

    FIREWALL_PATTERNS = {
        "fortigate": r"(?P<datetime>\S+ \S+) (?P<level>\w+) (?P<src_ip>\S+) -> (?P<dst_ip>\S+) (?P<msg>.+)",
        "paloalto": r"(?P<datetime>\S+) (?P<type>\w+) (?P<src_ip>\S+) (?P<dst_ip>\S+) (?P<msg>.+)",
        "cisco": r"(?P<datetime>\S+) (?P<facility>\S+) (?P<msg>.+)",
        "checkpoint": r"(?P<datetime>\S+) (?P<msg>.+)",
    }

    @staticmethod
    def parse(raw_log: str, firewall_type: str = "fortigate") -> Dict[str, Any]:
        """
        Parse một dòng log thành dict.
        Nếu không match pattern, trả về raw log trong field 'raw'.
        """
        pattern = LogParser.FIREWALL_PATTERNS.get(firewall_type.lower())
        if not pattern:
            return {"raw": raw_log}

        match = re.match(pattern, raw_log)
        if match:
            return match.groupdict()
        else:
            return {"raw": raw_log}

    @staticmethod
    def parse_batch(logs: List[str], firewall_type: str = "fortigate") -> List[Dict[str, Any]]:
        """
        Parse một batch log
        """
        return [LogParser.parse(line, firewall_type) for line in logs]

    @staticmethod
    def parse_raw_log(raw_log: str):
        if not raw_log:
            return {}

        return {
            "time": re.search(r"\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}", raw_log).group(0)
                if re.search(r"\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}", raw_log) else None,
            "action": re.search(r"action=(\w+)", raw_log).group(1)
                if re.search(r"action=(\w+)", raw_log) else "unknown",
            "src": re.search(r"src=([\d\.]+)", raw_log).group(1)
                if re.search(r"src=([\d\.]+)", raw_log) else None,
            "threat": "Firewall Event"
        }
        
logParser = LogParser()