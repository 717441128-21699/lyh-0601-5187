import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  FarmZone,
  Pond,
  WaterQuality,
  DiseaseRecord,
  Alert,
  FeedFormula,
  FeedingPlan,
  FeedingRecord,
  WeeklyReport,
  ProvinceStats,
  OverviewStats,
  ApprovalStep,
  ThresholdConfig,
  UserRole,
} from '../types';
import {
  generateMockZones,
  generateMockPonds,
  generateWaterQualityHistory,
  generateDiseaseRecords,
  generateFeedFormulas,
  generateFeedingPlans,
  generateFeedingRecords,
  generateWeeklyReports,
  generateProvinceStats,
  generateOverviewStats,
} from '../mock/generator';
import dayjs from 'dayjs';

// 基于水质和病害数据检测预警
function detectAlertsFromData(
  zones: FarmZone[],
  waterQuality: Record<string, WaterQuality[]>,
  diseases: Record<string, DiseaseRecord[]>,
  thresholds: ThresholdConfig,
  existingAlerts: Alert[] = []
): Alert[] {
  const alerts: Alert[] = [];
  const existingZoneIds = new Set(existingAlerts.map((a) => a.zoneId));

  zones.forEach((zone) => {
    // 跳过已经有预警的区域（避免重复）
    if (existingZoneIds.has(zone.id)) {
      const existing = existingAlerts.find((a) => a.zoneId === zone.id);
      if (existing && existing.status !== 'false_alarm' && existing.status !== 'closed') {
        alerts.push(existing);
        return;
      }
    }

    // 规则1：连续6小时溶解氧低于阈值
    const wqData = waterQuality[zone.id] || [];
    const recentData = wqData
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, 12); // 最近约36小时(每3小时一条)

    let lowDoCount = 0;
    for (const d of recentData) {
      if (d.dissolvedOxygen < thresholds.dissolvedOxygenMin) lowDoCount++;
      else break;
    }
    const doTriggered = lowDoCount >= 2; // 至少连续2个采样点(6小时)低于阈值

    // 规则2：连续3天病害率超过阈值
    const disData = diseases[zone.id] || [];
    const recentDis = disData
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 3);
    const diseaseTriggered =
      recentDis.length >= 3 &&
      recentDis.every((d) => d.rate > thresholds.diseaseRateMax);

    if (doTriggered || diseaseTriggered) {
      const affectedPonds = Object.values(existingAlerts.find((a) => a.zoneId === zone.id)?.affectedPonds || []) as any;

      const type: Alert['type'] = doTriggered ? 'dissolved_oxygen' : 'disease';
      const triggerReason = doTriggered
        ? `连续${lowDoCount * 3}小时溶解氧低于${thresholds.dissolvedOxygenMin}mg/L阈值`
        : `连续3天病害率超过${thresholds.diseaseRateMax}%阈值`;

      const approvalFlow: ApprovalStep[] = [
        {
          id: `ap-${zone.id}-1`,
          level: 'farmer',
          status: 'pending',
          operator: '待确认',
          operatorRole: '养殖户',
        },
        {
          id: `ap-${zone.id}-2`,
          level: 'fishery_station',
          status: 'pending',
          operator: '待复核',
          operatorRole: '渔政站',
        },
        {
          id: `ap-${zone.id}-3`,
          level: 'provincial_bureau',
          status: 'pending',
          operator: '待批准',
          operatorRole: '省级渔业局',
        },
      ];

      alerts.push({
        id: `alert-${zone.id}`,
        zoneId: zone.id,
        zoneName: zone.name,
        level: 'primary',
        type,
        status: 'pending_confirm',
        triggerReason,
        triggeredAt: recentData[0]?.timestamp || dayjs().format('YYYY-MM-DD HH:mm:ss'),
        affectedPonds: affectedPonds.length > 0 ? affectedPonds : [`pond-${zone.id}-1`, `pond-${zone.id}-2`],
        approvalFlow,
      });
    }
  });

  return alerts.sort((a, b) => b.triggeredAt.localeCompare(a.triggeredAt));
}

interface DataState {
  zones: FarmZone[];
  ponds: Record<string, Pond[]>;
  waterQuality: Record<string, WaterQuality[]>;
  diseases: Record<string, DiseaseRecord[]>;
  alerts: Alert[];
  formulas: FeedFormula[];
  feedingPlans: FeedingPlan[];
  feedingRecords: FeedingRecord[];
  reports: WeeklyReport[];
  provinceStats: ProvinceStats[];
  overview: OverviewStats;
  thresholds: ThresholdConfig;
  selectedSpecies: string;
  selectedProvince: string;
  loading: boolean;

  _updateApprovalStep: (alertId: string, level: ApprovalStep['level'], status: 'approved' | 'rejected', opinion: string, operatorName: string, operatorRole: string) => void;
  initData: () => void;
  setSelectedSpecies: (s: string) => void;
  setSelectedProvince: (p: string) => void;

  // 数据过滤（按角色+省份+城市+品种+养殖场）
  // province/city 传参规则：
  //   - 当role为national时，province/city 作为"额外筛选条件"（即用户在看板主动选择的省份）
  //   - 当role为provincial时，province 为用户管辖省；若city有值则额外过滤该城市
  //   - 当role为municipal/farmer/technician时，city 为用户管辖市
  filterZonesByScope: (role: UserRole, province?: string, city?: string, species?: string, farmIds?: string[]) => FarmZone[];
  filterAlertsByScope: (role: UserRole, province?: string, city?: string, species?: string, farmIds?: string[]) => Alert[];
  filterReportsByScope: (role: UserRole, province?: string, city?: string, species?: string, farmIds?: string[]) => WeeklyReport[];
  filterPlansByScope: (role: UserRole, province?: string, city?: string, farmIds?: string[]) => FeedingPlan[];
  filterRecordsByScope: (role: UserRole, province?: string, city?: string, farmIds?: string[]) => FeedingRecord[];
  computeOverviewStats: (role: UserRole, province?: string, city?: string, species?: string, farmIds?: string[]) => OverviewStats;
  // 根据过滤后的养殖区动态计算区域统计（支持省级按省聚合，市级按市聚合）
  computeRegionStats: (filteredZones: FarmZone[], species?: string, groupBy?: 'province' | 'city') => ProvinceStats[];
  computeProvinceStats: (role: UserRole, province?: string, city?: string, species?: string, farmIds?: string[]) => ProvinceStats[];

  canAccessZone: (zoneId: string, role: UserRole, province?: string, city?: string, farmIds?: string[]) => boolean;

  getZoneById: (id: string) => FarmZone | undefined;
  getZonePonds: (zoneId: string) => Pond[];
  getZoneWaterQuality: (zoneId: string) => WaterQuality[];
  getZoneDiseases: (zoneId: string) => DiseaseRecord[];

  confirmAlert: (alertId: string, opinion: string, confirmed: boolean) => void;
  reviewAlert: (alertId: string, opinion: string, approved: boolean) => void;
  approveAlert: (alertId: string, opinion: string, approved: boolean) => void;
  startMeasure: (alertId: string, type: 'aeration' | 'isolation' | 'water_change' | 'medication', description: string) => void;
  closeAlert: (alertId: string) => void;

  addFormula: (formula: Omit<FeedFormula, 'id' | 'uploadedBy' | 'uploadedAt'>) => void;
  addFeedingPlan: (plan: Omit<FeedingPlan, 'id'>) => void;
  addFeedingPlansBatch: (plans: Omit<FeedingPlan, 'id'>[]) => void;
  addFeedingRecord: (record: Omit<FeedingRecord, 'id'>) => void;
  updateThresholds: (t: Partial<ThresholdConfig>) => void;
}

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      zones: [],
      ponds: {},
      waterQuality: {},
      diseases: {},
      alerts: [],
      formulas: [],
      feedingPlans: [],
      feedingRecords: [],
      reports: [],
      provinceStats: [],
      overview: {
        totalFarms: 0,
        avgWaterQualityPassRate: 0,
        avgDiseaseRate: 0,
        estimatedTotalYield: 0,
        avgSurvivalRate: 0,
        activeAlerts: 0,
        todayNewAlerts: 0,
      },
      thresholds: {
        dissolvedOxygenMin: 4.0,
        phMin: 6.5,
        phMax: 9.0,
        ammoniaNitrogenMax: 0.5,
        temperatureMin: 15,
        temperatureMax: 32,
        diseaseRateMax: 5,
        feedDeviationMax: 20,
      },
      selectedSpecies: '全部',
      selectedProvince: '全国',
      loading: true,

      initData: () => {
        const zones = generateMockZones();
        const pondsMap: Record<string, Pond[]> = {};
        const wqMap: Record<string, WaterQuality[]> = {};
        const disMap: Record<string, DiseaseRecord[]> = {};
        const allPlans: FeedingPlan[] = [];
        const allRecords: FeedingRecord[] = [];

        zones.forEach((z) => {
          const ponds = generateMockPonds(z.id, z.pondCount);
          pondsMap[z.id] = ponds;
          wqMap[z.id] = generateWaterQualityHistory(z.id);
          disMap[z.id] = generateDiseaseRecords(z.id);
          const plans = generateFeedingPlans(z.id, z.name, ponds);
          allPlans.push(...plans);
          allRecords.push(...generateFeedingRecords(plans));
        });

        const thresholds = get().thresholds;
        const alerts = detectAlertsFromData(zones, wqMap, disMap, thresholds, []);

        set({
          zones,
          ponds: pondsMap,
          waterQuality: wqMap,
          diseases: disMap,
          alerts,
          formulas: generateFeedFormulas(),
          feedingPlans: allPlans,
          feedingRecords: allRecords,
          reports: generateWeeklyReports(zones),
          provinceStats: generateProvinceStats(),
          overview: generateOverviewStats(),
          loading: false,
          selectedSpecies: '全部',
          selectedProvince: '全国',
        });
      },

      setSelectedSpecies: (s) => set({ selectedSpecies: s }),
      setSelectedProvince: (p) => set({ selectedProvince: p }),

      // 通用区域过滤：province/city 是"筛选参数"，在任何角色下都会生效
      // 优先级：farmIds > 角色管辖范围 > 额外传入的 province/city 筛选 > 品种筛选
      // 所有场景同时校验 province 和 city（如果有值），避免同名城市混入
      filterZonesByScope: (role, province, city, species, farmIds) => {
        const zones = get().zones;
        let result = zones;

        // 1. 养殖户名下养殖场优先（最高优先级）
        if (farmIds && farmIds.length > 0) {
          const farmSet = new Set(farmIds);
          result = result.filter((z) => farmSet.has(z.id));
        } else {
          // 2. 按角色确定默认管辖范围
          if (role === 'provincial' && province) {
            // 省级：只看本省
            result = result.filter((z) => z.province === province);
          } else if (role === 'municipal' || role === 'technician') {
            // 市级/技术员：只看本市（同时校验省份，避免同名城市）
            if (city && province) {
              result = result.filter((z) => z.province === province && z.city === city);
            } else if (city) {
              result = result.filter((z) => z.city === city);
            } else if (province) {
              result = result.filter((z) => z.province === province);
            }
          } else if (role === 'farmer' && province && city) {
            // 养殖户无farmIds时，同时校验省+市
            result = result.filter((z) => z.province === province && z.city === city);
          }
          // role === 'national' 管辖范围默认全国，不做额外限制
        }

        // 3. 叠加传入的 province/city 额外筛选参数（国家级用户选省、或省级用户选市）
        // 注意：这些是在"管辖范围"基础上的二次筛选
        if (role === 'national' && province) {
          result = result.filter((z) => z.province === province);
        }
        if (role === 'provincial' && city) {
          result = result.filter((z) => z.city === city);
        }

        // 4. 品种筛选
        if (species && species !== '全部') {
          result = result.filter((z) => z.species.includes(species));
        }
        return result;
      },

      filterAlertsByScope: (role, province, city, species, farmIds) => {
        const filteredZones = get().filterZonesByScope(role, province, city, species, farmIds);
        const zoneIds = new Set(filteredZones.map((z) => z.id));
        return get().alerts.filter((a) => zoneIds.has(a.zoneId));
      },

      filterReportsByScope: (role, province, city, species, farmIds) => {
        const filteredZones = get().filterZonesByScope(role, province, city, species, farmIds);
        const zoneIds = new Set(filteredZones.map((z) => z.id));
        return get().reports.filter((r) => zoneIds.has(r.zoneId));
      },

      filterPlansByScope: (role, province, city, farmIds) => {
        const filteredZones = get().filterZonesByScope(role, province, city, undefined, farmIds);
        const zoneIds = new Set(filteredZones.map((z) => z.id));
        return get().feedingPlans.filter((p) => zoneIds.has(p.zoneId));
      },

      filterRecordsByScope: (role, province, city, farmIds) => {
        const plans = get().filterPlansByScope(role, province, city, farmIds);
        const planIds = new Set(plans.map((p) => p.id));
        return get().feedingRecords.filter((r) => planIds.has(r.planId));
      },

      // 计算范围统计
      computeOverviewStats: (role, province, city, species, farmIds) => {
        const zones = get().filterZonesByScope(role, province, city, species, farmIds);
        const allWq = zones.flatMap((z) => get().waterQuality[z.id] || []);
        const allDis = zones.flatMap((z) => get().diseases[z.id] || []);
        const alerts = get().filterAlertsByScope(role, province, city, species, farmIds);

        const doPass = allWq.filter((w) => w.dissolvedOxygen >= get().thresholds.dissolvedOxygenMin).length;
        const passRate = allWq.length > 0 ? (doPass / allWq.length) * 100 : 0;
        const avgDis = allDis.length > 0 ? allDis.reduce((s, d) => s + d.rate, 0) / allDis.length : 0;
        const active = alerts.filter((a) => a.status !== 'closed' && a.status !== 'false_alarm').length;
        const today = alerts.filter((a) => dayjs(a.triggeredAt).isSame(dayjs(), 'day')).length;

        const totalArea = zones.reduce((s, z) => s + z.totalArea, 0);
        const yieldPerMu = species === '全部' ? 0.8 : (['南美白对虾', '海参', '鲍鱼'].includes(species!) ? 1.5 : 0.6);
        const estimatedYield = Math.floor(totalArea * yieldPerMu);

        return {
          totalFarms: zones.length,
          avgWaterQualityPassRate: Math.round(passRate * 10) / 10,
          avgDiseaseRate: Math.round(avgDis * 10) / 10,
          estimatedTotalYield: estimatedYield,
          avgSurvivalRate: zones.length > 0 ? Math.round((85 + Math.random() * 10) * 10) / 10 : 0,
          activeAlerts: active,
          todayNewAlerts: today,
        };
      },

      // 基于已过滤的养殖区动态聚合省/市级统计
      // groupBy='province'（省级/国家级默认按省聚合）
      // groupBy='city'（市级默认按市聚合，把每个城市当作"省"显示在地图/排名里）
      computeRegionStats: (filteredZones, species, groupBy = 'province') => {
        const thresholds = get().thresholds;
        const groups = new Map<string, FarmZone[]>();
        filteredZones.forEach((z) => {
          const key = groupBy === 'city' ? z.city : z.province;
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key)!.push(z);
        });
        const result: ProvinceStats[] = [];
        groups.forEach((zonesInGroup, key) => {
          const allWq = zonesInGroup.flatMap((z) => get().waterQuality[z.id] || []);
          const allDis = zonesInGroup.flatMap((z) => get().diseases[z.id] || []);
          const doPass = allWq.filter((w) => w.dissolvedOxygen >= thresholds.dissolvedOxygenMin).length;
          const passRate = allWq.length > 0 ? (doPass / allWq.length) * 100 : 85;
          const avgDis = allDis.length > 0 ? allDis.reduce((s, d) => s + d.rate, 0) / allDis.length : 2;
          const totalArea = zonesInGroup.reduce((s, z) => s + z.totalArea, 0);
          const yieldPerMu = (species === undefined || species === '全部')
            ? 0.8
            : (['南美白对虾', '海参', '鲍鱼'].includes(species) ? 1.5 : 0.6);
          result.push({
            province: key,
            farmCount: zonesInGroup.length,
            waterQualityPassRate: Math.round(passRate * 10) / 10,
            diseaseRate: Math.round(avgDis * 10) / 10,
            estimatedYield: Math.floor(totalArea * yieldPerMu),
            avgSurvivalRate: Math.round((85 + Math.random() * 10) * 10) / 10,
            isCity: groupBy === 'city',
          });
        });
        return result.sort((a, b) => b.estimatedYield - a.estimatedYield);
      },

      // 兼容旧方法名（避免破坏其他引用）
      computeProvinceStats: (role, province, city, species, farmIds) => {
        const zones = get().filterZonesByScope(role, province, city, species, farmIds);
        const groupBy: 'province' | 'city' = (role === 'municipal' || role === 'technician') ? 'city' : 'province';
        return get().computeRegionStats(zones, species, groupBy);
      },

      canAccessZone: (zoneId, role, province, city, farmIds) => {
        const zone = get().zones.find((z) => z.id === zoneId);
        if (!zone) return false;
        if (role === 'national') return true;
        if (farmIds && farmIds.length > 0) return farmIds.includes(zoneId);
        if (role === 'provincial') return !province || zone.province === province;
        if (role === 'municipal' || role === 'technician') {
          // 市级：同时校验省份+城市，避免同名城市混入
          const matchProvince = !province || zone.province === province;
          const matchCity = !city || zone.city === city;
          return matchProvince && matchCity;
        }
        if (role === 'farmer') {
          if (farmIds) return farmIds.includes(zoneId);
          // 养殖户无farmIds时，双校验省份+城市
          const matchProvince = !province || zone.province === province;
          const matchCity = !city || zone.city === city;
          return matchProvince && matchCity;
        }
        return false;
      },

      getZoneById: (id) => get().zones.find((z) => z.id === id),
      getZonePonds: (zoneId) => get().ponds[zoneId] || [],
      getZoneWaterQuality: (zoneId) => get().waterQuality[zoneId] || [],
      getZoneDiseases: (zoneId) => get().diseases[zoneId] || [],

      _updateApprovalStep: (alertId, level, status, opinion, operatorName, operatorRole) => {
        set({
          alerts: get().alerts.map((a) => {
            if (a.id !== alertId) return a;
            // 如果上一级被驳回，则后续不再流转
            const now = dayjs().format('YYYY-MM-DD HH:mm:ss');
            const newFlow = a.approvalFlow.map((step) => {
              if (step.level !== level) return step;
              return { ...step, status, opinion, operator: operatorName, operatorRole, operatedAt: now };
            });

            let newStatus = a.status;
            if (status === 'rejected') {
              newStatus = 'false_alarm';
            } else if (level === 'farmer') {
              newStatus = 'pending_review';
            } else if (level === 'fishery_station') {
              newStatus = 'pending_approve';
            } else if (level === 'provincial_bureau') {
              newStatus = 'processing';
            }

            return { ...a, approvalFlow: newFlow, status: newStatus };
          }),
        });
      },

      confirmAlert: (alertId, opinion, confirmed) => {
        get()._updateApprovalStep(alertId, 'farmer', confirmed ? 'approved' : 'rejected', opinion, '陈老板', '养殖户');
      },

      reviewAlert: (alertId, opinion, approved) => {
        get()._updateApprovalStep(alertId, 'fishery_station', approved ? 'approved' : 'rejected', opinion, '张站长', '渔政站');
      },

      approveAlert: (alertId, opinion, approved) => {
        get()._updateApprovalStep(alertId, 'provincial_bureau', approved ? 'approved' : 'rejected', opinion, '王局长', '省级渔业局');
      },

      startMeasure: (alertId, type, description) => {
        set({
          alerts: get().alerts.map((a) => {
            if (a.id !== alertId) return a;
            const measure = {
              id: `ms-${Date.now()}`,
              type,
              description,
              operator: '陈老板',
              startTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            };
            return {
              ...a,
              measures: [...(a.measures || []), measure],
            };
          }),
        });
      },

      closeAlert: (alertId) => {
        set({
          alerts: get().alerts.map((a) => (a.id === alertId ? { ...a, status: 'closed' } : a)),
        });
      },

      addFormula: (formula) => {
        set({
          formulas: [
            ...get().formulas,
            {
              ...formula,
              id: `f-${Date.now()}`,
              uploadedBy: '当前用户',
              uploadedAt: dayjs().format('YYYY-MM-DD'),
            },
          ],
        });
      },

      addFeedingPlan: (plan) => {
        set({
          feedingPlans: [
            ...get().feedingPlans,
            { ...plan, id: `fp-${Date.now()}` },
          ],
        });
      },

      addFeedingPlansBatch: (plans) => {
        const newPlans = plans.map((p, i) => ({ ...p, id: `fp-${Date.now()}-${i}` }));
        // 同时生成对应异常检测记录
        const newRecords: FeedingRecord[] = newPlans.flatMap((plan) => {
          const records: FeedingRecord[] = [];
          for (let d = 0; d < 3; d++) {
            const actual = plan.dailyAmount * (0.75 + Math.random() * 0.5);
            const deviation = Math.round(((actual - plan.dailyAmount) / plan.dailyAmount) * 1000) / 10;
            records.push({
              id: `fr-${plan.id}-${d}`,
              planId: plan.id,
              zoneName: plan.zoneName,
              date: dayjs().subtract(d, 'day').format('YYYY-MM-DD'),
              pondName: plan.pondName,
              formulaName: plan.formulaName,
              recommendedAmount: plan.dailyAmount,
              actualAmount: Math.round(actual * 10) / 10,
              deviation,
              isAbnormal: Math.abs(deviation) > get().thresholds.feedDeviationMax,
            });
          }
          return records;
        });
        set({
          feedingPlans: [...get().feedingPlans, ...newPlans],
          feedingRecords: [...newRecords, ...get().feedingRecords],
        });
      },

      addFeedingRecord: (record) => {
        set({
          feedingRecords: [
            { ...record, id: `fr-${Date.now()}` },
            ...get().feedingRecords,
          ],
        });
      },

      updateThresholds: (t) => {
        set({
          thresholds: { ...get().thresholds, ...t },
        });
        // 更新阈值后重新检测预警
        const { zones, waterQuality, diseases, thresholds, alerts } = get();
        set({
          alerts: detectAlertsFromData(zones, waterQuality, diseases, thresholds, alerts),
        });
      },
    }),
    { name: 'aquaculture-data' }
  )
);
