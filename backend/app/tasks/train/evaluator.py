def evaluate_model(model_name):
    # gửi 1 số câu test để đánh giá
    tests = [
        "traffic denied from src=10.0.0.5 dst=8.8.8.8",
        "admin login failed via ssh"
    ]
    
    results = []
    for t in tests:
        # dùng ollama để test output
        import subprocess, json
        
        output = subprocess.check_output(["ollama", "run", model_name, t])
        results.append({"input": t, "output": output.decode()})

    return results
