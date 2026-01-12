'use client';

/**
 * useTransfer Hook
 * 
 * Handles SOL transfer transactions using Lazorkit's gasless transaction feature.
 * Uses the SDK's zustand store directly to avoid provider issues.
 */

import { SystemProgram, PublicKey } from '@solana/web3.js';
import { useState, useCallback, useEffect, useRef } from 'react';
import { isValidSolanaAddress } from '@/app/lib/validation';
import { transformError } from '@/app/lib/errors';
import { LAMPORTS_PER_SOL } from '@/app/lib/solana/constants';

/**
 * Transaction status enum for tracking transfer progress.
 */
export type TransactionStatus = 'idle' | 'pending' | 'confirmed' | 'failed';

/**
 * Transfer state exposed by the hook.
 */
export interface TransferState {
  /** Whether a transfer is currently being submitted */
  isSubmitting: boolean;
  /** The transaction signature if successful, null otherwise */
  signature: string | null;
  /** User-friendly error message if failed, null otherwise */
  error: string | null;
  /** Current transaction status */
  status: TransactionStatus;
}

/**
 * Transfer actions exposed by the hook.
 */
export interface TransferActions {
  /** Execute a SOL transfer to the specified recipient */
  transfer: (recipient: string, amount: number) => Promise<string>;
  /** Reset the transfer state to initial values */
  reset: () => void;
}

/**
 * Combined type for the hook return value.
 */
export type UseTransferReturn = TransferState & TransferActions;

/**
 * Initial state for the transfer hook.
 */
const initialState: TransferState = {
  isSubmitting: false,
  signature: null,
  error: null,
  status: 'idle',
};

/**
 * Hook for executing gasless SOL transfers.
 */
export function useTransfer(): UseTransferReturn {
  const [state, setState] = useState<TransferState>(initialState);
  const [smartWalletPubkey, setSmartWalletPubkey] = useState<PublicKey | null>(null);
  const mountedRef = useRef(false);

  // Subscribe to wallet state
  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;

    const initStore = async () => {
      try {
        const { useWalletStore } = await import('@lazorkit/wallet');
        
        // Get initial state
        const walletState = useWalletStore.getState();
        if (walletState.wallet?.smartWallet) {
          setSmartWalletPubkey(new PublicKey(walletState.wallet.smartWallet));
        }

        // Subscribe to changes
        useWalletStore.subscribe((newState) => {
          if (newState.wallet?.smartWallet) {
            setSmartWalletPubkey(new PublicKey(newState.wallet.smartWallet));
          } else {
            setSmartWalletPubkey(null);
          }
        });
      } catch (error) {
        console.error('Failed to initialize wallet store for transfer:', error);
      }
    };

    initStore();
  }, []);

  /**
   * Execute a SOL transfer to the specified recipient.
   */
  const transfer = useCallback(
    async (recipient: string, amount: number): Promise<string> => {
      // Validate wallet connection
      if (!smartWalletPubkey) {
        const error = 'Wallet not connected';
        setState({
          isSubmitting: false,
          signature: null,
          error: transformError(error),
          status: 'failed',
        });
        throw new Error(error);
      }

      // Validate recipient address
      if (!isValidSolanaAddress(recipient)) {
        const error = 'Invalid recipient address';
        setState({
          isSubmitting: false,
          signature: null,
          error: transformError(error),
          status: 'failed',
        });
        throw new Error(error);
      }

      // Validate amount
      if (amount <= 0) {
        const error = 'Amount must be greater than 0';
        setState({
          isSubmitting: false,
          signature: null,
          error,
          status: 'failed',
        });
        throw new Error(error);
      }

      // Set submitting state
      setState({
        isSubmitting: true,
        signature: null,
        error: null,
        status: 'pending',
      });

      try {
        // Build the transfer instruction
        const instruction = SystemProgram.transfer({
          fromPubkey: smartWalletPubkey,
          toPubkey: new PublicKey(recipient),
          lamports: Math.floor(amount * LAMPORTS_PER_SOL),
        });

        // Get the store and send transaction
        const { useWalletStore } = await import('@lazorkit/wallet');
        const store = useWalletStore.getState();
        
        const signature = await store.signAndSendTransaction({
          instructions: [instruction],
        });

        // Update state with success
        setState({
          isSubmitting: false,
          signature,
          error: null,
          status: 'confirmed',
        });

        return signature;
      } catch (err) {
        // Transform and set error
        const errorMessage = transformError(err);
        setState({
          isSubmitting: false,
          signature: null,
          error: errorMessage,
          status: 'failed',
        });
        throw err;
      }
    },
    [smartWalletPubkey]
  );

  /**
   * Reset the transfer state to initial values.
   */
  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return {
    ...state,
    transfer,
    reset,
  };
}

export default useTransfer;
