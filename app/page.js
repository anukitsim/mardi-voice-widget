'use client';

import VoiceAssistant from './components/VoiceAssistant';

export default function Home() {
  console.log('🏠 Home page component loaded');
  
  return (
    <>
      {/* Completely blank white background */}
      <div className="min-h-screen bg-white">
        {/* No content - just blank white space */}
      </div>

      {/* Voice Assistant Widget */}
      <VoiceAssistant />
    </>
  );
}
