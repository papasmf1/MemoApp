-- Web Notepad (웹 메모장) Supabase Database Schema
-- Run this in the Supabase SQL Editor to set up tables and RLS policies.

-- 1. Enable pgcrypto for UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create 'notes' table
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ NULL,
  share_token TEXT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create 'tags' table
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tags_user_id_name_key UNIQUE (user_id, name)
);

-- 4. Create 'note_tags' join table
CREATE TABLE IF NOT EXISTS public.note_tags (
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (note_id, tag_id)
);

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notes_user_deleted_updated
  ON public.notes(user_id, deleted_at, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_notes_user_pinned
  ON public.notes(user_id, is_pinned);

CREATE INDEX IF NOT EXISTS idx_notes_share_token
  ON public.notes(share_token)
  WHERE share_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tags_user
  ON public.tags(user_id);

CREATE INDEX IF NOT EXISTS idx_note_tags_tag_id
  ON public.note_tags(tag_id);

-- 6. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notes_updated_at ON public.notes;
CREATE TRIGGER trigger_notes_updated_at
  BEFORE UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Row Level Security (RLS)
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_tags ENABLE ROW LEVEL SECURITY;

-- Notes Policies
DROP POLICY IF EXISTS "Users can view own notes or shared active notes" ON public.notes;
CREATE POLICY "Users can view own notes or shared active notes"
  ON public.notes FOR SELECT
  USING (
    auth.uid() = user_id
    OR (share_token IS NOT NULL AND deleted_at IS NULL)
  );

DROP POLICY IF EXISTS "Users can create own notes" ON public.notes;
CREATE POLICY "Users can create own notes"
  ON public.notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notes" ON public.notes;
CREATE POLICY "Users can update own notes"
  ON public.notes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notes" ON public.notes;
CREATE POLICY "Users can delete own notes"
  ON public.notes FOR DELETE
  USING (auth.uid() = user_id);

-- Tags Policies
DROP POLICY IF EXISTS "Users can view own tags" ON public.tags;
CREATE POLICY "Users can view own tags"
  ON public.tags FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own tags" ON public.tags;
CREATE POLICY "Users can create own tags"
  ON public.tags FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tags" ON public.tags;
CREATE POLICY "Users can update own tags"
  ON public.tags FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own tags" ON public.tags;
CREATE POLICY "Users can delete own tags"
  ON public.tags FOR DELETE
  USING (auth.uid() = user_id);

-- Note Tags Policies
DROP POLICY IF EXISTS "Users can view note_tags for own notes" ON public.note_tags;
CREATE POLICY "Users can view note_tags for own notes"
  ON public.note_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.notes
      WHERE notes.id = note_tags.note_id
      AND (notes.user_id = auth.uid() OR (notes.share_token IS NOT NULL AND notes.deleted_at IS NULL))
    )
  );

DROP POLICY IF EXISTS "Users can manage note_tags for own notes" ON public.note_tags;
CREATE POLICY "Users can manage note_tags for own notes"
  ON public.note_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.notes
      WHERE notes.id = note_tags.note_id
      AND notes.user_id = auth.uid()
    )
  );
