'use client';

import { MapContainer, TileLayer, Marker, Popup, ZoomControl, ScaleControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { AirQualityData } from '../api';
import L from 'leaflet';
import { useMemo } from 'react';

// Marker ikonunu düzelt
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapComponentProps {
  center: [number, number];
  data: AirQualityData;
  location: string;
}

const MapComponent = ({ center, data, location }: MapComponentProps) => {
  // AQI değerine göre renk belirleme
  const getAQIColor = (aqi: number): { bg: string; text: string } => {
    if (aqi <= 50) return { bg: '#00e400', text: '#1a1a1a' };
    if (aqi <= 100) return { bg: '#ffd700', text: '#1a1a1a' };
    if (aqi <= 150) return { bg: '#ff7e00', text: '#ffffff' };
    if (aqi <= 200) return { bg: '#ff0000', text: '#ffffff' };
    if (aqi <= 300) return { bg: '#99004c', text: '#ffffff' };
    return { bg: '#7e0023', text: '#ffffff' };
  };

  // Popup içeriğini memoize et
  const popupContent = useMemo(() => (
    <div className="p-4 min-w-[250px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg text-gray-900">{location}</h3>
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full shadow-sm"
            style={{ backgroundColor: getAQIColor(data.aqi || 0).bg }}
          />
          <span className="text-sm font-medium text-gray-700">
            {data.aqi && `AQI: ${data.aqi}`}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {data.pm2_5 && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-gray-900">PM2.5</span>
            </div>
            <div className="text-sm text-gray-600">{data.pm2_5} µg/m³</div>
          </div>
        )}
        {data.pm10 && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-gray-900">PM10</span>
            </div>
            <div className="text-sm text-gray-600">{data.pm10} µg/m³</div>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Son güncelleme:</span>
          <span>{new Date().toLocaleTimeString('tr-TR')}</span>
        </div>
      </div>
    </div>
  ), [location, data.aqi, data.pm2_5, data.pm10]);

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ZoomControl position="bottomright" />
      <ScaleControl position="bottomleft" />
      <Marker position={center} icon={icon}>
        <Popup
          className="custom-popup"
          closeButton={true}
          closeOnClick={false}
          autoPan={true}
          maxWidth={300}
        >
          {popupContent}
        </Popup>
      </Marker>
    </MapContainer>
  );
};

export default MapComponent; 