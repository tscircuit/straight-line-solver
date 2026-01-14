import type { Point } from "@tscircuit/math-utils"

export interface TraceState {
  d: number
  points: Point[]
  networkId?: string
  uBend?: number
}
