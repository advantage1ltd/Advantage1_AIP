export interface QuickLink {
  to: string;
  label: string;
  ariaLabel: string;
}

export interface CompanyInfo {
  name: string;
  address: string[];
}

export interface ContactInfo {
  phone: string;
  supportText: string;
}

export interface FooterProps {
  className?: string;
  companyInfo: CompanyInfo;
  contactInfo: ContactInfo;
  quickLinks: QuickLink[];
} 