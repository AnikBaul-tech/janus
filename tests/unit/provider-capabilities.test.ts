import { describe, expect, it } from "vitest";

import { MemoryLockAdapter } from "../../src/adapters/memory/memory-lock.adapter.js";
import { MemorySemaphoreAdapter } from "../../src/adapters/memory/memory-semaphore.adapter.js";

describe("Provider capabilities", () => {
  it("declares the MemoryLockAdapter capabilities correctly", () => {
    const provider = new MemoryLockAdapter();

    expect(provider.capabilities).toEqual({
      scope: "process",
      mutex: true,
      semaphore: false,
      leases: false,
      leaseRenewal: false,
      fencingTokens: false,
      atomicOwnershipValidation: false,
    });
  });

  it("declares the MemorySemaphoreAdapter capabilities correctly", () => {
    const provider = new MemorySemaphoreAdapter();

    expect(provider.capabilities).toEqual({
      scope: "process",
      mutex: false,
      semaphore: true,
      leases: false,
      leaseRenewal: false,
      fencingTokens: false,
      atomicOwnershipValidation: false,
    });
  });

  it("does not claim distributed coordination for Memory providers", () => {
    const lockProvider = new MemoryLockAdapter();
    const semaphoreProvider = new MemorySemaphoreAdapter();

    expect(lockProvider.capabilities.scope).toBe("process");
    expect(semaphoreProvider.capabilities.scope).toBe("process");
  });
});
