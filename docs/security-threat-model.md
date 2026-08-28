# Security Threat Model: Emergency Safety Link Platform

## 1. Introduction
This document outlines the threat model for the Emergency Safety Link Platform, specifically focusing on the risks of covert tracking and the defensive measures implemented to prevent unauthorized location data collection. The platform's objective is to enable explicit, consent-based location sharing during emergencies.

## 2. Threat Definition: Covert Tracking
**Covert tracking** refers to the collection of a user's location or device information without their explicit, informed, and ongoing consent. This includes:
- Silent location collection in the background.
- Deceptive UI patterns (dark patterns) that trick users into granting permissions.
- Exploiting browser or OS vulnerabilities to bypass permission prompts.
- Persistently tracking a user after the initial emergency event has concluded.

### 2.1 Why it is dangerous
Covert tracking violates user privacy and can enable stalking, harassment, and unauthorized surveillance. In an emergency context, trust is paramount; any suspicion of hidden tracking can deter users from utilizing safety tools when they need them most.

## 3. Defensive Protections and Mitigations

### 3.1 Browser Permission Protections
Modern web browsers (Chrome, Firefox, Safari, Edge) enforce strict security boundaries around the Geolocation API:
- **Explicit Prompt:** The browser inherently requires an explicit user interaction (usually a prompt) before granting location access to a website.
- **Secure Context (HTTPS):** The Geolocation API is only available in secure contexts (HTTPS). The platform enforces HTTPS.
- **Visibility:** Browsers display a visible indicator (often a location pin icon in the URL bar or status bar) when location is actively being accessed.

**Platform Implementation:** The application relies entirely on the standard `navigator.geolocation` API. It does not attempt to use IP-based geolocation or other workarounds if browser permission is denied.

### 3.2 OS-Level Protections
Mobile operating systems (iOS, Android) provide an additional layer of defense:
- **Granular Permissions:** Users can grant location access "While Using the App", "Allow Once", or "Don't Allow".
- **Background Restrictions:** Web browsers on mobile OSs are generally restricted from accessing location in the background.
- **System Indicators:** The OS displays prominent indicators (e.g., a blue bar or green dot) when location is in use.

### 3.3 Protection Against Malicious Links and Deceptive UI
- **Clear Intent:** The UI explicitly states "Your location will be shared with the authorized safety contact."
- **No Autoplay/Autofetch:** Location is only requested *after* the user explicitly clicks the "SHARE MY LOCATION" button.
- **Unique, Cryptographic Tokens:** Safety links use cryptographically random UUIDs (`/s/:token`). This prevents attackers from guessing link URLs and brute-forcing location requests.
- **Link Status:** Links can be disabled by the administrator, immediately preventing any further location sharing through that link.

### 3.4 Data Minimization and Retention
- **Event-Driven Collection:** Location is collected as a discrete "event" (a single point in time), not as a continuous stream.
- **Limited Scope:** Only legitimately available browser information (user agent, basic device type) is collected alongside the location to aid the administrator. No deeply identifying hardware metrics are accessed.

## 4. Security Tests and Detection
To ensure protections are active, the following tests should be routinely performed:
1.  **Permission Denial Test:** Verify that denying the browser location prompt gracefully fails and does not transmit any location data.
2.  **Background Suspension Test:** Verify that switching away from the browser tab or locking the device stops any potential ongoing location requests.
3.  **Token Invalidity Test:** Verify that accessing an invalid or disabled token URL does not present the location sharing interface.

## 5. Conclusion
By strictly adhering to standard browser APIs, enforcing explicit user interaction, and avoiding any background or hidden collection mechanisms, the Emergency Safety Link Platform ensures that location sharing remains a conscious, authorized act by the user.
