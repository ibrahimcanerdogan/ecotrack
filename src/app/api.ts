export type AirQualityData = {
  pm10?: number;
  pm2_5?: number;
  co?: number;
  no2?: number;
  o3?: number;
  so2?: number;
  aqi?: number;
  time?: string;
};

// Basit bir geocoding için Open-Meteo'nun ücretsiz endpointi kullanılabilir
export async function getCoordinates(location: string): Promise<{ latitude: number; longitude: number } | null> {
  // Eğer doğrudan koordinat girildiyse (örn: 41.0082,28.9784)
  const coordMatch = location.match(/^\s*(-?\d{1,3}\.\d+),\s*(-?\d{1,3}\.\d+)\s*$/);
  if (coordMatch) {
    return {
      latitude: parseFloat(coordMatch[1]),
      longitude: parseFloat(coordMatch[2]),
    };
  }
  // Şehir/ülke için Open-Meteo geocoding API
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=tr&format=json`
  );
  const data = await res.json();
  if (data.results && data.results.length > 0) {
    return {
      latitude: data.results[0].latitude,
      longitude: data.results[0].longitude,
    };
  }
  return null;
}

export async function getAirQuality(lat: number, lon: number): Promise<AirQualityData | null> {
  // Open-Meteo hava kalitesi endpointi - doğru parametre isimleriyle
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone,sulphur_dioxide,us_aqi`;
  const res = await fetch(url);
  const data = await res.json();
  console.log("Open-Meteo yanıtı:", data); // DEBUG

  if (data.hourly) {
    // Son saatlik veriyi al
    const lastIdx = data.hourly.time.length - 1;
    return {
      pm10: data.hourly.pm10?.[lastIdx],
      pm2_5: data.hourly.pm2_5?.[lastIdx],
      co: data.hourly.carbon_monoxide?.[lastIdx],
      no2: data.hourly.nitrogen_dioxide?.[lastIdx],
      o3: data.hourly.ozone?.[lastIdx],
      so2: data.hourly.sulphur_dioxide?.[lastIdx],
      aqi: data.hourly.us_aqi?.[lastIdx],
      time: data.hourly.time?.[lastIdx],
    };
  }
  return null;
} 