const fs = require('fs');

const path = 'frontend/src/components/workspace/DocumentWorkspace.tsx';
let content = fs.readFileSync(path, 'utf8');

// There is a missing closing brace on openDocument call from someone else's broken commit.
content = content.replace(
  "openDocument({\n        documentKey: nextDocumentKey,\n        fileName: picked.name,\n        bytes: safeBytes,\n        pageCount,\n      \n    } catch (err) {",
  "openDocument({\n        documentKey: nextDocumentKey,\n        fileName: picked.name,\n        bytes: safeBytes,\n        pageCount,\n      });\n    } catch (err) {"
);

fs.writeFileSync(path, content);
