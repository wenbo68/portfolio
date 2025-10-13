import '~/styles/globals.css';

import { type Metadata } from 'next';
import { Geist } from 'next/font/google';

import { TRPCReactProvider } from '~/trpc/react';
import { TopNav } from './_components/nav/TopNav';
import BotNav from './_components/nav/BotNav';

export const metadata: Metadata = {
  title: 'Wenbo Liu',
  description: 'My personal portfolio website.',
};

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body className="bg-gray-950 text-gray-400">
        <TRPCReactProvider>
          <TopNav />
          <main className="max-w-2xl mx-auto pt-8 sm:pt-12 md:pt-14 lg:pt-16 xl:pt-18 pb-12 sm:pb-16 md:pb-18 lg:pb-20 xl:pb-22 px-3">
            {children}
          </main>
          <BotNav />
        </TRPCReactProvider>
      </body>
    </html>
  );
}

// just add pay popup and make it call the trpc mutation
