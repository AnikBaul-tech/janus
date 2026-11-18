import type { LockOptions, ResolvedLockOptions } from "./lock-options.js";

export interface LeaseOptions extends LockOptions {
  /**
   * How long ownership remains valid without successful renewal.
   */
  leaseDurationMs: number;
}

export interface ResolvedLeaseOptions extends ResolvedLockOptions {
  leaseDurationMs: number;
}

export function resolveLeaseOptions(
  options: LeaseOptions,
): ResolvedLeaseOptions {
  if (
    !Number.isSafeInteger(options.leaseDurationMs) ||
    options.leaseDurationMs <= 0
  ) {
    throw new RangeError("leaseDurationMs must be a positive safe integer");
  }

  const resolved: ResolvedLeaseOptions = {
    waitTimeoutMs: options.waitTimeoutMs ?? 0,
    leaseDurationMs: options.leaseDurationMs,
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
