/**
 * Bahçem Mobile v1.0 Prototipi — Minimal Etkileşim
 * ====================================================
 * Bu bir ÇALIŞAN UYGULAMA DEĞİLDİR — sadece gerçek uygulamanın
 * (Sprint 7.3) textarea otomatik büyüme davranışını GÖRSEL olarak
 * taklit eder. Hiçbir veri kalıcılığı, gerçek AI çağrısı YOKTUR.
 */
document.addEventListener("DOMContentLoaded", () => {
  const textarea = document.querySelector(".chat-composer textarea");
  if (textarea) {
    textarea.addEventListener("input", () => {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    });
  }
});
