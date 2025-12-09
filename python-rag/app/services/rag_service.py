import os
from fastapi import HTTPException
from app.utils.pdf_loader import load_pdf
from app.utils.splitter import split_docs
from app.utils.vector_store import add_to_vectorstore, query_vectorstore, delete_vectorstore
from app.utils.llm import get_llm

async def process_pdf(file, session_id: str):
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID is required.")
    
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="File is empty.")

    if not file.filename:
        raise HTTPException(status_code=400, detail="File name not found.")

    path = f"data/{session_id}_{file.filename}"
    with open(path, "wb") as f:
        f.write(content)

    try:
        docs = load_pdf(path)
        chunks = split_docs(docs)
        add_to_vectorstore(chunks, session_id)
    finally:
        if os.path.exists(path):
            os.remove(path)

    return {"message": "PDF processed", "chunks": len(chunks)}

async def answer_query(query: str, session_id: str):
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID is required.")
    if not query:
        raise HTTPException(status_code=400, detail="Query is empty.")

    retriever = query_vectorstore(query, session_id)
    if not retriever:
        return "No documents have been uploaded for this session. Please upload a PDF first.", []

    llm = get_llm()
    context = "\n\n".join([d.page_content for d in retriever])

    prompt = f"""
    You are a helpful AI assistant for the RAG an open source PDF-GPT. You will answer user questions based on the context provided.

    CONTEXT:
    {context}

    QUESTION:
    {query}

    ANSWER:
    """

    answer = llm.invoke(prompt)
    return answer, [d.metadata for d in retriever]

async def reset_session(session_id: str):
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID is required.")
    delete_vectorstore(session_id)
    return {"message": f"Session {session_id} has been reset."}
