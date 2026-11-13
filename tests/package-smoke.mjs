import assert from "node:assert/strict";

import { createConcurrencyManager } from "../dist/index.js";

const manager = createConcurrencyManager({
  provider: "memory",
});

const result = await manager.mutex.withLock(
  "package:test",
  async () => "Package works",
);

assert.equal(result, "Package works");
