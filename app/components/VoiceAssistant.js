'use client';

import { useState, useEffect } from 'react';

export default function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState('Click to start voice assistant');

  // Handle keyboard events
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.target.closest('.voice-assistant-button')) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggleListening();
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isListening]);

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      setStatus('Voice assistant stopped');
      // Here you would stop the Vapi session
    } else {
      setIsListening(true);
      setStatus('Listening... Speak now');
      // Here you would start the Vapi session
    }
  };

  const stopListening = () => {
    setIsListening(false);
    setStatus('Voice assistant stopped');
    // Here you would stop the Vapi session
  };

  return (
    <>
      {/* Fixed positioning container */}
      <div className="fixed inset-0 pointer-events-none z-50">
        {/* Centered container */}
        <div className="flex items-center justify-center min-h-screen">
          <div className="relative pointer-events-auto">
            
            {/* Pulsing wave rings (only visible when listening) */}
            {isListening && (
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Wave ring 1 */}
                <div className="absolute w-20 h-20 rounded-full border-2 border-brand-orange opacity-75 animate-pulse-rings"></div>
                {/* Wave ring 2 */}
                <div className="absolute w-32 h-32 rounded-full border-2 border-brand-orange opacity-50 animate-pulse-rings" style={{ animationDelay: '0.3s' }}></div>
                {/* Wave ring 3 */}
                <div className="absolute w-44 h-44 rounded-full border-2 border-brand-orange opacity-25 animate-pulse-rings" style={{ animationDelay: '0.6s' }}></div>
              </div>
            )}

            {/* Status tooltip */}
            <div className={`absolute -top-16 left-1/2 transform -translate-x-1/2 transition-all duration-300 ${
              isListening ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}>
              <div className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap">
                {status}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>

            {/* Close button (only visible when listening) */}
            {isListening && (
              <button
                onClick={stopListening}
                className="absolute -top-2 -right-2 w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors duration-200 z-10"
                aria-label="Stop listening"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}

            {/* Main voice assistant button */}
            <button
              onClick={toggleListening}
              className={`voice-assistant-button relative w-20 h-20 rounded-full bg-brand-orange text-white shadow-lg transition-all duration-300 ease-out focus:outline-none focus:ring-4 focus:ring-brand-orange focus:ring-opacity-50 ${
                isListening 
                  ? 'animate-pulse shadow-2xl shadow-brand-orange/50' 
                  : 'hover:scale-105 animate-gentle-bounce'
              }`}
              style={{
                animationDuration: isListening ? '1s' : '2s',
                animationTimingFunction: 'cubic-bezier(0.4, 0, 0.6, 1)'
              }}
              aria-label={isListening ? 'Stop voice assistant' : 'Start voice assistant'}
              aria-pressed={isListening}
              tabIndex={0}
            >
              {/* Microphone icon */}
              <div className="flex items-center justify-center w-full h-full">
                <svg 
                  className="w-8 h-8" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" 
                  />
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" 
                  />
                </svg>
              </div>
            </button>

            {/* Idle status text (only visible when not listening) */}
            {!isListening && (
              <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-sm text-gray-600 whitespace-nowrap">
                Click to start voice assistant
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 