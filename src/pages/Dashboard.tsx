import { useEffect, useMemo } from 'react';
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
    selectedSpecies,
    selectedProvince,
    setSelectedSpecies,
    setSelectedProvince,
    computeOverviewStats,
    computeRegionStats,
    filterZonesByScope,
    filterAlertsByScope,
    canAccessZone,
  } = useDataStore();

  const role = user?.role || 'national';
  const userProvince = user?.province;
  const userCity = user?.city;
  const farmIds = user?.farmIds;

  // 核心逻辑：根据角色+看板选择的省份+品种 计算最终过滤参数
  // 国家级：用户可在看板上选"全国"或具体省份，selectedProvince真正作为省份筛选参数
  // 省级：只有自己省，不切
  // 市级：只有自己市，不切，热力图/排名按 city 分组
  const filterProvince = (() => {
    if (farmIds && farmIds.length > 0) return undefined;
    if (role === 'national') {
      return selectedProvince === '全国' ? undefined : selectedProvince;
    }
    if (role === 'provincial') return userProvince;
    if (role === 'municipal' || role === 'technician') return userProvince;
    return undefined;
  })();

  const filterCity = (() => {
    if (farmIds && farmIds.length > 0) return undefined;
    if (role === 'municipal' || role === 'technician') return userCity;
    // 养殖户按farmIds，不按city
    return undefined;
  })();

  // 热力图/排名按什么维度分组
  const groupBy: 'province' | 'city' = (role === 'municipal' || role === 'technician') ? 'city' : 'province';

  // ⚠️ 统一从同一个过滤后的养殖区集合衍生所有数据，确保口径一致
  const filteredZones = useMemo(
    () => filterZonesByScope(role, filterProvince, filterCity, selectedSpecies, farmIds),
    [filterZonesByScope, role, filterProvince, filterCity, selectedSpecies, farmIds]
  );

  // 统计卡片：直接基于 filteredZones 计算
  const overview = useMemo(
    () => computeOverviewStats(role, filterProvince, filterCity, selectedSpecies, farmIds),
    [computeOverviewStats, role, filterProvince, filterCity, selectedSpecies, farmIds]
  );

  // 热力图 & 产量排名：基于同一个 filteredZones 动态聚合
  const regionStats = useMemo(
    () => computeRegionStats(filteredZones, selectedSpecies, groupBy),
    [computeRegionStats, filteredZones, selectedSpecies, groupBy]
  );

  // 实时预警：同样基于同一个过滤范围
  const filteredAlerts = useMemo(() => {
    return filterAlertsByScope(role, filterProvince, filterCity, selectedSpecies, farmIds)
      .filter((a) => a.status !== 'closed' && a.status !== 'false_alarm')
      .sort((a, b) => b.triggeredAt.localeCompare(a.triggeredAt))
      .slice(0, 6);
  }, [filterAlertsByScope, role, filterProvince, filterCity, selectedSpecies, farmIds]);

  const displayStats = regionStats;

  const heatmapOption = useMemo(() => {
    const data = displayStats.map((s) => ({
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
          const stat = displayStats.find((s) => s.province === params.name);
          if (!stat) return params.name;
          const unit = stat.isCity ? '养殖区' : '养殖场';
          return `
            <div style="padding:4px">
              <div style="font-weight:600;margin-bottom:6px">${params.name}</div>
              <div>水质达标率: <b>${formatPercent(stat.waterQualityPassRate)}</b></div>
              <div>${unit}: ${stat.farmCount} 家</div>
              <div>病害率: ${formatPercent(stat.diseaseRate)}</div>
              <div>预计产量: ${formatNumber(stat.estimatedYield, 0)} 吨</div>
            </div>
          `;
        },
      },
      visualMap: { show: false, min: 60, max: 100 },
      series: [
        {
          type: 'map',
          map: 'china',
          roam: false,
          label: { show: true, color: '#fff', fontSize: 10 },
          itemStyle: {
            areaColor: '#D6ECF3',
            borderColor: '#fff',
            borderWidth: 1,
          },
          emphasis: {
            itemStyle: { areaColor: '#088395' },
            label: { color: '#fff' },
          },
          data,
        },
      ],
    };
  }, [displayStats]);

  const rankingOption = useMemo(() => {
    const sorted = [...displayStats].sort((a, b) => b.estimatedYield - a.estimatedYield).slice(0, 10);
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
            formatter: (p: any) => (p.value >= 10000 ? `${formatNumber(p.value / 10000, 1)}万` : formatNumber(p.value, 0)),
          },
        },
      ],
    };
  }, [displayStats]);

  useEffect(() => {
    if (!echarts.getMap('china')) {
      const geoJson: any = {
        type: 'FeatureCollection',
        features: CHINA_PROVINCES.map((name, i) => ({
          type: 'Feature',
          properties: { name },
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [70 + (i % 5) * 20, 50 - Math.floor(i / 5) * 15],
              [90 + (i % 5) * 20, 50 - Math.floor(i / 5) * 15],
              [90 + (i % 5) * 20, 35 - Math.floor(i / 5) * 15],
              [70 + (i % 5) * 20, 35 - Math.floor(i / 5) * 15],
              [70 + (i % 5) * 20, 50 - Math.floor(i / 5) * 15],
            ]],
          },
        })),
      };
      echarts.registerMap('china', geoJson);
    }
  }, []);

  // 省份筛选：只有国家级可切全国/各省
  const availableProvinces = (() => {
    if (farmIds && farmIds.length > 0) return [userProvince || '全国'];
    if (role === 'national') return ['全国', ...PROVINCE_OPTIONS];
    if (role === 'provincial' && userProvince) return [userProvince];
    if ((role === 'municipal' || role === 'technician') && userProvince) return [userProvince];
    return ['全国', ...PROVINCE_OPTIONS];
  })();

  // 标题范围展示
  const scopeLabel = (() => {
    if (farmIds && farmIds.length > 0) {
      return `${userProvince || ''} ${userCity || ''} · 我的养殖场`;
    }
    if (role === 'national') {
      return selectedProvince === '全国' ? '全国' : selectedProvince;
    }
    if (role === 'provincial') return userProvince || '全国';
    if (role === 'municipal' || role === 'technician') {
      return `${userProvince || ''} · ${userCity || ''}`;
    }
    return '全国';
  })();

  const canSwitchProvince = role === 'national';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-serif font-bold text-ink-900">
            {scopeLabel}数据概览
            {selectedSpecies !== '全部' && (
              <span className="ml-2 text-sm font-normal text-ocean-600">· {selectedSpecies}</span>
            )}
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            实时监测{scopeLabel}水产养殖环境与病害情况 · 共 {filteredZones.length} 个养殖区
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canSwitchProvince && (
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
          )}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          label="养殖场总数"
          value={formatNumber(overview.totalFarms, 0)}
          suffix="家"
          icon={Factory}
          gradient="bg-gradient-to-br from-ocean-600 to-ocean-800"
        />
        <StatCard
          label="水质达标率"
          value={formatPercent(overview.avgWaterQualityPassRate, 1)}
          icon={Droplets}
          gradient="bg-gradient-to-br from-aqua-500 to-ocean-600"
        />
        <StatCard
          label="病害发生率"
          value={formatPercent(overview.avgDiseaseRate, 1)}
          icon={Bug}
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
        />
        <StatCard
          label="预计总产量"
          value={overview.estimatedTotalYield >= 10000 ? formatNumber(overview.estimatedTotalYield / 10000, 1) : formatNumber(overview.estimatedTotalYield, 0)}
          suffix={overview.estimatedTotalYield >= 10000 ? '万吨' : '吨'}
          icon={TrendingUp}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-700"
        />
        <StatCard
          label="平均成活率"
          value={formatPercent(overview.avgSurvivalRate, 1)}
          icon={Fish}
          gradient="bg-gradient-to-br from-indigo-500 to-ocean-700"
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card
          title={`${scopeLabel}水质达标率热力图`}
          subtitle={selectedSpecies !== '全部' ? `品种：${selectedSpecies} · ${groupBy === 'city' ? '按城市' : '按省份'}统计` : groupBy === 'city' ? '按城市统计' : '按省份统计'}
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
                const zone = filteredZones.find((z) => (groupBy === 'city' ? z.city : z.province) === params.name);
                if (zone && canAccessZone(zone.id, role, userProvince, userCity, farmIds)) {
                  navigate(`/zone/${zone.id}`);
                }
              },
            }}
          />
        </Card>

        <Card
          title={`产量排名 TOP${Math.min(10, displayStats.length)}`}
          subtitle={selectedSpecies !== '全部' ? `品种：${selectedSpecies}` : groupBy === 'city' ? '按城市统计' : '按省份统计'}
        >
          {displayStats.length > 0 ? (
            <ReactECharts option={rankingOption} style={{ height: 420 }} />
          ) : (
            <div className="h-[420px] flex items-center justify-center text-gray-400 text-sm">暂无数据</div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="实时预警"
          subtitle={`当前范围内 ${filteredAlerts.length} 条预警`}
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
                  <div className="flex items-center gap-2 flex-wrap">
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
              <div className="text-center text-gray-400 py-8 text-sm">当前范围暂无活跃预警</div>
            )}
          </div>
        </Card>

        <Card title="养殖区动态" subtitle={`共 ${filteredZones.length} 个养殖区`}>
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
            {filteredZones.slice(0, 10).map((zone) => {
              // 用该养殖区所在"分组"（省或市）的统计数据做展示
              const key = groupBy === 'city' ? zone.city : zone.province;
              const zoneStats = regionStats.find((s) => s.province === key);
              return (
                <div
                  key={zone.id}
                  onClick={() => {
                    if (canAccessZone(zone.id, role, userProvince, userCity, farmIds)) {
                      navigate(`/zone/${zone.id}`);
                    }
                  }}
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
                    <div
                      className="text-sm font-semibold"
                      style={{ color: zoneStats ? getWaterQualityColor(zoneStats.waterQualityPassRate) : '#088395' }}
                    >
                      {zoneStats ? formatPercent(zoneStats.waterQualityPassRate) : '--'}
                    </div>
                    <div className="text-[11px] text-gray-400">达标率</div>
                  </div>
                </div>
              );
            })}
            {filteredZones.length === 0 && (
              <div className="text-center text-gray-400 py-8 text-sm">当前范围暂无匹配的养殖区</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
