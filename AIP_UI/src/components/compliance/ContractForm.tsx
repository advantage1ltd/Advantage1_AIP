import React, { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogDescription
} from '@/components/ui/dialog'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

const contractFormSchema = z.object({
	contractName: z.string().min(2, 'Contract name is required'),
	contractType: z.enum(['Antivirus', 'Cyber Essentials', 'Software Subscription', 'Hardware Maintenance', 'Other']),
	provider: z.string().min(2, 'Provider name is required'),
	startDate: z.date(),
	expiryDate: z.date(),
	cost: z.string().min(1, 'Cost is required'),
	notes: z.string().optional(),
}).refine((data) => data.expiryDate > data.startDate, {
	message: 'Expiry date must be after start date',
	path: ['expiryDate'],
})

type ContractFormValues = z.infer<typeof contractFormSchema>

interface ContractFormProps {
	open: boolean
	onClose: () => void
	onSubmit: (data: ContractFormValues) => void
	initialData?: ContractFormValues
	isLoading?: boolean
}

export function ContractForm({ open, onClose, onSubmit, initialData, isLoading = false }: ContractFormProps) {
	const form = useForm<ContractFormValues>({
		resolver: zodResolver(contractFormSchema),
		defaultValues: initialData || {
			contractName: '',
			contractType: 'Software Subscription',
			provider: '',
			startDate: new Date(),
			expiryDate: new Date(),
			cost: '',
			notes: '',
		},
	})

	// Reset form when dialog opens/closes or initialData changes
	useEffect(() => {
		if (open) {
			form.reset(initialData || {
				contractName: '',
				contractType: 'Software Subscription',
				provider: '',
				startDate: new Date(),
				expiryDate: new Date(),
				cost: '',
				notes: '',
			})
		}
	}, [open, initialData, form])

	const handleSubmit = (data: ContractFormValues) => {
		onSubmit(data)
	}

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>{initialData ? 'Edit Contract' : 'Add New Contract'}</DialogTitle>
					<DialogDescription>
						Enter the contract details below. All required fields must be completed.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="contractName"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Contract Name</FormLabel>
									<FormControl>
										<Input placeholder="Enter contract name" {...field} disabled={isLoading} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="contractType"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Contract Type</FormLabel>
									<Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select contract type" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="Antivirus">Antivirus</SelectItem>
											<SelectItem value="Cyber Essentials">Cyber Essentials</SelectItem>
											<SelectItem value="Software Subscription">Software Subscription</SelectItem>
											<SelectItem value="Hardware Maintenance">Hardware Maintenance</SelectItem>
											<SelectItem value="Other">Other</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="provider"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Provider</FormLabel>
									<FormControl>
										<Input placeholder="Enter provider name" {...field} disabled={isLoading} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="cost"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Cost (£)</FormLabel>
									<FormControl>
										<Input type="number" placeholder="Enter cost" {...field} disabled={isLoading} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="startDate"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Start Date</FormLabel>
									<FormControl>
										<DatePicker
											date={field.value}
											setDate={field.onChange}
											placeholder="Select start date"
											disabled={isLoading}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="expiryDate"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Expiry Date</FormLabel>
									<FormControl>
										<DatePicker
											date={field.value}
											setDate={field.onChange}
											placeholder="Select expiry date"
											disabled={isLoading}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="notes"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Notes</FormLabel>
									<FormControl>
										<Textarea placeholder="Enter any additional notes" {...field} disabled={isLoading} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<DialogFooter>
							<Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
								Cancel
							</Button>
							<Button type="submit" disabled={isLoading}>
								{isLoading ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										{initialData ? 'Updating...' : 'Adding...'}
									</>
								) : (
									initialData ? 'Update Contract' : 'Add Contract'
								)}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}
