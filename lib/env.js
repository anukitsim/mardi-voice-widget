/**
 * Environment variables validation utility for Vapi credentials
 */

const requiredEnvVars = {
  NEXT_PUBLIC_VAPI_KEY: {
    name: 'NEXT_PUBLIC_VAPI_KEY',
    description: 'Vapi public key for client-side authentication',
    required: true
  },
  NEXT_PUBLIC_VAPI_ASSISTANT_ID: {
    name: 'NEXT_PUBLIC_VAPI_ASSISTANT_ID',
    description: 'Vapi assistant ID for voice interactions',
    required: true
  },
  VAPI_PRIVATE_KEY: {
    name: 'VAPI_PRIVATE_KEY',
    description: 'Vapi private key for server-side operations',
    required: true
  }
};

/**
 * Validates all required environment variables
 * @returns {Object} Object containing validation results and environment variables
 */
export function validateEnvironmentVariables() {
  const errors = [];
  const warnings = [];
  const envVars = {};

  // Check each required environment variable
  Object.entries(requiredEnvVars).forEach(([key, config]) => {
    const value = process.env[key];
    
    if (!value) {
      if (config.required) {
        errors.push(`Missing required environment variable: ${key} (${config.description})`);
      } else {
        warnings.push(`Optional environment variable not set: ${key} (${config.description})`);
      }
    } else {
      // Basic validation for UUID format (Vapi keys are typically UUIDs)
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
      
      if (!isValidUUID) {
        warnings.push(`Environment variable ${key} does not appear to be a valid UUID format`);
      }
      
      envVars[key] = value;
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    envVars
  };
}

/**
 * Logs environment variable validation results
 * @param {boolean} isDevelopment - Whether we're in development mode
 */
export function logEnvironmentValidation(isDevelopment = false) {
  const validation = validateEnvironmentVariables();
  
  if (validation.isValid) {
    console.log('✅ All required environment variables are present');
    
    if (isDevelopment) {
      console.log('🔑 Environment variables loaded:');
      Object.entries(validation.envVars).forEach(([key, value]) => {
        if (key.startsWith('NEXT_PUBLIC_')) {
          console.log(`  ${key}: ${value}`);
        } else {
          console.log(`  ${key}: ${value.substring(0, 8)}...`);
        }
      });
    }
  } else {
    console.error('❌ Environment variable validation failed:');
    validation.errors.forEach(error => console.error(`  - ${error}`));
  }
  
  if (validation.warnings.length > 0) {
    console.warn('⚠️  Environment variable warnings:');
    validation.warnings.forEach(warning => console.warn(`  - ${warning}`));
  }
  
  return validation;
}

/**
 * Gets validated environment variables
 * @returns {Object} Object containing environment variables
 */
export function getVapiConfig() {
  const validation = validateEnvironmentVariables();
  
  if (!validation.isValid) {
    throw new Error('Environment variables validation failed. Please check your .env.local file.');
  }
  
  return {
    publicKey: validation.envVars.NEXT_PUBLIC_VAPI_KEY,
    assistantId: validation.envVars.NEXT_PUBLIC_VAPI_ASSISTANT_ID,
    privateKey: validation.envVars.VAPI_PRIVATE_KEY
  };
} 