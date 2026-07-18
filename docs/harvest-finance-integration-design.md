# Finans-Hasat Entegrasyon Tasarımı

**Tarih:** 2026-07-18 · **Kapsam:** Sprint 8.3, Madde 4. **Bu belge SADECE mimari tasarımdır — hiçbir kod yazılmadı, hiçbir migration/repository oluşturulmadı.**

## Gerçek Zemin (Kod İncelemesinden Doğrulandı)

`src/modules/finance/domain/finance.types.ts`'in kendi başlığında **zaten kayıtlı** bir karar var:

> *"hasat (fiziksel miktar/verim: kg/adet/kalite/randıman) BİLEREK burada YOK, gelecekteki ayrı bir Hasat modülüne bırakıldı (Modül 4 Ön Analizi, kullanıcı onayı)."*

Bu, Modül 4'ün **zaten bilinçli olarak** Hasat'ı Finans'tan ayırdığının kanıtı — bu tasarım belgesi, o kararın **nasıl bir araya getirileceğini** (tamamen ayrı kalmaları gerekmiyor, "ayrı ama ilişkilendirilebilir" olabilirler) değerlendiriyor.

## Üç Mimari Seçenek

### Seçenek A — Tam Ayrım (Bugünkü Durum, Değişiklik Gerektirmez)

Hasat ve Finans **tamamen bağımsız** kalır. Kullanıcı bir hasadı sattığında, bunu **manuel olarak** Finans ekranından bir "Satış" (`sale`) kaydı olarak girer — bu, **bugün zaten mümkün**, hiçbir yeni kod gerekmiyor.

| Artı | Eksi |
|---|---|
| Sıfır ek karmaşıklık, sıfır risk | İki kayıt arasında hiçbir izlenebilirlik yok — "bu satış hangi hasada aitti?" sorusu cevaplanamaz |
| Mevcut mimari (Modül 4'ün kendi kararı) korunur | Kullanıcı aynı bilgiyi iki kez girmek zorunda kalabilir (hasat miktarı + satış tutarı ayrı ayrı) |

### Seçenek B — Gevşek Bağlantı (Referans FK, Otomatik Hesaplama YOK)

`finance_records` tablosuna **nullable** bir `harvest_record_id` sütunu eklenir (additive migration, ADR 0005 deseniyle — mevcut veriye dokunmaz). Kullanıcı bir Finans "Satış" kaydı oluştururken **isteğe bağlı olarak** bunu bir hasat kaydına bağlayabilir. **Hiçbir otomatik hesaplama yapılmaz** — bu sadece izlenebilirlik/referans amaçlıdır.

| Artı | Eksi |
|---|---|
| "Bu satış hangi hasada ait?" sorusu artık cevaplanabilir | Yeni bir migration + repository değişikliği gerektirir (bu sprintin kapsamı DIŞINDA) |
| Additive migration deseniyle düşük risk (ADR 0005) | Formda "hangi hasat kaydına bağlamak istersiniz?" gibi yeni bir seçim UI'ı gerekir — küçük ama gerçek bir UX karmaşıklığı |
| Hasat'ın Finans'tan BAĞIMSIZLIĞI korunur (FK nullable, zorunlu değil) | |

### Seçenek C — Hesaplanmış Özet (Sadece Görünüm Seviyesi, Veri Modeli Değişmez)

Hem Hasat hem Finans **veri modeli seviyesinde bağımsız kalır** — hiçbir migration/FK eklenmez. Bunun yerine, **Dashboard veya Raporlar** (henüz geliştirilmemiş modüller) ekranında, "Tahmini Hasat Geliri" gibi bir **görünüm-seviyesi** hesaplama sunulabilir (ör. son satış fiyatı ortalaması × toplam hasat kg) — bu tamamen **sorgu/UI seviyesinde**, veritabanı şemasını hiç etkilemez.

| Artı | Eksi |
|---|---|
| Veri modeli hiç değişmez, sıfır migration riski | "Tahmini" bir hesaplama — gerçek bir kayıt ilişkisi değil, yanıltıcı olabilir |
| Dashboard/Raporlar modülleriyle DOĞAL olarak birlikte gelişir | Hangi satışın hangi hasada karşılık geldiği hâlâ belirsiz kalır (Seçenek B'nin çözdüğü sorunu çözmez) |

## Öneri

**Kısa vadede (Beta/1.0'a kadar) Seçenek A ile devam edilmesi önerilir** — Modül 4'ün kendi kararıyla tutarlı, sıfır ek risk. **Seçenek B, Dashboard modülü (roadmap Sprint 8.4) geliştirilirken** gerçek bir kullanıcı ihtiyacı olarak yeniden değerlendirilebilir — eğer gerçek kullanıcılar (Beta test grubu) "hangi satış hangi hasattan geldi" sorusunu GERÇEKTEN sorarlarsa, Seçenek B o zaman somut bir gerekçeyle uygulanabilir (YAGNI — spekülatif olarak şimdi eklenmemeli).

**Seçenek C, Raporlar modülü (roadmap Sprint 13.1-13.2) geliştirilirken** doğal bir uzantı olarak değerlendirilebilir.

## Bu Sprintte Yapılmayanlar (Kullanıcının Açık Yasağı Gereği)

❌ Gelir hesaplama algoritması yazılmadı. ❌ Yeni tablo oluşturulmadı. ❌ Yeni migration yazılmadı. ❌ Yeni repository üretilmedi. ❌ Yeni ADR yazılmadı (henüz kesin bir karar yok — sadece seçenekler sunuldu, kullanıcı hangi seçeneği seçerse SONRAKİ bir sprintte gerçek bir ADR yazılabilir).
