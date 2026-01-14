import { BaseSolver } from "@tscircuit/solver-utils"
import type { GraphicsObject } from "graphics-debug"
import { calculateCost } from "./StraightLine/calculateCost"
import { getDouble45Path } from "./StraightLine/getDouble45Path"
import { isSameSide } from "./StraightLine/isSameSide"
import { optimizeStep } from "./StraightLine/optimizeStep"
import type { TraceState } from "./StraightLine/types"
import type { OutputTrace, TraceProblem } from "./types"
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
          traces: [{ points: points1, d: 0 }],
          problem: this.problem,
        })
        const points2 = getDouble45Path({
          start: wp.start,
          end: wp.end,
          dOffset: d,
          uBend: -1,
        })
        const cost2 = calculateCost({
          traces: [{ points: points2, d: 0 }],
          problem: this.problem,
        })

        return {
          d,
          networkId: wp.networkId,
          points: cost1 < cost2 ? points1 : points2,
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
  }

  override _step() {
    if (
      this.iteration >= this.maxIterations ||
      this.stepsWithoutImprovement >= 10
    ) {
      this.solved = true
      if (this.stepsWithoutImprovement >= 10) {
        console.log("Solved: No improvement for 10 iterations")
      }
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
