'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Portfolio' },
  { href: '/charts', label: 'Charts' },
  { href: '/decisions', label: 'Decisions' },
  { href: '/scorecard', label: 'Scorecard' },
];

export function Nav(): React.ReactElement {
  const pathname = usePathname();

  return (
    <nav
      className="border-b border-[var(--border)] bg-[var(--bg-secondary)]"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold">
          🐒 MonkeyTrader
        </Link>
        <ul className="flex gap-1">
          {NAV_ITEMS.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={`rounded px-3 py-1.5 text-sm transition-colors ${
                  pathname === href
                    ? 'bg-[var(--bg-card)] text-white'
                    : 'text-[var(--text-secondary)] hover:text-white'
                }`}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
