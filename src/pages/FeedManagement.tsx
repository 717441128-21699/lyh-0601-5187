import { useState, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  Upload,
  Download,
  FileSpreadsheet,
  Plus,
  AlertCircle,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Wheat,
} from 'lucide-react';
import Card from '../components/ui/Card';
import { useDataStore } from '../store/dataStore';
import { useAuthStore } from '../store/authStore';
import { SPECIES_OPTIONS } from '../types';
import { cn, formatDate, parseExcelFormula, formatNumber } from '../utils';

export default function FeedManagement() {
  const { user } = useAuthStore();
  const { formulas, feedingPlans, feedingRecords, addFormula, zones } = useDataStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'formulas' | 'plans' | 'records'>('formulas');
  const [isDragging, setIsDragging] = useState(false);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [newPlan, setNewPlan] = useState({
    zoneId: zones[0]?.id || '',
    pondId: '',
    formulaId: formulas[0]?.id || '',
    dailyAmount: 50,
    frequency: 3,
  });

  const handleFileUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const parsed = parseExcelFormula(json as any[][]);
        if (parsed) {
          addFormula(parsed);
        }
      } catch (err) {
        console.error('Excel解析失败', err);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const downloadTemplate = () => {
    const data = [
      ['饲料配方名称', '草鱼成鱼配合饲料'],
      ['粗蛋白(%)', 28],
      ['粗脂肪(%)', 5],
      ['粗纤维(%)', 10],
      ['粗灰分(%)', 15],
      ['水分(%)', 12],
      ['适用品种', '草鱼'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '配方');
    XLSX.writeFile(wb, '饲料配方模板.xlsx');
  };

  const abnormalRecords = useMemo(
    () => feedingRecords.filter((r) => r.isAbnormal),
    [feedingRecords]
  );

  const canManage = user?.role === 'farmer' || user?.role === 'national';

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-serif font-bold text-ink-900">饲料管理</h2>
        <p className="text-sm text-gray-500 mt-0.5">配方管理、投喂计划与异常监测</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-card border border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">配方总数</span>
            <div className="w-9 h-9 rounded-lg bg-ocean-100 text-ocean-600 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif mt-3">{formulas.length}</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-card border border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">投喂计划</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Wheat className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif mt-3">{feedingPlans.length}</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-card border border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">异常记录</span>
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif mt-3 text-amber-600">{abnormalRecords.length}</div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-card border border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">正常执行</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-serif mt-3 text-emerald-600">
            {feedingRecords.length - abnormalRecords.length}
          </div>
        </div>
      </div>

      {/* Tab切换 */}
      <div className="flex items-center gap-1 border-b border-gray-100">
        {[
          { key: 'formulas', label: '饲料配方', icon: FileSpreadsheet },
          { key: 'plans', label: '投喂计划', icon: Wheat },
          { key: 'records', label: '投喂记录', icon: TrendingUp },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={cn(
              'px-5 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition -mb-px',
              activeTab === tab.key
                ? 'border-ocean-600 text-ocean-600'
                : 'border-transparent text-gray-500 hover:text-ocean-600'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.key === 'records' && abnormalRecords.length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-alert-danger text-white font-medium">
                {abnormalRecords.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 饲料配方 */}
      {activeTab === 'formulas' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card title="上传配方">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition',
                  isDragging ? 'border-ocean-500 bg-ocean-50' : 'border-gray-200 hover:border-ocean-300'
                )}
              >
                <Upload className="w-10 h-10 mx-auto text-ocean-500 mb-3" />
                <div className="font-medium text-ink-900">点击或拖拽Excel文件到此处</div>
                <div className="text-xs text-gray-400 mt-1">支持 .xlsx, .xls 格式</div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                />
              </div>
              <button
                onClick={downloadTemplate}
                className="mt-4 w-full py-2.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                下载Excel模板
              </button>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card title={`配方列表（${formulas.length}）`}>
              <div className="space-y-3">
                {formulas.map((f) => (
                  <div key={f.id} className="p-4 rounded-xl border border-gray-100 hover:border-ocean-200 transition">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-ink-900 flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-ocean-600" />
                        {f.name}
                      </div>
                      <span className="text-xs text-gray-400">{formatDate(f.uploadedAt)} · {f.uploadedBy}</span>
                    </div>
                    <div className="grid grid-cols-5 gap-3 mt-3">
                      {[
                        { label: '粗蛋白', value: f.crudeProtein },
                        { label: '粗脂肪', value: f.crudeFat },
                        { label: '粗纤维', value: f.crudeFiber },
                        { label: '粗灰分', value: f.ash },
                        { label: '水分', value: f.moisture },
                      ].map((p) => (
                        <div key={p.label} className="text-center">
                          <div className="text-lg font-semibold text-ocean-700">{p.value}%</div>
                          <div className="text-[11px] text-gray-400">{p.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {f.suitableSpecies.map((s) => (
                        <span key={s} className="px-2 py-0.5 text-[11px] rounded-full bg-ocean-50 text-ocean-700">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 投喂计划 */}
      {activeTab === 'plans' && (
        <Card
          title="投喂计划"
          extra={canManage && (
            <button
              onClick={() => setShowAddPlan(true)}
              className="px-3 py-1.5 rounded-lg bg-ocean-600 text-white text-sm font-medium hover:bg-ocean-700 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              新建计划
            </button>
          )}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="py-3 px-4 font-medium">养殖池</th>
                  <th className="py-3 px-4 font-medium">饲料配方</th>
                  <th className="py-3 px-4 font-medium">日投喂量</th>
                  <th className="py-3 px-4 font-medium">投喂频次</th>
                  <th className="py-3 px-4 font-medium">开始日期</th>
                </tr>
              </thead>
              <tbody>
                {feedingPlans.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-ocean-50/30">
                    <td className="py-3 px-4 font-medium">{p.pondName}</td>
                    <td className="py-3 px-4">{p.formulaName}</td>
                    <td className="py-3 px-4 font-mono">{p.dailyAmount} kg/天</td>
                    <td className="py-3 px-4">{p.frequency} 次/天</td>
                    <td className="py-3 px-4 text-gray-500">{formatDate(p.startTime)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {showAddPlan && (
            <div className="mt-6 p-4 rounded-xl bg-ocean-50/50 border border-ocean-100">
              <h4 className="font-medium text-ink-900 mb-4">新建投喂计划</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">养殖区</label>
                  <select
                    value={newPlan.zoneId}
                    onChange={(e) => setNewPlan({ ...newPlan, zoneId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none"
                  >
                    {zones.map((z) => (
                      <option key={z.id} value={z.id}>{z.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">配方</label>
                  <select
                    value={newPlan.formulaId}
                    onChange={(e) => setNewPlan({ ...newPlan, formulaId: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none"
                  >
                    {formulas.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">日投喂量(kg)</label>
                  <input
                    type="number"
                    value={newPlan.dailyAmount}
                    onChange={(e) => setNewPlan({ ...newPlan, dailyAmount: +e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">频次(次/天)</label>
                  <input
                    type="number"
                    value={newPlan.frequency}
                    onChange={(e) => setNewPlan({ ...newPlan, frequency: +e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowAddPlan(false)}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm hover:bg-gray-200"
                >
                  取消
                </button>
                <button className="px-4 py-2 rounded-lg bg-ocean-600 text-white text-sm hover:bg-ocean-700">
                  创建
                </button>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* 投喂记录 */}
      {activeTab === 'records' && (
        <Card title="投喂记录与异常监测" subtitle="偏离推荐量±20%将触发异常提醒并推送技术员">
          <div className="space-y-3">
            {feedingRecords.slice(0, 15).map((r) => (
              <div
                key={r.id}
                className={cn(
                  'flex items-center justify-between p-4 rounded-xl border transition',
                  r.isAbnormal
                    ? 'bg-amber-50 border-amber-200'
                    : 'border-gray-100 hover:border-ocean-100'
                )}
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    r.isAbnormal ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                  )}>
                    {r.isAbnormal ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="font-medium text-ink-900">{r.pondName}</div>
                    <div className="text-xs text-gray-400">{formatDate(r.date)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="text-gray-500 text-xs">推荐量</div>
                    <div className="font-mono">{formatNumber(r.recommendedAmount, 1)}kg</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-500 text-xs">实际量</div>
                    <div className="font-mono">{formatNumber(r.actualAmount, 1)}kg</div>
                  </div>
                  <div className="text-center min-w-[80px]">
                    <div className="text-gray-500 text-xs">偏离度</div>
                    <div className={cn(
                      'font-mono font-semibold',
                      r.isAbnormal ? 'text-alert-danger' : 'text-gray-600'
                    )}>
                      {r.deviation > 0 ? '+' : ''}{r.deviation}%
                    </div>
                  </div>
                  {r.isAbnormal && (
                    <span className="px-3 py-1 rounded-full text-xs bg-alert-warning text-white font-medium">
                      已推送技术员
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
