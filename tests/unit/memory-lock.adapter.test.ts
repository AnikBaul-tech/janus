import { describe, expect, it } from "vitest";

import { MemoryLockAdapter } from "../../src/adapters/memory/memory-lock.adapter.js";

import { resolveLockOptions } from "../../src/core/types/lock-options.js";

import {
  LockAcquisitionAbortedError,
  LockAcquisitionTimeoutError,
  LockUnavailableError,
} from "../../src/core/errors/concurrency.errors.js";

describe("MemoryLockAdapter", () => {
  it("should acquire a lock when the resource is free", async () => {
    const adapter = new MemoryLockAdapter();

    const handle = await adapter.acquire("seat:A12", resolveLockOptions());

    expect(handle).toBeDefined();

    await handle.release();
  });

  it("should prevent simultaneous ownership", async () => {
    const adapter = new MemoryLockAdapter();

    const first = await adapter.acquire("seat:A12", resolveLockOptions());

    await expect(
      adapter.acquire("seat:A12", resolveLockOptions()),
    ).rejects.toThrow(LockUnavailableError);

    await first.release();
  });

  it("should allow independent resources to be locked", async () => {
    const adapter = new MemoryLockAdapter();

    const first = await adapter.acquire("seat:A12", resolveLockOptions());

    const second = await adapter.acquire("seat:A13", resolveLockOptions());

    await first.release();
    await second.release();
  });

  it("should transfer ownership to the next waiting request", async () => {
    const adapter = new MemoryLockAdapter();

    const first = await adapter.acquire("seat:A12", resolveLockOptions());

    const secondPromise = adapter.acquire(
      "seat:A12",
      resolveLockOptions({ waitTimeoutMs: 1000 }),
    );

    await first.release();

    const second = await secondPromise;

    await expect(
      adapter.acquire("seat:A12", resolveLockOptions()),
    ).rejects.toThrow(LockUnavailableError);

    await second.release();
  });

  it("should preserve FIFO ordering", async () => {
    const adapter = new MemoryLockAdapter();

    const first = await adapter.acquire("resource:1", resolveLockOptions());

    const order: number[] = [];

    const secondPromise = adapter.acquire(
      "resource:1",
      resolveLockOptions({ waitTimeoutMs: 2000 }),
    );

    const thirdPromise = adapter.acquire(
      "resource:1",
      resolveLockOptions({ waitTimeoutMs: 2000 }),
    );

    const secondTask = secondPromise.then(async (handle) => {
      order.push(2);
      await handle.release();
    });

    const thirdTask = thirdPromise.then(async (handle) => {
      order.push(3);
      await handle.release();
    });

    await first.release();

    await Promise.all([secondTask, thirdTask]);

    expect(order).toEqual([2, 3]);
  });

  it("should timeout when waiting exceeds the configured duration", async () => {
    const adapter = new MemoryLockAdapter();

    const first = await adapter.acquire("resource:1", resolveLockOptions());

    await expect(
      adapter.acquire("resource:1", resolveLockOptions({ waitTimeoutMs: 30 })),
    ).rejects.toThrow(LockAcquisitionTimeoutError);

    await first.release();
  });

  it("should cancel a waiting request using AbortSignal", async () => {
    const adapter = new MemoryLockAdapter();

    const first = await adapter.acquire("resource:1", resolveLockOptions());

    const controller = new AbortController();

    const waitingRequest = adapter.acquire(
      "resource:1",
      resolveLockOptions({
        waitTimeoutMs: 2000,
        signal: controller.signal,
      }),
    );

    controller.abort();

    await expect(waitingRequest).rejects.toThrow(LockAcquisitionAbortedError);

    await first.release();
  });

  it("should make repeated release calls safe", async () => {
    const adapter = new MemoryLockAdapter();

    const first = await adapter.acquire("resource:1", resolveLockOptions());

    await first.release();
    await first.release();

    const second = await adapter.acquire("resource:1", resolveLockOptions());

    await second.release();
  });

  it("should not allow an old handle to release a new owner's lock", async () => {
    const adapter = new MemoryLockAdapter();

    const first = await adapter.acquire("resource:1", resolveLockOptions());

    const secondPromise = adapter.acquire(
      "resource:1",
      resolveLockOptions({ waitTimeoutMs: 1000 }),
    );

    await first.release();

    const second = await secondPromise;

    // Old handle must not affect the new owner.
    await first.release();

    await expect(
      adapter.acquire("resource:1", resolveLockOptions()),
    ).rejects.toThrow(LockUnavailableError);

    await second.release();
  });

  it("should reject empty resource keys", async () => {
    const adapter = new MemoryLockAdapter();

    await expect(adapter.acquire(" ", resolveLockOptions())).rejects.toThrow(
      TypeError,
    );
  });
});
