// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useRestore } from "./useRestore";

const pickFilesMock = vi.fn();
const readFileMock = vi.fn();
const validateAndParseBackupMock = vi.fn();
const restoreFromBackupMock = vi.fn();

vi.mock("@capawesome/capacitor-file-picker", () => ({
  FilePicker: { pickFiles: (...args: unknown[]) => pickFilesMock(...args) },
}));

vi.mock("@capacitor/filesystem", () => ({
  Filesystem: { readFile: (...args: unknown[]) => readFileMock(...args) },
}));

vi.mock("../services/restoreService", () => ({
  validateAndParseBackup: (...args: unknown[]) => validateAndParseBackupMock(...args),
  restoreFromBackup: (...args: unknown[]) => restoreFromBackupMock(...args),
}));

const FAKE_PARSED_BACKUP = {
  manifest: {
    signature: "BahcemMobileBackup",
    appVersion: "0.1.0",
    createdAt: "2026-07-22",
    schemaVersion: 12,
    photoCount: 0,
  },
  databaseJson: {},
  photoEntries: [],
};

beforeEach(() => {
  pickFilesMock.mockReset().mockResolvedValue({ files: [{ path: "/data/picked-backup.zip", name: "backup.zip" }] });
  readFileMock.mockReset().mockResolvedValue({ data: "RkFLRV9aSVA=" });
  validateAndParseBackupMock.mockReset().mockResolvedValue(FAKE_PARSED_BACKUP);
  restoreFromBackupMock.mockReset().mockResolvedValue({ success: true, photosRestoredCount: 0, photosFailedCount: 0 });
});

describe("useRestore", () => {
  it("başlangıçta 'idle' durumundadır", () => {
    const { result } = renderHook(() => useRestore());

    expect(result.current.status).toBe("idle");
  });

  it("🔴 GEÇERLİ bir yedek SEÇİLİRSE, GERÇEKTEN 'awaiting_confirmation' durumuna geçer (henüz geri YÜKLEMEZ)", async () => {
    const { result } = renderHook(() => useRestore());

    await act(async () => {
      await result.current.pickAndValidate();
    });

    expect(result.current.status).toBe("awaiting_confirmation");
    expect(restoreFromBackupMock).not.toHaveBeenCalled();
  });

  it("🔴 GEÇERSİZ bir ZIP SEÇİLİRSE (doğrulama null döner), DM_002 ile 'error' durumuna geçer — İŞLEM İPTAL", async () => {
    validateAndParseBackupMock.mockResolvedValue(null);
    const { result } = renderHook(() => useRestore());

    await act(async () => {
      await result.current.pickAndValidate();
    });

    expect(result.current.status).toBe("error");
    expect(result.current.errorCode).toBe("DM_002");
  });

  it("kullanıcı dosya seçimini İPTAL EDERSE (files boş), DM_006 ile 'error' durumuna geçer", async () => {
    pickFilesMock.mockResolvedValue({ files: [] });
    const { result } = renderHook(() => useRestore());

    await act(async () => {
      await result.current.pickAndValidate();
    });

    expect(result.current.status).toBe("error");
    expect(result.current.errorCode).toBe("DM_006");
  });

  it("🔴 confirmAndRestore(), GERÇEKTEN restoreFromBackup()'ı DOĞRULANMIŞ yedekle çağırır, BAŞARILI olursa 'success' olur", async () => {
    const { result } = renderHook(() => useRestore());
    await act(async () => {
      await result.current.pickAndValidate();
    });
    await waitFor(() => expect(result.current.status).toBe("awaiting_confirmation"));

    await act(async () => {
      await result.current.confirmAndRestore();
    });

    expect(restoreFromBackupMock).toHaveBeenCalledWith(FAKE_PARSED_BACKUP, expect.any(Function));
    expect(result.current.status).toBe("success");
  });

  it("confirmAndRestore(), henüz DOĞRULANMIŞ bir yedek YOKKEN çağrılırsa hiçbir şey YAPMAZ (çökme yok)", async () => {
    const { result } = renderHook(() => useRestore());

    await act(async () => {
      await result.current.confirmAndRestore();
    });

    expect(restoreFromBackupMock).not.toHaveBeenCalled();
    expect(result.current.status).toBe("idle");
  });

  it("restoreFromBackup BAŞARISIZ dönerse, GERÇEK hata kodu (failedStage'e göre) 'error' durumuna yansır", async () => {
    restoreFromBackupMock.mockResolvedValue({
      success: false,
      errorCode: "DM_003",
      failedStage: "creating_safety_backup",
    });
    const { result } = renderHook(() => useRestore());
    await act(async () => {
      await result.current.pickAndValidate();
    });

    await act(async () => {
      await result.current.confirmAndRestore();
    });

    expect(result.current.status).toBe("error");
    expect(result.current.errorCode).toBe("DM_003");
  });

  it("🔴 onProgress callback'i GERÇEKTEN çağrıldığında, hook'un progress state'i GÜNCELLENİR", async () => {
    restoreFromBackupMock.mockImplementation(async (_parsed: unknown, onProgress: (p: unknown) => void) => {
      onProgress({ stage: "restoring_database" });
      return { success: true, photosRestoredCount: 0, photosFailedCount: 0 };
    });
    const { result } = renderHook(() => useRestore());
    await act(async () => {
      await result.current.pickAndValidate();
    });

    await act(async () => {
      await result.current.confirmAndRestore();
    });

    expect(result.current.progress).toEqual({ stage: "restoring_database" });
  });

  it("reset(), TÜM state'i GERÇEKTEN başlangıç durumuna döndürür", async () => {
    const { result } = renderHook(() => useRestore());
    await act(async () => {
      await result.current.pickAndValidate();
    });
    await waitFor(() => expect(result.current.status).toBe("awaiting_confirmation"));

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe("idle");
    expect(result.current.errorCode).toBeNull();
    expect(result.current.progress).toBeNull();

    // reset SONRASI confirmAndRestore çağrılsa bile artık HİÇBİR ŞEY olmaz (parsedBackup temizlendi).
    await act(async () => {
      await result.current.confirmAndRestore();
    });
    expect(restoreFromBackupMock).not.toHaveBeenCalled();
  });
});
