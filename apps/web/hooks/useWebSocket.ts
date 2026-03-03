"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://127.0.0.1:3000";

function buildWebSocketUrl() {
  const url = new URL(GATEWAY_URL);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/api/ws";
  return url.toString();
}

export type WsMessage =
  | { type: "auth"; payload: { token: string } }
  | { type: "ping" }
  | { type: "pong" }
  | { type: "notification"; payload: { title: string; body: string; level: string } }
  | { type: "stats_update"; payload: { xp: number; level: number; streak: number } }
  | { type: "protocol_complete"; payload: { date: string; score: number } }
  | { type: "challenge_progress"; payload: { challenge_id: string; day: number; completed: boolean } }
  | { type: "subscribe"; payload: { channel: string } }
  | { type: "unsubscribe"; payload: { channel: string } }
  | { type: "error"; payload: { code: string; message: string } }
  | { type: "chat_stream"; payload: { message_id: string; content: string; done: boolean } }
  | { type: "chat_request"; payload: { message: string; message_id: string; history: unknown[] } };

type MessageHandler = (_msg: WsMessage) => void;

interface UseWebSocketOptions {
  onMessage?: MessageHandler;
  onConnect?: () => void;
  onDisconnect?: () => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    autoReconnect = true,
    reconnectInterval = 3000,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageHandlersRef = useRef<Set<MessageHandler>>(new Set());
  const connectingRef = useRef(false);

  // Add message handler
  const addMessageHandler = useCallback((handler: MessageHandler) => {
    messageHandlersRef.current.add(handler);
    return () => messageHandlersRef.current.delete(handler);
  }, []);

  // Remove message handler
  const removeMessageHandler = useCallback((handler: MessageHandler) => {
    messageHandlersRef.current.delete(handler);
  }, []);

  // Send message
  const send = useCallback((msg: WsMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
      return true;
    }
    return false;
  }, []);

  // Subscribe to channel
  const subscribe = useCallback((channel: string) => {
    return send({ type: "subscribe", payload: { channel } });
  }, [send]);

  // Unsubscribe from channel
  const unsubscribe = useCallback((channel: string) => {
    return send({ type: "unsubscribe", payload: { channel } });
  }, [send]);

  // Authenticate
  const authenticate = useCallback((token: string) => {
    return send({ type: "auth", payload: { token } });
  }, [send]);

  // Connect
  const connect = useCallback(() => {
    if (typeof window === "undefined" || connectingRef.current) {
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    connectingRef.current = true;

    try {
      const token = localStorage.getItem("access_token");
      const url = buildWebSocketUrl();

      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log("[WebSocket] Connected");
        setIsConnected(true);
        connectingRef.current = false;
        onConnect?.();

        // Authenticate via message instead of URL to avoid payload size issues
        if (token) {
          ws.send(JSON.stringify({ type: "auth", payload: { token } }));
          setIsAuthenticated(true);
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg: WsMessage = JSON.parse(event.data);

          if (msg.type === "notification" && msg.payload.title === "Connected") {
            setIsAuthenticated(true);
          }

          // Call registered handlers
          messageHandlersRef.current.forEach((handler) => handler(msg));
          onMessage?.(msg);
        } catch (e) {
          console.warn("[WebSocket] Failed to parse message:", e);
        }
      };

      ws.onclose = (event) => {
        console.log("[WebSocket] Disconnected", event.code, event.reason);
        setIsConnected(false);
        setIsAuthenticated(false);
        connectingRef.current = false;
        onDisconnect?.();

        if (autoReconnect && event.code !== 1000 && event.code !== 1006) {
          reconnectTimerRef.current = setTimeout(() => {
            console.log("[WebSocket] Reconnecting...");
            connect();
          }, reconnectInterval);
        }
      };

      wsRef.current = ws;
    } catch (e) {
      console.warn("[WebSocket] Failed to connect:", e);
      connectingRef.current = false;
    }
  }, [onConnect, onDisconnect, onMessage, autoReconnect, reconnectInterval]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  // Connect on mount - avoid double connection in Strict Mode
  useEffect(() => {
    const timer = setTimeout(() => {
      connect();
    }, 100);
    return () => {
      clearTimeout(timer);
      disconnect();
    };
  }, []);

  return {
    isConnected,
    isAuthenticated,
    send,
    subscribe,
    unsubscribe,
    authenticate,
    connect,
    disconnect,
    addMessageHandler,
    removeMessageHandler,
  };
}
