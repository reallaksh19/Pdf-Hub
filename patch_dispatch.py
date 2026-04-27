import re

with open('frontend/src/core/commands/dispatch.ts', 'r') as f:
    content = f.read()

# Make sure we import documentBus
if "import { documentBus } from '../events/bus';" not in content:
    content = "import { documentBus } from '../events/bus';\n" + content

# REORDER_PAGES_BY_ORDER
def repl_reorder(match):
    return match.group(0) + "\n        documentBus.publish({ type: 'PAGES_REORDERED', order: command.order });"

content = re.sub(r'const nextBytes = await PdfEditAdapter\.reorderPages\(context\.workingBytes, command\.order\);\s*const result = await applyMutation\(command, source, context\.workingBytes, nextBytes\);', repl_reorder, content)

# DELETE_PAGES
def repl_delete(match):
    return match.group(0) + "\n        documentBus.publish({ type: 'PAGES_DELETED', indices: pageIndices });"

content = re.sub(r'const nextBytes = await PdfEditAdapter\.removePages\(context\.workingBytes, pageIndices\);\s*const result = await applyMutation\(command, source, context\.workingBytes, nextBytes\);', repl_delete, content)

# INSERT_PAGES
def repl_insert(match):
    return match.group(0) + "\n        const donorPageCount = await PdfEditAdapter.countPages(command.newBytes);\n        documentBus.publish({ type: 'PAGES_INSERTED', atIndex: command.atIndex, count: donorPageCount });"

content = re.sub(r'const nextBytes = await PdfEditAdapter\.insertAt\([\s\S]*?command\.atIndex,\s*\);\s*const result = await applyMutation\(command, source, context\.workingBytes, nextBytes\);', repl_insert, content)

# REPLACE_WORKING_COPY
def repl_replace(match):
    return match.group(0) + "\n        documentBus.publish({ type: 'DOCUMENT_REPLACED' });"

content = re.sub(r'const resolvedPageCount = [\s\S]*?await applyMutation\(command, source, context\.workingBytes, nextBytes\);', repl_replace, content)


with open('frontend/src/core/commands/dispatch.ts', 'w') as f:
    f.write(content)
