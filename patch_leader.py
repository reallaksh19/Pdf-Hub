with open("frontend/src/components/workspace/AnnotationOverlay.tsx", "r") as f:
    content = f.read()

# Add the leader line drawing logic inside the isTextLike block
text_block_start = content.find("if (isTextLike) {")
if text_block_start != -1:
    group_start = content.find("<Group", text_block_start)
    if group_start != -1:
        # We need to compute leader line coordinates
        leader_logic = """
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
"""

        # Insert leader_logic before <Group>
        content = content[:group_start] + leader_logic + "\n      " + content[group_start:]

        # Insert {leaderLine} inside the Group, before <Rect fill="transparent">
        rect_start = content.find("<Rect", group_start + len(leader_logic))
        if rect_start != -1:
            content = content[:rect_start] + "{leaderLine}\n          " + content[rect_start:]

            # Ensure multi-line support with whiteSpace: pre-wrap
            css_start = content.find("wordBreak: 'break-word',", group_start)
            if css_start != -1:
                content = content[:css_start] + "whiteSpace: 'pre-wrap',\n                wordBreak: 'break-word'," + content[css_start + len("wordBreak: 'break-word',"):]

with open("frontend/src/components/workspace/AnnotationOverlay.tsx", "w") as f:
    f.write(content)
