# Bahçem Mobile v1.0 — Final UI Prototipi

Bu klasör, Bahçem Mobile projesinin **v1.0 tamamlandığında nasıl görüneceğine
dair GÖRSEL bir prototiptir** — çalışan bir uygulama DEĞİLDİR, gerçek koda
bağlı değildir, hiçbir veri kalıcılığı yoktur.

## Nasıl Açılır?

`index.html` dosyasını **Chrome (veya herhangi bir modern tarayıcı) ile**
açın — hiçbir kurulum, sunucu veya derleme adımı GEREKMEZ.

```bash
# Örnek (işletim sisteminize göre değişebilir):
open docs/final-ui-preview/index.html
# veya dosyayı doğrudan tarayıcıya sürükleyin
```

## Bu Prototip Neyi Temsil Ediyor?

- **Bugün gerçekten var olan ekranlar** (Parseller, Ağaçlar, Gözlemler,
  Finans, Bakım, AI Sohbet, AI Ayarları, Ayarlar) — gerçek kod tabanındaki
  bileşen deseninin (kart listeleri, `status-screen`, buton stilleri)
  GÖRSEL bir yansımasıdır.
- **Resmi olarak planlanan ama henüz geliştirilmemiş modüller** (Dashboard,
  Hasat, Hava Durumu, Fotoğraf Analizi, Raporlar) — `docs/module-status.md`
  ve ADR'lerde GERÇEKTEN kayıtlı modüllerdir. Sayfalarında 🟢 **yeşil bir
  not** bulunur.
- **Vizyoner/aday ekranlar** (Stok, Bildirimler) — **HİÇBİR resmi kararı
  olmayan**, sadece "ileride nasıl görünebilir" sorusuna görsel bir cevap
  veren tasarımlardır. Sayfalarında 🟣 **mor bir uyarı notu** bulunur ve
  neden resmi olmadıkları açıkça belirtilir.
- **"Profil" yerine "Cihaz Bilgisi"** — uygulamanın hesapsız/tek-kullanıcılı
  mimarisi (bkz. proje `README.md`'si) nedeniyle, geleneksel bir kullanıcı
  profili ekranı yerine mimariye uygun bir karşılık tasarlandı.

## Kaynak

Bu prototip, `docs/roadmap/01-current-state-and-roadmap.md` ve
`docs/roadmap/02-final-ui-design.md` belgelerinin GÖRSEL bir uzantısıdır.
Renk paleti (`css/style.css`), gerçek uygulamanın `src/index.css`
dosyasından **birebir alındı** (zeytin yeşili `#2e7d32` teması) — tutarlılık
için.

## Klasör Yapısı

```
final-ui-preview/
├── index.html              — Giriş
├── dashboard.html           — Ana Sayfa (planlanan)
├── parcels.html              — Parseller (mevcut)
├── parcel-detail.html        — Parsel Detayı (mevcut)
├── trees.html                 — Ağaçlar / Referans Ağaçlar (mevcut)
├── observations.html          — Gözlemler (mevcut)
├── harvest.html                — Hasat (planlanan)
├── ai-chat.html                 — AI Asistan (mevcut, Sprint 7.3 tasarımı)
├── photo-analysis.html          — Fotoğraf Analizi (planlanan)
├── weather.html                  — Hava Durumu (planlanan)
├── finance.html                   — Finans (mevcut)
├── reports.html                    — Raporlar (planlanan)
├── inventory.html                   — Stok (🟣 VİZYONER)
├── notifications.html                — Bildirimler (🟣 VİZYONER)
├── settings.html                      — Ayarlar (mevcut, genişletilmiş)
├── profile.html                        — Cihaz Bilgisi ("Profil" yerine)
├── css/style.css                        — Ortak stil (gerçek renk paletiyle)
├── js/app.js                             — Minimal etkileşim (textarea auto-grow)
└── assets/                                — (bilinçli olarak boş — bkz. assets/README.md)
```

## Sınırlamalar (Dürüstçe Belirtilmesi Gereken)

- Bu, **gerçek koda bağlı değildir** — gerçek uygulama değiştiğinde bu
  prototip **otomatik güncellenmez**, elle senkronize edilmelidir.
- **Hiçbir gerçek veri, hesaplama veya AI çağrısı yoktur** — tüm sayılar/
  metinler örnek/uydurma veridir (parsel adları, kg değerleri vb.), gerçek
  bir kullanıcı verisi DEĞİLDİR.
- Tablet görünümü (Bölüm 16, `docs/roadmap/02-final-ui-design.md`) bu
  prototipte AYRICA tasarlanmadı — sadece telefon çerçevesi simüle edildi.
