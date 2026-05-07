import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { AddTaskForm } from "@/components/action-calendar/AddTaskForm";
import { TaskList } from "@/components/action-calendar/TaskList";
import { TaskProgressSheet } from "@/components/action-calendar/TaskProgressSheet";
import { usePageAccess } from "@/contexts/PageAccessContext";
import { 
  Plus, 
  CalendarDays, 
  ListTodo, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ArrowUpCircle, 
  MinusCircle, 
  ArrowDownCircle,
  Calendar as CalendarIcon,
  Filter,
  Lock,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Target,
  TrendingUp,
  Zap,
  LayoutGrid,
  List,
  CalendarCheck,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { startOfWeek, endOfWeek, isSameWeek, isSameDay, isSameMonth, format, isToday } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { actionCalendarService, ActionCalendarStatusUpdate } from "@/services/actionCalendarService";
import useAuth from "@/hooks/useAuth";

export type Task = {
  id: string;
  title: string;
  description: string;
  date: Date;
  priority: "low" | "medium" | "high";
  assignee: string;
  assigneeName?: string;
  status: "pending" | "in-progress" | "completed" | "blocked";
  statusNotes?: string;
  email?: string;
  createdById?: string;
  createdByName?: string;
  modifiedById?: string;
  modifiedByName?: string;
  dateCreated?: Date;
  dateModified?: Date;
};

export type TaskStatusUpdate = {
  id: string;
  taskId: string;
  status: Task["status"];
  comment?: string;
  updateDate: Date;
  updatedBy?: string;
  updatedByName: string;
};

const mapStatusUpdate = (update: ActionCalendarStatusUpdate): TaskStatusUpdate => ({
  id: update.actionCalendarStatusUpdateId.toString(),
  taskId: update.actionCalendarId.toString(),
  status: update.status,
  comment: update.comment,
  updateDate: new Date(update.updateDate),
  updatedBy: update.updatedBy,
  updatedByName: update.updatedByUserName,
});

const buildTaskStatistics = (taskList: Task[]) => {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  return taskList.reduce(
    (acc, task) => {
      acc.total += 1;
      if (task.status === "completed") acc.completed += 1;
      if (task.status === "in-progress") acc.inProgress += 1;
      if (task.status === "pending") acc.pending += 1;
      if (task.status === "blocked") acc.blocked += 1;
      if (task.priority === "high") acc.highPriority += 1;
      if (isToday(task.date)) acc.dueToday += 1;
      if (task.date < todayStart && task.status !== "completed") acc.overdue += 1;
      return acc;
    },
    {
      total: 0,
      completed: 0,
      inProgress: 0,
      pending: 0,
      blocked: 0,
      highPriority: 0,
      dueToday: 0,
      overdue: 0,
    }
  );
};

const hasRecentMatchingUpdate = (
  updates: TaskStatusUpdate[],
  payload: { status: Task["status"]; comment?: string }
) => {
  const now = Date.now();
  return updates.some(update => {
    const isRecent = now - update.updateDate.getTime() < 2 * 60 * 1000;
    if (!isRecent) return false;
    const commentMatches = payload.comment
      ? (update.comment || "").trim() === payload.comment.trim()
      : true;
    return update.status === payload.status && commentMatches;
  });
};

const ActionCalendar: React.FC = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    blocked: 0,
    highPriority: 0,
    dueToday: 0,
    overdue: 0,
  });
  const [activeTab, setActiveTab] = useState<string>("day");
  const { toast } = useToast();
  const { currentRole } = usePageAccess();
  const { user } = useAuth();
  const isAdmin = currentRole === "administrator";
  const currentUserId = user?.id;

  const [statusUpdates, setStatusUpdates] = useState<Record<string, TaskStatusUpdate[]>>({});
  const [statusUpdatesLoading, setStatusUpdatesLoading] = useState<Record<string, boolean>>({});
  const [statusUpdatesError, setStatusUpdatesError] = useState<Record<string, string | null>>({});
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isProgressSheetOpen, setIsProgressSheetOpen] = useState(false);

  const canManageTasks = isAdmin;
  const canUpdateTaskStatus = (task: Task) => {
    if (isAdmin) return true;
    if (task.assignee && currentUserId && task.assignee === currentUserId) return true;
    if (task.createdById && currentUserId && task.createdById === currentUserId) return true;
    return false;
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await actionCalendarService.getTasks(
        !isAdmin && currentUserId ? { assignee: currentUserId } : undefined
      );
      if (response.success) {
        const convertedTasks = response.data.map((task: any) => actionCalendarService.convertToFrontendFormat(task));
        setTasks(convertedTasks);
        if (!isAdmin) {
          setStatistics(buildTaskStatistics(convertedTasks));
        }
      } else {
        toast({ title: "Error", description: response.message || "Failed to load tasks", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
      toast({ title: "Error", description: "Failed to load tasks from server", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      if (!isAdmin) return;
      const stats = await actionCalendarService.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error("Error loading statistics:", error);
    }
  };

  const loadTaskStatusUpdates = async (taskId: string, force = false) => {
    if (!force && statusUpdates[taskId]) return;
    setStatusUpdatesLoading((p) => ({ ...p, [taskId]: true }));
    setStatusUpdatesError((p) => ({ ...p, [taskId]: null }));

    try {
      const res = await actionCalendarService.getStatusUpdates(parseInt(taskId));
      if (res.success) {
        setStatusUpdates((p) => ({ ...p, [taskId]: res.data.map(mapStatusUpdate) }));
      } else {
        throw new Error(res.message || "Failed to load status updates");
      }
    } catch (error) {
      console.error(error);
      setStatusUpdatesError((p) => ({ ...p, [taskId]: "Unable to load progress updates. Please try again." }));
      toast({ title: "Error", description: "Failed to load task progress history.", variant: "destructive" });
    } finally {
      setStatusUpdatesLoading((p) => ({ ...p, [taskId]: false }));
    }
  };

  const handleOpenProgress = async (task: Task) => {
    setActiveTask(task);
    setIsProgressSheetOpen(true);
    await loadTaskStatusUpdates(task.id);
  };

  const handleSubmitProgressUpdate = async (taskId: string, payload: { status: Task["status"]; comment?: string }) => {
    try {
      setStatusUpdatesError((p) => ({ ...p, [taskId]: null }));
      const response = await actionCalendarService.createStatusUpdate(parseInt(taskId), payload);
      if (response.success || response.data) {
        const mappedUpdate = mapStatusUpdate(response.data);
        setStatusUpdates((p) => ({ ...p, [taskId]: [mappedUpdate, ...(p[taskId] || [])] }));
        await loadTasks();
        if (isAdmin) await loadStatistics();
        setIsProgressSheetOpen(false);
        setActiveTask(null);
        toast({ title: "Progress Updated", description: "Task progress has been shared with the task creator and assignee." });
        return;
      }
      throw new Error(response.message || "Failed to submit status update");
    } catch (error) {
      console.error("Error updating task progress:", error);
      try {
        const fallback = await actionCalendarService.getStatusUpdates(parseInt(taskId));
        if (fallback.success) {
          const mappedUpdates = fallback.data.map(mapStatusUpdate);
          setStatusUpdates((p) => ({ ...p, [taskId]: mappedUpdates }));
          if (hasRecentMatchingUpdate(mappedUpdates, payload)) {
            await loadTasks();
            if (isAdmin) await loadStatistics();
            setIsProgressSheetOpen(false);
            setActiveTask(null);
            toast({ title: "Progress Updated", description: "Task progress was saved. The latest status has been refreshed." });
            return;
          }
        }
      } catch (fallbackError) {
        console.error("Error verifying task progress update:", fallbackError);
      }

      setStatusUpdatesError((p) => ({ ...p, [taskId]: "Unable to submit update. Please try again." }));
      toast({ title: "Error", description: "Failed to submit task progress.", variant: "destructive" });
    }
  };

  const handleCloseProgressSheet = (open: boolean) => {
    setIsProgressSheetOpen(open);
    if (!open) setActiveTask(null);
  };

  const handleRefreshActiveTaskUpdates = () => {
    if (activeTask) loadTaskStatusUpdates(activeTask.id, true);
  };

  const handleAddTask = async (newTask: Omit<Task, "id" | "status">) => {
    if (!isAdmin) {
      toast({ title: "Access Denied", description: "Only administrators can create and assign tasks.", variant: "destructive" });
      return;
    }
    try {
      const backendTask = actionCalendarService.convertToBackendFormat({ ...newTask, status: "pending" });
      const response = await actionCalendarService.createTask(backendTask);
      if (response.success) {
        const convertedTask = actionCalendarService.convertToFrontendFormat(response.data);
        setTasks((t) => [...t, convertedTask]);
        if (isAdmin) await loadStatistics();
        toast({ title: "Task Added", description: "Your task has been successfully created." });
      } else {
        toast({ title: "Error", description: response.message || "Failed to create task", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error creating task:", error);
      toast({ title: "Error", description: "Failed to create task", variant: "destructive" });
    }
  };

  const handleUpdateTask = async (taskId: string, updatedTask: Partial<Task>) => {
    if (!isAdmin) {
      toast({ title: "Access Denied", description: "Only administrators can update tasks.", variant: "destructive" });
      return;
    }
    try {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;
      const backendTask = actionCalendarService.convertToBackendFormat({ ...task, ...updatedTask });
      const response = await actionCalendarService.updateTask(parseInt(taskId), backendTask);
      if (response.success) {
        const updated = actionCalendarService.convertToFrontendFormat(response.data);
        setTasks((t) => t.map((x) => (x.id === taskId ? updated : x)));
        if (isAdmin) await loadStatistics();
        toast({ title: "Task Updated", description: "Task has been successfully updated." });
      } else {
        toast({ title: "Error", description: response.message || "Failed to update task", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error updating task:", error);
      toast({ title: "Error", description: "Failed to update task", variant: "destructive" });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!isAdmin) {
      toast({ title: "Access Denied", description: "Only administrators can delete tasks.", variant: "destructive" });
      return;
    }
    try {
      const response = await actionCalendarService.deleteTask(parseInt(taskId));
      if (response.success) {
        setTasks((t) => t.filter((task) => task.id !== taskId));
        if (isAdmin) await loadStatistics();
        toast({ title: "Task Deleted", description: "Task has been successfully deleted." });
      } else {
        toast({ title: "Error", description: response.message || "Failed to delete task", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({ title: "Error", description: "Failed to delete task", variant: "destructive" });
    }
  };

  useEffect(() => {
    loadTasks();
    if (isAdmin) loadStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, currentUserId]);

  const completionRate = statistics.total > 0 ? Math.round((statistics.completed / statistics.total) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EFF4FF]">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="relative">
              <div className="h-20 w-20 rounded-full border-4 border-blue-100 animate-pulse" />
              <Loader2 className="h-10 w-10 text-blue-600 animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="mt-6 text-gray-600 font-medium">Loading your tasks...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EFF4FF]">
      <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
        
        {/* Modern Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <CalendarCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Action Calendar</h1>
                <p className="text-gray-500 text-sm">
                  {isAdmin ? "Plan, organize, and assign tasks efficiently" : "View and manage your assigned tasks"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2 bg-white border-gray-200 text-gray-700 hover:bg-gray-50">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filter</span>
            </Button>

            {isAdmin ? (
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md">
                    <Plus className="h-4 w-4" />
                    <span>Create Task</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[550px]">
                  <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                    <DialogDescription>Fill in the details below to create a new task.</DialogDescription>
                  </DialogHeader>
                  <AddTaskForm onSubmit={handleAddTask} selectedDate={date} />
                </DialogContent>
              </Dialog>
            ) : (
              <Button size="sm" variant="outline" className="gap-2 border-gray-200 text-gray-400 cursor-not-allowed" disabled>
                <Lock className="h-4 w-4" />
                <span className="hidden sm:inline">Create Task</span>
              </Button>
            )}
          </div>
        </div>

        {/* Statistics Cards - Colored Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Tasks */}
          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white group hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <CardContent className="p-5 relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-100">Total Tasks</p>
                  <p className="text-3xl font-bold mt-1">{statistics.total}</p>
                  <p className="text-xs text-blue-200 mt-1">All time</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Target className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completed */}
          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white group hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <CardContent className="p-5 relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-100">Completed</p>
                  <p className="text-3xl font-bold mt-1">{statistics.completed}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-1.5 w-14 bg-white/30 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white rounded-full transition-all duration-500"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-white">{completionRate}%</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* In Progress */}
          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white group hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <CardContent className="p-5 relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-100">In Progress</p>
                  <p className="text-3xl font-bold mt-1">{statistics.inProgress}</p>
                  <p className="text-xs font-medium mt-1 flex items-center gap-1 text-amber-100">
                    <TrendingUp className="h-3 w-3" />
                    Active
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Due Today */}
          <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-red-500 to-rose-600 text-white group hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <CardContent className="p-5 relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-red-100">Due Today</p>
                  <p className="text-3xl font-bold mt-1">{statistics.dueToday}</p>
                  <p className="text-xs font-medium mt-1 flex items-center gap-1 text-red-100">
                    <Zap className="h-3 w-3" />
                    Urgent
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Calendar Panel */}
          <div className="lg:col-span-4 xl:col-span-3 order-2 lg:order-1">
            <Card className="border-0 shadow-md bg-white overflow-hidden">
              <CardHeader className="pb-3 border-b bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-base font-semibold text-gray-900">Calendar</CardTitle>
                  </div>
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    {format(date, "MMM yyyy")}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="p-4">
                {/* Calendar Navigation */}
                <div className="flex flex-col gap-3 mb-4">
                  {/* Month Navigation */}
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <button 
                      onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() - 1, 1))} 
                      className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white border border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm text-sm font-medium text-gray-700"
                      aria-label="Previous month"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden sm:inline">Prev</span>
                    </button>
                    <span className="font-semibold text-gray-900 text-sm">{format(date, "MMMM yyyy")}</span>
                    <button 
                      onClick={() => setDate(new Date(date.getFullYear(), date.getMonth() + 1, 1))} 
                      className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white border border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm text-sm font-medium text-gray-700"
                      aria-label="Next month"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  
                  {/* Today Button */}
                  <button
                    onClick={() => setDate(new Date())}
                    className={cn(
                      "w-full py-2 px-4 rounded-lg text-sm font-medium transition-all",
                      isToday(date)
                        ? "bg-blue-100 text-blue-700 border border-blue-200"
                        : "bg-white border border-gray-200 text-gray-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 shadow-sm"
                    )}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      <span>Go to Today</span>
                    </div>
                  </button>
                </div>

                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  className="w-full"
                  showOutsideDays
                  hideNavigation
                />

                <Separator className="my-4" />

                {/* Priority Legend */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Priority Overview
                  </h4>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2.5 bg-red-50 rounded-lg border border-red-100">
                      <div className="flex items-center gap-2.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-red-200" />
                        <span className="text-sm font-medium text-gray-700">High Priority</span>
                      </div>
                      <Badge className="bg-red-100 text-red-700 border-0 font-semibold">{statistics.highPriority}</Badge>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-amber-50 rounded-lg border border-amber-100">
                      <div className="flex items-center gap-2.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-amber-200" />
                        <span className="text-sm font-medium text-gray-700">Medium Priority</span>
                      </div>
                      <Badge className="bg-amber-100 text-amber-700 border-0 font-semibold">{tasks.filter((t) => t.priority === "medium").length}</Badge>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-emerald-50 rounded-lg border border-emerald-100">
                      <div className="flex items-center gap-2.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
                        <span className="text-sm font-medium text-gray-700">Low Priority</span>
                      </div>
                      <Badge className="bg-emerald-100 text-emerald-700 border-0 font-semibold">{tasks.filter((t) => t.priority === "low").length}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tasks Panel */}
          <div className="lg:col-span-8 xl:col-span-9 order-1 lg:order-2">
            <Card className="border-0 shadow-md bg-white overflow-hidden">
              <CardHeader className="pb-0 border-b">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ListTodo className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-base font-semibold text-gray-900">Tasks</CardTitle>
                  </div>
                  
                  {isToday(date) && (
                    <Badge className="bg-emerald-100 text-emerald-700 border-0">
                      <span className="relative flex h-2 w-2 mr-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      Today
                    </Badge>
                  )}
                </div>

                <Tabs defaultValue="day" className="w-full" onValueChange={setActiveTab} value={activeTab}>
                  <TabsList className="w-full grid grid-cols-3 h-11 bg-gray-100/80 p-1 rounded-lg">
                    <TabsTrigger 
                      value="day" 
                      className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm font-medium"
                    >
                      Day
                    </TabsTrigger>
                    <TabsTrigger 
                      value="week"
                      className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm font-medium"
                    >
                      Week
                    </TabsTrigger>
                    <TabsTrigger 
                      value="month"
                      className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm font-medium"
                    >
                      Month
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>

              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsContent value="day" className="m-0">
                    <div className="px-5 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-800">{format(date, "EEEE, MMMM d, yyyy")}</p>
                      <Badge variant="outline" className="bg-white text-gray-600 border-gray-200">
                        {tasks.filter((task) => isSameDay(new Date(task.date), date)).length} tasks
                      </Badge>
                    </div>

                    <div className="p-5">
                      {tasks.filter((task) => isSameDay(new Date(task.date), date)).length > 0 ? (
                        <TaskList 
                          tasks={tasks.filter((task) => isSameDay(new Date(task.date), date))}
                          onOpenProgress={handleOpenProgress}
                          onUpdateTask={handleUpdateTask}
                          onDeleteTask={handleDeleteTask}
                          canManageTasks={canManageTasks}
                          canUpdateStatus={canUpdateTaskStatus}
                        />
                      ) : (
                        <EmptyTaskState isAdmin={isAdmin} handleAddTask={handleAddTask} date={date} />
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="week" className="m-0">
                    <div className="px-5 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-800">
                        Week of {format(startOfWeek(date), "MMM d")} - {format(endOfWeek(date), "MMM d, yyyy")}
                      </p>
                      <Badge variant="outline" className="bg-white text-gray-600 border-gray-200">
                        {tasks.filter((task) => isSameWeek(new Date(task.date), date)).length} tasks
                      </Badge>
                    </div>

                    <div className="p-5">
                      {tasks.filter((task) => isSameWeek(new Date(task.date), date)).length > 0 ? (
                        <TaskList 
                          tasks={tasks.filter((task) => isSameWeek(new Date(task.date), date))}
                          onOpenProgress={handleOpenProgress}
                          onUpdateTask={handleUpdateTask}
                          onDeleteTask={handleDeleteTask}
                          canManageTasks={canManageTasks}
                          canUpdateStatus={canUpdateTaskStatus}
                        />
                      ) : (
                        <EmptyTaskState isAdmin={isAdmin} handleAddTask={handleAddTask} date={date} />
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="month" className="m-0">
                    <div className="px-5 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-800">{format(date, "MMMM yyyy")}</p>
                      <Badge variant="outline" className="bg-white text-gray-600 border-gray-200">
                        {tasks.filter((task) => isSameMonth(new Date(task.date), date)).length} tasks
                      </Badge>
                    </div>

                    <div className="p-5">
                      {tasks.filter((task) => isSameMonth(new Date(task.date), date)).length > 0 ? (
                        <TaskList 
                          tasks={tasks.filter((task) => isSameMonth(new Date(task.date), date))}
                          onOpenProgress={handleOpenProgress}
                          onUpdateTask={handleUpdateTask}
                          onDeleteTask={handleDeleteTask}
                          canManageTasks={canManageTasks}
                          canUpdateStatus={canUpdateTaskStatus}
                        />
                      ) : (
                        <EmptyTaskState isAdmin={isAdmin} handleAddTask={handleAddTask} date={date} />
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <TaskProgressSheet
        open={isProgressSheetOpen}
        onOpenChange={handleCloseProgressSheet}
        task={activeTask}
        statusUpdates={activeTask ? statusUpdates[activeTask.id] ?? [] : []}
        isLoading={activeTask ? statusUpdatesLoading[activeTask.id] ?? false : false}
        error={activeTask ? statusUpdatesError[activeTask.id] : undefined}
        onRefresh={handleRefreshActiveTaskUpdates}
        onSubmitProgress={handleSubmitProgressUpdate}
        canUpdate={activeTask ? canUpdateTaskStatus(activeTask) : false}
        isAdmin={isAdmin}
      />
    </div>
  );
};

// Empty Task State Component
const EmptyTaskState = ({ 
  isAdmin, 
  handleAddTask, 
  date 
}: { 
  isAdmin: boolean; 
  handleAddTask: (task: Omit<Task, "id" | "status">) => void;
  date: Date;
}) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-5">
      <CalendarDays className="h-10 w-10 text-gray-400" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tasks Scheduled</h3>
    <p className="text-sm text-gray-500 max-w-sm mb-6">
      {isAdmin 
        ? "No tasks are scheduled for this period. Create a new task to get started." 
        : "No tasks have been assigned to you for this period."
      }
    </p>

    {isAdmin && (
      <Dialog>
        <DialogTrigger asChild>
          <Button className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md">
            <Plus className="h-4 w-4" />
            Create Task
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>Fill in the details below to create a new task.</DialogDescription>
          </DialogHeader>
          <AddTaskForm onSubmit={handleAddTask} selectedDate={date} />
        </DialogContent>
      </Dialog>
    )}
  </div>
);

export default ActionCalendar;
