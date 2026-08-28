// src/services/linksService.ts
import { supabase } from './supabase';
import type { SafetyLink } from '../types';
import { generateToken } from '../utils/tokenGenerator';

export async function createSafetyLink(name: string, destinationUrl: string): Promise<SafetyLink> {
  const session = await supabase.auth.getSession();
  const userId = session.data.session?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const token = generateToken(32);

  const { data, error } = await supabase
    .from('safety_links')
    .insert({
      token,
      name,
      destination_url: destinationUrl,
      status: 'active',
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw error;

  // Audit log
  await supabase.from('audit_logs').insert({
    admin_user_id: userId,
    action: 'create_safety_link',
    target_type: 'safety_links',
    target_id: data.id,
    metadata: { name, destination_url: destinationUrl },
  });

  return data as SafetyLink;
}

export async function getAllLinks(): Promise<SafetyLink[]> {
  const { data, error } = await supabase
    .from('safety_links')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as SafetyLink[];
}

export async function getLinkById(id: string): Promise<SafetyLink> {
  const { data, error } = await supabase
    .from('safety_links')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as SafetyLink;
}

export async function getLinkByToken(token: string): Promise<SafetyLink | null> {
  // SECURITY: Always query with exact token AND status=active. Never expose a list.
  const { data, error } = await supabase
    .from('safety_links')
    .select('id, token, name, destination_url, status')
    .eq('token', token)
    .eq('status', 'active')
    .single();

  if (error) return null;
  return data as SafetyLink;
}

export async function updateLinkStatus(id: string, status: 'active' | 'disabled'): Promise<void> {
  const session = await supabase.auth.getSession();
  const userId = session.data.session?.user?.id;

  const { error } = await supabase
    .from('safety_links')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;

  await supabase.from('audit_logs').insert({
    admin_user_id: userId,
    action: `set_link_${status}`,
    target_type: 'safety_links',
    target_id: id,
  });
}

export async function deleteLink(id: string): Promise<void> {
  const session = await supabase.auth.getSession();
  const userId = session.data.session?.user?.id;

  const { error } = await supabase.from('safety_links').delete().eq('id', id);
  if (error) throw error;

  await supabase.from('audit_logs').insert({
    admin_user_id: userId,
    action: 'delete_safety_link',
    target_type: 'safety_links',
    target_id: id,
  });
}
