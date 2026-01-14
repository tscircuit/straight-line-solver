import type { Point, Bounds } from "@tscircuit/math-utils"

export interface WaypointPair {
  start: Point
  end: Point
  networkId?: string
}

export interface Obstacle extends Bounds {
  center: Point
  networkId?: string
  outerSegments?: [Point, Point][]
}

export interface TraceProblem {
  bounds: Bounds
  waypointPairs: WaypointPair[]
  obstacles: Obstacle[]
  preferredTraceToTraceSpacing: number
  preferredObstacleToTraceSpacing: number
}

export interface OutputTrace {
  waypointPair: WaypointPair
  points: Point[]
  networkId?: string
}
