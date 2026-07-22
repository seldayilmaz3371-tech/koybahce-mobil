// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBackup } from "./useBackup";

const createFullBackupMock = vi.fn();
const shareMock = vi.fn();

vi.mock("../services/backupService", () => ({
  createFullBackup: (...args: unknown[]) => createFullBackupMock(...args),
}));

vi.mock("@capacitor/share", () => ({
  Share: { share: (...args: unknown[]) => shareMock(...args) },
}));

beforeEach(() => {
  createFullBackupMock.mockReset().mockResolvedValue({ success: true, filePath: "file:///cache/test.zip" });
  shareMock.mockReset().mockResolvedValue(undefined);
});

describe("useBackup", () => {
  it("başlangıçta 'idle' durumundadır", () => {
    const { result } = renderHook(() => useBackup());

    expect(result.current.status).toBe("idle");
    expect(result.current.errorCode).toBeNull();
  });

  it("🔴 BAŞARILI senaryo: createBackup() çağrılınca, GERÇEKTEN createFullBackup + Share.share SIRAYLA çağrılır, durum 'success' olur", async () => {
    const { result } = renderHook(() => useBackup());

    await act(async () => {
      await result.current.createBackup();
    });

    expect(createFullBackupMock).toHaveBeenCalledTimes(1);
    expect(shareMock).toHaveBeenCalledWith({ files: ["file:///cache/test.zip"], title: "Bahçem Mobile Yedek" });
    expect(result.current.status).toBe("success");
  });

  it("backupService BAŞARISIZ dönerse (success:false), Share.share HİÇ ÇAĞRILMAZ, durum 'error' olur", async () => {
    createFullBackupMock.mockResolvedValue({ success: false, errorCode: "DM_001" });
    const { result } = renderHook(() => useBackup());

    await act(async () => {
      await result.current.createBackup();
    });

    expect(shareMock).not.toHaveBeenCalled();
    expect(result.current.status).toBe("error");
    expect(result.current.errorCode).toBe("DM_001");
  });

  it("Share.share BAŞARISIZ OLURSA (kullanıcı paylaşımı iptal etti/native hata), çökme YOK, durum 'error' olur", async () => {
    shareMock.mockRejectedValue(new Error("kullanıcı iptal etti"));
    const { result } = renderHook(() => useBackup());

    await act(async () => {
      await result.current.createBackup();
    });

    expect(result.current.status).toBe("error");
  });

  it("reset(), durumu ve hata kodunu GERÇEKTEN başlangıç durumuna döndürür", async () => {
    createFullBackupMock.mockResolvedValue({ success: false, errorCode: "DM_001" });
    const { result } = renderHook(() => useBackup());
    await act(async () => {
      await result.current.createBackup();
    });
    await waitFor(() => expect(result.current.status).toBe("error"));

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe("idle");
    expect(result.current.errorCode).toBeNull();
  });
});
