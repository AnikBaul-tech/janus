import type { FencingToken } from "../types/fencing-token.js";

/**
 * Represents one ownership instance of a distributed lease.
 *
 * A handle cannot be reused after it has been lost or released.
 */
export interface LeaseHandle {
  readonly ownerId: string;

  readonly fencingToken: FencingToken;

  /**
   * Aborted when ownership is lost or can no longer
   * be safely confirmed.
   *
   * Normal voluntary release must not abort this signal.
   */
  readonly signal: AbortSignal;

  /**
   * Extends the current lease.
   *
   * Resolves only when ownership is confirmed and renewal succeeds.
   * Rejects with LeaseLostError or LeaseRenewalError otherwise.
   * A released lease rejects with LeaseReleasedError.
   */
  renew(): Promise<void>;

  /**
   * Voluntarily releases this lease.
   *
   * Must be idempotent.
   * Must verify ownership atomically before releasing.
   * Must never release another owner's lease.
   * Releasing an already-lost lease must be safe.
   */
  release(): Promise<void>;
}
