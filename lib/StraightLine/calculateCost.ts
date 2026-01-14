import type { TraceProblem } from "../types"
import type { TraceState } from "./types"
import { segSegDistSq } from "./segSegDistSq"

export const calculateCost = ({
  traces,
  problem,
}: {
  traces: TraceState[]
  problem: TraceProblem
}): number => {
  let total = 0
  const tSpacingSq = problem.preferredTraceToTraceSpacing ** 2
  const oSpacingSq = problem.preferredObstacleToTraceSpacing ** 2
  const b = problem.bounds
  const margin = 0.5

  for (let i = 0; i < traces.length; i++) {
    const t1 = traces[i]
    const segs1 = t1.points.slice(0, -1).map((p, idx) => [p, t1.points[idx + 1]])

    for (let k = 1; k < t1.points.length - 1; k++) {
      const p = t1.points[k]
      const distToEdge = Math.min(
        p.x - b.minX,
        b.maxX - p.x,
        p.y - b.minY,
        b.maxY - p.y,
      )
      if (distToEdge < margin) total += (margin - distToEdge) * 5000
    }

    for (let j = i + 1; j < traces.length; j++) {
      const t2 = traces[j]
      if (t1.networkId && t2.networkId && t1.networkId === t2.networkId) continue
      const segs2 = t2.points.slice(0, -1).map((p, idx) => [p, t2.points[idx + 1]])

      for (const [s1a, s1b] of segs1) {
        for (const [s2a, s2b] of segs2) {
          const d2 = segSegDistSq(s1a, s1b, s2a, s2b)
          if (d2 === 0) {
            total += 1000000
          } else if (d2 < tSpacingSq) {
            total += (tSpacingSq - d2) * 1000
          }
        }
      }
    }

    for (const obstacle of problem.obstacles) {
      const obsSegs = [
        [{ x: obstacle.minX, y: obstacle.minY }, { x: obstacle.maxX, y: obstacle.minY }],
        [{ x: obstacle.maxX, y: obstacle.minY }, { x: obstacle.maxX, y: obstacle.maxY }],
        [{ x: obstacle.maxX, y: obstacle.maxY }, { x: obstacle.minX, y: obstacle.maxY }],
        [{ x: obstacle.minX, y: obstacle.maxY }, { x: obstacle.minX, y: obstacle.minY }],
      ] as const
      for (const [s1a, s1b] of segs1) {
        for (const [o1, o2] of obsSegs) {
          const d2 = segSegDistSq(s1a, s1b, o1, o2)
          if (d2 < oSpacingSq) total += (oSpacingSq - d2) * 100
        }
      }
    }
  }
  return total
}
