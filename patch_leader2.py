with open("frontend/src/components/workspace/AnnotationOverlay.tsx", "r") as f:
    content = f.read()

# Oh no, it injected `let leaderLine` inside the `return (` because of the formatting.
# Let's fix this.
broken_logic = """      return (

      let leaderLine = null;
      if (annotation.type === 'callout' && annotation.data.anchor) {
        const anchor = annotation.data.anchor as { x: number; y: number };
        const lineEndX = width / 2;
        const lineEndY = height / 2;
        const anchorX = (anchor.x * scale) - x;
        const anchorY = (anchor.y * scale) - y;

        leaderLine = (
           <Line
             points={[anchorX, anchorY, lineEndX, lineEndY]}
             stroke={borderColor}
             strokeWidth={1}
             listening={false}
           />
        );
      }

      <Group """

fixed_logic = """
      let leaderLine = null;
      if (annotation.type === 'callout' && annotation.data.anchor) {
        const anchor = annotation.data.anchor as { x: number; y: number };
        const lineEndX = width / 2;
        const lineEndY = height / 2;
        const anchorX = (anchor.x * scale) - x;
        const anchorY = (anchor.y * scale) - y;

        leaderLine = (
           <Line
             points={[anchorX, anchorY, lineEndX, lineEndY]}
             stroke={borderColor}
             strokeWidth={1}
             listening={false}
           />
        );
      }

      return (
        <Group """

content = content.replace(broken_logic, fixed_logic)

with open("frontend/src/components/workspace/AnnotationOverlay.tsx", "w") as f:
    f.write(content)
