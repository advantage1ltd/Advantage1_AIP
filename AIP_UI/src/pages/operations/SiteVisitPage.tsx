import * as React from "react";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { MoreHorizontal, Plus, Pencil, Trash2, Search, X } from "lucide-react";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { SiteVisit } from "@/types/siteVisit";
import { toast } from 'react-toastify';
import { siteVisitService } from '@/services/siteVisitService'
import { useCustomerSelection } from "@/contexts/CustomerSelectionContext";
import { customerService } from '@/services/customerService';
import { regionService } from '@/services/regionService';
import { siteService } from '@/services/siteService';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import {
  FileText,
  CheckCircle,
  AlertTriangle,
  Users,
  Building2,
  MapPin,
  Calendar,
  User,
  CreditCard,
  FileCheck,
  Shirt,
  ClipboardCheck,
  MessageSquare,
  UserCircle,
  Award,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

// Types for dropdown options
interface DropdownOption {
  id: string;
  name: string;
  customerId?: string | number;
  regionId?: string | number;
}

const ratingOptions = [
  { value: "Good", label: "Good" },
  { value: "Fair", label: "Fair" },
  { value: "Poor", label: "Poor" },
];

const documentationOptions = [
  { value: "Good", label: "Good" },
  { value: "Acceptable", label: "Acceptable" },
  { value: "Training/Improvement Required", label: "Training/Improvement Required" },
];

// Add formatDate helper
const formatDate = (date: Date) => {
  return date.toISOString().split('T')[0];
};

// Form validation schema
const formSchema = z.object({
  actionId: z.string().optional(),
  siteVisitId: z.string().optional(),
  customer: z.string({
    required_error: "Please select a customer",
  }).min(1, "Please select a customer"),
  region: z.string({
    required_error: "Please select a region",
  }).min(1, "Please select a region"),
  location: z.string({
    required_error: "Please select a location",
  }).min(1, "Please select a location"),
  visitType: z.string({
    required_error: "Please select visit type",
  }),
  officerName: z.string({
    required_error: "Please enter officer name",
  }).min(1, "Officer name is required"),
  idBadgeExpiry: z.string({
    required_error: "Please enter ID badge expiry",
  }),
  siaLicenceNumber: z.string({
    required_error: "Please enter SIA licence number",
  }).min(1, "SIA licence number is required"),
  siaLicenceExpiry: z.string().optional(),
  recordOfIncidentsCompletion: z.string().optional(),
  dailyOccurrenceBookCompletion: z.string().optional(),
  pocketBookCompletion: z.string().optional(),
  ecrCompletion: z.string().optional(),
  top20Lines: z.string().optional(),
  assignmentInstructions: z.string().optional(),
  assignmentInstructionsUnderstood: z.string().optional(),
  healthAndSafetyUnderstood: z.string().optional(),
  dateHSRiskAssessment: z.string().optional(),
  jumper: z.string().optional(),
  shirt: z.string().optional(),
  tie: z.string().optional(),
  hiVisJacket: z.string().optional(),
  jacket: z.string().optional(),
  trousers: z.string().optional(),
  epaulettes: z.string().optional(),
  shoes: z.string().optional(),
  trainingInstructions: z.string().optional(),
  securityOfficerSign: z.string().optional(),
  managerName: z.string({
    required_error: "Please enter manager name",
  }).min(1, "Manager name is required"),
  followUpAction: z.string().optional(),
  date: z.string({
    required_error: "Please select a date",
  }),
  assignmentInstructionsInPlace: z.string().optional(),
  assignmentInstructionsDate: z.string().optional(),
  healthAndSafetyInPlace: z.string().optional(),
  trainingInstructionsGivenDate: z.string().optional(),
  followUpActionDate: z.string().optional(),
  recommendations: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface SiteVisitPageProps {
  customerId?: string;
  siteId?: string;
}

export default function SiteVisitPage({ customerId, siteId }: SiteVisitPageProps) {
  const { selectedCustomerId } = useCustomerSelection();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [visits, setVisits] = useState<SiteVisit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [searchQuery, setSearchQuery] = useState("");
  const [editingVisit, setEditingVisit] = useState<SiteVisit | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Resolve customer ID from prop or context
  const resolvedCustomerId = customerId ? parseInt(customerId, 10) : selectedCustomerId;

  // State for dropdown options
  const [customers, setCustomers] = useState<DropdownOption[]>([]);
  const [regions, setRegions] = useState<DropdownOption[]>([]);
  const [locations, setLocations] = useState<DropdownOption[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [isLoadingRegions, setIsLoadingRegions] = useState(false);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);

  // Initialize form before useEffect hooks that use it
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      actionId: `ACT-${Date.now()}`,
      siteVisitId: `SV-${Date.now()}`,
      customer: "",
      region: "",
      location: "",
      visitType: "",
      officerName: "",
      idBadgeExpiry: "",
      siaLicenceNumber: "",
      siaLicenceExpiry: "",
      recordOfIncidentsCompletion: "",
      dailyOccurrenceBookCompletion: "",
      pocketBookCompletion: "",
      ecrCompletion: "",
      top20Lines: "",
      assignmentInstructions: "",
      assignmentInstructionsUnderstood: "",
      healthAndSafetyUnderstood: "",
      dateHSRiskAssessment: "",
      jumper: "",
      shirt: "",
      tie: "",
      hiVisJacket: "",
      jacket: "",
      trousers: "",
      epaulettes: "",
      shoes: "",
      trainingInstructions: "",
      securityOfficerSign: "",
      managerName: "",
      followUpAction: "",
      date: formatDate(new Date()),
      assignmentInstructionsInPlace: "",
      assignmentInstructionsDate: "",
      healthAndSafetyInPlace: "",
      trainingInstructionsGivenDate: "",
      followUpActionDate: "",
      recommendations: "",
    },
  });

  // Fetch customers on mount
  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoadingCustomers(true);
      try {
        const customersData = await customerService.getAllCustomers();
        const mappedCustomers = customersData.map(c => ({
          id: c.id.toString(),
          name: c.companyName,
          customerId: c.id
        }));
        setCustomers(mappedCustomers);
        
        // Pre-populate customer if resolvedCustomerId is available
        if (resolvedCustomerId) {
          const matchingCustomer = mappedCustomers.find(c => 
            c.customerId === resolvedCustomerId
          );
          if (matchingCustomer && !form.getValues().customer) {
            form.setValue('customer', matchingCustomer.id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch customers:', error);
        toast.error('Failed to load customers');
      } finally {
        setIsLoadingCustomers(false);
      }
    };
    fetchCustomers();
  }, [resolvedCustomerId, form]);

  // Fetch regions when customer changes in form
  useEffect(() => {
    const selectedCustomerCode = form.watch('customer');
    const selectedCustomer = customers.find(c => c.id === selectedCustomerCode);
    
    if (!selectedCustomer || !selectedCustomer.customerId) {
      setRegions([]);
      setLocations([]);
      form.setValue('region', '');
      form.setValue('location', '');
      return;
    }

    const fetchRegions = async () => {
      setIsLoadingRegions(true);
      try {
        const customerIdNum = typeof selectedCustomer.customerId === 'string' 
          ? parseInt(selectedCustomer.customerId, 10) 
          : selectedCustomer.customerId;
        
        const response = await regionService.getRegionsByCustomer(customerIdNum);
        if (response.success) {
          const mappedRegions = response.data.map((r: any) => ({
            id: (r.regionID ?? r.regionId ?? r.id)?.toString() || '',
            name: (r.regionName ?? r.name) || '',
            customerId: customerIdNum
          })).filter((r: DropdownOption) => r.id && r.name);
          setRegions(mappedRegions);
        }
      } catch (error) {
        console.error('Failed to fetch regions:', error);
        toast.error('Failed to load regions');
        setRegions([]);
      } finally {
        setIsLoadingRegions(false);
      }
    };

    fetchRegions();
  }, [form.watch('customer'), customers]);

  // Fetch locations (sites) when customer changes in form
  useEffect(() => {
    const selectedCustomerCode = form.watch('customer');
    const selectedCustomer = customers.find(c => c.id === selectedCustomerCode);
    
    if (!selectedCustomer || !selectedCustomer.customerId) {
      setLocations([]);
      form.setValue('location', '');
      return;
    }

    const fetchLocations = async () => {
      setIsLoadingLocations(true);
      try {
        const customerIdNum = typeof selectedCustomer.customerId === 'string' 
          ? parseInt(selectedCustomer.customerId, 10) 
          : selectedCustomer.customerId;
        
        const response = await siteService.getSitesByCustomer(customerIdNum);
        if (response.success) {
          const mappedLocations = response.data.map((s: any) => ({
            id: (s.siteID ?? s.siteId ?? s.id)?.toString() || '',
            name: (s.locationName ?? s.name) || '',
            customerId: customerIdNum,
            regionId: (s.fkRegionID ?? s.fkRegionId ?? s.regionId)?.toString()
          })).filter((s: DropdownOption) => s.id && s.name);
          
          // Filter by region if selected
          const selectedRegionCode = form.watch('region');
          if (selectedRegionCode) {
            const filteredLocations = mappedLocations.filter((l: DropdownOption) => 
              l.regionId === selectedRegionCode
            );
            setLocations(filteredLocations);
          } else {
            setLocations(mappedLocations);
          }
        }
      } catch (error) {
        console.error('Failed to fetch locations:', error);
        toast.error('Failed to load locations');
        setLocations([]);
      } finally {
        setIsLoadingLocations(false);
      }
    };

    fetchLocations();
  }, [form.watch('customer'), form.watch('region'), customers]);

  // Load initial data
  useEffect(() => {
    const loadVisits = async () => {
      try {
        setIsLoading(true);
        console.log('🔍 [SiteVisitPage] Loading visits with filters:', { customerId, siteId, currentPage, searchQuery });
        
        if (!resolvedCustomerId) {
          throw new Error('Customer ID is required');
        }

        const params: any = {
          page: currentPage,
          pageSize: itemsPerPage,
          search: searchQuery,
          customerId: resolvedCustomerId
        };
        
        // Add site filter if provided
        if (siteId) params.siteId = siteId;
        
        const response = await siteVisitService.getSiteVisits(params);
        console.log('📤 [SiteVisitPage] Site visits response:', response);
        setVisits(response.data);
        setTotalPages(response.totalPages);
        setTotalCount(response.total);
      } catch (error) {
        console.error('❌ [SiteVisitPage] Failed to load visits:', error);
        toast.error('Failed to load site visits', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (resolvedCustomerId) {
      loadVisits();
    }
  }, [currentPage, itemsPerPage, searchQuery, resolvedCustomerId, siteId]);

  // Server-side pagination is used. "visits" already contains only current page items.

  // Add search handler
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    console.log('=== FORM SUBMISSION STARTED ===')
    console.log('onSubmit called with data:', data)
    console.log('editingVisit:', editingVisit)
    
    setIsLoading(true)
    try {
      // Common data transformation
      const commonData = {
        actionId: data.actionId || `ACT-${Date.now()}`,
        siteVisitId: data.siteVisitId || `SV-${Date.now()}`,
        customer: data.customer,
        region: data.region,
        location: data.location,
        visitType: data.visitType as 'retail' | 'warehouse' | 'office',
        date: data.date,
        idBadgeExpiry: data.idBadgeExpiry || '',
        siaLicenceNumber: data.siaLicenceNumber || '',
        siaLicenceExpiry: data.siaLicenceExpiry || '',
        recordOfIncidentsCompletion: data.recordOfIncidentsCompletion || 'Yes',
        dailyOccurrenceBookCompletion: data.dailyOccurrenceBookCompletion || 'Yes',
        pocketBookCompletion: data.pocketBookCompletion || 'Yes',
        ecrCompletion: data.ecrCompletion || 'Yes',
        top20Lines: data.top20Lines || 'Completed',
        assignmentInstructions: data.assignmentInstructions || 'In place',
        assignmentInstructionsUnderstood: (data.assignmentInstructionsUnderstood || 'Yes') as 'Yes' | 'No',
        healthAndSafetyUnderstood: (data.healthAndSafetyUnderstood || 'Yes') as 'Yes' | 'No',
        dateHSRiskAssessment: data.dateHSRiskAssessment || data.date,
        jumper: data.jumper || 'Good',
        shirt: data.shirt || 'Good',
        tie: data.tie || 'Good',
        hiVisJacket: data.hiVisJacket || 'Good',
        jacket: data.jacket || 'Good',
        trousers: data.trousers || 'Good',
        epaulettes: data.epaulettes || 'Good',
        shoes: data.shoes || 'Good',
        trainingInstructions: data.trainingInstructions || '',
        securityOfficerSign: data.securityOfficerSign || 'Digital Signature',
        followUpAction: data.followUpAction || '',
        followUpActionDate: data.followUpActionDate || '',
        assignmentInstructionsInPlace: (data.assignmentInstructionsInPlace || 'Yes') as 'Yes' | 'No',
        assignmentInstructionsDate: data.assignmentInstructionsDate || data.date,
        healthAndSafetyInPlace: (data.healthAndSafetyInPlace || 'Yes') as 'Yes' | 'No',
        trainingInstructionsGivenDate: data.trainingInstructionsGivenDate || data.date,
        recommendations: data.recommendations || '',
        status: 'Completed' as 'Completed' | 'Follow-up Required',
      }

      // Find customer by code (data.customer) or by numeric ID
      const selectedCustomer = customers.find(c => c.id === data.customer || c.customerId?.toString() === data.customer);
      const customerIdNum = selectedCustomer?.customerId 
        ? (typeof selectedCustomer.customerId === 'string' ? parseInt(selectedCustomer.customerId, 10) : selectedCustomer.customerId)
        : resolvedCustomerId;

      // Add display names and customer ID
      const commonDataWithCustomer = {
        ...commonData,
        customerName: selectedCustomer?.name || data.customer,
        customerId: customerIdNum || resolvedCustomerId || undefined,
        officerName: data.officerName,
        managerName: data.managerName,
        locationName: locations.find(l => l.id === data.location)?.name || data.location,
        regionName: regions.find(r => r.id === data.region)?.name || data.region,
      }

      console.log('Transformed data:', commonDataWithCustomer)

      if (!resolvedCustomerId) {
        throw new Error('Customer ID is required');
      }

      if (editingVisit) {
        console.log('=== UPDATING EXISTING VISIT ===')
        console.log('Calling updateSiteVisit with ID:', editingVisit.id)
        
        const updated = await siteVisitService.updateSiteVisit(editingVisit.id, commonDataWithCustomer, customerIdNum || resolvedCustomerId)
        console.log('Update successful:', updated)
        
        setVisits(currentVisits => currentVisits.map(visit => visit.id === editingVisit.id ? updated : visit))
        toast.success('Site visit has been updated successfully! 🎉', {
          position: "top-right",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } else {
        console.log('=== CREATING NEW VISIT ===')
        console.log('Calling createSiteVisit')
        
        const created = await siteVisitService.createSiteVisit(commonDataWithCustomer, customerIdNum || resolvedCustomerId)
        console.log('Create successful:', created)
        
        setVisits(currentVisits => [created, ...currentVisits])
        setTotalCount(count => count + 1)
        toast.success('New site visit has been created successfully! ✨', {
          position: "top-right",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
      
      console.log('=== CLOSING DIALOG ===')
      setIsDialogOpen(false)
      setEditingVisit(null)
      form.reset()
      
      console.log('=== FORM SUBMISSION COMPLETED SUCCESSFULLY ===')
    } catch (error) {
      console.error('=== FORM SUBMISSION ERROR ===')
      console.error('Save/Update error:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      
      toast.error(`Failed to save site visit: ${error instanceof Error ? error.message : 'Unknown error'}`, {
        position: "top-right",
        autoClose: 6000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    } finally {
      setIsLoading(false)
      console.log('=== FORM SUBMISSION ENDED ===')
    }
  }

  // Handle create site visit
  const handleCreateVisit = () => {
    setEditingVisit(null);
    form.reset({
      actionId: `ACT-${Date.now()}`,
      siteVisitId: `SV-${Date.now()}`,
      customer: '',
      region: '',
      location: '',
      visitType: '',
      date: '',
      officerName: '',
      idBadgeExpiry: '',
      siaLicenceNumber: '',
      siaLicenceExpiry: '',
      recordOfIncidentsCompletion: '',
      dailyOccurrenceBookCompletion: '',
      pocketBookCompletion: '',
      ecrCompletion: '',
      top20Lines: '',
      jumper: '',
      shirt: '',
      tie: '',
      hiVisJacket: '',
      jacket: '',
      trousers: '',
      epaulettes: '',
      shoes: '',
      assignmentInstructions: '',
      assignmentInstructionsUnderstood: '',
      healthAndSafetyUnderstood: '',
      dateHSRiskAssessment: '',
      assignmentInstructionsInPlace: '',
      assignmentInstructionsDate: '',
      healthAndSafetyInPlace: '',
      trainingInstructionsGivenDate: '',
      followUpActionDate: '',
      trainingInstructions: '',
      followUpAction: '',
      recommendations: '',
      securityOfficerSign: '',
      managerName: ''
    });
    setIsDialogOpen(true);
  };

  // Handle edit site visit
  const handleEditVisit = (visit: any) => {
    setEditingVisit(visit);
    
    // Find customer by ID or name
    const selectedCustomer = customers.find(c => 
      c.customerId?.toString() === visit.customerId?.toString() || 
      c.name === visit.customerName
    );
    
    // Find region by ID or name
    const selectedRegion = regions.find(r => 
      r.id === visit.region || 
      r.name === visit.regionName
    );
    
    // Find location by ID or name
    const selectedLocation = locations.find(l => 
      l.id === visit.siteId || 
      l.id === visit.location ||
      l.name === visit.locationName
    );
    
    form.reset({
      actionId: visit.actionId || `ACT-${Date.now()}`,
      siteVisitId: visit.siteVisitId || `SV-${Date.now()}`,
      customer: selectedCustomer?.id || visit.customer || visit.customerId?.toString() || '',
      region: selectedRegion?.id || visit.region || '',
      location: selectedLocation?.id || visit.siteId || visit.location || '',
      visitType: visit.visitType || '',
      date: visit.date || '',
      officerName: visit.officerName || '',
      idBadgeExpiry: visit.idBadgeExpiry || '',
      siaLicenceNumber: visit.siaLicenceNumber || '',
      siaLicenceExpiry: visit.siaLicenceExpiry || '',
      recordOfIncidentsCompletion: visit.recordOfIncidentsCompletion || '',
      dailyOccurrenceBookCompletion: visit.dailyOccurrenceBookCompletion || '',
      pocketBookCompletion: visit.pocketBookCompletion || '',
      ecrCompletion: visit.ecrCompletion || '',
      top20Lines: visit.top20Lines || '',
      jumper: visit.jumper || '',
      shirt: visit.shirt || '',
      tie: visit.tie || '',
      hiVisJacket: visit.hiVisJacket || '',
      jacket: visit.jacket || '',
      trousers: visit.trousers || '',
      epaulettes: visit.epaulettes || '',
      shoes: visit.shoes || '',
      assignmentInstructions: visit.assignmentInstructions || '',
      assignmentInstructionsUnderstood: visit.assignmentInstructionsUnderstood || '',
      healthAndSafetyUnderstood: visit.healthAndSafetyUnderstood || '',
      dateHSRiskAssessment: visit.dateHSRiskAssessment || '',
      assignmentInstructionsInPlace: visit.assignmentInstructionsInPlace || '',
      assignmentInstructionsDate: visit.assignmentInstructionsDate || '',
      healthAndSafetyInPlace: visit.healthAndSafetyInPlace || '',
      trainingInstructionsGivenDate: visit.trainingInstructionsGivenDate || '',
      followUpActionDate: visit.followUpActionDate || '',
      trainingInstructions: visit.trainingInstructions || '',
      followUpAction: visit.followUpAction || '',
      recommendations: visit.recommendations || '',
      securityOfficerSign: visit.securityOfficerSign || '',
      managerName: visit.managerName || '',
    });
    setIsDialogOpen(true);
  };
  
  // Handle delete site visit
  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  };
  
  // Handle confirm delete
  const handleDeleteConfirm = async () => {
    if (deleteId) {
      try {
        if (!resolvedCustomerId) {
          throw new Error('Customer ID is required');
        }
        await siteVisitService.deleteSiteVisit(deleteId, resolvedCustomerId);
        setVisits(currentVisits => currentVisits.filter(visit => visit.id !== deleteId));
        setTotalCount(count => Math.max(0, count - 1));
        setIsDeleteDialogOpen(false);
        setDeleteId(null);
        
        toast.success('Site visit has been deleted successfully! 🗑️', {
          position: "top-right",
          autoClose: 4000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete site visit', {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        });
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#EFF4FF] overflow-x-hidden">
      <div className="container mx-auto py-2 xs:py-3 sm:py-4 lg:py-6 xl:py-8 2xl:py-10 px-1 xs:px-2 sm:px-4 lg:px-6 xl:px-8 2xl:px-12 max-w-screen-2xl">
        <div className="flex flex-col space-y-2 sm:space-y-4 lg:space-y-6 xl:space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 xl:gap-6">
            <div className="flex items-center gap-1.5 sm:gap-3 xl:gap-4">
              <div className="bg-blue-100 p-1.5 sm:p-2 xl:p-3 rounded-lg">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl font-bold text-gray-900">Site Visit Reports</h1>
                <p className="text-[10px] sm:text-xs lg:text-sm xl:text-base text-gray-500">Track site visits and officer evaluations</p>
              </div>
            </div>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1 sm:gap-2 mt-2 sm:mt-0 w-full sm:w-auto px-2 sm:px-3 py-1 sm:py-2 h-8 sm:h-9 lg:h-10 xl:h-12 text-xs sm:text-sm xl:text-base"
              onClick={handleCreateVisit}
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6" />
              New Site Visit
            </Button>
          </div>

          {/* Dashboard Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 sm:gap-3 md:gap-4 xl:gap-6">
            <Card className="bg-gradient-to-br from-blue-800 to-blue-900 border-blue-700 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between p-1.5 sm:p-2 md:p-3 xl:p-5 2xl:p-6 pb-0.5 sm:pb-1 md:pb-2 xl:pb-3">
                <CardTitle className="text-[10px] sm:text-xs lg:text-sm xl:text-base font-medium text-white">Total Visits</CardTitle>
                <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 xl:h-5 xl:w-5 text-blue-300" />
              </CardHeader>
              <CardContent className="p-1.5 sm:p-2 md:p-3 xl:p-5 2xl:p-6 pt-0 md:pt-1 xl:pt-2">
                <div className="text-sm sm:text-base lg:text-lg xl:text-2xl 2xl:text-3xl font-bold text-white">{totalCount}</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-800 to-green-900 border-green-700 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between p-1.5 sm:p-2 md:p-3 xl:p-5 2xl:p-6 pb-0.5 sm:pb-1 md:pb-2 xl:pb-3">
                <CardTitle className="text-[10px] sm:text-xs lg:text-sm xl:text-base font-medium text-white">Completed</CardTitle>
                <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 xl:h-5 xl:w-5 text-green-300" />
              </CardHeader>
              <CardContent className="p-1.5 sm:p-2 md:p-3 xl:p-5 2xl:p-6 pt-0 md:pt-1 xl:pt-2">
                <div className="text-sm sm:text-base lg:text-lg xl:text-2xl 2xl:text-3xl font-bold text-white">
                  {visits.filter(v => v.status === "Completed").length}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-amber-700 to-amber-800 border-amber-600 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between p-1.5 sm:p-2 md:p-3 xl:p-5 2xl:p-6 pb-0.5 sm:pb-1 md:pb-2 xl:pb-3">
                <CardTitle className="text-[10px] sm:text-xs lg:text-sm xl:text-base font-medium text-white">Follow-up</CardTitle>
                <AlertTriangle className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 xl:h-5 xl:w-5 text-amber-300" />
              </CardHeader>
              <CardContent className="p-1.5 sm:p-2 md:p-3 xl:p-5 2xl:p-6 pt-0 md:pt-1 xl:pt-2">
                <div className="text-sm sm:text-base lg:text-lg xl:text-2xl 2xl:text-3xl font-bold text-white">
                  {visits.filter(v => v.status === "Follow-up Required").length}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-800 to-purple-900 border-purple-700 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between p-1.5 sm:p-2 md:p-3 xl:p-5 2xl:p-6 pb-0.5 sm:pb-1 md:pb-2 xl:pb-3">
                <CardTitle className="text-[10px] sm:text-xs lg:text-sm xl:text-base font-medium text-white">Unique Officers</CardTitle>
                <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 xl:h-5 xl:w-5 text-purple-300" />
              </CardHeader>
              <CardContent className="p-1.5 sm:p-2 md:p-3 xl:p-5 2xl:p-6 pt-0 md:pt-1 xl:pt-2">
                <div className="text-sm sm:text-base lg:text-lg xl:text-2xl 2xl:text-3xl font-bold text-white">
                  {new Set(visits.map(v => v.officerName)).size}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Add search input before the table */}
        <div className="mt-3 sm:mt-4 lg:mt-6 xl:mt-8 mb-2 sm:mb-3 xl:mb-4">
          <div className="relative w-full sm:max-w-xs xl:max-w-sm">
            <Input
              type="text"
              placeholder="Search visits..."
              value={searchQuery}
              onChange={handleSearch}
              className="pl-8 h-8 sm:h-9 xl:h-12 text-xs sm:text-sm xl:text-base"
            />
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 xl:h-5 xl:w-5 text-gray-400" />
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 xl:h-8 xl:w-8 p-0"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-3 w-3 sm:h-3.5 sm:w-3.5 xl:h-4 xl:w-4" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
          </div>
          {searchQuery && (
            <p className="text-[10px] sm:text-xs xl:text-sm text-gray-500 mt-1">
              Found {totalCount} {totalCount === 1 ? 'result' : 'results'}
            </p>
          )}
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto -mx-1 sm:mx-0">
            <div className="min-w-[300px] max-w-full px-1 sm:px-0">
              <Table className="w-full table-auto">
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-medium text-[10px] sm:text-xs lg:text-sm xl:text-base text-gray-900 py-1.5 sm:py-2 md:py-3 xl:py-4">Customer</TableHead>
                    <TableHead className="font-medium text-[10px] sm:text-xs lg:text-sm xl:text-base text-gray-900 py-1.5 sm:py-2 md:py-3 xl:py-4 whitespace-nowrap w-[120px] xs:w-[140px] sm:w-[160px] xl:w-[180px]">Date</TableHead>
                    <TableHead className="font-medium text-[10px] sm:text-xs lg:text-sm xl:text-base text-gray-900 py-1.5 sm:py-2 md:py-3 xl:py-4 whitespace-nowrap hidden md:table-cell">Location</TableHead>
                    <TableHead className="font-medium text-[10px] sm:text-xs lg:text-sm xl:text-base text-gray-900 py-1.5 sm:py-2 md:py-3 xl:py-4 hidden sm:table-cell">Officer</TableHead>
                    <TableHead className="font-medium text-[10px] sm:text-xs lg:text-sm xl:text-base text-gray-900 py-1.5 sm:py-2 md:py-3 xl:py-4">Status</TableHead>
                    <TableHead className="font-medium text-[10px] sm:text-xs lg:text-sm xl:text-base text-gray-900 py-1.5 sm:py-2 md:py-3 xl:py-4 w-[60px] sm:w-[70px] lg:w-[80px] xl:w-[100px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visits.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 sm:py-6 md:py-8 xl:py-12">
                        {searchQuery ? (
                          <p className="text-gray-500 text-[10px] sm:text-xs lg:text-sm xl:text-base">No matching visits found</p>
                        ) : (
                          <>
                            <p className="text-gray-500 text-[10px] sm:text-xs lg:text-sm xl:text-base">No site visits recorded</p>
                            <Button
                              variant="link"
                              onClick={handleCreateVisit}
                              className="text-blue-600 hover:text-blue-700 mt-1 sm:mt-2 text-[10px] sm:text-xs lg:text-sm xl:text-base"
                            >
                              Create your first site visit
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    visits.map((visit) => (
                      <TableRow key={visit.id} className="hover:bg-gray-50 transition-colors text-[10px] sm:text-xs lg:text-sm xl:text-base">
                        <TableCell className="py-1.5 sm:py-2 md:py-3 xl:py-4">
                          <div className="font-medium text-[11px] sm:text-sm xl:text-base text-blue-700">
                            {visit.customerName}
                          </div>
                          <div className="sm:hidden text-[9px] lg:text-xs xl:text-sm text-gray-500 mt-0.5">
                            {visit.officerName}
                          </div>
                        </TableCell>
                        <TableCell className="py-1.5 sm:py-2 md:py-3 xl:py-4 font-medium whitespace-nowrap">
                          {format(new Date(visit.date), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell className="py-1.5 sm:py-2 md:py-3 xl:py-4 hidden md:table-cell">{visit.locationName}</TableCell>
                        <TableCell className="py-1.5 sm:py-2 md:py-3 xl:py-4 hidden sm:table-cell">{visit.officerName}</TableCell>
                        <TableCell className="py-1.5 sm:py-2 md:py-3 xl:py-4">
                          <span 
                            className={`inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-xs lg:text-sm xl:text-base font-medium ${
                              visit.status === "Completed" 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {visit.status}
                          </span>
                        </TableCell>
                        <TableCell className="py-1.5 sm:py-2 md:py-3 xl:py-4">
                          <div className="flex items-center justify-end gap-0.5 sm:gap-1 md:gap-2 xl:gap-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 xl:h-10 xl:w-10 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                              onClick={() => handleEditVisit(visit)}
                            >
                              <Pencil className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 xl:h-5 xl:w-5" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 xl:h-10 xl:w-10 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                              onClick={() => handleDeleteClick(visit.id)}
                            >
                              <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 xl:h-5 xl:w-5" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center py-2 sm:py-3 md:py-4 xl:py-6 mt-2 sm:mt-3 md:mt-4 xl:mt-6 overflow-x-auto">
            <Pagination>
              <PaginationContent className="flex flex-wrap items-center justify-center gap-0.5 sm:gap-1 xl:gap-2">
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={`${currentPage === 1 ? 'pointer-events-none opacity-50' : ''} h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-auto xl:h-12 xl:w-auto flex items-center justify-center text-[10px] sm:text-xs xl:text-base`}
                    aria-disabled={currentPage === 1}
                  >
                    <span className="sr-only">Go to previous page</span>
                  </PaginationPrevious>
                </PaginationItem>
                
                {/* Mobile Pagination Counter */}
                <PaginationItem className="sm:hidden">
                  <span className="h-7 px-2 flex items-center justify-center text-[10px] xl:text-sm font-medium text-gray-600">
                    {currentPage} / {totalPages}
                  </span>
                </PaginationItem>
                
                {/* Desktop Pagination Numbers */}
                {(() => {
                  const paginationItems = [];
                  const totalButtons = Math.min(totalPages, 5);
                  
                  let startPage = 1;
                  if (totalPages > 5) {
                    if (currentPage <= 3) {
                      startPage = 1;
                    } else if (currentPage >= totalPages - 2) {
                      startPage = totalPages - 4;
                    } else {
                      startPage = currentPage - 2;
                    }
                  }
                  
                  for (let i = 0; i < totalButtons; i++) {
                    const pageNumber = startPage + i;
                    paginationItems.push(
                      <PaginationItem key={pageNumber} className="hidden sm:inline-block">
                        <PaginationLink
                          onClick={() => handlePageChange(pageNumber)}
                          isActive={currentPage === pageNumber}
                          className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 xl:h-12 xl:w-12 flex items-center justify-center rounded-md text-[10px] sm:text-xs xl:text-base"
                          aria-label={`Go to page ${pageNumber}`}
                        >
                          {pageNumber}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                  
                  return paginationItems;
                })()}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={`${currentPage === totalPages ? 'pointer-events-none opacity-50' : ''} h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-auto xl:h-12 xl:w-auto flex items-center justify-center text-[10px] sm:text-xs xl:text-base`}
                    aria-disabled={currentPage === totalPages}
                  >
                    <span className="sr-only">Go to next page</span>
                  </PaginationNext>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setEditingVisit(null);
          form.reset();
        }
        setIsDialogOpen(open);
      }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0 sm:p-2 md:p-4 lg:p-6">
          <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
            <DialogTitle className="text-xl font-bold">
              {editingVisit ? "Edit Site Visit" : "Create New Site Visit"}
            </DialogTitle>
            <DialogDescription>
              {editingVisit 
                ? "Update the details for this site visit report" 
                : "Complete the form below to create a new site visit report"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="px-4 pb-4 sm:px-6 sm:pb-6">
              <Accordion type="multiple" defaultValue={["basic-info"]} className="space-y-4">
                {/* Basic Information Section */}
                <AccordionItem value="basic-info" className="border rounded-lg px-4 bg-white shadow-sm">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-base">Basic Information</h3>
                        <p className="text-sm text-gray-500">Customer, location, and visit details</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Separator className="my-4" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                {/* Basic Information */}
                <FormField
                  control={form.control}
                  name="customer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-blue-600" />
                        Customer
                      </FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue('region', ''); // Reset region when customer changes
                          form.setValue('location', ''); // Reset location when customer changes
                        }} 
                        value={field.value}
                        disabled={isLoadingCustomers || !!customerId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingCustomers ? (
                            <SelectItem value="loading" disabled>Loading customers...</SelectItem>
                          ) : customers.length === 0 ? (
                            <SelectItem value="none" disabled>No customers available</SelectItem>
                          ) : (
                            customers.map((customer) => (
                              <SelectItem key={customer.id} value={customer.id}>
                                {customer.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-green-600" />
                        Region
                      </FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue('location', ''); // Reset location when region changes
                        }} 
                        value={field.value}
                        disabled={isLoadingRegions || !form.watch('customer')}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select region" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingRegions ? (
                            <SelectItem value="loading" disabled>Loading regions...</SelectItem>
                          ) : regions.length === 0 ? (
                            <SelectItem value="none" disabled>
                              {form.watch('customer') ? 'No regions available for this customer' : 'Select a customer first'}
                            </SelectItem>
                          ) : (
                            regions.map((region) => (
                              <SelectItem key={region.id} value={region.id}>
                                {region.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-purple-600" />
                        Location
                      </FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={isLoadingLocations || !form.watch('region')}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingLocations ? (
                            <SelectItem value="loading" disabled>Loading locations...</SelectItem>
                          ) : locations.length === 0 ? (
                            <SelectItem value="none" disabled>
                              {form.watch('customer') ? 'No locations available for this customer' : 'Select a customer first'}
                            </SelectItem>
                          ) : (
                            locations.map((location) => (
                              <SelectItem key={location.id} value={location.id}>
                                {location.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="visitType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-amber-600" />
                        Visit Type
                      </FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select visit type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="retail">Retail</SelectItem>
                          <SelectItem value="warehouse">Warehouse</SelectItem>
                          <SelectItem value="office">Office</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-red-600" />
                        Date of Visit
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="officerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <User className="h-4 w-4 text-indigo-600" />
                        Officer Name
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Enter officer name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Officer ID Information Section */}
                <AccordionItem value="officer-id" className="border rounded-lg px-4 bg-white shadow-sm">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                        <CreditCard className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-base">Officer ID Information</h3>
                        <p className="text-sm text-gray-500">ID badge and SIA licence details</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Separator className="my-4" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="idBadgeExpiry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ID Badge Expiry</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="siaLicenceNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SIA Licence Number</FormLabel>
                        <FormControl>
                          <Input {...field} maxLength={16} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="siaLicenceExpiry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SIA Licence Expiry</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Documentation & Appearance Section */}
                <AccordionItem value="documentation" className="border rounded-lg px-4 bg-white shadow-sm">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-100 text-green-600">
                        <FileCheck className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-base">Documentation & Appearance Checks</h3>
                        <p className="text-sm text-gray-500">Documentation completeness and uniform standards</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Separator className="my-4" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <Card className="border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <FileCheck className="h-4 w-4 text-green-600" />
                      <CardTitle className="text-base font-semibold">Documentation Checks</CardTitle>
                    </div>
                    <CardDescription className="text-xs">Verify documentation completeness</CardDescription>
                  </CardHeader>
                  <CardContent>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="recordOfIncidentsCompletion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Record of Incidents</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select rating" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {documentationOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="dailyOccurrenceBookCompletion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Daily Occurrence Book</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select rating" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {documentationOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="pocketBookCompletion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pocket Book</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select rating" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {documentationOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="ecrCompletion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ECR/Crime Reporting</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select rating" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {documentationOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="top20Lines"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Top 20 Lines</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select rating" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ratingOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  </CardContent>
                </Card>
                
                <Card className="border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Shirt className="h-4 w-4 text-blue-600" />
                      <CardTitle className="text-base font-semibold">Appearance Checks</CardTitle>
                    </div>
                    <CardDescription className="text-xs">Uniform and appearance standards</CardDescription>
                  </CardHeader>
                  <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="jumper"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jumper</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select rating" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ratingOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="shirt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Shirt</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select rating" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ratingOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="tie"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tie</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select rating" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ratingOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="hiVisJacket"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hi-Vis Jacket</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select rating" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ratingOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="jacket"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Jacket</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select rating" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ratingOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="trousers"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trousers</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select rating" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ratingOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="epaulettes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Epaulettes</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select rating" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ratingOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="shoes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Shoes</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select rating" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ratingOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  </CardContent>
                </Card>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Assignment Instructions Section */}
                <AccordionItem value="assignments" className="border rounded-lg px-4 bg-white shadow-sm">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                        <ClipboardCheck className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-base">Assignment & Safety Instructions</h3>
                        <p className="text-sm text-gray-500">Instructions in place and compliance dates</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Separator className="my-4" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="assignmentInstructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assignment Instructions in place</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Yes">Yes</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="assignmentInstructionsUnderstood"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assignment Instructions Understood</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Yes">Yes</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="assignmentInstructionsDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assignment Instructions Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="assignmentInstructionsInPlace"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>H&S Instructions In Place</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Yes">Yes</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="healthAndSafetyUnderstood"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>H&S Understood</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Yes">Yes</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="dateHSRiskAssessment"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>H&S Risk Assessment Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="trainingInstructionsGivenDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Training Instructions Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="followUpActionDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Follow-up Action Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Training & Follow-up Section */}
                <AccordionItem value="training" className="border rounded-lg px-4 bg-white shadow-sm">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-base">Training & Follow-up</h3>
                        <p className="text-sm text-gray-500">Observations, actions, and recommendations</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Separator className="my-4" />
                    <div className="space-y-4 pt-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="trainingInstructions"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-indigo-600" />
                                Training Instructions/Observations
                              </FormLabel>
                              <FormControl>
                                <textarea 
                                  {...field}
                                  className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  placeholder="Enter any training instructions or observations..."
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="followUpAction"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                                Follow-up Action
                              </FormLabel>
                              <FormControl>
                                <textarea 
                                  {...field}
                                  className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  placeholder="Enter any follow-up actions required..."
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="recommendations"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Award className="h-4 w-4 text-green-600" />
                              Recommendations
                            </FormLabel>
                            <FormControl>
                              <textarea 
                                {...field}
                                className="flex min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Enter any recommendations..."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Signatures Section */}
                <AccordionItem value="signatures" className="border rounded-lg px-4 bg-white shadow-sm">
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
                        <UserCircle className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-base">Signatures</h3>
                        <p className="text-sm text-gray-500">Security officer and manager details</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Separator className="my-4" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <FormField
                        control={form.control}
                        name="securityOfficerSign"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <UserCircle className="h-4 w-4 text-gray-600" />
                              Security Officer Signature
                            </FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter security officer signature" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="managerName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <UserCircle className="h-4 w-4 text-gray-600" />
                              Manager Name
                            </FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter manager name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              
              <DialogFooter className="px-4 pb-4 sm:px-6 sm:pb-6 pt-6 flex flex-col sm:flex-row gap-2 sm:gap-0 border-t mt-6">
                <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto order-2 sm:order-1">
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto order-1 sm:order-2"
                  onClick={() => {
                    console.log('=== SUBMIT BUTTON CLICKED ===')
                    console.log('Form isValid:', form.formState.isValid)
                    console.log('Form errors:', form.formState.errors)
                    console.log('Form values:', form.getValues())
                    console.log('Is submitting:', form.formState.isSubmitting)
                    console.log('isDirty:', form.formState.isDirty)
                    console.log('isSubmitSuccessful:', form.formState.isSubmitSuccessful)
                    console.log('submitCount:', form.formState.submitCount)
                    
                    // Try manual validation
                    const values = form.getValues()
                    const validationResult = formSchema.safeParse(values)
                    console.log('Manual validation result:', validationResult)
                    
                    if (!validationResult.success) {
                      console.log('Validation errors:', validationResult.error.errors)
                    }
                  }}
                >
                  {editingVisit ? "Update Site Visit" : "Create Site Visit"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md p-0 sm:p-2 md:p-4">
          <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
            <DialogTitle className="text-lg font-semibold">Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this site visit? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="px-4 py-4 sm:px-6 sm:py-6 flex flex-col sm:flex-row gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto order-1 sm:order-2"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}