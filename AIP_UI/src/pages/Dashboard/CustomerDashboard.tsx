import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  Building2,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell } from 'recharts'
import { cn } from '@/lib/utils'
import { IncidentTable } from '@/components/dashboard/IncidentTable'
import { DashboardGreeting } from '@/components/dashboard/DashboardGreeting'
import { useState, useEffect, useMemo } from 'react'
import { customerDashboardService } from '@/services/dashboardService'
import { CustomerRole, Region, CustomerStoreData, DailyActivity, SatisfactionDataPoint, BeSafeDataPoint, Site } from '@/types/dashboard'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useAuth } from '@/hooks/useAuth'
import { extractCustomerId } from '@/utils/customerId'
import { getCustomerNameById } from '@/services/customerMappingService'

interface CustomerDashboardProps {
  userRole: CustomerRole
}

const CustomerDashboard = ({ userRole }: CustomerDashboardProps) => {
  const { user } = useAuth();
  
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [siteData, setSiteData] = useState<CustomerStoreData | null>(null);
  const [satisfactionData, setSatisfactionData] = useState<SatisfactionDataPoint[]>([]);
  const [beSafeData, setBeSafeData] = useState<BeSafeDataPoint[]>([]);
  const [dailyActivities, setDailyActivities] = useState<DailyActivity[]>([]);
  const [activePeriod, setActivePeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [showAllMonths, setShowAllMonths] = useState(true);
  const [showAllMonthsBeSafe, setShowAllMonthsBeSafe] = useState(true);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>('');
  const [selectedSatisfactionMonth, setSelectedSatisfactionMonth] = useState<string>('');
  const [satisfactionViewMode, setSatisfactionViewMode] = useState<'bySite' | 'byMonth'>('bySite');

  const [customerName, setCustomerName] = useState<string>('Customer');

  // Fetch customer name dynamically from API
  useEffect(() => {
    const fetchCustomerName = async () => {
      if (user?.customerId) {
        try {
          const name = await getCustomerNameById(user.customerId);
          setCustomerName(name || 'Customer');
        } catch (error) {
          console.error('Error fetching customer name:', error);
          setCustomerName('Customer');
        }
      } else {
        setCustomerName('Customer');
      }
    };

    fetchCustomerName();
  }, [user?.customerId]);

  // Helper to get the list of site IDs to aggregate
  const getSiteIdsToAggregate = () => {
    if (selectedRegion === 'all' || !selectedRegion) {
      if (selectedSite === 'all' || !selectedSite) {
        return sites.map(site => site.id);
      }
      return [selectedSite];
    } else {
      const regionSites = sites.filter(site => site.regionId === selectedRegion);
      if (selectedSite === 'all' || !selectedSite) {
        return regionSites.map(site => site.id);
      }
      return [selectedSite];
    }
  };

  const filteredSites = useMemo(() => {
    if (!selectedRegion || selectedRegion === 'all') {
      return sites;
    }
    return sites.filter(site => site.regionId === selectedRegion);
  }, [selectedRegion, sites]);

  // Load initial data, filtered by customerId
  useEffect(() => {
    const abortController = new AbortController();
    let isActive = true;

    const loadInitialData = async () => {
      try {
        if (!isActive) return;
        
        // Check if user is a customer role - try multiple sources
        const userRoleRaw = user?.role || (user as any)?.Role || '';
        const userRole = userRoleRaw.toLowerCase();
        const isCustomerRole = userRole === 'customersitemanager' || userRole === 'customerhomanager';
        
        // Log user object for debugging
        console.log('🔍 [CustomerDashboard] User object:', {
          hasUser: !!user,
          userRole: user?.role,
          userRoleRaw: userRoleRaw,
          userRoleNormalized: userRole,
          isCustomerRole,
          userKeys: user ? Object.keys(user) : []
        });
        
        if (!isCustomerRole) {
          console.warn('⚠️ [CustomerDashboard] User is not a customer role:', {
            userRole,
            userRoleRaw,
            userObject: user
          });
          setError('Access denied. This dashboard is only available for customer users.');
          setLoading(false);
          return;
        }
        
        // Ensure user object has role set for extractCustomerId
        const userWithRole = user ? { ...user, role: userRole as any } : null;
        const customerId = extractCustomerId(userWithRole);
        
        if (!customerId) {
          // Log detailed information for debugging
          console.error('❌ [CustomerDashboard] Customer ID not found:', {
            user: user ? {
              id: user.id,
              role: user.role,
              customerId: user.customerId,
              hasCustomerId: 'customerId' in user,
              assignedCustomerIds: (user as any).assignedCustomerIds || (user as any).AssignedCustomerIds
            } : null
          });
          
          setError('Customer ID not found. Please log out and log in again to refresh your session.');
          setLoading(false);
          return;
        }
        
        setLoading(true);
        setError(null);

        // Load all data
        const [storesData, regionsData, sitesData] = await Promise.all([
          customerDashboardService.getStores(abortController.signal),
          customerDashboardService.getRegions(abortController.signal),
          customerDashboardService.getSites(abortController.signal)
        ]);

        // Filter by customerId
        const filteredRegions = regionsData.filter(r => r.customerId === customerId);
        const filteredSites = sitesData.filter(s => s.customerId === customerId);

        setRegions(filteredRegions);
        setSites(filteredSites);

        // Set initial selections
        if (filteredRegions.length > 0) {
          setSelectedRegion('all');
        }
        if (filteredSites.length > 0) {
          setSelectedSite('all');
        }
        setLoading(false);
      } catch (err) {
        if (!(err instanceof Error && err.name === 'AbortError')) {
          console.error('Error loading initial data:', err);
          setError('Failed to load initial data');
        }
        setLoading(false);
      }
    };

    loadInitialData();

    return () => {
      isActive = false;
      abortController.abort();
    };
  }, [user]);

  // Reset site selection when region changes
  useEffect(() => {
    // When region changes, reset site selection to "all" by default
    if (selectedRegion === 'all') {
      setSelectedSite('all'); // Show all sites when all regions selected
    } else {
      // When a specific region is selected, show all sites in that region
      setSelectedSite('all');
    }
  }, [selectedRegion]);

  // Load site or aggregate data when selection changes
  useEffect(() => {
    const siteIds = getSiteIdsToAggregate();
    
    if (!siteIds.length) return;

    let isActive = true;
    const abortController = new AbortController();

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        setSiteData(null);

        const [data, satisfaction, beSafe, activities] = await Promise.all([
          siteIds.length === 1
            ? customerDashboardService.getSiteData(siteIds[0], abortController.signal)
            : customerDashboardService.getAggregatedSitesData(siteIds, abortController.signal),
          customerDashboardService.getSatisfactionData(siteIds, abortController.signal),
          customerDashboardService.getBeSafeData(abortController.signal, getSiteIdsToAggregate()),
          customerDashboardService.getDailyActivities(abortController.signal)
        ]);
        
        if (!isActive) return;
        setSiteData(data);
        setSatisfactionData(satisfaction || []);
        setBeSafeData(beSafe || []);
        setDailyActivities(activities || []);
      } catch (err) {
        if (isActive) {
          console.error('Error loading dashboard data:', err);
          setError('Failed to load dashboard data');
          setSiteData(null);
        }
      } finally {
        if (isActive) setLoading(false);
      }
    };
    
    loadData();
    return () => {
      isActive = false;
      abortController.abort();
    };
  }, [selectedRegion, selectedSite, sites]);

  // Get available months from satisfaction data
  const availableMonths = useMemo(() => {
    const months = new Set(satisfactionData.map(d => d.month).filter(Boolean));
    return Array.from(months)
      .sort((a, b) => {
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateB.getTime() - dateA.getTime();
      });
  }, [satisfactionData]);

  // Set default selected month to most recent
  useEffect(() => {
    if (availableMonths.length > 0 && !selectedSatisfactionMonth) {
      setSelectedSatisfactionMonth(availableMonths[0]);
    }
  }, [availableMonths, selectedSatisfactionMonth]);

  // Transform satisfaction data based on view mode
  const satisfactionDataBySite = useMemo(() => {
    if (satisfactionData.length === 0) return [];
    
    if (satisfactionViewMode === 'bySite') {
      // Show sites for selected month
      const monthToShow = selectedSatisfactionMonth || availableMonths[0] || '';
      if (!monthToShow) return [];
      
      const siteMap = new Map<string, { score: number; month: string; siteName: string }>();
      
      satisfactionData.forEach((point) => {
        if (point.month === monthToShow && point.siteName) {
          const existing = siteMap.get(point.siteName);
          if (!existing || new Date(point.month) >= new Date(existing.month)) {
            siteMap.set(point.siteName, {
              score: point.score,
              month: point.month,
              siteName: point.siteName
            });
          }
        }
      });
      
      const result = Array.from(siteMap.values())
        .map(item => ({
          siteName: item.siteName,
          score: item.score,
          month: item.month
        }))
        .sort((a, b) => a.siteName.localeCompare(b.siteName));
      
      // Ensure at least 5 data points - if we have fewer sites, show multiple months
      if (result.length < 5 && availableMonths.length > 1) {
        // Include data from additional months to reach at least 5
        const additionalMonths = availableMonths.slice(1, Math.min(6, availableMonths.length));
        additionalMonths.forEach(month => {
          satisfactionData.forEach((point) => {
            if (point.month === month && point.siteName && !siteMap.has(point.siteName)) {
              siteMap.set(point.siteName, {
                score: point.score,
                month: point.month,
                siteName: point.siteName
              });
            }
          });
        });
        return Array.from(siteMap.values())
          .map(item => ({
            siteName: item.siteName,
            score: item.score,
            month: item.month
          }))
          .sort((a, b) => a.siteName.localeCompare(b.siteName));
      }
      
      return result;
    } else {
      // Show months on X-axis - aggregate all sites per month
      const monthMap = new Map<string, { scores: number[]; month: string }>();
      
      satisfactionData.forEach((point) => {
        if (!monthMap.has(point.month)) {
          monthMap.set(point.month, { scores: [], month: point.month });
        }
        if (point.score > 0) {
          monthMap.get(point.month)!.scores.push(point.score);
        }
      });
      
      const result = Array.from(monthMap.entries())
        .map(([month, data]) => ({
          month,
          score: data.scores.length > 0 
            ? data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length 
            : 0,
          siteName: `${data.scores.length} site${data.scores.length !== 1 ? 's' : ''}`
        }))
        .sort((a, b) => {
          const dateA = new Date(a.month);
          const dateB = new Date(b.month);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, Math.max(5, availableMonths.length)); // Show at least 5 months
      
      return result;
    }
  }, [satisfactionData, satisfactionViewMode, selectedSatisfactionMonth, availableMonths]);

  // Calculate Y-axis domain for satisfaction chart
  const satisfactionYDomain = useMemo(() => {
    if (satisfactionDataBySite.length === 0) return [0, 10];
    const scores = satisfactionDataBySite.map(d => d.score || 0).filter(s => s > 0);
    if (scores.length === 0) return [0, 10];
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const padding = (max - min) * 0.2 || 0.5;
    return [Math.max(0, min - padding), Math.min(10, max + padding)];
  }, [satisfactionDataBySite]);

  const beSafeDataToShow = useMemo(() => {
    if (showAllMonthsBeSafe || beSafeData.length <= 12) return beSafeData;
    return beSafeData.slice(-12);
  }, [showAllMonthsBeSafe, beSafeData]);

  // Calculate dynamic Y-axis domain for Be Safe chart based on actual data
  const beSafeYDomain = useMemo(() => {
    if (beSafeDataToShow.length === 0) return [0, 100];
    
    const allValues = beSafeDataToShow.flatMap(d => [
      d.insecureAreas,
      d.compliance,
      d.systems
    ]).filter(v => v !== undefined && v !== null && !isNaN(v) && v >= 0);
    
    if (allValues.length === 0) return [0, 100];
    
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    
    // Ensure we show from 0 if any value is below 50, otherwise show a reasonable range
    const min = minValue < 50 ? 0 : Math.max(0, Math.floor(minValue / 10) * 10 - 10);
    const max = Math.min(100, Math.ceil(maxValue / 10) * 10 + 10);
    
    if (import.meta.env.DEV) {
      console.log('📊 [BeSafe Chart] Y-axis domain:', { min, max, minValue, maxValue, allValues: allValues.slice(0, 10) });
      console.log('📊 [BeSafe Chart] Data points:', beSafeDataToShow.map(d => ({
        month: d.month,
        insecureAreas: d.insecureAreas,
        compliance: d.compliance,
        systems: d.systems
      })));
    }
    
    return [min, max];
  }, [beSafeDataToShow]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="alert">
        <div className="text-center p-4 rounded-lg bg-white shadow-lg">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
            className="min-w-[120px] h-10"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Wait for store data to be loaded
  if (!siteData) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // For HO Managers, we can show the dashboard without store data
  // For Site Managers, we need store data
  const metrics = siteData?.metrics?.[userRole] || [];

  return (
    <main className="min-h-screen bg-[#EFF4FF]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[90rem] py-4 sm:py-6 lg:py-8">
        <header className="mb-6 sm:mb-8">
          <DashboardGreeting className="mb-6" />

          {/* Dashboard Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold">
                {customerName} Overview
              </h1>
              <Building2 className="h-6 w-6 sm:h-7 sm:w-7 text-gray-500" aria-hidden="true" />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="w-full sm:w-[200px] h-11">
                  <SelectValue placeholder="Select Region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {regions.map((region) => (
                    <SelectItem key={region.id} value={region.id}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={selectedSite} 
                onValueChange={setSelectedSite}
              >
                <SelectTrigger className="w-full sm:w-[250px] h-11">
                  <SelectValue placeholder="Select Site" />
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
          </div>
        </header>

        <div className="space-y-6 sm:space-y-8">
          {/* Metrics Grid */}
          <section aria-label="Key Metrics" className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {metrics.map((metric, index) => (
              <Card
                key={index}
                className={cn(
                  "relative overflow-hidden border-none shadow-lg transition-transform hover:scale-[1.02]",
                  metrics.length % 2 !== 0 && index === metrics.length - 1 ? "col-span-2 sm:col-span-1" : "",
                  metric.color === 'green' ? 'bg-[#198754]' :
                  metric.color === 'amber' ? 'bg-[#FFC107]' :
                  metric.color === 'blue' ? 'bg-[#0D6EFD]' :
                  'bg-[#DC3545]'
                )}
              >
                <CardHeader className="pb-2 sm:pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base sm:text-lg text-white/90 font-medium">
                      {metric.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                    {metric.value}
                  </div>
                  <div className="flex items-center mt-2 sm:mt-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/20 text-white text-sm">
                      {metric.trend === 'up' ? 
                        <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5" aria-hidden="true" /> : 
                        <ArrowDownRight className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5" aria-hidden="true" />
                      }
                      {metric.change}
                    </span>
                    <span className="ml-2 text-sm text-white/70">
                      {metric.trend === 'up' ? 'increase' : 'decrease'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Charts */}
            <section className="lg:col-span-2 space-y-6" aria-label="Charts and Reports">
              {/* Incident Graph */}
              <Card>
                <CardHeader className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-2">
                    <CardTitle className="text-lg sm:text-xl font-semibold">
                      Incident Reports
                    </CardTitle>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#10B981]" aria-hidden="true" />
                        <span>Uniform Officers</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#F59E0B]" aria-hidden="true" />
                        <span>Store Detectives</span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full sm:w-auto">
                    <div className="bg-gray-100 rounded-lg p-1 flex text-sm">
                      {(["daily", "weekly", "monthly", "yearly"] as const).map((period) => (
                        <button
                          key={period}
                          onClick={() => setActivePeriod(period)}
                          className={cn(
                            "flex-1 sm:flex-none px-3 py-1.5 rounded-md transition-colors capitalize",
                            period === activePeriod
                              ? "bg-white shadow-sm text-emerald-600 font-medium"
                              : "text-gray-600 hover:text-gray-900"
                          )}
                        >
                          {period}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4">
                  <div className="h-[300px] sm:h-[350px] lg:h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={siteData.incidentData[activePeriod]}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="uniformOfficersGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10B981" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#10B981" stopOpacity={0.2} />
                          </linearGradient>
                          <linearGradient id="storeDetectivesGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#F59E0B" stopOpacity={0.2} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                        <XAxis
                          dataKey={activePeriod === 'daily' ? 'date' : activePeriod === 'weekly' ? 'week' : activePeriod === 'monthly' ? 'month' : 'year'}
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                          className="text-gray-500"
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                          className="text-gray-500"
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="uniformOfficers"
                          stackId="1"
                          stroke="#10B981"
                          fill="url(#uniformOfficersGradient)"
                          name="Uniform Officers"
                        />
                        <Area
                          type="monotone"
                          dataKey="storeDetectives"
                          stackId="1"
                          stroke="#F59E0B"
                          fill="url(#storeDetectivesGradient)"
                          name="Store Detectives"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Be Safe Be Secure Graph */}
              <Card>
                <CardHeader className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle className="text-lg sm:text-xl font-semibold">
                      Be Safe Be Secure Compliance
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">Monthly compliance metrics</p>
                  </div>
                  {beSafeData.length > 12 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAllMonthsBeSafe(v => !v)}
                      className="h-9"
                    >
                      {showAllMonthsBeSafe ? 'Show Last 12 Months' : 'Show All Months'}
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="p-4">
                  {beSafeDataToShow.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" aria-hidden="true" />
                      <p className="text-gray-500 text-sm">No compliance data available</p>
                    </div>
                  ) : (
                    <div className="h-[300px] sm:h-[350px] w-full overflow-hidden">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={beSafeDataToShow}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          barCategoryGap={20}
                        >
                        <defs>
                          <linearGradient id="insecureAreasGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#D97706" stopOpacity={0.8} />
                          </linearGradient>
                          <linearGradient id="complianceGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10B981" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#059669" stopOpacity={0.8} />
                          </linearGradient>
                          <linearGradient id="systemsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#2563EB" stopOpacity={0.8} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
                        <XAxis 
                          dataKey="month" 
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                          padding={{ left: 10, right: 10 }}
                        />
                        <YAxis 
                          domain={beSafeYDomain}
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `${value}%`}
                        />
                        <Tooltip
                          cursor={{ fill: 'rgba(0, 0, 0, 0.05)', radius: 4 }}
                          contentStyle={{
                            backgroundColor: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          }}
                          formatter={(value: number) => [`${value}%`, '']}
                        />
                        <Legend 
                          wrapperStyle={{ paddingTop: '20px' }}
                          iconType="circle"
                          formatter={(value) => <span className="text-sm">{value}</span>}
                        />
                        <Bar 
                          dataKey="insecureAreas" 
                          fill="url(#insecureAreasGradient)"
                          name="Insecure Areas"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar 
                          dataKey="compliance" 
                          fill="url(#complianceGradient)"
                          name="Compliance"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar 
                          dataKey="systems" 
                          fill="url(#systemsGradient)"
                          name="Systems"
                          radius={[4, 4, 0, 0]}
                        />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Incidents Table */}
              <Card>
                <CardHeader className="p-4 sm:p-5">
                  <CardTitle className="text-lg sm:text-xl font-semibold">
                    Recent Incidents
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <div className="min-w-full p-4">
                      <IncidentTable data={siteData?.recentIncidents || []} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Right Column - Activities and Satisfaction */}
            <section className="space-y-6" aria-label="Activities and Satisfaction">
              {/* Daily Activity Reports */}
              <Card className="shadow-lg border-0">
                <CardHeader className="p-5 sm:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                  <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Activity className="h-6 w-6 text-blue-600" aria-hidden="true" />
                    Daily Activity Reports
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-5">
                  {dailyActivities.length === 0 ? (
                    <div className="text-center py-12">
                      <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" aria-hidden="true" />
                      <p className="text-gray-500 text-sm">No activities recorded</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dailyActivities.map((activity) => (
                        <div 
                          key={activity.id} 
                          className="group flex items-start gap-4 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                        >
                          <div className={cn(
                            "flex-shrink-0 mt-1 p-3 rounded-xl shadow-sm",
                            activity.status === 'completed' 
                              ? 'bg-gradient-to-br from-emerald-100 to-emerald-200' 
                              : 'bg-gradient-to-br from-blue-100 to-indigo-100'
                          )}>
                            {activity.status === 'completed' ? (
                              <CheckCircle className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                            ) : (
                              <Activity className="h-5 w-5 text-blue-600" aria-hidden="true" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <h4 className="text-base font-semibold text-gray-900 leading-tight">
                                {activity.type}
                              </h4>
                              <time className="flex-shrink-0 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                                {activity.time}
                              </time>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-700 flex items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5 text-gray-400" aria-hidden="true" />
                                {activity.location}
                              </p>
                              <p className="text-xs text-gray-500">
                                {activity.officer}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Satisfaction Survey */}
              <Card className="shadow-lg border-0">
                <CardHeader className="p-4 sm:p-5 lg:p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-b">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 flex items-center gap-2 mb-1">
                          <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600 flex-shrink-0" aria-hidden="true" />
                          <span className="truncate">Satisfaction Survey</span>
                        </CardTitle>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1 line-clamp-2">
                          {satisfactionViewMode === 'bySite' 
                            ? selectedSatisfactionMonth 
                              ? `Satisfaction ratings for ${selectedSatisfactionMonth}`
                              : 'Customer satisfaction ratings by site'
                            : 'Satisfaction ratings over time'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col xs:flex-row gap-2 w-full">
                      <Select 
                        value={satisfactionViewMode} 
                        onValueChange={(value: 'bySite' | 'byMonth') => setSatisfactionViewMode(value)}
                      >
                        <SelectTrigger className="w-full xs:w-[140px] h-9 text-xs flex-shrink-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bySite">By Site</SelectItem>
                          <SelectItem value="byMonth">By Month</SelectItem>
                        </SelectContent>
                      </Select>
                      {satisfactionViewMode === 'bySite' && availableMonths.length > 0 && (
                        <Select 
                          value={selectedSatisfactionMonth} 
                          onValueChange={setSelectedSatisfactionMonth}
                        >
                          <SelectTrigger className="w-full xs:flex-1 min-w-0 h-9 text-xs">
                            <SelectValue placeholder="Select Month" />
                          </SelectTrigger>
                          <SelectContent className="max-w-[90vw]">
                            {availableMonths.map((month) => (
                              <SelectItem key={month} value={month} className="truncate">
                                {month}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-5 sm:p-6">
                  {satisfactionDataBySite.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" aria-hidden="true" />
                      <p className="text-gray-500 text-sm">No satisfaction data available</p>
                    </div>
                  ) : (
                    <div className="h-[320px] sm:h-[380px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={satisfactionDataBySite} 
                          margin={{ top: 20, right: 20, left: 10, bottom: 60 }}
                          barCategoryGap="20%"
                        >
                          <defs>
                            <linearGradient id="satisfactionBarGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.9} />
                              <stop offset="100%" stopColor="#D97706" stopOpacity={0.9} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid 
                            strokeDasharray="3 3" 
                            stroke="#E5E7EB" 
                            vertical={false}
                          />
                          <XAxis 
                            dataKey={satisfactionViewMode === 'bySite' ? 'siteName' : 'month'}
                            tick={{ 
                              fontSize: 11, 
                              fill: '#6B7280',
                              fontWeight: 500
                            }}
                            tickLine={false}
                            axisLine={{ stroke: '#E5E7EB', strokeWidth: 1 }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis
                            domain={satisfactionYDomain}
                            tick={{ 
                              fontSize: 11, 
                              fill: '#6B7280',
                              fontWeight: 500
                            }}
                            tickLine={false}
                            axisLine={{ stroke: '#E5E7EB', strokeWidth: 1 }}
                            tickFormatter={(value) => `${value.toFixed(1)}`}
                            label={{ 
                              value: 'Score', 
                              angle: -90, 
                              position: 'insideLeft',
                              style: { textAnchor: 'middle', fill: '#6B7280', fontSize: 12 }
                            }}
                          />
                          <Tooltip
                            cursor={{ fill: 'rgba(245, 158, 11, 0.1)' }}
                            contentStyle={{
                              backgroundColor: 'white',
                              border: '1px solid #E5E7EB',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                              padding: '12px',
                            }}
                            labelStyle={{
                              color: '#111827',
                              fontWeight: 600,
                              marginBottom: '4px',
                              fontSize: '13px'
                            }}
                            labelFormatter={(label) => {
                              if (satisfactionViewMode === 'bySite') {
                                const dataPoint = satisfactionDataBySite.find(d => d.siteName === label);
                                return dataPoint ? `${label} (${dataPoint.month})` : label;
                              }
                              return label;
                            }}
                            formatter={(value: number, name: string, props: any) => {
                              const siteInfo = satisfactionViewMode === 'bySite' && props.payload?.siteName
                                ? ` - ${props.payload.siteName}`
                                : '';
                              return [
                                <span key="value" style={{ color: '#F59E0B', fontWeight: 600 }}>
                                  {value.toFixed(2)}
                                </span>,
                                `Score${siteInfo}`
                              ];
                            }}
                          />
                          <Bar 
                            dataKey="score" 
                            fill="url(#satisfactionBarGradient)"
                            radius={[8, 8, 0, 0]}
                            name="Satisfaction Score"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

export default CustomerDashboard; 