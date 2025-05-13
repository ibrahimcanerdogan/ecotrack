"use client";
import { useState, useEffect } from "react";
import { 
  getCoordinates, 
  getAirQuality, 
  AirQualityData, 
  getAirQualityRecommendations, 
  AirQualityRecommendation, 
  getHistoricalAirQuality, 
  HistoricalAirQualityData,
  FavoriteLocation,
  getFavoriteLocations,
  addFavoriteLocation,
  removeFavoriteLocation,
  isFavoriteLocation,
  getAirQualityForecast,
  AirQualityForecast,
  clearAllFavoriteLocations
} from "./api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PDFDownloadLink } from '@react-pdf/renderer';
import AirQualityReport from './components/AirQualityReport';
import AirQualityStats from './components/AirQualityStats';
import AirQualityMap from './components/AirQualityMap';

export default function Home() {
  const [location, setLocation] = useState("");
  const [displayLocation, setDisplayLocation] = useState("");
  const [result, setResult] = useState<AirQualityData | null>(null);
  const [recommendations, setRecommendations] = useState<AirQualityRecommendation | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalAirQualityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteLocation[]>([]);
  const [currentCoords, setCurrentCoords] = useState<{latitude: number; longitude: number} | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [forecast, setForecast] = useState<AirQualityForecast | null>(null);

  // Favori konumları yükle
  useEffect(() => {
    setFavorites(getFavoriteLocations());
  }, []);

  // Mevcut konum favori mi kontrol et
  useEffect(() => {
    if (currentCoords) {
      setIsFavorite(isFavoriteLocation(currentCoords.latitude, currentCoords.longitude));
    }
  }, [currentCoords]);

  const getCurrentLocation = () => {
    setIsLocating(true);
    setError("");

    if (!navigator.geolocation) {
      setError("Tarayıcınız konum özelliğini desteklemiyor.");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation(`${latitude},${longitude}`);
        setCurrentCoords({ latitude, longitude });
        await fetchAirQuality(`${latitude},${longitude}`);
        setIsLocating(false);
      },
      (error) => {
        setError("Konum alınamadı. Lütfen konum izni verin veya manuel giriş yapın.");
        setIsLocating(false);
      }
    );
  };

  const fetchAirQuality = async (loc: string) => {
    setError("");
    setResult(null);
    setRecommendations(null);
    setHistoricalData(null);
    setForecast(null);
    setLoading(true);
    try {
      const coords = await getCoordinates(loc);
      if (!coords) {
        setError("Konum bulunamadı. Lütfen geçerli bir şehir, ülke veya koordinat girin.");
        setLoading(false);
        return;
      }
      setCurrentCoords(coords);
      setDisplayLocation(loc);

      const [airQuality, historical, forecastData] = await Promise.all([
        getAirQuality(coords.latitude, coords.longitude),
        getHistoricalAirQuality(coords.latitude, coords.longitude),
        getAirQualityForecast(coords.latitude, coords.longitude)
      ]);
      
      if (!airQuality) {
        setError("Hava kalitesi verisi alınamadı.");
        setLoading(false);
        return;
      }
      
      setResult(airQuality);
      setRecommendations(getAirQualityRecommendations(airQuality));
      setHistoricalData(historical);
      setForecast(forecastData);
    } catch (err) {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetchAirQuality(location);
  };

  const toggleFavorite = () => {
    if (!currentCoords) return;

    if (isFavorite) {
      removeFavoriteLocation(currentCoords.latitude, currentCoords.longitude);
      setIsFavorite(false);
    } else {
      // Koordinatları kısa formatta göster (2 ondalık basamak)
      const shortLat = currentCoords.latitude.toFixed(2);
      const shortLon = currentCoords.longitude.toFixed(2);
      addFavoriteLocation({
        name: `${shortLat}, ${shortLon}`,
        latitude: currentCoords.latitude,
        longitude: currentCoords.longitude
      });
      setIsFavorite(true);
    }
    setFavorites(getFavoriteLocations());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-50 text-green-900 border border-green-200';
      case 'moderate': return 'bg-yellow-50 text-yellow-900 border border-yellow-200';
      case 'poor': return 'bg-orange-50 text-orange-900 border border-orange-200';
      case 'very_poor': return 'bg-red-50 text-red-900 border border-red-200';
      default: return 'bg-gray-50 text-gray-900 border border-gray-200';
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="w-full max-w-4xl flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-green-900">EcoTrack 🌱</h1>
        {result && recommendations && (
          <PDFDownloadLink
            document={
              <AirQualityReport 
                location={displayLocation} 
                data={result} 
                recommendations={recommendations}
                historicalData={historicalData}
                forecast={forecast}
              />
            }
            fileName={`hava-kalitesi-raporu-${new Date().toISOString().split('T')[0]}.pdf`}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition flex items-center gap-2"
          >
            {({ blob, url, loading, error }) => 
              loading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Rapor Hazırlanıyor...
                </div>
              ) : error ? (
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Rapor Oluşturulamadı
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                  </svg>
                  Tüm Verileri PDF İndir
                </div>
              )
            }
          </PDFDownloadLink>
        )}
      </div>
      
      {/* Favori Konumlar */}
      {favorites.length > 0 && (
        <div className="w-full max-w-4xl mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Favori Konumlar</h2>
              <button
                onClick={() => {
                  if (window.confirm('Tüm favori konumları silmek istediğinizden emin misiniz?')) {
                    clearAllFavoriteLocations();
                    setFavorites([]);
                  }
                }}
                className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Tümünü Sil
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {favorites.map((fav, index) => (
                <button
                  key={index}
                  onClick={() => fetchAirQuality(`${fav.latitude},${fav.longitude}`)}
                  className="bg-green-50 hover:bg-green-100 text-green-900 px-3 py-1 rounded-full text-sm flex items-center gap-2 border border-green-200"
                >
                  <span>📍</span>
                  {fav.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md bg-white rounded-lg shadow p-6">
        <div className="flex gap-2">
          <input
            id="location"
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="Örn: İstanbul, Türkiye veya 41.0082,28.9784"
            className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-900"
            required
          />
          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={isLocating}
            className="bg-blue-600 text-white rounded px-4 py-2 font-semibold hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isLocating ? "Konum Alınıyor..." : "📍"}
          </button>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 bg-green-600 text-white rounded px-4 py-2 font-semibold hover:bg-green-700 transition"
            disabled={loading}
          >
            {loading ? "Sorgulanıyor..." : "Hava Kalitesini Göster"}
          </button>
          {currentCoords && (
            <button
              type="button"
              onClick={toggleFavorite}
              className={`px-4 py-2 rounded font-semibold transition ${
                isFavorite 
                  ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              {isFavorite ? '★' : '☆'}
            </button>
          )}
        </div>
      </form>

      <div className="mt-8 w-full max-w-4xl">
        {error && <div className="text-red-700 bg-red-50 p-4 rounded-lg border border-red-200 mb-4">{error}</div>}
        {result && recommendations && (
          <div className="space-y-6">
            {/* Hava Kalitesi İstatistikleri */}
            <AirQualityStats data={result} />

            {/* Öneriler */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">Öneriler</h2>
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${getStatusColor(recommendations.overallStatus)}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">Dış Aktivite Durumu</h3>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-sm">{recommendations.outdoorActivity}</p>
                </div>

                <div className={`p-4 rounded-lg ${getStatusColor(recommendations.overallStatus)}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">Sağlık Önerileri</h3>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-sm">{recommendations.healthAdvice}</p>
                </div>

                <div className={`p-4 rounded-lg ${getStatusColor(recommendations.overallStatus)}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">Maske Kullanımı</h3>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p className="text-sm">{recommendations.maskAdvice}</p>
                </div>

                <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-blue-900">Genel Bilgilendirme</h3>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <ul className="text-sm text-blue-800 space-y-2">
                    <li className="flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Hava kalitesi verileri saatlik olarak güncellenmektedir.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Öneriler, mevcut hava kalitesi durumuna göre kişiselleştirilmiştir.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>Hassas gruplar (astım, kalp hastalığı vb.) için özel önlemler alınmalıdır.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Son 24 Saat Hava Kalitesi Değişimi */}
            {historicalData && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Son 24 Saat Hava Kalitesi Değişimi</h2>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="aqi" stroke="#8884d8" name="AQI" />
                      <Line type="monotone" dataKey="pm2_5" stroke="#82ca9d" name="PM2.5" />
                      <Line type="monotone" dataKey="pm10" stroke="#ffc658" name="PM10" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Gelecek 24 Saat Tahmini */}
            {forecast && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Gelecek 24 Saat Tahmini</h2>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={forecast}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="aqi" stroke="#8884d8" name="AQI" />
                      <Line type="monotone" dataKey="pm2_5" stroke="#82ca9d" name="PM2.5" />
                      <Line type="monotone" dataKey="pm10" stroke="#ffc658" name="PM10" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {forecast.slice(0, 4).map((hour, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <div className="font-semibold text-gray-900">{hour.time}</div>
                      <div className="text-sm text-gray-800">
                        <div>AQI: {hour.aqi}</div>
                        <div>PM2.5: {hour.pm2_5} µg/m³</div>
                        <div>PM10: {hour.pm10} µg/m³</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hava Kalitesi Haritası */}
            {currentCoords && (
              <AirQualityMap
                center={[currentCoords.latitude, currentCoords.longitude]}
                data={result}
                location={displayLocation}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
