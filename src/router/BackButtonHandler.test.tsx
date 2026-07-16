// @vitest-environment jsdom
/**
 * useBackButtonFallback Testleri
 * =================================
 * bkz. Sprint 4.0 mimari analizi — "çift dinleyici çakışması" riskinin
 * yapısal olarak imkansız olduğunu kanıtlıyor.
 */

import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useBackButtonFallback } from "./BackButtonHandler";

const backButtonListeners: Array<() => void> = [];
const removeMocks: Array<ReturnType<typeof vi.fn>> = [];

vi.mock("@capacitor/app", () => ({
  App: {
    addListener: vi.fn((_e: string, cb: () => void) => {
      backButtonListeners.push(cb);
      const removeMock = vi.fn();
      removeMocks.push(removeMock);
      return Promise.resolve({ remove: removeMock });
    }),
    exitApp: vi.fn(),
  },
}));

beforeEach(() => {
  backButtonListeners.length = 0;
  removeMocks.length = 0;
});

afterEach(() => {
  cleanup();
});

function TestComponent({ active, onBack }: { active: boolean; onBack: () => void }) {
  useBackButtonFallback(active, onBack);
  return null;
}

describe("useBackButtonFallback", () => {
  it("active=true iken dinleyici kaydeder", async () => {
    render(<TestComponent active={true} onBack={vi.fn()} />);
    await act(async () => {});
    expect(backButtonListeners).toHaveLength(1);
  });

  it("active=false iken hiç dinleyici kaydetmez", async () => {
    render(<TestComponent active={false} onBack={vi.fn()} />);
    await act(async () => {});
    expect(backButtonListeners).toHaveLength(0);
  });

  it("active true→false geçişinde dinleyiciyi KALDIRIR (çakışma önlemesi)", async () => {
    const { rerender } = render(<TestComponent active={true} onBack={vi.fn()} />);
    await act(async () => {});
    expect(backButtonListeners).toHaveLength(1);

    rerender(<TestComponent active={false} onBack={vi.fn()} />);
    await act(async () => {});

    // Dinleyici kaldırıldı (native `remove()` çağrıldı) — bu, gerçek
    // ekranın kendi dinleyicisiyle AYNI ANDA aktif olmasını yapısal
    // olarak imkansız kılan mekanizma.
    expect(removeMocks[0]).toHaveBeenCalledTimes(1);
  });

  it("unmount olduğunda dinleyiciyi kaldırır", async () => {
    const { unmount } = render(<TestComponent active={true} onBack={vi.fn()} />);
    await act(async () => {});

    unmount();
    // `addBackButtonListener`'ın temizleme fonksiyonu ASENKRON
    // (`listenerPromise.then(...)`, await edilmiyor) — mikro-görev
    // kuyruğunun boşalması için bir tık bekliyoruz.
    await act(async () => {});

    expect(removeMocks[0]).toHaveBeenCalledTimes(1);
  });

  it("dinleyici tetiklendiğinde onBack çağrılır", async () => {
    const onBack = vi.fn();
    render(<TestComponent active={true} onBack={onBack} />);
    await act(async () => {});

    act(() => backButtonListeners[0]());

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
