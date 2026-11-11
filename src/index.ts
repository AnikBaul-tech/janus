export { Mutex } from "./features/mutex/index.js";

export { MemoryLockAdapter } from "./adapters/memory/memory-lock.adapter.js";

export type { LockProvider } from "./core/contracts/lock-provider.js";
export type { LockHandle } from "./core/contracts/lock-handle.js";
export type { LockOptions } from "./core/types/lock-options.js";

export {
  ConcurrencyError,
  LockUnavailableError,
  LockAcquisitionTimeoutError,
  LockAcquisitionAbortedError,
} from "./core/errors/concurrency.errors.js";