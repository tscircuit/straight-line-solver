import { BaseSolver } from "@tscircuit/solver-utils";
import type { TraceProblem, OutputTrace } from "./45DegreeTraceSolver/types";
import type { Point } from "@tscircuit/math-utils";
import type { GraphicsObject } from "graphics-debug";
import { visualizeTraceProblem } from "./45DegreeTraceSolver/visualization";

export class StraightLineSolver extends BaseSolver {
  outputTraces: OutputTrace[] = []
  private d = 0.5

  constructor(private problem: TraceProblem) {
    super()
    this.reset()
  }

  private reset() {
    this.outputTraces = this.problem.waypointPairs.map((wp) => ({
      waypointPair: wp,
      points: this.getPathPoints({ start: wp.start, end: wp.end }),
      networkId: wp.networkId,
    }))
  }

  private getPathPoints({ start, end }: { start: Point; end: Point }): Point[] {
    const b = this.problem.bounds
    const isVerticalWall =
      Math.abs(start.x - b.minX) < 0.1 || Math.abs(start.x - b.maxX) < 0.1
    
    const dx = end.x - start.x
    const dy = end.y - start.y
    const sx = Math.sign(dx)
    const sy = Math.sign(dy)
    
    // Ensure d doesn't exceed the available distance
    const d = Math.min(this.d, Math.abs(dx), Math.abs(dy))

    if (isVerticalWall) {
      return [
        start,
        { x: end.x - d * sx, y: start.y },
        { x: end.x, y: start.y + d * sy },
        end,
      ]
    }
    
    // If starting on a horizontal wall, we move vertically first
    return [
      start,
      { x: start.x, y: end.y - d * sy },
      { x: start.x + d * sx, y: end.y },
      end,
    ]
  }

  override _step() {
    this.solved = true;
  }

  override solve() {
    this._step();
    return this.outputTraces;
  }

  override visualize(): GraphicsObject {
    return visualizeTraceProblem(this.problem, this.outputTraces);
  }
}