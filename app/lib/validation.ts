import { PublicKey } from '@solana/web3.js';

/**
 * Validates if a string is a valid Solana address.
 * Uses PublicKey constructor which throws on invalid addresses.
 * A valid Solana address is a 32-byte base58-encoded string.
 */
export function isValidSolanaAddress(address: string): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }

  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Formats a wallet address for display (truncated).
 * Shows first and last N characters with ellipsis in between.
 * 
 * @param address - The full wallet address
 * @param chars - Number of characters to show at start and end (default: 4)
 * @returns Formatted address like "AbCd...WxYz"
 */
export function formatAddress(address: string, chars: number = 4): string {
  if (!address || typeof address !== 'string') {
    return '';
  }

  if (address.length <= chars * 2) {
    return address;
  }

  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
