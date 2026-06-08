const HARD_LIMIT_MS = 55_000;

export class TimeBudget {
  private startTime: number;
  private limit: number;

  constructor(limitMs = HARD_LIMIT_MS) {
    this.startTime = Date.now();
    this.limit = limitMs;
  }

  elapsed(): number {
    return Date.now() - this.startTime;
  }

  remaining(): number {
    return Math.max(0, this.limit - this.elapsed());
  }

  canProceed(estimatedMs: number): boolean {
    return this.remaining() > estimatedMs;
  }

  isExpired(): boolean {
    return this.elapsed() >= this.limit;
  }
}
