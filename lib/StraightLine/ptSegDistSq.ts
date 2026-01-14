import type { Point } from "@tscircuit/math-utils"

export const ptSegDistSq = (p: Point, s1: Point, s2: Point): number => {
  const dx = s2.x - s1.x
  const dy = s2.y - s1.y
  const l2 = dx * dx + dy * dy
  if (l2 === 0) return (p.x - s1.x) ** 2 + (p.y - s1.y) ** 2
  const t = Math.max(
    0,
    Math.min(1, ((p.x - s1.x) * dx + (p.y - s1.y) * dy) / l2),
  )
  return (p.x - (s1.x + t * dx)) ** 2 + (p.y - (s1.y + t * dy)) ** 2
}
