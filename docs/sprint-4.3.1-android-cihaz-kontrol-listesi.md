# Sprint 4.3.1 — Gerçek Android Cihaz Test Kontrol Listesi

Kod seviyesinde doğrulanamayan, sadece gerçek cihazda kanıtlanabilecek senaryolar.

## Uygulama Açılışı
- [ ] Cold start: Uygulama ilk kez açıldığında LockScreen görünüyor
- [ ] Biyometrik/PIN doğrulama sonrası Parseller ekranı açılıyor

## Router
- [ ] Parsel → Ağaç → Gözlem → Fotoğraf ileri gidiş akıcı
- [ ] Parsel → Finans navigasyonu çalışıyor, doğru parseldeki kayıtlar görünüyor
- [ ] Referans Ağaçlar ekranına ulaşım çalışıyor

## Geri Tuşu
- [ ] Her ekrandan bir önceki ekrana doğru dönüyor (Fotoğraf→Gözlem→Ağaç→Parsel→[çıkış])
- [ ] Finans ekranından geri tuşu Parsele dönüyor
- [ ] Form açıkken geri tuşu, kaydetmeden listeye dönüyor

## Finans Ekranı (YENİ — para birimi düzeltmesi özellikle test edilmeli)
- [ ] Bir maliyet/satış kaydı oluşturma — TL cinsinden girilen tutar doğru gösteriliyor mu (ör. "19,99" girilip "19,99 ₺" olarak görünüyor mu)
- [ ] Küsuratlı tutarlar (ör. 19.99, 250.75) doğru kaydediliyor ve DOĞRU gösteriliyor mu — yuvarlama hatası YOK mu
- [ ] Bir kaydı düzenleme, tutarın doğru önceden dolduğunu göster
- [ ] **ÖNEMLİ:** Eğer daha önceki bir sürümden (Sürüm 6, `amount REAL`) gerçek veriyle yükseltme yapılıyorsa, migration sonrası TÜM eski kayıtların tutarları doğru görünüyor mu

## Fotoğraf
- [ ] Kamera ile çekilen fotoğraf önizlemede doğru görünüyor
- [ ] Kaydedilen fotoğraf galeri listesinde GÖRÜNÜYOR (Sprint 3.10.1 P1 düzeltmesi hâlâ çalışıyor mu)
- [ ] Birden fazla fotoğraflı bir gözlemde gecikmeli yükleme (`loading="lazy"`) fark edilir bir davranış bozukluğuna yol açmıyor

## 🔴 Arka Plana Alma — Yeniden Kilitleme (YENİ, en kritik test)
- [ ] Uygulamayı aç, kilit ekranını geç, herhangi bir ekranda gez
- [ ] Ana ekran tuşuna bas (uygulamayı arka plana al) — birkaç saniye bekle
- [ ] Uygulamaya geri dön: **LockScreen tekrar görünmeli**, kaldığın ekran DEĞİL
- [ ] Tekrar doğrula (biyometrik/PIN) — kaldığın ekrana (route) dönmelisin
- [ ] **Bildirim çubuğunu aşağı çekip bırakma** gibi kısa/yanlışlıkla arka plana alma senaryolarında da yeniden kilitleniyor mu (beklenen davranış, "rahatsız edici" olabilir ama güvenlik önceliği)
- [ ] Uygulamayı tamamen kapat (Son Uygulamalar'dan kaydır) → tekrar aç → LockScreen ile açılmalı (cold start davranışı)

## Veri Kalıcılığı
- [ ] Uygulamayı kapat/aç sonrası tüm Parsel/Ağaç/Gözlem/Fotoğraf/Finans verisi korunuyor
- [ ] Migration (Sürüm 7) sonrası hiçbir veri kaybolmadı

## Genel
- [ ] Hiçbir ekranda ham/teknik hata mesajı (ör. "SQLITE_CONSTRAINT") görünmüyor — sadece çevrilmiş, anlaşılır mesajlar
