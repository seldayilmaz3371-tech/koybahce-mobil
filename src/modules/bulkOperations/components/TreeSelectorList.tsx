/**
 * TreeSelectorList
 * ===================
 * bkz. Sprint 10.2/10.3. Toplu İşlemler'in ortak ağaç seçim UI'ı — HEM
 * Toplu Gözlem HEM Toplu Bakım formu tarafından kullanılır.
 *
 * UX HEDEFİ: "Tüm Ağaçlara Uygula" TEK dokunuşla tüm parseli kapsar
 * (en hızlı akış — kullanıcının çoğunlukla isteyeceği durum). "Ağaç
 * Seçerek Uygula" moduna geçildiğinde checkbox listesi + "Tümünü Seç"/
 * "Seçimi Temizle" + canlı sayı gösterimi ("48 ağaç seçildi").
 *
 * Sprint 10.3 EKLENTİSİ: Arama kutusu — 500 ağaçlık bir listede belirli
 * bir ağacı BULMAK, kaydırmaktan çok daha hızlı (eldivenle/güneş
 * altında kaydırma YAVAŞLATICI bir unsur, arama DEĞİL).
 *
 * GLOBALIZATION POLICY: Hiçbir metin doğrudan yazılmaz.
 */

import { useMemo, useState } from "react";
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
  const [searchQuery, setSearchQuery] = useState("");

  // Ağaç numarası VEYA çeşit adı üzerinde, büyük/küçük harf duyarsız,
  // basit "içerir" araması — 500 ağaçlık bir listede GERÇEK zamanlı
  // filtreleme için client-side yeterli (SQL sorgusu GEREKMİYOR, zaten
  // TÜM ağaçlar hook seviyesinde belleğe yüklü).
  const filteredTrees = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return trees;
    return trees.filter(
      (tree) => tree.treeNumber.toLowerCase().includes(query) || tree.variety.toLowerCase().includes(query)
    );
  }, [trees, searchQuery]);

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
          <input
            type="text"
            className="bulk-ops__search-input"
            placeholder={t("bulkOperations.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label={t("bulkOperations.searchPlaceholder")}
          />

          <div style={{ display: "flex", gap: 8, marginTop: 8, marginBottom: 8 }}>
            <button
              type="button"
              className="lock-screen__button"
              style={{ flex: 1 }}
              onClick={() => selection.selectAll(filteredTrees.map((tree) => tree.id))}
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

          {filteredTrees.length === 0 ? (
            <p className="status-card__value">{t("bulkOperations.noSearchResults")}</p>
          ) : (
            <ul className="parcel-list bulk-ops__tree-list" style={{ maxHeight: 320, overflowY: "auto" }}>
              {filteredTrees.map((tree) => (
                <li key={tree.id}>
                  <div className="form-field--checkbox bulk-ops__checkbox-row">
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
          )}
        </div>
      ) : null}
    </div>
  );
}
