-- Create albums table if not exists with nullable size column
CREATE TABLE IF NOT EXISTS public.albums (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  cover_image TEXT,
  description TEXT,
  pages JSONB DEFAULT '[]'::jsonb,
  size TEXT, -- Options: 12x36, 13x39, 14x40, 16x24, 18x24, 12x24 (nullable)
  status TEXT DEFAULT 'published',
  display_order INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

-- Ensure size column exists on existing albums table
ALTER TABLE public.albums ADD COLUMN IF NOT EXISTS size TEXT;

-- Enable Row Level Security (RLS)
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

-- Allow public read access to published albums
CREATE POLICY "Allow public read access to albums"
  ON public.albums
  FOR SELECT
  USING (true);

-- Allow authenticated admins to insert, update, and delete albums
CREATE POLICY "Allow admin full access to albums"
  ON public.albums
  FOR ALL
  USING (true)
  WITH CHECK (true);
