# Modül Durumu Takibi

Bu belge, Engineering Protocol Bölüm 10'daki (Test Kapısı) yaşam döngüsünün her modül için resmi kaydını tutar:

```
Kod Yazılıyor → Kod Hazır → Gerçek Android Testi Bekleniyor → Test Başarılı → Modül Tamamlandı
```

---

## Modül 1 — Altyapı

**Durum: ✅ RESMEN KAPANDI (Kullanıcı Kabul Raporu, 2026-07-15)**
**Tamamlanma tarihi:** 2026-07-14 · **Nihai kabul:** 2026-07-15

### Nihai Kabul Testi (Tam Kapsam)
Kullanıcının resmi kabul raporunda doğrulanan tam liste: Android Studio/Capacitor kurulumu, `npm install`/`build`/`cap sync`, APK üretimi + kurulumu + **güncelleme kurulumu**, SQLite, şifreli veritabanı, Secure Storage, Preferences, Biometric Authentication, Device Plugin, GitHub push.

**Dil sistemi — tam döngü doğrulaması:** TR → EN → TR geçişi, her adımda uygulamanın **tamamen** ilgili dilde açıldığı gerçek cihazda teyit edildi. Bu, ADR 0020/0021'in (native Device sorgusu + kalıntı veri temizliği) nihai, kesin kanıtıdır — "doğrulama bekleniyor" durumu artık geçerli değil.

### Dondurma Kuralı (Değişmedi)
Yeni özellik eklenmeyecek. Sadece kritik güvenlik açığı/hata durumunda düzeltme yapılacak.

### Kapsam
Şifreli SQLite bağlantısı, migration sistemi, biyometrik/PIN kilit ekranı, güvenli depolama (Keystore), i18n/Globalization mimarisi, marka yapılandırması.

### Bu Süreçte Bulunan ve Düzeltilen Kritik Sorunlar
1. Android Auto Backup + Keystore çakışması (ADR 0010)
2. Dil tercihi kalıcılığı tasarım hatası (ADR 0015)
3. `navigator.language` Android WebView güvenilirlik sorunu (ADR 0020)
4. Kalıntı dil tercihi verisi (ADR 0021)

### Dondurma Kuralı (Kullanıcı Kararı, 2026-07-14)
Modül 1'e **yeni özellik eklenmeyecek**. Yalnızca **kritik güvenlik açığı veya kritik hata** bulunursa düzeltme yapılacak — bu durumda yeni bir ADR ile belgelenip, bu belgedeki durum geçici olarak "Kritik Düzeltme Uygulanıyor" olarak güncellenecek, düzeltme sonrası tekrar "Completed"e dönecek.

---

## Modül 2 — Parseller ve Ağaçlar

**Durum: ✅ RESMEN TAMAMLANDI** (Kullanıcı Kabul Raporu, 2026-07-15 — gerçek Android cihaz testi, tüm kriterler karşılandı)

### Kapsam
Parsel ve Ağaç: tam CRUD, arama/sıralama/sayfalama (Parsel), Reference/Parcel Mode (Ağaç), Parsel↔Ağaç navigasyonu, Android fiziksel geri tuşu, Error Code Standard (temel altyapı), ADR 0022 (foreign key) düzeltmesi.

### Sprint Geçmişi
| Sprint | İçerik | Durum |
|---|---|---|
| 2.1 | TreeRepository + testler | ✅ Kullanıcı tarafından kabul edildi |
| 2.2 | useTrees hook (Parcel/Reference Mode) | ✅ Kullanıcı tarafından kabul edildi |
| 2.3 | TreeForm + CheckboxField + native validation düzeltmesi | ✅ Kullanıcı tarafından kabul edildi |
| 2.4 | TreesScreen (listeleme) | ✅ Kullanıcı tarafından kabul edildi |
| 2.5 | TreeForm/TreesScreen entegrasyonu, Parcel→Trees navigasyonu, CRUD | ✅ Kullanıcı tarafından kabul edildi |
| 2.6 | Android geri tuşu, ADR 0022 düzeltmesi, Error Code Standard | Kod tamamlandı, kullanıcı onayı bekleniyor |

### Test Kapsamı
58 otomatik test (Vitest): 9 Parcel repo + 12 Tree repo + 8 useTrees hook + 7 TreeForm + 12 TreesScreen (CRUD+geri tuşu dahil) + 5 ParcelsScreen (navigasyon+geri tuşu) + 5 mapSqliteError.

### Bilinen Teknik Borçlar (Bilinçli, Ertelenen)
- Fotoğraf↔Gözlem ilişkisi tasarım kararı (Modül 3'e erteledi, Database Master Schema'da belgeli)
- Error Code Standard'ın UI katmanında (çevrilmiş mesaj gösterimi) henüz tüketilmemesi — altyapı hazır, tüketim gelecek modülde

### Sonraki Adım
Kullanıcının gerçek Android cihaz kabul testi → Git Tag (v0.2.0) → Modül 2 resmi kabulü.

### Dondurma Kuralı (Kullanıcı Kararı, 2026-07-15)
Modül 2'ye **yeni özellik eklenmeyecek**. Yalnızca **kritik güvenlik açığı veya kritik hata** bulunursa düzeltme yapılacak (Modül 1'deki aynı kural).
