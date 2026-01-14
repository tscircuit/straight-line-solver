import type { Point } from "@tscircuit/math-utils"
import { ptSegDistSq } from "./ptSegDistSq"

export const segSegDistSq = (
  a1: Point,
  a2: Point,
  b1: Point,
  b2: Point,
): number => {
  const intersects = (p1: Point, p2: Point, p3: Point, p4: Point) => {
    const det = (p2.x - p1.x) * (p4.y - p3.y) - (p2.y - p1.y) * (p4.x - p3.x)
    if (det === 0) return false
    const lambda =
      ((p4.y - p3.y) * (p4.x - p1.x) + (p3.x - p4.x) * (p4.y - p1.y)) / det
    const gamma =
      ((p1.y - p2.y) * (p4.x - p1.x) + (p2.x - p1.x) * (p4.y - p1.y)) / det
    return 0 < lambda && lambda < 1 && 0 < gamma && gamma < 1
  }
  if (intersects(a1, a2, b1, b2)) return 0
  return Math.min(
    ptSegDistSq(a1, b1, b2),
    ptSegDistSq(a2, b1, b2),
    ptSegDistSq(b1, a1, a2),
    ptSegDistSq(b2, a1, a2),
  )
}
