import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { performance } from './performance';

interface RouteConfig {
  path: string;
  roles?: string[];
  requireAuth?: boolean;
  redirectTo?: string;
}

// Safe route configuration that won't break existing routes
const defaultRouteConfig: RouteConfig[] = [
  { path: '/login', requireAuth: false },
  { path: '/dashboard', requireAuth: true },
  { path: '/admin/*', roles: ['administrator'], requireAuth: true },
  { path: '/customer/*', roles: ['customerhomanager', 'customersitemanager'], requireAuth: true },
  { path: '/officer/*', roles: ['advantageoneofficer', 'advantageonehoofficer'], requireAuth: true },
];

export function useRouteProtection(customConfig: RouteConfig[] = []) {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const routeConfig = [...defaultRouteConfig, ...customConfig];

  useEffect(() => {
    const checkAccess = () => {
      try {
        performance.startMetric('route_protection_check');

        const currentPath = location.pathname;
        const matchingRoute = routeConfig.find(route => 
          currentPath.startsWith(route.path.replace('/*', ''))
        );

        if (!matchingRoute) {
          // If no matching route, allow access (fallback to existing routing)
          return;
        }

        if (matchingRoute.requireAuth && !isAuthenticated) {
          navigate('/login', { 
            state: { from: location },
            replace: true 
          });
          return;
        }

        if (matchingRoute.roles && user?.role && 
            !matchingRoute.roles.includes(user.role)) {
          navigate(matchingRoute.redirectTo || '/dashboard', { replace: true });
          return;
        }

      } catch (error) {
        console.warn('Route protection error:', error);
        // On error, fallback to existing routing behavior
      } finally {
        performance.endMetric('route_protection_check');
      }
    };

    checkAccess();
  }, [location, user, isAuthenticated, navigate, routeConfig]);
}

// HOC for protecting routes without breaking existing ones
export function withRouteProtection<P extends object>(
  Component: React.ComponentType<P>,
  config?: RouteConfig
) {
  return function ProtectedRoute(props: P) {
    useRouteProtection(config ? [config] : []);
    return <Component {...props} />;
  };
}

// Utility for creating protected route groups
export function createProtectedRoutes(routes: RouteConfig[]) {
  useRouteProtection(routes);
  return null;
}

// Hook for checking specific permissions
export function usePermissions(requiredPermissions: string[]) {
  const { user } = useAuth();
  
  return {
    hasPermission: !!user && requiredPermissions.includes(user.role),
    isLoading: false,
    error: null
  };
} 