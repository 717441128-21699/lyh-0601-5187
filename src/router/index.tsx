import { createBrowserRouter, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import ZoneDetail from '../pages/ZoneDetail';
import AlertList from '../pages/AlertList';
import AlertDetail from '../pages/AlertDetail';
import FeedManagement from '../pages/FeedManagement';
import Reports from '../pages/Reports';
import UserManagement from '../pages/system/UserManagement';
import SystemSettings from '../pages/system/SystemSettings';
import MainLayout from '../components/layout/MainLayout';
import { useAuthStore } from '../store/authStore';
import { useDataStore } from '../store/dataStore';

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, user } = useAuthStore();
  const initData = useDataStore((s) => s.initData);
  const loading = useDataStore((s) => s.loading);

  useEffect(() => {
    if (isAuthenticated) {
      initData();
    }
  }, [isAuthenticated, initData]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role) && user.role !== 'national') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <Dashboard />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <Dashboard />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/zone/:id',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <ZoneDetail />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/alerts',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <AlertList />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/alerts/:id',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <AlertDetail />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/feed',
    element: (
      <ProtectedRoute allowedRoles={['farmer', 'technician', 'national', 'provincial', 'municipal']}>
        <MainLayout>
          <FeedManagement />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/reports',
    element: (
      <ProtectedRoute>
        <MainLayout>
          <Reports />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/system/users',
    element: (
      <ProtectedRoute allowedRoles={['national', 'provincial']}>
        <MainLayout>
          <UserManagement />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '/system/settings',
    element: (
      <ProtectedRoute allowedRoles={['national']}>
        <MainLayout>
          <SystemSettings />
        </MainLayout>
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
