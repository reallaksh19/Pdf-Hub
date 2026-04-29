const fs = require('fs');
let content = fs.readFileSync('frontend/src/core/macro/steps/generation-ops.ts', 'utf8');

const regex = /type AdjustImageStep = Extract<MacroStep, \{ op: 'adjust_image' \}>;\nasync function executeAdjustImage\([\s\S]*?macroRegistry\.register\('adjust_image', executeAdjustImage\);/g;

content = content.replace(regex, "");

fs.writeFileSync('frontend/src/core/macro/steps/generation-ops.ts', content);
