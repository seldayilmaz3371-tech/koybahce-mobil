/**
 * Desteklenen Diller
 * ====================
 *
 * MİMARİ KARAR (bkz. Engineering Protocol — Globalization Policy):
 * Yeni bir dil eklemek, bu dosyaya bir satır eklemek ve
 * `locales/<kod>/common.json` dosyasını oluşturmaktan ibaret olmalı —
 * hiçbir bileşen kodu değişmemeli. Bu dosya, "hangi diller var" ve
 * "hangileri sağdan sola yazılıyor" bilgisinin TEK kaynağıdır.
 */

export interface SupportedLanguage {
  /** BCP 47 dil kodu (ör. 'en', 'tr'). */
  code: string;
  /** Dilin kendi dilindeki adı (dil seçim ekranında kullanılacak). */
  nativeName: string;
  /** Sağdan sola mı yazılıyor? (Arapça, İbranice gibi diller için true) */
  isRtl: boolean;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: "en", nativeName: "English", isRtl: false },
  { code: "tr", nativeName: "Türkçe", isRtl: false },
];

/** Protokol gereği: sistemin varsayılan/yedek dili İngilizcedir. */
export const FALLBACK_LANGUAGE_CODE = "en";

export function isSupportedLanguageCode(code: string): boolean {
  return SUPPORTED_LANGUAGES.some((lang) => lang.code === code);
}

export function isRtlLanguageCode(code: string): boolean {
  return SUPPORTED_LANGUAGES.find((lang) => lang.code === code)?.isRtl ?? false;
}

/**
 * Belgenin (`<html>`) `dir` özniteliğini verilen dile göre ayarlar.
 * Bu, CSS'in mantıksal özellikler (`margin-inline-start` vb.) ile
 * yazılmış olması koşuluyla, sağdan-sola dillerde otomatik doğru
 * düzeni sağlar. Fiziksel yön özellikleri (`margin-left` vb.)
 * kullanılırsa bu otomatik davranış bozulur — Engineering Protocol'e
 * bu kural eklendi.
 */
export function applyDocumentDirection(languageCode: string): void {
  document.documentElement.dir = isRtlLanguageCode(languageCode) ? "rtl" : "ltr";
  document.documentElement.lang = languageCode;
}
