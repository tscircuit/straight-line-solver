import assert from "node:assert/strict"
import { test } from "bun:test"
import { calculateCost } from "../lib/StraightLine/calculateCost"
import { applyNestedTraceFix } from "../lib/StraightLine/applyNestedTraceFix"
import { getDouble45Path } from "../lib/StraightLine/getDouble45Path"
import { initializeTraces } from "../lib/StraightLine/initializeTraces"
import type { TraceProblem } from "../lib/types"

type Point = { x: number; y: number }
type PathCase = {
  name: string
  start: Point
  end: Point
  dOffset: number
  uBend?: number
}

function assertPath(points: Point[], start: Point, end: Point) {
  assert.deepEqual(points[0], start)
  assert.deepEqual(points.at(-1), end)
  for (const point of points) {
    assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y))
  }
  for (let i = 1; i < points.length; i++) {
    const dx = Math.abs(points[i].x - points[i - 1].x)
    const dy = Math.abs(points[i].y - points[i - 1].y)
    assert.ok(
      dx === 0 || dy === 0 || Math.abs(dx - dy) < 1e-10,
      `segment ${i} is not horizontal, vertical, or 45 degrees: ${dx}, ${dy}`,
    )
  }
}

const oversizedCases: PathCase[] = [
  { name: "horizontal positive", start: { x: 0, y: 0 }, end: { x: 10, y: 0 }, dOffset: 6, uBend: 1 },
  { name: "horizontal negative bend", start: { x: 0, y: 0 }, end: { x: 10, y: 0 }, dOffset: 6, uBend: -1 },
  { name: "horizontal negative offset", start: { x: 0, y: 0 }, end: { x: 10, y: 0 }, dOffset: -6, uBend: 1 },
  { name: "horizontal reversed", start: { x: 10, y: 0 }, end: { x: 0, y: 0 }, dOffset: 6, uBend: 1 },
  { name: "vertical positive", start: { x: 0, y: 0 }, end: { x: 0, y: 10 }, dOffset: 6, uBend: 1 },
  { name: "vertical negative bend", start: { x: 0, y: 0 }, end: { x: 0, y: 10 }, dOffset: 6, uBend: -1 },
  { name: "vertical reversed", start: { x: 0, y: 10 }, end: { x: 0, y: 0 }, dOffset: 6, uBend: 1 },
  { name: "horizontal skewed", start: { x: 0, y: 0 }, end: { x: 10, y: 2 }, dOffset: 6, uBend: 1 },
  { name: "vertical skewed", start: { x: 0, y: 0 }, end: { x: 2, y: 10 }, dOffset: 6, uBend: 1 },
  { name: "translated", start: { x: 3, y: 4 }, end: { x: 13, y: 4 }, dOffset: 6, uBend: 1 },
]

for (const fixture of oversizedCases) {
  test(`oversized U bend retains 45-degree segments: ${fixture.name}`, () => {
    const points = getDouble45Path(fixture)
    assertPath(points, fixture.start, fixture.end)
    const horizontal = Math.abs(fixture.end.x - fixture.start.x) > Math.abs(fixture.end.y - fixture.start.y)
    const midpoint = horizontal
      ? (fixture.start.y + fixture.end.y) / 2
      : (fixture.start.x + fixture.end.x) / 2
    const bend = horizontal ? points[1].y - midpoint : points[1].x - midpoint
    assert.equal(Math.sign(bend), Math.sign(fixture.dOffset * (fixture.uBend ?? 1)))
  })
}

const normalCases: (PathCase & { expected: Point[] })[] = [
  { name: "below limit", start: { x: 0, y: 0 }, end: { x: 10, y: 0 }, dOffset: 4, uBend: 1,
    expected: [{ x: 0, y: 0 }, { x: 4, y: 4 }, { x: 6, y: 4 }, { x: 10, y: 0 }] },
  { name: "at limit", start: { x: 0, y: 0 }, end: { x: 10, y: 0 }, dOffset: 5, uBend: 1,
    expected: [{ x: 0, y: 0 }, { x: 5, y: 5 }, { x: 5, y: 5 }, { x: 10, y: 0 }] },
  { name: "negative offset below limit", start: { x: 0, y: 0 }, end: { x: 10, y: 0 }, dOffset: -4, uBend: 1,
    expected: [{ x: 0, y: 0 }, { x: 4, y: -4 }, { x: 6, y: -4 }, { x: 10, y: 0 }] },
  { name: "zero offset", start: { x: 0, y: 0 }, end: { x: 10, y: 0 }, dOffset: 0, uBend: 1,
    expected: [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 0 }] },
  { name: "vertical below limit", start: { x: 0, y: 0 }, end: { x: 0, y: 10 }, dOffset: 4, uBend: -1,
    expected: [{ x: 0, y: 0 }, { x: -4, y: 4 }, { x: -4, y: 6 }, { x: 0, y: 10 }] },
  { name: "ordinary horizontal-ish", start: { x: 0, y: 0 }, end: { x: 10, y: 4 }, dOffset: 2,
    expected: [{ x: 0, y: 0 }, { x: 2, y: 2 }, { x: 8, y: 2 }, { x: 10, y: 4 }] },
  { name: "ordinary vertical-ish", start: { x: 0, y: 0 }, end: { x: 4, y: 10 }, dOffset: 2,
    expected: [{ x: 0, y: 0 }, { x: 2, y: 2 }, { x: 2, y: 8 }, { x: 4, y: 10 }] },
  { name: "coincident endpoints", start: { x: 2, y: 3 }, end: { x: 2, y: 3 }, dOffset: 0, uBend: 1,
    expected: [{ x: 2, y: 3 }, { x: 2, y: 3 }, { x: 2, y: 3 }, { x: 2, y: 3 }] },
]

for (const fixture of normalCases) {
  test(`preserves existing path: ${fixture.name}`, () => {
    const points = getDouble45Path(fixture)
    assert.deepEqual(points, fixture.expected)
    assertPath(points, fixture.start, fixture.end)
  })
}

const initializationCases: { name: string; start: Point; end: Point; spacing: number }[] = [
  { name: "horizontal over", start: { x: 0, y: 0 }, end: { x: 10, y: 0 }, spacing: 3 },
  { name: "vertical over", start: { x: 0, y: 0 }, end: { x: 0, y: 10 }, spacing: 3 },
  { name: "reversed over", start: { x: 10, y: 0 }, end: { x: 0, y: 0 }, spacing: 3 },
  { name: "skewed over", start: { x: 0, y: 0 }, end: { x: 10, y: 2 }, spacing: 3 },
  { name: "horizontal below", start: { x: 0, y: 0 }, end: { x: 10, y: 0 }, spacing: 2 },
  { name: "horizontal exact", start: { x: 0, y: 0 }, end: { x: 10, y: 0 }, spacing: 2.5 },
  { name: "vertical below", start: { x: 0, y: 0 }, end: { x: 0, y: 10 }, spacing: 2 },
  { name: "ordinary double45", start: { x: 0, y: 0 }, end: { x: 10, y: 5 }, spacing: 3 },
]

function makeProblem(start: Point, end: Point, spacing: number): TraceProblem {
  return {
    bounds: { minX: -20, minY: -20, maxX: 20, maxY: 20 },
    waypointPairs: [{ start, end, networkId: "net" }],
    obstacles: [],
    preferredTraceToTraceSpacing: 1,
    preferredObstacleToTraceSpacing: spacing,
  }
}

for (const fixture of initializationCases) {
  test(`initialization uses valid 45-degree paths: ${fixture.name}`, () => {
    const problem = makeProblem(fixture.start, fixture.end, fixture.spacing)
    const traces = initializeTraces({ problem })
    assert.equal(traces.length, 1)
    assert.equal(traces[0].networkId, "net")
    assertPath(traces[0].points, fixture.start, fixture.end)
  })
}

for (const vertical of [false, true]) {
  test(`nested trace adjustment retains 45-degree paths: ${vertical ? "vertical" : "horizontal"}`, () => {
    const outerStart = { x: 0, y: 0 }
    const outerEnd = vertical ? { x: 0, y: 10 } : { x: 10, y: 0 }
    const innerStart = vertical ? { x: 0, y: 2 } : { x: 2, y: 0 }
    const innerEnd = vertical ? { x: 0, y: 8 } : { x: 8, y: 0 }
    const problem = makeProblem(outerStart, outerEnd, 1)
    problem.preferredTraceToTraceSpacing = 4
    problem.waypointPairs.push({ start: innerStart, end: innerEnd, networkId: "inner" })
    const initial = initializeTraces({ problem })
    const traces = applyNestedTraceFix({ traces: initial, problem })
    assert.equal(traces.length, 2)
    for (let i = 0; i < traces.length; i++) {
      assertPath(traces[i].points, problem.waypointPairs[i].start, problem.waypointPairs[i].end)
    }
  })
}

for (const vertical of [false, true]) {
  test(`clamped initialization does not charge a zero-length segment: ${vertical ? "vertical" : "horizontal"}`, () => {
    const start = { x: 0, y: 0 }
    const end = vertical ? { x: 0, y: 10 } : { x: 10, y: 0 }
    const problem = makeProblem(start, end, 3)
    problem.bounds = { minX: -10, minY: -10, maxX: 20, maxY: 20 }
    problem.obstacles = vertical
      ? [
          { minX: 4.9, maxX: 5.1, minY: 4.9, maxY: 5.1, center: { x: 5, y: 5 } },
          { minX: -5.1, maxX: -4.9, minY: 4.9, maxY: 5.1, center: { x: -5, y: 5 } },
        ]
      : [
          { minX: 4.9, maxX: 5.1, minY: 4.9, maxY: 5.1, center: { x: 5, y: 5 } },
          { minX: 4.9, maxX: 5.1, minY: -5.1, maxY: -4.9, center: { x: 5, y: -5 } },
        ]
    const traces = initializeTraces({ problem })
    const bend = vertical ? { x: -5, y: 5 } : { x: 5, y: -5 }
    assert.deepEqual(traces[0].points, [start, bend, end])
    assert.equal(calculateCost({ traces, problem }), 7196)
  })
}

for (const vertical of [false, true]) {
  test(`clamped skewed path uses the computed 45-degree bend: ${vertical ? "vertical" : "horizontal"}`, () => {
    const start = { x: 0, y: 0 }
    const end = vertical ? { x: 2, y: 10 } : { x: 10, y: 2 }
    const points = getDouble45Path({ start, end, dOffset: 6, uBend: 1 })
    assert.deepEqual(points, [start, { x: 6, y: 6 }, end])
    assertPath(points, start, end)
  })
}

test("clamped path cost equals its three-point geometry", () => {
  const start = { x: 0, y: 0 }
  const end = { x: 10, y: 0 }
  const problem = makeProblem(start, end, 3)
  problem.obstacles = [
    { minX: 4.9, maxX: 5.1, minY: 4.4, maxY: 4.6, center: { x: 5, y: 4.5 } },
    { minX: 4.9, maxX: 5.1, minY: -4.6, maxY: -4.4, center: { x: 5, y: -4.5 } },
  ]
  const traces = initializeTraces({ problem })
  const reference = [{ d: 6, uBend: -1, networkId: "net", points: [start, { x: 5, y: -5 }, end] }]
  assert.deepEqual(traces[0].points, reference[0].points)
  assert.equal(
    calculateCost({ traces, problem }),
    calculateCost({ traces: reference, problem }),
  )
})

test("nested clamping removes only the new saturated middle segment", () => {
  for (const vertical of [false, true]) {
    const start = { x: 0, y: 0 }
    const end = vertical ? { x: 0, y: 10 } : { x: 10, y: 0 }
    const innerStart = vertical ? { x: 0, y: 2 } : { x: 2, y: 0 }
    const innerEnd = vertical ? { x: 0, y: 8 } : { x: 8, y: 0 }
    const problem = makeProblem(start, end, 1)
    problem.preferredTraceToTraceSpacing = 4
    problem.waypointPairs.push({ start: innerStart, end: innerEnd, networkId: "inner" })
    const initial = initializeTraces({ problem })
    const innerBefore = structuredClone(initial[1].points)
    const traces = applyNestedTraceFix({ traces: initial, problem })
    const bend = vertical ? { x: -5, y: 5 } : { x: 5, y: -5 }
    assert.deepEqual(traces[0].points, [start, bend, end])
    assert.deepEqual(traces[1].points, innerBefore)
    assert.equal(traces[1].points.length, 4)
  }
})
