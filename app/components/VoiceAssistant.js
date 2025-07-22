/*  app/components/VoiceAssistant.js  */
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Vapi from "@vapi-ai/web";

/* ---------- simple debug logger ---------- */
const LOG = (...args) => console.log("%c[VA]", "color:#888", ...args);
/* ----------------------------------------- */

export default function VoiceAssistant() {
  const ORANGE = "#E5703A";

  /* --- state --- */
  const [isListening, setIsListening] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [conversationState, setConversationState] = useState("idle");
  const [lastUserMessage, setLastUserMessage] = useState("");
  const [conversationContext, setConversationContext] = useState([]);
  const [isFirstActivation, setIsFirstActivation] = useState(true);

  const MAX_RETRIES = 2;

  /* --- refs --- */
  const vapiRef = useRef(null);
  const endingTimeoutRef = useRef(null);

  /* === KPI refs === */
  const latencyStatsRef = useRef([]);
  const turnStartRef = useRef(0);
  const turnNumber = useRef(0);

  /* --- helpers --- */
  const clearAllTimers = useCallback(() => {
    if (endingTimeoutRef.current) {
      clearTimeout(endingTimeoutRef.current);
      endingTimeoutRef.current = null;
    }
  }, []);

  /* --- Vapi setup --- */
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_VAPI_KEY;
    const id = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
    if (!key || !id) {
      setErrorMessage("Missing Vapi credentials");
      return;
    }

    const vapi = new Vapi(key);
    vapiRef.current = vapi;
    setupEventHandlers(vapi);
    setIsConfigured(true);

    return () => {
      clearAllTimers();
      vapi.stop();
    };
  }, [clearAllTimers]);

  /* --- Vapi event handlers --- */
  const setupEventHandlers = useCallback(
    (vapi) => {
      vapi.on("call-start", () => {
        LOG("[CALL] ➜ started");
        setIsListening(true);
        setRetryCount(0);
        setErrorMessage("");
        clearAllTimers();
        setConversationState(isFirstActivation ? "greeting" : "active");
        if (isFirstActivation) setIsFirstActivation(false);
      });

      vapi.on("call-end", () => {
        LOG("[CALL] ➜ ended");
        setIsListening(false);
        setIsProcessing(false);
        setConversationState("idle");
        clearAllTimers();
      });

      /* assistant audio starts */
      vapi.on("speech-start", () => {
        if (turnStartRef.current) {
          const dur = performance.now() - turnStartRef.current;
          latencyStatsRef.current.push(dur);
          LOG(`[LATENCY] ${dur.toFixed(0)} ms`);

          if (latencyStatsRef.current.length === 20) {
            const s = [...latencyStatsRef.current].sort((a, b) => a - b);
            const p95 = s[Math.floor(0.95 * s.length) - 1];
            LOG(`[LAT‑SUMMARY] P95 = ${p95.toFixed(0)} ms`);
            latencyStatsRef.current = [];
          }
          turnStartRef.current = 0;
        }
        LOG(`[ASSISTANT] starts – turn #${turnNumber.current}`);
        clearAllTimers();
        setIsProcessing(false);
        setConversationState("active");
      });

      /* user stopped talking */
      vapi.on("speech-end", () => {
        turnNumber.current += 1;
        LOG(`[USER] done speaking – turn #${turnNumber.current}`);
        turnStartRef.current = performance.now();
        setIsProcessing(true); // spinner immediately
      });

      /* transcripts and context */
      vapi.on("message", (msg) => {
        clearAllTimers();

        if (msg.type === "transcript" && msg.transcript) {
          const txt = msg.transcript.trim();
          LOG(
            `[TRANSCRIPT:${msg.role}] "${txt.slice(0, 80)}${
              txt.length > 80 ? "…" : ""
            }"`
          );

          if (msg.role === "user") {
            setLastUserMessage(txt);
            setConversationContext((prev) => [
              ...prev.slice(-4),
              { role: "user", content: txt },
            ]);
          }
          if (msg.role === "assistant") {
            setConversationContext((prev) => [
              ...prev.slice(-4),
              { role: "assistant", content: txt },
            ]);
            endingTimeoutRef.current = setTimeout(() => handleGoodbye(), 15000);
          }
          LOG(`[CTX] ${conversationContext.length} turns`);
        }

        setIsProcessing(false); // stop spinner
      });

      vapi.on("error", async (err) => {
        console.error("[ERROR]", err);
        setIsListening(false);
        setIsProcessing(false);
        clearAllTimers();
        const msg =
          err?.message || err?.errorMsg || "Unknown error ‑ see console";
        if (shouldRetry(msg) && retryCount < MAX_RETRIES) {
          const n = retryCount + 1;
          setRetryCount(n);
          setErrorMessage(`Retrying… (${n}/${MAX_RETRIES})`);
          setTimeout(() => startCall(), 1000);
        } else {
          setErrorMessage(`Error: ${msg}`);
          setRetryCount(0);
        }
      });
    },
    [isFirstActivation, retryCount, clearAllTimers, conversationContext.length]
  );

  /* --- misc helpers --- */
  const handleGoodbye = useCallback(() => {
    setConversationState("ending");
    clearAllTimers();
    setTimeout(() => vapiRef.current?.stop(), 2000);
  }, [clearAllTimers]);

  const shouldRetry = (m) =>
    ["network", "connection", "timeout", "websocket"].some((k) =>
      m.toLowerCase().includes(k)
    );

  /* --- call control --- */
  const startCall = async () => {
    if (!vapiRef.current || !isConfigured) {
      setErrorMessage("Not configured");
      return;
    }

    try {
      await vapiRef.current.start(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID);
    } catch (e) {
      console.error("💥 Start call failed:", e);
      setErrorMessage(e.message);
      setIsListening(false);
    }
  };

  const stopCall = () => {
    vapiRef.current?.stop();
    clearAllTimers();
  };

  const toggleListening = () => (isListening ? stopCall() : startCall());

  /* --- JSX --- */
  return (
    <>
      <style jsx>{`
        @keyframes wave {
          0% {
            transform: scale(1);
            opacity: 0.35;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        .wave {
          animation: wave 1.8s ease-out infinite;
        }
      `}</style>

      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[99999]">
        <div className="relative">
          {(isConfigured || isListening) && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className={`wave absolute w-20 h-20 rounded-full ${
                    isListening ? "border-2" : "border"
                  }`}
                  style={{ borderColor: ORANGE, animationDelay: `${i * 0.6}s` }}
                />
              ))}
            </div>
          )}

          <button
            onClick={toggleListening}
            disabled={!isConfigured}
            className={`relative w-20 h-20 rounded-full flex items-center justify-center text-white focus:outline-none ${
              isListening ? "scale-105 shadow-lg" : "hover:scale-105"
            } ${!isConfigured ? "cursor-not-allowed" : ""}`}
            style={{ background: ORANGE }}
            aria-label={
              isListening ? "Stop voice assistant" : "Start voice assistant"
            }
          >
            {isListening ? (
              <svg
                className="w-8 h-8 animate-pulse"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              </svg>
            ) : (
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 14a4 4 0 004-4V5a4 4 0 10-8 0v5a4 4 0 004 4zm6-4v1a6 6 0 01-12 0v-1m6 6v4m-4 0h8"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
