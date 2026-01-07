import type { Wallet } from 'ethers';

export class NonceManager {
  private nonce: number | null = null;
  private pendingCount = 0;
  private wallet: Wallet;

  constructor(wallet: Wallet) {
    this.wallet = wallet;
  }
  

  async getNextNonce(): Promise<number> {
    if (this.nonce === null) {
      this.nonce = await this.wallet.getTransactionCount('pending');
    } else {
      this.nonce = this.nonce + 1;
    }
    this.pendingCount++;
    return this.nonce;
  }

  async initialize(): Promise<void> {
    this.nonce = await this.wallet.getTransactionCount('pending');
  }

  markCompleted(): void {
    this.pendingCount = Math.max(0, this.pendingCount - 1);
  }

  markFailed(): void {
    // On failure, reset nonce to get fresh value from network
    this.nonce = null;
    this.pendingCount = Math.max(0, this.pendingCount - 1);
  }

  getPendingCount(): number {
    return this.pendingCount;
  }
}

