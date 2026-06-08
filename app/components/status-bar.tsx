'use client';

import { useEffect, useState } from 'react';

export function StatusBar(): React.ReactElement {
  const [lastTick, setLastTick] = useState<string>('—');

  useEffect(() => {
    // Could poll /api/health or read from a state endpoint
    setLastTick('awaiting first tick');
  }, []);

  return (
    <div className="border-b border-[var(--border)] bg-[var(--bg-primary)] px-4 py-1.5 text-xs text-[var(--text-secondary)]">
      <div className="mx-auto flex max-w-6xl gap-4">
        <span>Last tick: {lastTick}</span>
        <span>
          Status: <span className="text-[var(--accent-green)]">Running</span>
        </span>
      </div>
    </div>
  );
}
