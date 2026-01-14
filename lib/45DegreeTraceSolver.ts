import { BaseSolver } from "@tscircuit/solver-utils"
import type { TraceProblem, OutputTrace } from "./45DegreeTraceSolver/types.ts"
import type { Point, Bounds } from "@tscircuit/math-utils"
import type { GraphicsObject } from "graphics-debug"
import { getObstacleOuterSegments } from "./45DegreeTraceSolver/getObstacleOuterSegments.ts"
import { visualizeTraceProblem } from "./45DegreeTraceSolver/visualization.ts"

interface TraceWithElbow {
  start: Point
  end: Point
  elbow: Point
  t1: number
  t2: number
  containedBy: number[]
  networkId?: string
}

function getPerimeterT({ p, bounds }: { p: Point; bounds: Bounds }): number {
  const { minX, maxX, minY, maxY } = bounds
  const W = maxX - minX
  const H = maxY - minY
  const eps = 1e-6

  if (Math.abs(p.y - maxY) < eps) return p.x - minX
  if (Math.abs(p.x - maxX) < eps) return W + (maxY - p.y)
  if (Math.abs(p.y - minY) < eps) return W + H + (maxX - p.x)
  if (Math.abs(p.x - minX) < eps) return 2 * W + H + (p.y - minY)
  return 0
}

function getInwardDir({ p, bounds }: { p: Point; bounds: Bounds }): Point {
  const { minX, maxX, minY, maxY } = bounds
  const eps = 1e-6

  if (Math.abs(p.y - maxY) < eps) return { x: 0, y: -1 }
  if (Math.abs(p.y - minY) < eps) return { x: 0, y: 1 }
  if (Math.abs(p.x - maxX) < eps) return { x: -1, y: 0 }
  if (Math.abs(p.x - minX) < eps) return { x: 1, y: 0 }
  return { x: 0, y: 0 }
}

function ptSegDistSq({
  px,
  py,
  sx,
  sy,
  ex,
  ey,
}: {
  px: number
  py: number
  sx: number
  sy: number
  ex: number
  ey: number
}): number {
  const dx = ex - sx
  const dy = ey - sy
  const l2 = dx * dx + dy * dy
  if (l2 === 0) return (px - sx) ** 2 + (py - sy) ** 2
  const t = Math.max(0, Math.min(1, ((px - sx) * dx + (py - sy) * dy) / l2))
  return (px - (sx + t * dx)) ** 2 + (py - (sy + t * dy)) ** 2
}

function segSegDistSq({
  a1,
  a2,
  b1,
  b2,
}: {
  a1: Point
  a2: Point
  b1: Point
  b2: Point
}): number {
  if (intersects({ a: a1, b: a2, c: b1, d: b2 })) return 0
  return Math.min(
    ptSegDistSq({ px: a1.x, py: a1.y, sx: b1.x, sy: b1.y, ex: b2.x, ey: b2.y }),
    ptSegDistSq({ px: a2.x, py: a2.y, sx: b1.x, sy: b1.y, ex: b2.x, ey: b2.y }),
    ptSegDistSq({ px: b1.x, py: b1.y, sx: a1.x, sy: a1.y, ex: a2.x, ey: a2.y }),
    ptSegDistSq({ px: b2.x, py: b2.y, sx: a1.x, sy: a1.y, ex: a2.x, ey: a2.y }),
  )
}

function intersects({
  a,
  b,
  c,
  d,
}: {
  a: Point
  b: Point
  c: Point
  d: Point
}): boolean {
  const det = (b.x - a.x) * (d.y - c.y) - (b.y - a.y) * (d.x - c.x)
  if (det === 0) return false
  const lambda = ((d.y - c.y) * (d.x - a.x) + (c.x - d.x) * (d.y - a.y)) / det
  const gamma = ((a.y - b.y) * (d.x - a.x) + (b.x - a.x) * (d.y - a.y)) / det
  return 0 < lambda && lambda < 1 && 0 < gamma && gamma < 1
}

function chordContains({
  a1,
  a2,
  b1,
  b2,
  perimeter,
}: {
  a1: number
  a2: number
  b1: number
  b2: number
  perimeter: number
}): boolean {
  const norm = (t: number) => ((t % perimeter) + perimeter) % perimeter
  const a1n = norm(a1)
  const a2n = norm(a2)
  const b1n = norm(b1)
  const b2n = norm(b2)
  const [aMin, aMax] = a1n < a2n ? [a1n, a2n] : [a2n, a1n]
  return b1n > aMin && b1n < aMax && b2n > aMin && b2n < aMax
}

export class FortyFiveDegreeTraceSolver extends BaseSolver {
  outputTraces: OutputTrace[] = []
  private traces: TraceWithElbow[] = []
  private iteration = 0
  private obstacleSegments: [Point, Point][] = []
  private obstacleNetworkIds: (string | undefined)[] = []
  private minAngle = 90
  private collisionWeight = 500
  private aversionWeight = 200
  private useDecay = true

  constructor(private problem: TraceProblem) {
    super()
    for (const obstacle of this.problem.obstacles) {
      obstacle.outerSegments = getObstacleOuterSegments(obstacle)
      if (obstacle.outerSegments) {
        for (const seg of obstacle.outerSegments) {
          this.obstacleSegments.push(seg)
          this.obstacleNetworkIds.push(obstacle.networkId)
        }
      }
    }
    this.reset()
  }

  override getConstructorParams() {
    return this.problem
  }

  private reset() {
    this.iteration = 0
    const b = this.problem.bounds
    const W = b.maxX - b.minX
    const H = b.maxY - b.minY
    const perimeter = 2 * W + 2 * H

    this.traces = this.problem.waypointPairs.map((wp) => {
      const t1 = getPerimeterT({ p: wp.start, bounds: b })
      const t2 = getPerimeterT({ p: wp.end, bounds: b })
      return {
        start: { ...wp.start },
        end: { ...wp.end },
        t1,
        t2,
        elbow: {
          x: (wp.start.x + wp.end.x) / 2,
          y: (wp.start.y + wp.end.y) / 2,
        },
        containedBy: [],
        networkId: wp.networkId,
      }
    })

    this.traces.forEach((t, i) => {
      t.containedBy = this.traces
        .filter(
          (o, j) =>
            i !== j &&
            chordContains({
              a1: o.t1,
              a2: o.t2,
              b1: t.t1,
              b2: t.t2,
              perimeter,
            }),
        )
        .map(() =>
          this.traces.findIndex(
            (o, k) =>
              k !== i &&
              chordContains({
                a1: o.t1,
                a2: o.t2,
                b1: t.t1,
                b2: t.t2,
                perimeter,
              }),
          ),
        )
    })
  }

  private getEffectiveSpacing(): number {
    const baseSpacing = this.problem.preferredTraceToTraceSpacing
    if (!this.useDecay) return baseSpacing
    const progress = Math.min(1, this.iteration / 1000)
    const startMultiplier = 3.0
    const endMultiplier = 1.0
    const currentMultiplier =
      startMultiplier + (endMultiplier - startMultiplier) * progress
    return baseSpacing * currentMultiplier
  }

  private getElbowAngle({ t }: { t: TraceWithElbow }): number {
    const v1 = { x: t.start.x - t.elbow.x, y: t.start.y - t.elbow.y }
    const v2 = { x: t.end.x - t.elbow.x, y: t.end.y - t.elbow.y }
    const dot = v1.x * v2.x + v1.y * v2.y
    const mag =
      Math.sqrt(v1.x * v1.x + v1.y * v1.y) *
      Math.sqrt(v2.x * v2.x + v2.y * v2.y)
    return mag === 0
      ? 180
      : (Math.acos(Math.max(-1, Math.min(1, dot / mag))) * 180) / Math.PI
  }

  private calculateCost(): number {
    let total = 0
    const effSpacing = this.getEffectiveSpacing()
    const eps = 1e-9
    const b = this.problem.bounds

    for (const t of this.traces) {
      const angle = this.getElbowAngle({ t })
      if (angle < this.minAngle) total += (this.minAngle - angle) * 10

      const dir1 = getInwardDir({ p: t.start, bounds: b })
      const dir2 = getInwardDir({ p: t.end, bounds: b })
      const d1 =
        (t.elbow.x - t.start.x) * dir1.x + (t.elbow.y - t.start.y) * dir1.y
      const d2 = (t.elbow.x - t.end.x) * dir2.x + (t.elbow.y - t.end.y) * dir2.y
      const myDepth = Math.min(d1, d2)

      const distToLeft = t.elbow.x - b.minX
      const distToRight = b.maxX - t.elbow.x
      const distToBottom = t.elbow.y - b.minY
      const distToTop = b.maxY - t.elbow.y
      const minDist = Math.min(distToLeft, distToRight, distToBottom, distToTop)

      total += (0.01 / (minDist + 0.005)) * this.aversionWeight

      for (const outId of t.containedBy) {
        const out = this.traces[outId]
        const odir1 = getInwardDir({ p: out.start, bounds: b })
        const odir2 = getInwardDir({ p: out.end, bounds: b })
        const od1 =
          (out.elbow.x - out.start.x) * odir1.x +
          (out.elbow.y - out.start.y) * odir1.y
        const od2 =
          (out.elbow.x - out.end.x) * odir2.x +
          (out.elbow.y - out.end.y) * odir2.y
        const outDepth = Math.min(od1, od2)
        if (myDepth < outDepth + effSpacing)
          total += (outDepth + effSpacing - myDepth) ** 2 * 5000
      }
    }

    for (let i = 0; i < this.traces.length; i++) {
      const t = this.traces[i]
      if (
        t.elbow.x < b.minX + 0.005 ||
        t.elbow.x > b.maxX - 0.005 ||
        t.elbow.y < b.minY + 0.005 ||
        t.elbow.y > b.maxY - 0.005
      ) {
        total += 10000000
      }

      const segsT = [
        [t.start, t.elbow],
        [t.elbow, t.end],
      ] as [Point, Point][]

      for (let j = i + 1; j < this.traces.length; j++) {
        const o = this.traces[j]

        if (t.networkId && o.networkId && t.networkId === o.networkId) continue

        const segsO = [
          [o.start, o.elbow],
          [o.elbow, o.end],
        ] as [Point, Point][]

        for (const s1 of segsT) {
          for (const s2 of segsO) {
            const d2 = segSegDistSq({
              a1: s1[0],
              a2: s1[1],
              b1: s2[0],
              b2: s2[1],
            })
            if (d2 < eps) total += 5000000
            else if (d2 < effSpacing ** 2) {
              total +=
                (effSpacing - Math.sqrt(d2)) ** 2 * this.collisionWeight * 2
            }
          }
        }
      }

      const obstacleSpacing = this.problem.preferredObstacleToTraceSpacing
      for (let k = 0; k < this.obstacleSegments.length; k++) {
        const [p1, p2] = this.obstacleSegments[k]

        if (
          t.networkId &&
          this.obstacleNetworkIds[k] &&
          t.networkId === this.obstacleNetworkIds[k]
        )
          continue

        for (const s of segsT) {
          const d2 = segSegDistSq({ a1: s[0], a2: s[1], b1: p1, b2: p2 })
          if (d2 < eps) total += 5000000
          else if (d2 < obstacleSpacing ** 2) {
            total +=
              (obstacleSpacing - Math.sqrt(d2)) ** 2 * this.collisionWeight * 2
          }
        }
      }
    }
    return total
  }

  private optimizeStep() {
    const progress = Math.min(1, this.iteration / 1000)
    const stepSize = Math.max(0.001, 0.1 * (1 - progress))
    const b = this.problem.bounds
    const margin = 0.001

    const indices = this.traces.map((_, i) => i)

    indices.forEach((idx) => {
      const t = this.traces[idx]
      let bestX = t.elbow.x
      let bestY = t.elbow.y
      let minCost = this.calculateCost()

      const dirs = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 },
        { x: 0.7, y: 0.7 },
        { x: -0.7, y: 0.7 },
        { x: 0.7, y: -0.7 },
        { x: -0.7, y: -0.7 },
      ]

      for (const dir of dirs) {
        const ox = t.elbow.x
        const oy = t.elbow.y

        t.elbow.x = Math.max(
          b.minX + margin,
          Math.min(b.maxX - margin, ox + dir.x * stepSize),
        )
        t.elbow.y = Math.max(
          b.minY + margin,
          Math.min(b.maxY - margin, oy + dir.y * stepSize),
        )

        const cost = this.calculateCost()
        if (cost < minCost) {
          minCost = cost
          bestX = t.elbow.x
          bestY = t.elbow.y
        }

        t.elbow.x = ox
        t.elbow.y = oy
      }

      t.elbow.x = bestX
      t.elbow.y = bestY
    })

    this.iteration++
  }

  private buildOutputTraces() {
    this.outputTraces = this.traces.map((t) => ({
      waypointPair: {
        start: t.start,
        end: t.end,
        networkId: t.networkId,
      },
      points: [t.start, t.elbow, t.end],
      networkId: t.networkId,
    }))
  }

  override _step() {
    if (this.iteration === 0 && this.traces.length === 0) {
      this.reset()
    }

    if (this.iteration < 1000) {
      this.optimizeStep()
    }

    if (this.iteration >= 1000) {
      this.buildOutputTraces()
      this.solved = true
    }
  }

  override visualize(): GraphicsObject {
    if (this.outputTraces.length === 0) {
      this.buildOutputTraces()
    }
    return visualizeTraceProblem(this.problem, this.outputTraces)
  }
}
