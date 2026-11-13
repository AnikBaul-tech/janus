import type { LockProvider } from "../../core/contracts/lock-provider.js";
import type { LockHandle } from "../../core/contracts/lock-handle.js";
import type { ResolvedLockOptions } from "../../core/types/lock-options.js";

import {
  LockAcquisitionAbortedError,
  LockAcquisitionTimeoutError,
  LockUnavailableError,
} from "../../core/errors/concurrency.errors.js";

/**
 * Represents a request waiting to acquire a lock.
 */
interface LockWaiter {
  token: symbol;

  resolve: (handle: LockHandle) => void;
  reject: (error: Error) => void;

  settled: boolean;

  timer?: ReturnType<typeof setTimeout>;
  signal?: AbortSignal;
  abortListener?: () => void;
}

/**
 * Represents the current state of one resource lock.
 */
interface LockState {
  ownerToken: symbol;
  queue: LockWaiter[];
}

export class MemoryLockAdapter implements LockProvider {
  private readonly locks = new Map<string, LockState>();

  /**
   * Acquires a lock for a particular resource.
   */
  async acquire(
    key: string,
    options: ResolvedLockOptions,
  ): Promise<LockHandle> {
    if (!key.trim()) {
      throw new TypeError("Lock key cannot be empty");
    }

    if (options.signal?.aborted) {
      throw new LockAcquisitionAbortedError(key, {
        cause: options.signal.reason,
      });
    }

    const existingState = this.locks.get(key);

    // No existing lock: acquire immediately.
    if (!existingState) {
      const token = Symbol(key);

      const state: LockState = {
        ownerToken: token,
        queue: [],
      };

      this.locks.set(key, state);

      return this.createHandle(key, state, token);
    }

    // Lock exists and waiting is disabled.
    if (options.waitTimeoutMs === 0) {
      throw new LockUnavailableError(key);
    }

    // Otherwise, join the waiting queue.
    return this.enqueue(key, existingState, options);
  }

  /**
   * Adds a new request to the resource's waiting queue.
   */
  private enqueue(
    key: string,
    state: LockState,
    options: ResolvedLockOptions,
  ): Promise<LockHandle> {
    return new Promise<LockHandle>((resolve, reject) => {
      const waiter: LockWaiter = {
        token: Symbol(key),
        resolve,
        reject,
        settled: false,
      };

      state.queue.push(waiter);

      if (options.signal) {
        waiter.signal = options.signal;

        waiter.abortListener = () => {
          this.rejectWaiter(
            key,
            state,
            waiter,
            new LockAcquisitionAbortedError(key, {
              cause: options.signal?.reason,
            }),
          );
        };

        options.signal.addEventListener("abort", waiter.abortListener, {
          once: true,
        });

        // Recheck after registering the listener.
        if (options.signal.aborted) {
          waiter.abortListener();
          return;
        }
      }

      waiter.timer = setTimeout(() => {
        this.rejectWaiter(
          key,
          state,
          waiter,
          new LockAcquisitionTimeoutError(key, options.waitTimeoutMs),
        );
      }, options.waitTimeoutMs);
    });
  }

  /**
   * Rejects a waiting request and removes it from the queue.
   */
  private rejectWaiter(
    key: string,
    state: LockState,
    waiter: LockWaiter,
    error: Error,
  ): void {
    if (waiter.settled) {
      return;
    }

    waiter.settled = true;

    this.detachWaiter(waiter);

    const index = state.queue.indexOf(waiter);

    if (index !== -1) {
      state.queue.splice(index, 1);
    }

    waiter.reject(error);
  }

  /**
   * Removes timeout and cancellation listeners.
   */
  private detachWaiter(waiter: LockWaiter): void {
    if (waiter.timer !== undefined) {
      clearTimeout(waiter.timer);
      delete waiter.timer;
    }

    if (waiter.signal && waiter.abortListener) {
      waiter.signal.removeEventListener("abort", waiter.abortListener);

      delete waiter.abortListener;
    }
  }

  /**
   * Creates a handle tied to a specific ownership token.
   */
  private createHandle(
    key: string,
    state: LockState,
    token: symbol,
  ): LockHandle {
    let released = false;

    return {
      release: async () => {
        if (released) {
          return;
        }

        released = true;

        this.releaseOwnedLock(key, state, token);
      },
    };
  }

  /**
   * Releases ownership and transfers it to the next
   * valid waiting request.
   */
  private releaseOwnedLock(key: string, state: LockState, token: symbol): void {
    // Ensure this handle still owns this exact lock.
    if (this.locks.get(key) !== state || state.ownerToken !== token) {
      return;
    }

    while (state.queue.length > 0) {
      const waiter = state.queue.shift()!;

      if (waiter.settled) {
        continue;
      }

      waiter.settled = true;

      this.detachWaiter(waiter);

      // Transfer ownership directly.
      state.ownerToken = waiter.token;

      const handle = this.createHandle(key, state, waiter.token);

      waiter.resolve(handle);

      return;
    }

    // No waiting requests remain.
    this.locks.delete(key);
  }
}
