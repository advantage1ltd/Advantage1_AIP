import React, { useState, useCallback, useEffect } from 'react';
import { officerSupportService, type OfficerSupportUpdate, type OfficerSupportDeclaration } from '@/services/officerSupportService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  Upload, 
  Plus, 
  MoreVertical, 
  Eye, 
  PenSquare, 
  Trash2,
  Calendar,
  FileSignature,
  Users,
  AlertCircle,
  CheckCircle,
  Download,
  Edit2,
  Info,
  User
} from 'lucide-react';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface SignatureData {
  officerName: string;
  signature: string;
}

const StatsCard = ({ title, value, icon, color }) => {
  const colors = {
    blue: {
      bg: "bg-gradient-to-br from-blue-800 to-blue-900",
      border: "border-blue-700",
      iconBg: "bg-blue-700/50",
      textAccent: "text-blue-200"
    },
    green: {
      bg: "bg-gradient-to-br from-green-800 to-green-900",
      border: "border-green-700",
      iconBg: "bg-green-700/50",
      textAccent: "text-green-200"
    },
    purple: {
      bg: "bg-gradient-to-br from-purple-800 to-purple-900",
      border: "border-purple-700",
      iconBg: "bg-purple-700/50",
      textAccent: "text-purple-200"
    }
  };
  
  const colorStyle = colors[color];
  
  return (
    <Card className={`${colorStyle.bg} ${colorStyle.border} border h-full`}>
      <div className="p-3 md:p-4 flex flex-row items-center gap-3">
        <div className={`${colorStyle.iconBg} p-2 rounded-full shrink-0`}>
          {React.cloneElement(icon, { className: "h-5 w-5 text-white" })}
        </div>
        <div className="flex-1">
          <CardTitle className="text-xs sm:text-sm font-medium text-white mb-1">{title}</CardTitle>
          <div className="flex items-baseline gap-1">
            <div className="text-xl sm:text-2xl font-bold text-white">{value}</div>
            <div className={`text-xs ${colorStyle.textAccent}`}>
              {title === "Total Updates" ? "documents" : title === "Active Updates" ? "active" : "officers"}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

const FormField = ({ label, children }) => (
  <div className="grid gap-2">
    <Label>{label}</Label>
    {children}
  </div>
);

const FileUploadField = ({ onChange, currentFileName }) => (
  <div className="flex items-center gap-4">
    <Input
      type="file"
      onChange={onChange}
      className="hidden"
      id="file-upload"
      accept=".pdf,.doc,.docx"
    />
    <Label
      htmlFor="file-upload"
      className="cursor-pointer flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50"
    >
      <Upload className="h-4 w-4" />
      Choose File
    </Label>
    {currentFileName && (
      <span className="text-sm text-gray-600">{currentFileName}</span>
    )}
  </div>
);

const EmptyState = ({
  message,
  actionLabel,
  onAction,
  canManage,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  canManage?: boolean;
}) => (
  <div className="flex flex-col items-center gap-2">
    <FileSignature className="h-8 w-8 text-gray-400" />
    <p className="text-gray-500 text-sm">{message}</p>
    {canManage && actionLabel && onAction && (
      <Button
        variant="link"
        onClick={onAction}
        className="text-blue-600"
      >
        {actionLabel}
      </Button>
    )}
  </div>
);

const OfficerSupportPage: React.FC = () => {
  const { user } = useAuth();
  const normalizedRole = (user?.role || (user as any)?.Role || '').toLowerCase();
  const canManageUpdates = normalizedRole === 'administrator';
  const { toast } = useToast();
  const [updates, setUpdates] = useState<OfficerSupportUpdate[]>([]);
  const [declarations, setDeclarations] = useState<OfficerSupportDeclaration[]>([]);
  const [selectedUpdate, setSelectedUpdate] = useState<OfficerSupportUpdate | null>(null);
  const [signatureData, setSignatureData] = useState<SignatureData>({ officerName: '', signature: '' });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeclarationsDialog, setShowDeclarationsDialog] = useState(false);
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    effectiveDate: '',
    file: null as File | null
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    effectiveDate: '',
    file: null as File | null
  });

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const itemsPerPage = 10;
  
  // Fetch updates from API
  const fetchUpdates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await officerSupportService.getUpdates(currentPage, itemsPerPage);
      setUpdates(response.data);
      setTotalPages(response.pagination.totalPages);
      setTotalCount(response.pagination.totalCount);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load updates';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, toast]);

  // Fetch declarations for selected update
  const fetchDeclarations = useCallback(async (updateId: string) => {
    try {
      const response = await officerSupportService.getDeclarations(1, 100, updateId);
      setDeclarations(response.data);
    } catch (err) {
      console.error('Failed to load declarations:', err);
    }
  }, []);

  useEffect(() => {
    fetchUpdates();
  }, [fetchUpdates]);

  useEffect(() => {
    if (selectedUpdate) {
      fetchDeclarations(selectedUpdate.id);
    }
  }, [selectedUpdate, fetchDeclarations]);
  
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleAddUpdate = useCallback(async () => {
    if (!canManageUpdates) {
      toast({
        title: 'Permission denied',
        description: 'Only administrators can manage officer support updates.',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.file) {
      toast({
        title: 'Error',
        description: 'Please select a file',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSubmitting(true);
      
      // First, upload the file
      const uploadResult = await officerSupportService.uploadFile(formData.file);
      
      // Then create the update with the file URL
      const response = await officerSupportService.createUpdate({
      name: formData.name,
        description: formData.description || undefined,
      effectiveDate: formData.effectiveDate,
        fileName: uploadResult.fileName,
        fileUrl: uploadResult.fileUrl,
      status: 'active'
      });

      toast({
        title: 'Success',
        description: 'Update created successfully'
      });

      setShowAddDialog(false);
      setFormData({
        name: '',
        description: '',
        effectiveDate: '',
        file: null
      });
      
      // Refresh the list
      await fetchUpdates();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create update';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  }, [formData, toast, fetchUpdates, canManageUpdates]);

  const handleSignDeclaration = useCallback(async () => {
    if (!selectedUpdate || !signatureData.officerName || !signatureData.signature) return;

    try {
      setSubmitting(true);
      await officerSupportService.createDeclaration({
        updateId: selectedUpdate.id,
        officerName: signatureData.officerName,
        signature: signatureData.signature,
        acknowledged: true
      });

      toast({
        title: 'Success',
        description: 'Declaration signed successfully'
      });

      setSignatureData({ officerName: '', signature: '' });
      setShowSignDialog(false);
      setShowDocumentPreview(false);
      
      // Refresh declarations and updates
      await fetchDeclarations(selectedUpdate.id);
      await fetchUpdates();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign declaration';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  }, [selectedUpdate, signatureData, toast, fetchDeclarations, fetchUpdates]);

  const handleConfirmDelete = useCallback(async () => {
    if (!canManageUpdates) {
      toast({
        title: 'Permission denied',
        description: 'Only administrators can manage officer support updates.',
        variant: 'destructive'
      });
      return;
    }

    if (!selectedUpdate) return;

    try {
      setSubmitting(true);
      await officerSupportService.deleteUpdate(selectedUpdate.id);
      
      toast({
        title: 'Success',
        description: 'Update deleted successfully'
      });

      setShowDeleteDialog(false);
      setSelectedUpdate(null);
      
      // Refresh the list
      await fetchUpdates();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete update';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  }, [selectedUpdate, toast, fetchUpdates, canManageUpdates]);

  const handleSaveEdit = useCallback(async () => {
    if (!canManageUpdates) {
      toast({
        title: 'Permission denied',
        description: 'Only administrators can manage officer support updates.',
        variant: 'destructive'
      });
      return;
    }

    if (!selectedUpdate) return;

    try {
      setSubmitting(true);
      
      let fileUrl = selectedUpdate.fileUrl;
      let fileName = selectedUpdate.fileName;
      
      if (editFormData.file) {
        // Upload new file if provided
        const uploadResult = await officerSupportService.uploadFile(editFormData.file);
        fileUrl = uploadResult.fileUrl;
        fileName = uploadResult.fileName;
      }

      await officerSupportService.updateUpdate(selectedUpdate.id, {
        name: editFormData.name,
        description: editFormData.description || undefined,
        effectiveDate: editFormData.effectiveDate,
        fileName: editFormData.file ? fileName : undefined,
        fileUrl: editFormData.file ? fileUrl : undefined
      });

      toast({
        title: 'Success',
        description: 'Update updated successfully'
      });

      setShowEditDialog(false);
      setSelectedUpdate(null);
      setEditFormData({
        name: '',
        description: '',
        effectiveDate: '',
        file: null
      });
      
      // Refresh the list
      await fetchUpdates();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  }, [selectedUpdate, editFormData, toast, fetchUpdates, canManageUpdates]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      updates.forEach(update => {
        if (update.fileUrl.startsWith('blob:')) {
          URL.revokeObjectURL(update.fileUrl);
        }
      });
    };
  }, [updates]);

  return (
    <div className="min-h-screen bg-[#EFF4FF] flex flex-col">
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 xl:px-8 2xl:px-12 py-2 sm:py-4 lg:py-6 xl:py-8 2xl:py-10 max-w-screen-2xl flex-grow">
        <div className="space-y-4 md:space-y-6 xl:space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6 xl:mb-8">
            <div className="flex items-center gap-2 sm:gap-3 xl:gap-4">
              <div className="bg-blue-100 p-2 xl:p-3 rounded-lg">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 xl:w-7 xl:h-7 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl xl:text-3xl 2xl:text-4xl font-bold text-gray-900">Officer Support</h1>
                <p className="text-sm xl:text-base text-gray-500">Manage and track security officer documentation and declarations</p>
              </div>
            </div>
            {canManageUpdates && (
              <Button
                onClick={() => setShowAddDialog(true)}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 h-9 sm:h-10 xl:h-12 px-4 xl:px-6 text-sm xl:text-base"
              >
                <Plus className="w-4 h-4 xl:w-5 xl:h-5" />
                Add New Update
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4 xl:gap-6">
            <StatsCard
              title="Total Updates"
              value={totalCount}
              icon={<FileText />}
              color="blue"
            />
            <StatsCard
              title="Active Updates"
              value={updates.filter(u => u.status === 'active').length}
              icon={<CheckCircle />}
              color="green"
            />
            <StatsCard
              title="Total Declarations"
              value={declarations.length}
              icon={<FileSignature />}
              color="purple"
            />
          </div>

          <Card className="w-full shadow-sm">
            <CardHeader className="p-2 md:p-4 xl:p-6">
              <CardTitle className="text-base sm:text-xl xl:text-2xl flex items-center gap-2 xl:gap-3">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 xl:h-6 xl:w-6 text-blue-600" />
                Security Updates & Declarations
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm xl:text-base">
                Track and manage security updates and officer declarations
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="font-semibold text-gray-900 whitespace-nowrap p-2 md:p-4 xl:p-6 w-[35%] sm:w-[30%] lg:w-[25%]">
                        <div className="flex items-center gap-2 xl:gap-3">
                          <FileText className="w-4 h-4 xl:w-5 xl:h-5 text-gray-500" />
                          <span className="text-sm xl:text-base">Update</span>
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-900 p-2 md:p-4 xl:p-6 w-[45%] sm:w-[40%] lg:w-[35%] text-sm xl:text-base">Description</TableHead>
                      <TableHead className="font-semibold text-gray-900 whitespace-nowrap p-2 md:p-4 xl:p-6 hidden md:table-cell w-[15%]">
                        <div className="flex items-center gap-2 xl:gap-3">
                          <Calendar className="w-4 h-4 xl:w-5 xl:h-5 text-gray-500" />
                          <span className="text-sm xl:text-base">Date</span>
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-900 whitespace-nowrap p-2 md:p-4 xl:p-6 hidden md:table-cell w-[15%]">
                        <div className="flex items-center gap-2 xl:gap-3">
                          <Users className="w-4 h-4 xl:w-5 xl:h-5 text-gray-500" />
                          <span className="text-sm xl:text-base">Signed</span>
                        </div>
                      </TableHead>
                      <TableHead className="font-semibold text-gray-900 text-right p-2 md:p-4 xl:p-6 w-[90px] md:w-[120px] xl:w-[150px] text-sm xl:text-base">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center p-2 md:p-4 xl:p-6">
                          <div className="flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="ml-2 text-gray-600">Loading...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : error ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center p-2 md:p-4 xl:p-6">
                          <div className="flex flex-col items-center gap-2">
                            <AlertCircle className="h-8 w-8 text-red-500" />
                            <p className="text-red-600">{error}</p>
                            <Button onClick={fetchUpdates} variant="outline" size="sm">
                              Retry
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      updates.map((update) => (
                      <TableRow 
                        key={update.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <TableCell className="font-medium text-gray-900 p-2 md:p-4 xl:p-6 truncate max-w-[100px] sm:max-w-[150px] md:max-w-none text-sm xl:text-base">
                          {update.name}
                        </TableCell>
                        <TableCell className="text-gray-600 p-2 md:p-4 xl:p-6 truncate max-w-[100px] sm:max-w-[150px] md:max-w-md text-sm xl:text-base">
                          {update.description}
                        </TableCell>
                        <TableCell className="text-gray-600 whitespace-nowrap p-2 md:p-4 xl:p-6 hidden md:table-cell text-sm xl:text-base">
                          {new Date(update.effectiveDate).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                        </TableCell>
                        <TableCell className="p-2 md:p-4 xl:p-6 hidden md:table-cell">
                          <Badge 
                            variant="secondary"
                            className="bg-blue-50 text-blue-700 hover:bg-blue-50 text-xs sm:text-sm xl:text-base whitespace-nowrap"
                          >
                            {declarations.filter(d => d.updateId === update.id).length} Officers
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right p-1 md:p-2 xl:p-4">
                          <div className="flex items-center justify-end gap-1 md:gap-2 xl:gap-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUpdate(update);
                                setShowDocumentPreview(true);
                              }}
                              className="h-7 w-7 md:h-8 md:w-8 xl:h-10 xl:w-10 p-0 text-blue-600 border border-blue-200 hover:bg-blue-50"
                              title="View Document"
                            >
                              <Eye className="h-3 w-3 md:h-4 md:w-4 xl:h-5 xl:w-5" />
                              <span className="sr-only">View</span>
                            </Button>
                            {canManageUpdates && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUpdate(update);
                                    setEditFormData({
                                      name: update.name,
                                      description: update.description,
                                      effectiveDate: update.effectiveDate,
                                      file: null
                                    });
                                    setShowEditDialog(true);
                                  }}
                                  className="h-7 w-7 md:h-8 md:w-8 xl:h-10 xl:w-10 p-0 text-green-600 border border-green-200 hover:bg-green-50"
                                  title="Edit Update"
                                >
                                  <Edit2 className="h-3 w-3 md:h-4 md:w-4 xl:h-5 xl:w-5" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUpdate(update);
                                    setShowDeleteDialog(true);
                                  }}
                                  className="h-7 w-7 md:h-8 md:w-8 xl:h-10 xl:w-10 p-0 text-red-600 border border-red-200 hover:bg-red-50"
                                  title="Delete Update"
                                >
                                  <Trash2 className="h-3 w-3 md:h-4 md:w-4 xl:h-5 xl:w-5" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      ))
                    )}
                    {!loading && !error && updates.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center p-2 md:p-4 xl:p-6">
                          <EmptyState
                            message="No updates found"
                            actionLabel="Create your first update"
                            onAction={() => setShowAddDialog(true)}
                            canManage={canManageUpdates}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {totalPages > 1 && (
                <div className="py-2 md:py-4 xl:py-6 border-t">
                  <Pagination>
                    <PaginationContent className="flex flex-wrap justify-center gap-1 md:gap-2 xl:gap-3">
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                          className={`${currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} h-8 md:h-9 xl:h-11`}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          if (window.innerWidth < 640) {
                            return page === 1 || page === totalPages || 
                                  Math.abs(page - currentPage) <= 1;
                          }
                          return true;
                        })
                        .map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => handlePageChange(page)}
                              isActive={page === currentPage}
                              className="cursor-pointer h-8 md:h-9 xl:h-11 w-8 md:w-9 xl:w-11 text-sm xl:text-base"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))
                      }
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} 
                          className={`${currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} h-8 md:h-9 xl:h-11`}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <footer className="w-full bg-white border-t border-gray-200 py-4 xl:py-6 mt-auto">
        <div className="container mx-auto px-4 md:px-6 xl:px-8 max-w-screen-2xl">
          {/* Footer content removed */}
        </div>
      </footer>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="w-[calc(100%-32px)] sm:max-w-[600px] p-2 md:p-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-base sm:text-lg">Add New Update</DialogTitle>
            <DialogDescription className="text-sm">
              Create a new security update and document for officer declarations
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 md:gap-4 py-2 md:py-4">
            <FormField label="Update Name">
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter update name"
                className="h-9"
              />
            </FormField>
            <FormField label="Description">
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter update description"
                rows={4}
                className="h-20"
              />
            </FormField>
            <FormField label="Effective Date">
              <Input
                type="date"
                value={formData.effectiveDate}
                onChange={(e) => setFormData(prev => ({ ...prev, effectiveDate: e.target.value }))}
                className="h-9"
              />
            </FormField>
            <FormField label="Upload Document">
              <FileUploadField
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setFormData(prev => ({ ...prev, file: e.target.files![0] }));
                  }
                }}
                currentFileName={formData.file?.name}
              />
            </FormField>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setShowAddDialog(false)}
              className="w-full sm:w-auto h-9"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddUpdate}
              className="w-full sm:w-auto h-9 bg-blue-600 hover:bg-blue-700"
              disabled={!formData.name || !formData.description || !formData.effectiveDate || !formData.file || submitting}
            >
              {submitting ? 'Creating...' : 'Add Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeclarationsDialog} onOpenChange={setShowDeclarationsDialog}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Officer Declarations</DialogTitle>
            <DialogDescription>
              View all officer declarations for {selectedUpdate?.name}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] rounded-md border p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Officer Name</TableHead>
                  <TableHead>Signature Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {declarations
                  .filter(declaration => declaration.updateId === selectedUpdate?.id)
                  .map((declaration) => (
                  <TableRow key={declaration.id}>
                    <TableCell className="font-medium">{declaration.officerName}</TableCell>
                    <TableCell>{declaration.signatureDate}</TableCell>
                    <TableCell>
                      <Badge 
                        className={declaration.acknowledged 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'}
                      >
                        {declaration.acknowledged ? 'Signed' : 'Pending'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={showDocumentPreview} onOpenChange={setShowDocumentPreview}>
        <DialogContent className="w-[calc(100%-16px)] sm:w-[calc(100%-32px)] max-w-[90vw] h-[90vh] p-0">
          <div className="flex flex-col h-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-2 md:p-4 border-b gap-3 sm:gap-0">
              <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
                <FileText className="h-5 w-5 text-blue-600 shrink-0" />
                <div className="overflow-hidden">
                  <h2 className="text-base sm:text-lg font-semibold truncate">{selectedUpdate?.name}</h2>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">Effective from: {selectedUpdate?.effectiveDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSignDialog(true)}
                  className="flex items-center gap-2 flex-1 sm:flex-none justify-center h-9"
                >
                  <FileSignature className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign Declaration</span>
                  <span className="sm:hidden">Sign</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-2 flex-1 sm:flex-none justify-center h-9"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Download</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowDocumentPreview(false)}
                  className="h-9"
                >
                  ✕
                </Button>
              </div>
            </div>

            <Tabs defaultValue="document" className="flex-1 flex flex-col">
              <div className="px-2 md:px-6 border-b overflow-x-auto">
                <TabsList className="w-full sm:w-auto">
                  <TabsTrigger value="document" className="flex-1 sm:flex-none">Document</TabsTrigger>
                  <TabsTrigger value="declarations" className="flex-1 sm:flex-none">Declarations ({declarations.filter(d => d.updateId === selectedUpdate?.id).length})</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="document" className="flex-1 p-2 md:p-6">
                <div className="h-full border rounded-md bg-white overflow-hidden">
                  <iframe
                    src={selectedUpdate?.fileUrl?.startsWith('http') 
                      ? selectedUpdate.fileUrl 
                      : `${import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5128'}${selectedUpdate?.fileUrl}`}
                    className="w-full h-full"
                    title={selectedUpdate?.name}
                  />
                </div>
              </TabsContent>
              <TabsContent value="declarations" className="p-2 md:p-6 overflow-auto">
                <div className="space-y-3 md:space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-3">
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold">Officer Declarations</h3>
                      <p className="text-xs sm:text-sm text-gray-500">
                        Officers who have signed this document
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowSignDialog(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                    >
                      Sign Declaration
                    </Button>
                  </div>
                  
                  <div className="overflow-x-auto min-w-[320px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="p-2 md:p-4 w-[40%]">Officer Name</TableHead>
                          <TableHead className="p-2 md:p-4 w-[40%]">Signature Date</TableHead>
                          <TableHead className="p-2 md:p-4 w-[20%]">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {declarations
                          .filter(d => d.updateId === selectedUpdate?.id)
                          .map((declaration) => (
                            <TableRow key={declaration.id}>
                              <TableCell className="font-medium p-2 md:p-4">
                                {declaration.officerName}
                              </TableCell>
                              <TableCell className="p-2 md:p-4">{declaration.signatureDate}</TableCell>
                              <TableCell className="p-2 md:p-4">
                                <Badge className="bg-green-100 text-green-700">
                                  Signed
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        {declarations.filter(d => d.updateId === selectedUpdate?.id).length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center p-2 md:p-4">
                              <div className="flex flex-col items-center gap-2">
                                <FileSignature className="h-8 w-8 text-gray-400" />
                                <p className="text-gray-500 text-sm">No declarations yet</p>
                                <Button
                                  variant="link"
                                  onClick={() => setShowSignDialog(true)}
                                  className="text-blue-600"
                                >
                                  Be the first to sign
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showSignDialog} onOpenChange={setShowSignDialog}>
        <AlertDialogContent className="w-[calc(100%-16px)] sm:w-[calc(100%-32px)] max-w-[500px] p-2 md:p-4 max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">Sign Declaration</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              By signing this declaration, you confirm that you have read and understood the document: {selectedUpdate?.name}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2 md:gap-4 py-2 md:py-4">
            <div className="grid gap-2">
              <Label>Officer Name</Label>
              <Input
                value={signatureData.officerName}
                onChange={(e) => setSignatureData(prev => ({ ...prev, officerName: e.target.value }))}
                placeholder="Enter your full name"
                className="h-9"
              />
            </div>
            <div className="grid gap-2">
              <Label>Digital Signature</Label>
              <Input
                value={signatureData.signature}
                onChange={(e) => setSignatureData(prev => ({ ...prev, signature: e.target.value }))}
                placeholder="Type your full name as signature"
                className="h-9"
              />
            </div>
            <div className="bg-gray-50 p-2 md:p-4 rounded-md text-xs sm:text-sm text-gray-600">
              <p>I hereby declare that:</p>
              <ul className="list-disc pl-4 md:pl-5 mt-2 space-y-1">
                <li>I have read and fully understood the contents of this document</li>
                <li>I agree to comply with all procedures and guidelines outlined</li>
                <li>I understand that this declaration will be recorded and stored</li>
              </ul>
            </div>
          </div>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel onClick={() => setShowSignDialog(false)} className="w-full sm:w-auto h-9">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSignDeclaration}
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto h-9"
              disabled={!signatureData.officerName || !signatureData.signature || submitting}
            >
              {submitting ? 'Signing...' : 'Sign Declaration'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="w-[calc(100%-16px)] sm:w-[calc(100%-32px)] max-w-[600px] p-2 md:p-4 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Edit Update</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Make changes to the security update
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 md:gap-4 py-2 md:py-4">
            <div className="grid gap-2">
              <Label>Update Name</Label>
              <Input
                value={editFormData.name}
                onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter update name"
                className="h-9"
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                value={editFormData.description}
                onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter update description"
                rows={4}
                className="h-20"
              />
            </div>
            <div className="grid gap-2">
              <Label>Effective Date</Label>
              <Input
                type="date"
                value={editFormData.effectiveDate}
                onChange={(e) => setEditFormData(prev => ({ ...prev, effectiveDate: e.target.value }))}
                className="h-9"
              />
            </div>
            <div className="grid gap-2">
              <Label>Update Document (Optional)</Label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <Input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setEditFormData(prev => ({ ...prev, file: e.target.files![0] }));
                    }
                  }}
                  className="hidden"
                  id="edit-file-upload"
                  accept=".pdf,.doc,.docx"
                />
                <Label
                  htmlFor="edit-file-upload"
                  className="cursor-pointer flex items-center justify-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50 w-full sm:w-auto"
                >
                  <Upload className="h-4 w-4" />
                  Choose New File
                </Label>
                <div className="text-sm text-gray-600 truncate">
                  {editFormData.file ? (
                    <span>{editFormData.file.name}</span>
                  ) : (
                    <span>Current: {selectedUpdate?.fileName}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setShowEditDialog(false)}
              className="w-full sm:w-auto h-9"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              className="w-full sm:w-auto h-9 bg-blue-600 hover:bg-blue-700"
              disabled={!editFormData.name || !editFormData.description || !editFormData.effectiveDate || submitting}
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="w-[calc(100%-16px)] sm:w-[calc(100%-32px)] max-w-[500px] p-2 md:p-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg">Delete Update</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Are you sure you want to delete this update? This action cannot be undone.
              All associated declarations will also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel 
              onClick={() => setShowDeleteDialog(false)}
              className="w-full sm:w-auto h-9"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto h-9"
              disabled={submitting}
            >
              {submitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OfficerSupportPage;
