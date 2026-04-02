import os, json, logging
from pathlib import Path
from typing import Optional, List
from collections import defaultdict

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("lila")

app = FastAPI(title="LILA BLACK Visualizer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["*"],
)

DATA_DIR = Path(os.environ.get("DATA_DIR", "./data"))

class DataStore:
    def __init__(self):
        self.manifest = []
        self.ready = False

    def load(self):
        manifest_path = DATA_DIR / "manifest.json"
        if not manifest_path.exists():
            log.warning("manifest.json not found — run scripts/preprocess.py first")
            return
        with open(manifest_path) as f:
            self.manifest = json.load(f)
        self.ready = True
        log.info(f"Loaded {len(self.manifest)} matches")

    def get_dates(self):
        return sorted(set(m["date"] for m in self.manifest))

    def get_maps(self):
        return sorted(set(m["map_id"] for m in self.manifest))

    def get_matches(self, map_id=None, date=None):
        result = self.manifest
        if map_id:
            result = [m for m in result if m["map_id"] == map_id]
        if date:
            result = [m for m in result if m["date"] == date]
        return result

    def get_match(self, match_id):
        path = DATA_DIR / "matches" / f"{match_id}.json"
        if not path.exists():
            return None
        with open(path) as f:
            return json.load(f)

    def get_heatmap(self, map_id, htype):
        path = DATA_DIR / "heatmaps" / map_id / f"{htype}.json"
        if not path.exists():
            return None
        with open(path) as f:
            return json.load(f)

    def get_stats(self):
        if not self.manifest:
            return {}
        maps = defaultdict(int)
        dates = defaultdict(int)
        for m in self.manifest:
            maps[m["map_id"]] += 1
            dates[m["date"]] += 1
        return {
            "total_matches":   len(self.manifest),
            "total_humans":    sum(m["human_count"] for m in self.manifest),
            "total_bots":      sum(m["bot_count"]   for m in self.manifest),
            "matches_by_map":  dict(maps),
            "matches_by_date": dict(dates),
        }

store = DataStore()

@app.on_event("startup")
async def startup():
    store.load()

@app.get("/api/status")
def status():
    return {
        "status": "ok" if store.ready else "no_data",
        "matches": len(store.manifest),
    }

@app.get("/api/dates")
def get_dates():
    return store.get_dates()

@app.get("/api/maps")
def get_maps():
    return store.get_maps()

@app.get("/api/matches")
def get_matches(
    map_id: Optional[str] = Query(None, alias="map"),
    date:   Optional[str] = Query(None),
):
    return store.get_matches(map_id=map_id, date=date)

@app.get("/api/match/{match_id}")
def get_match(match_id: str):
    data = store.get_match(match_id)
    if data is None:
        raise HTTPException(status_code=404, detail="Match not found")
    return data

@app.get("/api/heatmap/{map_id}/{htype}")
def get_heatmap(map_id: str, htype: str):
    data = store.get_heatmap(map_id, htype)
    if data is None:
        return {"grid": [0.0] * (128 * 128), "size": 128}
    return data

@app.get("/api/stats")
def get_stats():
    return store.get_stats()

@app.get("/health")
def health():
    return {"ok": True}