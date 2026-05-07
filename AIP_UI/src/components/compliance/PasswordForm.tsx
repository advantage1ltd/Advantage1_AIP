import React, { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { Textarea } from '@/components/ui/textarea'
import { RotateCcw } from 'lucide-react'
import { Eye, EyeOff } from 'lucide-react'

// Password Generation Utility
const generatePassword = (length: number = 16): string => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-="
  let password = ""
  for (let i = 0, n = charset.length; i < length; ++i) {
    password += charset.charAt(Math.floor(Math.random() * n))
  }
  // Ensure password complexity (optional, basic example)
  // You might want more robust checks here
  if (!/[A-Z]/.test(password)) password += 'A'
  if (!/[a-z]/.test(password)) password += 'a'
  if (!/[0-9]/.test(password)) password += '1'
  if (!/[!@#$%^&*()_+~`|}{[\]:;?><,./-="]/.test(password)) password += '!'
  
  // Shuffle and truncate to desired length
  return password.split('').sort(() => 0.5 - Math.random()).join('').substring(0, length)
}

const passwordFormSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  userName: z.string().min(2, 'Username is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  notes: z.string().optional(),
})

type PasswordFormValues = z.infer<typeof passwordFormSchema>

interface PasswordFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: PasswordFormValues) => void
  initialData?: PasswordFormValues
  isLoading?: boolean
}

export function PasswordForm({ open, onClose, onSubmit, initialData, isLoading = false }: PasswordFormProps) {
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: initialData || {
      title: '',
      userName: '',
      password: '',
      url: '',
      notes: '',
    },
  })

  // State for password visibility
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  useEffect(() => {
    if (open && initialData) {
      form.reset(initialData)
    } else if (open) {
      form.reset({
        title: '',
        userName: '',
        password: '',
        url: '',
        notes: '',
      })
    }
  }, [open, initialData, form])

  const handleGeneratePassword = () => {
    const newPassword = generatePassword();
    form.setValue('password', newPassword, { shouldValidate: true });
  };

  // Function to toggle password visibility
  const togglePasswordVisibility = () => {
    setIsPasswordVisible((prev) => !prev);
  };

  function processSubmit(values: PasswordFormValues) {
    onSubmit(values)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Password' : 'Add New Password'}</DialogTitle>
          <DialogDescription>
            {initialData ? 'Update the details for this password record.' : 'Fill in the details to add a new password record.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(processSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter title" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="userName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter username" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input 
                        type={isPasswordVisible ? "text" : "password"}
                        placeholder="Enter password" 
                        {...field} 
                        className="flex-grow"
                        disabled={isLoading}
                      />
                    </FormControl>
                    <Button 
                      type="button"
                      variant="default"
                      onClick={handleGeneratePassword}
                      title="Generate Password"
                      className="h-9 bg-blue-600 hover:bg-blue-700 text-white text-xs whitespace-nowrap"
                      disabled={isLoading}
                    >
                      Generate
                    </Button>
                    <Button 
                      type="button"
                      variant="secondary"
                      onClick={togglePasswordVisibility}
                      title={isPasswordVisible ? "Hide Password" : "Show Password"}
                      className="h-9 text-xs whitespace-nowrap"
                      disabled={isLoading}
                    >
                      {isPasswordVisible ? "Hide" : "Show"}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter URL (optional)" {...field} disabled={isLoading} />
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
                {isLoading ? 'Saving...' : (initialData ? 'Update Password' : 'Add Password')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 