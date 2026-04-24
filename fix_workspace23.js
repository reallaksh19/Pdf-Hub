const fs = require('fs');

// Fix DocumentWorkspace test by mocking canvas
const file = 'frontend/src/components/workspace/DocumentWorkspace.test.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('HTMLCanvasElement.prototype.getContext')) {
    const mock = `
HTMLCanvasElement.prototype.getContext = () => ({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: (x, y, w, h) => ({
    data: new Array(w * h * 4)
  }),
  putImageData: vi.fn(),
  createImageData: vi.fn(),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
});
`;
    content = content.replace("describe('DocumentWorkspace', () => {", mock + "\ndescribe('DocumentWorkspace', () => {");
}

fs.writeFileSync(file, content);
