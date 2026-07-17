/**
 * promptBuilder.ts
 * ===================
 * bkz. ADR 0024 Karar 2 (kullanıcı revizyonu — "Tek PromptBuilder
 * yerine modüler yapı"). System/User/Context/Tool 4 ayrı dosyada.
 *
 * `buildUserTurnMessage()` — YENİ bir kullanıcı mesajı için, Gemini'ye
 * gönderilecek "user" rolündeki mesaj metnini üretir (Context + Tool
 * + User bölümleri). Sistem talimatı (`buildSystemPrompt()`) BURAYA
 * GÖMÜLMEZ — `AIProvider.sendMessage()`'ın kendi `systemInstruction`
 * parametresine AYRI gönderilir (Gemini'nin gerçek `config.
 * systemInstruction` alanı — GERÇEKTEN doğrulandı, kod yazılırken
 * ilk tasarımın "user mesajına göm" yaklaşımından DAHA DOĞRU olduğu
 * fark edildi ve düzeltildi).
 */

import { buildContextPromptSection } from "./contextPromptSection";
import { buildToolPromptSection } from "./toolPromptSection";
import { buildSafeUserQuerySection, capUserQueryLength } from "./userPromptSection";

export interface BuildUserTurnMessageInput {
  rawUserQuery: string;
  contextText: string;
  hasTools: boolean;
}

export function buildUserTurnMessage(input: BuildUserTurnMessageInput): string {
  const cappedQuery = capUserQueryLength(input.rawUserQuery);
  const sections = [
    buildContextPromptSection(input.contextText),
    buildToolPromptSection(input.hasTools),
    buildSafeUserQuerySection(cappedQuery),
  ].filter((section): section is string => section !== null);

  return sections.join("\n\n");
}

export { buildSystemPrompt } from "./systemPrompt";
