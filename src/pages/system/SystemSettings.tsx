import { useState } from 'react';
import {
  Settings,
  Droplets,
  AlertTriangle,
  Wheat,
  Save,
  RotateCcw,
  Thermometer,
  Beaker,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import { useDataStore } from '../../store/dataStore';
import { cn, formatNumber } from '../../utils';

export default function SystemSettings() {
  const { thresholds } = useDataStore();
  const [config, setConfig] = useState(thresholds);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setConfig(thresholds);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif font-bold text-ink-900">系统设置</h2>
          <p className="text-sm text-gray-500 mt-0.5">配置预警阈值与系统参数</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            重置
          </button>
          <button
            onClick={handleSave}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition',
              saved
                ? 'bg-emerald-600 text-white'
                : 'bg-ocean-600 text-white hover:bg-ocean-700'
            )}
          >
            <Save className="w-4 h-4" />
            {saved ? '已保存' : '保存配置'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 水质阈值 */}
        <Card
          title="水质预警阈值"
          subtitle="超出此范围将触发水质异常预警"
          icon={<Droplets className="w-5 h-5 text-ocean-600" />}
        >
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-800 mb-2 flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-ocean-500" />
                  溶解氧下限 (mg/L)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={config.dissolvedOxygenMin}
                  onChange={(e) => setConfig({ ...config, dissolvedOxygenMin: +e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100 outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">连续6小时低于此值触发一级预警</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-800 mb-2 flex items-center gap-2">
                  <Beaker className="w-4 h-4 text-violet-500" />
                  氨氮上限 (mg/L)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={config.ammoniaNitrogenMax}
                  onChange={(e) => setConfig({ ...config, ammoniaNitrogenMax: +e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100 outline-none"
                />
                <p className="text-xs text-gray-400 mt-1">氨氮超标将影响水产品健康</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-800 mb-2">pH值范围</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={config.phMin}
                    onChange={(e) => setConfig({ ...config, phMin: +e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100 outline-none"
                  />
                  <span className="text-gray-400">~</span>
                  <input
                    type="number"
                    step="0.1"
                    value={config.phMax}
                    onChange={(e) => setConfig({ ...config, phMax: +e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100 outline-none"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">正常范围 6.5 ~ 9.0</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink-800 mb-2 flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-rose-500" />
                  水温范围 (℃)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.5"
                    value={config.temperatureMin}
                    onChange={(e) => setConfig({ ...config, temperatureMin: +e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100 outline-none"
                  />
                  <span className="text-gray-400">~</span>
                  <input
                    type="number"
                    step="0.5"
                    value={config.temperatureMax}
                    onChange={(e) => setConfig({ ...config, temperatureMax: +e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100 outline-none"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">超出范围可能引发应激反应</p>
              </div>
            </div>
          </div>
        </Card>

        {/* 病害与投喂阈值 */}
        <Card
          title="病害与投喂阈值"
          subtitle="配置病害预警与投喂异常检测参数"
          icon={<AlertTriangle className="w-5 h-5 text-amber-500" />}
        >
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-ink-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                病害率预警阈值 (%)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  step="0.1"
                  value={config.diseaseRateMax}
                  onChange={(e) => setConfig({ ...config, diseaseRateMax: +e.target.value })}
                  className="w-32 px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100 outline-none"
                />
                <div className="flex-1">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-rose-500 rounded-full"
                      style={{ width: `${Math.min(config.diseaseRateMax * 10, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                连续3天病害率超过 {formatNumber(config.diseaseRateMax)}% 将触发一级预警
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-800 mb-2 flex items-center gap-2">
                <Wheat className="w-4 h-4 text-amber-600" />
                投喂偏离预警阈值 (%)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="number"
                  step="1"
                  value={config.feedDeviationMax}
                  onChange={(e) => setConfig({ ...config, feedDeviationMax: +e.target.value })}
                  className="w-32 px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100 outline-none"
                />
                <div className="flex-1">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-ocean-400 to-ocean-600 rounded-full"
                      style={{ width: `${Math.min(config.feedDeviationMax * 2, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                实际投喂偏离推荐量 ±{config.feedDeviationMax}% 将生成异常提醒并推送技术员
              </p>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-ocean-50 border border-ocean-100">
              <h5 className="font-medium text-ocean-800 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                说明
              </h5>
              <ul className="text-xs text-ocean-700 mt-2 space-y-1">
                <li>· 阈值修改后将在下次系统检测时生效</li>
                <li>· 建议根据养殖品种、季节等因素合理调整阈值</li>
                <li>· 一级预警将自动推送至养殖户和属地渔政站</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* 品种管理 */}
        <Card
          title="养殖品种管理"
          subtitle="系统支持的主要水产养殖品种"
          className="lg:col-span-2"
        >
          <div className="flex flex-wrap gap-2">
            {['草鱼', '鲤鱼', '鲫鱼', '鲢鱼', '鳙鱼', '南美白对虾', '罗氏沼虾', '中华绒螯蟹', '大闸蟹', '牡蛎', '扇贝', '海参', '鲍鱼', '大黄鱼', '石斑鱼'].map((s) => (
              <span
                key={s}
                className="px-4 py-2 rounded-full bg-white border border-gray-200 text-sm text-gray-700 hover:border-ocean-300 hover:bg-ocean-50 cursor-pointer transition flex items-center gap-2"
              >
                <span className="w-2 h-2 rounded-full bg-ocean-500" />
                {s}
              </span>
            ))}
            <span className="px-4 py-2 rounded-full border-2 border-dashed border-gray-300 text-sm text-gray-400 hover:border-ocean-400 hover:text-ocean-500 cursor-pointer transition">
              + 添加品种
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}
