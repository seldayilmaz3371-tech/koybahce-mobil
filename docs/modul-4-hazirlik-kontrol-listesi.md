# Modül 4 Hazırlık Kontrol Listesi — Finans

Bu belge, Modül 4 planlaması başladığında referans alınacak bir kontrol listesidir. Henüz hiçbir Modül 4 kararı verilmedi.

## Güncellenecek Belgeler
- [ ] Database Master Schema — `finance_records` `[PLANLANAN]`'dan `[UYGULANDI]`'ya taşınacak
- [ ] ERD — Finans ilişkileri kesinleştirilecek
- [ ] Repository Contract Matrix — `FinanceRepository` satırı eklenecek

## Yeni Repository'ler (Beklenen)
- `FinanceRepository` — `record_type` (cost/harvest/sale) enum-kodlu, `parcel_id` zorunlu, `tree_id` opsiyonel (referans ağaç bazlı hasat takibi zaten Database Master Schema'da planlı)

## Yeni Hook'lar (Beklenen)
- `useFinanceRecords` — muhtemelen tarih aralığı filtreleme gerektirecek (Gözlem'in "backlog #8 arama/filtreleme" ihtiyacıyla benzer, bu kez muhtemelen ERTELENEMEZ çünkü finans raporlaması doğası gereği tarih aralığı gerektirir — Modül 4'ün İLK mimari kararı bu olmalı)

## Beklenen Ekranlar
- `FinanceScreen`, `FinanceRecordForm`
- Muhtemelen basit bir özet/toplam görünümü (ör. "bu ay toplam maliyet") — Database Master Schema'da zaten not edildiği gibi, bu ayrı bir tablo gerektirmez, mevcut veriler üzerinde SQL toplamı

## Test Stratejisi
- Mevcut desen (Vitest + better-sqlite3 + @testing-library/react + E2E) doğrudan uygulanabilir

## Kabul Kriterleri (Taslak, Modül 2-3 ile Tutarlı)
- Gerçek cihaz testi
- Offline-first korunmalı
- i18n/Accessibility/Error Code Standard baştan uygulanmalı

## 🔴 Kritik Öncelik: Router Kararı

Modül 2'den beri ertelenen router eksikliği, Modül 3 sonunda **6 ekrana** çıktı (Parsel/Ağaç/Gözlem/Fotoğraf/Referans + gelecek Finans). **Modül 4 planlamasının İLK konusu bu olmalı** — daha fazla ertelemek, App.tsx'in view-state mantığını sürdürülemez hale getirebilir.

## Riskler
- Para birimi/yerelleştirme (Database Master Schema'da `currency_code` zaten planlı, ama gösterim formatı — binlik ayracı, ondalık — henüz hiç ele alınmadı)
- Tarih aralığı raporlama sorgularının performansı (büyük veri, ama Observation'da zaten kanıtlanmış indeksleme deseni doğrudan uygulanabilir)

## Teknik Borçların Modül 4'e Etkisi
- **Router eksikliği:** Yukarıda kritik öncelik olarak işaretlendi.
- **`isSubmitting` yarış durumu:** Yeni `FinanceRecordForm` yazılırken, `useRef` deseni **baştan** uygulanmalı (Photo'da öğrenilen ders).
- **Error Code Standard'ın UI'da tüketilmemesi:** Finans hataları (ör. geçersiz tutar) için bu, artık ertelenemeyecek kadar birikmiş olabilir — Modül 4 başında değerlendirilmeli.
