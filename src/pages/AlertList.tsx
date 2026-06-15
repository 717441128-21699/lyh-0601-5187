import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Filter,
  Search,
  Clock,
  ChevronRight,
  Wind,
  Bug,
} from 'lucide-react';
import Card from '../components/ui/Card';
import { useDataStore } from '../store/dataStore';
import { useAuthStore } from '../store/authStore';
import { AlertStatus, ALERT_STATUS_LABELS, ALERT_TYPE_LABELS } from '../types';
import { cn, fromNow, getAlertStatusStyle, formatDate } from '../utils';

const STATUS_FILTERS: { value: AlertStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending_confirm', label: '待确认' },
  { value: 'pending_review', label: '待复核' },
  { value: 'pending_approve', label: '待批准' },
  { value: 'processing', label: '处置中' },
  { value: 'closed', label: '已关闭' },
  { value: 'false_alarm', label: '误报' },
];

export default function AlertList() {
  const navigate = useNavigate();
  const { filterAlertsByScope } = useDataStore();
  const { user } = useAuthStore();
  const [statusFilter, setStatusFilter] = useState<AlertStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'dissolved_oxygen' | 'disease'>('all');
  const [search, setSearch] = useState('');

  const scopedAlerts = useMemo(
    () => filterAlertsByScope(user?.role || 'national', user?.province, user?.city),
    [filterAlertsByScope, user]
  );

  const filtered = useMemo(() => {
    return scopedAlerts.filter((a) => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (typeFilter !== 'all' && a.type !== typeFilter) return false;
      if (search && !a.zoneName.includes(search)) return false;
      return true;
    }).sort((a, b) => b.triggeredAt.localeCompare(a.triggeredAt));
  }, [scopedAlerts, statusFilter, typeFilter, search]);

  const stats = useMemo(() => ({
    total: scopedAlerts.length,
    pending: scopedAlerts.filter((a) => ['pending_confirm', 'pending_review', 'pending_approve'].includes(a.status)).length,
    processing: scopedAlerts.filter((a) => a.status === 'processing').length,
    today: scopedAlerts.filter((a) => formatDate(a.triggeredAt) === formatDate(new Date().toISOString())).length,
  }), [scopedAlerts]);

  const scopeLabel = user?.role === 'national'
    ? '全国'
    : user?.province
      ? user?.city ? `${user.province} · ${user.city}` : user.province
      : '全国';

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-serif font-bold text-ink-900">预警中心 · {scopeLabel}</h2>
        <p className="text-sm text-gray-500 mt-0.5">水质异常与病害超标预警的全流程管理</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '预警总数', value: stats.total, icon: AlertTriangle, color: 'from-ocean-500 to-ocean-700' },
          { label: '待处理', value: stats.pending, icon: Clock, color: 'from-amber-500 to-orange-600' },
          { label: '处置中', value: stats.processing, icon: Wind, color: 'from-indigo-500 to-indigo-700' },
          { label: '今日新增', value: stats.today, icon: Bug, color: 'from-rose-500 to-red-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-5 shadow-card border border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{s.label}</span>
              <div className={cn('w-9 h-9 rounded-lg bg-gradient-to-br text-white flex items-center justify-center', s.color)}>
                <s.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-bold font-serif mt-3 text-ink-900">{s.value}</div>
          </div>
        ))}
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索养殖区名称..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100 outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <div className="flex flex-wrap gap-1">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition',
                    statusFilter === f.value
                      ? 'bg-ocean-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-1">
            {[
              { value: 'all', label: '全部类型' },
              { value: 'dissolved_oxygen', label: '溶解氧' },
              { value: 'disease', label: '病害' },
            ].map((t) => (
              <button
                key={t.value}
                onClick={() => setTypeFilter(t.value as any)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition border',
                  typeFilter === t.value
                    ? 'border-ocean-500 bg-ocean-50 text-ocean-700'
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {filtered.map((alert) => (
            <div
              key={alert.id}
              onClick={() => navigate(`/alerts/${alert.id}`)}
              className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:border-ocean-200 hover:bg-ocean-50/30 transition cursor-pointer"
            >
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                alert.type === 'dissolved_oxygen' ? 'bg-blue-100 text-blue-600' : 'bg-rose-100 text-rose-600'
              )}>
                {alert.type === 'dissolved_oxygen' ? (
                  <Wind className="w-6 h-6" />
                ) : (
                  <Bug className="w-6 h-6" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-semibold text-ink-900">{alert.zoneName}</span>
                  <span className={cn(
                    'px-2.5 py-0.5 text-[11px] rounded-full border font-medium',
                    getAlertStatusStyle(alert.status)
                  )}>
                    {ALERT_STATUS_LABELS[alert.status]}
                  </span>
                  <span className="px-2.5 py-0.5 text-[11px] rounded-full bg-ocean-50 text-ocean-700 border border-ocean-100 font-medium">
                    一级预警
                  </span>
                </div>

                <div className="text-sm text-gray-600 mt-1.5">
                  <span className="font-medium">{ALERT_TYPE_LABELS[alert.type]}：</span>
                  {alert.triggerReason}
                </div>

                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {fromNow(alert.triggeredAt)}
                  </span>
                  <span>影响养殖池：{alert.affectedPonds.length}个</span>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0 mt-2" />
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <div>暂无符合条件的预警记录</div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
