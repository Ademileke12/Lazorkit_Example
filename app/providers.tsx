'use client';

/**
 * Root Providers Component
 * 
 * Composes all application providers in a single component for use in the
 * root layout. This pattern keeps the layout clean and makes it easy to
 * add or modify providers in one place.
 * 
 * Design Decision: Separating providers into their own component:
 * 1. Keeps layout.tsx focused on structure
 * 2. Makes provider composition explicit and maintainable
 * 3. Allows for easy testing with different provider configurations
 */

import { LazorkitProvider } from '@/app/lib/lazorkit/provider';

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Root providers wrapper that composes all application-level providers.
 * 
 * Currently includes:
 * - LazorkitProvider: Enables passkey-based wallet functionality
 * 
 * Usage in layout.tsx:
 * ```tsx
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <Providers>{children}</Providers>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <LazorkitProvider>
      {children}
    </LazorkitProvider>
  );
}

export default Providers;
