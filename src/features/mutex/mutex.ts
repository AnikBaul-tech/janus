import type { LockProvider } from "../../core/contracts/lock-provider.js";
import type { LockOptions } from "../../core/types/lock-options.js";

import { resolveLockOptions } from "../../core/types/lock-options.js";

export class Mutex {
  constructor(private readonly provider: LockProvider) {}

  /**
   * Acquires a resource lock, executes a callback,
   * and releases the lock automatically.
   */

  async withLock<T>(
    key: string,
    callback: () => T | Promise<T>,
    options: LockOptions = {},
  ): Promise<T> {
    const resolvedOptions = resolveLockOptions(options);

    const handle = await this.provider.acquire(key, resolvedOptions);

    let result!: T;
    let callbackFailed = false;
    let callbackError: unknown;

    try {
      result = await callback();
    } catch (error) {
      callbackFailed = true;
      callbackError = error;
    }

    try {
      await handle.release();
    } catch (releaseError) {
      if (callbackFailed) {
        throw new AggregateError(
          [callbackError, releaseError],
          "Both the protected operation and lock release failed",
          { cause: releaseError },
        );
      }

      throw releaseError;
    }

    if (callbackFailed) {
      throw callbackError;
    }

    return result;
  }
}
