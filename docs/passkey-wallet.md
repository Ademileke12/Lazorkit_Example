# Passkey-Based Wallet Creation Tutorial

This tutorial explains how passkeys work with Lazorkit to create Solana wallets without seed phrases.

## Table of Contents

1. [What Are Passkeys?](#what-are-passkeys)
2. [How Lazorkit Uses Passkeys](#how-lazorkit-uses-passkeys)
3. [Implementation Walkthrough](#implementation-walkthrough)
4. [Flow Diagram](#flow-diagram)
5. [Common Pitfalls](#common-pitfalls)

## What Are Passkeys?

Passkeys are a modern authentication standard built on WebAuthn (Web Authentication API). They replace passwords and seed phrases with cryptographic credentials stored securely on your device.

### Key Concepts

**WebAuthn**: A W3C standard that enables passwordless authentication using public-key cryptography. Your device generates a key pair—the private key never leaves your device, while the public key is shared with the service.

**Authenticator**: The component that creates and stores passkeys. This can be:
- Built-in biometrics (Face ID, Touch ID, Windows Hello)
- Hardware security keys (YubiKey)
- Platform authenticators (TPM chips)

**Credential**: The passkey itself—a cryptographic key pair tied to a specific domain (origin).

### Why Passkeys for Wallets?

| Traditional Wallet | Passkey Wallet |
|-------------------|----------------|
| 24-word seed phrase | Biometric authentication |
| User must secure backup | Device handles key storage |
| Phishing vulnerable | Origin-bound (phishing resistant) |
| Same phrase = same wallet | Device-specific credentials |

## How Lazorkit Uses Passkeys

Lazorkit bridges WebAuthn credentials to Solana smart wallets:

```
┌──────────────────────────────────────────────────────────────────┐
│                     Passkey → Smart Wallet                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│   WebAuthn Credential          Lazorkit SDK           Solana      │
│   ┌─────────────────┐         ┌───────────┐      ┌───────────┐   │
│   │ Private Key     │         │ Derives   │      │ Smart     │   │
│   │ (on device)     │────────▶│ PDA from  │─────▶│ Wallet    │   │
│   │                 │         │ public key│      │ (PDA)     │   │
│   │ Public Key      │         └───────────┘      └───────────┘   │
│   │ (shared)        │                                             │
│   └─────────────────┘                                             │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### Smart Wallet Derivation

The smart wallet address is a Program Derived Address (PDA) derived from:
1. The passkey's public key
2. A program ID (Lazorkit's smart wallet program)
3. Seeds for deterministic derivation

This means the same passkey always produces the same wallet address—crucial for session persistence.

## Implementation Walkthrough

### Step 1: Set Up the Provider

First, wrap your app with `LazorkitProvider`:

```typescript
// app/lib/lazorkit/provider.tsx
'use client';

import { LazorkitProvider as BaseLazorkitProvider } from '@lazorkit/wallet';
import { SOLANA_RPC_URL } from '@/app/lib/solana/constants';

interface LazorkitProviderProps {
  children: React.ReactNode;
}

export function LazorkitProvider({ children }: LazorkitProviderProps) {
  return (
    <BaseLazorkitProvider rpcUrl={SOLANA_RPC_URL}>
      {children}
    </BaseLazorkitProvider>
  );
}
```

The provider:
- Initializes the Lazorkit SDK
- Configures the Solana RPC endpoint
- Provides wallet context to all child components

### Step 2: Create the Wallet Hook

Create a custom hook that wraps the SDK's `useWallet`:

```typescript
// app/hooks/useLazorkit.ts
'use client';

import { useWallet } from '@lazorkit/wallet';
import { useCallback, useMemo, useState } from 'react';
import { transformError } from '@/app/lib/errors';

export interface LazorkitState {
  walletAddress: string | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LazorkitActions {
  createWallet: () => Promise<void>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

export function useLazorkit(): LazorkitState & LazorkitActions {
  const {
    smartWalletPubkey,
    isConnected,
    isLoading: sdkIsLoading,
    connect,
    disconnect,
  } = useWallet();

  const [localError, setLocalError] = useState<string | null>(null);
  const [isOperating, setIsOperating] = useState(false);

  // Convert PublicKey to string for display
  const walletAddress = useMemo(
    () => smartWalletPubkey?.toString() ?? null,
    [smartWalletPubkey]
  );

  // Create new wallet with passkey
  const createWallet = useCallback(async () => {
    setLocalError(null);
    setIsOperating(true);
    
    try {
      await connect(); // Triggers WebAuthn credential creation
    } catch (err) {
      setLocalError(transformError(err));
    } finally {
      setIsOperating(false);
    }
  }, [connect]);

  // Login with existing passkey
  const login = useCallback(async () => {
    setLocalError(null);
    setIsOperating(true);
    
    try {
      await connect(); // SDK detects existing credentials
    } catch (err) {
      setLocalError(transformError(err));
    } finally {
      setIsOperating(false);
    }
  }, [connect]);

  // Disconnect wallet
  const logout = useCallback(async () => {
    setLocalError(null);
    setIsOperating(true);
    
    try {
      await disconnect();
    } catch (err) {
      setLocalError(transformError(err));
    } finally {
      setIsOperating(false);
    }
  }, [disconnect]);

  return {
    walletAddress,
    isConnected,
    isLoading: sdkIsLoading || isOperating,
    error: localError,
    createWallet,
    login,
    logout,
  };
}
```

**Why wrap the SDK hook?**
1. **Type safety**: Define explicit interfaces for state and actions
2. **Error handling**: Transform SDK errors to user-friendly messages
3. **Stability**: Your components depend on your interface, not the SDK's

### Step 3: Build the UI Component

Create a component that uses the hook:

```typescript
// app/components/WalletButton.tsx
'use client';

import { useLazorkit } from '@/app/hooks/useLazorkit';
import { formatAddress } from '@/app/lib/validation';

export function WalletButton() {
  const {
    walletAddress,
    isConnected,
    isLoading,
    error,
    createWallet,
    login,
    logout,
  } = useLazorkit();

  // Connected: show address and disconnect
  if (isConnected && walletAddress) {
    return (
      <div className="wallet-connected">
        <span className="wallet-address">
          {formatAddress(walletAddress)}
        </span>
        <button onClick={logout} disabled={isLoading}>
          {isLoading ? 'Disconnecting...' : 'Disconnect'}
        </button>
      </div>
    );
  }

  // Disconnected: show create/login options
  return (
    <div className="wallet-actions">
      <button onClick={createWallet} disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Wallet with Passkey'}
      </button>
      <button onClick={login} disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login with Passkey'}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

### Step 4: Handle Session Persistence

Restore sessions automatically on page load:

```typescript
// In useLazorkit.ts - session restoration logic
useEffect(() => {
  // Only attempt restore once
  if (restoreAttemptedRef.current) return;
  if (isConnected) return;
  
  // Check for stored session
  if (!hasStoredSession()) {
    setHasAttemptedRestore(true);
    return;
  }

  const restoreSession = async () => {
    restoreAttemptedRef.current = true;
    setIsRestoring(true);
    
    try {
      await connect(); // SDK uses stored credentials
    } catch (err) {
      // Invalid/expired session - clear and prompt re-auth
      clearStoredSession();
    } finally {
      setIsRestoring(false);
      setHasAttemptedRestore(true);
    }
  };

  restoreSession();
}, [isConnected, connect]);
```

## Flow Diagram

### Wallet Creation Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        WALLET CREATION FLOW                              │
└─────────────────────────────────────────────────────────────────────────┘

     User                    Browser                  Lazorkit              Solana
       │                        │                        │                    │
       │  Click "Create"        │                        │                    │
       │───────────────────────▶│                        │                    │
       │                        │                        │                    │
       │                        │  navigator.credentials │                    │
       │                        │  .create()             │                    │
       │                        │───────────────────────▶│                    │
       │                        │                        │                    │
       │  Biometric Prompt      │                        │                    │
       │◀───────────────────────│                        │                    │
       │                        │                        │                    │
       │  Authenticate          │                        │                    │
       │───────────────────────▶│                        │                    │
       │                        │                        │                    │
       │                        │  Credential Created    │                    │
       │                        │◀───────────────────────│                    │
       │                        │                        │                    │
       │                        │                        │  Derive PDA        │
       │                        │                        │─────────────────▶  │
       │                        │                        │                    │
       │                        │                        │  Smart Wallet Addr │
       │                        │                        │◀─────────────────  │
       │                        │                        │                    │
       │                        │  Store Session         │                    │
       │                        │◀───────────────────────│                    │
       │                        │                        │                    │
       │  Wallet Ready!         │                        │                    │
       │◀───────────────────────│                        │                    │
       │                        │                        │                    │
```

### Session Restoration Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      SESSION RESTORATION FLOW                            │
└─────────────────────────────────────────────────────────────────────────┘

     Page Load               localStorage              Lazorkit              
         │                        │                        │                 
         │  Check for session     │                        │                 
         │───────────────────────▶│                        │                 
         │                        │                        │                 
         │  Session data found    │                        │                 
         │◀───────────────────────│                        │                 
         │                        │                        │                 
         │  connect() with stored credentials              │                 
         │────────────────────────────────────────────────▶│                 
         │                        │                        │                 
         │                        │                        │  Verify         
         │                        │                        │  credential     
         │                        │                        │                 
         │  Wallet restored (no biometric needed)          │                 
         │◀────────────────────────────────────────────────│                 
         │                        │                        │                 
```

## Common Pitfalls

### 1. WebAuthn Requires Secure Context

**Problem**: Passkey operations fail silently or throw errors.

**Cause**: WebAuthn only works on:
- `https://` URLs
- `localhost` (for development)

**Solution**: 
```bash
# Use localhost, not 127.0.0.1
npm run dev
# Opens http://localhost:3000 ✓
# NOT http://127.0.0.1:3000 ✗
```

### 2. "A passkey already exists for this device"

**Problem**: `InvalidStateError` when creating a wallet.

**Cause**: WebAuthn prevents duplicate credentials for the same (origin, user) pair.

**Solution**: Use "Login with Passkey" instead, or clear browser credentials:
```typescript
// In error handling
if (error.message.includes('InvalidStateError')) {
  return 'A passkey already exists. Try logging in instead.';
}
```

### 3. Session Not Persisting

**Problem**: User has to re-authenticate on every page refresh.

**Cause**: Session data not being stored or restored properly.

**Solution**: Ensure session restoration runs on mount:
```typescript
useEffect(() => {
  // Check for stored session on mount
  if (hasStoredSession()) {
    restoreSession();
  }
}, []); // Empty deps = run once on mount
```

### 4. "NotAllowedError" on Mobile

**Problem**: Passkey creation fails on mobile browsers.

**Cause**: User cancelled the prompt, or the browser doesn't support the authenticator type.

**Solution**: 
- Ensure the user completes the biometric prompt
- Test on browsers with WebAuthn support (Safari iOS 16+, Chrome Android)
- Provide clear instructions to users

### 5. Cross-Device Passkeys Not Working

**Problem**: User created passkey on phone, can't use on desktop.

**Cause**: Platform authenticators (Face ID, Touch ID) are device-bound by default.

**Solution**: 
- Use roaming authenticators (security keys) for cross-device
- Or use passkey syncing (iCloud Keychain, Google Password Manager)
- Inform users about device-specific nature of passkeys

### 6. Wallet Address Different Than Expected

**Problem**: Same user gets different wallet addresses.

**Cause**: Different passkeys = different public keys = different PDAs.

**Solution**: 
- Each passkey creates a unique wallet
- Use session persistence to maintain the same wallet
- Consider implementing account recovery flows

## Testing Passkey Flows

Since WebAuthn requires user interaction, testing requires special approaches:

```typescript
// Mock the WebAuthn API for unit tests
const mockCredential = {
  id: 'test-credential-id',
  rawId: new ArrayBuffer(32),
  response: {
    clientDataJSON: new ArrayBuffer(0),
    attestationObject: new ArrayBuffer(0),
  },
  type: 'public-key',
};

// In tests
jest.spyOn(navigator.credentials, 'create').mockResolvedValue(mockCredential);
```

For integration testing, use browser automation tools that support WebAuthn:
- Playwright with `browserContext.addInitScript()`
- Puppeteer with `page.setBypassCSP()`

## Next Steps

- [Gasless Transactions Tutorial](./gasless-transaction.md) - Learn how to send transactions without gas fees
- [Lazorkit Documentation](https://docs.lazorkit.com) - Official SDK documentation
- [WebAuthn Guide](https://webauthn.guide/) - Deep dive into the WebAuthn standard
