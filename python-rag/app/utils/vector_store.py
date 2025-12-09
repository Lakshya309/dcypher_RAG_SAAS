import os
import shutil
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings

emb = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

def get_vector_dir(session_id: str):
    return f"data/vectorstore/{session_id}"

def get_vectorstore(session_id: str):
    vector_dir = get_vector_dir(session_id)
    if os.path.exists(vector_dir):
        return FAISS.load_local(vector_dir, emb, allow_dangerous_deserialization=True)
    return None

def add_to_vectorstore(chunks, session_id: str):
    vector_dir = get_vector_dir(session_id)
    if os.path.exists(vector_dir):
        vs = get_vectorstore(session_id)
        if vs:
            vs.add_documents(chunks)
        else: # Should not happen if directory exists, but as a fallback
            vs = FAISS.from_documents(chunks, emb)
    else:
        os.makedirs(vector_dir)
        vs = FAISS.from_documents(chunks, emb)
    
    vs.save_local(vector_dir)

def query_vectorstore(query: str, session_id: str):
    vs = get_vectorstore(session_id)
    if vs is None:
        return []
    return vs.similarity_search(query, k=4)

def delete_vectorstore(session_id: str):
    vector_dir = get_vector_dir(session_id)
    if os.path.exists(vector_dir):
        shutil.rmtree(vector_dir)
