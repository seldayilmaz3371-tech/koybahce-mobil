# Sprint 6 — APK ve Gerçek Android Cihaz Test Planı

**Durum:** Onay bekliyor · **Kapsam:** Modül 6 (AI Altyapısı) — Production Ready kararından önceki son aşama
**Hazırlayan bakış açısı:** Kıdemli Android QA Mühendisi + Mobil Yazılım Mimarı
**Kaynak:** Gerçek proje yapılandırması incelenerek hazırlandı (`AndroidManifest.xml`, `build.gradle`, `capacitor.config.ts`) — varsayılmadı.

---

## 🔴 Kod Öncesi Gerçek Bulgular (Plana Doğrudan Yansıyor)

1. **İmzalama yapılandırılmamış** — `android/app/build.gradle`'da `signingConfigs` bloğu **yok**. Bugün sadece **debug APK** üretilebilir (otomatik debug keystore ile). Release/imzalı APK için önce bir keystore oluşturulup `signingConfigs` eklenmeli — bu, **Bölüm 1**'de ayrı bir madde olarak işaretlendi, bu planın kapsamı dışında bırakıldı (kullanıcı kararı gerektirir).
2. **İzinler kısmen örtük** — Manifest'te açıkça sadece `android.permission.INTERNET` tanımlı. Kamera (`@capacitor/camera`) ve biyometrik (`@aparajita/capacitor-biometric-auth`) izinleri kendi plugin manifest'lerinden **merge** ediliyor — gerçek APK'nın birleşik manifest'i **derlendikten sonra** doğrulanmalı (Bölüm 1'de test var).
3. **`@capacitor/network` yeni eklendi** — bu paketin kendi bir çalışma zamanı izni yok (Android'de ağ durumu sorgulamak izin gerektirmez), ama merge sonrası manifest'te göründüğünü doğrulamak gerekir.

---

## 1. APK Oluşturma Öncesi Kontroller

### 1.1 Release/Debug Build Kararı

| Kontrol | Gerçek Durum | Aksiyon |
|---|---|---|
| `signingConfigs` var mı? | ❌ Yok | Bu sprint için **debug APK** ile devam edilecek — release imzalama ayrı bir karar/sprint konusu |
| `buildTypes.release.minifyEnabled` | Doğrulanmalı | `android/app/build.gradle`'da kontrol edilecek |
| `versionCode`/`versionName` | `1` / `"1.0"` | Sprint 6 için artırılması gerekip gerekmediği kullanıcı kararı |

### 1.2 Build Konfigürasyonu Kontrolleri

| Test ID | Amaç | Adımlar | Beklenen Sonuç |
|---|---|---|---|
| **BUILD-001** | `npm run build`'un hatasız tamamlandığını doğrulamak | `npm run build` çalıştır | Çıkış kodu 0, `dist/` klasörü oluşur |
| **BUILD-002** | Bundle boyutu uyarısının kayıt altında olduğunu doğrulamak | Build çıktısını incele | 739.81kB'lık chunk uyarısı **beklenen, bilinen** bir durum (Sprint 6 teslim raporunda kayıtlı) |

### 1.3 Capacitor Senkronizasyonu

| Test ID | Amaç | Adımlar | Beklenen Sonuç | Başarı Kriteri |
|---|---|---|---|---|
| **SYNC-001** | `cap sync`'in TÜM pluginleri (9 tane) doğru senkronize ettiğini doğrulamak | `npx cap sync android` çalıştır | Çıktıda 9 plugin listelenir: biometric-auth, secure-storage, sqlite, app, camera, device, filesystem, **network**, preferences | 9/9 plugin, hata yok |
| **SYNC-002** | `@capacitor/network`'ün Android tarafında GERÇEKTEN kurulduğunu doğrulamak | `android/app/src/main/assets/capacitor.plugins.json` dosyasını aç | `NetworkPlugin` girişi var | Dosyada plugin adı görünür |

### 1.4 İmzalama Gereksinimleri

| Test ID | Amaç | Adımlar | Beklenen Sonuç |
|---|---|---|---|
| **SIGN-001** | Debug keystore'un var olduğunu doğrulamak | `~/.android/debug.keystore` kontrolü (Android Studio/Gradle otomatik oluşturur) | Dosya mevcut, APK debug imzasıyla imzalanabilir |
| **SIGN-002** *(release öncesi, bu sprint kapsamı DIŞINDA — bilgi amaçlı)* | Release keystore'un henüz OLMADIĞINI teyit etmek | `android/` altında `.jks`/`.keystore` ara | Bulunmaz — bu **beklenen**, release süreci ayrı planlanmalı |

### 1.5 Android İzinleri (Gerçek Merge Sonucu Doğrulaması)

| Test ID | Amaç | Adımlar | Beklenen Sonuç | Başarı Kriteri |
|---|---|---|---|---|
| **PERM-001** | Birleşik (merge edilmiş) manifest'in gerçek izin listesini çıkarmak | `cd android && ./gradlew :app:processDebugMainManifest` sonrası `app/build/intermediates/merged_manifest/debug/AndroidManifest.xml` dosyasını incele | INTERNET + CAMERA + (varsa) biyometrik ile ilgili izinler listelenir | Beklenmeyen/aşırı geniş bir izin YOK |
| **PERM-002** | Kurulu APK'nın gerçek izinlerini cihazdan sorgulamak | `adb shell dumpsys package com.bahcem.mobile \| grep permission` | Manifest'teki izinlerle BİREBİR eşleşir | Fark yok |

---

## 2. APK Oluşturma Adımları

```bash
# 1. Web varlıklarını derle
npm run build

# 2. Native projeye senkronize et (9 plugin dahil)
npx cap sync android

# 3. Debug APK üret
cd android
./gradlew assembleDebug

# 4. APK konumu
# android/app/build/outputs/apk/debug/app-debug.apk

# 5. Cihaza yükle (USB hata ayıklama açık, cihaz bağlı)
adb install -r app/build/outputs/apk/debug/app-debug.apk

# 6. Kurulumu doğrula
adb shell pm list packages | grep com.bahcem.mobile
```

| Test ID | Amaç | Beklenen Sonuç | Başarı Kriteri |
|---|---|---|---|
| **APK-001** | `assembleDebug`'ın hatasız tamamlanması | `BUILD SUCCESSFUL` mesajı | Gradle hata kodu 0 |
| **APK-002** | Üretilen APK dosya boyutunun makul olması | APK boyutu ölçülür | Bundle'daki +350kB artışa rağmen APK **50-80MB** aralığında (native + WebView + Gemini SDK) — bu **tahmini bir aralık**, gerçek ölçüm yapılmadan kesinleşmez |

---

## 3. Kurulum Testleri

| Test ID | Amaç | Ön Koşullar | Adımlar | Beklenen Sonuç | Başarı Kriteri |
|---|---|---|---|---|---|
| **INSTALL-001** | Temiz kurulum | Cihazda uygulama hiç kurulu değil | `adb install app-debug.apk` | Kurulum başarılı, ikon görünür | Hata yok, ikon Ana Ekran'da |
| **INSTALL-002** | İlk açılış | INSTALL-001 tamamlandı | Uygulamayı aç | LockScreen görünür (Modül 1'in kanıtlanmış cold-start davranışı) | LockScreen ilk ekran |
| **INSTALL-003** | Güncelleme senaryosu | Önceki bir sürüm (Modül 5 sonu) kurulu | Yeni APK'yı `adb install -r` ile üzerine yükle | Kurulum başarılı, **veri kaybı YOK** (SQLite dosyası korunur) | Modül 5 verileri (parsel/ağaç/bakım) hâlâ mevcut |
| **INSTALL-004** | Migration kontrolü (güncelleme sonrası) | INSTALL-003 tamamlandı | Uygulamayı aç, kilidi geç | Şema Sürüm 9→10 migration'ı **otomatik ve sessizce** çalışır | Uygulama çökmez, yeni AI tabloları oluşur |
| **INSTALL-005** | Kaldırıp yeniden kurma | Uygulama kurulu, kullanılmış | `adb uninstall com.bahcem.mobile`, sonra tekrar kur | Tüm veri (SQLite + Secure Storage, API anahtarı DAHİL) **tamamen silinir** | Yeniden açılışta AI Ayarları sıfırdan (API anahtarı boş) |

---

## 4. AI Modülü Testleri (Gerçek Cihaz — En Kritik Bölüm)

**Not:** Bu ekranlar henüz route'a bağlanmadığı için (Sprint 6'nın bilinen kapsamı), bu testlerin bir kısmı **geçici bir test-erişim yöntemi gerektirir** (ör. geliştirici menüsü veya doğrudan `AppRouter`'a geçici bir rota eklenerek). Bu, gerçek cihaz testi öncesi netleştirilmesi gereken bir ön koşuldur.

| Test ID | Amaç | Ön Koşullar | Adımlar | Beklenen Sonuç | Başarı Kriteri |
|---|---|---|---|---|---|
| **AI-001** | AI Ayarları varsayılan güvenli durumu | Temiz kurulum | AI Ayarları ekranını aç | "AI Aktif" ve "İnternet İzni" **KAPALI** | İkisi de kapalı görünür |
| **AI-002** | API anahtarı ekleme | AI-001 | Geçerli bir Gemini API anahtarı gir, Kaydet | "API anahtarı yapılandırıldı" mesajı, input kaybolur | `apiKeyConfigured: true` |
| **AI-003** | Secure Storage doğrulaması (gerçek cihaz, root olmadan) | AI-002 tamamlandı | `adb shell run-as com.bahcem.mobile ls` ile uygulama verilerini incelemeye ÇALIŞ | API anahtarı **düz metin olarak HİÇBİR dosyada bulunamaz** (Android Keystore korumalı) | `grep -r "API_ANAHTARI_DEĞERİ"` uygulama verilerinde SIFIR eşleşme |
| **AI-004** | API anahtarı kaldırma | AI-002 tamamlandı | "Anahtarı Kaldır" → onayla | Anahtar silinir, input tekrar görünür | `apiKeyConfigured: false` |
| **AI-005** | AI etkin/pasif durumu — kapalıyken sohbet engeli | AI kapalı | Sohbet ekranından mesaj göndermeyi dene | `AI_001` hata koduna karşılık **çevrilmiş** mesaj ("AI kapalı...") | Ham "AI_NOT_ENABLED" HİÇBİR YERDE görünmez |
| **AI-006** | İnternet kapalı senaryosu (gerçek, cihaz seviyesinde) | AI etkin, İnternet İzni AÇIK | Cihazda Uçak Modu'nu aç, Sohbet ekranını aç | Offline bildirimi görünür, giriş kutusu devre dışı | "Çevrimdışısınız" mesajı, gönder butonu disabled |
| **AI-007** | Hatalı API anahtarı | Geçersiz/sahte bir anahtar gir | Bir soru gönder | Gemini'den 401/403 hatası, **çevrilmiş** bir hata mesajı gösterilir (ham JSON/stack trace DEĞİL) | Kullanıcı ham teknik hata GÖRMEZ |
| **AI-008** | Kota hatası (429 RESOURCE_EXHAUSTED) | Gerçek bir kota aşımı senaryosu simüle edilmeli (ör. çok sayıda hızlı istek) | Art arda birçok soru gönder | Retry mekanizması 429'u YENİDEN DENEMEZ (ADR 0024'te belgeli), kullanıcıya anlamlı bir hata döner | Gerçek cihazda retry-yok davranışı gözlemlenir |
| **AI-009** | Timeout senaryosu | Zayıf/yavaş bir ağ simülasyonu (Android Studio Network Profiler ile bant genişliği kısıtlama) | Soru gönder, yanıtı bekle | Uygulama DONMAZ, makul bir sürede hata/sonuç döner | UI thread bloklanmaz, ANR oluşmaz |
| **AI-010** | Sohbet ekranı — temel akış | AI etkin, API anahtarı geçerli, internet var | "Kaç parselim var?" gibi gerçek bir soru sor | Gerçek Gemini yanıtı, ekranda görünür | Yanıt makul sürede (< 10sn) gelir |
| **AI-011** | Konuşma geçmişi — ekran içi kalıcılık | AI-010 tamamlandı | Ekrandan çık, geri dön (SAME oturum) | **Sprint 6'nın bilinen davranışı:** her ekran açılışında YENİ bir konuşma başlar (kayıtlı davranış) — önceki konuşma GÖRÜNMEZ | Bu, bir hata DEĞİL, belgelenmiş bir tasarım kararı — test bunu DOĞRULAMALI, "hata" olarak işaretlenmemeli |
| **AI-012** | Tool Calling — gerçek cihazda uçtan uca | AI etkin, en az 1 parsel/gözlem verisi mevcut | "Son gözlemlerim neler?" gibi bir soru sor | Model `queryObservations` aracını çağırır, GERÇEK veriden yanıt üretir (uydurma veri DEĞİL) | Yanıttaki bilgiler SQLite'taki gerçek verilerle eşleşir |
| **AI-013** | Context Engine — ekran bağlamı | Bir parsel ID'siyle sohbet ekranı açılmış (test-erişimiyle) | Parsel-spesifik bir soru sor | Yanıt doğru parsele ait bilgi içerir | Context Engine'in `parcelId`'yi doğru ilettiği doğrulanır |
| **AI-014** | Yazma engelinin gerçek cihazda doğrulanması | AI etkin | "Bana bir sulama kaydı ekle" gibi bir YAZMA isteği gönder | Model, sistem promptu gereği bunu REDDEDER, formları kullanmasını önerir | Hiçbir yeni `maintenance_records` satırı OLUŞMAZ (DB kontrolüyle doğrulanmalı) |

---

## 5. SQLite Doğrulamaları

| Test ID | Amaç | Adımlar | Beklenen Sonuç | Başarı Kriteri |
|---|---|---|---|---|
| **DB-001** | Veri kaydı — AI ayarları | Ayarları değiştir | `adb shell` ile veritabanı dosyasını çek (`run-as` + `pull`), `ai_settings` tablosunu sorgula | Değişiklik kalıcı | Tablo değeri UI ile eşleşir |
| **DB-002** | Uygulama kapanıp açıldıktan sonra veri korunuyor mu? | Bir AI konuşması yap | Uygulamayı Son Uygulamalar'dan tamamen kapat, tekrar aç | `ai_conversations`/`ai_messages` verisi KORUNUR | Veritabanında satırlar mevcut (ekranda görünmese bile — bkz. AI-011) |
| **DB-003** | AI geçmişi korunuyor mu? (cihaz yeniden başlatma) | Bir konuşma yap | Cihazı yeniden başlat, uygulamayı aç | Veri hâlâ SQLite'ta | Satır sayısı yeniden başlatma öncesiyle AYNI |
| **DB-004** | Migration kontrolü (Sürüm 9→10) | Modül 5 sonu verisiyle güncelleme (INSTALL-003) | `PRAGMA user_version` sorgula | `10` döner | Sürüm doğru |
| **DB-005** | `ai_settings` tek-satır garantisi gerçek cihazda | — | `SELECT COUNT(*) FROM ai_settings` | Her zaman `1` | Asla 0 veya 2+ olmaz |

---

## 6. Performans Testleri

| Test ID | Amaç | Araç | Beklenen Sonuç | Başarı Kriteri |
|---|---|---|---|---|
| **PERF-001** | Soğuk açılış süresi | `adb shell am start -W com.bahcem.mobile/.MainActivity` | `TotalTime` ölçülür | Modül 5 sonu ölçümüne kıyasla **anlamlı bir bozulma YOK** (bundle +350kB'nin açılış süresine etkisi ölçülmeli) |
| **PERF-002** | Bellek kullanımı (AI Sohbet ekranı açıkken) | Android Studio Profiler / `adb shell dumpsys meminfo com.bahcem.mobile` | Bellek ölçülür | Düşük-orta seviye bir cihazda (2-3GB RAM) uygulama OOM (Out of Memory) almaz |
| **PERF-003** | CPU kullanımı (Gemini isteği sırasında) | Profiler | CPU spike ölçülür | Kısa süreli bir spike beklenir, SÜREKLİ yüksek CPU KULLANIMI YOK |
| **PERF-004** | Bundle etkisinin gerçek APK boyutuna yansıması | `ls -lh app-debug.apk` | APK boyutu ölçülür, Modül 5 sonu APK'sıyla karşılaştırılır | Artış, bundle'daki +350kB ile ORANTILI (native kod eklenmedi, sadece JS) |
| **PERF-005** | AI ekranı açılış süresi | Kronometre / `adb logcat` zaman damgaları | AI Ayarları/Sohbet ekranı açılış süresi ölçülür | Diğer ekranlarla (Finans/Bakım) KARŞILAŞTIRILABİLİR süre, belirgin bir yavaşlama YOK |

---

## 7. Kullanılabilirlik Testleri

| Test ID | Amaç | Adımlar | Beklenen Sonuç | Başarı Kriteri |
|---|---|---|---|---|
| **UX-001** | Telefon döndürme (Sohbet ekranı, yazarken) | Metin gir, cihazı yatay çevir | Yazılan metin KAYBOLMAZ, ekran düzeni bozulmaz | State korunur |
| **UX-002** | Arka plana alma (AI isteği DEVAM EDERKEN) | Soru gönder, HEMEN Ana Ekran tuşuna bas, geri dön | Sprint 4.3.1/4.3.2'nin arka-plana-alma güvenlik davranışı (yeniden kilitleme) AI isteğini KESMEMELİ veya EN AZINDAN uygulama çökmemeli | Uygulama çökmez, kilit ekranı beklendiği gibi çalışır |
| **UX-003** | Bildirim sonrası geri dönüş | AI isteği sırasında bir bildirim gelsin (ör. başka bir uygulamadan), bildirime dokun, geri dön | Uygulama durumu KORUNUR | Sohbet ekranı kaldığı yerden devam eder |
| **UX-004** | Düşük RAM senaryosu (Android'in arka plandaki uygulamayı öldürmesi) | Developer Options → "Arka plan işlemlerini sınırla" AÇ, uygulamayı arka plana al, uzun süre bekle, geri dön | Uygulama YENİDEN BAŞLAR (cold start), LockScreen görünür — bu BEKLENEN bir Android davranışı, veri KAYBOLMAZ | LockScreen sonrası tüm veri (AI dahil) mevcut |

---

## 8. Hata Senaryoları

| Test ID | Amaç | Adımlar | Beklenen Sonuç | Başarı Kriteri |
|---|---|---|---|---|
| **ERR-001** | İnternet kesilmesi (istek SIRASINDA) | Soru gönder, yanıt beklerken Uçak Modu'na al | Anlamlı bir hata mesajı, uygulama ÇÖKMEZ | Çeviri anahtarına eşlenmiş mesaj görünür |
| **ERR-002** | API başarısızlığı (Gemini 500/503) | Gerçek bir sunucu hatası simüle edilemezse, bu test **entegrasyon testinde zaten mock'landı** — gerçek cihazda GÖZLEMSEL bir test (organik olarak oluşursa kaydedilir) | Retry mekanizması 5xx için ÇALIŞIR (ADR 0024) | Kullanıcı sonunda anlamlı bir hata görür |
| **ERR-003** | Beklenmeyen exception (genel) | Uygulamayı olağandışı şekillerde kullan (hızlı art arda tıklama, form boşken gönder vb.) | Hiçbir ekranda beyaz ekran/çökme YOK | `adb logcat` çökme kaydı içermez |
| **ERR-004** | Bozuk veri senaryosu | (Gerçekleştirmesi zor — bilgi amaçlı) SQLite dosyasını manuel bozup açmayı dene | Uygulama nazikçe hata verir, veri kaybı riskini AZALTIR | Çökme yerine kontrollü hata |
| **ERR-005** | Eksik izinler (Kamera izni reddedilmiş durumda AI ekranına giriş) | Kamera iznini reddet, AI Sohbet ekranını aç | AI modülü kamera izniyle İLGİLİ DEĞİL — etkilenmemeli | AI ekranları normal çalışır |

---

## 9. Güvenlik Testleri

| Test ID | Amaç | Adımlar | Beklenen Sonuç | Başarı Kriteri |
|---|---|---|---|---|
| **SEC-001** | API anahtarı GERÇEKTEN Secure Storage'da mı? | `adb shell run-as com.bahcem.mobile find /data/data/com.bahcem.mobile -type f \| xargs grep -l "ANAHTAR_DEĞERİ"` (root olmadan, sadece uygulamanın kendi verisi) | HİÇBİR düz-metin dosyasında bulunmaz | Sıfır eşleşme |
| **SEC-002** | Loglarda API anahtarı bulunuyor mu? | AI isteği gönderirken `adb logcat` izle, `grep` ile anahtar değerini ara | Anahtar loglara HİÇ YAZILMAZ | Sıfır eşleşme logcat çıktısında |
| **SEC-003** | SQLite içinde gizli bilgi tutuluyor mu? | Veritabanı dosyasını çek, `ai_settings` tablosunu incele | Sadece `api_key_configured` (boolean bayrak) var, anahtarın KENDİSİ YOK | Şema doğrulaması: `api_key_configured INTEGER`, `TEXT` anahtar sütunu YOK |
| **SEC-004** | Debug bilgilerinin release'e sızmadığı doğrulandı mı? | `debugMode` ayarını AÇIP bir sohbet yap, sonra KAPATIP tekrar dene | `debugMode: false` iken `tool` rolündeki mesajlar DB'ye YAZILMAZ (Sprint 6'da test edilmiş davranış) — gerçek cihazda TEYİT edilmeli | Debug kapalıyken `role='tool'` satırı OLUŞMAZ |
| **SEC-005** | Veritabanının kendisi şifreli mi? | Ham `.db` dosyasını cihazdan çek, bir metin editörüyle aç | Okunamaz/şifreli veri (SQLCipher, ADR 0004) — AI tabloları DAHİL bu şifrelemeden PAYLANIR (aynı veritabanı dosyası) | Düz metin içerik GÖRÜNMEZ |

---

## 10. Son Kullanıcı Kabul Testleri (UAT)

| Test ID | Amaç | Senaryo | Başarı Kriteri |
|---|---|---|---|
| **UAT-001** | Gerçek bir çiftçi senaryosu — ilk kurulum | Yeni kullanıcı: uygulamayı kur, AI'yı etkinleştir, kendi API anahtarını gir, bir soru sor | Kullanıcı YARDIM ALMADAN bu akışı tamamlayabilir |
| **UAT-002** | Gerçek bir soru-cevap döngüsü | "Bu ay ne kadar harcadım?", "Son gözlemim ne zamandı?" gibi 3-5 gerçek soru | Yanıtlar ANLAMLI ve DOĞRU (gerçek verilerle eşleşir) |
| **UAT-003** | AI'nin sınırlarını anlaması | Kullanıcı AI'dan bir işlem yapmasını istesin (kayıt oluşturma) | AI nazikçe reddeder, kullanıcıyı doğru forma yönlendirir |

---

# Sınıflandırma

## 🔴 Production Ready İçin ZORUNLU Testler

Bunlar olmadan Modül 6 "Completed" kabul edilemez:

- **APK-001, APK-002** (üretim başarılı)
- **INSTALL-001, INSTALL-002, INSTALL-003, INSTALL-004, INSTALL-005** (kurulum/migration/veri kaybı yok)
- **AI-001 – AI-009, AI-012, AI-014** (temel akış + tüm hata/izin senaryoları + gerçek tool calling + yazma engeli)
- **DB-001 – DB-005** (veri kalıcılığı ve migration)
- **UX-002** (arka plana alma + AI isteği çakışmaması — Sprint 4.3.2'nin kök nedenine benzer bir regresyon riski taşıyor)
- **ERR-001, ERR-003** (temel dayanıklılık)
- **SEC-001, SEC-002, SEC-003, SEC-005** (API anahtarı ve veri güvenliği — bu proje için Kural 31 gereği MÜZAKERE EDİLEMEZ)
- **PERM-001, PERM-002** (gerçek izin doğrulaması)

## 🟡 İsteğe Bağlı Ek Kalite Testleri

Production kararını ENGELLEMEZ, ama kaliteyi artırır:

- **AI-010, AI-011, AI-013** (UX detayları, bilinen/belgelenmiş davranışlar)
- **PERF-001 – PERF-005** (performans ölçümleri — sayısal veri toplamak için değerli, ama bu sprintin "dar kapsamlı altyapı" hedefiyle KATI bir eşik konulmadı)
- **UX-001, UX-003, UX-004** (kenar durumlar)
- **ERR-002, ERR-004, ERR-005** (nadir/simüle etmesi zor senaryolar)
- **SEC-004** (debug modu — geliştirici kullanımı, son kullanıcı etkisi YOK)
- **UAT-001, UAT-002, UAT-003** (gerçek kullanıcı geri bildirimi — değerli ama "geçti/kaldı" ikili kararı için zorunlu değil)

---

**Not:** AI ekranları henüz route'a bağlı olmadığı için (Sprint 6'nın bilinen kapsamı), Bölüm 4'teki testlerin **çoğu**, test öncesi geçici bir erişim yöntemi gerektiriyor. Bunu nasıl sağlamak istediğine (geçici route mu, geliştirici menüsü mü) karar vermen gerekiyor — ben bunu **kod yazmadan önce senden netleştirmeni** öneririm.
