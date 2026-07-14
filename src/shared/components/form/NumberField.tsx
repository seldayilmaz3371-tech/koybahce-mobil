/**
 * NumberField — Ortak Form Alanı
 * =================================
 * bkz. TextField.tsx başlığındaki genel gerekçe.
 *
 * Değer bilerek `string` tutulur (controlled input davranışı için) —
 * sayıya dönüştürme/doğrulama işi ÇAĞIRAN forma aittir (ör. ParcelForm
 * "alan pozitif olmalı" kontrolünü kendi yapıyor). Bu bileşen sadece
 * girdi/görüntü sorumluluğu taşır.
 */

interface NumberFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  /** HTML `step` özniteliği — ör. tam sayılar için "1", ondalık için "0.01", serbest için "any". */
  step?: string;
}

export function NumberField({ id, label, value, onChange, required, step }: NumberFieldProps) {
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        step={step ?? "any"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  );
}
