"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { EMOJIS } from "@/lib/emojis";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { ChatMessage } from "@/types";

interface StreamMessage {
  type: "chat_stream";
  payload: {
    message_id: string;
    content: string;
    done: boolean;
  };
}

export default function CoachPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Greetings. I am your AI Coach. I know your protocols, your goals, and your weaknesses. Speak freely - I will not judge, only optimize.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentMessageIdRef = useRef<string | null>(null);

  // WebSocket for streaming
  const { isConnected, send, addMessageHandler } = useWebSocket({
    autoReconnect: true,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  // Handle streaming messages from WebSocket
  const handleStreamMessage = useCallback((msg: StreamMessage) => {
    if (msg.type === "chat_stream") {
      if (msg.payload.done) {
        // Streaming complete - add full message to list
        setMessages((prev) => {
          const existingIndex = prev.findIndex((m) => m.id === msg.payload.message_id);
          if (existingIndex >= 0) {
            // Update existing message
            const updated = [...prev];
            updated[existingIndex] = {
              ...updated[existingIndex],
              content: msg.payload.content,
            };
            return updated;
          }
          // Add new message
          return [
            ...prev,
            {
              id: msg.payload.message_id,
              role: "assistant",
              content: msg.payload.content,
              timestamp: new Date().toISOString(),
            },
          ];
        });
        setStreamingContent("");
        setIsLoading(false);
        currentMessageIdRef.current = null;
      } else {
        // Update streaming content
        setStreamingContent(msg.payload.content);
      }
    }
  }, []);

  // Subscribe to streaming messages
  useEffect(() => {
    const unsubscribe = addMessageHandler((msg) => {
      if (msg.type === "chat_stream") {
        handleStreamMessage(msg as StreamMessage);
      }
    });
    return () => { unsubscribe(); };
  }, [addMessageHandler, handleStreamMessage]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setStreamingContent("");

    const messageId = `msg_${Date.now()}`;
    currentMessageIdRef.current = messageId;

    try {
      // Try WebSocket streaming first if connected
      if (isConnected) {
        const sent = send({
          type: "chat_request",
          payload: {
            message: userMessage.content,
            message_id: messageId,
            history: messages.slice(-10), // Send last 10 messages for context
          },
        });

        if (!sent) {
          throw new Error("Failed to send via WebSocket");
        }

        // Wait for streaming to complete (max 30 seconds)
        await new Promise((resolve) => setTimeout(resolve, 30000));
        
        // If still loading after timeout, fall back to HTTP
        if (isLoading) {
          throw new Error("Streaming timeout");
        }
      } else {
        throw new Error("WebSocket not connected");
      }
    } catch (error) {
      // Fallback to HTTP API
      console.log("[Coach] Falling back to HTTP API");
      try {
        const response = await api.chatWithAI(userMessage.content, messages);
        
        setMessages((prev) => [
          ...prev,
          {
            id: messageId,
            role: "assistant",
            content: response.response,
            timestamp: new Date().toISOString(),
          },
        ]);
      } catch (httpError) {
        console.error("Failed to get AI response:", httpError);
        setMessages((prev) => [
          ...prev,
          {
            id: messageId,
            role: "assistant",
            content: "I apologize, but I'm having trouble connecting to my neural network. Please try again.",
            timestamp: new Date().toISOString(),
          },
        ]);
      } finally {
        setIsLoading(false);
        setStreamingContent("");
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startVoiceRecording = () => {
    setIsRecording(true);
    // Simulate voice recording
    setTimeout(() => {
      setIsRecording(false);
      setInput("I need help with my morning routine");
    }, 2000);
  };

  return (
    <div className="max-w-6xl mx-auto pb-8 h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-4 mb-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <span className="text-4xl">{EMOJIS.COACH}</span>
            <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${
              isConnected ? "bg-green-500 animate-pulse" : "bg-yellow-500"
            }`} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">AI Coach</h1>
            <p className="text-sm text-secondary">
              {isConnected ? "Real-time streaming active" : "Using standard mode"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMessages([messages[0]])}
            className="px-3 py-1.5 rounded-lg bg-gray-900/50 text-sm text-muted hover:text-white transition-colors"
          >
            Clear Chat
          </button>
        </div>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 glass-card rounded-2xl p-4 mb-4 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index === messages.length - 1 ? 0 : 0 }}
                className={`flex gap-3 ${
                  message.role === "user" ? "flex-row-reverse" : ""
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${
                    message.role === "user"
                      ? "bg-gradient-to-br from-purple-500 to-cyan-500"
                      : "bg-gradient-to-br from-cyan-500 to-green-500"
                  }`}
                >
                  {message.role === "user" ? "👤" : "🤖"}
                </div>
                <div
                  className={`max-w-[80%] p-4 rounded-2xl ${
                    message.role === "user"
                      ? "bg-purple-500/20 border border-purple-500/30 rounded-tr-sm"
                      : "bg-gray-900/50 border border-border rounded-tl-sm"
                  }`}
                >
                  <p className="text-white whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs text-muted mt-2">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Streaming message */}
          {isLoading && streamingContent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-green-500 flex items-center justify-center text-lg">
                🤖
              </div>
              <div className="bg-gray-900/50 border border-cyan/30 rounded-2xl rounded-tl-sm p-4">
                <p className="text-white whitespace-pre-wrap">{streamingContent}</p>
                <span className="inline-block w-2 h-4 bg-cyan animate-pulse ml-1" />
              </div>
            </motion.div>
          )}

          {/* Loading indicator (when no streaming content yet) */}
          {isLoading && !streamingContent && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-green-500 flex items-center justify-center text-lg">
                🤖
              </div>
              <div className="bg-gray-900/50 border border-border rounded-2xl rounded-tl-sm p-4">
                <div className="flex gap-2">
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-2 h-2 bg-cyan rounded-full"
                  />
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                    className="w-2 h-2 bg-cyan rounded-full"
                  />
                  <motion.span
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                    className="w-2 h-2 bg-cyan rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-4"
      >
        <div className="flex gap-3">
          <button
            onClick={startVoiceRecording}
            disabled={isRecording || isLoading}
            className={`p-3 rounded-xl transition-all ${
              isRecording
                ? "bg-red-500/20 border-red-500/50 animate-pulse"
                : "bg-gray-900/50 border border-border hover:border-cyan/30"
            }`}
          >
            {isRecording ? "🔴" : "🎤"}
          </button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your AI Coach anything..."
              disabled={isLoading}
              className="w-full input-field pr-12"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted">
              ↵
            </span>
          </div>
          
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-500/25 transition-all"
          >
            {isLoading ? "..." : "Send"}
          </button>
        </div>

        {/* Quick suggestions */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {[
            "How do I improve discipline?",
            "Review my protocol",
            "Help with German study",
            "Analyze my week",
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setInput(suggestion)}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-full bg-gray-900/30 border border-border text-xs text-muted hover:text-white hover:border-cyan/30 whitespace-nowrap transition-colors disabled:opacity-50"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
