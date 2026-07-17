/**
 * AiTool Arayüzü
 * =================
 * bkz. ADR 0024 Karar 2 (Tool Registry). Her araç, hem Gemini'ye
 * gönderilecek TANIMI (`definition`) hem GERÇEK ÇALIŞTIRMA mantığını
 * (`execute`) taşır — ikisi AYNI dosyada, birbirinden kopmasın diye
 * (Kural 8).
 *
 * Token Optimizasyonu (AI Master Architecture Bölüm 14): `execute()`
 * ASLA ham kayıt dökümü döndürmez — SQL ile önceden özetlenmiş
 * istatistikler döner (ör. "toplam 12 gözlem" DEĞİL "son 5 gözlem
 * özeti + toplam sayı").
 */

import type { AIToolDefinition } from "../providers/AIProvider.interface";

export interface AiTool {
  readonly definition: AIToolDefinition;
  execute(args: Record<string, unknown>): Promise<unknown>;
}
