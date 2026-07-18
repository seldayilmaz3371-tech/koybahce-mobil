/**
 * Şema Migration Testi — Sürüm 10 (AI Altyapısı)
 * ==================================================
 * bkz. ADR 0024, Sprint 6. YENİ tablolar (ai_settings/ai_conversations/
 * ai_messages) — dönüştürülecek eski veri yok.
 */

import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";
import { SCHEMA_MIGRATIONS } from "./schema";

describe("Şema Migration — Sürüm 10 (AI Altyapısı)", () => {
  it("Sürüm 10 migration'ı, önceki tüm sürümler üzerine doğru şekilde uygulanır", () => {
    const db = new Database(":memory:");
    db.pragma("foreign_keys = ON");

    const allStatements = SCHEMA_MIGRATIONS.flatMap((m) => m.statements);
    for (const statement of allStatements) {
      db.exec(statement);
    }

    const tables = db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name IN ('ai_settings','ai_conversations','ai_messages')`
      )
      .all() as Array<{ name: string }>;
    expect(tables.map((t) => t.name).sort()).toEqual(["ai_conversations", "ai_messages", "ai_settings"]);

    db.close();
  });

  it("ai_messages, ai_conversations'a FOREIGN KEY ile bağlı (gerçekten zorlanıyor)", () => {
    const db = new Database(":memory:");
    db.pragma("foreign_keys = ON");
    const allStatements = SCHEMA_MIGRATIONS.flatMap((m) => m.statements);
    for (const statement of allStatements) db.exec(statement);

    expect(() => {
      db.prepare(
        `INSERT INTO ai_messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)`
      ).run("m1", "var-olmayan-konusma", "user", "test", "2026-01-01T00:00:00.000Z");
    }).toThrow();

    db.close();
  });

  it("ai_messages.role CHECK kısıtı gerçekten uygulanır", () => {
    const db = new Database(":memory:");
    const allStatements = SCHEMA_MIGRATIONS.flatMap((m) => m.statements);
    for (const statement of allStatements) db.exec(statement);

    db.exec(
      `INSERT INTO ai_conversations (id, is_active, created_at, updated_at) VALUES ('c1', 1, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')`
    );

    expect(() => {
      db.prepare(
        `INSERT INTO ai_messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)`
      ).run("m1", "c1", "system", "test", "2026-01-01T00:00:00.000Z");
    }).toThrow();

    db.close();
  });

  it("ai_settings tek satırlı deseni destekler (PRIMARY KEY tekrar denemesi reddedilir)", () => {
    const db = new Database(":memory:");
    const allStatements = SCHEMA_MIGRATIONS.flatMap((m) => m.statements);
    for (const statement of allStatements) db.exec(statement);

    db.exec(
      `INSERT INTO ai_settings (id, provider_name, is_enabled, api_key_configured, internet_permission, response_language, max_context_items, max_messages, debug_mode, created_at, updated_at)
       VALUES ('default', 'gemini', 0, 0, 0, 'tr', 10, 10, 0, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')`
    );

    expect(() => {
      db.exec(
        `INSERT INTO ai_settings (id, provider_name, is_enabled, api_key_configured, internet_permission, response_language, max_context_items, max_messages, debug_mode, created_at, updated_at)
         VALUES ('default', 'gemini', 0, 0, 0, 'tr', 10, 10, 0, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z')`
      );
    }).toThrow();

    db.close();
  });
});
