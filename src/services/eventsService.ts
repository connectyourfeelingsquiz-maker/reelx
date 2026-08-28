// src/services/eventsService.ts
import { supabase } from './supabase';
import type { SafetyEvent, GeolocationState, DeviceInfo } from '../types';

export async function submitSafetyEvent(
  linkId: string,
  geo: GeolocationState,
  device: DeviceInfo
): Promise<void> {
  const { error } = await supabase
    .from('safety_events')
    .insert({
      link_id: linkId,
      latitude: geo.latitude,
      longitude: geo.longitude,
      accuracy: geo.accuracy,
      permission_status: geo.status,
      battery_level: device.battery_level,
      device_type: device.device_type,
      browser: device.browser,
      operating_system: device.operating_system,
      user_agent: device.user_agent,
      network_information: device.network_information,
    });

  if (error) throw error;

  // Update last_triggered_at on the link (best-effort, may fail for anon)
  await supabase
    .from('safety_links')
    .update({ last_triggered_at: new Date().toISOString() })
    .eq('id', linkId);
}

export async function getEventsByLinkId(linkId: string): Promise<SafetyEvent[]> {
  const { data, error } = await supabase
    .from('safety_events')
    .select('*')
    .eq('link_id', linkId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as SafetyEvent[];
}

export async function getAllEvents(): Promise<SafetyEvent[]> {
  const { data, error } = await supabase
    .from('safety_events')
    .select(`
      *,
      safety_links (name, token)
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return data as SafetyEvent[];
}

export async function getEventById(id: string): Promise<SafetyEvent> {
  const { data, error } = await supabase
    .from('safety_events')
    .select(`
      *,
      safety_links (name, token)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as SafetyEvent;
}

export async function getDashboardStats() {
  const { data: links, error: linksError } = await supabase
    .from('safety_links')
    .select('id, status');
  if (linksError) throw linksError;

  const { count: totalEvents, error: eventsError } = await supabase
    .from('safety_events')
    .select('id', { count: 'exact', head: true });
  if (eventsError) throw eventsError;

  const total = links?.length ?? 0;
  const active = links?.filter((l) => l.status === 'active').length ?? 0;
  const disabled = links?.filter((l) => l.status === 'disabled').length ?? 0;

  return {
    totalLinks: total,
    activeLinks: active,
    disabledLinks: disabled,
    totalEvents: totalEvents ?? 0,
  };
}
