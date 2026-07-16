# Sprint 4.0.1 — Performans Karşılaştırması (Vitest Seviyesi)

## Ölçüm (Gerçek Test Çalışma Süreleri)

| Test | Süre |
|---|---|
| `AppRouter.test.tsx` (9 test, Parsel→Ağaç→Gözlem→Fotoğraf tam zincir dahil) | 298-512 ms |
| `BackButtonHandler.test.tsx` (5 test) | 37-39 ms |
| Tam suite (156 test) | ~27-30 s (Sprint 3.10.1'deki ~22s'ye kıyasla, yeni 14 test eklendiği için beklenen artış) |

## Değerlendirme

Vitest seviyesindeki bu ölçümler, **gerçek cihaz performansının bir vekili değil** — sadece test-ortamı çalışma süresini gösteriyor (dürüstçe belirtiliyor, Sprint 3.9'daki aynı ayrım ilkesiyle tutarlı). `HashRouter`'ın kendisi, React'in mevcut render döngüsüne ek, ölçülebilir bir çalışma zamanı yükü getirmiyor — route eşleştirmesi hafif bir string-karşılaştırma işlemi.

## Gerçek Cihaz Performans Ölçümü — Sprint 4.0.2'nin Konusu

Aşağıdakiler **sadece gerçek cihazda** anlamlı ölçülebilir, burada iddia edilmiyor:
- Ekranlar arası geçiş gecikmesi (özellikle `ObservationScreenRoute`'un Tree çekme anındaki yükleme süresi)
- Uygulama soğuk açılış süresi (bundle boyutu artışının gerçek etkisi)
- Düşük performanslı cihazlarda hızlı ardışık navigasyon davranışı
