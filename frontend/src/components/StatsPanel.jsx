import React, { useMemo } from 'react'

const StatRow = ({ label, value, color }) => (
  <div className="flex items-center justify-between py-1">
    <span className="text-xs text-[#7788aa]">{label}</span>
    <span className="font-mono text-xs font-semibold" style={{ color: color || '#eaeaea' }}>
      {value}
    </span>
  </div>
)

export default function StatsPanel({ matchData, matches, filteredEvents, selectedMap }) {
  const matchStats = useMemo(() => {
    if (!matchData) return null
    const counts = {}
    for (const ev of matchData.events || []) {
      counts[ev.event] = (counts[ev.event] || 0) + 1
    }
    const humans = new Set(matchData.events?.filter(e => e.is_human).map(e => e.user_id) || [])
    const bots   = new Set(matchData.events?.filter(e => !e.is_human).map(e => e.user_id) || [])
    return { counts, humans: humans.size, bots: bots.size }
  }, [matchData])

  const mapStats = useMemo(() => {
    if (!matches.length) return null
    const total   = matches.length
    const humans  = matches.reduce((s, m) => s + m.human_count, 0)
    const bots    = matches.reduce((s, m) => s + m.bot_count, 0)
    return { total, humans, bots }
  }, [matches])

  return (
    <aside className="w-52 flex-shrink-0 bg-[#16213e] border-l border-[#2a2a4a] flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-[#2a2a4a] bg-[#1a1a2e]">
        <div className="font-mono text-xs tracking-widest text-[#7788aa]">STATS</div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">

        {/* Map overview */}
        {mapStats && (
          <div>
            <div className="text-[10px] font-mono tracking-widest text-[#445566] uppercase mb-2">
              {selectedMap}
            </div>
            <div className="bg-[#0f0f1e] rounded p-2 space-y-0.5">
              <StatRow label="Matches"      value={mapStats.total} />
              <StatRow label="Human slots"  value={mapStats.humans} color="#4488ff" />
              <StatRow label="Bot slots"    value={mapStats.bots}   color="#888888" />
            </div>
          </div>
        )}

        {/* Match details */}
        {matchData && matchStats && (
          <div>
            <div className="text-[10px] font-mono tracking-widest text-[#445566] uppercase mb-2">
              SELECTED MATCH
            </div>
            <div className="bg-[#0f0f1e] rounded p-2 space-y-0.5">
              <StatRow label="Humans"       value={matchStats.humans} color="#4488ff" />
              <StatRow label="Bots"         value={matchStats.bots}   color="#888888" />
              <StatRow label="Kills (H→H)"  value={matchStats.counts['Kill']          || 0} color="#ff4444" />
              <StatRow label="Deaths (H)"   value={matchStats.counts['Killed']        || 0} color="#ffffff" />
              <StatRow label="Bot Kills"    value={matchStats.counts['BotKill']       || 0} color="#ff9900" />
              <StatRow label="Storm Deaths" value={matchStats.counts['KilledByStorm'] || 0} color="#cc44ff" />
              <StatRow label="Loot Events"  value={matchStats.counts['Loot']          || 0} color="#44ff88" />
            </div>
          </div>
        )}

        {/* Filtered events */}
        {filteredEvents.length > 0 && (
          <div>
            <div className="text-[10px] font-mono tracking-widest text-[#445566] uppercase mb-2">
              VISIBLE EVENTS
            </div>
            <div className="bg-[#0f0f1e] rounded p-2 space-y-0.5">
              {Object.entries(
                filteredEvents.reduce((acc, ev) => {
                  acc[ev.event] = (acc[ev.event] || 0) + 1
                  return acc
                }, {})
              )
                .sort((a, b) => b[1] - a[1])
                .map(([ev, cnt]) => (
                  <StatRow key={ev} label={ev} value={cnt.toLocaleString()} />
                ))}
            </div>
          </div>
        )}

        {!matchData && (
          <div className="text-xs text-[#334455] font-mono text-center mt-8 leading-relaxed">
            Select a match<br />to see detailed<br />statistics
          </div>
        )}
      </div>

      <div className="px-3 py-2 border-t border-[#2a2a4a] text-[10px] font-mono text-[#334455]">
        LILA BLACK · Feb 2026
      </div>
    </aside>
  )
}