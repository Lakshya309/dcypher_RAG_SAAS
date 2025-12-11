"use client";
import React, { useState, useRef, useEffect } from 'react';
import ChatBubble from '@/components/shared/ChatBubble';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, RotateCcw, Paperclip } from 'lucide-react';
import FileUploadCard from '@/components/shared/FileUploadCard';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchWithSession } from '@/lib/api';
import { useSession } from '@/context/ClientSessionProvider';
import PixelLoader from '@/components/shared/PixelLoader';
import { uploadPdfToSupabase } from '@/lib/supabase';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type View = 'upload' | 'chat';

const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! How can I help you with your documents today?" }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [view, setView] = useState<View>('upload');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const baseURL = process.env.NEXT_PUBLIC_API_URL;
  const { sessionId, resetSession } = useSession();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage: Message = { role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    const currentQuery = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      const formData = new URLSearchParams();
      formData.append('query', currentQuery);

      const response = await fetchWithSession(`${baseURL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      const assistantMessage: Message = { role: 'assistant', content: data.answer };
      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error("Failed to fetch from chat API:", error);
      const errorMessage: Message = { role: 'assistant', content: "Sorry, I couldn't connect to the server. Please try again later." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const onFileUploadSuccess = () => {
    setView('chat');
  };

  const handleReset = () => {
    resetSession();
    setMessages([
      { role: 'assistant', content: "Session has been reset. Please upload new documents." }
    ]);
    setView('upload');
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      // First, upload to Supabase
      const publicUrl = await uploadPdfToSupabase(file, sessionId!);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `Successfully uploaded ${file.name} to storage. Now processing...` }
      ]);

      // Then, send the URL to the backend for processing
      const response = await fetchWithSession(`${baseURL}/api/upload`, {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId, file_url: publicUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to process PDF on the backend.');
      }

      const result = await response.json();
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `PDF processed successfully. ${result.chunks} chunks created.` }
      ]);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during upload.';
      setUploadError(errorMessage);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `An error occurred: ${errorMessage}` }
      ]);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const pageVariants = {
    initial: { opacity: 0, x: '-100vw' },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: '100vw' }
  };

  const pageTransition = {
    type: 'tween' as const,
    ease: 'anticipate' as const,
    duration: 0.8
  };

  return (
    <div className="container mx-auto max-w-8xl h-[calc(100vh-120px)] flex flex-col py-4 overflow-hidden">
      <PixelLoader isLoading={isUploading} text="UPLOADING PDF..." />
      <AnimatePresence mode="wait">
        {view === 'upload' && (
          <motion.div
            key="upload"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="h-full flex flex-col justify-center"
          >
            <div className="text-center mb-12">
              <h1 className="font-sans text-4xl font-bold tracking-tighter">Manage Your Knowledge Base</h1>
              <p className="mt-2 font-cursive text-xl text-purple-dark">
                Upload, view, and manage the documents that power your chat experience.
              </p>
            </div>
            <FileUploadCard onSuccess={onFileUploadSuccess} />
          </motion.div>
        )}

        {view === 'chat' && (
          <motion.div
            key="chat"
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="flex flex-col h-full"
          >
            <div className="flex-1 overflow-y-auto pr-4 min-h-0">
              {messages.map((msg, index) => (
                <ChatBubble key={index} message={msg} />
              ))}
              {isLoading && <ChatBubble message={{ role: 'assistant', content: '...' }} />}
              {uploadError && <p className="text-red-500 text-sm text-center mt-2">{uploadError}</p>}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="mt-4 flex items-center gap-2 pt-2 border-t bg-background z-10">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                className="rounded-full w-10 h-10 p-2"
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="application/pdf"
                disabled={isUploading}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-full w-10 h-10 p-2"
                disabled={isUploading}
              >
                <Paperclip className="h-5 w-5" />
              </Button>
              <Input
                type="text"
                placeholder="Type your message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="flex-1 rounded-full"
                style={{ fontFamily: 'var(--font-geist-sans)' }}
                disabled={isLoading || isUploading}
              />
              <Button
                type="submit"
                className="rounded-full w-10 h-10 p-2"
                disabled={isLoading || isUploading}
              >
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatPage;