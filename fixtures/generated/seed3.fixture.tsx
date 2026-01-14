import { useMemo } from "react"
import { GenericSolverDebugger } from "@tscircuit/solver-utils/react"
import { generateRandomProblem } from "../../utils/index.ts"
import { StraightLineSolver } from "../../lib/index.ts"
import type { TraceProblem } from "../../lib/index.ts"

export default () => {
  const problem = useMemo(() => {
    return generateRandomProblem({
      randomSeed: 3,
      numWaypointPairs: 5,
      numObstacles: 3,
      minSpacing: 5,
    })
  }, [])

  return (
    <GenericSolverDebugger
      key={3}
      createSolver={() => new StraightLineSolver(problem as TraceProblem)}
    />
  )
}
