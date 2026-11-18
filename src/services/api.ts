import { supabase } from './supabase';
import type {
  SkinAnalysis,
  SkinProfile,
  ChecklistItem,
  ChatMessage,
  AnalysisRegionResult,
  EnhancementRecord,
  Routine,
  RoutineStep,
  RoutineCompletion,
  BeautyTip,
  DietPlan,
  NotificationItem,
  NotificationPreference,
} from '@/types';

/* ------------------------------------------------------------------ */
/*  Auth                                                              */
/* ------------------------------------------------------------------ */

export async function registerWithEmail(email: string, password: string, fullName: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) throw error;
  return data;
}

export async function loginWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/* ------------------------------------------------------------------ */
/*  Skin profile                                                      */
/* ------------------------------------------------------------------ */

export async function getProfile(userId: string): Promise<SkinProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertProfile(profile: Partial<SkinProfile> & { id: string }) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/* ------------------------------------------------------------------ */
/*  Analyses + image storage                                          */
/* ------------------------------------------------------------------ */

export async function uploadFaceImage(userId: string, file: File): Promise<string> {
  const path = `${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  const { error } = await supabase.storage
    .from('face-images')
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return path;
}

export async function createAnalysis(imagePath: string): Promise<SkinAnalysis> {
  const { data, error } = await supabase
    .from('skin_analyses')
    .insert({ image_path: imagePath })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listAnalyses(): Promise<SkinAnalysis[]> {
  const { data, error } = await supabase
    .from('skin_analyses')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getAnalysis(id: string): Promise<SkinAnalysis | null> {
  const { data, error } = await supabase
    .from('skin_analyses')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteAnalysis(id: string) {
  const { error } = await supabase.from('skin_analyses').delete().eq('id', id);
  if (error) throw error;
}

export async function getSignedImageUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('face-images').createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
}

/* ------------------------------------------------------------------ */
/*  Routine checklist                                                 */
/* ------------------------------------------------------------------ */

export async function listChecklist(day: string): Promise<ChecklistItem[]> {
  const { data, error } = await supabase
    .from('routine_checklist')
    .select('*')
    .eq('day', day)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function addChecklistItem(period: 'morning' | 'night', label: string): Promise<ChecklistItem> {
  const { data, error } = await supabase
    .from('routine_checklist')
    .insert({ period, label })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function toggleChecklistItem(id: string, done: boolean) {
  const { error } = await supabase.from('routine_checklist').update({ done }).eq('id', id);
  if (error) throw error;
}

export async function removeChecklistItem(id: string) {
  const { error } = await supabase.from('routine_checklist').delete().eq('id', id);
  if (error) throw error;
}

/* ------------------------------------------------------------------ */
/*  Analysis regions                                                  */
/* ------------------------------------------------------------------ */

export async function listAnalysisRegions(analysisId: string): Promise<AnalysisRegionResult[]> {
  const { data, error } = await supabase
    .from('skin_analysis_regions')
    .select('region, findings, severity, confidence, spots')
    .eq('analysis_id', analysisId);
  if (error) throw error;
  return data ?? [];
}

/* ------------------------------------------------------------------ */
/*  Enhancements                                                      */
/* ------------------------------------------------------------------ */

export async function createEnhancement(originalPath: string): Promise<EnhancementRecord> {
  const { data, error } = await supabase
    .from('image_enhancements')
    .insert({ original_path: originalPath })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function completeEnhancement(id: string, enhancedPath: string) {
  const { error } = await supabase
    .from('image_enhancements')
    .update({ enhanced_path: enhancedPath, status: 'complete' })
    .eq('id', id);
  if (error) throw error;
}

export async function failEnhancement(id: string) {
  const { error } = await supabase
    .from('image_enhancements')
    .update({ status: 'failed' })
    .eq('id', id);
  if (error) throw error;
}

export async function listEnhancements(): Promise<EnhancementRecord[]> {
  const { data, error } = await supabase
    .from('image_enhancements')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/* ------------------------------------------------------------------ */
/*  Routines                                                          */
/* ------------------------------------------------------------------ */

export async function listRoutines(): Promise<Routine[]> {
  const { data, error } = await supabase
    .from('skincare_routines')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({ ...r, steps: r.steps ?? [] }));
}

export async function saveRoutine(period: 'morning' | 'night', steps: RoutineStep[], source: Routine['source'] = 'custom'): Promise<Routine> {
  const { data, error } = await supabase
    .from('skincare_routines')
    .insert({ period, steps, source })
    .select()
    .single();
  if (error) throw error;
  return { ...data, steps: data.steps ?? [] };
}

export async function updateRoutine(id: string, steps: RoutineStep[]) {
  const { error } = await supabase
    .from('skincare_routines')
    .update({ steps, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteRoutine(id: string) {
  const { error } = await supabase.from('skincare_routines').delete().eq('id', id);
  if (error) throw error;
}

export async function listCompletions(day: string): Promise<RoutineCompletion[]> {
  const { data, error } = await supabase
    .from('routine_completions')
    .select('routine_id, step_index, day, done')
    .eq('day', day);
  if (error) throw error;
  return data ?? [];
}

export async function setCompletion(routineId: string, stepIndex: number, day: string, done: boolean) {
  const { error } = await supabase
    .from('routine_completions')
    .upsert({ routine_id: routineId, step_index: stepIndex, day, done }, { onConflict: 'routine_id,step_index,day' });
  if (error) throw error;
}

/* ------------------------------------------------------------------ */
/*  Tips                                                              */
/* ------------------------------------------------------------------ */

export async function listTips(): Promise<BeautyTip[]> {
  const { data, error } = await supabase.from('beauty_tips').select('*').order('category');
  if (error) throw error;
  return data ?? [];
}

export async function listSavedTips(): Promise<string[]> {
  const { data, error } = await supabase.from('saved_tips').select('tip_id');
  if (error) throw error;
  return (data ?? []).map((t) => t.tip_id);
}

export async function saveTip(tipId: string) {
  const { error } = await supabase.from('saved_tips').insert({ tip_id: tipId });
  if (error && error.code !== '23505') throw error;
}

export async function unsaveTip(tipId: string) {
  const { error } = await supabase.from('saved_tips').delete().eq('tip_id', tipId);
  if (error) throw error;
}

/* ------------------------------------------------------------------ */
/*  Diet plans                                                        */
/* ------------------------------------------------------------------ */

export async function listDietPlans(): Promise<DietPlan[]> {
  const { data, error } = await supabase
    .from('diet_plans')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function saveDietPlan(preference: DietPlan['preference'], plan: Record<string, string[]>, dayLabel?: string): Promise<DietPlan> {
  const { data, error } = await supabase
    .from('diet_plans')
    .insert({ preference, plan, day_label: dayLabel ?? null })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDietPlan(id: string) {
  const { error } = await supabase.from('diet_plans').delete().eq('id', id);
  if (error) throw error;
}

/* ------------------------------------------------------------------ */
/*  Notifications                                                     */
/* ------------------------------------------------------------------ */

export async function listNotifications(): Promise<NotificationItem[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function markNotificationRead(id: string, read = true) {
  const { error } = await supabase.from('notifications').update({ read }).eq('id', id);
  if (error) throw error;
}

export async function markAllNotificationsRead() {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('read', false);
  if (error) throw error;
}

export async function listNotificationPrefs(): Promise<NotificationPreference[]> {
  const { data, error } = await supabase.from('notification_preferences').select('*');
  if (error) throw error;
  return data ?? [];
}

export async function upsertNotificationPref(pref: NotificationPreference) {
  const { error } = await supabase
    .from('notification_preferences')
    .upsert(pref, { onConflict: 'user_id,type' });
  if (error) throw error;
}

/* ------------------------------------------------------------------ */
/*  Account deletion                                                  */
/* ------------------------------------------------------------------ */

export async function deleteAccount() {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (!token) throw new Error('Not signed in.');
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? 'Could not delete your account.');
  }
  await supabase.auth.signOut();
}

export async function listChatMessages(): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function saveChatMessage(role: 'user' | 'assistant', content: string): Promise<ChatMessage> {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({ role, content })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function clearChat() {
  const { error } = await supabase.from('chat_messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw error;
}
