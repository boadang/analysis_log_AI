from app.services.ai_processor import AIProcessor

result = AIProcessor.analyze("192.168.1.100 - - [12/Dec/2023:10:15:30 +0000] \"Failed login attempt for user admin from")

print(result)