import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { api } from './api/client'
import FilterPanel from './components/FilterPanel'
import MapViewer from './components/MapViewer'
import Timeline from './components/Timeline'
import StatsPanel from './components/StatsPanel'
import { FILTER_GROUPS } from './utils/colors'

const defaultFilters = () => {
  const f = {}
  FILTER_GROUPS.forEach(g => g.events.forEach(e => { f[e] = g.defaultOn }))
  return f
}

export default function App() {
  const [status,      setStatus]      = useState(null)
  const [dates,       setDates]       = useState([])
  const [maps,        setMaps]        = useState([])
  const [matches,     setMatches]     = useState([])
  const [matchData,   setMatchData]   = useState(null)
  const [heatmapData, setHeatmapData] = useState(null)

  const [selectedMap,   setSelectedMap]   = useState('AmbroseValley')
  const [selectedDate,  setSelectedDate]  = useState('')
  const [selectedMatch, setSelectedMatch] = useState('')
  const [eventFilters,  setEventFilters]  = useState(defaultFilters)
  const [showHumans,    setShowHumans]    = useState(true)
  const [showBots,      setShowBots]      = useState(true)
  const [heatmapLayer,  setHeatmapLayer]  = useState('traffic')

  const [timelinePct, setTimelinePct] = useState(100)
  const [isPlaying,   setIsPlaying]   = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState(null)

  useEffect(() => {
    api.status().then(setStatus).catch(() => setStatus({ status: 'error' }))
    api.dates().then(setDates).catch(console.error)
    api.maps().then(setMaps).catch(console.error)
  }, [])

  useEffect(() => {
    setSelectedMatch('')
    setMatchData(null)
    api.matches(selectedMap, selectedDate || null)
      .then(setMatches)
      .catch(console.error)
  }, [selectedMap, selectedDate])

  useEffect(() => {
    if (heatmapLayer === 'off') { setHeatmapData(null); return }
    api.heatmap(selectedMap, heatmapLayer)
      .then(setHeatmapData)
      .catch(() => setHeatmapData(null))
  }, [selectedMap, heatmapLayer])

  useEffect(() => {
    if (!selectedMatch) { setMatchData(null); return }
    setLoading(true)
    setError(null)
    api.match(selectedMatch)
      .then(data => { setMatchData(data); setTimelinePct(100) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [selectedMatch])

  useEffect(() => {
    if (!isPlaying || !matchData) return
    const interval = setInterval(() => {
      setTimelinePct(prev => {
        if (prev >= 100) { setIsPlaying(false); return 100 }
        return Math.min(100, prev + 0.05)
      })
    }, 50)
    return () => clearInterval(interval)
  }, [isPlaying, matchData])

  const filteredEvents = useMemo(() => {
    if (!matchData?.events) return []
    const allTs = matchData.events.map(e => e.ts)
    const maxTs = Math.max(...allTs)
    const minTs = Math.min(...allTs)
    const cutoff = minTs + (maxTs - minTs) * (timelinePct / 100)
    return matchData.events.filter(ev => {
      if (ev.ts > cutoff)             return false
      if (!eventFilters[ev.event])    return false
      if (!showHumans && ev.is_human) return false
      if (!showBots && !ev.is_human)  return false
      return true
    })
  }, [matchData, timelinePct, eventFilters, showHumans, showBots])

  const toggleEvent = useCallback((eventType) => {
    setEventFilters(f => ({ ...f, [eventType]: !f[eventType] }))
  }, [])

  const handlePlayPause = useCallback(() => {
    if (timelinePct >= 100) setTimelinePct(0)
    setIsPlaying(p => !p)
  }, [timelinePct])

  const handleMatchSelect = useCallback((matchId) => {
    setSelectedMatch(matchId)
    setIsPlaying(false)
    setTimelinePct(100)
  }, [])

  return (
    <div className="flex h-screen bg-[#0b0b1a] text-[#eaeaea] overflow-hidden">
      <FilterPanel
        maps={maps} dates={dates} matches={matches}
        selectedMap={selectedMap} selectedDate={selectedDate}
        selectedMatch={selectedMatch} eventFilters={eventFilters}
        showHumans={showHumans} showBots={showBots}
        heatmapLayer={heatmapLayer} status={status}
        onMapChange={setSelectedMap} onDateChange={setSelectedDate}
        onMatchSelect={handleMatchSelect} onToggleEvent={toggleEvent}
        onShowHumansChange={setShowHumans} onShowBotsChange={setShowBots}
        onHeatmapLayerChange={setHeatmapLayer}
      />
      <div className="flex flex-col flex-1 min-w-0">
        <div className="relative flex-1 min-h-0">
          {loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60">
              <div className="text-[#e94560] font-mono animate-pulse text-sm tracking-widest">
                LOADING MATCH DATA…
              </div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 z-20 flex items-center justify-center">
              <div className="text-red-400 text-sm bg-[#1a1a2e] border border-red-900 rounded p-4">
                {error}
              </div>
            </div>
          )}
          <MapViewer
            mapId={selectedMap} events={filteredEvents}
            heatmapData={heatmapData} showHumans={showHumans}
            showBots={showBots} eventFilters={eventFilters}
          />
        </div>
        <Timeline
          matchData={matchData} timelinePct={timelinePct}
          isPlaying={isPlaying} onTimelineChange={setTimelinePct}
          onPlayPause={handlePlayPause}
          filteredEventCount={filteredEvents.length}
        />
      </div>
      <StatsPanel
        matchData={matchData} matches={matches}
        filteredEvents={filteredEvents} selectedMap={selectedMap}
      />
    </div>
  )
}