/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tzoykojwzzznhdaqysxq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6b3lrb2p3enp6bmhkYXF5c3hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMTg4MjEsImV4cCI6MjA4ODc5NDgyMX0.I1fq2uZqD0yLOwJScKcpacslDiYE94fLwZUDrRbRRug';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
