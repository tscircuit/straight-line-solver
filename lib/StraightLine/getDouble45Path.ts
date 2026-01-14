import type { Point } from "@tscircuit/math-utils"

export const getDouble45Path = ({
  start,
  end,
  dOffset,
  uBend,
}: {
  start: Point
  end: Point
  dOffset: number
  uBend?: number
}): Point[] => {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const adx = Math.abs(dx)
  const ady = Math.abs(dy)
  const sx = Math.sign(dx)
  const sy = Math.sign(dy)

  if (uBend) {
    const dir = Math.sign(uBend)
    if (adx > ady) {
      // horizontal-ish
      const y_mid = (start.y + end.y) / 2 + dOffset * dir
      const p1_y_dist = Math.abs(y_mid - start.y)
      const p1 = { x: start.x + p1_y_dist * sx, y: y_mid }
      const p2_y_dist = Math.abs(y_mid - end.y)
      const p2 = { x: end.x - p2_y_dist * sx, y: y_mid }

      if (sx > 0 ? p1.x > p2.x : p1.x < p2.x) {
        const x_mid = (start.x + end.x) / 2
        return [start, { x: x_mid, y: y_mid }, end]
      }
      return [start, p1, p2, end]
    } else {
      // vertical-ish
      const x_mid = (start.x + end.x) / 2 + dOffset * dir
      const p1_x_dist = Math.abs(x_mid - start.x)
      const p1 = { x: x_mid, y: start.y + p1_x_dist * sy }
      const p2_x_dist = Math.abs(x_mid - end.x)
      const p2 = { x: x_mid, y: end.y - p2_x_dist * sy }

      if (sy > 0 ? p1.y > p2.y : p1.y < p2.y) {
        const y_mid = (start.y + end.y) / 2
        return [start, { x: x_mid, y: y_mid }, end]
      }
      return [start, p1, p2, end]
    }
  }

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
