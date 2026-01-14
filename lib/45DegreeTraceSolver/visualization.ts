import type { GraphicsObject } from "graphics-debug"
import type { TraceProblem, OutputTrace } from "./types.ts"

const hashString = (str: string) => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) * 779 + ((hash << 5) - hash)
  }
  return hash
}

const getColorForNetworkId = (networkId?: string | null) => {
  if (!networkId) return "rgba(0, 0, 0, 0.5)"
  return `hsl(${hashString(networkId) % 360}, 100%, 50%)`
}

export const visualizeTraceProblem = (
  problem: TraceProblem,
  outputTraces: OutputTrace[] = [],
): GraphicsObject => {
  const graphics = {
    arrows: [],
    circles: [],
    lines: [],
    rects: [],
    coordinateSystem: "cartesian",
    points: [],
    texts: [],
    title: "45° Trace Problem",
  } as Required<GraphicsObject>

  graphics.lines.push({
    points: [
      { x: problem.bounds.minX, y: problem.bounds.minY },
      { x: problem.bounds.maxX, y: problem.bounds.minY },
      { x: problem.bounds.maxX, y: problem.bounds.maxY },
      { x: problem.bounds.minX, y: problem.bounds.maxY },
      { x: problem.bounds.minX, y: problem.bounds.minY },
    ],
    strokeColor: "rgba(0, 0, 0, 0.1)",
  })

  for (const waypointPair of problem.waypointPairs) {
    graphics.points.push({
      ...waypointPair.start,
      label: `start ${waypointPair.networkId ?? ""}`,
      color: getColorForNetworkId(waypointPair.networkId),
    })
    graphics.points.push({
      ...waypointPair.end,
      label: `end ${waypointPair.networkId ?? ""}`,
      color: getColorForNetworkId(waypointPair.networkId),
    })
  }

  for (const obstacle of problem.obstacles) {
    graphics.rects.push({
      center: obstacle.center,
      width: obstacle.maxX - obstacle.minX,
      height: obstacle.maxY - obstacle.minY,
      fill: "rgba(128, 128, 128, 0.3)",
      stroke: "rgba(128, 128, 128, 0.8)",
      label: `netId: ${obstacle.networkId}`,
    })
  }

  for (const trace of outputTraces) {
    graphics.lines.push({
      points: trace.points,
      strokeColor: getColorForNetworkId(trace.networkId),
    })
  }

  return graphics
}
