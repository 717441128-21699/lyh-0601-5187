export type UserRole = 'national' | 'provincial' | 'municipal' | 'farmer' | 'technician';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  province?: string;
  city?: string;
  avatar?: string;
  permissions: string[];
}

export interface FarmZone {
  id: string;
  name: string;
  province: string;
  city: string;
  species: string[];
  totalArea: number;
  pondCount: number;
}

export interface Pond {
  id: string;
  zoneId: string;
  name: string;
  area: number;
  species: string;
  currentDO: number;
  currentPH: number;
  currentAmmonia: number;
  currentTemp: number;
  status: 'normal' | 'warning' | 'danger';
}

export interface WaterQuality {
  id: string;
  zoneId: string;
  pondId?: string;
  timestamp: string;
  dissolvedOxygen: number;
  ph: number;
  ammoniaNitrogen: number;
  temperature: number;
}

export interface ThresholdConfig {
  dissolvedOxygenMin: number;
  phMin: number;
  phMax: number;
  ammoniaNitrogenMax: number;
  temperatureMin: number;
  temperatureMax: number;
  diseaseRateMax: number;
  feedDeviationMax: number;
}

export interface DiseaseRecord {
  id: string;
  zoneId: string;
  pondId?: string;
  date: string;
  diseaseType: string;
  affectedCount: number;
  totalCount: number;
  rate: number;
}

export type AlertLevel = 'primary' | 'secondary' | 'tertiary';
export type AlertStatus =
  | 'pending_confirm'
  | 'pending_review'
  | 'pending_approve'
  | 'processing'
  | 'closed'
  | 'false_alarm';
export type AlertType = 'dissolved_oxygen' | 'disease';

export interface Alert {
  id: string;
  zoneId: string;
  zoneName: string;
  level: AlertLevel;
  type: AlertType;
  status: AlertStatus;
  triggerReason: string;
  triggeredAt: string;
  affectedPonds: string[];
  approvalFlow: ApprovalStep[];
  measures?: MeasureRecord[];
}

export interface ApprovalStep {
  id: string;
  level: 'farmer' | 'fishery_station' | 'provincial_bureau';
  status: 'pending' | 'approved' | 'rejected';
  operator: string;
  operatorRole: string;
  opinion?: string;
  operatedAt?: string;
}

export interface MeasureRecord {
  id: string;
  type: 'aeration' | 'isolation' | 'water_change' | 'medication';
  description: string;
  operator: string;
  startTime: string;
  endTime?: string;
}

export interface FeedFormula {
  id: string;
  name: string;
  uploadedBy: string;
  uploadedAt: string;
  crudeProtein: number;
  crudeFat: number;
  crudeFiber: number;
  ash: number;
  moisture: number;
  suitableSpecies: string[];
}

export interface FeedingPlan {
  id: string;
  zoneId: string;
  pondId: string;
  pondName: string;
  formulaId: string;
  formulaName: string;
  dailyAmount: number;
  frequency: number;
  startTime: string;
  endTime?: string;
}

export interface FeedingRecord {
  id: string;
  planId: string;
  date: string;
  pondName: string;
  recommendedAmount: number;
  actualAmount: number;
  deviation: number;
  isAbnormal: boolean;
}

export interface WeeklyReport {
  id: string;
  zoneId: string;
  zoneName: string;
  weekStart: string;
  weekEnd: string;
  survivalRate: number;
  survivalRateYoY: number;
  survivalRateMoM: number;
  waterQualityPassRate: number;
  waterQualityPassRateChange: number;
  diseaseDistribution: { type: string; count: number; rate: number }[];
  feedingOptimization: string;
  waterChangeRecommendation: string;
  generatedAt: string;
}

export interface ProvinceStats {
  province: string;
  farmCount: number;
  waterQualityPassRate: number;
  diseaseRate: number;
  estimatedYield: number;
  avgSurvivalRate: number;
}

export interface OverviewStats {
  totalFarms: number;
  avgWaterQualityPassRate: number;
  avgDiseaseRate: number;
  estimatedTotalYield: number;
  avgSurvivalRate: number;
  activeAlerts: number;
  todayNewAlerts: number;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  national: '国家级管理员',
  provincial: '省级管理员',
  municipal: '市级/渔政站管理员',
  farmer: '养殖户',
  technician: '技术员',
};

export const ALERT_STATUS_LABELS: Record<AlertStatus, string> = {
  pending_confirm: '待养殖户确认',
  pending_review: '待渔政站复核',
  pending_approve: '待省级批准',
  processing: '处置中',
  closed: '已关闭',
  false_alarm: '误报',
};

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  dissolved_oxygen: '溶解氧异常',
  disease: '病害率超标',
};

export const MEASURE_TYPE_LABELS: Record<MeasureRecord['type'], string> = {
  aeration: '物理增氧',
  isolation: '隔离措施',
  water_change: '换水',
  medication: '药物治疗',
};

export const SPECIES_OPTIONS = [
  '草鱼',
  '鲤鱼',
  '鲫鱼',
  '鲢鱼',
  '鳙鱼',
  '南美白对虾',
  '罗氏沼虾',
  '中华绒螯蟹',
  '大闸蟹',
  '牡蛎',
  '扇贝',
  '海参',
  '鲍鱼',
  '大黄鱼',
  '石斑鱼',
];

export const PROVINCE_OPTIONS = [
  '北京', '天津', '河北', '辽宁', '上海', '江苏', '浙江', '安徽',
  '福建', '山东', '湖北', '湖南', '广东', '广西', '海南', '重庆',
  '四川', '贵州', '云南', '陕西', '甘肃', '青海', '宁夏', '新疆',
  '黑龙江', '吉林', '内蒙古', '江西', '河南', '山西', '西藏',
];

export const DISEASE_TYPES = [
  '烂鳃病', '赤皮病', '肠炎病', '出血病', '水霉病',
  '小瓜虫病', '指环虫病', '车轮虫病', '肝胆综合征', '弧菌病',
];
