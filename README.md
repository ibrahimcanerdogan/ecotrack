# 🌱 Hava Kalitesi Takip Uygulaması

Bu proje, kullanıcıların bulundukları konumun veya istedikleri lokasyonun hava kalitesini takip edebilecekleri, detaylı analiz ve öneriler sunan modern bir web uygulamasıdır.

## ✨ Özellikler

- 📍 Gerçek zamanlı hava kalitesi takibi
- 🗺️ İnteraktif harita görünümü
- 📊 Detaylı grafikler ve istatistikler
- ⏰ Geçmiş 24 saat ve gelecek 24 saat tahminleri
- 💡 Hava kalitesine göre özelleştirilmiş öneriler
- 📱 Responsive tasarım
- ⭐ Favori konumları kaydetme
- 📄 PDF rapor indirme

## 🛠️ Kullanılan Teknolojiler

- Next.js
- TypeScript
- Tailwind CSS
- Recharts (Grafikler için)
- React-PDF (PDF raporları için)
- Open-Meteo API
- Air Quality API

## 🚀 Başlangıç

### Gereksinimler

- Node.js (v14 veya üzeri)
- npm veya yarn

### Kurulum

1. Projeyi klonlayın:
```bash
git clone https://github.com/ibrahimcanerdogan/ecotrack.git
```

2. Proje dizinine gidin:
```bash
cd hava-kalitesi-takip
```

3. Bağımlılıkları yükleyin:
```bash
npm install
# veya
yarn install
```

4. Geliştirme sunucusunu başlatın:
```bash
npm run dev
# veya
yarn dev
```

5. Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın.

## 📝 Kullanım

1. Ana sayfada konum girişi yapın veya "Konumumu Bul" butonunu kullanın
2. Hava kalitesi verilerini görüntüleyin
3. Grafikler ve istatistikler ile detaylı analiz yapın
4. Önerileri inceleyin
5. İsterseniz konumu favorilere ekleyin
6. PDF rapor indirin

## 🔍 API Entegrasyonu

Uygulama, hava kalitesi verilerini almak için Open-Meteo API ve Air Quality API'yi kullanmaktadır. API anahtarlarınızı `.env` dosyasında tanımlamanız gerekmektedir:

```env
NEXT_PUBLIC_OPEN_METEO_API_URL=https://api.open-meteo.com/v1
NEXT_PUBLIC_AIR_QUALITY_API_URL=https://air-quality-api.example.com
```

## 🤝 Katkıda Bulunma

1. Bu depoyu fork edin
2. Yeni bir branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Daha fazla bilgi için `LICENSE` dosyasına bakın.

## 📞 İletişim


Proje Linki: [https://github.com/ibrahimcanerdogan/ecotrack](https://github.com/ibrahimcanerdogan/ecotrack)
