# backend/app/core/job_ws_manager.py
import asyncio
import redis.asyncio as redis
import json
import os

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
CHANNEL_PATTERN = "job:*"

class JobWSManager:
    """
    WS Manager with proper connection tracking
    """
    def __init__(self):
        self.connections = {}  # {job_id: set(websocket)}
        self.last_state = {}   # {job_id: {"status":..., "logs":[...], ...}}
        self.lock = asyncio.Lock()
        self.listener_task = None
        self.redis_client = None
        self.pubsub = None

    async def connect(self, job_id, websocket):
        """
        Register websocket connection and replay state
        """
        job_id_str = str(job_id)
        
        # 🔥 FIX: Add connection FIRST, then replay state
        async with self.lock:
            if job_id_str not in self.connections:
                self.connections[job_id_str] = set()
            self.connections[job_id_str].add(websocket)
            print(f"[WS-MGR] ✅ Registered connection for job={job_id_str}, total={len(self.connections[job_id_str])}")
        
        # 🔥 Replay state OUTSIDE lock to avoid deadlock
        state = self.last_state.get(job_id_str, {})
        
        try:
            # Status
            if "status" in state:
                await websocket.send_json({"type": "status", "status": state["status"]})
                print(f"[WS-MGR] 📤 Replayed status={state['status']}")
            
            # Logs
            logs = state.get("logs", [])
            for log_line in logs[-50:]:  # Only replay last 50 logs
                await websocket.send_json({"type": "log", "line": log_line})
            if logs:
                print(f"[WS-MGR] 📤 Replayed {min(50, len(logs))} logs")
            
            # Summary
            if "summary" in state:
                await websocket.send_json({"type": "summary", "summary": state["summary"]})
                print(f"[WS-MGR] 📤 Replayed summary")
            
            # Timeline
            if "timeline" in state:
                await websocket.send_json({"type": "timeline", "timeline": state["timeline"]})
                print(f"[WS-MGR] 📤 Replayed timeline")
            
            # Completed
            if "completed" in state:
                await websocket.send_json(state["completed"])
                print(f"[WS-MGR] 📤 Replayed completed event")
                
        except Exception as e:
            print(f"[WS-MGR] ⚠️ Error replaying state: {e}")

    async def disconnect(self, job_id, websocket):
        """
        Remove websocket connection
        """
        job_id_str = str(job_id)
        
        async with self.lock:
            if job_id_str in self.connections:
                self.connections[job_id_str].discard(websocket)
                remaining = len(self.connections[job_id_str])
                
                if remaining == 0:
                    del self.connections[job_id_str]
                    print(f"[WS-MGR] 🔌 All clients disconnected for job={job_id_str}")
                else:
                    print(f"[WS-MGR] 🔌 Client disconnected job={job_id_str}, remaining={remaining}")

    async def broadcast(self, job_id_str: str, payload: dict):
        """
        Broadcast message to all connected clients for a job
        """
        # 🔥 FIX: Quick check without lock first
        if job_id_str not in self.connections:
            print(f"[WS-MGR] ⚠️ No connections for job={job_id_str}, payload={payload.get('type')}")
            return
        
        async with self.lock:
            # Double-check inside lock
            if job_id_str not in self.connections:
                return
                
            connections = self.connections[job_id_str].copy()  # Copy to avoid modification during iteration
        
        # Broadcast OUTSIDE lock to avoid blocking
        to_remove = []
        success_count = 0
        
        for ws in connections:
            try:
                await ws.send_json(payload)
                success_count += 1
            except Exception as e:
                print(f"[WS-MGR] ❌ Send failed: {e}")
                to_remove.append(ws)
        
        # Remove dead connections
        if to_remove:
            async with self.lock:
                if job_id_str in self.connections:
                    for ws in to_remove:
                        self.connections[job_id_str].discard(ws)
        
        print(f"[WS-MGR] 📤 Broadcasted {payload.get('type')} to job={job_id_str}, sent={success_count}, failed={len(to_remove)}")

    def ws_emit(self, job_id, payload: dict):
        """
        Celery-safe emit
        """
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(self._broadcast_and_store(job_id, payload))
        except RuntimeError:
            asyncio.run(self._broadcast_and_store(job_id, payload))

    async def _broadcast_and_store(self, job_id, payload: dict):
        """
        Store state and broadcast to clients
        """
        job_id_str = str(job_id)
        
        # 🔥 Store state
        state = self.last_state.setdefault(job_id_str, {})
        
        try:
            payload_type = payload.get("type")
            
            if payload_type == "log" and "line" in payload:
                state.setdefault("logs", []).append(payload["line"])
                # Keep only last 1000 logs in memory
                if len(state["logs"]) > 1000:
                    state["logs"] = state["logs"][-1000:]
                    
            elif payload_type == "status" and "status" in payload:
                state["status"] = payload["status"]
                
            elif payload_type == "summary" and "summary" in payload:
                state["summary"] = payload["summary"]
                
            elif payload_type == "timeline" and "timeline" in payload:
                state["timeline"] = payload["timeline"]
                
            elif payload_type == "completed":
                state["completed"] = payload
                state["status"] = "completed"
                print(f"[WS-MGR] 🎉 Job {job_id_str} completed, state stored")
                
            elif payload_type == "error" and "message" in payload:
                state["status"] = "failed"
                state["error"] = payload["message"]
                
        except Exception as e:
            print(f"[WS-MGR] ❌ State store error: {e}")
            import traceback
            traceback.print_exc()

        # 🔥 Broadcast to connected clients
        await self.broadcast(job_id_str, payload)

    def broadcast_job_status(self, job_id, status):
        self.ws_emit(job_id, {"type": "status", "status": status})

    def broadcast_job_log(self, job_id, log_line):
        self.ws_emit(job_id, {"type": "log", "line": log_line})

    def broadcast_summary(self, job_id, summary):
        self.ws_emit(job_id, {"type": "summary", "summary": summary})

    def broadcast_timeline(self, job_id, timeline):
        self.ws_emit(job_id, {"type": "timeline", "timeline": timeline})

    def broadcast_completed(self, job_id, data):
        self.ws_emit(job_id, {
            "type": "completed",
            "status": "completed",
            "summary": data.get("summary", {}),
            "timeline": data.get("timeline", []),
            "stats": data.get("stats", {})
        })

    async def start_redis_listener(self):
        if self.listener_task:
            print("[WS-MGR] ⚠️ Redis listener already running")
            return
        print("[WS-MGR] 🚀 Starting Redis listener...")
        self.listener_task = asyncio.create_task(self._redis_loop())

    async def _redis_loop(self):
        try:
            self.redis_client = redis.from_url(REDIS_URL, decode_responses=True)
            self.pubsub = self.redis_client.pubsub()
            await self.pubsub.psubscribe(CHANNEL_PATTERN)
            print(f"[WS-MGR] ✅ Subscribed Redis pattern: {CHANNEL_PATTERN}")

            async for message in self.pubsub.listen():
                if message["type"] != "pmessage":
                    continue
                    
                try:
                    channel = message["channel"]
                    job_id_str = channel.split(":", 1)[1]
                    payload = json.loads(message["data"])
                    
                    print(f"[WS-MGR] 📨 Redis→WS: job={job_id_str}, type={payload.get('type')}")
                    
                    # 🔥 Process immediately without waiting
                    await self._broadcast_and_store(job_id_str, payload)
                    
                except Exception as e:
                    print(f"[WS-MGR] ❌ Message processing error: {e}")
                    import traceback
                    traceback.print_exc()
                    
        except Exception as e:
            print(f"[WS-MGR] ❌ Redis listener crashed: {e}")
            import traceback
            traceback.print_exc()

    async def stop_redis_listener(self):
        try:
            if self.listener_task:
                self.listener_task.cancel()
                try:
                    await self.listener_task
                except asyncio.CancelledError:
                    pass
                self.listener_task = None
            if self.pubsub:
                await self.pubsub.unsubscribe()
                await self.pubsub.close()
            if self.redis_client:
                await self.redis_client.close()
        except Exception as e:
            print(f"[WS-MGR] ⚠️ Cleanup error: {e}")
        print("[WS-MGR] 🛑 Redis listener stopped")


job_ws_manager = JobWSManager()