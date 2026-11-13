import type { LockHandle } from "./lock-handle.js";
import type { ResolvedLockOptions } from "../types/lock-options.js";

export interface LockProvider {
  /**
   * Attempts to acquire a lock for the given resource.
   *
   * Resolves with an owned lock handle.
   *
   * Rejects with a typed error if acquisition fails,
   * times out, or is cancelled.
   *
   * key :- resource identifier
   * options :- cotrols the acquisition process
   * Promise :- to acquire the lock , it may need time
   * LockHandle :- ownership of the lock
   */
  acquire(key: string, options: ResolvedLockOptions): Promise<LockHandle>;
}
