'use client';

import { useEffect, useState } from 'react';

type Decision = {
  id: number;
  ticker: string;
  timestamp: string;
  action: 'buy' | 'sell' | 'hold';
  sizePercent: number;
  confidence: number;
  reasoning: string;
  modelUsed: string;
  priceAtDecision: number;
  executed: boolean;
};

type Pagination = { page: number; limit: number; total: number; totalPages: number };

const ACTION_COLORS = {
  buy: 'bg-[var(--accent-green)]',
  sell: 'bg-[var(--accent-red)]',
  hold: 'bg-gray-500',
};

export default function DecisionsPage(): React.ReactElement {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [filterTicker, setFilterTicker] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  useEffect(() => {
    const params = new URLSearchParams({ page: String(pagination.page), limit: '20' });
    if (filterTicker) params.set('ticker', filterTicker);
    if (filterAction) params.set('action', filterAction);

    fetch(`/api/decisions?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setDecisions(data.decisions);
        setPagination(data.pagination);
      });
  }, [pagination.page, filterTicker, filterAction]);

  const toggleExpand = (id: number): void => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Filter by ticker"
          value={filterTicker}
          onChange={(e) => {
            setFilterTicker(e.target.value.toUpperCase());
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className="rounded border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 text-sm w-32"
          aria-label="Filter by ticker"
        />
        <select
          value={filterAction}
          onChange={(e) => {
            setFilterAction(e.target.value);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className="rounded border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 text-sm"
          aria-label="Filter by action"
        >
          <option value="">All actions</option>
          <option value="buy">Buy</option>
          <option value="sell">Sell</option>
          <option value="hold">Hold</option>
        </select>
      </div>

      {/* Decision list */}
      {decisions.length > 0 ? (
        <div className="space-y-2">
          {decisions.map((d) => (
            <div
              key={d.id}
              className="rounded border border-[var(--border)] bg-[var(--bg-card)] p-4"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-bold text-white ${ACTION_COLORS[d.action]}`}
                >
                  {d.action.toUpperCase()}
                </span>
                <span className="font-medium">{d.ticker}</span>
                <span className="text-[var(--text-secondary)] text-xs">
                  ${d.priceAtDecision.toFixed(2)} • {d.modelUsed}
                </span>
                <span className="ml-auto text-xs text-[var(--text-secondary)]">
                  {new Date(d.timestamp).toLocaleString()}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded bg-[var(--bg-secondary)] max-w-32">
                  <div
                    className="h-full rounded bg-[var(--accent-green)]"
                    style={{ width: `${d.confidence * 100}%` }}
                  />
                </div>
                <span className="text-xs text-[var(--text-secondary)]">
                  {(d.confidence * 100).toFixed(0)}%
                </span>
                <button
                  type="button"
                  onClick={() => toggleExpand(d.id)}
                  className="ml-auto text-xs text-[var(--text-secondary)] hover:text-white"
                  aria-expanded={expanded.has(d.id)}
                >
                  {expanded.has(d.id) ? 'Collapse' : 'Reasoning →'}
                </button>
              </div>
              {expanded.has(d.id) && (
                <div className="mt-3 rounded bg-[var(--bg-secondary)] p-3 text-sm text-[var(--text-secondary)]">
                  {d.reasoning}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded border border-[var(--border)] bg-[var(--bg-card)] px-6 py-12 text-center text-[var(--text-secondary)]">
          No decisions yet — waiting for first tick 🐒
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
            disabled={pagination.page <= 1}
            className="rounded border border-[var(--border)] px-3 py-1 text-sm disabled:opacity-50"
          >
            ← Prev
          </button>
          <span className="px-3 py-1 text-sm text-[var(--text-secondary)]">
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
            disabled={pagination.page >= pagination.totalPages}
            className="rounded border border-[var(--border)] px-3 py-1 text-sm disabled:opacity-50"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
