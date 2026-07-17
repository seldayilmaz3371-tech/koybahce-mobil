# APK/Beta Hazır Olma Kontrol Listesi

**Tarih:** 2026-07-17 · **Kapsam:** Modül 6 (AI Altyapısı) sonrası, APK üretimi öncesi
**Amaç:** APK üretiminden ÖNCE kontrol edilmesi gereken maddeler (gerçek cihaz testi SONRASI değil, ÖNCESİ) — `docs/sprint-6-apk-device-test-plan.md` ile karıştırılmamalı (o belge, APK ÜRETİLDİKTEN SONRA cihazda yapılacak testleri kapsıyor).

## Durum Özeti

| Kategori | Durum |
|---|---|
| Kod/Mimari/Test/Dokümantasyon | ✅ Tamamlandı |
| Navigasyon Entegrasyonu | ✅ Tamamlandı (Sprint 7.1) |
| UX/Erişilebilirlik Son Kontrolleri | ✅ Tamamlandı (Sprint 7.2) |
| Bundle Optimizasyonu | ✅ Tamamlandı, ölçüldü |
| **İmzalama Yapılandırması** | 🔴 **Eksik — aşağıya bkz.** |
| **Versiyon Numarası** | 🟡 Karar bekliyor |
| APK Üretimi | 🔴 Henüz yapılmadı |

## 1. Build Yapılandırması

- [x] `npm run build` hatasız tamamlanıyor
- [x] `npx cap sync android` 9 plugin ile hatasız tamamlanıyor
- [x] Bundle boyutu ölçüldü ve kabul edilebilir (395.68kB ana + 346.40kB AI, talep üzerine)
- [ ] `android/app/build.gradle`'da `signingConfigs` **YOK** — bu KRİTİK bir açık nokta. Bugün üretilecek APK **sadece debug imzalı** olabilir. Release/Beta dağıtımı için bir keystore oluşturulup imzalama yapılandırılmalı — **bu, kullanıcı kararı gerektiren, Sprint 7.2 kapsamı DIŞINDA bırakılan bir konu** (bkz. `sprint-6-apk-device-test-plan.md` Bölüm 1.4).

## 2. Versiyon Bilgisi

- [ ] `android/app/build.gradle`'daki `versionCode`/`versionName` (şu an `1`/`"1.0"`, Modül 1'den beri hiç değişmedi) — Modül 6 sonrası artırılmalı mı? **Kullanıcı kararı gerekiyor**, bugün otomatik artırılmadı (davranış değişikliği/varsayım riski).
- [ ] `package.json`'daki `version` alanı (`0.0.0`, hiç güncellenmemiş) — aynı şekilde kullanıcı kararı bekliyor.

## 3. Uygulama Kimliği ve Metaveri

- [x] `applicationId: com.bahcem.mobile` (sabit, Modül 1'den beri değişmedi)
- [ ] Uygulama ikonu / splash screen — **gerçek durumu bu oturumda incelenmedi**, APK üretimi öncesi ayrıca doğrulanmalı (varsayılan Capacitor ikonu mu, özel bir ikon mu?)
- [ ] Uygulama adı (kullanıcıya görünen) — `strings.xml` içinde doğrulanmalı

## 4. İzinler (Sprint 6 Test Planı'nda Zaten Kayıtlı)

- [x] Manifest'te `INTERNET` izni açıkça tanımlı
- [ ] Kamera/biyometrik izinlerinin gerçek merge sonucu **henüz derlenmiş APK üzerinde doğrulanmadı** (bkz. PERM-001/PERM-002, `sprint-6-apk-device-test-plan.md`)

## 5. Kod Kalitesi (Bu Oturumda Doğrulandı)

- [x] 479/479 test başarılı
- [x] `tsc -b` + proaktif test-dosyası tip kontrolü temiz
- [x] `oxlint` 0 uyarı/hata
- [x] i18n EN/TR simetrisi otomatik test altında (Sprint 7.2'de eklendi)
- [x] TODO/FIXME/HACK yorumu yok
- [x] Ölü kod taraması denendi (ts-prune, geçici) — araç başarısız oldu, manuel bulgu da yok

## 6. Güvenlik (Sprint 6'da Test Edildi, APK Üzerinde Doğrulanmadı)

- [x] API anahtarının Secure Storage'da saklandığı **kod seviyesinde** test edildi (mock ile)
- [ ] API anahtarının **gerçek cihazda düz metin olarak bulunamadığı** henüz doğrulanmadı (bkz. SEC-001, `sprint-6-apk-device-test-plan.md`)
- [x] `debugMode` kapalıyken tool sonuçlarının DB'ye ayrı kaydedilmediği kod seviyesinde test edildi

## 7. Bilinen Açık Noktalar (Bu Kontrol Listesinin Kendisi Tarafından Bulundu)

1. **İmzalama yapılandırması eksik** — Beta dağıtımı için karar gerekiyor (kullanıcı).
2. **Versiyon numaraları hiç güncellenmemiş** — kullanıcı kararı gerekiyor.
3. **Uygulama ikonu/splash screen doğrulanmadı** — bu oturumun kapsamı dışında kaldı.

## Sonuç

APK **kod/mimari/test/UX açısından üretime hazır**. Ancak **imzalama yapılandırması ve versiyon numarası kararları olmadan** anlamlı bir Beta APK'sı üretilemez — bunlar, sonraki adımda (APK üretim sprinti) **kullanıcı onayı gerektiren** açık kararlardır.
