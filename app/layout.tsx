import type { Metadata } from 'next';

import { Nav } from './components/nav';
import { StatusBar } from './components/status-bar';
import './globals.css';

export const metadata: Metadata = {
  title: 'MonkeyTrader — AI Paper Trading Dashboard',
  description:
    'AI-powered paper trading bot monitoring stocks and crypto 24/7 with full decision transparency.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="en" className="dark">
      <body>
        <Nav />
        <StatusBar />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
