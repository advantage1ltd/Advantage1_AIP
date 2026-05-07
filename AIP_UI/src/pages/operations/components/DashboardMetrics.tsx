import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ClipboardList, FileSpreadsheet, BarChart3, Users, Building, MapPin } from 'lucide-react';
import { CustomerSurvey } from '@/types/customerSatisfaction';

interface DashboardMetricsProps {
  surveys: CustomerSurvey[];
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ surveys }) => {
  // Calculate metrics
  const totalSurveys = surveys.length;
  
  const averageRating = useMemo(() => {
    if (totalSurveys === 0) return 0;
    const sum = surveys.reduce((acc, survey) => {
      const ratings = Object.values(survey.ratings);
      const avgSurveyRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
      return acc + avgSurveyRating;
    }, 0);
    return Math.round((sum / totalSurveys) * 10) / 10; // Round to 1 decimal
  }, [surveys, totalSurveys]);

  const uniqueCustomers = useMemo(() => {
    return new Set(surveys.map(s => s.customer)).size;
  }, [surveys]);

  const uniqueLocations = useMemo(() => {
    return new Set(surveys.map(s => s.siteName)).size;
  }, [surveys]);

  const metrics = [
    {
      title: "Total Surveys",
      value: totalSurveys,
      icon: ClipboardList,
      color: "text-blue-600"
    },
    {
      title: "Unique Officers",
      value: new Set(surveys.map(s => s.officerName)).size,
      icon: Users,
      color: "text-green-600"
    },
    {
      title: "Unique Customers",
      value: uniqueCustomers,
      icon: FileSpreadsheet,
      color: "text-purple-600"
    },
    {
      title: "Average Rating",
      value: `${averageRating.toFixed(1)}/10`,
      icon: BarChart3,
      color: "text-orange-600"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
      <Card className="bg-blue-600 text-white shadow-sm">
        <CardHeader className="p-2 md:p-4 pb-0">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 md:h-5 md:w-5 text-white/90" />
            <CardTitle className="text-sm md:text-base text-white">Total Surveys</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-2 md:p-4 pt-1 md:pt-2">
          <p className="text-2xl md:text-3xl font-bold text-white">{totalSurveys}</p>
          <p className="text-xs md:text-sm text-white/70">Overall submission count</p>
        </CardContent>
      </Card>

      <Card className="bg-emerald-600 text-white shadow-sm">
        <CardHeader className="p-2 md:p-4 pb-0">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 md:h-5 md:w-5 text-white/90" />
            <CardTitle className="text-sm md:text-base text-white">Avg. Rating</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-2 md:p-4 pt-1 md:pt-2">
          <p className="text-2xl md:text-3xl font-bold text-white">{averageRating}/10</p>
          <p className="text-xs md:text-sm text-white/70">Customer satisfaction score</p>
        </CardContent>
      </Card>

      <Card className="bg-purple-600 text-white shadow-sm">
        <CardHeader className="p-2 md:p-4 pb-0">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 md:h-5 md:w-5 text-white/90" />
            <CardTitle className="text-sm md:text-base text-white">Customers</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-2 md:p-4 pt-1 md:pt-2">
          <p className="text-2xl md:text-3xl font-bold text-white">{uniqueCustomers}</p>
          <p className="text-xs md:text-sm text-white/70">Unique clients surveyed</p>
        </CardContent>
      </Card>

      <Card className="bg-rose-600 text-white shadow-sm">
        <CardHeader className="p-2 md:p-4 pb-0">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 md:h-5 md:w-5 text-white/90" />
            <CardTitle className="text-sm md:text-base text-white">Locations</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-2 md:p-4 pt-1 md:pt-2">
          <p className="text-2xl md:text-3xl font-bold text-white">{uniqueLocations}</p>
          <p className="text-xs md:text-sm text-white/70">Unique sites covered</p>
        </CardContent>
      </Card>
    </div>
  );
}; 