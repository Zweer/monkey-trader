/**
 * Validate indicators against real market data.
 * Fetches history from Binance (no auth needed) and computes indicators.
 * Compare output manually against TradingView for spot-checking.
 *
 * Usage: npx tsx scripts/validate-indicators.ts
 */

import { fetchHistory } from '../lib/data/fetcher';
import { computeIndicators } from '../lib/indicators';

async function main(): Promise<void> {
  console.log('Fetching BTC 200-day history from Binance...');
  const history = await fetchHistory({ symbol: 'BTC', type: 'crypto' }, 200);

  if (history.length === 0) {
    console.error('No data received. Check network.');
    process.exit(1);
  }

  console.log(`Got ${history.length} bars. Last close: $${history[history.length - 1].close}\n`);

  const currentPrice = history[history.length - 1].close;
  const currentVolume = history[history.length - 1].volume;
  const result = computeIndicators(history, currentPrice, currentVolume);

  console.log('=== Indicator Results (BTC) ===');
  console.log(`  RSI(14):    ${result.rsi14?.toFixed(2) ?? 'N/A'}`);
  console.log(`  MACD Line:  ${result.macd?.line.toFixed(4) ?? 'N/A'}`);
  console.log(`  MACD Signal:${result.macd?.signal.toFixed(4) ?? 'N/A'}`);
  console.log(`  MACD Hist:  ${result.macd?.histogram.toFixed(4) ?? 'N/A'}`);
  console.log(`  MA(20):     ${result.ma20?.toFixed(2) ?? 'N/A'}`);
  console.log(`  MA(50):     ${result.ma50?.toFixed(2) ?? 'N/A'}`);
  console.log(`  MA(200):    ${result.ma200?.toFixed(2) ?? 'N/A'}`);
  console.log(`  BB Upper:   ${result.bollingerBands?.upper.toFixed(2) ?? 'N/A'}`);
  console.log(`  BB Middle:  ${result.bollingerBands?.middle.toFixed(2) ?? 'N/A'}`);
  console.log(`  BB Lower:   ${result.bollingerBands?.lower.toFixed(2) ?? 'N/A'}`);
  console.log(`  Vol SMA(20):${result.volumeSma20?.toFixed(0) ?? 'N/A'}`);
  console.log('');
  console.log(`  Signal Score: ${result.signalScore}/5`);
  console.log(`  Direction:    ${result.direction}`);
  console.log('');
  console.log('  Signals:');
  for (const s of result.signals) {
    console.log(`    [${s.signal}] ${s.indicator}: ${s.reason}`);
  }

  console.log('\n✅ Compare values above with TradingView (BTC/USDT, 1D) for validation.');
  console.log('   Acceptable deviation: ±0.5% due to floating point and data timing.');
}

main().catch(console.error);
