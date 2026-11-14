export interface PermitHandle {
  /**
   * Releases the acquired semaphore permit.
   * Repeated calls must be safe.
   */
  release(): Promise<void>;
}
