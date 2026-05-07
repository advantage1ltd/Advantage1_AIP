// import React from 'react'
// import { Bell, Search, Menu, Sun, Moon } from 'lucide-react'
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu"
// import { cn } from "../../lib/utils"

// interface HeaderProps {
//   className?: string
// }

// const Header: React.FC<HeaderProps> = ({ className }) => {
//   const [theme, setTheme] = React.useState<'light' | 'dark'>('light')

//   const toggleTheme = () => {
//     setTheme(theme === 'light' ? 'dark' : 'light')
//     document.documentElement.classList.toggle('dark')
//   }

//   return (
//     <header className={cn("sticky top-0 z-50 w-full", className)}>
//       <div className="flex h-16 items-center justify-between px-4 sm:px-6">
//         {/* Search */}
//         <div className="flex flex-1 items-center">
//           <div className="w-full max-w-lg">
//             <div className="relative">
//               <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
//               <Input
//                 type="search"
//                 placeholder="Search..."
//                 className="h-10 w-full rounded-full border-none bg-gray-100 pl-11 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
//               />
//             </div>
//           </div>
//         </div>

//         {/* Actions */}
//         <div className="flex items-center space-x-4">
//           {/* Theme Toggle */}
//           <Button
//             variant="ghost"
//             size="icon"
//             onClick={toggleTheme}
//             className="h-10 w-10 rounded-full"
//           >
//             {theme === 'light' ? (
//               <Moon className="h-5 w-5 text-gray-600 hover:text-gray-900" />
//             ) : (
//               <Sun className="h-5 w-5 text-gray-400 hover:text-gray-100" />
//             )}
//           </Button>

//           {/* Notifications */}
//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <Button
//                 variant="ghost"
//                 size="icon"
//                 className="h-10 w-10 rounded-full relative"
//               >
//                 <Bell className="h-5 w-5" />
//                 <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
//                   3
//                 </span>
//               </Button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent align="end" className="w-80">
//               <DropdownMenuLabel>Notifications</DropdownMenuLabel>
//               <DropdownMenuSeparator />
//               {/* Add notification items here */}
//             </DropdownMenuContent>
//           </DropdownMenu>

//           {/* User Menu */}
//           <DropdownMenu>
//             <DropdownMenuTrigger asChild>
//               <Button
//                 variant="ghost"
//                 className="relative h-10 w-10 rounded-full"
//               >
//                 <Avatar>
//                   <AvatarImage src="https://avatars.githubusercontent.com/u/47346863?s=400&u=f3910523f6f994655d3d57ef1cbcbbef491f3bea&v=4" />
//                   <AvatarFallback>SC</AvatarFallback>
//                 </Avatar>
//               </Button>
//             </DropdownMenuTrigger>
//             <DropdownMenuContent align="end">
//               <DropdownMenuLabel>My Account</DropdownMenuLabel>
//               <DropdownMenuSeparator />
//               <DropdownMenuItem>Profile</DropdownMenuItem>
//               <DropdownMenuItem>Settings</DropdownMenuItem>
//               <DropdownMenuItem>Support</DropdownMenuItem>
//               <DropdownMenuSeparator />
//               <DropdownMenuItem className="text-red-600">
//                 Log out
//               </DropdownMenuItem>
//             </DropdownMenuContent>
//           </DropdownMenu>
//         </div>
//       </div>
//     </header>
//   )
// }

// export default Header