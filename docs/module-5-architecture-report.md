# Module 5 Architecture Report — Mevcut Mimarinin Büyümeye Hazırlık Denetimi

**Belge No:** 2/8 · **Tarih:** 2026-07-16
**Kapsam:** Modül 5'in henüz kesinleşmemiş kapsamı nedeniyle, bu belge **spesifik bir Modül 5 mimarisi değil**, mevcut mimarinin (Modül 1-4 sonrası, 6.269 satır üretim kodu, 5 repository, 5 hook, 9 native sarmalayıcı) Deliverable 1'de tespit edilen aday özellikleri (Ekipman/Envanter/Hava Durumu/AI/Doküman) desteklemeye **yapısal olarak hazır olup olmadığını** değerlendirir.
**Çapraz Referans:** `docs/module-5-analysis-report.md` (Deliverable 1), `docs/ai-architecture.md` (gerçekten okundu — bkz. Madde 9), `docs/engineering-protocol.md`, ADR 0001-0023.

---

## 1. Mimari (Genel Katman Ayrımı)

**Durum: ✅ Hazır, kanıtlanmış.** Repository→Hook→Screen zinciri, 4 modül boyunca (Parcel/Tree/Observation/Photo/Finance) **tutarlı şekilde tekrarlandı**, hiçbir istisna yaratmadı (tek belgelenmiş sapma: `AppRouter`'ın `treeRepository`'ye doğrudan erişimi — `engineering-protocol.md` Bölüm 21'de gerekçeli). Yeni bir domain (ör. Equipment) eklemek, **mevcut 5 domain'in aynısı** desenle mümkün — yeni bir mimari karar gerekmez.

**Risk:** Deliverable 1'de bulunan `Equipment`/`InventoryItem` gibi domainler, web projesinde birbirleriyle ilişkili (`Equipment.parcelId`, envanterin ekipmanla ilişkisi olabilir — `Unknown`, doğrulanmadı). Bizim mimarimiz N:1 ilişkileri (Tree→Parcel, Photo→Observation) iyi destekliyor; M:N ilişkiler (ör. bir ekipmanın birden fazla parselde kullanılması) hiç test edilmedi.

## 2. Performans

**Durum: 🟡 Kısmi hazır.** Sayfalama deseni (Parsel'in `hasMore`/`loadMore`'u) kanıtlanmış ve yeniden kullanılabilir. **Ama** Sprint 4.3.1 denetiminde bulunan **liste virtualization eksikliği** (backlog #19) henüz çözülmedi — Equipment/Inventory gibi potansiyel olarak büyük listeler eklenirse bu daha acil hale gelebilir.

## 3. Güvenlik

**Durum: ✅ Güçlü temel, 🔴 gerçek bir boşluk var.** Şifreli SQLite (ADR 0004), biyometrik kilit + arka plan yeniden kilitleme (Sprint 4.3.1/4.3.2). **Ama** web projesinin kendi itiraf ettiği "rol bazlı yetkilendirme tanımlı ama uygulanmamış" sorunu bize de **doğrudan uyarı niteliğinde** — bizim mimarimizde şu an **hiç kullanıcı rolü kavramı yok** (tek kullanıcılı, cihaz-bazlı model). Eğer Modül 5+ çok kullanıcılı bir senaryo (ör. birden fazla çalışan) gerektirirse, bu **sıfırdan tasarlanacak yeni bir mimari karar** — bugünkü temel buna hazır değil.

## 4. Maintainability (Bakım Kolaylığı)

**Durum: ✅ Hazır.** i18n denetimi (0 yetim anahtar), Error Code Standard (tüm ekranlarda tutarlı), tutarlı test deseni (repository/hook/screen için standart şablonlar) — yeni bir geliştirici (veya yeni bir Claude oturumu) mevcut 5 modülün herhangi birini örnek alarak hızla üretken olabilir.

## 5. Offline-First

**Durum: ✅ Bizim güçlü yanımız.** Tüm mevcut modüller %100 offline çalışıyor (statik kod taramasıyla kanıtlandı — `module3-architecture-compliance.test.ts`). Deliverable 1'de web projesinin TÜM AI özelliklerinin internet gerektirdiğini bulmuştum ve bunu bir "temel çelişki" olarak işaretlemiştim — **ama `docs/ai-architecture.md`'yi (Madde 9'da düzeltildi) okuyunca bunun zaten büyük ölçüde çözülmüş bir soru olduğu ortaya çıktı**: AI mimarisi Bölüm 8'de offline/online davranışı özellik-özellik netleştirmiş, offline-first ilkesini ihlal etmiyor, sadece bulut-bağımlı özellikler (sohbet, fotoğraf analizi) için açık, belgelenmiş bir istisna tanımlıyor.

## 6. Sync Yapısı

**Durum: ⚪ Yok, hiç gerekmedi.** Mobil uygulamamızda "sync" kavramı hiç yok (tek cihaz, tek kullanıcı, sunucu yok). Web projesinin IndexedDB kuyruğu (dar kapsamlı) bize **doğrudan uygulanabilir değil** — bizim zaten SQLite tek gerçek kaynak. **Eğer** Modül 5+ bulut yedekleme/çoklu-cihaz senkronizasyonu gerektirirse (ADR 0008'de "yedekleme stratejisi" zaten kabul edilmiş ama UYGULANMAMIŞ durumda), bu **tamamen yeni bir mimari çalışma** olur.

## 7. Ölçeklenebilirlik

**Durum: 🟡 Veri hacmi için hazır, ekran sayısı için sınırda.** SQLite + indeksleme, Observation'ın yıllar boyunca birikmesini destekleyecek şekilde tasarlandı (kanıtlandı: 1000 kayıtlık performans testi). **Ama** Sprint 4.3.1 denetiminde bulunan `EntityList<T>` soyutlamasının eksikliği (backlog #21) — 5. ve 6. bir liste-tabanlı modül (Equipment, Inventory) eklendiğinde bu kod tekrarı gerçek bir bakım yüküne dönüşebilir.

## 8. Android Native Uyumu

**Durum: ✅ Güçlü, kanıtlanmış.** 9 native sarmalayıcı (`src/native/`), her biri gerçek API doğrulamasıyla kuruldu (ADR 0002, 0022, 0023, Sprint 3.10.1/4.3.2'nin kök neden analizleri). Yeni bir native yetenek (ör. GPS — zaten backlog'da) aynı "ince sarmalayıcı" deseniyle eklenebilir.

## 9. AI Entegrasyonu

**🔴 ÖNEMLİ ÖZELEŞTİRİ:** Bu belgenin ilk taslağında "AI entegrasyonu bugün SIFIR, hiç değerlendirilmedi" yazmıştım — bu **yanlıştı**. `docs/ai-architecture.md`'yi (256 satır, 2026-07-14'te onaylanmış) şimdi gerçekten okudum: **kapsamlı bir AI Master Architecture zaten var**, sadece henüz **kod olarak uygulanmamış** (`Modül 6-7` olarak işaretli).

**Gerçek durum:** Bu belge, Madde 5'te (Offline-First) benim öne sürdüğüm "temel çelişki" iddiasını **büyük ölçüde çözüyor**:
- AI, **salt-okunur varsayılan**, yazma her zaman açık onay gerektiriyor (Bölüm 7)
- Offline davranış **açıkça tablolanmış** (Bölüm 8) — bulut-bağımlı özellikler (sohbet, fotoğraf analizi) çalışmıyor, ama yerel veri özetleri/geçmiş konuşmalar offline tam çalışıyor
- Sağlayıcı-agnostik adapter deseni zaten tasarlanmış (Gemini varsayılan, OpenAI/Claude/yerel LLM için genişletilebilir)
- Kendi belgesi **6 gerçek teknik borç maddesini** zaten kayıt altına almış (Context Engine'in kırılganlığı, sesli asistanın Türkçe doğruluğunun doğrulanmamış olması, "onay yorgunluğu" riski, zayıf-ama-var internet senaryosunun tasarlanmamış olması, RAG'ın gerçek karmaşıklığının öngörülemez olması)

**Düzeltilmiş durum:** 🟡 Mimari **hazır ve düşünülmüş**, ama **hiç kod yok**. Phase 3'ün AI Systems Architect'i, bu belgeyi **sıfırdan yeniden düşünmek yerine**, onun üzerine inşa etmeli/eleştirmeli.

## 10. Test Edilebilirlik

**Durum: ✅ Çok güçlü.** 222 test, gerçek repository/hook/screen/E2E/statik-uyumluluk katmanları, `testDatabaseExecutor`'ın native davranışı gerçekçi simüle ettiği kanıtlandı (Sprint 3.10.1). Yeni bir modül, **aynı test altyapısını** (sıfırdan kurulum gerekmeden) doğrudan kullanabilir.

---

## Genel Sonuç

| Boyut | Hazırlık |
|---|---|
| Mimari, Maintainability, Android, Test Edilebilirlik | ✅ Güçlü |
| Performans, Ölçeklenebilirlik | 🟡 Kısmi — bilinen, ertelenmiş borçlar var |
| Offline-First | ✅ Güçlü, AI mimarisiyle de tutarlı (düzeltildi — bkz. Madde 5/9) |
| Güvenlik | 🟡 Tek-kullanıcı modeli güçlü, çok-kullanıcı/rol modeli YOK |
| AI Entegrasyonu | 🟡 **Mimari hazır ve onaylı (`ai-architecture.md`), kod yok** (düzeltildi — bkz. Madde 9) |
| Sync Yapısı | 🔴 Bugün yok — Modül 5'in gerçek kapsamına göre sıfırdan tasarlanacak |

**En kritik, Phase 3'e taşınması gereken açık sorular (düzeltilmiş):** (1) AI mimarisinin kendi kayıtlı 6 teknik borcu (özellikle Context Engine'in kırılganlığı ve zayıf-internet senaryosu) gerçek uygulamaya geçmeden önce çözülmeli mi yoksa "ilk sürümde bilinçli sınır" olarak mı bırakılmalı? (2) Çok-kullanıcı/rol modeli — web projesinin kendi itiraf ettiği eksiklik bize de mi uygulanacak, yoksa tek-kullanıcı modeli kalıcı bir mimari karar mı? Bu, **AI Systems Architect + Security Engineer + Agricultural Domain Expert**'in birlikte değerlendirmesini gerektiriyor.

**Sıradaki belge (3/8): Bağımsız Hakem Kurulu Raporları** — 10 uzman perspektifinden, bu belgede işaretlenen (düzeltilmiş) açık sorulara odaklanarak.
