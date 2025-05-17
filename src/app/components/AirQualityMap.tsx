import dynamic from 'next/dynamic';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, ScaleControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { AirQualityData } from '../api';
import L from 'leaflet';
import { useMemo } from 'react';

// Dynamically import the map component with no SSR
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full rounded-xl overflow-hidden border border-gray-200 shadow-lg relative flex items-center justify-center bg-gray-50">
      <div className="text-gray-500">Harita yükleniyor...</div>
    </div>
  ),
});

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

interface AirQualityMapProps {
  center: [number, number];
  data: AirQualityData;
  location: string;
}

const AirQualityMap = ({ center, data, location }: AirQualityMapProps) => {
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

      <div className="space-y-3">
        {data.aqi && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span className="font-medium text-gray-900">Hava Kalitesi Durumu</span>
            </div>
            <div className="text-sm text-gray-600">
              {data.aqi <= 50 ? 'İyi - Hava kalitesi tatmin edici, hava kirliliği az risk oluşturuyor.' : 
               data.aqi <= 100 ? 'Orta - Hassas gruplar için orta düzeyde sağlık riski oluşturabilir.' : 
               data.aqi <= 150 ? 'Hassas - Hassas gruplar için sağlıksız, genel halk için orta düzeyde risk.' : 
               data.aqi <= 200 ? 'Sağlıksız - Herkes için sağlık etkileri oluşabilir.' : 
               data.aqi <= 300 ? 'Çok Sağlıksız - Herkes için ciddi sağlık etkileri oluşabilir.' : 
               'Tehlikeli - Tüm nüfus için acil sağlık uyarısı.'}
            </div>
          </div>
        )}

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
    </div>
  ), [location, data.aqi, data.pm2_5, data.pm10]);

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Hava Kalitesi Haritası</h2>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span>Haritayı yakınlaştırmak için fare tekerleğini kullanın</span>
        </div>
      </div>

      <div className="h-[500px] w-full rounded-xl overflow-hidden border border-gray-200 shadow-lg relative">
        <MapComponent center={center} data={data} location={location} />
      </div>

      <div className="mt-6">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-4 h-4 rounded-full bg-[#00e400] shadow-sm" />
            <span className="text-sm font-medium text-gray-800">İyi (0-50)</span>
          </div>
          <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-4 h-4 rounded-full bg-[#ffd700] shadow-sm" />
            <span className="text-sm font-medium text-gray-800">Orta (51-100)</span>
          </div>
          <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-4 h-4 rounded-full bg-[#ff7e00] shadow-sm" />
            <span className="text-sm font-medium text-gray-800">Hassas (101-150)</span>
          </div>
          <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-4 h-4 rounded-full bg-[#ff0000] shadow-sm" />
            <span className="text-sm font-medium text-gray-800">Sağlıksız (151-200)</span>
          </div>
          <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-4 h-4 rounded-full bg-[#99004c] shadow-sm" />
            <span className="text-sm font-medium text-gray-800">Çok Sağlıksız (201-300)</span>
          </div>
          <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-4 h-4 rounded-full bg-[#7e0023] shadow-sm" />
            <span className="text-sm font-medium text-gray-800">Tehlikeli (301+)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AirQualityMap; 