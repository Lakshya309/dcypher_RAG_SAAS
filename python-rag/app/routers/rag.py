from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.services.rag_service import (
    process_pdf,
    answer_query,
    reset_session
)

router = APIRouter()

@router.post("/upload")
async def upload_pdf(
    session_id: str = Form(...),
    file: UploadFile = File(...)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded.")
    return await process_pdf(file, session_id)

@router.post("/chat")
async def chat(
    session_id: str = Form(...),
    query: str = Form(...)
):
    answer, docs = await answer_query(query, session_id)
    return {"answer": answer, "sources": docs}

@router.post("/reset")
async def reset(
    session_id: str = Form(...)
):
    return await reset_session(session_id)

