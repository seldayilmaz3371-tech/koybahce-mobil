# Git Tag Önerisi — v0.3.0

**Etiketlenecek commit:** `a6cb818` (Sprint 3.9 — Modül 3 kapanışı)

**SemVer gerekçesi:** v0.1.0 (Modül 1), v0.2.0 (Modül 2) ile tutarlı — minor sürüm artışı: `0.2.0` → `0.3.0`.

## Önerilen Komutlar (Sadece Öneri — Hiçbir Şey Çalıştırılmadı)

```bash
git tag -a v0.3.0 a6cb818 -m "Modül 3 — Gözlemler ve Fotoğraflar (kod tamamlandı)

Gözlem CRUD (5 tür), Fotoğraf (kamera/galeri/önizleme/silme), kalıcı
depolama, Android geri tuşu (6 ekranın tamamında), Referans Ağaç
akışı.

129 otomatik test (Golden Path E2E dahil). Gerçek Android cihaz onayı
bekleniyor."

git push origin v0.3.0
```

Doğrulama:
```bash
git show v0.3.0
git tag -l -n9
```

**Not:** Modül 2'de olduğu gibi, kullanıcının gerçek cihaz testi başarısız olursa ve düzeltme gerekirse, bu tag henüz push edilmemişse silinip yeniden oluşturulabilir.
