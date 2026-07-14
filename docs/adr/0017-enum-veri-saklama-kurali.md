# ADR 0017 — Sabit Küme (Enum) Verilerinin Saklama Kuralı

**Durum:** Kabul edildi — Engineering Protocol'e Bölüm 18.4 olarak eklendi
**Tarih:** 2026-07-14
**Kapsam:** Bu modüle özel değil, bundan sonraki TÜM modüller için bağlayıcı cross-cutting kural.

## Bağlam

Web projesi denetiminde, sabit seçenek kümesi (health status, tree count change reason gibi) içeren alanların, veritabanında **doğrudan görüntülenecek Türkçe metni** sakladığı tespit edildi:

```typescript
overallStatus: "Sağlıklı" | "Riskli Bölgeler Var" | "Belirsiz" | "Veri Yok"
```

Bu, Globalization Policy'nin (Protocol Bölüm 18) ruhuna aykırıdır: veri, dile bağımlı hale geliyor. Dil değişirse ya veri anlamsızlaşır ya da geriye dönük migration gerekir.

## Karar

**Sabit, önceden bilinen seçenek kümesi içeren (dropdown/seçim listesi) her alan, veritabanında İngilizce, kararlı bir kod olarak saklanır. Ekranda gösterilecek metin her zaman çeviri dosyasından (i18next) gelir.**

```
SQLite'ta:        crop_type = 'olive'
Çeviri anahtarı:  parcel.cropType.olive → "Zeytin" (tr) / "Olive" (en)
```

**Bu kural neye UYGULANMAZ:** Kullanıcının serbestçe yazdığı metin alanları (ör. `soilType`, `irrigationType`, `variety`, `notes`) — bunlar zaten kullanıcının kendi dilinde, çeviri gerektirmeyen ham veridir.

**SQL seviyesinde uygulama:** Mümkün olduğunda `CHECK` kısıtı ile (ör. `CHECK (crop_type IN ('olive','vegetable','fruit'))`) — geçersiz/yanlış dildeki bir değerin veritabanına yazılması engellenir.

## Gerekçe

- Kural 8 (kod tekrarından kaçınma) ve Globalization Policy'nin doğal bir uzantısı.
- Web projesindeki hatayı tekrarlamamak — bu, gerçek bir denetimde bulunan somut bir anti-pattern.

## Sonuçlar

Engineering Protocol Bölüm 18.4 olarak eklendi. Modül 2'nin `crop_type` alanı bu kuralın ilk uygulamasıdır. Modül 6-7 (AI/Gelişim Analizi) health status gibi alanlar tasarlanırken bu kural zorunlu olarak uygulanacak.
