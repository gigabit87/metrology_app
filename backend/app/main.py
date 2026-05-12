from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, history

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Metrology Lab API", docs_url="/docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(history.router)

@app.get("/")
def root():
    return {"message": "Welcome to Metrology Lab API"}