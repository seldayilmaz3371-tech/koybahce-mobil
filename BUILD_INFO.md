# BUILD_INFO

| Alan | Değer |
|---|---|
| **Project** | Bahçem Mobile |
| **Module** | Veri Yönetimi (Yedekle/Geri Yükle) — YENİ modül |
| **Sprint** | 10.13 |
| **App Version** | `0.1.0-beta.1` (değişmedi) |
| **Test Sonucu** | ✅ 790/790 başarılı (+48 yeni) — regresyon yok |
| **Build** | ✅ **BUILD SUCCESSFUL** |
| **Lint** | ✅ 0 uyarı/hata (247 dosya) |
| **Cap Sync** | ✅ Başarılı (11 native plugin, 2 yeni: `@capacitor/share`, `@capawesome/capacitor-file-picker`) |
| **Android Gradle Build** | ❌ Gerçekten denendi — bu ortamın network kısıtı (HTTP 403) nedeniyle yapılamadı |
| **Şema Sürümü** | 12 (değişmedi — migration gerekmedi) |
| **Tarih** | 2026-07-22 |
| **Git Commit** | `c17af5e` |

## Yeni Bağımlılıklar

- `fflate` — ZIP oluşturma/açma
- `@capacitor/share` — Android paylaşım menüsü
- `@capawesome/capacitor-file-picker` — yedek dosyası seçimi

## Kritik Mimari Kararlar

1. **"Ses kayıtları" özelliği projede yok** — kod tabanı tarandı, hiçbir tabloda bulunamadı. Sahte destek eklenmedi.
2. **Veritabanı ham dosya kopyalama yerine resmi `exportToJson()`/`importFromJson()`** — şifreleme anahtarı sorunu bypass edildi.
3. **Gerçek kısıt bulundu:** `importFromJson`, bağlantı nesnesinde değil ana plugin seviyesinde; ayrıca "önce bağlantı kapatılmalı" (resmi dokümantasyon kısıtı) — `connection.ts`'e güvenli bir sarmalayıcı eklendi.
4. **Güvenlik notu:** Export edilen JSON düz metin — yedek dosyası kullanıcı tarafından güvenli saklanmalı.

## Frozen Modules

| Modül | Durum |
|---|---|
| Modül 1-10 (AI dahil) | ✅ Onaylandı |
| Veri Yönetimi (Yedekle/Geri Yükle) | 🟡 Bu teslimat — gerçek cihaz doğrulaması bekliyor |
