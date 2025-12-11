from fastapi import APIRouter, Form, HTTPException, Query, Body
from pydantic import BaseModel
from app.services.rag_service import (
    process_pdf_from_url,
    answer_query,
    reset_session,
    clear_embeddings,
)

router = APIRouter()

@router.post("/delete-embeddings")
async def delete_embeddings_endpoint(
    session_id: str = Query(None),
    before: str = Query(None)
):
    """
    Deletes embeddings. Use a `session_id` to clear a session 
    or a `before` timestamp to clear expired embeddings.
    """
    if not session_id and not before:
        raise HTTPException(
            status_code=400, 
            detail="Either session_id or before timestamp must be provided."
        )
    
    await clear_embeddings(session_id=session_id, before=before)
    return {"message": "Embeddings deleted successfully."}

class UploadRequest(BaseModel):
    session_id: str
    file_url: str

@router.post("/upload")
async def upload_pdf(req: UploadRequest):
    return await process_pdf_from_url(req.file_url, req.session_id)

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
