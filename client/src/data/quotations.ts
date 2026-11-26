import { Proposal, initialProposals } from './proposals';

export interface ProposalPillar {
  id: string;
  title: string;
  description: string;
}

export interface ProposalDeliverable {
  id: string;
  title: string;
  subtitle?: string;
  indicativeDeliverables?: string;
  bulletPoints?: string[];
}

export interface ScopePhase {
  id: string;
  phaseTitle: string;
  deliverables: ProposalDeliverable[];
}

export interface CommercialItem {
  id: string;
  service: string;
  investment: number;
  billing: string;
  taxNote?: string;
}

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AUD' | 'SGD' | 'AED' | 'CAD';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  label: string;
  locale: string;
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: 'INR', symbol: '₹', label: 'INR (₹) - Indian Rupee', locale: 'en-IN' },
  { code: 'USD', symbol: '$', label: 'USD ($) - US Dollar', locale: 'en-US' },
  { code: 'EUR', symbol: '€', label: 'EUR (€) - Euro', locale: 'en-IE' },
  { code: 'GBP', symbol: '£', label: 'GBP (£) - British Pound', locale: 'en-GB' },
  { code: 'AUD', symbol: 'A$', label: 'AUD (A$) - Australian Dollar', locale: 'en-AU' },
  { code: 'SGD', symbol: 'S$', label: 'SGD (S$) - Singapore Dollar', locale: 'en-SG' },
  { code: 'AED', symbol: 'AED', label: 'AED (AED) - UAE Dirham', locale: 'en-AE' },
  { code: 'CAD', symbol: 'C$', label: 'CAD (C$) - Canadian Dollar', locale: 'en-CA' },
];

export const getCurrencySymbol = (currency?: string): string => {
  if (!currency) return '₹';
  const match = SUPPORTED_CURRENCIES.find((c) => c.code.toUpperCase() === currency.toUpperCase());
  return match ? match.symbol : currency;
};

export const getCurrencyLocale = (currency?: string): string => {
  if (!currency) return 'en-IN';
  const match = SUPPORTED_CURRENCIES.find((c) => c.code.toUpperCase() === currency.toUpperCase());
  return match ? match.locale : 'en-US';
};

export interface Quotation {
  id: string;
  quotationNumber: string;
  date: string;
  currency?: CurrencyCode | string;
  clientName: string;
  clientCity: string;
  attention: string;
  subject: string;
  brandName: string;
  salutation: string;
  introText: string;

  // 1. Understanding Brand & Objective
  objectiveHeading: string;
  objectiveIntro: string;
  includePillars?: boolean;
  pillars: ProposalPillar[];
  includePhilosophy?: boolean;
  philosophyTitle: string;
  philosophyPoints: string[];

  // 2. Scope of Work
  scopeHeading: string;
  scopePhases: ScopePhase[];

  // 3. Commercial Proposal
  commercialHeading: string;
  commercialItems: CommercialItem[];
  pricingNotesHeading?: string;
  pricingNotes: string;
  clientInputsHeading?: string;
  clientInputsRequired: string;

  // 4. Engagement Terms and Exclusions
  termsHeading: string;
  terms: { title: string; detail: string }[];
  additionalExclusions: string[];

  // Closing Note & Signatory
  closingNote: string;
  thankYouNote: string;
  signatoryName: string;
  signatoryDesignation: string;
  signatoryPhone: string;
  signatoryEmail: string;
  signatoryWebsite: string;

  totalTentativeValue: number;
  status: 'Draft' | 'Sent to Client';
  updatedAt: string;
}

export const sampleStelaarcQuotation: Quotation = {
  id: 'QUO-2026-001',
  quotationNumber: 'QUO/0001/2026-27',
  date: '2026-09-15',
  currency: 'INR',
  clientName: 'M/s Anugraha Technocrats',
  clientCity: 'Bengaluru',
  attention: 'Mr. Rinson / Mr. Mathew',
  subject: 'Commercial Proposal for Designing, Website Development and Digital Marketing Services for STELAARC by Anugraha Technocrats',
  brandName: 'STELAARC',
  salutation: 'Dear Sir,',
  introText:
    'This is regarding our meeting regarding the requirement of branding, designing, website and digital marketing services for your brand ‘STELAARC’.\n\nFrom brand-ready corporate collateral and a conversion-focused website to social media and performance marketing, the engagement is designed to turn founder’s decades of industry experience into visible market credibility and qualified enquiries.',

  objectiveHeading: '1. Understanding the Brand & Objective',
  objectiveIntro:
    'STELAARC enters the market with a valuable advantage: more than 2 decades of experience in stainless-steel interior manufacturing. The immediate opportunity is to convert that experience into a consistent corporate identity, a strong digital showcase and a dependable lead-generation engine.',
  includePillars: true,
  pillars: [
    {
      id: 'p1',
      title: 'CREDIBILITY',
      description:
        'Present STELAARC as an experienced, capable and professionally managed B2B partner through high-quality branding materials.',
    },
    {
      id: 'p2',
      title: 'CAPABILITY',
      description:
        'Showcase craftsmanship, manufacturing expertise, applications and project quality through visual content on website, and social media.',
    },
    {
      id: 'p3',
      title: 'CONVERSION',
      description:
        'Create digital touchpoints that make it easy for architects, designers, contractors, developers and businesses to enquire.',
    },
  ],
  includePhilosophy: true,
  philosophyTitle: '2. Brand Marketing Philosophy',
  philosophyPoints: [
    'Design should make STELAARC look established, not merely new brand in the market.',
    'Content should demonstrate expertise and work quality instead of relying only on promotional messaging.',
    'Performance marketing should be measured against meaningful business actions such as enquiries, calls and lead quality.',
  ],

  scopeHeading: '3. Scope of Work',
  scopePhases: [
    {
      id: 'phase-1',
      phaseTitle: 'Phase – 1: Branding and Digital Foundation',
      deliverables: [
        {
          id: 'del-1',
          title: 'Brand Identity Finalisation & Corporate Collaterals',
          subtitle:
            'Convert the existing finalised STELAARC logo into a complete, production-ready brand asset set.',
          indicativeDeliverables:
            'High-resolution and vector logo files; colour/reverse versions; typography and basic usage guidance; visiting card; letterhead; envelope.',
        },
        {
          id: 'del-2',
          title: 'Corporate Brochure — Approx. 16 Pages',
          subtitle:
            'Create a professional corporate brochure that communicates the company story, expertise, products/solutions, applications and capabilities.',
          indicativeDeliverables:
            'Content framework; page-by-page design; image treatment; infographics/diagrams where required; digital PDF; print-ready artwork. Final page count may vary slightly based on approved content.',
        },
        {
          id: 'del-3',
          title: 'WordPress Corporate Website',
          subtitle:
            'Design and develop a responsive corporate website that works as STELAARC’s primary digital credibility and enquiry platform.',
          indicativeDeliverables:
            'Website framework; WordPress website design and development; responsive layout; core business pages; enquiry/contact forms; basic on-page SEO setup; analytics/Search Console readiness; speed and mobile optimisation for launch.',
        },
      ],
    },
    {
      id: 'phase-2',
      phaseTitle: 'Phase – 2: Social Media Management & Performance Marketing',
      deliverables: [
        {
          id: 'del-4',
          title: 'Social Media Management',
          subtitle:
            'Build a consistent content presence focused on authority, craftsmanship, projects and business relevance rather than generic posting.',
          bulletPoints: [
            'Content strategy: Monthly content plan aligned with business objectives, audience and campaigns.',
            'Organic content: 10–14 posts/month on Instagram and Facebook, may also include content on YouTube and Pinterest. Type of posts may include project showcases, educational posts, brand stories and industry insights (includes up to 3-5 reels/month, subject to availability of raw footage and content).',
            'Publishing and Optimization: Copywriting, hashtags, scheduling/publishing and platform-level optimisation.',
            'Reporting and Analytics: Monthly performance snapshot with key observations and next-month priorities.',
          ],
        },
        {
          id: 'del-5',
          title: 'Performance Marketing (Meta Ads and Google Ads)',
          subtitle:
            'Performance marketing will be planned around STELAARC’s most relevant decision-makers and geographies. Campaign architecture will be refined as enquiry data and audience signals accumulate.',
          bulletPoints: [
            'Audience focus: Architects, interior designers, contractors, developers, hospitality/commercial businesses and other B2B decision-makers relevant to stainless-steel interiors.',
            'Campaign objectives: Lead generation, enquiry forms, calls and high-intent website actions. The mix will depend on the approved business priorities.',
            'Platforms: Meta Ads and/or Google Ads, based on where the strongest commercial intent can be captured.',
            'Optimisation: Creative and audience testing, budget reallocation, lead-quality feedback loops and monthly performance review.',
          ],
        },
      ],
    },
  ],

  commercialHeading: '4. Commercial Proposal',
  commercialItems: [
    {
      id: 'c1',
      service: 'Brand Identity Finalisation & Brand Stationaries',
      investment: 3000,
      billing: 'One-time',
      taxNote: '+ 18% GST',
    },
    {
      id: 'c2',
      service: '16-Page Corporate Brochure Design',
      investment: 19000,
      billing: 'One-time',
      taxNote: '+ 18% GST',
    },
    {
      id: 'c3',
      service: 'WordPress Corporate Website',
      investment: 35000,
      billing: 'One-time',
      taxNote: '+ 18% GST',
    },
    {
      id: 'c4',
      service: 'Social Media Management',
      investment: 26000,
      billing: 'Monthly Retainer',
      taxNote: '+ 18% GST',
    },
    {
      id: 'c5',
      service: 'Meta / Google Ad Campaign Management',
      investment: 12000,
      billing: 'Per Campaign Per Month',
      taxNote: '+ 18% GST',
    },
  ],
  pricingNotesHeading: 'Pricing Notes & Exclusions (e.g. Ad Spend, GST, Domains)',
  pricingNotes:
    'Note: Advertising spend is separate and will be funded directly by STELAARC. GST, domain charges, hosting charges, official email charges, paid plugins/themes, paid stock images/videos, printing and third-party software/integration fees are extra, where applicable.',
  clientInputsHeading: 'Client Inputs Required (Prerequisites)',
  clientInputsRequired:
    'Approved logo, company profile, product/service details, project images, manufacturing/capability information, contact details, social handles, target geographies and access to existing marketing assets, wherever relevant.',

  termsHeading: '5. Engagement Terms and Service Exclusions',
  terms: [
    {
      title: 'Phase 1 payment',
      detail: '50% advance to initiate the project; 50% on completion of the website and final collateral handover.',
    },
    {
      title: 'Monthly retainer',
      detail: 'Minimum recommended engagement: 3 months for meaningful optimisation and performance evaluation.',
    },
    {
      title: 'Revisions',
      detail: 'Reasonable revisions are included within the approved scope. Material scope changes or additional pages/assets will be estimated separately.',
    },
    {
      title: 'Content & approvals',
      detail: 'Timely client inputs and approvals are essential to maintain the proposed timeline.',
    },
    {
      title: 'Third-party costs',
      detail: 'Domain, hosting, premium software, stock assets, printing, ad spend and external production costs are excluded unless specifically mentioned.',
    },
  ],
  additionalExclusions: [
    'Any paid advertising campaigns or influencer costs are additional.',
    'Any services like video shoot, designing service that are not mentioned above are charged separately on case-to-case basis.',
  ],

  closingNote:
    'We look forward to a collaborative and impactful engagement. Please feel free to reach out for further details or clarification that you may be looking for.',
  thankYouNote: 'Thank you for your trust in our services.',
  signatoryName: 'Manjunath Naik S',
  signatoryDesignation: 'Founder & CEO',
  signatoryPhone: '+91-9986703161',
  signatoryEmail: 'naik@shankaraonline.com',
  signatoryWebsite: 'www.shankaraonline.com',

  totalTentativeValue: 95000,
  status: 'Sent to Client',
  updatedAt: '2026-09-15',
};

export const sampleEcommerceQuotation: Quotation = {
  id: 'QUO-2026-002',
  quotationNumber: 'QUO/0002/2026-27',
  date: '2026-10-18',
  currency: 'INR',
  clientName: 'Nexus Retail Dynamics',
  clientCity: 'Mumbai',
  attention: 'Arunav Sengupta',
  subject: 'Commercial Proposal for High-Concurrency Headless Shopify Storefront & Omnichannel ERP Sync',
  brandName: 'Nexus D2C',
  salutation: 'Dear Mr. Sengupta,',
  introText:
    'Thank you for the detailed discussion regarding modernizing your direct-to-consumer digital infrastructure. This proposal outlines the architecture, implementation phases, and commercials for your next-generation headless e-commerce storefront.',

  objectiveHeading: '1. Strategic Objectives',
  objectiveIntro:
    'To transition Nexus D2C from legacy architecture into an ultra-fast headless storefront delivering sub-second page loads, automated multi-warehouse tally sync, and friction-free mobile checkout.',
  includePillars: true,
  pillars: [
    {
      id: 'p1',
      title: 'PERFORMANCE',
      description: 'Sub-second mobile checkout speed with modern Next.js and Shopify Storefront GraphQL API.',
    },
    {
      id: 'p2',
      title: 'AUTOMATION',
      description: 'Real-time two-way synchronization between online orders, warehouse inventory, and ERP.',
    },
    {
      id: 'p3',
      title: 'SCALABILITY',
      description: 'Fault-tolerant architecture capable of seamlessly handling 10,000+ concurrent flash sale visitors.',
    },
  ],
  includePhilosophy: true,
  philosophyTitle: '2. Technical Architecture Philosophy',
  philosophyPoints: [
    'Decoupled front-end to ensure 100% design flexibility and blazing fast performance.',
    'Automated webhooks with retry queuing for bulletproof order sync.',
    'Mobile-first responsive design tailored for Indian payment gateways and UPI 1-click flows.',
  ],

  scopeHeading: '3. Scope of Work',
  scopePhases: [
    {
      id: 'phase-1',
      phaseTitle: 'Phase 1: Architecture & UX Design',
      deliverables: [
        {
          id: 'del-1',
          title: 'UX Architecture & Design System',
          subtitle: 'High-fidelity Figma wireframes and mobile-first design system for core shopping journeys.',
          indicativeDeliverables: 'Figma components, design tokens, micro-interactions, responsive mobile views.',
        },
      ],
    },
    {
      id: 'phase-2',
      phaseTitle: 'Phase 2: Storefront Engineering & Integration',
      deliverables: [
        {
          id: 'del-2',
          title: 'Headless Storefront Development',
          subtitle: 'Production Next.js storefront deployed on high-performance edge network with Redis caching.',
          indicativeDeliverables: 'Product catalog, predictive search, cart drawer, Razorpay/Cashfree payment gateway.',
        },
      ],
    },
  ],

  commercialHeading: '4. Commercial Overview',
  commercialItems: [
    {
      id: 'c1',
      service: 'Storefront UX Design & Prototype',
      investment: 80000,
      billing: 'Milestone 1',
      taxNote: '+ 18% GST',
    },
    {
      id: 'c2',
      service: 'Headless Next.js Storefront Development',
      investment: 190000,
      billing: 'Milestone 2',
      taxNote: '+ 18% GST',
    },
    {
      id: 'c3',
      service: 'ERP & Automated Inventory Sync Engine',
      investment: 80000,
      billing: 'Milestone 3',
      taxNote: '+ 18% GST',
    },
  ],
  pricingNotesHeading: 'Pricing Notes & Exclusions (e.g. Ad Spend, GST, Domains)',
  pricingNotes:
    'Note: Shopify Plus subscription, cloud edge hosting, and third-party SMS/WhatsApp gateway charges are directly funded by the client.',
  clientInputsHeading: 'Client Inputs Required (Prerequisites)',
  clientInputsRequired:
    'Product catalog metadata, brand guidelines, ERP API access credentials, payment gateway keys, and DNS access.',

  termsHeading: '5. Engagement Terms',
  terms: [
    {
      title: 'Payment Schedule',
      detail: '35% advance against commencement; 35% on staging sign-off; 30% upon live launch and code handover.',
    },
    {
      title: 'Warranty Support',
      detail: '30 days of complimentary bug-fix warranty and hypercare post live deployment.',
    },
  ],
  additionalExclusions: [
    'Custom native mobile app development is not included in this web scope.',
    'Ongoing catalog management and product data entry are client responsibilities.',
  ],

  closingNote:
    'We are excited about the potential of partnering with Nexus Retail Dynamics to establish a benchmark D2C brand in the market.',
  thankYouNote: 'Thank you for your trust in our engineering capabilities.',
  signatoryName: 'Manjunath Naik S',
  signatoryDesignation: 'Founder & CEO',
  signatoryPhone: '+91-9986703161',
  signatoryEmail: 'naik@shankaraonline.com',
  signatoryWebsite: 'www.shankaraonline.com',

  totalTentativeValue: 350000,
  status: 'Draft',
  updatedAt: '2026-10-18',
};

const STORAGE_KEY_QUOTATIONS = 'shankara_quotations_data';

export const normalizeQuotationStatus = (status: string): 'Draft' | 'Sent to Client' => {
  return status === 'Sent to Client' ? 'Sent to Client' : 'Draft';
};

/**
 * Calculate Indian financial year suffix (e.g. 2026-27)
 */
export const getFinancialYearSuffix = (dateStr: string = new Date().toISOString()): string => {
  const d = new Date(dateStr);
  const year = isNaN(d.getFullYear()) ? new Date().getFullYear() : d.getFullYear();
  const month = isNaN(d.getMonth()) ? new Date().getMonth() + 1 : d.getMonth() + 1; // 1-12

  // Financial year runs April to March in India
  const fyStart = month >= 4 ? year : year - 1;
  const fyEnd = ((fyStart + 1) % 100).toString().padStart(2, '0');
  return `${fyStart}-${fyEnd}`;
};

/**
 * Migrate legacy format QUO/2026-27/001 -> QUO/0001/2026-27
 */
export const normalizeQuotationNumber = (num: string): string => {
  if (!num) return num;
  const legacyMatch = num.match(/^QUO\/(\d{4}-\d{2})\/(\d+)$/i);
  if (legacyMatch) {
    const fy = legacyMatch[1];
    const seq = legacyMatch[2].padStart(4, '0');
    return `QUO/${seq}/${fy}`;
  }
  return num;
};

/**
 * Generate next quotation number in QUO/0001/2026-27 format
 */
export const getNextQuotationNumber = (
  existingQuotations: Quotation[],
  dateStr: string = new Date().toISOString()
): string => {
  const fySuffix = getFinancialYearSuffix(dateStr);

  let maxSeq = 0;
  existingQuotations.forEach((q) => {
    if (q.quotationNumber) {
      // Check standard format: QUO/0001/2026-27
      const match = q.quotationNumber.match(/^QUO\/(\d+)\//i);
      if (match) {
        const seq = parseInt(match[1], 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      } else {
        // Also check legacy format: QUO/2026-27/001
        const legacyMatch = q.quotationNumber.match(/^QUO\/[^\/]+\/(\d+)$/i);
        if (legacyMatch) {
          const seq = parseInt(legacyMatch[1], 10);
          if (!isNaN(seq) && seq > maxSeq) {
            maxSeq = seq;
          }
        }
      }
    }
  });

  const nextSeq = maxSeq + 1;
  const seqStr = String(nextSeq).padStart(4, '0');
  return `QUO/${seqStr}/${fySuffix}`;
};

export const syncQuotationToProposal = (quotation: Quotation) => {
  if (quotation.status !== 'Sent to Client') return;
  try {
    const raw = localStorage.getItem('shankara_proposals_data');
    let proposals: Proposal[] = [];
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        proposals = Array.isArray(parsed) ? parsed : [...initialProposals];
      } catch {
        proposals = [...initialProposals];
      }
    } else {
      proposals = [...initialProposals];
    }

    const existingIndex = proposals.findIndex(
      (p) =>
        p.quotationId === quotation.id ||
        p.id === `PROP-${quotation.id}` ||
        p.quotationNumber === quotation.quotationNumber ||
        (p.clientName.trim().toLowerCase() === quotation.clientName.trim().toLowerCase() &&
          p.serviceTitle.trim().toLowerCase() === (quotation.subject || '').trim().toLowerCase())
    );

    if (existingIndex >= 0) {
      const existing = proposals[existingIndex];
      proposals[existingIndex] = {
        ...existing,
        clientName: quotation.clientName || existing.clientName,
        contactPerson: quotation.attention || existing.contactPerson,
        location: quotation.clientCity || existing.location,
        serviceTitle: quotation.subject || existing.serviceTitle,
        serviceDescription:
          quotation.introText || quotation.objectiveIntro || existing.serviceDescription,
        tentativeValue: quotation.totalTentativeValue || existing.tentativeValue,
        currency: quotation.currency || existing.currency || 'INR',
        sentDate: quotation.date || existing.sentDate,
        quotationId: quotation.id,
        quotationNumber: quotation.quotationNumber,
        status: existing.status === 'Declined' ? 'Sent to Client' : existing.status || 'Sent to Client',
        updatedAt: new Date().toISOString().split('T')[0],
      };
    } else {
      const newProposal: Proposal = {
        id: `PROP-${quotation.id}`,
        clientName: quotation.clientName,
        contactPerson: quotation.attention || 'Authorized Representative',
        email: '',
        phone: '',
        location: quotation.clientCity || 'Bengaluru, Karnataka',
        serviceTitle:
          quotation.subject ||
          (quotation.brandName
            ? `${quotation.brandName} Growth Proposal`
            : 'Commercial Pitch & Scope of Services'),
        serviceDescription:
          quotation.introText ||
          quotation.objectiveIntro ||
          'Comprehensive commercial proposal, phased deliverables, and scope of services.',
        tentativeValue: quotation.totalTentativeValue,
        currency: quotation.currency || 'INR',
        billingType: 'One-Time Project',
        billingEntity: 'COMPANY',
        probability: 75,
        status: 'Sent to Client',
        sentDate: quotation.date || new Date().toISOString().split('T')[0],
        expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        notes: `Created from Quotation ${quotation.quotationNumber}`,
        quotationId: quotation.id,
        quotationNumber: quotation.quotationNumber,
        createdAt: quotation.date || new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      };
      proposals.unshift(newProposal);
    }

    localStorage.setItem('shankara_proposals_data', JSON.stringify(proposals));
  } catch (e) {
    console.error('Failed to sync quotation to proposal:', e);
  }
};

export const getStoredQuotations = (): Quotation[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_QUOTATIONS);
    if (!raw) return [sampleStelaarcQuotation, sampleEcommerceQuotation];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((q: any) => ({
        ...q,
        currency: q.currency || 'INR',
        quotationNumber: normalizeQuotationNumber(q.quotationNumber),
        status: normalizeQuotationStatus(q.status),
      }));
    }
    return [sampleStelaarcQuotation, sampleEcommerceQuotation];
  } catch (e) {
    return [sampleStelaarcQuotation, sampleEcommerceQuotation];
  }
};

export const saveStoredQuotations = (quotations: Quotation[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_QUOTATIONS, JSON.stringify(quotations));
  } catch (e) {
    console.error('Failed to save quotations:', e);
  }
};
