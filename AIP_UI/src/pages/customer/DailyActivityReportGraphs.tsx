import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { dailyActivityAnalyticsService, type AnalyticsResponse } from '@/services/dailyActivityAnalyticsService';
import { customerDashboardService } from '@/services/dashboardService';
import { getCustomerMappings, getCustomerNameById } from '@/services/customerMappingService';
import type { Site } from '@/types/dashboard';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  LabelList, 
  PieChart,
  Pie,
  Cell,
  Label
} from 'recharts';
import { Calendar, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ErrorBoundary from '@/components/ErrorBoundary';

const filterOptions = [
  'Breakdown Of Checks By Site',
  'Breakdown of Checks By Type',
  'Breakdown of Insecure Areas',
  'Breakdown of Systems Checks',
  'Breakdown Of Compliance Checks',
];

// Modern color palette
const COLORS = {
  primary: ['#4361ee', '#3a0ca3', '#7209b7', '#f72585', '#4cc9f0'],
  secondary: ['#2b9348', '#55a630', '#80b918', '#aacc00', '#bfd200'],
  tertiary: ['#ff9e00', '#ff7b00', '#ff5400', '#e62100', '#bc3908'],
  neutral: ['#2b2d42', '#8d99ae', '#edf2f4', '#ef233c', '#d90429'],
  compliance: {
    tills: '#4361ee',
    cashOffice: '#f72585',
    cashLevels: '#ffd166',
    keys: '#06d6a0',
    fireRoutes: '#ef476f',
    atm: '#073b4c',
    poster: '#118ab2'
  }
};

// Add a simple error handling wrapper component
const SafeComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const handleError = () => {
      setHasError(true);
      console.error('Error caught in SafeComponent');
    };

    window.addEventListener('error', handleError);
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] md:min-h-[400px] p-2 md:p-4 lg:p-6 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg md:text-xl font-semibold text-red-600 dark:text-red-400 mb-2 md:mb-4">Something went wrong</h2>
        <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mb-4 md:mb-6 text-center max-w-md">
          We encountered an error while rendering this component. Please try refreshing the page.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 md:mt-4 px-3 md:px-4 py-1.5 md:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm text-xs md:text-sm"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  return <>{children}</>;
};

const DailyActivityReportGraphs: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [startDate, setStartDate] = React.useState<Date | null>(null);
  const [endDate, setEndDate] = React.useState<Date | null>(null);
  const [selectedSite, setSelectedSite] = React.useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = React.useState<string>('all');
  const [selectedFilter, setSelectedFilter] = React.useState<string>('Breakdown Of Checks By Site');
  const [displayData, setDisplayData] = React.useState<any[]>([]);
  const [activeTab, setActiveTab] = React.useState('sites');
  const [isLoading, setIsLoading] = React.useState(false);
  const [analyticsData, setAnalyticsData] = React.useState<AnalyticsResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [sites, setSites] = React.useState<Site[]>([]);
  const [customers, setCustomers] = React.useState<Array<{ id: number; name: string }>>([]);
  const [customerRegion, setCustomerRegion] = React.useState<string>("Customer Sites");

  // Check if user is admin
  const isAdmin = user?.role === 'administrator';

  // Get customer ID from URL parameter or user's customerId
  const urlCustomerId = searchParams.get('customerId');
  const userCustomerId = user && ('customerId' in user) ? (user as any).customerId : undefined;
  const targetCustomerId = urlCustomerId || userCustomerId;

  // Load customers dynamically
  React.useEffect(() => {
    const loadCustomers = async () => {
      try {
        const customerMappings = await getCustomerMappings();
        setCustomers(customerMappings);
      } catch (error) {
        console.error('Failed to load customers:', error);
      }
    };
    loadCustomers();
  }, []);

  // Get customer name dynamically
  React.useEffect(() => {
    const loadCustomerName = async () => {
      if (user?.customerId) {
        try {
          const name = await getCustomerNameById(user.customerId);
          setCustomerRegion(name ? `${name} Sites` : "Customer Sites");
        } catch (error) {
          console.error('Failed to load customer name:', error);
          setCustomerRegion("Customer Sites");
        }
      } else {
        setCustomerRegion("Customer Sites");
      }
    };
    loadCustomerName();
  }, [user?.customerId]);

  // Load sites data
  const loadSites = React.useCallback(async () => {
    try {
      const sitesData = await customerDashboardService.getSites();
      setSites(sitesData);
    } catch (error) {
      console.error('Failed to load sites:', error);
    }
  }, []);

  // Load analytics data
  const loadAnalyticsData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const filters = {
        ...(startDate && { startDate: startDate.toISOString().split('T')[0] }),
        ...(endDate && { endDate: endDate.toISOString().split('T')[0] }),
        ...(selectedSite !== 'all' && { siteId: selectedSite }),
        // For admin users with customer selection, or when viewing customer-specific page
        ...((isAdmin && selectedCustomer !== 'all') || targetCustomerId ? { 
          customerId: (isAdmin && selectedCustomer !== 'all') ? selectedCustomer : targetCustomerId?.toString() 
        } : {})
      };

      console.log('[Analytics] Loading data with filters:', filters);
      console.log('[Analytics] User context:', { 
        role: user?.role, 
        customerId: user?.customerId, 
        urlCustomerId, 
        targetCustomerId 
      });
      const data = await dailyActivityAnalyticsService.getAnalytics(filters);
      setAnalyticsData(data);
      console.log('[Analytics] Data loaded successfully:', data);
      console.log('[Analytics] Site breakdown received:', data.siteBreakdown);
    } catch (error) {
      console.error('[Analytics] Failed to load data:', error);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, selectedSite, selectedCustomer, isAdmin, targetCustomerId, urlCustomerId]);

  // Process data based on selected filter
  const processDisplayData = React.useCallback(() => {
    if (!analyticsData) {
      setDisplayData([]);
      return;
    }

    let data: any[] = [];

    switch (selectedFilter) {
      case 'Breakdown Of Checks By Site':
        data = analyticsData.siteBreakdown.map(site => ({
          site: site.site,
          siteId: site.siteId,
          insecureAreas: site.insecureAreas,
          compliance: site.compliance,
          systems: site.systems
        }));
        break;

      case 'Breakdown of Checks By Type':
        data = analyticsData.typeBreakdown;
        break;

      case 'Breakdown of Insecure Areas':
        data = analyticsData.insecureAreas;
        break;

      case 'Breakdown of Systems Checks':
        data = analyticsData.systemsChecks;
        break;

      case 'Breakdown Of Compliance Checks':
        data = analyticsData.complianceChecks;
        break;

      default:
        data = [];
    }

    setDisplayData(data);
    console.log('[Analytics] Processed display data for', selectedFilter, ':', data);
  }, [analyticsData, selectedFilter]);

  // Initial load
  React.useEffect(() => {
    console.log('[Analytics] Component mounted');
    loadSites();
    loadAnalyticsData();
  }, [loadSites, loadAnalyticsData]);

  // Update display data when analytics data or filter changes
  React.useEffect(() => {
    processDisplayData();
  }, [processDisplayData]);

  const handleSearch = () => {
    console.log('[Analytics] Manual refresh triggered');
    loadAnalyticsData();
  };



  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-2 md:p-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
          <p className="text-xs md:text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-xs md:text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white dark:bg-slate-800 p-2 md:p-3 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
          <p className="text-xs md:text-sm font-medium text-slate-900 dark:text-slate-100">{data.payload.name}</p>
          <p className="text-xs md:text-sm" style={{ color: data.payload.color }}>
            {`Issues: ${data.value}`}
          </p>
          <p className="text-xs text-slate-500">
            {`${((data.value / displayData.reduce((sum: number, item: any) => sum + item.value, 0)) * 100).toFixed(1)}%`}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-sm text-slate-600">Loading analytics data...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadAnalyticsData} variant="outline" size="sm">
            Try Again
          </Button>
        </div>
      );
    }

    if (!displayData || displayData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-center">
          <div>
            <p className="text-slate-600 mb-2">No data available for the selected filters</p>
            <p className="text-sm text-slate-500">Try adjusting your filters or date range</p>
          </div>
        </div>
      );
    }

    const isCompliance = selectedFilter === 'Breakdown Of Compliance Checks';

    // Only Compliance Checks uses pie chart (3D effect), all others use bar charts
    if (isCompliance) {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={displayData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value, percent }: any) => 
                value > 0 ? `${name}: ${value} (${(percent * 100).toFixed(0)}%)` : ''
              }
              outerRadius={110}
              innerRadius={40}
              fill="#8884d8"
              dataKey="value"
              stroke="#fff"
              strokeWidth={2}
            >
              {displayData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomPieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    // All other charts use bar chart format
    const getBarChartConfig = () => {
      switch (selectedFilter) {
        case 'Breakdown Of Checks By Site':
          return {
            dataKey: 'site',
            bars: [
              { dataKey: 'insecureAreas', fill: COLORS.primary[0], name: 'Insecure Areas' },
              { dataKey: 'compliance', fill: COLORS.primary[1], name: 'Compliance Issues' },
              { dataKey: 'systems', fill: COLORS.primary[2], name: 'Systems Not Working' }
            ]
          };
        case 'Breakdown of Checks By Type':
          return {
            dataKey: 'type',
            bars: [
              { dataKey: 'value', fill: COLORS.primary[0], name: 'Count' }
            ]
          };
        case 'Breakdown of Insecure Areas':
          return {
            dataKey: 'area',
            bars: [
              { dataKey: 'value', fill: COLORS.secondary[0], name: 'Issues Count' }
            ]
          };
        case 'Breakdown of Systems Checks':
          return {
            dataKey: 'area',
            bars: [
              { dataKey: 'value', fill: COLORS.tertiary[0], name: 'Systems Down' }
            ]
          };
        default:
          return {
            dataKey: 'name',
            bars: [
              { dataKey: 'value', fill: COLORS.primary[0], name: 'Value' }
            ]
          };
      }
    };

    const config = getBarChartConfig();

    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={displayData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey={config.dataKey}
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={100}
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {config.bars.map((bar, index) => (
            <Bar 
              key={index}
              dataKey={bar.dataKey} 
              fill={bar.fill} 
              name={bar.name} 
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const handleSiteChange = (value: string) => {
    setSelectedSite(value);
    console.log('[Analytics] Site filter changed:', value);
  };

  const handleCustomerChange = (value: string) => {
    setSelectedCustomer(value);
    setSelectedSite('all'); // Reset site filter when customer changes
    console.log('[Analytics] Customer filter changed:', value);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    console.log('[Analytics] Tab changed:', value);
  };

  // Filter sites based on selected customer
  const filteredSites = React.useMemo(() => {
    if (!isAdmin || selectedCustomer === 'all') {
      return sites;
    }
    return sites.filter(site => site.customerId === parseInt(selectedCustomer));
  }, [sites, selectedCustomer, isAdmin]);



  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header Section */}
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Daily Activity Report Graphs
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Visualize daily activity report data across sites and categories
        </p>
      </div>

      {/* Filter Options Section */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold mb-4">Filter Options</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-2">
              <DatePicker
                date={startDate}
                setDate={setStartDate}
                placeholder="Start Date"
              />
              <DatePicker
                date={endDate}
                setDate={setEndDate}
                placeholder="End Date"
              />
            </div>
          </div>

          {/* Site Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Site</label>
            <Select value={selectedSite} onValueChange={handleSiteChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Sites" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sites</SelectItem>
                {filteredSites.map((site) => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.locationName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Admin Customer Filter */}
          {isAdmin && (
            <div>
              <label className="block text-sm font-medium mb-2">Customer</label>
              <Select value={selectedCustomer} onValueChange={handleCustomerChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Customers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Customers</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <Button onClick={handleSearch} className="w-full md:w-auto" disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
          Apply Filters
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="border-b border-slate-200 dark:border-slate-700">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {filterOptions.map((option) => (
              <button
                key={option}
                onClick={() => setSelectedFilter(option)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                  selectedFilter === option
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300'
                }`}
              >
                {option}
              </button>
            ))}
          </nav>
        </div>

        {/* Chart Content */}
        <div className="p-6">
          <SafeComponent>
            {renderChart()}
          </SafeComponent>
        </div>

        {/* Footer Info */}
        {analyticsData && (
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 rounded-b-lg border-t border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center text-sm text-slate-600 dark:text-slate-400">
              <span>Data shown for period: {analyticsData.dateRange.from} to {analyticsData.dateRange.to}</span>
              <span>{customerRegion}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ChartFallback = () => (
  <div className="flex flex-col items-center justify-center min-h-[300px] md:min-h-[400px] p-2 md:p-4 lg:p-6 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
    <h2 className="text-lg md:text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2 md:mb-4">Chart temporarily unavailable</h2>
    <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mb-4 md:mb-6 text-center max-w-md">
      We're having trouble loading the chart. Please try refreshing the page or contact support if the problem persists.
    </p>
    <button 
      onClick={() => window.location.reload()}
      className="mt-2 md:mt-4 px-3 md:px-4 py-1.5 md:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm text-xs md:text-sm"
    >
      Refresh Page
    </button>
  </div>
);

const DailyActivityReportGraphsWithErrorBoundary = () => (
  <ErrorBoundary fallback={<ChartFallback />}>
    <DailyActivityReportGraphs />
  </ErrorBoundary>
);

export default DailyActivityReportGraphsWithErrorBoundary; 

