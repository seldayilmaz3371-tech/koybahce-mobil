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

**Durum: 🟡 MİMARİ TASARIM AŞAMASINDA** (kod geliştirme henüz başlamadı)

### Tamamlanan Aşamalar
1. ✅ Analiz (web projesi veri modeli denetimi)
2. ✅ Hakem değerlendirmesi (enum-kod bulgusu dahil)
3. ✅ Mimari tasarım (katman uygulaması)
4. ✅ Veri modeli (Parcel/Tree arayüzleri)
5. ✅ SQLite tasarımı (şema sürüm 2)
6. ✅ Repository tasarımı (arayüz düzeyinde)
7. ✅ UI planlaması (klasör yapısı, i18n anahtar planı)
8. ✅ ADR hazırlıkları (0016, 0017, 0018, 0019)

### Bu Oturumda Tamamlanacak Ek Aşamalar
9. Risk analizi
10. Güvenlik değerlendirmesi
11. Performans değerlendirmesi
12. Offline-first doğrulaması
13. Çoklu dil desteği doğrulaması
14. AI entegrasyonu hazırlığı

(Aşağıda sohbet kaydında detaylandırılmıştır.)
