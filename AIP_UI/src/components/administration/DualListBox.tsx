import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Customer } from '@/types/customer';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface DualListBoxProps {
  available: Customer[];
  selected: Customer[];
  onAdd: (customer: Customer) => void;
  onRemove: (customer: Customer) => void;
}

export const DualListBox = ({
  available,
  selected,
  onAdd,
  onRemove,
}: DualListBoxProps) => {
  return (
    <div className="flex gap-4 items-center">
      {/* Available Customers */}
      <div className="flex-1 border rounded-lg">
        <div className="p-2 bg-gray-50 border-b rounded-t-lg">
          <h3 className="font-medium text-sm">Available Customers</h3>
        </div>
        <ScrollArea className="h-[200px] w-full">
          <div className="p-2">
            {available.map((customer) => (
              <button
                key={customer.id}
                onClick={() => onAdd(customer)}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md text-sm transition-colors flex items-center justify-between group"
              >
                <span>{customer.companyName}</span>
                <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500" />
              </button>
            ))}
            {available.length === 0 && (
              <div className="text-sm text-gray-500 text-center py-2">
                No available customers
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-col gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            if (available.length > 0) {
              onAdd(available[0]);
            }
          }}
          disabled={available.length === 0}
          className="h-12 w-12 border-2 hover:border-primary hover:text-primary transition-colors"
        >
          <ChevronRight className="h-8 w-8 stroke-[3]" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            if (selected.length > 0) {
              onRemove(selected[0]);
            }
          }}
          disabled={selected.length === 0}
          className="h-12 w-12 border-2 hover:border-primary hover:text-primary transition-colors"
        >
          <ChevronLeft className="h-8 w-8 stroke-[3]" />
        </Button>
      </div>

      {/* Selected Customers */}
      <div className="flex-1 border rounded-lg">
        <div className="p-2 bg-gray-50 border-b rounded-t-lg">
          <h3 className="font-medium text-sm">Assigned Customers</h3>
        </div>
        <ScrollArea className="h-[200px] w-full">
          <div className="p-2">
            {selected.map((customer) => (
              <button
                key={customer.id}
                onClick={() => onRemove(customer)}
                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-md text-sm transition-colors flex items-center justify-between group"
              >
                <ChevronLeft className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500" />
                <span>{customer.companyName}</span>
              </button>
            ))}
            {selected.length === 0 && (
              <div className="text-sm text-gray-500 text-center py-2">
                No assigned customers
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}; 