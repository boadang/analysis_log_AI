import json
import subprocess
import tempfile

def run_fine_tuning(dataset):
    # 1. Lưu dataset vào file tạm
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jsonl", mode="w", encoding="utf-8") as f:
        for item in dataset:
            f.write(json.dumps(item) + "\n")
        dataset_path = f.name

    # 2. Gọi Ollama CLI
    cmd = [
        "ollama", "create", "firewall-analysis-model",
        "--from", "llama3.1",
        "--file", dataset_path
    ]

    subprocess.run(cmd, check=True)

    return {
        "message": "Fine-tune completed",
        "dataset_path": dataset_path,
        "model_name": "firewall-analysis-model"
    }
