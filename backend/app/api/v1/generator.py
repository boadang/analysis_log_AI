from backend.app.utils.random_utils import (
    random_private_ip, 
    random_threat_type,
    random_public_ip,
    random_port,
    random_protocol,
    random_action,
    now,
)
import random


def generate_log_schema(fw_id: str):
    threat = random_threat_type()
    
    #Mapping threat -> labels
    threat_labels = {
        "Normal": ["normal"],
        "DNS_Tunneling": ["malicious", "dns_tunneling"],
        "Bruteforce": ["malicious", "bruteforce"],
        "Port_Scan": ["malicious", "recon"],
        "SQL_Injection": ["malicious", "sql_injection"],
        "Malware": ["malicious", "malware"],
        "C2_Traffic": ["malicious", "command_control"],
    }
    
    #Fake AI confidence
    ai_conf = round(random.uniform(0.6, 0.99), 2)
    
    log = {
        "analysis_job_id": random.randint(1, 20),

        "timestamp": now(),
        "received_at": now(),

        "source_ip": random_private_ip(),
        "source_port": random_port(),
        "dest_ip": random_public_ip(),
        "dest_port": random_port(),
        "protocol": random_protocol(),
        "action": random_action(),

        "rule_id": f"{fw_id}-{random.randint(1000,9999)}",

        "threat_type": threat,
        "ai_confidence": ai_conf,
        "ai_labels": threat_labels.get(threat, ["unknown"]),

        "raw_log": f"Simulated firewall log for {fw_id}",
        "analyzed": True,
    }

    return log