import type { SemaphoreProvider } from "../../core/contracts/semaphore-provider.js";
import type { PermitHandle } from "../../core/contracts/permit-handle.js";
import type { ResolvedLockOptions } from "../../core/types/lock-options.js";

import {
  SemaphoreAcquisitionAbortedError,
  SemaphoreAcquisitionTimeoutError,
  SemaphoreCapacityMismatchError,
  SemaphoreUnavailableError,
} from "../../core/errors/concurrency.errors.js";

interface SemaphoreWaiter {
  token: symbol;
  resolve: (handle: PermitHandle) => void;
  reject: (error: Error) => void;
  settled: boolean;
  timer?: ReturnType<typeof setTimeout>;
  signal?: AbortSignal;
  abortListener?: () => void;
}

interface SemaphoreState {
  capacity: number;
  activeTokens: Set<symbol>;
  queue: SemaphoreWaiter[];
}

export class MemorySemaphoreAdapter implements SemaphoreProvider {
  private readonly semaphores = new Map<string, SemaphoreState>();

  async acquire(
    key: string,
    capacity: number,
    options: ResolvedLockOptions,
  ): Promise<PermitHandle> {
    if (!key.trim()) {
      throw new TypeError("Semaphore key cannot be empty");
    }

    if (!Number.isSafeInteger(capacity) || capacity < 1) {
      throw new RangeError(
        "Semaphore capacity must be a positive safe integer",
      );
    }

    if (options.signal?.aborted) {
      throw new SemaphoreAcquisitionAbortedError(key, {
        cause: options.signal.reason,
      });
    }

    let state = this.semaphores.get(key);

    if (!state) {
      state = {
        capacity,
        activeTokens: new Set(),
        queue: [],
      };

      this.semaphores.set(key, state);
    } else if (state.capacity !== capacity) {
      throw new SemaphoreCapacityMismatchError(key, state.capacity, capacity);
    }

    // Preserve FIFO ordering if requests are already waiting.
    if (state.activeTokens.size < state.capacity && state.queue.length === 0) {
      const token = Symbol(key);
      state.activeTokens.add(token);

      return this.createHandle(key, state, token);
    }

    if (options.waitTimeoutMs === 0) {
      if (state.activeTokens.size === 0 && state.queue.length === 0) {
        this.semaphores.delete(key);
      }

      throw new SemaphoreUnavailableError(key);
    }

    return this.enqueue(key, state, options);
  }

  private enqueue(
    key: string,
    state: SemaphoreState,
    options: ResolvedLockOptions,
  ): Promise<PermitHandle> {
    return new Promise<PermitHandle>((resolve, reject) => {
      const waiter: SemaphoreWaiter = {
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
            new SemaphoreAcquisitionAbortedError(key, {
              cause: options.signal?.reason,
            }),
          );
        };

        options.signal.addEventListener("abort", waiter.abortListener, {
          once: true,
        });

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
          new SemaphoreAcquisitionTimeoutError(key, options.waitTimeoutMs),
        );
      }, options.waitTimeoutMs);
    });
  }

  private rejectWaiter(
    key: string,
    state: SemaphoreState,
    waiter: SemaphoreWaiter,
    error: Error,
  ): void {
    if (waiter.settled) return;

    waiter.settled = true;
    this.detachWaiter(waiter);

    const index = state.queue.indexOf(waiter);

    if (index !== -1) {
      state.queue.splice(index, 1);
    }

    waiter.reject(error);

    this.cleanupState(key, state);
  }

  private detachWaiter(waiter: SemaphoreWaiter): void {
    if (waiter.timer !== undefined) {
      clearTimeout(waiter.timer);
      delete waiter.timer;
    }

    if (waiter.signal && waiter.abortListener) {
      waiter.signal.removeEventListener("abort", waiter.abortListener);

      delete waiter.abortListener;
    }
  }

  private createHandle(
    key: string,
    state: SemaphoreState,
    token: symbol,
  ): PermitHandle {
    let released = false;

    return {
      release: async () => {
        if (released) return;

        released = true;
        this.releasePermit(key, state, token);
      },
    };
  }

  private releasePermit(
    key: string,
    state: SemaphoreState,
    token: symbol,
  ): void {
    if (this.semaphores.get(key) !== state || !state.activeTokens.has(token)) {
      return;
    }

    state.activeTokens.delete(token);

    while (state.queue.length > 0) {
      const waiter = state.queue.shift()!;

      if (waiter.settled) continue;

      waiter.settled = true;
      this.detachWaiter(waiter);

      // Transfer the released permit directly to the next waiter.
      state.activeTokens.add(waiter.token);

      const handle = this.createHandle(key, state, waiter.token);

      waiter.resolve(handle);
      return;
    }

    this.cleanupState(key, state);
  }

  private cleanupState(key: string, state: SemaphoreState): void {
    if (
      this.semaphores.get(key) === state &&
      state.activeTokens.size === 0 &&
      state.queue.length === 0
    ) {
      this.semaphores.delete(key);
    }
  }
}
