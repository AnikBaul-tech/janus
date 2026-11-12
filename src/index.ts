// Manager
export {
  ConcurrencyManager,
  createConcurrencyManager,
} from "./core/manager/index.js";

export type { ConcurrencyManagerOptions } from "./core/manager/index.js";

// Features
export { Mutex } from "./features/mutex/index.js";

// Adapters
export { MemoryLockAdapter } from "./adapters/memory/memory-lock.adapter.js";

// Contracts
export type { LockProvider } from "./core/contracts/lock-provider.js";
export type { LockHandle } from "./core/contracts/lock-handle.js";

// Types
export type { LockOptions } from "./core/types/lock-options.js";

// Errors
export {
  ConcurrencyError,
  ProviderNotFoundError,
  ProviderAlreadyRegisteredError,
  LockUnavailableError,
  LockAcquisitionTimeoutError,
  LockAcquisitionAbortedError,
} from "./core/errors/concurrency.errors.js";
