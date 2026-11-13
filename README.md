# Concurrency SDK

A modular concurrency management toolkit for Node.js.

## Features

- Mutex-based resource synchronization.
- FIFO waiting queues.
- Lock acquisition timeout.
- AbortSignal cancellation.
- Automatic lock release.
- Pluggable lock providers.
- TypeScript support.

## Installation

```bash
npm install concurrency-sdk
```

## Basic Usage

```typescript
import { createConcurrencyManager } from "concurrency-sdk";

const manager = createConcurrencyManager({
  provider: "memory",
});

await manager.mutex.withLock("booking:seat:A12", async () => {
  console.log("Booking seat...");
});
```

## Available Providers

| Provider | Scope                  |
| -------- | ---------------------- |
| Memory   | Single Node.js process |

## Development

```bash
npm install
npm run typecheck
npm test
npm run build
```

## Architecture

The SDK follows an adapter-based architecture.

- Features implement concurrency behavior.
- Providers implement synchronization mechanisms.
- The manager exposes initialized features.
- The factory handles dependency injection.

## Limitations

The Memory provider only coordinates operations
within a single Node.js process.

It does not provide distributed synchronization.
