import { apiBatchSave } from '../services/api';

export interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  isRecurring?: boolean;
  recurringTemplateId?: string;
}

export interface RecurringTemplate {
  id: string;
  title: string;
  category: string;
  amount: number;
  dayOfMonth: number;
  frequency: 'Monthly' | 'Quarterly' | 'Yearly';
  isActive: boolean;
  notes?: string;
}

export type OverviewTimeRange = 'THIS_MONTH' | 'LAST_MONTH' | 'LAST_QUARTER' | 'THIS_YEAR' | 'LAST_YEAR';

export const OVERVIEW_RANGES: { id: OverviewTimeRange; label: string; periodLabel: string }[] = [
  { id: 'THIS_MONTH', label: 'This Month', periodLabel: 'November 2026' },
  { id: 'LAST_MONTH', label: 'Last Month', periodLabel: 'October 2026' },
  { id: 'LAST_QUARTER', label: 'Last Quarter', periodLabel: 'Q3 2026 (Jul - Sep)' },
  { id: 'THIS_YEAR', label: 'This Year', periodLabel: 'FY 2026 (YTD)' },
  { id: 'LAST_YEAR', label: 'Last Year', periodLabel: 'FY 2025' },
];

export const defaultRecurringTemplates: RecurringTemplate[] = [
  {
    id: 'rec-1',
    title: 'Staff Salaries & Payroll',
    category: 'Payroll',
    amount: 160000,
    dayOfMonth: 1,
    frequency: 'Monthly',
    isActive: true,
    notes: 'Base monthly salaries for engineering & design team',
  },
  {
    id: 'rec-2',
    title: 'Office Rent & Maintenance',
    category: 'Office',
    amount: 35000,
    dayOfMonth: 5,
    frequency: 'Monthly',
    isActive: true,
    notes: 'Commercial workspace lease and maintenance',
  },
  {
    id: 'rec-3',
    title: 'Cloud Infrastructure & Server Baseline',
    category: 'IT',
    amount: 12500,
    dayOfMonth: 10,
    frequency: 'Monthly',
    isActive: true,
    notes: 'Agency baseline cloud servers (software licenses are tracked in Subscriptions)',
  },
  {
    id: 'rec-4',
    title: 'High-Speed Broadband & Telecom',
    category: 'Office',
    amount: 3500,
    dayOfMonth: 7,
    frequency: 'Monthly',
    isActive: true,
    notes: 'Office dedicated leased line and fiber internet',
  },
  {
    id: 'rec-5',
    title: 'Accounting & Compliance Retainer',
    category: 'Operations',
    amount: 8000,
    dayOfMonth: 15,
    frequency: 'Monthly',
    isActive: true,
    notes: 'Monthly GST filing and CA advisory retainer',
  },
];

export const mockExpenses: Expense[] = [
  // November 2026 (This Month) - Initial variable expenses (Recurring items are pending)
  { id: 'exp-nov-1', description: 'Client Lunch & Strategy Meeting', category: 'Meals', amount: 3800, date: '2026-11-04', isRecurring: false },
  { id: 'exp-nov-2', description: 'Office Pantry Supplies & Snacks', category: 'Office', amount: 2650, date: '2026-11-12', isRecurring: false },
  { id: 'exp-nov-3', description: 'Emergency Cloud Server Addon', category: 'IT', amount: 4500, date: '2026-11-15', isRecurring: false },

  // October 2026 (Last Month) - Full month with recurring + variable expenses
  { id: 'exp-oct-1', description: 'Staff Salaries & Payroll', category: 'Payroll', amount: 160000, date: '2026-10-01', isRecurring: true, recurringTemplateId: 'rec-1' },
  { id: 'exp-oct-2', description: 'Office Rent & Maintenance', category: 'Office', amount: 35000, date: '2026-10-05', isRecurring: true, recurringTemplateId: 'rec-2' },
  { id: 'exp-oct-3', description: 'High-Speed Broadband & Telecom', category: 'Office', amount: 3500, date: '2026-10-07', isRecurring: true, recurringTemplateId: 'rec-4' },
  { id: 'exp-oct-4', description: 'Software Subscriptions (Google Workspace, AWS, Figma)', category: 'IT', amount: 12500, date: '2026-10-10', isRecurring: true, recurringTemplateId: 'rec-3' },
  { id: 'exp-oct-5', description: 'Accounting & Compliance Retainer', category: 'Operations', amount: 8000, date: '2026-10-15', isRecurring: true, recurringTemplateId: 'rec-5' },
  { id: 'exp-oct-6', description: 'Client Hospitality & Meals', category: 'Meals', amount: 4200, date: '2026-10-18', isRecurring: false },
  { id: 'exp-oct-7', description: 'Printer Toner & Office Supplies', category: 'Office', amount: 2800, date: '2026-10-22', isRecurring: false },

  // September 2026 (Last Quarter - Q3)
  { id: 'exp-sep-1', description: 'Staff Salaries & Payroll', category: 'Payroll', amount: 160000, date: '2026-09-01', isRecurring: true, recurringTemplateId: 'rec-1' },
  { id: 'exp-sep-2', description: 'Office Rent & Maintenance', category: 'Office', amount: 35000, date: '2026-09-05', isRecurring: true, recurringTemplateId: 'rec-2' },
  { id: 'exp-sep-3', description: 'High-Speed Broadband & Telecom', category: 'Office', amount: 3500, date: '2026-09-07', isRecurring: true, recurringTemplateId: 'rec-4' },
  { id: 'exp-sep-4', description: 'Software Subscriptions (Google Workspace, AWS, Figma)', category: 'IT', amount: 12500, date: '2026-09-10', isRecurring: true, recurringTemplateId: 'rec-3' },
  { id: 'exp-sep-5', description: 'Accounting & Compliance Retainer', category: 'Operations', amount: 8000, date: '2026-09-15', isRecurring: true, recurringTemplateId: 'rec-5' },
  { id: 'exp-sep-6', description: 'Quarterly ROC & Legal Filing Fee', category: 'Operations', amount: 6500, date: '2026-09-18', isRecurring: false },
  { id: 'exp-sep-7', description: 'Team Quarterly Review Lunch', category: 'Meals', amount: 3600, date: '2026-09-24', isRecurring: false },

  // August 2026 (Last Quarter - Q3)
  { id: 'exp-aug-1', description: 'Staff Salaries & Payroll', category: 'Payroll', amount: 160000, date: '2026-08-01', isRecurring: true, recurringTemplateId: 'rec-1' },
  { id: 'exp-aug-2', description: 'Office Rent & Maintenance', category: 'Office', amount: 35000, date: '2026-08-05', isRecurring: true, recurringTemplateId: 'rec-2' },
  { id: 'exp-aug-3', description: 'High-Speed Broadband & Telecom', category: 'Office', amount: 3500, date: '2026-08-07', isRecurring: true, recurringTemplateId: 'rec-4' },
  { id: 'exp-aug-4', description: 'Software Subscriptions (Google Workspace, AWS, Figma)', category: 'IT', amount: 12500, date: '2026-08-10', isRecurring: true, recurringTemplateId: 'rec-3' },
  { id: 'exp-aug-5', description: 'Accounting & Compliance Retainer', category: 'Operations', amount: 8000, date: '2026-08-15', isRecurring: true, recurringTemplateId: 'rec-5' },
  { id: 'exp-aug-6', description: 'Ergonomic Office Chairs (2x)', category: 'Office', amount: 7800, date: '2026-08-19', isRecurring: false },
  { id: 'exp-aug-7', description: 'Marketing Brochures & Print Collaterals', category: 'Marketing', amount: 4200, date: '2026-08-27', isRecurring: false },

  // July 2026 (Last Quarter - Q3)
  { id: 'exp-jul-1', description: 'Staff Salaries & Payroll', category: 'Payroll', amount: 160000, date: '2026-07-01', isRecurring: true, recurringTemplateId: 'rec-1' },
  { id: 'exp-jul-2', description: 'Office Rent & Maintenance', category: 'Office', amount: 35000, date: '2026-07-05', isRecurring: true, recurringTemplateId: 'rec-2' },
  { id: 'exp-jul-3', description: 'High-Speed Broadband & Telecom', category: 'Office', amount: 3500, date: '2026-07-07', isRecurring: true, recurringTemplateId: 'rec-4' },
  { id: 'exp-jul-4', description: 'Software Subscriptions (Google Workspace, AWS, Figma)', category: 'IT', amount: 12500, date: '2026-07-10', isRecurring: true, recurringTemplateId: 'rec-3' },
  { id: 'exp-jul-5', description: 'Accounting & Compliance Retainer', category: 'Operations', amount: 8000, date: '2026-07-15', isRecurring: true, recurringTemplateId: 'rec-5' },
  { id: 'exp-jul-6', description: 'Developer Monitory & USB Hubs', category: 'IT', amount: 5400, date: '2026-07-21', isRecurring: false },

  // Representative Q1 & Q2 2026 (For "This Year" 2026)
  { id: 'exp-jun-1', description: 'Staff Salaries & Payroll', category: 'Payroll', amount: 160000, date: '2026-06-01', isRecurring: true, recurringTemplateId: 'rec-1' },
  { id: 'exp-jun-2', description: 'Office Rent & Utilities', category: 'Office', amount: 38500, date: '2026-06-05', isRecurring: true },
  { id: 'exp-jun-3', description: 'SaaS & Infrastructure', category: 'IT', amount: 12500, date: '2026-06-10', isRecurring: true },
  { id: 'exp-jun-4', description: 'Operations & Retainer', category: 'Operations', amount: 8000, date: '2026-06-15', isRecurring: true },
  { id: 'exp-jun-5', description: 'Mid-Year Team Offsite Dinner', category: 'Meals', amount: 9200, date: '2026-06-25', isRecurring: false },

  { id: 'exp-may-1', description: 'Staff Salaries & Payroll', category: 'Payroll', amount: 160000, date: '2026-05-01', isRecurring: true, recurringTemplateId: 'rec-1' },
  { id: 'exp-may-2', description: 'Office Rent & Maintenance', category: 'Office', amount: 38500, date: '2026-05-05', isRecurring: true },
  { id: 'exp-may-3', description: 'SaaS Subscriptions', category: 'IT', amount: 12500, date: '2026-05-10', isRecurring: true },
  { id: 'exp-may-4', description: 'Operations Retainer', category: 'Operations', amount: 8000, date: '2026-05-15', isRecurring: true },

  { id: 'exp-apr-1', description: 'Staff Salaries & Payroll', category: 'Payroll', amount: 160000, date: '2026-04-01', isRecurring: true, recurringTemplateId: 'rec-1' },
  { id: 'exp-apr-2', description: 'Office Rent & Telecom', category: 'Office', amount: 38500, date: '2026-04-05', isRecurring: true },
  { id: 'exp-apr-3', description: 'SaaS Subscriptions', category: 'IT', amount: 12500, date: '2026-04-10', isRecurring: true },
  { id: 'exp-apr-4', description: 'Operations Retainer', category: 'Operations', amount: 8000, date: '2026-04-15', isRecurring: true },
  { id: 'exp-apr-5', description: 'Annual Corporate Tax Consulting', category: 'Operations', amount: 14000, date: '2026-04-20', isRecurring: false },

  { id: 'exp-mar-1', description: 'Staff Salaries & Payroll', category: 'Payroll', amount: 160000, date: '2026-03-01', isRecurring: true, recurringTemplateId: 'rec-1' },
  { id: 'exp-mar-2', description: 'Office Rent & Maintenance', category: 'Office', amount: 38500, date: '2026-03-05', isRecurring: true },
  { id: 'exp-mar-3', description: 'SaaS Subscriptions', category: 'IT', amount: 12500, date: '2026-03-10', isRecurring: true },
  { id: 'exp-mar-4', description: 'Operations Retainer', category: 'Operations', amount: 8000, date: '2026-03-15', isRecurring: true },

  { id: 'exp-feb-1', description: 'Staff Salaries & Payroll', category: 'Payroll', amount: 160000, date: '2026-02-01', isRecurring: true, recurringTemplateId: 'rec-1' },
  { id: 'exp-feb-2', description: 'Office Rent & Maintenance', category: 'Office', amount: 38500, date: '2026-02-05', isRecurring: true },
  { id: 'exp-feb-3', description: 'SaaS Subscriptions', category: 'IT', amount: 12500, date: '2026-02-10', isRecurring: true },
  { id: 'exp-feb-4', description: 'Operations Retainer', category: 'Operations', amount: 8000, date: '2026-02-15', isRecurring: true },

  { id: 'exp-jan-1', description: 'Staff Salaries & Payroll', category: 'Payroll', amount: 160000, date: '2026-01-01', isRecurring: true, recurringTemplateId: 'rec-1' },
  { id: 'exp-jan-2', description: 'Office Rent & Maintenance', category: 'Office', amount: 38500, date: '2026-01-05', isRecurring: true },
  { id: 'exp-jan-3', description: 'SaaS Subscriptions', category: 'IT', amount: 12500, date: '2026-01-10', isRecurring: true },
  { id: 'exp-jan-4', description: 'Operations Retainer', category: 'Operations', amount: 8000, date: '2026-01-15', isRecurring: true },
  { id: 'exp-jan-5', description: 'New Year Kickoff & Annual Planning', category: 'Meals', amount: 7500, date: '2026-01-18', isRecurring: false },

  // Last Year (2025 Full Year)
  { id: 'exp-2025-q4-sal', description: 'Q4 2025 Staff Salaries & Payroll', category: 'Payroll', amount: 480000, date: '2025-11-01', isRecurring: true },
  { id: 'exp-2025-q4-rent', description: 'Q4 2025 Office Rent & Utilities', category: 'Office', amount: 115500, date: '2025-11-05', isRecurring: true },
  { id: 'exp-2025-q4-it', description: 'Q4 2025 SaaS & Cloud Hosting', category: 'IT', amount: 37500, date: '2025-11-10', isRecurring: true },
  { id: 'exp-2025-q4-ops', description: 'Q4 2025 Legal & Accounting Services', category: 'Operations', amount: 24000, date: '2025-11-15', isRecurring: true },

  { id: 'exp-2025-q3-sal', description: 'Q3 2025 Staff Salaries & Payroll', category: 'Payroll', amount: 480000, date: '2025-08-01', isRecurring: true },
  { id: 'exp-2025-q3-rent', description: 'Q3 2025 Office Rent & Utilities', category: 'Office', amount: 115500, date: '2025-08-05', isRecurring: true },
  { id: 'exp-2025-q3-it', description: 'Q3 2025 SaaS & Cloud Hosting', category: 'IT', amount: 37500, date: '2025-08-10', isRecurring: true },
  { id: 'exp-2025-q3-ops', description: 'Q3 2025 Legal & Accounting Services', category: 'Operations', amount: 24000, date: '2025-08-15', isRecurring: true },

  { id: 'exp-2025-q2-sal', description: 'Q2 2025 Staff Salaries & Payroll', category: 'Payroll', amount: 480000, date: '2025-05-01', isRecurring: true },
  { id: 'exp-2025-q2-rent', description: 'Q2 2025 Office Rent & Utilities', category: 'Office', amount: 115500, date: '2025-05-05', isRecurring: true },
  { id: 'exp-2025-q2-it', description: 'Q2 2025 SaaS & Cloud Hosting', category: 'IT', amount: 37500, date: '2025-05-10', isRecurring: true },
  { id: 'exp-2025-q2-ops', description: 'Q2 2025 Legal & Accounting Services', category: 'Operations', amount: 24000, date: '2025-05-15', isRecurring: true },

  { id: 'exp-2025-q1-sal', description: 'Q1 2025 Staff Salaries & Payroll', category: 'Payroll', amount: 480000, date: '2025-02-01', isRecurring: true },
  { id: 'exp-2025-q1-rent', description: 'Q1 2025 Office Rent & Utilities', category: 'Office', amount: 115500, date: '2025-02-05', isRecurring: true },
  { id: 'exp-2025-q1-it', description: 'Q1 2025 SaaS & Cloud Hosting', category: 'IT', amount: 37500, date: '2025-02-10', isRecurring: true },
  { id: 'exp-2025-q1-ops', description: 'Q1 2025 Legal & Accounting Services', category: 'Operations', amount: 24000, date: '2025-02-15', isRecurring: true },
  { id: 'exp-2025-misc', description: 'FY 2025 Variable Operations & Travel', category: 'Travel', amount: 48000, date: '2025-06-15', isRecurring: false },
];

const EXPENSES_STORAGE_KEY = 'shankara_expenses_data';
const EXPENSE_TEMPLATES_STORAGE_KEY = 'shankara_recurring_expense_templates';

export const getStoredExpenses = (): Expense[] => {
  try {
    const raw = localStorage.getItem(EXPENSES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

export const saveStoredExpenses = (expenses: Expense[]) => {
  try {
    localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
    apiBatchSave('expenses', expenses).catch(console.warn);
  } catch (e) {
    console.error('Failed to save expenses:', e);
  }
};

export const getStoredExpenseTemplates = (): RecurringTemplate[] => {
  try {
    const raw = localStorage.getItem(EXPENSE_TEMPLATES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

export const saveStoredExpenseTemplates = (templates: RecurringTemplate[]) => {
  try {
    localStorage.setItem(EXPENSE_TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
    apiBatchSave('recurring_expense_templates', templates).catch(console.warn);
  } catch (e) {
    console.error('Failed to save recurring expense templates:', e);
  }
};
