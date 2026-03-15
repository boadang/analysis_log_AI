import asyncio

active_fw_streams = {}

def start_stream(fw_id: str):
    active_fw_streams[fw_id] = True
    
def stop_stream(fw_id: str):
    if fw_id in active_fw_streams:
        active_fw_streams[fw_id] = False
        
def is_running(fw_id: str) -> bool:
    return active_fw_streams.get(fw_id, False)