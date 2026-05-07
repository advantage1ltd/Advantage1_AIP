import React, { useState, useEffect } from 'react'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
	CalendarIcon,
	Loader2,
	Laptop,
	Smartphone,
	Monitor,
	Printer,
	Package,
	Tablet,
	HardDrive,
	Tag,
	MapPin,
	User,
	FileText
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

// Asset types
type AssetType = 'Laptop' | 'Phone' | 'Tablet' | 'Desktop' | 'Monitor' | 'Printer' | 'Other'
type AssetStatus = 'In Use' | 'In Stock' | 'In Repair' | 'Disposed'

interface AssetFormValues {
	assetTag: string
	assetType: AssetType
	make: string
	model: string
	serialNumber: string
	purchaseDate: Date
	assignedTo?: string
	location: string
	status: AssetStatus
	notes?: string
}

interface AssetFormProps {
	open: boolean
	onClose: () => void
	onSubmit: (data: AssetFormValues) => void
	initialData?: AssetFormValues
	isLoading?: boolean
}

const assetTypeIcons: Record<AssetType, React.ReactNode> = {
	Laptop: <Laptop className="h-4 w-4" />,
	Phone: <Smartphone className="h-4 w-4" />,
	Tablet: <Tablet className="h-4 w-4" />,
	Desktop: <HardDrive className="h-4 w-4" />,
	Monitor: <Monitor className="h-4 w-4" />,
	Printer: <Printer className="h-4 w-4" />,
	Other: <Package className="h-4 w-4" />,
}

const statusColors: Record<AssetStatus, string> = {
	'In Use': 'bg-emerald-500',
	'In Stock': 'bg-sky-500',
	'In Repair': 'bg-amber-500',
	'Disposed': 'bg-slate-400',
}

export const AssetForm: React.FC<AssetFormProps> = ({
	open,
	onClose,
	onSubmit,
	initialData,
	isLoading = false
}) => {
	const [formData, setFormData] = useState<AssetFormValues>({
		assetTag: '',
		assetType: 'Laptop',
		make: '',
		model: '',
		serialNumber: '',
		purchaseDate: new Date(),
		assignedTo: '',
		location: '',
		status: 'In Stock',
		notes: '',
	})

	const [date, setDate] = useState<Date | undefined>(new Date())

	useEffect(() => {
		if (open) {
			if (initialData) {
				setFormData({
					...initialData,
				})
				setDate(initialData.purchaseDate)
			} else {
				setFormData({
					assetTag: '',
					assetType: 'Laptop',
					make: '',
					model: '',
					serialNumber: '',
					purchaseDate: new Date(),
					assignedTo: '',
					location: '',
					status: 'In Stock',
					notes: '',
				})
				setDate(new Date())
			}
		}
	}, [initialData, open])

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target
		setFormData((prev) => ({
			...prev,
			[name]: value
		}))
	}

	const handleSelectChange = (name: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			[name]: value
		}))
	}

	const handleDateChange = (date: Date | undefined) => {
		if (date) {
			setDate(date)
			setFormData((prev) => ({
				...prev,
				purchaseDate: date
			}))
		}
	}

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		onSubmit(formData)
	}

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="max-w-lg max-h-[90vh] overflow-hidden p-0 gap-0">
				{/* Header */}
				<div className="px-6 pt-6 pb-4 bg-gradient-to-r from-violet-600 to-indigo-600">
					<DialogHeader>
						<DialogTitle className="text-xl font-semibold text-white">
							{initialData ? 'Edit Asset' : 'Add New Asset'}
						</DialogTitle>
						<DialogDescription className="text-violet-100">
							{initialData ? 'Update the asset details below' : 'Fill in the details to register a new asset'}
						</DialogDescription>
					</DialogHeader>
				</div>

				{/* Form Content */}
				<form onSubmit={handleSubmit} className="overflow-y-auto max-h-[calc(90vh-180px)]">
					<div className="p-6 space-y-5">
						{/* Asset Identification Section */}
						<div className="space-y-4">
							<h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
								<Tag className="h-4 w-4 text-violet-500" />
								Asset Identification
							</h3>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="assetTag" className="text-slate-700">Asset Tag <span className="text-red-500">*</span></Label>
									<Input
										id="assetTag"
										name="assetTag"
										value={formData.assetTag}
										onChange={handleChange}
										placeholder="e.g., LAP001"
										required
										disabled={isLoading}
										className="h-10 border-slate-200 focus:border-violet-500 focus:ring-violet-500"
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="assetType" className="text-slate-700">Asset Type <span className="text-red-500">*</span></Label>
									<Select
										value={formData.assetType}
										onValueChange={(value) => handleSelectChange('assetType', value as AssetType)}
										disabled={isLoading}
									>
										<SelectTrigger id="assetType" className="h-10 border-slate-200">
											<SelectValue placeholder="Select type" />
										</SelectTrigger>
										<SelectContent>
											{(['Laptop', 'Phone', 'Tablet', 'Desktop', 'Monitor', 'Printer', 'Other'] as AssetType[]).map((type) => (
												<SelectItem key={type} value={type}>
													<div className="flex items-center gap-2">
														{assetTypeIcons[type]}
														{type}
													</div>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="make" className="text-slate-700">Make <span className="text-red-500">*</span></Label>
									<Input
										id="make"
										name="make"
										value={formData.make}
										onChange={handleChange}
										placeholder="e.g., Dell, Apple"
										required
										disabled={isLoading}
										className="h-10 border-slate-200 focus:border-violet-500 focus:ring-violet-500"
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="model" className="text-slate-700">Model <span className="text-red-500">*</span></Label>
									<Input
										id="model"
										name="model"
										value={formData.model}
										onChange={handleChange}
										placeholder="e.g., Latitude 5520"
										required
										disabled={isLoading}
										className="h-10 border-slate-200 focus:border-violet-500 focus:ring-violet-500"
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="serialNumber" className="text-slate-700">Serial Number <span className="text-red-500">*</span></Label>
								<Input
									id="serialNumber"
									name="serialNumber"
									value={formData.serialNumber}
									onChange={handleChange}
									placeholder="Enter serial number"
									required
									disabled={isLoading}
									className="h-10 font-mono border-slate-200 focus:border-violet-500 focus:ring-violet-500"
								/>
							</div>
						</div>

						{/* Status & Location Section */}
						<div className="space-y-4 pt-2 border-t border-slate-100">
							<h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 pt-2">
								<MapPin className="h-4 w-4 text-violet-500" />
								Status & Location
							</h3>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label className="text-slate-700">Purchase Date <span className="text-red-500">*</span></Label>
									<Popover>
										<PopoverTrigger asChild>
											<Button
												variant="outline"
												disabled={isLoading}
												className={cn(
													'w-full h-10 justify-start text-left font-normal border-slate-200',
													!date && 'text-muted-foreground'
												)}
											>
												<CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
												{date ? format(date, 'PPP') : <span>Pick a date</span>}
											</Button>
										</PopoverTrigger>
										<PopoverContent className="w-auto p-0" align="start">
											<Calendar
												mode="single"
												selected={date}
												onSelect={handleDateChange}
												initialFocus
											/>
										</PopoverContent>
									</Popover>
								</div>

								<div className="space-y-2">
									<Label htmlFor="status" className="text-slate-700">Status <span className="text-red-500">*</span></Label>
									<Select
										value={formData.status}
										onValueChange={(value) => handleSelectChange('status', value as AssetStatus)}
										disabled={isLoading}
									>
										<SelectTrigger id="status" className="h-10 border-slate-200">
											<SelectValue placeholder="Select status" />
										</SelectTrigger>
										<SelectContent>
											{(['In Use', 'In Stock', 'In Repair', 'Disposed'] as AssetStatus[]).map((status) => (
												<SelectItem key={status} value={status}>
													<div className="flex items-center gap-2">
														<div className={cn('h-2 w-2 rounded-full', statusColors[status])} />
														{status}
													</div>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor="location" className="text-slate-700">Location <span className="text-red-500">*</span></Label>
									<Input
										id="location"
										name="location"
										value={formData.location}
										onChange={handleChange}
										placeholder="e.g., Head Office"
										required
										disabled={isLoading}
										className="h-10 border-slate-200 focus:border-violet-500 focus:ring-violet-500"
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="assignedTo" className="text-slate-700 flex items-center gap-1">
										<User className="h-3.5 w-3.5" />
										Assigned To
									</Label>
									<Input
										id="assignedTo"
										name="assignedTo"
										value={formData.assignedTo}
										onChange={handleChange}
										placeholder="e.g., John Smith"
										disabled={isLoading}
										className="h-10 border-slate-200 focus:border-violet-500 focus:ring-violet-500"
									/>
								</div>
							</div>
						</div>

						{/* Notes Section */}
						<div className="space-y-4 pt-2 border-t border-slate-100">
							<h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2 pt-2">
								<FileText className="h-4 w-4 text-violet-500" />
								Additional Notes
							</h3>
							<div className="space-y-2">
								<Textarea
									id="notes"
									name="notes"
									value={formData.notes}
									onChange={handleChange}
									placeholder="Any additional information about this asset..."
									disabled={isLoading}
									className="min-h-[80px] border-slate-200 focus:border-violet-500 focus:ring-violet-500 resize-none"
								/>
							</div>
						</div>
					</div>

					{/* Footer */}
					<div className="sticky bottom-0 px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
							disabled={isLoading}
							className="border-slate-200"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={isLoading}
							className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white min-w-[120px]"
						>
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									{initialData ? 'Updating...' : 'Adding...'}
								</>
							) : (
								<>
									{initialData ? 'Update Asset' : 'Add Asset'}
								</>
							)}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}
