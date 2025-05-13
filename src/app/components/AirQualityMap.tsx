import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { AirQualityData } from '../api';
import L from 'leaflet';

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

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Hava Kalitesi Haritası</h2>
      <div className="h-[400px] w-full rounded-lg overflow-hidden">
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={center} icon={icon}>
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold mb-2">{location}</h3>
                {data.aqi && (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: getAQIColor(data.aqi).bg }}
                    />
                    <span>AQI: {data.aqi}</span>
                  </div>
                )}
                {data.pm2_5 && <div>PM2.5: {data.pm2_5} µg/m³</div>}
                {data.pm10 && <div>PM10: {data.pm10} µg/m³</div>}
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full">
          <div className="w-4 h-4 rounded-full bg-[#00e400]" />
          <span className="text-sm font-medium text-gray-800">İyi (0-50)</span>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full">
          <div className="w-4 h-4 rounded-full bg-[#ffd700]" />
          <span className="text-sm font-medium text-gray-800">Orta (51-100)</span>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full">
          <div className="w-4 h-4 rounded-full bg-[#ff7e00]" />
          <span className="text-sm font-medium text-gray-800">Hassas (101-150)</span>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full">
          <div className="w-4 h-4 rounded-full bg-[#ff0000]" />
          <span className="text-sm font-medium text-gray-800">Sağlıksız (151-200)</span>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full">
          <div className="w-4 h-4 rounded-full bg-[#99004c]" />
          <span className="text-sm font-medium text-gray-800">Çok Sağlıksız (201-300)</span>
        </div>
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full">
          <div className="w-4 h-4 rounded-full bg-[#7e0023]" />
          <span className="text-sm font-medium text-gray-800">Tehlikeli (301+)</span>
        </div>
      </div>
    </div>
  );
};

export default AirQualityMap; 