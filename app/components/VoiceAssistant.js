'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Vapi from '@vapi-ai/web';

export default function VoiceAssistant() {
  const ORANGE = '#E5703A';
  
  // Core states
  const [isListening, setIsListening] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Conversation flow states
  const [conversationState, setConversationState] = useState('idle'); // idle, greeting, active, ending
  const [lastUserMessage, setLastUserMessage] = useState('');
  const [conversationContext, setConversationContext] = useState([]);
  const [silenceTimer, setSilenceTimer] = useState(null);
  const [isFirstActivation, setIsFirstActivation] = useState(true);
  
  const MAX_RETRIES = 2;
  const vapiRef = useRef(null);
  const processingTimeoutRef = useRef(null);
  const silenceTimeoutRef = useRef(null);
  const endingTimeoutRef = useRef(null);
  const audioContextRef = useRef(null);

  // Sound effects
  const playSound = useCallback((frequency, duration = 100) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration / 1000);
    } catch (error) {
      // Silent fail for sound effects
    }
  }, []);

  // Clear all timers
  const clearAllTimers = useCallback(() => {
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (endingTimeoutRef.current) {
      clearTimeout(endingTimeoutRef.current);
      endingTimeoutRef.current = null;
    }
  }, []);

  // Initialize Vapi SDK on mount
  useEffect(() => {
    const setupVapi = async () => {
      try {
        const vapiKey = process.env.NEXT_PUBLIC_VAPI_KEY;
        const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID;

        if (!vapiKey || !assistantId) {
          throw new Error('Missing Vapi credentials');
        }

        const vapi = new Vapi(vapiKey);
        vapiRef.current = vapi;
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

    return () => {
      clearAllTimers();
      if (vapiRef.current) {
        vapiRef.current.stop();
        vapiRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [clearAllTimers]);

  // Enhanced event handlers with conversation flow
  const setupEventHandlers = useCallback((vapi) => {
    // Call started
    vapi.on('call-start', () => {
      setIsListening(true);
      setErrorMessage('');
      setRetryCount(0);
      clearAllTimers();
      playSound(800, 150); // Start sound
      
      if (isFirstActivation) {
        setConversationState('greeting');
        setIsFirstActivation(false);
      } else {
        setConversationState('active');
      }
    });

    // Call ended
    vapi.on('call-end', () => {
      setIsListening(false);
      setIsProcessing(false);
      setErrorMessage('');
      setConversationState('idle');
      clearAllTimers();
      playSound(600, 150); // End sound
    });

    // User started speaking
    vapi.on('speech-start', () => {
      setIsProcessing(false);
      clearAllTimers();
      setConversationState('active');
    });

    // User stopped speaking
    vapi.on('speech-end', () => {
      setIsProcessing(true);
      
      // Start processing timeout for spinner
      processingTimeoutRef.current = setTimeout(() => {
        setIsProcessing(true);
      }, 300);
      
      // Only set a long silence timer (30 seconds) for true inactivity
      silenceTimeoutRef.current = setTimeout(() => {
        if (isListening && conversationState !== 'ending') {
          // Don't end conversation, just offer to help
          console.log('Long silence detected - offering help');
        }
      }, 30000);
    });

    // Message handling with context
    vapi.on('message', (message) => {
      if (message.type === 'transcript' && message.transcript) {
        const transcript = message.transcript.trim();
        
        // Store user messages for context
        if (message.role === 'user') {
          setLastUserMessage(transcript);
          setConversationContext(prev => [...prev.slice(-4), { role: 'user', content: transcript }]);
          
          // Only check for explicit goodbye messages - don't auto-end on "thank you"
          if (isExplicitGoodbye(transcript)) {
            handleGoodbye();
          }
        }
        
        // Store assistant messages for context
        if (message.role === 'assistant') {
          setConversationContext(prev => [...prev.slice(-4), { role: 'assistant', content: transcript }]);
          
          // Don't auto-end conversations - let them flow naturally
          clearAllTimers();
        }
      }
      
      setIsProcessing(false);
      clearTimeout(processingTimeoutRef.current);
    });

    // Error handling
    vapi.on('error', (error) => {
      console.error('🛑 Vapi error:', error);
      setIsListening(false);
      setIsProcessing(false);
      clearAllTimers();
      
      const errorMsg = error?.message || error?.errorMsg || 'Unknown error';
      
      if (shouldRetry(errorMsg) && retryCount < MAX_RETRIES) {
        const newRetryCount = retryCount + 1;
        setRetryCount(newRetryCount);
        setErrorMessage(`Retrying... (${newRetryCount}/${MAX_RETRIES})`);
        
        setTimeout(() => {
          startCall();
        }, 1000);
      } else {
        setErrorMessage(`Error: ${errorMsg}`);
        setRetryCount(0);
      }
    });

    vapi.on('volume-level', (level) => {
      // Silent volume handling
    });
  }, [isFirstActivation, retryCount, playSound, clearAllTimers, isListening, conversationState]);

  // Handle silence with contextual prompts
  const handleSilence = useCallback(() => {
    if (!isListening || conversationState === 'ending') return;
    
    // Generate contextual follow-up based on last user message
    const followUp = generateContextualPrompt(lastUserMessage, conversationContext);
    
    // Send follow-up through Vapi
    if (vapiRef.current && followUp) {
      // Note: This would need to be implemented based on your Vapi assistant configuration
      // For now, we'll just show it in the UI
      console.log('Contextual follow-up:', followUp);
    }
  }, [isListening, conversationState, lastUserMessage, conversationContext]);

  // Generate contextual prompts
  const generateContextualPrompt = (lastMessage, context) => {
    if (!lastMessage) {
      return "What can I help you with regarding Mardi Holding?";
    }
    
    const lowerMessage = lastMessage.toLowerCase();
    
    if (lowerMessage.includes('project') || lowerMessage.includes('development')) {
      return "I'd be happy to tell you about our projects. Are you interested in residential or commercial developments?";
    }
    if (lowerMessage.includes('contact') || lowerMessage.includes('reach')) {
      return "I can help you get in touch with the right person. What specifically would you like to discuss?";
    }
    if (lowerMessage.includes('service') || lowerMessage.includes('offer')) {
      return "We offer comprehensive real estate services. Are you looking to buy, sell, or invest in property?";
    }
    if (lowerMessage.includes('location') || lowerMessage.includes('where')) {
      return "Are you asking about our office locations or project locations?";
    }
    if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
      return "I can help with pricing information. Which specific project or service are you interested in?";
    }
    
    return "I'm here to help with any questions about Mardi Holding. What would you like to know more about?";
  };

  // Check for explicit goodbye messages only
  const isExplicitGoodbye = (message) => {
    const explicitGoodbyes = ['goodbye', 'bye bye', 'see you later', 'talk to you later', 'that\'s all for now'];
    const lowerMessage = message.toLowerCase();
    return explicitGoodbyes.some(phrase => lowerMessage.includes(phrase));
  };

  // Handle goodbye
  const handleGoodbye = useCallback(() => {
    setConversationState('ending');
    clearAllTimers();
    
    // Send goodbye message and end call after a moment
    setTimeout(() => {
      if (vapiRef.current) {
        vapiRef.current.stop();
      }
    }, 2000);
  }, [clearAllTimers]);

  // Retry logic
  const shouldRetry = (errorMsg) => {
    const retryableErrors = ['network', 'connection', 'timeout', 'meeting has ended', 'websocket', 'failed to connect'];
    return retryableErrors.some(keyword => errorMsg.toLowerCase().includes(keyword));
  };

  // Start call
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

  // Stop call
  const stopCall = () => {
    if (vapiRef.current) {
      vapiRef.current.stop();
    }
    clearAllTimers();
  };

  // Handle button clicks
  const toggleListening = () => {
    if (isListening) {
      stopCall();
    } else {
      startCall();
    }
  };

  const stopListening = () => {
    stopCall();
  };

  return (
    <>
      {/* Enhanced wave animations */}
      <style jsx>{`
        @keyframes wave { 
          0% { transform: scale(1); opacity: 0.35; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes bounce { 
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .wave { animation: wave 1.8s ease-out infinite; }
        .bounce { animation: bounce 2.4s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
        .spin { animation: spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
        .pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
        
        /* All transitions use cubic-bezier */
        .smooth-transition {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
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
                  className="wave absolute w-20 h-20 rounded-full border smooth-transition"
                  style={{
                    borderColor: ORANGE,
                    animationDelay: `${i * 0.6}s`
                  }}
                />
              ))}
            </div>
          )}

          {/* Active waves when listening */}
          {isListening && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {[0, 1, 2].map(i => (
                <span 
                  key={i} 
                  className="wave absolute w-20 h-20 rounded-full border-2 smooth-transition"
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
            className={`relative w-20 h-20 rounded-full flex items-center justify-center text-white smooth-transition focus:outline-none focus:ring-4 ${
              isListening 
                ? 'scale-105 shadow-lg' 
                : 'hover:scale-105 bounce'
            } ${
              !isConfigured ? 'cursor-not-allowed' : ''
            }`}
            style={{
              background: ORANGE,
              focusRingColor: `${ORANGE}40`
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
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full text-white text-xs flex items-center justify-center shadow hover:opacity-80 smooth-transition"
              style={{ backgroundColor: ORANGE }}
            >
              ×
            </button>
          )}

          {/* Enhanced status tooltip with spinner */}
          {(errorMessage || isProcessing) && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max px-3 py-2 text-xs rounded-lg shadow-lg smooth-transition"
                 style={{ 
                   backgroundColor: errorMessage ? '#DC2626' : '#374151',
                   color: 'white'
                 }}>
              <div className="flex items-center gap-2">
                {isProcessing && !errorMessage && (
                  <div className="w-3 h-3 border border-white border-t-transparent rounded-full spin"></div>
                )}
                <span>
                  {errorMessage || (isProcessing ? 'Processing...' : '')}
                </span>
              </div>
            </div>
          )}

          {/* Conversation state indicator */}
          {conversationState === 'greeting' && (
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-max px-3 py-1 text-xs rounded-lg shadow-lg smooth-transition"
                 style={{ backgroundColor: ORANGE, color: 'white' }}>
              Starting conversation...
            </div>
          )}
        </div>
      </div>
    </>
  );
} 