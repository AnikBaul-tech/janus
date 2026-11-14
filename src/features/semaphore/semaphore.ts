import type { SemaphoreProvider } from "../../core/contracts/semaphore-provider.js";
import type { LockOptions } from "../../core/types/lock-options.js";
import { resolveLockOptions } from "../../core/types/lock-options.js";

export class Semaphore {
  constructor(private readonly provider: SemaphoreProvider) {}

  async withPermit<T>(
    key: string,
    capacity: number,
    callback: () => T | Promise<T>,
    options: LockOptions = {},
  ): Promise<T> {
    if (!key.trim()) {
      throw new TypeError("Semaphore key cannot be empty");
    }

    if (!Number.isSafeInteger(capacity) || capacity < 1) {
      throw new RangeError(
        "Semaphore capacity must be a positive safe integer",
      );
    }

    const resolvedOptions = resolveLockOptions(options);

    const handle = await this.provider.acquire(key, capacity, resolvedOptions);

    try {
      return await callback();
    } finally {
      await handle.release();
    }
  }
}
