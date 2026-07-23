/**
 * maintenance.tool.ts — Salt-Okunur AI Aracı
 * ==============================================
 * bkz. ADR 0024.
 *
 * bkz. Sprint 10.15 (AI Maintenance Tool düzeltmesi — Production Fix).
 * GERÇEK KANIT (kod ve gerçek cihaz testleriyle doğrulandı): Bu aracın
 * ÖNCEKİ hali, `parcelId`/`treeId` OLMADAN çağrılamıyordu ("Bir
 * parselin veya ağacın..." description'ı, `queryParcelData`'nın
 * aksine genel sorguya hiç açık yorumlanamıyordu). Kullanıcının genel
 * sorularına ("Bugün hangi parsellere sulama yapıldı?", "Kaç adet
 * bakım kaydı var?", "Son yapılan sulama kaydı ne?") gerçek cihazda
 * boş yanıt dönmesi, bu tasarım tutarsızlığıyla doğrudan örtüşüyordu.
 *
 * DÜZELTME (repository/mimari katmanlarına dokunulmadan — established
 * `photoRepository.listAll()` deseniyle tutarlı, YENİ bir mimari
 * KAVRAM DEĞİL):
 * - `parcelId`/`treeId` artık GERÇEKTEN opsiyonel — hiçbiri
 *   verilmezse `maintenanceRepository.listAll()` (sistem geneli)
 *   kullanılır.
 * - `maintenanceType` parametresi eklendi — repository bunu ZATEN
 *   destekliyordu (`buildListClause`'da mevcuttu), sadece bu tool
 *   katmanına hiç aktarılmamıştı.
 * - `fromDate`/`toDate` parametreleri eklendi — AYNI şekilde,
 *   repository'de zaten vardı, tool'a hiç aktarılmamıştı.
 * - Dönüş şekline `parcelId` eklendi (her kayıt için) — GERÇEK VERİ:
 *   `MaintenanceRecord.parcelId` zaten domain tipinde vardı, ekstra
 *   bir repository/JOIN sorgusu GEREKMEDİ.
 * - `totalCount` eklendi — `countAll()` ile AYRI bir `SELECT COUNT(*)`
 *   sorgusundan (kullanıcının açık talebi: "COUNT ile LIST aynı SQL
 *   üzerinden üretilmesin") — ÖNCEKİ `recentCount` (LIMIT'e bağlı,
 *   yanıltıcı olabilecek) alanı GERİYE DÖNÜK UYUMLULUK için KORUNDU.
 *
 * NELERE DOKUNULMADI (bilinçli): AiSessionService, GeminiProvider,
 * ToolRegistry, Conversation Memory, Diagnostics — hiçbiri
 * değiştirilmedi (bu sprintin açık talimatı). Çok-round tool-calling
 * mimarisi EKLENMEDİ — mevcut kanıtlar (bkz. Sprint 10.15 öncesi
 * mimari doğrulama raporları) bunun gerekli olmadığını gösteriyordu.
 */

import { maintenanceRepository } from "../../maintenance/data/maintenance.repository";
import { MaintenanceType } from "../../maintenance/domain/maintenance.types";
import type { AiTool } from "./ToolDefinition.interface";

const RECENT_MAINTENANCE_LIMIT = 5;

export const maintenanceTool: AiTool = {
  definition: {
    name: "queryMaintenanceData",
    description:
      "Bakım kayıtlarını (sulama, gübreleme, ilaçlama, budama vb.) getirir. parcelId/treeId verilmezse sistemdeki TÜM parsellerin bakım kayıtları arasında sorgu yapar (genel sorgu). maintenanceType verilirse SADECE o türdeki kayıtlar döner. fromDate/toDate ile tarih aralığına göre filtrelenebilir.",
    parametersJsonSchema: {
      type: "object",
      properties: {
        parcelId: { type: "string", description: "Parsel geneli bakım kayıtları için parsel ID'si (opsiyonel — verilmezse tüm sistemde sorgu yapılır)." },
        treeId: { type: "string", description: "Belirli bir ağacın bakım kayıtları için ağaç ID'si (opsiyonel)." },
        maintenanceType: {
          type: "string",
          enum: Object.values(MaintenanceType),
          description: "Belirli bir bakım türüne göre filtreler (opsiyonel) — ör. 'irrigation' (sulama).",
        },
        fromDate: { type: "string", description: "Bu tarihten (dahil, YYYY-MM-DD) sonraki kayıtlar (opsiyonel)." },
        toDate: { type: "string", description: "Bu tarihe (dahil, YYYY-MM-DD) kadarki kayıtlar (opsiyonel)." },
      },
    },
  },
  async execute(args) {
    const parcelId = typeof args.parcelId === "string" ? args.parcelId : undefined;
    const treeId = typeof args.treeId === "string" ? args.treeId : undefined;
    const maintenanceType =
      typeof args.maintenanceType === "string"
        ? (args.maintenanceType as (typeof MaintenanceType)[keyof typeof MaintenanceType])
        : undefined;
    const fromDate = typeof args.fromDate === "string" ? args.fromDate : undefined;
    const toDate = typeof args.toDate === "string" ? args.toDate : undefined;
    const filterOptions = { maintenanceType, fromDate, toDate };

    const [records, totalCount] = treeId
      ? await Promise.all([
          maintenanceRepository.listByTree(treeId, { ...filterOptions, limit: RECENT_MAINTENANCE_LIMIT }),
          maintenanceRepository.countAll({ ...filterOptions, scopeColumn: "tree_id", scopeValue: treeId }),
        ])
      : parcelId
        ? await Promise.all([
            maintenanceRepository.listByParcel(parcelId, { ...filterOptions, limit: RECENT_MAINTENANCE_LIMIT }),
            maintenanceRepository.countAll({ ...filterOptions, scopeColumn: "parcel_id", scopeValue: parcelId }),
          ])
        : await Promise.all([
            maintenanceRepository.listAll({ ...filterOptions, limit: RECENT_MAINTENANCE_LIMIT }),
            maintenanceRepository.countAll(filterOptions),
          ]);

    return {
      totalCount,
      recentCount: records.length,
      recentRecords: records.map((r) => ({
        parcelId: r.parcelId,
        type: r.maintenanceType,
        status: r.status,
        date: r.completedDate ?? r.scheduledDate,
      })),
    };
  },
};
