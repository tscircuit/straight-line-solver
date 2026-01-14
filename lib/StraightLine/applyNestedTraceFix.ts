import type { TraceProblem, WaypointPair } from "../types"
import { getDouble45Path } from "./getDouble45Path"
import type { TraceState } from "./types"

export const applyNestedTraceFix = ({
  traces,
  problem,
}: {
  traces: TraceState[]
  problem: TraceProblem
}): TraceState[] => {
  const newTraces = [...traces]
  for (let i = 0; i < newTraces.length; i++) {
    for (let j = i + 1; j < newTraces.length; j++) {
      const t1 = newTraces[i]
      const t2 = newTraces[j]
      const wp1 = problem.waypointPairs[i]
      const wp2 = problem.waypointPairs[j]

      if (t1.uBend === undefined || t1.uBend !== t2.uBend) {
        continue
      }

      const is_t1_horizontal =
        Math.abs(wp1.end.x - wp1.start.x) > Math.abs(wp1.end.y - wp1.start.y)
      const is_t2_horizontal =
        Math.abs(wp2.end.x - wp2.start.x) > Math.abs(wp2.end.y - wp2.start.y)

      if (is_t1_horizontal !== is_t2_horizontal) {
        continue
      }

      let container: TraceState | null = null
      let contained: TraceState | null = null
      let container_wp: WaypointPair | null = null

      if (is_t1_horizontal) {
        const t1_xmin = Math.min(wp1.start.x, wp1.end.x)
        const t1_xmax = Math.max(wp1.start.x, wp1.end.x)
        const t2_xmin = Math.min(wp2.start.x, wp2.end.x)
        const t2_xmax = Math.max(wp2.start.x, wp2.end.x)

        if (t1_xmin < t2_xmin && t1_xmax > t2_xmax) {
          container = t1
          contained = t2
          container_wp = wp1
        } else if (t2_xmin < t1_xmin && t2_xmax > t1_xmax) {
          container = t2
          contained = t1
          container_wp = wp2
        }
      } else {
        const t1_ymin = Math.min(wp1.start.y, wp1.end.y)
        const t1_ymax = Math.max(wp1.start.y, wp1.end.y)
        const t2_ymin = Math.min(wp2.start.y, wp2.end.y)
        const t2_ymax = Math.max(wp2.start.y, wp2.end.y)

        if (t1_ymin < t2_ymin && t1_ymax > t2_ymax) {
          container = t1
          contained = t2
          container_wp = wp1
        } else if (t2_ymin < t1_ymin && t2_ymax > t1_ymax) {
          container = t2
          contained = t1
          container_wp = wp2
        }
      }

      if (container && contained && container_wp) {
        container.d = contained.d + problem.preferredTraceToTraceSpacing
        container.points = getDouble45Path({
          start: container_wp.start,
          end: container_wp.end,
          dOffset: container.d,
          uBend: container.uBend,
        })
      }
    }
  }
  return newTraces
}
