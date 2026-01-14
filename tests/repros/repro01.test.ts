import { expect, test } from "bun:test"
import { getSvgFromGraphicsObject } from "graphics-debug"
import { StraightLineSolver } from "lib/StraightLine"
import problem from "./repro01-input.json"
import type { TraceProblem } from "lib/types.ts"

test("repro01", () => {
  const solver = new StraightLineSolver(problem as TraceProblem)
  solver.solve()

  const svg = getSvgFromGraphicsObject(solver.visualize())
  expect(svg).toMatchSvgSnapshot(import.meta.path)
})
