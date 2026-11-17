import { supabase } from './supabase';
import type { SkinAnalysis, SkinProfile, ChecklistItem, ChatMessage } from '@/types';

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
    .from('skin_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertProfile(profile: Partial<SkinProfile> & { id: string }) {
  const { data, error } = await supabase
    .from('skin_profiles')
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
/*  Chat                                                              */
/* ------------------------------------------------------------------ */

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
