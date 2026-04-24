with open("frontend/src/components/workspace/DocumentWorkspace.test.tsx", "r") as f:
    content = f.read()

# Add mock for ctx.getImageData
mock_idx = content.find("HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({")
if mock_idx != -1:
    mock_end = content.find("}) as unknown as typeof HTMLCanvasElement.prototype.getContext;", mock_idx)
    if mock_end != -1:
        replacement = """HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      save: vi.fn(),
      restore: vi.fn(),
      scale: vi.fn(),
      translate: vi.fn(),
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      beginPath: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
      fillRect: vi.fn(),
      fillStyle: '',
      setTransform: vi.fn(),
      getImageData: vi.fn().mockReturnValue({ data: new Uint8ClampedArray(4) }),
      createPattern: vi.fn(),
      measureText: vi.fn().mockReturnValue({ width: 0 }),
      fillText: vi.fn(),
      strokeText: vi.fn(),
      lineTo: vi.fn(),
      moveTo: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      closePath: vi.fn(),
      arc: vi.fn(),
    }) as unknown as typeof HTMLCanvasElement.prototype.getContext;"""
        content = content[:mock_idx] + replacement + content[mock_end + len("}) as unknown as typeof HTMLCanvasElement.prototype.getContext;"):]

with open("frontend/src/components/workspace/DocumentWorkspace.test.tsx", "w") as f:
    f.write(content)
