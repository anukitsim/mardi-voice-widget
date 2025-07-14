'use client';

import { useEffect, useState } from 'react';
import { validateClientEnvironmentVariables, logEnvironmentValidation } from '@/lib/env';

export default function Home() {
  const [envStatus, setEnvStatus] = useState(null);

  useEffect(() => {
    // Validate environment variables on client side
    const validation = validateClientEnvironmentVariables();
    setEnvStatus(validation);
    
    // Log environment validation (only in development)
    logEnvironmentValidation(process.env.NODE_ENV === 'development', true);
    
    // Test logging the public key as requested
    console.log('NEXT_PUBLIC_VAPI_KEY:', process.env.NEXT_PUBLIC_VAPI_KEY);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-2xl mx-auto p-6">
        <h1 className="text-4xl font-bold text-gray-900 font-[family-name:var(--font-poppins)] mb-6">
          Mardi Voice Assistant Widget
        </h1>
        
        <p className="text-lg text-gray-600 font-[family-name:var(--font-noto-sans-georgian)] mb-8">
          Production-ready voice assistant widget coming soon...
        </p>

        {/* Environment Status Indicator */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Environment Status</h2>
          
          {envStatus ? (
            <div className="space-y-2">
              {envStatus.isValid ? (
                <div className="flex items-center justify-center text-green-600">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  All client-side environment variables loaded successfully
                </div>
              ) : (
                <div className="text-red-600">
                  <div className="flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Client-side environment validation failed
                  </div>
                  <ul className="text-sm text-left">
                    {envStatus.errors.map((error, index) => (
                      <li key={index} className="mb-1">• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {envStatus.warnings.length > 0 && (
                <div className="text-yellow-600 mt-4">
                  <div className="flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Warnings
                  </div>
                  <ul className="text-sm text-left">
                    {envStatus.warnings.map((warning, index) => (
                      <li key={index} className="mb-1">• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500">Loading environment status...</div>
          )}
        </div>

        <div className="text-sm text-gray-500 font-[family-name:var(--font-noto-sans-georgian)]">
          Check the browser console for environment variable logs
          <br />
          <span className="text-xs text-gray-400">
            Note: Server-side variables (like VAPI_PRIVATE_KEY) are validated separately
          </span>
        </div>
      </div>
    </div>
  );
}
