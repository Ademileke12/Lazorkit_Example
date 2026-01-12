/**
 * Error transformation utilities for Lazorkit SDK.
 * Maps WebAuthn, Solana, and other errors to user-friendly messages.
 */

/**
 * Known error patterns and their user-friendly messages.
 */
const ERROR_MAPPINGS: Array<{ pattern: string | RegExp; message: string }> = [
  // WebAuthn / Passkey errors
  {
    pattern: 'NotAllowedError',
    message: 'Passkey operation was cancelled or not allowed.',
  },
  {
    pattern: 'InvalidStateError',
    message: 'A passkey already exists for this device.',
  },
  {
    pattern: 'NotSupportedError',
    message: 'Passkeys are not supported on this device or browser.',
  },
  {
    pattern: 'SecurityError',
    message: 'Security error. Please ensure you are using HTTPS.',
  },
  {
    pattern: 'AbortError',
    message: 'The operation was aborted. Please try again.',
  },
  {
    pattern: 'ConstraintError',
    message: 'The passkey does not meet the required constraints.',
  },

  // Network errors - including "load failed"
  {
    pattern: 'load failed',
    message: 'Failed to connect to Lazorkit services. Please try again.',
  },
  {
    pattern: 'Load failed',
    message: 'Failed to connect to Lazorkit services. Please try again.',
  },
  {
    pattern: 'NetworkError',
    message: 'Network error. Please check your connection.',
  },
  {
    pattern: 'Failed to fetch',
    message: 'Network error. Please check your connection.',
  },
  {
    pattern: /ECONNREFUSED|ETIMEDOUT|ENOTFOUND/,
    message: 'Unable to connect to the server. Please try again later.',
  },
  {
    pattern: 'timeout',
    message: 'Request timed out. Please try again.',
  },
  {
    pattern: 'CORS',
    message: 'Connection blocked. Please try again.',
  },

  // Lazorkit specific errors
  {
    pattern: 'passkeyPublicKey must be exactly 33 bytes, got 0',
    message: 'Passkey data not found. Please create a new wallet instead of logging in.',
  },
  {
    pattern: 'passkeyPublicKey must be exactly 33 bytes',
    message: 'Invalid passkey data. Please try creating a new wallet.',
  },
  {
    pattern: 'paymaster',
    message: 'Paymaster service unavailable. Please try again later.',
  },
  {
    pattern: 'smart wallet',
    message: 'Smart wallet operation failed. Please try again.',
  },

  // Solana RPC errors
  {
    pattern: 'Transaction simulation failed',
    message: 'Transaction simulation failed. Please check your inputs.',
  },
  {
    pattern: 'Insufficient funds',
    message: 'Insufficient funds for this transaction.',
  },
  {
    pattern: 'Blockhash not found',
    message: 'Transaction expired. Please try again.',
  },
  {
    pattern: 'Account not found',
    message: 'The specified account was not found.',
  },

  // Session errors
  {
    pattern: 'Session expired',
    message: 'Your session has expired. Please log in again.',
  },
  {
    pattern: 'Invalid session',
    message: 'Invalid session. Please log in again.',
  },

  // Wallet errors
  {
    pattern: 'Wallet not connected',
    message: 'Please connect your wallet first.',
  },
  {
    pattern: 'User rejected',
    message: 'The request was rejected.',
  },
];

/**
 * Transforms an error into a user-friendly message.
 * Maps known error types to descriptive messages.
 * 
 * @param error - The error to transform (can be Error, string, or unknown)
 * @returns A user-readable error message
 */
export function transformError(error: unknown): string {
  // Handle null/undefined
  if (error === null || error === undefined) {
    return 'An unexpected error occurred.';
  }

  // Get the error message string
  let errorMessage: string;

  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else if (typeof error === 'object' && 'message' in error) {
    errorMessage = String((error as { message: unknown }).message);
  } else {
    return 'An unexpected error occurred.';
  }

  // Check against known error patterns
  for (const { pattern, message } of ERROR_MAPPINGS) {
    if (typeof pattern === 'string') {
      if (errorMessage.includes(pattern)) {
        return message;
      }
    } else if (pattern instanceof RegExp) {
      if (pattern.test(errorMessage)) {
        return message;
      }
    }
  }

  // Return the original message if no mapping found
  // but ensure it's not empty
  return errorMessage.trim() || 'An unexpected error occurred.';
}

/**
 * Type guard to check if a value is an Error object.
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}
