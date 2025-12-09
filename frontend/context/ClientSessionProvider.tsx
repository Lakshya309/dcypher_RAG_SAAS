"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface SessionContextType {
  sessionId: string | null;
  resetSession: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);
const baseURL = process.env.NEXT_PUBLIC_API_URL


export default function SessionProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      let storedSessionId = localStorage.getItem("session_id");
      if (!storedSessionId) {
        storedSessionId = crypto.randomUUID();
        localStorage.setItem("session_id", storedSessionId);
      }
      setSessionId(storedSessionId);
    }
  }, []);

  const resetSession = async () => {
    if (!sessionId) return;
    
    // Call backend to reset the session data
    try {
        const formData = new FormData();
        formData.append("session_id", sessionId);
        const response = await fetch(`${baseURL}/api/reset`, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            console.error("Failed to reset session on the server.");
            // Decide if you want to proceed with client-side reset anyway
        }
    } catch (error) {
        console.error("Error resetting session:", error);
    }


    // Generate a new session ID and update local storage and state
    const newSessionId = crypto.randomUUID();
    localStorage.setItem("session_id", newSessionId);
    setSessionId(newSessionId);
    // Optionally, you might want to clear chat history here as well
  };

  return (
    <SessionContext.Provider value={{ sessionId, resetSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
