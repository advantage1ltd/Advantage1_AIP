import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { format, parseISO } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { managerSupportService, type ManagerSupportUpdate, type ManagerSupportDeclaration } from '@/services/managerSupportService';
import { BASE_API_URL } from '@/config/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import {
	CalendarIcon,
	Upload,
	Download,
	FileText,
	Eye,
	Pencil,
	Trash2,
	FileIcon,
	CheckCircle,
	InfoIcon,
	AlertTriangle,
	Loader2
} from 'lucide-react';

interface UpdateFormProps {
	updateName: string;
	setUpdateName: (name: string) => void;
	description: string;
	setDescription: (desc: string) => void;
	effectiveDate: Date | undefined;
	setEffectiveDate: (date: Date | undefined) => void;
	selectedFile: File | null;
	handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	currentFileName?: string;
	formId: string;
	disabled?: boolean;
}

const createUpdateSchema = z.object({
	updateName: z.string().min(2, 'Update name is required'),
	description: z.string().max(2000, 'Description is too long').optional(),
	effectiveDate: z.date({ required_error: 'Effective date is required' }),
	file: z.instanceof(File, { message: 'Document file is required' })
});

const editUpdateSchema = createUpdateSchema.extend({
	file: z.instanceof(File).optional()
});

const initialFormState = {
	updateName: '',
	description: '',
	effectiveDate: undefined as Date | undefined,
	selectedFile: null as File | null
};

const UpdateForm: React.FC<UpdateFormProps> = ({
	updateName,
	setUpdateName,
	description,
	setDescription,
	effectiveDate,
	setEffectiveDate,
	selectedFile,
	handleFileChange,
	currentFileName,
	formId,
	disabled
}) => (
	<div className='space-y-3 sm:space-y-4 py-2 sm:py-4'>
		<div className='space-y-1 sm:space-y-2'>
			<label htmlFor={`updateName-${formId}`} className='text-xs sm:text-sm font-medium'>
				Update Name
			</label>
			<Input
				id={`updateName-${formId}`}
				placeholder='Enter update name'
				value={updateName}
				onChange={(e) => setUpdateName(e.target.value)}
				className='w-full border-gray-300 text-sm'
				disabled={disabled}
			/>
		</div>

		<div className='space-y-1 sm:space-y-2'>
			<label htmlFor={`description-${formId}`} className='text-xs sm:text-sm font-medium'>
				Description
			</label>
			<Textarea
				id={`description-${formId}`}
				placeholder='Enter update description'
				value={description}
				onChange={(e) => setDescription(e.target.value)}
				className='min-h-[80px] sm:min-h-[100px] resize-none border-gray-300 text-sm'
				disabled={disabled}
			/>
		</div>

		<div className='space-y-1 sm:space-y-2'>
			<label className='text-xs sm:text-sm font-medium'>Effective Date</label>
			<Input
				type='date'
				value={effectiveDate ? format(effectiveDate, 'yyyy-MM-dd') : ''}
				onChange={(e) => setEffectiveDate(e.target.value ? new Date(`${e.target.value}T00:00:00`) : undefined)}
				className='w-full border-gray-300 text-sm'
				disabled={disabled}
			/>
		</div>

		<div className='space-y-1 sm:space-y-2'>
			<label className='text-xs sm:text-sm font-medium'>Upload Document</label>
			<div className='mt-1 flex flex-wrap items-center gap-2'>
				<label
					htmlFor={`file-upload-${formId}`}
					className={cn(
						'cursor-pointer rounded-md bg-white px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50',
						disabled && 'pointer-events-none opacity-70'
					)}
				>
					<span className='flex items-center'>
						<Upload className='mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4' />
						Choose File
					</span>
					<input
						id={`file-upload-${formId}`}
						name='file-upload'
						type='file'
						className='sr-only'
						onChange={handleFileChange}
						disabled={disabled}
						accept='.pdf,.doc,.docx,.txt'
					/>
				</label>
				<span className='text-xs sm:text-sm text-gray-500 truncate max-w-[200px]'>
					{selectedFile ? selectedFile.name : currentFileName || 'No file selected'}
				</span>
			</div>
		</div>
	</div>
);

const SummaryCard: React.FC<{
	title: string;
	value: number;
	icon: React.ReactElement;
	bgColor: string;
	textColor: string;
	iconColor: string;
}> = ({ title, value, icon, bgColor, textColor, iconColor }) => (
	<Card className={`${bgColor} h-full`}>
		<CardContent className='p-4'>
			<div className='flex justify-between items-center'>
				<div>
					<p className={`${textColor} font-medium text-base`}>{title}</p>
					<p className={`text-3xl font-bold ${textColor}`}>{value}</p>
				</div>
				{React.cloneElement(icon, { className: `h-6 w-6 ${iconColor}` })}
			</div>
		</CardContent>
	</Card>
);

type DialogType = 'create' | 'view' | 'edit' | 'delete';

const ManagerSupportPage: React.FC = () => {
	const { user, isLoading: authLoading } = useAuth();
	const { toast } = useToast();
	const [updates, setUpdates] = useState<ManagerSupportUpdate[]>([]);
	const [declarations, setDeclarations] = useState<ManagerSupportDeclaration[]>([]);
	const [declarationsLoading, setDeclarationsLoading] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [dialogState, setDialogState] = useState<Record<DialogType, boolean>>({
		create: false,
		view: false,
		edit: false,
		delete: false
	});
	const [formState, setFormState] = useState(initialFormState);
	const [selectedUpdate, setSelectedUpdate] = useState<ManagerSupportUpdate | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<ManagerSupportUpdate | null>(null);
	const [showSignDialog, setShowSignDialog] = useState(false);
	const [signatureData, setSignatureData] = useState({ managerName: '', signature: '' });

	const normalizedRole = (user?.role || (user as any)?.Role || '').toLowerCase();
	const isAdmin = normalizedRole === 'administrator';

	const fileHost = useMemo(() => {
		const override = import.meta.env.VITE_FILE_BASE_URL as string | undefined;
		const target = override || BASE_API_URL;
		try
		{
			const url = new URL(target);
			const trimmedPath = url.pathname.replace(/\/api\/?$/, '');
			const base = `${url.origin}${trimmedPath}`.replace(/\/$/, '');
			return base || window.location.origin;
		}
		catch
		{
			const fallback = target.replace(/\/api\/?$/, '');
			return fallback || window.location.origin;
		}
	}, []);

	const resolveFileUrl = useCallback((fileUrl: string) => {
		if (!fileUrl) return '';
		if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
			return fileUrl;
		}

		const normalizedPath = fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
		return `${fileHost}${normalizedPath}`;
	}, [fileHost]);

	const safeParseDate = (value?: string) => {
		if (!value) return undefined;
		const parsed = parseISO(value);
		return Number.isNaN(parsed.getTime()) ? undefined : parsed;
	};

	const resetFormState = () => setFormState(initialFormState);

	const fetchUpdates = useCallback(async () => {
		if (!isAdmin) {
			setLoading(false);
			return;
		}

		try {
			setLoading(true);
			setError(null);
			const response = await managerSupportService.getUpdates(1, 50);
			setUpdates(response.data);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to load manager support updates';
			setError(message);
			toast({
				title: 'Failed to load updates',
				description: message,
				variant: 'destructive'
			});
		} finally {
			setLoading(false);
		}
	}, [isAdmin, toast]);

	useEffect(() => {
		fetchUpdates();
	}, [fetchUpdates]);

	const handleOpenDialog = (type: DialogType, update?: ManagerSupportUpdate) => {
		if (!isAdmin) {
			toast({
				title: 'Restricted',
				description: 'Only administrators can manage manager support updates.',
				variant: 'destructive'
			});
			return;
		}

		if (type === 'create') {
			resetFormState();
		}

		if (update && (type === 'view' || type === 'edit')) {
			setSelectedUpdate(update);
			if (type === 'view') {
				void fetchDeclarations(update.id);
			}
		}

		if (type === 'edit' && update) {
			setFormState({
				updateName: update.name,
				description: update.description ?? '',
				effectiveDate: safeParseDate(update.effectiveDate),
				selectedFile: null
			});
		}

		if (type === 'delete' && update) {
			setDeleteTarget(update);
		}

		setDialogState((prev) => ({ ...prev, [type]: true }));
	};

	const handleCloseDialog = (type: DialogType) => {
		setDialogState((prev) => ({ ...prev, [type]: false }));
		if (type === 'create' || type === 'edit') {
			resetFormState();
			setSelectedUpdate(null);
		}

		if (type === 'view') {
			setSelectedUpdate(null);
			setDeclarations([]);
			setShowSignDialog(false);
			setSignatureData({ managerName: '', signature: '' });
		}

		if (type === 'delete') {
			setDeleteTarget(null);
		}
	};

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files && event.target.files[0]) {
			setFormState((prev) => ({ ...prev, selectedFile: event.target.files![0] }));
		}
	};

	const handleCreate = async () => {
		const validation = createUpdateSchema.safeParse({
			updateName: formState.updateName.trim(),
			description: formState.description.trim() || undefined,
			effectiveDate: formState.effectiveDate,
			file: formState.selectedFile
		});

		if (!validation.success) {
			toast({
				title: 'Validation error',
				description: validation.error.issues[0]?.message ?? 'Please review the form',
				variant: 'destructive'
			});
			return;
		}

		try {
			setSubmitting(true);
			const upload = await managerSupportService.uploadFile(validation.data.file);

			await managerSupportService.createUpdate({
				name: validation.data.updateName,
				description: validation.data.description,
				effectiveDate: format(validation.data.effectiveDate, 'yyyy-MM-dd'),
				fileName: upload.fileName,
				fileUrl: upload.fileUrl,
				status: 'active'
			});

			toast({
				title: 'Update created',
				description: 'Manager support update created successfully.'
			});
			handleCloseDialog('create');
			await fetchUpdates();
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Unable to create update';
			toast({
				title: 'Creation failed',
				description: message,
				variant: 'destructive'
			});
		} finally {
			setSubmitting(false);
		}
	};

	const handleUpdate = async () => {
		if (!selectedUpdate) {
			toast({
				title: 'No update selected',
				description: 'Select an update to modify.',
				variant: 'destructive'
			});
			return;
		}

		const validation = editUpdateSchema.safeParse({
			updateName: formState.updateName.trim(),
			description: formState.description.trim() || undefined,
			effectiveDate: formState.effectiveDate,
			file: formState.selectedFile ?? undefined
		});

		if (!validation.success) {
			toast({
				title: 'Validation error',
				description: validation.error.issues[0]?.message ?? 'Please review the form',
				variant: 'destructive'
			});
		 return;
		}

		try {
			setSubmitting(true);
			let filePayload: { fileName?: string; fileUrl?: string } = {};
			if (validation.data.file) {
				const upload = await managerSupportService.uploadFile(validation.data.file);
				filePayload = { fileName: upload.fileName, fileUrl: upload.fileUrl };
			}

			await managerSupportService.updateUpdate(selectedUpdate.id, {
				name: validation.data.updateName,
				description: validation.data.description,
				effectiveDate: format(validation.data.effectiveDate, 'yyyy-MM-dd'),
				...filePayload
			});

			toast({
				title: 'Update saved',
				description: 'Manager support update modified successfully.'
			});
			handleCloseDialog('edit');
			await fetchUpdates();
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Unable to update record';
			toast({
				title: 'Update failed',
				description: message,
				variant: 'destructive'
			});
		} finally {
			setSubmitting(false);
		}
	};

	const handleDelete = async () => {
		if (!deleteTarget) {
			return;
		}

		try {
			setSubmitting(true);
			await managerSupportService.deleteUpdate(deleteTarget.id);
			toast({
				title: 'Update deleted',
				description: `"${deleteTarget.name}" has been removed.`
			});
			handleCloseDialog('delete');
			await fetchUpdates();
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Unable to delete update';
			toast({
				title: 'Deletion failed',
				description: message,
				variant: 'destructive'
			});
		} finally {
			setSubmitting(false);
		}
	};

	const handleDownload = (update: ManagerSupportUpdate) => {
		const url = resolveFileUrl(update.fileUrl);
		if (!url) {
			toast({
				title: 'File unavailable',
				description: 'Unable to locate the document for download.',
				variant: 'destructive'
			});
			return;
		}
		window.open(url, '_blank', 'noopener,noreferrer');
	};

	const handleSignDeclaration = async () => {
		if (!selectedUpdate) {
			toast({
				title: 'No update selected',
				description: 'Select an update to sign.',
				variant: 'destructive'
			});
			return;
		}

		if (!signatureData.managerName || !signatureData.signature) {
			toast({
				title: 'Missing details',
				description: 'Enter your name and signature to continue.',
				variant: 'destructive'
			});
			return;
		}

		try {
			setSubmitting(true);
			await managerSupportService.createDeclaration({
				updateId: selectedUpdate.id,
				managerName: signatureData.managerName,
				signature: signatureData.signature,
				acknowledged: true
			});

			toast({
				title: 'Declaration recorded',
				description: 'Thank you for acknowledging this update.'
			});

			setSignatureData({ managerName: '', signature: '' });
			setShowSignDialog(false);
			await Promise.all([fetchDeclarations(selectedUpdate.id), fetchUpdates()]);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Unable to sign declaration';
			toast({
				title: 'Declaration failed',
				description: message,
				variant: 'destructive'
			});
		} finally {
			setSubmitting(false);
		}
	};

	const selectedDocumentUrl = useMemo(
		() => (selectedUpdate ? resolveFileUrl(selectedUpdate.fileUrl) : ''),
		[selectedUpdate, resolveFileUrl]
	);

	const summaryStats = useMemo(() => {
		const totalUpdates = updates.length;
		const activeUpdates = updates.filter((update) => update.status === 'active').length;
		const totalDeclarations = updates.reduce((sum, update) => sum + (update.totalDeclarations ?? 0), 0);
		return { totalUpdates, activeUpdates, totalDeclarations };
	}, [updates]);

	const fetchDeclarations = useCallback(async (updateId: string) => {
		try {
			setDeclarationsLoading(true);
			const response = await managerSupportService.getDeclarations(1, 100, updateId);
			setDeclarations(response.data);
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Unable to load declarations';
			toast({
				title: 'Declaration error',
				description: message,
				variant: 'destructive'
			});
		} finally {
			setDeclarationsLoading(false);
		}
	}, [toast]);

	if (authLoading) {
		return (
			<div className='flex items-center justify-center py-20'>
				<Loader2 className='h-8 w-8 animate-spin text-blue-600' />
			</div>
		);
	}

	if (!isAdmin) {
		return (
			<div className='container mx-auto max-w-screen-md px-4 py-10'>
				<Alert variant='destructive'>
					<AlertTitle>Access restricted</AlertTitle>
					<AlertDescription>Only administrators can access the Manager Support workspace.</AlertDescription>
				</Alert>
			</div>
		);
	}

	return (
		<TooltipProvider>
			<div className='container mx-auto px-1 sm:px-2 md:px-6 lg:px-8 xl:px-10 2xl:px-12 py-2 md:py-6 lg:py-8 xl:py-10 2xl:py-12 max-w-screen-2xl'>
				<div className='flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 mb-3 md:mb-6 xl:mb-8'>
					<h1 className='text-xl sm:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-bold'>Manager Support</h1>
					<Button
						onClick={() => handleOpenDialog('create')}
						className='bg-blue-500 hover:bg-blue-600 w-auto ml-auto text-xs sm:text-sm xl:text-base py-1 h-7 sm:h-8 xl:h-10 px-3 sm:px-4 xl:px-6'
						disabled={submitting}
					>
						<span className='whitespace-nowrap'>Add New</span>
					</Button>
				</div>

				<div className='grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-4 xl:gap-6 mb-3 md:mb-6 xl:mb-8'>
					<SummaryCard
						title='Total Updates'
						value={summaryStats.totalUpdates}
						icon={<FileIcon />}
						bgColor='bg-blue-700'
						textColor='text-white'
						iconColor='text-white'
					/>
					<SummaryCard
						title='Active Updates'
						value={summaryStats.activeUpdates}
						icon={<CheckCircle />}
						bgColor='bg-green-700'
						textColor='text-white'
						iconColor='text-white'
					/>
					<div className='col-span-2 sm:col-span-1'>
						<SummaryCard
							title='Total Declarations'
							value={summaryStats.totalDeclarations}
							icon={<FileText />}
							bgColor='bg-purple-700'
							textColor='text-white'
							iconColor='text-white'
						/>
					</div>
				</div>

				<Card className='overflow-hidden'>
					<CardContent className='p-2 sm:p-4 md:p-6 xl:p-8'>
						<div className='flex items-center gap-1 sm:gap-2 xl:gap-3 mb-2 md:mb-4 xl:mb-6'>
							<InfoIcon className='h-4 w-4 sm:h-5 sm:w-5 xl:h-6 xl:w-6 text-blue-500' />
							<h2 className='text-lg sm:text-xl xl:text-2xl 2xl:text-3xl font-semibold'>Security Updates & Declarations</h2>
						</div>
						<p className='text-xs sm:text-sm xl:text-base text-gray-600 mb-3 md:mb-6 xl:mb-8'>
							Track and manage security updates and manager acknowledgements
						</p>

						{error && (
							<div className='mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-center justify-between flex-wrap gap-2'>
								<span>{error}</span>
								<Button variant='outline' size='sm' onClick={fetchUpdates}>
									Retry
								</Button>
							</div>
						)}

						<div className='overflow-x-auto -mx-2 sm:mx-0'>
							<div className='inline-block min-w-full align-middle'>
								<Table>
									<TableHeader>
										<TableRow className='hover:bg-transparent'>
											<TableHead className='w-[25%] py-2 px-1 sm:px-4 xl:px-6'>
												<div className='flex items-center gap-1 sm:gap-2 xl:gap-3'>
													<FileIcon className='h-3 w-3 xl:h-4 xl:w-4 text-blue-500' />
													<span className='font-semibold text-[10px] sm:text-xs xl:text-sm'>Update Name</span>
												</div>
											</TableHead>
											<TableHead className='hidden md:table-cell w-[40%] py-2 xl:py-4'>
												<span className='font-semibold text-[10px] sm:text-xs xl:text-sm'>Description</span>
											</TableHead>
											<TableHead className='w-[15%] py-2 px-1 sm:px-4 xl:px-6'>
												<div className='flex items-center gap-1 sm:gap-2 xl:gap-3'>
													<CalendarIcon className='h-3 w-3 xl:h-4 xl:w-4 text-blue-500' />
													<span className='font-semibold text-[10px] sm:text-xs xl:text-sm'>Date</span>
												</div>
											</TableHead>
											<TableHead className='hidden lg:table-cell w-[10%] py-2 px-1 sm:px-4 xl:px-6 text-center'>
												<span className='font-semibold text-[10px] sm:text-xs xl:text-sm'>Declarations</span>
											</TableHead>
											<TableHead className='w-[15%] text-right py-2 px-1 sm:px-4 xl:px-6'>
												<span className='font-semibold text-[10px] sm:text-xs xl:text-sm'>Actions</span>
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{loading ? (
											<TableRow>
												<TableCell colSpan={5} className='h-32 text-center'>
													<div className='flex items-center justify-center gap-2 text-sm text-gray-600'>
														<Loader2 className='h-5 w-5 animate-spin text-blue-600' />
														Loading updates...
													</div>
												</TableCell>
											</TableRow>
										) : updates.length === 0 ? (
											<TableRow>
												<TableCell colSpan={5} className='h-32 text-center text-sm text-gray-500'>
													No manager support updates found. Start by creating one.
												</TableCell>
											</TableRow>
										) : (
											updates.map((update) => (
												<TableRow key={update.id} className='hover:bg-gray-50'>
													<TableCell className='py-1.5 sm:py-2 md:py-4 xl:py-6 px-1 sm:px-4 xl:px-6'>
														<div className='font-medium text-blue-600 text-[10px] xs:text-xs sm:text-sm md:text-base xl:text-lg max-w-[200px] xl:max-w-[300px] truncate'>
															{update.name}
														</div>
														<div className='md:hidden text-[9px] xs:text-[10px] xl:text-xs text-gray-500 line-clamp-1 mt-0.5 max-w-[200px]'>
															{update.description || 'No description provided'}
														</div>
														<div className='mt-1'>
															<Badge variant='secondary' className='text-[10px] xs:text-xs sm:text-sm'>
																{update.status === 'active' ? 'Active' : 'Archived'}
															</Badge>
														</div>
													</TableCell>
													<TableCell className='hidden md:table-cell py-1.5 sm:py-2 md:py-4 xl:py-6'>
														<div className='text-gray-600 text-xs sm:text-sm md:text-base xl:text-lg line-clamp-2 max-w-[300px] xl:max-w-[500px]'>
															{update.description || 'No description provided'}
														</div>
													</TableCell>
													<TableCell className='py-1.5 sm:py-2 md:py-4 xl:py-6 px-1 sm:px-4 xl:px-6'>
														<div className='text-gray-600 text-[10px] xs:text-xs sm:text-sm md:text-base xl:text-lg whitespace-nowrap'>
															{format(safeParseDate(update.effectiveDate) ?? new Date(update.effectiveDate), 'dd/MM/yyyy')}
														</div>
													</TableCell>
													<TableCell className='hidden lg:table-cell py-1.5 sm:py-2 md:py-4 xl:py-6 text-center'>
														<Badge className='bg-blue-50 text-blue-700 hover:bg-blue-50 text-xs sm:text-sm xl:text-base whitespace-nowrap'>
															{update.totalDeclarations} signed
														</Badge>
													</TableCell>
													<TableCell className='py-1.5 sm:py-2 md:py-4 xl:py-6 px-0.5 sm:px-4 xl:px-6'>
														<div className='flex justify-end items-center gap-0.5 sm:gap-1 xl:gap-2'>
															{[
																{
																	icon: <Eye />,
																	color: 'text-blue-600',
																	hoverColor: 'hover:bg-blue-50',
																	action: () => handleOpenDialog('view', update)
																},
																{
																	icon: <Download />,
																	color: 'text-green-600',
																	hoverColor: 'hover:bg-green-50',
																	action: () => handleDownload(update)
																},
																{
																	icon: <Pencil />,
																	color: 'text-amber-600',
																	hoverColor: 'hover:bg-amber-50',
																	action: () => handleOpenDialog('edit', update)
																},
																{
																	icon: <Trash2 />,
																	color: 'text-red-600',
																	hoverColor: 'hover:bg-red-50',
																	action: () => handleOpenDialog('delete', update)
																}
															].map((btn, idx) => (
																<Tooltip key={`${update.id}-action-${idx}`} delayDuration={300}>
																	<TooltipTrigger asChild>
																		<Button
																			variant='ghost'
																			size='sm'
																			className={cn(
																				'h-5 w-5 xs:h-6 xs:w-6 sm:h-8 sm:w-8 xl:h-10 xl:w-10 p-0',
																				btn.hoverColor
																			)}
																			onClick={btn.action}
																			disabled={submitting}
																			aria-label={
																				idx === 0 ? 'View update' : idx === 1 ? 'Download document' : idx === 2 ? 'Edit update' : 'Delete update'
																			}
																		>
																			{React.cloneElement(btn.icon, {
																				className: `h-2.5 w-2.5 xs:h-3 xs:w-3 sm:h-4 sm:w-4 xl:h-5 xl:w-5 ${btn.color}`
																			})}
																		</Button>
																	</TooltipTrigger>
																	<TooltipContent className='text-[9px] xs:text-xs xl:text-sm' side='top'>
																		{idx === 0 ? 'View' : idx === 1 ? 'Download' : idx === 2 ? 'Edit' : 'Delete'}
																	</TooltipContent>
																</Tooltip>
															))}
														</div>
													</TableCell>
												</TableRow>
											))
										)}
									</TableBody>
								</Table>
							</div>
						</div>
					</CardContent>
				</Card>

				<Dialog open={dialogState.create} onOpenChange={(open) => !open && handleCloseDialog('create')}>
					<DialogContent className='sm:max-w-[500px] xl:max-w-[800px] max-h-[95vh] overflow-y-auto p-3 sm:p-6 xl:p-8 w-[calc(100%-16px)]'>
						<DialogHeader>
							<DialogTitle className='text-lg sm:text-xl xl:text-2xl 2xl:text-3xl'>Add New Update</DialogTitle>
							<DialogDescription className='text-xs sm:text-sm xl:text-base text-gray-500'>
								Create a new security update for manager support
							</DialogDescription>
						</DialogHeader>

						<UpdateForm
							updateName={formState.updateName}
							setUpdateName={(name) => setFormState((prev) => ({ ...prev, updateName: name }))}
							description={formState.description}
							setDescription={(desc) => setFormState((prev) => ({ ...prev, description: desc }))}
							effectiveDate={formState.effectiveDate}
							setEffectiveDate={(date) => setFormState((prev) => ({ ...prev, effectiveDate: date }))}
							selectedFile={formState.selectedFile}
							handleFileChange={handleFileChange}
							formId='create'
							disabled={submitting}
						/>

						<DialogFooter className='flex flex-col sm:flex-row gap-2 sm:gap-0 mt-4 xl:mt-6'>
							<Button
								variant='outline'
								onClick={() => handleCloseDialog('create')}
								className='w-full sm:w-auto order-2 sm:order-1 h-8 sm:h-10 xl:h-12 text-xs sm:text-sm xl:text-base'
								disabled={submitting}
							>
								Cancel
							</Button>
							<Button
								onClick={handleCreate}
								className='bg-blue-500 hover:bg-blue-600 w-full sm:w-auto order-1 sm:order-2 h-8 sm:h-10 xl:h-12 text-xs sm:text-sm xl:text-base'
								disabled={submitting}
							>
								{submitting ? 'Saving...' : 'Add Update'}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				<Dialog open={showSignDialog} onOpenChange={setShowSignDialog}>
					<DialogContent className='sm:max-w-[420px]'>
						<DialogHeader>
							<DialogTitle>Sign Manager Declaration</DialogTitle>
							<DialogDescription>
								Confirm you have reviewed{' '}
								<span className='font-semibold text-gray-900'>{selectedUpdate?.name ?? 'this update'}</span>.
							</DialogDescription>
						</DialogHeader>
						<div className='space-y-3 py-2'>
							<div className='space-y-1'>
								<Label htmlFor='manager-name'>Full name</Label>
								<Input
									id='manager-name'
									placeholder='Jane Smith'
									value={signatureData.managerName}
									onChange={(e) => setSignatureData((prev) => ({ ...prev, managerName: e.target.value }))}
								/>
							</div>
							<div className='space-y-1'>
								<Label htmlFor='manager-signature'>Signature</Label>
								<Input
									id='manager-signature'
									placeholder='Type your full name'
									value={signatureData.signature}
									onChange={(e) => setSignatureData((prev) => ({ ...prev, signature: e.target.value }))}
								/>
							</div>
							<div className='rounded-md bg-gray-50 p-3 text-xs text-gray-600 space-y-1'>
								<p>By signing you acknowledge that:</p>
								<ul className='list-disc pl-4 space-y-1'>
									<li>You have read and understood the document.</li>
									<li>You will follow any required procedures.</li>
									<li>Your acknowledgement will be recorded for auditing.</li>
								</ul>
							</div>
						</div>
						<DialogFooter className='flex-col sm:flex-row gap-2 sm:gap-0'>
							<Button
								variant='outline'
								onClick={() => setShowSignDialog(false)}
								className='w-full sm:w-auto'
								disabled={submitting}
							>
								Cancel
							</Button>
							<Button
								onClick={handleSignDeclaration}
								className='w-full sm:w-auto bg-blue-600 hover:bg-blue-700'
								disabled={submitting}
							>
								{submitting ? 'Signing...' : 'Sign declaration'}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				<Dialog open={dialogState.view} onOpenChange={(open) => !open && handleCloseDialog('view')}>
					<DialogContent className='w-[calc(100%-16px)] sm:w-[calc(100%-32px)] max-w-[95vw] h-[90vh] p-0'>
						<DialogHeader className='sr-only'>
							<DialogTitle>View Manager Support Update</DialogTitle>
							<DialogDescription>Preview the uploaded manager support document.</DialogDescription>
						</DialogHeader>
						<div className='flex flex-col h-full'>
							<div className='flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 md:p-4 border-b gap-3 sm:gap-4'>
								<div className='flex items-center gap-2 md:gap-3 overflow-hidden'>
									<div className='bg-blue-100 p-2 rounded-md shrink-0'>
										<FileText className='h-4 w-4 md:h-5 md:w-5 text-blue-600' />
									</div>
									<div className='overflow-hidden'>
										<h2 className='text-base sm:text-lg font-semibold truncate'>
											{selectedUpdate?.name || 'Selected update'}
										</h2>
										<p className='text-xs sm:text-sm text-gray-500 truncate'>
											Effective:{' '}
											{selectedUpdate
												? format(
														safeParseDate(selectedUpdate.effectiveDate) ?? new Date(selectedUpdate.effectiveDate),
														'dd MMM yyyy'
												  )
												: '--'}
										</p>
									</div>
								</div>
								<div className='flex items-center gap-2 w-full sm:w-auto'>
									<Button
										variant='outline'
										size='sm'
										onClick={() => selectedUpdate && handleDownload(selectedUpdate)}
										className='flex-1 sm:flex-none'
									>
										<Download className='mr-2 h-4 w-4' />
										Download
									</Button>
									<Button
										variant='default'
										size='sm'
										className='flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white'
										onClick={() => {
											if (!selectedUpdate) {
												toast({
													title: 'No update selected',
													description: 'Select an update to sign.',
													variant: 'destructive'
												});
												return;
											}
											setShowSignDialog(true);
										}}
									>
										Sign
									</Button>
									<Button variant='ghost' size='sm' onClick={() => handleCloseDialog('view')} className='flex-1 sm:flex-none'>
										Close
									</Button>
								</div>
							</div>

							<div className='flex-1 flex flex-col'>
								<div className='flex-1 bg-slate-50'>
									{selectedDocumentUrl ? (
										<iframe
											key={selectedDocumentUrl}
											src={selectedDocumentUrl}
											title={`Manager support document ${selectedUpdate?.name ?? ''}`}
											className='w-full h-full border-0'
										/>
									) : (
										<div className='h-full flex flex-col items-center justify-center gap-3 p-6 text-center'>
											<Alert variant='destructive' className='max-w-md'>
												<AlertTitle>Preview unavailable</AlertTitle>
												<AlertDescription>
													We could not locate the attached file or it is not a supported preview type. Please download it instead.
												</AlertDescription>
											</Alert>
											<Button onClick={() => selectedUpdate && handleDownload(selectedUpdate)}>Download file</Button>
										</div>
									)}
								</div>

								<div className='border-t bg-white p-3 md:p-5 space-y-3 max-h-[45%] overflow-y-auto'>
									<div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
										<div>
											<p className='text-sm font-semibold text-gray-900'>Manager Declarations</p>
											<p className='text-xs text-gray-500'>List of acknowledgements for this update</p>
										</div>
										<Button
											variant='outline'
											size='sm'
											onClick={() => selectedUpdate && fetchDeclarations(selectedUpdate.id)}
											disabled={declarationsLoading}
										>
											{declarationsLoading ? (
												<>
													<Loader2 className='mr-2 h-4 w-4 animate-spin' />
													Refreshing
												</>
											) : (
												'Refresh'
											)}
										</Button>
									</div>

									{declarationsLoading ? (
										<div className='flex items-center gap-2 text-sm text-gray-500'>
											<Loader2 className='h-4 w-4 animate-spin text-blue-600' />
											Loading declarations...
										</div>
									) : declarations.length === 0 ? (
										<div className='rounded-md border border-dashed p-4 text-sm text-gray-500'>
											No declarations recorded yet.
										</div>
									) : (
										<div className='border rounded-md overflow-hidden'>
											<Table>
												<TableHeader>
													<TableRow>
														<TableHead>Manager</TableHead>
														<TableHead>Date</TableHead>
														<TableHead>Status</TableHead>
													</TableRow>
												</TableHeader>
												<TableBody>
													{declarations.map((declaration) => (
														<TableRow key={declaration.id}>
															<TableCell className='font-medium'>{declaration.managerName}</TableCell>
															<TableCell>
																{format(
																	safeParseDate(declaration.signatureDate) ?? new Date(declaration.signatureDate),
																	'dd MMM yyyy'
																)}
															</TableCell>
															<TableCell>
																<Badge
																	variant={declaration.acknowledged ? 'default' : 'secondary'}
																	className={declaration.acknowledged ? 'bg-green-600 text-white' : ''}
																>
																	{declaration.acknowledged ? 'Acknowledged' : 'Pending'}
																</Badge>
															</TableCell>
														</TableRow>
													))}
												</TableBody>
											</Table>
										</div>
									)}
								</div>
							</div>
						</div>
					</DialogContent>
				</Dialog>

				<Dialog open={dialogState.edit} onOpenChange={(open) => !open && handleCloseDialog('edit')}>
					<DialogContent className='sm:max-w-[500px] xl:max-w-[800px] max-h-[90vh] overflow-y-auto p-4 sm:p-6 xl:p-8'>
						<DialogHeader>
							<DialogTitle className='text-lg sm:text-xl xl:text-2xl 2xl:text-3xl'>Edit Update</DialogTitle>
							<DialogDescription className='text-xs sm:text-sm xl:text-base text-gray-500'>
								Modify the security update details
							</DialogDescription>
						</DialogHeader>

						<UpdateForm
							updateName={formState.updateName}
							setUpdateName={(name) => setFormState((prev) => ({ ...prev, updateName: name }))}
							description={formState.description}
							setDescription={(desc) => setFormState((prev) => ({ ...prev, description: desc }))}
							effectiveDate={formState.effectiveDate}
							setEffectiveDate={(date) => setFormState((prev) => ({ ...prev, effectiveDate: date }))}
							selectedFile={formState.selectedFile}
							handleFileChange={handleFileChange}
							currentFileName={selectedUpdate?.fileName}
							formId='edit'
							disabled={submitting}
						/>

						<DialogFooter className='flex flex-col sm:flex-row gap-2 sm:gap-0 mt-4 xl:mt-6'>
							<Button
								variant='outline'
								onClick={() => handleCloseDialog('edit')}
								className='w-full sm:w-auto order-2 sm:order-1 h-8 sm:h-10 xl:h-12 text-xs sm:text-sm xl:text-base'
								disabled={submitting}
							>
								Cancel
							</Button>
							<Button
								onClick={handleUpdate}
								className='bg-blue-500 hover:bg-blue-600 w-full sm:w-auto order-1 sm:order-2 h-8 sm:h-10 xl:h-12 text-xs sm:text-sm xl:text-base'
								disabled={submitting}
							>
								{submitting ? 'Saving...' : 'Save Changes'}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

				<Dialog open={dialogState.delete} onOpenChange={(open) => !open && handleCloseDialog('delete')}>
					<DialogContent className='sm:max-w-[500px] xl:max-w-[800px] p-4 sm:p-6 xl:p-8'>
						<DialogHeader>
							<DialogTitle className='text-lg sm:text-xl xl:text-2xl 2xl:text-3xl'>Delete Update</DialogTitle>
							<DialogDescription className='text-xs sm:text-sm xl:text-base text-gray-500'>
								Are you sure you want to delete this update?
							</DialogDescription>
						</DialogHeader>

						{deleteTarget && (
							<div className='py-2 sm:py-4 xl:py-6'>
								<Alert variant='destructive'>
									<AlertTriangle className='h-3 w-3 sm:h-4 sm:w-4 xl:h-5 xl:w-5' />
									<AlertTitle className='text-sm sm:text-base xl:text-lg'>Warning</AlertTitle>
									<AlertDescription className='text-xs sm:text-sm xl:text-base'>
										This action cannot be undone. This will permanently delete the update "{deleteTarget.name}" and remove all associated
										data.
									</AlertDescription>
								</Alert>
							</div>
						)}

						<DialogFooter className='flex flex-col sm:flex-row gap-2 sm:gap-0 mt-4 xl:mt-6'>
							<Button
								variant='outline'
								onClick={() => handleCloseDialog('delete')}
								className='w-full sm:w-auto order-2 sm:order-1 h-8 sm:h-10 xl:h-12 text-xs sm:text-sm xl:text-base'
								disabled={submitting}
							>
								Cancel
							</Button>
							<Button
								onClick={handleDelete}
								variant='destructive'
								className='w-full sm:w-auto order-1 sm:order-2 h-8 sm:h-10 xl:h-12 text-xs sm:text-sm xl:text-base'
								disabled={submitting}
							>
								{submitting ? 'Deleting...' : 'Delete'}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>
		</TooltipProvider>
	);
};

export default ManagerSupportPage;
