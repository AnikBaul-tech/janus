import type { LeaseHandle } from "./lease-handle.js";
import type { ResolvedLeaseOptions } from "../types/lease-options.js";
import type { CapabilityAwareProvider } from "../capabilities/provider-capabilities.js";

export interface LeaseProvider extends CapabilityAwareProvider {
  acquireLease(
    key: string,
    options: ResolvedLeaseOptions,
  ): Promise<LeaseHandle>;
}
