import { ConcurrencyManager } from "./concurrency-manager.js";
import type { ConcurrencyManagerOptions } from "./manager-options.js";

import { ProviderRegistry } from "../registry/provider-registry.js";
import { MemoryLockAdapter } from "../../adapters/memory/memory-lock.adapter.js";

import type { LockProvider } from "../contracts/lock-provider.js";

import { Mutex } from "../../features/mutex/mutex.js";

export function createConcurrencyManager(
  options: ConcurrencyManagerOptions = {},
): ConcurrencyManager {
  // 1. Create provider registry.
  const registry = new ProviderRegistry<LockProvider>();

  // 2. Register the default provider.
  registry.register("memory", new MemoryLockAdapter());

  // 3. Register additional providers.
  if (options.lockProviders) {
    for (const [name, provider] of Object.entries(options.lockProviders)) {
      registry.register(name, provider);
    }
  }

  // 4. Resolve the selected provider.
  const providerName = options.provider ?? "memory";

  const lockProvider = registry.get(providerName);

  // 5. Inject the provider into the Mutex.
  const mutex = new Mutex(lockProvider);

  // 6. Construct and return the manager.
  return new ConcurrencyManager(mutex);
}
