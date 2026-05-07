import { useState } from "react"
import { 
  Plus, 
  Filter, 
  Download, 
  RefreshCw, 
  Mail, 
  Phone, 
  Edit, 
  Trash, 
  Search,
  Users,
  Building,
  Tag
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { ContactForm } from "@/components/contacts/ContactForm"
import { Contact } from "@/types/contacts"
import { toast } from "@/components/ui/use-toast"
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/store/store'
import { addContact, updateContact, deleteContact } from '@/store/features/contactsSlice'
import { v4 as uuidv4 } from 'uuid'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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

export default function Contacts() {
  const dispatch = useDispatch()
  const contacts = useSelector((state: RootState) => state.contacts.contacts)
  const [searchQuery, setSearchQuery] = useState("")
  const [editingContact, setEditingContact] = useState<Contact | null>(null)
  const [isAddContactOpen, setIsAddContactOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null)

  const handleAddContact = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const newContact: Contact = {
      id: uuidv4(),
      name: formData.get("name") as string,
      company: formData.get("company") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      notes: formData.get("notes") as string,
      industry: formData.get("industry") as string,
      region: formData.get("region") as string,
      services: JSON.parse(formData.get("services") as string) || [],
      createDate: new Date().toISOString()
    }

    dispatch(addContact(newContact))
    setIsAddContactOpen(false)
    toast({
      title: "Contact Added",
      description: "New contact has been successfully added.",
    })
  }

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact)
  }

  const handleUpdateContact = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const updatedContact: Contact = {
      ...editingContact!,
      name: formData.get("name") as string,
      company: formData.get("company") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      notes: formData.get("notes") as string,
      industry: formData.get("industry") as string,
      region: formData.get("region") as string,
      services: JSON.parse(formData.get("services") as string) || []
    }

    dispatch(updateContact(updatedContact))
    setEditingContact(null)
    toast({
      title: "Contact Updated",
      description: "Contact has been successfully updated.",
    })
  }

  const handleDeleteContact = (contactId: string) => {
    dispatch(deleteContact(contactId))
    setContactToDelete(null)
    toast({
      title: "Contact Deleted",
      description: "Contact has been successfully deleted.",
    })
  }

  const handleAddFollowup = (contact: Contact) => {
    // Implement follow-up functionality
    toast({
      title: "Follow-up Added",
      description: `Follow-up scheduled for ${contact.name}.`,
    })
  }

  const filteredContacts = contacts.filter(contact => {
    // First filter by search query
    const matchesSearch = 
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Then filter by active tab
    if (activeTab === "all") return matchesSearch;
    return matchesSearch && contact.industry.toLowerCase() === activeTab.toLowerCase();
  });

  // Get unique industries for tabs
  const industries = [...new Set(contacts.map(contact => contact.industry.toLowerCase()))].filter(Boolean);

  // Add a function to handle exporting contacts to CSV
  const handleExportContacts = () => {
    // Create CSV header row
    const headers = ['Name', 'Company', 'Email', 'Phone', 'Industry', 'Region', 'Services', 'Notes'];
    
    // Convert contacts to CSV rows
    const contactRows = filteredContacts.map(contact => [
      contact.name,
      contact.company,
      contact.email,
      contact.phone,
      contact.industry,
      contact.region,
      contact.services.join(', '),
      contact.notes
    ]);
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...contactRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    // Create a Blob with the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create a download link and trigger the download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `contacts_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Successful",
      description: `${filteredContacts.length} contacts exported to CSV.`,
    });
  };

  // Summary stats
  const totalContacts = filteredContacts.length;
  const uniqueCompanies = new Set(filteredContacts.map(c => c.company)).size;
  const uniqueIndustries = new Set(filteredContacts.map(c => c.industry).filter(Boolean)).size;

  return (
    <div className="min-h-screen bg-[#EFF4FF]">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">
        {/* Header with action buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-border/40">
          <div className="space-y-1 w-full sm:w-auto">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-primary">Contact Management</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage your contacts and follow-ups
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto mt-2 sm:mt-0">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 w-full sm:w-auto"
              onClick={handleExportContacts}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button 
              className="h-9 bg-primary hover:bg-primary/90 w-full sm:w-auto"
              onClick={() => setIsAddContactOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-blue-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-white">Total Contacts</CardTitle>
              <div className="rounded-full bg-blue-500/30 p-1.5 sm:p-2">
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-xl sm:text-2xl font-bold text-white">{totalContacts}</div>
              <div className="flex items-center mt-1">
                <span className="text-xs text-blue-100">
                  Active contacts in your CRM
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-indigo-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-white">Unique Companies</CardTitle>
              <div className="rounded-full bg-indigo-500/30 p-1.5 sm:p-2">
                <Building className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-xl sm:text-2xl font-bold text-white">{uniqueCompanies}</div>
              <div className="flex items-center mt-1">
                <span className="text-xs text-indigo-100">
                  Different organizations
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-emerald-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
              <CardTitle className="text-xs sm:text-sm font-medium text-white">Industries</CardTitle>
              <div className="rounded-full bg-emerald-500/30 p-1.5 sm:p-2">
                <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-xl sm:text-2xl font-bold text-white">{uniqueIndustries}</div>
              <div className="flex items-center mt-1">
                <span className="text-xs text-emerald-100">
                  Unique industry sectors
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Tabs */}
        <div className="grid gap-4">
          {/* Search */}
          <Card className="border border-border/40 shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-muted-foreground" />
                </div>
                <Input
                  placeholder="Search contacts by name, company, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Industry Tabs */}
          <div className="overflow-x-auto pb-2 scrollbar-hide">
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-muted/50 p-1 rounded-lg inline-flex h-10 w-auto min-w-full">
                <TabsTrigger value="all" className="rounded-md px-3 text-xs sm:text-sm">All Contacts</TabsTrigger>
                {industries.map(industry => (
                  <TabsTrigger key={industry} value={industry} className="rounded-md px-3 text-xs sm:text-sm capitalize">
                    {industry}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Contact Count Summary */}
          <div className="text-sm text-muted-foreground">
            Showing {filteredContacts.length} {filteredContacts.length === 1 ? 'contact' : 'contacts'}
            {activeTab !== "all" && (
              <> in <Badge variant="outline" className="ml-1 font-normal capitalize">
                {activeTab}
              </Badge> industry</>
            )}
            {searchQuery && <> matching "{searchQuery}"</>}
          </div>

          {/* Contacts Table */}
          <div className="bg-white rounded-lg border border-border/40 shadow-sm overflow-hidden">
            {filteredContacts.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-muted/50 bg-muted/20">
                      <TableHead className="font-medium text-xs sm:text-sm">Name</TableHead>
                      <TableHead className="font-medium text-xs sm:text-sm">Company</TableHead>
                      <TableHead className="font-medium text-xs sm:text-sm">Contact Info</TableHead>
                      <TableHead className="font-medium text-xs sm:text-sm">Services</TableHead>
                      <TableHead className="font-medium text-xs sm:text-sm">Notes</TableHead>
                      <TableHead className="text-right font-medium text-xs sm:text-sm w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContacts.map((contact) => (
                      <TableRow 
                        key={contact.id} 
                        className="hover:bg-muted/30 transition-colors border-b border-border/30"
                      >
                        <TableCell className="font-medium py-3 text-xs sm:text-sm">
                          <div>
                            {contact.name}
                            <div className="text-xs text-muted-foreground capitalize">
                              {contact.industry}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-xs sm:text-sm">
                          <div>
                            {contact.company}
                            <div className="text-xs text-muted-foreground">
                              {contact.region}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 text-xs sm:text-sm">
                          <div className="flex flex-col gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <a 
                                    href={`mailto:${contact.email}`} 
                                    className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                                  >
                                    <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                                    <span className="truncate max-w-[120px] sm:max-w-[180px]">{contact.email}</span>
                                  </a>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Send email to {contact.email}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <a 
                                    href={`tel:${contact.phone}`} 
                                    className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                                  >
                                    <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                                    <span className="truncate max-w-[120px] sm:max-w-[180px]">{contact.phone}</span>
                                  </a>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Call {contact.phone}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex flex-wrap gap-1">
                            {contact.services.length > 0 ? (
                              contact.services.map((service) => (
                                <Badge key={service} variant="secondary" className="text-xs">
                                  {service}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">No services</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell 
                          className="max-w-[150px] sm:max-w-[200px] truncate text-muted-foreground py-3 text-xs sm:text-sm" 
                          title={contact.notes}
                        >
                          {contact.notes || <span className="text-xs italic">No notes</span>}
                        </TableCell>
                        <TableCell className="text-right py-3">
                          <div className="flex justify-end gap-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <Filter className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditContact(contact)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setContactToDelete(contact)}>
                                  <Trash className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleAddFollowup(contact)}>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Send Email
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center">
                <div className="rounded-full bg-primary/10 p-3 mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-2">No contacts found</h3>
                <p className="text-muted-foreground mb-6 max-w-md">
                  {searchQuery || activeTab !== "all" 
                    ? "Try adjusting your search or filters to find what you're looking for." 
                    : "Get started by adding your first contact to begin tracking your relationships."}
                </p>
                <Button 
                  className="gap-2 bg-primary hover:bg-primary/90"
                  onClick={() => setIsAddContactOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Add your first contact
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Contact Dialog */}
      <Dialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-bold text-primary">
              Add New Contact
            </DialogTitle>
            <DialogDescription>
              Fill in the details below to add a new contact.
            </DialogDescription>
          </DialogHeader>
          <ContactForm onSubmit={handleAddContact} />
        </DialogContent>
      </Dialog>

      {/* Edit Contact Dialog */}
      <Dialog open={!!editingContact} onOpenChange={(open) => !open && setEditingContact(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-bold text-primary">
              Edit Contact
            </DialogTitle>
            <DialogDescription>
              Update the contact information below.
            </DialogDescription>
          </DialogHeader>
          {editingContact && (
            <ContactForm 
              onSubmit={handleUpdateContact}
              initialData={editingContact}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!contactToDelete} onOpenChange={() => setContactToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the contact
              {contactToDelete?.name && <> "{contactToDelete.name}"</>}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => contactToDelete && handleDeleteContact(contactToDelete.id)} 
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
