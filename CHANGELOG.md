# Changelog

**Not:** Bu dosya, kullanıcının Sprint 10.4 Düzeltme Paketi'nde talep etmesi üzerine ilk kez oluşturuldu — proje genelinde daha önce bir CHANGELOG bulunmuyordu. Geriye dönük olarak tüm sprintler burada yeniden inşa edilmedi (bu, kapsam dışı bir iş olurdu); bu tarihten itibaren güncellenecektir.

## [Yayınlanmamış] — 2026-07-21 — Sprint 10.4 Düzeltme Paketi

### Düzeltildi
- **Kritik:** Toplu İşlemler menüsünden bir bakım türüne (Sulama/Gübreleme/İlaçlama/Budama/Biçme) tıklandığında, form artık **doğru türle** açılıyor. Önceden, hangi türe tıklanırsa tıklansın form her zaman "Sulama" ile açılıyordu (`BulkOperationsScreen` → `BulkMaintenanceForm` arasında eksik bir prop aktarımı nedeniyle).
- Sulama Başlangıç/Bitiş Saati bilgisi artık Bakım Listesi ekranında (kayıt kartlarında) görünüyor — önceden kaydediliyordu ama hiçbir yerde gösterilmiyordu.
- Sulama Başlangıç/Bitiş Saati artık tekli Bakım Kaydı Detay/Düzenleme ekranında görüntülenebiliyor ve düzenlenebiliyor — önceden bu ekran bu alanları hiç desteklemiyordu.

### Bilinen Sınırlar (Bu Sürümde Ele Alınmadı)
- "Biçme" olarak oluşturulan kayıtlar, Liste ve Detay ekranlarında "Other" (Diğer) olarak görünüyor — bu, ayrı bir sprintte değerlendirilecek.

## [0.1.0-beta.1] — Sprint 10.1-10.4 — Saha Operasyonları (Toplu İşlemler)

### Eklendi
- Toplu Gözlem ve Toplu Bakım Kaydı oluşturma (ağaç seçimi, arama, Geri Al desteğiyle).
- Sulama Başlangıç/Bitiş Saati ve otomatik süre hesaplama.
- Toplu Gözlem/Bakım kayıtlarında geriye dönük tarih/saat girişi.
- Son Kullanılan İşlem hızlı erişimi, Ardışık İşlem Sihirbazı.

## [0.1.0-beta.1] — Sprint 9.1-9.2, 10.5 — Fotoğraf Analizi (AI)

### Eklendi
- Gemini Vision ile tek fotoğraf analizi (teşhis/tedavi önerisi olmadan, sadece gözlemsel).
- Fotoğraf Galerisi'nden Fotoğraf Analizi'ne gerçek navigasyon.

## [0.1.0-beta.1] — Sprint 8.1-8.5 — Hasat ve Dashboard

### Eklendi
- Hasat kayıtları (parsel/ağaç bazlı, kg cinsinden).
- Dashboard özet ekranı (Parseller ekranından buton girişi).

---

*Bu changelog, Sprint 10.4 Düzeltme Paketi'nden itibaren tutulmaktadır. Daha eski sprintlerin tam listesi için `docs/module-status.md` ve `docs/sprint-*.md` teknik raporlarına bakınız.*
