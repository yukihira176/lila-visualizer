export const MAP_CONFIG = {
  AmbroseValley: { scale: 900,  originX: -370, originZ: -473 },
  GrandRift:     { scale: 581,  originX: -290, originZ: -290 },
  Lockdown:      { scale: 1000, originX: -500, originZ: -500 },
}

export function worldToUV(x, z, mapId) {
  const cfg = MAP_CONFIG[mapId]
  if (!cfg) return { u: 0, v: 0 }
  const u = (x - cfg.originX) / cfg.scale
  const v = (z - cfg.originZ) / cfg.scale
  return { u, v }
}

export function uvToCanvas(u, v, cw, ch) {
  return {
    px: u * cw,
    py: (1 - v) * ch,
  }
}

export function eventToCanvas(event, cw, ch) {
  return uvToCanvas(event.u, event.v, cw, ch)
}