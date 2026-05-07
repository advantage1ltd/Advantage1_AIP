import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface ContactSearchBarProps {
  searchQuery: string
  setSearchQuery: (query: string) => void
}

export function ContactSearchBar({ searchQuery, setSearchQuery }: ContactSearchBarProps) {
  return (
    <div className="relative w-full max-w-xl">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      <Input
        placeholder="Search contacts by name, company, or email..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="pl-12 h-12 text-lg bg-white shadow-sm border-2 border-border/50 hover:border-primary/50 focus-visible:ring-primary"
      />
    </div>
  )
}