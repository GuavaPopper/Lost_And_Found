import { createClient } from '@supabase/supabase-js';

// Get environment variables or use hardcoded project values as a final fallback
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qxwutzfmlxdxoxbnjddq.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4d3V0emZtbHhkeG94Ym5qZGRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0MTY1MzUsImV4cCI6MjA2Mjk5MjUzNX0.kd_F0kSKwNuE5BTDBnIq4exCVacpVn-3znoP94WDY_4';

// Log for debugging purposes
console.log('Supabase URL:', supabaseUrl);

// Create client with proper URL format
export const supabase = createClient(
  supabaseUrl.startsWith('http') ? supabaseUrl : `https://${supabaseUrl}`, 
  supabaseAnonKey
);

export type Admin = {
  id_admin: string;
  nama: string;
  username: string;
  password: string;
};

export type Satpam = {
  id_satpam: string;
  nama: string;
  username: string;
  password: string;
};

export type User = {
  id_user: string;
  nama: string;
  nim_nip: string;
  username: string;
  password: string;
};

export type BarangHilang = {
  id_hilang: string;
  id_user: string;
  nama_barang: string;
  kategori: string;
  deskripsi: string;
  lokasi: string;
  tanggal_hilang: string;
  status: 'reported' | 'verified' | 'matched' | 'returned';
  image?: string;
};

export type BarangTemuan = {
  id_temuan: string;
  id_user: string;
  nama_barang: string;
  kategori: string;
  deskripsi: string;
  lokasi: string;
  tanggal_temuan: string;
  status: 'reported' | 'verified' | 'matched' | 'returned';
  image?: string;
};

export type LogAktivitas = {
  id_log: string;
  id_user: string | null;
  id_satpam: string | null;
  id_admin: string | null;
  aktivitas: string;
  timestamp: string;
}; 