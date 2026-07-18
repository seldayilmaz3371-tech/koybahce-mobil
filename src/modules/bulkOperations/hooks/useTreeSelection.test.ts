// @vitest-environment jsdom
/**
 * useTreeSelection Hook Testleri
 * =================================
 * bkz. Sprint 10.2.
 */

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useTreeSelection } from "./useTreeSelection";

describe("useTreeSelection", () => {
  it("başlangıçta hiçbir ağaç seçili değil", () => {
    const { result } = renderHook(() => useTreeSelection());

    expect(result.current.selectedCount).toBe(0);
    expect(result.current.isSelected("t1")).toBe(false);
  });

  it("toggle() bir ağacı seçer, TEKRAR toggle() seçimi kaldırır", () => {
    const { result } = renderHook(() => useTreeSelection());

    act(() => result.current.toggle("t1"));
    expect(result.current.isSelected("t1")).toBe(true);
    expect(result.current.selectedCount).toBe(1);

    act(() => result.current.toggle("t1"));
    expect(result.current.isSelected("t1")).toBe(false);
    expect(result.current.selectedCount).toBe(0);
  });

  it("selectAll() TÜM verilen id'leri seçer", () => {
    const { result } = renderHook(() => useTreeSelection());
    const allIds = ["t1", "t2", "t3"];

    act(() => result.current.selectAll(allIds));

    expect(result.current.selectedCount).toBe(3);
    expect(result.current.isAllSelected(allIds)).toBe(true);
  });

  it("clear() TÜM seçimi kaldırır", () => {
    const { result } = renderHook(() => useTreeSelection());
    act(() => result.current.selectAll(["t1", "t2", "t3"]));

    act(() => result.current.clear());

    expect(result.current.selectedCount).toBe(0);
  });

  it("isAllSelected() bir tanesi bile eksikse false döner", () => {
    const { result } = renderHook(() => useTreeSelection());
    act(() => result.current.toggle("t1"));
    act(() => result.current.toggle("t2"));

    expect(result.current.isAllSelected(["t1", "t2", "t3"])).toBe(false);
  });

  it("isAllSelected() boş liste için false döner (0 ağaçlı parsel)", () => {
    const { result } = renderHook(() => useTreeSelection());

    expect(result.current.isAllSelected([])).toBe(false);
  });
});
