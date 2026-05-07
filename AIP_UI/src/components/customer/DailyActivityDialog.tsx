import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, MapPin, User, Calendar, AlertTriangle, Shield, Users, FileText, Cloud, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import type { DailyActivityReport } from '@/types/dailyActivity';

interface DailyActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: DailyActivityReport | null;
}

export const DailyActivityDialog = ({ open, onOpenChange, report }: DailyActivityDialogProps) => {
  if (!report) return null;

  const formatTime = (time: string) => {
    try {
      // Handle both HH:mm and HH:mm:ss formats
      const timeParts = time.split(':');
      if (timeParts.length >= 2) {
        return `${timeParts[0]}:${timeParts[1]}`;
      }
      return time;
    } catch {
      return time;
    }
  };

  const renderYesNoField = (label: string, value: string, description: string) => (
    <div className="flex items-start justify-between p-3 border rounded-lg">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{label}</span>
          {value === 'yes' ? (
            <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
              <XCircle className="h-3 w-3 mr-1" />
              Yes
            </Badge>
          ) : value === 'no' ? (
            <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
              <CheckCircle className="h-3 w-3 mr-1" />
              No
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">Not Set</Badge>
          )}
        </div>
        {value === 'yes' && description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Daily Activity Report - {format(new Date(report.reportDate), 'MMMM dd, yyyy')}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Report Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Officer</p>
                  <p className="font-medium">{report.officerName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Customer</p>
                  <p className="font-medium">{report.customerName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Site</p>
                  <p className="font-medium">{report.siteName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Report Date</p>
                  <p className="font-medium">{format(new Date(report.reportDate), 'MMM dd, yyyy')}</p>
                </div>
              </CardContent>
            </Card>

            {/* Compliance Section */}
            {report.compliance && (
              <Card className="bg-gray-50/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-yellow-600">
                    <CheckCircle className="h-5 w-5" />
                    Compliance Checks
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {renderYesNoField(
                    "Tills contained over £150 of cash (5 x £10 and 10 x £5)",
                    report.compliance.tillsContainedOverCash.value,
                    report.compliance.tillsContainedOverCash.description
                  )}
                  {renderYesNoField(
                    "Cash Office Door Open",
                    report.compliance.cashOfficeDoorOpen.value,
                    report.compliance.cashOfficeDoorOpen.description
                  )}
                  {renderYesNoField(
                    "Visible Cash On Display",
                    report.compliance.visibleCashOnDisplay.value,
                    report.compliance.visibleCashOnDisplay.description
                  )}
                  {renderYesNoField(
                    "Visible Keys On Display",
                    report.compliance.visibleKeysOnDisplay.value,
                    report.compliance.visibleKeysOnDisplay.description
                  )}
                  {renderYesNoField(
                    "Fire Routes Blocked",
                    report.compliance.fireRoutesBlocked.value,
                    report.compliance.fireRoutesBlocked.description
                  )}
                  {renderYesNoField(
                    "Be Safe Be Secure Poster",
                    report.compliance.beSafeBSecurePoster.value,
                    report.compliance.beSafeBSecurePoster.description
                  )}
                  {renderYesNoField(
                    "ATM Abuse",
                    report.compliance.atmAbuse.value,
                    report.compliance.atmAbuse.description
                  )}
                </CardContent>
              </Card>
            )}

            {/* Insecure Areas Section */}
            {report.insecureAreas && (
              <Card className="bg-yellow-50/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-yellow-600">
                    <Shield className="h-5 w-5" />
                    Insecure Areas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {renderYesNoField(
                    "Kiosk Secure",
                    report.insecureAreas.kioskSecure.value,
                    report.insecureAreas.kioskSecure.description
                  )}
                  {renderYesNoField(
                    "High Value Room",
                    report.insecureAreas.highValueRoom.value,
                    report.insecureAreas.highValueRoom.description
                  )}
                  {renderYesNoField(
                    "Managers Office",
                    report.insecureAreas.managersOffice.value,
                    report.insecureAreas.managersOffice.description
                  )}
                  {renderYesNoField(
                    "Warehouse To Sales Floor",
                    report.insecureAreas.warehouseToSalesFloor.value,
                    report.insecureAreas.warehouseToSalesFloor.description
                  )}
                  {renderYesNoField(
                    "Service Yard",
                    report.insecureAreas.serviceYard.value,
                    report.insecureAreas.serviceYard.description
                  )}
                  {renderYesNoField(
                    "Car Park / Grounds",
                    report.insecureAreas.carParkGrounds.value,
                    report.insecureAreas.carParkGrounds.description
                  )}
                  {renderYesNoField(
                    "Fire Doors (Back of House)",
                    report.insecureAreas.fireDoorsBackOfHouse.value,
                    report.insecureAreas.fireDoorsBackOfHouse.description
                  )}
                  {renderYesNoField(
                    "Fire Doors (Shop Floor)",
                    report.insecureAreas.fireDoorsShopFloor.value,
                    report.insecureAreas.fireDoorsShopFloor.description
                  )}
                </CardContent>
              </Card>
            )}

            {/* Systems Not Working Section */}
            {report.systemsNotWorking && (
              <Card className="bg-red-50/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-5 w-5" />
                    Systems Not Working
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {renderYesNoField(
                    "Watch Me Now",
                    report.systemsNotWorking.watchMeNow.value,
                    report.systemsNotWorking.watchMeNow.description
                  )}
                  {renderYesNoField(
                    "CCTV",
                    report.systemsNotWorking.cctv.value,
                    report.systemsNotWorking.cctv.description
                  )}
                  {renderYesNoField(
                    "Intruder Alarm",
                    report.systemsNotWorking.intruderAlarm.value,
                    report.systemsNotWorking.intruderAlarm.description
                  )}
                  {renderYesNoField(
                    "Keyholding",
                    report.systemsNotWorking.keyholding.value,
                    report.systemsNotWorking.keyholding.description
                  )}
                  {renderYesNoField(
                    "Body Worn CCTV",
                    report.systemsNotWorking.bodyWornCctv.value,
                    report.systemsNotWorking.bodyWornCctv.description
                  )}
                  {renderYesNoField(
                    "Cigarette Tracker",
                    report.systemsNotWorking.cigaretteTracker.value,
                    report.systemsNotWorking.cigaretteTracker.description
                  )}
                  {renderYesNoField(
                    "Crime Reporting",
                    report.systemsNotWorking.crimeReporting.value,
                    report.systemsNotWorking.crimeReporting.description
                  )}
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {report.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Shift Completion Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">{report.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Timestamps */}
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <p>Created: {format(new Date(report.createdAt), 'PPpp')}</p>
                  </div>
                  <div>
                    <p>Updated: {format(new Date(report.updatedAt), 'PPpp')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 