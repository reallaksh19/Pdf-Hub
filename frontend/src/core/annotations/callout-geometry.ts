import type { Point2D, Rect } from './types';

export interface CalloutPath {
  edgePoint:  Point2D;    // point on the box edge (start of leader)
  elbowPoint: Point2D;    // midpoint of nearest edge (the "elbow")
  anchorPoint: Point2D;   // destination of the leader line (anchor)
}

/**
 * Computes a 3-point callout leader line.
 * The path goes: boxEdgePoint → elbowPoint (same as edgePoint for simple case) → anchorPoint
 *
 * More precisely: find the nearest edge of the box to the anchor,
 * compute the closest point on that edge, and route the leader from there.
 */
export function computeCalloutPath(anchorPoint: Point2D, boxRect: Rect): CalloutPath {
  const { x, y, width, height } = boxRect;

  // Box edge midpoints
  const edges = {
    top:    { x: x + width / 2, y },
    bottom: { x: x + width / 2, y: y + height },
    left:   { x, y: y + height / 2 },
    right:  { x: x + width, y: y + height / 2 },
  };

  // Find nearest edge midpoint to anchorPoint
  let nearest = edges.bottom;
  let minDist = Infinity;
  for (const pt of Object.values(edges)) {
    const d = Math.hypot(pt.x - anchorPoint.x, pt.y - anchorPoint.y);
    if (d < minDist) {
      minDist = d;
      nearest = pt;
    }
  }

  // Clamp anchor to not be inside the box (push it slightly out)
  const clampedAnchor = clampOutsideRect(anchorPoint, boxRect);

  return {
    edgePoint:   nearest,
    elbowPoint:  nearest,     // For simple callout: edge and elbow coincide
    anchorPoint: clampedAnchor,
  };
}

function clampOutsideRect(point: Point2D, rect: Rect): Point2D {
  const { x, y, width, height } = rect;
  const insideX = point.x >= x && point.x <= x + width;
  const insideY = point.y >= y && point.y <= y + height;
  if (!insideX || !insideY) return point;

  // Push the point to the nearest edge
  const dists = {
    top:    point.y - y,
    bottom: y + height - point.y,
    left:   point.x - x,
    right:  x + width - point.x,
  };
  const minKey = Object.entries(dists).sort((a, b) => a[1] - b[1])[0][0];
  return minKey === 'top'    ? { ...point, y: y - 10 } :
         minKey === 'bottom' ? { ...point, y: y + height + 10 } :
         minKey === 'left'   ? { ...point, x: x - 10 } :
                               { ...point, x: x + width + 10 };
}
