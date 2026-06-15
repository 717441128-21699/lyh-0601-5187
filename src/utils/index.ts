import dayjs from 'dayjs';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatNumber = (value: number, decimals = 2) => {
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

export const formatPercent = (value: number, decimals = 1) => {
  return `${formatNumber(value, decimals)}%`;
};

export const formatDate = (date: string, format = 'YYYY-MM-DD') => {
  return dayjs(date).format(format);
};

export const formatDateTime = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm');
};

export const fromNow = (date: string) => {
  const now = dayjs();
  const target = dayjs(date);
  const diffMins = now.diff(target, 'minute');
  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  const diffHours = now.diff(target, 'hour');
  if (diffHours < 24) return `${diffHours}小时前`;
  const diffDays = now.diff(target, 'day');
  if (diffDays < 7) return `${diffDays}天前`;
  return formatDate(date);
};

export const getTrendIcon = (value: number) => {
  if (value > 0) return '↑';
  if (value < 0) return '↓';
  return '→';
};

export const getTrendColor = (value: number, isGood = true) => {
  if (value === 0) return 'text-gray-500';
  if (isGood) {
    return value > 0 ? 'text-alert-success' : 'text-alert-danger';
  }
  return value > 0 ? 'text-alert-danger' : 'text-alert-success';
};

export const getWaterQualityColor = (passRate: number) => {
  if (passRate >= 95) return '#22C55E';
  if (passRate >= 85) return '#088395';
  if (passRate >= 70) return '#FF6B35';
  return '#E63946';
};

export const getStatusColor = (status: 'normal' | 'warning' | 'danger') => {
  switch (status) {
    case 'normal':
      return 'bg-alert-success';
    case 'warning':
      return 'bg-alert-warning';
    case 'danger':
      return 'bg-alert-danger';
  }
};

export const getAlertStatusStyle = (status: string) => {
  switch (status) {
    case 'pending_confirm':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'pending_review':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'pending_approve':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'processing':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'closed':
      return 'bg-gray-100 text-gray-600 border-gray-200';
    case 'false_alarm':
      return 'bg-gray-100 text-gray-500 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-200';
  }
};

export const parseExcelFormula = (data: any[][]): {
  name: string;
  crudeProtein: number;
  crudeFat: number;
  crudeFiber: number;
  ash: number;
  moisture: number;
  suitableSpecies: string[];
} | null => {
  if (!data || data.length < 5) return null;
  const getValue = (rowIdx: number, colIdx: number) => {
    const row = data[rowIdx];
    return row ? row[colIdx] : undefined;
  };
  const findValue = (keyword: string): number | undefined => {
    for (let r = 0; r < Math.min(data.length, 30); r++) {
      for (let c = 0; c < Math.min(data[r]?.length || 0, 10); c++) {
        const cell = String(data[r][c] || '');
        if (cell.includes(keyword)) {
          const next = data[r][c + 1];
          if (typeof next === 'number') return next;
          const match = String(next || '').match(/[\d.]+/);
          if (match) return parseFloat(match[0]);
        }
      }
    }
    return undefined;
  };
  return {
    name: String(getValue(0, 1) || getValue(0, 0) || '未命名配方'),
    crudeProtein: findValue('粗蛋白') ?? 28,
    crudeFat: findValue('粗脂肪') ?? 5,
    crudeFiber: findValue('粗纤维') ?? 8,
    ash: findValue('粗灰分') ?? 15,
    moisture: findValue('水分') ?? 12,
    suitableSpecies: ['草鱼'],
  };
};
