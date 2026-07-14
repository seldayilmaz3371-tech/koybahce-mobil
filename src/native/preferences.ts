/**
 * Yerel Ayarlar Deposu (Preferences) — İnce Sarmalayıcı Katmanı
 * ==================================================================
 *
 * MİMARİ KARAR (bkz. docs/adr/0011-i18n-mimarisi.md):
 * Bu katman, uygulamanın üçüncü depolama katmanıdır — SQLite (Kural:
 * yapılandırılmış iş verisi, kimlik doğrulama SONRASI erişilir) ve
 * Secure Storage (Kural: gerçek sırlar — API anahtarı, şifreleme
 * anahtarı) ile KARIŞTIRILMAZ.
 *
 * Bu katman şunlar için kullanılır: kimlik doğrulama ÖNCESİ erişilmesi
 * gereken, hassas OLMAYAN, basit ayarlar. Örnek: dil tercihi — kilit
 * ekranı henüz kimlik doğrulanmadan gösterildiği için (veritabanı
 * kapalı), dil tercihinin SQLite'tan okunması mümkün değil; Secure
 * Storage'a koymak ise yanlış katman kirliliği olur (o, gerçek sırlar
 * içindir). @capacitor/preferences, resmi Capacitor eklentisi olarak
 * tam bu ihtiyacı karşılar: hızlı, şifresiz, kimlik doğrulama öncesi
 * erişilebilir.
 *
 * Bu depoya ASLA hassas veri (API anahtarı, şifreleme anahtarı, kişisel
 * tarım verisi) yazılmaz — o veriler sırasıyla secureStorage.ts ve
 * SQLite'a aittir.
 */

import { Preferences } from "@capacitor/preferences";

export const LocalPreferenceKey = {
  /** Kullanıcının seçtiği veya cihazdan algılanan dil kodu (ör. 'tr', 'en'). */
  LANGUAGE: "language_preference",
} as const;

export type LocalPreferenceKeyName =
  (typeof LocalPreferenceKey)[keyof typeof LocalPreferenceKey];

async function getPreference(key: LocalPreferenceKeyName): Promise<string | null> {
  const result = await Preferences.get({ key });
  return result.value;
}

async function setPreference(key: LocalPreferenceKeyName, value: string): Promise<void> {
  await Preferences.set({ key, value });
}

export const localPreferences = {
  get: getPreference,
  set: setPreference,
};
