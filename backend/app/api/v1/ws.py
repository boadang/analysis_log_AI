# backend/app/api/v1/ws.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from app.database.postgres import SessionLocal
from app.models.analysis_job import AnalysisJob
from app.core.ws_manager import job_ws_manager
from app.core.security import verify_access_token
from uuid import UUID
import asyncio

router = APIRouter()

@router.websocket("/jobs/{job_id}")
async def job_ws(websocket: WebSocket, job_id: UUID):
    token = websocket.query_params.get("token")
    
    # Validate token
    if not token or token in ("null", "undefined"):
        print(f"[WS] ❌ No token for job={job_id}")
        await websocket.close(code=4001, reason="No token")
        return

    try:
        payload = verify_access_token(token)
        user_id = int(payload.get("sub"))
        print(f"[WS] ✅ Token valid user={user_id} job={job_id}")
    except Exception as e:
        print(f"[WS] ❌ Token invalid: {e}")
        await websocket.close(code=4001, reason="Invalid token")
        return

    # Accept connection
    await websocket.accept()
    print(f"[WS] Client connected to job={job_id}")
    
    db: Session = SessionLocal()

    try:
        # Verify job exists and belongs to user
        job = db.query(AnalysisJob).filter(
            AnalysisJob.id == job_id,
            AnalysisJob.created_by == user_id
        ).first()

        if not job:
            print(f"[WS] ❌ Job not found: job={job_id} user={user_id}")
            await websocket.close(code=4004, reason="Job not found")
            return

        # Register with ws_manager
        await job_ws_manager.connect(job_id, websocket)
        print(f"[WS] Registered with ws_manager for job={job_id}")

        # 🔥 KEEP-ALIVE LOOP - Don't wait for client messages
        try:
            while True:
                # Send ping every 30 seconds to keep connection alive
                try:
                    # Try to receive with timeout
                    message = await asyncio.wait_for(
                        websocket.receive_text(),
                        timeout=30.0
                    )
                    
                    # Handle pings from client (optional)
                    if message == "ping":
                        await websocket.send_text("pong")
                        
                except asyncio.TimeoutError:
                    # No message in 30s - send ping to keep alive
                    try:
                        await websocket.send_text("ping")
                    except Exception:
                        # Connection dead
                        break
                        
                except Exception:
                    # Any other error means connection is dead
                    break
                    
        except Exception as e:
            print(f"[WS] Loop error job={job_id}: {e}")

    except WebSocketDisconnect:
        print(f"[WS] Client disconnected job={job_id}")

    except Exception as e:
        print(f"[WS ERROR] job={job_id}: {e}")
        import traceback
        traceback.print_exc()

    finally:
        job_ws_manager.disconnect(job_id, websocket)
        db.close()
        print(f"[WS] 🔌 Cleanup completed for job={job_id}")