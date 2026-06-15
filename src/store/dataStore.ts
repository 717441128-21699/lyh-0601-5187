import { create } from 'zustand';
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
} from '../types';
import {
  generateMockZones,
  generateMockPonds,
  generateWaterQualityHistory,
  generateDiseaseRecords,
  generateMockAlerts,
  generateFeedFormulas,
  generateFeedingPlans,
  generateFeedingRecords,
  generateWeeklyReports,
  generateProvinceStats,
  generateOverviewStats,
} from '../mock/generator';
import dayjs from 'dayjs';

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
}

export const useDataStore = create<DataState>((set, get) => ({
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
      const plans = generateFeedingPlans(z.id, ponds);
      allPlans.push(...plans);
      allRecords.push(...generateFeedingRecords(plans));
    });

    set({
      zones,
      ponds: pondsMap,
      waterQuality: wqMap,
      diseases: disMap,
      alerts: generateMockAlerts(zones),
      formulas: generateFeedFormulas(),
      feedingPlans: allPlans,
      feedingRecords: allRecords,
      reports: generateWeeklyReports(zones),
      provinceStats: generateProvinceStats(),
      overview: generateOverviewStats(),
      loading: false,
    });
  },

  setSelectedSpecies: (s) => set({ selectedSpecies: s }),
  setSelectedProvince: (p) => set({ selectedProvince: p }),

  getZoneById: (id) => get().zones.find((z) => z.id === id),
  getZonePonds: (zoneId) => get().ponds[zoneId] || [],
  getZoneWaterQuality: (zoneId) => get().waterQuality[zoneId] || [],
  getZoneDiseases: (zoneId) => get().diseases[zoneId] || [],

  _updateApprovalStep: (alertId: string, level: ApprovalStep['level'], status: 'approved' | 'rejected', opinion: string, operatorName: string, operatorRole: string) => {
    set({
      alerts: get().alerts.map((a) => {
        if (a.id !== alertId) return a;
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
          status: 'processing',
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
}));
