/**
 * TreeList — Liste Render Bileşeni
 * ===================================
 * `ParcelList` ile BİLEREK aynı desen (Kural 12) — liste render
 * sorumluluğu `TreesScreen`'den ayrı tutuluyor (Modül 2 Mimari
 * Doğrulaması madde 7: ileride sanallaştırma gerekirse tek nokta
 * değişsin).
 */

import { useTranslation } from "react-i18next";
import type { Tree } from "../domain/tree.types";

interface TreeListProps {
  trees: Tree[];
  onSelect: (tree: Tree) => void;
}

export function TreeList({ trees, onSelect }: TreeListProps) {
  const { t } = useTranslation();

  return (
    <ul className="parcel-list">
      {trees.map((tree) => (
        <li key={tree.id}>
          <button
            type="button"
            className="parcel-list__item"
            onClick={() => onSelect(tree)}
            aria-label={
              tree.isReferenceTree
                ? `${tree.treeNumber}, ${tree.variety}, ${t("tree.isReferenceTree")}`
                : `${tree.treeNumber}, ${tree.variety}`
            }
          >
            <span className="parcel-list__name">{tree.treeNumber}</span>
            <span className="parcel-list__meta">
              {tree.variety}
              {tree.isReferenceTree ? ` · ${t("tree.isReferenceTree")}` : ""}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
