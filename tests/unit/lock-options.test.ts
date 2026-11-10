import { describe, expect, it } from "vitest";

import { resolveLockOptions } from "../../src/core/types/lock-options.js";

describe("LockOptions", () => {
  it("should provide default options", () => {
    expect(resolveLockOptions()).toEqual({
      waitTimeoutMs: 0,
    });
  });

  it("should accept a custom timeout", () => {
    expect(
      resolveLockOptions({
        waitTimeoutMs: 5000,
      }),
    ).toEqual({
      waitTimeoutMs: 5000,
    });
  });

  it("should reject negative timeout", () => {
    expect(() =>
      resolveLockOptions({
        waitTimeoutMs: -100,
      }),
    ).toThrow(RangeError);
  });

  it("should reject invalid timeout", () => {
    expect(() =>
      resolveLockOptions({
        waitTimeoutMs: 1.5,
      }),
    ).toThrow(RangeError);
  });
});
