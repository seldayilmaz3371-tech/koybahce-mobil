/**
 * TreesScreen
 * =============
 * Sprint 2.5: TreeForm entegrasyonu (oluşturma/düzenleme/silme) ve
 * geri dönüş eklendi — Sprint 2.4'te sadece listelemeydi.
 *
 * MİMARİ KARAR: Bu ekran, `mode` prop'unu doğrudan `UseTreesOptions`
 * ile eşliyor — Parcel Mode ve Reference Mode için AYRI iki ekran
 * yazmak yerine (Kural 8), tek, parametrik bir bileşen.
 *
 * "EKLE" BUTONU SADECE PARCEL MODE'DA: Reference Mode, çiftlik
 * genelindeki referans ağaçları TARAMAK içindir — yeni bir ağaç
 * oluştururken hangi parsele ait olacağı belirsiz olurdu (bağlamda
 * tek bir parcelId yok). Düzenleme/silme ise Reference Mode'da da
 * çalışır — çünkü seçilen ağacın kendi `parcelId`'si zaten biliniyor
 * (TreeUpdateInput parcelId'yi hiç değiştirmiyor).
 *
 * GERİ TUŞU NOTU: Bu, Android'in FİZİKSEL geri tuşu değil — sadece
 * uygulama-içi bir "Geri" butonu (bu sprintin kapsamı: "Android Back
 * Button" DIŞARIDA bırakıldı, ayrı bir konu).
 *
 * SAYFALAMA/SIRALAMA YOK (bilinçli, Sprint 2.4'te gerekçelendirildi,
 * değişmedi): `useTrees`'te yok, UI'da da yok.
 *
 * GLOBALIZATION POLICY: Hiçbir metin doğrudan yazılmaz.
 */

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTrees, type UseTreesOptions } from "./hooks/useTrees";
import { TreeList } from "./components/TreeList";
import { TreeForm } from "./TreeForm";
import { addBackButtonListener } from "../../native/appBackButton";
import type { NewTreeInput, Tree } from "./domain/tree.types";

type TreesView = { mode: "list" } | { mode: "create" } | { mode: "edit"; tree: Tree };

interface TreesScreenProps {
  mode: UseTreesOptions;
  /** Kullanıcı "Parsellere Dön" dediğinde çağrılır — üst navigasyonu yönetir (App.tsx). */
  onBack: () => void;
}

export function TreesScreen({ mode, onBack }: TreesScreenProps) {
  const { t } = useTranslation();
  const { trees, status, errorMessage, createTree, updateTree, deactivateTree } = useTrees(mode);
  const [view, setView] = useState<TreesView>({ mode: "list" });

  useEffect(() => {
    return addBackButtonListener(() => {
      if (view.mode !== "list") {
        // Form açıkken geri tuşu = İptal.
        setView({ mode: "list" });
      } else {
        // Ağaç listesindeyiz — Parsellere dön (uygulamadan ÇIKMA,
        // sadece ParcelsScreen listedeyken çıkış yapılır).
        onBack();
      }
    });
  }, [view, onBack]);

  const handleSelect = (tree: Tree) => {
    setView({ mode: "edit", tree });
  };

  const handleSubmit = async (input: NewTreeInput) => {
    if (view.mode === "edit") {
      // GERÇEK BULGU (TreesScreen.test.tsx'teki gerçek entegrasyon
      // testinde bulundu — TypeScript bunu YAKALAMADI çünkü yapısal
      // tipleme, TreeUpdateInput'un hariç tuttuğu parcelId'nin fazladan
      // bir alan olarak sızmasına izin veriyor): `input` (NewTreeInput)
      // `parcelId` içeriyor, ama `TreeUpdateInput` (ADR 0016 gereği)
      // bunu bilerek DIŞLIYOR — bir ağacın parseli asla değişemez.
      // `parcelId`'yi burada açıkça ayıklamazsak, TreeRepository.update()
      // 'UPDATABLE_COLUMN_MAP["parcelId"]' için `undefined` bulup
      // geçersiz bir SQL üretir ("no such column: undefined").
      const { parcelId: _parcelId, ...changes } = input;
      await updateTree(view.tree.id, changes);
    } else {
      await createTree(input);
    }
    setView({ mode: "list" });
  };

  const handleDelete = async () => {
    if (view.mode !== "edit") return;
    await deactivateTree(view.tree.id);
    setView({ mode: "list" });
  };

  if (view.mode === "create" || view.mode === "edit") {
    // Oluşturma modu sadece Parcel Mode'dan erişilebilir (Ekle butonu
    // zaten sadece o modda gösteriliyor) — bu yüzden `mode.mode ===
    // "parcel"` garantili. Düzenleme modunda parcelId, seçilen
    // ağacın kendisinden geliyor (Reference Mode'da bile çalışır).
    const parcelId = view.mode === "edit" ? view.tree.parcelId : mode.mode === "parcel" ? mode.parcelId : "";

    return (
      <TreeForm
        parcelId={parcelId}
        initialValue={view.mode === "edit" ? view.tree : undefined}
        onSubmit={handleSubmit}
        onCancel={() => setView({ mode: "list" })}
        onDelete={view.mode === "edit" ? handleDelete : undefined}
      />
    );
  }

  return (
    <main className="status-screen">
      <button type="button" className="lock-screen__button" onClick={onBack}>
        {t("tree.backButton")}
      </button>

      <h1 className="status-screen__title">{t("tree.title")}</h1>

      {mode.mode === "parcel" ? (
        <button
          type="button"
          className="lock-screen__button"
          onClick={() => setView({ mode: "create" })}
        >
          {t("tree.addButton")}
        </button>
      ) : null}

      {status === "idle" || (status === "loading" && trees.length === 0) ? (
        <p className="status-card__value">{t("common.loading")}</p>
      ) : null}

      {status === "error" ? (
        <div className="status-card status-card--error">
          <p className="status-card__value">{errorMessage}</p>
        </div>
      ) : null}

      {status === "ready" && trees.length === 0 ? (
        <p className="status-card__value">{t("tree.emptyState")}</p>
      ) : null}

      {trees.length > 0 ? (
        <>
          <TreeList trees={trees} onSelect={handleSelect} />
          {status === "loading" ? (
            <p className="status-card__value">{t("common.loading")}</p>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
