import { BaseSolver } from "@tscircuit/solver-utils"
import type { TraceProblem, OutputTrace } from "./45DegreeTraceSolver/types"
import type { Point } from "@tscircuit/math-utils"
import type { GraphicsObject } from "graphics-debug"
import { visualizeTraceProblem } from "./45DegreeTraceSolver/visualization"

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

const ptSegDistSq = (p: Point, s1: Point, s2: Point): number => {
  const dx = s2.x - s1.x
  const dy = s2.y - s1.y
  const l2 = dx * dx + dy * dy
  if (l2 === 0) return (p.x - s1.x) ** 2 + (p.y - s1.y) ** 2
  const t = Math.max(0, Math.min(1, ((p.x - s1.x) * dx + (p.y - s1.y) * dy) / l2))
  return (p.x - (s1.x + t * dx)) ** 2 + (p.y - (s1.y + t * dy)) ** 2
}

const segSegDistSq = (a1: Point, a2: Point, b1: Point, b2: Point): number => {
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

interface TraceState {
  d: number
  points: Point[]
  networkId?: string
}

export class StraightLineSolver extends BaseSolver {
  outputTraces: OutputTrace[] = []
  private traces: TraceState[] = []
  private iteration = 0
  private maxIterations = 200

  constructor(private problem: TraceProblem) {
    super()
    this.traces = this.problem.waypointPairs.map((wp) => {
      const dx = Math.abs(wp.end.x - wp.start.x)
      const dy = Math.abs(wp.end.y - wp.start.y)
      const d = Math.min(dx, dy) / 2
      return {
        d,
        networkId: wp.networkId,
        points: getDouble45Path({ start: wp.start, end: wp.end, dOffset: d }),
      }
    })
  }

  private calculateCost(): number {
    let total = 0
    const tSpacingSq = this.problem.preferredTraceToTraceSpacing ** 2
    const oSpacingSq = this.problem.preferredObstacleToTraceSpacing ** 2
    const b = this.problem.bounds
    const margin = 0.5

    for (let i = 0; i < this.traces.length; i++) {
      const t1 = this.traces[i]
      const segs1 = t1.points.slice(0, -1).map((p, idx) => [p, t1.points[idx + 1]])

      // Boundary penalty
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

      for (let j = i + 1; j < this.traces.length; j++) {
        const t2 = this.traces[j]
        if (t1.networkId && t2.networkId && t1.networkId === t2.networkId) continue
        const segs2 = t2.points.slice(0, -1).map((p, idx) => [p, t2.points[idx + 1]])

        for (const [s1a, s1b] of segs1) {
          for (const [s2a, s2b] of segs2) {
            const d2 = segSegDistSq(s1a, s1b, s2a, s2b)
            if (d2 === 0) {
              total += 1000000 // Massive penalty for intersections
            } else if (d2 < tSpacingSq) {
              total += (tSpacingSq - d2) * 1000
            }
          }
        }
      }

      for (const obstacle of this.problem.obstacles) {
        const obsSegs = [
          [{ x: obstacle.minX, y: obstacle.minY }, { x: obstacle.maxX, y: obstacle.minY }],
          [{ x: obstacle.maxX, y: obstacle.minY }, { x: obstacle.maxX, y: obstacle.maxY }],
          [{ x: obstacle.maxX, y: obstacle.maxY }, { x: obstacle.minX, y: obstacle.maxY }],
          [{ x: obstacle.minX, y: obstacle.maxY }, { x: obstacle.minX, y: obstacle.minY }],
        ]
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

  override _step() {
    if (this.iteration >= this.maxIterations) {
      this.solved = true
      return
    }

    const stepSize = 0.2 * (1 - this.iteration / this.maxIterations)
    for (let i = 0; i < this.traces.length; i++) {
      const wp = this.problem.waypointPairs[i]
      const t = this.traces[i]
      const oldD = t.d
      const cost0 = this.calculateCost()

      t.d = oldD + stepSize
      t.points = getDouble45Path({ start: wp.start, end: wp.end, dOffset: t.d })
      const costPlus = this.calculateCost()

      t.d = oldD - stepSize
      t.points = getDouble45Path({ start: wp.start, end: wp.end, dOffset: t.d })
      const costMinus = this.calculateCost()

      if (costPlus < cost0 && costPlus < costMinus) {
        t.d = oldD + stepSize
      } else if (costMinus < cost0) {
        t.d = oldD - stepSize
      } else {
        t.d = oldD
      }
      t.points = getDouble45Path({ start: wp.start, end: wp.end, dOffset: t.d })
    }

    this.iteration++
    this.outputTraces = this.traces.map((t, i) => ({
      waypointPair: this.problem.waypointPairs[i],
      points: t.points,
      networkId: t.networkId,
    }))
  }

  override solve() {
    while (!this.solved) {
      this._step()
    }
    return this.outputTraces
  }

  override visualize(): GraphicsObject {
    return visualizeTraceProblem(this.problem, this.outputTraces)
  }
}