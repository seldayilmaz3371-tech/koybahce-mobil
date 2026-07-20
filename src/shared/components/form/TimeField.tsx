/**
 * TimeField — Ortak Form Alanı
 * ==============================
 * bkz. Sprint 10.4. `DateField`'in `type="time"` varyantı — Toplu
 * Gözlem/Bakım'ın geriye dönük saat girişi ve Sulama'nın Başlangıç/
 * Bitiş Saati alanları için ilk kez gerekti.
 *
 * DEĞER FORMATI: HTML `<input type="time">`, `HH:MM` formatında bir
 * string döndürür/bekler — `DateField`'in `YYYY-MM-DD`'siyle AYNI
 * "saf, ham string" felsefesi (dönüştürme ÇAĞIRAN formda yapılır,
 * bkz. `dateInputConversion.ts`'teki `combineDateAndTimeToIso`).
 *
 * ERİŞİLEBİLİRLİK (Protocol Bölüm 19): `label`, `htmlFor`/`id` ile
 * `input`e bağlanıyor.
 */

interface TimeFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export function TimeField({ id, label, value, onChange, required }: TimeFieldProps) {
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  );
}
