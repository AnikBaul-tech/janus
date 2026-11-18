import { ConcurrencyError } from "./concurrency.errors.js";

/**
 * The caller no longer owns the requested lease,
 * or ownership can no longer be safely confirmed.
 */
export class LeaseLostError extends ConcurrencyError {
  constructor(
    public readonly key: string,
    public readonly ownerId: string,
    options?: ErrorOptions,
  ) {
    super(
      `Lease ownership was lost or could not be confirmed for "${key}"`,
      "LEASE_LOST",
      options,
    );
  }
}

/**
 * Renewal could not be completed or ownership could
 * not be confirmed during the renewal operation.
 */
export class LeaseRenewalError extends ConcurrencyError {
  constructor(
    public readonly key: string,
    public readonly ownerId: string,
    options?: ErrorOptions,
  ) {
    super(`Lease renewal failed for "${key}"`, "LEASE_RENEWAL_FAILED", options);
  }
}

/**
 * The caller attempted to renew a lease that it
 * had already voluntarily released.
 */
export class LeaseReleasedError extends ConcurrencyError {
  constructor(
    public readonly key: string,
    public readonly ownerId: string,
  ) {
    super(`Cannot renew released lease "${key}"`, "LEASE_ALREADY_RELEASED");
  }
}
