import { describe, expect, it } from "vitest";

import { ProviderRegistry } from "../../src/core/registry/provider-registry.js";

import {
  ProviderAlreadyRegisteredError,
  ProviderNotFoundError,
} from "../../src/core/errors/concurrency.errors.js";

describe("ProviderRegistry", () => {
  it("should register and retrieve a provider", () => {
    const registry = new ProviderRegistry<object>();

    const provider = { name: "memory" };

    registry.register("memory", provider);

    expect(registry.get("memory")).toBe(provider);
  });

  it("should normalize provider names", () => {
    const registry = new ProviderRegistry<object>();

    const provider = { name: "memory" };

    registry.register(" MEMORY ", provider);

    expect(registry.get("memory")).toBe(provider);
  });

  it("should prevent duplicate registration", () => {
    const registry = new ProviderRegistry<object>();

    registry.register("memory", { name: "first" });

    expect(() => {
      registry.register("MEMORY", { name: "second" });
    }).toThrow(ProviderAlreadyRegisteredError);
  });

  it("should throw when provider does not exist", () => {
    const registry = new ProviderRegistry<object>();

    expect(() => {
      registry.get("redis");
    }).toThrow(ProviderNotFoundError);
  });

  it("should check provider existence", () => {
    const registry = new ProviderRegistry<object>();

    registry.register("memory", { name: "memory" });

    expect(registry.has("memory")).toBe(true);
    expect(registry.has("redis")).toBe(false);
  });

  it("should return all registered provider names", () => {
    const registry = new ProviderRegistry<object>();

    registry.register("memory", {});
    registry.register("redis", {});

    expect(registry.getRegisteredNames()).toEqual(["memory", "redis"]);
  });
});
