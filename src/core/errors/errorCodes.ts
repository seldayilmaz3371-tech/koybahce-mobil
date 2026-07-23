/**
 * Error Code Sabitleri
 * =======================
 * bkz. docs/error-handling-standard.md ("Uygulama Planı" bölümü)
 *
 * `as const` NESNESİ — `enum` DEĞİL. Bu bir tercih değil, zorunluluk:
 * `tsconfig.app.json`'daki `"erasableSyntaxOnly": true` ayarı,
 * gerçek `enum`'ları (çalışma zamanı kodu ürettikleri için) derleme
 * hatası olarak reddeder. Bu, projede zaten kurulu bir desenle
 * tutarlı (`LocalPreferenceKey`, `SecureStorageKey` — Modül 1).
 */

export const ErrorCode = {
  VAL_001: "VAL_001", // Zorunlu alan boş
  VAL_002: "VAL_002", // Sayısal alan geçersiz/negatif

  DB_001: "DB_001", // Bağlantı kurulamadı
  DB_002: "DB_002", // Migration başarısız
  DB_003: "DB_003", // CHECK kısıtı ihlali (enum-kod hatası)
  DB_004: "DB_004", // UNIQUE kısıtı ihlali
  DB_005: "DB_005", // FOREIGN KEY kısıtı ihlali (ADR 0022)

  PARCEL_001: "PARCEL_001", // Parsel bulunamadı

  TREE_001: "TREE_001", // Ağaç bulunamadı
  TREE_002: "TREE_002", // Var olmayan parsele bağlanma girişimi

  NATIVE_001: "NATIVE_001", // Biyometrik doğrulama başarısız

  AI_001: "AI_001", // AI devre dışı (Ayarlar'dan açılmamış)
  AI_002: "AI_002", // İnternet izni verilmemiş
  AI_003: "AI_003", // Sağlayıcı kayıtlı değil (iç tutarsızlık)
  AI_004: "AI_004", // API anahtarı yapılandırılmamış
  AI_005: "AI_005", // Fotoğraf analizi boş yanıt döndü (ör. güvenlik filtresi)
<<<<<<< HEAD
  // bkz. Sprint 10.6 (Production Ready — Öncelik 2, AI X-Ray denetimi
  // sonucu). ÖNCEDEN bu hataların HEPSİ tek bir SYS_001'e düşüyordu —
  // hem kullanıcı hem geliştirici için teşhis imkansızdı. Marker'lar
  // GERÇEKTEN `GeminiProvider.ts`'in KENDİ `isRetryableGeminiError()`
  // fonksiyonunda ZATEN kullanılan, doğrulanmış Gemini hata
  // biçimleridir (`"code":401` vb.) — varsayım değildir.
  AI_006: "AI_006", // Gemini API anahtarı geçersiz/reddedildi (401/403 — kimlik doğrulama)
  AI_007: "AI_007", // Gemini kotası tükendi (RESOURCE_EXHAUSTED)
  AI_008: "AI_008", // Gemini istek hızı sınırı aşıldı (429 — geçici, kota tükenmesinden (AI_007) farklı)
  AI_009: "AI_009", // Gemini geçersiz istek olarak reddetti (400 — ör. hatalı prompt/parametre yapısı)
  AI_010: "AI_010", // Ağ bağlantısı kurulamadı (fetch/network hatası — JS'in standart hata biçimleri)
  AI_011: "AI_011", // İstek zaman aşımına uğradı
  // bkz. Sprint 10.6, Öncelik 3 (Stabilite İncelemesi). GERÇEK BULGU:
  // `ToolRegistry.invoke()`'ın fırlattığı `AI_TOOL_NOT_FOUND` (model
  // var olmayan bir araç adı üretirse — nadir ama teorik olarak
  // mümkün, "hallucination") daha önce mapAiError()'da hiç
  // eşlenmemişti, genel SYS_001'e düşüyordu.
  AI_012: "AI_012", // AI, var olmayan bir araç çağırmaya çalıştı (iç tutarsızlık)

  // bkz. Sprint 10.13 (Veri Yönetimi — Yedekle/Geri Yükle).
  DM_001: "DM_001", // Yedek oluşturma başarısız (veritabanı export/fotoğraf okuma/ZIP oluşturma aşamalarından biri başarısız)
  DM_002: "DM_002", // Seçilen ZIP dosyası geçerli bir Bahçem Mobile yedeği değil (manifest imzası eksik/hatalı)
  DM_003: "DM_003", // Otomatik güvenlik yedeği oluşturulamadı — geri yükleme İPTAL edildi (kullanıcı verisi korunuyor)
  DM_004: "DM_004", // Veritabanı geri yükleme başarısız
  DM_005: "DM_005", // Fotoğraf geri yükleme başarısız (veritabanı ZATEN geri yüklendi — kısmi başarı)
  DM_006: "DM_006", // Kullanıcı dosya seçimini iptal etti (hata DEĞİL, ama akışın normal şekilde sonlanması için bir kod gerekiyor)
=======
>>>>>>> 48d254dae2e565c80e11bdcf516d3ea27581e3b3

  SYS_001: "SYS_001", // Beklenmeyen/sınıflandırılamayan hata
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];
