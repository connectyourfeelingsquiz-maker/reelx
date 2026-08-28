// src/services/authService.ts
import { supabase } from './supabase';

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function ensureAdminProfile(userId: string, email: string) {
  // Check if admin profile exists
  const { data: existing } = await supabase
    .from('admin_profiles')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!existing) {
    // Create admin profile on first login
    const { error } = await supabase.from('admin_profiles').insert({
      user_id: userId,
      email,
      role: 'admin',
    });
    if (error) {
      console.error('[SafetyLink] Failed to create admin profile:', error.message);
    }
  }
}
