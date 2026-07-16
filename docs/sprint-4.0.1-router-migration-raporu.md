# Sprint 4.0.1 — Router Migration Raporu

**Tarih:** 2026-07-15 · **Durum:** Kod tamamlandı, Sprint 4.0.2'de gerçek cihaz kalite doğrulaması bekleniyor

## Yapılan İşler

- `react-router` v8.2.0 kuruldu (declarative mode — `HashRouter`/`Routes`/`Route`/`useNavigate`/`useParams`)
- 5 üst-düzey rota bağlandı: `/parcels`, `/parcels/:parcelId/trees`, `/reference-trees`, `/trees/:treeId/observations`, `/observations/:observationId/photos`
- `App.tsx` küçültüldü (184→~95 satır) — sadece kilit/altyapı geçidi + `<AppRouter />`
- `src/router/` klasörü: `routes.ts`, `BackButtonHandler.ts`, `AppRouter.tsx`

## Kapsam Kararı — Neden Tüm 5 Rota Tek Seferde?

İlk onaylanan plan sadece Parsel↔Ağaç'ı bu sprinte alıyordu. Kodlama sırasında **gerçek bir çelişki** bulundu: kısmi geçiş, "View Observations" butonunu geçici olarak kırardı (404 fallback). Kullanıcı onayıyla kapsam **Seçenek A**'ya genişletildi — tüm 5 rota aynı sprintte bağlandı, hiçbir çalışan akış kesintiye uğramadı.

## Mimari Kararlar

| Karar | Gerekçe |
|---|---|
| `HashRouter` (`BrowserRouter` değil) | `pushState` fallback desteğinin Capacitor WebView'de garantili olduğu doğrulanamadı |
| Sadece üst-düzey navigasyon taşındı | Screen bileşenlerinin iç `useState`'i (liste/oluştur/düzenle) hiç değişmedi — regresyon yüzeyini minimumda tuttu |
| `navigate(-1)` her `onBack` için tutarlı kullanıldı | Gerçek dünya Capacitor+react-router kullanımlarıyla doğrulanmış desen; tüm navigasyon bizim kontrolümüzde olduğu için güvenilir |
| `useBackButtonFallback` — dar kapsamlı, sadece yükleme anında aktif | Ekranın kendi dinleyicisiyle çakışmayı (çift-tetikleme) yapısal olarak imkansız kılıyor — gerçek testle kanıtlandı |

## Dokunulmayan Katmanlar (Doğrulandı)

Repository, Hook, Domain, SQLite, tüm Form/Screen bileşenlerinin kendisi — hiçbiri değişmedi. `git diff --stat` bunu doğruluyor (aşağıda Regresyon Analizi'nde).
