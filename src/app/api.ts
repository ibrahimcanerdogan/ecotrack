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

export type AirQualityRecommendation = {
  outdoorActivity: string;
  healthAdvice: string;
  maskAdvice: string;
  overallStatus: 'good' | 'moderate' | 'poor' | 'very_poor';
};

export type HistoricalAirQualityData = {
  time: string;
  pm10: number;
  pm2_5: number;
  co: number;
  no2: number;
  o3: number;
  so2: number;
  aqi: number;
}[];

export type FavoriteLocation = {
  name: string;
  latitude: number;
  longitude: number;
  lastUpdated?: string;
  displayName?: string;
};

export type AirQualityForecast = {
  time: string;
  aqi: number;
  pm2_5: number;
  pm10: number;
  co: number;
  no2: number;
  o3: number;
  so2: number;
}[];

// Basit bir geocoding için Open-Meteo'nun ücretsiz endpointi kullanılabilir
export async function getCoordinates(location: string): Promise<{ latitude: number; longitude: number; displayName?: string } | null> {
  // Eğer doğrudan koordinat girildiyse (örn: 41.0082,28.9784)
  const coordMatch = location.match(/^\s*(-?\d{1,3}\.\d+),\s*(-?\d{1,3}\.\d+)\s*$/);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lon = parseFloat(coordMatch[2]);
    
    // Koordinatlar için ters geocoding yap
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?latitude=${lat}&longitude=${lon}&count=1&language=tr&format=json`
      );
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        return {
          latitude: lat,
          longitude: lon,
          displayName: data.results[0].name
        };
      }
    } catch (error) {
      console.error("Ters geocoding hatası:", error);
    }
    
    return {
      latitude: lat,
      longitude: lon,
      displayName: `${lat.toFixed(2)}, ${lon.toFixed(2)}`
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
      displayName: data.results[0].name
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

export function getAirQualityRecommendations(data: AirQualityData): AirQualityRecommendation {
  const aqi = data.aqi || 0;
  const pm2_5 = data.pm2_5 || 0;
  const pm10 = data.pm10 || 0;

  let outdoorActivity = '';
  let healthAdvice = '';
  let maskAdvice = '';
  let overallStatus: 'good' | 'moderate' | 'poor' | 'very_poor' = 'good';

  // AQI değerine göre genel durum
  if (aqi <= 50) {
    overallStatus = 'good';
    outdoorActivity = 'Hava kalitesi iyi. Dışarıda spor yapabilirsiniz.';
    healthAdvice = 'Hava kalitesi iyi seviyede. Normal aktivitelerinize devam edebilirsiniz.';
    maskAdvice = 'Maske takmanıza gerek yok.';
  } else if (aqi <= 100) {
    overallStatus = 'moderate';
    outdoorActivity = 'Hava kalitesi orta seviyede. Kısa süreli dış aktiviteler yapabilirsiniz.';
    healthAdvice = 'Hassas gruplar için orta seviye risk.';
    maskAdvice = 'Hassas gruplar için maske önerilir.';
  } else if (aqi <= 150) {
    overallStatus = 'poor';
    outdoorActivity = 'Hava kalitesi kötü. Dışarıda spor yapmanız önerilmez.';
    healthAdvice = 'Hassas gruplar için yüksek risk. Mümkünse dışarı çıkmayın.';
    maskAdvice = 'Maske takmanız önerilir.';
  } else {
    overallStatus = 'very_poor';
    outdoorActivity = 'Hava kalitesi çok kötü. Kesinlikle dışarıda spor yapmayın.';
    healthAdvice = 'Tüm gruplar için yüksek risk. Mümkünse dışarı çıkmayın.';
    maskAdvice = 'Kesinlikle maske takın.';
  }

  // PM2.5 ve PM10 değerlerine göre ek öneriler
  if (pm2_5 > 35.4 || pm10 > 54) {
    healthAdvice += ' Partikül madde seviyesi yüksek.';
    if (pm2_5 > 35.4) {
      maskAdvice = 'N95 veya FFP2 maske takmanız önerilir.';
    }
  }

  return {
    outdoorActivity,
    healthAdvice,
    maskAdvice,
    overallStatus
  };
}

export async function getHistoricalAirQuality(lat: number, lon: number): Promise<HistoricalAirQualityData | null> {
  // Son 24 saatlik veriyi al
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone,sulphur_dioxide,us_aqi&timezone=auto&past_days=1`;
  const res = await fetch(url);
  const data = await res.json();
  
  if (data.hourly && data.hourly.time && data.hourly.pm2_5) {
    return data.hourly.time.map((time: string, index: number) => ({
      time: new Date(time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      pm10: data.hourly.pm10[index],
      pm2_5: data.hourly.pm2_5[index],
      co: data.hourly.carbon_monoxide[index],
      no2: data.hourly.nitrogen_dioxide[index],
      o3: data.hourly.ozone[index],
      so2: data.hourly.sulphur_dioxide[index],
      aqi: data.hourly.us_aqi[index],
    }));
  }
  return null;
}

// Favori konumları localStorage'dan al
export function getFavoriteLocations(): FavoriteLocation[] {
  if (typeof window === 'undefined') return [];
  try {
    const favorites = localStorage.getItem('favoriteLocations');
    return favorites ? JSON.parse(favorites) : [];
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return [];
  }
}

// Favori konum ekle
export function addFavoriteLocation(location: FavoriteLocation): void {
  if (typeof window === 'undefined') return;
  try {
    const favorites = getFavoriteLocations();
    if (!favorites.some(fav => 
      fav.latitude === location.latitude && 
      fav.longitude === location.longitude
    )) {
      favorites.push(location);
      localStorage.setItem('favoriteLocations', JSON.stringify(favorites));
    }
  } catch (error) {
    console.error('Error writing to localStorage:', error);
  }
}

// Favori konum sil
export function removeFavoriteLocation(latitude: number, longitude: number): void {
  if (typeof window === 'undefined') return;
  try {
    const favorites = getFavoriteLocations();
    const updatedFavorites = favorites.filter(fav => 
      fav.latitude !== latitude || fav.longitude !== longitude
    );
    localStorage.setItem('favoriteLocations', JSON.stringify(updatedFavorites));
  } catch (error) {
    console.error('Error writing to localStorage:', error);
  }
}

// Tüm favori konumları sil
export function clearAllFavoriteLocations(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem('favoriteLocations');
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
}

// Konum favori mi kontrol et
export function isFavoriteLocation(latitude: number, longitude: number): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const favorites = getFavoriteLocations();
    return favorites.some(fav => 
      fav.latitude === latitude && 
      fav.longitude === longitude
    );
  } catch (error) {
    console.error('Error checking favorite location:', error);
    return false;
  }
}

// Gelecek 24 saat için hava kalitesi tahminlerini al
export async function getAirQualityForecast(lat: number, lon: number): Promise<AirQualityForecast | null> {
  try {
    const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone,sulphur_dioxide,us_aqi&forecast_days=1`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.hourly && data.hourly.time && data.hourly.pm2_5) {
      return data.hourly.time.map((time: string, index: number) => ({
        time: new Date(time).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        pm10: data.hourly.pm10[index],
        pm2_5: data.hourly.pm2_5[index],
        co: data.hourly.carbon_monoxide[index],
        no2: data.hourly.nitrogen_dioxide[index],
        o3: data.hourly.ozone[index],
        so2: data.hourly.sulphur_dioxide[index],
        aqi: data.hourly.us_aqi[index],
      }));
    }
    return null;
  } catch (error) {
    console.error("Hava kalitesi tahmini alınamadı:", error);
    return null;
  }
} 