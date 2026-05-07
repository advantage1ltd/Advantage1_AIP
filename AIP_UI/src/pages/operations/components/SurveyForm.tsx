import React, { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { RATING_SCALE, CustomerSurvey } from './types';
import { Minus, Plus, Map, Building, User, Award, Star, Smile, UserCheck, Shield, Users, Clock, Zap, ClipboardList } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type RatingFields = {
  uniformAndAppearance: number;
  professionalism: number;
  customerServiceApproach: number;
  improvedFeelingOfSecurityWhenOfficerOnSite: number;
  relationsWithStoreColleagues: number;
  punctualityBreaks: number;
  proactivity: number;
};

const formSchema = z.object({
  officerName: z.string().min(2, 'Officer name is required'),
  date: z.string(),
  customer: z.string(),
  region: z.string(),
  siteName: z.string(),
  ratings: z.object({
    uniformAndAppearance: z.number().min(1).max(10),
    professionalism: z.number().min(1).max(10),
    customerServiceApproach: z.number().min(1).max(10),
    improvedFeelingOfSecurityWhenOfficerOnSite: z.number().min(1).max(10),
    relationsWithStoreColleagues: z.number().min(1).max(10),
    punctualityBreaks: z.number().min(1).max(10),
    proactivity: z.number().min(1).max(10)
  }),
  storeManagerName: z.string().min(2, 'Store manager name is required'),
  areaManagerName: z.string().min(2, 'Area manager name is required'),
  followUpActions: z.array(z.string()).min(1, 'At least one follow-up action is required'),
  datesToBeCompleted: z.array(z.string()).min(1, 'At least one completion date is required')
});

interface SurveyFormProps {
  onSubmit: (data: CustomerSurvey) => void;
  onCancel: () => void;
  initialData?: CustomerSurvey | null;
  customerId?: string;
  siteId?: string;
  customers?: Array<{ id: string; name: string }>;
  regions?: Array<{ id: string; name: string; customerId: string }>;
  sites?: Array<{ id: string; name: string; customerId: string; regionId: string }>;
}

// Form section wrapper for consistent styling
const FormSection = ({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) => (
  <div className="bg-white dark:bg-gray-800 p-2 sm:p-3 md:p-4 lg:p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm mb-3 md:mb-4 lg:mb-6 overflow-hidden max-w-full">
    <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 md:mb-3 flex items-center gap-1.5 md:gap-2">
      {icon && <span className="text-primary">{icon}</span>}
      {title}
    </h3>
    {children}
  </div>
);

// Rating icon mapping for different categories
const getRatingIcon = (name: keyof RatingFields) => {
  const iconMap = {
    uniformAndAppearance: <Award className="h-3.5 w-3.5" />,
    professionalism: <Star className="h-3.5 w-3.5" />,
    customerServiceApproach: <Smile className="h-3.5 w-3.5" />,
    improvedFeelingOfSecurityWhenOfficerOnSite: <Shield className="h-3.5 w-3.5" />,
    relationsWithStoreColleagues: <Users className="h-3.5 w-3.5" />,
    punctualityBreaks: <Clock className="h-3.5 w-3.5" />,
    proactivity: <Zap className="h-3.5 w-3.5" />
  };
  return iconMap[name] || <Star className="h-3.5 w-3.5" />;
};

// Component for optimized mobile rating display - horizontal layout
const MobileRatingScale = ({ 
  value, 
  onChange,
  name
}: { 
  value: string; 
  onChange: (value: string) => void;
  name: string;
}) => (
  <div className="flex items-center gap-1 mt-1">
    <div className="grid grid-cols-5 gap-1 w-full">
      {[1, 2, 3, 4, 5].map((score) => (
        <div 
          key={score} 
          className={`flex justify-center items-center h-6 rounded-md text-[10px] font-medium cursor-pointer ${
            parseInt(value) === score 
              ? 'bg-primary/20 text-primary border border-primary' 
              : 'bg-gray-100 text-gray-700 border border-gray-200'
          }`}
          onClick={() => onChange(score.toString())}
        >
          {score}
        </div>
      ))}
    </div>
    <div className="grid grid-cols-5 gap-1 w-full">
      {[6, 7, 8, 9, 10].map((score) => (
        <div 
          key={score} 
          className={`flex justify-center items-center h-6 rounded-md text-[10px] font-medium cursor-pointer ${
            parseInt(value) === score 
              ? 'bg-primary/20 text-primary border border-primary' 
              : 'bg-gray-100 text-gray-700 border border-gray-200'
          }`}
          onClick={() => onChange(score.toString())}
        >
          {score}
        </div>
      ))}
    </div>
  </div>
);

export const SurveyForm: React.FC<SurveyFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  customerId,
  siteId,
  customers: propCustomers = [],
  regions: propRegions = [],
  sites: propSites = []
}) => {
  const { user } = useAuth();
  
  // Initialize default form values
  const defaultValues = {
    officerName: initialData?.officerName || '',
    date: initialData?.date || format(new Date(), 'yyyy-MM-dd'),
    customer: initialData?.customer || '',
    region: initialData?.region || '',
    location: initialData?.siteName || initialData?.location || '',
    ratings: initialData?.ratings || {
      uniformAndAppearance: 5,
      professionalism: 5,
      customerServiceApproach: 5,
      improvedFeelingOfSecurityWhenOfficerOnSite: 5,
      relationsWithStoreColleagues: 5,
      punctualityBreaks: 5,
      proactivity: 5
    },
    storeManagerName: initialData?.storeManagerName || '',
    areaManagerName: initialData?.areaManagerName || '',
    followUpActions: initialData?.followUpActions || [''],
    datesToBeCompleted: initialData?.datesToBeCompleted || ['']
  };
  
  const form = useForm({
    defaultValues
  });
  
  const [formData, setFormData] = useState<Omit<CustomerSurvey, 'id'>>(defaultValues);

  // Use prop data or fallback to empty arrays
  const customers = propCustomers.length > 0 ? propCustomers : [];
  const regions = propRegions.length > 0 ? propRegions : [];
  const sites = propSites.length > 0 ? propSites : [];

  // Get filtered regions based on selected customer (memoized)
  const filteredRegions = useMemo(() => {
    const selectedCustomer = customers.find(c => c.name === formData.customer);
    if (!selectedCustomer) return [];
    return regions.filter(r => r.customerId === selectedCustomer.id);
  }, [customers, regions, formData.customer]);

  // Get filtered sites based on selected customer and region (memoized)
  const filteredSites = useMemo(() => {
    const selectedCustomer = customers.find(c => c.name === formData.customer);
    if (!selectedCustomer) {
      console.log('🔍 [getFilteredSites] No customer selected');
      return [];
    }
    
    const customerSites = sites.filter(s => s.customerId === selectedCustomer.id);
    
    console.log('🔍 [getFilteredSites] Customer sites:', {
      selectedCustomer: selectedCustomer.name,
      selectedCustomerId: selectedCustomer.id,
      customerSitesCount: customerSites.length,
      allSitesCount: sites.length,
      formDataRegion: formData.region,
      customerSites: customerSites.map(s => ({ name: s.name, regionId: s.regionId, customerId: s.customerId }))
    });
    
    // If no region is selected, return all customer sites
    if (!formData.region) {
      console.log('🔍 [getFilteredSites] No region selected, returning all customer sites');
      return customerSites;
    }
    
    const selectedRegion = filteredRegions.find(r => r.name === formData.region);
    if (!selectedRegion) {
      console.log('🔍 [getFilteredSites] Region not found:', {
        searchedRegion: formData.region,
        availableRegions: filteredRegions.map(r => ({ id: r.id, name: r.name, customerId: r.customerId })),
        allRegions: regions.map(r => ({ id: r.id, name: r.name, customerId: r.customerId }))
      });
      return customerSites;
    }
    
    console.log('🔍 [getFilteredSites] Selected region:', {
      regionName: selectedRegion.name,
      regionId: selectedRegion.id,
      regionCustomerId: selectedRegion.customerId
    });
    
    // Debug: Show all site regionIds before filtering
    console.log('🔍 [getFilteredSites] All customer sites with regionIds:', 
      customerSites.map(s => ({
        siteName: s.name,
        siteRegionId: s.regionId,
        siteRegionIdType: typeof s.regionId,
        selectedRegionId: selectedRegion.id,
        selectedRegionIdType: typeof selectedRegion.id,
        willMatch: String(s.regionId || '') === String(selectedRegion.id || '')
      }))
    );
    
    const filtered = customerSites.filter(s => {
      // Compare both as strings to ensure type matching
      const siteRegionId = String(s.regionId || '').trim();
      const selectedRegionId = String(selectedRegion.id || '').trim();
      const matches = siteRegionId === selectedRegionId;
      
      if (!matches && s.regionId) {
        console.log('❌ [getFilteredSites] Site does NOT match:', {
          siteName: s.name,
          siteRegionId,
          selectedRegionId,
          siteRegionIdRaw: s.regionId,
          selectedRegionIdRaw: selectedRegion.id
        });
      }
      
      return matches;
    });
    
    console.log('🔍 [getFilteredSites] Final filtered sites:', {
      selectedRegion: selectedRegion.name,
      selectedRegionId: selectedRegion.id,
      filteredSitesCount: filtered.length,
      filteredSites: filtered.map(s => ({ name: s.name, regionId: s.regionId }))
    });
    
    return filtered;
  }, [customers, sites, filteredRegions, formData.customer, formData.region]);

  // Helper functions to get names from IDs for auto-fill
  const getCustomerNameFromId = (customerId: string): string => {
    const customer = customers.find(c => c.id === customerId);
    console.log('🔍 Customer lookup:', { customerId, found: customer, allCustomers: customers });
    return customer?.name || '';
  };

  const getSiteNameFromId = (siteId: string): string => {
    const site = sites.find(s => s.id === siteId);
    console.log('🔍 Site lookup:', { siteId, found: site, allSites: sites });
    return site?.name || '';
  };

  const getRegionNameFromSiteId = (siteId: string): string => {
    const site = sites.find(s => s.id === siteId);
    if (!site) {
      console.log('❌ Region lookup: Site not found for', siteId);
      return '';
    }
    const region = regions.find(r => r.id === site.regionId);
    console.log('🔍 Region lookup:', { siteId, site, regionId: site.regionId, found: region, allRegions: regions });
    return region?.name || '';
  };

  const [showSecondAction, setShowSecondAction] = useState(
    initialData?.followUpActions?.length > 1 || false
  );
  const [showThirdAction, setShowThirdAction] = useState(
    initialData?.followUpActions?.length > 2 || false
  );

  // Auto-fill form fields when props are provided (for new surveys)
  useEffect(() => {
    if (!initialData && customerId && siteId) {
      const customerName = getCustomerNameFromId(customerId);
      const siteName = getSiteNameFromId(siteId);
      const regionName = getRegionNameFromSiteId(siteId);
      
      console.log('🔍 [SurveyForm] Auto-fill debug:', { 
        customerId, 
        siteId, 
        customerName, 
        siteName, 
        regionName,
        allCustomers: customers,
        allSites: sites,
        allRegions: regions
      });
      
      if (customerName && siteName) {
        setFormData(prev => ({
          ...prev,
          customer: customerName,
          region: regionName,
          location: siteName // Will be mapped to siteName in service
        }));
      }
    }
    
    // Auto-fill officer information from current user
    if (!initialData && user) {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      if (fullName) {
        setFormData(prev => ({
          ...prev,
          officerName: fullName
        }));
      }
    }
  }, [customerId, siteId, user, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Filter out empty follow-up actions
    const filteredActions = formData.followUpActions.filter(action => action.trim() !== '');
    const filteredDates = formData.datesToBeCompleted.filter(date => date.trim() !== '');
    
    onSubmit({
      ...formData,
      followUpActions: filteredActions,
      datesToBeCompleted: filteredDates,
      id: initialData?.id || '' // This will be handled by the API for new surveys
    });
  };

  const handleRatingChange = (field: keyof typeof formData.ratings, value: string) => {
    setFormData(prev => ({
      ...prev,
      ratings: {
        ...prev.ratings,
        [field]: Number(value)
      }
    }));
  };

  const handleFollowUpActionChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      followUpActions: prev.followUpActions.map((action, i) => 
        i === index ? value : action
      )
    }));
  };

  const handleDateToCompleteChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      datesToBeCompleted: prev.datesToBeCompleted.map((date, i) => 
        i === index ? value : date
      )
    }));
  };

  const addSecondAction = () => {
    setShowSecondAction(true);
    setFormData(prev => ({
      ...prev,
      followUpActions: [...prev.followUpActions, ''],
      datesToBeCompleted: [...prev.datesToBeCompleted, '']
    }));
  };

  const addThirdAction = () => {
    setShowThirdAction(true);
    setFormData(prev => ({
      ...prev,
      followUpActions: [...prev.followUpActions, ''],
      datesToBeCompleted: [...prev.datesToBeCompleted, '']
    }));
  };

  const renderRatingField = (name: keyof RatingFields, label: string) => (
    <div className="flex flex-col">
      <Label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
        <div className="flex items-center gap-1">
          {getRatingIcon(name)}
          <span>{label}</span>
        </div>
      </Label>
      <MobileRatingScale
        value={formData.ratings[name].toString()}
        onChange={(value) => handleRatingChange(name, value)}
        name={name}
      />
    </div>
  );

  const renderFollowUpActionField = (index: number, label: string) => (
    <div className="space-y-2">
      <FormField
        control={form.control}
        name={`followUpActions.${index}`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {label}
            </FormLabel>
            <FormControl>
              <Input 
                {...field}
                placeholder="Enter follow-up action"
                className="h-8 md:h-9 text-xs md:text-sm"
                value={formData.followUpActions[index] ?? ''}
                onChange={(e) => {
                  field.onChange(e);
                  handleFollowUpActionChange(index, e.target.value);
                }}
              />
            </FormControl>
            <FormMessage className="text-[10px]" />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`datesToBeCompleted.${index}`}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Completion Date
            </FormLabel>
            <FormControl>
              <Input 
                {...field}
                type="date"
                className="h-8 md:h-9 text-xs md:text-sm"
                value={formData.datesToBeCompleted[index] ?? ''}
                onChange={(e) => {
                  field.onChange(e);
                  handleDateToCompleteChange(index, e.target.value);
                }}
              />
            </FormControl>
            <FormMessage className="text-[10px]" />
          </FormItem>
        )}
      />
    </div>
  );

  return (
    <div className="w-full max-w-full overflow-hidden min-w-[320px]">
      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Section */}
          <FormSection title="Basic Information" icon={<User className="h-4 w-4 md:h-5 md:w-5" />}>
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 md:gap-4">
              <FormField
                control={form.control}
                name="officerName"
                render={({ field }) => (
                  <FormItem className="col-span-2 xs:col-span-1">
                    <FormLabel className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>Officer Name</span>
                      </div>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        className="h-8 md:h-9 text-xs md:text-sm"
                        placeholder="Enter officer name"
                        value={formData.officerName}
                        onChange={(e) => setFormData(prev => ({ ...prev, officerName: e.target.value }))}
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="col-span-2 xs:col-span-1">
                    <FormLabel className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        <span>Survey Date</span>
                      </div>
                    </FormLabel>
                    <FormControl>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.date ? format(new Date(formData.date), "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.date ? new Date(formData.date) : undefined}
                            onSelect={(date) => {
                              if (date instanceof Date) {
                                setFormData(prev => ({
                                  ...prev,
                                  date: format(date, 'yyyy-MM-dd')
                                }));
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customer"
                render={({ field }) => (
                  <FormItem className="col-span-2 xs:col-span-1">
                    <FormLabel className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        <span>Customer</span>
                      </div>
                    </FormLabel>
                    <Select 
                      value={formData.customer} 
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        customer: value,
                        region: '', // Reset region when customer changes
                        location: '' // Reset location when customer changes
                      }))}
                      disabled={!!(customerId && siteId && user?.role !== 'administrator')}
                    >
                      <FormControl>
                        <SelectTrigger className="h-8 md:h-9 text-xs md:text-sm">
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.name} className="text-xs md:text-sm">
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem className="col-span-2 xs:col-span-1">
                    <FormLabel className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-1">
                        <Map className="h-3 w-3" />
                        <span>Region</span>
                      </div>
                    </FormLabel>
                    <Select 
                      value={formData.region} 
                      onValueChange={(value) => {
                        console.log('🔍 [Region Change]', { value, formData });
                        setFormData(prev => ({ 
                          ...prev, 
                          region: value,
                          location: '' // Reset location when region changes
                        }));
                      }}
                      disabled={!formData.customer || !!(customerId && siteId && user?.role !== 'Administrator')}
                    >
                      <FormControl>
                        <SelectTrigger className="h-8 md:h-9 text-xs md:text-sm">
                          <SelectValue placeholder={!formData.customer ? "Select customer first" : "Select region"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredRegions.map((region) => (
                          <SelectItem key={region.id} value={region.name} className="text-xs md:text-sm">
                            {region.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        <span>Site Name</span>
                      </div>
                    </FormLabel>
                    <Select 
                      key={`site-select-${formData.region}-${filteredSites.length}`}
                      value={formData.location} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
                      disabled={!formData.customer || !!(customerId && siteId && user?.role !== 'Administrator')}
                    >
                      <FormControl>
                        <SelectTrigger className="h-8 md:h-9 text-xs md:text-sm">
                          <SelectValue placeholder={!formData.customer ? "Select customer first" : !formData.region ? "Select region first" : filteredSites.length === 0 ? "No sites available" : "Select site"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredSites.length > 0 ? (
                          filteredSites.map((site) => (
                            <SelectItem key={site.id} value={site.name} className="text-xs md:text-sm">
                              {site.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-1.5 text-xs text-gray-500">No sites available for selected region</div>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
            </div>
          </FormSection>

          {/* Performance Ratings Section */}
          <FormSection title="Performance Ratings" icon={<Star className="h-4 w-4 md:h-5 md:w-5" />}>
            <div className="space-y-2 sm:grid sm:grid-cols-2 sm:gap-3 md:gap-4 sm:space-y-0">
              {renderRatingField('uniformAndAppearance', 'Uniform & Appearance')}
              {renderRatingField('professionalism', 'Professionalism')}
              {renderRatingField('customerServiceApproach', 'Customer Service Approach')}
              {renderRatingField('improvedFeelingOfSecurityWhenOfficerOnSite', 'Improved Feeling of Security When Officer on Site')}
              {renderRatingField('relationsWithStoreColleagues', 'Relations with Store Colleagues')}
              {renderRatingField('punctualityBreaks', 'Punctuality & Breaks')}
              {renderRatingField('proactivity', 'Proactivity')}
            </div>
          </FormSection>

          {/* Management Information Section */}
          <FormSection title="Management Information" icon={<Users className="h-4 w-4 md:h-5 md:w-5" />}>
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 md:gap-4">
              <FormField
                control={form.control}
                name="storeManagerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>Store Manager</span>
                      </div>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Enter store manager name"
                        className="h-8 md:h-9 text-xs md:text-sm"
                        value={formData.storeManagerName}
                        onChange={(e) => setFormData(prev => ({ ...prev, storeManagerName: e.target.value }))}
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="areaManagerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-1">
                        <Award className="h-3 w-3" />
                        <span>Area Manager</span>
                      </div>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Enter area manager name"
                        className="h-8 md:h-9 text-xs md:text-sm"
                        value={formData.areaManagerName || ''}
                        onChange={(e) => {
                          field.onChange(e);
                          setFormData(prev => ({ ...prev, areaManagerName: e.target.value }));
                        }}
                      />
                    </FormControl>
                    <FormMessage className="text-[10px]" />
                  </FormItem>
                )}
              />
            </div>
          </FormSection>

          {/* Follow-up Actions Section */}
          <FormSection title="Follow-up Actions" icon={<ClipboardList className="h-4 w-4 md:h-5 md:w-5" />}>
            <div className="space-y-4">
              {/* First (required) follow-up action */}
              {renderFollowUpActionField(0, "Primary Follow-up Action")}

              {/* Second follow-up action (optional) */}
              {showSecondAction && renderFollowUpActionField(1, "Secondary Follow-up Action")}

              {/* Third follow-up action (optional) */}
              {showThirdAction && renderFollowUpActionField(2, "Additional Follow-up Action")}

              {/* Action buttons */}
              <div className="flex gap-2 mt-4">
                {!showSecondAction && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowSecondAction(true);
                      form.setValue('followUpActions.1', '');
                      form.setValue('datesToBeCompleted.1', '');
                    }}
                    className="text-xs h-8"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Second Action
                  </Button>
                )}
                {showSecondAction && !showThirdAction && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowThirdAction(true);
                      form.setValue('followUpActions.2', '');
                      form.setValue('datesToBeCompleted.2', '');
                    }}
                    className="text-xs h-8"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Third Action
                  </Button>
                )}
              </div>
            </div>
          </FormSection>

          {/* Submit/Cancel Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel} className="h-8 md:h-9 text-xs md:text-sm">
              Cancel
            </Button>
            <Button type="submit" className="h-8 md:h-9 text-xs md:text-sm">
              {initialData ? 'Update Survey' : 'Submit Survey'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}; 