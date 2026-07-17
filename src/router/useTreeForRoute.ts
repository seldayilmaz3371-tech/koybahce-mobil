/**
 * useTreeForRoute
 * ==================
 * bkz. `engineering-protocol.md` Bölüm 21 — "Eğer gelecekte 2. veya
 * 3. bir route wrapper da benzer bir doğrudan repository erişimine
 * ihtiyaç duyarsa, bu artık bir desen haline gelir ve o zaman gerçek
 * bir soyutlama değerlendirilmelidir." Sprint 5.3'te 2. tekrar
 * (`TreeMaintenanceScreenRoute`) BİLEREK ertelenmişti ("❌ Refactor"
 * yasağı gereği). Sprint 7.1'de **3. tekrar** (`TreeAiChatScreenRoute`)
 * gerçekleşti — eşik AŞILDI, şimdi gerçek soyutlama yapılıyor.
 *
 * `ObservationScreenRoute`/`TreeMaintenanceScreenRoute`'un mantığı
 * BİREBİR buraya taşındı (davranış DEĞİŞMEDİ — saf bir çıkarma,
 * "refactor" ama YENİ bir davranış EKLEMİYOR, sadece kod tekrarını
 * ortadan kaldırıyor).
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { treeRepository } from "../modules/trees/data/tree.repository";
import type { Tree } from "../modules/trees/domain/tree.types";
import { useBackButtonFallback } from "./BackButtonHandler";

/** `"loading"` → yükleniyor, `null` → bulunamadı (silinmiş/geçersiz id), `Tree` → hazır. */
export function useTreeForRoute(treeId: string | undefined): Tree | null | "loading" {
  const navigate = useNavigate();
  const [tree, setTree] = useState<Tree | null | "loading">("loading");

  useEffect(() => {
    if (!treeId) return;
    let cancelled = false;
    setTree("loading");
    treeRepository.getById(treeId).then((result) => {
      if (!cancelled) setTree(result);
    });
    return () => {
      cancelled = true;
    };
  }, [treeId]);

  useBackButtonFallback(tree === "loading", () => navigate(-1));

  return tree;
}
