import { CompanyInfo, ContactInfo, QuickLink } from './types';

export const COMPANY_INFO: CompanyInfo = {
  name: 'Advantage One Security',
  address: [
    '1 Madeley Road',
    'Moons Moat North Industrial Estate',
    'Redditch B98 9NB',
  ],
};

export const CONTACT_INFO: ContactInfo = {
  phone: '0121 820 2973',
  supportText: 'For Support Call Scott or James at Head Office',
};

export const QUICK_LINKS: QuickLink[] = [
  {
    to: '/operations/incident-report',
    label: 'Incident Report',
    ariaLabel: 'Create Incident Report',
  },
  {
    to: '/operations/holiday-requests',
    label: 'Holiday Request',
    ariaLabel: 'Submit Holiday Request',
  },
  {
    to: '/operations/site-visit',
    label: 'Site Visits',
    ariaLabel: 'View Site Visits',
  },
  {
    to: '/operations/officer-support',
    label: 'Officer Support',
    ariaLabel: 'Access Officer Support',
  },
]; 