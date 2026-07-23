/**
 * SettingsScreen
 * =================
 * bkz. Sprint 7.1 (kullanıcı kararı, 2026-07-17): "Bahçem Mobile
 * ileride Genel Ayarlar/AI/Bildirimler/Dil/Tema/GPS/Kamera/
 * Senkronizasyon/Yedekleme gibi birçok ayar ekranına sahip olacak...
 * bugünden gerçek bir Settings mimarisi düşünülmeli... route mimarisi
 * ileride buna izin vermeli."
 *
 * Bu ekran, gelecekteki TÜM ayar bölümlerinin listeleneceği HUB'dır
 * (`/settings`). Sprint 10.13'te **Veri Yönetimi**, Sprint 10.18'de
 * **Dil** eklendi. Diğer bölümler (Bildirimler/Tema/GPS/Kamera/
 * Senkronizasyon) HENÜZ geliştirilmedi (YAGNI — spekülatif boş
 * girişler eklenmedi). Yeni bir bölüm eklendiğinde, bu listeye YENİ
 * bir satır eklemek yeterli olacak — route mimarisi (`/settings/*`)
 * buna hazır.
 *
 * `onBack` YOK — bu ekranın kendi iç view-state'i (create/edit) yok,
 * geri tuşu tamamen route wrapper seviyesinde (`SettingsScreenRoute`)
 * ele alınıyor (`ParcelsScreen`'in kendisi gibi — üst-düzey, dallanma
 * gerektirmeyen ekranlarda bu prop gereksiz).
 *
 * GLOBALIZATION POLICY: Hiçbir metin doğrudan yazılmaz.
 */

import { useTranslation } from "react-i18next";

interface SettingsScreenProps {
  onViewAiSettings: () => void;
  onViewDataManagement: () => void;
  onViewLanguageSettings: () => void;
}

export function SettingsScreen({ onViewAiSettings, onViewDataManagement, onViewLanguageSettings }: SettingsScreenProps) {
  const { t } = useTranslation();

  return (
    <main className="status-screen">
      <h1 className="status-screen__title">{t("settings.screenTitle")}</h1>

      <ul className="parcel-list">
        <li>
          <button type="button" className="parcel-list__item" onClick={onViewAiSettings}>
            <span className="parcel-list__name">{t("settings.aiSectionLabel")}</span>
          </button>
        </li>
        <li>
          <button type="button" className="parcel-list__item" onClick={onViewDataManagement}>
            <span className="parcel-list__name">{t("settings.dataManagementSectionLabel")}</span>
          </button>
        </li>
        <li>
          <button type="button" className="parcel-list__item" onClick={onViewLanguageSettings}>
            <span className="parcel-list__name">{t("settings.languageSectionLabel")}</span>
          </button>
        </li>
      </ul>
    </main>
  );
}
