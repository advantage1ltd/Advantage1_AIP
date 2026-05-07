import { formatDistanceToNow } from 'date-fns'
import { Building2, Mail, User, MoreVertical, GripVertical } from 'lucide-react'
import { Deal } from '@/data/pipeline'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

interface DealCardProps {
	deal: Deal
	onEdit: () => void
	onDelete: () => void
}

export function DealCard({ deal, onEdit, onDelete }: DealCardProps) {
	const priorityColors = {
		low: 'bg-blue-100 text-blue-700 border-blue-200',
		medium: 'bg-amber-100 text-amber-700 border-amber-200',
		high: 'bg-red-100 text-red-700 border-red-200'
	}

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat('en-GB', {
			style: 'currency',
			currency: 'GBP',
			maximumFractionDigits: 0
		}).format(value)
	}

	return (
		<div className="bg-white p-4 rounded-lg shadow-sm border border-border/40 hover:shadow-md transition-all space-y-3 group">
			{/* Header with drag handle and menu */}
			<div className="flex items-start justify-between gap-2">
				<div className="flex items-start gap-2 flex-1 min-w-0">
					<div className="mt-0.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors">
						<GripVertical className="h-4 w-4" />
					</div>
					<div className="flex-1 min-w-0">
						<h3 className="font-semibold text-sm text-foreground truncate mb-1">
							{deal.title}
						</h3>
						<p className="text-base font-bold text-primary">{formatCurrency(deal.value)}</p>
					</div>
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
						>
							<MoreVertical className="h-4 w-4" />
							<span className="sr-only">More options</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={onEdit}>Edit Deal</DropdownMenuItem>
						<DropdownMenuItem onClick={onDelete} className="text-red-600 focus:text-red-600">
							Delete Deal
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/* Priority Badge */}
			<div className="flex items-center gap-2">
				<Badge
					variant="outline"
					className={`text-xs font-medium border ${priorityColors[deal.priority]}`}
				>
					{deal.priority.charAt(0).toUpperCase() + deal.priority.slice(1)} Priority
				</Badge>
			</div>

			{/* Contact Information */}
			<div className="space-y-2 text-sm">
				<div className="flex items-center gap-2 text-muted-foreground">
					<Building2 className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/60" />
					<span className="truncate">{deal.company}</span>
				</div>
				<div className="flex items-center gap-2 text-muted-foreground">
					<User className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/60" />
					<span className="truncate">{deal.contact}</span>
				</div>
				<div className="flex items-center gap-2">
					<Mail className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground/60" />
					<a
						href={`mailto:${deal.email}`}
						className="text-primary hover:text-primary/80 truncate text-sm transition-colors"
					>
						{deal.email}
					</a>
				</div>
			</div>

			{/* Footer */}
			<div className="pt-2 border-t border-border/40">
				<p className="text-xs text-muted-foreground">
					Updated {formatDistanceToNow(new Date(deal.updatedAt), { addSuffix: true })}
				</p>
			</div>
		</div>
	)
}
