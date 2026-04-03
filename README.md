# LILA BLACK — Player Journey Visualizer

A web-based tool for Level Designers to explore player behavior across LILA BLACK's 3 maps using real production data.

**Live Tool:** https://lila-visualizer.vercel.app

---

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Python FastAPI
- **Data Processing:** PyArrow + Pandas + Scipy
- **Deployment:** Vercel (frontend) + Railway (backend)

---

## Setup

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Preprocess Data (run once)
```bash
cd scripts
python preprocess.py
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables

### Backend
```
CORS_ORIGINS=https://lila-visualizer.vercel.app
```

### Frontend
```
VITE_API_URL=https://lila-visualizer-production.up.railway.app
```

---

## Data

Place the raw parquet files in `player_data/` before running `preprocess.py`. The script converts all 1,243 parquet files into JSON and outputs them to `backend/data/`.