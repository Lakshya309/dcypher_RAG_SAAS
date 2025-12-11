// frontend/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// IMPORTANT: Replace with your actual Supabase URL and Anon Key
// You should store these in your .env.local file and use process.env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase URL or Anon Key is missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.'
  );
}

// Initialize the Supabase client
export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);

/**
 * Uploads a PDF file to the 'pdfs' bucket in Supabase Storage.
 *
 * @param file The PDF file to upload.
 * @returns The public URL of the uploaded file.
 * @throws An error if the file is not a PDF or if the upload fails.
 */
export async function uploadPdfToSupabase(file: File, sessionId: string): Promise<string> {
  // 1. Validate file type
  if (file.type !== 'application/pdf') {
    throw new Error('Invalid file type. Only PDF files are allowed.');
  }

  // 2. Generate a unique file name and path including session_id
  const fileName = `${uuidv4()}.pdf`;
  const filePath = `pdfs/${sessionId}/${fileName}`;

  // 3. Upload the file
  const { error } = await supabase.storage.from('pdfs').upload(filePath, file);

  if (error) {
    console.error('Supabase upload error:', error);
    throw new Error('Failed to upload PDF to Supabase.');
  }

  // 4. Get the public URL
  const { data } = supabase.storage.from('pdfs').getPublicUrl(filePath);

  if (!data.publicUrl) {
    throw new Error('Failed to get public URL for the uploaded PDF.');
  }

  return data.publicUrl;
}

/**
 * Retrieves the public URL for a file from the 'pdfs' bucket.
 *
 * @param fileName The name of the file in the 'pdfs' bucket.
 * @returns The public URL of the file.
 * @throws An error if the file URL cannot be retrieved.
 */
export function getPdfFromSupabase(fileName: string): string {
  const { data } = supabase.storage.from('pdfs').getPublicUrl(`pdfs/${fileName}`);

  if (!data.publicUrl) {
    throw new Error('Failed to get public URL for the specified PDF.');
  }

  return data.publicUrl;
}
