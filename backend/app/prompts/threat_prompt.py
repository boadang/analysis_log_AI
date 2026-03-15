# backend/app/prompts/threat_prompt.py

from typing import List

def build_threat_hunt_prompt(log_entries: List[str], user_query: str = "") -> str:
    max_lines = 1500
    joined = "\n".join(log_entries[:max_lines])

    query = user_query.strip() or (
        "Phân tích toàn bộ log và phát hiện TẤT CẢ hành vi: "
        "brute force, port scan, RDP attack, SMB unauthorized, lateral movement, "
        "data exfiltration, DNS tunneling, malware beacon, web attack. "
        "Không được bỏ sót bất kỳ dòng nào."
    )

    return f"""
Bạn là hệ thống AI chuyên phân tích log tường lửa cấp doanh nghiệp.

**YÊU CẦU ABSOLUTE (KHÔNG ĐƯỢC LÀM KHÁC):**
1. PHẢI phân tích **từng dòng log** một cách độc lập.
2. Output PHẢI bao gồm **TOÀN BỘ các dòng log**, kể cả dòng an toàn.
3. Mỗi dòng log phải tạo thành MỘT OBJECT TRONG MẢNG JSON.
4. Không được gộp kết quả, không được bỏ sót.
5. Không được giải thích dài dòng. Không được trả thêm text ngoài JSON.
6. Output PHẢI LÀ DUY NHẤT một **JSON array hợp lệ**.

---

### CẤU TRÚC OUTPUT BẮT BUỘC CHO TỪNG DÒNG:
Mỗi dòng log phải được chuyển thành object:

{{
    "timestamp": "YYYY-MM-DD HH:MM:SS",
    "source_ip": "string",
    "dest_ip": "string",
    "protocol": "string",
    "action": "string",

    "is_threat": true/false,              ← phân loại
    "threat_type": "Tên threat hoặc 'None'",
    "ai_confidence": số 0-100,            ← bạn cần dự đoán tỉ lệ tin cậy
    "evidence": "giải thích ngắn gọn"      ← tối đa 1–2 câu
}}

---

### CÁCH PHÂN LOẠI:
- Nếu dòng log chứa dấu hiệu tấn công → is_threat = true  
- Nếu hoàn toàn bình thường → is_threat = false + threat_type = "None"

---

### QUAN TRỌNG:
- **Không được bỏ qua bất kỳ dòng nào**.
- **Không được chỉ trả phần threat** (đây là yêu cầu phân tích đầy đủ).
- **Không được suy đoán ngoài nội dung log**.
- Output phải là **DUY NHẤT một JSON array**, không có text kèm theo.

---

### User Query:
{query}

### Dữ liệu log (hãy phân tích từng dòng và ĐỀU phải đưa vào output):
{joined}
"""
