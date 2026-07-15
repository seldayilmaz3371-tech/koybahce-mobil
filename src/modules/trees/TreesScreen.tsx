/**
 * TreesScreen
 * =============
 * Sprint 2.4 kapsamı: SADECE listeleme (Loading/Empty/Error State,
 * mevcut sabit sıralama). Oluşturma/düzenleme/silme (TreeForm
 * entegrasyonu) ve navigasyon bu sprintin DIŞINDA — talimatta açıkça
 * listelenmedi, ayrı bir sprint konusu.
 *
 * MİMARİ KARAR: Bu ekran, `mode` prop'unu doğrudan `UseTreesOptions`
 * ile eşliyor — Parcel Mode ve Reference Mode için AYRI iki ekran
 * yazmak yerine (Kural 8: kod tekrarından kaçınma), tek, parametrik
 * bir bileşen. Reference Mode henüz hiçbir navigasyona bağlı değil
 * (bu sprintin kapsamı dışı) ama bileşen olarak zaten destekleniyor
 * ve test ediliyor.
 *
 * SAYFALAMA/SIRALAMA YOK (bilinçli): `useTrees` hook'unun bugünkü
 * tasarımında (Sprint 2.2, bu sprintte HOOK DEĞİŞTİRİLEMEZ) `loadMore`/
 * `hasMore`/`sortBy` yok — bu yüzden UI'da da yok. Parsel'deki gibi bir
 * "Daha Fazla Yükle" butonu veya sıralama seçici EKLENMEDİ.
 *
 * GLOBALIZATION POLICY: Hiçbir metin doğrudan yazılmaz.
 */

import { useTranslation } from "react-i18next";
import { useTrees, type UseTreesOptions } from "./hooks/useTrees";
import { TreeList } from "./components/TreeList";
import type { Tree } from "./domain/tree.types";

interface TreesScreenProps {
  mode: UseTreesOptions;
  /** Bir ağaça dokunulduğunda çağrılır. Bu sprintte hiçbir yere yönlendirme yapılmıyor — çağıran taraf (henüz yok) ileride bunu kullanacak. */
  onSelect?: (tree: Tree) => void;
}

export function TreesScreen({ mode, onSelect }: TreesScreenProps) {
  const { t } = useTranslation();
  const { trees, status, errorMessage } = useTrees(mode);

  const handleSelect = (tree: Tree) => {
    onSelect?.(tree);
  };

  return (
    <main className="status-screen">
      <h1 className="status-screen__title">{t("tree.title")}</h1>

      {/* Adım: Parsel ekranındaki titreşim düzeltmesiyle (Sprint öncesi
          bulgu) tutarlı — 'loading' durumunda mevcut liste gizlenmiyor,
          sadece hiç veri yokken tam ekran yükleniyor mesajı gösteriliyor. */}
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
