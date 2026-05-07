import React from 'react'
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

const licenseFormSchema = z.object({
  officerName: z.string().min(2, 'Officer name is required'),
  licenseNumber: z.string().min(2, 'License number is required'),
  licenseType: z.enum(['Door Supervision', 'Security Guarding', 'CCTV', 'Close Protection']),
  issueDate: z.date(),
  expiryDate: z.date(),
})

type LicenseFormValues = z.infer<typeof licenseFormSchema>

interface LicenseFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: LicenseFormValues) => void
  initialData?: LicenseFormValues
}

export function LicenseForm({ open, onClose, onSubmit, initialData }: LicenseFormProps) {
  const form = useForm<LicenseFormValues>({
    resolver: zodResolver(licenseFormSchema),
    defaultValues: initialData || {
      officerName: '',
      licenseNumber: '',
      licenseType: 'Security Guarding',
      issueDate: new Date(),
      expiryDate: new Date(),
    },
  })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{initialData ? 'Edit License' : 'Add New License'}</DialogTitle>
            <DialogDescription>
              Enter the license details below. All required fields must be completed.
            </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="officerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Officer Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter officer name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="licenseNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>License Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter SIA license number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="licenseType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>License Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select license type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Door Supervision">Door Supervision</SelectItem>
                      <SelectItem value="Security Guarding">Security Guarding</SelectItem>
                      <SelectItem value="CCTV">CCTV</SelectItem>
                      <SelectItem value="Close Protection">Close Protection</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="issueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue Date</FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value}
                      setDate={field.onChange}
                      placeholder="Select issue date"
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
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {initialData ? 'Update License' : 'Add License'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 