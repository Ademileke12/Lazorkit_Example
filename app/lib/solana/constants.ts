/**
 * Solana network constants and configuration.
 */

/**
 * Solana Devnet RPC URL.
 * Uses environment variable if available, falls back to public endpoint.
 */
export const SOLANA_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com';

/**
 * Solana Devnet RPC URL (explicit constant for clarity).
 */
export const SOLANA_DEVNET_RPC = 'https://api.devnet.solana.com';

/**
 * Number of lamports in one SOL.
 * 1 SOL = 1,000,000,000 lamports
 */
export const LAMPORTS_PER_SOL = 1_000_000_000;

/**
 * Solana Explorer base URL for Devnet.
 */
export const SOLANA_EXPLORER_URL = 'https://explorer.solana.com';

/**
 * Generates a Solana Explorer URL for a transaction on Devnet.
 * 
 * @param signature - The transaction signature
 * @returns Full URL to view the transaction on Solana Explorer
 */
export function getExplorerUrl(signature: string): string {
  return `${SOLANA_EXPLORER_URL}/tx/${signature}?cluster=devnet`;
}

/**
 * Generates a Solana Explorer URL for an account on Devnet.
 * 
 * @param address - The account address
 * @returns Full URL to view the account on Solana Explorer
 */
export function getAccountExplorerUrl(address: string): string {
  return `${SOLANA_EXPLORER_URL}/address/${address}?cluster=devnet`;
}
