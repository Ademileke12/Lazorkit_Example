'use client';

/**
 * WalletButton Component
 * 
 * Provides the primary wallet interaction UI for the Lazorkit example.
 * 
 * Design Decision: This component handles four states:
 * 1. Restoring - Shows loading indicator during session restoration
 * 2. Disconnected - Shows create/login buttons
 * 3. Loading - Shows loading indicator during wallet operations
 * 4. Connected - Shows truncated address and disconnect button
 * 
 * Requirements: 1.1, 1.3, 2.1, 2.3, 1.5, 3.1, 3.2, 3.3, 3.4
 */

import { useState, useCallback } from 'react';
import { useLazorkit } from '@/app/hooks/useLazorkit';
import { formatAddress } from '@/app/lib/validation';

/**
 * WalletButton displays wallet connection controls.
 * 
 * When restoring:
 * - Shows loading indicator while attempting to restore previous session
 * 
 * When disconnected:
 * - "Create Wallet with Passkey" button initiates new wallet creation
 * - "Login with Passkey" button authenticates with existing passkey
 * 
 * When connected:
 * - Shows truncated wallet address with copy button
 * - "Disconnect" button to log out
 * 
 * Error and loading states are displayed appropriately.
 */
export function WalletButton() {
  const {
    walletAddress,
    isConnected,
    isLoading,
    error,
    isRestoring,
    hasAttemptedRestore,
    createWallet,
    login,
    logout,
    clearError,
  } = useLazorkit();

  const [copied, setCopied] = useState(false);

  const copyAddress = useCallback(async () => {
    if (!walletAddress) return;
    
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  }, [walletAddress]);

  // Session restoration in progress - show loading state
  // Only show if actively restoring (not on initial render)
  if (isRestoring) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-3 dark:bg-blue-900/20">
          <LoadingSpinner />
          <span className="text-sm text-blue-700 dark:text-blue-400">
            Restoring session...
          </span>
        </div>
      </div>
    );
  }

  // Connected state: show address and disconnect button
  if (isConnected && walletAddress) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 dark:bg-green-900/20">
          <div className="h-2 w-2 rounded-full bg-green-500" />
          <span className="font-mono text-sm text-green-700 dark:text-green-400">
            {formatAddress(walletAddress)}
          </span>
          <button
            onClick={copyAddress}
            className="ml-1 rounded p-1 text-green-600 transition-colors hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-800/30"
            title={copied ? 'Copied!' : 'Copy address'}
            aria-label="Copy wallet address"
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </button>
        </div>
        <button
          onClick={logout}
          disabled={isLoading}
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {isLoading ? 'Disconnecting...' : 'Disconnect'}
        </button>
      </div>
    );
  }

  // Disconnected state: show create/login buttons
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={createWallet}
          disabled={isLoading}
          className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <LoadingSpinner />
              Creating...
            </span>
          ) : (
            'Create Wallet with Passkey'
          )}
        </button>
        <button
          onClick={login}
          disabled={isLoading}
          className="rounded-lg border border-blue-600 px-6 py-3 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <LoadingSpinner />
              Logging in...
            </span>
          ) : (
            'Login with Passkey'
          )}
        </button>
      </div>
      
      {/* Error display with re-authentication prompt for session errors */}
      {error && (
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 dark:bg-red-900/20">
            <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
            <button
              onClick={clearError}
              className="ml-2 text-red-500 hover:text-red-700 dark:hover:text-red-300"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
          {/* Show re-authentication hint for session-related errors */}
          {(error.includes('session') || error.includes('expired') || error.includes('log in')) && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Please use the buttons above to re-authenticate.
            </p>
          )}
          {/* Show hint for passkey data errors */}
          {(error.includes('Passkey data not found') || error.includes('Invalid passkey data')) && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Try clicking &quot;Create Wallet with Passkey&quot; instead.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Simple loading spinner component.
 */
function LoadingSpinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * Copy icon component.
 */
function CopyIcon() {
  return (
    <svg
      className="h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

/**
 * Check icon component (shown after copy).
 */
function CheckIcon() {
  return (
    <svg
      className="h-4 w-4 text-green-600 dark:text-green-400"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

export default WalletButton;
