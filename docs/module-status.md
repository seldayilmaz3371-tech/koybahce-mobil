# Modül Durumu Takibi

Bu belge, Engineering Protocol Bölüm 10'daki (Test Kapısı) yaşam döngüsünün her modül için resmi kaydını tutar:

```
Kod Yazılıyor → Kod Hazır → Gerçek Android Testi Bekleniyor → Test Başarılı → Modül Tamamlandı
```

---

## Modül 1 — Altyapı

**Durum: ✅ ACCEPTED / FROZEN / COMPLETED**
**Tamamlanma tarihi:** 2026-07-14

### Kapsam
Şifreli SQLite bağlantısı, migration sistemi, biyometrik/PIN kilit ekranı, güvenli depolama (Keystore), i18n/Globalization mimarisi, marka yapılandırması.

### Gerçek Cihaz Test Sonucu (Nihai)
Kullanıcı tarafından, `d9145f0` commit'inden derlenen APK ile doğrulandı:
- ✅ Şifreli veritabanı bağlantısı, kalıcılık (yeniden başlatma sonrası)
- ✅ Biyometrik doğrulama
- ✅ Secure Storage
- ✅ Preferences
- ✅ Çoklu dil desteği — **en riskli senaryo dahil** (sistem dili değişikliği + güncelleme kurulumu + kalıntı veri temizliği)
- ✅ Localization (tarih/saat biçimi)
- ✅ Offline-first davranış

### Bu Süreçte Bulunan ve Düzeltilen Kritik Sorunlar
1. Android Auto Backup + Keystore çakışması (ADR 0010)
2. Dil tercihi kalıcılığı tasarım hatası (ADR 0015)
3. `navigator.language` Android WebView güvenilirlik sorunu (ADR 0020)
4. Kalıntı dil tercihi verisi (ADR 0021)

### Dondurma Kuralı (Kullanıcı Kararı, 2026-07-14)
Modül 1'e **yeni özellik eklenmeyecek**. Yalnızca **kritik güvenlik açığı veya kritik hata** bulunursa düzeltme yapılacak — bu durumda yeni bir ADR ile belgelenip, bu belgedeki durum geçici olarak "Kritik Düzeltme Uygulanıyor" olarak güncellenecek, düzeltme sonrası tekrar "Completed"e dönecek.

---

## Modül 2 — Parseller ve Ağaçlar

**Durum: 🟡 KOD GELİŞTİRİLİYOR** (Parsel dikey dilimi tamamlandı — repository + hook + UI + test; Ağaç UI'ı henüz yok)

### Tamamlanan Aşamalar (Mimari)
1-14. Analiz → AI entegrasyonu hazırlığı — tümü tamamlandı (bkz. sohbet kaydı, ADR 0016-0019).

### Tamamlanan Kod (küçük, ayrı commit'ler halinde)
- Şema Sürüm 2 (`parcels`, `trees`) + domain tipleri
- Repository interface'leri + `ParcelRepository` + `TreeRepository` implementasyonları
- `useParcels` hook
- `ParcelsScreen`, `ParcelList`, `ParcelForm` (uçtan uca çalışan liste+oluştur+düzenle akışı)
- Ortak form bileşenleri (`src/shared/components/form/`) — Ağaç ve gelecekteki modüllerde yeniden kullanılabilir
- i18n anahtar denetimi: 36 statik anahtar, hiçbir gömülü metin yok
- Test altyapısı (Vitest + better-sqlite3, ADR 0018'in açık sorunu çözüldü) — `ParcelRepository` için 7 test, hepsi geçiyor

### Henüz Yapılmayanlar
- `TreeRepository` için hook/UI (Parsel deseni tekrarlanacak)
- `ParcelsScreen`'in gerçek uygulama navigasyonuna (App.tsx) bağlanması
- Gerçek Android cihaz testi (henüz APK üretilmedi)
