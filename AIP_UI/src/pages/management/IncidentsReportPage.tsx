import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon, PlusCircle, Search, Eye, Pencil, Trash2, Store, AlertCircle, PoundSterling, Clock, User, UserCircle, MapPin, Plus, FileText, ShoppingBagIcon, PlusIcon, TrashIcon, QrCode, Loader2, ScanIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { CheckIcon } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import BarcodeScanner from '@/components/BarcodeScanner';

// Define the type for incidents
interface Incident {
  id: string;
  date: Date;
  time?: { hour: string; minute: string }; // For backward compatibility
  customer: { name: string; id?: string };
  siteName: string;
  officer: { name: string; role: string; id?: string };
  dutyManager?: string;
  incidentType: "Theft" | "Vandalism" | "Customer Accident" | "Suspicious Activity" | "Other";
  description: string;
  additionalComments?: string;
  policeInvolved: boolean;
  valueRecovered?: number;
  offenderDetails?: {
    name?: string;
    sex?: "N/A" | "N/K" | "male" | "female" | "other";
    dateOfBirth?: Date;
    address?: string;
    town?: string;
    postCode?: string;
  };
  categories: {
    selfScanTills: boolean; // J
    threatsAndIntimidation: boolean; // L
    banFromStore: boolean; // N
    scanAndGo: boolean; // M
    abusiveBehaviour: boolean; // K
    policeFailedToAttend: boolean; // Q
    violentBehaviorPhysical: boolean; // O
    spitting: boolean; // M
  };
  stolenItems: StolenItem[];
  urnNumber?: string;
  crimeReferenceNumber?: string;
}

// Update the state for stolen items to include category and quantity
interface StolenItem {
  category: string;
  name: string;
  productName: string; // Added product name field
  value: number;
  quantity: number;
  total: number;
}

type IncidentType = "Theft" | "Vandalism" | "Customer Accident" | "Suspicious Activity" | "Other";

const IncidentsReportPage: React.FC = () => {
  // Sample data for incidents
  const [incidents, setIncidents] = useState<Incident[]>([
    {
      id: "1",
      date: new Date(2024, 1, 15), // 2/15/2024
      time: { hour: "10", minute: "30" },
      customer: { name: "John Doe" },
      siteName: "London Store",
      officer: { name: "John Smith", role: "Security Officer" },
      dutyManager: "Sarah Johnson",
      incidentType: "Theft",
      description: "Shoplifting incident involving high-value electronics",
      additionalComments: "Individual took multiple items",
      policeInvolved: true,
      valueRecovered: 599.99,
      offenderDetails: {
        name: "Jane Doe",
        sex: "female",
        dateOfBirth: new Date(1990, 5, 15),
        address: "123 Main St, London",
        town: "London",
        postCode: "SW1A 1AA"
      },
      categories: {
        selfScanTills: false,
        threatsAndIntimidation: false,
        banFromStore: false,
        scanAndGo: false,
        abusiveBehaviour: false,
        policeFailedToAttend: false,
        violentBehaviorPhysical: false,
        spitting: false
      },
      stolenItems: [{ category: "electronics", name: "Laptop", productName: "Laptop", value: 599.99, quantity: 1, total: 599.99 }]
    },
    {
      id: "2",
      date: new Date(2024, 1, 14), // 2/14/2024
      time: { hour: "14", minute: "00" },
      customer: { name: "Jane Smith" },
      siteName: "Manchester Store",
      officer: { name: "Michael Brown", role: "Security Manager" },
      dutyManager: "Sarah Johnson",
      incidentType: "Vandalism",
      description: "Graffiti found on the back wall of the store",
      additionalComments: "Graffiti was removed immediately",
      policeInvolved: false,
      valueRecovered: 0,
      offenderDetails: undefined,
      categories: {
        selfScanTills: false,
        threatsAndIntimidation: false,
        banFromStore: false,
        scanAndGo: false,
        abusiveBehaviour: false,
        policeFailedToAttend: false,
        violentBehaviorPhysical: false,
        spitting: false
      },
      stolenItems: []
    },
    {
      id: "3",
      date: new Date(2024, 1, 13), // 2/13/2024
      time: { hour: "10", minute: "00" },
      customer: { name: "Bob Johnson" },
      siteName: "Birmingham Store",
      officer: { name: "Sarah Johnson", role: "Supervisor" },
      dutyManager: "Sarah Johnson",
      incidentType: "Customer Accident",
      description: "Slip and fall incident in the produce section",
      additionalComments: "Customer was assisted by store staff",
      policeInvolved: false,
      valueRecovered: 0,
      offenderDetails: undefined,
      categories: {
        selfScanTills: false,
        threatsAndIntimidation: false,
        banFromStore: false,
        scanAndGo: false,
        abusiveBehaviour: false,
        policeFailedToAttend: false,
        violentBehaviorPhysical: true,
        spitting: false
      },
      stolenItems: []
    },
    {
      id: "4",
      date: new Date(2024, 1, 12), // 2/12/2024
      time: { hour: "15", minute: "30" },
      customer: { name: "Alice Johnson" },
      siteName: "Leeds Store",
      officer: { name: "Michael Brown", role: "Security Officer" },
      dutyManager: "Sarah Johnson",
      incidentType: "Theft",
      description: "Multiple items concealed in bag",
      additionalComments: "Customer was caught on CCTV",
      policeInvolved: true,
      valueRecovered: 245.50,
      offenderDetails: {
        name: "Bob Johnson",
        sex: "male",
        dateOfBirth: new Date(1985, 10, 20),
        address: "456 Elm St, Leeds",
        town: "Leeds",
        postCode: "LS1 1AB"
      },
      categories: {
        selfScanTills: false,
        threatsAndIntimidation: false,
        banFromStore: false,
        scanAndGo: false,
        abusiveBehaviour: false,
        policeFailedToAttend: false,
        violentBehaviorPhysical: false,
        spitting: false
      },
      stolenItems: [{ category: "electronics", name: "Mobile Phone", productName: "Mobile Phone", value: 245.50, quantity: 1, total: 245.50 }]
    },
    {
      id: "5",
      date: new Date(2024, 1, 11), // 2/11/2024
      time: { hour: "11", minute: "00" },
      customer: { name: "Eve Smith" },
      siteName: "Glasgow Store",
      officer: { name: "Sarah Johnson", role: "Security Officer" },
      dutyManager: "Sarah Johnson",
      incidentType: "Suspicious Activity",
      description: "Individual taking photos of security camera locations",
      additionalComments: "Caught on CCTV",
      policeInvolved: true,
      valueRecovered: 0,
      offenderDetails: undefined,
      categories: {
        selfScanTills: false,
        threatsAndIntimidation: false,
        banFromStore: false,
        scanAndGo: false,
        abusiveBehaviour: false,
        policeFailedToAttend: false,
        violentBehaviorPhysical: false,
        spitting: false
      },
      stolenItems: []
    }
  ]);

  // State for search
  const [searchQuery, setSearchQuery] = useState("");
  
  // State for new incident dialog
  const [isNewIncidentDialogOpen, setIsNewIncidentDialogOpen] = useState(false);
  const [isViewIncidentDialogOpen, setIsViewIncidentDialogOpen] = useState(false);
  const [isEditIncidentDialogOpen, setIsEditIncidentDialogOpen] = useState(false);
  const [isDeleteIncidentDialogOpen, setIsDeleteIncidentDialogOpen] = useState(false);
  
  // State for form fields
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [incidentDate, setIncidentDate] = useState<Date | undefined>(undefined);
  const [incidentTime, setIncidentTime] = useState({ hour: "", minute: "" });
  const [customerName, setCustomerName] = useState("");
  const [siteName, setSiteName] = useState("");
  const [officerName, setOfficerName] = useState("");
  const [officerRole, setOfficerRole] = useState("");
  const [dutyManagerName, setDutyManagerName] = useState("");
  const [incidentType, setIncidentType] = useState<IncidentType | "">("");
  const [description, setDescription] = useState("");
  const [otherComments, setOtherComments] = useState("");
  const [policeInvolved, setPoliceInvolved] = useState(false);
  const [valueRecovered, setValueRecovered] = useState("");
  const [categories, setCategories] = useState({
    selfScanTills: false,
    threatsAndIntimidation: false,
    banFromStore: false,
    scanAndGo: false,
    abusiveBehaviour: false,
    policeFailedToAttend: false,
    violentBehaviorPhysical: false,
    spitting: false
  });
  const [offenderDetails, setOffenderDetails] = useState<Incident['offenderDetails']>({
    name: '',
    sex: 'N/A',
    dateOfBirth: undefined,
    address: '',
    town: '',
    postCode: ''
  });
  const [stolenItems, setStolenItems] = useState<StolenItem[]>([]);

  // Add new state variables for the stolen item form
  const [itemCategory, setItemCategory] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemProductName, setItemProductName] = useState("");
  const [itemCost, setItemCost] = useState("");
  const [itemQuantity, setItemQuantity] = useState("1");
  const [scanningBarcode, setScanningBarcode] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [urnNumber, setUrnNumber] = useState("");
  const [crimeReferenceNumber, setCrimeReferenceNumber] = useState("");

  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Update filtered incidents to include pagination
  const filteredIncidents = incidents.filter(incident => 
    incident.siteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    incident.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    incident.incidentType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate pagination values
  const totalPages = Math.ceil(filteredIncidents.length / ITEMS_PER_PAGE);
  const paginatedIncidents = filteredIncidents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Calculate summary statistics
  const totalAmountSaved = incidents.reduce((sum, incident) => sum + incident.valueRecovered, 0);
  const uniqueStores = new Set(incidents.map(incident => incident.siteName)).size;
  const totalIncidents = incidents.length;

  // Reset form function
  const resetForm = () => {
    setIncidentDate(undefined);
    setIncidentTime({ hour: "", minute: "" });
    setCustomerName("");
    setSiteName("");
    setOfficerName("");
    setOfficerRole("");
    setDutyManagerName("");
    setIncidentType("");
    setDescription("");
    setOtherComments("");
    setPoliceInvolved(false);
    setValueRecovered("");
    setOffenderDetails({
      name: '',
      sex: 'N/A',
      dateOfBirth: undefined,
      address: '',
      town: '',
      postCode: ''
    });
    setCategories({
      selfScanTills: false,
      threatsAndIntimidation: false,
      banFromStore: false,
      scanAndGo: false,
      abusiveBehaviour: false,
      policeFailedToAttend: false,
      violentBehaviorPhysical: false,
      spitting: false
    });
    setStolenItems([]);
    setItemCategory("");
    setItemDescription("");
    setItemProductName("");
    setItemCost("");
    setItemQuantity("1");
    setPoliceInvolved(false);
    setUrnNumber("");
    setCrimeReferenceNumber("");
  };

  // Open new incident dialog
  const openNewIncidentDialog = () => {
    resetForm();
    setIsNewIncidentDialogOpen(true);
  };

  // Open view incident dialog
  const openViewIncidentDialog = (incident: Incident) => {
    // Clone the incident data for the view
    setSelectedIncident({ 
      ...incident,
      stolenItems: incident.stolenItems as StolenItem[] 
    });
    setIsViewIncidentDialogOpen(true);
  };

  // Open edit incident dialog
  const openEditIncidentDialog = (incident: Incident) => {
    // Set the form values based on the incident data
    setIncidentDate(new Date(incident.date));
    setIncidentTime({
      hour: new Date(incident.date).getHours().toString().padStart(2, '0'),
      minute: new Date(incident.date).getMinutes().toString().padStart(2, '0')
    });
    setCustomerName(incident.customer.name);
    setSiteName(incident.siteName);
    setOfficerName(incident.officer.name);
    setOfficerRole(incident.officer.role);
    setDutyManagerName(incident.dutyManager || "");
    setIncidentType(incident.incidentType);
    setDescription(incident.description);
    setOtherComments(incident.additionalComments || "");
    setPoliceInvolved(incident.policeInvolved);
    setStolenItems(incident.stolenItems as StolenItem[]);
    setOffenderDetails(incident.offenderDetails || {
      name: '',
      sex: 'N/A',
      dateOfBirth: undefined,
      address: '',
      town: '',
      postCode: ''
    });
    setCategories(incident.categories || {
      selfScanTills: false,
      threatsAndIntimidation: false,
      banFromStore: false,
      scanAndGo: false,
      abusiveBehaviour: false,
      policeFailedToAttend: false,
      violentBehaviorPhysical: false,
      spitting: false
    });
    
    // Set the selected incident for reference
    setSelectedIncident(incident);
    
    // Open the dialog
    setIsEditIncidentDialogOpen(true);
  };

  // Open delete incident dialog
  const openDeleteIncidentDialog = (incident: Incident) => {
    setSelectedIncident(incident);
    setIsDeleteIncidentDialogOpen(true);
  };

  // Handle create incident
  const handleCreateIncident = () => {
    if (!incidentDate || !customerName || !siteName || !officerName || 
        !officerRole || !dutyManagerName || !incidentType || !description ||
        !incidentTime.hour || !incidentTime.minute) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const newIncident: Incident = {
      id: Math.random().toString(36).substr(2, 9),
      date: incidentDate,
      time: incidentTime,
      customer: { name: customerName },
      siteName,
      officer: { name: officerName, role: officerRole },
      dutyManager: dutyManagerName,
      incidentType: incidentType as Incident['incidentType'],
      description,
      additionalComments: otherComments,
      policeInvolved,
      urnNumber: policeInvolved ? urnNumber : undefined,
      crimeReferenceNumber: policeInvolved ? crimeReferenceNumber : undefined,
      valueRecovered: stolenItems.reduce((sum, item) => sum + item.total, 0),
      offenderDetails: {
        name: offenderDetails.name || undefined,
        sex: offenderDetails.sex || undefined,
        dateOfBirth: offenderDetails.dateOfBirth,
        address: offenderDetails.address || undefined,
        town: offenderDetails.town || undefined,
        postCode: offenderDetails.postCode || undefined
      },
      categories,
      stolenItems
    };

    setIncidents([newIncident, ...incidents]);
    setIsNewIncidentDialogOpen(false);
    resetForm();
    toast({
      title: "Success",
      description: "Incident created successfully",
      variant: "default"
    });
  };

  // Handle edit incident
  const handleEditIncident = () => {
    if (!selectedIncident || !incidentDate || !customerName || !siteName || 
        !officerName || !officerRole || !dutyManagerName || !incidentType || 
        !description || !incidentTime.hour || !incidentTime.minute) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const updatedIncidents = incidents.map(incident => {
      if (incident.id === selectedIncident.id) {
        return {
          ...incident,
          date: incidentDate,
          time: incidentTime,
          customer: { name: customerName },
          siteName,
          officer: { name: officerName, role: officerRole },
          dutyManager: dutyManagerName,
          incidentType: incidentType as Incident['incidentType'],
          description,
          additionalComments: otherComments,
          policeInvolved,
          urnNumber: policeInvolved ? urnNumber : undefined,
          crimeReferenceNumber: policeInvolved ? crimeReferenceNumber : undefined,
          valueRecovered: stolenItems.reduce((sum, item) => sum + item.total, 0),
          offenderDetails: {
            name: offenderDetails.name || undefined,
            sex: offenderDetails.sex || undefined,
            dateOfBirth: offenderDetails.dateOfBirth,
            address: offenderDetails.address || undefined,
            town: offenderDetails.town || undefined,
            postCode: offenderDetails.postCode || undefined
          },
          categories,
          stolenItems
        };
      }
      return incident;
    });

    setIncidents(updatedIncidents);
    setIsEditIncidentDialogOpen(false);
    resetForm();
    toast({
      title: "Success",
      description: "Incident updated successfully",
      variant: "default"
    });
  };

  // Handle delete incident
  const handleDeleteIncident = () => {
    if (!selectedIncident) return;

    const updatedIncidents = incidents.filter(incident => incident.id !== selectedIncident.id);
    setIncidents(updatedIncidents);
    setIsDeleteIncidentDialogOpen(false);
  };

  // Add functionality to add stolen items
  const handleAddStolenItem = () => {
    if (!itemCategory || !itemDescription || !itemCost) {
      toast({
        title: "Error",
        description: "Please fill in all required fields for the stolen item",
        variant: "destructive"
      });
      return;
    }
    
    const cost = parseFloat(itemCost);
    const quantity = parseInt(itemQuantity) || 1;
    
    if (isNaN(cost)) {
      toast({
        title: "Error",
        description: "Please enter a valid number for cost",
        variant: "destructive"
      });
      return;
    }
    
    const total = cost * quantity;
    
    setStolenItems([...stolenItems, { 
      category: itemCategory, 
      name: itemDescription, 
      productName: itemProductName || itemDescription, // Use product name if available, otherwise use description
      value: cost,
      quantity: quantity,
      total: total
    }]);
    
    // Reset form fields
    setItemCategory("");
    setItemDescription("");
    setItemProductName("");
    setItemCost("");
    setItemQuantity("1");
  };

  const handleRemoveStolenItem = (index: number) => {
    setStolenItems(stolenItems.filter((_, i) => i !== index));
  };

  // Function to handle barcode scanning
  const handleBarcodeScanned = async (barcode: string) => {
    try {
      setIsLoadingProduct(true);
      
      // Call to your EAN API to fetch product details
      const response = await fetch(`${process.env.NEXT_PUBLIC_EAN_API_URL}/api/products/${barcode}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_EAN_API_KEY}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Product not found');
      }
      
      const productData = await response.json();
      
      // Update form fields with product data
      setItemProductName(productData.name || '');
      setItemDescription(productData.description || '');
      setItemCategory(productData.category?.toLowerCase() || 'other');
      setItemCost(productData.price?.toString() || '');
      
      toast({
        title: "Product Found",
        description: `${productData.name} has been added to the form`,
        variant: "default"
      });
      
    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        title: "Error",
        description: "Product not found or scanning error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoadingProduct(false);
      setScanningBarcode(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EFF4FF]">
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 py-2 sm:py-4 lg:py-6 max-w-[1600px]">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
          <div className="flex items-start gap-3 w-full sm:w-auto">
            <div className="bg-blue-100 p-2 sm:p-3 rounded-lg shrink-0">
              <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold">Incident Reports</h1>
              <p className="text-sm text-gray-500">Track and manage security incidents across all stores</p>
            </div>
          </div>
          <Button 
            onClick={openNewIncidentDialog}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-sm h-9 sm:h-10"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            New Incident
          </Button>
        </div>

        {/* Summary Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
          <Card className="border border-blue-800 bg-[#1e3a8a] shadow-lg">
            <CardContent className="p-3 sm:p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs sm:text-sm text-blue-100 font-medium">Total Amount Saved</p>
                  <p className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-white">
                    £{totalAmountSaved.toFixed(2)}
                  </p>
                </div>
                <div className="bg-blue-800 bg-opacity-50 p-2 rounded-full">
                  <PoundSterling className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border border-green-800 bg-[#064e3b] shadow-lg">
            <CardContent className="p-3 sm:p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs sm:text-sm text-green-100 font-medium">Unique Stores</p>
                  <p className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-white">{uniqueStores}</p>
                </div>
                <div className="bg-green-800 bg-opacity-50 p-2 rounded-full">
                  <Store className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="col-span-2 lg:col-span-1 border border-purple-800 bg-[#581c87] shadow-lg">
            <CardContent className="p-3 sm:p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs sm:text-sm text-purple-100 font-medium">Total Incidents</p>
                  <p className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-white">{totalIncidents}</p>
                </div>
                <div className="bg-purple-800 bg-opacity-50 p-2 rounded-full">
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Table Card */}
        <Card className="border-gray-200">
          <CardContent className="p-0">
            {/* Search Section */}
            <div className="p-3 sm:p-4 border-b">
              <div className="relative w-full max-w-md mx-auto sm:mx-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search incidents..."
                  className="pl-10 pr-4 py-2 w-full text-sm bg-[#EFF4FF]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Responsive Table Container */}
            <div className="w-full overflow-x-auto">
              <div className="min-w-[320px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px] text-xs font-medium text-gray-600">Date/Time</TableHead>
                      <TableHead className="text-xs font-medium text-gray-600">Site/Incident Type</TableHead>
                      <TableHead className="text-xs font-medium text-gray-600 hidden sm:table-cell">Officer Details</TableHead>
                      <TableHead className="text-xs font-medium text-gray-600 text-right">Value Recovered</TableHead>
                      <TableHead className="w-[100px] text-xs font-medium text-gray-600 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedIncidents.map((incident) => (
                      <TableRow key={incident.id}>
                        <TableCell className="py-2 sm:py-3">
                          <div className="space-y-1">
                            <p className="text-xs sm:text-sm font-medium text-gray-900">
                              {format(incident.date, "dd/MM/yyyy")}
                            </p>
                            <p className="text-xs text-gray-500">
                              {incident.time?.hour?.padStart(2, '0')}:{incident.time?.minute?.padStart(2, '0')}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 sm:py-3">
                          <div className="space-y-1">
                            <p className="text-xs sm:text-sm font-medium text-gray-900">
                              {incident.siteName}
                            </p>
                            <span className={cn(
                              "inline-block px-2 py-0.5 rounded-full text-xs font-medium",
                              incident.incidentType === "Theft" && "bg-red-100 text-red-800",
                              incident.incidentType === "Vandalism" && "bg-orange-100 text-orange-800",
                              incident.incidentType === "Customer Accident" && "bg-yellow-100 text-yellow-800",
                              incident.incidentType === "Suspicious Activity" && "bg-blue-100 text-blue-800",
                              incident.incidentType === "Other" && "bg-gray-100 text-gray-800"
                            )}>
                              {incident.incidentType}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 sm:py-3 hidden sm:table-cell">
                          <div className="space-y-1">
                            <p className="text-xs sm:text-sm font-medium text-gray-900">
                              {incident.officer.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {incident.officer.role}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="py-2 sm:py-3">
                          <div className="text-right space-y-1">
                            <span className={cn(
                              "text-xs sm:text-sm font-medium",
                              incident.valueRecovered > 0 ? "text-green-600" : "text-gray-500"
                            )}>
                              £{incident.valueRecovered?.toFixed(2)}
                            </span>
                            {incident.policeInvolved && (
                              <div className="flex justify-end">
                                <span className="text-xs bg-blue-50 px-2 py-0.5 rounded text-blue-600">
                                  Police Involved
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-2 sm:py-3">
                          <div className="flex justify-end items-center gap-1 sm:gap-2">
                            <Button 
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => openViewIncidentDialog(incident)}
                            >
                              <Eye className="h-3.5 w-3.5 text-blue-600" />
                            </Button>
                            <Button 
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => openEditIncidentDialog(incident)}
                            >
                              <Pencil className="h-3.5 w-3.5 text-amber-600" />
                            </Button>
                            <Button 
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => openDeleteIncidentDialog(incident)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Pagination */}
            {filteredIncidents.length > ITEMS_PER_PAGE && (
              <div className="py-3 px-3 sm:px-4 border-t">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                  <p className="text-xs sm:text-sm text-gray-500 order-2 sm:order-1">
                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredIncidents.length)} of {filteredIncidents.length} incidents
                  </p>
                  <div className="flex items-center gap-2 order-1 sm:order-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
                      disabled={currentPage === 1}
                      className="h-8 text-xs sm:text-sm"
                    >
                      Previous
                    </Button>
                    
                    <div className="hidden sm:flex gap-1">
                      {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
                        const pageNum = currentPage <= 2 ? i + 1 : currentPage - 1 + i;
                        return (
                          <Button
                            key={i}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className={cn(
                              "h-8 w-8 p-0 text-xs",
                              currentPage === pageNum && "bg-blue-600 text-white"
                            )}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                      disabled={currentPage === totalPages}
                      className="h-8 text-xs sm:text-sm"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isViewIncidentDialogOpen} onOpenChange={setIsViewIncidentDialogOpen}>
          <DialogContent className="w-[95vw] max-w-[900px] xl:max-w-[1200px] h-[90vh] overflow-y-auto p-2 sm:p-3 md:p-4 xl:p-6 2xl:p-8">
            {selectedIncident ? (
              <>
                <DialogHeader className="pb-2 sm:pb-4">
                  <DialogTitle className="text-base sm:text-lg xl:text-2xl font-bold flex items-center gap-2">
                    <span className={cn(
                      "inline-block w-3 h-3 rounded-full",
                      selectedIncident.incidentType === "Theft" && "bg-red-500",
                      selectedIncident.incidentType === "Vandalism" && "bg-orange-500",
                      selectedIncident.incidentType === "Customer Accident" && "bg-yellow-500",
                      selectedIncident.incidentType === "Suspicious Activity" && "bg-blue-500",
                      selectedIncident.incidentType === "Other" && "bg-[#EFF4FF]0"
                    )}></span>
                    View Incident Details
                  </DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm xl:text-base text-gray-500">
                    Incident ID: {selectedIncident.id}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Basic Information Card */}
                  <div className="bg-white rounded-md border p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-100">
                        <FileText className="h-3.5 w-3.5 text-blue-600" />
                      </div>
                      <h3 className="font-medium text-base">Basic Information</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium block mb-1">Customer Name</Label>
                        <div className="h-9 px-3 py-1 border rounded-md bg-[#EFF4FF]">
                          <span className="text-sm">{selectedIncident.customer.name}</span>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium block mb-1">Store Name</Label>
                        <div className="h-9 px-3 py-1 border rounded-md bg-[#EFF4FF]">
                          <span className="text-sm">{selectedIncident.siteName}</span>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium block mb-1">Officer Name</Label>
                        <div className="h-9 px-3 py-1 border rounded-md bg-[#EFF4FF]">
                          <span className="text-sm">{selectedIncident.officer.name}</span>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium block mb-1">Officer Role</Label>
                        <div className="h-9 px-3 py-1 border rounded-md bg-[#EFF4FF]">
                          <span className="text-sm">{selectedIncident.officer.role}</span>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium block mb-1">Duty Manager</Label>
                        <div className="h-9 px-3 py-1 border rounded-md bg-[#EFF4FF]">
                          <span className="text-sm">{selectedIncident.dutyManager}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Incident Details Card */}
                  <div className="bg-white rounded-md border p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 flex items-center justify-center rounded-full bg-amber-100">
                        <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                      </div>
                      <h3 className="font-medium text-base">Incident Details</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium block mb-1">Date of Incident</Label>
                        <div className="h-9 px-3 py-1 border rounded-md bg-[#EFF4FF]">
                          <span className="text-sm">{format(selectedIncident.date, "PPP")}</span>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium block mb-1">Time of Incident</Label>
                        <div className="h-9 px-3 py-1 border rounded-md bg-[#EFF4FF]">
                          <span className="text-sm">
                            {selectedIncident.time?.hour?.padStart(2, '0')}:{selectedIncident.time?.minute?.padStart(2, '0')}
                          </span>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium block mb-1">Incident Type</Label>
                        <div className="h-9 px-3 py-1 border rounded-md bg-[#EFF4FF]">
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-sm font-medium",
                            selectedIncident.incidentType === "Theft" && "bg-red-100 text-red-800",
                            selectedIncident.incidentType === "Vandalism" && "bg-orange-100 text-orange-800",
                            selectedIncident.incidentType === "Customer Accident" && "bg-yellow-100 text-yellow-800",
                            selectedIncident.incidentType === "Suspicious Activity" && "bg-blue-100 text-blue-800",
                            selectedIncident.incidentType === "Other" && "bg-gray-100 text-gray-800"
                          )}>
                            {selectedIncident.incidentType}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Description Card */}
                  <div className="bg-white rounded-md border p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 flex items-center justify-center rounded-full bg-green-100">
                        <FileText className="h-3.5 w-3.5 text-green-600" />
                      </div>
                      <h3 className="font-medium text-base">Description</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium block mb-1">Incident Details</Label>
                        <div className="min-h-[80px] p-3 border rounded-md bg-[#EFF4FF]">
                          <span className="text-sm">{selectedIncident.description}</span>
                        </div>
                      </div>
                      
                      {selectedIncident.additionalComments && (
                        <div>
                          <Label className="text-sm font-medium block mb-1">Additional Comments</Label>
                          <div className="min-h-[60px] p-3 border rounded-md bg-[#EFF4FF]">
                            <span className="text-sm">{selectedIncident.additionalComments}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Police Involvement Card */}
                  <div className="bg-white rounded-md border p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-100">
                        <User className="h-3.5 w-3.5 text-blue-600" />
                      </div>
                      <h3 className="font-medium text-base">Police Involvement</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Was police involved?</Label>
                        <RadioGroup
                          value={policeInvolved ? "yes" : "no"}
                          onValueChange={(value) => setPoliceInvolved(value === "yes")}
                          className="mt-2"
                        >
                          <div className="flex items-center space-x-6">
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="yes" id="police-yes" />
                              <Label htmlFor="police-yes">Yes</Label>
                      </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="no" id="police-no" />
                              <Label htmlFor="police-no">No</Label>
                            </div>
                          </div>
                        </RadioGroup>
                      </div>

                      {policeInvolved && (
                        <>
                          <div>
                            <Label className="text-sm font-medium">URN Number</Label>
                            <Input
                              value={urnNumber}
                              onChange={(e) => setUrnNumber(e.target.value)}
                              placeholder="Enter URN number"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Crime Reference Number</Label>
                            <Input
                              value={crimeReferenceNumber}
                              onChange={(e) => setCrimeReferenceNumber(e.target.value)}
                              placeholder="Enter crime reference number"
                              className="mt-1"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Offender Details Card */}
                  {selectedIncident.offenderDetails && Object.keys(selectedIncident.offenderDetails).length > 0 && (
                    <div className="bg-white rounded-md border p-4 shadow-sm lg:col-span-2">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 flex items-center justify-center rounded-full bg-purple-100">
                          <UserCircle className="h-3.5 w-3.5 text-purple-600" />
                        </div>
                        <h3 className="font-medium text-base">Offender Details</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Offender Name</Label>
                          <Input 
                            value={selectedIncident.offenderDetails.name} 
                            onChange={(e) => setOffenderDetails({ ...selectedIncident.offenderDetails, name: e.target.value })}
                            placeholder="Enter offender name"
                          />
                            </div>

                        <div className="space-y-2">
                          <Label>Sex</Label>
                          <Select 
                            value={selectedIncident.offenderDetails.sex} 
                            onValueChange={(value: Incident['offenderDetails']['sex']) => 
                              setOffenderDetails({ ...selectedIncident.offenderDetails, sex: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="N/A or N/K" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="N/A">N/A</SelectItem>
                              <SelectItem value="N/K">N/K</SelectItem>
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          </div>

                        <div className="space-y-2">
                          <Label>Date of Birth</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !selectedIncident.offenderDetails.dateOfBirth && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {selectedIncident.offenderDetails.dateOfBirth ? 
                                  format(selectedIncident.offenderDetails.dateOfBirth, "PPP") : 
                                  <span>Pick a date</span>
                                }
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={selectedIncident.offenderDetails.dateOfBirth}
                                onSelect={(date) => setOffenderDetails({ ...selectedIncident.offenderDetails, dateOfBirth: date })}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="space-y-2">
                          <Label>Address</Label>
                          <Input 
                            value={selectedIncident.offenderDetails.address} 
                            onChange={(e) => setOffenderDetails({ ...selectedIncident.offenderDetails, address: e.target.value })}
                            placeholder="Enter street address"
                          />
                            </div>

                        <div className="space-y-2">
                          <Label>Town</Label>
                          <Input 
                            value={selectedIncident.offenderDetails.town} 
                            onChange={(e) => setOffenderDetails({ ...selectedIncident.offenderDetails, town: e.target.value })}
                            placeholder="Enter town"
                          />
                          </div>

                        <div className="space-y-2">
                          <Label>Post Code</Label>
                          <Input 
                            value={selectedIncident.offenderDetails.postCode} 
                            onChange={(e) => setOffenderDetails({ ...selectedIncident.offenderDetails, postCode: e.target.value })}
                            placeholder="Enter post code"
                          />
                        </div>
                            </div>
                          </div>
                        )}
                        
                  {/* Incident Categories Card */}
                  <div className="bg-white rounded-md border p-4 shadow-sm lg:col-span-3">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 flex items-center justify-center rounded-full bg-amber-100">
                        <FileText className="h-3.5 w-3.5 text-amber-600" />
                            </div>
                      <h3 className="font-medium text-base">Incident Categories</h3>
                          </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="selfScanTills"
                          checked={selectedIncident.categories.selfScanTills}
                          onCheckedChange={(checked) => setCategories({ ...selectedIncident.categories, selfScanTills: checked as boolean })}
                        />
                        <Label htmlFor="selfScanTills">J - Self Scan Tills?</Label>
                            </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="threatsAndIntimidation"
                          checked={selectedIncident.categories.threatsAndIntimidation}
                          onCheckedChange={(checked) => setCategories({ ...selectedIncident.categories, threatsAndIntimidation: checked as boolean })}
                        />
                        <Label htmlFor="threatsAndIntimidation">L - Threats And Intimidation?</Label>
                          </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="banFromStore"
                          checked={selectedIncident.categories.banFromStore}
                          onCheckedChange={(checked) => setCategories({ ...selectedIncident.categories, banFromStore: checked as boolean })}
                        />
                        <Label htmlFor="banFromStore">N - Ban From Store?</Label>
                            </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="scanAndGo"
                          checked={selectedIncident.categories.scanAndGo}
                          onCheckedChange={(checked) => setCategories({ ...selectedIncident.categories, scanAndGo: checked as boolean })}
                        />
                        <Label htmlFor="scanAndGo">M - Scan And Go?</Label>
                          </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="abusiveBehaviour"
                          checked={selectedIncident.categories.abusiveBehaviour}
                          onCheckedChange={(checked) => setCategories({ ...selectedIncident.categories, abusiveBehaviour: checked as boolean })}
                        />
                        <Label htmlFor="abusiveBehaviour">K - Abusive behaviour?</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="policeFailedToAttend"
                          checked={selectedIncident.categories.policeFailedToAttend}
                          onCheckedChange={(checked) => setCategories({ ...selectedIncident.categories, policeFailedToAttend: checked as boolean })}
                        />
                        <Label htmlFor="policeFailedToAttend">Q - Police Failed to Attend?</Label>
                    </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="violentBehaviorPhysical"
                          checked={selectedIncident.categories.violentBehaviorPhysical}
                          onCheckedChange={(checked) => setCategories({ ...selectedIncident.categories, violentBehaviorPhysical: checked as boolean })}
                        />
                        <Label htmlFor="violentBehaviorPhysical">O - Violent Behavior (Physical)?</Label>
                    </div>
                    
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="spitting"
                          checked={selectedIncident.categories.spitting}
                          onCheckedChange={(checked) => setCategories({ ...selectedIncident.categories, spitting: checked as boolean })}
                        />
                        <Label htmlFor="spitting">M - Spitting?</Label>
                          </div>
                    </div>
                  </div>
                  
                  {/* Stolen Items Card */}
                  {selectedIncident.stolenItems.length > 0 && (
                    <div className="bg-white rounded-md border p-4 shadow-sm lg:col-span-3">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 flex items-center justify-center rounded-full bg-red-100">
                          <ShoppingBagIcon className="h-3.5 w-3.5 text-red-600" />
                        </div>
                        <h3 className="font-medium text-base">Stolen Items</h3>
                      </div>
                      
                      <div className="bg-[#EFF4FF] rounded-lg overflow-hidden">
                        <div className="grid grid-cols-12 p-2 text-xs font-medium text-gray-500 bg-gray-100">
                          <div className="col-span-2">Category</div>
                          <div className="col-span-3">Product Name</div>
                          <div className="col-span-2">Description</div>
                          <div className="col-span-2 text-right">Cost</div>
                          <div className="col-span-1 text-center">Qty</div>
                          <div className="col-span-2 text-right">Total</div>
                        </div>
                        {selectedIncident.stolenItems.map((item, index) => (
                          <div key={index} className="grid grid-cols-12 p-2 text-sm border-t border-gray-100">
                            <div className="col-span-2 text-gray-800">{item.category}</div>
                            <div className="col-span-3 text-gray-800 font-medium">{item.productName}</div>
                            <div className="col-span-2 text-gray-800">{item.name}</div>
                            <div className="col-span-2 text-right text-gray-600">£{item.value.toFixed(2)}</div>
                            <div className="col-span-1 text-center text-gray-600">{item.quantity}</div>
                            <div className="col-span-2 text-right text-gray-900 font-medium">£{item.total.toFixed(2)}</div>
                          </div>
                        ))}
                        <div className="grid grid-cols-12 p-2 text-sm border-t border-gray-200 bg-[#EFF4FF]">
                          <div className="col-span-10 text-right font-medium">Total Value:</div>
                          <div className="col-span-2 text-right font-bold text-green-600">
                            £{selectedIncident.stolenItems.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <DialogFooter className="mt-6 sm:mt-8">
                  <Button
                    type="button"
                    onClick={() => setIsViewIncidentDialogOpen(false)}
                    className="text-xs sm:text-sm xl:text-base h-8 sm:h-9 xl:h-11"
                  >
                    Close
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-6">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <AlertCircle className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No Incident Selected</h3>
                <p className="text-sm text-gray-500">Please select an incident to view its details</p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteIncidentDialogOpen} onOpenChange={setIsDeleteIncidentDialogOpen}>
          <DialogContent className="w-[95vw] sm:max-w-[425px] p-4">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-lg font-bold">Confirm Deletion</DialogTitle>
              <DialogDescription className="text-sm text-gray-500">
                Are you sure you want to delete this incident? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            {selectedIncident && (
              <div className="bg-[#EFF4FF] p-4 rounded-lg mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className={cn(
                    "inline-block w-2 h-2 rounded-full",
                    selectedIncident.incidentType === "Theft" && "bg-red-500",
                    selectedIncident.incidentType === "Vandalism" && "bg-orange-500",
                    selectedIncident.incidentType === "Customer Accident" && "bg-yellow-500",
                    selectedIncident.incidentType === "Suspicious Activity" && "bg-blue-500",
                    selectedIncident.incidentType === "Other" && "bg-[#EFF4FF]0"
                  )}></span>
                  <span className="text-sm font-medium">
                    {selectedIncident.incidentType} - {format(selectedIncident.date, "dd/MM/yyyy")}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  {selectedIncident.siteName}
                </p>
                <p className="text-xs text-gray-500 line-clamp-2">
                  {selectedIncident.description}
                </p>
              </div>
            )}
            
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteIncidentDialogOpen(false)}
                className="order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteIncident}
                className="bg-red-600 hover:bg-red-700 order-1 sm:order-2"
              >
                Delete Incident
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditIncidentDialogOpen} onOpenChange={setIsEditIncidentDialogOpen}>
          <DialogContent className="w-[95vw] max-w-[900px] xl:max-w-[1200px] h-[90vh] overflow-y-auto p-2 sm:p-3 md:p-4 xl:p-6 2xl:p-8">
            <DialogHeader className="pb-2 sm:pb-4">
              <DialogTitle className="text-base sm:text-lg xl:text-2xl font-bold">Edit Incident</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm xl:text-base text-gray-500">
                Modify the incident details below.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Basic Information Card */}
              <div className="bg-white rounded-md border p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-100">
                    <FileText className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <h3 className="font-medium text-base">Basic Information</h3>
                </div>
            
            <div className="space-y-4">
              <div>
                    <Label className="text-sm font-medium">Customer Name</Label>
                  <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter customer name"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Store Name</Label>
                    <Input 
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      placeholder="Enter store name"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Officer Name</Label>
                    <Input 
                      value={officerName}
                      onChange={(e) => setOfficerName(e.target.value)}
                      placeholder="Enter officer name"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Officer Role</Label>
                    <Input 
                      value={officerRole}
                      onChange={(e) => setOfficerRole(e.target.value)}
                      placeholder="Enter officer role"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Duty Manager</Label>
                    <Input 
                      value={dutyManagerName}
                      onChange={(e) => setDutyManagerName(e.target.value)}
                      placeholder="Enter duty manager name"
                    />
                  </div>
                </div>
              </div>
              
              {/* Incident Details Card */}
              <div className="bg-white rounded-md border p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 flex items-center justify-center rounded-full bg-amber-100">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <h3 className="font-medium text-base">Incident Details</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Date of Incident</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !incidentDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {incidentDate ? format(incidentDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={incidentDate}
                          onSelect={setIncidentDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-sm font-medium">Hour</Label>
                      <Input 
                        type="number"
                        min="0"
                        max="23"
                        value={incidentTime.hour}
                        onChange={(e) => setIncidentTime({ ...incidentTime, hour: e.target.value })}
                        placeholder="HH"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Minute</Label>
                      <Input 
                        type="number"
                        min="0"
                        max="59"
                        value={incidentTime.minute}
                        onChange={(e) => setIncidentTime({ ...incidentTime, minute: e.target.value })}
                        placeholder="MM"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Incident Type</Label>
                    <Select value={incidentType} onValueChange={(value: IncidentType) => setIncidentType(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select incident type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Theft">Theft</SelectItem>
                        <SelectItem value="Vandalism">Vandalism</SelectItem>
                        <SelectItem value="Customer Accident">Customer Accident</SelectItem>
                        <SelectItem value="Suspicious Activity">Suspicious Activity</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              {/* Description Card */}
              <div className="bg-white rounded-md border p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 flex items-center justify-center rounded-full bg-green-100">
                    <FileText className="h-3.5 w-3.5 text-green-600" />
                  </div>
                  <h3 className="font-medium text-base">Description</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Incident Details</Label>
                    <Textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter incident details"
                      className="min-h-[100px]"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Additional Comments</Label>
                    <Textarea 
                      value={otherComments}
                      onChange={(e) => setOtherComments(e.target.value)}
                      placeholder="Enter any additional comments"
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
              </div>

              {/* Police Involvement Card */}
              <div className="bg-white rounded-md border p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-100">
                    <User className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <h3 className="font-medium text-base">Police Involvement</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Was police involved?</Label>
                    <RadioGroup
                      value={policeInvolved ? "yes" : "no"}
                      onValueChange={(value) => setPoliceInvolved(value === "yes")}
                      className="mt-2"
                    >
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="police-yes" />
                          <Label htmlFor="police-yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="police-no" />
                          <Label htmlFor="police-no">No</Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  {policeInvolved && (
                    <>
                      <div>
                        <Label className="text-sm font-medium">URN Number</Label>
                        <Input
                          value={urnNumber}
                          onChange={(e) => setUrnNumber(e.target.value)}
                          placeholder="Enter URN number"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Crime Reference Number</Label>
                        <Input
                          value={crimeReferenceNumber}
                          onChange={(e) => setCrimeReferenceNumber(e.target.value)}
                          placeholder="Enter crime reference number"
                          className="mt-1"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Offender Details Card */}
              <div className="bg-white rounded-md border p-4 shadow-sm lg:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 flex items-center justify-center rounded-full bg-purple-100">
                    <UserCircle className="h-3.5 w-3.5 text-purple-600" />
                  </div>
                  <h3 className="font-medium text-base">Offender Details</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Offender Name</Label>
                    <Input 
                      value={offenderDetails.name} 
                      onChange={(e) => setOffenderDetails({ ...offenderDetails, name: e.target.value })}
                      placeholder="Enter offender name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Sex</Label>
                    <Select 
                      value={offenderDetails.sex} 
                      onValueChange={(value: Incident['offenderDetails']['sex']) => 
                        setOffenderDetails({ ...offenderDetails, sex: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="N/A or N/K" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="N/A">N/A</SelectItem>
                        <SelectItem value="N/K">N/K</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !offenderDetails.dateOfBirth && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {offenderDetails.dateOfBirth ? 
                            format(offenderDetails.dateOfBirth, "PPP") : 
                            <span>Pick a date</span>
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={offenderDetails.dateOfBirth}
                          onSelect={(date) => setOffenderDetails({ ...offenderDetails, dateOfBirth: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input 
                      value={offenderDetails.address} 
                      onChange={(e) => setOffenderDetails({ ...offenderDetails, address: e.target.value })}
                      placeholder="Enter street address"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Town</Label>
                    <Input 
                      value={offenderDetails.town} 
                      onChange={(e) => setOffenderDetails({ ...offenderDetails, town: e.target.value })}
                      placeholder="Enter town"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Post Code</Label>
                    <Input 
                      value={offenderDetails.postCode} 
                      onChange={(e) => setOffenderDetails({ ...offenderDetails, postCode: e.target.value })}
                      placeholder="Enter post code"
                    />
                  </div>
                </div>
              </div>

              {/* Incident Categories Card */}
              <div className="bg-white rounded-md border p-4 shadow-sm lg:col-span-3">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 flex items-center justify-center rounded-full bg-amber-100">
                    <FileText className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <h3 className="font-medium text-base">Incident Categories</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="selfScanTills"
                      checked={categories.selfScanTills}
                      onCheckedChange={(checked) => setCategories({ ...categories, selfScanTills: checked as boolean })}
                    />
                    <Label htmlFor="selfScanTills">J - Self Scan Tills?</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="threatsAndIntimidation"
                      checked={categories.threatsAndIntimidation}
                      onCheckedChange={(checked) => setCategories({ ...categories, threatsAndIntimidation: checked as boolean })}
                    />
                    <Label htmlFor="threatsAndIntimidation">L - Threats And Intimidation?</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="banFromStore"
                      checked={categories.banFromStore}
                      onCheckedChange={(checked) => setCategories({ ...categories, banFromStore: checked as boolean })}
                    />
                    <Label htmlFor="banFromStore">N - Ban From Store?</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="scanAndGo"
                      checked={categories.scanAndGo}
                      onCheckedChange={(checked) => setCategories({ ...categories, scanAndGo: checked as boolean })}
                    />
                    <Label htmlFor="scanAndGo">M - Scan And Go?</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="abusiveBehaviour"
                      checked={categories.abusiveBehaviour}
                      onCheckedChange={(checked) => setCategories({ ...categories, abusiveBehaviour: checked as boolean })}
                    />
                    <Label htmlFor="abusiveBehaviour">K - Abusive behaviour?</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="policeFailedToAttend"
                      checked={categories.policeFailedToAttend}
                      onCheckedChange={(checked) => setCategories({ ...categories, policeFailedToAttend: checked as boolean })}
                    />
                    <Label htmlFor="policeFailedToAttend">Q - Police Failed to Attend?</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="violentBehaviorPhysical"
                      checked={categories.violentBehaviorPhysical}
                      onCheckedChange={(checked) => setCategories({ ...categories, violentBehaviorPhysical: checked as boolean })}
                    />
                    <Label htmlFor="violentBehaviorPhysical">O - Violent Behavior (Physical)?</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="spitting"
                      checked={categories.spitting}
                      onCheckedChange={(checked) => setCategories({ ...categories, spitting: checked as boolean })}
                    />
                    <Label htmlFor="spitting">M - Spitting?</Label>
                  </div>
                </div>
              </div>

              {/* Stolen Items Card */}
              <div className="bg-white rounded-md border p-4 shadow-sm lg:col-span-3">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 flex items-center justify-center rounded-full bg-red-100">
                      <ShoppingBagIcon className="h-3.5 w-3.5 text-red-600" />
                    </div>
                    <h3 className="font-medium text-base">Stolen Items</h3>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setScanningBarcode(true)}
                    className="h-8"
                  >
                    <QrCode className="h-3.5 w-3.5 mr-2" />
                    Scan Barcode
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                      <Label>Category</Label>
                      <Input 
                        value={itemCategory}
                        onChange={(e) => setItemCategory(e.target.value)}
                        placeholder="Item category"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input 
                        value={itemDescription}
                        onChange={(e) => setItemDescription(e.target.value)}
                        placeholder="Item description"
                      />
                    </div>
                    <div>
                      <Label>Product Name</Label>
                      <Input 
                        value={itemProductName}
                        onChange={(e) => setItemProductName(e.target.value)}
                        placeholder="Product name"
                      />
                    </div>
                    <div>
                      <Label>Cost</Label>
                      <Input 
                        type="number"
                        value={itemCost}
                        onChange={(e) => setItemCost(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>Quantity</Label>
                      <Input 
                        type="number"
                        value={itemQuantity}
                        onChange={(e) => setItemQuantity(e.target.value)}
                        placeholder="1"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={handleAddStolenItem}
                      size="sm"
                      className="h-8"
                    >
                      <Plus className="h-3.5 w-3.5 mr-2" />
                      Add Item
                    </Button>
                  </div>

                  {stolenItems.length > 0 && (
                    <div className="bg-[#EFF4FF] rounded-lg overflow-hidden mt-4">
                      <div className="grid grid-cols-12 p-2 text-xs font-medium text-gray-500 bg-gray-100">
                        <div className="col-span-2">Category</div>
                        <div className="col-span-3">Product Name</div>
                        <div className="col-span-2">Description</div>
                        <div className="col-span-2 text-right">Cost</div>
                        <div className="col-span-1 text-center">Qty</div>
                        <div className="col-span-1 text-right">Total</div>
                        <div className="col-span-1"></div>
                      </div>
                      {stolenItems.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 p-2 text-sm border-t border-gray-100">
                          <div className="col-span-2 text-gray-800">{item.category}</div>
                          <div className="col-span-3 text-gray-800 font-medium">{item.productName}</div>
                          <div className="col-span-2 text-gray-800">{item.name}</div>
                          <div className="col-span-2 text-right text-gray-600">£{item.value.toFixed(2)}</div>
                          <div className="col-span-1 text-center text-gray-600">{item.quantity}</div>
                          <div className="col-span-1 text-right text-gray-900 font-medium">£{item.total.toFixed(2)}</div>
                          <div className="col-span-1 flex justify-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveStolenItem(index)}
                              className="h-6 w-6 p-0"
                            >
                              <TrashIcon className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <div className="grid grid-cols-12 p-2 text-sm border-t border-gray-200 bg-[#EFF4FF]">
                        <div className="col-span-10 text-right font-medium">Total Value:</div>
                        <div className="col-span-2 text-right font-bold text-green-600">
                          £{stolenItems.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6 sm:mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditIncidentDialogOpen(false)}
                className="text-xs sm:text-sm xl:text-base h-8 sm:h-9 xl:h-11"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleEditIncident}
                className="text-xs sm:text-sm xl:text-base h-8 sm:h-9 xl:h-11"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <BarcodeScanner
          isOpen={scanningBarcode}
          onClose={() => setScanningBarcode(false)}
          onScan={handleBarcodeScanned}
        />

        <Dialog open={isNewIncidentDialogOpen} onOpenChange={setIsNewIncidentDialogOpen}>
          <DialogContent className="w-[95vw] max-w-[900px] xl:max-w-[1200px] h-[90vh] overflow-y-auto p-2 sm:p-3 md:p-4 xl:p-6 2xl:p-8">
            <DialogHeader className="pb-2 sm:pb-4">
              <DialogTitle className="text-base sm:text-lg xl:text-2xl font-bold">Create New Incident</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm xl:text-base text-gray-500">
                Fill in the details below to create a new incident report.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Basic Information Card */}
              <div className="bg-white rounded-md border p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-100">
                    <FileText className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <h3 className="font-medium text-base">Basic Information</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Customer Name</Label>
                    <Input 
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter customer name"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Store Name</Label>
                    <Input 
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      placeholder="Enter store name"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Officer Name</Label>
                    <Input 
                      value={officerName}
                      onChange={(e) => setOfficerName(e.target.value)}
                      placeholder="Enter officer name"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Officer Role</Label>
                    <Input 
                      value={officerRole}
                      onChange={(e) => setOfficerRole(e.target.value)}
                      placeholder="Enter officer role"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Duty Manager</Label>
                    <Input 
                      value={dutyManagerName}
                      onChange={(e) => setDutyManagerName(e.target.value)}
                      placeholder="Enter duty manager name"
                    />
                  </div>
                </div>
              </div>
              
              {/* Incident Details Card */}
              <div className="bg-white rounded-md border p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 flex items-center justify-center rounded-full bg-amber-100">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <h3 className="font-medium text-base">Incident Details</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Date of Incident</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                    variant="outline"
                    className={cn(
                            "w-full justify-start text-left font-normal",
                            !incidentDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {incidentDate ? format(incidentDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={incidentDate}
                          onSelect={setIncidentDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-sm font-medium">Hour</Label>
                      <Input 
                        type="number"
                        min="0"
                        max="23"
                        value={incidentTime.hour}
                        onChange={(e) => setIncidentTime({ ...incidentTime, hour: e.target.value })}
                        placeholder="HH"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Minute</Label>
                      <Input 
                        type="number"
                        min="0"
                        max="59"
                        value={incidentTime.minute}
                        onChange={(e) => setIncidentTime({ ...incidentTime, minute: e.target.value })}
                        placeholder="MM"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Incident Type</Label>
                    <Select value={incidentType} onValueChange={(value: IncidentType) => setIncidentType(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select incident type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Theft">Theft</SelectItem>
                        <SelectItem value="Vandalism">Vandalism</SelectItem>
                        <SelectItem value="Customer Accident">Customer Accident</SelectItem>
                        <SelectItem value="Suspicious Activity">Suspicious Activity</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              {/* Description Card */}
              <div className="bg-white rounded-md border p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 flex items-center justify-center rounded-full bg-green-100">
                    <FileText className="h-3.5 w-3.5 text-green-600" />
                  </div>
                  <h3 className="font-medium text-base">Description</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Incident Details</Label>
                    <Textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter incident details"
                      className="min-h-[100px]"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Additional Comments</Label>
                    <Textarea 
                      value={otherComments}
                      onChange={(e) => setOtherComments(e.target.value)}
                      placeholder="Enter any additional comments"
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
              </div>

              {/* Police Involvement Card */}
              <div className="bg-white rounded-md border p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-100">
                    <User className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <h3 className="font-medium text-base">Police Involvement</h3>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Was police involved?</Label>
                    <RadioGroup
                      value={policeInvolved ? "yes" : "no"}
                      onValueChange={(value) => setPoliceInvolved(value === "yes")}
                      className="mt-2"
                    >
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id="police-yes" />
                          <Label htmlFor="police-yes">Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id="police-no" />
                          <Label htmlFor="police-no">No</Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  {policeInvolved && (
                    <>
                      <div>
                        <Label className="text-sm font-medium">URN Number</Label>
                        <Input
                          value={urnNumber}
                          onChange={(e) => setUrnNumber(e.target.value)}
                          placeholder="Enter URN number"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Crime Reference Number</Label>
                        <Input
                          value={crimeReferenceNumber}
                          onChange={(e) => setCrimeReferenceNumber(e.target.value)}
                          placeholder="Enter crime reference number"
                          className="mt-1"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Offender Details Card */}
              <div className="bg-white rounded-md border p-4 shadow-sm lg:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 flex items-center justify-center rounded-full bg-purple-100">
                    <UserCircle className="h-3.5 w-3.5 text-purple-600" />
                  </div>
                  <h3 className="font-medium text-base">Offender Details</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Offender Name</Label>
                    <Input 
                      value={offenderDetails.name} 
                      onChange={(e) => setOffenderDetails({ ...offenderDetails, name: e.target.value })}
                      placeholder="Enter offender name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Sex</Label>
                    <Select 
                      value={offenderDetails.sex} 
                      onValueChange={(value: Incident['offenderDetails']['sex']) => 
                        setOffenderDetails({ ...offenderDetails, sex: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="N/A or N/K" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="N/A">N/A</SelectItem>
                        <SelectItem value="N/K">N/K</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !offenderDetails.dateOfBirth && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {offenderDetails.dateOfBirth ? 
                            format(offenderDetails.dateOfBirth, "PPP") : 
                            <span>Pick a date</span>
                          }
                  </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={offenderDetails.dateOfBirth}
                          onSelect={(date) => setOffenderDetails({ ...offenderDetails, dateOfBirth: date })}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                </div>

                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input 
                      value={offenderDetails.address} 
                      onChange={(e) => setOffenderDetails({ ...offenderDetails, address: e.target.value })}
                      placeholder="Enter street address"
                    />
              </div>
              
                  <div className="space-y-2">
                    <Label>Town</Label>
                    <Input 
                      value={offenderDetails.town} 
                      onChange={(e) => setOffenderDetails({ ...offenderDetails, town: e.target.value })}
                      placeholder="Enter town"
                    />
              </div>
              
                  <div className="space-y-2">
                    <Label>Post Code</Label>
                    <Input 
                      value={offenderDetails.postCode} 
                      onChange={(e) => setOffenderDetails({ ...offenderDetails, postCode: e.target.value })}
                      placeholder="Enter post code"
                    />
                  </div>
                </div>
              </div>

              {/* Incident Categories Card */}
              <div className="bg-white rounded-md border p-4 shadow-sm lg:col-span-3">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 flex items-center justify-center rounded-full bg-amber-100">
                    <FileText className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <h3 className="font-medium text-base">Incident Categories</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="selfScanTills"
                      checked={categories.selfScanTills}
                      onCheckedChange={(checked) => setCategories({ ...categories, selfScanTills: checked as boolean })}
                    />
                    <Label htmlFor="selfScanTills">J - Self Scan Tills?</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="threatsAndIntimidation"
                      checked={categories.threatsAndIntimidation}
                      onCheckedChange={(checked) => setCategories({ ...categories, threatsAndIntimidation: checked as boolean })}
                    />
                    <Label htmlFor="threatsAndIntimidation">L - Threats And Intimidation?</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="banFromStore"
                      checked={categories.banFromStore}
                      onCheckedChange={(checked) => setCategories({ ...categories, banFromStore: checked as boolean })}
                    />
                    <Label htmlFor="banFromStore">N - Ban From Store?</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="scanAndGo"
                      checked={categories.scanAndGo}
                      onCheckedChange={(checked) => setCategories({ ...categories, scanAndGo: checked as boolean })}
                    />
                    <Label htmlFor="scanAndGo">M - Scan And Go?</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="abusiveBehaviour"
                      checked={categories.abusiveBehaviour}
                      onCheckedChange={(checked) => setCategories({ ...categories, abusiveBehaviour: checked as boolean })}
                    />
                    <Label htmlFor="abusiveBehaviour">K - Abusive behaviour?</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="policeFailedToAttend"
                      checked={categories.policeFailedToAttend}
                      onCheckedChange={(checked) => setCategories({ ...categories, policeFailedToAttend: checked as boolean })}
                    />
                    <Label htmlFor="policeFailedToAttend">Q - Police Failed to Attend?</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="violentBehaviorPhysical"
                      checked={categories.violentBehaviorPhysical}
                      onCheckedChange={(checked) => setCategories({ ...categories, violentBehaviorPhysical: checked as boolean })}
                    />
                    <Label htmlFor="violentBehaviorPhysical">O - Violent Behavior (Physical)?</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="spitting"
                      checked={categories.spitting}
                      onCheckedChange={(checked) => setCategories({ ...categories, spitting: checked as boolean })}
                    />
                    <Label htmlFor="spitting">M - Spitting?</Label>
                  </div>
                </div>
              </div>

              {/* Stolen Items Card */}
              <div className="bg-white rounded-md border p-4 shadow-sm lg:col-span-3">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 flex items-center justify-center rounded-full bg-red-100">
                      <ShoppingBagIcon className="h-3.5 w-3.5 text-red-600" />
                    </div>
                    <h3 className="font-medium text-base">Stolen Items</h3>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setScanningBarcode(true)}
                    className="h-8"
                  >
                    <QrCode className="h-3.5 w-3.5 mr-2" />
                    Scan Barcode
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                      <Label>Category</Label>
                      <Input 
                        value={itemCategory}
                        onChange={(e) => setItemCategory(e.target.value)}
                        placeholder="Item category"
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input 
                        value={itemDescription}
                        onChange={(e) => setItemDescription(e.target.value)}
                        placeholder="Item description"
                      />
                    </div>
                    <div>
                      <Label>Product Name</Label>
                      <Input 
                        value={itemProductName}
                        onChange={(e) => setItemProductName(e.target.value)}
                        placeholder="Product name"
                      />
                    </div>
                    <div>
                      <Label>Cost</Label>
                      <Input 
                        type="number"
                        value={itemCost}
                        onChange={(e) => setItemCost(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>Quantity</Label>
                      <Input 
                        type="number"
                        value={itemQuantity}
                        onChange={(e) => setItemQuantity(e.target.value)}
                        placeholder="1"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={handleAddStolenItem}
                      size="sm"
                      className="h-8"
                    >
                      <Plus className="h-3.5 w-3.5 mr-2" />
                      Add Item
                    </Button>
                  </div>

                  {stolenItems.length > 0 && (
                    <div className="bg-[#EFF4FF] rounded-lg overflow-hidden mt-4">
                      <div className="grid grid-cols-12 p-2 text-xs font-medium text-gray-500 bg-gray-100">
                        <div className="col-span-2">Category</div>
                        <div className="col-span-3">Product Name</div>
                        <div className="col-span-2">Description</div>
                        <div className="col-span-2 text-right">Cost</div>
                        <div className="col-span-1 text-center">Qty</div>
                        <div className="col-span-1 text-right">Total</div>
                        <div className="col-span-1"></div>
                      </div>
                      {stolenItems.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 p-2 text-sm border-t border-gray-100">
                          <div className="col-span-2 text-gray-800">{item.category}</div>
                          <div className="col-span-3 text-gray-800 font-medium">{item.productName}</div>
                          <div className="col-span-2 text-gray-800">{item.name}</div>
                          <div className="col-span-2 text-right text-gray-600">£{item.value.toFixed(2)}</div>
                          <div className="col-span-1 text-center text-gray-600">{item.quantity}</div>
                          <div className="col-span-1 text-right text-gray-900 font-medium">£{item.total.toFixed(2)}</div>
                          <div className="col-span-1 flex justify-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveStolenItem(index)}
                              className="h-6 w-6 p-0"
                            >
                              <TrashIcon className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <div className="grid grid-cols-12 p-2 text-sm border-t border-gray-200 bg-[#EFF4FF]">
                        <div className="col-span-10 text-right font-medium">Total Value:</div>
                        <div className="col-span-2 text-right font-bold text-green-600">
                          £{stolenItems.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                        </div>
                  </div>
                </div>
              )}
                </div>
              </div>
            </div>
            
            <DialogFooter className="mt-6 sm:mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsNewIncidentDialogOpen(false)}
                className="text-xs sm:text-sm xl:text-base h-8 sm:h-9 xl:h-11"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleCreateIncident}
                className="text-xs sm:text-sm xl:text-base h-8 sm:h-9 xl:h-11"
              >
                Create Incident
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default IncidentsReportPage;
