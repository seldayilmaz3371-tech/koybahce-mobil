# ADR 0021 — Kalıntı Dil Tercihi Verisi Temizliği

**Durum:** Kabul edildi — **Gerçek Android cihazda doğrulandı (Verified on Physical Android Device, 2026-07-14)**
**Tarih:** 2026-07-14
**Bulan:** Kullanıcının istediği kod-seviyesi akış izleme talebi sırasında
**İlgili:** ADR 0015, ADR 0020

## Bağlam

ADR 0020 (native `Device.getLanguageCode()`'a geçiş) teknik olarak doğruydu, ama kullanıcı kod akışını satır satır izlemeyi istediğinde, **ADR 0020'nin hiç çalışma fırsatı bulamayabileceği** bir önceki adımda gerçek bir sorun bulundu.

## Kök Neden

`resolveInitialLanguage()` (`languagePreference.ts`), önce `@capacitor/preferences`'ta kayıtlı bir değer olup olmadığına bakıyor; varsa onu "kullanıcının bilinçli tercihi" sayıp doğrudan döndürüyor, `Device.getLanguageCode()`'a hiç uğramıyor.

**Sorun:** `setLanguagePreference()` — Preferences'a YAZAN tek fonksiyon — kod tabanında **hiçbir yerden çağrılmıyor** (doğrulandı: `grep -rn "setLanguagePreference" src` sadece tanımı ve kendi doc-comment'indeki referansı buluyor). Ayarlar ekranı henüz yok.

Buna rağmen, ADR 0015 ÖNCESİ kod (ilk yazılan, hatalı sürüm) cihazdan algılanan dili **otomatik olarak** Preferences'a yazıyordu. Kullanıcı APK'yı **"güncelleme olarak"** yükledi (temiz kurulum değil) — Android'de uygulama güncellemesi `SharedPreferences` verisini (Preferences eklentisinin deposu) **korur, silmez**. Bu nedenle, eski hatalı koddan kalma bir `"tr"` değeri, cihazda hâlâ kayıtlı olabilir ve yeni (doğru) kod bunu yanlışlıkla "bilinçli tercih" sanıp hep onu döndürüyor olabilir — `Device.getLanguageCode()` çağrısına hiç ulaşılmadan.

**Dürüstlük notu:** Kullanıcının cihazındaki gerçek Preferences içeriğini göremediğim için bunun kesinlikle gerçekleştiğini iddia edemiyorum — ama mantıksal olarak **tek tutarlı açıklama** bu: `setLanguagePreference()` hiç çağrılmadığına göre, Preferences'ta bulunan HERHANGİ bir değer, bu temizlik yapılmadan önce, başka hiçbir kaynaktan gelemez.

## Karar

`resolveInitialLanguage()`'ın başına, **cihaz başına tam olarak bir kez** çalışan bir temizlik adımı eklendi: `clearStaleAutoDetectedLanguageOnce()`.

```typescript
async function clearStaleAutoDetectedLanguageOnce(): Promise<void> {
  const alreadyCleaned = await localPreferences.get(LEGACY_AUTO_LANGUAGE_CLEARED);
  if (alreadyCleaned === "true") return;
  await localPreferences.remove(LANGUAGE);
  await localPreferences.set(LEGACY_AUTO_LANGUAGE_CLEARED, "true");
}
```

Bu, `@capacitor/preferences`'a yeni bir `remove()` metodu eklenmesini gerektirdi (`native/preferences.ts`).

**Neden "her zaman temizle" değil, "bir kez temizle":** Ayarlar ekranı (ADR 0012 Karar 3) geldiğinde `setLanguagePreference()` gerçekten çağrılmaya başlayacak — o andan itibaren Preferences'taki değer **gerçek bir kullanıcı tercihi** olacak ve saygı gösterilmesi gerekiyor. Temizliği "bir kez" ile sınırlamak, bu gelecekteki gerçek kullanım senaryosunu bozmuyor.

## Sonuçlar

- Bu güncelleme sonrası **ilk açılışta**, cihazdaki her ne kalıntı varsa temizlenecek ve `Device.getLanguageCode()` gerçekten çalışacak.
- **Kesin doğrulama, kullanıcının test sonucuyla gelecek** — bu ADR de o sonuca göre güncellenecek.
- `native/preferences.ts`'e `remove()` eklendi — ilerideki modüller (Ayarlar dahil) için de kullanılabilir genel bir yetenek.

## ✅ Doğrulama Sonucu (2026-07-14)

Kullanıcı, `d9145f0` commit'i ile derlenen APK'yı gerçek Android cihazda test etti:
- Telefon sistem dili İngilizce'ye alındı
- Uygulama **güncelleme olarak** kuruldu (temiz kurulum değil — tam olarak riskli senaryo)
- Uygulama tamamen İngilizce açıldı, tüm metinler ve tarih/saat biçimi doğru

Bu, hem ADR 0020'nin (native Device sorgusu) hem ADR 0021'in (kalıntı veri temizliği) **birlikte doğru çalıştığını** kanıtlıyor — özellikle en riskli senaryo (güncelleme, kalıntı veri) test edildiği için sonuç güvenilir.
