import { apiBatchSave } from '../services/api';

export type SubscriptionDuration =
  | 'Monthly'
  | 'Quarterly'
  | 'Half-Yearly'
  | 'Yearly'
  | 'Biennial';

export type SubscriptionOwnership = 'Company' | 'Client';

export type SubscriptionStatus =
  | 'Active'
  | 'Expiring Soon'
  | 'Overdue'
  | 'Paused'
  | 'Cancelled';

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';

export const DEFAULT_SUBSCRIPTION_CATEGORIES: string[] = [
  'SaaS & Software',
  'Cloud & Hosting',
  'Domains & SSL',
  'Marketing & SEO',
  'Design & Creative',
  'AI & APIs',
  'Telecom & Utilities',
  'Other',
];

export const STORAGE_KEY_CATEGORIES = 'shankara_subscription_categories';

export const getStoredSubscriptionCategories = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CATEGORIES);
    if (!raw) return DEFAULT_SUBSCRIPTION_CATEGORIES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_SUBSCRIPTION_CATEGORIES;
  } catch {
    return DEFAULT_SUBSCRIPTION_CATEGORIES;
  }
};

export const saveStoredSubscriptionCategories = (cats: string[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(cats));
  } catch (e) {
    console.error('Failed to save categories:', e);
  }
};

export interface Subscription {
  id: string;
  name: string;
  category: string;
  ownership: SubscriptionOwnership; // 'Company' (Self/Shankara) or 'Client' (On behalf of Client)
  clientId?: string;
  clientName?: string;
  billingDuration: SubscriptionDuration;
  amount: number;
  currency: CurrencyCode;
  startDate: string; // YYYY-MM-DD
  renewalDate: string; // YYYY-MM-DD
  autoRenew?: boolean;
  paymentMethod?: string;
  licenseCount?: string;
  loginEmail?: string;
  vendorUrl?: string;
  notes?: string;
  lastRenewedDate?: string;
  status?: SubscriptionStatus;
}

export const STORAGE_KEY_SUBSCRIPTIONS = 'shankara_subscriptions_data';

// Standard currency symbols
export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

// Approximate exchange rates to INR for normalized metrics
export const APPROX_TO_INR_RATES: Record<CurrencyCode, number> = {
  INR: 1,
  USD: 87,
  EUR: 92,
  GBP: 110,
};

// Normalize any subscription duration to an estimated monthly cost in INR
export const getNormalizedMonthlyInr = (sub: Subscription): number => {
  const rate = APPROX_TO_INR_RATES[sub.currency] || 1;
  const inrTotal = sub.amount * rate;

  switch (sub.billingDuration) {
    case 'Monthly':
      return inrTotal;
    case 'Quarterly':
      return inrTotal / 3;
    case 'Half-Yearly':
      return inrTotal / 6;
    case 'Yearly':
      return inrTotal / 12;
    case 'Biennial':
      return inrTotal / 24;
    default:
      return inrTotal;
  }
};

// Compute days remaining until renewal from a given reference date
export const getDaysUntilRenewal = (renewalDateStr: string, referenceDate: Date = new Date()): number => {
  const ref = new Date(referenceDate);
  ref.setHours(0, 0, 0, 0);

  const target = new Date(renewalDateStr);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - ref.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
};

// Determine status based on renewal date and stored status
export const resolveSubscriptionStatus = (sub: Subscription, referenceDate: Date = new Date()): SubscriptionStatus => {
  if (sub.status === 'Paused' || sub.status === 'Cancelled') {
    return sub.status;
  }

  const days = getDaysUntilRenewal(sub.renewalDate, referenceDate);
  if (days < 0) {
    return 'Overdue';
  }
  if (days <= 15) {
    return 'Expiring Soon';
  }
  return 'Active';
};

// Advance renewal date based on duration
export const advanceRenewalDate = (currentDateStr: string, duration: SubscriptionDuration): string => {
  const d = new Date(currentDateStr);
  if (isNaN(d.getTime())) {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  switch (duration) {
    case 'Monthly':
      d.setMonth(d.getMonth() + 1);
      break;
    case 'Quarterly':
      d.setMonth(d.getMonth() + 3);
      break;
    case 'Half-Yearly':
      d.setMonth(d.getMonth() + 6);
      break;
    case 'Yearly':
      d.setFullYear(d.getFullYear() + 1);
      break;
    case 'Biennial':
      d.setFullYear(d.getFullYear() + 2);
      break;
    default:
      d.setMonth(d.getMonth() + 1);
  }

  return d.toISOString().split('T')[0];
};

export const defaultSubscriptions: Subscription[] = [
  // --- COMPANY / INTERNAL SUBSCRIPTIONS (Shankara Online Solutions) ---
  {
    id: 'sub-comp-1',
    name: 'Google Workspace Business Standard',
    category: 'SaaS & Software',
    ownership: 'Company',
    billingDuration: 'Monthly',
    amount: 10400,
    currency: 'INR',
    startDate: '2024-01-10',
    renewalDate: '2026-12-10',
    autoRenew: true,
    paymentMethod: 'HDFC Corporate Credit Card',
    licenseCount: '16 Team Seats',
    loginEmail: 'admin@shankaraonline.com',
    vendorUrl: 'https://workspace.google.com',
    notes: 'Primary business email, drive storage, and meet enterprise suite',
    lastRenewedDate: '2026-11-10',
    status: 'Active',
  },
  {
    id: 'sub-comp-2',
    name: 'AWS Cloud Infrastructure (Production Cluster)',
    category: 'Cloud & Hosting',
    ownership: 'Company',
    billingDuration: 'Monthly',
    amount: 28500,
    currency: 'INR',
    startDate: '2023-06-01',
    renewalDate: '2026-12-01',
    autoRenew: true,
    paymentMethod: 'HDFC Corporate Credit Card',
    licenseCount: 'EC2, RDS, S3 & CloudFront',
    loginEmail: 'aws-ops@shankaraonline.com',
    vendorUrl: 'https://aws.amazon.com',
    notes: 'Core agency hosting servers and microservices',
    lastRenewedDate: '2026-11-01',
    status: 'Active',
  },
  {
    id: 'sub-comp-3',
    name: 'Figma Organization & FigJam Pro',
    category: 'Design & Creative',
    ownership: 'Company',
    billingDuration: 'Monthly',
    amount: 95,
    currency: 'USD',
    startDate: '2024-03-15',
    renewalDate: '2026-11-28', // Expiring in 5 days!
    autoRenew: true,
    paymentMethod: 'Forex Virtual Card',
    licenseCount: '5 Full Design Seats',
    loginEmail: 'design@shankaraonline.com',
    vendorUrl: 'https://figma.com',
    notes: 'UI/UX design workspace for client proposals and web design',
    lastRenewedDate: '2026-10-28',
    status: 'Active',
  },
  {
    id: 'sub-comp-4',
    name: 'Canva Pro Enterprise Team',
    category: 'Design & Creative',
    ownership: 'Company',
    billingDuration: 'Yearly',
    amount: 14999,
    currency: 'INR',
    startDate: '2025-12-15',
    renewalDate: '2026-12-15',
    autoRenew: true,
    paymentMethod: 'HDFC NetBanking',
    licenseCount: '10 Brand Members',
    loginEmail: 'social@shankaraonline.com',
    vendorUrl: 'https://canva.com',
    notes: 'Social media creatives, marketing assets, and brand stationery templates',
    lastRenewedDate: '2025-12-15',
    status: 'Active',
  },
  {
    id: 'sub-comp-5',
    name: 'Cloudflare Pro & DNS Security',
    category: 'Domains & SSL',
    ownership: 'Company',
    billingDuration: 'Yearly',
    amount: 240,
    currency: 'USD',
    startDate: '2025-11-20',
    renewalDate: '2026-11-20', // Due right now / today!
    autoRenew: false,
    paymentMethod: 'Corporate Card',
    licenseCount: '3 Agency Domains',
    loginEmail: 'tech@shankaraonline.com',
    vendorUrl: 'https://cloudflare.com',
    notes: 'DDoS mitigation, web application firewall and CDN caching',
    lastRenewedDate: '2025-11-20',
    status: 'Active',
  },
  {
    id: 'sub-comp-6',
    name: 'Zoom Workplace Pro Suite',
    category: 'Telecom & Utilities',
    ownership: 'Company',
    billingDuration: 'Yearly',
    amount: 13200,
    currency: 'INR',
    startDate: '2026-01-05',
    renewalDate: '2027-01-05',
    autoRenew: true,
    paymentMethod: 'Corporate Card',
    licenseCount: '1 Host (300 Participants)',
    loginEmail: 'naik@shankaraonline.com',
    vendorUrl: 'https://zoom.us',
    notes: 'Client consultations, executive webinars and screen recordings',
    lastRenewedDate: '2026-01-05',
    status: 'Active',
  },

  // --- CLIENT MANAGED SUBSCRIPTIONS (Managed on Behalf of Clients) ---
  {
    id: 'sub-client-1',
    name: 'Shopify Plus & App Ecosystem Stack',
    category: 'Cloud & Hosting',
    ownership: 'Client',
    clientId: '2',
    clientName: 'The Art of Living Foundation',
    billingDuration: 'Monthly',
    amount: 2000,
    currency: 'USD',
    startDate: '2024-05-01',
    renewalDate: '2026-12-01',
    autoRenew: true,
    paymentMethod: 'Client Corporate Amex Card',
    licenseCount: 'Global E-Commerce Store',
    loginEmail: 'admin-store@artofliving.org',
    vendorUrl: 'https://shopify.com',
    notes: 'Managed on behalf of client for global merchandise and bookstore checkout',
    lastRenewedDate: '2026-11-01',
    status: 'Active',
  },
  {
    id: 'sub-client-2',
    name: 'Klaviyo Omnichannel Marketing Cloud',
    category: 'Marketing & SEO',
    ownership: 'Client',
    clientId: '2',
    clientName: 'The Art of Living Foundation',
    billingDuration: 'Monthly',
    amount: 650,
    currency: 'USD',
    startDate: '2024-08-15',
    renewalDate: '2026-12-15',
    autoRenew: true,
    paymentMethod: 'Client Corporate Card',
    licenseCount: '85,000 Active Profiles',
    loginEmail: 'marketing-crm@artofliving.org',
    vendorUrl: 'https://klaviyo.com',
    notes: 'Automated newsletter, SMS campaigns, and audience segmentation',
    lastRenewedDate: '2026-11-15',
    status: 'Active',
  },
  {
    id: 'sub-client-3',
    name: 'Webflow Business CMS Hosting',
    category: 'Cloud & Hosting',
    ownership: 'Client',
    clientId: '1',
    clientName: 'M/s Tamagna Personalcare Pvt Ltd',
    billingDuration: 'Yearly',
    amount: 468,
    currency: 'USD',
    startDate: '2025-12-05',
    renewalDate: '2026-12-05',
    autoRenew: true,
    paymentMethod: 'Client Visa Business',
    licenseCount: 'Corporate Website & Blog',
    loginEmail: 'it-support@tamagna.com',
    vendorUrl: 'https://webflow.com',
    notes: 'Managed website hosting for brand showcase and distributor locator',
    lastRenewedDate: '2025-12-05',
    status: 'Active',
  },
  {
    id: 'sub-client-4',
    name: 'Google Workspace (5 Seats)',
    category: 'SaaS & Software',
    ownership: 'Client',
    clientId: '1',
    clientName: 'M/s Tamagna Personalcare Pvt Ltd',
    billingDuration: 'Yearly',
    amount: 9000,
    currency: 'INR',
    startDate: '2025-12-10',
    renewalDate: '2026-12-10',
    autoRenew: false,
    paymentMethod: 'Direct Client Bank Transfer',
    licenseCount: '5 Core Leadership Inboxes',
    loginEmail: 'admin@tamagna.com',
    vendorUrl: 'https://workspace.google.com',
    notes: 'Official executive email provisioning managed by Shankara Online',
    lastRenewedDate: '2025-12-10',
    status: 'Active',
  },
  {
    id: 'sub-client-5',
    name: 'Semrush Guru Competitor Analysis Suite',
    category: 'Marketing & SEO',
    ownership: 'Client',
    clientId: '3',
    clientName: 'Nexus Retail Dynamics',
    billingDuration: 'Quarterly',
    amount: 749,
    currency: 'USD',
    startDate: '2026-03-01',
    renewalDate: '2026-12-01',
    autoRenew: true,
    paymentMethod: 'Client Master Card',
    licenseCount: '3 SEO Specialists',
    loginEmail: 'growth@nexusdynamics.in',
    vendorUrl: 'https://semrush.com',
    notes: 'Monthly search ranking audits and keyword discovery for retail campaigns',
    lastRenewedDate: '2026-09-01',
    status: 'Active',
  },
  {
    id: 'sub-client-6',
    name: 'Brand Domains & Wildcard SSL Bundle',
    category: 'Domains & SSL',
    ownership: 'Client',
    clientId: '1',
    clientName: 'M/s Tamagna Personalcare Pvt Ltd',
    billingDuration: 'Biennial',
    amount: 18500,
    currency: 'INR',
    startDate: '2024-11-25',
    renewalDate: '2026-11-25', // Expiring in 2 days!
    autoRenew: false,
    paymentMethod: 'Manual Client Cheque',
    licenseCount: 'tamagna.com, tamagnacare.in',
    loginEmail: 'domains@shankaraonline.com',
    vendorUrl: 'https://godaddy.com',
    notes: 'Critical 2-year domain registrations and Comodo Wildcard SSL certificates',
    lastRenewedDate: '2024-11-25',
    status: 'Active',
  },
];

export const getStoredSubscriptions = (): Subscription[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUBSCRIPTIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const todayStr = new Date().toISOString().slice(0, 10);
    return parsed.map((s: any) => ({
      ...s,
      name: s.name || s.toolName || 'Subscription',
      category: s.category || 'SaaS & Software',
      ownership: s.ownership || 'Company',
      billingDuration: s.billingDuration || s.duration || 'Monthly',
      amount: Number(s.amount ?? s.pricing ?? 0),
      currency: s.currency || 'INR',
      startDate: s.startDate || todayStr,
      renewalDate: s.renewalDate || s.nextDueDate || todayStr,
      autoRenew: s.autoRenew ?? true,
      notes: s.notes || s.description || '',
      status: s.status || 'Active',
    }));
  } catch (e) {
    return [];
  }
};

export const saveStoredSubscriptions = (subs: Subscription[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY_SUBSCRIPTIONS, JSON.stringify(subs));
    apiBatchSave('subscriptions', subs).catch(console.warn);
  } catch (e) {
    console.error('Failed to save subscriptions:', e);
  }
};
