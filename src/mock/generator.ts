import dayjs from 'dayjs';
import {
  User,
  FarmZone,
  Pond,
  WaterQuality,
  DiseaseRecord,
  Alert,
  ApprovalStep,
  FeedFormula,
  FeedingPlan,
  FeedingRecord,
  WeeklyReport,
  ProvinceStats,
  OverviewStats,
  PROVINCE_OPTIONS,
  SPECIES_OPTIONS,
  DISEASE_TYPES,
} from '../types';

const rand = (min: number, max: number, decimals = 2) =>
  Math.round((Math.random() * (max - min) + min) * Math.pow(10, decimals)) / Math.pow(10, decimals);

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const pickSome = <T,>(arr: T[], count: number): T[] => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, arr.length));
};

export const mockUsers: User[] = [
  {
    id: 'u1',
    name: '李主任',
    role: 'national',
    permissions: ['*'],
  },
  {
    id: 'u2',
    name: '王局长',
    role: 'provincial',
    province: '江苏',
    permissions: ['province:view', 'alert:approve'],
  },
  {
    id: 'u3',
    name: '张站长',
    role: 'municipal',
    province: '江苏',
    city: '苏州',
    permissions: ['city:view', 'alert:review'],
  },
  {
    id: 'u4',
    name: '陈老板',
    role: 'farmer',
    province: '江苏',
    city: '苏州',
    permissions: ['farm:view', 'alert:confirm', 'feed:manage'],
  },
  {
    id: 'u5',
    name: '刘技术员',
    role: 'technician',
    province: '江苏',
    city: '苏州',
    permissions: ['feed:view', 'feed:advise'],
  },
];

export const generateMockZones = (): FarmZone[] => {
  const zones: FarmZone[] = [];
  const coastalProvinces = ['江苏', '浙江', '山东', '广东', '福建', '辽宁', '湖北', '湖南'];
  
  coastalProvinces.forEach((province, pi) => {
    const cities = ['苏州', '无锡', '常州', '南通', '盐城'];
    for (let i = 0; i < 2; i++) {
      const city = pick(cities);
      zones.push({
        id: `zone-${pi}-${i}`,
        name: `${city}${['太湖', '阳澄湖', '淀山湖', '洪泽湖', '骆马湖'][i]}养殖区`,
        province,
        city,
        species: pickSome(SPECIES_OPTIONS, rand(2, 4, 0)),
        totalArea: rand(100, 2000, 0),
        pondCount: rand(5, 30, 0),
      });
    }
  });
  return zones;
};

export const generateMockPonds = (zoneId: string, count: number): Pond[] => {
  const ponds: Pond[] = [];
  for (let i = 1; i <= count; i++) {
    const doVal = rand(3, 10);
    const status = doVal < 4 ? 'danger' : doVal < 5.5 ? 'warning' : 'normal';
    ponds.push({
      id: `pond-${zoneId}-${i}`,
      zoneId,
      name: `${i}号养殖池`,
      area: rand(5, 50, 1),
      species: pick(SPECIES_OPTIONS),
      currentDO: doVal,
      currentPH: rand(6.5, 9),
      currentAmmonia: rand(0.05, 1.2),
      currentTemp: rand(18, 32),
      status,
    });
  }
  return ponds;
};

export const generateWaterQualityHistory = (zoneId: string, days = 7): WaterQuality[] => {
  const data: WaterQuality[] = [];
  const now = dayjs();
  for (let d = 0; d < days; d++) {
    for (let h = 0; h < 24; h += 3) {
      const timestamp = now.subtract(d, 'day').hour(h).minute(0).second(0).format('YYYY-MM-DD HH:mm:ss');
      const baseDO = 6 + Math.sin(h / 24 * Math.PI * 2) * 1.5;
      data.push({
        id: `wq-${zoneId}-${d}-${h}`,
        zoneId,
        timestamp,
        dissolvedOxygen: Math.max(2, baseDO + rand(-1.5, 1.5)),
        ph: 7.5 + rand(-0.8, 0.8),
        ammoniaNitrogen: Math.max(0.02, 0.3 + rand(-0.2, 0.5)),
        temperature: 24 + rand(-2, 3),
      });
    }
  }
  return data.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
};

export const generateDiseaseRecords = (zoneId: string): DiseaseRecord[] => {
  const records: DiseaseRecord[] = [];
  for (let i = 0; i < rand(2, 6, 0); i++) {
    const rate = rand(0.5, 8);
    records.push({
      id: `dis-${zoneId}-${i}`,
      zoneId,
      date: dayjs().subtract(i, 'day').format('YYYY-MM-DD'),
      diseaseType: pick(DISEASE_TYPES),
      affectedCount: Math.floor(rand(50, 500, 0)),
      totalCount: Math.floor(rand(5000, 20000, 0)),
      rate,
    });
  }
  return records;
};

export const generateMockAlerts = (zones: FarmZone[]): Alert[] => {
  const alerts: Alert[] = [];
  const alertTypes: Alert['type'][] = ['dissolved_oxygen', 'disease'];
  const statuses: Alert['status'][] = [
    'pending_confirm', 'pending_review', 'pending_approve', 'processing', 'closed'
  ];

  zones.slice(0, 8).forEach((zone, zi) => {
    const type = pick(alertTypes);
    const status = statuses[zi % statuses.length];
    const triggers = [
      type === 'dissolved_oxygen'
        ? '连续6小时溶解氧低于4.0mg/L阈值'
        : '连续3天病害发生率超过5%阈值',
    ];
    const approvalFlow: ApprovalStep[] = [
      {
        id: `ap-${zi}-1`,
        level: 'farmer',
        status: ['pending_confirm'].includes(status) ? 'pending' : 'approved',
        operator: '陈老板',
        operatorRole: '养殖户',
        opinion: ['pending_confirm'].includes(status) ? undefined : '现场确认情况属实，请求处置',
        operatedAt: ['pending_confirm'].includes(status) ? undefined : dayjs().subtract(4, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      },
      {
        id: `ap-${zi}-2`,
        level: 'fishery_station',
        status: ['pending_confirm', 'pending_review'].includes(status) ? 'pending' : 'approved',
        operator: '张站长',
        operatorRole: '渔政站',
        opinion: ['pending_confirm', 'pending_review'].includes(status) ? undefined : '现场复核，建议启动增氧措施',
        operatedAt: ['pending_confirm', 'pending_review'].includes(status) ? undefined : dayjs().subtract(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      },
      {
        id: `ap-${zi}-3`,
        level: 'provincial_bureau',
        status: ['pending_confirm', 'pending_review', 'pending_approve'].includes(status) ? 'pending' : 'approved',
        operator: '王局长',
        operatorRole: '省级渔业局',
        opinion: ['pending_confirm', 'pending_review', 'pending_approve'].includes(status) ? undefined : '批准启动物理增氧，密切关注',
        operatedAt: ['pending_confirm', 'pending_review', 'pending_approve'].includes(status) ? undefined : dayjs().subtract(30, 'minute').format('YYYY-MM-DD HH:mm:ss'),
      },
    ];

    alerts.push({
      id: `alert-${zi + 1}`,
      zoneId: zone.id,
      zoneName: zone.name,
      level: 'primary',
      type,
      status,
      triggerReason: triggers[0],
      triggeredAt: dayjs().subtract(zi * 3 + 2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      affectedPonds: [`pond-${zone.id}-1`, `pond-${zone.id}-2`],
      approvalFlow,
      measures: status === 'processing' || status === 'closed'
        ? [{
            id: `ms-${zi}`,
            type: 'aeration',
            description: '启动4台叶轮式增氧机，持续运行',
            operator: '陈老板',
            startTime: dayjs().subtract(20, 'minute').format('YYYY-MM-DD HH:mm:ss'),
          }]
        : undefined,
    });
  });
  return alerts;
};

export const generateFeedFormulas = (): FeedFormula[] => [
  {
    id: 'f1',
    name: '草鱼成鱼配合饲料-28蛋白',
    uploadedBy: '陈老板',
    uploadedAt: dayjs().subtract(10, 'day').format('YYYY-MM-DD'),
    crudeProtein: 28,
    crudeFat: 5,
    crudeFiber: 10,
    ash: 15,
    moisture: 12,
    suitableSpecies: ['草鱼', '鲤鱼'],
  },
  {
    id: 'f2',
    name: '南美白对虾专用饲料-40蛋白',
    uploadedBy: '陈老板',
    uploadedAt: dayjs().subtract(5, 'day').format('YYYY-MM-DD'),
    crudeProtein: 40,
    crudeFat: 8,
    crudeFiber: 4,
    ash: 18,
    moisture: 10,
    suitableSpecies: ['南美白对虾'],
  },
];

export const generateFeedingPlans = (zoneId: string, ponds: Pond[]): FeedingPlan[] => {
  return ponds.slice(0, 3).map((p, i) => ({
    id: `fp-${zoneId}-${i}`,
    zoneId,
    pondId: p.id,
    pondName: p.name,
    formulaId: i % 2 === 0 ? 'f1' : 'f2',
    formulaName: i % 2 === 0 ? '草鱼成鱼配合饲料-28蛋白' : '南美白对虾专用饲料-40蛋白',
    dailyAmount: p.area * rand(3, 6),
    frequency: rand(2, 4, 0),
    startTime: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
  }));
};

export const generateFeedingRecords = (plans: FeedingPlan[]): FeedingRecord[] => {
  const records: FeedingRecord[] = [];
  plans.forEach((plan) => {
    for (let d = 0; d < 7; d++) {
      const actual = plan.dailyAmount * rand(0.7, 1.3);
      const deviation = ((actual - plan.dailyAmount) / plan.dailyAmount) * 100;
      records.push({
        id: `fr-${plan.id}-${d}`,
        planId: plan.id,
        date: dayjs().subtract(d, 'day').format('YYYY-MM-DD'),
        pondName: plan.pondName,
        recommendedAmount: plan.dailyAmount,
        actualAmount: Math.round(actual * 10) / 10,
        deviation: Math.round(deviation * 10) / 10,
        isAbnormal: Math.abs(deviation) > 20,
      });
    }
  });
  return records;
};

export const generateWeeklyReports = (zones: FarmZone[]): WeeklyReport[] => {
  return zones.slice(0, 5).map((zone, zi) => {
    const sr = rand(85, 98);
    const wq = rand(75, 98);
    return {
      id: `wr-${zi + 1}`,
      zoneId: zone.id,
      zoneName: zone.name,
      weekStart: dayjs().startOf('week').subtract(1, 'week').format('YYYY-MM-DD'),
      weekEnd: dayjs().endOf('week').subtract(1, 'week').format('YYYY-MM-DD'),
      survivalRate: sr,
      survivalRateYoY: rand(-3, 4),
      survivalRateMoM: rand(-2, 3),
      waterQualityPassRate: wq,
      waterQualityPassRateChange: rand(-5, 5),
      diseaseDistribution: DISEASE_TYPES.slice(0, 4).map((type, i) => ({
        type,
        count: Math.floor(rand(10, 100, 0)),
        rate: rand(0.5, 5),
      })),
      feedingOptimization: `根据${zone.species[0]}生长阶段，建议将蛋白含量从28%调至30%，日投喂量增加5%，分3-4次投喂。`,
      waterChangeRecommendation: `本周水质达标率${wq.toFixed(1)}%，建议每3天换水15%，增氧设备每日凌晨2-6点持续运行。`,
      generatedAt: dayjs().startOf('week').format('YYYY-MM-DD HH:mm:ss'),
    };
  });
};

export const generateProvinceStats = (): ProvinceStats[] => {
  return PROVINCE_OPTIONS.slice(0, 20).map((province) => ({
    province,
    farmCount: rand(50, 800, 0),
    waterQualityPassRate: rand(70, 98),
    diseaseRate: rand(0.5, 6),
    estimatedYield: rand(1000, 80000, 0),
    avgSurvivalRate: rand(80, 97),
  }));
};

export const generateOverviewStats = (): OverviewStats => ({
  totalFarms: 12847,
  avgWaterQualityPassRate: 89.6,
  avgDiseaseRate: 2.3,
  estimatedTotalYield: 526800,
  avgSurvivalRate: 91.2,
  activeAlerts: 23,
  todayNewAlerts: 5,
});
