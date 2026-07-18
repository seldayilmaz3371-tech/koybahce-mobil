# Sprint 7.5 — Gerçek Cihaz Test Planı: Eksik Test Analizi

**Tarih:** 2026-07-18 · **Kaynak:** `docs/sprint-6-apk-device-test-plan.md` (42 test maddesi) ile Sprint 7.2'de kullanıcının GERÇEKTEN onayladığı maddelerin çapraz karşılaştırılması.

## Sprint 7.2'de Gerçekten Doğrulanan Maddeler (Kullanıcının Kendi Onayından)

Kullanıcının Sprint 7.2 onay mesajı: *"APK başarıyla üretildi. Android cihaza sorunsuz kuruldu. Uygulama açılıyor. Gradle/Capacitor tarafında kritik hata yok. Parsel listesi doğru yükleniyor. SQLite verileri okunuyor. AI Ayarları çalışıyor. Gemini API anahtarı Secure Storage'a kaydediliyor. AI ekranı açılıyor. Galeriden fotoğraf seçme başarıyla çalışıyor. Build, lint, test ve cap sync sorunsuz. Uygulama kullanımında herhangi bir çökme gözlenmedi."*

Bu, test planındaki şu maddelere **kısmen** karşılık geliyor:

| Doğrulanan | Test Planı Karşılığı | Kapsam |
|---|---|---|
| APK üretildi | APK-001 | ✅ Tam |
| Cihaza kuruldu | INSTALL-001 | ✅ Tam |
| Uygulama açılıyor | INSTALL-002 | ✅ Tam |
| SQLite verileri okunuyor | DB-001/002 | 🟡 Kısmi (sadece "okunuyor", migration/kalıcılık AYRICA test edilmedi) |
| AI Ayarları çalışıyor | AI-001/002 | 🟡 Kısmi (temel akış, kaldırma/hata senaryoları YOK) |
| API anahtarı Secure Storage'a kaydediliyor | AI-003 | 🟡 Kısmi ("kaydediliyor" görüldü, "düz metin bulunamıyor" AYRICA doğrulanmadı — bu, "veri yazıldı" ile "veri güvenli" arasındaki FARK, kritik bir ayrım) |
| Çökme gözlenmedi | ERR-003 (genel gözlem) | 🟡 Kısmi (sistematik bir hata-tetikleme testi DEĞİL, sadece normal kullanım) |

**Not:** "Galeriden fotoğraf seçme" test planının kapsamında (AI'ye özel) **hiç yok** — bu, Modül 3'ün (Fotoğraf) konusu, kullanıcı muhtemelen daha geniş bir smoke-test yaptı, bu iyi bir işaret ama AI test planının resmi bir maddesi değil.

## 🔴 Gerçek Bulgu: "Zorunlu" Listesindeki Çoğu Madde HÂLÂ Test Edilmedi

`sprint-6-apk-device-test-plan.md`'nin kendi "Production Ready İçin ZORUNLU Testler" listesindeki **26 maddeden**, Sprint 7.2'de sadece **~7'si kısmen** dokunuldu. Aşağıdaki tablo, kalanları **önceliklendiriyor**:

## Öncelik 1 — Güvenlik (Beta Dağıtımından ÖNCE Mutlaka)

| Test ID | Neden Öncelik 1 |
|---|---|
| **SEC-001** | API anahtarının GERÇEKTEN düz metin olarak bulunamadığı — sadece "kaydediliyor" görüldü, "güvenli" DOĞRULANMADI |
| **SEC-002** | Loglarda API anahtarı sızıntısı — HİÇ test edilmedi |
| **SEC-003** | SQLite'ta gizli bilgi tutulmadığı — HİÇ test edilmedi |
| **SEC-005** | Veritabanının şifreli olduğu (SQLCipher, ADR 0004) — HİÇ test edilmedi |

## Öncelik 2 — Veri Bütünlüğü (Kullanıcı Verisi Kaybı Riski)

| Test ID | Neden Öncelik 2 |
|---|---|
| **INSTALL-003/004** | Güncelleme senaryosu + Migration — HİÇ test edilmedi, veri kaybı riski taşır |
| **INSTALL-005** | Kaldır/yeniden kur — HİÇ test edilmedi |
| **DB-003/004** | Cihaz yeniden başlatma sonrası veri + migration sürüm kontrolü — HİÇ test edilmedi |

## Öncelik 3 — AI Modülünün Hata Senaryoları (Kullanıcı Deneyimi Riski)

| Test ID | Neden Öncelik 3 |
|---|---|
| **AI-006** | İnternet kapalı senaryosu — HİÇ test edilmedi |
| **AI-007** | Hatalı API anahtarı — HİÇ test edilmedi |
| **AI-008** | Kota hatası — HİÇ test edilmedi |
| **AI-009** | Timeout/ANR riski — HİÇ test edilmedi, **kritik** (uygulamanın donmadığının kanıtı) |
| **AI-012** | Tool Calling uçtan uca (gerçek veri ile) — HİÇ test edilmedi |
| **AI-014** | Yazma engeli (AI'nin gerçekten kayıt oluşturamadığı) — HİÇ test edilmedi, **güven açısından kritik** |

## Öncelik 4 — Yaşam Döngüsü ve İzinler

| Test ID | Neden Öncelik 4 |
|---|---|
| **UX-002** | Arka plana alma + AI isteği çakışması — Sprint 4.3.2'nin kök nedenine BENZER bir regresyon riski taşıyor, HİÇ test edilmedi |
| **PERM-001/002** | Gerçek izin doğrulaması — HİÇ test edilmedi |

## Sonuç

Sprint 7.2'nin onayı **değerli bir ilk smoke-test'ti**, ama `sprint-6-apk-device-test-plan.md`'nin **zorunlu** listesinin **büyük çoğunluğu hâlâ test edilmedi**. Bu, Beta Release'in **imzalama kadar önemli** bir ön koşulu — **Öncelik 1 (Güvenlik) ve Öncelik 2 (Veri Bütünlüğü) maddeleri, Beta dağıtımından KESİNLİKLE ÖNCE tamamlanmalı.**
