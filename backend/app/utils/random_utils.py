import random
import time
from datetime import datetime, timezone

def random_private_ip():
    return f"192.168.{random.randint(0,255)}.{random.randint(1,254)}"

def random_public_ip():
    return f"{random.randint(1,223)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,254)}"

def random_port():
    return random.randint(1024, 65535)

def random_protocol():
    return random.choice(["TCP", "UDP", "ICMP"])

def random_action():
    return random.choice(["ALLOW", "DENY", "DROP", "REJECT"])

def random_rule_id():
    return f"RULE-{random.randint(1000,9999)}"

def random_threat_type():
    return random.choice([
        "Normal",
        "DNS_Tunneling",
        "Bruteforce",
        "Port_Scan",
        "SQL_Injection",
        "Malware",
        "C2_Traffic",
    ])

def random_ai_labels():
    labels = ["Malware", "Phishing", "DDoS", "Brute Force", "Data Exfiltration", "Botnet", "Ransomware"]
    return random.sample(labels, k=random.randint(1,3))

def random_ai_confidence():
    return round(random.uniform(0.5, 1.0), 2)

def now():
    return datetime.now(timezone.utc)