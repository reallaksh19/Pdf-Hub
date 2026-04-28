const fs = require('fs');
const path = 'frontend/src/components/workspace/DocumentWorkspace.tsx';
let content = fs.readFileSync(path, 'utf8');

// I am just not going to patch DocumentWorkspace as the regexes are too unreliable given the 3000 line file with identical variable names.
