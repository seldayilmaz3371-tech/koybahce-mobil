# Modül 3 Hazırlık Kontrol Listesi — Gözlemler ve Fotoğraflar

Bu belge, Modül 3 planlaması başladığında referans alınacak bir kontrol listesidir. Henüz hiçbir Modül 3 kararı verilmedi.

## Güncellenecek Belgeler
- [ ] Database Master Schema — Fotoğraf↔Gözlem ilişkisi kararı (A/B seçeneği, bkz. belge içi not) kesinleştirilecek
- [ ] ERD — `observations`/`photos` tabloları `[PLANLANAN]`'dan `[UYGULANDI]`'ya taşınacak
- [ ] Navigation Flow — Parsel Detay ekranı gerekip gerekmediği yeniden değerlendirilecek (Modül 2'de "henüz gerekmiyor" denmişti)
- [ ] Repository Contract Matrix — `ObservationRepository`/`PhotoRepository` satırları eklenecek

## Yeni Repository'ler (Beklenen)
- `ObservationRepository` — Parsel/Ağaç bazlı gözlem CRUD
- `PhotoRepository` — dosya yolu + meta veri yönetimi (gerçek dosya I/O ayrı ele alınmalı — SQLite sadece yol saklıyor)

## Yeni Hook'lar (Beklenen)
- `useObservations` — muhtemelen `useTrees`'teki gibi çift modlu (parcel-scoped / tree-scoped)
- Fotoğraf için ayrı bir hook mu yoksa `useObservations`'a mı entegre olacağı, ilişki kararına bağlı

## Beklenen Ekranlar
- `ObservationsScreen`, `ObservationForm`
- Fotoğraf çekme/seçme akışı (native kamera/galeri entegrasyonu — Modül 1/2'de hiç ele alınmadı, yeni bir native yetenek)

## Test Stratejisi
- Mevcut desen (Vitest + better-sqlite3 + @testing-library/react) doğrudan uygulanabilir
- **Yeni zorluk:** Fotoğraf dosya sistemi işlemleri (Capacitor Filesystem API) test edilebilirliği — bu, henüz hiç ele alınmamış bir konu, araştırma gerektirecek

## Kabul Kriterleri (Taslak, Modül 2 ile Tutarlı)
- Gerçek cihaz testi (özellikle kamera izinleri, dosya depolama)
- Offline-first korunmalı (fotoğraflar yerel depoda, senkronizasyon yok)
- i18n/Accessibility/Error Code Standard uygulanmalı (bu sefer baştan, Modül 2'deki gibi sonradan değil)

## Riskler
- Fotoğraf dosyalarının cihaz depolama alanını hızla doldurabilmesi — sıkıştırma/boyut sınırı kararı gerekebilir
- Kamera izinleri reddedilirse davranış (Error Handling Standard'a yeni `NATIVE_xxx` kodları eklenmeli)

## Teknik Borçların Modül 3'e Etkisi
- **Router eksikliği:** Modül 3 ile ekran sayısı 4-5'e çıkacak — bu, artık ciddi şekilde ele alınmalı, Modül 3 planlamasının **ilk** konusu olmalı.
- **Error Code Standard'ın UI'da tüketilmemesi:** Modül 3'te YENİ hata senaryoları (kamera izni, disk dolu) gelecek — bu, UI entegrasyonunu ertelemeyi daha da zorlaştırabilir; Modül 3'ün başında ele alınması önerilir.
- **`restore()` eksikliği:** Fotoğraf/Gözlem için de aynı soft-delete deseni kullanılacaksa, bu eksiklik büyür — Modül 3 öncesi kapatılması düşünülebilir.
