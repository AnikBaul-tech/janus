import { describe, expect, it, vi } from "vitest";

import { Mutex } from "../../src/features/mutex/mutex.js";
import { MemoryLockAdapter } from "../../src/adapters/memory/memory-lock.adapter.js";

import type { LockProvider } from "../../src/core/contracts/lock-provider.js";

import { LockUnavailableError } from "../../src/core/errors/concurrency.errors.js";

describe("Mutex", () => {
  it("executes the callback and returns its result", async () => {
    const mutex = new Mutex(new MemoryLockAdapter());

    const result = await mutex.withLock("resource:1", async () => {
      return 100;
    });

    expect(result).toBe(100);
  });

  it("automatically releases the lock after success", async () => {
    const mutex = new Mutex(new MemoryLockAdapter());

    await mutex.withLock("resource:1", async () => {
      return "completed";
    });

    // The same resource should be available again.
    const result = await mutex.withLock("resource:1", () => {
      return "second execution";
    });

    expect(result).toBe("second execution");
  });

  it("releases the lock when the callback throws", async () => {
    const mutex = new Mutex(new MemoryLockAdapter());

    await expect(
      mutex.withLock("resource:1", async () => {
        throw new Error("Operation failed");
      }),
    ).rejects.toThrow("Operation failed");

    // Verify the resource was released.
    const result = await mutex.withLock("resource:1", () => "recovered");

    expect(result).toBe("recovered");
  });

  it("prevents overlapping execution for the same resource", async () => {
    const mutex = new Mutex(new MemoryLockAdapter());

    let releaseFirst!: () => void;

    const blocker = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    let started!: () => void;

    const firstStarted = new Promise<void>((resolve) => {
      started = resolve;
    });

    const first = mutex.withLock("resource:1", async () => {
      started();
      await blocker;
    });

    await firstStarted;

    await expect(
      mutex.withLock("resource:1", async () => {
        return "should not execute";
      }),
    ).rejects.toBeInstanceOf(LockUnavailableError);

    releaseFirst();
    await first;
  });

  it("allows different resources to execute independently", async () => {
    const mutex = new Mutex(new MemoryLockAdapter());

    const results = await Promise.all([
      mutex.withLock("resource:A", () => "A"),
      mutex.withLock("resource:B", () => "B"),
    ]);

    expect(results).toEqual(["A", "B"]);
  });

  it("supports waiting for an occupied resource", async () => {
    const mutex = new Mutex(new MemoryLockAdapter());

    const executionOrder: number[] = [];

    let releaseFirst!: () => void;

    const blocker = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    let started!: () => void;

    const firstStarted = new Promise<void>((resolve) => {
      started = resolve;
    });

    const first = mutex.withLock("resource:1", async () => {
      executionOrder.push(1);
      started();
      await blocker;
    });

    await firstStarted;

    const second = mutex.withLock(
      "resource:1",
      async () => {
        executionOrder.push(2);
      },
      { waitTimeoutMs: 1000 },
    );

    releaseFirst();

    await Promise.all([first, second]);

    expect(executionOrder).toEqual([1, 2]);
  });

  it("works with a custom LockProvider", async () => {
    const release = vi.fn(async () => {});

    const acquire = vi.fn(async () => ({
      release,
    }));

    const provider: LockProvider = { acquire };

    const mutex = new Mutex(provider);

    const result = await mutex.withLock("custom:resource", () => 42);

    expect(result).toBe(42);
    expect(acquire).toHaveBeenCalledWith("custom:resource", {
      waitTimeoutMs: 0,
    });
    expect(release).toHaveBeenCalledOnce();
  });

  it("does not execute the callback if acquisition fails", async () => {
    const mutex = new Mutex(new MemoryLockAdapter());

    let releaseFirst!: () => void;

    const blocker = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    let started!: () => void;

    const firstStarted = new Promise<void>((resolve) => {
      started = resolve;
    });

    const first = mutex.withLock("resource:1", async () => {
      started();
      await blocker;
    });

    await firstStarted;

    const callback = vi.fn();

    await expect(mutex.withLock("resource:1", callback)).rejects.toBeInstanceOf(
      LockUnavailableError,
    );

    expect(callback).not.toHaveBeenCalled();

    releaseFirst();
    await first;
  });
});
