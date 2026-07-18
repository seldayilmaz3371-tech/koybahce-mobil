# Bahçem Mobile — Beta Dağıtım Stratejisi

**Tarih:** 2026-07-18 · **Kapsam:** Sprint 7.5, Madde 7. İmzalı bir Beta APK/AAB üretildikten SONRA izlenecek dağıtım yolu.

## Değerlendirilen Seçenekler

### Seçenek A — Doğrudan APK Paylaşımı

**Nasıl çalışır:** İmzalı `app-release.apk` dosyası, sınırlı bir kullanıcı grubuna (ör. birkaç gerçek zeytin yetiştiricisi) doğrudan bir dosya paylaşım yöntemiyle (e-posta, WhatsApp, Google Drive linki) gönderilir. Kullanıcı, cihazında "bilinmeyen kaynaklardan yükleme" iznini AÇIKÇA vermek zorundadır.

| Artı | Eksi |
|---|---|
| Kurulum gerektirmez, hemen başlanabilir | Kullanıcı için teknik bir engel — "bilinmeyen kaynak" izni GÜVEN SORUNU yaratabilir (kullanıcılar bunu "zararlı" sanabilir) |
| Google Play hesabı/inceleme süreci gerektirmez | Güncelleme dağıtımı MANUEL — her yeni Beta sürümü tekrar elle gönderilmeli |
| Tam kontrol — Google'ın herhangi bir politika kısıtı YOK | Kullanım istatistiği/çökme raporu YOK (Play Console'un sunduğu araçlar yok) |

### Seçenek B — Google Play Console: Internal Testing

**Nasıl çalışır:** Google Play Console'a bir "Internal Testing" kanalı açılır, e-posta listesiyle en fazla 100 test kullanıcısı davet edilir. Kullanıcılar Play Store üzerinden (normal bir uygulama gibi) indirir.

| Artı | Eksi |
|---|---|
| Kullanıcı deneyimi GERÇEK Play Store deneyimidir — güven sorunu YOK | **Google Play Console hesabı gerektirir** (tek seferlik $25 kayıt ücreti + geliştirici hesabı doğrulaması) |
| Otomatik güncelleme dağıtımı | İlk kurulum için Google'ın "geliştirici hesabı doğrulama" süreci birkaç gün sürebilir |
| Çökme raporları, kullanım istatistikleri Play Console'da | Uygulamanın Play Console'a YÜKLENMESİ, bir dereceye kadar "Store Listing" bilgisi (açıklama, ekran görüntüsü) hazırlanmasını gerektirir — bu, tam anlamıyla "hafif" bir süreç DEĞİL |

### Seçenek C — Google Play Console: Closed Testing

**Nasıl çalışır:** Internal Testing'e benzer ama daha büyük bir kullanıcı grubuna (Google Grupları/e-posta listesi ile, yüzlerce kullanıcıya kadar) açılabilir, Google'ın "kapalı test" politika şartlarına tabidir.

| Artı | Eksi |
|---|---|
| Internal Testing'den DAHA BÜYÜK bir kullanıcı grubuna ulaşabilir | Google'ın yakın zamanda sıkılaştırdığı "en az 20 test kullanıcısı, 14 gün sürekli test" gibi politika şartlarına tabi olabilir (**bu bilgi GÜNCEL DEĞİŞEBİLİR** — Google Play politikaları sık değişir, gerçek başvuru anında Play Console'un kendi güncel şartları kontrol edilmeli, burada VARSAYILMIYOR) |

## 🟢 Önerilen Yol (Aşamalı)

1. **İlk Beta (Bahçem Mobile Beta 1):** **Seçenek A** (Doğrudan APK) — çok küçük bir kullanıcı grubu (2-5 gerçek çiftçi), hızlı geri bildirim döngüsü, Google Play hesabı sürecini BEKLEMEDEN başlanabilir.
2. **İkinci Beta dalgası (kullanıcı sayısı arttıkça):** **Seçenek B** (Internal Testing) — Google Play Console hesabı bu noktada açılmış olmalı, otomatik güncelleme kullanıcı deneyimini iyileştirir.
3. **1.0 Release öncesi:** **Seçenek C veya doğrudan Production** — proje planına bağlı.

**Gerekçe:** İlk Beta'nın amacı **hızlı, gerçek saha geri bildirimi almak** — Google Play sürecinin bürokrasisi (hesap doğrulama, store listing hazırlığı) bunu GECİKTİRİR. Seçenek A, Sprint 7.5'in kendi hedefiyle ("Release sürecini profesyonel seviyeye getirmek") ÇELİŞMİYOR — çünkü imzalı bir APK, doğrudan paylaşılsa bile PROFESYONEL bir dağıtımdır (imzasız bir "debug" APK'dan TAMAMEN farklı bir güven seviyesi taşır).

## Sürüm Numaralandırma ve Release Notes Politikası

- Her Beta sürümü, `versionCode` bir artırılarak, `versionName` `-beta.N` etiketi bir artırılarak yayınlanır (ADR 0025 Karar 1 — Sprint 7.4'te UYGULANDI).
- **Release Notes** (Beta kullanıcılarına gönderilecek kısa not) her sürümle birlikte hazırlanır — format önerisi:

```markdown
## Bahçem Mobile Beta 1 (0.1.0-beta.1) — 18 Temmuz 2026

### Yenilikler
- AI Asistan ile çiftlik verileriniz hakkında soru sorabilirsiniz
- ...

### Bilinen Sorunlar
- ...

### Nasıl Geri Bildirim Verebilirsiniz
- ...
```

## Git Tag Politikası (ADR 0025 Karar 7'nin Uygulaması)

Tag, **SADECE gerçekten dağıtılan** bir build için atılır — versiyon numarası kod tabanına yazılmış olması (Sprint 7.4) TEK BAŞINA tag atmak için YETERLİ DEĞİL. Doğru sıra:

1. İmzalı APK üretilir (kullanıcının kendi ortamında, `release-signing-guide.md` ile).
2. `sprint-6-apk-device-test-plan.md`'nin **zorunlu** test seti (bkz. `sprint-7.5-device-test-gap-analysis.md`, Öncelik 1-2 EN AZ) geçilir.
3. APK, Seçenek A/B/C'den birine göre dağıtılır.
4. **O ANDA** `git tag v0.1.0-beta.1` atılır, GitHub'a (varsa) push edilir.

## Sonuç

Bu sprintte **hiçbir gerçek dağıtım yapılmadı, hiçbir gerçek karar zorlanmadı** — üç seçenek objektif olarak karşılaştırıldı, bir yol ÖNERİLDİ ama kesin karar (özellikle Google Play hesabı açma zamanlaması) kullanıcının kendi tercihine bırakıldı.
