# Sprint 4.0.1 → 4.0.2 — Android Gerçek Cihaz Kontrol Listesi

Bu liste, Sprint 4.0.2'nin (Kalite Sprinti) odak noktasıdır. Vitest'in **kanıtlayamayacağı** şeyler burada.

## Temel Navigasyon
- [ ] Uygulama açılışta doğrudan Parseller ekranına geliyor
- [ ] Parsel → Ağaç → Gözlem → Fotoğraf ileri gidiş akıcı, gecikme yok
- [ ] Referans Ağaçlar ekranına ulaşım çalışıyor

## Android Fiziksel Geri Tuşu (Öncelik — Sprint 3.10.1'de zaten bir P0 hatası buradan çıkmıştı)
- [ ] Her ekrandan bir önceki ekrana doğru dönüyor (Fotoğraf→Gözlem→Ağaç→Parsel)
- [ ] Form açıkken geri tuşu, kaydetmeden listeye dönüyor (regresyon değil)
- [ ] Ana ekrandayken (Parseller listesi) geri tuşu uygulamadan çıkıyor
- [ ] **Özellikle test edilmeli:** Gözlem ekranına giderken (kısa yükleme anı sırasında) geri tuşuna basılırsa ne oluyor — `useBackButtonFallback`'in gerçek cihazdaki davranışı

## Derin Navigasyon (Deep Navigation) Testi
- [ ] Uygulama arka plana alınıp geri getirildiğinde mevcut ekran korunuyor mu (HashRouter'ın durumu)
- [ ] Hızlı ardışık ileri/geri geçişlerde ekran karışması/çakışma yok

## Performans
- [ ] Ekranlar arası geçiş gözle görülür bir gecikme olmadan oluyor
- [ ] `ObservationScreenRoute`'un Tree çekme anındaki kısa yükleme göstergesi rahatsız edici uzunlukta değil

## Genel
- [ ] Tüm Modül 3 özellikleri (Bulk Tree Creation dahil) sorunsuz
- [ ] `PhotoGalleryScreen`'deki fotoğraf gösterimi hâlâ doğru (Sprint 3.10.1 düzeltmesi bozulmadı)
