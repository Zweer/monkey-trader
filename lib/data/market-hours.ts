const US_HOLIDAYS_2025: string[] = [
  '2025-01-01', // New Year's Day
  '2025-01-20', // MLK Day
  '2025-02-17', // Presidents' Day
  '2025-04-18', // Good Friday
  '2025-05-26', // Memorial Day
  '2025-06-19', // Juneteenth
  '2025-07-04', // Independence Day
  '2025-09-01', // Labor Day
  '2025-11-27', // Thanksgiving
  '2025-12-25', // Christmas
];

const US_HOLIDAYS_2026: string[] = [
  '2026-01-01', // New Year's Day
  '2026-01-19', // MLK Day
  '2026-02-16', // Presidents' Day
  '2026-04-03', // Good Friday
  '2026-05-25', // Memorial Day
  '2026-06-19', // Juneteenth
  '2026-07-03', // Independence Day (observed)
  '2026-09-07', // Labor Day
  '2026-11-26', // Thanksgiving
  '2026-12-25', // Christmas
];

const US_HOLIDAYS = new Set([...US_HOLIDAYS_2025, ...US_HOLIDAYS_2026]);

/**
 * Check if US stock market is currently open.
 * Market hours: Mon-Fri, 9:30-16:00 Eastern Time.
 */
export function isMarketOpen(now: Date = new Date()): boolean {
  const eastern = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));

  const day = eastern.getDay();
  if (day === 0 || day === 6) return false;

  const dateStr = `${eastern.getFullYear()}-${String(eastern.getMonth() + 1).padStart(2, '0')}-${String(eastern.getDate()).padStart(2, '0')}`;
  if (US_HOLIDAYS.has(dateStr)) return false;

  const hours = eastern.getHours();
  const minutes = eastern.getMinutes();
  const timeMinutes = hours * 60 + minutes;

  // 9:30 = 570, 16:00 = 960
  return timeMinutes >= 570 && timeMinutes < 960;
}
