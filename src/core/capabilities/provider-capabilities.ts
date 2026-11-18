/**
 * Describes where a provider can coordinate operations.
 *
 * process:
 *   Coordination is limited to one Node.js process.
 *
 * distributed:
 *   Coordination can work across multiple application instances
 *   sharing the same coordination backend.
 */
export type CoordinationScope = "process" | "distributed";

/**
 * Describes the capabilities and guarantees offered by a provider.
 *
 * These declarations must reflect actual implementation guarantees,
 * not merely features that the provider intends to support.
 */
export interface ProviderCapabilities {
  readonly scope: CoordinationScope;

  readonly mutex: boolean;

  readonly semaphore: boolean;

  readonly leases: boolean;

  /**
   * Supports extending an existing lease while verifying ownership.
   */
  readonly leaseRenewal: boolean;

  /**
   * Can generate monotonically increasing fencing tokens.
   */
  readonly fencingTokens: boolean;

  /**
   * Can atomically verify ownership during renewal and release.
   */
  readonly atomicOwnershipValidation: boolean;
}

/**
 * Implemented by providers that explicitly declare their capabilities.
 */
export interface CapabilityAwareProvider {
  readonly capabilities: ProviderCapabilities;
}
