import type { Point } from "@tscircuit/math-utils"

export const isSameSide = ({
  start,
  end,
}: {
  start: Point
  end: Point
}): boolean => {
  const dx = Math.abs(end.x - start.x)
  const dy = Math.abs(end.y - start.y)
  return dx < dy * 0.3 || dy < dx * 0.3
}
