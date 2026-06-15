import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole, ROLE_LABELS } from '../types';
import { mockUsers } from '../mock/generator';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  canAccessRegion: (province?: string, city?: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: async (username: string, _password: string, role: UserRole) => {
        await new Promise((r) => setTimeout(r, 600));
        const matchedUser = mockUsers.find((u) => u.role === role);
        if (matchedUser || username) {
          const user: User = matchedUser || {
            id: 'u-demo',
            name: username || ROLE_LABELS[role] + '用户',
            role,
            province: role !== 'national' ? '江苏' : undefined,
            city: role === 'municipal' || role === 'farmer' || role === 'technician' ? '苏州' : undefined,
            farmIds: role === 'farmer' ? ['zone-0-0'] : undefined,
            permissions: ['*'],
          };
          set({ user, isAuthenticated: true });
          return true;
        }
        return false;
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      hasPermission: (permission: string) => {
        const { user } = get();
        if (!user) return false;
        if (user.permissions.includes('*')) return true;
        return user.permissions.includes(permission);
      },

      canAccessRegion: (province?: string, city?: string) => {
        const { user } = get();
        if (!user) return false;
        if (user.role === 'national') return true;
        if (province && user.province && user.province !== province) return false;
        if (
          (user.role === 'municipal' || user.role === 'farmer' || user.role === 'technician') &&
          city &&
          user.city &&
          user.city !== city
        )
          return false;
        return true;
      },
    }),
    {
      name: 'aquaculture-auth',
    }
  )
);
