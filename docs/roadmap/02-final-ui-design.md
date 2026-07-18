# Bahçem Mobile v1.0 — Final UI/UX Tasarım Dokümanı

**Tarih:** 2026-07-18 · **Durum:** Vizyon çalışması — kod YAZILMADI, mevcut proje DEĞİŞTİRİLMEDİ
**Kural:** Mevcut mimariye (Kural 12 — tutarlı desen, Material Design benzeri sade bileşenler, offline-first) tamamen sadık kalınarak tasarlandı. Hiçbir yeni özellik UYDURULMADI — sadece `module-status.md`, ADR'ler ve Modül 5 Analiz Raporu'nda GERÇEKTEN geçen adaylar kullanıldı.

---

## 11. Vizyon İlkeleri

1. **Tek kullanıcılı, hesapsız mimari KORUNUR** — hiçbir ekran "giriş yap/kayıt ol" varsaymaz.
2. **Offline-first KORUNUR** — internet gerektiren TEK alan AI özellikleri (Sohbet, Fotoğraf Analizi, Hava Durumu, Harita karoları) — bunlar HER ZAMAN "çevrimdışı" bir durum göstermeli.
3. **Sade, saha-dostu tasarım KORUNUR** — büyük dokunma hedefleri (min 48px), yüksek kontrast, karmaşık animasyon YOK.
4. **Mevcut bileşen dili KORUNUR** — kart listeleri, `status-screen`, `lock-screen__button` deseni GENİŞLETİLİR, YENİDEN İCAT EDİLMEZ.

---

## 12. Tüm Ekranlar (Tam Liste)

### 12.1 Bugün Var Olan Ekranlar (Gerçek, Kod Tabanında Doğrulandı)

| # | Ekran | Durum |
|---|---|---|
| 1 | LockScreen | ✅ Var |
| 2 | Parseller (Liste + Form) | ✅ Var |
| 3 | Ağaçlar (Liste + Form, Parsel/Referans Modu) | ✅ Var |
| 4 | Toplu Ağaç Oluşturma | ✅ Var |
| 5 | Gözlemler (Liste + Form) | ✅ Var |
| 6 | Fotoğraf Galerisi | ✅ Var |
| 7 | Finans (Liste + Form) | ✅ Var |
| 8 | Bakım Kayıtları (Liste + Form) | ✅ Var |
| 9 | Bakım Planları + Yaklaşan/Geciken Görünümü | ✅ Var |
| 10 | AI Ayarları | ✅ Var |
| 11 | AI Sohbet | ✅ Var |
| 12 | Ayarlar (Hub, sadece "AI" girişi) | ✅ Var |

### 12.2 v1.0'a Kadar Eklenecek Resmi Modül Ekranları

| # | Ekran | Kaynak |
|---|---|---|
| 13 | Dashboard | module-status.md |
| 14 | Hasat (Liste + Form) | module-status.md |
| 15 | Hava Durumu | module-status.md |
| 16 | Harita | module-status.md |
| 17 | Fotoğraf Analizi | AI Master Architecture Bölüm 11 |
| 18 | Sesli Asistan | AI Master Architecture Bölüm 12 |
| 19 | Raporlar | module-status.md |
| 20 | Ayarlar — Dil/Tema/Yedekleme Alt Ekranları | ADR 0008 + i18n altyapısı |

### 12.3 🔴 Vizyoner/Aday Ekranlar (Resmi Modül DEĞİL — Dürüstçe İşaretlendi)

| # | Ekran | Neden Resmi Değil |
|---|---|---|
| 21 | Stok/Envanter | Sadece web projesi karşılaştırmasında "aday" — hiçbir ADR/karar yok |
| 22 | Bildirimler | Modül 5'ten beri her sprintte "❌ Push Notification" olarak YASAKLANDI — henüz hiç onaylanmadı |
| 23 | Profil | **Hiçbir belgede geçmiyor** — tek-kullanıcılı/hesapsız mimariyle DOĞAL olarak uyuşmuyor |

**Bu üç ekran, aşağıdaki bölümlerde ve HTML prototipinde YİNE DE tasarlanacak** (kullanıcının 25. maddede istediği dosya yapısı bunları içeriyor) — ama her birinde "VİZYONER" etiketi ve neden resmi olmadığının açıklaması YER ALACAK.

---

## 13. Her Ekranın Detayı

### Dashboard
- **Amaç:** Uygulamayı açınca (kilidi geçtikten sonra) görülecek özet.
- **Kartlar:** "Toplam Parsel" (sayı), "Toplam Ağaç" (sayı), "Bu Ay Geciken Bakımlar" (Sprint 5.5'in `dueStatus=overdue` sorgusunu TEKRAR KULLANIR), "Son 5 Gözlem" (mini liste).
- **Butonlar:** Her karta dokunma → ilgili listeye gider.
- **AI Desteği:** "AI Asistan'a Sor" hızlı erişim butonu (global sohbet).
- **Kullanıcı Akışı:** Kilit → Dashboard → (kart seçimi) → İlgili modül.

### Hasat
- **Amaç:** Ağaç/parsel bazlı hasat miktarı.
- **Kartlar:** Her hasat kaydı — tarih, miktar (kg), parsel/ağaç adı.
- **Bilgi Alanları:** Form — parsel/ağaç (bağlamdan), miktar, tarih, notlar.
- **AI Desteği:** Sohbet üzerinden "Bu sezon toplam hasat ne kadar?" gibi sorular (mevcut Tool Registry'ye `queryHarvestSummary` eklenmesi gerekir — bu, tasarım aşamasında NOT edilir, kod YAZILMAZ).

### Hava Durumu
- **Amaç:** Parsel konumuna göre güncel/kısa vadeli tahmin.
- **Kartlar:** Bugün/yarın/3 gün özet kartları, sıcaklık+yağış ikonlarıyla.
- **Filtreler:** Parsel seçici (birden fazla parsel varsa).
- **Renkler:** Don riski = kırmızı vurgulu uyarı kartı.
- **Çevrimdışı Davranış:** Son çekilen veriyi "X saat önce alındı" etiketiyle gösterir, yeni veri çekmeyi DENEMEZ.

### Harita
- **Amaç:** Parsellerin coğrafi gösterimi.
- **Kartlar:** Yok — tam ekran harita, parsel pin'leri.
- **Filtreler:** Parsel tipi/ürün türüne göre pin renk kodlaması (opsiyonel, v1.0 sonrası olabilir).

### Fotoğraf Analizi
- **Amaç:** Bir fotoğrafı AI'ye gönderip analiz sonucu almak.
- **Kartlar:** "Risk Puanı" (düşük/orta/yüksek, renk kodlu), "AI Önerisi" (metin), "Karşılaştırmalı Fotoğraf" (önceki analizle yan yana).
- **AI Desteği:** Doğrudan bu ekranın KENDİSİ bir AI özelliği.

### Sesli Asistan
- **Amaç:** Sesle soru sorma.
- **Butonlar:** Büyük, ortada bir mikrofon butonu (dokunmatik hedefte özellikle büyük — saha kullanımı için, Kural 15).
- **AI Desteği:** AI Sohbet'in ses girişli/çıkışlı bir varyasyonu.

### Raporlar
- **Amaç:** PDF/paylaşılabilir özetler.
- **Kartlar:** Rapor türü seçenekleri (Maliyet Özeti, Verim Özeti, Bakım Geçmişi).
- **Butonlar:** "Oluştur ve Paylaş".

### 🔴 Stok/Envanter (VİZYONER)
- **Amaç (varsayımsal):** Gübre/ilaç/malzeme stok takibi.
- **Not:** Resmi karar YOK — bu tasarım SADECE web projesindeki `InventoryItem` modelinin görsel bir yansıması, gerçek bir taahhüt DEĞİL.

### 🔴 Bildirimler (VİZYONER)
- **Amaç (varsayımsal):** Yaklaşan bakım/hava durumu uyarıları.
- **Not:** Her sprintte AÇIKÇA YASAKLANMIŞ bir özellik — bu tasarım sadece "ileride onaylanırsa nasıl görünebilir" sorusuna cevap.

### 🔴 Profil (VİZYONER — Mimariyle Uyumsuz)
- **Gerçek durum:** Uygulama hesapsız/tek-kullanıcılı. Geleneksel "profil" (isim, e-posta, avatar) YOK.
- **Mimariye Uygun Alternatif:** "Cihaz Bilgisi" — uygulama sürümü, şema sürümü, son yedekleme tarihi (ADR 0008), depolama kullanımı. Bu, "Profil" DEĞİL ama BENZER bir ihtiyacı (uygulama hakkında bilgi) mimariye UYGUN şekilde karşılıyor.

---

## 14. Tüm Ekran Geçişleri (Akış)

```
LockScreen (biyometri/PIN)
  └─→ Dashboard (YENİ ana ekran — bugün Parseller idi)
        ├─→ Parseller
        │     ├─→ Parsel Formu (Düzenle)
        │     │     ├─→ Ağaçlar (parsel-bağlamlı)
        │     │     ├─→ Finans (parsel-bağlamlı)
        │     │     ├─→ Bakım (parsel-bağlamlı)
        │     │     ├─→ Hasat (parsel-bağlamlı) [YENİ]
        │     │     └─→ AI Asistan (parsel-bağlamlı)
        │     └─→ Referans Ağaçlar
        │           └─→ Ağaç Formu → Gözlemler → Fotoğraflar
        ├─→ AI Asistan (genel)
        │     └─→ AI Ayarları
        ├─→ Hava Durumu [YENİ]
        ├─→ Harita [YENİ]
        │     └─→ (pin seçimi) → Parsel Formu
        ├─→ Raporlar [YENİ]
        └─→ Ayarlar
              ├─→ AI Ayarları
              ├─→ Dil/Tema [YENİ]
              └─→ Yedekleme [YENİ]
```

**Not:** Fotoğraf Analizi, Fotoğraf Galerisi İÇİNDEN bir fotoğrafa dokunularak erişilir (ayrı bir üst-düzey giriş noktası değil) — mevcut Fotoğraf modülünün DOĞAL bir uzantısı.

---

## 15. Navigasyon Yapısı

**Mevcut durum (bugün):** Hiçbir kalıcı navigasyon çubuğu YOK — her ekran kendi "Geri" butonuyla + Android donanım geri tuşuyla yönetiliyor (Router tabanlı, HashRouter).

**v1.0 için öneri:** Ekran sayısı arttıkça (12'den 20+'a), **Bottom Navigation** (alt gezinme çubuğu) eklenmesi ÖNERİLİR — 4-5 ana sekme:
1. **Ana Sayfa** (Dashboard)
2. **Parseller**
3. **AI Asistan**
4. **Raporlar/Diğer** (Hava Durumu, Harita, Ayarlar'a açılan bir "Daha Fazla" sekmesi)

**FAB (Floating Action Button):** Parseller ekranında "Yeni Parsel Ekle" için düşünülebilir (bugün normal bir buton).

**Drawer (Yan Menü):** ÖNERİLMEZ — saha kullanımında (tek elle, tozlu ortamda) yan menü açmak Bottom Navigation'dan daha ZAHMETLİ, Kural 15 ile ÇELİŞİR.

---

## 16. Telefon ve Tablet

- **Telefon (birincil hedef):** Mevcut tasarım ZATEN telefon-öncelikli (`.status-screen` `max-width: 480px`, Sprint 7.2'de eklendi).
- **Tablet:** Sprint 7.2'nin `max-width` çözümü, İÇERİĞİN ortada kalmasını sağlıyor ama tabletin GENİŞ EKRANINI VERİMLİ KULLANMIYOR. v1.0 için öneri: tablet genişliğinde (>768px) **iki sütunlu düzen** (ör. Parsel Listesi solda, Parsel Detayı sağda — master-detail deseni) değerlendirilebilir. **Bu, bugün planlanmamış, YENİ bir öneri olarak işaretleniyor.**

---

## 17. AI Asistan Final Tasarımı

Bugünkü (Sprint 7.3) tasarım ZATEN sohbet balonları, otomatik büyüyen textarea, spinner içeriyor. v1.0 için EKLENECEK (bugün YOK):

- **Kod blokları:** AI'nin teknik bir yanıt vermesi durumunda (nadir, ama Gemini genel amaçlı) — `<pre><code>` stilinde blok.
- **Fotoğraf gösterimi:** Fotoğraf Analizi ile ENTEGRE olursa, sohbet balonunun İÇİNDE küçük bir fotoğraf önizlemesi.
- **Kaynak gösterimi:** Bir Tool Call sonucu kullanıldıysa, "Kaynak: Parsel X verisi" gibi küçük bir etiket (şeffaflık için, kullanıcı AI'nin NEREDEN bilgi aldığını görsün).
- **Parsel bilgi kartı:** AI bir parselden bahsettiğinde, o parsele dokunulabilir bir mini kart olarak gösterilebilir (metin içinde gömülü).
- **Ses/Dosya/Kamera:** Sesli Asistan (madde 18) ile ENTEGRE olursa, giriş alanının yanına mikrofon ikonu eklenir.

---

## 18-24. Diğer Ekranların Final Görünümleri

Bu ekranların HER BİRİNİN somut, GÖRSEL karşılığı **HTML prototipinde** (Bölüm 25) sunulmuştur — burada TEKRAR yazıya dökülmek yerine, doğrudan prototipe yönlendiriliyor (tekrar önleme, Kural 8).
