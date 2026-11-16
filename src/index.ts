// Manager
export {
  ConcurrencyManager,
  createConcurrencyManager,
} from "./core/manager/index.js";

export type { ConcurrencyManagerOptions } from "./core/manager/index.js";

// Features
export { Mutex } from "./features/mutex/index.js";
export { Semaphore } from "./features/semaphore/index.js";

// Adapters
export { MemoryLockAdapter } from "./adapters/memory/memory-lock.adapter.js";
export { MemorySemaphoreAdapter } from "./adapters/memory/memory-semaphore.adapter.js";

// Contracts
export type { LockProvider } from "./core/contracts/lock-provider.js";
export type { LockHandle } from "./core/contracts/lock-handle.js";
export type { SemaphoreProvider } from "./core/contracts/semaphore-provider.js";
export type { PermitHandle } from "./core/contracts/permit-handle.js";

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
  SemaphoreUnavailableError,
  SemaphoreCapacityMismatchError,
  SemaphoreAcquisitionTimeoutError,
  SemaphoreAcquisitionAbortedError,
} from "./core/errors/concurrency.errors.js";
