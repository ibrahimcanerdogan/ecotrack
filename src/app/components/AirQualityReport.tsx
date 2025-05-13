import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Font } from '@react-pdf/renderer';
import { AirQualityData, AirQualityRecommendation } from '../api';

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
}

const AirQualityReport = ({ location, data, recommendations }: AirQualityReportProps) => (
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

      <View style={styles.section}>
        <Text style={styles.title}>Öneriler</Text>
        <Text style={styles.text}>{recommendations.outdoorActivity}</Text>
        <Text style={styles.text}>{recommendations.healthAdvice}</Text>
        <Text style={styles.text}>{recommendations.maskAdvice}</Text>
      </View>

      <Text style={styles.footer}>
        Bu rapor EcoTrack tarafından oluşturulmuştur. Veriler Open-Meteo API'sinden alınmıştır.
      </Text>
    </Page>
  </Document>
);

export default AirQualityReport; 