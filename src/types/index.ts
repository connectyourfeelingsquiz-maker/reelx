// src/types/index.ts

export type LinkStatus = 'active' | 'disabled';

export interface AdminProfile {
  id: string;
  user_id: string;
  email: string;
  role: string;
  created_at: string;
}

export interface SafetyLink {
  id: string;
  token: string;
  name: string;
  destination_url: string;
  status: LinkStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_triggered_at: string | null;
}

export interface SafetyEvent {
  id: string;
  link_id: string;
  created_at: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  permission_status: string;
  battery_level: number | null;
  device_type: string | null;
  browser: string | null;
  operating_system: string | null;
  user_agent: string | null;
  network_information: Record<string, unknown> | null;
  ip_address: string | null;
  // joined
  safety_links?: { name: string; token: string };
}

export interface AuditLog {
  id: string;
  admin_user_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface GeolocationState {
  status: 'idle' | 'loading' | 'granted' | 'denied' | 'unavailable' | 'unsupported' | 'timeout' | 'error';
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
}

export interface DeviceInfo {
  device_type: string | null;
  browser: string | null;
  operating_system: string | null;
  user_agent: string | null;
  battery_level: number | null;
  network_information: Record<string, unknown> | null;
}

export interface DashboardStats {
  totalLinks: number;
  activeLinks: number;
  disabledLinks: number;
  totalEvents: number;
}

export interface SafetyPageSettings {
  id: string;
  page_heading: string;
  page_subtitle: string;
  description: string;
  action_button_text: string;
  permission_help_text: string;
  privacy_footer_text: string;
  success_message: string;
  permission_denied_message: string;
  retry_button_text: string;
  continue_button_text: string;
}
