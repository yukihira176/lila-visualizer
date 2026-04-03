# ARCHITECTURE.md — How I Built the LILA BLACK Visualizer

## What I Built
A web-based tool that lets Level Designers explore player behavior across all 3 LILA BLACK maps. It shows where players move, fight, loot, and die using real production data from 796 matches across 5 days.

---

## Tech Stack

| Layer | Technology | Why I picked it |
|-------|-----------|-----------------|
| Frontend | React + Vite | Fast development, component-based UI |
| Styling | Tailwind CSS | Quick dark theme without writing CSS |
| Map rendering | HTML Canvas | Full control over heatmap and marker drawing |
| Backend | Python FastAPI | Fast API server, easy to deploy |
| Data processing | PyArrow + Pandas | Best tools for reading parquet files |
| Heatmaps | Scipy gaussian_filter | Smooth density blobs from raw coordinates |
| Deployment | Railway (backend) + Vercel (frontend) | Free tier, easy setup |

---

## How Data Flows
```
player_data/ (1,243 parquet files)
        ↓
scripts/preprocess.py  (run once)
        ↓
backend/data/
  ├── manifest.json          (index of all 796 matches)
  ├── matches/{id}.json      (per-match events with UV coords)
  └── heatmaps/{map}/{type}.json  (pre-computed density grids)
        ↓
FastAPI backend (serves JSON via /api endpoints)
        ↓
React frontend (renders on HTML Canvas)
        ↓
Level Designer sees the tool in their browser
```

---

## How Coordinate Mapping Works

This was the trickiest part. The game world uses 3D coordinates (x, y, z) but the minimap is a 2D 1024x1024 image. The y column represents elevation and is ignored for 2D plotting.
Each map has its own scale and origin defined in the README:

| Map | Scale | Origin X | Origin Z |
|-----|-------|----------|----------|
| AmbroseValley | 900 | -370 | -473 |
| GrandRift | 581 | -290 | -290 |
| Lockdown | 1000 | -500 | -500 |

**Conversion formula:**
```
Step 1 — World to UV (0-1 range):
  u = (x - origin_x) / scale
  v = (z - origin_z) / scale

Step 2 — UV to canvas pixel:
  pixel_x = u * canvas_width
  pixel_y = (1 - v) * canvas_height  ← Y is flipped
```

The Y flip is critical, image coordinates start from the top-left, but game world coordinates increase upward. Without flipping, everything appears mirrored vertically.
I pre-compute UV coordinates during preprocessing and store them in the JSON files. The frontend never sees raw world coordinates — it only works with UV values, making rendering map-agnostic.

---

## Why I Pre-Processed Instead of Querying Live

The raw data is 1,243 parquet files (~8MB total). Reading and parsing all of them on every page load would take 30-60 seconds and make the tool unusable.

By running preprocess.py once at setup time:
- manifest.json loads in milliseconds
- Each match JSON loads in under 1 second
- Heatmap grids are pre-computed — no math at request time

Tradeoff: the data is static. If new match files are added, preprocess.py must be re-run. For a tool used by Level Designers reviewing historical data, this is acceptable.

---

## Assumptions I Made

| Situation | Assumption I made |
|-----------|------------------|
| Bot detection | UUID with hyphens = human, numeric ID = bot |
| Timestamp meaning | ts column = milliseconds elapsed in match |
| Movement sampling | Down-sampled Position events 1-in-3 to reduce JSON size |
| Out of bounds coords | Events with UV outside 0-1.05 range are dropped |
| February 14 partial day | Included as-is, noted in README as partial |67 

---

## Major Tradeoffs

| Decision | What I chose | What I didn't choose | Why |
|----------|-------------|---------------------|-----|
| Rendering | HTML Canvas | SVG / WebGL | Canvas handles thousands of points without performance issues |
| Backend | FastAPI + file serving | DuckDB live queries | Pre-processed JSON is simpler to deploy and faster to serve |
| Heatmap | Pre-computed server-side | Client-side computation | Server-side gaussian blur produces smoother results |
| Frontend | React | Streamlit | React gives full control over the canvas-based map rendering |