export interface MenuItem {
  label: string
  icon?: React.ReactNode
  path?: string
  children?: MenuItem[]
} 