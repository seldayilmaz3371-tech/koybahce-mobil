/**
 * TextAreaField — Ortak Form Alanı
 * ===================================
 * bkz. TextField.tsx başlığındaki genel gerekçe. Notlar gibi uzun
 * serbest metin alanları için.
 */

interface TextAreaFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}

export function TextAreaField({ id, label, value, onChange }: TextAreaFieldProps) {
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
