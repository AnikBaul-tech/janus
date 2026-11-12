import { describe, expect, it, vi } from "vitest";

import { createConcurrencyManager } from "../../src/core/manager/manager-factory.js";

import { ProviderNotFoundError } from "../../src/core/errors/concurrency.errors.js";

import type { LockProvider } from "../../src/core/contracts/lock-provider.js";

describe("ConcurrencyManagerFactory", () => {
  it("should create a manager with the default memory provider", async () => {
    const manager = createConcurrencyManager();

    expect(manager.mutex).toBeDefined();

    const result = await manager.mutex.withLock("resource:1", () => "success");

    expect(result).toBe("success");
  });

  it("should create a manager using the explicitly selected memory provider", async () => {
    const manager = createConcurrencyManager({
      provider: "memory",
    });

    const result = await manager.mutex.withLock("resource:1", () => 100);

    expect(result).toBe(100);
  });

  it("should register and use a custom provider", async () => {
    const release = vi.fn(async () => {});

    const acquire = vi.fn(async () => ({
      release,
    }));

    const customProvider: LockProvider = {
      acquire,
    };

    const manager = createConcurrencyManager({
      provider: "custom",
      lockProviders: {
        custom: customProvider,
      },
    });

    const result = await manager.mutex.withLock(
      "resource:1",
      () => "custom provider used",
    );

    expect(result).toBe("custom provider used");
    expect(acquire).toHaveBeenCalledOnce();
    expect(release).toHaveBeenCalledOnce();
  });

  it("should reject an unknown provider", () => {
    expect(() => {
      createConcurrencyManager({
        provider: "unknown",
      });
    }).toThrow(ProviderNotFoundError);
  });

  it("should reject duplicate provider registration", () => {
    const customProvider: LockProvider = {
      acquire: vi.fn(),
    };

    expect(() => {
      createConcurrencyManager({
        provider: "memory",
        lockProviders: {
          memory: customProvider,
        },
      });
    }).toThrow();
  });
});
