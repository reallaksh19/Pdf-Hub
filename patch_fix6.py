import re

with open('frontend/src/core/macro/steps/generation-ops.ts', 'r') as f:
    content = f.read()

old_base64 = """        const binaryString = atob(match[2]);
        imageBytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          imageBytes[i] = binaryString.charCodeAt(i);
        }"""

new_base64 = """        // Use a universal cross-platform method if available or stick to standard Buffer if in Node
        if (typeof Buffer !== 'undefined') {
          imageBytes = new Uint8Array(Buffer.from(match[2], 'base64'));
        } else {
          const binaryString = atob(match[2]);
          imageBytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            imageBytes[i] = binaryString.charCodeAt(i);
          }
        }"""

content = content.replace(old_base64, new_base64)

with open('frontend/src/core/macro/steps/generation-ops.ts', 'w') as f:
    f.write(content)
