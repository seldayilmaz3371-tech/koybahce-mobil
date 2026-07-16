# Sprint 4.0.1 — Bundle Boyutu Karşılaştırması

## Ölçüm (Gerçek `npm run build` Çıktısı)

| | Sprint 3.10.1 Sonu | Sprint 4.0.1 Sonu | Fark |
|---|---|---|---|
| Ana JS chunk (`index-*.js`) | 320.21 kB | 360.35 kB | **+40.14 kB (+12.5%)** |
| Gzip (ana chunk) | ~95.59 kB | 109.53 kB | +13.94 kB |
| Toplam `dist/` boyutu | — | 448 KB | — |

## Değerlendirme

+40 kB artış, tamamen `react-router`'ın (declarative mode) kendisi — yeni hiçbir özellik/ekran eklenmedi, sadece navigasyon mekanizması değişti. Bu, **beklenen ve kabul edilebilir** bir maliyet:

- Saha koşullarında (Kural 15 — zayıf internet) **hiç önemli değil**, çünkü uygulama tamamen yerel (offline-first) — bu boyut sadece **ilk APK kurulumunu** etkiler, çalışma zamanı ağ indirmesi yok.
- `HashRouter` + declarative mode, react-router'ın **en hafif** kullanım şekli — Framework Mode/SSR'ın hiçbir parçası pakete girmedi.

## Sonuç

Kabul edilebilir, gerekçeli bir artış. Gerçek cihazda **APK boyutu** ve **açılış süresi** karşılaştırması Sprint 4.0.2'nin kontrol listesinde.
