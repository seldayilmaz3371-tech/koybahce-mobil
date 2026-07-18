/**
 * TreeSelectorList
 * ===================
 * bkz. Sprint 10.2. Toplu İşlemler'in ortak ağaç seçim UI'ı — HEM
 * Toplu Gözlem HEM Toplu Bakım formu tarafından kullanılır.
 *
 * UX HEDEFİ: "Tüm Ağaçlara Uygula" TEK dokunuşla tüm parseli kapsar
 * (en hızlı akış — kullanıcının çoğunlukla isteyeceği durum). "Ağaç
 * Seçerek Uygula" moduna geçildiğinde checkbox listesi + "Tümünü Seç"/
 * "Seçimi Temizle" + canlı sayı gösterimi ("48 ağaç seçildi").
 *
 * GLOBALIZATION POLICY: Hiçbir metin doğrudan yazılmaz.
 */

import { useTranslation } from "react-i18next";
import type { UseTreeSelectionResult } from "../hooks/useTreeSelection";
import type { Tree } from "../../trees/domain/tree.types";

export type TreeSelectionMode = "all" | "select";

interface TreeSelectorListProps {
  trees: Tree[];
  mode: TreeSelectionMode;
  onModeChange: (mode: TreeSelectionMode) => void;
  selection: UseTreeSelectionResult;
}

export function TreeSelectorList({ trees, mode, onModeChange, selection }: TreeSelectorListProps) {
  const { t } = useTranslation();
  const allTreeIds = trees.map((tree) => tree.id);

  return (
    <div>
      <button
        type="button"
        className="lock-screen__button"
        aria-pressed={mode === "all"}
        style={mode === "all" ? { border: "2px solid var(--color-primary)" } : undefined}
        onClick={() => onModeChange("all")}
      >
        {t("bulkOperations.applyToAll", { count: trees.length })}
      </button>
      <button
        type="button"
        className="lock-screen__button"
        aria-pressed={mode === "select"}
        style={{ marginTop: 8, ...(mode === "select" ? { border: "2px solid var(--color-primary)" } : {}) }}
        onClick={() => onModeChange("select")}
      >
        {t("bulkOperations.applyToSelected")}
      </button>

      {mode === "select" ? (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <button
              type="button"
              className="lock-screen__button"
              style={{ flex: 1 }}
              onClick={() => selection.selectAll(allTreeIds)}
            >
              {t("bulkOperations.selectAllButton")}
            </button>
            <button
              type="button"
              className="lock-screen__button"
              style={{ flex: 1 }}
              onClick={() => selection.clear()}
            >
              {t("bulkOperations.clearSelectionButton")}
            </button>
          </div>

          <p className="status-card__value" style={{ fontSize: 14 }}>
            {t("bulkOperations.selectedCount", { count: selection.selectedCount })}
          </p>

          <ul className="parcel-list" style={{ maxHeight: 320, overflowY: "auto" }}>
            {trees.map((tree) => (
              <li key={tree.id}>
                <div className="form-field--checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={selection.isSelected(tree.id)}
                      onChange={() => selection.toggle(tree.id)}
                    />
                    {tree.treeNumber} · {tree.variety}
                  </label>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
