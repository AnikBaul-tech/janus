export class ConcurrencyError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    options?: ErrorOptions,
  ) {
    super(message, options);

    this.name = new.target.name;
  }
}

export class ProviderNotFoundError extends ConcurrencyError {
  constructor(providerName: string) {
    super(`Provider "${providerName}" is not registered`, "PROVIDER_NOT_FOUND");
  }
}

export class ProviderAlreadyRegisteredError extends ConcurrencyError {
  constructor(providerName: string) {
    super(
      `Provider "${providerName}" is already registered`,
      "PROVIDER_ALREADY_REGISTERED",
    );
  }
}

export class LockAcquisitionTimeoutError extends ConcurrencyError {
  constructor(
    public readonly key: string,
    public readonly waitTimeoutMs: number,
  ) {
    super(
      `Timed out while acquiring lock "${key}"`,
      "LOCK_ACQUISITION_TIMEOUT",
    );
  }
}

export class LockAcquisitionAbortedError extends ConcurrencyError {
  constructor(
    public readonly key: string,
    options?: ErrorOptions,
  ) {
    super(
      `Lock acquisition was aborted for "${key}"`,
      "LOCK_ACQUISITION_ABORTED",
      options,
    );
  }
}
export class LockUnavailableError extends ConcurrencyError {
  constructor(public readonly key: string) {
    super(`Lock "${key}" is currently unavailable`, "LOCK_UNAVAILABLE");
  }
}

export class SemaphoreUnavailableError extends ConcurrencyError {
  constructor(public readonly key: string) {
    super(
      `No permit is currently available for semaphore "${key}"`,
      "SEMAPHORE_UNAVAILABLE",
    );
  }
}

export class SemaphoreCapacityMismatchError extends ConcurrencyError {
  constructor(
    public readonly key: string,
    public readonly existingCapacity: number,
    public readonly requestedCapacity: number,
  ) {
    super(
      `Semaphore "${key}" already has capacity ${existingCapacity}, but ${requestedCapacity} was requested`,
      "SEMAPHORE_CAPACITY_MISMATCH",
    );
  }
}

export class SemaphoreAcquisitionTimeoutError extends ConcurrencyError {
  constructor(
    public readonly key: string,
    public readonly waitTimeoutMs: number,
  ) {
    super(
      `Timed out while acquiring semaphore permit "${key}"`,
      "SEMAPHORE_ACQUISITION_TIMEOUT",
    );
  }
}

export class SemaphoreAcquisitionAbortedError extends ConcurrencyError {
  constructor(
    public readonly key: string,
    options?: ErrorOptions,
  ) {
    super(
      `Semaphore acquisition was aborted for "${key}"`,
      "SEMAPHORE_ACQUISITION_ABORTED",
      options,
    );
  }
}
