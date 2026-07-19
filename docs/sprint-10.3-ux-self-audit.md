# Sahada Çalışan Bir Çiftçiyi Hangi Noktalar Yavaşlatacak? — Bağımsız UX Denetimi

**Tarih:** 2026-07-18 · **Rol:** Bu ekranı geliştiren mühendis DEĞİL, bağımsız bir UX denetçisi olarak.

Bu belge, Sprint 10.1-10.3'te geliştirdiğim Toplu İşlemler ekranını **kendi tasarımımı eleştirerek** değerlendiriyor. Amaç savunma değil, dürüst bir gözden geçirme.

---

## 🔴 Gerçek Yavaşlatıcı Noktalar (Öncelik Sırasına Göre)

### 1. Onay Diyalogu (`window.confirm`) — Kontrolüm Dışında, Ama Gerçek Bir Risk
Android WebView'da `window.confirm()`, sistemin **kendi küçük diyalog kutusunu** açar — "Tamam"/"İptal" butonlarının boyutu benim CSS'imin **kontrolünde değil**. Eldivenle bu küçük butonlara dokunmak zor olabilir. **Bu, hem Uygula hem Undo için iki kez** karşılaşılan bir engel — toplamda kullanıcı bir işlemi tamamlamak için native diyalogla **en az bir, Undo yaparsa iki kez** etkileşime giriyor.

### 2. Üç Dokunuşluk Akış — Gereksiz Bir Adım Olabilir
"Tüm Ağaçlara Uygula" seçmek **tek başına yeterli olabilecekken**, ben bunu ayrı bir "mod seçimi" + ayrı bir "Uygula" butonu olarak **iki adıma böldüm**. En hızlı senaryo (tüm ağaçlara, en sık kullanım) için bile kullanıcı: (1) mod seç, (2) Uygula'ya bas, (3) native onayı geç — **3 dokunuş**. Daha hızlı bir tasarım, "Tüm Ağaçlara Uygula"yı **doğrudan büyük, tek dokunuşluk bir buton** yapıp mod seçimini atlayabilirdi.

### 3. Notlar Alanı Her Zaman Görünür — Ekranı Uzatıyor
`TextAreaField` (notlar), **isteğe bağlı olmasına rağmen her zaman ekranda** — kullanıcının "Uygula" butonuna ulaşmak için daha fazla kaydırması gerekiyor. Saha kullanımında not yazmak nadir bir ihtiyaçtır; bu alan **katlanabilir/gizlenebilir** olsaydı, ekran daha kısa ve hızlı olurdu.

### 4. Undo Butonu Görsel Olarak Yeterince Ayrışmıyor
Sonuç ekranında "Undo" ve "Aynı Ağaçlara Başka İşlem Uygula" **aynı stil, aynı boyutta** butonlar — Undo **yıkıcı bir işlem** (kayıtları siler) olmasına rağmen görsel olarak farklı bir vurgu (ör. kırmızı çerçeve, `lock-screen__button--danger`) **almadı**. Hızlı, eldivenli kullanımda kullanıcı yanlış butona basabilir.

### 5. "Son Kullanılan İşlem" Butonu Kaçırılabilir
Bu buton menünün en üstünde ama **diğer 6 seçenekle aynı görsel ağırlıkta** (sadece ince bir çerçeve farkı). Güneş altında, hızlı bakışta bu ince fark fark edilmeyebilir — kullanıcı yine de aşağı kaydırıp tüm listeyi tarayabilir, bu da butonun **asıl amacını (hız kazandırma) kısmen boşa çıkarır**.

### 6. 500 Satırlık Liste — Sanallaştırma Yok (Sprint 10.2'den Beri Bilinen Risk)
Bu, daha önce de belirttiğim ama **hâlâ çözülmemiş** bir risk — büyük bir parselde "Ağaç Seçerek Uygula" moduna geçildiğinde, tüm liste DOM'a render ediliyor. Gerçek cihazda kaydırma gecikmesi yaşanabilir.

### 7. Ardışık İşlem Sırasında Geri Tuşu — Sessiz Kayıp Riski
Ardışık İşlem Sihirbazı akışındayken (ağaç seçimi "taşınmışken") kullanıcı **yanlışlıkla donanım geri tuşuna basarsa**, hiçbir uyarı olmadan Parsel Formuna döner ve taşınan seçim **sessizce kaybolur**. Bu, kullanıcının az önce yaptığı işi tekrar yapmasına neden olabilir.

### 8. Devre Dışı (disabled) Buton Kontrastı Yetersiz Olabilir
`isSubmitting` sırasında butonlar `disabled` oluyor ama bunun **görsel farkı** (opacity/renk) test edilmedi — güneş altında kullanıcı butonun devre dışı olduğunu fark etmeyip tekrar tekrar dokunmaya çalışabilir (zararsız ama akışı yavaşlatan bir algı sorunu).

---

## Neyi Doğru Yaptığımı Düşünüyorum (Dengelemek İçin)

- Arama kutusu ve büyük dokunma hedefleri (56px satır) gerçek bir hız kazancı.
- "Tüm Ağaçlara Uygula"nın varsayılan mod olması, en yaygın senaryoyu hızlandırıyor.
- Ardışık İşlem Sihirbazı, aynı ağaçlara birden fazla işlem uygulamayı gerçekten hızlandırıyor (kayıp riski hariç).

## Sonuç — Önceliklendirilmiş İyileştirme Listesi

1. **En kritik:** Undo butonuna görsel uyarı vurgusu (kırmızı/dikkat çekici stil) — yanlışlıkla veri kaybını önlemek için.
2. Notlar alanını katlanabilir yapmak (varsayılan gizli, "Not ekle" bağlantısıyla açılan).
3. "Tüm Ağaçlara Uygula"yı tek dokunuşluk bir kısayola dönüştürmeyi değerlendirmek (mod seçimi + Uygula yerine).
4. Ardışık İşlem Sihirbazı sırasında geri tuşuna basılırsa bir uyarı göstermek.
5. Liste sanallaştırması (gerçek cihaz testi sonrası, gerekirse).

**Bu iyileştirmelerin hiçbiri bu sprintte uygulanmadı** — bu belge, kullanıcının kendi talebiyle, dürüst bir öz-değerlendirme olarak sunuluyor.
