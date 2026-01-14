import { test, expect } from "bun:test"
import { generateRandomProblem } from "../../utils/generateRandomProblem"
import { StraightLineSolver } from "../../lib"
import type { TraceProblem } from "../../lib/types"
import { getSvgFromGraphicsObject } from "graphics-debug"

test("seed3", () => {
  const problem = generateRandomProblem({
    randomSeed: 3,
    numWaypointPairs: 5,
    numObstacles: 3,
    minSpacing: 5,
  })
  const solver = new StraightLineSolver(problem as TraceProblem)
  solver.solve()
  const svg = getSvgFromGraphicsObject(solver.visualize())
  expect(svg).toMatchSvgSnapshot(import.meta.path)
})
