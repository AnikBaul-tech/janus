import { createConcurrencyManager } from "../src/index.js";

const manager = createConcurrencyManager({
  provider: "memory",
});

let stock = 5;

async function purchaseProduct(userId: number) {
  return manager.mutex.withLock(
    "product:101",
    async () => {
      console.log(`User ${userId} acquired lock`);

      if (stock <= 0) {
        return "Out of stock";
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      stock--;

      console.log(`User ${userId} purchased product`);

      return "Purchase successful";
    },
    {
      waitTimeoutMs: 2000,
    },
  );
}

async function main() {
  const results = await Promise.all(
    Array.from({ length: 8 }, (_, index) => purchaseProduct(index + 1)),
  );

  console.log("Results:", results);
  console.log("Remaining stock:", stock);
}

main().catch(console.error);
