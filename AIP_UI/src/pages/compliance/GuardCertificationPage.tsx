import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, AlertCircle, Shield, Clock, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { addMonths, differenceInMonths, format } from 'date-fns'
import { LicenseForm } from '@/components/compliance/LicenseForm'
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

interface GuardLicense {
  id: string
  officerName: string
  licenseNumber: string
  issueDate: Date
  expiryDate: Date
  licenseType: 'Door Supervision' | 'Security Guarding' | 'CCTV' | 'Close Protection'
  status: 'Active' | 'Expiring Soon' | 'Critical'
}

const sampleData: GuardLicense[] = [
  {
    id: '1',
    officerName: 'John Smith',
    licenseNumber: 'DS/123456789',
    issueDate: new Date('2023-01-15'),
    expiryDate: addMonths(new Date(), 1), // 1 month to expiry
    licenseType: 'Door Supervision',
    status: 'Critical'
  },
  {
    id: '2',
    officerName: 'Sarah Wilson',
    licenseNumber: 'SG/987654321',
    issueDate: new Date('2023-03-20'),
    expiryDate: addMonths(new Date(), 2), // 2 months to expiry
    licenseType: 'Security Guarding',
    status: 'Expiring Soon'
  },
  {
    id: '3',
    officerName: 'Mike Johnson',
    licenseNumber: 'CCTV/456789123',
    issueDate: new Date('2023-06-10'),
    expiryDate: addMonths(new Date(), 4), // 4 months to expiry
    licenseType: 'CCTV',
    status: 'Active'
  }
]

const GuardCertificationPage = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [licenses, setLicenses] = useState<GuardLicense[]>(sampleData)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedLicense, setSelectedLicense] = useState<GuardLicense | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  const getExpiryStatus = (expiryDate: Date) => {
    const monthsToExpiry = differenceInMonths(expiryDate, new Date())
    if (monthsToExpiry <= 1) return 'Critical'
    if (monthsToExpiry <= 2) return 'Expiring Soon'
    return 'Active'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Critical':
        return 'bg-red-100 text-red-800'
      case 'Expiring Soon':
        return 'bg-yellow-100 text-yellow-800'
      case 'Active':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getMonthsRemaining = (expiryDate: Date) => {
    const months = differenceInMonths(expiryDate, new Date())
    return Math.max(0, months)
  }

  const getProgressColor = (months: number) => {
    if (months <= 1) return 'bg-red-500'
    if (months <= 2) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  // Calculate statistics
  const stats = {
    totalOfficers: sampleData.length,
    expiringCritical: sampleData.filter(g => getExpiryStatus(g.expiryDate) === 'Critical').length,
    expiringSoon: sampleData.filter(g => getExpiryStatus(g.expiryDate) === 'Expiring Soon').length,
    active: sampleData.filter(g => getExpiryStatus(g.expiryDate) === 'Active').length
  }

  const handleAddLicense = (data: any) => {
    const newLicense: GuardLicense = {
      id: Date.now().toString(),
      ...data,
      status: getExpiryStatus(data.expiryDate)
    }
    setLicenses([...licenses, newLicense])
    setIsFormOpen(false)
  }

  const handleEditLicense = (data: any) => {
    if (!selectedLicense) return
    
    const updatedLicenses = licenses.map(license => 
      license.id === selectedLicense.id 
        ? { ...license, ...data, status: getExpiryStatus(data.expiryDate) }
        : license
    )
    setLicenses(updatedLicenses)
    setIsFormOpen(false)
    setSelectedLicense(null)
  }

  const handleDeleteLicense = () => {
    if (!selectedLicense) return
    
    const updatedLicenses = licenses.filter(license => license.id !== selectedLicense.id)
    setLicenses(updatedLicenses)
    setIsDeleteDialogOpen(false)
    setSelectedLicense(null)
  }

  const openEditForm = (license: GuardLicense) => {
    setSelectedLicense(license)
    setIsFormOpen(true)
  }

  const openDeleteDialog = (license: GuardLicense) => {
    setSelectedLicense(license)
    setIsDeleteDialogOpen(true)
  }

  // Add pagination calculations
  const totalPages = Math.ceil(licenses.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedData = licenses.slice(startIndex, startIndex + pageSize)

  // Update the table to include edit and delete actions
  const renderLicenseTable = () => (
    <table className="w-full text-sm text-left">
      <thead>
        <tr className="border-b">
          <th className="px-6 py-3">Officer Name</th>
          <th className="px-6 py-3">License Number</th>
          <th className="px-6 py-3">License Type</th>
          <th className="px-6 py-3">Issue Date</th>
          <th className="px-6 py-3">Expiry Date</th>
          <th className="px-6 py-3">Time Remaining</th>
          <th className="px-6 py-3">Status</th>
          <th className="px-6 py-3">Actions</th>
        </tr>
      </thead>
      <tbody>
        {paginatedData.map((guard) => {
          const monthsRemaining = getMonthsRemaining(guard.expiryDate)
          const status = getExpiryStatus(guard.expiryDate)
          
          return (
            <tr key={guard.id} className="border-b hover:bg-gray-50">
              <td className="px-6 py-4 font-medium">{guard.officerName}</td>
              <td className="px-6 py-4">{guard.licenseNumber}</td>
              <td className="px-6 py-4">{guard.licenseType}</td>
              <td className="px-6 py-4">{format(guard.issueDate, 'dd/MM/yyyy')}</td>
              <td className="px-6 py-4">{format(guard.expiryDate, 'dd/MM/yyyy')}</td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <Progress 
                    value={monthsRemaining * 33.33} 
                    className={`h-2 w-24 ${getProgressColor(monthsRemaining)}`}
                  />
                  <span>{monthsRemaining} months</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <Badge className={getStatusColor(status)}>
                  {status}
                </Badge>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditForm(guard)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openDeleteDialog(guard)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Guard Certification Tracker</h1>
            <p className="text-sm text-gray-500 mt-1">Track and manage SIA license validity</p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>Add New License</Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white hover:shadow-md transition-shadow">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Officers</p>
                  <p className="text-2xl font-bold mt-1">{stats.totalOfficers}</p>
                  <p className="text-sm text-gray-500 mt-1">Licensed officers</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white hover:shadow-md transition-shadow">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Critical Expiry</p>
                  <p className="text-2xl font-bold mt-1">{stats.expiringCritical}</p>
                  <p className="text-sm text-gray-500 mt-1">Expires within 1 month</p>
                </div>
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white hover:shadow-md transition-shadow">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Expiring Soon</p>
                  <p className="text-2xl font-bold mt-1">{stats.expiringSoon}</p>
                  <p className="text-sm text-gray-500 mt-1">Expires within 2 months</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white hover:shadow-md transition-shadow">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Active Licenses</p>
                  <p className="text-2xl font-bold mt-1">{stats.active}</p>
                  <p className="text-sm text-gray-500 mt-1">Valid for 3+ months</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-none shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search officers..."
                    className="pl-8 h-10 w-[300px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="expiring">Expiring Soon</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="License type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ds">Door Supervision</SelectItem>
                    <SelectItem value="sg">Security Guarding</SelectItem>
                    <SelectItem value="cctv">CCTV</SelectItem>
                    <SelectItem value="cp">Close Protection</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* License Table */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative overflow-x-auto">
              {renderLicenseTable()}
            </div>

            {/* Add Pagination Controls */}
            <div className="border-t border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {startIndex + 1} to {Math.min(startIndex + pageSize, licenses.length)} of {licenses.length} entries
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 ${currentPage === page ? 'bg-blue-600 text-white' : ''}`}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add the form and delete dialog */}
      <LicenseForm
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setSelectedLicense(null)
        }}
        onSubmit={selectedLicense ? handleEditLicense : handleAddLicense}
        initialData={selectedLicense || undefined}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the license record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLicense}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default GuardCertificationPage
