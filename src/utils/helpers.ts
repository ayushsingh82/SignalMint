/**
 * Utility for retryable async operations with exponential backoff
 */
export class RetryableExecutor {
  static async execute<T>(
    action: () => Promise<T>,
    maxRetries: number = 3,
    initialBackoffMs: number = 1000,
    onRetry?: (attempt: number, error: Error) => void
  ): Promise<T> {
    let lastError: Error = new Error('Unknown error');

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await action();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt === maxRetries) {
          throw lastError;
        }

        const backoffMs = initialBackoffMs * Math.pow(2, attempt - 1);
        console.warn(
          `⚠️  Attempt ${attempt}/${maxRetries} failed, retrying in ${backoffMs}ms...`,
          lastError.message
        );

        if (onRetry) {
          onRetry(attempt, lastError);
        }

        await this.sleep(backoffMs);
      }
    }

    throw lastError;
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Circular buffer for storing recent values
 */
export class CircularBuffer<T> {
  private buffer: T[];
  private index: number = 0;
  private filled: boolean = false;

  constructor(size: number) {
    this.buffer = new Array(size);
  }

  add(value: T): void {
    this.buffer[this.index] = value;
    this.index = (this.index + 1) % this.buffer.length;

    if (this.index === 0) {
      this.filled = true;
    }
  }

  getAll(): T[] {
    if (!this.filled) {
      return this.buffer.slice(0, this.index);
    }
    return [...this.buffer.slice(this.index), ...this.buffer.slice(0, this.index)];
  }

  getLatest(): T | undefined {
    const idx = this.index === 0 ? this.buffer.length - 1 : this.index - 1;
    return this.buffer[idx];
  }

  getSize(): number {
    return this.filled ? this.buffer.length : this.index;
  }

  getAverage(): number {
    const values = this.getAll()
      .filter((v) => typeof v === 'number')
      .map((v) => v as unknown as number);

    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
}

/**
 * Validation utilities
 */
export class Validator {
  static isValidEthereumAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  static isValidHash(hash: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(hash);
  }

  static isValidCID(cid: string): boolean {
    return /^Qm[a-zA-Z0-9]{44}$/.test(cid) || /^baf[a-zA-Z0-9]{55,}$/.test(cid);
  }

  static validateMintParams(params: {
    contractAddress?: string;
    name: string;
    description: string;
  }): boolean {
    if (!params.name || params.name.length === 0) {
      throw new Error('Invalid name: must not be empty');
    }

    if (params.name.length > 256) {
      throw new Error('Invalid name: must be <= 256 characters');
    }

    if (!params.description) {
      throw new Error('Invalid description: must not be empty');
    }

    if (params.contractAddress && !this.isValidEthereumAddress(params.contractAddress)) {
      throw new Error('Invalid contract address');
    }

    return true;
  }

  static validateSwapParams(params: {
    amountIn: number;
    slippage: number;
    deadline: number;
  }): boolean {
    if (params.amountIn <= 0) {
      throw new Error('Invalid amountIn: must be > 0');
    }

    if (params.slippage < 0 || params.slippage > 10) {
      throw new Error('Invalid slippage: must be 0-10%');
    }

    if (params.deadline < Math.floor(Date.now() / 1000)) {
      throw new Error('Invalid deadline: must be in future');
    }

    return true;
  }
}

/**
 * Compute budget tracker
 */
export class ComputeBudget {
  private callCount: number = 0;
  private readonly maxCallsPerCycle: number;
  private cycleStartTime: number;
  private readonly maxCycleDurationMs: number;

  constructor(maxCalls: number = 100, maxDurationMs: number = 5 * 60 * 1000) {
    this.maxCallsPerCycle = maxCalls;
    this.maxCycleDurationMs = maxDurationMs;
    this.cycleStartTime = Date.now();
  }

  enforce(agentName: string): void {
    if (this.callCount >= this.maxCallsPerCycle) {
      throw new Error(
        `${agentName}: Exceeded call limit (${this.callCount}/${this.maxCallsPerCycle})`
      );
    }

    const elapsed = Date.now() - this.cycleStartTime;
    if (elapsed > this.maxCycleDurationMs) {
      throw new Error(
        `Cycle timeout: ${elapsed}ms > ${this.maxCycleDurationMs}ms`
      );
    }

    this.callCount++;
  }

  reset(): void {
    this.callCount = 0;
    this.cycleStartTime = Date.now();
  }

  getCallCount(): number {
    return this.callCount;
  }

  getElapsedTime(): number {
    return Date.now() - this.cycleStartTime;
  }
}
