import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Fish, Waves, Eye, EyeOff, Loader2 } from 'lucide-react';
import { UserRole, ROLE_LABELS } from '../types';
import { useAuthStore } from '../store/authStore';
import { cn } from '../utils';

const roles: { value: UserRole; desc: string }[] = [
  { value: 'national', desc: '全国水产数据管理' },
  { value: 'provincial', desc: '本省数据与审批' },
  { value: 'municipal', desc: '本市数据与复核' },
  { value: 'farmer', desc: '养殖场管理' },
  { value: 'technician', desc: '技术指导服务' },
];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('national');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const ok = await login(username, password, role);
      if (ok) {
        navigate('/dashboard');
      } else {
        setError('登录失败，请检查账号密码');
      }
    } catch (err) {
      setError('登录异常，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* 左侧品牌展示区 */}
      <div className="hidden lg:flex w-1/2 wave-bg flex-col justify-between p-12 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Fish className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-serif font-bold">全国水产养殖监测预警平台</h1>
              <p className="text-white/70 text-sm mt-1">Aquaculture Monitoring & Early Warning System</p>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="text-4xl font-serif font-bold leading-tight mb-6">
            智慧渔业
            <br />
            守护蓝色粮仓
          </h2>
          <p className="text-white/80 text-lg leading-relaxed max-w-md">
            实时水质监测、智能病害预警、精准投喂管理、三级联动审批，
            为全国水产养殖业提供全链条数字化解决方案。
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-6">
          {[
            { label: '覆盖省份', value: '31' },
            { label: '监测养殖场', value: '12,847' },
            { label: '年均预警处置', value: '8,600+' },
          ].map((s) => (
            <div key={s.label} className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="text-3xl font-bold">{s.value}</div>
              <div className="text-white/70 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* 装饰水波 */}
        <div className="absolute inset-0 opacity-20">
          <Waves className="absolute bottom-10 left-10 w-96 h-96" />
          <Waves className="absolute top-20 right-10 w-64 h-64" />
        </div>
      </div>

      {/* 右侧登录表单区 */}
      <div className="flex-1 flex items-center justify-center p-8 bg-ocean-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="w-10 h-10 rounded-xl bg-ocean-600 flex items-center justify-center text-white">
              <Fish className="w-6 h-6" />
            </div>
            <span className="text-xl font-serif font-bold text-ocean-700">水产养殖监测平台</span>
          </div>

          <h2 className="text-3xl font-serif font-bold text-ink-900 mb-2">欢迎登录</h2>
          <p className="text-gray-500 mb-8">请选择角色并输入账号信息</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-ink-800 mb-2">选择角色</label>
              <div className="grid grid-cols-2 gap-2">
                {roles.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={cn(
                      'p-3 rounded-lg border text-left transition-all',
                      role === r.value
                        ? 'border-ocean-500 bg-ocean-50 text-ocean-700 shadow-sm'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-ocean-300'
                    )}
                  >
                    <div className="font-medium text-sm">{ROLE_LABELS[r.value]}</div>
                    <div className="text-xs opacity-70 mt-0.5">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-800 mb-2">账号</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入账号（演示模式可留空）"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100 outline-none transition bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-800 mb-2">密码</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码（演示模式可留空）"
                  className="w-full px-4 py-3 pr-11 rounded-lg border border-gray-200 focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100 outline-none transition bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-ocean-600"
                >
                  {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-alert-danger text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-600">
                <input type="checkbox" className="rounded border-gray-300 text-ocean-600 focus:ring-ocean-500" />
                记住我
              </label>
              <a href="#" className="text-ocean-600 hover:text-ocean-700">忘记密码？</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-ocean-600 text-white font-medium hover:bg-ocean-700 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-ocean-600/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  登录中...
                </>
              ) : (
                '登 录'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-8">
            © 2026 全国水产养殖环境与病害监测预警平台
          </p>
        </div>
      </div>
    </div>
  );
}
