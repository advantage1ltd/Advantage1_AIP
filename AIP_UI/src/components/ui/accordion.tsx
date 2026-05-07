import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface AccordionContextType {
  value: string[];
  setValue: (itemValue: string) => void;
  type: "single" | "multiple";
  itemValue?: string;
}

const AccordionContext = React.createContext<AccordionContextType>({
  value: [],
  setValue: () => {},
  type: "single",
  itemValue: undefined
});

// Create a new context for AccordionItem
const AccordionItemContext = React.createContext<{ value: string }>({
  value: ''
});

export function Accordion({ 
  children,
  type = "single",
  className,
  defaultValue = [],
  ...props
}: {
  children: React.ReactNode;
  type?: "single" | "multiple";
  className?: string;
  defaultValue?: string[];
}) {
  const [value, setValue] = React.useState<string[]>(defaultValue);

  const handleValueChange = (itemValue: string) => {
    if (type === "single") {
      setValue(value[0] === itemValue ? [] : [itemValue]);
    } else {
      setValue(
        value.includes(itemValue)
          ? value.filter((v) => v !== itemValue)
          : [...value, itemValue]
      );
    }
  };

  return (
    <AccordionContext.Provider value={{ value, setValue: handleValueChange, type }}>
      <div className={cn("space-y-1", className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({ 
  children,
  className,
  value,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  value: string;
}) {
  return (
    <AccordionItemContext.Provider value={{ value }}>
      <div className={cn("border-b", className)} {...props}>
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

export function AccordionTrigger({ 
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLButtonElement>) {
  const { value, setValue } = React.useContext(AccordionContext);
  const { value: itemValue } = React.useContext(AccordionItemContext);
  const isExpanded = value.includes(itemValue);

  return (
    <button
      type="button"
      onClick={() => setValue(itemValue)}
      className={cn(
        "flex w-full items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
        className
      )}
      data-state={isExpanded ? "open" : "closed"}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
    </button>
  );
}

export function AccordionContent({ 
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { value } = React.useContext(AccordionContext);
  const { value: itemValue } = React.useContext(AccordionItemContext);
  const isExpanded = value.includes(itemValue);

  if (!isExpanded) return null;

  return (
    <div
      className={cn(
        "overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
        className
      )}
      data-state={isExpanded ? "open" : "closed"}
      {...props}
    >
      <div className="pb-4 pt-0">
        {children}
      </div>
    </div>
  );
}
