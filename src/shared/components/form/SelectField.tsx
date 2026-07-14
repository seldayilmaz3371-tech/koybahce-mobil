/**
 * SelectField — Ortak Form Alanı
 * =================================
 * bkz. TextField.tsx başlığındaki genel gerekçe.
 *
 * Jenerik (`<T extends string>`) — sadece `CropType` için değil,
 * ileride benzer sabit-küme alanları (ör. ilaç türü, sulama yöntemi)
 * için de kullanılabilir (bkz. ADR 0017: bu tür alanlar İngilizce kod
 * saklar, `options[].label` her zaman çağıran tarafından `t()` ile
 * çevrilmiş olarak verilir — bu bileşen çeviriyi kendi yapmaz).
 */

interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface SelectFieldProps<T extends string> {
  id: string;
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
}

export function SelectField<T extends string>({
  id,
  label,
  value,
  onChange,
  options,
}: SelectFieldProps<T>) {
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
