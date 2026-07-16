/**
 * Para Birimi Dönüşüm Yardımcıları
 * ===================================
 * bkz. Sprint 4.3.1 (Modül 4 Bağımsız Denetimi'nde bulunan gerçek
 * bulgu — `amount REAL` kayan nokta riski).
 *
 * KURAL: `FinanceRecord.amountMinor`, HER ZAMAN en küçük para birimi
 * cinsinden (kuruş) bir TAM SAYI'dır — asla ondalık/kayan nokta
 * DEĞİLDİR. Kullanıcıya gösterilen/kullanıcının girdiği TL tutarları,
 * SADECE bu iki fonksiyon aracılığıyla dönüştürülür — hiçbir yerde
 * doğrudan `* 100` / `/ 100` yapılmaz (Kural 8, tek kaynak).
 *
 * `Math.round()` ZORUNLU (varsayılmadı, gerçek testle kanıtlandı):
 * `19.99 * 100` JavaScript'te `1998.9999999999998` veriyor —
 * `Math.round()` olmadan `Math.floor`/doğrudan `CAST` kullanılsaydı
 * 1998 (yanlış) elde edilirdi, tam olarak düzeltmeye çalıştığımız
 * hatanın kendisi.
 */

/** Kullanıcının girdiği TL tutarını (ör. 19.99) kuruşa (1999) çevirir. */
export function toMinorUnits(majorAmount: number): number {
  return Math.round(majorAmount * 100);
}

/** Veritabanındaki kuruş tutarını (ör. 1999) kullanıcıya gösterilecek TL'ye (19.99) çevirir. */
export function toMajorUnits(minorAmount: number): number {
  return minorAmount / 100;
}
