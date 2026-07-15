# Modül 3 Backlog — Gelecekte Değerlendirilecek Notlar

**Durum:** Kayıtlı, bugün uygulanmıyor. Observation Domain Review onayı sırasında eklendi (2026-07-15).

Bu belgedeki hiçbir madde mevcut sprint kapsamında kodlanmıyor. Amaç: ileride bu değerlendirmeleri yaparken tasarımı engellememek (kolayca eklenebilir bırakmak), bugünden inşa etmemek (YAGNI).

---

## 1) Observation Status (Open / Monitoring / Resolved)

Bir `health_concern` gözleminin zamanla "çözüldü" olarak işaretlenebilmesi. Domain Review'da da tartışılmıştı (Soru 8), kullanıcı onayıyla resmen backlog'a taşındı. **Şema etkisi:** yeni bir `status` enum-kod sütunu (nullable veya `general` gözlemler için anlamsız olacağından, sadece belirli tiplerde kullanılan opsiyonel bir alan) — ADR 0005'in additive migration deseniyle sancısız eklenebilir.

## 2) Observation Source (User / AI / Advisor)

Bir gözlemin kim tarafından girildiğinin izlenmesi — kullanıcı mı, AI mı (Modül 6-7), yoksa bir danışman mı. **Şema etkisi:** `source` enum-kod sütunu. **Not:** AI Master Architecture Bölüm 1 ilkesiyle (AI kendiliğinden veri yazamaz, kullanıcı onayı gerekir) uyumlu olmalı — "AI" kaynaklı bir gözlem bile, kullanıcı onayından geçmiş olmalı.

## 3) Timeline Görünümü

Observation ekranının, gelecekte kronolojik bir "Timeline" (zaman çizelgesi) görsel sunumunu destekleyecek şekilde tasarlanması. **Bugünkü etkisi:** Sprint 3.4'te (ObservationScreen) liste bileşeni, gelecekte bir Timeline bileşenine kolayca dönüştürülebilecek şekilde (veri ↔ görünüm ayrımı net tutularak) yazılmalı — ekstra bir soyutlama katmanı bugün eklenmeyecek, sadece mevcut `ObservationList`/`TreeList` deseni (liste render sorumluluğunun ayrı tutulması) buna zaten uygun.

## 4) Observation Type — Uzun Ömürlü İsimlendirme Değerlendirmesi

`weather_impact` yerine daha geniş bir `environment` kategorisi düşünülmeli (ör. sadece hava değil, toprak/çevresel koşulları da kapsayacak şekilde). **Bugün uygulanmıyor** — Sprint 3.1'in migration'ında `weather_impact` ismiyle ilerliyorum (kullanıcının bu maddeyi de açıkça "bugün uygulanmayacak" listesine koyduğu için). **Önemli not:** Enum-kod değerlerinin isim değişikliği, SQLite'ta "rename-and-recreate" deseni gerektirir (Database Migration Strategy Bölüm 12) — bu, `crop_type` gibi zaten üretimde veri biriktirmiş bir sütun için maliyetli olur. **Öneri (karar değil):** Bu isimlendirme netleşmeden çok fazla gerçek veri birikmeden (ör. Modül 3'ün ilk birkaç haftası içinde) karar verilirse, migration maliyeti düşük kalır.

## 5) Fotoğraf-Merkezli Saha Akışı

UI akışı, "önce fotoğraf çek, sonra isteğe bağlı not ekle" sırasını öncelemeli — saha kullanımında (Kural 15: güneş altında, tek elle, eldivenle) metin girmek fotoğraf çekmekten daha zahmetli. **Sprint 3.7 (Fotoğraf) ve 3.3 (Form) tasarımına girdi:** Gözlem formu, kamera/galeri eylemini metin alanından ÖNCE, daha belirgin şekilde sunmalı. Bugün hiçbir UI kodu yazılmıyor — bu, ilgili sprintler başladığında referans alınacak bir tasarım önceliği.
