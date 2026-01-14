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
- **Interactive Visualization**: Comes with a `react-cosmos` environment to visualize the solver's steps in real-time.

## How It Works

1.  **Initialization**: Each trace is initialized with a default `d` value (e.g., half the minimum distance between the start and end points).
2.  **Cost Function**: A cost function calculates a "penalty" for the entire board based on:
    -   Intersections (massive penalty)
    -   Spacing violations (high penalty)
    -   Boundary violations (high penalty)
3.  **Gradient Descent**: In each step, the solver "nudges" the `d` value for each trace and keeps the change if it results in a lower total cost.
4.  **Convergence**: Over many iterations, the traces settle into a low-cost, valid configuration.

## Usage

### Installation

```bash
bun install
```

### Running the Visualizer

To see the solver in action, run the interactive Cosmos environment:

```bash
bun start
```

This will open a web browser where you can see the fixtures and step through the solver's iterations.

### Running Tests

```bash
bun test
```

### Building the Project

```bash
bun run build
```

This will compile the TypeScript code to JavaScript in the `dist/` directory.