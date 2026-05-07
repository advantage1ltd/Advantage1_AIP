import React, { lazy, useEffect, useRef } from 'react';
import { createBrowserRouter, Outlet, useNavigate, useLocation } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';
import LoginPage from '@/pages/LoginPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import Index from '@/pages/Index';
import CustomerReportingPage from '@/pages/management/CustomerReportingPage';
import CustomerDetailPage from '@/pages/customer/CustomerDetailPage';
import ActionCalendar from '@/pages/ActionCalendar';
import { UserRole } from '@/types/user';
import { PageAccessProvider } from '@/contexts/PageAccessContext';
import { CustomerSelectionUrlSync } from '@/components/customer/CustomerSelectionUrlSync';

// Component to normalize paths and fix double slashes
const PathNormalizer = () => {
	const location = useLocation();
	const navigate = useNavigate();

	useEffect(() => {
		const pathname = location.pathname;
		// Check if pathname has double or more slashes anywhere
		if (pathname.includes('//')) {
			// Replace multiple consecutive slashes with a single slash
			// This ensures we always have exactly one / at the start
			const normalized = pathname.replace(/\/+/g, '/');
			if (normalized !== pathname) {
				console.warn('🔧 [PathNormalizer] Fixing double slash in path:', pathname, '->', normalized);
				// Use replace: true to avoid adding to history and prevent navigation loops
				const newPath = normalized + (location.search || '') + (location.hash || '');
				navigate(newPath, { replace: true });
				return; // Exit early to prevent further processing
			}
		}
	}, [location.pathname, location.search, location.hash, navigate]);

	return null;
};

const ScrollToTop = () => {
	const location = useLocation();

	useEffect(() => {
		const scrollTarget = document.scrollingElement ?? document.documentElement;
		scrollTarget.scrollTo({ top: 0, left: 0, behavior: 'auto' });
	}, [location.pathname, location.search]);

	return null;
};

// Navigation tracker component for end-to-end logging
const NavigationTracker = () => {
	const location = useLocation();
	const previousLocationRef = useRef<{ pathname: string; search: string } | null>(null);
	const navigationHistoryRef = useRef<Array<{ from: string; to: string; timestamp: number }>>([]);

	useEffect(() => {
		const currentPath = location.pathname + location.search;
		const previousPath = previousLocationRef.current 
			? previousLocationRef.current.pathname + previousLocationRef.current.search 
			: null;

		// Only log if path actually changed
		if (previousPath !== currentPath) {
			const timestamp = Date.now();
			
			console.group('🔄 [Navigation] Route Change Detected');
			console.log('📍 Navigation Details:', {
				from: previousPath || '(initial load)',
				to: currentPath,
				timestamp: new Date(timestamp).toISOString(),
				pathname: location.pathname,
				search: location.search,
				hash: location.hash || '(none)'
			});
			
			// Track navigation history (keep last 10)
			if (previousPath) {
				navigationHistoryRef.current.push({
					from: previousPath,
					to: currentPath,
					timestamp
				});
				if (navigationHistoryRef.current.length > 10) {
					navigationHistoryRef.current.shift();
				}
			}
			
			// Log navigation chain for redirect loops
			if (navigationHistoryRef.current.length >= 3) {
				const recent = navigationHistoryRef.current.slice(-3);
				const isLoop = recent.every((nav, idx) => 
					idx === 0 || nav.from === recent[idx - 1].to
				);
				if (isLoop && recent[0].from === recent[recent.length - 1].to) {
					console.error('🔄 [Navigation] ⚠️ POTENTIAL REDIRECT LOOP DETECTED!', {
						chain: recent.map(n => n.to),
						timestamps: recent.map(n => new Date(n.timestamp).toISOString())
					});
				}
			}
			
			console.log('📚 Recent Navigation History:', navigationHistoryRef.current.slice(-5));
			console.groupEnd();
			
			previousLocationRef.current = {
				pathname: location.pathname,
				search: location.search
			};
		}
	}, [location.pathname, location.search, location.hash]);

	return null;
};

// Import all the necessary pages
import UserSetup from '@/pages/administration/UserSetup';
import EmployeeRegistration from '@/pages/administration/EmployeeRegistration';
import CustomerSetup from '@/pages/administration/CustomerSetup';
import CustomerPageSettings from '@/pages/administration/CustomerPageSettings';
import StockControl from '@/pages/administration/StockControl';
import IncidentReportPage from '@/pages/operations/IncidentReportPage';
import MysteryShopperPage from '@/pages/operations/MysteryShopperPage';
import SiteVisitPage from '@/pages/operations/SiteVisitPage';
import HolidayRequestPage from '@/pages/operations/HolidayRequestPage';
import BankHolidayPage from '@/pages/operations/BankHolidayPage';
import CustomerSatisfactionPage from '@/pages/operations/CustomerSatisfactionPage';
import SafeDuressWordsPage from '@/pages/operations/SafeDuressWordsPage';
import OfficerSupportPage from '@/pages/operations/OfficerSupportPage';
import OfficerExpensesPage from '@/pages/operations/OfficerExpensesPage';
import UniformEquipmentPage from '@/pages/employee/UniformEquipmentPage';
import DisciplinaryPage from '@/pages/employee/DisciplinaryPage';
import EmployeeDiaryPage from '@/pages/employee/EmployeeDiaryPage';
import ManagerSupportPage from '@/pages/management/ManagerSupportPage';
import OfficerPerformance from '@/pages/management/OfficerPerformance';
import DataAnalyticsHub from '@/pages/analytics/DataAnalyticsHub';
import Settings from '@/pages/Settings';
import Profile from '@/pages/Profile';

// Import CRM pages
import CRMDashboard from '@/pages/crm/CRMDashboard';
import Contacts from '@/pages/crm/Contacts';
import CRMContacts from '@/pages/crm/CRMContacts';
import Deals from '@/pages/crm/Deals';
import Pipeline from '@/pages/crm/Pipeline';
import Tasks from '@/pages/crm/Tasks';

// Import compliance pages
import ContractRenewalPage from '@/pages/compliance/ContractRenewalPage';
import PasswordRegisterPage from '@/pages/compliance/PasswordRegisterPage';
import AssetRegisterPage from '@/pages/compliance/AssetRegisterPage';

// Import recruitment pages
import Vetting from '@/pages/recruitment/Vetting';
import CBT from '@/pages/recruitment/CBT';
import TakeTest from '@/pages/recruitment/TakeTest';
import TestSession from '@/pages/recruitment/TestSession';

// Import customer pages with lazy loading
const DailyActivityReportPage = lazy(() => import('./pages/customer/CustomerDailyActivityReport'));
const IncidentGraphPage = lazy(() => import('./pages/customer/IncidentGraph').then(module => ({ default: module.default })));
const CustomerIncidentReportPage = lazy(() => import('./pages/customer/CustomerIncidentReport'));
const CustomerSatisfactionReport = lazy(() => import('./pages/customer/CustomerSatisfactionReport'));
const DailyActivityReportGraphs = lazy(() => import('./pages/customer/DailyActivityReportGraphs'));
const CustomerMysteryShopperReport = lazy(() => import('./pages/customer/CustomerMysteryShopperReport'));
const CustomerSiteVisitReport = lazy(() => import('./pages/customer/CustomerSiteVisitReport'));
const CustomerDailyOccurrenceBook = lazy(() => import('./pages/customer/CustomerDailyOccurrenceBook'));
const CustomerOfficerSupportPage = lazy(() => import('./pages/customer/CustomerOfficerSupportPage'));
const CustomerCrimeIntelligencePage = lazy(() => import('./pages/customer/CustomerCrimeIntelligence'));

const CustomerViewsConfig = lazy(() => import('./pages/customer/CustomerViewsConfig'));
import BarcodeTestPage from './pages/test/BarcodeTestPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <PageAccessProvider>
        <PathNormalizer />
        <ScrollToTop />
        <NavigationTracker />
        <CustomerSelectionUrlSync />
        <Outlet />
      </PageAccessProvider>
    ),
    children: [
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'reset-password',
        element: <ResetPasswordPage />,
      },
      {
        path: 'test/barcode',
        element: <BarcodeTestPage />,
      },
      {
        path: '/',
        element: <Layout />,
        children: [
          {
            path: '/',
            element: (
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            ),
          },
          {
            path: 'dashboard',
            element: (
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            ),
          },
          {
            path: 'action-calendar',
            element: (
              <ProtectedRoute>
                <ActionCalendar />
              </ProtectedRoute>
            ),
          },
          {
            path: 'profile',
            element: (
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            ),
          },
          {
            path: 'settings',
            element: (
              <ProtectedRoute allowedRoles={['administrator'] as UserRole[]}>
                <Settings />
              </ProtectedRoute>
            ),
          },
          // Administration routes
          {
            path: 'administration/user-setup',
            element: (
              <ProtectedRoute allowedRoles={['administrator', 'advantageonehoofficer'] as UserRole[]}>
                <UserSetup />
              </ProtectedRoute>
            ),
          },
          {
            path: 'administration/employee-registration',
            element: (
              <ProtectedRoute allowedRoles={['administrator', 'advantageonehoofficer'] as UserRole[]}>
                <EmployeeRegistration />
              </ProtectedRoute>
            ),
          },
          {
            path: 'administration/customer-setup',
            element: (
              <ProtectedRoute allowedRoles={['administrator', 'advantageonehoofficer'] as UserRole[]}>
                <CustomerSetup />
              </ProtectedRoute>
            ),
          },
          {
            path: 'administration/customer-page-settings',
            element: (
              <ProtectedRoute allowedRoles={['administrator'] as UserRole[]}>
                <CustomerPageSettings />
              </ProtectedRoute>
            ),
          },
          {
            path: 'administration/stock-control',
            element: (
              <ProtectedRoute allowedRoles={['administrator', 'advantageonehoofficer'] as UserRole[]}>
                <StockControl />
              </ProtectedRoute>
            ),
          },
          // Operations routes
          {
            path: 'operations/incident-report',
            element: (
              <ProtectedRoute>
                <IncidentReportPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'operations/mystery-shopper',
            element: (
              <ProtectedRoute allowedRoles={['administrator', 'advantageonehoofficer'] as UserRole[]}>
                <MysteryShopperPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'operations/site-visit',
            element: (
              <ProtectedRoute allowedRoles={['administrator', 'advantageonehoofficer'] as UserRole[]}>
                <SiteVisitPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'operations/holiday-requests',
            element: (
              <ProtectedRoute>
                <HolidayRequestPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'operations/bank-holiday',
            element: (
              <ProtectedRoute allowedRoles={['administrator', 'advantageonehoofficer', 'advantageoneofficer'] as UserRole[]}>
                <BankHolidayPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'operations/customer-satisfaction',
            element: (
              <ProtectedRoute allowedRoles={['administrator', 'advantageonehoofficer'] as UserRole[]}>
                <CustomerSatisfactionPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'operations/safe-duress-words',
            element: (
              <ProtectedRoute>
                <SafeDuressWordsPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'operations/officer-support',
            element: (
              <ProtectedRoute>
                <OfficerSupportPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'operations/officer-expenses',
            element: (
              <ProtectedRoute>
                <OfficerExpensesPage />
              </ProtectedRoute>
            ),
          },
          // Employee routes
          {
            path: 'employee/uniform-equipment',
            element: (
              <ProtectedRoute>
                <UniformEquipmentPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'employee/disciplinary',
            element: (
              <ProtectedRoute allowedRoles={['administrator', 'advantageonehoofficer'] as UserRole[]}>
                <DisciplinaryPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'employee/diary',
            element: (
              <ProtectedRoute>
                <EmployeeDiaryPage />
              </ProtectedRoute>
            ),
          },
          // Management routes
          {
            path: 'management/customer-reporting',
            element: (
              <ProtectedRoute allowedRoles={['administrator', 'advantageonehoofficer', 'advantageoneofficer', 'customerhomanager'] as UserRole[]}>
                <CustomerReportingPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'management/manager-support',
            element: (
              <ProtectedRoute allowedRoles={['administrator', 'advantageonehoofficer', 'customerhomanager'] as UserRole[]}>
                <ManagerSupportPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'management/officer-performance',
            element: (
              <ProtectedRoute allowedRoles={['administrator', 'advantageonehoofficer', 'customerhomanager'] as UserRole[]}>
                <OfficerPerformance />
              </ProtectedRoute>
            ),
          },
          {
            path: 'analytics/data-analytics-hub',
            element: (
              <ProtectedRoute 
                allowedRoles={['administrator', 'advantageonehoofficer', 'customerhomanager'] as UserRole[]}
                accessPath="/analytics/data-analytics-hub"
                enforcePageAccess={false}
              >
                <DataAnalyticsHub />
              </ProtectedRoute>
            ),
          },
          // Customer routes
          {
            path: 'customer/satisfaction-report',
            element: (
              <ProtectedRoute allowedRoles={['administrator', 'advantageoneofficer', 'customerhomanager', 'customersitemanager'] as UserRole[]}>
                <CustomerSatisfactionReport />
              </ProtectedRoute>
            ),
          },
          {
            path: 'customer/be-safe-be-secure',
            element: (
              <ProtectedRoute allowedRoles={['administrator', 'advantageoneofficer', 'customerhomanager', 'customersitemanager'] as UserRole[]}>
                <DailyActivityReportGraphs />
              </ProtectedRoute>
            ),
          },
          {
            path: 'customer/daily-activity-report',
            element: (
              <ProtectedRoute allowedRoles={['administrator', 'advantageoneofficer', 'customerhomanager', 'customersitemanager'] as UserRole[]}>
                <DailyActivityReportPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'customer/incident-graph',
            element: (
              <ProtectedRoute allowedRoles={['administrator', 'advantageoneofficer', 'customerhomanager', 'customersitemanager'] as UserRole[]}>
                <IncidentGraphPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'customer/incident-report',
            element: (
              <ProtectedRoute allowedRoles={['administrator', 'advantageoneofficer', 'customerhomanager', 'customersitemanager'] as UserRole[]}>
                <CustomerIncidentReportPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'customer/crime-intelligence',
            element: (
              <ProtectedRoute allowedRoles={['administrator', 'advantageoneofficer', 'customerhomanager', 'customersitemanager'] as UserRole[]}>
                <CustomerCrimeIntelligencePage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'customer/mystery-shopper-report',
            element: (
              <ProtectedRoute allowedRoles={['administrator', 'advantageonehoofficer'] as UserRole[]}>
                <CustomerMysteryShopperReport />
              </ProtectedRoute>
            ),
          },
          {
            path: 'customer/site-visit-reports',
            element: (
              <ProtectedRoute allowedRoles={['administrator', 'advantageonehoofficer'] as UserRole[]}>
                <CustomerSiteVisitReport />
              </ProtectedRoute>
            ),
          },
          {
            path: 'customer/daily-occurrence-book',
            element: (
              <ProtectedRoute allowedRoles={['administrator', 'advantageoneofficer', 'customerhomanager', 'customersitemanager'] as UserRole[]}>
                <CustomerDailyOccurrenceBook />
              </ProtectedRoute>
            ),
          },

          {
            path: 'customer/views-config',
            element: (
              <ProtectedRoute allowedRoles={['administrator', 'advantageoneofficer', 'customerhomanager', 'customersitemanager'] as UserRole[]}>
                <CustomerViewsConfig />
              </ProtectedRoute>
            ),
          },
          {
            path: 'customer/officer-support',
            element: (
              <ProtectedRoute allowedRoles={['administrator', 'advantageoneofficer', 'customerhomanager', 'customersitemanager'] as UserRole[]}>
                <CustomerOfficerSupportPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'customer/:customerId/*',
            element: (
              <ProtectedRoute enforcePageAccess={false}>
                <CustomerDetailPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'crm/dashboard',
            element: (
              <ProtectedRoute>
                <CRMDashboard />
              </ProtectedRoute>
            ),
          },
          {
            path: 'crm/contacts',
            element: (
              <ProtectedRoute>
                <CRMContacts />
              </ProtectedRoute>
            ),
          },
          {
            path: 'crm/leads',
            element: (
              <ProtectedRoute>
                <CRMContacts />
              </ProtectedRoute>
            ),
          },
          {
            path: 'crm/contacts',
            element: (
              <ProtectedRoute>
                <Contacts />
              </ProtectedRoute>
            ),
          },
          {
            path: 'crm/deals',
            element: (
              <ProtectedRoute>
                <Deals />
              </ProtectedRoute>
            ),
          },
          {
            path: 'crm/pipeline',
            element: (
              <ProtectedRoute>
                <Pipeline />
              </ProtectedRoute>
            ),
          },
          {
            path: 'crm/tasks',
            element: (
              <ProtectedRoute>
                <Tasks />
              </ProtectedRoute>
            ),
          },
          // Compliance routes
          {
            path: 'compliance/contract-renewal',
            element: (
              <ProtectedRoute allowedRoles={['administrator', 'advantageonehoofficer'] as UserRole[]}>
                <ContractRenewalPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'compliance/password-register',
            element: (
              <ProtectedRoute allowedRoles={['administrator', 'advantageonehoofficer'] as UserRole[]}>
                <PasswordRegisterPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'compliance/asset-register',
            element: (
              <ProtectedRoute allowedRoles={['administrator', 'advantageonehoofficer'] as UserRole[]}>
                <AssetRegisterPage />
              </ProtectedRoute>
            ),
          },
          // Recruitment routes
          {
            path: 'recruitment/vetting',
            element: (
              <ProtectedRoute allowedRoles={['administrator', 'advantageonehoofficer'] as UserRole[]}>
                <Vetting />
              </ProtectedRoute>
            ),
          },
          {
            path: 'recruitment/cbt',
            element: (
              <ProtectedRoute allowedRoles={['administrator', 'advantageonehoofficer'] as UserRole[]}>
                <CBT />
              </ProtectedRoute>
            ),
          },
          {
            path: 'recruitment/take-test',
            element: (
              <ProtectedRoute>
                <TakeTest />
              </ProtectedRoute>
            ),
          },
          {
            path: 'recruitment/test-session/:testId',
            element: (
              <ProtectedRoute enforcePageAccess={false} accessPath="/recruitment/test-session">
                <TestSession />
              </ProtectedRoute>
            ),
          },
        ]
      }
    ]
  }
]);

export default router;
