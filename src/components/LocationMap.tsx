// src/components/LocationMap.tsx
import { MapContainer, TileLayer, Marker, Circle, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon paths
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface LocationMapProps {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  label?: string;
}

export function LocationMap({ latitude, longitude, accuracy, label }: LocationMapProps) {
  const position: [number, number] = [latitude, longitude];

  return (
    <div className="map-wrapper">
      <MapContainer
        center={position}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={position}>
          <Popup>{label ?? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`}</Popup>
        </Marker>
        {accuracy && accuracy > 0 && (
          <Circle
            center={position}
            radius={accuracy}
            pathOptions={{ color: '#6366f1', fillColor: '#6366f1', fillOpacity: 0.1 }}
          />
        )}
      </MapContainer>
    </div>
  );
}

export function MapPlaceholder({ message }: { message?: string }) {
  return (
    <div className="map-placeholder">
      <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 20.25l3-1.5 3 1.5 3-1.5V5.25l-3 1.5-3-1.5-3 1.5v13.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75v-13.5" />
      </svg>
      <p style={{ fontSize: '0.9rem' }}>{message ?? 'No location data available'}</p>
    </div>
  );
}
