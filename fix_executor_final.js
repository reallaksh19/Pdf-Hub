const fs = require('fs');

const path = 'frontend/src/core/macro/executor.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace("function assertNever(value: never): never {\n  throw new Error(`Unhandled macro step: ${JSON.stringify(value)}`);\n}", "");
fs.writeFileSync(path, content);
