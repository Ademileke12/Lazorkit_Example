'use client';

/**
 * useLazorkit Hook
 * 
 * Wraps the @lazorkit/wallet SDK's useWallet hook with:
 * - Typed interfaces for wallet state and actions
 * - Error transformation to user-friendly messages
 * - Simplified API for common wallet operations
 * 
 * Note: This hook uses the SDK's zustand store directly, which works
 * independently of the LazorkitProvider context.
 */

import { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { transformError } from '@/app/lib/errors';

/**
 * Wallet state exposed by the hook.
 */
export interface LazorkitState {
  /** The connected wallet's Solana address, or null if not connected */
  walletAddress: string | null;
  /** Whether a wallet is currently connected */
  isConnected: boolean;
  /** Whether a wallet operation is in progress */
  isLoading: boolean;
  /** User-friendly error message, or null if no error */
  error: string | null;
  /** Whether session restoration is in progress */
  isRestoring: boolean;
  /** Whether session restoration has been attempted */
  hasAttemptedRestore: boolean;
}

/**
 * Wallet actions exposed by the hook.
 */
export interface LazorkitActions {
  /** Create a new wallet with a passkey */
  createWallet: () => Promise<void>;
  /** Login with an existing passkey */
  login: () => Promise<void>;
  /** Disconnect the current wallet */
  logout: () => Promise<void>;
  /** Clear any error state */
  clearError: () => void;
}

/**
 * Combined type for the hook return value.
 */
export type UseLazorkitReturn = LazorkitState & LazorkitActions;

/**
 * Hook for interacting with Lazorkit wallet functionality.
 */
export function useLazorkit(): UseLazorkitReturn {
  // Local state
  const [localError, setLocalError] = useState<string | null>(null);
  const [isOperating, setIsOperating] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [hasAttemptedRestore, setHasAttemptedRestore] = useState(true);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sdkIsLoading, setSdkIsLoading] = useState(false);
  
  const mountedRef = useRef(false);
  const storeRef = useRef<ReturnType<typeof import('@lazorkit/wallet').useWalletStore.getState> | null>(null);

  // Initialize and subscribe to the SDK store
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    const initStore = async () => {
      try {
        const { useWalletStore } = await import('@lazorkit/wallet');
        
        // Get initial state
        const state = useWalletStore.getState();
        storeRef.current = state;
        
        // Update local state from store
        setWalletAddress(state.wallet?.smartWallet ?? null);
        setIsConnected(!!state.wallet);
        setSdkIsLoading(state.isLoading || state.isConnecting);

        // Subscribe to store changes
        useWalletStore.subscribe((newState) => {
          setWalletAddress(newState.wallet?.smartWallet ?? null);
          setIsConnected(!!newState.wallet);
          setSdkIsLoading(newState.isLoading || newState.isConnecting);
          if (newState.error) {
            setLocalError(transformError(newState.error));
          }
        });
      } catch (error) {
        console.error('Failed to initialize wallet store:', error);
      }
    };

    initStore();
  }, []);

  // Combine loading states
  const isLoading = sdkIsLoading || isOperating || isRestoring;

  /**
   * Create a new wallet with a passkey.
   */
  const createWallet = useCallback(async () => {
    setLocalError(null);
    setIsOperating(true);
    
    try {
      // Clear any stale wallet data before creating new wallet
      if (typeof window !== 'undefined') {
        localStorage.removeItem('lazorkit-wallet');
        localStorage.removeItem('CREDENTIAL_ID');
        localStorage.removeItem('PUBLIC_KEY');
        localStorage.removeItem('SMART_WALLET_ADDRESS');
      }
      
      // Ensure SDK is initialized with config
      const { initializeLazorkitStore } = await import('@/app/lib/lazorkit/provider');
      await initializeLazorkitStore();
      
      const { useWalletStore } = await import('@lazorkit/wallet');
      const store = useWalletStore.getState();
      await store.connect();
    } catch (err) {
      console.error('Create wallet error:', err);
      setLocalError(transformError(err));
    } finally {
      setIsOperating(false);
    }
  }, []);

  /**
   * Login with an existing passkey.
   */
  const login = useCallback(async () => {
    setLocalError(null);
    setIsOperating(true);
    
    try {
      // Ensure SDK is initialized with config
      const { initializeLazorkitStore } = await import('@/app/lib/lazorkit/provider');
      await initializeLazorkitStore();
      
      const { useWalletStore } = await import('@lazorkit/wallet');
      const store = useWalletStore.getState();
      await store.connect();
    } catch (err) {
      console.error('Login error:', err);
      setLocalError(transformError(err));
    } finally {
      setIsOperating(false);
    }
  }, []);

  /**
   * Disconnect the current wallet.
   */
  const logout = useCallback(async () => {
    setLocalError(null);
    setIsOperating(true);
    
    try {
      const { useWalletStore } = await import('@lazorkit/wallet');
      const store = useWalletStore.getState();
      await store.disconnect();
    } catch (err) {
      setLocalError(transformError(err));
    } finally {
      setIsOperating(false);
    }
  }, []);

  /**
   * Clear any error state.
   */
  const clearError = useCallback(() => {
    setLocalError(null);
  }, []);

  return {
    walletAddress,
    isConnected,
    isLoading,
    error: localError,
    isRestoring,
    hasAttemptedRestore,
    createWallet,
    login,
    logout,
    clearError,
  };
}

export default useLazorkit;
