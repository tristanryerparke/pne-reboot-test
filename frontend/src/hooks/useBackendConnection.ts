import { useState, useEffect, useCallback, useRef } from "react";

const BACKEND_URL = "http://localhost:8000";
const POLL_INTERVAL_CONNECTED = 10000; // 10 seconds when connected
const POLL_INTERVAL_DISCONNECTED = 1000; // 1 second when disconnected

export function useBackendConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const intervalRef = useRef<number | null>(null);

  const checkConnection = useCallback(async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });

      if (response.ok) {
        const data = await response.json();
        setIsConnected(data.status === "ok");
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    checkConnection();

    const setupInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      const pollInterval = isConnected
        ? POLL_INTERVAL_CONNECTED
        : POLL_INTERVAL_DISCONNECTED;

      intervalRef.current = setInterval(checkConnection, pollInterval);
    };

    setupInterval();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkConnection, isConnected]);

  return { isConnected, isChecking };
}
