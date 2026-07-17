/**
 * bootstrapAi.ts
 * =================
 * bkz. ADR 0024. Uygulama başlangıcında BİR KEZ çağrılır — Gemini
 * provider'ı `ProviderRegistry`'ye, 5 salt-okunur aracı `ToolRegistry`'ye
 * kaydeder. Bu çağrı olmadan `AiSessionService` hiçbir provider/tool
 * bulamaz (`AI_PROVIDER_NOT_REGISTERED`/`AI_TOOL_NOT_FOUND`).
 *
 * NAVİGASYON NOTU: `AiSettingsScreen`/`AiChatScreen` Sprint 6'da HENÜZ
 * hiçbir rotaya bağlı DEĞİL (Sprint 5.2'nin Bakım Kaydı Ekranı ile
 * AYNI aşamalı yaklaşım — Blueprint'in kendisi "Bu sprintin amacı AI
 * ALTYAPISI oluşturmaktır" diyor, navigasyon ayrı bir sonraki sprint
 * konusu olabilir). Bu bootstrap yine de çağrılıyor — gelecekte
 * navigasyon eklendiğinde "provider hiç kayıtlı değildi" gibi bir
 * sürprizle karşılaşılmasın diye, VE gerçek cihaz/entegrasyon
 * testlerinin bu çağrıyı içerebilmesi için.
 */

import { providerRegistry } from "./providers/ProviderRegistry";
import { geminiProvider } from "./providers/GeminiProvider";
import { registerReadOnlyTools } from "./tools/registerReadOnlyTools";

let bootstrapped = false;

export function bootstrapAi(): void {
  if (bootstrapped) return; // Kural 4 — gereksiz tekrar kayıttan kaçın (idempotent).
  providerRegistry.register(geminiProvider);
  registerReadOnlyTools();
  bootstrapped = true;
}
