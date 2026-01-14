import { BaseSolver } from "@tscircuit/solver-utils"
import type { GraphicsObject } from "graphics-debug"
import { calculateCost } from "./StraightLine/calculateCost"
import { getDouble45Path } from "./StraightLine/getDouble45Path"
import { isSameSide } from "./StraightLine/isSameSide"
import { optimizeStep } from "./StraightLine/optimizeStep"
import type { TraceState } from "./StraightLine/types"
import type { OutputTrace, TraceProblem, WaypointPair } from "./types"
import { visualizeTraceProblem } from "./visualizeTraceProblem"

export class StraightLineSolver extends BaseSolver {
  outputTraces: OutputTrace[] = []
  private traces: TraceState[] = []
  private iteration = 0
  private maxIterations = 200
  private lastCost: number | null = null
  private stepsWithoutImprovement = 0

  constructor(private problem: TraceProblem) {
    super()
    this.traces = this.problem.waypointPairs.map((wp) => {
      const sameSide = isSameSide({ start: wp.start, end: wp.end })

      if (sameSide) {
        const d = this.problem.preferredObstacleToTraceSpacing * 2
        const points1 = getDouble45Path({
          start: wp.start,
          end: wp.end,
          dOffset: d,
          uBend: 1,
        })
        const cost1 = calculateCost({
          traces: [{ points: points1, d: 0, uBend: 1 }],
          problem: this.problem,
        })
        const points2 = getDouble45Path({
          start: wp.start,
          end: wp.end,
          dOffset: d,
          uBend: -1,
        })
        const cost2 = calculateCost({
          traces: [{ points: points2, d: 0, uBend: -1 }],
          problem: this.problem,
        })
        const uBend = cost1 < cost2 ? 1 : -1

        return {
          d,
          networkId: wp.networkId,
          points: cost1 < cost2 ? points1 : points2,
          uBend,
        }
      }

      const d =
        Math.min(
          Math.abs(wp.end.x - wp.start.x),
          Math.abs(wp.end.y - wp.start.y),
        ) / 2
      return {
        d,
        networkId: wp.networkId,
        points: getDouble45Path({ start: wp.start, end: wp.end, dOffset: d }),
      }
    })

    // Post-processing step to handle nested traces
    for (let i = 0; i < this.traces.length; i++) {
      for (let j = i + 1; j < this.traces.length; j++) {
        const t1 = this.traces[i]
        const t2 = this.traces[j]
        const wp1 = this.problem.waypointPairs[i]
        const wp2 = this.problem.waypointPairs[j]

        // Check if both are same-side traces bending in the same direction
        if (t1.uBend === undefined || t1.uBend !== t2.uBend) {
          continue
        }

        const is_t1_horizontal =
          Math.abs(wp1.end.x - wp1.start.x) >
          Math.abs(wp1.end.y - wp1.start.y)
        const is_t2_horizontal =
          Math.abs(wp2.end.x - wp2.start.x) >
          Math.abs(wp2.end.y - wp2.start.y)

        // Check if they have the same orientation
        if (is_t1_horizontal !== is_t2_horizontal) {
          continue
        }

        let container: TraceState | null = null
        let contained: TraceState | null = null
        let container_wp: WaypointPair | null = null

        if (is_t1_horizontal) {
          const t1_xmin = Math.min(wp1.start.x, wp1.end.x)
          const t1_xmax = Math.max(wp1.start.x, wp1.end.x)
          const t2_xmin = Math.min(wp2.start.x, wp2.end.x)
          const t2_xmax = Math.max(wp2.start.x, wp2.end.x)

          if (t1_xmin < t2_xmin && t1_xmax > t2_xmax) {
            container = t1
            contained = t2
            container_wp = wp1
          } else if (t2_xmin < t1_xmin && t2_xmax > t1_xmax) {
            container = t2
            contained = t1
            container_wp = wp2
          }
        } else {
          // Vertical
          const t1_ymin = Math.min(wp1.start.y, wp1.end.y)
          const t1_ymax = Math.max(wp1.start.y, wp1.end.y)
          const t2_ymin = Math.min(wp2.start.y, wp2.end.y)
          const t2_ymax = Math.max(wp2.start.y, wp2.end.y)

          if (t1_ymin < t2_ymin && t1_ymax > t2_ymax) {
            container = t1
            contained = t2
            container_wp = wp1
          } else if (t2_ymin < t1_ymin && t2_ymax > t1_ymax) {
            container = t2
            contained = t1
            container_wp = wp2
          }
        }

        if (container && contained && container_wp) {
          container.d =
            contained.d + this.problem.preferredTraceToTraceSpacing
          container.points = getDouble45Path({
            start: container_wp.start,
            end: container_wp.end,
            dOffset: container.d,
            uBend: container.uBend,
          })
        }
      }
    }
  }

  override _step() {
    if (
      this.iteration >= this.maxIterations ||
      this.stepsWithoutImprovement >= 10
    ) {
      this.solved = true
      return
    }

    this.traces = optimizeStep({
      traces: this.traces,
      problem: this.problem,
      iteration: this.iteration,
    })

    const currentCost = calculateCost({
      traces: this.traces,
      problem: this.problem,
    })

    if (this.lastCost !== null) {
      const improvement = (this.lastCost - currentCost) / this.lastCost
      if (improvement < 0.001) {
        this.stepsWithoutImprovement++
      } else {
        this.stepsWithoutImprovement = 0
      }
    }
    this.lastCost = currentCost

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
