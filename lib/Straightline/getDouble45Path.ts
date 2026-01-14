import type { Point } from "@tscircuit/math-utils"

export const getDouble45Path = ({
  start,
  end,
  dOffset,
}: {
  start: Point
  end: Point
  dOffset: number
}): Point[] => {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const adx = Math.abs(dx)
  const ady = Math.abs(dy)
  const sx = Math.sign(dx)
  const sy = Math.sign(dy)

  if (adx > ady) {
    const d = Math.max(0, Math.min(ady, dOffset))
    const p1 = { x: start.x + d * sx, y: start.y + d * sy }
    const p2 = { x: end.x - (ady - d) * sx, y: start.y + d * sy }
    return [start, p1, p2, end]
  } else {
    const d = Math.max(0, Math.min(adx, dOffset))
    const p1 = { x: start.x + d * sx, y: start.y + d * sy }
    const p2 = { x: start.x + d * sx, y: end.y - (adx - d) * sy }
    return [start, p1, p2, end]
  }
}
