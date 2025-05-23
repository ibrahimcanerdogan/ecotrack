import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { AirQualityData, AirQualityRecommendation, HistoricalAirQualityData, AirQualityForecast } from '../api';

// Türkçe karakterleri destekleyen font tanımlaması
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf', fontWeight: 300 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf', fontWeight: 500 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    backgroundColor: '#ffffff',
    fontFamily: 'Roboto',
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    color: '#2c5282',
    fontWeight: 700,
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  title: {
    fontSize: 18,
    marginBottom: 10,
    color: '#2d3748',
    fontWeight: 500,
  },
  text: {
    fontSize: 12,
    marginBottom: 5,
    color: '#4a5568',
    fontWeight: 400,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  label: {
    fontWeight: 500,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: '#718096',
    fontSize: 10,
    fontWeight: 300,
  },
});

interface AirQualityReportProps {
  location: string;
  data: AirQualityData;
  recommendations: AirQualityRecommendation;
  historicalData?: HistoricalAirQualityData | null;
  forecast?: AirQualityForecast | null;
}

const AirQualityReport = ({ location, data, recommendations, historicalData, forecast }: AirQualityReportProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>Hava Kalitesi Raporu</Text>
      
      <View style={styles.section}>
        <Text style={styles.title}>Konum Bilgisi</Text>
        <Text style={styles.text}>{location}</Text>
        <Text style={styles.text}>Rapor Tarihi: {new Date().toLocaleDateString('tr-TR')}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.title}>Hava Kalitesi Verileri</Text>
        <View style={styles.dataRow}>
          <Text style={styles.label}>AQI:</Text>
          <Text style={styles.text}>{data.aqi}</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.label}>PM2.5:</Text>
          <Text style={styles.text}>{data.pm2_5} µg/m³</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.label}>PM10:</Text>
          <Text style={styles.text}>{data.pm10} µg/m³</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.label}>CO:</Text>
          <Text style={styles.text}>{data.co} µg/m³</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.label}>NO₂:</Text>
          <Text style={styles.text}>{data.no2} µg/m³</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.label}>O₃:</Text>
          <Text style={styles.text}>{data.o3} µg/m³</Text>
        </View>
        <View style={styles.dataRow}>
          <Text style={styles.label}>SO₂:</Text>
          <Text style={styles.text}>{data.so2} µg/m³</Text>
        </View>
      </View>

      {historicalData && (
        <View style={styles.section}>
          <Text style={styles.title}>Son 24 Saat Hava Kalitesi Değişimi</Text>
          {historicalData.map((hour, index) => (
            <View key={index} style={styles.dataRow}>
              <Text style={styles.label}>{hour.time}:</Text>
              <Text style={styles.text}>AQI: {hour.aqi}, PM2.5: {hour.pm2_5} µg/m³, PM10: {hour.pm10} µg/m³</Text>
            </View>
          ))}
        </View>
      )}

      {forecast && (
        <View style={styles.section}>
          <Text style={styles.title}>Gelecek 24 Saat Tahmini</Text>
          {forecast.map((hour, index) => (
            <View key={index} style={styles.dataRow}>
              <Text style={styles.label}>{hour.time}:</Text>
              <Text style={styles.text}>AQI: {hour.aqi}, PM2.5: {hour.pm2_5} µg/m³, PM10: {hour.pm10} µg/m³</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.title}>Öneriler</Text>
        <Text style={styles.text}>{recommendations.outdoorActivity}</Text>
        <Text style={styles.text}>{recommendations.healthAdvice}</Text>
        <Text style={styles.text}>{recommendations.maskAdvice}</Text>
      </View>

      <Text style={styles.footer}>
        Bu rapor EcoTrack tarafından oluşturulmuştur. Veriler Open-Meteo API&apos;sinden alınmıştır.
      </Text>
    </Page>
  </Document>
);

export default AirQualityReport; 