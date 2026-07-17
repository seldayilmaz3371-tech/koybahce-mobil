/**
 * AI Konuşma Repository — İmplementasyon
 * ===========================================
 * `messages`'ta `tool_calls_json`, `AiToolCallRecord[]`'ın JSON
 * serileştirilmiş hali — SQLite'ta ilişkisel bir yapı GEREKMİYOR
 * (araç çağrıları her zaman TEK bir mesajla birlikte okunur/yazılır,
 * ayrı bir tabloya bölmek gereksiz karmaşıklık olurdu — Kural 4).
 */

import { BaseRepository } from "../../../data/repositories/base.repository";
import type { IAiConversationRepository } from "./aiConversation.repository.interface";
import type {
  AiConversation,
  AiMessage,
  AiToolCallRecord,
  NewAiConversationInput,
  NewAiMessageInput,
} from "../domain/ai.types";

interface AiConversationRow {
  id: string;
  title: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

interface AiMessageRow {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  tool_calls_json: string | null;
  created_at: string;
}

const DEFAULT_CONVERSATION_LIMIT = 50;

function mapRowToConversation(row: AiConversationRow): AiConversation {
  return {
    id: row.id,
    title: row.title,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRowToMessage(row: AiMessageRow): AiMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role as AiMessage["role"],
    content: row.content,
    toolCalls: row.tool_calls_json ? (JSON.parse(row.tool_calls_json) as AiToolCallRecord[]) : null,
    createdAt: row.created_at,
  };
}

class AiConversationRepository extends BaseRepository implements IAiConversationRepository {
  protected readonly tableName = "ai_conversations";

  async listConversations(limit: number = DEFAULT_CONVERSATION_LIMIT): Promise<AiConversation[]> {
    const rows = await this.query<AiConversationRow>(
      `SELECT * FROM ai_conversations WHERE is_active = 1 ORDER BY updated_at DESC LIMIT ?`,
      [limit]
    );
    return rows.map(mapRowToConversation);
  }

  async getConversationById(id: string): Promise<AiConversation | null> {
    const row = await this.queryOne<AiConversationRow>(`SELECT * FROM ai_conversations WHERE id = ?`, [id]);
    return row ? mapRowToConversation(row) : null;
  }

  async createConversation(input: NewAiConversationInput = {}): Promise<AiConversation> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const conversation: AiConversation = {
      id,
      title: input.title ?? null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    await this.execute(
      `INSERT INTO ai_conversations (id, title, is_active, created_at, updated_at) VALUES (?, ?, 1, ?, ?)`,
      [conversation.id, conversation.title, conversation.createdAt, conversation.updatedAt]
    );

    return conversation;
  }

  async deactivateConversation(id: string): Promise<void> {
    await this.execute(`UPDATE ai_conversations SET is_active = 0, updated_at = ? WHERE id = ?`, [
      new Date().toISOString(),
      id,
    ]);
  }

  async listMessages(conversationId: string): Promise<AiMessage[]> {
    const rows = await this.query<AiMessageRow>(
      `SELECT * FROM ai_messages WHERE conversation_id = ? ORDER BY created_at ASC`,
      [conversationId]
    );
    return rows.map(mapRowToMessage);
  }

  async addMessage(input: NewAiMessageInput): Promise<AiMessage> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const message: AiMessage = {
      id,
      conversationId: input.conversationId,
      role: input.role,
      content: input.content,
      toolCalls: input.toolCalls ?? null,
      createdAt: now,
    };

    await this.execute(
      `INSERT INTO ai_messages (id, conversation_id, role, content, tool_calls_json, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        message.id,
        message.conversationId,
        message.role,
        message.content,
        message.toolCalls ? JSON.stringify(message.toolCalls) : null,
        message.createdAt,
      ]
    );

    // Konuşmanın `updated_at`'ini de güncelliyoruz — liste "en son
    // konuşulan önce" sıralanabilsin diye (`listConversations`).
    await this.execute(`UPDATE ai_conversations SET updated_at = ? WHERE id = ?`, [now, input.conversationId]);

    return message;
  }
}

export const aiConversationRepository: IAiConversationRepository = new AiConversationRepository();
