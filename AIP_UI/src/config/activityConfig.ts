import { Briefcase, GraduationCap, Calendar, AlertTriangle, FileText, Target, Shield, Award } from 'lucide-react';
import type { ActivityCategory, ActivitySource } from '@/types/employee';

export const ACTIVITY_CATEGORIES = [
  { id: 'employment' as ActivityCategory, label: 'Employment', icon: Briefcase },
  { id: 'training' as ActivityCategory, label: 'Training', icon: GraduationCap },
  { id: 'leave' as ActivityCategory, label: 'Leave', icon: Calendar },
  { id: 'incidents' as ActivityCategory, label: 'Incidents', icon: AlertTriangle },
  { id: 'documents' as ActivityCategory, label: 'Documents', icon: FileText },
  { id: 'performance' as ActivityCategory, label: 'Performance', icon: Target },
  { id: 'equipment' as ActivityCategory, label: 'Equipment', icon: Shield },
  { id: 'certifications' as ActivityCategory, label: 'Certifications', icon: Award },
] as const;

export const ACTIVITY_SOURCES = {
  manual: {
    label: 'Manual Entry',
    description: 'Manually entered activities',
    syncInterval: 0,
  },
  hr_system: {
    label: 'HR System',
    description: 'Activities from the HR management system',
    syncInterval: 15 * 60 * 1000, // 15 minutes
  },
  training_system: {
    label: 'Training System',
    description: 'Training and development activities',
    syncInterval: 30 * 60 * 1000, // 30 minutes
  },
  leave_system: {
    label: 'Leave System',
    description: 'Leave and absence records',
    syncInterval: 15 * 60 * 1000, // 15 minutes
  },
  performance_system: {
    label: 'Performance System',
    description: 'Performance reviews and assessments',
    syncInterval: 60 * 60 * 1000, // 1 hour
  },
  document_system: {
    label: 'Document System',
    description: 'Document management system records',
    syncInterval: 30 * 60 * 1000, // 30 minutes
  },
  equipment_system: {
    label: 'Equipment System',
    description: 'Equipment and asset management records',
    syncInterval: 60 * 60 * 1000, // 1 hour
  },
  certification_system: {
    label: 'Certification System',
    description: 'Professional certifications and licenses',
    syncInterval: 60 * 60 * 1000, // 1 hour
  },
} as const;

export const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  on_hold: 'bg-gray-100 text-gray-800',
} as const;

export const CATEGORY_COLORS = {
  employment: 'bg-blue-100 text-blue-800',
  training: 'bg-green-100 text-green-800',
  leave: 'bg-purple-100 text-purple-800',
  incidents: 'bg-red-100 text-red-800',
  documents: 'bg-gray-100 text-gray-800',
  performance: 'bg-yellow-100 text-yellow-800',
  equipment: 'bg-indigo-100 text-indigo-800',
  certifications: 'bg-pink-100 text-pink-800',
} as const;

export const AUTO_SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
export const ITEMS_PER_PAGE = 10; 