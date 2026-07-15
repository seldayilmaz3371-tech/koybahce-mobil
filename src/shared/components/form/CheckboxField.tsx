/**
 * CheckboxField — Ortak Form Alanı
 * ===================================
 * bkz. TextField.tsx başlığındaki genel gerekçe.
 *
 * Bu, mevcut ortak form bileşenleri ailesinde eksik olan tek parçaydı
 * (boolean alanlar için) — ParcelForm'un ilk yazıldığı sırada boolean
 * bir alan yoktu, bu yüzden eklenmemişti. TreeForm'un `isReferenceTree`
 * ihtiyacıyla şimdi tamamlanıyor.
 *
 * ERİŞİLEBİLİRLİK: `<input type="checkbox">`, `<label>` içine
 * sarmalanmış — hem tıklama alanını genişletiyor (Kural 15, dokunma
 * hedefi) hem de ekran okuyucu için doğal bir ilişki kuruyor
 * (Protocol Bölüm 19, ekstra `htmlFor`/`id` eşleştirmesine gerek
 * kalmadan).
 */

interface CheckboxFieldProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function CheckboxField({ id, label, checked, onChange }: CheckboxFieldProps) {
  return (
    <div className="form-field form-field--checkbox">
      <label htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>{label}</span>
      </label>
    </div>
  );
}
