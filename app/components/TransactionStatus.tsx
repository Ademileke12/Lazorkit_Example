'use client';

/**
 * TransactionStatus Component
 * 
 * Displays the status of a transaction including:
 * - Transaction signature with Solana Explorer link
 * - Confirmation status (pending, confirmed, failed)
 * - Error messages when applicable
 * 
 * Requirements: 4.3
 */

import { TransactionStatus as TxStatus } from '@/app/hooks/useTransfer';

interface TransactionStatusProps {
  /** Transaction signature if successful */
  signature: string | null;
  /** Error message if failed */
  error: string | null;
  /** Current transaction status */
  status: TxStatus;
  /** Callback to reset/dismiss the status */
  onReset?: () => void;
}

/**
 * Generates a Solana Explorer URL for a transaction.
 */
function getExplorerUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

/**
 * Truncates a transaction signature for display.
 */
function truncateSignature(signature: string): string {
  if (signature.length <= 16) return signature;
  return `${signature.slice(0, 8)}...${signature.slice(-8)}`;
}

/**
 * TransactionStatus displays the result of a transaction.
 * 
 * Shows different UI based on status:
 * - pending: Loading indicator
 * - confirmed: Success message with explorer link
 * - failed: Error message with details
 */
export function TransactionStatus({
  signature,
  error,
  status,
  onReset,
}: TransactionStatusProps) {
  // Pending state
  if (status === 'pending') {
    return (
      <div className="flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-3 dark:bg-blue-900/20">
        <LoadingSpinner className="text-blue-600 dark:text-blue-400" />
        <span className="text-sm text-blue-700 dark:text-blue-300">
          Transaction pending...
        </span>
      </div>
    );
  }

  // Success state
  if (status === 'confirmed' && signature) {
    return (
      <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <CheckIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              Transaction Confirmed
            </span>
          </div>
          {onReset && (
            <button
              onClick={onReset}
              className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
              aria-label="Dismiss"
            >
              ×
            </button>
          )}
        </div>
        <div className="mt-2">
          <p className="text-xs text-green-600 dark:text-green-400">
            Signature:
          </p>
          <a
            href={getExplorerUrl(signature)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 font-mono text-sm text-green-700 underline hover:text-green-900 dark:text-green-300 dark:hover:text-green-100"
          >
            {truncateSignature(signature)}
            <ExternalLinkIcon className="h-3 w-3" />
          </a>
        </div>
      </div>
    );
  }

  // Error state
  if (status === 'failed' && error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <ErrorIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
            <span className="text-sm font-medium text-red-700 dark:text-red-300">
              Transaction Failed
            </span>
          </div>
          {onReset && (
            <button
              onClick={onReset}
              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200"
              aria-label="Dismiss"
            >
              ×
            </button>
          )}
        </div>
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  // Idle state - render nothing
  return null;
}

/**
 * Loading spinner icon.
 */
function LoadingSpinner({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 animate-spin ${className}`}
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
 * Checkmark icon for success state.
 */
function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Error icon for failure state.
 */
function ErrorIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * External link icon.
 */
function ExternalLinkIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z"
        clipRule="evenodd"
      />
      <path
        fillRule="evenodd"
        d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default TransactionStatus;
