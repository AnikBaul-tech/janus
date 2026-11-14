import type { PermitHandle } from "./permit-handle.js";
import type { ResolvedLockOptions } from "../types/lock-options.js";

export interface SemaphoreProvider {
  acquire(
    key: string,
    capacity: number,
    options: ResolvedLockOptions,
  ): Promise<PermitHandle>;
}
