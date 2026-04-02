const GRADIENT = [
  [0.00,  0,   0,   0  ],
  [0.20,  0,   0, 200  ],
  [0.40,  0, 180, 200  ],
  [0.60, 220, 200,   0  ],
  [0.80, 255, 100,   0  ],
  [1.00, 255,   0,   0  ],
]

function interpolateColor(t) {
  for (let i = 1; i < GRADIENT.length; i++) {
    const [p0, r0, g0, b0] = GRADIENT[i - 1]
    const [p1, r1, g1, b1] = GRADIENT[i]
    if (t <= p1) {
      const f = (t - p0) / (p1 - p0)
      return [
        Math.round(r0 + (r1 - r0) * f),
        Math.round(g0 + (g1 - g0) * f),
        Math.round(b0 + (b1 - b0) * f),
      ]
    }
  }
  return GRADIENT[GRADIENT.length - 1].slice(1)
}

export function drawHeatmap(ctx, grid, size, alpha = 0.65) {
  const cw = ctx.canvas.width
  const ch = ctx.canvas.height
  const cellW = cw / size
  const cellH = ch / size
  const imgData = ctx.createImageData(cw, ch)
  const data = imgData.data

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const density = grid[row * size + col]
      if (density < 0.01) continue
      const [r, g, b] = interpolateColor(density)
      const a = Math.round(density * alpha * 255)
      const x0 = Math.floor(col * cellW)
      const y0 = Math.floor(row * cellH)
      const x1 = Math.ceil((col + 1) * cellW)
      const y1 = Math.ceil((row + 1) * cellH)
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const idx = (y * cw + x) * 4
          const existA = data[idx + 3] / 255
          const newA = a / 255
          const outA = newA + existA * (1 - newA)
          if (outA > 0) {
            data[idx]     = Math.round((r * newA + data[idx]     * existA * (1 - newA)) / outA)
            data[idx + 1] = Math.round((g * newA + data[idx + 1] * existA * (1 - newA)) / outA)
            data[idx + 2] = Math.round((b * newA + data[idx + 2] * existA * (1 - newA)) / outA)
            data[idx + 3] = Math.round(outA * 255)
          }
        }
      }
    }
  }
  ctx.putImageData(imgData, 0, 0)
}