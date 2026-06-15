import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertTriangle,
  FileText,
  Wheat,
  Users,
  Settings,
  Fish,
  ChevronRight,
  LogOut,
  Bell,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useDataStore } from '../../store/dataStore';
import { ROLE_LABELS } from '../../types';
import { cn } from '../../utils';

interface MenuItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const menuItems: MenuItem[] = [
  { to: '/dashboard', label: '核心看板', icon: LayoutDashboard, roles: ['*'] },
  { to: '/alerts', label: '预警中心', icon: AlertTriangle, roles: ['*'] },
  { to: '/reports', label: '健康诊断', icon: FileText, roles: ['*'] },
  { to: '/feed', label: '饲料管理', icon: Wheat, roles: ['farmer', 'technician', 'national', 'provincial', 'municipal'] },
  { to: '/system/users', label: '用户管理', icon: Users, roles: ['national', 'provincial'] },
  { to: '/system/settings', label: '系统设置', icon: Settings, roles: ['national'] },
];

function Sidebar() {
  const { user } = useAuthStore();
  const hasAccess = (roles: string[]) => {
    if (!user) return false;
    if (roles.includes('*')) return true;
    return roles.includes(user.role);
  };

  return (
    <aside className="w-60 bg-ocean-700 text-white flex flex-col h-screen sticky top-0">
      <div className="h-16 flex items-center gap-3 px-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-lg bg-ocean-500 flex items-center justify-center">
          <Fish className="w-5 h-5" />
        </div>
        <div>
          <div className="font-serif font-bold text-sm leading-tight">水产养殖监测预警</div>
          <div className="text-[10px] text-ocean-200">Intelligent Platform</div>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {menuItems
          .filter((item) => hasAccess(item.roles))
          .map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                  isActive
                    ? 'bg-ocean-500 text-white shadow-lg shadow-ocean-500/30'
                    : 'text-ocean-100 hover:bg-ocean-600/50 hover:text-white'
                )
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </NavLink>
          ))}
      </nav>

      <div className="p-3 border-t border-white/10">
        <div className="bg-ocean-800/60 rounded-lg p-3">
          <div className="text-xs text-ocean-200 mb-1">当前登录</div>
          <div className="font-medium text-sm">{user?.name}</div>
          <div className="text-xs text-ocean-300">{user ? ROLE_LABELS[user.role] : ''}</div>
        </div>
      </div>
    </aside>
  );
}

function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const activeAlerts = useDataStore((s) => s.alerts.filter((a) => a.status !== 'closed' && a.status !== 'false_alarm').length);

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-serif font-semibold text-ink-900">
          {user?.role === 'national'
            ? '全国水产养殖监测数据中心'
            : user?.province
              ? `${user.province}${user.city ? ' · ' + user.city : ''} 水产养殖监测`
              : '水产养殖监测'}
        </h1>
        <span className="h-4 w-px bg-gray-200" />
        <span className="text-sm text-gray-500">
          {new Date().toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
          })}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/alerts')}
          className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition"
        >
          <Bell className="w-5 h-5" />
          {activeAlerts > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-alert-danger text-white text-[10px] font-bold flex items-center justify-center pulse-dot">
              {activeAlerts}
            </span>
          )}
        </button>

        <div className="h-8 w-px bg-gray-200" />

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-ocean-500 to-ocean-700 flex items-center justify-center text-white font-medium text-sm">
            {user?.name?.[0] || 'U'}
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-medium text-ink-900">{user?.name}</div>
            <div className="text-xs text-gray-500">{user ? ROLE_LABELS[user.role] : ''}</div>
          </div>
        </div>

        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-alert-danger transition"
          title="退出登录"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
