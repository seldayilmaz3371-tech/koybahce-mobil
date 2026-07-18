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

  SYS_001: "SYS_001", // Beklenmeyen/sınıflandırılamayan hata
} as const;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];
