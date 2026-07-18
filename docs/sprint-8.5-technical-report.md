# Sprint 8.5 — Teknik Rapor

**Tarih:** 2026-07-18 · **Kapsam:** Dashboard Navigasyon Entegrasyonu

## Karar Bağlamı

Sprint 8.4 sonunda, Dashboard'ın navigasyonu (yeni ana ekran mı, buton girişi mi) kullanıcı kararına bırakılmıştı. Kullanıcı önce gerekçemi sordu, ben **buton girişi (ana ekran değil)** önerdim, kullanıcı "sen olsan nasıl tasarlardın anlayacağım şekilde anlat" dedi, gerekçe sunuldu, kullanıcı "işine karışmıyorum, istediğin gibi tasarla" dedi. Bu, tam bir onaydır.

## GERÇEK (Bu Sprintte Gerçekten Yapılanlar)

- `src/router/routes.ts`: `dashboard` rotası `FUTURE_ROUTE_NAMES`'ten gerçek bir `ROUTE_PATTERNS`/`buildPath` girişine taşındı.
- `DashboardScreen.tsx`: `onBack` prop'u + görünür "Back" butonu eklendi (AI Sohbet/AI Ayarları ile aynı desen).
- `AppRouter.tsx`: `DashboardScreenRoute` (basit, `navigate(-1)`).
- `ParcelsScreen.tsx`: `onViewDashboard` prop'u + buton, "Add Parcel"dan hemen sonra (en görünür konum).
- `parcel.dashboardButton` i18n anahtarı EN/TR'ye eklendi.
- **4 yeni gerçek test** — 1'i Dashboard'ın kendi "Back" butonu, 3'ü `AppRouter.test.tsx`'te gerçek navigasyon (Parseller→Dashboard, gerçek veri gösterimi, Dashboard→Back).
- `npx tsc -b`, `npm run test` (538/538), `npm run lint` (0 uyarı), `npm run build`, `npx cap sync android` — **hepsi gerçekten çalıştırıldı**.

## Neden Ana Ekran Değil (Karar Gerekçesi, Kayıt Altında)

1. Sprint 7.2'de gerçek cihazda test edilen "Kilit→Parseller" akışını değiştirmek, Beta'ya yakın bir noktada gereksiz bir regresyon riski taşırdı.
2. Saha kullanımında (Kural 15) bir "özet ekran" arada durmak, doğrudan aksiyona (gözlem girme, bakım kaydı) erişimi bir tık geciktirir.
3. Henüz gerçek bir Beta kullanıcı geri bildirimi yok — "kullanıcılar Dashboard'ı ana ekran olarak ister" varsayımı kanıtlanmadı (YAGNI).
4. Bottom Navigation eklendiğinde (roadmap'in gelecekteki bir önerisi), "ana ekran" kavramının kendisi zaten anlamını yitirecek — bu karar o zaman kolayca gözden geçirilebilir.

## VARSAYIM

Hiçbiri.

## Mimari Sadakat Kontrolü

| Kural | Durum |
|---|---|
| Repository Pattern bozulmadı | ✅ |
| Offline First bozulmadı | ✅ |
| Mevcut ortak bileşenler kullanıldı | ✅ — Route wrapper/prop deseni Bakım/Hasat/AI ile birebir aynı |
| App.tsx'in varsayılan davranışı DEĞİŞMEDİ | ✅ — LockScreen sonrası hâlâ Parseller açılıyor |

## ADR Kararı

**Yeni ADR yazılmadı.** Gerekçe: Mevcut navigasyon deseninin (route + prop + buton) tekrarı, yeni bir mimari karar değil.

## BUILD_INFO ile Çelişki Kontrolü

Test sayısı (538/538, +4), bundle boyutu (+6.73kB) ve commit hash (`33b94b4`), `BUILD_INFO.md` ile **birebir aynı** — çelişki yok.

## Sonuç

Modül 8 (Dashboard) artık **tam işlevsel** — Parseller ekranından erişilebiliyor, ana ekran davranışı korunuyor. Roadmap'in bir sonraki adımı: Sprint 9.1-9.2 (Fotoğraf Analizi) veya kullanıcının belirleyeceği başka bir öncelik.
