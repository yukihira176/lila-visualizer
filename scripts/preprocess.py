#!/usr/bin/env python3
import os, sys, json, argparse, numpy as np
from pathlib import Path
from collections import defaultdict

try:
    import pyarrow.parquet as pq
    import pandas as pd
    from scipy.ndimage import gaussian_filter
except ImportError:
    os.system("pip install pyarrow pandas scipy tqdm")
    import pyarrow.parquet as pq
    import pandas as pd
    from scipy.ndimage import gaussian_filter

try:
    from tqdm import tqdm
except ImportError:
    tqdm = lambda x, **kw: x

MAP_CONFIG = {
    "AmbroseValley": {"scale": 900,  "origin_x": -370, "origin_z": -473},
    "GrandRift":     {"scale": 581,  "origin_x": -290, "origin_z": -290},
    "Lockdown":      {"scale": 1000, "origin_x": -500, "origin_z": -500},
}

HEATMAP_TYPES = {
    "traffic": ["Position", "BotPosition"],
    "kills":   ["Kill", "BotKill"],
    "deaths":  ["Killed", "BotKilled", "KilledByStorm"],
    "loot":    ["Loot"],
    "storm":   ["KilledByStorm"],
}

DAY_MAP = {
    "February_10": "2026-02-10",
    "February_11": "2026-02-11",
    "February_12": "2026-02-12",
    "February_13": "2026-02-13",
    "February_14": "2026-02-14",
}

HEATMAP_GRID = 128

def is_human(user_id):
    return "-" in str(user_id)

def world_to_uv(x, z, map_id):
    cfg = MAP_CONFIG[map_id]
    u = (x - cfg["origin_x"]) / cfg["scale"]
    v = (z - cfg["origin_z"]) / cfg["scale"]
    return u, v

def load_parquet(filepath):
    table = pq.read_table(str(filepath))
    df = table.to_pandas()
    df["event"] = df["event"].apply(
        lambda x: x.decode("utf-8") if isinstance(x, bytes) else str(x)
    )
    if pd.api.types.is_datetime64_any_dtype(df["ts"]):
        df["ts_ms"] = df["ts"].astype(np.int64) // 1_000_000
    else:
        df["ts_ms"] = df["ts"].astype(np.int64)
    return df

def build_manifest(data_dir):
    manifest = {}
    seen = set()
    day_dirs = []
    for day_name, date_str in DAY_MAP.items():
        d = data_dir / day_name
        if d.is_dir():
            day_dirs.append((d, date_str))

    all_files = []
    for d, date_str in day_dirs:
        for f in d.iterdir():
            all_files.append((f, date_str))

    print(f"  Found {len(all_files)} files")

    for filepath, date_str in tqdm(all_files, desc="  Scanning"):
        try:
            df = load_parquet(filepath)
            if df.empty:
                continue
            df["event"] = df["event"].apply(
                lambda x: x.decode("utf-8") if isinstance(x, bytes) else str(x)
            )
            first = df.iloc[0]
            match_id = str(first["match_id"]).replace(".nakama-0", "")
            map_id = str(first["map_id"])
            user_id = str(first["user_id"])
            human = is_human(user_id)

            if match_id not in manifest:
                manifest[match_id] = {
                    "match_id": match_id,
                    "map_id": map_id,
                    "date": date_str,
                    "human_count": 0,
                    "bot_count": 0,
                    "event_counts": defaultdict(int),
                    "files": [],
                }

            m = manifest[match_id]
            key = (match_id, user_id)
            if key not in seen:
                seen.add(key)
                if human:
                    m["human_count"] += 1
                else:
                    m["bot_count"] += 1

            m["files"].append(str(filepath))
            for ev, cnt in df["event"].value_counts().items():
                m["event_counts"][ev] += int(cnt)

        except Exception as e:
            print(f"\n  WARN: {filepath.name}: {e}")
            continue

    for m in manifest.values():
        m["event_counts"] = dict(m["event_counts"])
    return manifest

def process_match(match_info):
    events = []
    map_id = match_info["map_id"]
    pos_events = {"Position", "BotPosition"}

    for filepath in match_info["files"]:
        try:
            df = load_parquet(Path(filepath))
            df["is_human"] = df["user_id"].apply(lambda uid: is_human(str(uid)))
            for _, row in df.iterrows():
                ev = row["event"]
                if ev in pos_events and hash(str(row["ts_ms"])) % 3 != 0:
                    continue
                u, v = world_to_uv(float(row["x"]), float(row["z"]), map_id)
                if not (-0.05 <= u <= 1.05 and -0.05 <= v <= 1.05):
                    continue
                events.append({
                    "user_id": str(row["user_id"]),
                    "is_human": bool(row["is_human"]),
                    "event": ev,
                    "u": round(float(np.clip(u, 0, 1)), 4),
                    "v": round(float(np.clip(v, 0, 1)), 4),
                    "ts": int(row["ts_ms"]),
                })
        except Exception as e:
            print(f"\n  WARN: {filepath}: {e}")
            continue

    events.sort(key=lambda e: e["ts"])
    return events

def compute_heatmap(all_events, event_types, sigma=3.0):
    grid = np.zeros((HEATMAP_GRID, HEATMAP_GRID), dtype=np.float32)
    filtered = [e for e in all_events if e["event"] in event_types]
    for e in filtered:
        xi = int(e["u"] * (HEATMAP_GRID - 1))
        zi = int((1.0 - e["v"]) * (HEATMAP_GRID - 1))
        xi = np.clip(xi, 0, HEATMAP_GRID - 1)
        zi = np.clip(zi, 0, HEATMAP_GRID - 1)
        grid[zi, xi] += 1.0
    if grid.max() > 0:
        grid = gaussian_filter(grid, sigma=sigma)
        grid = grid / grid.max()
    return grid.flatten().tolist()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", default="./player_data")
    parser.add_argument("--out",  default="./backend/data")
    args = parser.parse_args()

    data_dir = Path(args.data)
    out_dir  = Path(args.out)

    if not data_dir.exists():
        print(f"ERROR: {data_dir} not found")
        sys.exit(1)

    (out_dir / "matches").mkdir(parents=True, exist_ok=True)
    for map_id in MAP_CONFIG:
        (out_dir / "heatmaps" / map_id).mkdir(parents=True, exist_ok=True)

    print("\n[1/3] Building manifest...")
    manifest = build_manifest(data_dir)
    print(f"  -> {len(manifest)} matches found")

    manifest_export = [
        {
            "match_id":    m["match_id"],
            "map_id":      m["map_id"],
            "date":        m["date"],
            "human_count": m["human_count"],
            "bot_count":   m["bot_count"],
            "event_counts": m["event_counts"],
        }
        for m in manifest.values()
    ]

    with open(out_dir / "manifest.json", "w") as f:
        json.dump(manifest_export, f)
    print(f"  -> manifest.json saved")

    print("\n[2/3] Processing matches...")
    map_events = defaultdict(list)
    for match_id, match_info in tqdm(manifest.items(), desc="  Matches"):
        events = process_match(match_info)
        match_out = {
            "match_id":    match_id,
            "map_id":      match_info["map_id"],
            "date":        match_info["date"],
            "human_count": match_info["human_count"],
            "bot_count":   match_info["bot_count"],
            "event_counts": match_info["event_counts"],
            "events":      events,
        }
        with open(out_dir / "matches" / f"{match_id}.json", "w") as f:
            json.dump(match_out, f)
        map_events[match_info["map_id"]].extend(events)

    print("\n[3/3] Computing heatmaps...")
    for map_id in MAP_CONFIG:
        events = map_events.get(map_id, [])
        if not events:
            continue
        for htype, ev_types in HEATMAP_TYPES.items():
            sigma = 2.0 if htype == "traffic" else 3.5
            grid = compute_heatmap(events, ev_types, sigma=sigma)
            out_path = out_dir / "heatmaps" / map_id / f"{htype}.json"
            with open(out_path, "w") as f:
                json.dump({"grid": grid, "size": HEATMAP_GRID}, f)
        print(f"  {map_id} done")

    print(f"\nDone! Data written to {out_dir}/")

if __name__ == "__main__":
    main()