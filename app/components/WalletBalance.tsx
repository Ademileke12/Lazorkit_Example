'use client';

/**
 * WalletBalance Component
 * 
 * Displays the SOL balance for the connected wallet.
 * Shows loading state, balance with refresh button, and handles errors.
 */

import { useBalance } from '@/app/hooks/useBalance';
import { getAccountExplorerUrl } from '@/app/lib/solana/constants';

interface WalletBalanceProps {
  /** The wallet address to display balance for */
  walletAddress: string | null;
}

/**
 * Formats a SOL balance for display.
 * Shows up to 4 decimal places, removes trailing zeros.
 */
function formatBalance(balance: number): string {
  if (balance === 0) return '0';
  if (balance < 0.0001) return '< 0.0001';
  return balance.toFixed(4).replace(/\.?0+$/, '');
}

/**
 * WalletBalance displays the current SOL balance of the connected wallet.
 * 
 * Features:
 * - Auto-refreshes every 30 seconds
 * - Manual refresh button
 * - Link to view on Solana Explorer
 * - Loading and error states
 */
export function WalletBalance({ walletAddress }: WalletBalanceProps) {
  const { balance, isLoading, error, refresh } = useBalance(walletAddress);

  // Don't render if no wallet connected
  if (!walletAddress) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-3 rounded-lg bg-zinc-100 px-4 py-3 dark:bg-zinc-800">
        {/* SOL Icon */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500">
          <span className="text-xs font-bold text-white">◎</span>
        </div>
        
        {/* Balance Display */}
        <div className="flex flex-col">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Balance</span>
          <div className="flex items-center gap-2">
            {isLoading ? (
              <span className="text-lg font-semibold text-zinc-400 dark:text-zinc-500">
                Loading...
              </span>
            ) : error ? (
              <span className="text-sm text-red-500">{error}</span>
            ) : balance !== null ? (
              <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {formatBalance(balance)} SOL
              </span>
            ) : (
              <span className="text-lg font-semibold text-zinc-400 dark:text-zinc-500">
                --
              </span>
            )}
          </div>
        </div>

        {/* Refresh Button */}
        <button
          onClick={refresh}
          disabled={isLoading}
          className="ml-2 rounded-full p-1.5 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
          title="Refresh balance"
          aria-label="Refresh balance"
        >
          <RefreshIcon className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Explorer Link */}
      <a
        href={getAccountExplorerUrl(walletAddress)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-blue-500 hover:text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
      >
        View on Solana Explorer ↗
      </a>
    </div>
  );
}

/**
 * Refresh icon component.
 */
function RefreshIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}

export default WalletBalance;
