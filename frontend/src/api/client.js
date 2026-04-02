const BASE = import.meta.env.VITE_API_URL || ''

async function get(path) {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`)
  return res.json()
}

export const api = {
  status:  ()             => get('/api/status'),
  dates:   ()             => get('/api/dates'),
  maps:    ()             => get('/api/maps'),
  matches: (mapId, date)  => {
    const params = new URLSearchParams()
    if (mapId) params.set('map', mapId)
    if (date)  params.set('date', date)
    return get(`/api/matches?${params}`)
  },
  match:   (matchId)      => get(`/api/match/${matchId}`),
  heatmap: (mapId, htype) => get(`/api/heatmap/${mapId}/${htype}`),
  stats:   ()             => get('/api/stats'),
}