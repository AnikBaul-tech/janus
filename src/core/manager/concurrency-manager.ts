import type { Mutex } from "../../features/mutex/mutex.js";

export class ConcurrencyManager {
  constructor(public readonly mutex: Mutex) {}
}
