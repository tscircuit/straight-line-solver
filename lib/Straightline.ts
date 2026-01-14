import { BaseSolver } from "@tscircuit/solver-utils"
import type { TraceProblem, OutputTrace } from "./45DegreeTraceSolver/types"
import type { Point } from "@tscircuit/math-utils"
import type { GraphicsObject } from "graphics-debug"
import { visualizeTraceProblem } from "./45DegreeTraceSolver/visualization"

export const getDouble45Path = ({
  start,
  end,
}: {
  start: Point
  end: Point
}): Point[] => {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const d = Math.min(Math.abs(dx), Math.abs(dy)) / 2
  const sx = Math.sign(dx)
  const sy = Math.sign(dy)

  return [
    start,
    { x: start.x + d * sx, y: start.y + d * sy },
    { x: end.x - d * sx, y: end.y - d * sy },
    end,
  ]
}

export class StraightLineSolver extends BaseSolver {
  outputTraces: OutputTrace[] = []
  private queue: any[] = []

  constructor(private problem: TraceProblem) {
    super()
    this.queue = [...this.problem.waypointPairs]
  }

  override _step() {
    if (this.queue.length === 0) {
      this.solved = true
      return
    }

    const wp = this.queue.shift()
    this.outputTraces.push({
      waypointPair: wp,
      points: getDouble45Path({ start: wp.start, end: wp.end }),
      networkId: wp.networkId,
    })
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