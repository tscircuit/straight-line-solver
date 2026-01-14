# @tscircuit/45-degree-path-joining-solver

# Straight Line Solver

An iterative PCB trace router that uses a 1-parameter (d) 45-degree path solver to avoid obstacles and other traces.

## Overview

This project provides a TypeScript-based solver for routing traces on a printed circuit board (PCB). It uses a "Double-45" pathfinding strategy, where each trace is composed of two 45-degree segments and a straight middle segment.

The core of the solver is a gradient descent optimizer that adjusts a single parameter (`d`) for each trace. This parameter controls the depth of the 45-degree "elbows", allowing the paths to dynamically move to avoid collisions.

## Features

- **Collision Avoidance**: Respects trace-to-trace and trace-to-obstacle spacing.
- **Intersection Removal**: Penalizes and removes path intersections.
- **Boundary Respect**: Keeps traces from hugging the edges of the board.
- **1-Parameter Optimization**: Uses an efficient gradient descent model based on a single `d` parameter per trace.
- **Interactive Visualization**: Comes with a `react-cosmos` environment for easy debugging.

## Usage

To use this solver in your project, first install it via `bun` or `npm`:

```bash
bun add @tscircuit/straight-line-solver
```

Then, import the `StraightLineSolver` and the necessary types:

```typescript
import { StraightLineSolver } from "@tscircuit/straight-line-solver"
import type { TraceProblem, OutputTrace } from "@tscircuit/straight-line-solver"
```

### Input: The `TraceProblem` Object

The solver takes a single `TraceProblem` object in its constructor. Here is its structure:

```typescript
interface Point { x: number; y: number }

interface Bounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

interface WaypointPair {
  start: Point
  end: Point
  networkId?: string
}

interface Obstacle extends Bounds {
  center: Point
  networkId?: string
}

interface TraceProblem {
  bounds: Bounds
  waypointPairs: WaypointPair[]
  obstacles: Obstacle[]
  preferredTraceToTraceSpacing: number
  preferredObstacleToTraceSpacing: number
}
```

### Example

```typescript
const problem: TraceProblem = {
  bounds: { minX: 0, minY: 0, maxX: 50, maxY: 50 },
  waypointPairs: [
    { start: { x: 0, y: 10 }, end: { x: 50, y: 40 } },
    { start: { x: 0, y: 20 }, end: { x: 50, y: 30 } },
  ],
  obstacles: [
    { minX: 20, minY: 20, maxX: 30, maxY: 30, center: { x: 25, y: 25 } },
  ],
  preferredTraceToTraceSpacing: 2,
  preferredObstacleToTraceSpacing: 3,
}

// Create a new solver instance
const solver = new StraightLineSolver(problem)

// Run the solver to completion
const outputTraces: OutputTrace[] = solver.solve()

console.log(outputTraces)
// Each OutputTrace contains the original waypointPair and the calculated points for the path.
```

## Development

The following commands are available for local development and testing.

### Installation

```bash
bun install
```

### Running the Visualizer

To see the solver in action, run the interactive Cosmos environment:

```bash
bun start
```

### Running Tests

```bash
bun test
```