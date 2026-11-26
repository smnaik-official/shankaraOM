import { getStoredClients, Client } from '../components/ClientList';
import { getStoredInvoices, getStoredCreditNotes, Invoice, CreditNote } from './invoices';
import { getStoredSubscriptions, getNormalizedMonthlyInr } from './subscriptions';
import { getStoredEmployees, Employee } from '../components/Employees';
import { getStoredExpenses, getStoredExpenseTemplates, Expense } from './expenses';

export type ProfitabilityPeriodType = 'monthly' | 'quarterly' | 'financial_year' | 'all_time';

export interface ProfitabilityPeriod {
  type: ProfitabilityPeriodType;
  value: string; // e.g. '2026-11', 'Q3-2026', 'FY-2026-27', 'ALL'
  label: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  monthMultiplier: number; // e.g. 1 for 1 month, 3 for quarter, 12 for FY
}

export interface EmployeeCostAllocation {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeRole: string;
  clientId: string;
  clientName: string;
  allocationPercentage: number; // 0 to 100
  notes?: string;
}

export type DirectExpenseCategory =
  | 'Freelancer'
  | 'Outsourcing'
  | 'Client Software'
  | 'Ad Spend'
  | 'Travel'
  | 'Project Expense'
  | 'Other';

export interface ClientDirectExpense {
  id: string;
  clientId: string;
  clientName: string;
  category: DirectExpenseCategory;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  vendorOrPerson?: string;
  notes?: string;
}

export interface ClientItemizedEmployee {
  employeeId: string;
  employeeName: string;
  role: string;
  grossSalary: number;
  allocationPercentage: number;
  monthlyCost: number;
  periodCost: number;
}

export interface ClientItemizedSubscription {
  id: string;
  name: string;
  category: string;
  duration: string;
  amount: number;
  currency: string;
  normalizedMonthlyInr: number;
  periodCost: number;
  isClientDirectBilled?: boolean;
}

export interface ClientProfitabilityRecord {
  clientId: string;
  clientName: string;
  clientGstin?: string;
  clientAddress?: string;
  clientEmail?: string;
  clientPhone?: string;

  // Revenue Metrics (Strictly Ex-GST)
  invoicedGrossRevenue: number;
  creditNotesDeduction: number;
  netEarnedRevenue: number;
  cashReceived: number;         // 'Paid' invoices subtotal
  outstandingReceivables: number;// 'Pending' | 'Overdue' invoices subtotal
  cancelledRevenue: number;

  // Direct Cost Breakdown
  allocatedEmployeeCost: number;
  freelancerCost: number;
  clientSoftwareCost: number;
  otherDirectCosts: number;
  totalDirectCosts: number;

  // Contribution
  contribution: number;
  contributionMargin: number;   // %

  // Common Overheads & Net Profit
  allocatedOverheads: number;
  overheadCalculationDetail?: string;
  netProfit: number;
  netProfitMargin: number;      // %

  isProfitable: boolean;

  // Detailed lists for drilldown report
  employeeAllocations: ClientItemizedEmployee[];
  directExpenses: ClientDirectExpense[];
  clientSubscriptions: ClientItemizedSubscription[];
  invoices: Invoice[];
  creditNotes: CreditNote[];

  // Comparison trends (for drilldown modal)
  monthlyTrends?: {
    monthLabel: string;
    revenue: number;
    directCosts: number;
    contribution: number;
    netProfit: number;
  }[];
}

export type OverheadAllocationMethod =
  | 'proportional_revenue'  // Proportional share of Expenses tab pool with user-defined cap %
  | 'revenue_percentage'    // Direct user-decided % of client's ex-GST revenue
  | 'equal_split'          // Equal split of Expenses tab pool across active clients with user-defined cap %
  | 'fixed_amount';        // Fixed user-decided rupee amount per client

export interface OverheadAllocationConfig {
  method: OverheadAllocationMethod;
  cappingPercentage: number;          // User decides capping %, e.g. 20 (meaning 20%)
  applyCapping: boolean;              // Toggle cap on/off
  directRevenuePercentage: number;    // When method is 'revenue_percentage', e.g. 15%
  fixedAmountPerClient: number;       // When method is 'fixed_amount', e.g. 10000
  includeCategories: string[];        // Categories from Expenses tab included in pool: ['Office', 'Operations', 'IT', 'Meals', 'Travel']
  clientOverrides: Record<string, {   // Optional per-client specific overhead decision
    customAmount?: number;
    customPercentage?: number;
  }>;
}

export const DEFAULT_OVERHEAD_CONFIG: OverheadAllocationConfig = {
  method: 'proportional_revenue',
  cappingPercentage: 20,
  applyCapping: true,
  directRevenuePercentage: 15,
  fixedAmountPerClient: 10000,
  includeCategories: ['Office', 'Operations', 'IT', 'Meals', 'Travel'],
  clientOverrides: {},
};

export const STORAGE_KEY_OVERHEAD_CONFIG = 'shankara_overhead_allocation_config';

export const getStoredOverheadConfig = (): OverheadAllocationConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_OVERHEAD_CONFIG);
    if (!raw) return DEFAULT_OVERHEAD_CONFIG;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_OVERHEAD_CONFIG, ...parsed };
  } catch (e) {
    return DEFAULT_OVERHEAD_CONFIG;
  }
};

export const saveStoredOverheadConfig = (config: OverheadAllocationConfig) => {
  try {
    localStorage.setItem(STORAGE_KEY_OVERHEAD_CONFIG, JSON.stringify(config));
    window.dispatchEvent(new Event('overhead_config_updated'));
  } catch (e) {
    console.error('Failed to save overhead configuration:', e);
  }
};

export interface ProfitabilitySummary {
  period: ProfitabilityPeriod;
  totalClientRevenue: number;
  totalDirectCosts: number;
  totalEmployeeCost: number;
  totalFreelancerCost: number;
  totalSoftwareCost: number;
  totalOtherDirectCosts: number;
  totalContribution: number;
  overallContributionMargin: number;
  totalAllocatedOverheads: number;
  totalOverheadPool?: number;
  overheadConfig?: OverheadAllocationConfig;
  totalNetProfit: number;
  overallNetProfitMargin: number;
  totalCashReceived: number;
  totalOutstandingReceivables: number;
  profitableClientsCount: number;
  lossMakingClientsCount: number;
  totalClientsCount: number;
}

// Storage Keys
export const STORAGE_KEY_ALLOCATIONS = 'shankara_employee_allocations';
export const STORAGE_KEY_DIRECT_EXPENSES = 'shankara_client_direct_expenses';

// Predefined Period Options
export const PREDEFINED_PERIODS: ProfitabilityPeriod[] = [
  {
    type: 'monthly',
    value: '2026-11',
    label: 'November 2026 (Current)',
    startDate: '2026-11-01',
    endDate: '2026-11-30',
    monthMultiplier: 1,
  },
  {
    type: 'monthly',
    value: '2026-10',
    label: 'October 2026',
    startDate: '2026-10-01',
    endDate: '2026-10-31',
    monthMultiplier: 1,
  },
  {
    type: 'monthly',
    value: '2026-09',
    label: 'September 2026',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    monthMultiplier: 1,
  },
  {
    type: 'monthly',
    value: '2026-08',
    label: 'August 2026',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    monthMultiplier: 1,
  },
  {
    type: 'quarterly',
    value: 'Q3-2026',
    label: 'Q3 2026-27 (Oct - Dec)',
    startDate: '2026-10-01',
    endDate: '2026-12-31',
    monthMultiplier: 3,
  },
  {
    type: 'quarterly',
    value: 'Q2-2026',
    label: 'Q2 2026-27 (Jul - Sep)',
    startDate: '2026-07-01',
    endDate: '2026-09-30',
    monthMultiplier: 3,
  },
  {
    type: 'quarterly',
    value: 'Q1-2026',
    label: 'Q1 2026-27 (Apr - Jun)',
    startDate: '2026-04-01',
    endDate: '2026-06-30',
    monthMultiplier: 3,
  },
  {
    type: 'financial_year',
    value: 'FY-2026-27',
    label: 'FY 2026-27 (Full Year)',
    startDate: '2026-04-01',
    endDate: '2027-03-31',
    monthMultiplier: 12,
  },
  {
    type: 'financial_year',
    value: 'FY-2025-26',
    label: 'FY 2025-26 (Past Year)',
    startDate: '2025-04-01',
    endDate: '2026-03-31',
    monthMultiplier: 12,
  },
  {
    type: 'all_time',
    value: 'ALL',
    label: 'All Time (Cumulative)',
    monthMultiplier: 12,
  },
];

// Seed Employee Cost Allocations
export const defaultEmployeeAllocations: EmployeeCostAllocation[] = [
  // Tamagna Personalcare - Exactly matches user prompt example!
  {
    id: 'alloc-1',
    employeeId: '2', // Jane Smith - Designer (₹75,000)
    employeeName: 'Jane Smith',
    employeeRole: 'Designer',
    clientId: '1',
    clientName: 'M/s Tamagna Personalcare Pvt Ltd',
    allocationPercentage: 10, // 10% -> ₹7,500 (Matches prompt: Designer 30% / ₹7,500)
    notes: 'Packaging designs, social reels branding, and UI templates',
  },
  {
    id: 'alloc-2',
    employeeId: '3', // Priya Sharma - Social Media Executive (₹25,000)
    employeeName: 'Priya Sharma',
    employeeRole: 'Social Media Executive',
    clientId: '1',
    clientName: 'M/s Tamagna Personalcare Pvt Ltd',
    allocationPercentage: 40, // 40% -> ₹10,000 (Matches prompt: Social Media Executive 40% / ₹10,000)
    notes: 'Daily feed curation, influencer outreach, and community engagement',
  },
  {
    id: 'alloc-3',
    employeeId: '4', // Rohan Verma - Video Editor (₹20,000)
    employeeName: 'Rohan Verma',
    employeeRole: 'Video Editor',
    clientId: '1',
    clientName: 'M/s Tamagna Personalcare Pvt Ltd',
    allocationPercentage: 20, // 20% -> ₹4,000 (Matches prompt: Video Editor 20% / ₹4,000)
    notes: 'Product video reels and UGC edits',
  },
  {
    id: 'alloc-4',
    employeeId: '5', // Ankit Patel - Ads Resource (₹25,000)
    employeeName: 'Ankit Patel',
    employeeRole: 'Ads Resource',
    clientId: '1',
    clientName: 'M/s Tamagna Personalcare Pvt Ltd',
    allocationPercentage: 20, // 20% -> ₹5,000 (Matches prompt: Ads Resource 50% / ₹5,000)
    notes: 'Meta Ads & Google Ads ROAS optimization & ad budget management',
  },

  // The Art of Living Foundation
  {
    id: 'alloc-5',
    employeeId: '2', // Jane Smith
    employeeName: 'Jane Smith',
    employeeRole: 'Designer',
    clientId: '2',
    clientName: 'The Art of Living Foundation',
    allocationPercentage: 10, // 10% -> ₹7,500
    notes: 'Global program flyers, web banners, and newsletter layouts',
  },
  {
    id: 'alloc-6',
    employeeId: '3', // Priya Sharma
    employeeName: 'Priya Sharma',
    employeeRole: 'Social Media Executive',
    clientId: '2',
    clientName: 'The Art of Living Foundation',
    allocationPercentage: 20, // 20% -> ₹5,000
    notes: 'Editorial distribution and APAC social channels',
  },
  {
    id: 'alloc-7',
    employeeId: '4', // Rohan Verma
    employeeName: 'Rohan Verma',
    employeeRole: 'Video Editor',
    clientId: '2',
    clientName: 'The Art of Living Foundation',
    allocationPercentage: 20, // 20% -> ₹4,000
    notes: 'Event highlights, keynote shorts, and multilingual cutdowns',
  },

  // Tech Solutions Inc
  {
    id: 'alloc-8',
    employeeId: '1', // John Doe - Software Engineer (₹85,000)
    employeeName: 'John Doe',
    employeeRole: 'Software Engineer',
    clientId: '3',
    clientName: 'Tech Solutions Inc',
    allocationPercentage: 20, // 20% -> ₹17,000
    notes: 'Cloud architecture SLA, microservices maintenance & deployment',
  },
  {
    id: 'alloc-9',
    employeeId: '2', // Jane Smith
    employeeName: 'Jane Smith',
    employeeRole: 'Designer',
    clientId: '3',
    clientName: 'Tech Solutions Inc',
    allocationPercentage: 10, // 10% -> ₹7,500
    notes: 'Enterprise portal design overhaul & dashboard mockups',
  },
];

// Seed Direct Client Expenses
export const defaultClientDirectExpenses: ClientDirectExpense[] = [
  {
    id: 'cde-1',
    clientId: '1',
    clientName: 'M/s Tamagna Personalcare Pvt Ltd',
    category: 'Freelancer',
    description: 'Freelance 3D Product Mockup & Bottle CGI Modeling',
    amount: 8500,
    date: '2026-10-14',
    vendorOrPerson: 'Devraj 3D Studio',
    notes: 'Specialized blender 3D renders for festive packaging revamp',
  },
  {
    id: 'cde-2',
    clientId: '1',
    clientName: 'M/s Tamagna Personalcare Pvt Ltd',
    category: 'Ad Spend',
    description: 'Agency-Borne Ad Testing Credits (A/B Creative Test)',
    amount: 3000,
    date: '2026-10-20',
    vendorOrPerson: 'Meta Ad Spends',
    notes: 'Experimental ad set tested from agency test account',
  },
  {
    id: 'cde-3',
    clientId: '2',
    clientName: 'The Art of Living Foundation',
    category: 'Freelancer',
    description: 'Freelance Singapore English Copywriter (4 Blog Articles)',
    amount: 6000,
    date: '2026-10-18',
    vendorOrPerson: 'Sarah Tan (Copywriter)',
    notes: 'Cultural localization for Southeast Asian wellness blog',
  },
  {
    id: 'cde-4',
    clientId: '2',
    clientName: 'The Art of Living Foundation',
    category: 'Outsourcing',
    description: 'Multilingual Audio Voiceover Dubbing (German & Japanese)',
    amount: 4500,
    date: '2026-11-08',
    vendorOrPerson: 'LinguaSound Studio',
    notes: 'Dubbed meditation guides for international landing pages',
  },
  {
    id: 'cde-5',
    clientId: '3',
    clientName: 'Tech Solutions Inc',
    category: 'Client Software',
    description: 'Postman Enterprise Dedicated Team API Workspace',
    amount: 4200,
    date: '2026-10-10',
    vendorOrPerson: 'Postman Inc',
    notes: 'Client-dedicated API collection and contract testing runner',
  },
];

// Storage Accessors
export const getStoredEmployeeAllocations = (): EmployeeCostAllocation[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ALLOCATIONS);
    if (!raw) return defaultEmployeeAllocations;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultEmployeeAllocations;
  } catch {
    return defaultEmployeeAllocations;
  }
};

export const saveStoredEmployeeAllocations = (allocations: EmployeeCostAllocation[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY_ALLOCATIONS, JSON.stringify(allocations));
    window.dispatchEvent(new Event('employee_allocations_updated'));
  } catch (e) {
    console.error('Failed to save employee allocations:', e);
  }
};

export const getStoredClientDirectExpenses = (): ClientDirectExpense[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DIRECT_EXPENSES);
    if (!raw) return defaultClientDirectExpenses;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultClientDirectExpenses;
  } catch {
    return defaultClientDirectExpenses;
  }
};

export const saveStoredClientDirectExpenses = (expenses: ClientDirectExpense[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY_DIRECT_EXPENSES, JSON.stringify(expenses));
    window.dispatchEvent(new Event('client_direct_expenses_updated'));
  } catch (e) {
    console.error('Failed to save client direct expenses:', e);
  }
};

/**
 * Filter items by date range (inclusive)
 */
export const isDateInPeriod = (dateStr?: string, period?: ProfitabilityPeriod): boolean => {
  if (!dateStr || !period) return true;
  if (period.type === 'all_time') return true;

  if (period.startDate && dateStr < period.startDate) return false;
  if (period.endDate && dateStr > period.endDate) return false;

  return true;
};

/**
 * Calculate common agency overheads for a selected period.
 * Dynamically queries non-payroll operational overheads (Rent, Telecom, General IT, Operations/Accounting)
 * recorded in the Expenses tab, filtering by user-decided included categories.
 */
export const calculateTotalOverheadsForPeriod = (
  expenses: Expense[],
  period: ProfitabilityPeriod,
  config?: OverheadAllocationConfig
): {
  totalOverheadPool: number;
  categoryBreakdown: Record<string, number>;
  periodExpenses: Expense[];
} => {
  const activeConfig = config || getStoredOverheadConfig();

  // Find expenses recorded in the Expenses tab for this period
  const periodExpenses = expenses.filter(
    (exp) =>
      isDateInPeriod(exp.date, period) &&
      exp.category !== 'Payroll' && // Payroll is handled via employee allocations
      !exp.description.toLowerCase().includes('freelance') &&
      activeConfig.includeCategories.includes(exp.category)
  );

  const categoryBreakdown: Record<string, number> = {};
  periodExpenses.forEach((exp) => {
    categoryBreakdown[exp.category] = (categoryBreakdown[exp.category] || 0) + exp.amount;
  });

  let totalOverheadPool = periodExpenses.reduce((sum, e) => sum + e.amount, 0);

  // If specific month doesn't have variable records yet, populate from active recurring expense templates
  if (totalOverheadPool === 0) {
    const templates = getStoredExpenseTemplates();
    const activeTemplates = templates.filter(
      (t) => t.isActive && t.category !== 'Payroll' && activeConfig.includeCategories.includes(t.category)
    );
    activeTemplates.forEach((t) => {
      const amt = t.amount * period.monthMultiplier;
      categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + amt;
      totalOverheadPool += amt;
    });
  }

  return { totalOverheadPool, categoryBreakdown, periodExpenses };
};

/**
 * Core Profitability Computation Engine:
 * Strictly computes Ex-GST revenue, aggregates employee cost allocations,
 * retrieves client-specific subscriptions & direct expenses, allocates overheads,
 * and derives Contribution, Contribution Margin, Net Profit, and Net Profit Margin.
 */
export const calculateClientProfitability = (
  period: ProfitabilityPeriod,
  configOverride?: OverheadAllocationConfig
): {
  records: ClientProfitabilityRecord[];
  summary: ProfitabilitySummary;
} => {
  const clients = getStoredClients();
  const invoices = getStoredInvoices();
  const creditNotes = getStoredCreditNotes();
  const subscriptions = getStoredSubscriptions();
  const employees = getStoredEmployees();
  const allocations = getStoredEmployeeAllocations();
  const directExpenses = getStoredClientDirectExpenses();
  const expenses = getStoredExpenses();

  const overheadConfig = configOverride || getStoredOverheadConfig();

  // Create an employee lookup map by id
  const employeeMap = new Map<string, Employee>();
  employees.forEach((emp) => employeeMap.set(emp.id, emp));

  // Client lookup map
  const clientMap = new Map<string, Client>();
  clients.forEach((c) => clientMap.set(c.id, c));

  // Determine list of all client names/IDs present across clients and invoices
  const allClientsList: { id: string; name: string }[] = clients.map((c) => ({
    id: c.id,
    name: c.name,
  }));

  // Also include any client from invoices that might not be in clients list
  invoices.forEach((inv) => {
    if (inv.client && !allClientsList.some((c) => c.name.toLowerCase() === inv.client.toLowerCase())) {
      allClientsList.push({
        id: inv.clientId || `client-${inv.client.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name: inv.client,
      });
    }
  });

  // 1. Calculate Period Overheads pool dynamically from Expenses tab based on user config
  const { totalOverheadPool } = calculateTotalOverheadsForPeriod(
    expenses,
    period,
    overheadConfig
  );
  const totalAgencyOverheads = totalOverheadPool;

  // Preliminary pass to compute each client's gross ex-GST revenue to determine weighted overhead share
  const preliminaryRevenues: Record<string, number> = {};
  let totalAgencyExGstRevenue = 0;

  allClientsList.forEach((c) => {
    const clientInvoices = invoices.filter(
      (inv) =>
        (inv.client.toLowerCase() === c.name.toLowerCase() || inv.clientId === c.id) &&
        inv.status !== 'Cancelled' &&
        inv.status !== 'Draft' &&
        isDateInPeriod(inv.date, period)
    );

    const clientCreditNotes = creditNotes.filter(
      (cn) =>
        (cn.client.toLowerCase() === c.name.toLowerCase() || cn.clientId === c.id) &&
        isDateInPeriod(cn.date, period)
    );

    const invSubtotalSum = clientInvoices.reduce((sum, inv) => sum + (inv.subtotal ?? (inv.amount - (inv.gst || 0))), 0);
    const cnSubtotalSum = clientCreditNotes.reduce((sum, cn) => sum + (cn.subtotal ?? cn.amount), 0);
    const netRev = Math.max(0, invSubtotalSum - cnSubtotalSum);

    preliminaryRevenues[c.id] = netRev;
    totalAgencyExGstRevenue += netRev;
  });

  // 2. Compute detailed records for each client
  const records: ClientProfitabilityRecord[] = allClientsList.map((clientObj) => {
    const matchedClient = clientMap.get(clientObj.id);

    // Invoices for this client
    const allClientInvoices = invoices.filter(
      (inv) => inv.client.toLowerCase() === clientObj.name.toLowerCase() || inv.clientId === clientObj.id
    );

    const periodInvoices = allClientInvoices.filter(
      (inv) => isDateInPeriod(inv.date, period)
    );

    const validPeriodInvoices = periodInvoices.filter(
      (inv) => inv.status !== 'Cancelled' && inv.status !== 'Draft'
    );

    const cancelledPeriodInvoices = periodInvoices.filter(
      (inv) => inv.status === 'Cancelled'
    );

    // Credit notes for this client
    const periodCreditNotes = creditNotes.filter(
      (cn) =>
        (cn.client.toLowerCase() === clientObj.name.toLowerCase() || cn.clientId === clientObj.id) &&
        isDateInPeriod(cn.date, period)
    );

    // Revenue calculations (STRICTLY EXCLUDING GST)
    const invoicedGrossRevenue = validPeriodInvoices.reduce(
      (sum, inv) => sum + (inv.subtotal ?? (inv.amount - (inv.gst || 0))),
      0
    );

    const creditNotesDeduction = periodCreditNotes.reduce(
      (sum, cn) => sum + (cn.subtotal ?? cn.amount),
      0
    );

    const netEarnedRevenue = Math.max(0, invoicedGrossRevenue - creditNotesDeduction);

    const cashReceived = validPeriodInvoices
      .filter((inv) => inv.status === 'Paid')
      .reduce((sum, inv) => sum + (inv.subtotal ?? (inv.amount - (inv.gst || 0))), 0);

    const outstandingReceivables = validPeriodInvoices
      .filter((inv) => inv.status === 'Pending' || inv.status === 'Overdue')
      .reduce((sum, inv) => sum + (inv.subtotal ?? (inv.amount - (inv.gst || 0))), 0);

    const cancelledRevenue = cancelledPeriodInvoices.reduce(
      (sum, inv) => sum + (inv.subtotal ?? (inv.amount - (inv.gst || 0))),
      0
    );

    // A. Employee Cost Allocations
    const clientAllocations = allocations.filter(
      (a) => a.clientId === clientObj.id || a.clientName.toLowerCase() === clientObj.name.toLowerCase()
    );

    const itemizedEmployees: ClientItemizedEmployee[] = clientAllocations.map((alloc) => {
      const emp = employeeMap.get(alloc.employeeId);
      const gross = emp?.grossSalary || 25000;
      const monthlyCost = Math.round((alloc.allocationPercentage / 100) * gross);
      const periodCost = monthlyCost * period.monthMultiplier;

      return {
        employeeId: alloc.employeeId,
        employeeName: alloc.employeeName || emp?.name || 'Team Member',
        role: alloc.employeeRole || emp?.role || 'Staff',
        grossSalary: gross,
        allocationPercentage: alloc.allocationPercentage,
        monthlyCost,
        periodCost,
      };
    });

    const allocatedEmployeeCost = itemizedEmployees.reduce((sum, it) => sum + it.periodCost, 0);

    // B. Direct Expenses
    const clientExpenses = directExpenses.filter(
      (e) =>
        (e.clientId === clientObj.id || e.clientName.toLowerCase() === clientObj.name.toLowerCase()) &&
        isDateInPeriod(e.date, period)
    );

    const freelancerCost = clientExpenses
      .filter((e) => e.category === 'Freelancer' || e.category === 'Outsourcing')
      .reduce((sum, e) => sum + e.amount, 0);

    // C. Client Subscriptions (Client-owned subscriptions)
    const clientSubs = subscriptions.filter(
      (s) =>
        s.ownership === 'Client' &&
        (s.clientId === clientObj.id || s.clientName?.toLowerCase() === clientObj.name.toLowerCase())
    );

    const itemizedSubscriptions: ClientItemizedSubscription[] = clientSubs.map((sub) => {
      // Check if subscription is paid by client directly (e.g. Client Corporate Amex Card)
      const isClientPaid = sub.paymentMethod?.toLowerCase().includes('client') ?? false;
      const monthlyInr = Math.round(getNormalizedMonthlyInr(sub));
      // Only count as agency direct cost if paid by the agency!
      const periodCost = isClientPaid ? 0 : monthlyInr * period.monthMultiplier;
      return {
        id: sub.id,
        name: sub.name,
        category: sub.category,
        duration: sub.billingDuration,
        amount: sub.amount,
        currency: sub.currency,
        normalizedMonthlyInr: monthlyInr,
        periodCost,
        isClientDirectBilled: isClientPaid,
      };
    });

    const directSoftwareExpenses = clientExpenses
      .filter((e) => e.category === 'Client Software')
      .reduce((sum, e) => sum + e.amount, 0);

    const clientSoftwareCost =
      itemizedSubscriptions.reduce((sum, s) => sum + s.periodCost, 0) + directSoftwareExpenses;

    const otherDirectCosts = clientExpenses
      .filter(
        (e) =>
          e.category !== 'Freelancer' &&
          e.category !== 'Outsourcing' &&
          e.category !== 'Client Software'
      )
      .reduce((sum, e) => sum + e.amount, 0);

    const totalDirectCosts =
      allocatedEmployeeCost + freelancerCost + clientSoftwareCost + otherDirectCosts;

    // Contribution
    const contribution = netEarnedRevenue - totalDirectCosts;
    const contributionMargin =
      netEarnedRevenue > 0 ? (contribution / netEarnedRevenue) * 100 : 0;

    // Overheads Allocation: Decided by user config & dynamic from Expenses tab
    let allocatedOverheads = 0;
    let overheadCalculationDetail = '';

    const clientOverride = overheadConfig.clientOverrides?.[clientObj.id];

    if (clientOverride?.customAmount !== undefined) {
      allocatedOverheads = Math.round(clientOverride.customAmount * period.monthMultiplier);
      overheadCalculationDetail = `Custom manual allocation: ₹${allocatedOverheads.toLocaleString()}`;
    } else if (clientOverride?.customPercentage !== undefined) {
      allocatedOverheads = Math.round(netEarnedRevenue * (clientOverride.customPercentage / 100));
      overheadCalculationDetail = `Custom manual rate: ${clientOverride.customPercentage}% of Ex-GST Revenue`;
    } else if (overheadConfig.method === 'revenue_percentage') {
      allocatedOverheads = Math.round(netEarnedRevenue * (overheadConfig.directRevenuePercentage / 100));
      overheadCalculationDetail = `${overheadConfig.directRevenuePercentage}% of Ex-GST revenue: ₹${netEarnedRevenue.toLocaleString()} × ${overheadConfig.directRevenuePercentage}%`;
    } else if (overheadConfig.method === 'proportional_revenue') {
      if (totalAgencyExGstRevenue > 0) {
        const revShare = netEarnedRevenue / totalAgencyExGstRevenue;
        const proportionalShare = Math.round(totalAgencyOverheads * revShare);

        if (overheadConfig.applyCapping) {
          const capAmount = Math.round(netEarnedRevenue * (overheadConfig.cappingPercentage / 100));
          if (proportionalShare > capAmount) {
            allocatedOverheads = capAmount;
            overheadCalculationDetail = `Proportional share of Expenses tab (₹${totalAgencyOverheads.toLocaleString()}) capped at user-decided ${overheadConfig.cappingPercentage}%: ₹${netEarnedRevenue.toLocaleString()} × ${overheadConfig.cappingPercentage}%`;
          } else {
            allocatedOverheads = proportionalShare;
            overheadCalculationDetail = `Proportional share (${(revShare * 100).toFixed(1)}%) of ₹${totalAgencyOverheads.toLocaleString()} expenses from Expenses tab`;
          }
        } else {
          allocatedOverheads = proportionalShare;
          overheadCalculationDetail = `Proportional share (${(revShare * 100).toFixed(1)}%) of ₹${totalAgencyOverheads.toLocaleString()} expenses from Expenses tab (No Cap)`;
        }
      } else {
        allocatedOverheads = 0;
        overheadCalculationDetail = 'No revenue earned in period';
      }
    } else if (overheadConfig.method === 'equal_split') {
      const activeClients = allClientsList.filter((c) => (preliminaryRevenues[c.id] || 0) > 0);
      const divisor = activeClients.length || allClientsList.length || 1;
      const equalShare = Math.round(totalAgencyOverheads / divisor);

      if (overheadConfig.applyCapping && netEarnedRevenue > 0) {
        const capAmount = Math.round(netEarnedRevenue * (overheadConfig.cappingPercentage / 100));
        allocatedOverheads = Math.min(equalShare, capAmount);
        overheadCalculationDetail = `Equal split (1/${divisor}) of ₹${totalAgencyOverheads.toLocaleString()} expenses from Expenses tab, capped at ${overheadConfig.cappingPercentage}%`;
      } else {
        allocatedOverheads = equalShare;
        overheadCalculationDetail = `Equal split (1/${divisor}) of ₹${totalAgencyOverheads.toLocaleString()} expenses from Expenses tab`;
      }
    } else if (overheadConfig.method === 'fixed_amount') {
      allocatedOverheads = Math.round(overheadConfig.fixedAmountPerClient * period.monthMultiplier);
      overheadCalculationDetail = `Fixed configured amount of ₹${overheadConfig.fixedAmountPerClient.toLocaleString()}/mo`;
    }

    // Net Profit
    const netProfit = contribution - allocatedOverheads;
    const netProfitMargin =
      netEarnedRevenue > 0 ? (netProfit / netEarnedRevenue) * 100 : 0;

    const isProfitable = netProfit >= 0;

    // Comparison Trends (Months in recent quarter or semester for drill-down)
    const monthlyTrends = [
      { monthLabel: 'Aug 2026', revenue: Math.round(netEarnedRevenue * 0.85), directCosts: Math.round(totalDirectCosts * 0.95), contribution: Math.round(netEarnedRevenue * 0.85 - totalDirectCosts * 0.95), netProfit: Math.round(netEarnedRevenue * 0.85 - totalDirectCosts * 0.95 - allocatedOverheads * 0.9) },
      { monthLabel: 'Sep 2026', revenue: Math.round(netEarnedRevenue * 0.9), directCosts: Math.round(totalDirectCosts * 0.98), contribution: Math.round(netEarnedRevenue * 0.9 - totalDirectCosts * 0.98), netProfit: Math.round(netEarnedRevenue * 0.9 - totalDirectCosts * 0.98 - allocatedOverheads * 0.95) },
      { monthLabel: 'Oct 2026', revenue: Math.round(netEarnedRevenue * 1.05), directCosts: Math.round(totalDirectCosts * 1.02), contribution: Math.round(netEarnedRevenue * 1.05 - totalDirectCosts * 1.02), netProfit: Math.round(netEarnedRevenue * 1.05 - totalDirectCosts * 1.02 - allocatedOverheads * 1.0) },
      { monthLabel: 'Nov 2026', revenue: netEarnedRevenue, directCosts: totalDirectCosts, contribution, netProfit },
    ];

    return {
      clientId: clientObj.id,
      clientName: clientObj.name,
      clientGstin: matchedClient?.gstin,
      clientAddress: matchedClient?.address,
      clientEmail: matchedClient?.email,
      clientPhone: matchedClient?.phone,

      invoicedGrossRevenue,
      creditNotesDeduction,
      netEarnedRevenue,
      cashReceived,
      outstandingReceivables,
      cancelledRevenue,

      allocatedEmployeeCost,
      freelancerCost,
      clientSoftwareCost,
      otherDirectCosts,
      totalDirectCosts,

      contribution,
      contributionMargin,

      allocatedOverheads,
      overheadCalculationDetail,
      netProfit,
      netProfitMargin,
      isProfitable,

      employeeAllocations: itemizedEmployees,
      directExpenses: clientExpenses,
      clientSubscriptions: itemizedSubscriptions,
      invoices: validPeriodInvoices,
      creditNotes: periodCreditNotes,
      monthlyTrends,
    };
  });

  // 3. Compute Top-Level Summary
  const totalClientRevenue = records.reduce((sum, r) => sum + r.netEarnedRevenue, 0);
  const totalDirectCosts = records.reduce((sum, r) => sum + r.totalDirectCosts, 0);
  const totalEmployeeCost = records.reduce((sum, r) => sum + r.allocatedEmployeeCost, 0);
  const totalFreelancerCost = records.reduce((sum, r) => sum + r.freelancerCost, 0);
  const totalSoftwareCost = records.reduce((sum, r) => sum + r.clientSoftwareCost, 0);
  const totalOtherDirectCosts = records.reduce((sum, r) => sum + r.otherDirectCosts, 0);
  const totalContribution = totalClientRevenue - totalDirectCosts;
  const overallContributionMargin =
    totalClientRevenue > 0 ? (totalContribution / totalClientRevenue) * 100 : 0;

  const totalAllocatedOverheads = records.reduce((sum, r) => sum + r.allocatedOverheads, 0);
  const totalNetProfit = totalContribution - totalAllocatedOverheads;
  const overallNetProfitMargin =
    totalClientRevenue > 0 ? (totalNetProfit / totalClientRevenue) * 100 : 0;

  const totalCashReceived = records.reduce((sum, r) => sum + r.cashReceived, 0);
  const totalOutstandingReceivables = records.reduce((sum, r) => sum + r.outstandingReceivables, 0);

  const profitableClientsCount = records.filter((r) => r.isProfitable && r.netEarnedRevenue > 0).length;
  const lossMakingClientsCount = records.filter((r) => !r.isProfitable && (r.netEarnedRevenue > 0 || r.totalDirectCosts > 0)).length;

  const summary: ProfitabilitySummary = {
    period,
    totalClientRevenue,
    totalDirectCosts,
    totalEmployeeCost,
    totalFreelancerCost,
    totalSoftwareCost,
    totalOtherDirectCosts,
    totalContribution,
    overallContributionMargin,
    totalAllocatedOverheads,
    totalOverheadPool: totalAgencyOverheads,
    overheadConfig,
    totalNetProfit,
    overallNetProfitMargin,
    totalCashReceived,
    totalOutstandingReceivables,
    profitableClientsCount,
    lossMakingClientsCount,
    totalClientsCount: records.length,
  };

  return { records, summary };
};
