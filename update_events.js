const fs = require('fs');

let typesTs = fs.readFileSync('./frontend/src/core/events/types.ts', 'utf8');

typesTs = typesTs.replace(/PLACEHOLDER_1/g, 'PAGES_DELETED\'; indices: number[]');
typesTs = typesTs.replace(/PLACEHOLDER_2/g, 'PAGES_INSERTED\'; atIndex: number; count: number');
typesTs = typesTs.replace(/PLACEHOLDER_3/g, 'DOCUMENT_REPLACED');

fs.writeFileSync('./frontend/src/core/events/types.ts', typesTs);

let dispatchTs = fs.readFileSync('./frontend/src/core/commands/dispatch.ts', 'utf8');
const importStr = `import { documentBus } from '../events/bus';\n`;
if (!dispatchTs.includes('documentBus')) {
  dispatchTs = importStr + dispatchTs;
}

dispatchTs = dispatchTs.replace(/case 'REORDER_PAGES_BY_ORDER': \{/g, `case 'REORDER_PAGES_BY_ORDER': {\ndocumentBus.emit({ type: 'PAGES_REORDERED', order: command.order });`);
dispatchTs = dispatchTs.replace(/case 'DELETE_PAGES': \{/g, `case 'DELETE_PAGES': {\ndocumentBus.emit({ type: 'PAGES_DELETED', indices: command.pageIndices });`);
dispatchTs = dispatchTs.replace(/case 'INSERT_PAGES': \{/g, `case 'INSERT_PAGES': {\ndocumentBus.emit({ type: 'PAGES_INSERTED', atIndex: command.atIndex, count: (await PdfEditAdapter.countPages(command.newBytes)) });`);
dispatchTs = dispatchTs.replace(/case 'INSERT_BLANK_PAGE': \{/g, `case 'INSERT_BLANK_PAGE': {\ndocumentBus.emit({ type: 'PAGES_INSERTED', atIndex: command.atIndex, count: 1 });`);
dispatchTs = dispatchTs.replace(/case 'REPLACE_WORKING_COPY': \{/g, `case 'REPLACE_WORKING_COPY': {\ndocumentBus.emit({ type: 'DOCUMENT_REPLACED' });`);

fs.writeFileSync('./frontend/src/core/commands/dispatch.ts', dispatchTs);
