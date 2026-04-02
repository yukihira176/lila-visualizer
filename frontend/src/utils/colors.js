export const EVENT_STYLES = {
  Kill: {
    label: 'Kill (H→H)', color: '#ff4444', shape: 'star', size: 7, zIndex: 10,
  },
  Killed: {
    label: 'Death (H)', color: '#ffffff', shape: 'cross', size: 7, zIndex: 10,
  },
  BotKill: {
    label: 'Bot Kill', color: '#ff9900', shape: 'circle', size: 5, zIndex: 8,
  },
  BotKilled: {
    label: 'Bot Death', color: '#888888', shape: 'diamond', size: 5, zIndex: 8,
  },
  KilledByStorm: {
    label: 'Storm Death', color: '#cc44ff', shape: 'triangle', size: 8, zIndex: 9,
  },
  Loot: {
    label: 'Loot', color: '#44ff88', shape: 'diamond', size: 5, zIndex: 7,
  },
  Position: {
    label: 'Human Path', color: '#4488ff', shape: 'dot', size: 2, zIndex: 1,
  },
  BotPosition: {
    label: 'Bot Path', color: '#446688', shape: 'dot', size: 2, zIndex: 1,
  },
}

export const HEATMAP_LAYERS = [
  { id: 'off',     label: 'Off',     color: null },
  { id: 'traffic', label: 'Traffic', color: '#4488ff' },
  { id: 'kills',   label: 'Kills',   color: '#ff4444' },
  { id: 'deaths',  label: 'Deaths',  color: '#ffffff' },
  { id: 'loot',    label: 'Loot',    color: '#44ff88' },
  { id: 'storm',   label: 'Storm',   color: '#cc44ff' },
]

export const FILTER_GROUPS = [
  { label: 'Combat',      events: ['Kill', 'Killed', 'BotKill', 'BotKilled'], defaultOn: true  },
  { label: 'Environment', events: ['KilledByStorm'],                          defaultOn: true  },
  { label: 'Items',       events: ['Loot'],                                   defaultOn: true  },
  { label: 'Movement',    events: ['Position', 'BotPosition'],                defaultOn: false },
]

export function drawMarker(ctx, x, y, style, scale = 1) {
  const s = style.size * scale
  ctx.fillStyle = style.color
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 0.8

  switch (style.shape) {
    case 'circle':
      ctx.beginPath()
      ctx.arc(x, y, s, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      break
    case 'star':
      ctx.beginPath()
      ctx.moveTo(x - s, y - s)
      ctx.lineTo(x + s, y + s)
      ctx.moveTo(x + s, y - s)
      ctx.lineTo(x - s, y + s)
      ctx.strokeStyle = style.color
      ctx.lineWidth = 2.5 * scale
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(x, y, s * 0.3, 0, Math.PI * 2)
      ctx.fillStyle = style.color
      ctx.fill()
      break
    case 'cross':
      ctx.beginPath()
      ctx.moveTo(x - s, y)
      ctx.lineTo(x + s, y)
      ctx.moveTo(x, y - s)
      ctx.lineTo(x, y + s)
      ctx.strokeStyle = style.color
      ctx.lineWidth = 2.5 * scale
      ctx.stroke()
      break
    case 'diamond':
      ctx.beginPath()
      ctx.moveTo(x, y - s)
      ctx.lineTo(x + s * 0.7, y)
      ctx.lineTo(x, y + s)
      ctx.lineTo(x - s * 0.7, y)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      break
    case 'triangle':
      ctx.beginPath()
      ctx.moveTo(x, y - s)
      ctx.lineTo(x + s * 0.85, y + s * 0.6)
      ctx.lineTo(x - s * 0.85, y + s * 0.6)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      break
    case 'dot':
    default:
      ctx.beginPath()
      ctx.arc(x, y, Math.max(1, s), 0, Math.PI * 2)
      ctx.fill()
      break
  }
}