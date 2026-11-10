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
