const fs = require('fs');
const file = 'frontend/src/components/workspace/DocumentWorkspace.tsx';
let content = fs.readFileSync(file, 'utf8');

// I will leave unused variables in the file for now, rather than doing aggressive removals of them which causes syntax errors

fs.writeFileSync(file, content);
