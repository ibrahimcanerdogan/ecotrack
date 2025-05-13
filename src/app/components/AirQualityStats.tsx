import { AirQualityData } from '../api';
import { useState } from 'react';

interface AirQualityStatsProps {
  data: AirQualityData;
}

const AirQualityStats = ({ data }: AirQualityStatsProps) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const tooltipContent = {
    aqi: "Hava Kalitesi İndeksi (AQI), hava kalitesini 0-500 arasında bir ölçekte değerlendirir. Düşük değerler daha iyi hava kalitesini gösterir.",
    pm25: "PM2.5, çapı 2.5 mikrometreden küçük parçacıkları ifade eder. Bu parçacıklar akciğerlere derinlemesine nüfuz edebilir ve sağlık sorunlarına yol açabilir.",
    pm10: "PM10, çapı 10 mikrometreden küçük parçacıkları ifade eder. Bu parçacıklar solunum yollarına zarar verebilir.",
    co: "Karbon Monoksit (CO), renksiz ve kokusuz bir gazdır. Yüksek seviyeleri baş ağrısı, baş dönmesi ve hatta ölüme neden olabilir.",
    no2: "Azot Dioksit (NO₂), solunum yollarını tahriş eden bir gazdır. Astım ve diğer solunum hastalıklarını kötüleştirebilir.",
    o3: "Ozon (O₃), yüksek seviyelerde solunum sorunlarına neden olabilen bir gazdır. Özellikle çocuklar ve yaşlılar için tehlikelidir.",
    so2: "Kükürt Dioksit (SO₂), solunum yollarını tahriş eden bir gazdır. Astım ve diğer solunum hastalıklarını kötüleştirebilir."
  };

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

  const Tooltip = ({ id, children }: { id: string; children: React.ReactNode }) => (
    <div className="relative inline-block">
      <button
        onClick={() => setActiveTooltip(activeTooltip === id ? null : id)}
        className="text-gray-500 hover:text-gray-700 focus:outline-none"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      </button>
      {activeTooltip === id && (
        <div className="absolute z-10 w-64 p-2 mt-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="flex justify-end mb-1">
            <button
              onClick={() => setActiveTooltip(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Hava Kalitesi İstatistikleri</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.aqi !== undefined && (
          <div className={`p-4 rounded-lg border ${getAQIStatus(data.aqi).color}`}>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Hava Kalitesi İndeksi (AQI)</h3>
              <Tooltip id="aqi">{tooltipContent.aqi}</Tooltip>
            </div>
            <div className="text-2xl font-bold mb-1">{data.aqi}</div>
            <div className="text-sm">{getAQIStatus(data.aqi).text}</div>
          </div>
        )}
        {data.pm2_5 !== undefined && (
          <div className={`p-4 rounded-lg border ${getPM25Status(data.pm2_5).color}`}>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">PM2.5</h3>
              <Tooltip id="pm25">{tooltipContent.pm25}</Tooltip>
            </div>
            <div className="text-2xl font-bold mb-1">{data.pm2_5} µg/m³</div>
            <div className="text-sm">{getPM25Status(data.pm2_5).text}</div>
          </div>
        )}
        {data.pm10 !== undefined && (
          <div className={`p-4 rounded-lg border ${getPM10Status(data.pm10).color}`}>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">PM10</h3>
              <Tooltip id="pm10">{tooltipContent.pm10}</Tooltip>
            </div>
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
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Karbon Monoksit</span>
                  <Tooltip id="co">{tooltipContent.co}</Tooltip>
                </div>
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
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Azot Dioksit</span>
                  <Tooltip id="no2">{tooltipContent.no2}</Tooltip>
                </div>
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
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Ozon</span>
                  <Tooltip id="o3">{tooltipContent.o3}</Tooltip>
                </div>
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
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Kükürt Dioksit</span>
                  <Tooltip id="so2">{tooltipContent.so2}</Tooltip>
                </div>
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