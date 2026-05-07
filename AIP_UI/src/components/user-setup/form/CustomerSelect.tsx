import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface Customer {
  id: number;
  name: string;
}

interface CustomerSelectProps {
  availableCustomers: Customer[]
  selectedCustomers: number[]
  assignedCustomers: number[]
  onSelectedChange: (customers: number[]) => void
  onAssignedChange: (customers: number[]) => void
  onAdd: () => void
  onRemove: () => void
}

export function CustomerSelect({
  availableCustomers,
  selectedCustomers,
  assignedCustomers,
  onSelectedChange,
  onAssignedChange,
  onAdd,
  onRemove
}: CustomerSelectProps) {
  // Helper function to get unique values
  const getUniqueIds = (arr: number[]) => [...new Set(arr)];

  const handleAdd = () => {
    const newAssigned = getUniqueIds([...assignedCustomers, ...selectedCustomers]);
    onAssignedChange(newAssigned);
    onSelectedChange([]); // Clear selection after adding
  };

  const handleRemove = () => {
    onAssignedChange([]);
    onSelectedChange([]); // Clear selection after removing
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <Label className="text-gray-700">Available Customers</Label>
        <select 
          multiple 
          className="w-full h-48 bg-white/50 border border-purple-200 rounded-lg p-2 focus:border-purple-400 focus:ring-purple-400"
          value={selectedCustomers.map(String)}
          onChange={(e) => {
            const values = Array.from(e.target.selectedOptions, option => Number(option.value));
            onSelectedChange(values);
          }}
        >
          {availableCustomers
            .filter(customer => !assignedCustomers.includes(customer.id))
            .map((customer) => (
              <option key={customer.id} value={customer.id} className="py-1">
                {customer.name}
              </option>
            ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label className="text-gray-700">Assigned Customers</Label>
        <div className="flex flex-col gap-2">
          <select 
            multiple 
            className="w-full h-48 bg-white/50 border border-purple-200 rounded-lg p-2 focus:border-purple-400 focus:ring-purple-400"
            value={assignedCustomers.map(String)}
            onChange={(e) => {
              const values = Array.from(e.target.selectedOptions, option => Number(option.value));
              onAssignedChange(values);
            }}
          >
            {assignedCustomers.map((customerId) => {
              const customer = availableCustomers.find(c => c.id === customerId);
              return customer ? (
                <option key={customerId} value={customerId} className="py-1">
                  {customer.name}
                </option>
              ) : null;
            }).filter(Boolean)}
          </select>
          <div className="flex justify-center gap-4">
            <Button 
              type="button" 
              onClick={handleAdd}
              variant="outline"
              className="border-purple-200 hover:bg-purple-50"
              disabled={selectedCustomers.length === 0}
            >
              Add &gt;&gt;
            </Button>
            <Button 
              type="button" 
              onClick={handleRemove}
              variant="outline"
              className="border-purple-200 hover:bg-purple-50"
              disabled={assignedCustomers.length === 0}
            >
              &lt;&lt; Remove
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}