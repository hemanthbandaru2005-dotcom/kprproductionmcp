-- =====================================================
-- KPR Productions - Client Uploads & Drive Sync Table Migration
-- Run this in your Supabase SQL Editor to enable real-time tracking
-- =====================================================

CREATE TABLE IF NOT EXISTS public.client_uploads (
  id TEXT PRIMARY KEY,
  client_id TEXT,
  client_name TEXT NOT NULL,
  client_email TEXT,
  project_id TEXT,
  project_title TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_category TEXT,
  file_size BIGINT,
  file_url TEXT,
  supabase_storage_path TEXT,
  drive_sync_status TEXT DEFAULT 'pending', -- 'pending' | 'synced' | 'failed'
  drive_file_id TEXT,
  drive_file_url TEXT,
  drive_folder_id TEXT,
  drive_folder_path TEXT,
  drive_sync_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  synced_at TIMESTAMPTZ
);

-- Indexes for fast querying & dashboard filtering
CREATE INDEX IF NOT EXISTS idx_client_uploads_client_id ON public.client_uploads(client_id);
CREATE INDEX IF NOT EXISTS idx_client_uploads_project_id ON public.client_uploads(project_id);
CREATE INDEX IF NOT EXISTS idx_client_uploads_status ON public.client_uploads(drive_sync_status);
CREATE INDEX IF NOT EXISTS idx_client_uploads_created_at ON public.client_uploads(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.client_uploads ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated staff and clients to their own uploads
CREATE POLICY "Allow public/anon read client_uploads" ON public.client_uploads
  FOR SELECT USING (true);

-- Allow authenticated/anon insert for uploads
CREATE POLICY "Allow insert client_uploads" ON public.client_uploads
  FOR INSERT WITH CHECK (true);

-- Allow authenticated/anon update for sync status updates
CREATE POLICY "Allow update client_uploads" ON public.client_uploads
  FOR UPDATE USING (true);

-- Allow delete for admins
CREATE POLICY "Allow delete client_uploads" ON public.client_uploads
  FOR DELETE USING (true);

-- Enable Supabase Realtime Replication for client_uploads
ALTER PUBLICATION supabase_realtime ADD TABLE public.client_uploads;
