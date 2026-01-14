import { GenericSolverDebugger } from "@tscircuit/solver-utils/react"
import type { TraceProblem } from "../../lib/index.ts"
import { StraightLineSolver } from "../../lib/index.ts"
import problem from "../../tests/repros/repro01-input.json"
export default () => {
  return (
    <GenericSolverDebugger
      createSolver={() =>
        new StraightLineSolver(problem as TraceProblem)
      }
    />
  )
}
