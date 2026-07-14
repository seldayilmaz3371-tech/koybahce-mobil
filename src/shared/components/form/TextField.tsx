/**
 * TextField — Ortak Form Alanı
 * ===============================
 * `ParcelForm`dan çıkarıldı (Modül 2 Mimari Doğrulaması madde 3-4).
 * İleride İlaç/Gübre/Sulama/Sensör formlarında da kullanılacak.
 *
 * ERİŞİLEBİLİRLİK (Protocol Bölüm 19): `label`, `htmlFor`/`id` ile
 * `input`e bağlanıyor — placeholder'a güvenilmiyor.
 */

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export function TextField({ id, label, value, onChange, required }: TextFieldProps) {
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      />
    </div>
  );
}
