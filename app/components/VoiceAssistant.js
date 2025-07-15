'use client';

import { useState, useEffect, useRef } from 'react';
import Vapi from '@vapi-ai/web';

export default function VoiceAssistant() {
  const ORANGE = '#E5703A';
  const [isListening, setIsListening] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const MAX_RETRIES = 2;
  const vapiRef = useRef(null);

  // Initialize Vapi SDK on mount
  useEffect(() => {
    const setupVapi = async () => {
      try {
        // Get environment variables
        const vapiKey = process.env.NEXT_PUBLIC_VAPI_KEY;
        const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;

        if (!vapiKey || !assistantId) {
          throw new Error('Missing Vapi credentials');
        }

        // Initialize Vapi instance
        const vapi = new Vapi(vapiKey);
        vapiRef.current = vapi;

        // Set up event handlers
        setupEventHandlers(vapi);
        
        setIsConfigured(true);
        setErrorMessage('');

      } catch (error) {
        console.error('❌ Vapi setup error:', error);
        setErrorMessage(`Setup failed: ${error.message}`);
        setIsConfigured(false);
      }
    };

    setupVapi();

    // Cleanup function
    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop();
        vapiRef.current = null;
      }
    };
  }, []);

  // Set up all Vapi event handlers
  const setupEventHandlers = (vapi) => {
    // call-start: set listening state
    vapi.on('call-start', () => {
      setIsListening(true);
      setErrorMessage('');
      setRetryCount(0);
    });

    // call-end: reset listening state
    vapi.on('call-end', () => {
      setIsListening(false);
      setErrorMessage('');
    });

    // speech-start: user started speaking
    vapi.on('speech-start', () => {
      // User is speaking - no action needed
    });

    // speech-end: user stopped speaking
    vapi.on('speech-end', () => {
      // Processing - no action needed
    });

    // message: handle different message types
    vapi.on('message', (message) => {
      // Handle messages silently - no console spam
    });

    // error: display error message and retry logic
    vapi.on('error', (error) => {
      console.error('🛑 Vapi error:', error);
      setIsListening(false);
      
      const errorMsg = error?.message || error?.errorMsg || 'Unknown error';
      
      // Auto-retry logic for transient errors
      if (shouldRetry(errorMsg) && retryCount < MAX_RETRIES) {
        const newRetryCount = retryCount + 1;
        setRetryCount(newRetryCount);
        setErrorMessage(`Retrying... (${newRetryCount}/${MAX_RETRIES})`);
        
        setTimeout(() => {
          startCall();
        }, 1000);
      } else {
        // Max retries reached or non-retryable error
        setErrorMessage(`Error: ${errorMsg}`);
        setRetryCount(0);
      }
    });

    // Volume level - silent handling
    vapi.on('volume-level', (level) => {
      // Handle volume silently
    });
  };

  // Determine if error should trigger retry
  const shouldRetry = (errorMsg) => {
    const retryableErrors = [
      'network',
      'connection',
      'timeout',
      'meeting has ended',
      'websocket',
      'failed to connect'
    ];
    
    return retryableErrors.some(keyword => 
      errorMsg.toLowerCase().includes(keyword)
    );
  };

  // Start a new call
  const startCall = async () => {
    if (!vapiRef.current || !isConfigured) {
      setErrorMessage('Not configured');
      return;
    }

    try {
      const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;
      setErrorMessage('');
      await vapiRef.current.start(assistantId);
      
    } catch (error) {
      console.error('💥 Start call failed:', error);
      setErrorMessage(`Failed to start: ${error.message}`);
      setIsListening(false);
    }
  };

  // Stop the current call
  const stopCall = () => {
    if (vapiRef.current) {
      vapiRef.current.stop();
    }
  };

  // Handle main button click
  const toggleListening = () => {
    if (isListening) {
      stopCall();
    } else {
      startCall();
    }
  };

  // Handle close button click
  const stopListening = () => {
    stopCall();
  };

  return (
    <>
      {/* Wave animations styles */}
      <style jsx>{`
        @keyframes wave { 
          0% { transform: scale(1); opacity: 0.35; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes bounce { 
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .wave { animation: wave 1.8s ease-out infinite; }
        .bounce { animation: bounce 2.4s ease-in-out infinite; }
      `}</style>

      {/* Fixed positioning at bottom center */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[99999]">
        <div className="relative">
          
          {/* Background waves (only visible when configured) */}
          {isConfigured && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {[0, 1, 2].map(i => (
                <span 
                  key={i} 
                  className="wave absolute w-20 h-20 rounded-full border"
                  style={{
                    borderColor: ORANGE,
                    animationDelay: `${i * 0.6}s`
                  }}
                />
              ))}
            </div>
          )}

          {/* Active waves when listening (more pronounced) */}
          {isListening && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {[0, 1, 2].map(i => (
                <span 
                  key={i} 
                  className="wave absolute w-20 h-20 rounded-full border-2"
                  style={{
                    borderColor: ORANGE,
                    animationDelay: `${i * 0.3}s`
                  }}
                />
              ))}
            </div>
          )}

          {/* Main microphone button */}
          <button
            onClick={toggleListening}
            disabled={!isConfigured}
            className={`relative w-20 h-20 rounded-full flex items-center justify-center text-white transition-transform duration-300 ease-out focus:outline-none focus:ring-4 focus:ring-orange-300 ${
              isListening 
                ? 'scale-105 shadow-lg' 
                : 'hover:scale-105 bounce'
            } ${
              !isConfigured ? 'cursor-not-allowed' : ''
            }`}
            style={{
              background: ORANGE
            }}
            aria-label={isListening ? 'Stop voice assistant' : 'Start voice assistant'}
            tabIndex={0}
          >
            {isListening ? (
              // Speaker icon when listening
              <svg className="w-8 h-8 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            ) : (
              // Microphone icon when idle
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 14a4 4 0 004-4V5a4 4 0 10-8 0v5a4 4 0 004 4zm6-4v1a6 6 0 01-12 0v-1m6 6v4m-4 0h8" />
              </svg>
            )}
          </button>

          {/* Close button when listening */}
          {isListening && (
            <button 
              aria-label="Stop listening"
              onClick={stopListening}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full text-white text-xs flex items-center justify-center shadow hover:opacity-80 transition-opacity"
              style={{ backgroundColor: ORANGE }}
            >
              ×
            </button>
          )}

          {/* Error message tooltip (only shows when there's an error) */}
          {errorMessage && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max px-2 py-1 text-xs rounded shadow-lg bg-red-600 text-white">
              {errorMessage}
            </div>
          )}
        </div>
      </div>
    </>
  );
} 