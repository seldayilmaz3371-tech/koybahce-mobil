/**
 * durationCalculation.ts
 * =========================
 * bkz. Sprint 10.4 (Sulama Başlangıç/Bitiş Saati). İki "HH:MM"
 * değeri arasındaki süreyi HESAPLAR — SADECE UI'da CANLI gösterim
 * için (bkz. `maintenance.types.ts`'teki `startTime`/`endTime`
 * yorumu — süre AYRI bir veritabanı alanı olarak SAKLANMIYOR, HER
 * ZAMAN bu iki alandan türetiliyor).
 *
 * BİLİNÇLİ SADELİK: Sadece AYNI GÜN içindeki bir aralık varsayılıyor
 * (kullanıcının kendi örneği: "06:15 → 08:05" aynı sabah). Bitiş,
 * başlangıçtan ÖNCEYSE (ör. gece yarısını geçen bir sulama), bu
 * fonksiyon `null` döner — "gece yarısını geçen sulama" senaryosu
 * bu sprintin kapsamı DIŞINDA (kullanıcı BUNU istemedi, UYDURULMADI).
 */

export interface Duration {
  hours: number;
  minutes: number;
}

/** "HH:MM" formatındaki iki saat arasındaki farkı hesaplar. `endTime`, `startTime`'dan ÖNCEYSE `null` döner. */
export function calculateDuration(startTime: string, endTime: string): Duration | null {
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);

  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;

  if (endTotalMinutes <= startTotalMinutes) {
    return null;
  }

  const diffMinutes = endTotalMinutes - startTotalMinutes;
  return { hours: Math.floor(diffMinutes / 60), minutes: diffMinutes % 60 };
}
