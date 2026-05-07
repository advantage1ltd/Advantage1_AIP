import { Link, useLocation, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import React, { useState } from "react"
import { 
	DropdownMenu, 
	DropdownMenuContent, 
	DropdownMenuItem, 
	DropdownMenuLabel, 
	DropdownMenuSeparator, 
	DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { 
  Bell, 
  LogOut, 
  Settings, 
  User, 
  ChevronDown, 
  Search, 
  Menu,
  Home,
  Calendar,
  FileText,
  AlertTriangle,
  Users,
  ClipboardCheck,
  Building,
  PieChart,
  BarChart4,
  Radio,
  UserCog,
  FileWarning,
  FileSearch,
  Building2,
  Store,
  CalendarRange,
  BadgeCheck,
  Key,
  HelpCircle,
  Wallet,
  Shirt,
  FileTextIcon,
  BarChart3,
	ShieldCheck,
	Boxes,
	GraduationCap,
	BookOpen,
	LayoutGrid,
	BarChart2,
	LayoutDashboard,
	UserPlus,
	DollarSign,
	GitBranch,
	CheckSquare,
	Cog,
	FileQuestion,
	TrendingUp
} from "lucide-react"
import { usePageAccess, PageAccessContext } from "@/contexts/PageAccessContext"
import { Input } from "@/components/ui/input"
import { useTheme } from "@/components/theme-provider"
import { ThemeToggle } from "@/components/theme-toggle"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion"
import { USER_DATA, BUTTON_STYLES, COMMON_CLASSES } from "@/constants/header";
import { NotificationBell } from "./header/NotificationBell";
import { Logo } from "./header/Logo";
import { SearchInput } from "./header/SearchInput";
import { UserAvatar } from "./common/UserAvatar";
import { logout, getUser } from "@/services/auth"

// Define navigation items structure
interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  roles: string[]; // Which roles can access this item
}

// Header props interface
interface HeaderProps {
  onMobileMenuClick?: () => void;
}

// UserProfileDropdown component
const UserProfileDropdown = ({ canAccessSettings }: { canAccessSettings: boolean }) => {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <DropdownMenuContent align="end" className="w-56">
      <DropdownMenuLabel>My Account</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
        <Link to="/profile" className="flex items-center">
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </Link>
      </DropdownMenuItem>
      {canAccessSettings && (
        <DropdownMenuItem asChild>
          <Link to="/settings" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
      )}
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={handleLogout}>
        <LogOut className="mr-2 h-4 w-4" />
        <span>Log out</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
};

// NavigationMenu component
const NavigationMenu = ({ 
  navigationItems, 
  hasAccess, 
  handleNavigate,
	currentPath
}: {
  navigationItems: Array<{
    section: string;
    items: NavItem[];
  }>;
  hasAccess: (item: NavItem) => boolean;
  handleNavigate: () => void;
	currentPath: string;
}) => (
	(() => {
		const mainSection = navigationItems.find(section => section.section === 'Quick Access')
		const moduleSections = navigationItems.filter(section => section.section !== 'Quick Access')

		const renderIcon = (icon: React.ReactNode, isActive: boolean) => {
			if (!React.isValidElement(icon)) return icon
			return React.cloneElement(icon, {
				className: cn('h-5 w-5', isActive ? 'text-red-100 fill-current' : 'text-slate-300'),
				strokeWidth: isActive ? 1.5 : 2,
				fill: isActive ? 'currentColor' : 'none',
			})
		}

		const renderLink = (item: NavItem) => {
			const normalizedPath = item.href.split('?')[0]
			const isActive = currentPath === normalizedPath

			return (
				<Link
					key={item.href}
					to={item.href}
					onClick={handleNavigate}
					aria-current={isActive ? 'page' : undefined}
					className={cn(
						'flex items-center gap-3 rounded-md border-l-4 px-3 py-2 text-sm transition-colors',
						isActive
							? 'border-red-500 bg-slate-700 text-white font-semibold'
							: 'border-transparent text-slate-300 hover:bg-slate-700 hover:text-white'
					)}
				>
					{renderIcon(item.icon, isActive)}
					<span>{item.title}</span>
				</Link>
			)
		}

		return (
			<div className="space-y-5">
				{mainSection && mainSection.items.filter(hasAccess).length > 0 && (
					<div className="space-y-2">
						<div className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Main</div>
						<div className="space-y-1">
							{mainSection.items.filter(hasAccess).map(renderLink)}
						</div>
					</div>
				)}

				<Accordion
					type="multiple"
					defaultValue={moduleSections.map(section => section.section)}
					className="w-full"
				>
					{moduleSections.map((section) => {
						const accessibleItems = section.items.filter(hasAccess)
						if (accessibleItems.length === 0) return null

						return (
							<AccordionItem key={section.section} value={section.section} className="border-slate-700">
								<AccordionTrigger className="text-slate-100 hover:text-white hover:no-underline py-3">
									{section.section}
								</AccordionTrigger>
								<AccordionContent className="space-y-1 pt-2">
									{accessibleItems.map(renderLink)}
								</AccordionContent>
							</AccordionItem>
						)
					})}
				</Accordion>
			</div>
		)
	})()
);

export function Header({ onMobileMenuClick }: HeaderProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
	const location = useLocation();
  
  // Try to get context, but handle gracefully if not available
  let pageAccessContext;
  try {
    pageAccessContext = React.useContext(PageAccessContext);
  } catch (error) {
    // Context not available
    pageAccessContext = undefined;
  }
  
  // If context is not available, return minimal header
  if (!pageAccessContext) {
    return (
      <header className="h-[var(--header-height)] border-b border-header-border bg-header-bg">
        <div className="flex items-center justify-between h-full px-4">
          <div className="text-sm text-gray-500">Loading...</div>
        </div>
      </header>
    );
  }
  
	const { currentRole } = pageAccessContext;
  
  const { theme } = useTheme();

  // Get authenticated user info
  const authenticatedUser = getUser();
  const isAuthenticated = !!authenticatedUser;
  const canAccessSettings = authenticatedUser?.role?.toLowerCase?.() === 'administrator';

  // Define navigation sections to match SidebarNavigation
  const navigationItems = [
    {
      section: "Quick Access",
      items: [
        {
          title: "Dashboard",
          href: "/",
          icon: <LayoutGrid className="h-4 w-4" />,
          roles: ['administrator', 'advantage-ho', 'advantage-officer', 'customer-ho', 'customer-site'],
        },
        {
          title: "Action Calendar",
          href: "/action-calendar",
          icon: <Calendar className="h-4 w-4" />,
          roles: ['administrator', 'advantage-ho', 'advantage-officer', 'customer-ho', 'customer-site'],
        },
        {
          title: "Data Analytics Hub",
          href: "/analytics/data-analytics-hub",
          icon: <BarChart3 className="h-4 w-4" />,
          roles: ['administrator', 'advantage-ho', 'customer-ho'],
        }
      ]
    },
    {
      section: "CRM",
      items: [
        {
          title: "Dashboard",
          href: "/crm/dashboard",
          icon: <LayoutDashboard className="h-4 w-4" />,
          roles: ['administrator', 'advantage-ho', 'advantage-officer', 'customer-ho', 'customer-site'],
        },
        {
          title: "CRM Contacts",
          href: "/crm/contacts",
          icon: <UserPlus className="h-4 w-4" />,
          roles: ['administrator', 'advantage-ho', 'advantage-officer', 'customer-ho', 'customer-site'],
        },
        {
          title: "Sales Pipeline",
          href: "/crm/pipeline",
          icon: <GitBranch className="h-4 w-4" />,
          roles: ['administrator', 'advantage-ho', 'advantage-officer', 'customer-ho', 'customer-site'],
        }
      ]
    },
    {
      section: "Administration",
      items: [
        {
          title: "User Setup",
          href: "/administration/user-setup",
          icon: <User className="h-4 w-4" />,
          roles: ['administrator', 'advantage-ho'],
        },
        {
          title: "Employee Registration",
          href: "/administration/employee-registration",
          icon: <Users className="h-4 w-4" />,
          roles: ['administrator', 'advantage-ho'],
        },
        {
          title: "Customer Setup",
          href: "/administration/customer-setup",
          icon: <Building2 className="h-4 w-4" />,
          roles: ['administrator', 'advantage-ho'],
        },
        {
          title: "Customer Page Settings",
          href: "/administration/customer-page-settings",
          icon: <Cog className="h-4 w-4" />,
          roles: ['administrator'],
        },
        {
          title: "Stock Control",
          href: "/administration/stock-control",
          icon: <Store className="h-4 w-4" />,
          roles: ['administrator', 'advantage-ho'],
        }
      ]
    },
    {
      section: "Operations",
      items: [
        {
          title: "Incident Report",
          href: "/operations/incident-report",
          icon: <FileWarning className="h-4 w-4" />,
          roles: ['administrator', 'advantage-ho', 'advantage-officer', 'customer-ho', 'customer-site'],
        },
        {
          title: "Mystery Shopper",
          href: "/operations/mystery-shopper",
          icon: <FileSearch className="h-4 w-4" />,
          roles: ['administrator', 'advantage-ho'],
        },
        {
          title: "Site Visit",
          href: "/operations/site-visit",
          icon: <Building className="h-4 w-4" />,
          roles: ['administrator', 'advantage-ho', 'advantage-officer'],
        },
        {
          title: "Holiday Requests",
          href: "/operations/holiday-requests",
          icon: <Calendar className="h-4 w-4" />,
          roles: ['administrator', 'advantage-ho', 'advantage-officer'],
        },
        {
          title: "Bank Holiday",
          href: "/operations/bank-holiday",
          icon: <CalendarRange className="h-4 w-4" />,
          roles: ['administrator', 'advantage-ho'],
        },
        {
          title: "Customer Satisfaction",
          href: "/operations/customer-satisfaction",
          icon: <BadgeCheck className="h-4 w-4" />,
          roles: ['administrator', 'advantage-ho'],
        },
        {
          title: "Safe/Duress Words",
          href: "/operations/safe-duress-words",
          icon: <Key className="h-4 w-4" />,
          roles: ['administrator', 'advantage-ho'],
        },
        {
          title: "Officer Support",
          href: "/operations/officer-support",
          icon: <HelpCircle className="h-4 w-4" />,
          roles: ['administrator', 'advantage-ho', 'advantage-officer'],
        },
        {
          title: "Officer Expenses",
          href: "/operations/officer-expenses",
          icon: <Wallet className="h-4 w-4" />,
          roles: ['administrator', 'advantage-ho', 'advantage-officer'],
        }
      ]
    },
    {
      section: "Employee",
      items: [
        {
          title: "Uniform & Equipment",
          href: "/employee/uniform-equipment",
          icon: <Shirt className="h-4 w-4" />,
          roles: ['administrator', 'advantage-ho', 'advantage-officer'],
        },
        {
          title: "Disciplinary",
          href: "/employee/disciplinary",
          icon: <AlertTriangle className="h-4 w-4" />,
          roles: ['administrator', 'advantage-ho'],
        },
        {
          title: "Diary",
          href: "/employee/diary",
          icon: <FileText className="h-4 w-4" />,
          roles: ['administrator', 'advantage-ho', 'advantage-officer'],
        }
      ]
    },
    {
      section: "Management",
      items: [
        {
          title: "Customer Reporting",
          href: "/management/customer-reporting",
          icon: <FileText className="h-4 w-4" />,
          roles: ['administrator', 'advantage-ho'],
        },
        {
          title: "Officer Performance",
          href: "/management/officer-performance",
          icon: <CheckSquare className="h-4 w-4" />,
          roles: ['administrator', 'advantage-ho', 'customer-ho'],
        },
        {
          title: "Manager Support",
          href: "/management/manager-support",
          icon: <Building2 className="h-4 w-4" />,
          roles: ['administrator', 'advantage-ho'],
        }
      ]
    },
    {
      section: "Compliance",
      items: [
        {
          title: "Contract Renewal",
          href: "/compliance/contract-renewal",
          icon: <FileText className="h-4 w-4" />,
          roles: ['administrator', 'advantage-ho'],
        },
        {
          title: "Password Register",
          href: "/compliance/password-register",
          icon: <Key className="h-4 w-4" />,
          roles: ['administrator', 'advantage-ho'],
        },
        {
          title: "Asset Register",
          href: "/compliance/asset-register",
          icon: <Boxes className="h-4 w-4" />,
          roles: ['administrator', 'advantage-ho'],
        }
      ]
    },
    {
      section: "Recruitment",
      items: [
        {
          title: "CBT",
          href: "/recruitment/cbt",
          icon: <BookOpen className="h-4 w-4" />,
          roles: ['administrator', 'advantage-ho'],
        },
        {
          title: "Take Test",
          href: "/recruitment/take-test",
          icon: <FileQuestion className="h-4 w-4" />,
          roles: ['administrator', 'advantage-ho', 'advantage-officer', 'customer-ho', 'customer-site'],
        }
      ]
    },
    {
      section: "Customer",
      items: [
        {
          title: "Daily Activity Report",
          href: "/customer/daily-activity-report",
          icon: <FileText className="h-4 w-4" />,
          roles: ['administrator', 'advantage-ho', 'customer-ho', 'customer-site'],
        },
        {
          title: "Daily Occurrence Book",
          href: "/customer/daily-occurrence-book",
          icon: <BookOpen className="h-4 w-4" />,
          roles: ['administrator', 'advantage-ho', 'customer-ho', 'customer-site'],
        },
        {
          title: "Daily Activity Report Graph",
          href: "/customer/be-safe-be-secure",
          icon: <ShieldCheck className="h-4 w-4" />,
          roles: ['administrator', 'advantage-ho', 'customer-ho', 'customer-site'],
        },
        {
          title: "Incident Graph",
          href: "/customer/incident-graph",
          icon: <BarChart2 className="h-4 w-4" />,
          roles: ['administrator', 'advantage-ho', 'customer-ho', 'customer-site'],
        },
        {
          title: "Incident Report",
          href: "/customer/incident-report",
          icon: <FileWarning className="h-4 w-4" />,
          roles: ['administrator', 'advantage-ho', 'customer-ho', 'customer-site'],
        },
        {
          title: "Satisfaction Reports",
          href: "/customer/satisfaction-report",
          icon: <FileText className="h-4 w-4" />,
          roles: ['administrator', 'advantage-ho', 'customer-ho'],
        },
        {
          title: "Crime Intelligence",
          href: "/customer/crime-intelligence",
          icon: <TrendingUp className="h-4 w-4" />,
          roles: ['administrator', 'advantage-ho', 'customer-ho', 'customer-site'],
        },
        {
          title: "Officer Support",
          href: "/customer/officer-support",
          icon: <HelpCircle className="h-4 w-4" />,
          roles: ['administrator', 'advantage-ho', 'customer-ho', 'customer-site'],
        }
      ]
    }
  ];

	const getEffectiveRoleId = () => {
		if (isAuthenticated && authenticatedUser?.pageAccessRole) {
			return authenticatedUser.pageAccessRole.toLowerCase();
		}
		return currentRole?.toLowerCase() || null;
	};

  // Check if user has access to a navigation item
  const hasAccess = (item: NavItem) => {
		const roleId = getEffectiveRoleId();
		return roleId ? item.roles.includes(roleId) : false;
  };

  // Handle navigation and close sheet
  const handleNavigate = () => {
    setIsSheetOpen(false);
  };

	const handleMobileLogout = () => {
		logout();
		setIsSheetOpen(false);
		navigate('/login');
	};

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur border-b border-slate-200 shadow-[0_1px_0_rgba(15,23,42,0.05)] text-slate-900">
      {/* Mobile & Tablet Header */}
      <div className="w-full h-[96px] md:h-[88px] bg-transparent flex lg:hidden items-center px-4 md:px-6">
        {/* Left: Hamburger Menu */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="p-0 text-slate-700 hover:bg-slate-100"
              aria-label="Menu"
            >
              <Menu className="h-12 w-12 md:h-11 md:w-11" />
            </Button>
          </SheetTrigger>
          
          <SheetContent side="left" className={COMMON_CLASSES.sheetContent}>
            <SheetHeader className="p-4 border-b border-slate-700 shrink-0">
              <SheetTitle className="text-left flex items-center justify-center text-white">
                <img 
                  src="/AdvantageOne.svg" 
                  alt="Advantage One"
                  className="h-13 w-auto bg-transparent object-contain" 
                />
              </SheetTitle>
              <SheetDescription className="sr-only">
                Navigation menu for accessing different sections of the Security Management application
              </SheetDescription>
            </SheetHeader>
            
						<div className="flex-1 overflow-y-auto">
              <div className="px-5 py-4">
                <NavigationMenu 
                  navigationItems={navigationItems}
                  hasAccess={hasAccess}
                  handleNavigate={handleNavigate}
									currentPath={location.pathname}
                />
              </div>
            </div>

						<div className="border-t border-slate-700 px-5 py-4">
							<div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Account</div>
							<div className="mt-3 space-y-1">
								{canAccessSettings && (
									<Link
										to="/settings"
										onClick={handleNavigate}
										className="flex items-center gap-3 rounded-md border-l-4 border-transparent px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
									>
										<Settings className="h-5 w-5 text-slate-300" />
										<span>Settings</span>
									</Link>
								)}
								<button
									type="button"
									onClick={handleMobileLogout}
									className="flex w-full items-center gap-3 rounded-md border-l-4 border-transparent px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
								>
									<LogOut className="h-5 w-5 text-slate-300" />
									<span>Logout</span>
								</button>
							</div>
						</div>

            {/* User profile section at bottom of menu */}
            <div className="p-6 border-t border-slate-700 shrink-0">
              <div className="flex items-center gap-3">
                <UserAvatar size="md" showBorder={true} />
                <div className="text-sm">
                  <p className="font-medium text-white">
                    {isAuthenticated ? `${authenticatedUser.firstName} ${authenticatedUser.lastName}` : 'David Ibanga'}
                  </p>
                  <p className="text-xs text-slate-300">
                    {isAuthenticated ? authenticatedUser.role : 'IT manager'}
                  </p>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Center: Logo */}
        <div className="flex items-center justify-center flex-1">
          <img 
            src="/AdvantageOne.svg" 
            alt="Advantage One"
            className="h-16 sm:h-20 md:h-24 w-auto max-w-[300px] sm:max-w-[360px] md:max-w-[420px] object-contain"
          />
        </div>

        {/* Right: Notifications and User Profile */}
        <div className="flex items-center gap-2 md:gap-3 text-slate-700">
          <NotificationBell />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2 cursor-pointer">
                <UserAvatar size="sm" showBorder={true} />
                <ChevronDown className="h-4 w-4 text-slate-500 hidden md:block" />
              </div>
            </DropdownMenuTrigger>
            <UserProfileDropdown canAccessSettings={canAccessSettings} />
          </DropdownMenu>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:flex h-[88px] items-center px-6 bg-transparent">
        {/* Left: Logo */}
        <div className="flex items-center text-slate-900">
          <Logo variant="desktop" />
        </div>
        
        {/* Center: Search */}
        <div className="flex-1 flex justify-center items-center">
          <div className="relative max-w-md w-full">
            <SearchInput />
          </div>
        </div>
        
		{/* Right: Notifications and User Profile */}
				<div className="flex items-center gap-4 text-slate-900">
          <NotificationBell />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2 cursor-pointer">
                <UserAvatar size="md" showBorder={true} />
                <div className="text-sm">
                  <p className="font-medium text-slate-900">
                    {isAuthenticated ? `${authenticatedUser.firstName} ${authenticatedUser.lastName}` : 'David Ibanga'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {isAuthenticated ? authenticatedUser.role : 'IT manager'}
                  </p>
                </div>
								<ChevronDown className="h-4 w-4 text-slate-400" />
              </div>
            </DropdownMenuTrigger>
            <UserProfileDropdown canAccessSettings={canAccessSettings} />
          </DropdownMenu>
        </div>
      </div>

    </header>
  )
} 