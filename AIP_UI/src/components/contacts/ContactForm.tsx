import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UK_COUNTIES, INDUSTRIES } from "@/lib/constants"
import { Contact } from "@/types/contacts"
import { useState, useEffect } from "react"
import { ServiceSelector } from "./ServiceSelector"

interface ContactFormProps {
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  initialData?: Contact
}

export function ContactForm({ onSubmit, initialData }: ContactFormProps) {
  const [selectedServices, setSelectedServices] = useState<string[]>(initialData?.services || [])

  useEffect(() => {
    if (initialData) {
      setSelectedServices(initialData.services)
    }
  }, [initialData])

  const handleServiceToggle = (service: string) => {
    setSelectedServices(prev => 
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <input 
        type="hidden" 
        name="services" 
        value={JSON.stringify(selectedServices)} 
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            name="name"
            defaultValue={initialData?.name}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company">Company</Label>
          <Input
            id="company"
            name="company"
            defaultValue={initialData?.company}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={initialData?.email}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={initialData?.phone}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <Select name="industry" defaultValue={initialData?.industry || INDUSTRIES[0]}>
            <SelectTrigger>
              <SelectValue placeholder="Select industry" />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="region">Region</Label>
          <Select name="region" defaultValue={initialData?.region || UK_COUNTIES[0]}>
            <SelectTrigger>
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              {UK_COUNTIES.map((county) => (
                <SelectItem key={county} value={county}>
                  {county}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 col-span-2">
          <Label>Services Required</Label>
          <ServiceSelector 
            selectedServices={selectedServices}
            onServiceToggle={handleServiceToggle}
          />
        </div>

        <div className="col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            defaultValue={initialData?.notes}
            className="h-32"
          />
        </div>

        <input
          type="hidden"
          name="createDate"
          value={initialData?.createDate || new Date().toISOString().split('T')[0]}
        />
      </div>

      <div className="flex justify-end gap-4">
        <Button type="submit" className="bg-primary">
          {initialData ? 'Update Contact' : 'Create Contact'}
        </Button>
      </div>
    </form>
  )
}