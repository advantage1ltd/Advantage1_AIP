import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UseFormReturn } from "react-hook-form"
import { UK_COUNTIES } from "@/lib/constants"

interface AddressSectionProps {
  form: UseFormReturn<any>
}

export function AddressSection({ form }: AddressSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Address</h3>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="address.building"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Building</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address.street"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Street</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address.village"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Village/Area (Optional)</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address.town"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Town/City</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address.county"
          render={({ field }) => (
            <FormItem>
              <FormLabel>County</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select county" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {UK_COUNTIES.map((county) => (
                    <SelectItem key={county} value={county}>
                      {county}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address.postcode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Postcode</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}