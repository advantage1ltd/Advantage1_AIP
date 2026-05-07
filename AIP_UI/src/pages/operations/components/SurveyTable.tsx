import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  PlusCircle, 
  Eye, 
  Calendar, 
  MapPin, 
  Search,
  Edit,
  Trash2,
  Filter,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { CustomerSurvey, CustomerSurveyFilters } from '@/types/customerSatisfaction';
import type { Region, Site } from '@/types/dashboard';

// Customer data for admin filtering
const CUSTOMERS = [
  { id: '21', name: 'Central England COOP' },
  { id: '22', name: 'Heart of England' },
  { id: '23', name: 'Midcounties COOP' }
];
import { format } from 'date-fns';

interface SurveyTableProps {
  surveys: CustomerSurvey[];
  pagination: {
    currentPage: number;
    pageSize: number;
    total: number;
  };
  filters: CustomerSurveyFilters;
  regions: Region[];
  sites: Site[];
  onNewSurvey?: () => void;
  onEditSurvey?: (survey: CustomerSurvey) => void;
  onViewSurvey: (survey: CustomerSurvey) => void;
  onDeleteSurvey?: (id: string) => void;
  onPageChange: (page: number) => void;
  onFiltersChange: (filters: CustomerSurveyFilters) => void;
  isLoading: boolean;
  isCustomerView?: boolean;
  isAdmin?: boolean;
}

export const SurveyTable: React.FC<SurveyTableProps> = ({
  surveys,
  pagination,
  filters,
  regions,
  sites,
  onNewSurvey,
  onEditSurvey,
  onViewSurvey,
  onDeleteSurvey,
  onPageChange,
  onFiltersChange,
  isLoading,
  isCustomerView = false,
  isAdmin = false
}) => {
  // Calculate average rating for a survey
  const getAverageRating = (survey: CustomerSurvey) => {
    const ratings = Object.values(survey.ratings);
    return ratings.reduce((a, b) => a + b, 0) / ratings.length;
  };

  return (
    <div>
      {/* Table Controls */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 p-4 border-b">
        <div className="flex flex-1 gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search surveys..."
              value={filters.search}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              className="pl-9"
              disabled={isLoading}
            />
          </div>
          {isAdmin && (
            <Select
              value={filters.customerId || 'all'}
              onValueChange={(value) => onFiltersChange({ 
                ...filters, 
                customerId: value === 'all' ? '' : value,
                regionId: '', // Clear region when customer changes
                siteId: '' // Clear site when customer changes
              })}
              disabled={isLoading}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                {CUSTOMERS.map(customer => (
                  <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select
            value={filters.regionId || 'all'}
            onValueChange={(value) => onFiltersChange({ ...filters, regionId: value === 'all' ? '' : value, siteId: '' })}
            disabled={isLoading}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              {regions
                .filter(region => !isAdmin || !filters.customerId || region.customerId === parseInt(filters.customerId, 10))
                .map(region => (
                  <SelectItem key={region.id} value={region.id}>{region.name}</SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Select
            value={filters.siteId || 'all'}
            onValueChange={(value) => onFiltersChange({ ...filters, siteId: value === 'all' ? '' : value })}
            disabled={isLoading}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by site" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sites</SelectItem>
              {sites
                .filter(site => {
                  // Filter by customer if admin and customer is selected
                  const customerMatch = !isAdmin || !filters.customerId || site.customerId === parseInt(filters.customerId, 10);
                  // Filter by region if region is selected
                  const regionMatch = !filters.regionId || site.regionId === filters.regionId;
                  return customerMatch && regionMatch;
                })
                .map(site => (
                  <SelectItem key={site.id} value={site.id}>{site.locationName}</SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        {!isCustomerView && (
          <Button onClick={onNewSurvey} disabled={isLoading}>
            <PlusCircle className="mr-2 h-4 w-4" /> New Survey
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="relative">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer Name</TableHead>
              <TableHead>Site Name</TableHead>
              <TableHead>Officer Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Average Rating</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading surveys...
                </TableCell>
              </TableRow>
            ) : surveys.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No surveys found matching your search.
                </TableCell>
              </TableRow>
            ) : (
              surveys.map((survey) => (
                <TableRow key={survey.id}>
                  <TableCell>{survey.customer}</TableCell>
                  <TableCell>{survey.siteName}</TableCell>
                  <TableCell>{survey.officerName}</TableCell>
                  <TableCell>{format(new Date(survey.date), 'PP')}</TableCell>
                  <TableCell>{getAverageRating(survey).toFixed(1)}/10</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onViewSurvey(survey)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {!isCustomerView && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => onEditSurvey?.(survey)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive"
                            onClick={() => onDeleteSurvey?.(survey.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-4 border-t">
          <div className="text-sm text-gray-500">
            Page {pagination.currentPage} of {Math.ceil(pagination.total / pagination.pageSize)}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.currentPage + 1)}
              disabled={
                pagination.currentPage >= Math.ceil(pagination.total / pagination.pageSize) ||
                isLoading
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}; 