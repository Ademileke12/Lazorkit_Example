# Lazorkit Example - Passkey-Based Solana Wallet

A Next.js example application demonstrating how to integrate [Lazorkit SDK](https://lazorkit.com) for passkey-based Solana wallets and gasless transactions.

## Why Lazorkit?

Traditional Solana wallets require users to manage seed phrases—a significant barrier for mainstream adoption. Lazorkit solves this by:

- **Passkey Authentication**: Users authenticate with biometrics (Face ID, Touch ID, Windows Hello) instead of memorizing 24-word seed phrases
- **Smart Wallets**: Program-derived addresses (PDAs) that enable advanced features like gasless transactions
- **Gasless Transactions**: Users can send transactions without holding SOL for gas fees—the paymaster covers it
- **Web2-like UX**: Familiar authentication patterns that don't require browser extensions or mobile apps

This example repository demonstrates these concepts with clean, reusable code you can adapt for your own projects.

## Features

- ✅ Create wallet with passkey (no seed phrase)
- ✅ Login with existing passkey
- ✅ Session persistence across page refreshes
- ✅ Gasless SOL transfers
- ✅ Transaction status with explorer links
- ✅ TypeScript throughout
- ✅ Clean, modular architecture

## Prerequisites

- Node.js 18+ 
- A browser that supports WebAuthn (Chrome, Safari, Firefox, Edge)
- A device with biometric authentication (or security key)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/lazorkit-example.git
cd lazorkit-example
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

4. Configure your RPC URL in `.env.local`:

```env
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
```

> **Note**: The public Devnet RPC works for development. For production, use a dedicated RPC provider like Helius, QuickNode, or Triton.

## Local Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |

## How It Works

### Passkey Wallet Creation Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   User      │     │  WebAuthn   │     │  Lazorkit   │     │   Solana    │
│   clicks    │────▶│  creates    │────▶│  derives    │────▶│   Smart     │
│   "Create"  │     │  passkey    │     │  wallet PDA │     │   Wallet    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

1. User clicks "Create Wallet with Passkey"
2. Browser prompts for biometric authentication (WebAuthn)
3. A cryptographic credential (passkey) is created and stored securely by the device
4. Lazorkit derives a deterministic smart wallet address from the passkey's public key
5. The wallet is ready to use—no seed phrase involved

### Gasless Transaction Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   User      │     │  Passkey    │     │  Paymaster  │     │   Solana    │
│   sends     │────▶│  signs      │────▶│  sponsors   │────▶│   confirms  │
│   transfer  │     │  transaction│     │  gas fees   │     │   transfer  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

1. User enters recipient address and amount
2. App creates a `SystemProgram.transfer` instruction
3. User authenticates with passkey to sign the transaction
4. Lazorkit's paymaster wraps the transaction and pays gas fees
5. Transaction is submitted to Solana and confirmed

## Project Structure

```
lazorkit-example/
├── app/
│   ├── components/          # React UI components
│   │   ├── WalletButton.tsx    # Connect/disconnect wallet
│   │   ├── TransferForm.tsx    # Send SOL form
│   │   └── TransactionStatus.tsx
│   ├── hooks/               # Custom React hooks
│   │   ├── useLazorkit.ts      # Wallet state & actions
│   │   └── useTransfer.ts      # Transfer logic
│   ├── lib/                 # Utilities
│   │   ├── lazorkit/           # SDK wrapper
│   │   ├── solana/             # Solana constants
│   │   ├── validation.ts       # Address validation
│   │   └── errors.ts           # Error handling
│   ├── layout.tsx           # Root layout with providers
│   ├── page.tsx             # Main page
│   └── providers.tsx        # Context providers
├── docs/                    # Tutorials
│   ├── passkey-wallet.md
│   └── gasless-transaction.md
└── __tests__/               # Test files
```

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `@lazorkit/wallet` | Passkey wallet SDK |
| `@solana/web3.js` | Solana JavaScript API |
| `next` | React framework |
| `fast-check` | Property-based testing |

## Tutorials

- [Passkey Wallet Creation](./docs/passkey-wallet.md) - Deep dive into WebAuthn and wallet creation
- [Gasless Transactions](./docs/gasless-transaction.md) - Understanding paymasters and fee sponsorship

## Deployment to Vercel

This app is optimized for Vercel deployment with a pre-configured `vercel.json`.

### Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/lazorkit-example&env=NEXT_PUBLIC_SOLANA_RPC_URL&envDescription=Solana%20RPC%20endpoint%20URL&envLink=https://docs.solana.com/cluster/rpc-endpoints)

### Manual Deployment

1. Push your code to GitHub

2. Import the project in [Vercel](https://vercel.com/new)

3. If deploying from a monorepo, set the **Root Directory** to `lazorkit-example`

4. Configure environment variables in Vercel dashboard:

   **Option A: Using Environment Variables UI**
   - Go to Project Settings → Environment Variables
   - Add `NEXT_PUBLIC_SOLANA_RPC_URL` with your RPC URL

   **Option B: Using Vercel CLI**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Add secret (recommended for sensitive values)
   vercel secrets add solana_rpc_url "https://api.devnet.solana.com"

   # Deploy
   vercel --prod
   ```

5. Deploy!

### Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_SOLANA_RPC_URL` | Yes | Solana RPC endpoint | `https://api.devnet.solana.com` |

### Vercel Configuration

The `vercel.json` file includes:
- Framework detection for Next.js
- Security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)
- Environment variable mapping

### RPC Providers for Production

For production deployments, consider using a dedicated RPC provider:

| Provider | Free Tier | Link |
|----------|-----------|------|
| Helius | 100k requests/month | [helius.dev](https://helius.dev) |
| QuickNode | 10M credits/month | [quicknode.com](https://quicknode.com) |
| Triton | 50M requests/month | [triton.one](https://triton.one) |
| Alchemy | 300M compute units/month | [alchemy.com](https://alchemy.com) |

> **Production Note**: For mainnet deployment, you'll need to configure Lazorkit for mainnet and use a production RPC provider.

## Testing

Run the test suite:

```bash
npm run test
```

The project uses Jest with React Testing Library for unit tests and fast-check for property-based tests.

## Troubleshooting

### "Passkey operation was cancelled"
The user dismissed the WebAuthn prompt. Try again and complete the biometric authentication.

### "A passkey already exists for this device"
You've already created a passkey on this device. Use "Login with Passkey" instead.

### "Network error"
Check your internet connection and verify the RPC URL is correct in `.env.local`.

### Passkey not working on localhost
Some browsers require HTTPS for WebAuthn. Try using `localhost` (not `127.0.0.1`) or deploy to a staging environment.

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT

## Resources

- [Lazorkit Documentation](https://docs.lazorkit.com)
- [Solana Web3.js Docs](https://solana-labs.github.io/solana-web3.js/)
- [WebAuthn Guide](https://webauthn.guide/)
- [Next.js Documentation](https://nextjs.org/docs)
