import React, { useState } from 'react'
import { EVENT_STYLES, HEATMAP_LAYERS, FILTER_GROUPS } from '../utils/colors'

const Section = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-[#2a2a4a] last:border-0">
      <button
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-mono tracking-widest text-[#7788aa] hover:text-[#e94560] transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <span>{title}</span>
        <span className="text-[10px]">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  )
}

export default function FilterPanel({
  maps, dates, matches,
  selectedMap, selectedDate, selectedMatch,
  eventFilters, showHumans, showBots, heatmapLayer,
  status,
  onMapChange, onDateChange, onMatchSelect,
  onToggleEvent, onShowHumansChange, onShowBotsChange, onHeatmapLayerChange,
}) {
  const [matchSearch, setMatchSearch] = useState('')

  const filteredMatches = matches.filter(m =>
    matchSearch === '' || m.match_id.toLowerCase().includes(matchSearch.toLowerCase())
  )

  return (
    <aside className="w-64 flex-shrink-0 bg-[#16213e] border-r border-[#2a2a4a] flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-[#2a2a4a] bg-[#1a1a2e]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#e94560] pulse" />
          <span className="font-mono text-xs tracking-widest text-[#e94560] font-semibold">LILA BLACK</span>
        </div>
        <div className="text-[10px] text-[#556677] mt-0.5 font-mono">PLAYER JOURNEY VISUALIZER</div>
      </div>

      {status && (
        <div className={`mx-3 mt-2 px-2 py-1 rounded text-xs border font-mono ${
          status.status === 'ok'
            ? 'bg-green-900/40 text-green-400 border-green-800'
            : 'bg-yellow-900/40 text-yellow-400 border-yellow-800'
        }`}>
          {status.status === 'ok' ? `● ${status.matches} matches loaded` : '⚠ No data — run preprocess.py'}
        </div>
      )}

      <div className="flex-1 overflow-y-auto mt-2">
        <Section title="MAP">
          <div className="flex flex-col gap-1">
            {['AmbroseValley', 'GrandRift', 'Lockdown'].map(m => (
              <button key={m} onClick={() => onMapChange(m)}
                className={`text-left px-2 py-1.5 rounded text-xs font-mono transition-all ${
                  selectedMap === m
                    ? 'bg-[#e94560]/20 text-[#e94560] border border-[#e94560]/50'
                    : 'text-[#9aabbb] hover:text-white hover:bg-[#2a2a4a] border border-transparent'
                }`}>
                {m === 'AmbroseValley' ? 'Ambrose Valley' : m === 'GrandRift' ? 'Grand Rift' : 'Lockdown'}
              </button>
            ))}
          </div>
        </Section>

        <Section title="DATE">
          <select value={selectedDate} onChange={e => onDateChange(e.target.value)}
            className="w-full bg-[#0b0b1a] border border-[#2a2a4a] rounded px-2 py-1.5 text-xs font-mono text-[#eaeaea] focus:border-[#e94560] outline-none">
            <option value="">All dates</option>
            {dates.map(d => (
              <option key={d} value={d}>
                {new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </option>
            ))}
          </select>
        </Section>

        <Section title={`MATCHES (${matches.length})`}>
          <input type="text" placeholder="Search match ID…" value={matchSearch}
            onChange={e => setMatchSearch(e.target.value)}
            className="w-full bg-[#0b0b1a] border border-[#2a2a4a] rounded px-2 py-1 text-xs font-mono text-[#eaeaea] focus:border-[#e94560] outline-none mb-2" />
          <div className="space-y-0.5 max-h-40 overflow-y-auto">
            <button onClick={() => onMatchSelect('')}
              className={`w-full text-left px-2 py-1 rounded text-xs font-mono transition-all ${
                selectedMatch === ''
                  ? 'bg-[#e94560]/20 text-[#e94560] border border-[#e94560]/40'
                  : 'text-[#7788aa] hover:text-white hover:bg-[#2a2a4a] border border-transparent'
              }`}>
              — All matches (heatmap only)
            </button>
            {filteredMatches.slice(0, 80).map(m => (
              <button key={m.match_id} onClick={() => onMatchSelect(m.match_id)}
                className={`w-full text-left px-2 py-1 rounded text-xs font-mono transition-all ${
                  selectedMatch === m.match_id
                    ? 'bg-[#e94560]/20 text-[#e94560] border border-[#e94560]/40'
                    : 'text-[#7788aa] hover:text-white hover:bg-[#2a2a4a] border border-transparent'
                }`}>
                <div className="truncate">{m.match_id.slice(0, 18)}…</div>
                <div className="text-[10px] text-[#445566]">👤{m.human_count} 🤖{m.bot_count}</div>
              </button>
            ))}
          </div>
        </Section>

        <Section title="ENTITIES">
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={showHumans} onChange={e => onShowHumansChange(e.target.checked)} className="accent-[#4488ff]" />
              <span className="text-xs text-[#9aabbb]">
                <span className="inline-block w-2 h-2 rounded-full bg-[#4488ff] mr-1" />Human players
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={showBots} onChange={e => onShowBotsChange(e.target.checked)} className="accent-[#888888]" />
              <span className="text-xs text-[#9aabbb]">
                <span className="inline-block w-2 h-2 rounded-full bg-[#888888] mr-1" />Bots (AI)
              </span>
            </label>
          </div>
        </Section>

        <Section title="EVENTS">
          {FILTER_GROUPS.map(group => (
            <div key={group.label} className="mb-3">
              <div className="text-[10px] text-[#445566] font-mono tracking-wider mb-1.5 uppercase">{group.label}</div>
              <div className="space-y-1.5">
                {group.events.map(ev => {
                  const style = EVENT_STYLES[ev]
                  return (
                    <label key={ev} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={eventFilters[ev] ?? false}
                        onChange={() => onToggleEvent(ev)} style={{ accentColor: style?.color }} />
                      <span className="text-xs text-[#9aabbb] flex items-center gap-1.5">
                        <span className="inline-block w-2 h-2 flex-shrink-0"
                          style={{ backgroundColor: style?.color, borderRadius: '50%' }} />
                        {style?.label || ev}
                      </span>
                    </label>
                  )
                })}
              </div>
            </div>
          ))}
        </Section>

        <Section title="HEATMAP OVERLAY">
          <div className="grid grid-cols-2 gap-1">
            {HEATMAP_LAYERS.map(layer => (
              <button key={layer.id} onClick={() => onHeatmapLayerChange(layer.id)}
                className={`px-2 py-1.5 rounded text-xs font-mono transition-all ${
                  heatmapLayer === layer.id
                    ? 'text-white border'
                    : 'text-[#7788aa] hover:text-white bg-[#0b0b1a] border border-[#2a2a4a]'
                }`}
                style={heatmapLayer === layer.id ? {
                  borderColor: layer.color || '#e94560',
                  backgroundColor: `${layer.color || '#e94560'}22`,
                  color: layer.color || '#e94560'
                } : {}}>
                {layer.label}
              </button>
            ))}
          </div>
        </Section>
      </div>

      <div className="px-3 py-2 border-t border-[#2a2a4a] text-[10px] font-mono text-[#334455]">
        Feb 10–14 · 339 players · 796 matches
      </div>
    </aside>
  )
}