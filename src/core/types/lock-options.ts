export interface LockOptions {
  /**
   * Maximum time to wait for acquiring a lock.
   * 0 means fail immediately if unavailable.
   */
  waitTimeoutMs?: number;

  /**
   * Abort an ongoing lock acquisition.
   */
  signal?: AbortSignal;
}

/**
 * Internal normalized configuration.
 * Used by adapters instead of optional public configuration.
 */
export interface ResolvedLockOptions {
  waitTimeoutMs: number;
  signal?: AbortSignal;
}

export function resolveLockOptions(
  options: LockOptions = {},
): ResolvedLockOptions {
  const resolved: ResolvedLockOptions = {
    waitTimeoutMs: options.waitTimeoutMs ?? 0,
  };

  if (options.signal !== undefined) {
    resolved.signal = options.signal;
  }

  if (
    !Number.isSafeInteger(resolved.waitTimeoutMs) ||
    resolved.waitTimeoutMs < 0
  ) {
    throw new RangeError("waitTimeoutMs must be a non-negative safe integer");
  }

  return resolved;
}
