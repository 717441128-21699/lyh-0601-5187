import { useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import {
  FileText,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  ChevronRight,
  Droplets,
  Bug,
  Fish,
  Lightbulb,
} from 'lucide-react';
import Card from '../components/ui/Card';
import { useDataStore } from '../store/dataStore';
import { useAuthStore } from '../store/authStore';
import { cn, formatDate, formatPercent, getTrendColor } from '../utils';

export default function Reports() {
  const { filterReportsByScope } = useDataStore();
  const { user } = useAuthStore();

  const scopedReports = useMemo(
    () => filterReportsByScope(user?.role || 'national', user?.province, user?.city),
    [filterReportsByScope, user]
  );

  const [selectedId, setSelectedId] = useState(scopedReports[0]?.id || '');
  const selected = scopedReports.find((r) => r.id === selectedId) || scopedReports[0];

  const survivalChart = useMemo(() => {
    if (!selected) return {};
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 20, top: 30, bottom: 30 },
      xAxis: {
        type: 'category',
        data: ['本周', '上周', '去年同期'],
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisLabel: { color: '#64748b', fontSize: 12 },
      },
      yAxis: {
        type: 'value',
        min: 80,
        max: 100,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#94a3b8', fontSize: 11, formatter: '{value}%' },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
      },
      series: [
        {
          type: 'bar',
          data: [
            selected.survivalRate,
            selected.survivalRate - selected.survivalRateMoM,
            selected.survivalRate - selected.survivalRateYoY,
          ],
          barWidth: 40,
          itemStyle: {
            borderRadius: [8, 8, 0, 0],
            color: (p: any) => {
              const colors = ['#088395', '#4FA7CC', '#A9D5E6'];
              return colors[p.dataIndex];
            },
          },
          label: {
            show: true,
            position: 'top',
            color: '#0A4D68',
            fontWeight: 600,
            formatter: '{c}%',
          },
        },
      ],
    };
  }, [selected]);

  const waterQualityChart = useMemo(() => {
    if (!selected) return {};
    const weeks = ['第1周', '第2周', '第3周', '第4周', '第5周', '第6周', '本周'];
    return {
      tooltip: { trigger: 'axis', formatter: '{b}: {c}%' },
      grid: { left: 40, right: 20, top: 20, bottom: 30 },
      xAxis: {
        type: 'category',
        data: weeks,
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisLabel: { color: '#64748b', fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        min: 70,
        max: 100,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#94a3b8', fontSize: 11, formatter: '{value}%' },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
      },
      series: [
        {
          type: 'line',
          smooth: true,
          data: [82, 85, 83, 88, 86, 89, selected.waterQualityPassRate],
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { width: 3, color: '#088395' },
          itemStyle: { color: '#088395', borderColor: '#fff', borderWidth: 2 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(8, 131, 149, 0.25)' },
              { offset: 1, color: 'rgba(8, 131, 149, 0.02)' },
            ]),
          },
          markLine: {
            silent: true,
            lineStyle: { color: '#FF6B35', type: 'dashed' },
            data: [{ yAxis: 85, label: { formatter: '目标 85%', color: '#FF6B35', fontSize: 10 } }],
          },
        },
      ],
    };
  }, [selected]);

  const diseaseChart = useMemo(() => {
    if (!selected) return {};
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}例 ({d}%)',
      },
      legend: {
        bottom: 0,
        textStyle: { color: '#64748b', fontSize: 11 },
      },
      color: ['#E63946', '#FF6B35', '#088395', '#05BFDB', '#6366f1'],
      series: [
        {
          type: 'pie',
          radius: ['50%', '75%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 3 },
          label: { show: false },
          emphasis: {
            label: { show: true, fontSize: 12, fontWeight: 'bold' },
          },
          data: selected.diseaseDistribution.map((d) => ({
            name: d.type,
            value: d.count,
          })),
        },
      ],
    };
  }, [selected]);

  const scopeLabel = user?.role === 'national'
    ? '全国'
    : user?.province
      ? user?.city ? `${user.province} · ${user.city}` : user.province
      : '全国';

  if (!selected) {
    return (
      <div className="text-center py-16 text-gray-500">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
        暂无周报数据
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif font-bold text-ink-900">养殖健康诊断报告 · {scopeLabel}</h2>
          <p className="text-sm text-gray-500 mt-0.5">每周自动生成，包含成活率、水质与病害分析及优化建议</p>
        </div>
        <button className="px-4 py-2 rounded-lg bg-ocean-600 text-white text-sm font-medium hover:bg-ocean-700 flex items-center gap-2">
          <Download className="w-4 h-4" />
          导出报告
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card title="历史周报">
            <div className="space-y-2">
              {scopedReports.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={cn(
                    'p-3 rounded-lg cursor-pointer transition border',
                    selectedId === r.id
                      ? 'bg-ocean-600 text-white border-ocean-600'
                      : 'border-gray-100 hover:border-ocean-200 hover:bg-ocean-50'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className={cn('w-4 h-4', selectedId === r.id ? 'text-white/80' : 'text-gray-400')} />
                      <span className="text-sm font-medium">
                        {formatDate(r.weekStart)}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </div>
                  <div className={cn('text-xs mt-1.5', selectedId === r.id ? 'text-white/70' : 'text-gray-400')}>
                    {r.zoneName}
                  </div>
                </div>
              ))}
              {scopedReports.length === 0 && (
                <div className="text-center py-6 text-gray-400 text-sm">当前范围暂无报告</div>
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-gray-400">健康诊断周报</div>
                <h3 className="text-lg font-serif font-bold text-ink-900 mt-1">{selected.zoneName}</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  统计周期：{formatDate(selected.weekStart)} ~ {formatDate(selected.weekEnd)}
                </p>
              </div>
              <div className="text-xs text-gray-400">
                生成时间：{formatDate(selected.generatedAt)}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {[
                {
                  label: '成活率',
                  value: formatPercent(selected.survivalRate, 1),
                  trend: selected.survivalRateMoM,
                  trendLabel: '环比',
                  icon: Fish,
                  gradient: 'from-ocean-500 to-ocean-700',
                },
                {
                  label: '成活率同比',
                  value: (selected.survivalRateYoY > 0 ? '+' : '') + selected.survivalRateYoY + '%',
                  trend: selected.survivalRateYoY,
                  icon: TrendingUp,
                  gradient: selected.survivalRateYoY >= 0 ? 'from-emerald-500 to-teal-600' : 'from-rose-500 to-red-600',
                },
                {
                  label: '水质达标率',
                  value: formatPercent(selected.waterQualityPassRate, 1),
                  trend: selected.waterQualityPassRateChange,
                  trendLabel: '较上周',
                  icon: Droplets,
                  gradient: 'from-indigo-500 to-indigo-700',
                },
                {
                  label: '病害种类',
                  value: selected.diseaseDistribution.length,
                  icon: Bug,
                  gradient: 'from-amber-500 to-orange-600',
                },
              ].map((s) => (
                <div key={s.label} className={cn('p-4 rounded-xl text-white bg-gradient-to-br', s.gradient)}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/80">{s.label}</span>
                    <s.icon className="w-4 h-4 text-white/70" />
                  </div>
                  <div className="text-2xl font-bold font-serif mt-2">{s.value}</div>
                  {s.trend !== undefined && (
                    <div className="flex items-center gap-1 mt-1 text-xs">
                      {s.trend >= 0 ? (
                        <ArrowUpRight className={cn('w-3 h-3', getTrendColor(s.trend, true) === 'text-alert-success' ? 'text-green-200' : 'text-red-200')} />
                      ) : (
                        <ArrowDownRight className={cn('w-3 h-3', getTrendColor(s.trend, true) === 'text-alert-danger' ? 'text-red-200' : 'text-green-200')} />
                      )}
                      <span className="text-white/80">{s.trendLabel || '较上周'} {s.trend > 0 ? '+' : ''}{s.trend}%</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="成活率对比" subtitle="本周 vs 上周 vs 去年同期">
              <ReactECharts option={survivalChart} style={{ height: 260 }} />
            </Card>
            <Card title="水质达标率趋势" subtitle="近6周变化">
              <ReactECharts option={waterQualityChart} style={{ height: 260 }} />
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="病害类型分布" subtitle="本周统计">
              <ReactECharts option={diseaseChart} style={{ height: 260 }} />
            </Card>
            <Card title="优化建议" subtitle="基于本周数据分析" icon={<Lightbulb />}>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-ocean-50 border border-ocean-100">
                  <div className="flex items-center gap-2 font-medium text-ocean-800 mb-2">
                    <Fish className="w-4 h-4" />
                    投喂优化建议
                  </div>
                  <p className="text-sm text-ocean-700 leading-relaxed">
                    {selected.feedingOptimization}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="flex items-center gap-2 font-medium text-emerald-800 mb-2">
                    <Droplets className="w-4 h-4" />
                    换水方案建议
                  </div>
                  <p className="text-sm text-emerald-700 leading-relaxed">
                    {selected.waterChangeRecommendation}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
