import React, { useRef, useEffect, useState, useCallback } from 'react'
import { drawHeatmap } from '../utils/heatmap'
import { drawMarker, EVENT_STYLES } from '../utils/colors'

const MINIMAP_PATHS = {
  AmbroseValley: '/minimaps/AmbroseValley_Minimap.png',
  GrandRift:     '/minimaps/GrandRift_Minimap.png',
  Lockdown:      '/minimaps/Lockdown_Minimap.jpg',
}

export default function MapViewer({ mapId, events, heatmapData, showHumans, showBots, eventFilters }) {
  const containerRef = useRef(null)
  const baseCanvasRef = useRef(null)
  const heatCanvasRef = useRef(null)
  const evtCanvasRef  = useRef(null)
  const imageCache    = useRef({})
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 })
  const dragging  = useRef(false)
  const dragStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 })
  const [tooltip, setTooltip] = useState(null)

  function getImage(mapId) {
    return new Promise((resolve, reject) => {
      if (imageCache.current[mapId]) { resolve(imageCache.current[mapId]); return }
      const img = new Image()
      img.onload  = () => { imageCache.current[mapId] = img; resolve(img) }
      img.onerror = reject
      img.src = MINIMAP_PATHS[mapId] || ''
    })
  }

  async function drawBase() {
    const canvas = baseCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const { width, height } = canvas
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = '#0b0b1a'
    ctx.fillRect(0, 0, width, height)
    ctx.save()
    ctx.translate(transform.x, transform.y)
    ctx.scale(transform.scale, transform.scale)
    const size = Math.min(width, height) * 0.95
    const imgX = (width  / transform.scale - size) / 2
    const imgY = (height / transform.scale - size) / 2
    try {
      const img = await getImage(mapId)
      ctx.drawImage(img, imgX, imgY, size, size)
      canvas._mapRect = { x: imgX, y: imgY, size }
    } catch {
      ctx.fillStyle = '#1a2a3a'
      ctx.fillRect(imgX, imgY, size, size)
      ctx.fillStyle = '#445566'
      ctx.font = '14px Inter'
      ctx.textAlign = 'center'
      ctx.fillText(`${mapId} — place minimap image in /public/minimaps/`, imgX + size / 2, imgY + size / 2)
      canvas._mapRect = { x: imgX, y: imgY, size }
    }
    ctx.strokeStyle = '#e94560'
    ctx.lineWidth = 1.5 / transform.scale
    ctx.strokeRect(imgX, imgY, size, size)
    ctx.restore()
  }

  function drawHeat() {
    const canvas = heatCanvasRef.current
    const base   = baseCanvasRef.current
    if (!canvas || !base?._mapRect) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (!heatmapData?.grid) return
    const { x: mx, y: my, size: ms } = base._mapRect
    ctx.save()
    ctx.translate(transform.x + mx * transform.scale, transform.y + my * transform.scale)
    ctx.scale(transform.scale, transform.scale)
    const offscreen = document.createElement('canvas')
    offscreen.width  = ms
    offscreen.height = ms
    drawHeatmap(offscreen.getContext('2d'), heatmapData.grid, heatmapData.size, 0.6)
    ctx.globalAlpha = 0.72
    ctx.drawImage(offscreen, 0, 0, ms, ms)
    ctx.globalAlpha = 1
    ctx.restore()
  }

  function drawEvents() {
    const canvas = evtCanvasRef.current
    const base   = baseCanvasRef.current
    if (!canvas || !base?._mapRect) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (!events || events.length === 0) return
    const { x: mx, y: my, size: ms } = base._mapRect
    ctx.save()
    ctx.translate(transform.x + mx * transform.scale, transform.y + my * transform.scale)
    ctx.scale(transform.scale, transform.scale)

    if (eventFilters['Position'] && showHumans) {
      drawPaths(ctx, events.filter(e => e.event === 'Position'), ms, 'rgba(68,136,255,0.35)')
    }
    if (eventFilters['BotPosition'] && showBots) {
      drawPaths(ctx, events.filter(e => e.event === 'BotPosition'), ms, 'rgba(80,100,120,0.25)')
    }

    const markers = events.filter(e => e.event !== 'Position' && e.event !== 'BotPosition')
    markers.sort((a, b) => (EVENT_STYLES[a.event]?.zIndex || 0) - (EVENT_STYLES[b.event]?.zIndex || 0))
    const markerScale = Math.max(0.5, Math.min(2, 1 / transform.scale))
    for (const ev of markers) {
      const style = EVENT_STYLES[ev.event]
      if (!style) continue
      drawMarker(ctx, ev.u * ms, (1 - ev.v) * ms, style, markerScale)
    }
    ctx.restore()
  }

  function drawPaths(ctx, events, size, color) {
    const byUser = {}
    for (const ev of events) {
      if (!byUser[ev.user_id]) byUser[ev.user_id] = []
      byUser[ev.user_id].push(ev)
    }
    ctx.strokeStyle = color
    ctx.lineWidth = 1
    for (const userEvents of Object.values(byUser)) {
      if (userEvents.length < 2) continue
      userEvents.sort((a, b) => a.ts - b.ts)
      ctx.beginPath()
      userEvents.forEach((ev, i) => {
        const px = ev.u * size
        const py = (1 - ev.v) * size
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      })
      ctx.stroke()
    }
  }

  const resize = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const { width, height } = container.getBoundingClientRect()
    ;[baseCanvasRef, heatCanvasRef, evtCanvasRef].forEach(ref => {
      if (ref.current) { ref.current.width = width; ref.current.height = height }
    })
    drawBase().then(() => { drawHeat(); drawEvents() })
  }, [])

  useEffect(() => {
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  useEffect(() => { drawBase().then(() => { drawHeat(); drawEvents() }) }, [mapId, transform])
  useEffect(() => { drawHeat(); drawEvents() }, [heatmapData, events, eventFilters, showHumans, showBots])

  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12
    setTransform(t => ({ ...t, scale: Math.max(0.5, Math.min(10, t.scale * factor)) }))
  }, [])

  const handleMouseDown = useCallback((e) => {
    dragging.current = true
    dragStart.current = { x: e.clientX, y: e.clientY, tx: transform.x, ty: transform.y }
  }, [transform])

  const handleMouseMove = useCallback((e) => {
    if (dragging.current) {
      setTransform(t => ({
        ...t,
        x: dragStart.current.tx + e.clientX - dragStart.current.x,
        y: dragStart.current.ty + e.clientY - dragStart.current.y,
      }))
    }
    const canvas = evtCanvasRef.current
    const base   = baseCanvasRef.current
    if (!canvas || !base?._mapRect) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const { x: ox, y: oy, size: ms } = base._mapRect
    const u = (mx - transform.x - ox * transform.scale) / (ms * transform.scale)
    const v = 1 - (my - transform.y - oy * transform.scale) / (ms * transform.scale)
    if (u >= 0 && u <= 1 && v >= 0 && v <= 1) {
      setTooltip({ x: e.clientX, y: e.clientY, u: u.toFixed(3), v: v.toFixed(3) })
    } else {
      setTooltip(null)
    }
  }, [transform])

  const handleMouseUp = useCallback(() => { dragging.current = false }, [])

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#0b0b1a] overflow-hidden">
      <canvas ref={baseCanvasRef} className="absolute inset-0" />
      <canvas ref={heatCanvasRef} className="absolute inset-0 pointer-events-none" />
      <canvas
        ref={evtCanvasRef}
        className="absolute inset-0"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={() => setTransform({ x: 0, y: 0, scale: 1 })}
      />
      <div className="absolute top-3 left-3 pointer-events-none">
        <span className="font-mono text-xs tracking-widest text-[#e94560] bg-black/50 px-2 py-1 rounded border border-[#e94560]/30">
          {mapId.toUpperCase()}
        </span>
      </div>
      <div className="absolute bottom-3 right-3 flex flex-col gap-1">
        <button onClick={() => setTransform(t => ({ ...t, scale: Math.min(10, t.scale * 1.3) }))}
          className="w-7 h-7 bg-[#1a1a2e] border border-[#2a2a4a] rounded text-sm hover:border-[#e94560]">+</button>
        <button onClick={() => setTransform(t => ({ ...t, scale: Math.max(0.5, t.scale / 1.3) }))}
          className="w-7 h-7 bg-[#1a1a2e] border border-[#2a2a4a] rounded text-sm hover:border-[#e94560]">−</button>
        <button onClick={() => setTransform({ x: 0, y: 0, scale: 1 })}
          className="w-7 h-7 bg-[#1a1a2e] border border-[#2a2a4a] rounded text-xs hover:border-[#e94560]">⊞</button>
      </div>
      <div className="absolute bottom-3 left-3 font-mono text-xs text-[#446688] pointer-events-none">
        {Math.round(transform.scale * 100)}% · scroll to zoom · drag to pan · dbl-click to reset
      </div>
      {tooltip && (
        <div className="absolute pointer-events-none font-mono text-xs bg-black/80 px-2 py-1 rounded border border-[#2a2a4a] text-[#aaaacc]"
          style={{ left: tooltip.x + 12, top: tooltip.y - 30 }}>
          u:{tooltip.u} v:{tooltip.v}
        </div>
      )}
    </div>
  )
}