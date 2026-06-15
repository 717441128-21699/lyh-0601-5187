import { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  User,
  UserCheck,
  Building2,
  Landmark,
  Shield,
  Wheat,
  Pencil,
  Trash2,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import { mockUsers } from '../../mock/generator';
import { UserRole, ROLE_LABELS, PROVINCE_OPTIONS } from '../../types';
import { cn } from '../../utils';
import { useAuthStore } from '../../store/authStore';

const roleIcons: Record<UserRole, any> = {
  national: Landmark,
  provincial: Building2,
  municipal: UserCheck,
  farmer: User,
  technician: Wheat,
};

const roleColors: Record<UserRole, string> = {
  national: 'bg-red-100 text-red-700',
  provincial: 'bg-indigo-100 text-indigo-700',
  municipal: 'bg-ocean-100 text-ocean-700',
  farmer: 'bg-emerald-100 text-emerald-700',
  technician: 'bg-amber-100 text-amber-700',
};

export default function UserManagement() {
  const { user: currentUser } = useAuthStore();
  const [users] = useState([...mockUsers]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const filtered = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (search && !u.name.includes(search)) return false;
    if (currentUser?.role === 'provincial' && u.province && u.province !== currentUser.province) return false;
    return true;
  });

  const visibleRoles: UserRole[] = currentUser?.role === 'national'
    ? ['national', 'provincial', 'municipal', 'farmer', 'technician']
    : ['municipal', 'farmer', 'technician'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-serif font-bold text-ink-900">用户管理</h2>
        <p className="text-sm text-gray-500 mt-0.5">管理平台用户账号与权限分配</p>
      </div>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索用户名..."
                className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm w-64 focus:border-ocean-500 focus:ring-2 focus:ring-ocean-100 outline-none"
              />
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => setRoleFilter('all')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition',
                  roleFilter === 'all'
                    ? 'bg-ocean-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                全部
              </button>
              {visibleRoles.map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition',
                    roleFilter === r
                      ? 'bg-ocean-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {ROLE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-lg bg-ocean-600 text-white text-sm font-medium hover:bg-ocean-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            新增用户
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100 bg-gray-50/50">
                <th className="py-3 px-4 font-medium">用户</th>
                <th className="py-3 px-4 font-medium">角色</th>
                <th className="py-3 px-4 font-medium">管辖区域</th>
                <th className="py-3 px-4 font-medium">权限数</th>
                <th className="py-3 px-4 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const Icon = roleIcons[u.role];
                return (
                  <tr key={u.id} className="border-b border-gray-50 hover:bg-ocean-50/30">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', roleColors[u.role])}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-medium text-ink-900">{u.name}</div>
                          <div className="text-xs text-gray-400">ID: {u.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn('px-2.5 py-1 text-xs rounded-full font-medium', roleColors[u.role])}>
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {u.province ? (
                        <>
                          {u.province}
                          {u.city && <span className="text-gray-400"> · {u.city}</span>}
                        </>
                      ) : (
                        <span className="text-gray-400">全国</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-medium">{u.permissions.length}</span>
                      <span className="text-gray-400 text-xs ml-1">项</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-1">
                        <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-ocean-600">
                          <Pencil className="w-4 h-4" />
                        </button>
                        {u.role !== 'national' && (
                          <button className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {showAddModal && (
          <div className="mt-6 p-5 rounded-xl bg-ocean-50/50 border border-ocean-100">
            <h4 className="font-medium text-ink-900 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-ocean-600" />
              新增用户
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">用户名</label>
                <input className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none" placeholder="请输入用户名" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">角色</label>
                <select className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none">
                  {visibleRoles.map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">省份</label>
                <select className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none">
                  {PROVINCE_OPTIONS.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">城市</label>
                <input className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none" placeholder="请输入城市" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 text-sm hover:bg-gray-200"
              >
                取消
              </button>
              <button className="px-4 py-2 rounded-lg bg-ocean-600 text-white text-sm hover:bg-ocean-700">
                创建用户
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
