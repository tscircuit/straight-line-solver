import { BaseSolver } from "@tscircuit/solver-utils"
import type { TraceProblem, OutputTrace } from "./types"
import type { GraphicsObject } from "graphics-debug"
import { visualizeTraceProblem } from "./visualizeTraceProblem"
import { getDouble45Path } from "./StraightLine/getDouble45Path"
import { optimizeStep } from "./StraightLine/optimizeStep"
import type { TraceState } from "./StraightLine/types"
import { calculateCost } from "./StraightLine/calculateCost"

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
      const d = Math.min(Math.abs(wp.end.x - wp.start.x), Math.abs(wp.end.y - wp.start.y)) / 2
      return {
        d,
        networkId: wp.networkId,
        points: getDouble45Path({ start: wp.start, end: wp.end, dOffset: d }),
      }
    })
  }

  override _step() {
    if (this.iteration >= this.maxIterations || this.stepsWithoutImprovement >= 10) {
      this.solved = true
      return
    }

    this.traces = optimizeStep({
      traces: this.traces,
      problem: this.problem,
      iteration: this.iteration,
    })

    const currentCost = calculateCost({ traces: this.traces, problem: this.problem })

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