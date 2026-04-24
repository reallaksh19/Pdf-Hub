with open("frontend/src/components/workspace/DocumentWorkspace.test.tsx", "r") as f:
    content = f.read()

# Add missing context methods to avoid Konva errors
mock_idx = content.find("setTransform: vi.fn(),")
if mock_idx != -1:
    replacement = """setTransform: vi.fn(),
      transform: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),"""
    content = content.replace("setTransform: vi.fn(),", replacement)

with open("frontend/src/components/workspace/DocumentWorkspace.test.tsx", "w") as f:
    f.write(content)
