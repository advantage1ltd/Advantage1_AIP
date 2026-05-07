import React, { useState, useEffect, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Pencil, Trash2, Eye, ChevronLeft, ChevronRight, Search, Plus, Calendar, Filter, Archive, Loader2 } from "lucide-react";

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
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { bankHolidayService } from "@/services/bankHolidayService";
import type { BankHoliday, BankHolidayStatus } from "@/types/bankHoliday";
import { employeeService } from '@/services/employeeService'
import { useAuth } from '@/contexts/AuthContext'
import type { Employee } from '@/types/employee'

interface EmployeeOption {
	id: number;
	fullName: string;
	position?: string;
}

const formSchema = z.object({
	officerId: z.number({
		required_error: 'Officer is required'
	}).int().positive(),
	holidayDate: z.date({
		required_error: 'Bank holiday date is required'
	})
})

const toEmployeeOption = (employee: Employee): EmployeeOption => ({
	id: employee.id,
	fullName: employee.fullName ?? `${employee.firstName} ${employee.surname}`,
	position: employee.position
})

const isManagerOption = (employee: EmployeeOption): boolean =>
	employee.position?.toLowerCase().includes('manager') ?? false

const toDate = (value: string): Date => new Date(value)

// Reusable DateField component
const DateField = ({ 
	field, 
	label, 
	disabled = false 
}: { 
	field: any; 
	label: string; 
	disabled?: boolean; 
}) => (
	<FormItem className="flex flex-col">
		<FormLabel className="text-sm">{label}</FormLabel>
		<div className="relative">
			<Input
				type="date"
				{...field}
				value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
				onChange={e => {
					const date = new Date(e.target.value);
					field.onChange(date);
				}}
				disabled={disabled}
				className="pl-8 text-sm h-9"
			/>
			<Calendar className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
		</div>
		<FormMessage className="text-xs" />
	</FormItem>
);

// Reusable SelectField component
const SelectField = ({ 
	field, 
	label, 
	placeholder, 
	options,
	getValue,
	getLabel,
	disabled = false
}: { 
	field: any; 
	label: string; 
	placeholder: string; 
	options: EmployeeOption[];
	getValue: (employee: EmployeeOption) => string;
	getLabel: (employee: EmployeeOption) => string;
	disabled?: boolean;
}) => (
	<FormItem>
		<FormLabel className="text-sm">{label}</FormLabel>
		<Select
			onValueChange={(value) => field.onChange(Number(value))}
			value={field.value ? String(field.value) : undefined}
			disabled={disabled}
		>
			<FormControl>
				<SelectTrigger className="w-full h-9 text-sm" disabled={disabled}>
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
			</FormControl>
			<SelectContent>
				{options.map((option) => (
					<SelectItem 
						key={getValue(option)} 
						value={getValue(option)} 
						className="text-sm"
					>
						{getLabel(option)}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
		<FormMessage className="text-xs" />
	</FormItem>
);

// Reusable action buttons component
const ActionButtons = ({ 
  holiday,
  onEdit,
  onView,
  onDelete,
  onArchive,
  onUnarchive
}: { 
  holiday: BankHoliday;
  onEdit: (holiday: BankHoliday) => void;
  onView: (holiday: BankHoliday) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  onUnarchive: (id: string) => void;
}) => (
  <div className="flex items-center justify-center gap-2">
    <Button
      variant="outline"
      size="sm"
      onClick={() => onEdit(holiday)}
      className="h-8 w-8 rounded-full bg-blue-50 border-blue-200 hover:bg-blue-100 p-0"
      title="Edit Holiday"
    >
      <Pencil className="h-3.5 w-3.5 text-blue-600" />
    </Button>
    <Button
      variant="outline"
      size="sm"
      onClick={() => onView(holiday)}
      className="h-8 w-8 rounded-full bg-gray-50 border-gray-200 hover:bg-gray-100 p-0"
      title="View Details"
    >
      <Eye className="h-3.5 w-3.5 text-gray-600" />
    </Button>
    {holiday.status === 'authorized' && (
      <Button
        variant="outline"
        size="sm"
        onClick={() => holiday.archived ? onUnarchive(holiday.id) : onArchive(holiday.id)}
        className="h-8 w-8 rounded-full bg-purple-50 border-purple-200 hover:bg-purple-100 p-0"
        title={holiday.archived ? "Unarchive Holiday" : "Archive Holiday"}
      >
        {holiday.archived ? (
          <Archive className="h-3.5 w-3.5 text-purple-600" />
        ) : (
          <Archive className="h-3.5 w-3.5 text-purple-600" />
        )}
      </Button>
    )}
    <Button
      variant="outline"
      size="sm"
      onClick={() => onDelete(holiday.id)}
      className="h-8 w-8 rounded-full bg-red-50 border-red-200 hover:bg-red-100 p-0"
      title="Delete Holiday"
    >
      <Trash2 className="h-3.5 w-3.5 text-red-600" />
    </Button>
  </div>
);

// Pagination component
const Pagination = ({
  currentPage,
  totalPages,
  onPageChange
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => (
  <div className="flex items-center justify-between p-2 bg-muted/20 border-t">
    <div className="text-xs text-muted-foreground">
      Page {currentPage}/{totalPages}
    </div>
    <div className="flex gap-1">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-7 w-7 p-0 flex items-center justify-center"
        title="Previous Page"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="h-7 w-7 p-0 flex items-center justify-center"
        title="Next Page"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  </div>
);

// Status badge component
const StatusBadge = ({ status }: { status: BankHolidayStatus }) => {
  if (status === "authorized") {
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 whitespace-nowrap text-xs py-0.5">
        Authorized
      </Badge>
    );
  } else if (status === "declined") {
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 whitespace-nowrap text-xs py-0.5">
        Declined
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 whitespace-nowrap text-xs py-0.5">
      Pending
    </Badge>
  );
};

// Reusable mobile card view for holidays
const HolidayMobileCard = ({
  holiday,
  onEdit,
  onView,
  onDelete
}: {
  holiday: BankHoliday;
  onEdit: (holiday: BankHoliday) => void;
  onView: (holiday: BankHoliday) => void;
  onDelete: (id: string) => void;
}) => (
  <Card className="mb-2 shadow-sm sm:hidden">
    <CardContent className="p-3">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-medium text-sm">{holiday.officerName}</h3>
          <p className="text-xs text-muted-foreground">{format(toDate(holiday.holidayDate), 'dd MMM yyyy')}</p>
        </div>
        <MemoizedStatusBadge status={holiday.status} />
      </div>
      <div className="flex items-center justify-between text-xs pt-2 border-t border-muted">
        <span className="text-muted-foreground">
          Manager: {holiday.authorisedByName ?? 'Pending assignment'}
        </span>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onView(holiday)}
            className="h-6 w-6 p-0"
            title="View Details"
          >
            <Eye className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(holiday)}
            className="h-6 w-6 p-0"
            title="Edit Holiday"
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(holiday.id)}
            className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
            title="Delete Holiday"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Memoized components to prevent unnecessary re-renders
const MemoizedActionButtons = React.memo(ActionButtons);
const MemoizedStatusBadge = React.memo(StatusBadge);
const MemoizedHolidayMobileCard = React.memo(HolidayMobileCard);

// Add this component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
);

// Add this component
const LoadingRow = () => (
  <TableRow>
    <TableCell colSpan={5}>
      <LoadingSpinner />
    </TableCell>
  </TableRow>
);

// Add this component
const LoadingCard = () => (
  <Card className="mb-2 shadow-sm sm:hidden">
    <CardContent className="p-3">
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    </CardContent>
  </Card>
);

export default function BankHolidayPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [holidays, setHolidays] = useState<BankHoliday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEmployeeLoading, setIsEmployeeLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<BankHoliday | null>(null);
  const [viewingHoliday, setViewingHoliday] = useState<BankHoliday | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showArchived, setShowArchived] = useState(false);
  const [officerOptions, setOfficerOptions] = useState<EmployeeOption[]>([]);
  const [managerOptions, setManagerOptions] = useState<EmployeeOption[]>([]);
  const itemsPerPage = 10;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      officerId: user?.employeeId ?? undefined,
      holidayDate: undefined,
    } as Partial<z.infer<typeof formSchema>>,
  });

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setIsEmployeeLoading(true);
        const employees = await employeeService.getActiveEmployees();
        const normalized = employees.map(toEmployeeOption);
        setOfficerOptions(normalized);
        const managerCandidates = normalized.filter(isManagerOption);
        setManagerOptions(managerCandidates.length ? managerCandidates : normalized);
      } catch (error) {
        console.error('Error fetching employees:', error);
        toast({
          title: 'Error',
          description: 'Unable to load officers. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsEmployeeLoading(false);
      }
    };

    loadEmployees();
  }, [toast]);

  // Fetch holidays
  const fetchHolidays = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await bankHolidayService.getBankHolidays({
        search: searchTerm,
        page: currentPage,
        limit: itemsPerPage,
        archived: showArchived
      });
      
      setHolidays(response.data);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      console.error('Error fetching bank holidays:', error);
      toast({
        title: "Error",
        description: "Failed to fetch bank holidays. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, currentPage, itemsPerPage, showArchived, toast]);

  // Initial fetch
  useEffect(() => {
    fetchHolidays();
  }, [fetchHolidays]);

  // Reset to first page when search or archive filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, showArchived]);

  useEffect(() => {
    if (editingHoliday) {
      form.reset({
        officerId: editingHoliday.officerId,
        holidayDate: toDate(editingHoliday.holidayDate),
      });
    }
  }, [editingHoliday, form]);

  useEffect(() => {
    if (!editingHoliday && user?.employeeId) {
      form.setValue('officerId', user.employeeId);
    }
  }, [editingHoliday, user?.employeeId, form]);

  const onSubmit = useCallback(async (values: z.infer<typeof formSchema>) => {
    try {
      const payloadDate = values.holidayDate.toISOString();

      if (editingHoliday) {
        await bankHolidayService.updateBankHoliday(editingHoliday.id, {
          officerId: values.officerId,
          holidayDate: payloadDate
        });
        
        await fetchHolidays();
        
        toast({
          title: "Success",
          description: "Bank holiday updated successfully",
        });
      } else {
        await bankHolidayService.createBankHoliday({
          officerId: values.officerId,
          holidayDate: payloadDate
        });
        
        setCurrentPage(1);
        await fetchHolidays();
        
        toast({
          title: "Success",
          description: "Bank holiday created successfully",
        });
      }

      setIsDialogOpen(false);
      form.reset({
        officerId: user?.employeeId ?? undefined,
        holidayDate: undefined,
      });
      setEditingHoliday(null);
    } catch (error) {
      console.error('Error submitting bank holiday:', error);
      toast({
        title: "Error",
        description: "Failed to submit bank holiday. Please try again.",
        variant: "destructive"
      });
    }
  }, [editingHoliday, fetchHolidays, form, toast, user?.employeeId]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await bankHolidayService.deleteBankHoliday(id);
      await fetchHolidays();
      toast({
        title: "Success",
        description: "Bank holiday deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting bank holiday:', error);
      toast({
        title: "Error",
        description: "Failed to delete bank holiday. Please try again.",
        variant: "destructive"
      });
    }
  }, [fetchHolidays, toast]);

  const handleViewHoliday = useCallback((holiday: BankHoliday) => {
    setViewingHoliday(holiday);
    setIsViewDialogOpen(true);
  }, []);

  const handleEditHoliday = useCallback((holiday: BankHoliday) => {
    setEditingHoliday(holiday);
    setIsDialogOpen(true);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Add these handlers after the existing handlers
  const handleArchive = useCallback(async (id: string) => {
    try {
      const updatedHoliday = await bankHolidayService.archiveBankHoliday(id);
      setHolidays(prev => prev.map(h => 
        h.id === id ? updatedHoliday : h
      ));
      toast({
        title: "Success",
        description: "Bank holiday archived successfully.",
      });
    } catch (error) {
      console.error('Error archiving bank holiday:', error);
      toast({
        title: "Error",
        description: "Failed to archive bank holiday. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleUnarchive = useCallback(async (id: string) => {
    try {
      const updatedHoliday = await bankHolidayService.unarchiveBankHoliday(id);
      setHolidays(prev => prev.map(h => 
        h.id === id ? updatedHoliday : h
      ));
      toast({
        title: "Success",
        description: "Bank holiday unarchived successfully.",
      });
    } catch (error) {
      console.error('Error unarchiving bank holiday:', error);
      toast({
        title: "Error",
        description: "Failed to unarchive bank holiday. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Update the filtered holidays logic
  const paginatedHolidays = useMemo(() => holidays, [holidays]);

  // Stats counts
  const pendingCount = useMemo(() => 
    holidays.filter(h => h.status === "pending").length, 
    [holidays]
  );

  const authorizedCount = useMemo(() => 
    holidays.filter(h => h.status === "authorized").length, 
    [holidays]
  );
  
  const declinedCount = useMemo(() => 
    holidays.filter(h => h.status === "declined").length, 
    [holidays]
  );

  const totalCount = useMemo(() => 
    holidays.length,
    [holidays]
  );

  return (
    <div className="container mx-auto px-2 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 space-y-3 sm:space-y-4 md:space-y-6 max-w-[1280px]">
      {/* Page header with summary cards */}
      <div className="flex flex-col gap-3 sm:gap-4 md:gap-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 md:gap-4">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Bank Holidays</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setEditingHoliday(null);
                  form.reset();
                }}
                className="w-full sm:w-auto px-2 sm:px-3 md:px-4 py-1.5 flex items-center justify-center gap-1 text-sm"
                size="sm"
                disabled={isEmployeeLoading || officerOptions.length === 0}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Bank Holiday
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100%-16px)] sm:w-auto max-w-md p-3 sm:p-4 md:p-6">
              <DialogHeader className="space-y-1">
                <DialogTitle className="text-lg">
                  {editingHoliday ? "Edit Bank Holiday" : "Add Bank Holiday"}
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm">
                  {editingHoliday 
                    ? "Edit the details of the bank holiday."
                    : "Add a new bank holiday to the calendar."}
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-3 p-2 sm:p-3 md:p-4 border rounded-lg bg-muted/20">
                    <h3 className="text-sm font-semibold">Holiday Details</h3>
                    
                    <FormField
                      control={form.control}
                      name="officerId"
                      render={({ field }) => (
                        <div className="space-y-1">
                          <SelectField 
                            field={field}
                            label="Officer Name"
                            placeholder={isEmployeeLoading ? "Loading officers..." : "Select an officer"}
                            options={officerOptions}
                            getValue={(option) => option.id.toString()}
                            getLabel={(option) => option.fullName}
                            disabled={isEmployeeLoading || officerOptions.length === 0}
                          />
                          {!isEmployeeLoading && officerOptions.length === 0 && (
                            <p className="text-[11px] text-muted-foreground">No active officers available.</p>
                          )}
                        </div>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="holidayDate"
                      render={({ field }) => (
                        <DateField 
                          field={field}
                          label="Bank Holiday Date"
                        />
                      )}
                    />
                  </div>

                  <DialogFooter className="flex-col gap-2 sm:flex-row sm:gap-0 sm:justify-end pt-2">
                    <Button 
                      variant="outline" 
                      type="button" 
                      onClick={() => setIsDialogOpen(false)} 
                      className="w-full sm:w-auto text-xs h-8"
                      size="sm"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="w-full sm:w-auto text-xs h-8"
                      size="sm"
                    >
                      {editingHoliday ? "Update" : "Create"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary cards - Grid layout based on breakpoints */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          <Card className="bg-primary text-primary-foreground shadow-sm">
            <CardHeader className="p-2 sm:p-3 md:p-4 pb-0">
              <CardTitle className="text-xs sm:text-sm md:text-base">Total Bank Holidays</CardTitle>
              <CardDescription className="text-[10px] sm:text-xs text-primary-foreground/70">All recorded holidays</CardDescription>
            </CardHeader>
            <CardContent className="p-2 sm:p-3 md:p-4 pt-1">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold">{totalCount}</div>
            </CardContent>
          </Card>
          <Card className="bg-amber-600 text-white shadow-sm">
            <CardHeader className="p-2 sm:p-3 md:p-4 pb-0">
              <CardTitle className="text-xs sm:text-sm md:text-base">Pending</CardTitle>
              <CardDescription className="text-[10px] sm:text-xs text-white/70">Awaiting approval</CardDescription>
            </CardHeader>
            <CardContent className="p-2 sm:p-3 md:p-4 pt-1">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold">{pendingCount}</div>
            </CardContent>
          </Card>
          <Card className="bg-green-600 text-white shadow-sm col-span-2 lg:col-span-1">
            <CardHeader className="p-2 sm:p-3 md:p-4 pb-0">
              <CardTitle className="text-xs sm:text-sm md:text-base">Authorized</CardTitle>
              <CardDescription className="text-[10px] sm:text-xs text-white/70">Approved holidays</CardDescription>
            </CardHeader>
            <CardContent className="p-2 sm:p-3 md:p-4 pt-1">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold">{authorizedCount}</div>
            </CardContent>
          </Card>
          <Card className="hidden lg:block lg:col-span-1 shadow-sm bg-red-600 text-white">
            <CardHeader className="p-2 sm:p-3 md:p-4 pb-0">
              <CardTitle className="text-xs sm:text-sm md:text-base">Declined</CardTitle>
              <CardDescription className="text-[10px] sm:text-xs text-white/70">Rejected holidays</CardDescription>
            </CardHeader>
            <CardContent className="p-2 sm:p-3 md:p-4 pt-1">
              <div className="text-xl sm:text-2xl md:text-3xl font-bold">{declinedCount}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main content - 1 column on mobile, 7 columns on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-3 sm:gap-4 md:gap-6">
        {/* Main content area - full width on mobile, 7 cols on desktop */}
        <div className="lg:col-span-7">
          {/* Filter and search section */}
          <Card className="shadow-sm">
            <CardHeader className="p-2 sm:p-3 md:p-4 pb-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                <CardTitle className="text-sm sm:text-base md:text-lg">Bank Holiday Records</CardTitle>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <Select
                    value={showArchived ? "archived" : "active"}
                    onValueChange={(value) => setShowArchived(value === "archived")}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="w-full sm:w-[140px] h-8 sm:h-9 text-xs sm:text-sm">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative w-full sm:w-64 md:w-72">
                    <Input
                      type="text"
                      placeholder="Search by officer name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-8 h-8 sm:h-9 text-xs sm:text-sm"
                      disabled={isLoading}
                    />
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Mobile view - card layout */}
              <div className="p-2 sm:hidden">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <LoadingCard key={i} />
                  ))
                ) : (
                  <>
                    {paginatedHolidays.map((holiday) => (
                      <MemoizedHolidayMobileCard
                        key={holiday.id}
                        holiday={holiday}
                        onEdit={handleEditHoliday}
                        onView={handleViewHoliday}
                        onDelete={handleDelete}
                      />
                    ))}
                    {paginatedHolidays.length === 0 && (
                      <div className="text-center py-4 text-xs text-muted-foreground">
                        No holidays found
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Desktop view - table layout */}
              <div className="hidden sm:block overflow-x-auto min-w-[320px]">
                <div className="flex justify-between items-center px-3 py-2 bg-muted/10">
                  <div className="text-xs sm:text-sm font-medium text-muted-foreground">
                    {paginatedHolidays.length} {paginatedHolidays.length === 1 ? 'record' : 'records'} found
                  </div>
                  <div className="flex gap-2">
                    {searchTerm && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs flex items-center gap-1"
                        onClick={() => setSearchTerm("")}
                        disabled={isLoading}
                      >
                        <Filter className="h-3.5 w-3.5" />
                        <span className="hidden md:inline">Clear Filter</span>
                        <span className="md:hidden">Clear</span>
                      </Button>
                    )}
                  </div>
                </div>
                <Table className="w-full">
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-medium text-xs sm:text-sm p-2 sm:p-3 w-1/4">Officer</TableHead>
                      <TableHead className="font-medium text-xs sm:text-sm p-2 sm:p-3 whitespace-nowrap w-1/4">Date</TableHead>
                      <TableHead className="font-medium text-xs sm:text-sm p-2 sm:p-3 hidden sm:table-cell">Manager</TableHead>
                      <TableHead className="font-medium text-xs sm:text-sm p-2 sm:p-3 w-1/4">Status</TableHead>
                      <TableHead className="font-medium text-xs sm:text-sm p-2 sm:p-3 text-center w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <LoadingRow />
                    ) : (
                      <>
                        {paginatedHolidays.map((holiday) => (
                          <TableRow key={holiday.id} className="hover:bg-muted/10">
                            <TableCell className="font-medium text-xs sm:text-sm p-2 sm:p-3 truncate max-w-[80px] sm:max-w-[120px]">
                              {holiday.officerName}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm p-2 sm:p-3 whitespace-nowrap">
                              {format(toDate(holiday.holidayDate), 'dd/MM/yy')}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm p-2 sm:p-3 hidden sm:table-cell truncate max-w-[120px]">
                              {holiday.authorisedByName ?? '—'}
                            </TableCell>
                            <TableCell className="p-2 sm:p-3">
                              <MemoizedStatusBadge status={holiday.status} />
                            </TableCell>
                            <TableCell className="p-1 sm:p-2">
                              <MemoizedActionButtons
                                holiday={holiday}
                                onEdit={handleEditHoliday}
                                onView={handleViewHoliday}
                                onDelete={handleDelete}
                                onArchive={handleArchive}
                                onUnarchive={handleUnarchive}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                        {paginatedHolidays.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-4 sm:py-6 text-xs sm:text-sm text-muted-foreground">
                              No holidays found
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>
              {paginatedHolidays.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="w-[calc(100%-16px)] sm:w-auto max-w-md p-3 sm:p-4 md:p-6">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-lg">Bank Holiday Details</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              View or manage the bank holiday request details below.
            </DialogDescription>
          </DialogHeader>

          {viewingHoliday && (
            <div className="space-y-3 sm:space-y-4">
              <Card>
                <CardContent className="p-3 sm:p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <div className="text-xs sm:text-sm font-medium text-muted-foreground">Officer</div>
                      <div className="text-sm sm:text-base font-semibold">{viewingHoliday.officerName}</div>
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-medium text-muted-foreground">Bank Holiday Date</div>
                      <div className="text-sm sm:text-base font-semibold">{format(toDate(viewingHoliday.holidayDate), 'dd MMM yyyy')}</div>
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-medium text-muted-foreground">Date of Request</div>
                      <div className="text-sm sm:text-base font-semibold">{format(toDate(viewingHoliday.dateOfRequest), 'dd MMM yyyy')}</div>
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-medium text-muted-foreground">Authorised By</div>
                      <div className="text-sm sm:text-base font-semibold">{viewingHoliday.authorisedByName ?? 'Pending assignment'}</div>
                    </div>
                    <div className="sm:col-span-2">
                      <div className="text-xs sm:text-sm font-medium text-muted-foreground">Authorization Status</div>
                      <div className="flex items-center gap-2">
                        <MemoizedStatusBadge status={viewingHoliday.status} />
                        {viewingHoliday.dateAuthorised && (
                          <span className="text-xs sm:text-sm">{format(toDate(viewingHoliday.dateAuthorised), 'dd MMM yyyy')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Admin Approval/Denial Section */}
              {viewingHoliday.status === 'pending' && (
                <div className="border-t border-gray-200 pt-3 xs:pt-4 mt-3 xs:mt-4">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-900 mb-2 xs:mb-3">Approval Decision</h3>
                  
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const formData = new FormData(form);
                    const decision = formData.get('decision') as 'authorized' | 'declined';
                    const reason = formData.get('reason') as string;
                    const authorisedByEmployeeIdValue = formData.get('authorisedByEmployeeId') as string;
                    const authorisedByEmployeeId = authorisedByEmployeeIdValue ? Number(authorisedByEmployeeIdValue) : undefined;
                    const dateAuthorised = formData.get('dateAuthorised') as string;
                    
                    if (decision && reason && authorisedByEmployeeId && dateAuthorised && viewingHoliday) {
                      try {
                        await bankHolidayService.updateBankHoliday(viewingHoliday.id, {
                          status: decision,
                          authorisedByEmployeeId,
                          dateAuthorised: new Date(dateAuthorised).toISOString(),
                          reason
                        });
                        
                        await fetchHolidays();
                        
                        toast({
                          title: "Success",
                          description: `Bank holiday request ${decision === 'authorized' ? 'approved' : 'declined'} successfully.`,
                        });
                        
                        setIsViewDialogOpen(false);
                        setViewingHoliday(null);
                      } catch (error) {
                        console.error('Error updating bank holiday request:', error);
                        toast({
                          title: "Error",
                          description: "Failed to update bank holiday request. Please try again.",
                          variant: "destructive"
                        });
                      }
                    } else {
                      toast({
                        title: "Error",
                        description: "Please fill in all required fields, including the authorising manager.",
                        variant: "destructive"
                      });
                    }
                  }} className="space-y-3">
                    <div className="flex gap-2">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="decision"
                          value="authorized"
                          id="approve"
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                          required
                        />
                        <label htmlFor="approve" className="ml-2 text-xs sm:text-sm text-gray-700">
                          Approve
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="decision"
                          value="declined"
                          id="deny"
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                          required
                        />
                        <label htmlFor="deny" className="ml-2 text-xs sm:text-sm text-gray-700">
                          Deny
                        </label>
                      </div>
                    </div>

                    <div className="space-y-3 p-2 sm:p-3 border rounded-lg bg-muted/20">
                      <div>
                        <label htmlFor="authorisedByEmployeeId" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                          Authorised By
                        </label>
                        <select
                          id="authorisedByEmployeeId"
                          name="authorisedByEmployeeId"
                          className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          required
                          defaultValue=""
                          disabled={isEmployeeLoading || managerOptions.length === 0}
                        >
                          <option value="" disabled>Select authorising manager</option>
                          {managerOptions.map((manager) => (
                            <option key={manager.id} value={manager.id}>
                              {manager.fullName}{manager.position ? ` - ${manager.position}` : ''}
                            </option>
                          ))}
                        </select>
                        {managerOptions.length === 0 && !isEmployeeLoading && (
                          <p className="text-[11px] text-muted-foreground mt-1">No managers available. Please add a manager first.</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="dateAuthorised" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                          Date Authorised
                        </label>
                        <div className="relative">
                          <Input
                            type="date"
                            id="dateAuthorised"
                            name="dateAuthorised"
                            className="pl-8 text-sm h-9"
                            defaultValue={format(new Date(), "yyyy-MM-dd")}
                            required
                          />
                          <Calendar className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="reason" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Reason
                      </label>
                      <textarea
                        id="reason"
                        name="reason"
                        rows={3}
                        className="w-full text-xs sm:text-sm rounded-md border border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                        placeholder="Provide a reason for your decision..."
                        required
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        type="button"
                        onClick={() => setIsViewDialogOpen(false)} 
                        className="text-xs sm:text-sm h-8 sm:h-9"
                        size="sm"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        className="text-xs sm:text-sm h-8 sm:h-9"
                        size="sm"
                      >
                        Submit Decision
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {viewingHoliday.status !== 'pending' && (
                <>
                  {viewingHoliday.reason && (
                    <div className="border-t border-gray-200 pt-3 xs:pt-4 mt-3 xs:mt-4">
                      <h3 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">Manager's Comment</h3>
                      <p className="text-xs sm:text-sm text-gray-600 bg-muted/20 p-2 sm:p-3 rounded-md">
                        {viewingHoliday.reason}
                      </p>
                    </div>
                  )}
                  <DialogFooter className="flex-col gap-2 sm:flex-row sm:gap-3 sm:justify-end pt-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsViewDialogOpen(false)} 
                      className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9"
                      size="sm"
                    >
                      Close
                    </Button>
                    <Button 
                      onClick={() => {
                        setViewingHoliday(null);
                        setIsViewDialogOpen(false);
                        setEditingHoliday(viewingHoliday);
                        setIsDialogOpen(true);
                      }}
                      className="w-full sm:w-auto text-xs sm:text-sm h-8 sm:h-9"
                      size="sm"
                    >
                      Edit
                    </Button>
                  </DialogFooter>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
