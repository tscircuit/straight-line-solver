import type { TraceProblem } from "../types"
import { calculateCost } from "./calculateCost"
import { getDouble45Path } from "./getDouble45Path"
import { isSameSide } from "./isSameSide"
import type { TraceState } from "./types"

export const initializeTraces = ({
  problem,
}: {
  problem: TraceProblem
}): TraceState[] => {
  return problem.waypointPairs.map((wp) => {
    const sameSide = isSameSide({ start: wp.start, end: wp.end })

    if (sameSide) {
      const d = problem.preferredObstacleToTraceSpacing * 2
      const points1 = getDouble45Path({
        start: wp.start,
        end: wp.end,
        dOffset: d,
        uBend: 1,
      })
      const cost1 = calculateCost({
        traces: [{ points: points1, d: 0, uBend: 1 }],
        problem,
      })
      const points2 = getDouble45Path({
        start: wp.start,
        end: wp.end,
        dOffset: d,
        uBend: -1,
      })
      const cost2 = calculateCost({
        traces: [{ points: points2, d: 0, uBend: -1 }],
        problem,
      })
      const uBend = cost1 < cost2 ? 1 : -1

      return {
        d,
        networkId: wp.networkId,
        points: cost1 < cost2 ? points1 : points2,
        uBend,
      }
    }

    const d =
      Math.min(
        Math.abs(wp.end.x - wp.start.x),
        Math.abs(wp.end.y - wp.start.y),
      ) / 2
    return {
      d,
      networkId: wp.networkId,
      points: getDouble45Path({ start: wp.start, end: wp.end, dOffset: d }),
    }
  })
}
