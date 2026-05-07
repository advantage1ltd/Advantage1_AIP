import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";

// Import mock data and evaluation criteria from a separate file
import { mockOfficers, mockCustomers, mockLocations, evaluationCriteria, defaultScores } from "./mockData";

const formSchema = z.object({
  officerId: z.string().min(1, "Officer is required"),
  customerName: z.string().min(1, "Customer is required"),
  location: z.string().min(1, "Location is required"),
  date: z.date({ required_error: "Date is required" }),
  time: z.string().min(1, "Time is required"),
  mysteryShopperName: z.string().min(1, "Mystery Shopper Name is required"),
  scores: z.record(z.string(), z.object({
    score: z.number().min(0).max(10),
    comments: z.string().optional()
  })),
});

type FormValues = z.infer<typeof formSchema>;

interface MysteryShopperFormProps {
  onSubmit: (data: FormValues) => Promise<void>;
  initialData?: any;
  isLoading?: boolean;
}

export function MysteryShopperForm({ 
  onSubmit, 
  initialData,
  isLoading = false 
}: MysteryShopperFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      officerId: "",
      customerName: "",
      location: "",
      date: new Date(),
      time: "",
      mysteryShopperName: "",
      scores: defaultScores,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="officerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="officerId">Officer</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  name="officerId"
                >
                  <FormControl>
                    <SelectTrigger id="officerId">
                      <SelectValue placeholder="Select an officer" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {mockOfficers.map((officer) => (
                      <SelectItem 
                        key={officer.id} 
                        value={officer.id}
                        id={`officer-${officer.id}`}
                      >
                        {officer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="customerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="customerName">Customer</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  name="customerName"
                >
                  <FormControl>
                    <SelectTrigger id="customerName">
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {mockCustomers.map((customer) => (
                      <SelectItem 
                        key={customer.id} 
                        value={customer.id}
                        id={`customer-${customer.id}`}
                      >
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="location">Location</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  name="location"
                >
                  <FormControl>
                    <SelectTrigger id="location">
                      <SelectValue placeholder="Select a location" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {mockLocations.map((location) => (
                      <SelectItem 
                        key={location.id} 
                        value={location.id}
                        id={`location-${location.id}`}
                      >
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="date">Date</FormLabel>
                <FormControl>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    {...field}
                    value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                    onChange={(e) => field.onChange(e.target.valueAsDate)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="time">Time</FormLabel>
                <FormControl>
                  <Input 
                    id="time" 
                    name="time"
                    type="time" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mysteryShopperName"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="mysteryShopperName">Mystery Shopper Name</FormLabel>
                <FormControl>
                  <Input 
                    id="mysteryShopperName"
                    name="mysteryShopperName"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Evaluation Criteria</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Criteria</TableHead>
                <TableHead className="w-[100px]">Score (0-10)</TableHead>
                <TableHead>Comments</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evaluationCriteria.map((criteria) => (
                <TableRow key={criteria.id}>
                  <TableCell>
                    <label htmlFor={`score-${criteria.id}`} className="font-medium">
                      {criteria.title}
                    </label>
                  </TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`scores.${criteria.id}.score`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              id={`score-${criteria.id}`}
                              name={`scores.${criteria.id}.score`}
                              type="number"
                              min="0"
                              max="10"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`scores.${criteria.id}.comments`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              id={`comments-${criteria.id}`}
                              name={`scores.${criteria.id}.comments`}
                              placeholder="Add comments..."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : "Submit Evaluation"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
