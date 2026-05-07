import * as React from "react";
import { DayPicker, DayPickerProps } from "react-day-picker";
import { cn } from "@/lib/utils";

type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  hideNavigation?: boolean;
};

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  hideNavigation = false,
  components,
  ...props
}: CalendarProps) {
  const mergedComponents: DayPickerProps["components"] | undefined = hideNavigation
    ? { ...components, Nav: () => null }
    : components;

  const navClassName = hideNavigation
    ? "hidden"
    : "flex items-center order-1 order-last flex-row gap-2 sm:gap-4";

  return (
    <div className="flex justify-center items-center w-full max-w-full overflow-hidden">
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn("rounded-md border p-2 sm:p-4 w-full max-w-full", className)}
        classNames={{
          months: "flex flex-col items-center w-full",
          month: "space-y-2 sm:space-y-4 w-full",
          caption: "flex items-center justify-center gap-1 sm:gap-2 pt-1 w-full px-1 sm:px-2",
          caption_label: "text-sm font-medium order-2",
          nav: navClassName,
          nav_button: cn(
            "h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 flex justify-center items-center touch-manipulation"
          ),
          nav_button_previous: "",
          nav_button_next: "",
          table: "w-full border-collapse space-y-1 max-w-full",
          head_row: "flex w-full",
          head_cell:
            "text-muted-foreground rounded-md flex-1 text-center font-normal text-[0.8rem] py-1 min-w-0",
          row: "flex w-full mt-2",
          cell:
            "flex-1 text-center text-sm p-0 relative h-9 flex items-center justify-center min-w-0 [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          day: cn("h-9 w-9 p-0 font-normal aria-selected:opacity-100 mx-auto touch-manipulation"),
          day_range_end: "day-range-end",
          day_selected:
            "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          day_today: "bg-accent text-accent-foreground",
          day_outside:
            "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle:
            "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
          ...classNames,
        }}
        components={mergedComponents}
        {...props}
      />
    </div>
  );
}
