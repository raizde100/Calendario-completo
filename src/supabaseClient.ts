import { createClient } from '@supabase/supabase-js';

// NOTA: Para producción, estas variables deben estar en un archivo .env
// Ejemplo: VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
// Fix: Casting import.meta to any to resolve TS error 'Property env does not exist on type ImportMeta'
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://lfzrtyhgfdsetbyebsds.supabase.co';
// Fix: Casting import.meta to any to resolve TS error 'Property env does not exist on type ImportMeta'
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmenJ0eWhnZmRzZXRieWVic2RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MzA4NTcsImV4cCI6MjA4NjAwNjg1N30.zyQhBifi5PLeUt8WscBCAe2EdIKIefRIeUIgtaMea6E';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);