/**
 * Environment variables validation utility for Vapi credentials
 */

/**
 * Validates environment variables based on context (client or server)
 * @param {boolean} isClientSide - Whether this is running on the client side
 * @returns {Object} Object containing validation results and environment variables
 */
export function validateEnvironmentVariables(isClientSide = typeof window !== 'undefined') {
  const errors = [];
  const warnings = [];
  const envVars = {};

  // Define the environment variables to check based on context
  const envVarsToCheck = isClientSide ? {
    NEXT_PUBLIC_VAPI_KEY: {
      value: process.env.NEXT_PUBLIC_VAPI_KEY,
      description: 'Vapi public key for client-side authentication',
      required: true
    },
    NEXT_PUBLIC_VAPI_ASSISTANT_ID: {
      value: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID,
      description: 'Vapi assistant ID for voice interactions',
      required: true
    }
  } : {
    NEXT_PUBLIC_VAPI_KEY: {
      value: process.env.NEXT_PUBLIC_VAPI_KEY,
      description: 'Vapi public key for client-side authentication',
      required: true
    },
    NEXT_PUBLIC_VAPI_ASSISTANT_ID: {
      value: process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID,
      description: 'Vapi assistant ID for voice interactions',
      required: true
    },
    VAPI_PRIVATE_KEY: {
      value: process.env.VAPI_PRIVATE_KEY,
      description: 'Vapi private key for server-side operations',
      required: true
    }
  };

  // Check each required environment variable
  Object.entries(envVarsToCheck).forEach(([key, config]) => {
    const value = config.value;
    
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
 * Validates only client-side environment variables
 * @returns {Object} Object containing validation results and environment variables
 */
export function validateClientEnvironmentVariables() {
  return validateEnvironmentVariables(true);
}

/**
 * Validates all environment variables (server-side only)
 * @returns {Object} Object containing validation results and environment variables
 */
export function validateServerEnvironmentVariables() {
  return validateEnvironmentVariables(false);
}

/**
 * Logs environment variable validation results
 * @param {boolean} isDevelopment - Whether we're in development mode
 * @param {boolean} isClientSide - Whether this is running on the client side
 */
export function logEnvironmentValidation(isDevelopment = false, isClientSide = typeof window !== 'undefined') {
  const validation = validateEnvironmentVariables(isClientSide);
  
  if (validation.isValid) {
    console.log(`✅ All required ${isClientSide ? 'client-side' : 'server-side'} environment variables are present`);
    
    if (isDevelopment) {
      console.log('🔑 Environment variables loaded:');
      Object.entries(validation.envVars).forEach(([key, value]) => {
        if (key.startsWith('NEXT_PUBLIC_') || !isClientSide) {
          console.log(`  ${key}: ${value}`);
        } else {
          console.log(`  ${key}: ${value.substring(0, 8)}...`);
        }
      });
    }
  } else {
    console.error(`❌ Environment variable validation failed (${isClientSide ? 'client-side' : 'server-side'}):`);
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
 * @param {boolean} isClientSide - Whether this is running on the client side
 * @returns {Object} Object containing environment variables
 */
export function getVapiConfig(isClientSide = typeof window !== 'undefined') {
  const validation = validateEnvironmentVariables(isClientSide);
  
  if (!validation.isValid) {
    throw new Error(`Environment variables validation failed (${isClientSide ? 'client-side' : 'server-side'}). Please check your .env.local file.`);
  }
  
  return {
    publicKey: validation.envVars.NEXT_PUBLIC_VAPI_KEY,
    assistantId: validation.envVars.NEXT_PUBLIC_VAPI_ASSISTANT_ID,
    privateKey: validation.envVars.VAPI_PRIVATE_KEY // Only available server-side
  };
} 