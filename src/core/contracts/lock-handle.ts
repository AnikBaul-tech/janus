export interface LockHandle {
  /**
   * Releases the lock owned by this handle.
   *
   * Repeated calls must be safe.
   */
  release(): Promise<void>;
}
