from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .database import engine, Base
from .routers import auth, history, calculations
import os


Base.metadata.create_all(bind=engine)


FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost")

app = FastAPI(title="Metrology Lab API", docs_url="/docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost",
        "http://localhost:3000",
        "https://metrologyapp-production.up.railway.app",  # 👈 ДОБАВЬТЕ ЭТО
        FRONTEND_URL,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(history.router)
app.include_router(calculations.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}

static_dir = "/app/static"
if os.path.exists(static_dir):
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
else:
    @app.get("/")
    def root():
        return {"message": "Welcome to Metrology Lab API"}