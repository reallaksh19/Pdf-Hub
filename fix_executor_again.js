const fs = require('fs');

const path = 'frontend/src/core/macro/executor.ts';
let content = fs.readFileSync(path, 'utf8');
content = content.replace("}\n}", "}"); // Fix the trailing brace from sed deleting the assertNever function block incorrectly
fs.writeFileSync(path, content);
