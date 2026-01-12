'use client';

/**
 * TransferForm Component
 * 
 * Provides a form for executing gasless SOL transfers using Lazorkit.
 * 
 * Design Decision: This component:
 * 1. Only renders when wallet is connected
 * 2. Validates inputs before submission
 * 3. Shows clear loading, success, and error states
 * 4. Displays transaction signature with explorer link on success
 * 
 * Requirements: 4.1, 4.3, 4.4
 */

import { useState, FormEvent } from 'react';
import { useTransfer } from '@/app/hooks/useTransfer';
import { useLazorkit } from '@/app/hooks/useLazorkit';
import { TransactionStatus } from '@/app/components/TransactionStatus';

/**
 * TransferForm allows users to send SOL to any Solana address.
 * 
 * Features:
 * - Recipient address input with validation
 * - Amount input in SOL
 * - Loading state during transaction submission
 * - Success state with transaction signature and explorer link
 * - Error state with descriptive messages
 */
export function TransferForm() {
  const { isConnected } = useLazorkit();
  const { isSubmitting, signature, error, status, transfer, reset } = useTransfer();
  
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) {
      return;
    }

    try {
      await transfer(recipient, amountNum);
      // Clear form on success
      setRecipient('');
      setAmount('');
    } catch {
      // Error is handled by the hook and displayed in UI
    }
  };

  const handleReset = () => {
    reset();
    setRecipient('');
    setAmount('');
  };

  // Don't render if wallet is not connected
  if (!isConnected) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-6 text-center dark:border-zinc-700 dark:bg-zinc-800/50">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Connect your wallet to send transactions
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
      <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Send SOL (Gasless)
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Recipient Address Input */}
        <div>
          <label
            htmlFor="recipient"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Recipient Address
          </label>
          <input
            id="recipient"
            type="text"
            placeholder="Enter Solana address"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            disabled={isSubmitting}
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 font-mono text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
            required
          />
        </div>

        {/* Amount Input */}
        <div>
          <label
            htmlFor="amount"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Amount (SOL)
          </label>
          <input
            id="amount"
            type="number"
            placeholder="0.001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step="0.001"
            min="0"
            disabled={isSubmitting}
            className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
            required
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !recipient || !amount}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <LoadingSpinner />
              Sending...
            </span>
          ) : (
            'Send SOL'
          )}
        </button>
      </form>

      {/* Transaction Status */}
      {(signature || error) && (
        <div className="mt-4">
          <TransactionStatus
            signature={signature}
            error={error}
            status={status}
            onReset={handleReset}
          />
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

export default TransferForm;
