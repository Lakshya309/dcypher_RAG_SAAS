"use client";

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from '@/context/ClientSessionProvider';
import { uploadPdfToSupabase } from '@/lib/supabase';
import PixelLoader from './PixelLoader';
import { fetchWithSession } from '@/lib/api';

const FileUploadCard = ({ onSuccess }: { onSuccess: () => void }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { sessionId } = useSession();
  const baseURL = process.env.NEXT_PUBLIC_API_URL

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // We only want to handle one file at a time as per the new flow
    setFiles([acceptedFiles[0]]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: false,
  });

  const removeFile = (fileName: string) => {
    setFiles(prev => prev.filter(f => f.name !== fileName));
  };

  const handleUpload = async () => {
    if (files.length === 0 || !sessionId) return;

    setIsUploading(true);
    const file = files[0];

    try {
      // 1. Upload to Supabase
      const publicUrl = await uploadPdfToSupabase(file, sessionId!);

      // 2. Send URL to backend
      const response = await fetchWithSession(`${baseURL}/api/upload`, {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId, file_url: publicUrl }),
      });

      if (!response.ok) {
        throw new Error(`Upload failed for ${file.name}`);
      }
      
      await response.json();
      setFiles([]);
      onSuccess();
    } catch (error) {
      console.error('Failed to upload files:', error);
      // Maybe show an error message
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <PixelLoader isLoading={isUploading} text="UPLOADING & PROCESSING..." />
      <div
        {...getRootProps()}
        className={`relative rounded-2xl border-2 border-dashed p-12 text-center transition-colors duration-300 ${
          isDragActive ? 'border-primary bg-accent' : 'border-border hover:border-primary/50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-4">
          <UploadCloud className="h-16 w-16 text-muted-foreground" />
          <p className="text-lg font-semibold" style={{fontFamily: 'var(--font-geist-sans)'}}>
            {isDragActive ? 'Drop the PDF here...' : "Drag 'n' drop a PDF here, or click to select a file"}
          </p>
          <p className="text-sm text-muted-foreground" style={{fontFamily: 'var(--font-geist-sans)'}}>
            Only .pdf files are supported.
          </p>
        </div>
      </div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div 
            className="mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h3 className="font-sans text-lg font-bold">Selected File:</h3>
            <ul className="mt-4 space-y-2">
              <AnimatePresence>
                {files.map(file => (
                  <motion.li
                    key={file.name}
                    className="flex items-center justify-between rounded-lg border bg-card p-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium" style={{fontFamily: 'var(--font-geist-sans)'}}>{file.name}</span>
                    </div>
                    <button onClick={() => removeFile(file.name)} className="text-muted-foreground hover:text-destructive">
                      <X className="h-5 w-5" />
                    </button>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
            <Button
              onClick={handleUpload}
              disabled={isUploading || files.length === 0}
              className="mt-6 w-full rounded-full"
              size="lg"
            >
              {isUploading ? 'Uploading...' : `Upload 1 File`}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileUploadCard;
