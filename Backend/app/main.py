from database import get_db,engine
from fastapi import FastAPI,Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import models

from sqlalchemy import text


app = FastAPI(
    title="Jorisa Electrical & Hardwares API",
    description="Multi-store inventory ledger system",
    version="1.0.0"
)

# Enable CORS so your React frontend can communicate with this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173/"], # In production, replace with your React app's URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

models.base.metadata.create_all(bind=engine)

@app.get("/health")
def check_health(
    db: Session = Depends(get_db)
):
    db.execute(text("SELECT 1"))
    return {"status": "Connected"}