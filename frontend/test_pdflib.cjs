const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs');

async function test() {
  const doc = await PDFDocument.create();
  const page = doc.addPage([500, 500]);

  page.drawSvgPath('M 0 0 L 100 100', { x: 250, y: 250, borderColor: rgb(1,0,0), borderWidth: 2 });

  const bytes = await doc.save();
  fs.writeFileSync('test.pdf', bytes);
}
test();
