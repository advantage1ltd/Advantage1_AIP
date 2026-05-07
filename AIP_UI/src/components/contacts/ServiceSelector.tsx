import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ServiceItem, SERVICES_HIERARCHY } from "@/lib/services";

interface ServiceSelectorProps {
  selectedServices: string[];
  onServiceToggle: (service: string) => void;
}

interface ServiceGroupProps {
  item: ServiceItem;
  selectedServices: string[];
  onServiceToggle: (service: string) => void;
  currentPath?: string;
  depth?: number;
}

function ServiceGroup({ item, selectedServices, onServiceToggle, currentPath = "", depth = 0 }: ServiceGroupProps) {
  const fullPath = currentPath ? `${currentPath} > ${item.name}` : item.name;
  
  if (!item.children) {
    return (
      <div
        className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-accent ${
          selectedServices.includes(fullPath) ? "bg-primary/10" : ""
        }`}
        onClick={() => onServiceToggle(fullPath)}
        style={{ marginLeft: `${depth * 1.5}rem` }}
      >
        <span className="text-sm">{item.name}</span>
        {selectedServices.includes(fullPath) && (
          <Check className="h-4 w-4 text-primary" />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div
        className="font-medium text-sm p-2"
        style={{ marginLeft: `${depth * 1.5}rem` }}
      >
        {item.name}
      </div>
      <div className="space-y-1">
        {item.children.map((child, index) => (
          <ServiceGroup
            key={`${fullPath}-${child.name}-${index}`}
            item={child}
            selectedServices={selectedServices}
            onServiceToggle={onServiceToggle}
            currentPath={fullPath}
            depth={depth + 1}
          />
        ))}
      </div>
    </div>
  );
}

export function ServiceSelector({ selectedServices, onServiceToggle }: ServiceSelectorProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(SERVICES_HIERARCHY[0].name);

  return (
    <div className="space-y-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span>Select Services</span>
            <span className="text-xs text-muted-foreground">
              {selectedServices.length} selected
            </span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Select Services</DialogTitle>
            <DialogDescription>
              Choose the services that are relevant for this contact.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto">
              {SERVICES_HIERARCHY.map((category) => (
                <TabsTrigger
                  key={category.name}
                  value={category.name}
                  className="px-4"
                >
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {SERVICES_HIERARCHY.map((category) => (
              <TabsContent
                key={category.name}
                value={category.name}
                className="mt-4"
              >
                <ScrollArea className="h-[400px] pr-4">
                  <ServiceGroup
                    item={category}
                    selectedServices={selectedServices}
                    onServiceToggle={onServiceToggle}
                  />
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>

          <div className="mt-4">
            <div className="text-sm font-medium mb-2">Selected Services ({selectedServices.length})</div>
            <div className="flex flex-wrap gap-2">
              {selectedServices.map((service) => (
                <Badge
                  key={service}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {service}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      onServiceToggle(service);
                    }}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {selectedServices.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedServices.map((service) => (
            <Badge
              key={service}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {service}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onServiceToggle(service);
                }}
                className="ml-1 hover:text-destructive"
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
