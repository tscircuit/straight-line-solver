import { expect, test } from "bun:test"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { FortyFiveDegreeTraceSolver } from "lib/45DegreeTraceSolver"
import problem from "./repro01-input.json"
import type { TraceProblem } from "lib/45DegreeTraceSolver/types.ts"

test("repro01", () => {
  const solver = new FortyFiveDegreeTraceSolver(problem as TraceProblem)
  solver.solve()

  const svg = getSvgFromGraphicsObject(solver.visualize())
  expect(svg).toMatchSvgSnapshot(import.meta.path)
})
