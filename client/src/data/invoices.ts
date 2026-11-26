import { getStoredClients } from '../components/ClientList';
import { formatDateDMY } from '../utils/date';
import { isKarnatakaLocation, calculateTaxes } from '../utils/gst';
import { getStoredBillingProfiles } from './profile';

export interface InvoiceLineItem {
  id: string;
  desc: string;
  sac?: string;
  units: number;
  rate: number;
}

export interface Invoice {
  id: string; // e.g. '0021/2026-27'
  client: string;
  clientId?: string;
  date: string; // YYYY-MM-DD
  amount: number; // total amount
  subtotal: number;
  gst: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  isInterState?: boolean;
  status: 'Paid' | 'Pending' | 'Hold' | 'Cancelled' | 'Draft' | 'Overdue';
  type: 'COMPANY' | 'PERSONAL';
  items: InvoiceLineItem[];
  recurringTemplateId?: string;
  notes?: string;
}

export interface RecurringInvoiceTemplate {
  id: string;
  title: string;
  clientName: string;
  clientId?: string;
  type: 'COMPANY' | 'PERSONAL';
  frequency: 'Monthly' | 'Quarterly' | 'Yearly';
  dayOfMonth: number; // 1-31
  items: InvoiceLineItem[];
  subtotal: number;
  gst: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  isInterState?: boolean;
  total: number;
  isActive: boolean;
  notes?: string;
}

const STORAGE_KEY_INVOICES = 'invoice_admin_invoices';
const STORAGE_KEY_RECURRING = 'invoice_admin_recurring_invoices';

export const initialInvoices: Invoice[] = [
  {
    id: '0021/2026-27',
    client: 'M/s Tamagna Personalcare Pvt Ltd',
    date: '2026-08-16',
    amount: 24780,
    subtotal: 21000,
    gst: 3780,
    status: 'Paid',
    type: 'COMPANY',
    recurringTemplateId: 'rec-inv-1',
    items: [
      { id: 'item-1', desc: 'Social media management (July-August 2026)', sac: '998361', units: 1, rate: 21000 }
    ],
  },
  {
    id: '0022/2026-27',
    client: 'The Art of Living Foundation',
    date: '2026-09-07',
    amount: 18000,
    subtotal: 18000,
    gst: 0,
    status: 'Pending',
    type: 'PERSONAL',
    recurringTemplateId: 'rec-inv-2',
    items: [
      { id: 'item-2a', desc: 'Digital Marketing Services for August 2026', units: 1, rate: 12000 },
      { id: 'item-2b', desc: 'Content Writing Services - August 2026 (Blogs for artofliving.sg)', units: 2, rate: 3000 },
    ],
  },
  {
    id: '0023/2026-27',
    client: 'M/s Tamagna Personalcare Pvt Ltd',
    date: '2026-10-05',
    amount: 29500,
    subtotal: 25000,
    gst: 4500,
    status: 'Paid',
    type: 'COMPANY',
    recurringTemplateId: 'rec-inv-1',
    items: [
      { id: 'item-3', desc: 'Performance Marketing & Creative Retainer (October 2026)', sac: '998361', units: 1, rate: 25000 }
    ],
  },
  {
    id: '0024/2026-27',
    client: 'The Art of Living Foundation',
    date: '2026-10-12',
    amount: 22000,
    subtotal: 22000,
    gst: 0,
    status: 'Paid',
    type: 'PERSONAL',
    recurringTemplateId: 'rec-inv-2',
    items: [
      { id: 'item-4', desc: 'Global Web Portal & Event Campaign Support (October 2026)', units: 1, rate: 22000 }
    ],
  },
  {
    id: '0025/2026-27',
    client: 'Tech Solutions Inc',
    date: '2026-10-18',
    amount: 41300,
    subtotal: 35000,
    gst: 6300,
    status: 'Paid',
    type: 'COMPANY',
    recurringTemplateId: 'rec-inv-3',
    items: [
      { id: 'item-5a', desc: 'Dedicated Engineering & Maintenance SLA', sac: '998314', units: 1, rate: 30000 },
      { id: 'item-5b', desc: 'Server Monitoring & Backup Retainer', sac: '998315', units: 1, rate: 5000 },
    ],
  },
  {
    id: '0026/2026-27',
    client: 'M/s Tamagna Personalcare Pvt Ltd',
    date: '2026-11-02',
    amount: 33040,
    subtotal: 28000,
    gst: 5040,
    status: 'Pending',
    type: 'COMPANY',
    recurringTemplateId: 'rec-inv-1',
    items: [
      { id: 'item-6', desc: 'Brand Retainer & Festive Campaign Blitz (November 2026)', sac: '998361', units: 1, rate: 28000 }
    ],
  },
  {
    id: '0027/2026-27',
    client: 'The Art of Living Foundation',
    date: '2026-11-05',
    amount: 20000,
    subtotal: 20000,
    gst: 0,
    status: 'Paid',
    type: 'PERSONAL',
    recurringTemplateId: 'rec-inv-2',
    items: [
      { id: 'item-7', desc: 'Singapore & APAC Editorial Retainer (November 2026)', units: 1, rate: 20000 }
    ],
  },
  {
    id: '0028/2026-27',
    client: 'Tech Solutions Inc',
    date: '2026-11-10',
    amount: 41300,
    subtotal: 35000,
    gst: 6300,
    status: 'Pending',
    type: 'COMPANY',
    recurringTemplateId: 'rec-inv-3',
    items: [
      { id: 'item-8a', desc: 'Dedicated Engineering & Maintenance SLA (November 2026)', sac: '998314', units: 1, rate: 30000 },
      { id: 'item-8b', desc: 'Server Monitoring & Backup Retainer', sac: '998315', units: 1, rate: 5000 },
    ],
  },
  {
    id: '0029/2026-27',
    client: 'M/s Tamagna Personalcare Pvt Ltd',
    date: '2026-07-15',
    amount: 24780,
    subtotal: 21000,
    gst: 3780,
    status: 'Paid',
    type: 'COMPANY',
    items: [
      { id: 'item-9', desc: 'Social Media & Influencer Management - July 2026', sac: '998361', units: 1, rate: 21000 }
    ],
  },
  {
    id: '0030/2026-27',
    client: 'The Art of Living Foundation',
    date: '2026-07-20',
    amount: 18000,
    subtotal: 18000,
    gst: 0,
    status: 'Paid',
    type: 'PERSONAL',
    items: [
      { id: 'item-10', desc: 'Digital Marketing & Content Strategy - July 2026', units: 1, rate: 18000 }
    ],
  },
];

export const initialRecurringTemplates: RecurringInvoiceTemplate[] = [
  {
    id: 'rec-inv-1',
    title: 'Monthly Performance Marketing & Brand Retainer',
    clientName: 'M/s Tamagna Personalcare Pvt Ltd',
    type: 'COMPANY',
    frequency: 'Monthly',
    dayOfMonth: 1,
    isActive: true,
    isInterState: false,
    items: [
      { id: 'item-1', desc: 'Social media management (July-August 2026)', sac: '998361', units: 1, rate: 21000 }
    ],
    subtotal: 21000,
    cgst: 1890,
    sgst: 1890,
    igst: 0,
    gst: 3780,
    total: 24780,
    notes: 'Intra-State Karnataka retainer due on 1st. 9% CGST + 9% SGST applicable.',
  },
  {
    id: 'rec-inv-2',
    title: 'Web Maintenance & Cloud Support Retainer',
    clientName: 'The Art of Living Foundation',
    type: 'PERSONAL',
    frequency: 'Monthly',
    dayOfMonth: 5,
    isActive: true,
    isInterState: false,
    items: [
      { id: 'item-2a', desc: 'Digital Marketing Services for August 2026', units: 1, rate: 12000 },
      { id: 'item-2b', desc: 'Content Writing Services - August 2026 (Blogs for artofliving.sg)', units: 2, rate: 3000 },
    ],
    subtotal: 18000,
    cgst: 0,
    sgst: 0,
    igst: 0,
    gst: 0,
    total: 18000,
    notes: 'Non-GST personal consulting agreement.',
  },
  {
    id: 'rec-inv-3',
    title: 'Enterprise Software SLA & Cloud Retainer',
    clientName: 'Tech Solutions Inc',
    type: 'COMPANY',
    frequency: 'Monthly',
    dayOfMonth: 10,
    isActive: true,
    isInterState: true,
    items: [
      { id: 'item-3a', desc: 'Dedicated Engineering & Maintenance SLA', sac: '998314', units: 1, rate: 30000 },
      { id: 'item-3b', desc: 'Server Monitoring & Backup Retainer', sac: '998315', units: 1, rate: 5000 },
    ],
    subtotal: 35000,
    cgst: 0,
    sgst: 0,
    igst: 6300,
    gst: 6300,
    total: 41300,
    notes: 'Inter-State client (Mumbai, Maharashtra). 18% IGST applicable.',
  },
];

export const getStoredInvoices = (): Invoice[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INVOICES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure standard seed invoices are merged by ID if missing
        const existingIds = new Set(parsed.map((p: Invoice) => p.id));
        const missingInitial = initialInvoices.filter((init) => !existingIds.has(init.id));
        if (missingInitial.length > 0) {
          const merged = [...parsed, ...missingInitial];
          localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(merged));
          return merged;
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading invoices from localStorage', err);
  }
  return initialInvoices;
};

export const saveStoredInvoices = (invoices: Invoice[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(invoices));
    window.dispatchEvent(new Event('invoices_updated'));
  } catch (err) {
    console.error('Error saving invoices to localStorage', err);
  }
};

export const getStoredRecurringTemplates = (): RecurringInvoiceTemplate[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECURRING);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading recurring invoices from localStorage', err);
  }
  return initialRecurringTemplates;
};

export const saveStoredRecurringTemplates = (templates: RecurringInvoiceTemplate[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_RECURRING, JSON.stringify(templates));
    window.dispatchEvent(new Event('recurring_invoices_updated'));
  } catch (err) {
    console.error('Error saving recurring invoices to localStorage', err);
  }
};

/**
 * Generate next sequence number in Indian financial year format, e.g. 0023/2026-27
 */
export const getNextInvoiceNumber = (existingInvoices: Invoice[], dateStr: string = new Date().toISOString()): string => {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1-12
  
  // Financial year runs April to March in India
  const fyStart = month >= 4 ? year : year - 1;
  const fyEnd = (fyStart + 1) % 100;
  const fySuffix = `${fyStart}-${fyEnd < 10 ? '0' : ''}${fyEnd}`;

  // Find max number for this FY
  let maxSeq = 20; // baseline
  existingInvoices.forEach((inv) => {
    if (inv.id && inv.id.includes(`/${fySuffix}`)) {
      const match = inv.id.match(/^(\d+)\//);
      if (match) {
        const seq = parseInt(match[1], 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }
  });

  const nextSeq = maxSeq + 1;
  const seqStr = String(nextSeq).padStart(4, '0');
  return `${seqStr}/${fySuffix}`;
};

/**
 * Formats full invoice data for react-pdf generator
 */
export const generateFullInvoiceData = (inv: Invoice) => {
  const clients = getStoredClients();
  const matchedClient = clients.find((c) => c.name.toLowerCase() === inv.client.toLowerCase());
  const profiles = getStoredBillingProfiles();
  const activeProfile = inv.type === 'COMPANY' ? profiles.company : profiles.personal;

  const subtotal = inv.subtotal ?? inv.amount;
  const isInterState = inv.isInterState !== undefined 
    ? inv.isInterState 
    : !isKarnatakaLocation(matchedClient);

  const taxes = calculateTaxes(subtotal, inv.type, isInterState);
  const cgst = inv.cgst !== undefined ? inv.cgst : taxes.cgst;
  const sgst = inv.sgst !== undefined ? inv.sgst : taxes.sgst;
  const igst = inv.igst !== undefined ? inv.igst : taxes.igst;
  const total = inv.amount ?? (subtotal + taxes.totalGst);

  return {
    type: inv.type,
    isInterState,
    companyName: activeProfile.legalName,
    companyTradeName: activeProfile.tradeName,
    companyAddress: activeProfile.address,
    companyGst: inv.type === 'COMPANY' ? activeProfile.gstin : undefined,
    companyPan: activeProfile.pan,
    companyEmail: activeProfile.email,
    companyPhone: activeProfile.phone,
    signatory: activeProfile.authorizedSignatory,
    invoiceNumber: inv.id,
    date: formatDateDMY(inv.date),
    rawDate: inv.date,
    clientName: inv.client,
    clientAddress: matchedClient?.address || (inv.type === 'COMPANY'
      ? '33, Gerupalya, Kumbalagodu, Behind KIADB Phase-2, Bangalore, Karnataka – 560074'
      : '#433 Race Course Road, Farrer Park, Singapore, 218679'),
    clientGst: inv.type === 'COMPANY' ? (matchedClient?.gstin || '29ABICS5363G1ZY') : undefined,
    items: (inv.items && inv.items.length > 0)
      ? inv.items.map((it) => ({
          sac: it.sac || '998361',
          description: it.desc,
          units: it.units,
          rate: it.rate,
          amount: it.units * it.rate,
        }))
      : [
          inv.type === 'COMPANY'
            ? { sac: '998361', description: 'Social media management (July-August 2026)', units: 1, rate: inv.amount, amount: inv.amount }
            : { sac: '', description: 'Digital Marketing Services for August 2026', units: 1, rate: inv.amount, amount: inv.amount }
        ],
    paymentDetails: {
      accountName: activeProfile.bankDetails.accountName,
      accountNo: activeProfile.bankDetails.accountNumber,
      bankName: activeProfile.bankDetails.bankName,
      branch: activeProfile.bankDetails.branch,
      ifsc: activeProfile.bankDetails.ifsc,
      pan: activeProfile.pan,
      upi: activeProfile.bankDetails.upiId,
      qrCodeImage: activeProfile.bankDetails.qrCodeImage,
    },
    subTotal: subtotal,
    cgst,
    sgst,
    igst,
    total,
  };
};


export interface CreditNote {
  id: string; // e.g. 'CN-0001/2026-27'
  originalInvoiceId: string; // e.g. '0021/2026-27'
  originalInvoiceDate: string; // e.g. '2026-08-16'
  client: string;
  clientId?: string;
  date: string; // YYYY-MM-DD
  reason: string; // Reason for credit note
  type: 'COMPANY' | 'PERSONAL';
  items: InvoiceLineItem[];
  subtotal: number;
  gst: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  isInterState?: boolean;
  amount: number; // total credited amount
  notes?: string;
}

const STORAGE_KEY_CREDIT_NOTES = 'invoice_admin_credit_notes';

export const initialCreditNotes: CreditNote[] = [
  {
    id: 'CN-0001/2026-27',
    originalInvoiceId: '0021/2026-27',
    originalInvoiceDate: '2026-08-16',
    client: 'M/s Tamagna Personalcare Pvt Ltd',
    date: '2026-08-25',
    reason: 'Post-Sale Discount / Commercial Settlement',
    type: 'COMPANY',
    items: [
      { id: 'cn-item-1', desc: 'Commercial Discount on Performance Marketing Retainer', sac: '998311', units: 1, rate: 5000 }
    ],
    subtotal: 5000,
    gst: 900,
    amount: 5900,
    notes: 'Settlement agreed for August marketing variance.',
  }
];

export const getStoredCreditNotes = (): CreditNote[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CREDIT_NOTES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading credit notes from localStorage', err);
  }
  return initialCreditNotes;
};

export const saveStoredCreditNotes = (creditNotes: CreditNote[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_CREDIT_NOTES, JSON.stringify(creditNotes));
    window.dispatchEvent(new Event('credit_notes_updated'));
  } catch (err) {
    console.error('Error saving credit notes to localStorage', err);
  }
};

export const getNextCreditNoteNumber = (existingCNs: CreditNote[], dateStr: string = new Date().toISOString()): string => {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const fyStart = month >= 4 ? year : year - 1;
  const fyEnd = (fyStart + 1) % 100;
  const fySuffix = `${fyStart}-${fyEnd < 10 ? '0' : ''}${fyEnd}`;

  let maxSeq = 0;
  existingCNs.forEach((cn) => {
    if (cn.id && cn.id.includes(`/${fySuffix}`)) {
      const match = cn.id.match(/^CN-(\d+)\//);
      if (match) {
        const seq = parseInt(match[1], 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }
  });

  const nextSeq = maxSeq + 1;
  const seqStr = String(nextSeq).padStart(4, '0');
  return `CN-${seqStr}/${fySuffix}`;
};

export const generateFullCreditNoteData = (cn: CreditNote) => {
  const clients = getStoredClients();
  const matchedClient = clients.find((c) => c.name.toLowerCase() === cn.client.toLowerCase());
  const profiles = getStoredBillingProfiles();
  const activeProfile = cn.type === 'COMPANY' ? profiles.company : profiles.personal;

  const subtotal = cn.subtotal ?? cn.amount;
  const isInterState = cn.isInterState !== undefined 
    ? cn.isInterState 
    : !isKarnatakaLocation(matchedClient);

  const taxes = calculateTaxes(subtotal, cn.type, isInterState);
  const cgst = cn.cgst !== undefined ? cn.cgst : taxes.cgst;
  const sgst = cn.sgst !== undefined ? cn.sgst : taxes.sgst;
  const igst = cn.igst !== undefined ? cn.igst : taxes.igst;
  const total = cn.amount ?? (subtotal + taxes.totalGst);

  const fullAddress = [
    activeProfile.address,
    activeProfile.city ? `${activeProfile.city}, ${activeProfile.state || ''} ${activeProfile.pincode || ''}`.trim() : '',
    'India'
  ].filter(Boolean).join('\n');

  return {
    type: cn.type,
    isInterState,
    companyName: activeProfile.legalName,
    companyTradeName: activeProfile.tradeName,
    companyAddress: fullAddress || activeProfile.address,
    companyGst: activeProfile.gstin,
    companyPan: activeProfile.pan,
    companyEmail: activeProfile.email,
    companyPhone: activeProfile.phone,
    signatory: activeProfile.authorizedSignatory,
    creditNoteNumber: cn.id,
    originalInvoiceNumber: cn.originalInvoiceId,
    originalInvoiceDate: formatDateDMY(cn.originalInvoiceDate),
    date: formatDateDMY(cn.date),
    clientName: cn.client,
    clientAddress: matchedClient?.address || 'Client Address Line 1\nClient Address Line 2',
    clientGst: matchedClient?.gstin || (cn.type === 'COMPANY' ? (activeProfile.gstin || '29ABCDE1234F1Z5') : undefined),
    reason: cn.reason,
    items: (cn.items && cn.items.length > 0)
      ? cn.items.map((it) => ({
          description: it.desc,
          units: it.units,
          rate: it.rate,
          amount: it.units * it.rate,
        }))
      : [
          { description: 'Credit Adjustment', units: 1, rate: cn.amount, amount: cn.amount }
        ],
    subTotal: subtotal,
    cgst,
    sgst,
    igst,
    total,
    notes: cn.notes,
  };
};
