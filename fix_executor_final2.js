const fs = require('fs');

let executorTs = fs.readFileSync('./frontend/src/core/macro/executor.ts', 'utf8');
executorTs = executorTs.replace(/function assertNever\(value: never\): never \{/g, '/* function assertNever(value: never): never {');
executorTs = executorTs.replace(/throw new Error\(\`Unhandled macro step: \$\{JSON\.stringify\(value\)\}\`\);\n\}/g, 'throw new Error(`Unhandled macro step: ${JSON.stringify(value)}`);\n} */');
fs.writeFileSync('./frontend/src/core/macro/executor.ts', executorTs);

let writerStoreTs = fs.readFileSync('./frontend/src/core/writer/store.ts', 'utf8');
writerStoreTs = writerStoreTs.replace(/const useWriterStore = create<WriterState & WriterActions>\(\(\_set\) => \(\{\)/g, 'const useWriterStore = create<WriterState & WriterActions>(() => ({');
writerStoreTs = writerStoreTs.replace(/const useWriterStore = create<WriterState & WriterActions>\(\(set\) => \(\{\)/g, 'const useWriterStore = create<WriterState & WriterActions>(() => ({');
fs.writeFileSync('./frontend/src/core/writer/store.ts', writerStoreTs);
