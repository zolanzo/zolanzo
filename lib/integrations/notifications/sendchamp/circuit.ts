/**
 * Lightweight circuit breaker for Sendchamp outbound calls.
 */

export type CircuitState = "closed" | "open" | "half_open";

export class CircuitBreaker {
  private failures = 0;
  private openUntil = 0;
  private halfOpenProbe = false;

  constructor(
    private readonly threshold = 5,
    private readonly cooldownMs = 60_000,
  ) {}

  get state(): CircuitState {
    if (Date.now() < this.openUntil) return "open";
    if (this.openUntil > 0 && Date.now() >= this.openUntil) return "half_open";
    return "closed";
  }

  allow(): boolean {
    const s = this.state;
    if (s === "open") return false;
    if (s === "half_open") {
      if (this.halfOpenProbe) return false;
      this.halfOpenProbe = true;
      return true;
    }
    return true;
  }

  recordSuccess(): void {
    this.failures = 0;
    this.openUntil = 0;
    this.halfOpenProbe = false;
  }

  recordFailure(): void {
    this.failures += 1;
    this.halfOpenProbe = false;
    if (this.failures >= this.threshold) {
      this.openUntil = Date.now() + this.cooldownMs;
    }
  }

  snapshot(): {
    state: CircuitState;
    failures: number;
    openUntil: number | null;
  } {
    return {
      state: this.state,
      failures: this.failures,
      openUntil: this.openUntil > 0 ? this.openUntil : null,
    };
  }

  reset(): void {
    this.failures = 0;
    this.openUntil = 0;
    this.halfOpenProbe = false;
  }
}

export const sendchampCircuit = new CircuitBreaker(5, 60_000);
