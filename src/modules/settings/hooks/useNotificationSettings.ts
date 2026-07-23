/**
 * useNotificationSettings Hook
 * ================================
 * bkz. Sprint 10.19 (Bildirimler — Bakım Hatırlatmaları). Kapsam
 * (kullanıcının kararı): SADECE bakım hatırlatmaları, `maintenance_
 * plans.next_due_date` tabanlı, tamamen cihaz üzerinde (yerel)
 * bildirimler.
 *
 * DAVRANIŞ:
 *   - AÇMA: (1) native izin iste — reddedilirse tercih KAYDEDİLMEZ,
 *     kullanıcıya bunun native ayarlardan değiştirilebileceği
 *     bildirilir; (2) tercihi kalıcı yaz; (3) TÜM aktif bakım
 *     planları için GERÇEKTEN bildirim zamanla.
 *   - KAPATMA: (1) tercihi kalıcı yaz; (2) TÜM bekleyen bildirimleri
 *     GERÇEKTEN iptal et — established `cancelAllMaintenanceReminders`,
 *     "önce temizle" ilkesi.
 */

import { useCallback, useEffect, useState } from "react";
import { localPreferences, LocalPreferenceKey } from "../../../native/preferences";
import {
  requestNotificationPermission,
  checkNotificationPermission,
  scheduleMaintenanceReminders,
  cancelAllMaintenanceReminders,
} from "../../../native/notifications";
import { maintenancePlanRepository } from "../../maintenance/data/maintenancePlan.repository";

type UseNotificationSettingsStatus = "loading" | "ready" | "updating";

export interface UseNotificationSettingsResult {
  status: UseNotificationSettingsStatus;
  isEnabled: boolean;
  /** Native izin GERÇEKTEN reddedildiğinde true olur — kullanıcıya AÇIK bir mesaj göstermek için. */
  permissionDenied: boolean;
  setEnabled: (enabled: boolean) => Promise<void>;
}

export function useNotificationSettings(): UseNotificationSettingsResult {
  const [status, setStatus] = useState<UseNotificationSettingsStatus>("loading");
  const [isEnabled, setIsEnabled] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await localPreferences.get(LocalPreferenceKey.NOTIFICATIONS_ENABLED);
      setIsEnabled(stored === "true");
      setStatus("ready");
    })();
  }, []);

  const setEnabled = useCallback(async (enabled: boolean) => {
    setStatus("updating");
    setPermissionDenied(false);
    try {
      if (enabled) {
        const alreadyGranted = await checkNotificationPermission();
        const granted = alreadyGranted || (await requestNotificationPermission());
        if (!granted) {
          setPermissionDenied(true);
          setStatus("ready");
          return;
        }
        await localPreferences.set(LocalPreferenceKey.NOTIFICATIONS_ENABLED, "true");
        const activePlans = await maintenancePlanRepository.listAllActive();
        await scheduleMaintenanceReminders(activePlans);
        setIsEnabled(true);
      } else {
        await localPreferences.set(LocalPreferenceKey.NOTIFICATIONS_ENABLED, "false");
        await cancelAllMaintenanceReminders();
        setIsEnabled(false);
      }
    } finally {
      setStatus("ready");
    }
  }, []);

  return { status, isEnabled, permissionDenied, setEnabled };
}
