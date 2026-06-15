import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import {
  Factory,
  Droplets,
  Bug,
  TrendingUp,
  Fish,
  AlertCircle,
  ChevronRight,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import Card from '../components/ui/Card';
import { useDataStore } from '../store/dataStore';
import { useAuthStore } from '../store/authStore';
import { SPECIES_OPTIONS, PROVINCE_OPTIONS, ALERT_STATUS_LABELS, ALERT_TYPE_LABELS } from '../types';
import { cn, formatNumber, formatPercent, fromNow, getAlertStatusStyle, getWaterQualityColor } from '../utils';

// 简化的中国省份数据（使用矩形模拟热力图区域）
const CHINA_PROVINCES = PROVINCE_OPTIONS.slice(0, 20);

function StatCard({
  label,
  value,
  suffix,
  icon: Icon,
  trend,
  trendLabel,
  gradient,
}: {
  label: string;
  value: string | number;
  suffix?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: number;
  trendLabel?: string;
  gradient: string;
}) {
  const isGood = trend !== undefined && trend >= 0;
  return (
    <div className={cn('rounded-xl p-5 text-white relative overflow-hidden', gradient)}>
      <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10" />
      <div className="absolute right-4 top-4 w-12 h-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
        <Icon className="w-6 h-6" />
      </div>
      <div className="text-sm text-white/80">{label}</div>
      <div className="text-3xl font-bold font-serif mt-2 number-animate">
        {value}
        {suffix && <span className="text-lg font-normal ml-1 text-white/80">{suffix}</span>}
      </div>
      {trend !== undefined && (
        <div className={cn('flex items-center gap-1 mt-2 text-sm', isGood ? 'text-green-200' : 'text-red-200')}>
          {isGood ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          <span>{trendLabel || `${Math.abs(trend)}% 较上周`}</span>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    overview,
    provinceStats,
    alerts,
    selectedSpecies,
    selectedProvince,
    setSelectedSpecies,
    setSelectedProvince,
    zones,
  } = useDataStore();

  const filteredStats = useMemo(() => {
    return provinceStats.filter(
      (s) => selectedProvince === '全国' || s.province === selectedProvince
    );
  }, [provinceStats, selectedProvince]);

  const filteredAlerts = useMemo(() => {
    return alerts
      .filter((a) => a.status !== 'closed' && a.status !== 'false_alarm')
      .sort((a, b) => b.triggeredAt.localeCompare(a.triggeredAt))
      .slice(0, 6);
  }, [alerts]);

  // 热力图配置
  const heatmapOption = useMemo(() => {
    const data = filteredStats.map((s) => ({
      name: s.province,
      value: s.waterQualityPassRate,
      itemStyle: {
        areaColor: getWaterQualityColor(s.waterQualityPassRate),
      },
    }));

    return {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const stat = filteredStats.find((s) => s.province === params.name);
          if (!stat) return params.name;
          return `
            <div style="padding:4px">
              <div style="font-weight:600;margin-bottom:6px">${params.name}</div>
              <div>水质达标率: <b>${formatPercent(stat.waterQualityPassRate)}</b></div>
              <div>养殖场: ${stat.farmCount} 家</div>
              <div>病害率: ${formatPercent(stat.diseaseRate)}</div>
              <div>预计产量: ${formatNumber(stat.estimatedYield, 0)} 吨</div>
            </div>
          `;
        },
      },
      visualMap: {
        show: false,
        min: 60,
        max: 100,
      },
      series: [
        {
          type: 'map',
          map: 'china',
          roam: false,
          label: {
            show: true,
            color: '#fff',
            fontSize: 10,
          },
          itemStyle: {
            areaColor: '#D6ECF3',
            borderColor: '#fff',
            borderWidth: 1,
          },
          emphasis: {
            itemStyle: {
              areaColor: '#088395',
            },
            label: {
              color: '#fff',
            },
          },
          data,
        },
      ],
    };
  }, [filteredStats]);

  // 产量排名配置
  const rankingOption = useMemo(() => {
    const sorted = [...filteredStats].sort((a, b) => b.estimatedYield - a.estimatedYield).slice(0, 10);
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const p = params[0];
          return `${p.name}<br/>预计产量: <b>${formatNumber(p.value, 0)} 吨</b>`;
        },
      },
      grid: { left: 60, right: 40, top: 10, bottom: 20 },
      xAxis: {
        type: 'value',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#94a3b8', fontSize: 11 },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
      },
      yAxis: {
        type: 'category',
        data: sorted.map((s) => s.province).reverse(),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#475569', fontSize: 12, fontWeight: 500 },
      },
      series: [
        {
          type: 'bar',
          data: sorted.map((s) => s.estimatedYield).reverse(),
          barWidth: 14,
          itemStyle: {
            borderRadius: [0, 7, 7, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#4FA7CC' },
              { offset: 1, color: '#0A4D68' },
            ]),
          },
          label: {
            show: true,
            position: 'right',
            color: '#0A4D68',
            fontWeight: 600,
            fontSize: 11,
            formatter: (p: any) => `${formatNumber(p.value / 10000, 1)}万`,
          },
        },
      ],
    };
  }, [filteredStats]);

  // 简单注册一个空地图（实际项目中应加载真实GeoJSON）
  useEffect(() => {
    if (!echarts.getMap('china')) {
      // 创建一个简单的模拟地图（矩形网格）
      const geoJson: any = {
        type: 'FeatureCollection',
        features: CHINA_PROVINCES.map((name, i) => ({
          type: 'Feature',
          properties: { name },
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [70 + (i % 5) * 20, 50 - Math.floor(i / 5) * 15],
                [90 + (i % 5) * 20, 50 - Math.floor(i / 5) * 15],
                [90 + (i % 5) * 20, 35 - Math.floor(i / 5) * 15],
                [70 + (i % 5) * 20, 35 - Math.floor(i / 5) * 15],
                [70 + (i % 5) * 20, 50 - Math.floor(i / 5) * 15],
              ],
            ],
          },
        })),
      };
      echarts.registerMap('china', geoJson);
    }
  }, []);

  const roleProvince = user?.role !== 'national' ? user?.province : undefined;
  const availableProvinces = ['全国', ...(roleProvince ? [roleProvince] : PROVINCE_OPTIONS)];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 顶部筛选栏 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-ink-900">数据概览</h2>
          <p className="text-sm text-gray-500 mt-0.5">实时监测全国水产养殖环境与病害情况</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100 outline-none cursor-pointer"
            >
              {availableProvinces.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rotate-90 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={selectedSpecies}
              onChange={(e) => setSelectedSpecies(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-8 text-sm focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100 outline-none cursor-pointer"
            >
              <option value="全部">全部品种</option>
              {SPECIES_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rotate-90 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* 指标概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          label="养殖场总数"
          value={formatNumber(overview.totalFarms, 0)}
          suffix="家"
          icon={Factory}
          gradient="bg-gradient-to-br from-ocean-600 to-ocean-800"
          trend={2.3}
        />
        <StatCard
          label="水质达标率"
          value={formatPercent(overview.avgWaterQualityPassRate, 1)}
          icon={Droplets}
          gradient="bg-gradient-to-br from-aqua-500 to-ocean-600"
          trend={1.2}
        />
        <StatCard
          label="病害发生率"
          value={formatPercent(overview.avgDiseaseRate, 1)}
          icon={Bug}
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
          trend={-0.5}
        />
        <StatCard
          label="预计总产量"
          value={formatNumber(overview.estimatedTotalYield / 10000, 1)}
          suffix="万吨"
          icon={TrendingUp}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-700"
          trend={3.8}
        />
        <StatCard
          label="平均成活率"
          value={formatPercent(overview.avgSurvivalRate, 1)}
          icon={Fish}
          gradient="bg-gradient-to-br from-indigo-500 to-ocean-700"
          trend={0.8}
        />
        <StatCard
          label="活跃预警"
          value={overview.activeAlerts}
          suffix="条"
          icon={AlertCircle}
          gradient="bg-gradient-to-br from-rose-500 to-red-700"
          trendLabel={`今日新增 ${overview.todayNewAlerts} 条`}
          trend={overview.todayNewAlerts}
        />
      </div>

      {/* 中部：热力图 + 排名 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card
          title="全国水质达标率热力图"
          subtitle="颜色越深达标率越高，点击省份可查看详情"
          className="xl:col-span-2"
          extra={
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: '#E63946' }} />60-70%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: '#FF6B35' }} />70-85%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: '#088395' }} />85-95%</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm" style={{ background: '#22C55E' }} />95-100%</span>
            </div>
          }
        >
          <ReactECharts
            option={heatmapOption}
            style={{ height: 420 }}
            onEvents={{
              click: (params: any) => {
                const zone = zones.find((z) => z.province === params.name);
                if (zone) navigate(`/zone/${zone.id}`);
              },
            }}
          />
        </Card>

        <Card title="产量排名 TOP10" subtitle="按省份预计产量排序（单位：吨）">
          <ReactECharts option={rankingOption} style={{ height: 420 }} />
        </Card>
      </div>

      {/* 底部：预警列表 + 实时数据 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="实时预警"
          subtitle="最新预警信息与处置状态"
          extra={
            <button
              onClick={() => navigate('/alerts')}
              className="text-sm text-ocean-600 hover:text-ocean-700 flex items-center gap-1"
            >
              查看全部 <ChevronRight className="w-4 h-4" />
            </button>
          }
        >
          <div className="space-y-3">
            {filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => navigate(`/alerts/${alert.id}`)}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-ocean-50 transition cursor-pointer border border-gray-50"
              >
                <div className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                  alert.type === 'dissolved_oxygen' ? 'bg-blue-100 text-blue-600' : 'bg-rose-100 text-rose-600'
                )}>
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-ink-900 truncate">{alert.zoneName}</span>
                    <span className={cn(
                      'px-2 py-0.5 text-[10px] rounded-full border font-medium',
                      getAlertStatusStyle(alert.status)
                    )}>
                      {ALERT_STATUS_LABELS[alert.status]}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {ALERT_TYPE_LABELS[alert.type]} · {alert.triggerReason}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    {fromNow(alert.triggeredAt)}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </div>
            ))}
            {filteredAlerts.length === 0 && (
              <div className="text-center text-gray-400 py-8 text-sm">暂无活跃预警</div>
            )}
          </div>
        </Card>

        <Card
          title="养殖区动态"
          subtitle="各养殖区实时状态概览"
        >
          <div className="space-y-3">
            {zones.slice(0, 6).map((zone) => {
              const stats = provinceStats.find((s) => s.province === zone.province);
              return (
                <div
                  key={zone.id}
                  onClick={() => navigate(`/zone/${zone.id}`)}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-ocean-50 transition cursor-pointer border border-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-ocean-100 text-ocean-600 flex items-center justify-center">
                      <Fish className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-medium text-sm text-ink-900">{zone.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {zone.province} · {zone.city} · {zone.species.slice(0, 2).join('/')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold" style={{ color: stats ? getWaterQualityColor(stats.waterQualityPassRate) : '#088395' }}>
                      {stats ? formatPercent(stats.waterQualityPassRate) : '--'}
                    </div>
                    <div className="text-[11px] text-gray-400">达标率</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
