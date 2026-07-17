/**
 * AI Ayarları Repository
 * =========================
 * bkz. ADR 0024 Karar 4 (provider-bağımsız veri modeli). TEK satır —
 * sabit `id = 'default'`. `getOrCreate()`, ilk çağrıda satırı
 * varsayılan değerlerle oluşturur (Bölüm 15'in varsayılanları: internet
 * izni KAPALI, ses KAPALI, otomatik öneriler KAPALI — burada karşılığı:
 * `internetPermission: false`, `isEnabled: false`).
 */

import { BaseRepository } from "../../../data/repositories/base.repository";
import type { AiSettings, AiSettingsUpdateInput } from "../domain/ai.types";

interface AiSettingsRow {
  id: string;
  provider_name: string;
  is_enabled: number;
  api_key_configured: number;
  internet_permission: number;
  response_language: string;
  max_context_items: number;
  max_messages: number;
  debug_mode: number;
  created_at: string;
  updated_at: string;
}

const SETTINGS_ROW_ID = "default";
const DEFAULT_PROVIDER_NAME = "gemini";
const DEFAULT_RESPONSE_LANGUAGE = "tr";
const DEFAULT_MAX_CONTEXT_ITEMS = 10;
const DEFAULT_MAX_MESSAGES = 10;

function mapRowToSettings(row: AiSettingsRow): AiSettings {
  return {
    providerName: row.provider_name,
    isEnabled: row.is_enabled === 1,
    apiKeyConfigured: row.api_key_configured === 1,
    internetPermission: row.internet_permission === 1,
    responseLanguage: row.response_language,
    maxContextItems: row.max_context_items,
    maxMessages: row.max_messages,
    debugMode: row.debug_mode === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const UPDATABLE_COLUMN_MAP: Record<keyof Omit<AiSettingsUpdateInput, never>, string> = {
  providerName: "provider_name",
  isEnabled: "is_enabled",
  internetPermission: "internet_permission",
  responseLanguage: "response_language",
  maxContextItems: "max_context_items",
  maxMessages: "max_messages",
  debugMode: "debug_mode",
};

const BOOLEAN_FIELDS = new Set<keyof AiSettingsUpdateInput>(["isEnabled", "internetPermission", "debugMode"]);

export interface IAiSettingsRepository {
  /** Ayarlar satırı yoksa varsayılan değerlerle oluşturur, varsa döner — her zaman geçerli bir `AiSettings` garanti eder. */
  getOrCreate(): Promise<AiSettings>;
  update(changes: AiSettingsUpdateInput): Promise<void>;
  /** Sadece Secure Storage'a bir anahtar yazıldıktan/silindikten SONRA çağrılır — bu repository anahtarın kendisini asla görmez. */
  setApiKeyConfigured(configured: boolean): Promise<void>;
}

class AiSettingsRepository extends BaseRepository implements IAiSettingsRepository {
  protected readonly tableName = "ai_settings";

  async getOrCreate(): Promise<AiSettings> {
    const existing = await this.queryOne<AiSettingsRow>(`SELECT * FROM ai_settings WHERE id = ?`, [
      SETTINGS_ROW_ID,
    ]);
    if (existing) {
      return mapRowToSettings(existing);
    }

    const now = new Date().toISOString();
    await this.execute(
      `INSERT INTO ai_settings
         (id, provider_name, is_enabled, api_key_configured, internet_permission, response_language, max_context_items, max_messages, debug_mode, created_at, updated_at)
       VALUES (?, ?, 0, 0, 0, ?, ?, ?, 0, ?, ?)`,
      [SETTINGS_ROW_ID, DEFAULT_PROVIDER_NAME, DEFAULT_RESPONSE_LANGUAGE, DEFAULT_MAX_CONTEXT_ITEMS, DEFAULT_MAX_MESSAGES, now, now]
    );

    return {
      providerName: DEFAULT_PROVIDER_NAME,
      isEnabled: false,
      apiKeyConfigured: false,
      internetPermission: false,
      responseLanguage: DEFAULT_RESPONSE_LANGUAGE,
      maxContextItems: DEFAULT_MAX_CONTEXT_ITEMS,
      maxMessages: DEFAULT_MAX_MESSAGES,
      debugMode: false,
      createdAt: now,
      updatedAt: now,
    };
  }

  async update(changes: AiSettingsUpdateInput): Promise<void> {
    const keys = Object.keys(changes) as (keyof AiSettingsUpdateInput)[];
    if (keys.length === 0) {
      return;
    }

    await this.getOrCreate(); // satırın var olduğunu garanti eder

    const setClauses = keys.map((key) => `${UPDATABLE_COLUMN_MAP[key]} = ?`);
    const values: unknown[] = keys.map((key) => {
      const value = changes[key];
      return BOOLEAN_FIELDS.has(key) ? (value ? 1 : 0) : value;
    });

    setClauses.push("updated_at = ?");
    values.push(new Date().toISOString());
    values.push(SETTINGS_ROW_ID);

    await this.execute(`UPDATE ai_settings SET ${setClauses.join(", ")} WHERE id = ?`, values);
  }

  async setApiKeyConfigured(configured: boolean): Promise<void> {
    await this.getOrCreate();
    await this.execute(`UPDATE ai_settings SET api_key_configured = ?, updated_at = ? WHERE id = ?`, [
      configured ? 1 : 0,
      new Date().toISOString(),
      SETTINGS_ROW_ID,
    ]);
  }
}

export const aiSettingsRepository: IAiSettingsRepository = new AiSettingsRepository();
