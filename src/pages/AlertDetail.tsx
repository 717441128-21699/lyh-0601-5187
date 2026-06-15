import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Clock,
  CheckCircle2,
  XCircle,
  Circle,
  UserCheck,
  Building2,
  Landmark,
  Wind,
  Shield,
  Droplets,
  Send,
} from 'lucide-react';
import Card from '../components/ui/Card';
import { useDataStore } from '../store/dataStore';
import { useAuthStore } from '../store/authStore';
import {
  ALERT_STATUS_LABELS,
  ALERT_TYPE_LABELS,
  MEASURE_TYPE_LABELS,
} from '../types';
import { cn, formatDateTime, fromNow, getAlertStatusStyle } from '../utils';

export default function AlertDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { alerts, confirmAlert, reviewAlert, approveAlert, startMeasure, closeAlert, getZoneById } = useDataStore();
  const { user } = useAuthStore();

  const alert = alerts.find((a) => a.id === id);
  const zone = alert ? getZoneById(alert.zoneId) : undefined;
  const [opinion, setOpinion] = useState('');
  const [measureDesc, setMeasureDesc] = useState('');
  const [measureType, setMeasureType] = useState<'aeration' | 'isolation'>('aeration');

  if (!alert) {
    return (
      <div className="text-center py-16 text-gray-500">
        未找到该预警信息
        <button onClick={() => navigate('/alerts')} className="block mx-auto mt-4 text-ocean-600">
          返回预警中心
        </button>
      </div>
    );
  }

  const canConfirm = user?.role === 'farmer' && alert.status === 'pending_confirm';
  const canReview = user?.role === 'municipal' && alert.status === 'pending_review';
  const canApprove = user?.role === 'provincial' && alert.status === 'pending_approve';
  const isRejected = alert.approvalFlow.some((s) => s.status === 'rejected');
  const canStartMeasure = !isRejected &&
    alert.status === 'processing' &&
    (user?.role === 'farmer' || user?.role === 'municipal');
  const canClose = (user?.role === 'national' || user?.role === 'provincial') && alert.status === 'processing';

  const approvalLevels = [
    {
      key: 'farmer' as const,
      label: '养殖户确认',
      icon: UserCheck,
      desc: '养殖户现场确认预警情况',
    },
    {
      key: 'fishery_station' as const,
      label: '渔政站复核',
      icon: Building2,
      desc: '属地渔政站现场复核',
    },
    {
      key: 'provincial_bureau' as const,
      label: '省级渔业局批准',
      icon: Landmark,
      desc: '省级渔业管理部门审批',
    },
  ];

  const handleAction = (action: 'confirm' | 'review' | 'approve', approved: boolean) => {
    if (!opinion.trim() && approved) return;
    if (action === 'confirm') confirmAlert(alert.id, opinion, approved);
    if (action === 'review') reviewAlert(alert.id, opinion, approved);
    if (action === 'approve') approveAlert(alert.id, opinion, approved);
    setOpinion('');
  };

  const handleStartMeasure = () => {
    if (!measureDesc.trim()) return;
    startMeasure(alert.id, measureType, measureDesc);
    setMeasureDesc('');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/alerts')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-serif font-bold text-ink-900">预警详情</h2>
              <span className={cn(
                'px-3 py-1 text-xs rounded-full border font-medium',
                getAlertStatusStyle(alert.status)
              )}>
                {ALERT_STATUS_LABELS[alert.status]}
              </span>
              <span className="px-3 py-1 text-xs rounded-full bg-red-50 text-red-700 border border-red-200 font-medium">
                一级预警
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5" />
              {alert.zoneName}
              {zone && <span>· {zone.province} {zone.city}</span>}
            </p>
          </div>
        </div>
        {canClose && alert.status === 'processing' && (
          <button
            onClick={() => closeAlert(alert.id)}
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-medium"
          >
            关闭预警
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：预警信息 + 审批流程 */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="预警基本信息">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-ocean-50">
                <div className="text-xs text-gray-500">预警类型</div>
                <div className="font-medium text-ink-900 mt-1 flex items-center gap-2">
                  {alert.type === 'dissolved_oxygen' ? (
                    <><Droplets className="w-4 h-4 text-ocean-600" />{ALERT_TYPE_LABELS[alert.type]}</>
                  ) : (
                    <><Shield className="w-4 h-4 text-rose-600" />{ALERT_TYPE_LABELS[alert.type]}</>
                  )}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-amber-50">
                <div className="text-xs text-gray-500">触发时间</div>
                <div className="font-medium text-ink-900 mt-1 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  {formatDateTime(alert.triggeredAt)}
                </div>
              </div>
              <div className="col-span-2 p-4 rounded-lg bg-red-50">
                <div className="text-xs text-gray-500">触发原因</div>
                <div className="font-medium text-ink-900 mt-1">{alert.triggerReason}</div>
              </div>
              <div className="col-span-2 p-4 rounded-lg bg-gray-50">
                <div className="text-xs text-gray-500">影响范围</div>
                <div className="font-medium text-ink-900 mt-1">
                  涉及 {alert.affectedPonds.length} 个养殖池：{alert.affectedPonds.join('、')}
                </div>
              </div>
            </div>
          </Card>

          <Card title="三级审批流程" subtitle="养殖户确认 → 渔政站复核 → 省级渔业局批准">
            <div className="relative">
              <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gray-100" />
              <div className="space-y-5">
                {approvalLevels.map((level, idx) => {
                  const step = alert.approvalFlow.find((s) => s.level === level.key);
                  const isDone = step?.status === 'approved';
                  const isRejected = step?.status === 'rejected';
                  const isCurrent =
                    (idx === 0 && alert.status === 'pending_confirm') ||
                    (idx === 1 && alert.status === 'pending_review') ||
                    (idx === 2 && alert.status === 'pending_approve');

                  return (
                    <div key={level.key} className="relative pl-16">
                      <div className={cn(
                        'absolute left-0 w-12 h-12 rounded-full flex items-center justify-center border-4',
                        isDone && 'bg-alert-success text-white border-green-100',
                        isRejected && 'bg-alert-danger text-white border-red-100',
                        isCurrent && 'bg-ocean-600 text-white border-ocean-100 animate-pulse',
                        !isDone && !isRejected && !isCurrent && 'bg-gray-100 text-gray-400 border-white'
                      )}>
                        {isDone ? (
                          <CheckCircle2 className="w-6 h-6" />
                        ) : isRejected ? (
                          <XCircle className="w-6 h-6" />
                        ) : (
                          <level.icon className="w-6 h-6" />
                        )}
                      </div>
                      <div className="p-4 rounded-xl border bg-white">
                        <div className="flex items-center justify-between">
                          <div className="font-medium text-ink-900">{level.label}</div>
                          <div className="text-xs text-gray-400 flex items-center gap-1">
                            {step?.operatedAt ? (
                              <>
                                <Clock className="w-3 h-3" />
                                {fromNow(step.operatedAt)}
                              </>
                            ) : (
                              isCurrent ? '待处理' : '等待中'
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{level.desc}</div>
                        {step && (
                          <div className="mt-3 pt-3 border-t border-gray-50">
                            <div className="flex items-center gap-2 text-sm">
                              <UserCheck className="w-4 h-4 text-ocean-600" />
                              <span className="font-medium">{step.operator}</span>
                              <span className="text-gray-400">· {step.operatorRole}</span>
                              <span className={cn(
                                'ml-auto px-2 py-0.5 text-[10px] rounded-full',
                                step.status === 'approved' && 'bg-green-100 text-green-700',
                                step.status === 'rejected' && 'bg-red-100 text-red-700',
                                step.status === 'pending' && 'bg-gray-100 text-gray-500'
                              )}>
                                {step.status === 'approved' ? '通过' : step.status === 'rejected' ? '驳回' : '待处理'}
                              </span>
                            </div>
                            {step.opinion && (
                              <div className="mt-2 text-sm text-gray-600 bg-ocean-50/50 rounded-lg p-3">
                                {step.opinion}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* 处置措施记录 */}
          {alert.measures && alert.measures.length > 0 && (
            <Card title="处置措施记录">
              <div className="space-y-3">
                {alert.measures.map((m) => (
                  <div key={m.id} className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-medium text-ink-900">
                        {m.type === 'aeration' ? <Wind className="w-4 h-4 text-emerald-600" /> : <Shield className="w-4 h-4 text-emerald-600" />}
                        {MEASURE_TYPE_LABELS[m.type]}
                      </div>
                      <span className="text-xs text-gray-400">{formatDateTime(m.startTime)}</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-2">{m.description}</div>
                    <div className="text-xs text-gray-400 mt-2">执行人：{m.operator}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* 右侧：操作面板 */}
        <div className="space-y-6">
          {(canConfirm || canReview || canApprove) && (
            <Card title="审批操作" extra={<span className="text-xs text-ocean-600">当前需您处理</span>}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink-800 mb-2">处理意见</label>
                  <textarea
                    value={opinion}
                    onChange={(e) => setOpinion(e.target.value)}
                    rows={4}
                    placeholder="请填写审批意见..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100 outline-none resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleAction(
                      canConfirm ? 'confirm' : canReview ? 'review' : 'approve',
                      true
                    )}
                    disabled={!opinion.trim()}
                    className="py-2.5 rounded-lg bg-ocean-600 text-white text-sm font-medium hover:bg-ocean-700 transition disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {canConfirm ? '确认情况' : canReview ? '复核通过' : '批准处置'}
                  </button>
                  <button
                    onClick={() => handleAction(
                      canConfirm ? 'confirm' : canReview ? 'review' : 'approve',
                      false
                    )}
                    className="py-2.5 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition flex items-center justify-center gap-1"
                  >
                    <XCircle className="w-4 h-4" />
                    驳回/误报
                  </button>
                </div>
              </div>
            </Card>
          )}

          {canStartMeasure && (
            <Card title="启动处置措施">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink-800 mb-2">措施类型</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setMeasureType('aeration')}
                      className={cn(
                        'p-3 rounded-lg border text-left text-sm transition',
                        measureType === 'aeration'
                          ? 'border-ocean-500 bg-ocean-50 text-ocean-700'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <Wind className="w-5 h-5 mb-1" />
                      物理增氧
                    </button>
                    <button
                      onClick={() => setMeasureType('isolation')}
                      className={cn(
                        'p-3 rounded-lg border text-left text-sm transition',
                        measureType === 'isolation'
                          ? 'border-ocean-500 bg-ocean-50 text-ocean-700'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <Shield className="w-5 h-5 mb-1" />
                      隔离措施
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-800 mb-2">措施描述</label>
                  <textarea
                    value={measureDesc}
                    onChange={(e) => setMeasureDesc(e.target.value)}
                    rows={3}
                    placeholder="请描述具体的处置措施..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100 outline-none resize-none"
                  />
                </div>
                <button
                  onClick={handleStartMeasure}
                  disabled={!measureDesc.trim()}
                  className="w-full py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  <Send className="w-4 h-4" />
                  启动处置
                </button>
              </div>
            </Card>
          )}

          <Card title="预警处理说明">
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start gap-2">
                <Circle className="w-1.5 h-1.5 rounded-full bg-ocean-600 mt-2 flex-shrink-0" />
                <span>连续6小时溶解氧低于4.0mg/L触发预警</span>
              </li>
              <li className="flex items-start gap-2">
                <Circle className="w-1.5 h-1.5 rounded-full bg-ocean-600 mt-2 flex-shrink-0" />
                <span>连续3天病害率超过5%触发预警</span>
              </li>
              <li className="flex items-start gap-2">
                <Circle className="w-1.5 h-1.5 rounded-full bg-ocean-600 mt-2 flex-shrink-0" />
                <span>需三级审批完成后方可启动处置</span>
              </li>
              <li className="flex items-start gap-2">
                <Circle className="w-1.5 h-1.5 rounded-full bg-ocean-600 mt-2 flex-shrink-0" />
                <span>处置后需跟踪效果直至恢复正常</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
