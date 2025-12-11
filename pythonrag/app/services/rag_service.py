import os
from fastapi import HTTPException
from app.utils.pdf_loader import load_pdf
from app.utils.splitter import split_docs
from app.utils.vector_store import add_to_vectorstore, query_vectorstore
from app.utils.llm import get_llm

import os
import requests
import tempfile
from fastapi import HTTPException
from app.utils.pdf_loader import load_pdf
from app.utils.splitter import split_docs
from app.utils.vector_store import add_to_vectorstore, query_vectorstore
from app.utils.llm import get_llm

async def process_pdf_from_url(file_url: str, session_id: str):
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID is required.")
    
    try:
        response = requests.get(file_url, stream=True)
        response.raise_for_status() # Raise an exception for bad status codes

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
            for chunk in response.iter_content(chunk_size=8192):
                tmp_file.write(chunk)
            tmp_file_path = tmp_file.name

        try:
            docs = load_pdf(tmp_file_path)
            chunks = split_docs(docs)
            add_to_vectorstore(chunks, session_id)
        finally:
            if os.path.exists(tmp_file_path):
                os.remove(tmp_file_path)

        return {"message": "PDF processed", "chunks": len(chunks)}
    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=400, detail=f"Failed to download file: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")


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
    You are a helpful AI assistant for the RAG an open source PDF-GPT dont use formatiing symbols give plain text. You will answer user questions based on the context provided.

    CONTEXT:
    {context}

    QUESTION:
    {query}

    ANSWER:
    """

    answer = llm.invoke(prompt)
    return answer, [d.metadata for d in retriever]

from app.utils.db import delete_embeddings
from app.utils.supabase_client import supabase

async def delete_supabase_files(session_id: str):
    """Deletes all files in a session's folder from Supabase Storage."""
    if not session_id:
        return
    
    path = f"pdfs/{session_id}"
    try:
        list_response = supabase.storage.from_("pdfs").list(path)
        if list_response:
            # The list of files is in the 'data' attribute of the response
            files_to_delete = [file['name'] for file in list_response]
            if files_to_delete:
                # Add the path to the file names
                files_to_delete_with_path = [f"{path}/{file}" for file in files_to_delete]
                supabase.storage.from_("pdfs").remove(files_to_delete_with_path)
    except Exception as e:
        print(f"Error deleting files from Supabase for session {session_id}: {e}")


async def clear_embeddings(session_id: str = None, before: str = None):
    """Deletes embeddings by session_id or before a specified timestamp."""
    if not session_id and not before:
        raise HTTPException(
            status_code=400,
            detail="Either session_id or before must be provided"
        )
    
    if session_id:
        await delete_supabase_files(session_id)

    delete_embeddings(session_id=session_id, before=before)

async def reset_session(session_id: str):
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID is required.")
    await clear_embeddings(session_id=session_id)
    return {"message": f"Session {session_id} has been reset."}
