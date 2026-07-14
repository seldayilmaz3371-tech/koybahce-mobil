# ADR 0019 — Log Sistemi (Minimal, Yerel)

**Durum:** Kabul edildi — mimari tasarım tamamlandı, kurulum Modül 2 kod aşamasında yapılacak
**Tarih:** 2026-07-14
**İlgili:** AI Master Architecture Bölüm "Log Sistemi" (açık bırakılmıştı)

## Bağlam

AI Master Architecture'da log sistemi kasıtlı olarak açık bırakılmıştı ("basit `console.error` mi yeterli, yoksa kalıcı bir tanılama logu mu gerekli, buna Modül 2 başlarken karar vermemiz gerekiyor").

## Karar

**Şimdilik: ince bir `console` sarmalayıcısı, kalıcı depolama YOK.**

```
src/core/logger.ts
  - logger.error(context, error)
  - logger.warn(context, message)
  - logger.info(context, message)
```

Her çağrı, tutarlı bir önek (ör. `[ParcelRepository]`) ile `console.*`'a yazar. Hiçbir log dosyaya veya SQLite'a kalıcı yazılmaz, hiçbir harici log/crash-reporting servisine (Sentry, Firebase Crashlytics vb.) gönderilmez.

## Gerekçe

- **Kural 17 (harici servis bağımlılığı minimum):** Crash reporting servisleri genelde ücretsiz katmanlı ama büyüdükçe maliyetli SaaS ürünleridir — bugün gerçek bir ihtiyaç yok.
- **YAGNI:** Kalıcı log dosyası, ancak "kullanıcı bana hata ekran görüntüsü değil log dosyası gönderebilsin" gibi somut bir ihtiyaç doğduğunda anlamlı olur — bu ihtiyaç henüz yok.
- Merkezi bir `logger.ts` katmanı olması (dağınık `console.log` çağrıları yerine), ileride kalıcı loglama eklenmesi gerektiğinde **tek bir dosyanın** değişmesini sağlıyor (Kural 12).

## Gelecek Değerlendirme Tetikleyicisi

Eğer sahada "uygulama şu hatayı verdi ama tekrarlayamıyorum" türü destek talepleri sıklaşırsa, `logger.ts`'in içine **yerel, dönen (rotating) bir dosya loguna** yazma eklenebilir (yine harici servis olmadan — sadece cihazda saklanan bir metin dosyası, kullanıcı isterse dışa aktarabilir). Bu, mevcut arayüzü bozmadan `logger.ts` içinde yapılacak bir iç değişiklik olur.

## Sonuçlar

Modül 2 kod aşamasında `src/core/logger.ts` oluşturulacak, repository katmanındaki hata yakalama noktalarında kullanılacak.
