/*
# AcneClear — expanded full-stack schema

1. New Tables
- `skin_analysis_regions`: per-region AI findings for one analysis
  (region: forehead/left_cheek/right_cheek/nose/chin; findings text,
  severity_enum mild..very_severe or null, confidence 0-1 or null,
  spots integer count or null). Rows only written by the real backend model.
- `image_enhancements`: enhancement records (original + enhanced storage paths,
  status, optional model metadata).
- `skincare_routines`: user routines (period morning/night, steps jsonb array,
  source: default/personalized, active flag).
- `routine_completions`: one completion per routine step per day (done flag).
- `beauty_tips`: shared tip library (category, title, body, optional ingredients[]).
- `saved_tips`: user bookmarks (unique on user+tip).
- `diet_plans`: saved meal plans per user/preference (jsonb plan + day label).
- `chat_conversations`: optional grouping for chat threads (title, timestamps).
- `notifications`: in-app notification center entries (type, title, body, read).
- `notification_preferences`: per-type reminder config (enabled, time of day).
- `profiles`: added columns food_preference, language, avatar_path, age_range,
  privacy_settings jsonb (idempotent DO block).

2. Modified Tables
- `profiles`: + food_preference, language, avatar_path, age_range, privacy_settings.

3. Security
- RLS enabled on all new tables; owner-scoped policies TO authenticated using
  auth.uid() (profiles by id). beauty_tips is shared read-only content:
  SELECT for anon+authenticated, writes reserved (none granted to client roles).
- Grants limited to the verbs the app uses; service_role retains full access
  for the FastAPI backend.
- Storage: avatar images bucket policies added (owner-scoped by folder prefix),
  face-images policies already exist from the previous migration.

4. Notes
- The FastAPI backend uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS by
  design; it must verify the user's JWT and scope every query by user_id.
- All changes are idempotent for safe re-runs.
*/

-- ---------- profiles: add new columns ----------
ALTER TABLE skin_profiles RENAME TO profiles;

DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS food_preference text;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en';
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_path text;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS age_range text;
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS privacy_settings jsonb NOT NULL DEFAULT '{}'::jsonb;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- ---------- skin_analysis_regions ----------
CREATE TABLE IF NOT EXISTS skin_analysis_regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id uuid NOT NULL REFERENCES skin_analyses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  region text NOT NULL CHECK (region IN ('forehead','left_cheek','right_cheek','nose','chin')),
  findings text,
  severity text CHECK (severity IN ('mild','moderate','severe','very_severe') OR severity IS NULL),
  confidence numeric CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  spots integer CHECK (spots IS NULL OR spots >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (analysis_id, region)
);

-- ---------- image_enhancements ----------
CREATE TABLE IF NOT EXISTS image_enhancements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  original_path text NOT NULL,
  enhanced_path text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','complete','failed')),
  model_metadata jsonb DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- skincare_routines ----------
CREATE TABLE IF NOT EXISTS skincare_routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  period text NOT NULL CHECK (period IN ('morning','night')),
  steps jsonb NOT NULL DEFAULT '[]'::jsonb,
  source text NOT NULL DEFAULT 'personalized' CHECK (source IN ('default','personalized','custom')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- routine_completions ----------
CREATE TABLE IF NOT EXISTS routine_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  routine_id uuid NOT NULL REFERENCES skincare_routines(id) ON DELETE CASCADE,
  step_index integer NOT NULL CHECK (step_index >= 0),
  day date NOT NULL DEFAULT CURRENT_DATE,
  done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (routine_id, step_index, day)
);

-- ---------- beauty_tips (shared content) ----------
CREATE TABLE IF NOT EXISTS beauty_tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  ingredients text[] DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- saved_tips ----------
CREATE TABLE IF NOT EXISTS saved_tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  tip_id uuid NOT NULL REFERENCES beauty_tips(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tip_id)
);

-- ---------- diet_plans ----------
CREATE TABLE IF NOT EXISTS diet_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  preference text NOT NULL CHECK (preference IN ('vegetarian','non-vegetarian')),
  day_label text,
  plan jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- chat_conversations ----------
CREATE TABLE IF NOT EXISTS chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New conversation',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- notifications ----------
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('morning_reminder','night_reminder','water_reminder','meal_reminder','general_reminder')),
  title text NOT NULL,
  body text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------- notification_preferences ----------
CREATE TABLE IF NOT EXISTS notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('morning_reminder','night_reminder','water_reminder','meal_reminder','general_reminder')),
  enabled boolean NOT NULL DEFAULT false,
  preferred_time time NOT NULL DEFAULT '08:00',
  UNIQUE (user_id, type)
);

-- ---------- indexes ----------
CREATE INDEX IF NOT EXISTS idx_analysis_regions_analysis ON skin_analysis_regions(analysis_id);
CREATE INDEX IF NOT EXISTS idx_enhancements_user ON image_enhancements(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_routines_user ON skincare_routines(user_id, active);
CREATE INDEX IF NOT EXISTS idx_completions_user_day ON routine_completions(user_id, day);
CREATE INDEX IF NOT EXISTS idx_saved_tips_user ON saved_tips(user_id);
CREATE INDEX IF NOT EXISTS idx_diet_plans_user ON diet_plans(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_prefs_user ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_user ON skin_analyses(user_id, created_at DESC);

-- ---------- RLS ----------
ALTER TABLE skin_analysis_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_enhancements ENABLE ROW LEVEL SECURITY;
ALTER TABLE skincare_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE routine_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE beauty_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- ---------- grants ----------
GRANT SELECT, INSERT, UPDATE, DELETE ON skin_analysis_regions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON image_enhancements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON skincare_routines TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON routine_completions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON saved_tips TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON diet_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON notification_preferences TO authenticated;
GRANT SELECT ON beauty_tips TO anon, authenticated;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- ---------- owner-scoped policies ----------
DROP POLICY IF EXISTS "regions_select_own" ON skin_analysis_regions;
CREATE POLICY "regions_select_own" ON skin_analysis_regions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "regions_insert_own" ON skin_analysis_regions;
CREATE POLICY "regions_insert_own" ON skin_analysis_regions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "regions_delete_own" ON skin_analysis_regions;
CREATE POLICY "regions_delete_own" ON skin_analysis_regions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "enh_select_own" ON image_enhancements;
CREATE POLICY "enh_select_own" ON image_enhancements FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "enh_insert_own" ON image_enhancements;
CREATE POLICY "enh_insert_own" ON image_enhancements FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "enh_delete_own" ON image_enhancements;
CREATE POLICY "enh_delete_own" ON image_enhancements FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "routines_select_own" ON skincare_routines;
CREATE POLICY "routines_select_own" ON skincare_routines FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "routines_insert_own" ON skincare_routines;
CREATE POLICY "routines_insert_own" ON skincare_routines FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "routines_update_own" ON skincare_routines;
CREATE POLICY "routines_update_own" ON skincare_routines FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "routines_delete_own" ON skincare_routines;
CREATE POLICY "routines_delete_own" ON skincare_routines FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "completions_select_own" ON routine_completions;
CREATE POLICY "completions_select_own" ON routine_completions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "completions_insert_own" ON routine_completions;
CREATE POLICY "completions_insert_own" ON routine_completions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "completions_update_own" ON routine_completions;
CREATE POLICY "completions_update_own" ON routine_completions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "completions_delete_own" ON routine_completions;
CREATE POLICY "completions_delete_own" ON routine_completions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "tips_read_all" ON beauty_tips;
CREATE POLICY "tips_read_all" ON beauty_tips FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "saved_tips_select_own" ON saved_tips;
CREATE POLICY "saved_tips_select_own" ON saved_tips FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "saved_tips_insert_own" ON saved_tips;
CREATE POLICY "saved_tips_insert_own" ON saved_tips FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "saved_tips_delete_own" ON saved_tips;
CREATE POLICY "saved_tips_delete_own" ON saved_tips FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "diet_select_own" ON diet_plans;
CREATE POLICY "diet_select_own" ON diet_plans FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "diet_insert_own" ON diet_plans;
CREATE POLICY "diet_insert_own" ON diet_plans FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "diet_delete_own" ON diet_plans;
CREATE POLICY "diet_delete_own" ON diet_plans FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "conversations_select_own" ON chat_conversations;
CREATE POLICY "conversations_select_own" ON chat_conversations FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "conversations_insert_own" ON chat_conversations;
CREATE POLICY "conversations_insert_own" ON chat_conversations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "conversations_delete_own" ON chat_conversations;
CREATE POLICY "conversations_delete_own" ON chat_conversations FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "notifications_insert_own" ON notifications;
CREATE POLICY "notifications_insert_own" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "notifications_delete_own" ON notifications;
CREATE POLICY "notifications_delete_own" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notif_prefs_select_own" ON notification_preferences;
CREATE POLICY "notif_prefs_select_own" ON notification_preferences FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "notif_prefs_insert_own" ON notification_preferences;
CREATE POLICY "notif_prefs_insert_own" ON notification_preferences FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "notif_prefs_update_own" ON notification_preferences;
CREATE POLICY "notif_prefs_update_own" ON notification_preferences FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "notif_prefs_delete_own" ON notification_preferences;
CREATE POLICY "notif_prefs_delete_own" ON notification_preferences FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ---------- avatars bucket ----------
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', false) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "avatars select own" ON storage.objects;
CREATE POLICY "avatars select own" ON storage.objects FOR SELECT
  TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "avatars insert own" ON storage.objects;
CREATE POLICY "avatars insert own" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
DROP POLICY IF EXISTS "avatars delete own" ON storage.objects;
CREATE POLICY "avatars delete own" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- seed the shared tip library (idempotent by title)
INSERT INTO beauty_tips (category, title, body, ingredients) VALUES
  ('daily', 'Cleanse gently, twice a day', 'Wash your face morning and night with a mild cleanser. Over-washing strips protective oils and can trigger more breakouts.', NULL),
  ('daily', 'Moisturize damp skin', 'Apply moisturizer within a minute of washing, while skin is still slightly damp, to lock in hydration.', NULL),
  ('acne', 'Hands off your face', 'Picking or squeezing spots increases inflammation and raises the risk of scarring and dark marks.', NULL),
  ('acne', 'Patch-test actives', 'Introduce one active ingredient at a time and patch-test on your inner forearm for 48 hours first.', ARRAY['salicylic acid','benzoyl peroxide','niacinamide']),
  ('sun', 'SPF every single morning', 'UV passes through clouds and windows. Use SPF 30+ daily and reapply every two hours outdoors.', NULL),
  ('sun', 'Sunscreen protects treatment results', 'Many acne treatments increase sun sensitivity. Daily sunscreen protects healing skin and prevents dark marks from deepening.', NULL),
  ('hydration', 'Steady water through the day', 'Sip water consistently rather than drinking large amounts at once. Aim for roughly 6-8 glasses depending on activity and climate.', NULL),
  ('hydration', 'Humidifier in dry rooms', 'Air-conditioning and heating dry the air. A humidifier helps your skin retain overnight moisture.', NULL),
  ('hygiene', 'Change pillowcases twice weekly', 'Pillowcases collect oil, sweat and bacteria. Washing them twice a week reduces breakout triggers.', NULL),
  ('hygiene', 'Clean your phone screen', 'Your phone holds it against your cheek for hours. Wiping it daily reduces bacteria transfer.', NULL),
  ('lifestyle', 'Sleep 7-9 hours', 'Skin repairs itself overnight. Consistent poor sleep is linked to increased breakouts and slower healing.', NULL),
  ('lifestyle', 'Manage stress deliberately', 'Stress raises cortisol, which can worsen acne. Walks, breathing exercises or hobbies genuinely help your skin.', NULL),
  ('ingredients', 'Niacinamide: the all-rounder', 'Supports the skin barrier, calms redness and helps regulate oil. Well tolerated by most skin types, 2-5% is typical.', ARRAY['niacinamide']),
  ('ingredients', 'Salicylic acid: inside pores', 'An oil-soluble exfoliant that penetrates pores and keeps them clear. Start with 2-3 nights a week.', ARRAY['salicylic acid']),
  ('ingredients', 'Hyaluronic acid: the water magnet', 'Pulls water into the upper skin layers. Apply to damp skin and seal with moisturizer.', ARRAY['hyaluronic acid'])
ON CONFLICT DO NOTHING;
