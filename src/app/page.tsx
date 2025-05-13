"use client";
import { useState, useEffect, useRef } from "react";
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
  const [suggestions, setSuggestions] = useState<{name: string; latitude: number; longitude: number}[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Dışarı tıklandığında önerileri kapat
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    if (typeof window !== 'undefined') {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, []);

  // Favori konumları yükle
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setFavorites(getFavoriteLocations());
    }
  }, []);

  // Mevcut konum favori mi kontrol et
  useEffect(() => {
    if (typeof window !== 'undefined' && currentCoords) {
      setIsFavorite(isFavoriteLocation(currentCoords.latitude, currentCoords.longitude));
    }
  }, [currentCoords]);

  // Konum önerilerini al
  const fetchSuggestions = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=tr&format=json`
      );
      const data = await res.json();
      if (data.results) {
        // Benzersiz şehir isimlerini filtrele
        const uniqueSuggestions = data.results.reduce((acc: Array<{ name: string }>, current: { name: string }) => {
          const isDuplicate = acc.some(item => item.name === current.name);
          if (!isDuplicate) {
            acc.push(current);
          }
          return acc;
        }, []).slice(0, 5); // En fazla 5 öneri göster

        setSuggestions(uniqueSuggestions);
      }
    } catch (error) {
      console.error("Öneriler alınamadı:", error);
    }
  };

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
      (error: GeolocationPositionError) => {
        console.error("Geolocation error:", error);
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
      setDisplayLocation(coords.displayName || loc);
      
      // Favori kontrolü
      const isFav = isFavoriteLocation(coords.latitude, coords.longitude);
      setIsFavorite(isFav);

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
    } catch {
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
      addFavoriteLocation({
        name: displayLocation,
        latitude: currentCoords.latitude,
        longitude: currentCoords.longitude,
        displayName: displayLocation
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">EcoTrack</h1>
            <span className="text-2xl">🌱</span>
          </div>
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
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-full hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              {({ loading, error }) => 
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
          <div className="mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-gray-900">Favori Konumlar</h2>
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {favorites.length}
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm('Tüm favori konumları silmek istediğinizden emin misiniz?')) {
                      clearAllFavoriteLocations();
                      setFavorites([]);
                    }
                  }}
                  className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Tümünü Sil
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                {favorites.map((fav, index) => (
                  <button
                    key={index}
                    onClick={() => fetchAirQuality(`${fav.latitude},${fav.longitude}`)}
                    className="group bg-gradient-to-r from-green-50 to-blue-50 hover:from-green-100 hover:to-blue-100 text-gray-900 px-4 py-2 rounded-full text-sm flex items-center gap-2 border border-gray-200 transition-all duration-300 hover:shadow-md"
                  >
                    <span className="group-hover:scale-110 transition-transform">📍</span>
                    {fav.displayName || fav.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-2xl mx-auto mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-4 md:p-6 border border-gray-100">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1" ref={searchRef}>
                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={e => {
                    setLocation(e.target.value);
                    fetchSuggestions(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Şehir, Ülke veya Koordinat"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3.5 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-900 bg-white/50 backdrop-blur-sm text-base md:text-sm"
                  required
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                {location && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocation("");
                      setSuggestions([]);
                      setShowSuggestions(false);
                      setResult(null);
                      setRecommendations(null);
                      setHistoricalData(null);
                      setForecast(null);
                      setCurrentCoords(null);
                      setIsFavorite(false);
                      setDisplayLocation("");
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 max-h-[60vh] md:max-h-60 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setLocation(suggestion.name);
                          setShowSuggestions(false);
                          fetchAirQuality(suggestion.name);
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none text-gray-900 flex items-center gap-2 border-b border-gray-100 last:border-b-0"
                      >
                        <span className="text-gray-400">📍</span>
                        {suggestion.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={getCurrentLocation}
                disabled={isLocating}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl px-6 py-3.5 font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl flex items-center gap-2 w-full md:w-[220px] justify-center text-base md:text-sm"
              >
                {isLocating ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Konum Alınıyor...</span>
                  </>
                ) : (
                  <>
                    <span>📍</span>
                    <span>Konumumu Bul</span>
                  </>
                )}
              </button>
            </div>
            <div className="flex flex-col md:flex-row gap-3 mt-3">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl px-6 py-3.5 font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-base md:text-sm"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Sorgulanıyor...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                    </svg>
                    <span>Hava Kalitesini Göster</span>
                  </>
                )}
              </button>
              {currentCoords && (
                <button
                  type="button"
                  onClick={toggleFavorite}
                  className={`px-6 py-3.5 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 w-full md:w-[220px] justify-center text-base md:text-sm ${
                    isFavorite 
                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white hover:from-yellow-500 hover:to-yellow-600' 
                      : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 border border-gray-200'
                  }`}
                >
                  {isFavorite ? (
                    <>
                      <span className="text-xl">★</span>
                      <span>Favorilerden Çıkar</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xl">☆</span>
                      <span>Favorilere Ekle</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>

        <div className="space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl shadow-lg flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}
          
          {result && recommendations && (
            <div className="space-y-8">
              {/* Hava Kalitesi İstatistikleri */}
              <AirQualityStats data={result} />

              {/* Öneriler */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">Öneriler</h2>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span>Hava kalitesi durumuna göre özelleştirilmiş öneriler</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-6 rounded-xl ${getStatusColor(recommendations.overallStatus)} hover:shadow-md transition-shadow`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-white/50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Dış Aktivite Durumu</h3>
                        <p className="text-sm text-gray-600">Şu anki hava kalitesi için öneriler</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-base">{recommendations.outdoorActivity}</p>
                      <div className="pt-3 border-t border-gray-200">
                        <h4 className="font-medium mb-2">Önerilen Aktiviteler:</h4>
                        <ul className="space-y-2">
                          {recommendations.overallStatus === 'good' && (
                            <>
                              <li className="flex items-center gap-2 text-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>Açık havada spor yapabilirsiniz</span>
                              </li>
                              <li className="flex items-center gap-2 text-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>Piknik ve açık hava etkinlikleri uygundur</span>
                              </li>
                            </>
                          )}
                          {recommendations.overallStatus === 'moderate' && (
                            <>
                              <li className="flex items-center gap-2 text-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>Hafif aktiviteler yapabilirsiniz</span>
                              </li>
                              <li className="flex items-center gap-2 text-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>Yoğun egzersizlerden kaçının</span>
                              </li>
                            </>
                          )}
                          {recommendations.overallStatus === 'poor' && (
                            <>
                              <li className="flex items-center gap-2 text-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-600" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>Dışarıda minimum süre geçirin</span>
                              </li>
                              <li className="flex items-center gap-2 text-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-600" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>Fiziksel aktiviteleri kapalı alanlarda yapın</span>
                              </li>
                            </>
                          )}
                          {recommendations.overallStatus === 'very_poor' && (
                            <>
                              <li className="flex items-center gap-2 text-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>Mümkünse dışarı çıkmayın</span>
                              </li>
                              <li className="flex items-center gap-2 text-sm">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>Tüm aktiviteleri kapalı alanlarda yapın</span>
                              </li>
                            </>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className={`p-6 rounded-xl ${getStatusColor(recommendations.overallStatus)} hover:shadow-md transition-shadow`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-white/50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Sağlık Önerileri</h3>
                        <p className="text-sm text-gray-600">Sağlığınız için önemli tavsiyeler</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-base">{recommendations.healthAdvice}</p>
                      <div className="pt-3 border-t border-gray-200">
                        <h4 className="font-medium mb-2">Hassas Gruplar İçin:</h4>
                        <ul className="space-y-2">
                          <li className="flex items-start gap-2 text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>Astım, KOAH ve diğer solunum yolu hastalığı olanlar dikkatli olmalı</span>
                          </li>
                          <li className="flex items-start gap-2 text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>Yaşlılar ve çocuklar için özel önlemler alınmalı</span>
                          </li>
                          <li className="flex items-start gap-2 text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span>Kalp ve damar hastalığı olanlar dışarıda minimum süre geçirmeli</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className={`p-6 rounded-xl ${getStatusColor(recommendations.overallStatus)} hover:shadow-md transition-shadow`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-white/50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Maske Kullanımı</h3>
                        <p className="text-sm text-gray-600">Koruyucu önlemler</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <p className="text-base">{recommendations.maskAdvice}</p>
                      <div className="pt-3 border-t border-gray-200">
                        <h4 className="font-medium mb-2">Maske Kullanım Önerileri:</h4>
                        <ul className="space-y-2">
                          {recommendations.overallStatus === 'good' && (
                            <li className="flex items-center gap-2 text-sm">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span>Maske kullanımı gerekli değil</span>
                            </li>
                          )}
                          {recommendations.overallStatus === 'moderate' && (
                            <li className="flex items-center gap-2 text-sm">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span>Hassas gruplar için maske önerilir</span>
                            </li>
                          )}
                          {recommendations.overallStatus === 'poor' && (
                            <li className="flex items-center gap-2 text-sm">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span>Dışarıda maske kullanımı önerilir</span>
                            </li>
                          )}
                          {recommendations.overallStatus === 'very_poor' && (
                            <li className="flex items-center gap-2 text-sm">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              <span>Dışarıda mutlaka maske kullanılmalı</span>
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-xl bg-blue-50 border border-blue-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-white/50">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-blue-900">Genel Bilgilendirme</h3>
                        <p className="text-sm text-blue-700">Önemli notlar ve bilgiler</p>
                      </div>
                    </div>
                    <ul className="space-y-3">
                      <li className="flex items-start gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <span className="text-blue-900 font-medium">Veri Güncellemesi</span>
                          <p className="text-sm text-blue-700">Hava kalitesi verileri saatlik olarak güncellenmektedir.</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <span className="text-blue-900 font-medium">Kişiselleştirilmiş Öneriler</span>
                          <p className="text-sm text-blue-700">Öneriler, mevcut hava kalitesi durumuna göre kişiselleştirilmiştir.</p>
                        </div>
                      </li>
                      <li className="flex items-start gap-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <span className="text-blue-900 font-medium">Hassas Gruplar</span>
                          <p className="text-sm text-blue-700">Astım, kalp hastalığı vb. kronik rahatsızlığı olanlar için özel önlemler alınmalıdır.</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Son 24 Saat Hava Kalitesi Değişimi */}
              {historicalData && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-100">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold text-gray-900">Son 24 Saat Hava Kalitesi Değişimi</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <span>Grafiğin üzerine gelerek detaylı bilgi alabilirsiniz</span>
                    </div>
                  </div>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={historicalData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="time" 
                          stroke="#6b7280"
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => value.split(':')[0] + ':00'}
                        />
                        <YAxis 
                          stroke="#6b7280"
                          tick={{ fontSize: 12 }}
                          label={{ 
                            value: 'Değer', 
                            angle: -90, 
                            position: 'insideLeft',
                            style: { textAnchor: 'middle', fontSize: 12 }
                          }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.75rem',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                          formatter={(value: number, name: string) => {
                            const unit = name === 'AQI' ? '' : ' µg/m³';
                            return [value.toFixed(1) + unit, name];
                          }}
                          labelFormatter={(label) => `Saat: ${label}`}
                        />
                        <Legend 
                          verticalAlign="top" 
                          height={36}
                          wrapperStyle={{
                            paddingBottom: '20px'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="aqi" 
                          stroke="#8884d8" 
                          name="AQI" 
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="pm2_5" 
                          stroke="#82ca9d" 
                          name="PM2.5" 
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="pm10" 
                          stroke="#ffc658" 
                          name="PM10" 
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['aqi', 'pm2_5', 'pm10'].map((metric) => {
                      const data = historicalData
                        .map(d => d[metric as keyof typeof d] as number)
                        .filter((value): value is number => value !== null && value !== undefined);
                      
                      if (data.length === 0) return null;

                      const max = Math.max(...data);
                      const min = Math.min(...data);
                      const avg = data.reduce((a, b) => a + b, 0) / data.length;
                      const current = data[data.length - 1];
                      const firstValue = data[0];
                      const change = firstValue !== 0 ? ((current - firstValue) / firstValue * 100).toFixed(1) : '0.0';
                      const isPositive = Number(change) > 0;

                      return (
                        <div key={metric} className="bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-gray-200">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-gray-800">
                              {metric === 'aqi' ? 'AQI' : metric === 'pm2_5' ? 'PM2.5' : 'PM10'}
                            </h3>
                            <span className={`text-sm font-medium ${isPositive ? 'text-red-700' : 'text-green-700'}`}>
                              {isPositive ? '↑' : '↓'} {Math.abs(Number(change))}%
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-700">Mevcut:</span>
                              <span className="font-medium text-gray-900">{current.toFixed(1)}{metric === 'aqi' ? '' : ' µg/m³'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-700">Ortalama:</span>
                              <span className="font-medium text-gray-900">{avg.toFixed(1)}{metric === 'aqi' ? '' : ' µg/m³'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-700">En Yüksek:</span>
                              <span className="font-medium text-gray-900">{max.toFixed(1)}{metric === 'aqi' ? '' : ' µg/m³'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-700">En Düşük:</span>
                              <span className="font-medium text-gray-900">{min.toFixed(1)}{metric === 'aqi' ? '' : ' µg/m³'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Gelecek 24 Saat Tahmini */}
              {forecast && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-100">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-semibold text-gray-900">Gelecek 24 Saat Tahmini</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <span>Grafiğin üzerine gelerek detaylı bilgi alabilirsiniz</span>
                    </div>
                  </div>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={forecast}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="time" 
                          stroke="#6b7280"
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => value.split(':')[0] + ':00'}
                        />
                        <YAxis 
                          stroke="#6b7280"
                          tick={{ fontSize: 12 }}
                          label={{ 
                            value: 'Değer', 
                            angle: -90, 
                            position: 'insideLeft',
                            style: { textAnchor: 'middle', fontSize: 12 }
                          }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(8px)',
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.75rem',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                          formatter={(value: number, name: string) => {
                            const unit = name === 'AQI' ? '' : ' µg/m³';
                            return [value.toFixed(1) + unit, name];
                          }}
                          labelFormatter={(label) => `Saat: ${label}`}
                        />
                        <Legend 
                          verticalAlign="top" 
                          height={36}
                          wrapperStyle={{
                            paddingBottom: '20px'
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="aqi" 
                          stroke="#8884d8" 
                          name="AQI" 
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="pm2_5" 
                          stroke="#82ca9d" 
                          name="PM2.5" 
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="pm10" 
                          stroke="#ffc658" 
                          name="PM10" 
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['aqi', 'pm2_5', 'pm10'].map((metric) => {
                      const data = forecast
                        .map(d => d[metric as keyof typeof d] as number)
                        .filter((value): value is number => value !== null && value !== undefined);
                      
                      if (data.length === 0) return null;

                      const max = Math.max(...data);
                      const min = Math.min(...data);
                      const avg = data.reduce((a, b) => a + b, 0) / data.length;
                      const current = data[0];
                      const lastValue = data[data.length - 1];
                      const change = current !== 0 ? ((lastValue - current) / current * 100).toFixed(1) : '0.0';
                      const isPositive = Number(change) > 0;

                      return (
                        <div key={metric} className="bg-white/50 backdrop-blur-sm p-4 rounded-xl border border-gray-200">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-gray-800">
                              {metric === 'aqi' ? 'AQI' : metric === 'pm2_5' ? 'PM2.5' : 'PM10'}
                            </h3>
                            <span className={`text-sm font-medium ${isPositive ? 'text-red-700' : 'text-green-700'}`}>
                              {isPositive ? '↑' : '↓'} {Math.abs(Number(change))}%
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-700">Başlangıç:</span>
                              <span className="font-medium text-gray-900">{current.toFixed(1)}{metric === 'aqi' ? '' : ' µg/m³'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-700">Bitiş:</span>
                              <span className="font-medium text-gray-900">{lastValue.toFixed(1)}{metric === 'aqi' ? '' : ' µg/m³'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-700">Ortalama:</span>
                              <span className="font-medium text-gray-900">{avg.toFixed(1)}{metric === 'aqi' ? '' : ' µg/m³'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-700">En Yüksek:</span>
                              <span className="font-medium text-gray-900">{max.toFixed(1)}{metric === 'aqi' ? '' : ' µg/m³'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-700">En Düşük:</span>
                              <span className="font-medium text-gray-900">{min.toFixed(1)}{metric === 'aqi' ? '' : ' µg/m³'}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
    </div>
  );
}
