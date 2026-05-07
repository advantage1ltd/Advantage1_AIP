import { useState, useEffect } from "react"
import { format, isToday, isPast, addDays } from "date-fns"
import {
  Calendar,
  CheckSquare,
  ChevronDown,
  Filter,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
  User,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Users,
  ListTodo,
  ArrowUpCircle,
  Pencil,
  Trash2,
  CheckCircle,
  AlertTriangle,
  ArrowRightCircle,
  Ban,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface Task {
  id: string
  title: string
  owner: {
    name: string
    avatar?: string
  }
  status: "working" | "done" | "stuck"
  dueDate: string
  priority: "low" | "medium" | "high"
  notes: string
  timeline: {
    start: string
    end: string
  }
  lastUpdated: string
  assignees?: {
    name: string
    avatar?: string
  }[]
  tags?: string[]
  progress?: number
}

const DUMMY_TASKS: Task[] = [
  {
    id: "1",
    title: "Complete Q1 Sales Report",
    owner: {
      name: "John Doe",
      avatar: "/avatars/01.png",
    },
    status: "working",
    dueDate: "2025-01-30",
    priority: "high",
    notes: "Include regional breakdown and key metrics",
    timeline: {
      start: "2025-01-30",
      end: "2025-01-31",
    },
    lastUpdated: "32 minutes ago",
    assignees: [
      { name: "John Doe", avatar: "/avatars/01.png" },
      { name: "Jane Smith" },
    ],
    tags: ["reports", "sales", "quarterly"],
    progress: 65,
  },
  {
    id: "2",
    title: "Client Onboarding Process",
    owner: {
      name: "Jane Smith",
    },
    status: "done",
    dueDate: "2025-01-31",
    priority: "medium",
    notes: "Document and streamline the onboarding workflow",
    timeline: {
      start: "2025-02-01",
      end: "2025-02-02",
    },
    lastUpdated: "2 days ago",
    assignees: [
      { name: "Jane Smith" },
    ],
    tags: ["process", "clients"],
    progress: 100,
  },
  {
    id: "3",
    title: "System Integration Issues",
    owner: {
      name: "Bob Wilson",
    },
    status: "stuck",
    dueDate: "2025-02-01",
    priority: "high",
    notes: "Resolve API connection errors",
    timeline: {
      start: "2025-02-03",
      end: "2025-02-04",
    },
    lastUpdated: "1 hour ago",
    assignees: [
      { name: "Bob Wilson" },
      { name: "Alice Brown" },
    ],
    tags: ["technical", "urgent"],
    progress: 35,
  },
]

function Tasks() {
  const [tasks, setTasks] = useState<Task[]>(DUMMY_TASKS)
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null)
  const { toast } = useToast()

  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: "",
    status: "working",
    priority: "medium",
    notes: "",
    dueDate: format(new Date(), "yyyy-MM-dd"),
    timeline: {
      start: format(new Date(), "yyyy-MM-dd"),
      end: format(new Date(), "yyyy-MM-dd"),
    },
    owner: {
      name: "Current User",
    },
  })

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return format(date, "dd/MM/yyyy");
  };

  const handleAddTask = () => {
    const task: Task = {
      id: Math.random().toString(36).substr(2, 9),
      ...newTask as Omit<Task, 'id'>,
      lastUpdated: "Just now",
    }
    setTasks([...tasks, task])
    setShowNewTaskDialog(false)
    setNewTask({
      title: "",
      status: "working",
      priority: "medium",
      notes: "",
      dueDate: format(new Date(), "yyyy-MM-dd"),
      timeline: {
        start: format(new Date(), "yyyy-MM-dd"),
        end: format(new Date(), "yyyy-MM-dd"),
      },
      owner: {
        name: "Current User",
      },
    })
  }

  const handleEditTask = () => {
    if (!editingTask) return
    setTasks(tasks.map(task => task.id === editingTask.id ? editingTask : task))
    setEditingTask(null)
    setIsEditDialogOpen(false)
  }

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId))
  }

  const handleStatusChange = (taskId: string, newStatus: Task['status']) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, status: newStatus, lastUpdated: "Just now" }
        : task
    ))
  }

  const handlePriorityChange = (taskId: string, newPriority: Task['priority']) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, priority: newPriority, lastUpdated: "Just now" }
        : task
    ))
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsEditDialogOpen(true);
  }

  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
    const matchesStatus =
      statusFilter === "all" || task.status === statusFilter
    const matchesPriority =
      priorityFilter === "all" || task.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesPriority
  })

  // Separate ongoing and completed tasks
  const { ongoingTasks, completedTasks } = filteredTasks.reduce(
    (acc, task) => {
      if (task.status === "done") {
        acc.completedTasks.push(task)
      } else {
        acc.ongoingTasks.push(task)
      }
      return acc
    },
    { ongoingTasks: [] as Task[], completedTasks: [] as Task[] }
  )

  // Enhanced task statistics
  const taskStats = {
    total: tasks.length,
    working: tasks.filter(task => task.status === "working").length,
    done: tasks.filter(task => task.status === "done").length,
    stuck: tasks.filter(task => task.status === "stuck").length,
    dueToday: tasks.filter(task => isToday(new Date(task.dueDate))).length,
    overdue: tasks.filter(task => isPast(new Date(task.dueDate)) && task.status !== "done").length,
    highPriority: tasks.filter(task => task.priority === "high").length,
  }

  // Calculate completion rate
  const completionRate = Math.round((taskStats.done / taskStats.total) * 100) || 0

  return (
    <div className="min-h-screen bg-[#EFF4FF]">
      <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6 space-y-3 sm:space-y-4 lg:space-y-6 max-w-[1600px] mx-auto">
        {/* Header with Title and Add Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border border-border/40">
          <div className="space-y-1 w-full sm:w-auto">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-primary">Task Management</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Track and manage your team's tasks and projects
            </p>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <Button variant="outline" className="h-9 text-xs sm:text-sm flex-1 sm:flex-auto">
              <Filter className="h-4 w-4 mr-1 sm:mr-2" />
              <span>Filter</span>
            </Button>
            <Button onClick={() => setShowNewTaskDialog(true)} className="h-9 text-xs sm:text-sm flex-1 sm:flex-auto">
              <Plus className="h-4 w-4 mr-1 sm:mr-2" />
              <span>New Task</span>
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-blue-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-white">Total Tasks</CardTitle>
              <div className="rounded-full bg-blue-500/30 p-1.5 sm:p-2">
                <ListTodo className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
              <div className="text-xl sm:text-2xl font-bold text-white">{taskStats.total}</div>
              <div className="flex items-center mt-1">
                <span className="text-xs text-white font-medium bg-blue-500/30 px-1.5 py-0.5 rounded">
                  {taskStats.working} active
                </span>
                <span className="text-xs text-blue-100 ml-1.5">tasks in progress</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-emerald-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-white">Completion Rate</CardTitle>
              <div className="rounded-full bg-emerald-500/30 p-1.5 sm:p-2">
                <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
              <div className="text-xl sm:text-2xl font-bold text-white">{completionRate}%</div>
              <div className="flex items-center mt-1">
                <span className="text-xs text-white font-medium bg-emerald-500/30 px-1.5 py-0.5 rounded">
                  {taskStats.done} completed
                </span>
                <span className="text-xs text-emerald-100 ml-1.5">tasks this period</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-amber-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-white">Due Today</CardTitle>
              <div className="rounded-full bg-amber-500/30 p-1.5 sm:p-2">
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
              <div className="text-xl sm:text-2xl font-bold text-white">{taskStats.dueToday}</div>
              <div className="flex items-center mt-1">
                <span className="text-xs text-white font-medium bg-amber-500/30 px-1.5 py-0.5 rounded">
                  {taskStats.overdue} overdue
                </span>
                <span className="text-xs text-amber-100 ml-1.5">tasks need attention</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-red-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-white">High Priority</CardTitle>
              <div className="rounded-full bg-red-500/30 p-1.5 sm:p-2">
                <ArrowUpCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
              <div className="text-xl sm:text-2xl font-bold text-white">{taskStats.highPriority}</div>
              <div className="flex items-center mt-1">
                <span className="text-xs text-white font-medium bg-red-500/30 px-1.5 py-0.5 rounded">
                  {taskStats.stuck} blocked
                </span>
                <span className="text-xs text-red-100 ml-1.5">tasks need review</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Controls */}
        <Card className="border border-border/40 shadow-sm">
          <div className="p-3 sm:p-4 lg:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 sm:gap-3 w-full sm:w-auto sm:flex sm:flex-row">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px] md:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="working">In Progress</SelectItem>
                  <SelectItem value="done">Completed</SelectItem>
                  <SelectItem value="stuck">Blocked</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full sm:w-[150px] md:w-[180px]">
                  <SelectValue placeholder="Filter by priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="icon" className="hidden sm:flex">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        {/* Tasks Table */}
        <Card className="border border-border/40 shadow-sm overflow-hidden">
          <div className="w-full overflow-x-auto min-w-[320px]">
            <Table className="w-full">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={selectedTasks.length === filteredTasks.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedTasks(filteredTasks.map(task => task.id))
                        } else {
                          setSelectedTasks([])
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead className="w-[180px] sm:w-[250px] md:w-auto">Task</TableHead>
                  <TableHead className="hidden md:table-cell">Assignees</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Priority</TableHead>
                  <TableHead className="hidden lg:table-cell">Due Date</TableHead>
                  <TableHead className="hidden xl:table-cell">Progress</TableHead>
                  <TableHead className="text-right w-[80px] sm:w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.map((task) => (
                  <TableRow 
                    key={task.id} 
                    className="group"
                  >
                    <TableCell className="p-2 sm:p-3 md:p-4">
                      <Checkbox
                        checked={selectedTasks.includes(task.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTasks([...selectedTasks, task.id])
                          } else {
                            setSelectedTasks(selectedTasks.filter(id => id !== task.id))
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="p-2 sm:p-3 md:p-4">
                      <div className="flex flex-col max-w-[160px] sm:max-w-[220px] md:max-w-none">
                        <span className="font-medium text-sm sm:text-base line-clamp-2 sm:line-clamp-1">{task.title}</span>
                        <span className="text-xs text-muted-foreground hidden sm:inline-block line-clamp-1">
                          {task.notes}
                        </span>
                        {task.tags && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {task.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-[10px] sm:text-xs px-1 py-0 whitespace-nowrap"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell p-2 sm:p-3 md:p-4">
                      <div className="flex -space-x-2">
                        {task.assignees?.map((assignee, index) => (
                          <Avatar
                            key={index}
                            className="h-6 w-6 border-2 border-background"
                          >
                            {assignee.avatar ? (
                              <AvatarImage src={assignee.avatar} alt={assignee.name} />
                            ) : (
                              <AvatarFallback>
                                {assignee.name.charAt(0)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="p-2 sm:p-3 md:p-4">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs whitespace-nowrap",
                          task.status === "done"
                            ? "bg-green-500/10 text-green-500 border-green-500/20"
                            : task.status === "working"
                            ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                            : "bg-red-500/10 text-red-500 border-red-500/20"
                        )}
                      >
                        {task.status === "working"
                          ? "In Progress"
                          : task.status === "done"
                          ? "Completed"
                          : "Blocked"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell p-2 sm:p-3 md:p-4">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs whitespace-nowrap",
                          task.priority === "high"
                            ? "bg-red-500/10 text-red-500 border-red-500/20"
                            : task.priority === "medium"
                            ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                            : "bg-green-500/10 text-green-500 border-green-500/20"
                        )}
                      >
                        {task.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell p-2 sm:p-3 md:p-4">
                      <div className="flex items-center">
                        <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span
                          className={cn(
                            "text-xs sm:text-sm whitespace-nowrap",
                            isToday(new Date(task.dueDate))
                              ? "text-amber-500 font-medium"
                              : isPast(new Date(task.dueDate)) && task.status !== "done"
                              ? "text-red-500 font-medium"
                              : ""
                          )}
                        >
                          {format(new Date(task.dueDate), "MMM d, yyyy")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell p-2 sm:p-3 md:p-4">
                      <div className="flex items-center gap-2">
                        <Progress value={task.progress} className="h-2 w-20 sm:w-24" />
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {task.progress}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="p-2 sm:p-3 md:p-4">
                      <div className="flex items-center justify-end gap-1 sm:gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 sm:h-8 sm:w-8 p-0 bg-slate-100 hover:bg-slate-200"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(task);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 sm:h-8 sm:w-8 p-0 bg-slate-100 hover:bg-red-100 hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            setTaskToDelete(task.id);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredTasks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="h-[120px] text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground py-4">
                        <ListTodo className="h-7 w-7 sm:h-8 sm:w-8 mb-2" />
                        <p className="text-sm sm:text-base">No tasks found</p>
                        <p className="text-xs sm:text-sm">
                          Create a new task or adjust your filters
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Task Creation Dialog */}
        <Dialog open={showNewTaskDialog} onOpenChange={setShowNewTaskDialog}>
          <DialogContent className="sm:max-w-[600px] max-w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader className="px-1">
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>
                Add a new task to track work and progress
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  placeholder="Enter task title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={newTask.status}
                    onValueChange={(value) =>
                      setNewTask({ ...newTask, status: value as Task["status"] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="working">In Progress</SelectItem>
                      <SelectItem value="done">Completed</SelectItem>
                      <SelectItem value="stuck">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={newTask.priority}
                    onValueChange={(value) =>
                      setNewTask({ ...newTask, priority: value as Task["priority"] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) =>
                    setNewTask({ ...newTask, dueDate: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional details..."
                  value={newTask.notes}
                  onChange={(e) =>
                    setNewTask({ ...newTask, notes: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setShowNewTaskDialog(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button onClick={handleAddTask} disabled={!newTask.title} className="w-full sm:w-auto">
                Create Task
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="max-w-[95vw] sm:max-w-[400px]">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                selected task and remove it from your task list.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <AlertDialogCancel onClick={() => setShowDeleteDialog(false)} className="w-full sm:w-auto mt-2 sm:mt-0">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (taskToDelete) {
                    handleDeleteTask(taskToDelete)
                    setShowDeleteDialog(false)
                    setTaskToDelete(null)
                    toast({
                      title: "Task deleted",
                      description: "The task has been permanently deleted.",
                    })
                  }
                }}
                className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Floating Action Button (Mobile Only) */}
        <div className="fixed right-4 bottom-4 sm:hidden z-10">
          <Button 
            onClick={() => setShowNewTaskDialog(true)} 
            size="icon" 
            className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
          >
            <Plus className="h-6 w-6" />
            <span className="sr-only">New Task</span>
          </Button>
        </div>

        {/* Edit Task Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader className="px-1">
              <DialogTitle>Edit Task</DialogTitle>
              <DialogDescription>
                Make changes to the task details
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Task Title</Label>
                <Input
                  id="edit-title"
                  placeholder="Enter task title"
                  value={editingTask?.title || ""}
                  onChange={(e) =>
                    setEditingTask(editingTask ? { ...editingTask, title: e.target.value } : null)
                  }
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={editingTask?.status || "working"}
                    onValueChange={(value: Task['status']) =>
                      setEditingTask(editingTask ? { ...editingTask, status: value } : null)
                    }
                  >
                    <SelectTrigger id="edit-status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="working">In Progress</SelectItem>
                      <SelectItem value="done">Completed</SelectItem>
                      <SelectItem value="stuck">Blocked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-priority">Priority</Label>
                  <Select
                    value={editingTask?.priority || "medium"}
                    onValueChange={(value: Task['priority']) =>
                      setEditingTask(editingTask ? { ...editingTask, priority: value } : null)
                    }
                  >
                    <SelectTrigger id="edit-priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-due-date">Due Date</Label>
                <Input
                  id="edit-due-date"
                  type="date"
                  value={editingTask?.dueDate || ""}
                  onChange={(e) =>
                    setEditingTask(editingTask ? { ...editingTask, dueDate: e.target.value } : null)
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-notes">Notes</Label>
                <Textarea
                  id="edit-notes"
                  placeholder="Add any additional details..."
                  value={editingTask?.notes || ""}
                  onChange={(e) =>
                    setEditingTask(editingTask ? { ...editingTask, notes: e.target.value } : null)
                  }
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button onClick={handleEditTask} disabled={!editingTask?.title} className="w-full sm:w-auto">
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default Tasks
