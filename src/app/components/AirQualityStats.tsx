import { AirQualityData } from '../api';

interface AirQualityStatsProps {
  data: AirQualityData;
}

const AirQualityStats = ({ data }: AirQualityStatsProps) => {
  const getAQIStatus = (aqi: number) => {
    if (aqi <= 50) return { text: 'İyi', color: 'bg-green-50 text-green-900 border-green-200' };
    if (aqi <= 100) return { text: 'Orta', color: 'bg-yellow-50 text-yellow-900 border-yellow-200' };
    if (aqi <= 150) return { text: 'Hassas', color: 'bg-orange-50 text-orange-900 border-orange-200' };
    if (aqi <= 200) return { text: 'Sağlıksız', color: 'bg-red-50 text-red-900 border-red-200' };
    if (aqi <= 300) return { text: 'Çok Sağlıksız', color: 'bg-purple-50 text-purple-900 border-purple-200' };
    return { text: 'Tehlikeli', color: 'bg-red-100 text-red-900 border-red-200' };
  };

  const getPM25Status = (pm25: number) => {
    if (pm25 <= 12) return { text: 'İyi', color: 'bg-green-50 text-green-900 border-green-200' };
    if (pm25 <= 35.4) return { text: 'Orta', color: 'bg-yellow-50 text-yellow-900 border-yellow-200' };
    if (pm25 <= 55.4) return { text: 'Hassas', color: 'bg-orange-50 text-orange-900 border-orange-200' };
    if (pm25 <= 150.4) return { text: 'Sağlıksız', color: 'bg-red-50 text-red-900 border-red-200' };
    if (pm25 <= 250.4) return { text: 'Çok Sağlıksız', color: 'bg-purple-50 text-purple-900 border-purple-200' };
    return { text: 'Tehlikeli', color: 'bg-red-100 text-red-900 border-red-200' };
  };

  const getPM10Status = (pm10: number) => {
    if (pm10 <= 54) return { text: 'İyi', color: 'bg-green-50 text-green-900 border-green-200' };
    if (pm10 <= 154) return { text: 'Orta', color: 'bg-yellow-50 text-yellow-900 border-yellow-200' };
    if (pm10 <= 254) return { text: 'Hassas', color: 'bg-orange-50 text-orange-900 border-orange-200' };
    if (pm10 <= 354) return { text: 'Sağlıksız', color: 'bg-red-50 text-red-900 border-red-200' };
    if (pm10 <= 424) return { text: 'Çok Sağlıksız', color: 'bg-purple-50 text-purple-900 border-purple-200' };
    return { text: 'Tehlikeli', color: 'bg-red-100 text-red-900 border-red-200' };
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Hava Kalitesi İstatistikleri</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.aqi !== undefined && (
          <div className={`p-4 rounded-lg border ${getAQIStatus(data.aqi).color}`}>
            <h3 className="font-semibold mb-2">Hava Kalitesi İndeksi (AQI)</h3>
            <div className="text-2xl font-bold mb-1">{data.aqi}</div>
            <div className="text-sm">{getAQIStatus(data.aqi).text}</div>
          </div>
        )}
        {data.pm2_5 !== undefined && (
          <div className={`p-4 rounded-lg border ${getPM25Status(data.pm2_5).color}`}>
            <h3 className="font-semibold mb-2">PM2.5</h3>
            <div className="text-2xl font-bold mb-1">{data.pm2_5} µg/m³</div>
            <div className="text-sm">{getPM25Status(data.pm2_5).text}</div>
          </div>
        )}
        {data.pm10 !== undefined && (
          <div className={`p-4 rounded-lg border ${getPM10Status(data.pm10).color}`}>
            <h3 className="font-semibold mb-2">PM10</h3>
            <div className="text-2xl font-bold mb-1">{data.pm10} µg/m³</div>
            <div className="text-sm">{getPM10Status(data.pm10).text}</div>
          </div>
        )}
      </div>

      {/* Diğer Kirleticiler */}
      <div className="mt-6">
        <h3 className="font-semibold mb-3 text-gray-900">Diğer Kirleticiler</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.co && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex flex-col">
                <span className="text-sm text-gray-600 mb-1">Karbon Monoksit</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-gray-900">{data.co}</span>
                  <span className="text-sm text-gray-600">µg/m³</span>
                </div>
              </div>
            </div>
          )}
          {data.no2 && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex flex-col">
                <span className="text-sm text-gray-600 mb-1">Azot Dioksit</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-gray-900">{data.no2}</span>
                  <span className="text-sm text-gray-600">µg/m³</span>
                </div>
              </div>
            </div>
          )}
          {data.o3 && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex flex-col">
                <span className="text-sm text-gray-600 mb-1">Ozon</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-gray-900">{data.o3}</span>
                  <span className="text-sm text-gray-600">µg/m³</span>
                </div>
              </div>
            </div>
          )}
          {data.so2 && (
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex flex-col">
                <span className="text-sm text-gray-600 mb-1">Kükürt Dioksit</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-gray-900">{data.so2}</span>
                  <span className="text-sm text-gray-600">µg/m³</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AirQualityStats; 