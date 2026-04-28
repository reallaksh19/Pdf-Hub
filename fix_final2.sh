#!/bin/bash
sed -i 's/assertNever(step);/throw new Error(`Unhandled macro step: ${JSON.stringify(step as any)}`);/g' frontend/src/core/macro/executor.ts
sed -i '/function assertNever(value: never): never {/,/}/d' frontend/src/core/macro/executor.ts
sed -i 's/(_set) => ({/() => ({/g' frontend/src/core/writer/store.ts
sed -i 's/(set) => ({/() => ({/g' frontend/src/core/writer/store.ts
sed -i 's/(_set, get) => ({/(_set: unknown, get: unknown) => ({/g' frontend/src/core/writer/store.ts
sed -i 's/(set, get) => ({/(_set: unknown, get: unknown) => ({/g' frontend/src/core/writer/store.ts
