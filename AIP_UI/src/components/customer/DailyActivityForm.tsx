import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CalendarIcon, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { dailyActivityService } from '@/services/dailyActivityService';
import { siteService } from '@/services/siteService';
import type { 
  DailyActivityReport, 
  DailyActivityRequest, 
  DailyActivity,
  ActivityIncident,
  SecurityCheck,
  VisitorEntry,
  ComplianceData,
  InsecureAreasData,
  SystemsNotWorkingData 
} from '@/types/dailyActivity';
import type { Site } from '@/types/customer';

interface DailyActivityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report?: DailyActivityReport | null;
  onSuccess: () => void;
  customerId?: string;
  siteId?: string | null;
}

export const DailyActivityForm = ({ open, onOpenChange, report, onSuccess, customerId: propCustomerId, siteId: propSiteId }: DailyActivityFormProps) => {
  const { user } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    siteId: '',
    siteName: '',
    officerName: '',
    reportDate: new Date(),
    notes: ''
  });

  // Compliance section
  const [compliance, setCompliance] = useState<ComplianceData>({
    tillsContainedOverCash: { value: '', description: '' },
    cashOfficeDoorOpen: { value: '', description: '' },
    visibleCashOnDisplay: { value: '', description: '' },
    visibleKeysOnDisplay: { value: '', description: '' },
    fireRoutesBlocked: { value: '', description: '' },
    beSafeBSecurePoster: { value: '', description: '' },
    atmAbuse: { value: '', description: '' }
  });

  // Insecure Areas
  const [insecureAreas, setInsecureAreas] = useState<InsecureAreasData>({
    kioskSecure: { value: '', description: '' },
    highValueRoom: { value: '', description: '' },
    managersOffice: { value: '', description: '' },
    warehouseToSalesFloor: { value: '', description: '' },
    serviceYard: { value: '', description: '' },
    carParkGrounds: { value: '', description: '' },
    fireDoorsBackOfHouse: { value: '', description: '' },
    fireDoorsShopFloor: { value: '', description: '' }
  });

  // Systems Not Working
  const [systemsNotWorking, setSystemsNotWorking] = useState<SystemsNotWorkingData>({
    watchMeNow: { value: '', description: '' },
    cctv: { value: '', description: '' },
    intruderAlarm: { value: '', description: '' },
    keyholding: { value: '', description: '' },
    bodyWornCctv: { value: '', description: '' },
    cigaretteTracker: { value: '', description: '' },
    crimeReporting: { value: '', description: '' }
  });

  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [incidents, setIncidents] = useState<ActivityIncident[]>([]);
  const [securityChecks, setSecurityChecks] = useState<SecurityCheck[]>([]);
  const [visitorLog, setVisitorLog] = useState<VisitorEntry[]>([]);

  const isAdmin = user?.role === 'administrator';

  // Load sites and initialize form
  useEffect(() => {
    if (open) {
      loadSites();
      if (report) {
        populateFormFromReport(report);
      } else {
        resetForm();
      }
    }
  }, [open, report]);

  // Reset form when sites are loaded and propSiteId is available
  useEffect(() => {
    if (open && !report && sites.length > 0 && propSiteId) {
      resetForm();
    }
  }, [sites, propSiteId, open, report]);

  const loadSites = async () => {
    try {
      // Use the passed customerId if available, otherwise fall back to user's customerId
      const targetCustomerId = propCustomerId 
        ? parseInt(propCustomerId) 
        : (user?.customerId && typeof user.customerId === 'number' ? user.customerId : undefined);
      
      if (!targetCustomerId) {
        console.warn('🏢 [DailyActivityForm] No customer ID available to load sites');
        return;
      }
      
      console.log('🏢 [DailyActivityForm] Loading sites for customer ID:', targetCustomerId);
      
      const response = await siteService.getSitesByCustomer(targetCustomerId);
      
      if (response.success) {
        console.log('🏢 [DailyActivityForm] Loaded sites:', response.data.length, 'sites for customer', targetCustomerId);
        setSites(response.data);
      } else {
        console.error('🏢 [DailyActivityForm] Failed to load sites:', response);
      }
    } catch (err) {
      console.error('Failed to load sites:', err);
    }
  };

  const populateFormFromReport = (report: DailyActivityReport) => {
    setFormData({
      siteId: report.siteId,
      siteName: report.siteName,
      officerName: report.officerName,
      reportDate: new Date(report.reportDate),
      notes: report.notes
    });
    
    // Populate compliance data
    if (report.compliance) {
      setCompliance(report.compliance);
    }
    
    // Populate insecure areas data
    if (report.insecureAreas) {
      setInsecureAreas(report.insecureAreas);
    }
    
    // Populate systems not working data
    if (report.systemsNotWorking) {
      setSystemsNotWorking(report.systemsNotWorking);
    }
    
    setActivities(report.activities);
    setIncidents(report.incidents);
    setSecurityChecks(report.securityChecks);
    setVisitorLog(report.visitorLog);
  };

  const siteOptions = useMemo(() => {
    return sites
      .map((site, index) => {
        const derivedId = site?.siteID !== undefined && site?.siteID !== null
          ? String(site.siteID)
          : `site-${index}`;
        const trimmedName = site?.locationName?.trim();
        return {
          id: derivedId,
          name: trimmedName && trimmedName.length > 0 ? trimmedName : `Site ${derivedId}`,
        };
      })
      .filter((option) => option.id.length > 0);
  }, [sites]);

  const resetForm = () => {
    // Pre-fill site if provided
    const selectedSite = propSiteId ? siteOptions.find(site => site.id === propSiteId) : null;
    
    setFormData({
      siteId: propSiteId || '',
      siteName: selectedSite?.name || '',
      officerName: user?.username || '',
      reportDate: new Date(),
      notes: ''
    });
    setCompliance({
      tillsContainedOverCash: { value: '', description: '' },
      cashOfficeDoorOpen: { value: '', description: '' },
      visibleCashOnDisplay: { value: '', description: '' },
      visibleKeysOnDisplay: { value: '', description: '' },
      fireRoutesBlocked: { value: '', description: '' },
      beSafeBSecurePoster: { value: '', description: '' },
      atmAbuse: { value: '', description: '' }
    });
    setInsecureAreas({
      kioskSecure: { value: '', description: '' },
      highValueRoom: { value: '', description: '' },
      managersOffice: { value: '', description: '' },
      warehouseToSalesFloor: { value: '', description: '' },
      serviceYard: { value: '', description: '' },
      carParkGrounds: { value: '', description: '' },
      fireDoorsBackOfHouse: { value: '', description: '' },
      fireDoorsShopFloor: { value: '', description: '' }
    });
    setSystemsNotWorking({
      watchMeNow: { value: '', description: '' },
      cctv: { value: '', description: '' },
      intruderAlarm: { value: '', description: '' },
      keyholding: { value: '', description: '' },
      bodyWornCctv: { value: '', description: '' },
      cigaretteTracker: { value: '', description: '' },
      crimeReporting: { value: '', description: '' }
    });
    setActivities([]);
    setIncidents([]);
    setSecurityChecks([]);
    setVisitorLog([]);
  };

  const handleSiteChange = (siteId: string) => {
    // Don't allow selection of the "no-sites" placeholder
    if (siteId === "no-sites") {
      return;
    }
    
    const selectedSite = siteOptions.find(site => site.id === siteId);
    setFormData(prev => ({
      ...prev,
      siteId,
      siteName: selectedSite?.name || ''
    }));
  };

  const handleComplianceChange = (field: keyof typeof compliance, type: 'value' | 'description', value: string) => {
    setCompliance(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [type]: value
      }
    }));
  };

  const handleInsecureAreaChange = (field: keyof typeof insecureAreas, type: 'value' | 'description', value: string) => {
    setInsecureAreas(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [type]: value
      }
    }));
  };

  const handleSystemChange = (field: keyof typeof systemsNotWorking, type: 'value' | 'description', value: string) => {
    setSystemsNotWorking(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        [type]: value
      }
    }));
  };

  const addActivity = () => {
    const newActivity: DailyActivity = {
      id: `act${Date.now()}`,
      time: '',
      activity: '',
      location: '',
      description: '',
      status: 'completed'
    };
    setActivities(prev => [...prev, newActivity]);
  };

  const updateActivity = (index: number, field: keyof DailyActivity, value: string) => {
    setActivities(prev => prev.map((activity, i) => 
      i === index ? { ...activity, [field]: value } : activity
    ));
  };

  const removeActivity = (index: number) => {
    setActivities(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Get customer info - use the passed customerId if available
      const targetCustomerId = propCustomerId ? parseInt(propCustomerId) : (isAdmin ? getCustomerIdFromSite(formData.siteId) : user?.customerId || 21);
      const customerName = isAdmin ? getCustomerNameFromSite(formData.siteId) : user?.username || '';

      const reportData: DailyActivityRequest = {
        customerId: targetCustomerId,
        customerName,
        siteId: formData.siteId,
        siteName: formData.siteName,
        reportDate: format(formData.reportDate, 'yyyy-MM-dd'),
        officerName: formData.officerName,
        shiftStart: '06:00', // Default value
        shiftEnd: '14:00', // Default value
        activities,
        incidents,
        securityChecks,
        visitorLog,
        compliance,
        insecureAreas,
        systemsNotWorking,
        notes: formData.notes,
        weatherConditions: 'Not specified' // Default value
      };

      if (report) {
        await dailyActivityService.updateReport(report.id, { ...reportData, id: report.id });
      } else {
        await dailyActivityService.createReport(reportData);
      }

      onSuccess();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save report');
    } finally {
      setLoading(false);
    }
  };

  const getCustomerNameFromSite = (siteId: string): string => {
    // For now, we'll use a simple mapping since we don't have region data
    // In a real app, this would be based on the site's customer relationship
    const customerNames: Record<string, string> = {
      's1': 'Central England COOP',
      's2': 'Central England COOP', 
      's3': 'Central England COOP',
      's13': 'Heart of England',
      's14': 'Heart of England',
      's15': 'Heart of England',
      's7': 'Midcounties COOP',
      's8': 'Midcounties COOP',
      's9': 'Midcounties COOP'
    };
    
    return customerNames[siteId] || 'Central England COOP';
  };

  const getCustomerIdFromSite = (siteId: string): number => {
    // Map site IDs to customer IDs
    const customerIds: Record<string, number> = {
      's1': 21,
      's2': 21, 
      's3': 21,
      's13': 22,
      's14': 22,
      's15': 22,
      's7': 23,
      's8': 23,
      's9': 23
    };
    
    return customerIds[siteId] || 21;
  };

  const renderYesNoField = (
    label: string,
    value: string,
    description: string,
    onChange: (type: 'value' | 'description', val: string) => void
  ) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-yellow-700">{label}:</Label>
        <div className="flex items-center space-x-4">
          <RadioGroup
            value={value}
            onValueChange={(val) => onChange('value', val)}
            className="flex items-center space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yes" id={`${label}-yes`} />
              <Label htmlFor={`${label}-yes`} className="text-sm">Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id={`${label}-no`} />
              <Label htmlFor={`${label}-no`} className="text-sm">No</Label>
            </div>
          </RadioGroup>
        </div>
      </div>
      {value === 'yes' && (
        <div>
          <Label className="text-sm">If Yes, Please Describe Briefly:</Label>
          <Textarea
            value={description}
            onChange={(e) => onChange('description', e.target.value)}
            className="mt-1"
            rows={2}
          />
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh]">
        <DialogHeader>
          <DialogTitle>
            {report ? 'Edit Daily Activity Report' : 'New Daily Activity Report'}
          </DialogTitle>
          <DialogDescription>
            {report ? 'Update the details of this daily activity report.' : 'Create a new daily activity report for a site.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <ScrollArea className="h-[75vh] pr-4">
            <div className="space-y-6 pb-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Report Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="site">Site</Label>
                    {!isAdmin && propSiteId ? (
                      // Read-only site field for officers when site is pre-selected
                      <div className="flex h-10 w-full rounded-md border border-input bg-gray-50 px-3 py-2 text-sm">
                        {formData.siteName}
                      </div>
                    ) : (
                      <Select value={formData.siteId} onValueChange={handleSiteChange} disabled={!isAdmin && propSiteId ? true : false}>
                        <SelectTrigger>
                          <SelectValue placeholder={siteOptions.length === 0 ? "No sites available for this customer" : "Select site"} />
                        </SelectTrigger>
                        <SelectContent>
                          {siteOptions.length === 0 ? (
                            <SelectItem key="no-sites" value="no-sites" disabled>
                              No sites available for this customer
                            </SelectItem>
                          ) : (
                            siteOptions.map((site) => (
                              <SelectItem key={site.id} value={site.id}>
                                {site.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="officerName">Officer Name</Label>
                    <Input
                      id="officerName"
                      value={formData.officerName}
                      onChange={(e) => setFormData(prev => ({ ...prev, officerName: e.target.value }))}
                      required
                    />
                  </div>

                  <div>
                    <Label>Date Of Report</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.reportDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.reportDate ? format(formData.reportDate, "dd/MM/yyyy") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.reportDate}
                          onSelect={(date) => date && setFormData(prev => ({ ...prev, reportDate: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>


                </CardContent>
              </Card>

              {/* Compliance Section */}
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-lg text-yellow-600">
                    Compliance (Please select Yes or No)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderYesNoField(
                    "Tills contained over £150 of cash (5 x £10 and 10 x £5)",
                    compliance.tillsContainedOverCash.value,
                    compliance.tillsContainedOverCash.description,
                    (type, val) => handleComplianceChange('tillsContainedOverCash', type, val)
                  )}
                  
                  {renderYesNoField(
                    "Cash Office Door Open",
                    compliance.cashOfficeDoorOpen.value,
                    compliance.cashOfficeDoorOpen.description,
                    (type, val) => handleComplianceChange('cashOfficeDoorOpen', type, val)
                  )}
                  
                  {renderYesNoField(
                    "Visible Cash On Display",
                    compliance.visibleCashOnDisplay.value,
                    compliance.visibleCashOnDisplay.description,
                    (type, val) => handleComplianceChange('visibleCashOnDisplay', type, val)
                  )}
                  
                  {renderYesNoField(
                    "Visible Keys On Display",
                    compliance.visibleKeysOnDisplay.value,
                    compliance.visibleKeysOnDisplay.description,
                    (type, val) => handleComplianceChange('visibleKeysOnDisplay', type, val)
                  )}
                  
                  {renderYesNoField(
                    "Fire Routes Blocked",
                    compliance.fireRoutesBlocked.value,
                    compliance.fireRoutesBlocked.description,
                    (type, val) => handleComplianceChange('fireRoutesBlocked', type, val)
                  )}
                  
                  {renderYesNoField(
                    "Be Safe Be Secure Poster",
                    compliance.beSafeBSecurePoster.value,
                    compliance.beSafeBSecurePoster.description,
                    (type, val) => handleComplianceChange('beSafeBSecurePoster', type, val)
                  )}
                  
                  {renderYesNoField(
                    "ATM Abuse",
                    compliance.atmAbuse.value,
                    compliance.atmAbuse.description,
                    (type, val) => handleComplianceChange('atmAbuse', type, val)
                  )}
                </CardContent>
              </Card>

              {/* Insecure Areas Section */}
              <Card className="bg-yellow-50">
                <CardHeader>
                  <CardTitle className="text-lg text-yellow-600">
                    Insecure Areas (Please select Yes or No)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderYesNoField(
                    "Kiosk Secure",
                    insecureAreas.kioskSecure.value,
                    insecureAreas.kioskSecure.description,
                    (type, val) => handleInsecureAreaChange('kioskSecure', type, val)
                  )}
                  
                  {renderYesNoField(
                    "High Value Room",
                    insecureAreas.highValueRoom.value,
                    insecureAreas.highValueRoom.description,
                    (type, val) => handleInsecureAreaChange('highValueRoom', type, val)
                  )}
                  
                  {renderYesNoField(
                    "Managers Office",
                    insecureAreas.managersOffice.value,
                    insecureAreas.managersOffice.description,
                    (type, val) => handleInsecureAreaChange('managersOffice', type, val)
                  )}
                  
                  {renderYesNoField(
                    "Warehouse To Sales Floor",
                    insecureAreas.warehouseToSalesFloor.value,
                    insecureAreas.warehouseToSalesFloor.description,
                    (type, val) => handleInsecureAreaChange('warehouseToSalesFloor', type, val)
                  )}
                  
                  {renderYesNoField(
                    "Service Yard",
                    insecureAreas.serviceYard.value,
                    insecureAreas.serviceYard.description,
                    (type, val) => handleInsecureAreaChange('serviceYard', type, val)
                  )}
                  
                  {renderYesNoField(
                    "Car Park / Grounds",
                    insecureAreas.carParkGrounds.value,
                    insecureAreas.carParkGrounds.description,
                    (type, val) => handleInsecureAreaChange('carParkGrounds', type, val)
                  )}
                  
                  {renderYesNoField(
                    "Fire Doors (Back of House)",
                    insecureAreas.fireDoorsBackOfHouse.value,
                    insecureAreas.fireDoorsBackOfHouse.description,
                    (type, val) => handleInsecureAreaChange('fireDoorsBackOfHouse', type, val)
                  )}
                  
                  {renderYesNoField(
                    "Fire Doors (Shop Floor)",
                    insecureAreas.fireDoorsShopFloor.value,
                    insecureAreas.fireDoorsShopFloor.description,
                    (type, val) => handleInsecureAreaChange('fireDoorsShopFloor', type, val)
                  )}
                </CardContent>
              </Card>

              {/* Systems Not Working Section */}
              <Card className="bg-red-50 border-2 border-red-300">
                <CardHeader>
                  <CardTitle className="text-lg text-red-600">
                    Systems Not Working (Please select Yes or No)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {renderYesNoField(
                    "Watch Me Now",
                    systemsNotWorking.watchMeNow.value,
                    systemsNotWorking.watchMeNow.description,
                    (type, val) => handleSystemChange('watchMeNow', type, val)
                  )}
                  
                  {renderYesNoField(
                    "CCTV",
                    systemsNotWorking.cctv.value,
                    systemsNotWorking.cctv.description,
                    (type, val) => handleSystemChange('cctv', type, val)
                  )}
                  
                  {renderYesNoField(
                    "Intruder Alarm",
                    systemsNotWorking.intruderAlarm.value,
                    systemsNotWorking.intruderAlarm.description,
                    (type, val) => handleSystemChange('intruderAlarm', type, val)
                  )}
                  
                  {renderYesNoField(
                    "Keyholding",
                    systemsNotWorking.keyholding.value,
                    systemsNotWorking.keyholding.description,
                    (type, val) => handleSystemChange('keyholding', type, val)
                  )}
                  
                  {renderYesNoField(
                    "Body Worn CCTV",
                    systemsNotWorking.bodyWornCctv.value,
                    systemsNotWorking.bodyWornCctv.description,
                    (type, val) => handleSystemChange('bodyWornCctv', type, val)
                  )}
                  
                  {renderYesNoField(
                    "Cigarette Tracker",
                    systemsNotWorking.cigaretteTracker.value,
                    systemsNotWorking.cigaretteTracker.description,
                    (type, val) => handleSystemChange('cigaretteTracker', type, val)
                  )}
                  
                  {renderYesNoField(
                    "Crime Reporting",
                    systemsNotWorking.crimeReporting.value,
                    systemsNotWorking.crimeReporting.description,
                    (type, val) => handleSystemChange('crimeReporting', type, val)
                  )}
                </CardContent>
              </Card>

              {/* Shift Completion Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-yellow-600">Shift Completion Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Add any additional notes about the shift..."
                    rows={4}
                    className="w-full"
                  />
                </CardContent>
              </Card>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-600">{error}</p>
                </div>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || sites.length === 0 || !formData.siteId || formData.siteId === "no-sites"}
            >
              {loading ? 'Saving...' : report ? 'Update Report' : 'Create Report'}
            </Button>
            {sites.length === 0 && (
              <p className="text-sm text-red-600 mt-2">
                Cannot create report: No sites are available for this customer. Please contact administrator to add sites first.
              </p>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 