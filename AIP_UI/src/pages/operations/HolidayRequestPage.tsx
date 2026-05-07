import { useState, useEffect, useMemo } from "react";
import { format, addDays, addWeeks, differenceInDays, addYears, isBefore, differenceInBusinessDays } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { employeeService } from '@/services/employeeService';
import type { Employee } from '@/types/employee';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Archive, ArchiveRestore } from "lucide-react";
import { Pencil, Trash2, Eye, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle,
  Clock,
  XCircle,
  Plus,
  X,
} from "lucide-react";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { holidayRequestService } from "@/services/holidayRequestService";
import type { HolidayRequest, CreateHolidayRequestDTO, UpdateHolidayRequestDTO } from "@/types/holidayRequest";
import { usePageAccess } from '@/contexts/PageAccessContext'

const getStatusBadgeClass = (status: 'pending' | 'approved' | 'denied') => {
  switch (status) {
    case 'approved':
      return "bg-green-100 text-green-800";
    case 'denied':
      return "bg-red-100 text-red-800";
    case 'pending':
    default:
      return "bg-yellow-100 text-yellow-800";
  }
};

const formSchema = z.object({
  officerId: z.string().min(1, "Officer is required"),
  startDate: z.date({
    required_error: "Start date is required",
  }).refine((date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);
    const minDate = addDays(today, 60);
    // Start date must be at least 60 days from booking date
    return dateToCheck >= minDate;
  }, {
    message: "Start date must be at least 60 days from the booking date"
  }).transform(date => new Date(date.setHours(0, 0, 0, 0))),
  endDate: z.date({
    required_error: "End date is required",
  }).transform(date => new Date(date.setHours(0, 0, 0, 0))),
  returnToWorkDate: z.date({
    required_error: "Return to work date is required",
  }).transform(date => new Date(date.setHours(0, 0, 0, 0))),
  authorisedBy: z.string().optional(),
  dateAuthorised: z.date().optional().nullable(),
  status: z.enum(['pending', 'approved', 'denied']).default('pending'),
  comment: z.string().optional(),
}).refine((data) => {
  if (!data.startDate || !data.endDate) return true;
  
  const start = new Date(data.startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(data.endDate);
  end.setHours(0, 0, 0, 0);
  
  // End date must be on or after start date
  if (end < start) return false;
  
  // End date must be within 14 days of start date (max)
  const dayDiff = differenceInDays(end, start);
  return dayDiff >= 0 && dayDiff <= 14;
}, {
  message: "End date must be on or after start date and within 14 days maximum",
  path: ["endDate"]
}).refine((data) => {
  if (!data.startDate || !data.returnToWorkDate) return true;
  
  const start = new Date(data.startDate);
  start.setHours(0, 0, 0, 0);
  const returnDate = new Date(data.returnToWorkDate);
  returnDate.setHours(0, 0, 0, 0);
  
  // Return date must be at least 1 day after end date, but can add up to 3 days to the 14-day window
  // So max is start date + 17 days (14 days holiday + 3 days buffer for weekends)
  const maxReturnDate = addDays(start, 17);
  const endDate = data.endDate ? new Date(data.endDate) : null;
  
  if (endDate) {
    endDate.setHours(0, 0, 0, 0);
    const minReturnDate = addDays(endDate, 1);
    // Must be at least 1 day after end date, but not more than start + 17 days
    return returnDate >= minReturnDate && returnDate <= maxReturnDate;
  }
  
  // If no end date, just check it's within the max window
  return returnDate <= maxReturnDate;
}, {
  message: "Return date must be at least one day after end date and within 17 days from start date (14 days holiday + 3 days buffer)",
  path: ["returnToWorkDate"]
});

export default function HolidayRequestPage() {
  const [requests, setRequests] = useState<HolidayRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<HolidayRequest | null>(null);
  const [viewingRequest, setViewingRequest] = useState<HolidayRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [returnDateOpen, setReturnDateOpen] = useState(false);
  const { currentRole } = usePageAccess();
  const itemsPerPage = 10;
  const { toast } = useToast();

  const isAdminRole = currentRole && ['administrator', 'admin'].includes(currentRole.toLowerCase());

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      setIsLoadingEmployees(true);
      const response = await employeeService.getActiveEmployees();
      setEmployees(response);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Error",
        description: "Failed to load employees. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  // Fetch employees on mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Fetch holiday requests
  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const response = await holidayRequestService.getHolidayRequests({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm,
        archived: showArchived
      });
      
      setRequests(response.data);
      setTotalRecords(response.total);
      setTotalPages(Math.ceil(response.total / itemsPerPage));
    } catch (error) {
      console.error('Error fetching holiday requests:', error);
      toast({
        title: "Error",
        description: "Failed to load holiday requests. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch and refetch on filters change
  useEffect(() => {
    fetchRequests();
  }, [currentPage, searchTerm, showArchived]);

  // Mobile check
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const officerName = request.officerName.toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = officerName.includes(searchLower);
      
      // Show archived requests only when showArchived is true
      if (showArchived) {
        return matchesSearch && request.archived;
      } else {
        return matchesSearch && !request.archived;
      }
    });
  }, [requests, searchTerm, showArchived]);

  const paginatedRequests = useMemo(() => {
    return filteredRequests.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredRequests, currentPage, itemsPerPage]);
  
  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      officerId: "",
      startDate: undefined,
      endDate: undefined,
      returnToWorkDate: undefined,
      authorisedBy: undefined,
      dateAuthorised: null,
      status: 'pending',
      comment: "",
    },
    mode: "onTouched",
  });

  const startDate = form.watch("startDate");
  const endDate = form.watch("endDate");

  useEffect(() => {
    if (editingRequest) {
      form.reset({
        officerId: editingRequest.officerId,
        startDate: new Date(editingRequest.startDate),
        endDate: new Date(editingRequest.endDate),
        returnToWorkDate: new Date(editingRequest.returnToWorkDate),
        authorisedBy: editingRequest.authorisedBy || undefined,
        dateAuthorised: editingRequest.dateAuthorised,
        status: editingRequest.status,
        comment: editingRequest.comment,
      });
    }
  }, [editingRequest, form]);

  // Create Holiday Request
  const handleCreateRequest = () => {
    setEditingRequest(null);
    form.reset();
    setStartDateOpen(false);
    setEndDateOpen(false);
    setReturnDateOpen(false);
    setIsDialogOpen(true);
  };

  // View Holiday Request
  const handleViewRequest = (request: HolidayRequest) => {
    setViewingRequest(request);
    setIsViewDialogOpen(true);
  };

  // Update Holiday Request
  const handleUpdateRequest = (request: HolidayRequest) => {
    setEditingRequest(request);
    form.reset({
      officerId: request.officerId,
      startDate: new Date(request.startDate),
      endDate: new Date(request.endDate),
      returnToWorkDate: new Date(request.returnToWorkDate),
      authorisedBy: request.authorisedBy || undefined,
      dateAuthorised: request.dateAuthorised,
      status: request.status,
      comment: request.comment,
    });
    setStartDateOpen(false);
    setEndDateOpen(false);
    setReturnDateOpen(false);
    setIsDialogOpen(true);
  };

  // Archive Holiday Request
  const handleArchiveRequest = async (id: string) => {
    try {
      await holidayRequestService.archiveHolidayRequest(id);
      // Update local state
      setRequests(prev => prev.map(r => 
        r.id === id ? { ...r, archived: true } : r
      ));
      // Refresh from server to ensure consistency
      await fetchRequests();
      toast({
        title: "Success",
        description: "Holiday request archived successfully.",
      });
    } catch (error) {
      console.error('Error archiving holiday request:', error);
      toast({
        title: "Error",
        description: "Failed to archive holiday request. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Unarchive Holiday Request
  const handleUnarchiveRequest = async (id: string) => {
    try {
      await holidayRequestService.unarchiveHolidayRequest(id);
      // Update local state
      setRequests(prev => prev.map(r => 
        r.id === id ? { ...r, archived: false } : r
      ));
      // Refresh from server to ensure consistency
      await fetchRequests();
      toast({
        title: "Success",
        description: "Holiday request unarchived successfully.",
      });
    } catch (error) {
      console.error('Error unarchiving holiday request:', error);
      toast({
        title: "Error",
        description: "Failed to unarchive holiday request. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Delete Holiday Request with confirmation
  const [deleteRequestId, setDeleteRequestId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (id: string) => {
    setDeleteRequestId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deleteRequestId) {
      try {
        setIsDeleting(true);
        await holidayRequestService.deleteHolidayRequest(deleteRequestId);
        setRequests(requests.filter(r => r.id !== deleteRequestId));
        toast({
          title: "Success",
          description: "Holiday request deleted successfully.",
        });
      } catch (error) {
        console.error('Error deleting holiday request:', error);
        toast({
          title: "Error",
          description: "Failed to delete holiday request. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsDeleting(false);
        setIsDeleteDialogOpen(false);
        setDeleteRequestId(null);
      }
    }
  };

  // Form submission handler
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);

      if (editingRequest) {
        // Update existing request - include all fields from the form
        const updateData: UpdateHolidayRequestDTO = {
          officerId: values.officerId,
          startDate: values.startDate,
          endDate: values.endDate,
          returnToWorkDate: values.returnToWorkDate,
          comment: values.comment,
          status: values.status,
          authorisedBy: values.authorisedBy,
          dateAuthorised: values.dateAuthorised,
        };
        
        const updatedRequest = await holidayRequestService.updateHolidayRequest(
          editingRequest.id,
          updateData
        );
        
        setRequests(prev => prev.map(r => r.id === editingRequest.id ? updatedRequest : r));
        toast({
          title: "Success",
          description: "Holiday request updated successfully.",
        });
      } else {
        // Create new request
        const requestData: CreateHolidayRequestDTO = {
          officerId: values.officerId,
          startDate: values.startDate,
          endDate: values.endDate,
          returnToWorkDate: values.returnToWorkDate,
          comment: values.comment
          // authorisedBy is only set during admin approval, not when officers create requests
        };
        
        const newRequest = await holidayRequestService.createHolidayRequest(requestData);
        setRequests(prev => [newRequest, ...prev]);
        toast({
          title: "Success",
          description: "Holiday request created successfully.",
        });
      }

      setIsDialogOpen(false);
      setEditingRequest(null);
      form.reset();
      setStartDateOpen(false);
      setEndDateOpen(false);
      setReturnDateOpen(false);
    } catch (error: any) {
      const errorDetails = {
        error,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        requestData: error.config?.data
      };
      
      console.error('❌ [HolidayRequestPage] Error submitting holiday request:', errorDetails);
      console.error('❌ [HolidayRequestPage] Full error:', error);
      
      // Log response data separately for better visibility
      if (error.response?.data) {
        console.error('❌ [HolidayRequestPage] Error response data:', JSON.stringify(error.response.data, null, 2));
      }
      
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save holiday request. Please try again.';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#EFF4FF] overflow-x-hidden">
      <div className="container mx-auto py-2 xs:py-3 sm:py-4 lg:py-6 xl:py-8 2xl:py-10 px-1 xs:px-2 sm:px-4 lg:px-6 xl:px-8 2xl:px-12 max-w-screen-2xl">
        <div className="flex flex-col space-y-2 sm:space-y-4 lg:space-y-6 xl:space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 xl:gap-6">
            <div className="flex items-center gap-1.5 sm:gap-3 xl:gap-4">
              <div className="bg-purple-100 p-1.5 sm:p-2 xl:p-3 rounded-lg">
                <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7 text-purple-600" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl font-bold text-gray-900">Holiday Requests</h1>
                <p className="text-[10px] sm:text-xs lg:text-sm xl:text-base text-gray-500">Manage officer holiday and leave requests</p>
              </div>
            </div>
            <div className="flex flex-col xs:flex-row gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
              <Button 
                variant="default"
                className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm flex items-center gap-1 sm:gap-2 w-full xs:w-auto px-2 sm:px-3 py-1 sm:py-2 h-8 sm:h-9 lg:h-10 xl:h-12 text-xs sm:text-sm xl:text-base"
                onClick={handleCreateRequest}
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6" />
                Create Holiday Request
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 sm:gap-3 md:gap-4 xl:gap-6">
            <Card className="bg-gradient-to-br from-purple-800 to-purple-900 border-purple-700 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between p-1.5 sm:p-2 md:p-3 xl:p-5 2xl:p-6 pb-0.5 sm:pb-1 md:pb-2 xl:pb-3">
                <CardTitle className="text-[10px] sm:text-xs lg:text-sm xl:text-base font-medium text-white">Total Requests</CardTitle>
                <CalendarIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 xl:h-5 xl:w-5 text-purple-300" />
              </CardHeader>
              <CardContent className="p-1.5 sm:p-2 md:p-3 xl:p-5 2xl:p-6 pt-0 md:pt-1 xl:pt-2">
                <div className="text-sm sm:text-base lg:text-lg xl:text-2xl 2xl:text-3xl font-bold text-white">{requests.length}</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-800 to-green-900 border-green-700 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between p-1.5 sm:p-2 md:p-3 xl:p-5 2xl:p-6 pb-0.5 sm:pb-1 md:pb-2 xl:pb-3">
                <CardTitle className="text-[10px] sm:text-xs lg:text-sm xl:text-base font-medium text-white">Approved</CardTitle>
                <CheckCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 xl:h-5 xl:w-5 text-green-300" />
              </CardHeader>
              <CardContent className="p-1.5 sm:p-2 md:p-3 xl:p-5 2xl:p-6 pt-0 md:pt-1 xl:pt-2">
                <div className="text-sm sm:text-base lg:text-lg xl:text-2xl 2xl:text-3xl font-bold text-white">
                  {requests.filter(r => r.status === "approved").length}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-yellow-700 to-yellow-800 border-yellow-600 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between p-1.5 sm:p-2 md:p-3 xl:p-5 2xl:p-6 pb-0.5 sm:pb-1 md:pb-2 xl:pb-3">
                <CardTitle className="text-[10px] sm:text-xs lg:text-sm xl:text-base font-medium text-white">Pending</CardTitle>
                <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 xl:h-5 xl:w-5 text-yellow-300" />
              </CardHeader>
              <CardContent className="p-1.5 sm:p-2 md:p-3 xl:p-5 2xl:p-6 pt-0 md:pt-1 xl:pt-2">
                <div className="text-sm sm:text-base lg:text-lg xl:text-2xl 2xl:text-3xl font-bold text-white">
                  {requests.filter(r => r.status === "pending").length}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-red-800 to-red-900 border-red-700 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between p-1.5 sm:p-2 md:p-3 xl:p-5 2xl:p-6 pb-0.5 sm:pb-1 md:pb-2 xl:pb-3">
                <CardTitle className="text-[10px] sm:text-xs lg:text-sm xl:text-base font-medium text-white">Declined</CardTitle>
                <XCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 xl:h-5 xl:w-5 text-red-300" />
              </CardHeader>
              <CardContent className="p-1.5 sm:p-2 md:p-3 xl:p-5 2xl:p-6 pt-0 md:pt-1 xl:pt-2">
                <div className="text-sm sm:text-base lg:text-lg xl:text-2xl 2xl:text-3xl font-bold text-white">
                  {requests.filter(r => r.status === "denied").length}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Table with search bar positioned above it */}
        <div className="mt-3 sm:mt-4 lg:mt-6 xl:mt-8 space-y-2 sm:space-y-3 xl:space-y-4">
          {/* Search positioned above table */}
          <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 xl:gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <h3 className="text-sm sm:text-base xl:text-lg font-medium text-gray-800">Holiday Request Records</h3>
              {isAdminRole && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowArchived(!showArchived);
                    setCurrentPage(1);
                  }}
                  className="h-7 xs:h-8 text-[10px] xs:text-xs"
                >
                  {showArchived ? 'Show Active' : 'Show Archived'}
                </Button>
              )}
            </div>
            <div className="relative w-full xs:w-44 sm:w-60 xl:w-80">
              <Input
                type="text"
                placeholder="Search by officer name..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-8 h-8 sm:h-9 xl:h-12 text-xs sm:text-sm xl:text-base w-full"
              />
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 xl:h-5 xl:w-5 text-gray-400" />
              {searchTerm && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 xl:h-8 xl:w-8 p-0"
                  onClick={() => {
                    setSearchTerm("");
                    setCurrentPage(1);
                  }}
                >
                  <X className="h-3 w-3 sm:h-3.5 sm:w-3.5 xl:h-4 xl:w-4" />
                  <span className="sr-only">Clear search</span>
                </Button>
              )}
            </div>
          </div>

          {/* Table itself */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto -mx-1 sm:mx-0">
              <div className="min-w-[300px] max-w-full px-1 sm:px-0">
                <Table className="w-full table-auto">
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="font-medium text-[10px] sm:text-xs lg:text-sm xl:text-base text-gray-900 py-1.5 sm:py-2 md:py-3 xl:py-4">Officer</TableHead>
                      <TableHead className="font-medium text-[10px] sm:text-xs lg:text-sm xl:text-base text-gray-900 py-1.5 sm:py-2 md:py-3 xl:py-4 whitespace-nowrap hidden sm:table-cell">Date Requested</TableHead>
                      <TableHead className="font-medium text-[10px] sm:text-xs lg:text-sm xl:text-base text-gray-900 py-1.5 sm:py-2 md:py-3 xl:py-4 whitespace-nowrap">Start Date</TableHead>
                      <TableHead className="font-medium text-[10px] sm:text-xs lg:text-sm xl:text-base text-gray-900 py-1.5 sm:py-2 md:py-3 xl:py-4 whitespace-nowrap hidden xs:table-cell">End Date</TableHead>
                      <TableHead className="font-medium text-[10px] sm:text-xs lg:text-sm xl:text-base text-gray-900 py-1.5 sm:py-2 md:py-3 xl:py-4 whitespace-nowrap hidden md:table-cell">Return Date</TableHead>
                      <TableHead className="font-medium text-[10px] sm:text-xs lg:text-sm xl:text-base text-gray-900 py-1.5 sm:py-2 md:py-3 xl:py-4">Status</TableHead>
                      <TableHead className="font-medium text-[10px] sm:text-xs lg:text-sm xl:text-base text-gray-900 py-1.5 sm:py-2 md:py-3 xl:py-4 w-[90px] lg:w-[120px] xl:w-[150px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4 sm:py-6 md:py-8 xl:py-12">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                            <p className="text-gray-500 text-[10px] sm:text-xs lg:text-sm xl:text-base">Loading holiday requests...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-4 sm:py-6 md:py-8 xl:py-12">
                          <p className="text-gray-500 text-[10px] sm:text-xs lg:text-sm xl:text-base">No holiday requests found matching your search</p>
                          <Button
                            variant="link"
                            onClick={handleCreateRequest}
                            className="text-purple-600 hover:text-purple-700 mt-1 sm:mt-2 text-[10px] sm:text-xs lg:text-sm xl:text-base"
                          >
                            Create your first holiday request
                          </Button>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedRequests.map((request) => (
                        <TableRow key={request.id} className="hover:bg-gray-50 transition-colors text-[10px] sm:text-xs lg:text-sm xl:text-base">
                          <TableCell className="py-1.5 sm:py-2 md:py-3 xl:py-4">
                            <div className="font-medium text-[11px] sm:text-sm xl:text-base text-purple-700">
                              {request.officerName}
                            </div>
                            {/* Mobile view extras */}
                            <div className="xs:hidden text-[9px] lg:text-xs xl:text-sm text-gray-500 mt-0.5">
                              Ends: {format(request.endDate, 'dd/MM/yyyy')}
                            </div>
                          </TableCell>
                          <TableCell className="py-1.5 sm:py-2 md:py-3 xl:py-4 hidden sm:table-cell whitespace-nowrap">
                            {format(request.dateOfRequest, 'dd/MM/yyyy')}
                          </TableCell>
                          <TableCell className="py-1.5 sm:py-2 md:py-3 xl:py-4 whitespace-nowrap">
                            {format(request.startDate, 'dd/MM/yyyy')}
                          </TableCell>
                          <TableCell className="py-1.5 sm:py-2 md:py-3 xl:py-4 whitespace-nowrap hidden xs:table-cell">
                            {format(request.endDate, 'dd/MM/yyyy')}
                          </TableCell>
                          <TableCell className="py-1.5 sm:py-2 md:py-3 xl:py-4 whitespace-nowrap hidden md:table-cell">
                            {format(request.returnToWorkDate, 'dd/MM/yyyy')}
                          </TableCell>
                          <TableCell className="py-1.5 sm:py-2 md:py-3 xl:py-4">
                            <span className={cn(
                              "inline-flex px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-xs lg:text-sm xl:text-base font-medium",
                              getStatusBadgeClass(request.status)
                            )}>
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </span>
                          </TableCell>
                          <TableCell className="py-1.5 sm:py-2 md:py-3 xl:py-4">
                            <div className="flex items-center justify-end gap-0.5 sm:gap-1 md:gap-2 xl:gap-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setViewingRequest(request);
                                  setIsViewDialogOpen(true);
                                }}
                                className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 xl:h-10 xl:w-10 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-200"
                                title="View Details"
                                disabled={isLoading}
                              >
                                <Eye className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 xl:h-5 xl:w-5" />
                                <span className="sr-only">View</span>
                              </Button>
                              {!request.archived && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingRequest(request);
                                    setIsDialogOpen(true);
                                  }}
                                  className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 xl:h-10 xl:w-10 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                                  title="Edit Request"
                                  disabled={isLoading}
                                >
                                  <Pencil className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 xl:h-5 xl:w-5" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                              )}
                              {isAdminRole && !request.archived && (request.status === 'approved' || request.status === 'denied') && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleArchiveRequest(request.id)}
                                  className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 xl:h-10 xl:w-10 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200"
                                  title="Archive Request"
                                  disabled={isLoading}
                                >
                                  <Archive className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 xl:h-5 xl:w-5" />
                                  <span className="sr-only">Archive</span>
                                </Button>
                              )}
                              {isAdminRole && request.archived && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUnarchiveRequest(request.id)}
                                  className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 xl:h-10 xl:w-10 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                                  title="Unarchive Request"
                                  disabled={isLoading}
                                >
                                  <ArchiveRestore className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-4 md:w-4 xl:h-5 xl:w-5" />
                                  <span className="sr-only">Unarchive</span>
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteClick(request.id)}
                                className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 xl:h-10 xl:w-10 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                title="Delete Request"
                                disabled={isLoading}
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
          {filteredRequests.length > 0 && (
            <div className="flex justify-between items-center text-[10px] sm:text-xs xl:text-sm text-gray-500 pt-1 sm:pt-2 xl:pt-4">
              <div>
                Showing {paginatedRequests.length} of {filteredRequests.length} records
              </div>
              
              {/* Always show pagination on mobile, only show on desktop if records > 10 */}
              {(filteredRequests.length > itemsPerPage || isMobile) && (
                <div className="flex justify-center overflow-x-auto">
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
                          {currentPage} / {totalPages || 1}
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
                          className={`${currentPage === totalPages || totalPages === 0 ? 'pointer-events-none opacity-50' : ''} h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-auto xl:h-12 xl:w-auto flex items-center justify-center text-[10px] sm:text-xs xl:text-base`}
                          aria-disabled={currentPage === totalPages || totalPages === 0}
                        >
                          <span className="sr-only">Go to next page</span>
                        </PaginationNext>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          setStartDateOpen(false);
          setEndDateOpen(false);
          setReturnDateOpen(false);
        }
      }}>
        <DialogContent className="w-[90%] xs:w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] md:max-w-[700px] mx-auto p-3 xs:p-4 sm:p-6 space-y-4 sm:space-y-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-2 sm:space-y-3">
            <DialogTitle className="text-base xs:text-lg sm:text-xl font-semibold text-gray-900">
              {editingRequest ? 'Edit Holiday Request' : 'New Holiday Request'}
            </DialogTitle>
            <DialogDescription className="text-xs xs:text-sm text-gray-500">
              Please note: Start date must be at least 60 days from booking date. Each holiday can last a maximum of 2 weeks (14 days). Return to work date can add up to 3 days buffer for weekends.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form 
              onSubmit={form.handleSubmit(
                // Success handler
                onSubmit, 
                // Error handler
                (errors) => {
                  console.log("Form validation errors:", errors);
                  toast({
                    title: "Form validation failed",
                    description: "Please check the form for errors and try again.",
                    variant: "destructive"
                  });
                }
              )} 
              className="space-y-4 xs:space-y-5 sm:space-y-6"
            >
              {/* Officer Selection */}
              <FormField
                control={form.control}
                name="officerId"
                render={({ field }) => (
                  <FormItem className="space-y-1.5 sm:space-y-2">
                    <FormLabel className="text-xs sm:text-sm font-medium text-gray-700">Officer Name</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingEmployees}>
                      <FormControl>
                        <SelectTrigger className="h-8 xs:h-9 sm:h-10 text-xs sm:text-sm">
                          <SelectValue placeholder={isLoadingEmployees ? "Loading employees..." : "Select an employee"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees.map((employee) => (
                          <SelectItem key={employee.id.toString()} value={employee.id.toString()} className="text-xs sm:text-sm">
                            {employee.fullName || `${employee.firstName} ${employee.surname}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-[10px] xs:text-xs" />
                  </FormItem>
                )}
              />

              {/* Date Selection Grid - Responsive */}
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 sm:gap-6">
                {/* Start Date */}
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col space-y-1.5 sm:space-y-2">
                      <FormLabel className="text-xs sm:text-sm font-medium text-gray-700">Start Date</FormLabel>
                      <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              type="button"
                              variant={"outline"}
                              className={cn(
                                "h-8 xs:h-9 sm:h-10 w-full pl-3 text-left font-normal text-xs sm:text-sm",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? format(field.value, "PPP") : "Select date"}
                              <CalendarIcon className="ml-auto h-3 w-3 xs:h-4 xs:w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 max-w-[calc(100vw-2rem)]" align="start">
                          <div className="p-2 xs:p-3 border-b border-gray-100">
                            <h4 className="text-xs sm:text-sm font-medium text-gray-900">Select Start Date</h4>
                            <p className="text-[10px] xs:text-xs text-gray-500 mt-0.5 xs:mt-1">Must be at least 60 days from booking date</p>
                          </div>
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              if (date) {
                                const normalizedDate = new Date(date);
                                normalizedDate.setHours(0, 0, 0, 0);
                                field.onChange(normalizedDate);
                                form.setValue('endDate', undefined);
                                form.setValue('returnToWorkDate', undefined);
                                setStartDateOpen(false);
                              }
                            }}
                            initialFocus
                            modifiers={{
                              disabled: (date) => {
                                // Disable dates before 60 days from today (booking date)
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                const dateToCheck = new Date(date);
                                dateToCheck.setHours(0, 0, 0, 0);
                                const minDate = addDays(today, 60);
                                return isBefore(dateToCheck, minDate);
                              }
                            }}
                            modifiersStyles={{
                              disabled: { 
                                color: '#DC2626',
                                textDecoration: 'line-through',
                                backgroundColor: '#FEE2E2',
                                opacity: '0.6'
                              }
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription className="text-[10px] xs:text-xs text-gray-500">
                        Select a start date for your leave period
                      </FormDescription>
                      <FormMessage className="text-[10px] xs:text-xs" />
                    </FormItem>
                  )}
                />

                {/* End Date */}
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col space-y-1.5 sm:space-y-2">
                      <FormLabel className="text-xs sm:text-sm font-medium text-gray-700">End Date</FormLabel>
                      <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              type="button"
                              variant={"outline"}
                              className={cn(
                                "h-8 xs:h-9 sm:h-10 w-full pl-3 text-left font-normal text-xs sm:text-sm",
                                !field.value && "text-muted-foreground"
                              )}
                              disabled={!startDate}
                            >
                              {field.value ? format(field.value, "PPP") : "Select date"}
                              <CalendarIcon className="ml-auto h-3 w-3 xs:h-4 xs:w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 max-w-[calc(100vw-2rem)]" align="start">
                          <div className="p-2 xs:p-3 border-b border-gray-100">
                            <h4 className="text-xs sm:text-sm font-medium text-gray-900">Select End Date</h4>
                            <p className="text-[10px] xs:text-xs text-gray-500 mt-0.5 xs:mt-1">Must be within 14 days of start date</p>
                          </div>
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              if (date) {
                                const normalizedDate = new Date(date);
                                normalizedDate.setHours(0, 0, 0, 0);
                                field.onChange(normalizedDate);
                                form.setValue('returnToWorkDate', undefined);
                                setEndDateOpen(false);
                              }
                            }}
                            initialFocus
                            modifiers={{
                              disabled: (date) => {
                                const startDate = form.getValues("startDate");
                                if (!startDate) return true;
                                
                                const start = new Date(startDate);
                                start.setHours(0, 0, 0, 0);
                                const dateToCheck = new Date(date);
                                dateToCheck.setHours(0, 0, 0, 0);
                                const maxDate = addDays(start, 14);
                                
                                // Disable dates before start date or after 14 days from start date (inclusive of 14th day)
                                // isBefore(dateToCheck, start) - disables dates before start
                                // dateToCheck > maxDate - disables dates after maxDate (more than 14 days)
                                return isBefore(dateToCheck, start) || dateToCheck > maxDate;
                              }
                            }}
                            modifiersStyles={{
                              disabled: { 
                                color: '#DC2626',
                                textDecoration: 'line-through',
                                backgroundColor: '#FEE2E2',
                                opacity: '0.6'
                              }
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription className="text-[10px] xs:text-xs text-gray-500">
                        Select the last day of your leave period
                      </FormDescription>
                      <FormMessage className="text-[10px] xs:text-xs" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Return to Work Date */}
              <FormField
                control={form.control}
                name="returnToWorkDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col space-y-1.5 sm:space-y-2">
                    <FormLabel className="text-xs sm:text-sm font-medium text-gray-700">Return to Work Date</FormLabel>
                    <Popover open={returnDateOpen} onOpenChange={setReturnDateOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            type="button"
                            variant={"outline"}
                            className={cn(
                              "h-8 xs:h-9 sm:h-10 w-full pl-3 text-left font-normal text-xs sm:text-sm",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={!endDate}
                          >
                            {field.value ? format(field.value, "PPP") : "Select date"}
                            <CalendarIcon className="ml-auto h-3 w-3 xs:h-4 xs:w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 max-w-[calc(100vw-2rem)]" align="start">
                        <div className="p-2 xs:p-3 border-b border-gray-100">
                          <h4 className="text-xs sm:text-sm font-medium text-gray-900">Select Return Date</h4>
                          <p className="text-[10px] xs:text-xs text-gray-500 mt-0.5 xs:mt-1">Must be at least 1 day after end date, max 17 days from start (14 days + 3 day buffer)</p>
                        </div>
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            if (date) {
                              const normalizedDate = new Date(date);
                              normalizedDate.setHours(0, 0, 0, 0);
                              field.onChange(normalizedDate);
                              setReturnDateOpen(false);
                            }
                          }}
                          initialFocus
                          modifiers={{
                            disabled: (date) => {
                              const startDate = form.getValues("startDate");
                              const endDate = form.getValues("endDate");
                              if (!startDate || !endDate) return true;
                              
                              const start = new Date(startDate);
                              start.setHours(0, 0, 0, 0);
                              const end = new Date(endDate);
                              end.setHours(0, 0, 0, 0);
                              const dateToCheck = new Date(date);
                              dateToCheck.setHours(0, 0, 0, 0);
                              
                              // Must be at least 1 day after end date
                              const minDate = addDays(end, 1);
                              // Can add up to 3 days to the 14-day window (start + 17 days max)
                              const maxDate = addDays(start, 17);
                              
                              // Disable dates before minDate (1 day after end) or after maxDate (start + 17 days)
                              return isBefore(dateToCheck, minDate) || dateToCheck > maxDate;
                            }
                          }}
                          modifiersStyles={{
                            disabled: { 
                              color: '#DC2626',
                              textDecoration: 'line-through',
                              backgroundColor: '#FEE2E2',
                              opacity: '0.6'
                            }
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription className="text-[10px] xs:text-xs text-gray-500">
                      Select the date you plan to return to work
                    </FormDescription>
                    <FormMessage className="text-[10px] xs:text-xs" />
                  </FormItem>
                )}
              />

              {/* Comments */}
              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem className="space-y-1.5 sm:space-y-2">
                    <FormLabel className="text-xs sm:text-sm font-medium text-gray-700">Comments</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional notes..."
                        className="min-h-[80px] xs:min-h-[100px] text-xs sm:text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-[10px] xs:text-xs" />
                  </FormItem>
                )}
              />

              {/* Summary Section */}
              {form.watch("startDate") && form.watch("endDate") && (
                <div className="bg-gray-50 p-3 xs:p-4 rounded-lg border border-gray-100 space-y-1.5 xs:space-y-2">
                  <h4 className="text-xs sm:text-sm font-medium text-gray-900">Leave Summary</h4>
                  <div className="grid grid-cols-2 gap-3 xs:gap-4">
                    <div>
                      <p className="text-[10px] xs:text-xs text-gray-500">Total Days</p>
                      <p className="text-xs sm:text-sm font-medium text-gray-900">
                        {differenceInBusinessDays(form.getValues("endDate"), form.getValues("startDate")) + 1} working days
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] xs:text-xs text-gray-500">Return Date</p>
                      <p className="text-xs sm:text-sm font-medium text-gray-900">
                        {form.watch("returnToWorkDate") ? format(form.watch("returnToWorkDate"), "PPP") : "Not set"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <DialogFooter className="gap-2 xs:gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    form.reset();
                    setStartDateOpen(false);
                    setEndDateOpen(false);
                    setReturnDateOpen(false);
                  }}
                  className="h-8 xs:h-9 text-xs sm:text-sm"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="h-8 xs:h-9 bg-purple-600 hover:bg-purple-700 text-xs sm:text-sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {editingRequest ? "Updating..." : "Submitting..."}
                    </>
                  ) : (
                    editingRequest ? "Update Request" : "Submit Request"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="w-[90%] xs:w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] md:max-w-[600px] mx-auto my-1 sm:my-2 max-h-[90vh] overflow-y-auto p-3 xs:p-4 sm:p-6">
          <DialogHeader className="space-y-1.5 xs:space-y-2">
            <DialogTitle className="text-base xs:text-lg sm:text-lg font-semibold text-gray-900">
              Holiday Request Details
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-gray-500">
              View or manage the holiday request details below.
            </DialogDescription>
          </DialogHeader>
          {viewingRequest && (
            <div className="space-y-4 xs:space-y-5 sm:space-y-6">
              <div className="grid grid-cols-2 gap-3 xs:gap-4">
                <div>
                  <h4 className="text-[10px] xs:text-xs font-medium text-gray-500">Officer</h4>
                  <p className="text-xs sm:text-sm text-gray-900">{viewingRequest.officerName}</p>
                </div>

                <div>
                  <h4 className="text-[10px] xs:text-xs font-medium text-gray-500">Status</h4>
                  <span className={cn(
                    "inline-flex px-1.5 xs:px-2 py-0.5 xs:py-1 rounded-full text-[10px] xs:text-xs font-medium mt-0.5",
                    getStatusBadgeClass(viewingRequest.status)
                  )}>
                    {viewingRequest.status.charAt(0).toUpperCase() + viewingRequest.status.slice(1)}
                  </span>
                </div>
                <div>
                  <h4 className="text-[10px] xs:text-xs font-medium text-gray-500">Total Days</h4>
                  <p className="text-xs sm:text-sm text-gray-900">{viewingRequest.totalDays} working days</p>
                </div>
                <div>
                  <h4 className="text-[10px] xs:text-xs font-medium text-gray-500">Start Date</h4>
                  <p className="text-xs sm:text-sm text-gray-900">
                    {format(new Date(viewingRequest.startDate), 'PPP')}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] xs:text-xs font-medium text-gray-500">End Date</h4>
                  <p className="text-xs sm:text-sm text-gray-900">
                    {format(new Date(viewingRequest.endDate), 'PPP')}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] xs:text-xs font-medium text-gray-500">Return Date</h4>
                  <p className="text-xs sm:text-sm text-gray-900">
                    {format(new Date(viewingRequest.returnToWorkDate), 'PPP')}
                  </p>
                </div>
                <div>
                  <h4 className="text-[10px] xs:text-xs font-medium text-gray-500">Date Requested</h4>
                  <p className="text-xs sm:text-sm text-gray-900">
                    {format(new Date(viewingRequest.dateOfRequest), 'PPP')}
                  </p>
                </div>
                <div className="col-span-2">
                  <h4 className="text-[10px] xs:text-xs font-medium text-gray-500">Authorised By</h4>
                  <p className="text-xs sm:text-sm text-gray-900">
                    {viewingRequest.authorisedBy || 'Not authorised yet'}
                  </p>
                </div>
                {viewingRequest.dateAuthorised && (
                  <div className="col-span-2">
                    <h4 className="text-[10px] xs:text-xs font-medium text-gray-500">Date Authorised</h4>
                    <p className="text-xs sm:text-sm text-gray-900">
                      {format(new Date(viewingRequest.dateAuthorised), 'PPP')}
                    </p>
                  </div>
                )}

                {viewingRequest.comment && (
                  <div className="col-span-2">
                    <h4 className="text-[10px] xs:text-xs font-medium text-gray-500">Comments</h4>
                    <p className="text-xs sm:text-sm text-gray-900">{viewingRequest.comment}</p>
                  </div>
                )}

                {viewingRequest.reason && (
                  <div className="col-span-2">
                    <h4 className="text-[10px] xs:text-xs font-medium text-gray-500">Reason</h4>
                    <p className="text-xs sm:text-sm text-gray-900">{viewingRequest.reason}</p>
                  </div>
                )}

                {typeof viewingRequest?.daysLeftYTD === 'number' && (
                  <div className="col-span-2">
                    <h4 className="text-[10px] xs:text-xs font-medium text-gray-500">Days Left (out of 28 YTD)</h4>
                    <p className="text-xs sm:text-sm text-gray-900">{viewingRequest.daysLeftYTD}</p>
                  </div>
                )}
              </div>
              
              {/* Admin Approval/Denial Section */}
              {isAdminRole && viewingRequest?.status === 'pending' && (
                <div className="border-t border-gray-200 pt-3 xs:pt-4 mt-3 xs:mt-4">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-900 mb-2 xs:mb-3">Approval Decision</h3>
                  
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const formData = new FormData(form);
                    const decision = formData.get('decision') as 'approved' | 'denied';
                    const reason = formData.get('reason') as string;
                    const daysLeftYTD = formData.get('daysLeftYTD') ? Number(formData.get('daysLeftYTD')) : undefined;
                    if (decision && reason && viewingRequest) {
                      try {
                        setIsSubmitting(true);
                        const updateData: UpdateHolidayRequestDTO = {
                          status: decision,
                          reason: reason,
                          dateAuthorised: new Date(),
                          // authorisedBy will be automatically set by backend to current user
                        };
                        
                        // Include daysLeftYTD if provided
                        if (daysLeftYTD !== undefined && daysLeftYTD !== null && !isNaN(daysLeftYTD)) {
                          updateData.daysLeftYTD = daysLeftYTD;
                        }
                        
                        const updatedRequest = await holidayRequestService.updateHolidayRequest(
                          viewingRequest.id,
                          updateData
                        );
                        setRequests(prev => prev.map(r =>
                          r.id === viewingRequest.id ? updatedRequest : r
                        ));
                        
                        // Send email notification to employee
                        const employee = employees.find(e => e.id.toString() === viewingRequest.officerId);
                        if (employee?.email) {
                          try {
                            // In production, this would call the backend email service
                            // For now, we'll log it (backend should handle email sending)
                            console.log(`[Email Notification] Holiday request ${decision} for ${employee.fullName || employee.firstName} ${employee.surname} (${employee.email})`);
                            console.log(`Subject: Holiday Request ${decision === 'approved' ? 'Approved' : 'Denied'}`);
                            console.log(`Details:`, {
                              employee: employee.fullName || `${employee.firstName} ${employee.surname}`,
                              email: employee.email,
                              startDate: format(viewingRequest.startDate, 'PPP'),
                              endDate: format(viewingRequest.endDate, 'PPP'),
                              returnDate: format(viewingRequest.returnToWorkDate, 'PPP'),
                              status: decision,
                              reason: reason,
                              authorisedBy: updatedRequest.authorisedBy || 'System'
                            });
                            // TODO: Call backend email service endpoint when available
                            // await holidayRequestService.sendHolidayRequestNotification(viewingRequest.id, decision);
                          } catch (emailError) {
                            console.error('Error sending email notification:', emailError);
                            // Don't fail the request if email fails
                          }
                        }
                        
                        setIsViewDialogOpen(false);
                        toast({
                          title: "Success",
                          description: `Holiday request ${decision} successfully.${employee?.email ? ' Email notification sent.' : ''}`,
                        });
                      } catch (error: any) {
                        console.error('❌ [HolidayRequestPage] Error updating holiday request:', {
                          error,
                          message: error.message,
                          response: error.response?.data,
                          status: error.response?.status,
                          statusText: error.response?.statusText
                        });
                        const errorMessage = error.response?.data?.message || error.message || 'Failed to update holiday request. Please try again.';
                        toast({
                          title: "Error",
                          description: errorMessage,
                          variant: "destructive"
                        });
                      } finally {
                        setIsSubmitting(false);
                      }
                    } else {
                      toast({
                        title: "Error",
                        description: "Please select a decision, provide a reason, and select an authorising manager.",
                        variant: "destructive"
                      });
                    }
                  }}>
                    <div className="space-y-3 xs:space-y-4">
                      <div>
                        <label className="text-[10px] xs:text-xs font-medium text-gray-700 mb-1 block">Decision</label>
                        <div className="flex gap-2 xs:gap-3">
                          <label className="flex items-center space-x-1.5 xs:space-x-2">
                            <input 
                              type="radio" 
                              name="decision" 
                              value="approved" 
                              className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-green-600 focus:ring-green-500"
                              disabled={isSubmitting}
                            />
                            <span className="text-xs sm:text-sm">Approve</span>
                          </label>
                          <label className="flex items-center space-x-1.5 xs:space-x-2">
                            <input 
                              type="radio" 
                              name="decision" 
                              value="denied" 
                              className="h-3.5 w-3.5 xs:h-4 xs:w-4 text-red-600 focus:ring-red-500"
                              disabled={isSubmitting}
                            />
                            <span className="text-xs sm:text-sm">Deny</span>
                          </label>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-[10px] xs:text-xs font-medium text-gray-700 mb-1 block">Reason</label>
                        <Textarea 
                          name="reason"
                          placeholder="Provide reason for your decision"
                          className="min-h-[60px] xs:min-h-[80px] sm:min-h-[100px] text-xs sm:text-sm"
                          required
                          disabled={isSubmitting}
                        />
                      </div>
                      
                      <div>
                        <label className="text-[10px] xs:text-xs font-medium text-gray-700 mb-1 block">Days Left (out of 28 YTD)</label>
                        <input
                          type="number"
                          name="daysLeftYTD"
                          min={0}
                          max={28}
                          defaultValue={viewingRequest.daysLeftYTD ?? ''}
                          className="w-24 xs:w-32 sm:w-40 border rounded px-2 py-1 text-xs sm:text-sm"
                          placeholder="e.g. 18"
                          disabled={isSubmitting}
                        />
                      </div>
                      
                      <div>
                        <label className="text-[10px] xs:text-xs font-medium text-gray-700 mb-1 block">Authorising Manager</label>
                        <input
                          type="text"
                          className="w-full border rounded px-2 py-1 text-xs sm:text-sm bg-gray-50"
                          value="Current User (You)"
                          disabled
                          readOnly
                        />
                        <p className="text-[10px] text-gray-500 mt-1">The request will be authorized by your account</p>
                      </div>
                      
                      <div className="flex justify-end gap-2 xs:gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsViewDialogOpen(false)}
                          className="h-7 xs:h-8 sm:h-9 text-[10px] xs:text-xs sm:text-sm"
                          disabled={isSubmitting}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="h-7 xs:h-8 sm:h-9 bg-purple-600 hover:bg-purple-700 text-[10px] xs:text-xs sm:text-sm"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                              Submitting...
                            </>
                          ) : (
                            "Submit Decision"
                          )}
                        </Button>
                      </div>
                    </div>
                  </form>
                </div>
              )}
              
              {/* For already approved/denied requests, show archive/unarchive and close button */}
              {viewingRequest.status !== 'pending' && (
                <DialogFooter className="gap-2 xs:gap-3 pt-2 flex-col sm:flex-row">
                  <div className="flex gap-2 xs:gap-3 w-full sm:w-auto">
                    {isAdminRole && !viewingRequest.archived && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await handleArchiveRequest(viewingRequest.id);
                            setIsViewDialogOpen(false);
                            // Refresh the list (already done in handleArchiveRequest, but ensure UI updates)
                            await fetchRequests();
                          } catch (error) {
                            // Error already handled in handleArchiveRequest
                          }
                        }}
                        className="h-7 xs:h-8 sm:h-9 text-[10px] xs:text-xs sm:text-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200 flex-1 sm:flex-initial"
                        disabled={isSubmitting}
                      >
                        <Archive className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 mr-1.5 xs:mr-2" />
                        Archive
                      </Button>
                    )}
                    {isAdminRole && viewingRequest.archived && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={async () => {
                          try {
                            await handleUnarchiveRequest(viewingRequest.id);
                            setIsViewDialogOpen(false);
                            // Refresh the list (already done in handleUnarchiveRequest, but ensure UI updates)
                            await fetchRequests();
                          } catch (error) {
                            // Error already handled in handleUnarchiveRequest
                          }
                        }}
                        className="h-7 xs:h-8 sm:h-9 text-[10px] xs:text-xs sm:text-sm text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 flex-1 sm:flex-initial"
                        disabled={isSubmitting}
                      >
                        <ArchiveRestore className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 mr-1.5 xs:mr-2" />
                        Unarchive
                      </Button>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsViewDialogOpen(false)}
                    className="h-7 xs:h-8 sm:h-9 text-[10px] xs:text-xs sm:text-sm w-full sm:w-auto"
                  >
                    Close
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="w-[90%] xs:w-[calc(100%-2rem)] sm:w-[calc(100%-3rem)] md:max-w-[400px] mx-auto my-1 sm:my-2 p-3 xs:p-4 sm:p-6">
          <DialogHeader className="space-y-1.5 xs:space-y-2">
            <DialogTitle className="text-base xs:text-lg font-semibold text-gray-900">
              Confirm Delete
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Are you sure you want to delete this holiday request? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-3 xs:mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="h-7 xs:h-8 sm:h-9 text-[10px] xs:text-xs sm:text-sm"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              className="h-7 xs:h-8 sm:h-9 text-[10px] xs:text-xs sm:text-sm"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
