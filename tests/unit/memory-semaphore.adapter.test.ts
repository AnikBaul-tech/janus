import { describe, expect, it } from "vitest";

import { MemorySemaphoreAdapter } from "../../src/adapters/memory/memory-semaphore.adapter.js";
import { resolveLockOptions } from "../../src/core/types/lock-options.js";

import {
  SemaphoreAcquisitionAbortedError,
  SemaphoreAcquisitionTimeoutError,
  SemaphoreCapacityMismatchError,
  SemaphoreUnavailableError,
} from "../../src/core/errors/concurrency.errors.js";

describe("MemorySemaphoreAdapter", () => {
  it("should acquire permits up to the configured capacity", async () => {
    const adapter = new MemorySemaphoreAdapter();

    const first = await adapter.acquire("resource", 2, resolveLockOptions());

    const second = await adapter.acquire("resource", 2, resolveLockOptions());

    await expect(
      adapter.acquire("resource", 2, resolveLockOptions()),
    ).rejects.toThrow(SemaphoreUnavailableError);

    await first.release();
    await second.release();
  });

  it("should allow independent semaphore keys", async () => {
    const adapter = new MemorySemaphoreAdapter();

    const first = await adapter.acquire("resource:a", 1, resolveLockOptions());

    const second = await adapter.acquire("resource:b", 1, resolveLockOptions());

    await first.release();
    await second.release();
  });

  it("should transfer a released permit to a waiting request", async () => {
    const adapter = new MemorySemaphoreAdapter();

    const first = await adapter.acquire("resource", 1, resolveLockOptions());

    const waiting = adapter.acquire(
      "resource",
      1,
      resolveLockOptions({ waitTimeoutMs: 1000 }),
    );

    await first.release();

    const second = await waiting;
    await second.release();
  });

  it("should preserve FIFO ordering", async () => {
    const adapter = new MemorySemaphoreAdapter();
    const order: number[] = [];

    const first = await adapter.acquire("resource", 1, resolveLockOptions());

    const waiting = [1, 2, 3].map((number) =>
      adapter
        .acquire("resource", 1, resolveLockOptions({ waitTimeoutMs: 2000 }))
        .then(async (handle) => {
          order.push(number);
          await handle.release();
        }),
    );

    await first.release();
    await Promise.all(waiting);

    expect(order).toEqual([1, 2, 3]);
  });

  it("should reject requests with mismatched capacity", async () => {
    const adapter = new MemorySemaphoreAdapter();

    const first = await adapter.acquire("resource", 2, resolveLockOptions());

    await expect(
      adapter.acquire("resource", 3, resolveLockOptions()),
    ).rejects.toThrow(SemaphoreCapacityMismatchError);

    await first.release();
  });

  it("should reject immediately when no permit is available", async () => {
    const adapter = new MemorySemaphoreAdapter();

    const first = await adapter.acquire("resource", 1, resolveLockOptions());

    await expect(
      adapter.acquire("resource", 1, resolveLockOptions()),
    ).rejects.toThrow(SemaphoreUnavailableError);

    await first.release();
  });

  it("should reject a request when its waiting timeout expires", async () => {
    const adapter = new MemorySemaphoreAdapter();

    const first = await adapter.acquire("resource", 1, resolveLockOptions());

    await expect(
      adapter.acquire("resource", 1, resolveLockOptions({ waitTimeoutMs: 20 })),
    ).rejects.toThrow(SemaphoreAcquisitionTimeoutError);

    await first.release();
  });

  it("should support AbortSignal cancellation", async () => {
    const adapter = new MemorySemaphoreAdapter();

    const first = await adapter.acquire("resource", 1, resolveLockOptions());

    const controller = new AbortController();

    const waiting = adapter.acquire(
      "resource",
      1,
      resolveLockOptions({
        waitTimeoutMs: 5000,
        signal: controller.signal,
      }),
    );

    controller.abort();

    await expect(waiting).rejects.toThrow(SemaphoreAcquisitionAbortedError);

    await first.release();
  });

  it("should release a permit only once", async () => {
    const adapter = new MemorySemaphoreAdapter();

    const first = await adapter.acquire("resource", 1, resolveLockOptions());

    await first.release();
    await first.release();

    const second = await adapter.acquire("resource", 1, resolveLockOptions());

    await second.release();
  });

  it("should not allow an old handle to release a transferred permit", async () => {
    const adapter = new MemorySemaphoreAdapter();

    const first = await adapter.acquire("resource", 1, resolveLockOptions());

    const waiting = adapter.acquire(
      "resource",
      1,
      resolveLockOptions({ waitTimeoutMs: 1000 }),
    );

    await first.release();

    const second = await waiting;

    await first.release();

    await expect(
      adapter.acquire("resource", 1, resolveLockOptions()),
    ).rejects.toThrow(SemaphoreUnavailableError);

    await second.release();
  });

  it("should reject blank keys and invalid capacities", async () => {
    const adapter = new MemorySemaphoreAdapter();

    await expect(adapter.acquire("", 1, resolveLockOptions())).rejects.toThrow(
      TypeError,
    );

    await expect(
      adapter.acquire("resource", 0, resolveLockOptions()),
    ).rejects.toThrow(RangeError);

    await expect(
      adapter.acquire("resource", 1.5, resolveLockOptions()),
    ).rejects.toThrow(RangeError);
  });

  it("should never exceed capacity under heavy contention", async () => {
    const adapter = new MemorySemaphoreAdapter();

    const capacity = 5;
    const totalRequests = 100;

    let activeOperations = 0;
    let maximumActiveOperations = 0;
    let completedOperations = 0;

    const operations = Array.from({ length: totalRequests }, async () => {
      const handle = await adapter.acquire(
        "stress:resource",
        capacity,
        resolveLockOptions({
          waitTimeoutMs: 15000,
        }),
      );

      try {
        activeOperations++;

        maximumActiveOperations = Math.max(
          maximumActiveOperations,
          activeOperations,
        );

        await new Promise((resolve) => setTimeout(resolve, 5));

        completedOperations++;
      } finally {
        activeOperations--;
        await handle.release();
      }
    });

    await Promise.all(operations);

    expect(maximumActiveOperations).toBeLessThanOrEqual(capacity);

    expect(maximumActiveOperations).toBe(capacity);
    expect(activeOperations).toBe(0);
    expect(completedOperations).toBe(totalRequests);
  });

  it("should preserve FIFO order with multiple permits", async () => {
    const adapter = new MemorySemaphoreAdapter();

    const first = await adapter.acquire(
      "fifo:resource",
      2,
      resolveLockOptions(),
    );

    const second = await adapter.acquire(
      "fifo:resource",
      2,
      resolveLockOptions(),
    );

    const order: number[] = [];

    const waiting1 = adapter
      .acquire("fifo:resource", 2, resolveLockOptions({ waitTimeoutMs: 5000 }))
      .then(async (handle) => {
        order.push(1);
        await handle.release();
      });

    const waiting2 = adapter
      .acquire("fifo:resource", 2, resolveLockOptions({ waitTimeoutMs: 5000 }))
      .then(async (handle) => {
        order.push(2);
        await handle.release();
      });

    const waiting3 = adapter
      .acquire("fifo:resource", 2, resolveLockOptions({ waitTimeoutMs: 5000 }))
      .then(async (handle) => {
        order.push(3);
        await handle.release();
      });

    await first.release();
    await second.release();

    await Promise.all([waiting1, waiting2, waiting3]);

    expect(order).toEqual([1, 2, 3]);
  });

  it("should not allocate permits to timed-out waiters", async () => {
    const adapter = new MemorySemaphoreAdapter();

    const first = await adapter.acquire(
      "timeout:resource",
      1,
      resolveLockOptions(),
    );

    const timedOutRequest = adapter.acquire(
      "timeout:resource",
      1,
      resolveLockOptions({
        waitTimeoutMs: 20,
      }),
    );

    await expect(timedOutRequest).rejects.toThrow(
      SemaphoreAcquisitionTimeoutError,
    );

    await first.release();

    const next = await adapter.acquire(
      "timeout:resource",
      1,
      resolveLockOptions(),
    );

    await next.release();
  });

  it("should not allocate permits to cancelled waiters", async () => {
    const adapter = new MemorySemaphoreAdapter();

    const first = await adapter.acquire(
      "abort:resource",
      1,
      resolveLockOptions(),
    );

    const controller = new AbortController();

    const cancelledRequest = adapter.acquire(
      "abort:resource",
      1,
      resolveLockOptions({
        waitTimeoutMs: 5000,
        signal: controller.signal,
      }),
    );

    controller.abort();

    await expect(cancelledRequest).rejects.toThrow(
      SemaphoreAcquisitionAbortedError,
    );

    await first.release();

    const next = await adapter.acquire(
      "abort:resource",
      1,
      resolveLockOptions(),
    );

    await next.release();
  });

  it("should allow capacity changes after the semaphore becomes idle", async () => {
    const adapter = new MemorySemaphoreAdapter();

    const first = await adapter.acquire(
      "dynamic:resource",
      1,
      resolveLockOptions(),
    );

    await first.release();

    const permits = await Promise.all([
      adapter.acquire("dynamic:resource", 3, resolveLockOptions()),
      adapter.acquire("dynamic:resource", 3, resolveLockOptions()),
      adapter.acquire("dynamic:resource", 3, resolveLockOptions()),
    ]);

    expect(permits).toHaveLength(3);

    await Promise.all(permits.map((permit) => permit.release()));
  });

  it("should maintain independent capacity for different keys", async () => {
    const adapter = new MemorySemaphoreAdapter();

    const first = await adapter.acquire("resource:a", 1, resolveLockOptions());

    const second = await adapter.acquire("resource:b", 2, resolveLockOptions());

    const third = await adapter.acquire("resource:b", 2, resolveLockOptions());

    await expect(
      adapter.acquire("resource:a", 1, resolveLockOptions()),
    ).rejects.toThrow(SemaphoreUnavailableError);

    const fourth = await adapter.acquire("resource:c", 1, resolveLockOptions());

    await Promise.all([
      first.release(),
      second.release(),
      third.release(),
      fourth.release(),
    ]);
  });
});
