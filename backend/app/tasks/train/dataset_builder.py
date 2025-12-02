from .preprocessing import preprocess_logs

def build_dataset(logs):
    """Tạo dataset ở dạng instruction tuning"""
    
    cleaned = preprocess_logs(logs)
    
    dataset = []
    for item in cleaned:
        dataset.append({
            "instruction": "Analyze the following firewall log and classify it.",
            "input": item["raw"],
            "output": "..."   # output placeholder (training data sẽ điền)
        })

    return dataset
