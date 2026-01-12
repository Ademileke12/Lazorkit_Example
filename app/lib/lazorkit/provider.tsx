'use client';

/**
 * Lazorkit Provider Wrapper
 * 
 * This initializes the @lazorkit/wallet SDK's zustand store with the required
 * configuration before any wallet operations can be performed.
 */

import { createContext, useContext, ReactNode, useEffect, useState, useRef } from 'react';

// Configuration constants - URLs from SDK defaults
const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
const PORTAL_URL = 'https://portal.lazor.sh';
const PAYMASTER_URL = 'https://lazorkit-paymaster.onrender.com';

interface LazorkitContextValue {
  rpcUrl: string;
  isReady: boolean;
}

const LazorkitContext = createContext<LazorkitContextValue>({
  rpcUrl: RPC_URL,
  isReady: false,
});

export const useLazorkitContext = () => useContext(LazorkitContext);

interface LazorkitProviderProps {
  children: ReactNode;
}

/**
 * Initialize the SDK store with required configuration.
 * This must be called before any wallet operations.
 */
export async function initializeLazorkitStore(): Promise<void> {
  const { useWalletStore } = await import('@lazorkit/wallet');
  const store = useWalletStore.getState();
  
  // Set the full config required by the SDK
  if (store.setConfig) {
    store.setConfig({
      rpcUrl: RPC_URL,
      portalUrl: PORTAL_URL,
      paymasterConfig: {
        paymasterUrl: PAYMASTER_URL,
      },
    });
  }
}

/**
 * Custom Lazorkit Provider that initializes the SDK store.
 */
export function LazorkitProvider({ children }: LazorkitProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const init = async () => {
      try {
        await initializeLazorkitStore();
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize Lazorkit SDK:', error);
        setIsReady(true); // Still mark as ready so app can render
      }
    };

    init();
  }, []);

  const contextValue: LazorkitContextValue = {
    rpcUrl: RPC_URL,
    isReady,
  };

  return (
    <LazorkitContext.Provider value={contextValue}>
      {children}
    </LazorkitContext.Provider>
  );
}

export default LazorkitProvider;
