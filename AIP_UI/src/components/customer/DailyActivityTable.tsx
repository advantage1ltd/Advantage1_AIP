import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CalendarIcon, Edit, Trash2, Search, Filter, Eye, Plus, X, Download, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { dailyActivityService } from '@/services/dailyActivityService';
import { regionService } from '@/services/regionService';
import { siteService } from '@/services/siteService';
import type { DailyActivityReport, DailyActivityFilters } from '@/types/dailyActivity';
import type { Region, Site } from '@/types/dashboard';

interface DailyActivityTableProps {
  onEdit: (report: DailyActivityReport) => void;
  onView: (report: DailyActivityReport) => void;
  onNew: () => void;
  refreshTrigger?: number;
  customerId?: string;
  siteId?: string | null;
}

export const DailyActivityTable = ({ onEdit, onView, onNew, refreshTrigger, customerId, siteId }: DailyActivityTableProps) => {
  const { user } = useAuth();
  const [reports, setReports] = useState<DailyActivityReport[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const pageSize = 10;

  // Search and Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<DailyActivityFilters>({
    search: '',
    customerId: customerId || '',
    siteId: '',
    officerName: '',
    reportDate: undefined
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const isAdmin = user?.role === 'administrator';

  // Update filters when customerId or siteId props change
  useEffect(() => {
    setFilters(prev => ({ 
      ...prev, 
      customerId: customerId || '',
      siteId: siteId || ''
    }));
  }, [customerId, siteId]);

  // Load initial data
  useEffect(() => {
    loadData();
  }, [currentPage, refreshTrigger]);

  // Load regions and sites for admin users
  useEffect(() => {
    if (isAdmin) {
      loadRegionsAndSites();
    }
  }, [isAdmin]);

  // Real-time search
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm }));
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm]);

  // Trigger search when filters change
  useEffect(() => {
    if (filters.search !== '' || filters.customerId || filters.siteId || filters.officerName || filters.reportDate) {
      loadData();
    }
  }, [filters]);

  // Filter sites based on selected customer (for admin)
  const filteredSites = filters.customerId
    ? sites.filter(site => site.fkCustomerID === parseInt(filters.customerId))
    : sites;

  const loadRegionsAndSites = async () => {
    try {
      // Determine customer ID - use prop if available (for admin with selected customer), otherwise use user's customerId
      const targetCustomerId = customerId && !isNaN(parseInt(customerId)) 
        ? parseInt(customerId) 
        : (user?.customerId && typeof user.customerId === 'number' ? user.customerId : undefined);

      if (!targetCustomerId && !isAdmin) {
        // Non-admin users must have a customerId
        return;
      }

      if (targetCustomerId) {
        // Fetch regions and sites for specific customer
        const [regionsResult, sitesResult] = await Promise.all([
          regionService.getRegionsByCustomer(targetCustomerId),
          siteService.getSitesByCustomer(targetCustomerId)
        ]);

        if (regionsResult.success) {
          setRegions(regionsResult.data);
        }
        if (sitesResult.success) {
          setSites(sitesResult.data);
        }
      } else if (isAdmin) {
        // For admin users without specific customer, fetch all (or handle differently)
        // For now, skip if no customer is selected
        console.log('Admin user - customer ID required to load regions and sites');
      }
    } catch (err) {
      console.error('Failed to load regions and sites:', err);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await dailyActivityService.getReports(currentPage, pageSize, filters);
      setReports(response.data);
      setTotalPages(Math.ceil(response.pagination.total / pageSize));
      setTotalRecords(response.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
      console.error('Failed to load daily activity reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilters({
      search: '',
      customerId: '',
      siteId: '',
      officerName: '',
      reportDate: undefined
    });
    setSelectedDate(undefined);
    setCurrentPage(1);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setFilters(prev => ({
      ...prev,
      reportDate: date ? format(date, 'yyyy-MM-dd') : undefined
    }));
  };

  const handleDelete = async (id: string) => {
    try {
      await dailyActivityService.deleteReport(id);
      setDeleteId(null);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete report');
    }
  };

  const handleRefresh = () => {
    loadData();
  };

  const hasActiveFilters = searchTerm || filters.customerId || filters.siteId || filters.officerName || filters.reportDate;

  if (loading && reports.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
          <p className="text-sm text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Modern Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Daily Activity Reports</h1>
            <p className="text-muted-foreground">
              Manage and review security compliance reports
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              Refresh
            </Button>
            <Button onClick={onNew} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Plus className="h-4 w-4" />
              New Report
            </Button>
          </div>
        </div>

        {/* Modern Search Bar */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-gray-50 to-gray-100/50">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by officer name, customer, site..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 border-0 bg-white shadow-sm focus-visible:ring-2 focus-visible:ring-purple-500"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>

              {/* Filter Toggle */}
              <Button 
                variant={showFilters ? "default" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 h-11"
              >
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] text-xs">
                    {[filters.customerId, filters.siteId, filters.officerName, filters.reportDate].filter(Boolean).length}
                  </Badge>
                )}
              </Button>

              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  onClick={handleClearFilters}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground h-11"
                >
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <Card className="border-dashed">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Advanced Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Customer Filter (Admin only) */}
              {isAdmin && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Customer</label>
                  <Select
                    value={filters.customerId}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, customerId: value, siteId: '' }))}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="All customers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All customers</SelectItem>
                      <SelectItem value="21">Central England COOP</SelectItem>
                      <SelectItem value="22">Heart of England</SelectItem>
                      <SelectItem value="23">Midcounties COOP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Site Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Site</label>
                <Select
                  value={filters.siteId}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, siteId: value }))}
                >
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="All sites" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All sites</SelectItem>
                    {filteredSites.map((site) => (
                      <SelectItem key={site.id} value={site.id}>
                        {site.locationName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Officer Name Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Officer</label>
                <Input
                  placeholder="Officer name..."
                  value={filters.officerName}
                  onChange={(e) => setFilters(prev => ({ ...prev, officerName: e.target.value }))}
                  className="bg-white"
                />
              </div>

              {/* Date Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Report Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-white",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{totalRecords}</span> reports found
          </p>
          {hasActiveFilters && (
            <Badge variant="outline" className="text-xs">
              Filtered results
            </Badge>
          )}
        </div>
        {totalRecords > 0 && (
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <div className="h-4 w-4 rounded-full bg-red-600 flex items-center justify-center">
                <span className="text-white text-xs">!</span>
              </div>
              <p className="font-medium">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modern Table */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b-0">
              <TableHead className="font-semibold text-gray-900 py-4">Customer</TableHead>
              <TableHead className="font-semibold text-gray-900">Site</TableHead>
              <TableHead className="font-semibold text-gray-900">Officer</TableHead>
              <TableHead className="font-semibold text-gray-900">Date Created</TableHead>
              <TableHead className="text-right font-semibold text-gray-900">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                      <Search className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-gray-900">No reports found</p>
                      <p className="text-sm text-muted-foreground">
                        {hasActiveFilters ? 'Try adjusting your filters' : 'Create your first daily activity report'}
                      </p>
                    </div>
                    {!hasActiveFilters && (
                      <Button onClick={onNew} className="mt-2">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Report
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report, index) => (
                <TableRow 
                  key={report.id} 
                  className={cn(
                    "hover:bg-gray-50/50 transition-colors border-b border-gray-100/60",
                    index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                  )}
                >
                  <TableCell>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {report.customerName}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-gray-700">{report.siteName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                        {report.officerName.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">{report.officerName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium py-4">
                    <div className="space-y-1">
                      <div className="text-sm font-semibold">
                        {format(new Date(report.reportDate), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(report.reportDate), 'EEEE')}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onView(report)}
                        className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(report)}
                        className="h-8 w-8 p-0 hover:bg-amber-100 hover:text-amber-600"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Report</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this daily activity report? 
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(report.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Modern Pagination */}
      {totalPages > 1 && (
        <Card className="border-0 bg-gray-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                <span className="font-medium">{Math.min(currentPage * pageSize, totalRecords)}</span> of{' '}
                <span className="font-medium">{totalRecords}</span> reports
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="bg-white"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                    // Smart pagination: show current page and surrounding pages
                    let page;
                    if (totalPages <= 7) {
                      page = i + 1;
                    } else {
                      // Show first page, current page area, and last page
                      if (currentPage <= 4) {
                        page = i + 1;
                      } else if (currentPage >= totalPages - 3) {
                        page = totalPages - 6 + i;
                      } else {
                        page = currentPage - 3 + i;
                      }
                    }
                    
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          "w-8 h-8 p-0",
                          currentPage === page 
                            ? "bg-purple-600 hover:bg-purple-700 text-white" 
                            : "bg-white hover:bg-gray-100"
                        )}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="bg-white"
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 