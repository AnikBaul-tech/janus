import { describe, expect, it } from "vitest";

import {
  LeaseLostError,
  LeaseRenewalError,
  LeaseReleasedError,
} from "../src/core/errors/lease.errors.js";

describe("Lease errors", () => {
  it("creates LeaseLostError with ownership details", () => {
    const error = new LeaseLostError("payment:123", "owner-a");

    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe("LEASE_LOST");
    expect(error.key).toBe("payment:123");
    expect(error.ownerId).toBe("owner-a");
  });

  it("preserves the cause of a lease loss", () => {
    const cause = new Error("Ownership validation failed");

    const error = new LeaseLostError("payment:123", "owner-a", {
      cause,
    });

    expect(error.cause).toBe(cause);
  });

  it("creates LeaseRenewalError", () => {
    const error = new LeaseRenewalError("payment:123", "owner-a");

    expect(error.code).toBe("LEASE_RENEWAL_FAILED");
    expect(error.key).toBe("payment:123");
    expect(error.ownerId).toBe("owner-a");
  });

  it("creates LeaseReleasedError", () => {
    const error = new LeaseReleasedError("payment:123", "owner-a");

    expect(error.code).toBe("LEASE_ALREADY_RELEASED");
    expect(error.key).toBe("payment:123");
    expect(error.ownerId).toBe("owner-a");
  });
});
