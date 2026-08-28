// src/services/settingsService.ts
import { supabase } from './supabase';
import type { SafetyPageSettings } from '../types';

const DEFAULTS: Omit<SafetyPageSettings, 'id'> = {
  page_heading: 'Emergency Safety',
  page_subtitle: 'Safety link for: {link_name}',
  description: 'Your location will only be shared when you continue.',
  action_button_text: 'SHARE MY LOCATION',
  permission_help_text: 'Your browser will request permission to share your current location. Your precise location will be shared once with your authorized safety contact. You will not be tracked continuously.',
  privacy_footer_text: 'This is a consent-based, one-time location share. No hidden tracking.',
  success_message: 'Location shared successfully.',
  permission_denied_message: 'Location permission is required to continue.',
  retry_button_text: 'Try Again',
  continue_button_text: 'Continue',
};

export async function getSafetyPageSettings(): Promise<SafetyPageSettings> {
  const { data, error } = await supabase
    .from('safety_page_settings')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Failed to load safety page settings:', error);
    return { id: '', ...DEFAULTS };
  }

  if (!data) {
    return { id: '', ...DEFAULTS };
  }

  return data as SafetyPageSettings;
}

export async function updateSafetyPageSettings(
  settings: Partial<Omit<SafetyPageSettings, 'id'>>
): Promise<SafetyPageSettings> {
  // Try to get existing row
  const { data: existing } = await supabase
    .from('safety_page_settings')
    .select('id')
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('safety_page_settings')
      .update({ ...settings, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data as SafetyPageSettings;
  } else {
    const { data, error } = await supabase
      .from('safety_page_settings')
      .insert({ ...DEFAULTS, ...settings })
      .select()
      .single();
    if (error) throw error;
    return data as SafetyPageSettings;
  }
}

export { DEFAULTS as SAFETY_PAGE_DEFAULTS };
