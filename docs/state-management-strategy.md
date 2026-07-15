# Belge 4 — State Management Strategy

**Durum:** Onay bekliyor · **Tarih:** 2026-07-15
**Çelişmediği belgeler:** Modül 2 Mimari Doğrulaması (hook tasarımı kararı), AI Master Architecture Bölüm 7 (Tool Calling)

---

## Amaç

Bugünkü küçük ölçekli mimariyi bozmadan, Parseller/Ağaçlar/Fotoğraflar/Gözlemler/Finans/Stok/AI/Dashboard/Bildirimler gibi büyüyen modül sayısı karşısında state yönetiminin **uzun vadede** nasıl ilerleyeceğine kesin karar vermek.

## Kapsam

Tüm React state — component-local, hook-level, ve (bugün yok, gelecekte olası) global state.

---

## Tasarım Kararları

### Kesin Karar: "SQLite = Tek Gerçek Kaynak, React State = Anlık Yansıma"

**Bugünden itibaren ve öngörülebilir gelecek için** geçerli temel ilke: veri her zaman SQLite'ta kalıcıdır; React state (hook içindeki `useState`) sadece o anki ekranın **anlık, kaybolabilir** bir yansımasıdır. Bu, "kaybolan global state" probleminin bu mimaride **yapısal olarak var olmadığı** anlamına gelir — her hook, mount olduğunda veya mutasyon sonrası, taze veriyi SQLite'tan çeker.

### React Context

**Değerlendirme:** Context, "birden fazla derin iç içe bileşenin ihtiyaç duyduğu, sık değişmeyen" veri için uygundur (ör. aktif dil/tema). Bugün `react-i18next` zaten kendi context'ini yönetiyor — bu, halihazırda kullanılan tek Context. **Yeni bir Context bugün eklenmiyor.**

**Gelecekteki olası tetikleyici:** Spekülatif "aktif çiftlik" kavramı (Database Master Schema'daki `FARM` — bugün yok) gerçek olursa, Context adayı olabilir.

### Custom Hooks (Ana Desen — Devam Ediyor)

`useParcels` deseni (repository'nin ince React sarmalayıcısı) **tüm gelecek modüllerin standart deseni** olarak teyit edildi. Her domain kendi `use<Domain>` hook'unu yazar.

### Zustand — Neden Seçilmedi

Gerçek bir aday olarak değerlendirildi (Redux'a göre çok daha hafif). Ama **çözülmemiş bir problem yok**: her ekran kendi hook'unu çağırıyor, veri zaten kalıcı depoda (state kaybı riski yapısal olarak yok). Zustand eklemek, var olmayan bir sorunu çözmek olurdu (YAGNI ihlali).

**Gelecekteki gerçek tetikleyici (spekülatif değil, somut kriter):** Eğer **uzak bileşenler arası anlık senkronizasyon** ihtiyacı doğarsa — ör. AI sohbet ekranı açıkken arka planda bir parsel güncellenirse ve sohbetin bunu **anlık** yansıtması gerekiyorsa — o zaman Zustand yeniden değerlendirilecek. Bugün bu senaryo yok.

### Redux — Neden Seçilmedi

Boilerplate/karmaşıklık oranı, bu ölçekteki bir CRUD-ağırlıklı mobil uygulama için orantısız (Kural 4, aşırı mühendislik). Kesin olarak reddedildi, gelecekte de yeniden değerlendirilmesi beklenmiyor (Redux'ın çözdüğü problemler — karmaşık, çok kaynaklı state senkronizasyonu — bu mimaride oluşmuyor).

### Signals (Preact Signals vb.) — Neden Seçilmedi

React 19, resmi bir signals API'si sunmuyor. Üçüncü parti bir signals kütüphanesi eklemek, bu aşamada deneysel/erken bir bağımlılık olurdu — React'in kendi ekosisteminin gelecekteki yönü belirsizken (araştırma gerektirir, bugün konu dışı).

---

## State Sınıflandırması — Kesin Tablo

| State Türü | Örnekler | Nerede Yaşar |
|---|---|---|
| **Local (component/hook)** | Parsel listesi, form alan değerleri, arama/sıralama seçimi, `view` (list/create/edit) | `useState`, hook içinde — **hepsi bugün burada** |
| **Global** | — | **Yok.** Bugün hiçbir global state kütüphanesi kullanılmıyor/gerekmiyor |
| **Cache** | — | **Yok.** SQLite okuması zaten hızlı (yerel, indeksli) — ayrı bir önbellek katmanı YAGNI |
| **Persistent** | İş verisi (Parsel/Ağaç/...) → SQLite; dil tercihi → Preferences; sırlar → Secure Storage | Modül 1'den beri net, değişmiyor |

---

## Alternatifler

| Alternatif | Neden Reddedildi |
|---|---|
| Zustand (bugün) | Çözülmemiş problem yok — bkz. yukarı |
| Redux | Aşırı mühendislik, orantısız karmaşıklık |
| Preact Signals / deneysel signals kütüphaneleri | Ekosistem olgunluğu yetersiz, erken bağımlılık riski |
| React Query / TanStack Query (cache-odaklı) | SQLite yerel ve hızlı olduğu için "sunucu state cache'leme" problemi bu mimaride yok — bu kütüphaneler ağ isteklerini önbelleğe almak için tasarlanmış, yerel DB'nin önüne gereksiz bir katman eklerdi |

## Neden Bu Karar Seçildi

Mimarinin zaten sahip olduğu en büyük avantaj (offline-first, tamamen yerel SQLite) global state yönetiminin çözdüğü problemlerin çoğunu **yapısal olarak ortadan kaldırıyor**. Bir kütüphane eklemek, var olmayan bir soruna çözüm getirmiş olurdu.

## Riskler

| Risk | Seviye | Not |
|---|---|---|
| Gerçek bir "uzak senkronizasyon" ihtiyacı doğarsa geç fark edilirse, geçiş maliyeti | Düşük | Hook arayüzleri zaten (Modül 2 Mimari Doğrulaması madde 2) bu geçişe hazır tasarlandı — dışa açık arayüz değişmeden iç implementasyon değiştirilebilir |
| AI sohbet ekranı ile diğer ekranlar arası anlık senkronizasyon ihtiyacı gerçekten doğarsa | Orta (gelecek, Modül 6-7'ye kadar belirsiz) | Somut tetikleyici zaten tanımlandı yukarıda |

## Gelecekte Değişebilecek Noktalar

- AI modülü (Modül 6-7) geldiğinde, "anlık senkronizasyon" ihtiyacı gerçekten test edilecek — bu belge o zaman Zustand kararını yeniden açabilir.
- Çoklu çiftlik (Farm) desteği gerçek olursa, "aktif çiftlik" için Context değerlendirmesi somutlaşacak.

## Sonuç

Bugünkü mimari (hook + SQLite tek kaynak) **uzun vadeli** bir stratejidir, geçici bir başlangıç çözümü değildir. Global state kütüphanesi eklenmesi için **bugün hiçbir teknik gerekçe yok** — YAGNI kesin olarak korunuyor.
