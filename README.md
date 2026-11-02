# Wonders of Watches

An interactive tour of watchmaking's great inventions. React (Vite) frontend, strictly Python (FastAPI) backend.

| Chapter | Interaction |
| --- | --- |
| Grand Seiko Spring Drive | Compare beat rates on a live dial and step graph; jolt the glide wheel |
| Omega | Time Apollo 13's 14-second burn with working pushers; magnet lab; Co-Axial cycle |
| G-Shock | Working LCD; 10 m drop test; take a Carbon Core Guard apart |
| Tourbillon | Tilt the watch and see gravity error cancel |
| Perpetual | Swing the rotor to wind it; scrolling counts |
| Archive and Sky | Chronology from the API; live moon, sun and NASA picture of the day |

## Run locally

```bash
python -m venv .venv
.venv/Scripts/pip install -r requirements-dev.txt   # macOS/Linux: .venv/bin/pip
npm install

.venv/Scripts/uvicorn api.index:app --reload --port 8000
npm run dev                                         # in a second terminal
```

Tests: `.venv/Scripts/python -m pytest`

## API

| Route | Source | Key |
| --- | --- | --- |
| `GET /api/wonders` | Curated in `api/_wonders.py` | None |
| `GET /api/sky?lat=&lon=` | [Open-Meteo](https://open-meteo.com/) plus a local Moon calculation | None (non-commercial use) |
| `GET /api/apod` | [NASA APOD](https://api.nasa.gov/) | Free; set `NASA_API_KEY` |
| `GET /api/docs` | Swagger UI | |

Without `NASA_API_KEY` the site uses NASA's heavily rate-limited `DEMO_KEY`. Sign up at https://api.nasa.gov/ (free, instant) and add the key under Vercel → Settings → Environment Variables. If APOD is unavailable, its panel just doesn't render.

Open-Meteo's free tier is for non-commercial use, so it needs a paid plan if this site ever becomes commercial.

## Deploy on Vercel

Import the GitHub repo. `vercel.json` sets the Vite build and rewrites `/api/*` to the FastAPI function in `api/index.py`; Python dependencies come from `requirements.txt`. Files in `api/` starting with `_` are helpers, not separate functions.

## Fonts and images: read before making this public

- **Helvetica Neue LT Pro and Minion Pro are commercial fonts.** The files in `public/fonts` came from a third-party download (cufonfonts) and web use normally requires a web licence from Monotype/Adobe. Deploying the site serves them to every visitor, and a public repo redistributes them. Keep the repo private and obtain licences, or replace them before launching publicly. `scripts/build_fonts.py` regenerates the subsets.
- **DSEG7** is under the SIL Open Font License (`public/fonts/DSEG-LICENSE.txt`), and is subset to digits and clock punctuation only.
- **Photographs** come from Wikimedia Commons under the licences listed in the site's footer. `scripts/fetch_images.py` regenerates them and their attribution data. Watch brand names and designs belong to their owners; this is an independent educational project.
