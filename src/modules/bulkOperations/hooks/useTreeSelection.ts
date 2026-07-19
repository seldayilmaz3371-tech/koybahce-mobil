/**
 * useTreeSelection Hook
 * ========================
 * bkz. Sprint 10.2/10.3. Ağaç seçim state'i (Toplu İşlemler UI'ının
 * ortak çekirdeği — HEM Toplu Gözlem HEM Toplu Bakım tarafından
 * kullanılır, kod tekrarından kaçınma).
 *
 * UX HEDEFİ (kullanıcının kesin talebi): 50-500 ağacı 30-60 saniyede
 * işaretleyip tamamlama. Bu yüzden: `Set` tabanlı O(1) toggle,
 * "Tümünü Seç"/"Seçimi Temizle" TEK tıkla.
 *
 * `initialSelectedIds` (Sprint 10.3, Ardışık İşlem Sihirbazı) —
 * `useState`'in KENDİ başlangıç değeri olarak verildi (lazy initializer),
 * `useEffect` KULLANILMADI — bu, `oxlint`'in `react-hooks(exhaustive-deps)`
 * uyarısını GERÇEKTEN önleyen, DAHA DOĞRU bir React deseni (mount
 * sırasında bir kez uygulanan başlangıç state'i için `useEffect`
 * GEREKMEZ).
 */

import { useCallback, useMemo, useState } from "react";

export interface UseTreeSelectionResult {
  selectedIds: Set<string>;
  isSelected: (treeId: string) => boolean;
  toggle: (treeId: string) => void;
  selectAll: (allTreeIds: string[]) => void;
  clear: () => void;
  selectedCount: number;
  isAllSelected: (allTreeIds: string[]) => boolean;
}

export function useTreeSelection(initialSelectedIds?: string[]): UseTreeSelectionResult {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(initialSelectedIds ?? []));

  const isSelected = useCallback((treeId: string) => selectedIds.has(treeId), [selectedIds]);

  const toggle = useCallback((treeId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(treeId)) {
        next.delete(treeId);
      } else {
        next.add(treeId);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((allTreeIds: string[]) => {
    setSelectedIds(new Set(allTreeIds));
  }, []);

  const clear = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isAllSelected = useCallback(
    (allTreeIds: string[]) => allTreeIds.length > 0 && allTreeIds.every((id) => selectedIds.has(id)),
    [selectedIds]
  );

  const selectedCount = useMemo(() => selectedIds.size, [selectedIds]);

  return { selectedIds, isSelected, toggle, selectAll, clear, selectedCount, isAllSelected };
}
