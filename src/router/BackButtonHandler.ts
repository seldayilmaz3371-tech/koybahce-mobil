/**
 * Geri Tuşu Boşluk-Kapatıcı (BackButtonHandler)
 * =================================================
 * bkz. Sprint 4.0 mimari analizi (2026-07-15).
 *
 * ÇÖZDÜĞÜ SORUN: Her Screen bileşeni (`ParcelsScreen`, `TreesScreen`,
 * `ObservationScreen`, `PhotoGalleryScreen`) KENDİ geri tuşu
 * dinleyicisini taşır (`native/appBackButton.ts` — DEĞİŞMEDİ). Ama
 * bazı route sarmalayıcılar (ör. `ObservationScreenRoute`), gerçek
 * ekranı monte etmeden önce KISA bir süre veri çekiyor (ör. `treeId`'den
 * `Tree` nesnesini bulma — `ObservationScreen`'in `parcelId`/
 * `contextLabel` prop'ları için zorunlu). Bu YÜKLENIYOR anında,
 * gerçek ekran henüz monte olmadığı için KENDİ dinleyicisi de kayıtlı
 * değildir — geri tuşu hiçbir şey yapmaz.
 *
 * TASARIM KISITI (çakışma riskini önlemek için): Bu hook'un dinleyicisi
 * SADECE `active=true` iken kayıtlıdır. Gerçek ekran monte olur
 * olmaz (yükleme biter, `active` false olur), bu dinleyici HEMEN
 * kaldırılır — aynı anda İKİ dinleyicinin (bu ve ekranın kendisi)
 * birden aktif olup ÇİFT TETİKLENMESİ (double-fire) yapısal olarak
 * imkansız hale gelir.
 */

import { useEffect } from "react";
import { addBackButtonListener } from "../native/appBackButton";

export function useBackButtonFallback(active: boolean, onBack: () => void): void {
  useEffect(() => {
    if (!active) return;
    return addBackButtonListener(onBack);
  }, [active, onBack]);
}
