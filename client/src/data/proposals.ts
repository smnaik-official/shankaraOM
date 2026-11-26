export type ProposalStatus =
  | 'Sent to Client'
  | 'Under Review'
  | 'Accepted'
  | 'Declined';

export type BillingType = 'One-Time Project' | 'Monthly Retainer' | 'Milestone-Based';
export type BillingEntity = 'COMPANY' | 'PERSONAL';

export interface Proposal {
  id: string;
  clientName: string;
  contactPerson: string;
  email: string;
  phone: string;
  location: string;
  serviceTitle: string;
  serviceDescription: string;
  tentativeValue: number;
  currency?: string;
  billingType: BillingType;
  billingEntity: BillingEntity;
  probability: number; // 0 to 100 (%)
  status: ProposalStatus;
  sentDate: string; // YYYY-MM-DD
  expectedCloseDate: string; // YYYY-MM-DD
  validUntil: string; // YYYY-MM-DD
  notes?: string;
  convertedInvoiceId?: string;
  quotationId?: string;
  quotationNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export const initialProposals: Proposal[] = [
  {
    id: 'PROP-QUO-2026-001',
    clientName: 'M/s Anugraha Technocrats',
    contactPerson: 'Mr. Rinson / Mr. Mathew',
    email: 'contact@stelaarc.com',
    phone: '+91 99867 03161',
    location: 'Bengaluru, Karnataka',
    serviceTitle:
      'Commercial Proposal for Designing, Website Development and Digital Marketing Services - STELAARC',
    serviceDescription:
      'Corporate brochure, brand identity finalisation, WordPress corporate website, social media management, and performance marketing (Meta & Google Ads).',
    tentativeValue: 95000,
    currency: 'INR',
    billingType: 'One-Time Project',
    billingEntity: 'COMPANY',
    probability: 85,
    status: 'Sent to Client',
    sentDate: '2026-09-15',
    expectedCloseDate: '2026-11-30',
    validUntil: '2026-12-15',
    notes: 'Quotation QUO/0001/2026-27 sent to client.',
    quotationId: 'QUO-2026-001',
    quotationNumber: 'QUO/0001/2026-27',
    createdAt: '2026-09-15',
    updatedAt: '2026-09-15',
  },
  {
    id: 'PROP-2026-001',
    clientName: 'Nexus Retail Dynamics',
    contactPerson: 'Arunav Sengupta',
    email: 'arunav@nexusretail.in',
    phone: '+91 98450 12890',
    location: 'Bangalore, Karnataka',
    serviceTitle: 'Omnichannel D2C Storefront & ERP Data Sync',
    serviceDescription:
      'Architecting high-concurrency headless Shopify e-commerce platform, automated Tally/ERP inventory sync, payment gateway integration with Razorpay, and end-to-end checkout analytics.',
    tentativeValue: 350000,
    billingType: 'One-Time Project',
    billingEntity: 'COMPANY',
    probability: 80,
    status: 'Under Review',
    sentDate: '2026-11-02',
    expectedCloseDate: '2026-11-28',
    validUntil: '2026-12-15',
    notes: 'Commercials shared; client requested 5% scope addition for automated WhatsApp order updates.',
    createdAt: '2026-11-02',
    updatedAt: '2026-11-15',
  },
  {
    id: 'PROP-2026-002',
    clientName: 'Aura Wellness & Organics',
    contactPerson: 'Meera Nambiar',
    email: 'meera@aurawellness.co',
    phone: '+91 97412 88341',
    location: 'Kochi, Kerala',
    serviceTitle: 'Performance Marketing & Brand Growth Retainer',
    serviceDescription:
      'Monthly digital marketing SLA covering Meta Ads creative production, Google Shopping ad management, conversion rate optimization (CRO) audits, and weekly ROAS reporting.',
    tentativeValue: 45000,
    billingType: 'Monthly Retainer',
    billingEntity: 'COMPANY',
    probability: 70,
    status: 'Under Review',
    sentDate: '2026-11-08',
    expectedCloseDate: '2026-11-30',
    validUntil: '2026-12-08',
    notes: 'Pitched 6-month minimum retainer. Founder loved the audit deck; board approval expected by month-end.',
    createdAt: '2026-11-08',
    updatedAt: '2026-11-14',
  },
  {
    id: 'PROP-2026-003',
    clientName: 'Zenith Fintech Solutions',
    contactPerson: 'Vikramaditya Roy',
    email: 'v.roy@zenithfintech.io',
    phone: '+91 99001 54321',
    location: 'Mumbai, Maharashtra',
    serviceTitle: 'Cloud Security Audit & API Hardening',
    serviceDescription:
      'Independent security vulnerability assessment, AWS SOC-2 readiness review, API tokenization architecture, and high-availability database replication design.',
    tentativeValue: 220000,
    billingType: 'One-Time Project',
    billingEntity: 'COMPANY',
    probability: 95,
    status: 'Accepted',
    sentDate: '2026-10-25',
    expectedCloseDate: '2026-11-20',
    validUntil: '2026-11-25',
    notes: 'Proposal officially accepted. Master Services Agreement (MSA) signed. Ready to raise advance invoice.',
    createdAt: '2026-10-25',
    updatedAt: '2026-11-17',
  },
  {
    id: 'PROP-2026-004',
    clientName: 'Vedic Heritage Trust',
    contactPerson: 'Dr. Raghunath Sharma',
    email: 'sharma@vedicheritage.org',
    phone: '+91 94480 33219',
    location: 'Mysore, Karnataka',
    serviceTitle: 'Multilingual Digital Archives & Knowledge Portal',
    serviceDescription:
      'Personal consulting engagement for archival taxonomy, searchable digitised manuscript catalogue, audio lecture indexing, and mobile-friendly community portal.',
    tentativeValue: 180000,
    billingType: 'Milestone-Based',
    billingEntity: 'PERSONAL',
    probability: 60,
    status: 'Sent to Client',
    sentDate: '2026-11-12',
    expectedCloseDate: '2026-12-10',
    validUntil: '2026-12-31',
    notes: 'Non-GST personal consulting agreement. Trust meeting scheduled for first week of December.',
    createdAt: '2026-11-12',
    updatedAt: '2026-11-12',
  },
  {
    id: 'PROP-2026-005',
    clientName: 'Kavya Media & Publishing House',
    contactPerson: 'Sunita Deshmukh',
    email: 'sunita@kavyamedia.in',
    phone: '+91 98230 77123',
    location: 'Pune, Maharashtra',
    serviceTitle: 'SEO & Editorial Content Distribution Engine',
    serviceDescription:
      'Strategic search engine optimization, programmatic landing page generation for 5,000+ literary titles, and automated newsletter publishing workflow.',
    tentativeValue: 35000,
    billingType: 'Monthly Retainer',
    billingEntity: 'COMPANY',
    probability: 40,
    status: 'Sent to Client',
    sentDate: '2026-11-15',
    expectedCloseDate: '2026-12-20',
    validUntil: '2026-12-30',
    notes: 'Initial quotation submitted; competitor quote also being evaluated by client editorial board.',
    createdAt: '2026-11-15',
    updatedAt: '2026-11-15',
  },
  {
    id: 'PROP-2026-006',
    clientName: 'Urban Living Spaces LLP',
    contactPerson: 'Karthik Rao',
    email: 'karthik@urbanliving.in',
    phone: '+91 98860 99450',
    location: 'Bangalore, Karnataka',
    serviceTitle: 'Brand Identity & Interactive 3D Architectural Showcase',
    serviceDescription:
      '3D interactive walkthrough for high-rise residential properties, luxury brand stylebook, and high-speed WebGL micro-site.',
    tentativeValue: 160000,
    billingType: 'One-Time Project',
    billingEntity: 'COMPANY',
    probability: 10,
    status: 'Declined',
    sentDate: '2026-10-10',
    expectedCloseDate: '2026-10-31',
    validUntil: '2026-11-10',
    notes: 'Client deferred digital expansion due to internal project delay until Q2 2027.',
    createdAt: '2026-10-10',
    updatedAt: '2026-11-01',
  },
];

const PROPOSALS_STORAGE_KEY = 'shankara_proposals_data';

export const normalizeProposalStatus = (status: string): ProposalStatus => {
  if (status === 'Sent' || status === 'Draft' || status === 'Sent to Client') return 'Sent to Client';
  if (status === 'Negotiation' || status === 'Under Review') return 'Under Review';
  if (status === 'Accepted') return 'Accepted';
  if (status === 'Declined' || status === 'Declained') return 'Declined';
  return 'Sent to Client';
};

export const getStoredProposals = (): Proposal[] => {
  try {
    const raw = localStorage.getItem(PROPOSALS_STORAGE_KEY);
    if (!raw) return initialProposals;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((p: any) => ({
        ...p,
        quotationNumber: p.quotationNumber
          ? p.quotationNumber.replace(/^QUO\/(\d{4}-\d{2})\/(\d+)$/i, (_m: string, fy: string, seq: string) => `QUO/${seq.padStart(4, '0')}/${fy}`)
          : p.quotationNumber,
        status: normalizeProposalStatus(p.status),
      }));
    }
    return initialProposals;
  } catch (e) {
    return initialProposals;
  }
};

export const saveStoredProposals = (proposals: Proposal[]) => {
  try {
    localStorage.setItem(PROPOSALS_STORAGE_KEY, JSON.stringify(proposals));
    window.dispatchEvent(new CustomEvent('proposals-changed'));
    window.dispatchEvent(new CustomEvent('notifications-changed'));
  } catch (e) {
    console.error('Failed to save proposals:', e);
  }
};

export interface PipelineMetrics {
  totalCount: number;
  activeCount: number;
  totalPipelineValue: number;
  weightedForecastValue: number;
  wonCount: number;
  wonValue: number;
  lostCount: number;
  lostValue: number;
  sentToClientCount: number;
  underReviewCount: number;
  winRate: number;
  thisMonthForecastValue: number;
  thisMonthCount: number;
  companyForecastValue: number;
  personalForecastValue: number;
  byStatus: Record<ProposalStatus, { count: number; totalValue: number; weightedValue: number }>;
  monthlyForecasts: { month: string; rawTotal: number; weightedTotal: number; dealCount: number }[];
}

export const calculatePipelineMetrics = (
  proposals: Proposal[],
  currentMonth: string = '2026-11'
): PipelineMetrics => {
  const activeProposals = proposals.filter((p) => p.status !== 'Declined');
  const wonProposals = proposals.filter((p) => p.status === 'Accepted');
  const lostProposals = proposals.filter((p) => p.status === 'Declined');
  const sentToClientCount = proposals.filter((p) => p.status === 'Sent to Client').length;
  const underReviewCount = proposals.filter((p) => p.status === 'Under Review').length;

  const totalPipelineValue = activeProposals.reduce((sum, p) => sum + p.tentativeValue, 0);
  const weightedForecastValue = Math.round(
    activeProposals.reduce((sum, p) => sum + (p.tentativeValue * p.probability) / 100, 0)
  );

  const wonValue = wonProposals.reduce((sum, p) => sum + p.tentativeValue, 0);
  const lostValue = lostProposals.reduce((sum, p) => sum + p.tentativeValue, 0);
  const totalDecided = wonProposals.length + lostProposals.length;
  const winRate = totalDecided > 0 ? Math.round((wonProposals.length / totalDecided) * 100) : 0;

  // This Month (e.g. 2026-11)
  const thisMonthDeals = activeProposals.filter((p) => p.expectedCloseDate.startsWith(currentMonth));
  const thisMonthForecastValue = Math.round(
    thisMonthDeals.reduce((sum, p) => sum + (p.tentativeValue * p.probability) / 100, 0)
  );

  // By Billing Entity
  const companyForecastValue = Math.round(
    activeProposals
      .filter((p) => p.billingEntity === 'COMPANY')
      .reduce((sum, p) => sum + (p.tentativeValue * p.probability) / 100, 0)
  );

  const personalForecastValue = Math.round(
    activeProposals
      .filter((p) => p.billingEntity === 'PERSONAL')
      .reduce((sum, p) => sum + (p.tentativeValue * p.probability) / 100, 0)
  );

  // Group by status
  const statuses: ProposalStatus[] = ['Sent to Client', 'Under Review', 'Accepted', 'Declined'];
  const byStatus = {} as Record<ProposalStatus, { count: number; totalValue: number; weightedValue: number }>;

  statuses.forEach((s) => {
    const list = proposals.filter((p) => p.status === s);
    byStatus[s] = {
      count: list.length,
      totalValue: list.reduce((sum, p) => sum + p.tentativeValue, 0),
      weightedValue: Math.round(list.reduce((sum, p) => sum + (p.tentativeValue * p.probability) / 100, 0)),
    };
  });

  // Group monthly forecasts
  const monthMap: Record<string, { rawTotal: number; weightedTotal: number; dealCount: number }> = {};
  activeProposals.forEach((p) => {
    const m = p.expectedCloseDate.slice(0, 7); // YYYY-MM
    if (!monthMap[m]) {
      monthMap[m] = { rawTotal: 0, weightedTotal: 0, dealCount: 0 };
    }
    monthMap[m].rawTotal += p.tentativeValue;
    monthMap[m].weightedTotal += Math.round((p.tentativeValue * p.probability) / 100);
    monthMap[m].dealCount += 1;
  });

  const monthlyForecasts = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      ...data,
    }));

  return {
    totalCount: proposals.length,
    activeCount: activeProposals.length,
    totalPipelineValue,
    weightedForecastValue,
    wonCount: wonProposals.length,
    wonValue,
    lostCount: lostProposals.length,
    lostValue,
    sentToClientCount,
    underReviewCount,
    winRate,
    thisMonthForecastValue,
    thisMonthCount: thisMonthDeals.length,
    companyForecastValue,
    personalForecastValue,
    byStatus,
    monthlyForecasts,
  };
};

export const getNextProposalId = (existing: Proposal[]): string => {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `PROP-${currentYear}-`;
  const matching = existing
    .map((p) => p.id)
    .filter((id) => id.startsWith(yearPrefix))
    .map((id) => parseInt(id.replace(yearPrefix, ''), 10))
    .filter((num) => !isNaN(num));

  const maxNum = matching.length > 0 ? Math.max(...matching) : 0;
  return `${yearPrefix}${String(maxNum + 1).padStart(3, '0')}`;
};
