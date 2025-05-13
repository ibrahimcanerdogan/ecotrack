"use client";
import { useState } from "react";
import { getCoordinates, getAirQuality, AirQualityData } from "./api";

export default function Home() {
  const [location, setLocation] = useState("");
  const [result, setResult] = useState<AirQualityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const coords = await getCoordinates(location);
      if (!coords) {
        setError("Konum bulunamadı. Lütfen geçerli bir şehir, ülke veya koordinat girin.");
        setLoading(false);
        return;
      }
      const airQuality = await getAirQuality(coords.latitude, coords.longitude);
      if (!airQuality) {
        setError("Hava kalitesi verisi alınamadı.");
        setLoading(false);
        return;
      }
      setResult(airQuality);
    } catch (err) {
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-100 to-blue-100 p-4">
      <h1 className="text-3xl font-bold mb-6 text-green-900">EcoTrack 🌱</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md bg-white rounded-lg shadow p-6">
        <label htmlFor="location" className="font-medium text-gray-700">Şehir, ülke veya koordinat girin:</label>
        <input
          id="location"
          type="text"
          value={location}
          onChange={e => setLocation(e.target.value)}
          placeholder="Örn: İstanbul, Türkiye veya 41.0082,28.9784"
          className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
          required
        />
        <button
          type="submit"
          className="bg-green-600 text-white rounded px-4 py-2 font-semibold hover:bg-green-700 transition"
          disabled={loading}
        >
          {loading ? "Sorgulanıyor..." : "Hava Kalitesini Göster"}
        </button>
      </form>
      <div className="mt-8 w-full max-w-md">
        {error && <div className="text-red-600 mb-4">{error}</div>}
        {result && (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Hava Kalitesi Verileri</h2>
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
        )}
      </div>
    </div>
  );
}
