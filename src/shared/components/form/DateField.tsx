/**
 * DateField — Ortak Form Alanı
 * ==============================
 * `TextField` deseninin `type="date"` varyantı — Sprint 4.2'de
 * (Finans `record_date`) ilk kez gerekti. Önceki tüm tarih alanları
 * (`observedAt`, `takenAt`) otomatik üretiliyordu, hiç kullanıcıdan
 * istenmiyordu (bkz. Observation/Photo Domain Review'ları) — bu,
 * kullanıcıdan gerçekten tarih istenen İLK form alanı (Finans
 * kayıtları genellikle geriye dönük girilir, bkz. Modül 4 Mimari
 * Onayı madde 2).
 *
 * DEĞER FORMATI: HTML `<input type="date">`, `YYYY-MM-DD` formatında
 * bir string döndürür/bekler — ISO 8601 zaman damgalarıyla (`Tree`/
 * `Observation`/`Photo`'da kullanılan) doğrudan uyumlu DEĞİL (saat
 * bileşeni yok). Dönüştürme, ÇAĞIRAN formda yapılır (bkz.
 * `FinanceRecordForm`) — bu bileşen sadece ham `YYYY-MM-DD` ile
 * çalışır, saf bir UI bileşeni.
 *
 * ERİŞİLEBİLİRLİK (Protocol Bölüm 19): `label`, `htmlFor`/`id` ile
 * `input`e bağlanıyor.
 */

interface DateFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export function DateField({ id, label, value, onChange, required }: DateFieldProps) {
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  );
}
