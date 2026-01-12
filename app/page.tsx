'use client';

/**
 * Main Page
 * 
 * The landing page for the Lazorkit example application.
 * Demonstrates passkey-based wallet creation and gasless transactions.
 * 
 * Design Decision: Simple, clean UI focused on SDK demonstration
 * rather than production aesthetics.
 * 
 * Requirements: 8.3
 */

import { WalletButton } from '@/app/components/WalletButton';
import { TransferForm } from '@/app/components/TransferForm';

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                Lazorkit
              </span>
              <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                Example
              </span>
            </div>
            <a
              href="https://github.com/user/lazorkit-example"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              GitHub
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="mb-12 text-center">
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
            Passkey Wallets on Solana
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            Create and manage Solana wallets using passkeys. No seed phrases, no
            browser extensions. Just your device&apos;s biometrics.
          </p>
        </section>

        {/* Wallet Section */}
        <section className="mb-12">
          <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-2 text-center text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              Connect Your Wallet
            </h2>
            <p className="mb-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
              Create a new wallet or login with an existing passkey
            </p>
            <WalletButton />
          </div>
        </section>

        {/* Transfer Section */}
        <section className="mb-12">
          <TransferForm />
        </section>

        {/* Info Section */}
        <section className="grid gap-6 sm:grid-cols-2">
          <InfoCard
            title="Passkey Authentication"
            description="Use your device's biometrics (Face ID, Touch ID, Windows Hello) to create and access your Solana wallet. No seed phrases to remember or lose."
          />
          <InfoCard
            title="Gasless Transactions"
            description="Send SOL without paying gas fees. Lazorkit's paymaster covers transaction costs, making it easy to onboard new users."
          />
          <InfoCard
            title="Smart Wallets"
            description="Your wallet is a program-derived address (PDA) controlled by your passkey. It's secure, recoverable, and works across devices."
          />
          <InfoCard
            title="Devnet Only"
            description="This example connects to Solana Devnet. Get free test SOL from a faucet to try out transfers."
          />
        </section>

        {/* Footer */}
        <footer className="mt-16 border-t border-zinc-200 pt-8 text-center dark:border-zinc-800">
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            Built with{' '}
            <a
              href="https://lazorkit.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              Lazorkit SDK
            </a>{' '}
            •{' '}
            <a
              href="https://nextjs.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              Next.js
            </a>{' '}
            •{' '}
            <a
              href="https://solana.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              Solana
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}

/**
 * Info card component for displaying feature highlights.
 */
function InfoCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-100">
        {title}
      </h3>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
    </div>
  );
}
