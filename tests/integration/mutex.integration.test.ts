import { describe, expect, it } from "vitest";

import {
  createConcurrencyManager,
  LockUnavailableError,
} from "../../src/index.js";

describe("Mutex SDK Integration", () => {
  it("should execute operations through the manager", async () => {
    const manager = createConcurrencyManager();

    const result = await manager.mutex.withLock("booking:A12", async () => {
      return "Booking completed";
    });

    expect(result).toBe("Booking completed");
  });

  it("should protect shared resources", async () => {
    const manager = createConcurrencyManager();

    let stock = 10;

    const purchases = await Promise.all(
      Array.from({ length: 20 }, (_, index) =>
        manager.mutex.withLock(
          "product:101",
          async () => {
            if (stock <= 0) {
              return "Out of stock";
            }

            stock--;

            return `User ${index + 1} purchased`;
          },
          { waitTimeoutMs: 5000 },
        ),
      ),
    );

    const successful = purchases.filter((result) => result !== "Out of stock");

    expect(successful).toHaveLength(10);
    expect(stock).toBe(0);
  });

  it("should isolate different resources", async () => {
    const manager = createConcurrencyManager();

    const results = await Promise.all([
      manager.mutex.withLock("seat:A12", () => "A12"),
      manager.mutex.withLock("seat:A13", () => "A13"),
    ]);

    expect(results).toEqual(["A12", "A13"]);
  });

  it("should release resources after callback failure", async () => {
    const manager = createConcurrencyManager();

    await expect(
      manager.mutex.withLock("resource:1", () => {
        throw new Error("Operation failed");
      }),
    ).rejects.toThrow("Operation failed");

    const result = await manager.mutex.withLock(
      "resource:1",
      () => "Recovered",
    );

    expect(result).toBe("Recovered");
  });

  it("should reject immediate competing requests", async () => {
    const manager = createConcurrencyManager();

    let release!: () => void;

    const blocker = new Promise<void>((resolve) => {
      release = resolve;
    });

    let started!: () => void;

    const firstStarted = new Promise<void>((resolve) => {
      started = resolve;
    });

    const first = manager.mutex.withLock("resource:1", async () => {
      started();
      await blocker;
    });

    await firstStarted;

    await expect(
      manager.mutex.withLock("resource:1", () => "should not execute"),
    ).rejects.toThrow(LockUnavailableError);

    release();
    await first;
  });
});
