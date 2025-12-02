# Chuẩn hóa log → chuyển về JSON chuẩn
def preprocess_logs(raw_logs: list[str]):
    cleaned = []
    for line in raw_logs:
        try:
            # Clean ký tự lỗi, strip, remove timestamps dư
            line = line.strip()
            if not line:
                continue

            cleaned.append({"raw": line})
        except:
            continue
    return cleaned
