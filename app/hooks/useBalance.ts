'use client';

/**
 * useBalance Hook
 * 
 * Fetches and manages the SOL balance for a Solana wallet address.
 * Automatically refreshes on interval and provides manual refresh capability.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { SOLANA_RPC_URL } from '@/app/lib/solana/constants';

export interface UseBalanceReturn {
  /** Balance in SOL (null if not loaded or error) */
  balance: number | null;
  /** Balance in lamports (null if not loaded or error) */
  balanceLamports: number | null;
  /** Whether balance is currently being fetched */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Manually refresh the balance */
  refresh: () => Promise<void>;
}

/** Refresh interval in milliseconds (30 seconds) */
const REFRESH_INTERVAL = 30_000;

/**
 * Hook for fetching and managing wallet SOL balance.
 * 
 * @param walletAddress - The Solana wallet address to fetch balance for
 * @returns Balance state and refresh function
 */
export function useBalance(walletAddress: string | null): UseBalanceReturn {
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLamports, setBalanceLamports] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const connectionRef = useRef<Connection | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize connection
  useEffect(() => {
    connectionRef.current = new Connection(SOLANA_RPC_URL, 'confirmed');
    return () => {
      connectionRef.current = null;
    };
  }, []);

  // Fetch balance function
  const fetchBalance = useCallback(async () => {
    if (!walletAddress || !connectionRef.current) {
      setBalance(null);
      setBalanceLamports(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const pubkey = new PublicKey(walletAddress);
      const lamports = await connectionRef.current.getBalance(pubkey);
      
      setBalanceLamports(lamports);
      setBalance(lamports / LAMPORTS_PER_SOL);
    } catch (err) {
      console.error('Failed to fetch balance:', err);
      setError('Failed to fetch balance');
      setBalance(null);
      setBalanceLamports(null);
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  // Fetch balance on mount and when wallet address changes
  useEffect(() => {
    fetchBalance();

    // Set up auto-refresh interval
    if (walletAddress) {
      intervalRef.current = setInterval(fetchBalance, REFRESH_INTERVAL);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [walletAddress, fetchBalance]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    await fetchBalance();
  }, [fetchBalance]);

  return {
    balance,
    balanceLamports,
    isLoading,
    error,
    refresh,
  };
}

export default useBalance;
