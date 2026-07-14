/**
 * FormError — Ortak Form Alanı
 * ===============================
 * `role="alert"` ile ekran okuyucuya duyurulur (Protocol Bölüm 19).
 * `message` null ise hiçbir şey render etmez.
 */

interface FormErrorProps {
  message: string | null;
}

export function FormError({ message }: FormErrorProps) {
  if (!message) return null;
  return (
    <p role="alert" className="form-field__error">
      {message}
    </p>
  );
}
