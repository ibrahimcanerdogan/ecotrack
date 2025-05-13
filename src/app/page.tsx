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
  AirQualityForecast
} from "./api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PDFDownloadLink } from '@react-pdf/renderer';
import AirQualityReport from './components/AirQualityReport';
import AirQualityStats from './components/AirQualityStats';
import AirQualityMap from './components/AirQualityMap';

export default function Home() {
  const [location, setLocation] = useState("");
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
      case 'good': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-orange-100 text-orange-800';
      case 'very_poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-100 to-blue-100 p-4">
      <h1 className="text-3xl font-bold mb-6 text-green-900">EcoTrack 🌱</h1>
      
      {/* Favori Konumlar */}
      {favorites.length > 0 && (
        <div className="w-full max-w-4xl mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-3">Favori Konumlar</h2>
            <div className="flex flex-wrap gap-2">
              {favorites.map((fav, index) => (
                <button
                  key={index}
                  onClick={() => fetchAirQuality(`${fav.latitude},${fav.longitude}`)}
                  className="bg-green-50 hover:bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
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
            className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
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
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {isFavorite ? '★' : '☆'}
            </button>
          )}
        </div>
      </form>

      <div className="mt-8 w-full max-w-4xl">
        {error && <div className="text-red-600 mb-4">{error}</div>}
        {result && recommendations && (
          <div className="space-y-6">
            {/* Hava Kalitesi Haritası */}
            {currentCoords && (
              <AirQualityMap
                center={[currentCoords.latitude, currentCoords.longitude]}
                data={result}
                location={location}
              />
            )}

            {/* Hava Kalitesi İstatistikleri */}
            <AirQualityStats data={result} />

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Hava Kalitesi Verileri</h2>
                <PDFDownloadLink
                  document={<AirQualityReport location={location} data={result} recommendations={recommendations} />}
                  fileName={`hava-kalitesi-raporu-${new Date().toISOString().split('T')[0]}.pdf`}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                  {({ loading }) => loading ? 'Rapor Hazırlanıyor...' : 'PDF İndir'}
                </PDFDownloadLink>
              </div>
              <div className="flex flex-col gap-2 text-gray-700">
                {result.aqi !== undefined && <div><b>AQI:</b> {result.aqi}</div>}
                {result.pm2_5 !== undefined && <div><b>PM2.5:</b> {result.pm2_5} µg/m³</div>}
                {result.pm10 !== undefined && <div><b>PM10:</b> {result.pm10} µg/m³</div>}
                {result.co !== undefined && <div><b>CO:</b> {result.co} µg/m³</div>}
                {result.no2 !== undefined && <div><b>NO₂:</b> {result.no2} µg/m³</div>}
                {result.o3 !== undefined && <div><b>O₃:</b> {result.o3} µg/m³</div>}
                {result.so2 !== undefined && <div><b>SO₂:</b> {result.so2} µg/m³</div>}
                {result.time && <div className="text-xs text-gray-400 mt-2">Veri zamanı: {result.time}</div>}
              </div>
            </div>

            {historicalData && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Son 24 Saat Hava Kalitesi Değişimi</h2>
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

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Öneriler</h2>
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${getStatusColor(recommendations.overallStatus)}`}>
                  <h3 className="font-semibold mb-2">Dış Aktivite Durumu</h3>
                  <p>{recommendations.outdoorActivity}</p>
                </div>
                <div className={`p-4 rounded-lg ${getStatusColor(recommendations.overallStatus)}`}>
                  <h3 className="font-semibold mb-2">Sağlık Önerileri</h3>
                  <p>{recommendations.healthAdvice}</p>
                </div>
                <div className={`p-4 rounded-lg ${getStatusColor(recommendations.overallStatus)}`}>
                  <h3 className="font-semibold mb-2">Maske Kullanımı</h3>
                  <p>{recommendations.maskAdvice}</p>
                </div>
              </div>
            </div>

            {forecast && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Gelecek 24 Saat Tahmini</h2>
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
                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                      <div className="font-semibold text-gray-700">{hour.time}</div>
                      <div className="text-sm text-gray-600">
                        <div>AQI: {hour.aqi}</div>
                        <div>PM2.5: {hour.pm2_5} µg/m³</div>
                        <div>PM10: {hour.pm10} µg/m³</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
