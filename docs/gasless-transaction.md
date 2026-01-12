# Gasless Transactions Tutorial

This tutorial explains how Lazorkit enables gasless transactions on Solana and how to implement them in your application.

## Table of Contents

1. [What Are Gasless Transactions?](#what-are-gasless-transactions)
2. [How Lazorkit Paymasters Work](#how-lazorkit-paymasters-work)
3. [Implementation Walkthrough](#implementation-walkthrough)
4. [Flow Diagram](#flow-diagram)
5. [Common Pitfalls](#common-pitfalls)

## What Are Gasless Transactions?

On Solana, every transaction requires a fee (gas) paid in SOL. This creates friction for new users who need to acquire SOL before they can do anything.

Gasless transactions solve this by having a third party (the paymaster) pay the transaction fees on behalf of the user.

### Traditional vs Gasless

| Traditional Transaction | Gasless Transaction |
|------------------------|---------------------|
| User pays ~0.000005 SOL fee | Paymaster pays the fee |
| User needs SOL balance | User can have zero SOL |
| Direct transaction submission | Transaction wrapped by paymaster |
| User signs once | User signs once (same UX) |

### Why Gasless Matters

1. **Onboarding**: New users can interact immediately without buying SOL
2. **UX**: No confusing "insufficient funds for gas" errors
3. **Adoption**: Lower barrier to entry for mainstream users
4. **Sponsorship**: Apps can subsidize user transactions

## How Lazorkit Paymasters Work

Lazorkit's paymaster service wraps user transactions and pays the fees:

```
┌──────────────────────────────────────────────────────────────────┐
│                     PAYMASTER ARCHITECTURE                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│   User Transaction              Paymaster                Solana   │
│   ┌─────────────────┐         ┌───────────┐         ┌─────────┐  │
│   │ Transfer 1 SOL  │         │ Wraps tx  │         │ Executes│  │
│   │ to recipient    │────────▶│ Pays fee  │────────▶│ transfer│  │
│   │ (no fee)        │         │ Submits   │         │         │  │
│   └─────────────────┘         └───────────┘         └─────────┘  │
│                                     │                             │
│                                     ▼                             │
│                              ┌───────────┐                        │
│                              │ Paymaster │                        │
│                              │ SOL Pool  │                        │
│                              └───────────┘                        │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### Smart Wallet Role

Gasless transactions work through Lazorkit's smart wallet (PDA):

1. **User signs** the transaction intent with their passkey
2. **Smart wallet** validates the signature
3. **Paymaster** wraps the transaction and pays fees
4. **Solana** executes the transfer from the smart wallet

The smart wallet acts as an intermediary that can accept sponsored transactions.

## Implementation Walkthrough

### Step 1: Create the Transfer Hook

Build a hook that handles transfer logic:

```typescript
// app/hooks/useTransfer.ts
'use client';

import { useWallet } from '@lazorkit/wallet';
import { SystemProgram, PublicKey } from '@solana/web3.js';
import { useState, useCallback } from 'react';
import { isValidSolanaAddress } from '@/app/lib/validation';
import { transformError } from '@/app/lib/errors';
import { LAMPORTS_PER_SOL } from '@/app/lib/solana/constants';

export type TransactionStatus = 'idle' | 'pending' | 'confirmed' | 'failed';

export interface TransferState {
  isSubmitting: boolean;
  signature: string | null;
  error: string | null;
  status: TransactionStatus;
}

export interface TransferActions {
  transfer: (recipient: string, amount: number) => Promise<string>;
  reset: () => void;
}

const initialState: TransferState = {
  isSubmitting: false,
  signature: null,
  error: null,
  status: 'idle',
};

export function useTransfer(): TransferState & TransferActions {
  const { smartWalletPubkey, signAndSendTransaction } = useWallet();
  const [state, setState] = useState<TransferState>(initialState);

  const transfer = useCallback(
    async (recipient: string, amount: number): Promise<string> => {
      // Validation
      if (!smartWalletPubkey) {
        throw new Error('Wallet not connected');
      }
      if (!isValidSolanaAddress(recipient)) {
        throw new Error('Invalid recipient address');
      }
      if (amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      setState({ ...initialState, isSubmitting: true, status: 'pending' });

      try {
        // Build the transfer instruction
        const instruction = SystemProgram.transfer({
          fromPubkey: smartWalletPubkey,
          toPubkey: new PublicKey(recipient),
          lamports: Math.floor(amount * LAMPORTS_PER_SOL),
        });

        // Submit via Lazorkit (gasless!)
        const signature = await signAndSendTransaction({
          instructions: [instruction],
        });

        setState({
          isSubmitting: false,
          signature,
          error: null,
          status: 'confirmed',
        });

        return signature;
      } catch (err) {
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
    [smartWalletPubkey, signAndSendTransaction]
  );

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return { ...state, transfer, reset };
}
```

**Key Points:**
- `signAndSendTransaction` is the magic—it routes through the paymaster
- We pass an `instructions` array, not a full transaction
- The SDK handles fee payment, signing, and submission

### Step 2: Build the Transfer Form

Create a form component that uses the hook:

```typescript
// app/components/TransferForm.tsx
'use client';

import { useState, FormEvent } from 'react';
import { useTransfer } from '@/app/hooks/useTransfer';
import { useLazorkit } from '@/app/hooks/useLazorkit';
import { TransactionStatus } from '@/app/components/TransactionStatus';

export function TransferForm() {
  const { isConnected } = useLazorkit();
  const { isSubmitting, signature, error, status, transfer, reset } = useTransfer();
  
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum)) return;

    try {
      await transfer(recipient, amountNum);
      // Clear form on success
      setRecipient('');
      setAmount('');
    } catch {
      // Error handled by hook
    }
  };

  if (!isConnected) {
    return <p>Connect your wallet to send transactions</p>;
  }

  return (
    <div className="transfer-form">
      <h2>Send SOL (Gasless)</h2>
      
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="recipient">Recipient Address</label>
          <input
            id="recipient"
            type="text"
            placeholder="Enter Solana address"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>

        <div>
          <label htmlFor="amount">Amount (SOL)</label>
          <input
            id="amount"
            type="number"
            placeholder="0.001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step="0.001"
            min="0"
            disabled={isSubmitting}
            required
          />
        </div>

        <button type="submit" disabled={isSubmitting || !recipient || !amount}>
          {isSubmitting ? 'Sending...' : 'Send SOL'}
        </button>
      </form>

      {/* Show transaction result */}
      {(signature || error) && (
        <TransactionStatus
          signature={signature}
          error={error}
          status={status}
          onReset={reset}
        />
      )}
    </div>
  );
}
```

### Step 3: Display Transaction Status

Show the result with an explorer link:

```typescript
// app/components/TransactionStatus.tsx
'use client';

import { TransactionStatus as TxStatus } from '@/app/hooks/useTransfer';

interface TransactionStatusProps {
  signature: string | null;
  error: string | null;
  status: TxStatus;
  onReset?: () => void;
}

function getExplorerUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}

export function TransactionStatus({
  signature,
  error,
  status,
  onReset,
}: TransactionStatusProps) {
  if (status === 'pending') {
    return <div className="pending">Transaction pending...</div>;
  }

  if (status === 'confirmed' && signature) {
    return (
      <div className="success">
        <p>Transaction Confirmed!</p>
        <a
          href={getExplorerUrl(signature)}
          target="_blank"
          rel="noopener noreferrer"
        >
          View on Explorer →
        </a>
        {onReset && <button onClick={onReset}>Send Another</button>}
      </div>
    );
  }

  if (status === 'failed' && error) {
    return (
      <div className="error">
        <p>Transaction Failed</p>
        <p>{error}</p>
        {onReset && <button onClick={onReset}>Try Again</button>}
      </div>
    );
  }

  return null;
}
```

### Step 4: Validate Addresses

Always validate before submission:

```typescript
// app/lib/validation.ts
import { PublicKey } from '@solana/web3.js';

/**
 * Validates if a string is a valid Solana address.
 * Uses PublicKey constructor which throws on invalid addresses.
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}
```

## Flow Diagram

### Complete Gasless Transaction Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     GASLESS TRANSACTION FLOW                             │
└─────────────────────────────────────────────────────────────────────────┘

     User                    App                     Lazorkit              Solana
       │                      │                         │                    │
       │  Enter recipient     │                         │                    │
       │  & amount            │                         │                    │
       │─────────────────────▶│                         │                    │
       │                      │                         │                    │
       │                      │  Validate inputs        │                    │
       │                      │  (address format,       │                    │
       │                      │   amount > 0)           │                    │
       │                      │                         │                    │
       │                      │  Build instruction      │                    │
       │                      │  SystemProgram.transfer │                    │
       │                      │─────────────────────────▶                    │
       │                      │                         │                    │
       │  Passkey prompt      │                         │                    │
       │◀─────────────────────│                         │                    │
       │                      │                         │                    │
       │  Authenticate        │                         │                    │
       │─────────────────────▶│                         │                    │
       │                      │                         │                    │
       │                      │  signAndSendTransaction │                    │
       │                      │─────────────────────────▶                    │
       │                      │                         │                    │
       │                      │                         │  Paymaster wraps   │
       │                      │                         │  transaction       │
       │                      │                         │                    │
       │                      │                         │  Pays fee from     │
       │                      │                         │  paymaster pool    │
       │                      │                         │                    │
       │                      │                         │  Submit to Solana  │
       │                      │                         │───────────────────▶│
       │                      │                         │                    │
       │                      │                         │  Transaction       │
       │                      │                         │  confirmed         │
       │                      │                         │◀───────────────────│
       │                      │                         │                    │
       │                      │  Return signature       │                    │
       │                      │◀─────────────────────────                    │
       │                      │                         │                    │
       │  Show success +      │                         │                    │
       │  explorer link       │                         │                    │
       │◀─────────────────────│                         │                    │
       │                      │                         │                    │
```

### What Happens Behind the Scenes

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     PAYMASTER TRANSACTION WRAPPING                       │
└─────────────────────────────────────────────────────────────────────────┘

  Original User Intent                    Wrapped Transaction
  ┌─────────────────────┐                ┌─────────────────────────────┐
  │                     │                │ Fee Payer: Paymaster        │
  │ Transfer 1 SOL      │                │                             │
  │ From: SmartWallet   │   ──────▶      │ Instructions:               │
  │ To: Recipient       │                │   1. Transfer 1 SOL         │
  │                     │                │      From: SmartWallet      │
  │ (No fee specified)  │                │      To: Recipient          │
  │                     │                │                             │
  └─────────────────────┘                │ Signatures:                 │
                                         │   - Paymaster (fee)         │
                                         │   - SmartWallet (transfer)  │
                                         └─────────────────────────────┘
```

## Common Pitfalls

### 1. "Wallet not connected" Error

**Problem**: Transfer fails immediately with wallet error.

**Cause**: Attempting to transfer before wallet connection is complete.

**Solution**: Check `isConnected` before rendering the form:
```typescript
if (!isConnected) {
  return <p>Connect your wallet first</p>;
}
```

### 2. Invalid Address Format

**Problem**: Transaction fails with "Invalid recipient address".

**Cause**: The recipient address isn't a valid Solana public key.

**Solution**: Validate before submission:
```typescript
if (!isValidSolanaAddress(recipient)) {
  setError('Please enter a valid Solana address');
  return;
}
```

### 3. Amount Precision Issues

**Problem**: User enters 0.1 SOL but wrong amount is sent.

**Cause**: Floating-point precision errors when converting to lamports.

**Solution**: Use `Math.floor()` for lamport conversion:
```typescript
// Good
const lamports = Math.floor(amount * LAMPORTS_PER_SOL);

// Bad - may have precision issues
const lamports = amount * LAMPORTS_PER_SOL;
```

### 4. Transaction Timeout

**Problem**: Transaction hangs in "pending" state.

**Cause**: Network congestion or RPC issues.

**Solution**: 
- Use a reliable RPC provider
- Implement timeout handling:
```typescript
const timeout = setTimeout(() => {
  setState({ ...state, error: 'Transaction timed out', status: 'failed' });
}, 30000);

try {
  const sig = await signAndSendTransaction({ instructions });
  clearTimeout(timeout);
  // ...
} catch (err) {
  clearTimeout(timeout);
  // ...
}
```

### 5. Paymaster Rate Limits

**Problem**: Transactions fail with rate limit errors.

**Cause**: Too many transactions in a short period.

**Solution**:
- Implement request throttling
- Show appropriate error messages
- Consider upgrading paymaster tier for production

### 6. Insufficient Smart Wallet Balance

**Problem**: Transfer fails even though user has SOL.

**Cause**: The smart wallet (PDA) doesn't have enough SOL for the transfer amount (not the fee—that's covered).

**Solution**: 
- Check smart wallet balance before transfer
- Show clear error message:
```typescript
if (error.includes('insufficient')) {
  return 'Your wallet doesn\'t have enough SOL for this transfer';
}
```

### 7. Wrong Network

**Problem**: Transaction succeeds but funds don't appear.

**Cause**: App is on Devnet but user is checking Mainnet explorer.

**Solution**: 
- Always include `?cluster=devnet` in explorer links
- Show network indicator in UI:
```typescript
<span className="network-badge">Devnet</span>
```

### 8. Passkey Prompt Cancelled

**Problem**: Transaction fails after user dismisses passkey prompt.

**Cause**: User cancelled the WebAuthn authentication.

**Solution**: Handle the specific error:
```typescript
if (error.message.includes('NotAllowedError')) {
  return 'Transaction cancelled. Please try again and complete authentication.';
}
```

## Testing Gasless Transactions

### Manual Testing on Devnet

1. Create a wallet using the app
2. Get Devnet SOL from a faucet (for the recipient to verify receipt)
3. Send a small amount (0.001 SOL)
4. Verify on Solana Explorer

### Automated Testing

For unit tests, mock the SDK:

```typescript
const mockSignAndSendTransaction = jest.fn().mockResolvedValue('mock-signature');

jest.mock('@lazorkit/wallet', () => ({
  useWallet: () => ({
    smartWalletPubkey: new PublicKey('...'),
    signAndSendTransaction: mockSignAndSendTransaction,
  }),
}));

test('transfer calls signAndSendTransaction with correct instruction', async () => {
  const { result } = renderHook(() => useTransfer());
  
  await act(async () => {
    await result.current.transfer('recipient-address', 1);
  });
  
  expect(mockSignAndSendTransaction).toHaveBeenCalledWith({
    instructions: expect.arrayContaining([
      expect.objectContaining({
        programId: SystemProgram.programId,
      }),
    ]),
  });
});
```

## Next Steps

- [Passkey Wallet Tutorial](./passkey-wallet.md) - Learn about passkey-based authentication
- [Lazorkit Documentation](https://docs.lazorkit.com) - Official SDK documentation
- [Solana Web3.js Docs](https://solana-labs.github.io/solana-web3.js/) - Transaction building reference
