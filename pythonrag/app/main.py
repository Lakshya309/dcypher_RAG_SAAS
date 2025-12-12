from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import health, rag
# from app.utils.db import create_db_and_tables

# Create the database and tables on startup
# create_db_and_tables()

app = FastAPI()

# Add CORS middleware to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
     allow_origins=["*","http://localhost:3000/chat"],
    # allow_origins=["https://dcypher-omega.vercel.app","http://localhost:3000/chat"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all header
)

app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(rag.router, prefix="/api", tags=["rag"])