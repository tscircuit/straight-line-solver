import type { GraphicsObject } from "graphics-debug"
import type { TraceProblem, OutputTrace } from "./types"

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
    title: "Straight Line Solver",
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

  for (const wp of problem.waypointPairs) {
    graphics.points.push({
      ...wp.start,
      label: `start ${wp.networkId ?? ""}`,
      color: getColorForNetworkId(wp.networkId),
    })
    graphics.points.push({
      ...wp.end,
      label: `end ${wp.networkId ?? ""}`,
      color: getColorForNetworkId(wp.networkId),
    })
  }

  for (const obstacle of problem.obstacles) {
    graphics.rects.push({
      center: obstacle.center,
      width: obstacle.maxX - obstacle.minX,
      height: obstacle.maxY - obstacle.minY,
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
