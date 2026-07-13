# ADR 0007 — Ses Kaydı (Sesli Not) Eklentisi Seçimi

**Durum:** Kabul edildi (uygulama Modül 3'te yapılacak)
**Tarih:** 2026-07-13

## Bağlam

Saha Gözlemleri modülünde, web projesindeki `Observation.audioNotePath`
alanının karşılığı olarak sesli not kaydı özelliği planlanıyor. Bu,
Modül 1'in kapsamında değildir; karar burada, ileride tekrar
araştırmaya gerek kalmaması için şimdiden belgeleniyor.

## Karar

`@capgo/capacitor-audio-recorder` (v8.0.13, MPL-2.0) kullanılacak.
Bağımlılık, ilgili modül (Modül 3) kodlanırken eklenecek — Modül 1'de
henüz kurulmuyor (Kural 3: gereksiz/erken bağımlılık eklenmez).

## Gerekçe

- Resmi uyumluluk tablosunda Capacitor 8 ile açıkça uyumlu ve aktif
  bakımlı olarak işaretli.
- Tamamen ücretsiz (kendini "Capacitor için tek ücretsiz ve güncel ses
  kayıt eklentisi" olarak tanımlıyor) — ücretli alternatiflerle aynı
  API yüzeyini sunuyor.
- Duraklat/devam et/iptal et, arka planda kayıt, izin yönetimi, hata
  olayları gibi saha kullanımı için gerekli tüm özellikleri karşılıyor.

## Alternatifler ve Neden Reddedildi

- `@capawesome-team/capacitor-audio-recorder`: Teknik olarak zengin
  ama yalnızca ücretli "Capawesome Insiders" aboneliğiyle kullanılabiliyor
  — Kural 17'ye aykırı.
- `tchvu3/capacitor-voice-recorder`, `@lgicc/capacitor-voice-recorder`:
  Ücretsiz ama Capacitor 8 uyumluluğu açıkça teyit edilmemiş ve/veya
  bakım sinyalleri zayıf (uzun süredir güncellenmemiş).

## Sonuçlar

Modül 3 (Saha Gözlemleri) başladığında bu paket kurulacak ve
`src/native/audioRecorder.ts` adında benzer bir ince sarmalayıcı
katmanı yazılacak.
