# Hobby Portal

A personal hobby tracking platform that tracks media collections, featuring automated web scraping, a scheduled Windows service for daily update detection, and cloud storage.

## Features

- Visual novel tracker with planned support for additional hobby categories (games, K-pop, figurines)
- **Automated update detection** — dual-source web scraper with primary and fallback sites
- Version tracking — compares last played version against latest release
- Status tracking — Ongoing / Completed / Watchlist / Dropped
- Rating system with tier labels (S+ / S / A / B / C)
- Fullscreen image gallery with banner/cover art
- Real-time batch progress updates
- Cloud image storage (Cloudflare R2)
- Daily scheduled scraping with run-state tracking to prevent duplicate execution

## Architecture

```
Frontend          Backend (3 Flask APIs)       Database
---------         ----------------------       --------
React 19    <-->  CRUD API    (port 5004)  <-> PostgreSQL (persistent)
TypeScript        Scraper API (port 5005)  <-> SQLite     (scraper state)
Vite              Logger API  (port 5006)
Tailwind CSS
```

### Scraper Design

- `SmartScraper` — rate-limit aware HTTP client with adaptive backoff, circuit breaker, and user-agent rotation
- `DailyScraperOrchestrator` — batches daily scrape targets (15–35 titles/day), randomised to avoid detection
- `DailyScraper` — state tracking via SQLite; prevents duplicate runs per day
- Dual-source parsing with site-specific parsers and auto-detection
- Fully configurable via `.env.sites` — no hardcoded URLs

## Design Decisions

- **Dual-source scraping with fallback** — primary site is checked first; falls back to a secondary source automatically if parsing fails
- **Priority-based daily scheduler** — weights titles by rating and days since last scrape to keep high-rated entries fresh without hammering any single source
- **Circuit breaker on the scraper** — trips after 3 consecutive failures, resets after 5 minutes; prevents cascading failures during rate limiting
- **Separate SQLite for scraper state** — keeps operational state (run history, scrape log) decoupled from the main PostgreSQL database
- **Adaptive backoff with user-agent rotation** — randomised delays and rotating headers to avoid detection across scraping sessions
- **Site-specific referer simulation** — each scraping source has configurable referer paths via env vars, mimicking realistic navigation patterns per site
- **Connection pooling** — database connections are pooled to reduce overhead across concurrent API requests

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Backend | Python, Flask, Flask-CORS |
| Database | PostgreSQL (psycopg2), SQLite |
| Scraping | Beautiful Soup, Requests |
| Storage | Cloudflare R2 (boto3), Pillow |
| DevOps | Docker Compose |

## Running Locally

### Prerequisites
- Docker Desktop
- Python 3.x
- Node.js

### Environment Setup

1. Copy `Backend/.env.example` to `Backend/.env` and fill in your values:
   - `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD` — PostgreSQL/Supabase connection details
   - `BASE_URL_VN` — base URL for the CRUD API (default: `http://localhost:5004`)
   - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `BUCKET` — Cloudflare R2 credentials for image storage

2. Copy `Backend/.env.sites.example` to `Backend/.env.sites` and configure your scraping sources.

### Running

**Via Docker:**
```bash
runApp - Docker.bat
```
Opens at `http://localhost/visualNovel`

> **Note:** Docker support is currently being updated following a cloud migration. Use `runApp.bat` for local development.

**Without Docker (Windows):**
```bash
runApp.bat
```
Starts all backend services and frontend. Opens at `http://localhost:5173/vn`

**Manual setup:**
```bash
# Install backend dependencies
pip install -r Backend/requirements.txt

# Start backend services (each in a separate terminal)
python -m Backend.apis.crud_apis
python -m Backend.apis.vn_date
python -m Backend.apis.log_scrapper

# Start frontend
cd Frontend
npm install
npm run dev
```
Opens at `http://localhost:5173/vn`

> **Mac/Linux:** If module resolution fails, prefix commands with `PYTHONPATH=. python -m Backend.apis.crud_apis`

## Evolution

- **Database** — started with local PostgreSQL, migrated to Supabase for cloud hosting
- **Image storage** — moved from local file storage to Cloudflare R2 for persistent cloud storage
- **Scraper** — began as a single-source scraper, evolved to dual-source with fallback, circuit breaker, and scheduled daily runs

## Project Structure

```
├── Backend/
│   ├── apis/          # Flask API endpoints (CRUD, scraper, logger)
│   ├── common/        # Shared utilities (DB, scraping, logging)
│   ├── constants/     # Table definitions, user agents
│   └── scrapers/      # Daily scraper orchestration and site parsers
├── Frontend/          # React application
├── Database/          # Schema and seed data
└── docker-compose.yml
```
