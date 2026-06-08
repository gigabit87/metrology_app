from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, history, calculations

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Metrology Lab API", docs_url="/docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(history.router)
app.include_router(calculations.router)

@app.get("/")
def root():
    return {"message": "Welcome to Metrology Lab API"}