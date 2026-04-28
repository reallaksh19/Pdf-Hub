#!/bin/bash
sed -i 's/JSON.stringify(step as any)/JSON.stringify(step as unknown)/g' frontend/src/core/macro/executor.ts
sed -i 's/(_set) => ({/() => ({/g' frontend/src/core/writer/store.ts
sed -i 's/(_set, get) => ({/(_set: unknown, get: unknown) => ({/g' frontend/src/core/writer/store.ts
