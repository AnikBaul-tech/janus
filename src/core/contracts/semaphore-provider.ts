import type { PermitHandle } from "./permit-handle.js";
import type { ResolvedLockOptions } from "../types/lock-options.js";
import type { ProviderCapabilities } from "../capabilities/provider-capabilities.js";

export interface SemaphoreProvider {
  readonly capabilities?: ProviderCapabilities;

  acquire(
    key: string,
    capacity: number,
    options: ResolvedLockOptions,
  ): Promise<PermitHandle>;
}
