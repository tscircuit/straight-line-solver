import type { Point } from "@tscircuit/math-utils"
import type { Obstacle } from "../types"
import { segSegDistSq } from "./segSegDistSq"

export const getUPath = ({
  start,
  end,
  obstacles,
  traces,
  spacing,
}: {
  start: Point
  end: Point
  obstacles: Obstacle[]
  traces: Point[][]
  spacing: number
}): Point[] => {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const sx = Math.sign(dx)
  const sy = Math.sign(dy)

  const isSameSideX = Math.abs(dy) < Math.abs(dx) * 0.3
  const isSameSideY = Math.abs(dx) < Math.abs(dy) * 0.3

  if (!isSameSideX && !isSameSideY) {
    return [start, end]
  }

  const baseDepth = spacing * 2
  const depth = baseDepth

  const checkCollisions = (testPath: Point[]): number => {
    let penalty = 0
    const segs = testPath.slice(0, -1).map((p, i) => [p, testPath[i + 1]])

    for (const obs of obstacles) {
      const obsSegs = [
        [
          { x: obs.minX, y: obs.minY },
          { x: obs.maxX, y: obs.minY },
        ],
        [
          { x: obs.maxX, y: obs.minY },
          { x: obs.maxX, y: obs.maxY },
        ],
        [
          { x: obs.maxX, y: obs.maxY },
          { x: obs.minX, y: obs.maxY },
        ],
        [
          { x: obs.minX, y: obs.maxY },
          { x: obs.minX, y: obs.minY },
        ],
      ] as const
      for (const [s1, s2] of segs) {
        for (const [o1, o2] of obsSegs) {
          const d2 = segSegDistSq(s1, s2, o1, o2)
          if (d2 < spacing * spacing) penalty += spacing * spacing - d2
        }
      }
    }

    for (const trace of traces) {
      const traceSegs = trace.slice(0, -1).map((p, i) => [p, trace[i + 1]])
      for (const [s1, s2] of segs) {
        for (const [t1, t2] of traceSegs) {
          const d2 = segSegDistSq(s1, s2, t1, t2)
          if (d2 < spacing * spacing) penalty += spacing * spacing - d2
        }
      }
    }

    return penalty
  }

  if (isSameSideX) {
    let bestPath = [start, end]
    let bestPenalty = Infinity

    for (const direction of [1, -1]) {
      for (let d = baseDepth; d <= baseDepth * 5; d += spacing) {
        const midY = (start.y + end.y) / 2 + direction * d
        const p1 = { x: start.x, y: midY }
        const p2 = { x: end.x, y: midY }
        const testPath = [start, p1, p2, end]
        const penalty = checkCollisions(testPath)
        if (penalty < bestPenalty) {
          bestPenalty = penalty
          bestPath = testPath
        }
        if (penalty === 0) break
      }
      if (bestPenalty === 0) break
    }
    return bestPath
  }

  let bestPath = [start, end]
  let bestPenalty = Infinity

  for (const direction of [1, -1]) {
    for (let d = baseDepth; d <= baseDepth * 5; d += spacing) {
      const midX = (start.x + end.x) / 2 + direction * d
      const p1 = { x: midX, y: start.y }
      const p2 = { x: midX, y: end.y }
      const testPath = [start, p1, p2, end]
      const penalty = checkCollisions(testPath)
      if (penalty < bestPenalty) {
        bestPenalty = penalty
        bestPath = testPath
      }
      if (penalty === 0) break
    }
    if (bestPenalty === 0) break
  }
  return bestPath
}
