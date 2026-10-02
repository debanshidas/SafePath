"""SafePath API - FastAPI application entrypoint."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, engine
from .routes import auth, contacts, journeys, safety, share, sos

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("safepath")


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Create tables on boot. Swap in Alembic migrations for production.
    Base.metadata.create_all(bind=engine)
    log.info("SafePath API ready (database: %s)", engine.url.render_as_string(hide_password=True))
    yield


app = FastAPI(
    title="SafePath API",
    version="1.0.0",
    description=(
        "Backend for the SafePath personal safety app. The safety risk indicator uses "
        "sample data and does not guarantee safety; this API does not contact police "
        "or emergency services."
    ),
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    # Vite picks the next free port when 5173 is taken, so allow any localhost port.
    allow_origin_regex=r"http://localhost:\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ROUTERS = (
    auth.router,
    contacts.router,
    journeys.router,
    safety.router,
    sos.router,
    share.router,
)
for router in ROUTERS:
    app.include_router(router, prefix="/api")


@app.get("/api/health", tags=["health"])
def health():
    return {"status": "ok", "service": "safepath-api"}
