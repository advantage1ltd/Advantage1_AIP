import { Link } from "react-router-dom";
import React from "react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { usePageAccess } from "@/contexts/PageAccessContext";

// Import icons
import { 
  Bell, LogOut, Settings, User, ChevronDown, Menu,
  Home, Calendar, FileText, AlertTriangle, Users, ClipboardCheck,
  Building, FileWarning, FileSearch, Building2, Store, CalendarRange,
  BadgeCheck, Key, HelpCircle, Wallet, Shirt, Handshake, ShieldCheck,
  Boxes, BookOpen, LayoutGrid, BarChart2
} from "lucide-react";

// Import constants and components
import { USER_DATA, BUTTON_STYLES, COMMON_CLASSES } from "@/constants/header";
import { NotificationBell } from "./NotificationBell";
import { Logo } from "./Logo";
import { SearchInput } from "./SearchInput";

// Define types
interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  roles: string[];
}

// Reusable components
const UserProfileDropdown = () => (
  <DropdownMenuContent className="w-56" align="end" forceMount>
    <DropdownMenuLabel className="font-normal">
      <div className="flex flex-col space-y-1">
        <p className="text-sm font-medium leading-none">{USER_DATA.name}</p>
        <p className="text-xs leading-none text-muted-foreground">
          {USER_DATA.email}
        </p>
      </div>
    </DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem asChild>
      <Link to="/profile" className="flex w-full cursor-pointer items-center">
        <User className="mr-2 h-4 w-4" />
        <span>Profile</span>
      </Link>
    </DropdownMenuItem>
    <DropdownMenuItem asChild>
      <Link to="/settings" className="flex w-full cursor-pointer items-center">
        <Settings className="mr-2 h-4 w-4" />
        <span>Settings</span>
      </Link>
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem>
      <LogOut className="mr-2 h-4 w-4" />
      <span>Log out</span>
    </DropdownMenuItem>
  </DropdownMenuContent>
);

// Role selector content component
const RoleSelectorContent = ({ 
  currentRole, 
  testRole, 
  isTestMode, 
  handleRoleChange, 
  toggleTestMode, 
  userRoles 
}: {
  currentRole: string | null;
  testRole: string | null;
  isTestMode: boolean;
  handleRoleChange: (roleId: string) => void;
  toggleTestMode: () => void;
  userRoles: Array<{ id: string; name: string; }>;
}) => (
  <DropdownMenuContent align="start" className="w-[calc(340px-48px)] sm:w-[calc(400px-48px)] bg-blue-900 text-white border-blue-800">
    <DropdownMenuLabel className="text-blue-200 text-[15px]">Switch Role</DropdownMenuLabel>
    <DropdownMenuSeparator className="bg-blue-800" />
    <DropdownMenuRadioGroup 
      value={isTestMode && testRole ? testRole : currentRole || ''} 
      onValueChange={handleRoleChange}
    >
      {userRoles.map(role => (
        <DropdownMenuRadioItem key={role.id} value={role.id} className="text-white focus:bg-blue-800 focus:text-white text-[15px]">
          {role.name}
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
    <DropdownMenuSeparator className="bg-blue-800" />
    <DropdownMenuItem onClick={toggleTestMode} className="text-white focus:bg-blue-800 focus:text-white text-[15px]">
      {isTestMode ? 'Exit Test Mode' : 'Enter Test Mode'}
      {isTestMode && (
        <Badge variant="outline" className="ml-auto border-blue-700 bg-blue-950/50">Active</Badge>
      )}
    </DropdownMenuItem>
  </DropdownMenuContent>
);

// Navigation menu component
const NavigationMenu = ({ 
  navigationItems, 
  hasAccess, 
  handleNavigate 
}: {
  navigationItems: Array<any>;
  hasAccess: (item: NavItem) => boolean;
  handleNavigate: () => void;
}) => (
  <Accordion type="multiple" className="space-y-4">
    {navigationItems.map((section, idx) => {
      const accessibleItems = section.items.filter(item => hasAccess(item));
      if (accessibleItems.length === 0) return null;
      
      return (
        <AccordionItem key={idx} value={section.section.toLowerCase()} className="border-none">
          <AccordionTrigger className="flex items-center gap-3 rounded-lg px-4 py-3 hover:no-underline hover:bg-blue-900 text-white">
            <span className="text-[17px] font-medium">{section.section}</span>
          </AccordionTrigger>
          <AccordionContent className="pb-3 pt-2">
            <div className="space-y-2">
              {accessibleItems.map((item, itemIdx) => (
                <Link 
                  key={itemIdx} 
                  to={item.href}
                  className="flex items-center gap-4 rounded-md px-4 py-3 text-[16px] font-medium text-blue-200 hover:bg-blue-800 hover:text-white"
                  onClick={handleNavigate}
                >
                  {React.cloneElement(item.icon as React.ReactElement, { className: 'h-6 w-6' })}
                  {item.title}
                </Link>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      );
    })}
  </Accordion>
);

// User profile section component
const UserProfileSection = () => (
  <div className="border-t border-blue-900 p-6 mt-auto bg-blue-900/50">
    <div className="flex items-center gap-4">
      <Avatar className="h-14 w-14 border border-blue-700">
        <AvatarImage src={USER_DATA.avatar} alt={USER_DATA.name} />
        <AvatarFallback className="bg-blue-700 text-white text-xl">{USER_DATA.initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-[17px] font-medium text-white truncate">{USER_DATA.name}</p>
        <p className="text-[14px] text-blue-200 truncate">{USER_DATA.role}</p>
      </div>
      <Button 
        variant="ghost" 
        size="icon"
        aria-label="Log out"
        className="text-blue-200 hover:text-white hover:bg-blue-800 h-12 w-12"
      >
        <LogOut className="h-6 w-6" />
      </Button>
    </div>
  </div>
);

export function Header() {
  // ... rest of the existing code ...
} 