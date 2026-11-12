import type { LockProvider } from "../contracts/lock-provider.js";

export interface ConcurrencyManagerOptions {
  /**
   * Name of the lock provider to use.
   * Defaults to "memory".
   */
  provider?: string;

  /**
   * Additional lock providers registered by the developer.
   */
  lockProviders?: Record<string, LockProvider>;
}
