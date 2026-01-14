import type { TraceProblem } from "../types"
import type { TraceState } from "./types"
import { getDouble45Path } from "./getDouble45Path"
import { calculateCost } from "./calculateCost"

export const optimizeStep = ({
  traces,
  problem,
  iteration,
}: {
  traces: TraceState[]
  problem: TraceProblem
  iteration: number
}): TraceState[] => {
  const stepSize = 0.5 * 0.98 ** iteration
  const nextTraces = [...traces]

  for (let i = 0; i < nextTraces.length; i++) {
    const wp = problem.waypointPairs[i]
    const t = nextTraces[i]
    const oldD = t.d
    
    const cost0 = calculateCost({ traces: nextTraces, problem })

    t.d = oldD + stepSize
    t.points = getDouble45Path({ start: wp.start, end: wp.end, dOffset: t.d })
    const costPlus = calculateCost({ traces: nextTraces, problem })

    t.d = oldD - stepSize
    t.points = getDouble45Path({ start: wp.start, end: wp.end, dOffset: t.d })
    const costMinus = calculateCost({ traces: nextTraces, problem })

    if (costPlus < cost0 && costPlus < costMinus) {
      t.d = oldD + stepSize
    } else if (costMinus < cost0) {
      t.d = oldD - stepSize
    } else {
      t.d = oldD
    }
    t.points = getDouble45Path({ start: wp.start, end: wp.end, dOffset: t.d })
  }

  return nextTraces
}
