# SafePath 🛡️

A women's safety web application designed to help users make informed travel decisions and quickly alert trusted contacts during emergencies.

## Features (MVP)

- **Route Planning** — Enter origin & destination, compare routes on an interactive map
- **Safety Risk Indicator** — Rule-based safety scoring (LOW / MEDIUM / HIGH)
- **Active Journey Tracking** — Real-time location sharing with trusted contacts
- **Emergency SOS** — One-tap alert that texts your emergency contacts your
  location, battery level and a live tracking link

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js, Vite, Tailwind CSS |
| Backend | Python, FastAPI |
| Database | SQLAlchemy — SQLite by default, PostgreSQL optional |
| Auth | Firebase Authentication |
| Maps | Leaflet + OpenStreetMap tiles (no API key required) |
| Notifications | Twilio SMS (optional; alerts are recorded either way) |

## Prerequisites

Required:

- Node.js 18+
- Python 3.10+

Optional — the app runs without them:

- PostgreSQL 15+ (or Docker). Without it the backend uses a local SQLite file.
- A Firebase project with Authentication enabled. Without it the frontend keeps
  local accounts and the backend serves a single shared demo user.
- A Google Maps Platform API key. Maps are rendered with Leaflet and
  OpenStreetMap tiles, so no key is needed.
- A Twilio account. Without one, alerts are recorded and the UI states plainly
  that nothing was sent.

## Quick Start

### 1. Backend

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs at `http://localhost:8000`. Interactive API docs at
`http://localhost:8000/docs`, health check at `http://localhost:8000/api/health`.

On first boot it creates its tables and seeds three demo emergency contacts.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173` (Vite picks the next free port if that
one is taken). The frontend works on its own — if the backend is unreachable
every call falls back to browser `localStorage`, so you can start either one
first.

### 3. Optional: PostgreSQL and real credentials

```bash
cp .env.example .env     # then fill in the values you have
docker-compose up -d     # starts PostgreSQL on :5432
```

Set `DATABASE_URL` in `.env` to use PostgreSQL instead of SQLite, drop a
`firebase-service-account.json` at the repo root to turn on real token
verification, and fill the `VITE_FIREBASE_*` values in `frontend/.env` to enable
Firebase sign-in.

## API

All routes are under `/api`.

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/health` | Service health |
| `POST` | `/auth/sync` | Upsert the signed-in user |
| `GET` `PUT` | `/auth/profile` | Read / update profile and safety settings |
| `GET` `POST` | `/contacts` | List / add emergency contacts |
| `PUT` `DELETE` | `/contacts/{id}` | Update / remove a contact |
| `PATCH` | `/contacts/{id}/primary` | Set the primary SOS contact |
| `GET` `POST` | `/journeys` | Journey history / start a journey |
| `GET` | `/journeys/active` | The current active journey, or `null` |
| `GET` | `/journeys/{id}` | One journey |
| `PATCH` | `/journeys/{id}/start` `/end` `/cancel` | Journey lifecycle |
| `POST` | `/journeys/{id}/location` | Location ping or check-in |
| `POST` | `/safety/assess` | Rule-based route risk indicator |
| `GET` `POST` | `/sos` | SOS history / dispatch an alert |
| `GET` | `/sos/status` | Whether SMS delivery is configured |
| `POST` | `/contacts/{id}/test-alert` | Send a test SMS to one contact |
| `GET` | `/share/{token}` | Public read of a shared journey (no auth) |

## Project Structure

```
safepath/
├── frontend/
│   └── src/
│       ├── components/    # Reusable UI components
│       ├── pages/         # Page components
│       ├── services/      # API & Firebase services
│       ├── hooks/         # Custom React hooks
│       ├── utils/         # Helper functions
│       ├── App.jsx        # Root component with routing
│       └── main.jsx       # Entry point
├── backend/
│   └── app/
│       ├── main.py        # FastAPI application
│       ├── database.py    # SQLAlchemy configuration
│       ├── config.py      # Environment settings
│       ├── models/        # ORM models
│       ├── schemas/       # Pydantic schemas
│       ├── routes/        # API route handlers
│       ├── services/      # Business logic
│       └── utils/         # Helpers & middleware
├── backend/requirements.txt
├── docker-compose.yml
├── .env.example
└── README.md
```

## Environment Variables

See [`.env.example`](.env.example) for the full list of required variables.

## SMS alerts

Alerts are sent over Twilio. Three settings in `.env` turn delivery on:

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxx
TWILIO_FROM_NUMBER=+15005550006
```

Messages are sent when you press SOS, when a journey starts (to contacts with
"notify on start" enabled), and when you use **Test Alert** on the Emergency
Contacts page.

**Until those are set, no message is sent to anyone.** The app does not pretend
otherwise: `GET /api/sos/status` reports `smsConfigured: false`, the contacts
page shows a warning banner, and the SOS screen says "Recorded, not sent".

On a Twilio trial account you can only text numbers you have verified in the
Twilio console, so replace the seeded demo contacts with your own number before
testing. Trial messages also carry a Twilio prefix.

To check the delivery wiring without sending real messages:

```bash
cd backend
.venv/Scripts/python.exe test_sms.py      # number handling, templates, results
.venv/Scripts/python.exe test_api_sms.py  # the HTTP routes, end to end
```

## ⚠️ Disclaimer

SafePath's safety risk indicator uses **sample data** for development purposes.
Risk scores are **indicators only** and do **not** guarantee safety.

This application does **not** contact police or emergency services, and it does
**not** place phone calls. It sends SMS to the emergency contacts you configure,
and only when Twilio credentials are present. Do not rely on it as your sole
means of getting help in an emergency.

## License

All rights reserved.
