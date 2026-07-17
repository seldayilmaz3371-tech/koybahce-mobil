/**
 * AiConversationRepository Testleri
 * ====================================
 * bkz. ADR 0024, Sprint 6.
 */

import { beforeEach, afterEach, describe, expect, it } from "vitest";
import {
  setDatabaseExecutorProviderForTesting,
  resetDatabaseExecutorProviderForTesting,
} from "../../../data/repositories/base.repository";
import { createTestDatabaseExecutor } from "../../../data/db/testDatabaseExecutor";
import { SCHEMA_MIGRATIONS } from "../../../data/db/migrations/schema";
import { aiConversationRepository } from "./aiConversation.repository";
import { AiMessageRole } from "../domain/ai.types";

const ALL_SCHEMA_STATEMENTS = SCHEMA_MIGRATIONS.flatMap((m) => m.statements);

beforeEach(() => {
  const executor = createTestDatabaseExecutor(ALL_SCHEMA_STATEMENTS);
  setDatabaseExecutorProviderForTesting(async () => executor);
});

afterEach(() => {
  resetDatabaseExecutorProviderForTesting();
});

describe("AiConversationRepository — Konuşmalar", () => {
  it("createConversation() sonrası getConversationById() ile aynı kaydı döndürür", async () => {
    const created = await aiConversationRepository.createConversation({ title: "Sulama Sorusu" });

    const found = await aiConversationRepository.getConversationById(created.id);

    expect(found).toMatchObject({ title: "Sulama Sorusu", isActive: true });
  });

  it("title verilmeden (isteğe bağlı) konuşma oluşturulabilir", async () => {
    const created = await aiConversationRepository.createConversation();
    expect(created.title).toBeNull();
  });

  it("listConversations() en son güncellenen (updated_at) önce sıralanır", async () => {
    const first = await aiConversationRepository.createConversation({ title: "İlk" });
    await new Promise((resolve) => setTimeout(resolve, 5));
    const second = await aiConversationRepository.createConversation({ title: "İkinci" });
    await new Promise((resolve) => setTimeout(resolve, 5));
    // İlk konuşmaya yeni bir mesaj eklemek onun updated_at'ini günceller
    // — bu yüzden `second`'dan daha SONRA güncellenmiş olmalı.
    await aiConversationRepository.addMessage({
      conversationId: first.id,
      role: AiMessageRole.User,
      content: "test",
    });

    const list = await aiConversationRepository.listConversations();

    expect(list[0].id).toBe(first.id); // en son mesaj alan konuşma önde
    expect(list[1].id).toBe(second.id);
  });

  it("deactivateConversation() sonrası listConversations() bu konuşmayı göstermez", async () => {
    const created = await aiConversationRepository.createConversation();

    await aiConversationRepository.deactivateConversation(created.id);

    const list = await aiConversationRepository.listConversations();
    expect(list).toHaveLength(0);
  });

  it("getConversationById() var olmayan id için null döner", async () => {
    const result = await aiConversationRepository.getConversationById("olmayan-id");
    expect(result).toBeNull();
  });
});

describe("AiConversationRepository — Mesajlar", () => {
  it("addMessage() sonrası listMessages() ile aynı mesaj bulunur", async () => {
    const conversation = await aiConversationRepository.createConversation();

    await aiConversationRepository.addMessage({
      conversationId: conversation.id,
      role: AiMessageRole.User,
      content: "Bu ay kaç sulama yaptım?",
    });

    const messages = await aiConversationRepository.listMessages(conversation.id);
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({ role: "user", content: "Bu ay kaç sulama yaptım?" });
  });

  it("mesajlar kronolojik sırayla (ASC) döner", async () => {
    const conversation = await aiConversationRepository.createConversation();
    await aiConversationRepository.addMessage({
      conversationId: conversation.id,
      role: AiMessageRole.User,
      content: "1. mesaj",
    });
    await aiConversationRepository.addMessage({
      conversationId: conversation.id,
      role: AiMessageRole.Model,
      content: "2. mesaj",
    });

    const messages = await aiConversationRepository.listMessages(conversation.id);
    expect(messages.map((m) => m.content)).toEqual(["1. mesaj", "2. mesaj"]);
  });

  it("toolCalls verilirse JSON olarak saklanır ve GERÇEKTEN doğru şekilde geri okunur", async () => {
    const conversation = await aiConversationRepository.createConversation();

    await aiConversationRepository.addMessage({
      conversationId: conversation.id,
      role: AiMessageRole.Model,
      content: "",
      toolCalls: [{ toolName: "queryParcelData", arguments: { parcelId: "p1" } }],
    });

    const messages = await aiConversationRepository.listMessages(conversation.id);
    expect(messages[0].toolCalls).toEqual([{ toolName: "queryParcelData", arguments: { parcelId: "p1" } }]);
  });

  it("toolCalls verilmezse null olarak saklanır (JSON serileştirme hatası YOK)", async () => {
    const conversation = await aiConversationRepository.createConversation();

    await aiConversationRepository.addMessage({
      conversationId: conversation.id,
      role: AiMessageRole.User,
      content: "normal mesaj",
    });

    const messages = await aiConversationRepository.listMessages(conversation.id);
    expect(messages[0].toolCalls).toBeNull();
  });

  it("role CHECK kısıtı geçersiz bir değeri reddeder", async () => {
    const conversation = await aiConversationRepository.createConversation();
    await expect(
      aiConversationRepository.addMessage({
        conversationId: conversation.id,
        // @ts-expect-error - bilerek geçersiz bir tip deneniyor
        role: "system",
        content: "test",
      })
    ).rejects.toThrow();
  });

  it("var olmayan bir conversationId ile mesaj eklemek FOREIGN KEY kısıtı nedeniyle reddedilir (ADR 0022)", async () => {
    await expect(
      aiConversationRepository.addMessage({
        conversationId: "var-olmayan-konusma",
        role: AiMessageRole.User,
        content: "test",
      })
    ).rejects.toThrow();
  });

  it("addMessage() konuşmanın updated_at'ini de günceller", async () => {
    const conversation = await aiConversationRepository.createConversation();
    const originalUpdatedAt = conversation.updatedAt;

    await new Promise((resolve) => setTimeout(resolve, 5));
    await aiConversationRepository.addMessage({
      conversationId: conversation.id,
      role: AiMessageRole.User,
      content: "test",
    });

    const updated = await aiConversationRepository.getConversationById(conversation.id);
    expect(updated!.updatedAt).not.toBe(originalUpdatedAt);
  });
});
