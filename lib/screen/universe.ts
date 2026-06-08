import type { Ticker } from '@/lib/data/types';

export type UniverseTicker = Ticker & { name: string; sector: string };

const EXCLUDED_CRYPTO = new Set([
  'USDT',
  'USDC',
  'DAI',
  'BUSD',
  'TUSD',
  'FDUSD',
  'USDP',
  'WBTC',
  'WETH',
  'STETH',
  'WBETH',
  'CBETH',
  'BTCUP',
  'BTCDOWN',
  'ETHUP',
  'ETHDOWN',
]);

export const SP100: UniverseTicker[] = [
  { symbol: 'AAPL', type: 'stock', name: 'Apple', sector: 'Technology' },
  { symbol: 'ABBV', type: 'stock', name: 'AbbVie', sector: 'Healthcare' },
  { symbol: 'ABT', type: 'stock', name: 'Abbott Labs', sector: 'Healthcare' },
  { symbol: 'ACN', type: 'stock', name: 'Accenture', sector: 'Technology' },
  { symbol: 'ADBE', type: 'stock', name: 'Adobe', sector: 'Technology' },
  { symbol: 'AIG', type: 'stock', name: 'AIG', sector: 'Financials' },
  { symbol: 'AMGN', type: 'stock', name: 'Amgen', sector: 'Healthcare' },
  { symbol: 'AMT', type: 'stock', name: 'American Tower', sector: 'Real Estate' },
  { symbol: 'AMZN', type: 'stock', name: 'Amazon', sector: 'Consumer' },
  { symbol: 'AVGO', type: 'stock', name: 'Broadcom', sector: 'Technology' },
  { symbol: 'AXP', type: 'stock', name: 'American Express', sector: 'Financials' },
  { symbol: 'BA', type: 'stock', name: 'Boeing', sector: 'Industrials' },
  { symbol: 'BAC', type: 'stock', name: 'Bank of America', sector: 'Financials' },
  { symbol: 'BK', type: 'stock', name: 'Bank of NY Mellon', sector: 'Financials' },
  { symbol: 'BKNG', type: 'stock', name: 'Booking Holdings', sector: 'Consumer' },
  { symbol: 'BLK', type: 'stock', name: 'BlackRock', sector: 'Financials' },
  { symbol: 'BMY', type: 'stock', name: 'Bristol-Myers', sector: 'Healthcare' },
  { symbol: 'C', type: 'stock', name: 'Citigroup', sector: 'Financials' },
  { symbol: 'CAT', type: 'stock', name: 'Caterpillar', sector: 'Industrials' },
  { symbol: 'CHTR', type: 'stock', name: 'Charter Comms', sector: 'Telecom' },
  { symbol: 'CL', type: 'stock', name: 'Colgate-Palmolive', sector: 'Consumer' },
  { symbol: 'CMCSA', type: 'stock', name: 'Comcast', sector: 'Telecom' },
  { symbol: 'COF', type: 'stock', name: 'Capital One', sector: 'Financials' },
  { symbol: 'COP', type: 'stock', name: 'ConocoPhillips', sector: 'Energy' },
  { symbol: 'COST', type: 'stock', name: 'Costco', sector: 'Consumer' },
  { symbol: 'CRM', type: 'stock', name: 'Salesforce', sector: 'Technology' },
  { symbol: 'CSCO', type: 'stock', name: 'Cisco', sector: 'Technology' },
  { symbol: 'CVS', type: 'stock', name: 'CVS Health', sector: 'Healthcare' },
  { symbol: 'CVX', type: 'stock', name: 'Chevron', sector: 'Energy' },
  { symbol: 'DE', type: 'stock', name: 'Deere', sector: 'Industrials' },
  { symbol: 'DHR', type: 'stock', name: 'Danaher', sector: 'Healthcare' },
  { symbol: 'DIS', type: 'stock', name: 'Disney', sector: 'Consumer' },
  { symbol: 'DUK', type: 'stock', name: 'Duke Energy', sector: 'Utilities' },
  { symbol: 'EMR', type: 'stock', name: 'Emerson', sector: 'Industrials' },
  { symbol: 'EXC', type: 'stock', name: 'Exelon', sector: 'Utilities' },
  { symbol: 'F', type: 'stock', name: 'Ford', sector: 'Consumer' },
  { symbol: 'FDX', type: 'stock', name: 'FedEx', sector: 'Industrials' },
  { symbol: 'GD', type: 'stock', name: 'General Dynamics', sector: 'Industrials' },
  { symbol: 'GE', type: 'stock', name: 'GE Aerospace', sector: 'Industrials' },
  { symbol: 'GILD', type: 'stock', name: 'Gilead', sector: 'Healthcare' },
  { symbol: 'GM', type: 'stock', name: 'General Motors', sector: 'Consumer' },
  { symbol: 'GOOG', type: 'stock', name: 'Alphabet A', sector: 'Technology' },
  { symbol: 'GOOGL', type: 'stock', name: 'Alphabet C', sector: 'Technology' },
  { symbol: 'GS', type: 'stock', name: 'Goldman Sachs', sector: 'Financials' },
  { symbol: 'HD', type: 'stock', name: 'Home Depot', sector: 'Consumer' },
  { symbol: 'HON', type: 'stock', name: 'Honeywell', sector: 'Industrials' },
  { symbol: 'IBM', type: 'stock', name: 'IBM', sector: 'Technology' },
  { symbol: 'INTC', type: 'stock', name: 'Intel', sector: 'Technology' },
  { symbol: 'INTU', type: 'stock', name: 'Intuit', sector: 'Technology' },
  { symbol: 'JNJ', type: 'stock', name: 'Johnson & Johnson', sector: 'Healthcare' },
  { symbol: 'JPM', type: 'stock', name: 'JPMorgan', sector: 'Financials' },
  { symbol: 'KHC', type: 'stock', name: 'Kraft Heinz', sector: 'Consumer' },
  { symbol: 'KO', type: 'stock', name: 'Coca-Cola', sector: 'Consumer' },
  { symbol: 'LIN', type: 'stock', name: 'Linde', sector: 'Materials' },
  { symbol: 'LLY', type: 'stock', name: 'Eli Lilly', sector: 'Healthcare' },
  { symbol: 'LMT', type: 'stock', name: 'Lockheed Martin', sector: 'Industrials' },
  { symbol: 'LOW', type: 'stock', name: "Lowe's", sector: 'Consumer' },
  { symbol: 'MA', type: 'stock', name: 'Mastercard', sector: 'Financials' },
  { symbol: 'MCD', type: 'stock', name: "McDonald's", sector: 'Consumer' },
  { symbol: 'MDLZ', type: 'stock', name: 'Mondelez', sector: 'Consumer' },
  { symbol: 'MDT', type: 'stock', name: 'Medtronic', sector: 'Healthcare' },
  { symbol: 'MET', type: 'stock', name: 'MetLife', sector: 'Financials' },
  { symbol: 'META', type: 'stock', name: 'Meta', sector: 'Technology' },
  { symbol: 'MMM', type: 'stock', name: '3M', sector: 'Industrials' },
  { symbol: 'MO', type: 'stock', name: 'Altria', sector: 'Consumer' },
  { symbol: 'MRK', type: 'stock', name: 'Merck', sector: 'Healthcare' },
  { symbol: 'MS', type: 'stock', name: 'Morgan Stanley', sector: 'Financials' },
  { symbol: 'MSFT', type: 'stock', name: 'Microsoft', sector: 'Technology' },
  { symbol: 'NEE', type: 'stock', name: 'NextEra Energy', sector: 'Utilities' },
  { symbol: 'NFLX', type: 'stock', name: 'Netflix', sector: 'Consumer' },
  { symbol: 'NKE', type: 'stock', name: 'Nike', sector: 'Consumer' },
  { symbol: 'NVDA', type: 'stock', name: 'NVIDIA', sector: 'Technology' },
  { symbol: 'ORCL', type: 'stock', name: 'Oracle', sector: 'Technology' },
  { symbol: 'PEP', type: 'stock', name: 'PepsiCo', sector: 'Consumer' },
  { symbol: 'PFE', type: 'stock', name: 'Pfizer', sector: 'Healthcare' },
  { symbol: 'PG', type: 'stock', name: 'Procter & Gamble', sector: 'Consumer' },
  { symbol: 'PM', type: 'stock', name: 'Philip Morris', sector: 'Consumer' },
  { symbol: 'PYPL', type: 'stock', name: 'PayPal', sector: 'Financials' },
  { symbol: 'QCOM', type: 'stock', name: 'Qualcomm', sector: 'Technology' },
  { symbol: 'RTX', type: 'stock', name: 'RTX', sector: 'Industrials' },
  { symbol: 'SBUX', type: 'stock', name: 'Starbucks', sector: 'Consumer' },
  { symbol: 'SCHW', type: 'stock', name: 'Schwab', sector: 'Financials' },
  { symbol: 'SO', type: 'stock', name: 'Southern Company', sector: 'Utilities' },
  { symbol: 'SPG', type: 'stock', name: 'Simon Property', sector: 'Real Estate' },
  { symbol: 'T', type: 'stock', name: 'AT&T', sector: 'Telecom' },
  { symbol: 'TGT', type: 'stock', name: 'Target', sector: 'Consumer' },
  { symbol: 'TMO', type: 'stock', name: 'Thermo Fisher', sector: 'Healthcare' },
  { symbol: 'TMUS', type: 'stock', name: 'T-Mobile', sector: 'Telecom' },
  { symbol: 'TSLA', type: 'stock', name: 'Tesla', sector: 'Consumer' },
  { symbol: 'TXN', type: 'stock', name: 'Texas Instruments', sector: 'Technology' },
  { symbol: 'UNH', type: 'stock', name: 'UnitedHealth', sector: 'Healthcare' },
  { symbol: 'UNP', type: 'stock', name: 'Union Pacific', sector: 'Industrials' },
  { symbol: 'UPS', type: 'stock', name: 'UPS', sector: 'Industrials' },
  { symbol: 'USB', type: 'stock', name: 'US Bancorp', sector: 'Financials' },
  { symbol: 'V', type: 'stock', name: 'Visa', sector: 'Financials' },
  { symbol: 'VZ', type: 'stock', name: 'Verizon', sector: 'Telecom' },
  { symbol: 'WFC', type: 'stock', name: 'Wells Fargo', sector: 'Financials' },
  { symbol: 'WMT', type: 'stock', name: 'Walmart', sector: 'Consumer' },
  { symbol: 'XOM', type: 'stock', name: 'Exxon Mobil', sector: 'Energy' },
];

export async function fetchCryptoUniverse(): Promise<UniverseTicker[]> {
  try {
    const res = await fetch('https://api.binance.com/api/v3/ticker/24hr', {
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return [];

    const data = (await res.json()) as Array<{ symbol: string; quoteVolume: string }>;

    return data
      .filter((t) => t.symbol.endsWith('USDT'))
      .sort((a, b) => Number(b.quoteVolume) - Number(a.quoteVolume))
      .slice(0, 50) // take top 50, then filter
      .map((t) => t.symbol.replace('USDT', ''))
      .filter((s) => !EXCLUDED_CRYPTO.has(s))
      .slice(0, 30)
      .map((symbol) => ({
        symbol,
        type: 'crypto' as const,
        name: symbol,
        sector: 'crypto',
      }));
  } catch {
    return [];
  }
}

export async function getFullUniverse(): Promise<UniverseTicker[]> {
  const crypto = await fetchCryptoUniverse();
  return [...SP100, ...crypto];
}
