// src/utils/deviceInfo.ts
import type { DeviceInfo } from '../types';

function detectBrowser(ua: string): string {
  if (/Edg\//.test(ua)) return 'Microsoft Edge';
  if (/OPR\/|Opera/.test(ua)) return 'Opera';
  if (/Chrome\//.test(ua) && !/Chromium\//.test(ua)) return 'Chrome';
  if (/Chromium\//.test(ua)) return 'Chromium';
  if (/Firefox\//.test(ua)) return 'Firefox';
  if (/Safari\//.test(ua) && !/Chrome/.test(ua)) return 'Safari';
  if (/MSIE|Trident/.test(ua)) return 'Internet Explorer';
  return 'Unknown Browser';
}

function detectOS(ua: string): string {
  if (/Windows NT 10/.test(ua)) return 'Windows 10/11';
  if (/Windows NT 6\.3/.test(ua)) return 'Windows 8.1';
  if (/Windows NT 6\.1/.test(ua)) return 'Windows 7';
  if (/Windows/.test(ua)) return 'Windows';
  if (/iPhone OS/.test(ua)) return 'iOS';
  if (/iPad/.test(ua)) return 'iPadOS';
  if (/Android/.test(ua)) return 'Android';
  if (/Mac OS X/.test(ua)) return 'macOS';
  if (/Linux/.test(ua)) return 'Linux';
  return 'Unknown OS';
}

function detectDeviceType(ua: string): string {
  if (/iPhone|Android.*Mobile|Windows Phone/.test(ua)) return 'Mobile';
  if (/iPad|Android(?!.*Mobile)/.test(ua)) return 'Tablet';
  return 'Desktop';
}

export async function collectDeviceInfo(): Promise<DeviceInfo> {
  const ua = navigator.userAgent || '';
  const browser = detectBrowser(ua);
  const operating_system = detectOS(ua);
  const device_type = detectDeviceType(ua);

  // Battery API - optional, gracefully degrade
  let battery_level: number | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nav = navigator as any;
    if (nav.getBattery) {
      const battery = await nav.getBattery();
      battery_level = typeof battery.level === 'number' ? battery.level : null;
    }
  } catch {
    battery_level = null;
  }

  // Network Information API - optional, gracefully degrade
  let network_information: Record<string, unknown> | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (conn) {
      network_information = {
        effectiveType: conn.effectiveType ?? null,
        downlink: conn.downlink ?? null,
        rtt: conn.rtt ?? null,
        saveData: conn.saveData ?? null,
      };
    }
  } catch {
    network_information = null;
  }

  return {
    device_type,
    browser,
    operating_system,
    user_agent: ua.substring(0, 500), // cap length
    battery_level,
    network_information,
  };
}
