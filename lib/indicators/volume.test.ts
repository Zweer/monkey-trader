import { describe, expect, it } from 'vitest';

import { calculateVolumeSMA } from './volume';

describe('calculateVolumeSMA', () => {
  it('should return null with insufficient data', () => {
    expect(calculateVolumeSMA([100, 200], 20)).toBeNull();
  });

  it('should compute correct volume SMA', () => {
    const volumes = Array(20).fill(1000);
    expect(calculateVolumeSMA(volumes, 20)).toBe(1000);
  });

  it('should average last N volumes', () => {
    const volumes = [...Array(15).fill(500), ...Array(5).fill(1500)];
    // last 20: 15*500 + 5*1500 = 7500 + 7500 = 15000 / 20 = 750
    expect(calculateVolumeSMA(volumes, 20)).toBe(750);
  });
});
