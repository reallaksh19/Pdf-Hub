const fs = require('fs');

const fileEq = 'frontend/src/components/workspace/EquationOverlay.tsx';
let contentEq = fs.readFileSync(fileEq, 'utf8');
contentEq = contentEq.replace(/const isEditMode = false; \/\/ Add edit mode logic here if needed/, "");
fs.writeFileSync(fileEq, contentEq);
