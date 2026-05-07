import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Shield, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  Radio, 
  Users, 
  Lock,
  History,
  KeyRound,
  Calendar,
  User,
  Loader2
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from 'react-toastify';
import { safeDuressWordsService } from '@/services/safeDuressWordsService';
import { CodeWord, WordHistory, WordHistoryFilters } from '@/types/safeDuressWords';
import { useAuth } from '@/contexts/AuthContext';

// Reusable components
const PageHeader = ({ onShowHistory, onShowUpdateDialog, isAdmin }) => (
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="bg-blue-100 p-1.5 sm:p-2 rounded-lg">
        <Shield className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600" />
      </div>
      <div>
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Safe and Duress Words</h1>
        <p className="text-xs sm:text-sm text-gray-500">Secure communication protocols for security personnel</p>
      </div>
    </div>
    <div className="flex flex-wrap gap-2 w-full sm:w-auto mt-2 sm:mt-0">
      <Button
        variant="outline"
        className="text-xs sm:text-sm h-8 sm:h-9 flex items-center gap-1.5 flex-1 sm:flex-initial justify-center"
        onClick={onShowHistory}
      >
        <History className="w-3.5 h-3.5" />
        <span>View History</span>
      </Button>
      {isAdmin ? (
        <Button
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm h-8 sm:h-9 flex items-center gap-1.5 flex-1 sm:flex-initial justify-center"
          onClick={onShowUpdateDialog}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Update Words</span>
        </Button>
      ) : (
        <Button
          variant="secondary"
          className="text-xs sm:text-sm h-8 sm:h-9 flex items-center gap-1.5 flex-1 sm:flex-initial justify-center cursor-not-allowed opacity-70"
          disabled
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Admin Only</span>
        </Button>
      )}
    </div>
  </div>
);

const ImportantNotice = () => (
  <Alert className="mb-4 md:mb-6 border-red-200 bg-red-50">
    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
    <AlertTitle className="text-sm sm:text-base text-red-600 font-semibold">Confidential Information</AlertTitle>
    <AlertDescription className="text-xs sm:text-sm text-red-700">
      This information is strictly confidential and should only be shared with authorized security personnel.
      Memorize these words and never write them down or store them digitally outside secure systems.
    </AlertDescription>
  </Alert>
);

const CodeWordCard = ({ type, word, updatedAt, updatedBy }) => {
  const isafe = type === 'safe';
  const bgColor = isafe ? 'from-green-50 to-green-100 border-green-200' : 'from-red-50 to-red-100 border-red-200';
  const textColor = isafe ? 'text-green-800' : 'text-red-800';
  const iconColor = isafe ? 'text-green-600' : 'text-red-600';
  const borderColor = isafe ? 'border-green-200' : 'border-red-200';
  const descColor = isafe ? 'text-green-700' : 'text-red-700';
  
  return (
    <Card className={`bg-gradient-to-br ${bgColor}`}>
      <CardHeader className="p-3 sm:p-4">
        <CardTitle className={`flex items-center gap-2 ${textColor} text-sm sm:text-base`}>
          {isafe ? (
            <CheckCircle className={`h-4 w-4 sm:h-5 sm:w-5 ${iconColor}`} />
          ) : (
            <AlertTriangle className={`h-4 w-4 sm:h-5 sm:w-5 ${iconColor}`} />
          )}
          {isafe ? 'Safe Word' : 'Duress Word'}
        </CardTitle>
        <CardDescription className={`${descColor} text-xs sm:text-sm`}>
          {isafe ? 'Use to indicate all clear/no threat' : 'Use to indicate danger/threat present'}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-4">
        <div className={`bg-white rounded-lg p-3 sm:p-4 border ${borderColor}`}>
          <span className={`text-xl sm:text-2xl font-bold ${descColor}`}>{word}</span>
        </div>
      </CardContent>
      <CardFooter className={`p-3 sm:p-4 text-xs sm:text-sm ${descColor}`}>
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          Last updated: {updatedAt} by {updatedBy}
        </div>
      </CardFooter>
    </Card>
  );
};

const GuidelineItem = ({ icon, title, items }) => (
  <div className="space-y-2 sm:space-y-3">
    <h3 className="font-semibold text-gray-900 flex items-center gap-1.5 text-sm sm:text-base">
      {icon}
      {title}
    </h3>
    <ul className="space-y-2 text-xs sm:text-sm text-gray-600">
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-2">
          <span className="rounded-full h-1.5 w-1.5 bg-blue-600 mt-1.5 flex-shrink-0" />
          {item}
        </li>
      ))}
    </ul>
  </div>
);

const HistoryDialog = ({ isOpen, onClose, history }) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden w-[calc(100%-16px)] p-0">
      <DialogHeader className="space-y-3 p-3 sm:p-4 md:p-6 pb-3 border-b">
        <div className="flex items-center gap-2">
          <div className="bg-blue-100 p-1.5 sm:p-2 rounded-lg">
            <History className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <DialogTitle className="text-base sm:text-lg md:text-xl">Code Word Change History</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-gray-500">
              Comprehensive record of all security word modifications
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>
      <div className="p-3 sm:p-4 md:p-6 overflow-y-auto max-h-[calc(90vh-130px)]">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <StatsCard 
            title="Total Changes" 
            value={history.length} 
            icon={<History className="h-3.5 w-3.5 text-gray-400" />} 
            bgColor="bg-gray-50" 
          />
          <StatsCard 
            title="Safe Word Changes" 
            value={history.filter(h => h.type === 'safe').length} 
            icon={<CheckCircle className="h-3.5 w-3.5 text-green-500" />} 
            bgColor="bg-green-50" 
            titleColor="text-green-600"
            valueColor="text-green-700"
          />
          <StatsCard 
            title="Duress Word Changes" 
            value={history.filter(h => h.type === 'duress').length} 
            icon={<AlertTriangle className="h-3.5 w-3.5 text-red-500" />} 
            bgColor="bg-red-50" 
            titleColor="text-red-600"
            valueColor="text-red-700"
          />
        </div>

        <div className="rounded-lg border bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-medium text-xs sm:text-sm p-2 sm:p-3 whitespace-nowrap">Date & Time</TableHead>
                  <TableHead className="font-medium text-xs sm:text-sm p-2 sm:p-3 whitespace-nowrap">Type</TableHead>
                  <TableHead className="font-medium text-xs sm:text-sm p-2 sm:p-3">Word Change</TableHead>
                  <TableHead className="font-medium text-xs sm:text-sm p-2 sm:p-3">Changed By</TableHead>
                  <TableHead className="font-medium text-xs sm:text-sm p-2 sm:p-3">Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length > 0 ? (
                  history.map((item) => (
                    <HistoryRow key={item.id} item={item} />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <History className="h-8 w-8 text-gray-400" />
                        <p className="text-gray-500 text-xs sm:text-sm">No change history available</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

const StatsCard = ({ title, value, icon, bgColor, titleColor = "text-gray-500", valueColor = "text-gray-900" }) => (
  <Card className={bgColor}>
    <CardHeader className="py-2 px-3 sm:py-3 sm:px-4">
      <div className="flex items-center justify-between">
        <CardTitle className={`text-xs sm:text-sm font-medium ${titleColor}`}>{title}</CardTitle>
        {icon}
      </div>
    </CardHeader>
    <CardContent className="py-1 px-3 sm:py-2 sm:px-4">
      <div className={`text-xl sm:text-2xl font-bold ${valueColor}`}>{value}</div>
    </CardContent>
  </Card>
);

const HistoryRow = ({ item }) => {
  const isafe = item.type === 'safe';
  const badgeStyles = isafe 
    ? 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200' 
    : 'bg-red-100 text-red-700 hover:bg-red-100 border-red-200';
  
  return (
    <TableRow className="hover:bg-gray-50 transition-colors">
      <TableCell className="whitespace-nowrap font-medium text-xs sm:text-sm p-2 sm:p-3">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-gray-400" />
          {item.changedAt}
        </div>
      </TableCell>
      <TableCell className="text-xs sm:text-sm p-2 sm:p-3">
        <Badge 
          className={cn(
            "px-1.5 py-0.5 text-xs font-medium",
            badgeStyles
          )}
        >
          {isafe ? 'Safe Word' : 'Duress Word'}
        </Badge>
      </TableCell>
      <TableCell className="text-xs sm:text-sm p-2 sm:p-3">
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500">{item.oldWord}</span>
          <svg className="h-3.5 w-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
          <span className="font-medium text-gray-900">{item.newWord}</span>
        </div>
      </TableCell>
      <TableCell className="text-xs sm:text-sm p-2 sm:p-3">
        <div className="flex items-center gap-1.5">
          <div className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center">
            <User className="h-3 w-3 text-gray-600" />
          </div>
          <span className="text-gray-900">{item.changedBy}</span>
        </div>
      </TableCell>
      <TableCell className="text-xs sm:text-sm p-2 sm:p-3">
        <div className="flex items-start gap-1.5">
          <Info className="h-3.5 w-3.5 text-gray-400 mt-0.5" />
          <span className="text-gray-600 line-clamp-2">{item.reason}</span>
        </div>
      </TableCell>
    </TableRow>
  );
};

const UpdateDialog = ({ isOpen, onClose, updateType, setUpdateType, newWord, setNewWord, reason, setReason, authorizedCode, setAuthorizedCode, onUpdate }) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="sm:max-w-[425px] w-[calc(100%-16px)] p-3 sm:p-4 md:p-6">
      <DialogHeader>
        <DialogTitle className="text-base sm:text-lg">Update Code Word</DialogTitle>
        <DialogDescription className="text-xs sm:text-sm">
          Enter the new code word and provide authorization. This action will be logged.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-3 py-3">
        <div className="grid gap-1.5">
          <Label className="text-xs sm:text-sm">Select Type</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={updateType === 'safe' ? 'default' : 'outline'}
              className={`text-xs sm:text-sm h-9 flex-1 ${updateType === 'safe' ? 'bg-green-600 hover:bg-green-700' : ''}`}
              onClick={() => setUpdateType('safe')}
            >
              Safe Word
            </Button>
            <Button
              type="button"
              variant={updateType === 'duress' ? 'default' : 'outline'}
              className={`text-xs sm:text-sm h-9 flex-1 ${updateType === 'duress' ? 'bg-red-600 hover:bg-red-700' : ''}`}
              onClick={() => setUpdateType('duress')}
            >
              Duress Word
            </Button>
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs sm:text-sm">New Word</Label>
          <Input
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            placeholder="Enter new code word"
            className="h-9 text-xs sm:text-sm"
          />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs sm:text-sm">Reason for Change</Label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason for change"
            className="h-9 text-xs sm:text-sm"
          />
        </div>
        <div className="grid gap-1.5">
          <Label className="text-xs sm:text-sm">Authorization Code</Label>
          <Input
            type="password"
            value={authorizedCode}
            onChange={(e) => setAuthorizedCode(e.target.value)}
            placeholder="Enter authorization code"
            className="h-9 text-xs sm:text-sm"
          />
        </div>
      </div>
      <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 pt-2">
        <Button 
          variant="outline" 
          onClick={onClose}
          className="w-full sm:w-auto h-9 text-xs sm:text-sm"
        >
          Cancel
        </Button>
        <Button 
          onClick={onUpdate}
          className="w-full sm:w-auto h-9 text-xs sm:text-sm bg-blue-600 hover:bg-blue-700"
          disabled={!updateType || !newWord || !reason || !authorizedCode}
        >
          Update Word
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

const UsageExampleTable = () => (
  <div className="overflow-x-auto">
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-xs sm:text-sm p-2 sm:p-3 w-1/4">Scenario</TableHead>
          <TableHead className="text-xs sm:text-sm p-2 sm:p-3 w-2/4">Example Usage</TableHead>
          <TableHead className="text-xs sm:text-sm p-2 sm:p-3 w-1/4">Type</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell className="font-medium text-xs sm:text-sm p-2 sm:p-3">Regular Check</TableCell>
          <TableCell className="text-xs sm:text-sm p-2 sm:p-3">"Just saw a cat near the loading bay, all quiet here."</TableCell>
          <TableCell className="text-xs sm:text-sm p-2 sm:p-3">
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">Safe Word</Badge>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium text-xs sm:text-sm p-2 sm:p-3">Suspicious Activity</TableCell>
          <TableCell className="text-xs sm:text-sm p-2 sm:p-3">"There's a dog barking outside, can you check CCTV?"</TableCell>
          <TableCell className="text-xs sm:text-sm p-2 sm:p-3">
            <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs">Duress Word</Badge>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium text-xs sm:text-sm p-2 sm:p-3">End of Shift</TableCell>
          <TableCell className="text-xs sm:text-sm p-2 sm:p-3">"Just like my cat at home, everything's peaceful here."</TableCell>
          <TableCell className="text-xs sm:text-sm p-2 sm:p-3">
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs">Safe Word</Badge>
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell className="font-medium text-xs sm:text-sm p-2 sm:p-3">Potential Threat</TableCell>
          <TableCell className="text-xs sm:text-sm p-2 sm:p-3">"That dog from yesterday is back, might need backup."</TableCell>
          <TableCell className="text-xs sm:text-sm p-2 sm:p-3">
            <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-xs">Duress Word</Badge>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
);

const SafeDuressWordsPage: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase() ?? '';
  const isAdmin = role === 'administrator';
  // State management
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [updateType, setUpdateType] = useState<'safe' | 'duress' | null>(null);
  const [newWord, setNewWord] = useState('');
  const [reason, setReason] = useState('');
  const [authorizedCode, setAuthorizedCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Data state
  const fallbackWords = React.useMemo(() => ({
    safe: {
      id: 'safe-fallback',
      word: 'Harbor',
      type: 'safe' as const,
      updatedAt: new Date().toISOString(),
      updatedBy: 'System'
    },
    duress: {
      id: 'duress-fallback',
      word: 'Falcon Red',
      type: 'duress' as const,
      updatedAt: new Date().toISOString(),
      updatedBy: 'System'
    }
  }), []);
  const fallbackHistory = React.useMemo<WordHistory[]>(() => [
    {
      id: 'history-1',
      type: 'safe',
      oldWord: 'Horizon',
      newWord: 'Harbor',
      changedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      changedBy: 'System',
      reason: 'Placeholder data while live service is unavailable'
    },
    {
      id: 'history-2',
      type: 'duress',
      oldWord: 'Nightfall',
      newWord: 'Falcon Red',
      changedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      changedBy: 'System',
      reason: 'Placeholder data while live service is unavailable'
    }
  ], []);

  const [currentWords, setCurrentWords] = useState<{
    safe: CodeWord;
    duress: CodeWord;
  } | null>(null);
  
  const [wordHistory, setWordHistory] = useState<WordHistory[]>([]);
  const [historyPagination, setHistoryPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0
  });
  const [historyFilters, setHistoryFilters] = useState<WordHistoryFilters>({});

  useEffect(() => {
    if (!isAdmin && showUpdateDialog) {
      setShowUpdateDialog(false);
    }
  }, [isAdmin, showUpdateDialog]);

  // Fetch current words
  const fetchCurrentWords = async () => {
    try {
      setIsLoading(true);
      const response = await safeDuressWordsService.getCurrentWords();
      setCurrentWords(response.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load current words';
      console.warn('⚠️ [SafeDuressWords] Failed to fetch current words:', message);
      setCurrentWords(fallbackWords);
      toast.error('Failed to load current words. Showing placeholder data.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch word history
  const fetchWordHistory = async () => {
    try {
      setIsHistoryLoading(true);
      const response = await safeDuressWordsService.getWordHistory(
        historyPagination.page,
        historyPagination.pageSize,
        historyFilters
      );
      setWordHistory(response.data);
      setHistoryPagination(prev => ({
        ...prev,
        total: response.pagination.total
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load word history';
      console.warn('⚠️ [SafeDuressWords] Failed to fetch word history:', message);
      setWordHistory(fallbackHistory);
      setHistoryPagination(prev => ({
        ...prev,
        total: fallbackHistory.length
      }));
      toast.error('Failed to load word history. Showing placeholder data.');
    } finally {
      setIsHistoryLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchCurrentWords();
  }, []);

  // Load history when dialog is opened or filters/pagination change
  useEffect(() => {
    if (showHistory) {
      fetchWordHistory();
    }
  }, [showHistory, historyPagination.page, historyPagination.pageSize, historyFilters]);

  const handleUpdateWord = async () => {
    if (!isAdmin) {
      toast.error('Only administrators can update code words.');
      return;
    }

    if (!updateType || !newWord || !reason || !authorizedCode) return;
    
    try {
      setIsUpdating(true);
      await safeDuressWordsService.updateCodeWord({
        type: updateType,
        word: newWord,
        reason,
        authorizedCode
      });

      toast.success(`${updateType === 'safe' ? 'Safe' : 'Duress'} word updated successfully`);
      
      // Refresh data
      await fetchCurrentWords();
      if (showHistory) {
        await fetchWordHistory();
      }

      // Reset form
      setNewWord('');
      setReason('');
      setAuthorizedCode('');
      setShowUpdateDialog(false);
    } catch (error: any) {
      console.error('Failed to update word:', error);
      toast.error(error.response?.data?.error || 'Failed to update word. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Communication protocol guidelines
  const communicationProtocolItems = [
    'Use these words naturally in conversation',
    'Incorporate into regular radio checks',
    'Maintain normal tone of voice'
  ];
  
  // Team response guidelines
  const teamResponseItems = [
    'Acknowledge receipt without repeating the word',
    'Follow established response procedures',
    'Maintain situational awareness'
  ];

  if (isLoading || !currentWords) {
    return (
      <div className="min-h-screen bg-[#EFF4FF] flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EFF4FF]">
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6 max-w-[1280px]">
        {/* Header Section */}
        <PageHeader 
          onShowHistory={() => setShowHistory(true)} 
          onShowUpdateDialog={() => {
            if (!isAdmin) {
              toast.error('Only administrators can update code words.');
              return;
            }
            setShowUpdateDialog(true);
          }} 
          isAdmin={isAdmin}
        />

        {/* Important Notice */}
        <ImportantNotice />

        {/* Current Words Cards */}
        <div className="grid gap-3 sm:gap-4 lg:gap-6 grid-cols-1 sm:grid-cols-2 mb-4 md:mb-6">
          <CodeWordCard 
            type="safe" 
            word={currentWords.safe.word}
            updatedAt={currentWords.safe.updatedAt}
            updatedBy={currentWords.safe.updatedBy}
          />
          <CodeWordCard 
            type="duress" 
            word={currentWords.duress.word}
            updatedAt={currentWords.duress.updatedAt}
            updatedBy={currentWords.duress.updatedBy}
          />
        </div>

        {/* Guidelines Section */}
        <Card className="mb-4 md:mb-6">
          <CardHeader className="p-3 sm:p-4">
            <CardTitle className="flex items-center gap-1.5 text-sm sm:text-base">
              <Info className="h-4 w-4 text-blue-600" />
              Usage Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <GuidelineItem 
                icon={<Radio className="h-3.5 w-3.5 text-blue-600" />}
                title="Communication Protocols"
                items={communicationProtocolItems}
              />
              <GuidelineItem 
                icon={<Users className="h-3.5 w-3.5 text-blue-600" />}
                title="Team Response"
                items={teamResponseItems}
              />
            </div>
          </CardContent>
        </Card>

        {/* Usage Examples */}
        <Card>
          <CardHeader className="p-3 sm:p-4">
            <CardTitle className="flex items-center gap-1.5 text-sm sm:text-base">
              <Lock className="h-4 w-4 text-blue-600" />
              Secure Communication Examples
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Examples of how to naturally incorporate code words into conversation
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <UsageExampleTable />
          </CardContent>
        </Card>

        {/* Update Dialog */}
        {isAdmin && (
          <UpdateDialog 
            isOpen={showUpdateDialog}
            onClose={() => setShowUpdateDialog(false)}
            updateType={updateType}
            setUpdateType={setUpdateType}
            newWord={newWord}
            setNewWord={setNewWord}
            reason={reason}
            setReason={setReason}
            authorizedCode={authorizedCode}
            setAuthorizedCode={setAuthorizedCode}
            onUpdate={handleUpdateWord}
          />
        )}

        {/* History Dialog */}
        <HistoryDialog 
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          history={wordHistory}
        />
      </div>
    </div>
  );
};

export default SafeDuressWordsPage;
