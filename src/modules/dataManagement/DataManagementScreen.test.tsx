// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import en from "../../i18n/locales/en/common.json";
import { DataManagementScreen } from "./DataManagementScreen";

const createFullBackupMock = vi.fn();
const shareMock = vi.fn();
const pickFilesMock = vi.fn();
const readFileMock = vi.fn();
const validateAndParseBackupMock = vi.fn();
const restoreFromBackupMock = vi.fn();

vi.mock("./services/backupService", () => ({
  createFullBackup: (...args: unknown[]) => createFullBackupMock(...args),
}));
vi.mock("@capacitor/share", () => ({
  Share: { share: (...args: unknown[]) => shareMock(...args) },
}));
vi.mock("@capawesome/capacitor-file-picker", () => ({
  FilePicker: { pickFiles: (...args: unknown[]) => pickFilesMock(...args) },
}));
vi.mock("@capacitor/filesystem", () => ({
  Filesystem: { readFile: (...args: unknown[]) => readFileMock(...args) },
}));
vi.mock("./services/restoreService", () => ({
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

beforeAll(async () => {
  await i18n.use(initReactI18next).init({
    resources: { en: { translation: en } },
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });
});

beforeEach(() => {
  createFullBackupMock.mockReset().mockResolvedValue({ success: true, filePath: "file:///cache/test.zip" });
  shareMock.mockReset().mockResolvedValue(undefined);
  pickFilesMock.mockReset().mockResolvedValue({ files: [{ path: "/data/backup.zip", name: "backup.zip" }] });
  readFileMock.mockReset().mockResolvedValue({ data: "RkFLRQ==" });
  validateAndParseBackupMock.mockReset().mockResolvedValue(FAKE_PARSED_BACKUP);
  restoreFromBackupMock
    .mockReset()
    .mockResolvedValue({ success: true, photosRestoredCount: 0, photosFailedCount: 0 });
  vi.spyOn(window, "confirm").mockReturnValue(true);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("DataManagementScreen — Tam Yedek Oluştur", () => {
  it("her iki butonu da GERÇEKTEN gösterir", () => {
    render(<DataManagementScreen onBack={vi.fn()} />);

    expect(screen.getByText("Create Full Backup")).toBeTruthy();
    expect(screen.getByText("Restore from Backup")).toBeTruthy();
  });

  it("🔴 'Create Full Backup'a basmak, GERÇEKTEN backup akışını çalıştırır ve BAŞARI mesajını gösterir", async () => {
    render(<DataManagementScreen onBack={vi.fn()} />);

    await act(async () => {
      fireEvent.click(screen.getByText("Create Full Backup"));
    });

    await waitFor(() => expect(screen.getByText("Backup created successfully")).toBeTruthy());
    expect(createFullBackupMock).toHaveBeenCalledTimes(1);
    expect(shareMock).toHaveBeenCalledTimes(1);
  });

  it("backup BAŞARISIZ OLURSA, GERÇEK hata mesajı gösterilir", async () => {
    createFullBackupMock.mockResolvedValue({ success: false, errorCode: "DM_001" });
    render(<DataManagementScreen onBack={vi.fn()} />);

    await act(async () => {
      fireEvent.click(screen.getByText("Create Full Backup"));
    });

    await waitFor(() => expect(screen.getByText("Backup could not be created. Please try again.")).toBeTruthy());
  });
});

describe("DataManagementScreen — Yedekten Geri Yükle", () => {
  it("🔴 GEÇERLİ bir ZIP seçilince, kullanıcıya KESİN talimattaki UYARI metni GERÇEKTEN gösterilir (window.confirm)", async () => {
    render(<DataManagementScreen onBack={vi.fn()} />);

    await act(async () => {
      fireEvent.click(screen.getByText("Restore from Backup"));
    });
    await waitFor(() => expect(screen.getByText("Continue")).toBeTruthy());

    await act(async () => {
      fireEvent.click(screen.getByText("Continue"));
    });

    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining("Your current data will be replaced."));
    expect(window.confirm).toHaveBeenCalledWith(
      expect.stringContaining("A safety backup will be created automatically before continuing.")
    );
  });

  it("🔴 kullanıcı window.confirm'de İPTAL EDERSE, restoreFromBackup HİÇ ÇAĞRILMAZ", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<DataManagementScreen onBack={vi.fn()} />);

    await act(async () => {
      fireEvent.click(screen.getByText("Restore from Backup"));
    });
    await waitFor(() => expect(screen.getByText("Continue")).toBeTruthy());

    await act(async () => {
      fireEvent.click(screen.getByText("Continue"));
    });

    expect(restoreFromBackupMock).not.toHaveBeenCalled();
  });

  it("🔴 kullanıcı ONAYLARSA, restoreFromBackup GERÇEKTEN çağrılır, BAŞARI mesajı gösterilir", async () => {
    render(<DataManagementScreen onBack={vi.fn()} />);

    await act(async () => {
      fireEvent.click(screen.getByText("Restore from Backup"));
    });
    await waitFor(() => expect(screen.getByText("Continue")).toBeTruthy());

    await act(async () => {
      fireEvent.click(screen.getByText("Continue"));
    });

    await waitFor(() => expect(screen.getByText("Restore completed successfully")).toBeTruthy());
    expect(restoreFromBackupMock).toHaveBeenCalledTimes(1);
  });

  it("GEÇERSİZ bir ZIP seçilirse, GERÇEK hata mesajı gösterilir (window.confirm HİÇ açılmaz)", async () => {
    validateAndParseBackupMock.mockResolvedValue(null);
    render(<DataManagementScreen onBack={vi.fn()} />);

    await act(async () => {
      fireEvent.click(screen.getByText("Restore from Backup"));
    });

    await waitFor(() => expect(screen.getByText("This file is not a valid Bahçem Mobile backup.")).toBeTruthy());
    expect(window.confirm).not.toHaveBeenCalled();
  });
});

describe("DataManagementScreen — 'Back' Butonu", () => {
  it("'Back' butonuna basmak onBack'i çağırır", async () => {
    const onBack = vi.fn();
    render(<DataManagementScreen onBack={onBack} />);

    fireEvent.click(screen.getByText("Back"));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
