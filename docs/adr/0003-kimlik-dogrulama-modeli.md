# ADR 0003 — Kimlik Doğrulama Modeli

**Durum:** Kabul edildi
**Tarih:** 2026-07-13

## Bağlam

Web projesi çok kullanıcılı bir sistemdir: bcrypt ile şifre hash'leme,
sunucu tarafı oturum (session) token'ları, Admin/Çalışan/Misafir rol
tabanlı yetkilendirme (RBAC) içerir. Bahçem Mobile ise **tek kullanıcı**
odaklı bir Android uygulamasıdır ve sunucu katmanı yoktur.

## Karar

Sunucu tarafı kullanıcı hesabı/şifre/rol sistemi **kurulmayacak**.
Uygulama açılışı, cihazın kendi biyometrik doğrulamasıyla (parmak izi/
yüz tanıma) veya bulunmuyorsa/başarısız olursa cihazın PIN/desen/şifre
ekranıyla korunacak (`@aparajita/capacitor-biometric-auth`,
`allowDeviceCredential: true`).

## Gerekçe

- Kullanıcı bunu doğrudan talep etti.
- Sunucu tarafı auth, tek kullanıcılı offline bir uygulamada gereksiz
  karmaşıklıktır (Kural 4).
- Cihaz seviyesi kilit, saha koşullarında (Kural 15) tek dokunuşla
  hızlı erişim sağlar; ayrı bir kullanıcı adı/şifre hatırlama yükü
  getirmez.

## Alternatifler ve Neden Reddedildi

- **Uygulama içi basit şifre:** Ek bir "şifremi unuttum" akışı
  gerektirir, cihaz seviyesindeki güvenlikten daha zayıftır.
- **Web projesindeki rol sistemini korumak:** Kullanıcı bunu açıkça
  reddetti; ayrıca hiçbir zaman ikinci bir kullanıcı olmayacaksa bu
  sistem sadece bakım yükü ekler.

## Genişletilebilirlik Notu

Web projesindeki `roles`/RBAC kavramı veri modelinden tamamen
silinmiyor, sadece kullanılmıyor. `app_metadata` ve ileride eklenecek
kullanıcı profili tablosu, çoklu kullanıcı senaryosu talep edilirse
(Kural 8) üzerine inşa edilebilecek şekilde tasarlanacak — ancak bu
şu an aktif olarak kodlanmıyor (YAGNI).

## Sonuçlar

- `LockScreen.tsx` bileşeni, sunucu doğrulaması olmadan doğrudan
  `biometricAuth.authenticate()` çağırır.
- Cihazda hiçbir güvenlik mekanizması (PIN/desen/biyometri) yoksa,
  kullanıcı bilgilendirilip kilitsiz devam etmesine izin verilir —
  veri yine de şifrelidir (ADR 0004), sadece uygulama açılış kilidi
  eksik kalır.
