'use client';

import type { ReactNode } from 'react';
import { TRPCReactProvider } from '~/trpc/react';
import { AuthProvider } from './AuthProvider';

export function ContextProviders({ children }: { children: ReactNode }) {
  // Since this file starts with "use client",
  // everything in it, including FilterProvider,
  // can safely use client-side hooks.
  return (
    <TRPCReactProvider>
      <AuthProvider>{children}</AuthProvider>
    </TRPCReactProvider>
  );
}
