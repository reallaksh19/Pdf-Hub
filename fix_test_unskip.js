const fs = require('fs');

let thumbnailSidebarTest = fs.readFileSync('./frontend/src/components/sidebar/panels/ThumbnailSidebar.test.tsx', 'utf8');

thumbnailSidebarTest = thumbnailSidebarTest.replace(/it\.skip\('handles keyboard navigation and selection', async \(\) => \{/g, 'it(\'handles keyboard navigation and selection\', async () => {');

fs.writeFileSync('./frontend/src/components/sidebar/panels/ThumbnailSidebar.test.tsx', thumbnailSidebarTest);
