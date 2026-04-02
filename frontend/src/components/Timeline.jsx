import React, { useMemo } from 'react'

function formatMs(ms) {
  if (ms == null) return '0:00'
  const totalSec = Math.floor(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return `${min}:${sec.toString().padStart(2, '0')}`
}

export default function Timeline({ matchData, timelinePct, isPlaying, onTimelineChange, onPlayPause, filteredEventCount }) {
  const { minTs, maxTs, duration } = useMemo(() => {
    if (!matchData?.events || matchData.events.length === 0)
      return { minTs: 0, maxTs: 0, duration: 0 }
    const timestamps = matchData.events.map(e => e.ts)
    const minTs = Math.min(...timestamps)
    const maxTs = Math.max(...timestamps)
    return { minTs, maxTs, duration: maxTs - minTs }
  }, [matchData])

  const currentMs = minTs + duration * (timelinePct / 100)

  const histogram = useMemo(() => {
    if (!matchData?.events || duration === 0) return []
    const BINS = 60
    const bins = new Array(BINS).fill(0)
    for (const ev of matchData.events) {
      if (ev.event === 'Position' || ev.event === 'BotPosition') continue
      const bin = Math.min(BINS - 1, Math.floor(((ev.ts - minTs) / duration) * BINS))
      bins[bin]++
    }
    const max = Math.max(...bins, 1)
    return bins.map(v => v / max)
  }, [matchData, duration, minTs])

  if (!matchData) {
    return (
      <div className="h-16 bg-[#0f0f1e] border-t border-[#2a2a4a] flex items-center justify-center">
        <span className="text-xs font-mono text-[#334455] tracking-widest">
          SELECT A MATCH TO ENABLE TIMELINE PLAYBACK
        </span>
      </div>
    )
  }

  return (
    <div className="h-20 bg-[#0f0f1e] border-t border-[#2a2a4a] flex flex-col px-4 py-2 gap-1.5">
      <div className="flex items-end gap-px h-5">
        {histogram.map((v, i) => (
          <div key={i}
            style={{ height: `${Math.max(4, v * 100)}%`, flex: 1 }}
            className={`rounded-sm transition-colors ${
              (i / histogram.length) * 100 <= timelinePct ? 'bg-[#e94560]' : 'bg-[#2a2a4a]'
            }`}
          />
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button onClick={onPlayPause}
          className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded bg-[#e94560]/20 border border-[#e94560]/50 text-[#e94560] hover:bg-[#e94560]/30 transition-colors text-sm">
          {isPlaying ? '⏸' : '▶'}
        </button>
        <span className="font-mono text-xs text-[#556677] w-10 text-right flex-shrink-0">
          {formatMs(minTs)}
        </span>
        <div className="flex-1">
          <input type="range" min="0" max="100" step="0.1" value={timelinePct}
            onChange={e => onTimelineChange(parseFloat(e.target.value))}
            className="w-full"
            style={{ background: `linear-gradient(to right, #e94560 ${timelinePct}%, #2a2a4a ${timelinePct}%)` }}
          />
        </div>
        <span className="font-mono text-xs text-[#e94560] w-10 flex-shrink-0">
          {formatMs(currentMs)}
        </span>
        <span className="font-mono text-xs text-[#556677] w-10 flex-shrink-0">
          {formatMs(maxTs)}
        </span>
        <span className="font-mono text-xs text-[#445566] flex-shrink-0">
          {filteredEventCount.toLocaleString()} events
        </span>
      </div>
    </div>
  )
}