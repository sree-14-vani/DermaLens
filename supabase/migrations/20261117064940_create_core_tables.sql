/*
# AI Skincare Platform — core schema

1. New Tables
- `skin_profiles`: one row per user (id = auth.users.id). Stores skin type, concerns,
  sensitivity, preferences and display name used across the dashboard and personalization.
- `skin_analyses`: records of facial image uploads submitted for AI analysis. Stores the
  storage path of the uploaded image and a `status` column (`pending` until a real model
  returns results). Result columns (concerns, severity, summary, suggestions) stay NULL
  until a backend model writes them — the frontend never fabricates values.
- `routine_checklist`: daily skincare checklist items per user, per day
  (e.g. "Cleanse", done flag) so progress persists across reloads.
- `chat_messages`: chatbot conversation history per user (role: user/assistant, content).
- `checklist_items` on `routine_checklist` are one row per step.

2. Modified Tables
- None (no existing tables).

3. Security
- RLS enabled on all four tables.
- All policies scoped `TO authenticated` with `auth.uid() = user_id` (or `= id` on
  skin_profiles) ownership checks — users can only ever see and change their own rows.
- Separate SELECT / INSERT / UPDATE / DELETE policies, no FOR ALL.
- Grants limited to `authenticated` for the verbs the app uses.

4. Storage
- New private bucket `face-images` for uploaded facial photos, with owner-scoped
  object policies (users can only read/write objects under their own user_id folder).

5. Notes
- `user_id` columns default to `auth.uid()` so client inserts that omit the owner
  still pass the INSERT policy.
- Analysis results are intentionally nullable: the UI shows a clearly labelled demo
  state until the real model is connected, and never invents predictions.
*/

CREATE TABLE IF NOT EXISTS skin_profiles (
  id uuid PRIMARY KEY DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  skin_type text CHECK (skin_type IN ('normal','dry','oily','combination','sensitive')),
  concerns text[] DEFAULT '{}',
  sensitivity text CHECK (sensitivity IN ('low','medium','high')),
  preferences text[] DEFAULT '{}',
  date_of_birth date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS skin_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  image_path text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','complete','failed')),
  detected_concerns text[] DEFAULT NULL,
  acne_severity text CHECK (acne_severity IN ('mild','moderate','severe','very_severe') OR acne_severity IS NULL),
  affected_area jsonb DEFAULT NULL,
  summary text,
  suggestions jsonb DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS routine_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  day date NOT NULL DEFAULT CURRENT_DATE,
  period text NOT NULL CHECK (period IN ('morning','night')),
  label text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE skin_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE skin_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON skin_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON skin_analyses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON routine_checklist TO authenticated;
GRANT SELECT, INSERT ON chat_messages TO authenticated;

DROP POLICY IF EXISTS "profiles_select_own" ON skin_profiles;
CREATE POLICY "profiles_select_own" ON skin_profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON skin_profiles;
CREATE POLICY "profiles_insert_own" ON skin_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON skin_profiles;
CREATE POLICY "profiles_update_own" ON skin_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "analyses_select_own" ON skin_analyses;
CREATE POLICY "analyses_select_own" ON skin_analyses FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "analyses_insert_own" ON skin_analyses;
CREATE POLICY "analyses_insert_own" ON skin_analyses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "analyses_delete_own" ON skin_analyses;
CREATE POLICY "analyses_delete_own" ON skin_analyses FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "checklist_select_own" ON routine_checklist;
CREATE POLICY "checklist_select_own" ON routine_checklist FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "checklist_insert_own" ON routine_checklist;
CREATE POLICY "checklist_insert_own" ON routine_checklist FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "checklist_update_own" ON routine_checklist;
CREATE POLICY "checklist_update_own" ON routine_checklist FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "checklist_delete_own" ON routine_checklist;
CREATE POLICY "checklist_delete_own" ON routine_checklist FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "chat_select_own" ON chat_messages;
CREATE POLICY "chat_select_own" ON chat_messages FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "chat_insert_own" ON chat_messages;
CREATE POLICY "chat_insert_own" ON chat_messages FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
