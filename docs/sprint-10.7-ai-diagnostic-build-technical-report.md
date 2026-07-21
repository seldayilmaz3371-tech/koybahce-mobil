# Sprint 10.7 — AI Diagnostic Build Teknik Raporu

**Tarih:** 2026-07-21 · **Amaç:** Yeni AI özelliği DEĞİL — kullanıcının gerçek cihazda yaşadığı iki AI hatasını (genel "Bir şeyler ters gitti" mesajı, Fotoğraf Analizi'nde sonsuz bekleme) TAHMİN değil, KESİN TEKNİK KANITLA teşhis edebilmesi için altyapı.

## Temel İlke: Hiçbir Rastgele Düzeltme Yapılmadı

`mapAiError()`'ın kendi sınıflandırma mantığına (kök neden raporunda "muhtemelen hatalı" olarak işaretlenen `"code":XXX` kontrolleri) **hiç dokunulmadı**. Bu sprintin tek amacı, mevcut davranışı (doğru ya da hatalı olsun) **gözlemlenebilir** kılmaktı — bir sonraki adımda, gerçek cihaz verisiyle, hangi düzeltmenin gerekli olduğuna birlikte karar verilecek.

## Artık Gerçek Cihazda Görülebilecek Teknik Bilgiler (Kullanıcının 11 Maddesi)

| # | İstenen Bilgi | Nasıl Karşılandı |
|---|---|---|
| 1 | API Key okunuyor mu? (Boş/null/geçerli) | `aiDiagnostics.apiKeyStatus` — "empty" veya "configured" olarak kaydediliyor, her `sendMessage()`/`analyzeImage()` çağrısında |
| 2 | Hangi Provider aktif? | `aiDiagnostics.providerName` — "gemini" |
| 3 | İstek gerçekten gönderiliyor mu? | `stage` alanı, "request_sent" durumuna ulaşıp ulaşmadığını gösterir |
| 4 | HTTP Status Code | `aiDiagnostics.httpStatusCode` — gerçek `ApiError.status` alanından okunuyor |
| 5 | Gerçek `ApiError` nesnesinin tüm alanları | `rawError: { message, status, name, stack }` — ham, işlenmemiş veri |
| 6 | Gerçek Exception kaynağı | `rawError.stack` (varsa) Diagnostic ekranında gösteriliyor |
| 7 | İstek hangi aşamada duruyor | `stage` — 10 durum: idle → provider_obtained → request_prepared → request_sent → awaiting_response → response_received → parsed → ui_updated (+ error, timeout) |
| 8 | Fotoğraf/base64 boyutu, süre, timeout | `photo: { fileSizeBytes, base64SizeBytes }`, `durationMs`, `timedOut` |
| 9 | Loading state neden kapanmıyor | `stage === "awaiting_response"` iken ekran açık kalırsa, istek SDK seviyesinde asılı demektir — artık gözle görülür |
| 10 | mapAiError hangi hatayı hangi koda çeviriyor | `mappedErrorCode` — `mapAiError()`'ın her çağrısında otomatik kaydediliyor |
| 11 | Debug modunda görünür, Release'de görünmez format | `AiDiagnosticScreen` — Provider/API Key/Stage/HTTP/SDK/Error Code/Error Message/Request Duration/Retry Count/Timed Out |

## Gerçek Bulgular (Bu Sprintte Bulunup Düzeltildi)

1. **Diagnostic modülünün kendi hatası:** İlk implementasyonda `startNewRequest()` çağrısı unutulmuştu — `durationMs` hep `null` dönüyordu. Testle yakalanıp düzeltildi.
2. **Timeout hiç yoktu:** `GeminiProvider`'da SDK çağrısına hiçbir zaman timeout parametresi geçilmiyordu — kök neden raporundaki "sonsuz bekleme" bulgusunun somut kanıtı. `HttpOptions.timeout` (45 saniye, resmi SDK tipi tanımlarından doğrulandı) eklendi — artık bir istek gerçekten sınırsız beklemeyecek, "timeout" aşamasına düşüp gözlemlenebilir olacak.

## Görünürlük Garantisi (Kullanıcının Açık Talebi)

**"Ama Release sürümünde bu bilgiler görünmesin."** — İki katmanlı koruma:
1. `AiDiagnosticScreen`'in kendisi, `settings.debugMode !== true` ise `null` render eder (gerçek testle kanıtlandı).
2. `/ai/diagnostics` rotasına doğrudan girilse bile, route seviyesinde `debugMode` kontrolü var — kapalıyken Parseller'e yönlendirir.

`debugMode`, `AiSettingsScreen`'de **varsayılan olarak kapalı** bir toggle (mevcut kullanıcılar hiç etkilenmez, hiçbir migration gerekmedi — alan Sprint 6'dan beri şemada vardı, sadece UI'a açıldı).

## Nasıl Kullanılır (Gerçek Cihazda)

1. Ayarlar → AI Ayarları → "Teşhis Modu" toggle'ını aç.
2. AI Sohbet veya Fotoğraf Analizi ekranına git — artık "AI Diagnostic Info" butonu görünür.
3. Sorunu yeniden üret (soru sor / fotoğraf analiz et).
4. Fotoğraf Analizi'nde, "Analiz ediliyor..." durumundayken bile "AI Diagnostic Info" butonuna basılabilir — bu, istek gerçekten hangi aşamada takılı kaldığını (`awaiting_response` mı, `timeout` mu) canlı gösterir (ekran 500ms'de bir kendini yeniler).
5. Sohbet hatası için: hata oluştuktan sonra "AI Diagnostic Info"ya git, `Error Code`/`Error Message`/`HTTP` alanlarına bak.

## Test Sonuçları (Gerçekten Çalıştırıldı)

- `npx tsc -b`: ✅ Temiz.
- Proaktif test-dosyası tip kontrolü: ✅ Temiz.
- `npm run test`: ✅ **713/713** (32 yeni, 681 mevcut — hiçbir regresyon).
- `npm run lint`: ✅ 0 uyarı/hata (230 dosya).
- `npm run build`: ✅ **BUILD SUCCESSFUL** — `AiDiagnosticScreen` ayrı bir lazy chunk (4.17kB), ana bundle'a yük eklenmedi.
- `npx cap sync android`: ✅ Başarılı (9 plugin, değişmedi).

## Gerçekten Yapılamayan Doğrulamalar

- ❌ **Gerçek cihazda bu diagnostic ekranının çalıştığının doğrulanması** — bu ortamda fiziksel cihaz yok. Bu, bu sprintin **tam olarak amacı** — bir sonraki adımda kullanıcının kendi cihazında yapılacak.
- ❌ **45 saniyelik timeout'un gerçek cihazda ne sıklıkla tetiklendiği** — bu, gerçek ağ koşullarına bağlı, önceden bilinemez.

## Kapsam Dışında Bırakılanlar (Kullanıcının Açık Talimatı)

- `mapAiError()`'ın kendi sınıflandırma mantığının düzeltilmesi — bilinçli olarak ertelendi, gerçek cihaz verisi görülene kadar.
- Yeni AI özelliği/genişletme — hiç yapılmadı.
- Timeout süresinin (45sn) kalıcı bir UX kararı olarak sabitlenmesi — bu, teşhis amaçlı geçici bir değer, ayrı bir sprintte yeniden değerlendirilebilir.

## ADR Kararı

**Yeni ADR yazılmadı.** Gerekçe: Diagnostic modülü, mevcut hata yönetimi/i18n/route mimarisinin gözlemlenebilirlik katmanı — yeni bir mimari kategori değil.

## BUILD_INFO ile Çelişki Kontrolü

Test sayısı (713/713, +32) ve commit hash (`66eeecb`), aşağıda güncellenen `BUILD_INFO.md` ile birebir aynı olacak.

## Sonuç

Artık gerçek cihazda, "Bir şeyler ters gitti" mesajının **arkasında gerçekte ne olduğu** ve fotoğraf analizinin **hangi aşamada takılı kaldığı**, tahmin değil, ham teknik veriyle görülebilir. Bir sonraki adım: kullanıcının kendi cihazında Teşhis Modu'nu açıp sorunları yeniden üretmesi, ve elde edilen gerçek verilerle (hangi `Error Code`/`stage`/`httpStatusCode` görülüyor) kesin düzeltmenin planlanması.
