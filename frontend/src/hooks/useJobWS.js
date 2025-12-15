// frontend/src/hooks/useJobWS.js
import { useEffect, useState, useRef, useCallback } from "react";

export function useJobWS(jobId) {
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [logs, setLogs] = useState([]);
  const wsRef = useRef(null);
  const logBufferRef = useRef([]);
  const hasConnectedRef = useRef(false);
  const pingIntervalRef = useRef(null);

  const WS_BASE = "ws://127.0.0.1:8000/api/v1/ws/jobs";

  const connect = useCallback(() => {
    if (!jobId) return;
    if (hasConnectedRef.current) return;

    const token = localStorage.getItem("authToken");
    
    if (!token || token === "null" || token === "undefined") {
      console.error("[WS] ❌ No valid token");
      return;
    }

    hasConnectedRef.current = true;

    const ws = new WebSocket(`${WS_BASE}/${jobId}?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      console.log(`[WS] ✅ Connected to job=${jobId}`);
      
      // 🔥 Send ping every 25 seconds to keep connection alive
      pingIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send("ping");
        }
      }, 25000);
    };

    ws.onmessage = (event) => {
      try {
        const data = event.data;
        
        // Handle ping/pong
        if (data === "ping") {
          ws.send("pong");
          return;
        }
        if (data === "pong") {
          return;
        }
        
        // Parse JSON message
        const msg = JSON.parse(data);
        console.log(`[WS] 📨 Message:`, msg);
        setLastMessage(msg);

        // Buffer logs
        if (msg.type === "log") {
          logBufferRef.current.push(msg.line);
          if (logBufferRef.current.length >= 10) {
            setLogs((prev) => [...prev, ...logBufferRef.current]);
            logBufferRef.current = [];
          }
        }
      } catch (e) {
        console.error(`[WS] ❌ Parse error:`, e);
      }
    };

    ws.onerror = (err) => {
      console.error(`[WS] ❌ Error:`, err);
    };

    ws.onclose = (event) => {
      setConnected(false);
      wsRef.current = null;
      hasConnectedRef.current = false;
      
      // Clear ping interval
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }

      // Flush remaining logs
      if (logBufferRef.current.length > 0) {
        setLogs((prev) => [...prev, ...logBufferRef.current]);
        logBufferRef.current = [];
      }

      console.log(`[WS] 🔌 Disconnected code=${event.code} reason=${event.reason}`);
      
      if (event.code === 4001) {
        console.error("[WS] ❌ Auth failed. Please login again.");
      }
    };
  }, [jobId]);

  useEffect(() => {
    connect();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      hasConnectedRef.current = false;
    };
  }, [connect]);

  return { connected, lastMessage, logs };
}