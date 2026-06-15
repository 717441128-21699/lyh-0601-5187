import { useState, useRef, useMemo, useEffect } from 'react';
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
  X,
  FileInput,
} from 'lucide-react';
import Card from '../components/ui/Card';
import { useDataStore } from '../store/dataStore';
import { useAuthStore } from '../store/authStore';
import { SPECIES_OPTIONS } from '../types';
import { cn, formatDate, parseExcelFormula, parseExcelFeedingPlan, formatNumber } from '../utils';

export default function FeedManagement() {
  const { user } = useAuthStore();
  const {
    formulas,
    addFormula,
    filterZonesByScope,
    filterPlansByScope,
    filterRecordsByScope,
    addFeedingPlan,
    addFeedingPlansBatch,
    getZoneById,
    getZonePonds,
  } = useDataStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const planFileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'formulas' | 'plans' | 'records'>('formulas');
  const [isDragging, setIsDragging] = useState(false);
  const [planDragging, setPlanDragging] = useState(false);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [planUploadMsg, setPlanUploadMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 按权限范围过滤
  const scopedZones = useMemo(
    () => filterZonesByScope(user?.role || 'national', user?.province, user?.city, undefined, user?.farmIds),
    [filterZonesByScope, user]
  );
  const scopedPlans = useMemo(
    () => filterPlansByScope(user?.role || 'national', user?.province, user?.city, user?.farmIds),
    [filterPlansByScope, user]
  );
  const scopedRecords = useMemo(
    () => filterRecordsByScope(user?.role || 'national', user?.province, user?.city, user?.farmIds),
    [filterRecordsByScope, user]
  );

  // 当前选中zone的ponds
  const [selectedZoneId, setSelectedZoneId] = useState(scopedZones[0]?.id || '');
  const selectedPonds = useMemo(() => getZonePonds(selectedZoneId), [getZonePonds, selectedZoneId]);

  const [newPlan, setNewPlan] = useState({
    zoneId: scopedZones[0]?.id || '',
    pondId: '',
    formulaId: formulas[0]?.id || '',
    dailyAmount: 50,
    frequency: 3,
  });

  useEffect(() => {
    if (scopedZones.length > 0 && !scopedZones.find((z) => z.id === newPlan.zoneId)) {
      setNewPlan({ ...newPlan, zoneId: scopedZones[0].id });
    }
    if (scopedZones.length > 0 && !scopedZones.find((z) => z.id === selectedZoneId)) {
      setSelectedZoneId(scopedZones[0].id);
    }
  }, [scopedZones]);

  const handleFormulaFileUpload = (file: File) => {
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

  const handlePlanFileUpload = (file: File) => {
    if (!file) return;
    setPlanUploadMsg(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const parsed = parseExcelFeedingPlan(json as any[][]);
        if (parsed.length === 0) {
          setPlanUploadMsg({ type: 'error', text: '未解析到有效的投喂计划数据' });
          return;
        }
        const zoneId = selectedZoneId || scopedZones[0]?.id;
        const defaultFormulaId = formulas[0]?.id || '';
        const defaultFormulaName = formulas[0]?.name || '';
        const records = parsed.map((p) => ({
          zoneId,
          zoneName: getZoneById(zoneId)?.name || '',
          pondName: p.pondName,
          pondId: '',
          formulaId: formulas.find((f) => f.name === p.formulaName)?.id || defaultFormulaId,
          formulaName: p.formulaName || defaultFormulaName,
          dailyAmount: p.dailyAmount,
          frequency: p.frequency,
          startTime: new Date().toISOString(),
        }));
        addFeedingPlansBatch(records);
        setPlanUploadMsg({ type: 'success', text: `成功导入 ${records.length} 条投喂计划` });
      } catch (err) {
        console.error('Excel解析失败', err);
        setPlanUploadMsg({ type: 'error', text: 'Excel解析失败，请检查文件格式' });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFormulaDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFormulaFileUpload(file);
  };

  const handlePlanDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setPlanDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handlePlanFileUpload(file);
  };

  const downloadFormulaTemplate = () => {
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

  const downloadPlanTemplate = () => {
    const data = [
      ['养殖池', '配方', '日投喂量(kg)', '频次(次/天)'],
      ['1号池', '草鱼成鱼配合饲料', 50, 3],
      ['2号池', '草鱼成鱼配合饲料', 60, 3],
      ['3号池', '鲤鱼配合饲料', 45, 2],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '投喂计划');
    XLSX.writeFile(wb, '投喂计划模板.xlsx');
  };

  const abnormalRecords = useMemo(
    () => scopedRecords.filter((r) => r.isAbnormal),
    [scopedRecords]
  );

  const canManage = user?.role === 'farmer' || user?.role === 'technician' || user?.role === 'national';

  const handleCreatePlan = () => {
    const zone = getZoneById(newPlan.zoneId);
    const formula = formulas.find((f) => f.id === newPlan.formulaId);
    const pond = selectedPonds.find((p) => p.id === newPlan.pondId);
    if (!zone || !formula) return;
    addFeedingPlan({
      zoneId: newPlan.zoneId,
      zoneName: zone.name,
      pondId: newPlan.pondId || '',
      pondName: pond?.name || '综合池',
      formulaId: newPlan.formulaId,
      formulaName: formula.name,
      dailyAmount: newPlan.dailyAmount,
      frequency: newPlan.frequency,
      startTime: new Date().toISOString(),
    });
    setShowAddPlan(false);
    setNewPlan({
      zoneId: scopedZones[0]?.id || '',
      pondId: '',
      formulaId: formulas[0]?.id || '',
      dailyAmount: 50,
      frequency: 3,
    });
  };

  const scopeLabel = user?.farmIds && user.farmIds.length > 0
    ? `${user.province || ''} ${user.city || ''} · 我的养殖场`
    : user?.role === 'national'
      ? '全国'
      : user?.province
        ? user?.city ? `${user.province} · ${user.city}` : user.province
        : '全国';

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-serif font-bold text-ink-900">饲料管理 · {scopeLabel}</h2>
        <p className="text-sm text-gray-500 mt-0.5">配方管理、投喂计划与异常监测</p>
      </div>

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
          <div className="text-2xl font-bold font-serif mt-3">{scopedPlans.length}</div>
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
            {Math.max(0, scopedRecords.length - abnormalRecords.length)}
          </div>
        </div>
      </div>

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

      {activeTab === 'formulas' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card title="上传配方">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFormulaDrop}
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
                  onChange={(e) => e.target.files?.[0] && handleFormulaFileUpload(e.target.files[0])}
                />
              </div>
              <button
                onClick={downloadFormulaTemplate}
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

      {activeTab === 'plans' && (
        <div className="space-y-6">
          <Card
            title={`投喂计划（${scopedPlans.length}）`}
            extra={canManage && (
              <div className="flex items-center gap-2">
                <button
                  onClick={downloadPlanTemplate}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-1"
                >
                  <Download className="w-4 h-4" />
                  下载模板
                </button>
                <button
                  onClick={() => planFileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-1"
                >
                  <FileInput className="w-4 h-4" />
                  导入Excel
                </button>
                <button
                  onClick={() => setShowAddPlan(true)}
                  className="px-3 py-1.5 rounded-lg bg-ocean-600 text-white text-sm font-medium hover:bg-ocean-700 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  新建计划
                </button>
                <input
                  ref={planFileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handlePlanFileUpload(e.target.files[0])}
                />
              </div>
            )}
          >
            {planUploadMsg && (
              <div className={cn(
                'mb-4 p-3 rounded-lg text-sm flex items-center gap-2',
                planUploadMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              )}>
                {planUploadMsg.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {planUploadMsg.text}
                <button onClick={() => setPlanUploadMsg(null)} className="ml-auto">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {canManage && (
              <div
                onDragOver={(e) => { e.preventDefault(); setPlanDragging(true); }}
                onDragLeave={() => setPlanDragging(false)}
                onDrop={handlePlanDrop}
                className={cn(
                  'mb-4 border-2 border-dashed rounded-xl p-4 text-center text-xs cursor-pointer transition',
                  planDragging ? 'border-ocean-500 bg-ocean-50' : 'border-gray-200 hover:border-ocean-300 bg-gray-50/50'
                )}
              >
                <Upload className="w-5 h-5 mx-auto text-ocean-500 mb-1" />
                <div className="text-gray-600">拖拽或点击上方"导入Excel"按钮上传投喂计划</div>
                <div className="text-gray-400 mt-0.5">列：养殖池 | 配方 | 日投喂量(kg) | 频次(次/天)</div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="py-3 px-4 font-medium">养殖区</th>
                    <th className="py-3 px-4 font-medium">养殖池</th>
                    <th className="py-3 px-4 font-medium">饲料配方</th>
                    <th className="py-3 px-4 font-medium">日投喂量</th>
                    <th className="py-3 px-4 font-medium">投喂频次</th>
                    <th className="py-3 px-4 font-medium">开始日期</th>
                  </tr>
                </thead>
                <tbody>
                  {scopedPlans.map((p) => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-ocean-50/30">
                      <td className="py-3 px-4 text-gray-600">{p.zoneName}</td>
                      <td className="py-3 px-4 font-medium">{p.pondName}</td>
                      <td className="py-3 px-4">{p.formulaName}</td>
                      <td className="py-3 px-4 font-mono">{p.dailyAmount} kg/天</td>
                      <td className="py-3 px-4">{p.frequency} 次/天</td>
                      <td className="py-3 px-4 text-gray-500">{formatDate(p.startTime)}</td>
                    </tr>
                  ))}
                  {scopedPlans.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400">
                        <Wheat className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        当前范围暂无投喂计划
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {showAddPlan && (
              <div className="mt-6 p-4 rounded-xl bg-ocean-50/50 border border-ocean-100">
                <h4 className="font-medium text-ink-900 mb-4">新建投喂计划</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">养殖区</label>
                    <select
                      value={newPlan.zoneId}
                      onChange={(e) => {
                        setNewPlan({ ...newPlan, zoneId: e.target.value, pondId: '' });
                        setSelectedZoneId(e.target.value);
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none"
                    >
                      {scopedZones.map((z) => (
                        <option key={z.id} value={z.id}>{z.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">养殖池</label>
                    <select
                      value={newPlan.pondId}
                      onChange={(e) => setNewPlan({ ...newPlan, pondId: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none"
                    >
                      <option value="">综合池</option>
                      {selectedPonds.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
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
                  <button
                    onClick={handleCreatePlan}
                    className="px-4 py-2 rounded-lg bg-ocean-600 text-white text-sm hover:bg-ocean-700"
                  >
                    创建
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'records' && (
        <Card title="投喂记录与异常监测" subtitle="偏离推荐量±20%将触发异常提醒并推送技术员">
          <div className="space-y-3">
            {scopedRecords.slice(0, 15).map((r) => (
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
                    <div className="font-medium text-ink-900">{r.zoneName} · {r.pondName}</div>
                    <div className="text-xs text-gray-400">{formatDate(r.date)} · {r.formulaName}</div>
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
            {scopedRecords.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-40" />
                当前范围暂无投喂记录
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
