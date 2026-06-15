import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import {
  ArrowLeft,
  MapPin,
  Thermometer,
  Droplets,
  AlertTriangle,
  Fish,
  Activity,
} from 'lucide-react';
import Card from '../components/ui/Card';
import { useDataStore } from '../store/dataStore';
import { cn, formatDate, formatNumber, formatPercent, formatDateTime, getStatusColor } from '../utils';

export default function ZoneDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getZoneById, getZonePonds, getZoneWaterQuality, getZoneDiseases } = useDataStore();

  const zone = getZoneById(id || '');
  const ponds = getZonePonds(id || '');
  const waterQuality = getZoneWaterQuality(id || '');
  const diseases = getZoneDiseases(id || '');

  const trendOption = useMemo(() => {
    const sorted = [...waterQuality].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    const times = sorted.map((w) => w.timestamp.slice(5, 16));
    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(10, 77, 104, 0.9)',
        borderWidth: 0,
        textStyle: { color: '#fff' },
      },
      legend: {
        data: ['溶解氧(mg/L)', 'pH', '氨氮(mg/L)', '水温(℃)'],
        top: 0,
        textStyle: { color: '#64748b', fontSize: 11 },
      },
      grid: { left: 40, right: 50, top: 40, bottom: 30 },
      xAxis: {
        type: 'category',
        data: times,
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisLabel: { color: '#94a3b8', fontSize: 10, interval: 10 },
      },
      yAxis: [
        {
          type: 'value',
          position: 'left',
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: '#94a3b8', fontSize: 10 },
          splitLine: { lineStyle: { color: '#f1f5f9' } },
        },
        {
          type: 'value',
          position: 'right',
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: '#94a3b8', fontSize: 10 },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: '溶解氧(mg/L)',
          type: 'line',
          smooth: true,
          data: sorted.map((w) => w.dissolvedOxygen),
          itemStyle: { color: '#088395' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(8, 131, 149, 0.3)' },
              { offset: 1, color: 'rgba(8, 131, 149, 0.02)' },
            ]),
          },
          symbol: 'none',
          lineStyle: { width: 2 },
        },
        {
          name: 'pH',
          type: 'line',
          smooth: true,
          data: sorted.map((w) => w.ph),
          yAxisIndex: 1,
          itemStyle: { color: '#6366f1' },
          symbol: 'none',
          lineStyle: { width: 2 },
        },
        {
          name: '氨氮(mg/L)',
          type: 'line',
          smooth: true,
          data: sorted.map((w) => w.ammoniaNitrogen),
          itemStyle: { color: '#FF6B35' },
          symbol: 'none',
          lineStyle: { width: 2 },
        },
        {
          name: '水温(℃)',
          type: 'line',
          smooth: true,
          data: sorted.map((w) => w.temperature),
          yAxisIndex: 1,
          itemStyle: { color: '#E63946' },
          symbol: 'none',
          lineStyle: { width: 2 },
        },
      ],
    };
  }, [waterQuality]);

  const diseaseOption = useMemo(() => {
    const typeMap: Record<string, number> = {};
    diseases.forEach((d) => {
      typeMap[d.diseaseType] = (typeMap[d.diseaseType] || 0) + d.affectedCount;
    });
    const data = Object.entries(typeMap).map(([name, value]) => ({ name, value }));
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}尾 ({d}%)',
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center',
        textStyle: { color: '#64748b', fontSize: 11 },
      },
      color: ['#088395', '#05BFDB', '#FF6B35', '#E63946', '#6366f1', '#22C55E'],
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          emphasis: {
            label: { show: true, fontSize: 12, fontWeight: 'bold' },
          },
          data,
        },
      ],
    };
  }, [diseases]);

  if (!zone) {
    return (
      <div className="text-center py-16 text-gray-500">
        未找到该养殖区信息
        <button onClick={() => navigate('/dashboard')} className="block mx-auto mt-4 text-ocean-600">
          返回看板
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-serif font-bold text-ink-900 flex items-center gap-2">
              {zone.name}
              <MapPin className="w-5 h-5 text-ocean-500" />
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {zone.province} · {zone.city} · {zone.totalArea}亩 · {zone.pondCount}个养殖池
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {zone.species.map((s) => (
            <span key={s} className="px-3 py-1 rounded-full text-xs bg-ocean-100 text-ocean-700">
              <Fish className="w-3 h-3 inline mr-1" />
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* 实时指标卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '溶解氧', value: formatNumber(ponds[0]?.currentDO || 0, 1), unit: 'mg/L', icon: Droplets, color: 'from-ocean-500 to-ocean-700' },
          { label: 'pH值', value: formatNumber(ponds[0]?.currentPH || 0, 1), unit: '', icon: Activity, color: 'from-indigo-500 to-indigo-700' },
          { label: '氨氮', value: formatNumber(ponds[0]?.currentAmmonia || 0, 2), unit: 'mg/L', icon: AlertTriangle, color: 'from-amber-500 to-orange-600' },
          { label: '水温', value: formatNumber(ponds[0]?.currentTemp || 0, 1), unit: '℃', icon: Thermometer, color: 'from-rose-500 to-red-600' },
        ].map((m) => (
          <div key={m.label} className="bg-white rounded-xl p-4 shadow-card border border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{m.label}</span>
              <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br text-white flex items-center justify-center', m.color)}>
                <m.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold font-serif text-ink-900">{m.value}</span>
              <span className="text-sm text-gray-400 ml-1">{m.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 趋势图 + 病害分布 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="近7天水质趋势" subtitle="多指标变化曲线" className="lg:col-span-2">
          <ReactECharts option={trendOption} style={{ height: 320 }} />
        </Card>
        <Card title="病害类型分布" subtitle="近30天统计">
          <ReactECharts option={diseaseOption} style={{ height: 320 }} />
        </Card>
      </div>

      {/* 养殖池列表 */}
      <Card title="养殖池实时状态" subtitle={`共 ${ponds.length} 个养殖池`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-3 px-4 font-medium">养殖池</th>
                <th className="py-3 px-4 font-medium">面积(亩)</th>
                <th className="py-3 px-4 font-medium">品种</th>
                <th className="py-3 px-4 font-medium">溶解氧</th>
                <th className="py-3 px-4 font-medium">pH</th>
                <th className="py-3 px-4 font-medium">氨氮</th>
                <th className="py-3 px-4 font-medium">水温</th>
                <th className="py-3 px-4 font-medium">状态</th>
                <th className="py-3 px-4 font-medium">更新时间</th>
              </tr>
            </thead>
            <tbody>
              {ponds.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-ocean-50/50 transition">
                  <td className="py-3 px-4 font-medium text-ink-900">{p.name}</td>
                  <td className="py-3 px-4 text-gray-600">{p.area}</td>
                  <td className="py-3 px-4 text-gray-600">{p.species}</td>
                  <td className="py-3 px-4 font-mono">{formatNumber(p.currentDO, 1)}</td>
                  <td className="py-3 px-4 font-mono">{formatNumber(p.currentPH, 1)}</td>
                  <td className="py-3 px-4 font-mono">{formatNumber(p.currentAmmonia, 2)}</td>
                  <td className="py-3 px-4 font-mono">{formatNumber(p.currentTemp, 1)}℃</td>
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-2">
                      <span className={cn('w-2 h-2 rounded-full', getStatusColor(p.status))} />
                      <span className={cn(
                        'text-xs font-medium',
                        p.status === 'normal' && 'text-alert-success',
                        p.status === 'warning' && 'text-alert-warning',
                        p.status === 'danger' && 'text-alert-danger',
                      )}>
                        {p.status === 'normal' ? '正常' : p.status === 'warning' ? '预警' : '异常'}
                      </span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{formatDateTime(new Date().toISOString())}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 近期病害记录 */}
      <Card title="近期病害记录" subtitle="最近30天">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {diseases.slice(0, 6).map((d) => (
            <div key={d.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <span className="font-medium text-ink-900">{d.diseaseType}</span>
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  d.rate > 5 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                )}>
                  {formatPercent(d.rate)}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                发病 {d.affectedCount} 尾 / 总数 {d.totalCount} 尾
              </div>
              <div className="text-xs text-gray-400 mt-1">{formatDate(d.date)}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
