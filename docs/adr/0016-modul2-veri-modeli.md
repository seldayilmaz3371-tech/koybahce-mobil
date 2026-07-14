# ADR 0016 — Modül 2 Veri Modeli: Parseller ve Ağaçlar

**Durum:** Kabul edildi — mimari tasarım tamamlandı, kod geliştirme Modül 1 onayını bekliyor
**Tarih:** 2026-07-14

## Bağlam

Web projesindeki `Parcel`/`Tree` domain modeli referans alınarak, Android/SQLite'a uygun şekilde yeniden tasarlandı. Üç alternatif karşılaştırıldı: Normalize İlişkisel Şema, Denormalize (JSON Blob), EAV (Entity-Attribute-Value).

## Karar

**Normalize İlişkisel Şema** seçildi — `parcels` ve `trees` ayrı tablolar, `trees.parcel_id` yabancı anahtarla bağlı.

| Kriter | Normalize | JSON Blob | EAV |
|---|---|---|---|
| Performans (SQL filtreleme) | ✅ Doğrudan WHERE/JOIN | ❌ Bellekte filtreleme gerekir | ⚠️ Çoklu join |
| Veri bütünlüğü (FK) | ✅ | ❌ | ❌ |
| Offline-first uyumu | ✅ SQLite'ın gücüyle örtüşüyor | ⚠️ | ⚠️ Karmaşık |
| Gelecekte büyüme | ✅ Migration sistemi (ADR 0005) zaten çözüyor | ✅ ama sorgulanamaz | ✅ ama pahalı |

**Gerekçe:** "Referans ağaç" kavramı, ağaç bazlı filtreleme ve çapraz-parsel sorgular gerektiriyor — ilişkisel modelin güçlü olduğu senaryo.

## Ek Karar — `treeCount` Ayrı Sayaç Olarak Tutulmayacak

Web projesi, parsel üzerinde ayrı bir sayaç (`treeCount`) + bunu senkron tutan bir `TreeCountChangeLog` mekanizması kullanıyordu. Biz bunu **anlık SQL sorgusuyla** (`COUNT(*) WHERE parcel_id = ? AND is_active = 1`) hesaplıyoruz — sayaç/gerçek veri senkronizasyon riskini en baştan ortadan kaldırıyor.

## Şema

(bkz. sohbet kaydı — Bölüm 5, Şema Sürüm 2 — `parcels`, `trees` tabloları, indeksler)

## Sonuçlar

Kod geliştirme, Modül 1'in gerçek cihaz testi onayından sonra başlayacak.
