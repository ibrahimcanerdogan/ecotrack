import { AirQualityData } from '../api';

interface AirQualityStatsProps {
  data: AirQualityData;
}

const AirQualityStats = ({ data }: AirQualityStatsProps) => {
  // AQI değerine göre kategori belirleme
  const getAQICategory = (aqi: number): { category: string; color: string } => {
    if (aqi <= 50) return { category: 'İyi', color: 'text-green-600' };
    if (aqi <= 100) return { category: 'Orta', color: 'text-yellow-600' };
    if (aqi <= 150) return { category: 'Hassas Gruplar İçin Sağlıksız', color: 'text-orange-600' };
    if (aqi <= 200) return { category: 'Sağlıksız', color: 'text-red-600' };
    if (aqi <= 300) return { category: 'Çok Sağlıksız', color: 'text-purple-600' };
    return { category: 'Tehlikeli', color: 'text-red-800' };
  };

  // PM2.5 değerine göre kategori belirleme
  const getPM25Category = (pm25: number): { category: string; color: string } => {
    if (pm25 <= 12) return { category: 'İyi', color: 'text-green-600' };
    if (pm25 <= 35.4) return { category: 'Orta', color: 'text-yellow-600' };
    if (pm25 <= 55.4) return { category: 'Hassas Gruplar İçin Sağlıksız', color: 'text-orange-600' };
    if (pm25 <= 150.4) return { category: 'Sağlıksız', color: 'text-red-600' };
    if (pm25 <= 250.4) return { category: 'Çok Sağlıksız', color: 'text-purple-600' };
    return { category: 'Tehlikeli', color: 'text-red-800' };
  };

  // PM10 değerine göre kategori belirleme
  const getPM10Category = (pm10: number): { category: string; color: string } => {
    if (pm10 <= 54) return { category: 'İyi', color: 'text-green-600' };
    if (pm10 <= 154) return { category: 'Orta', color: 'text-yellow-600' };
    if (pm10 <= 254) return { category: 'Hassas Gruplar İçin Sağlıksız', color: 'text-orange-600' };
    if (pm10 <= 354) return { category: 'Sağlıksız', color: 'text-red-600' };
    if (pm10 <= 424) return { category: 'Çok Sağlıksız', color: 'text-purple-600' };
    return { category: 'Tehlikeli', color: 'text-red-800' };
  };

  const aqiCategory = data.aqi ? getAQICategory(data.aqi) : null;
  const pm25Category = data.pm2_5 ? getPM25Category(data.pm2_5) : null;
  const pm10Category = data.pm10 ? getPM10Category(data.pm10) : null;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Hava Kalitesi İstatistikleri</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* AQI İstatistikleri */}
        {data.aqi && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">AQI (Hava Kalitesi İndeksi)</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Değer:</span>
                <span className="font-semibold">{data.aqi}</span>
              </div>
              {aqiCategory && (
                <div className="flex justify-between">
                  <span>Kategori:</span>
                  <span className={`font-semibold ${aqiCategory.color}`}>
                    {aqiCategory.category}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PM2.5 İstatistikleri */}
        {data.pm2_5 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">PM2.5 (İnce Partikül)</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Değer:</span>
                <span className="font-semibold">{data.pm2_5} µg/m³</span>
              </div>
              {pm25Category && (
                <div className="flex justify-between">
                  <span>Kategori:</span>
                  <span className={`font-semibold ${pm25Category.color}`}>
                    {pm25Category.category}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* PM10 İstatistikleri */}
        {data.pm10 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">PM10 (Kaba Partikül)</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Değer:</span>
                <span className="font-semibold">{data.pm10} µg/m³</span>
              </div>
              {pm10Category && (
                <div className="flex justify-between">
                  <span>Kategori:</span>
                  <span className={`font-semibold ${pm10Category.color}`}>
                    {pm10Category.category}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Diğer Kirleticiler */}
      <div className="mt-6">
        <h3 className="font-medium mb-3">Diğer Kirleticiler</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.co && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between">
                <span>CO:</span>
                <span className="font-semibold">{data.co} µg/m³</span>
              </div>
            </div>
          )}
          {data.no2 && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between">
                <span>NO₂:</span>
                <span className="font-semibold">{data.no2} µg/m³</span>
              </div>
            </div>
          )}
          {data.o3 && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between">
                <span>O₃:</span>
                <span className="font-semibold">{data.o3} µg/m³</span>
              </div>
            </div>
          )}
          {data.so2 && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between">
                <span>SO₂:</span>
                <span className="font-semibold">{data.so2} µg/m³</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AirQualityStats; 