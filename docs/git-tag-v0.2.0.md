# Git Tag Önerisi — v0.2.0

**Etiketlenecek commit:** `8166c56` (Sprint 2.6 kapanışı — module-status.md güncellemesi)

**SemVer gerekçesi:** v0.1.0 (Modül 1) örneğiyle tutarlı — proje hâlâ `0.y.z` (ilk geliştirme) aşamasında (semver.org: "genel API henüz kararlı sayılmamalı"). Modül 2 anlamlı bir kilometre taşı olduğu için **minor** sürüm artışı: `0.1.0` → `0.2.0`.

## Önerilen Komutlar (Sadece Öneri — Hiçbir Şey Çalıştırılmadı)

```bash
git tag -a v0.2.0 8166c56 -m "Modül 2 — Parseller ve Ağaçlar (kod tamamlandı)

Tam CRUD (Parsel + Ağaç), arama/sıralama/sayfalama, Reference Mode,
Parsel-Ağaç navigasyonu, Android geri tuşu, Error Code Standard
temel altyapısı, ADR 0022 (foreign key) düzeltmesi.

58 otomatik test. Gerçek Android cihaz onayı bekleniyor."

git push origin v0.2.0
```

Doğrulama:
```bash
git show v0.2.0
git tag -l -n9
```

**Not:** Kullanıcının gerçek cihaz testi BAŞARISIZ olursa ve düzeltme gerekirse, bu tag henüz push edilmemişse silinip yeniden oluşturulabilir (`git tag -d v0.2.0`). Push edildikten sonra taşınmaması önerilir (Git Tag Strategy — Modül 1'de belirlenen ilke).
