export type ComplianceEntity = 'company' | 'individual';

export type ComplianceCategory =
  | 'GST'
  | 'TDS'
  | 'INCOME_TAX'
  | 'MCA_LLP'
  | 'PAYROLL_PT'
  | 'PERSONAL_FINANCE'
  | 'OTHER';

export type ComplianceFrequency =
  | 'monthly'
  | 'quarterly'
  | 'half_yearly'
  | 'annual'
  | 'one_time';

export type ComplianceStatus = 'pending' | 'due_soon' | 'overdue' | 'completed';

export interface ComplianceFilingRecord {
  filedDate: string; // YYYY-MM-DD
  acknowledgementNumber?: string; // ARN / Ack / Challan Number
  bsrCode?: string; // For tax payments
  challanNumber?: string;
  amountPaid?: number;
  remarks?: string;
  filedBy?: string;
}

export interface ComplianceItem {
  id: string;
  title: string;
  code: string; // e.g. "GSTR-3B", "ITR-5", "Form 26Q", "Form 11"
  entity: ComplianceEntity;
  entityName: string; // "M/s Shankara Online Solutions LLP" or "Manjunath Naik S"
  category: ComplianceCategory;
  frequency: ComplianceFrequency;
  dueDate: string; // YYYY-MM-DD
  periodCovered: string; // e.g. "October 2026", "Q3 FY 2026-27"
  statutoryAct: string; // e.g. "CGST Act, 2017", "Income Tax Act, 1961", "LLP Act, 2008"
  description: string;
  statutoryLateFeesOrPenalty: string; // e.g. "₹50/day late fee + 18% p.a. interest", "₹100/day MCA additional fees"
  portalName: string; // "GST Common Portal", "Income Tax e-Filing", "TRACES", "MCA V3"
  portalUrl: string;
  status: ComplianceStatus;
  daysOverdue?: number;
  daysUntilDue?: number;
  filingDetails?: ComplianceFilingRecord;
  isCustom?: boolean;
  priority?: 'high' | 'medium' | 'low';
}

export const STORAGE_KEY_COMPLIANCES = 'shankara_compliance_calendar_records';

/**
 * Dynamically computes status based on dueDate and filingDetails against reference date
 */
export const computeItemStatus = (
  item: ComplianceItem,
  todayStr: string = '2026-11-23'
): { status: ComplianceStatus; daysOverdue: number; daysUntilDue: number } => {
  if (item.filingDetails?.filedDate) {
    return { status: 'completed', daysOverdue: 0, daysUntilDue: 0 };
  }

  const today = new Date(todayStr + 'T00:00:00');
  const due = new Date(item.dueDate + 'T00:00:00');
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: 'overdue', daysOverdue: Math.abs(diffDays), daysUntilDue: 0 };
  } else if (diffDays <= 10) {
    return { status: 'due_soon', daysOverdue: 0, daysUntilDue: diffDays };
  } else {
    return { status: 'pending', daysOverdue: 0, daysUntilDue: diffDays };
  }
};

export const DEFAULT_COMPLIANCES: ComplianceItem[] = [
  // ==========================================
  // NOVEMBER 2026 COMPLIANCES (CURRENT MONTH)
  // ==========================================
  {
    id: 'comp-nov26-tds-pay',
    title: 'Monthly TDS Payment (Challan ITNS 281)',
    code: 'TDS Payment',
    entity: 'company',
    entityName: 'M/s Shankara Online Solutions LLP',
    category: 'TDS',
    frequency: 'monthly',
    dueDate: '2026-11-07',
    periodCovered: 'October 2026',
    statutoryAct: 'Income Tax Act, 1961 (Section 200/201)',
    description: 'Deposit of tax deducted at source for contractor payments (194C), professional fees (194J), and office rent (194I) deducted during October 2026.',
    statutoryLateFeesOrPenalty: 'Interest @ 1.5% per month or part of month from date of deduction till date of actual deposit.',
    portalName: 'Protean / e-Filing Portal',
    portalUrl: 'https://eportal.incometax.gov.in',
    status: 'completed',
    filingDetails: {
      filedDate: '2026-11-06',
      acknowledgementNumber: 'CIN-HDFC0001039-06112026-00482',
      bsrCode: '0001039',
      challanNumber: '00482',
      amountPaid: 8400,
      remarks: 'TDS on developer contracts and office rent paid via HDFC Netbanking',
      filedBy: 'Manjunath Naik S',
    },
    priority: 'high',
  },
  {
    id: 'comp-nov26-gstr1',
    title: 'GSTR-1 Monthly Outward Supplies',
    code: 'GSTR-1',
    entity: 'company',
    entityName: 'M/s Shankara Online Solutions LLP',
    category: 'GST',
    frequency: 'monthly',
    dueDate: '2026-11-11',
    periodCovered: 'October 2026',
    statutoryAct: 'Central Goods & Services Tax Act, 2017 (Section 37)',
    description: 'Reporting of all B2B and B2C sales invoices, credit notes, and export invoices issued to clients in October 2026.',
    statutoryLateFeesOrPenalty: 'Late fee ₹50 per day (₹25 CGST + ₹25 SGST) or ₹20/day for nil return.',
    portalName: 'GST Common Portal',
    portalUrl: 'https://services.gst.gov.in/services/login',
    status: 'completed',
    filingDetails: {
      filedDate: '2026-11-10',
      acknowledgementNumber: 'ARN-AA2911260084319',
      remarks: 'Filed via EVC OTP by Manjunath Naik S (B2B invoices uploaded)',
      filedBy: 'Manjunath Naik S',
    },
    priority: 'high',
  },
  {
    id: 'comp-nov26-gstr3b',
    title: 'GSTR-3B Monthly Summary Return & Tax Remittance',
    code: 'GSTR-3B',
    entity: 'company',
    entityName: 'M/s Shankara Online Solutions LLP',
    category: 'GST',
    frequency: 'monthly',
    dueDate: '2026-11-20',
    periodCovered: 'October 2026',
    statutoryAct: 'CGST Act, 2017 (Section 39 / Rule 61)',
    description: 'Monthly summary return of outward supplies, input tax credit (ITC) claimed from GSTR-2B, and payment of net GST payable.',
    statutoryLateFeesOrPenalty: 'Late fee ₹50/day up to max ₹10,000, plus interest @ 18% per annum on net cash tax liability.',
    portalName: 'GST Common Portal',
    portalUrl: 'https://services.gst.gov.in/services/login',
    status: 'overdue', // Due on Nov 20, today is Nov 23
    priority: 'high',
  },
  {
    id: 'comp-nov26-karnataka-pt',
    title: 'Karnataka Professional Tax Monthly Remittance (Form 5A)',
    code: 'PT Form 5A',
    entity: 'company',
    entityName: 'M/s Shankara Online Solutions LLP',
    category: 'PAYROLL_PT',
    frequency: 'monthly',
    dueDate: '2026-11-20',
    periodCovered: 'October 2026',
    statutoryAct: 'Karnataka Tax on Professions, Trades, Callings and Employments Act, 1976',
    description: 'Monthly deduction and deposit of employee professional tax (₹200 per employee earning gross salary > ₹15,000/month) for Karnataka jurisdiction.',
    statutoryLateFeesOrPenalty: 'Interest @ 1.25% per month plus penalty up to 50% of the tax due.',
    portalName: 'Karnataka e-Prerana Portal',
    portalUrl: 'https://vat.kar.nic.in/eprerana/',
    status: 'overdue',
    priority: 'medium',
  },
  {
    id: 'comp-nov26-pf-esi',
    title: 'EPF & ESIC Monthly Remittance',
    code: 'PF / ESI',
    entity: 'company',
    entityName: 'M/s Shankara Online Solutions LLP',
    category: 'PAYROLL_PT',
    frequency: 'monthly',
    dueDate: '2026-11-15',
    periodCovered: 'October 2026',
    statutoryAct: 'Employees Provident Funds Act, 1952 / ESI Act, 1948',
    description: 'Deposit of employee and employer EPF contribution (12% + 12%) and ESIC contributions for October 2026 payroll.',
    statutoryLateFeesOrPenalty: 'Damages under Section 14B ranging from 5% to 25% p.a. + interest under Section 7Q @ 12% p.a.',
    portalName: 'EPFO Unified Portal',
    portalUrl: 'https://unifiedportal-emp.epfindia.gov.in',
    status: 'completed',
    filingDetails: {
      filedDate: '2026-11-14',
      acknowledgementNumber: 'TRRN-1012611004921',
      amountPaid: 14200,
      remarks: 'EPF monthly ECR uploaded and verified via NetBanking',
      filedBy: 'Manjunath Naik S',
    },
    priority: 'medium',
  },

  // ==========================================
  // DECEMBER 2026 COMPLIANCES (UPCOMING)
  // ==========================================
  {
    id: 'comp-dec26-tds-pay',
    title: 'Monthly TDS Payment (Challan ITNS 281)',
    code: 'TDS Payment',
    entity: 'company',
    entityName: 'M/s Shankara Online Solutions LLP',
    category: 'TDS',
    frequency: 'monthly',
    dueDate: '2026-12-07',
    periodCovered: 'November 2026',
    statutoryAct: 'Income Tax Act, 1961 (Section 200/201)',
    description: 'Deposit of tax deducted at source for contractor payments, technical & consultancy fees, and office rent for November 2026.',
    statutoryLateFeesOrPenalty: 'Interest @ 1.5% per month or part of month from date of deduction till date of actual deposit.',
    portalName: 'Protean / e-Filing Portal',
    portalUrl: 'https://eportal.incometax.gov.in',
    status: 'pending',
    priority: 'high',
  },
  {
    id: 'comp-dec26-gstr1',
    title: 'GSTR-1 Monthly Outward Supplies',
    code: 'GSTR-1',
    entity: 'company',
    entityName: 'M/s Shankara Online Solutions LLP',
    category: 'GST',
    frequency: 'monthly',
    dueDate: '2026-12-11',
    periodCovered: 'November 2026',
    statutoryAct: 'Central Goods & Services Tax Act, 2017 (Section 37)',
    description: 'Reporting of all outward tax invoices, credit notes, and amendments issued in November 2026.',
    statutoryLateFeesOrPenalty: 'Late fee ₹50 per day (₹25 CGST + ₹25 SGST) or ₹20/day for nil return.',
    portalName: 'GST Common Portal',
    portalUrl: 'https://services.gst.gov.in/services/login',
    status: 'pending',
    priority: 'high',
  },
  {
    id: 'comp-dec26-adv-tax-corp',
    title: 'Advance Tax 3rd Installment (75% Cumulative) - Company',
    code: 'Advance Tax 75%',
    entity: 'company',
    entityName: 'M/s Shankara Online Solutions LLP',
    category: 'INCOME_TAX',
    frequency: 'quarterly',
    dueDate: '2026-12-15',
    periodCovered: 'FY 2026-27 (Q3)',
    statutoryAct: 'Income Tax Act, 1961 (Section 208/211)',
    description: 'Payment of third installment of advance tax (at least 75% of total estimated annual income tax liability) for Shankara Online Solutions LLP.',
    statutoryLateFeesOrPenalty: 'Mandatory interest under Section 234C @ 1% per month for deferment of installment.',
    portalName: 'Income Tax e-Filing Portal',
    portalUrl: 'https://eportal.incometax.gov.in',
    status: 'pending',
    priority: 'high',
  },
  {
    id: 'comp-dec26-adv-tax-indiv',
    title: 'Advance Tax 3rd Installment (75% Cumulative) - Individual',
    code: 'Advance Tax 75%',
    entity: 'individual',
    entityName: 'Manjunath Naik S',
    category: 'INCOME_TAX',
    frequency: 'quarterly',
    dueDate: '2026-12-15',
    periodCovered: 'FY 2026-27 (Q3)',
    statutoryAct: 'Income Tax Act, 1961 (Section 208/211)',
    description: 'Payment of third installment of advance tax (cumulative 75% of estimated total individual income tax for FY 2026-27) for Manjunath Naik S (PAN: AMAPN1977B).',
    statutoryLateFeesOrPenalty: 'Interest under Section 234C @ 1% per month for deferment or shortfall in installment.',
    portalName: 'Income Tax e-Filing Portal',
    portalUrl: 'https://eportal.incometax.gov.in',
    status: 'pending',
    priority: 'high',
  },
  {
    id: 'comp-dec26-gstr3b',
    title: 'GSTR-3B Monthly Summary Return & Tax Remittance',
    code: 'GSTR-3B',
    entity: 'company',
    entityName: 'M/s Shankara Online Solutions LLP',
    category: 'GST',
    frequency: 'monthly',
    dueDate: '2026-12-20',
    periodCovered: 'November 2026',
    statutoryAct: 'CGST Act, 2017 (Section 39 / Rule 61)',
    description: 'Monthly summary return of outward taxable supplies, input tax credit (ITC) reconciliation, and net GST cash payment for November 2026.',
    statutoryLateFeesOrPenalty: 'Late fee ₹50/day up to max ₹10,000, plus interest @ 18% per annum on net cash tax liability.',
    portalName: 'GST Common Portal',
    portalUrl: 'https://services.gst.gov.in/services/login',
    status: 'pending',
    priority: 'high',
  },
  {
    id: 'comp-dec26-karnataka-pt',
    title: 'Karnataka Professional Tax Monthly Remittance (Form 5A)',
    code: 'PT Form 5A',
    entity: 'company',
    entityName: 'M/s Shankara Online Solutions LLP',
    category: 'PAYROLL_PT',
    frequency: 'monthly',
    dueDate: '2026-12-20',
    periodCovered: 'November 2026',
    statutoryAct: 'Karnataka Tax on Professions Act, 1976',
    description: 'Monthly deposit of employee professional tax deductions for November 2026.',
    statutoryLateFeesOrPenalty: 'Interest @ 1.25% per month plus penalty up to 50% of the tax due.',
    portalName: 'Karnataka e-Prerana Portal',
    portalUrl: 'https://vat.kar.nic.in/eprerana/',
    status: 'pending',
    priority: 'medium',
  },
  {
    id: 'comp-dec26-gstr9-annual',
    title: 'GSTR-9 & GSTR-9C Annual GST Return & Reconciliation',
    code: 'GSTR-9 / 9C',
    entity: 'company',
    entityName: 'M/s Shankara Online Solutions LLP',
    category: 'GST',
    frequency: 'annual',
    dueDate: '2026-12-31',
    periodCovered: 'FY 2025-26',
    statutoryAct: 'CGST Act, 2017 (Section 44 / Rule 80)',
    description: 'Filing of annual GST return (GSTR-9) and self-certified reconciliation statement (GSTR-9C) for previous Financial Year 2025-26.',
    statutoryLateFeesOrPenalty: 'Late fee of ₹200 per day (₹100 CGST + ₹100 SGST) subject to maximum of 0.50% of turnover.',
    portalName: 'GST Common Portal',
    portalUrl: 'https://services.gst.gov.in/services/login',
    status: 'pending',
    priority: 'high',
  },
  {
    id: 'comp-dec26-belated-itr',
    title: 'Belated / Revised Income Tax Return for AY 2026-27',
    code: 'Belated ITR',
    entity: 'individual',
    entityName: 'Manjunath Naik S',
    category: 'INCOME_TAX',
    frequency: 'annual',
    dueDate: '2026-12-31',
    periodCovered: 'AY 2026-27 (FY 2025-26)',
    statutoryAct: 'Income Tax Act, 1961 (Section 139(4) / 139(5))',
    description: 'Final statutory deadline to file belated return or revised return for Assessment Year 2026-27.',
    statutoryLateFeesOrPenalty: 'Late filing fee under Section 234F of up to ₹5,000 (or ₹1,000 for income up to ₹5 Lakhs). Loss of carry forward of business/capital losses.',
    portalName: 'Income Tax e-Filing Portal',
    portalUrl: 'https://eportal.incometax.gov.in',
    status: 'completed',
    filingDetails: {
      filedDate: '2026-07-28',
      acknowledgementNumber: 'ITR-V-2807261984210',
      remarks: 'Original ITR-3 filed and e-verified well before July 31 deadline',
      filedBy: 'Manjunath Naik S',
    },
    priority: 'medium',
  },

  // ==========================================
  // JANUARY 2027 COMPLIANCES
  // ==========================================
  {
    id: 'comp-jan27-tds-pay',
    title: 'Monthly TDS Payment (Challan ITNS 281)',
    code: 'TDS Payment',
    entity: 'company',
    entityName: 'M/s Shankara Online Solutions LLP',
    category: 'TDS',
    frequency: 'monthly',
    dueDate: '2027-01-07',
    periodCovered: 'December 2026',
    statutoryAct: 'Income Tax Act, 1961 (Section 200)',
    description: 'Monthly deposit of tax deducted at source for December 2026.',
    statutoryLateFeesOrPenalty: 'Interest @ 1.5% per month or part of month.',
    portalName: 'e-Filing Portal',
    portalUrl: 'https://eportal.incometax.gov.in',
    status: 'pending',
    priority: 'high',
  },
  {
    id: 'comp-jan27-gstr1',
    title: 'GSTR-1 Monthly Outward Supplies',
    code: 'GSTR-1',
    entity: 'company',
    entityName: 'M/s Shankara Online Solutions LLP',
    category: 'GST',
    frequency: 'monthly',
    dueDate: '2027-01-11',
    periodCovered: 'December 2026',
    statutoryAct: 'CGST Act, 2017 (Section 37)',
    description: 'Reporting of all outward sales invoices and credit notes issued in December 2026.',
    statutoryLateFeesOrPenalty: 'Late fee ₹50 per day (₹25 CGST + ₹25 SGST).',
    portalName: 'GST Common Portal',
    portalUrl: 'https://services.gst.gov.in/services/login',
    status: 'pending',
    priority: 'high',
  },
  {
    id: 'comp-jan27-gstr3b',
    title: 'GSTR-3B Monthly Summary Return',
    code: 'GSTR-3B',
    entity: 'company',
    entityName: 'M/s Shankara Online Solutions LLP',
    category: 'GST',
    frequency: 'monthly',
    dueDate: '2027-01-20',
    periodCovered: 'December 2026',
    statutoryAct: 'CGST Act, 2017 (Section 39)',
    description: 'Monthly summary return and net tax remittance for December 2026.',
    statutoryLateFeesOrPenalty: 'Late fee ₹50/day up to max ₹10,000 + 18% p.a. interest.',
    portalName: 'GST Common Portal',
    portalUrl: 'https://services.gst.gov.in/services/login',
    status: 'pending',
    priority: 'high',
  },
  {
    id: 'comp-jan27-tds-q3-return',
    title: 'Quarterly TDS Return (Form 26Q & 24Q) - Q3',
    code: 'Form 26Q / 24Q',
    entity: 'company',
    entityName: 'M/s Shankara Online Solutions LLP',
    category: 'TDS',
    frequency: 'quarterly',
    dueDate: '2027-01-31',
    periodCovered: 'Q3 FY 2026-27 (Oct - Dec 2026)',
    statutoryAct: 'Income Tax Act, 1961 (Section 200(3))',
    description: 'Quarterly statement of tax deducted at source in respect of non-salary payments (Form 26Q) and salary payments (Form 24Q) for Q3.',
    statutoryLateFeesOrPenalty: 'Late fee under Section 234E of ₹200 per day until filing, plus penalty under Section 271H up to ₹1,00,000.',
    portalName: 'TRACES / Protean',
    portalUrl: 'https://www.tdscpc.gov.in',
    status: 'pending',
    priority: 'high',
  },

  // ==========================================
  // MARCH 2027 COMPLIANCES
  // ==========================================
  {
    id: 'comp-mar27-adv-tax-corp',
    title: 'Advance Tax Final Installment (100% Cumulative) - Company',
    code: 'Advance Tax 100%',
    entity: 'company',
    entityName: 'M/s Shankara Online Solutions LLP',
    category: 'INCOME_TAX',
    frequency: 'quarterly',
    dueDate: '2027-03-15',
    periodCovered: 'FY 2026-27 (Full Year)',
    statutoryAct: 'Income Tax Act, 1961 (Section 208/211)',
    description: 'Final installment of advance tax (100% of estimated annual income tax liability) for Shankara Online Solutions LLP.',
    statutoryLateFeesOrPenalty: 'Mandatory interest under Section 234B (@ 1% per month for shortfall in aggregate tax) & Section 234C.',
    portalName: 'Income Tax e-Filing Portal',
    portalUrl: 'https://eportal.incometax.gov.in',
    status: 'pending',
    priority: 'high',
  },
  {
    id: 'comp-mar27-adv-tax-indiv',
    title: 'Advance Tax Final Installment (100% Cumulative) - Individual',
    code: 'Advance Tax 100%',
    entity: 'individual',
    entityName: 'Manjunath Naik S',
    category: 'INCOME_TAX',
    frequency: 'quarterly',
    dueDate: '2027-03-15',
    periodCovered: 'FY 2026-27 (Full Year)',
    statutoryAct: 'Income Tax Act, 1961 (Section 208/211)',
    description: 'Final installment of advance tax (100% of estimated individual tax liability) for Manjunath Naik S (PAN: AMAPN1977B).',
    statutoryLateFeesOrPenalty: 'Interest under Section 234B & 234C @ 1% per month.',
    portalName: 'Income Tax e-Filing Portal',
    portalUrl: 'https://eportal.incometax.gov.in',
    status: 'pending',
    priority: 'high',
  },
  {
    id: 'comp-mar27-tax-saving-indiv',
    title: 'Annual Tax Saving Investments Deadline (80C, 80D, NPS)',
    code: 'Tax Saving 80C/80D',
    entity: 'individual',
    entityName: 'Manjunath Naik S',
    category: 'PERSONAL_FINANCE',
    frequency: 'annual',
    dueDate: '2027-03-31',
    periodCovered: 'FY 2026-27',
    statutoryAct: 'Income Tax Act, 1961 (Chapter VI-A)',
    description: 'Final deadline for completing tax saving investments for FY 2026-27: PPF, ELSS mutual funds, Life Insurance, Health Insurance (80D), and National Pension System (NPS 80CCD).',
    statutoryLateFeesOrPenalty: 'Ineligibility to claim Chapter VI-A deductions for FY 2026-27, leading to higher tax outgo.',
    portalName: 'Personal Bank / Mutual Fund Portals',
    portalUrl: 'https://eportal.incometax.gov.in',
    status: 'pending',
    priority: 'medium',
  },

  // ==========================================
  // APRIL - MAY 2027 COMPLIANCES (ANNUAL / ROC)
  // ==========================================
  {
    id: 'comp-apr27-bbmp-property-tax',
    title: 'BBMP Property Tax Early Payment (5% Rebate Scheme)',
    code: 'Property Tax',
    entity: 'individual',
    entityName: 'Manjunath Naik S',
    category: 'PERSONAL_FINANCE',
    frequency: 'annual',
    dueDate: '2027-04-30',
    periodCovered: 'FY 2027-28',
    statutoryAct: 'Bruhat Bengaluru Mahanagara Palike (BBMP) Act, 2020',
    description: 'Annual property tax payment for residential / commercial premises in Rajarajeshwari Nagar, Bengaluru (eligible for 5% statutory early bird rebate if paid in April).',
    statutoryLateFeesOrPenalty: 'Loss of 5% discount; 2% per month penalty interest for delayed payments.',
    portalName: 'BBMP Property Tax Portal',
    portalUrl: 'https://bbmptax.karnataka.gov.in',
    status: 'pending',
    priority: 'medium',
  },
  {
    id: 'comp-may27-llp-form11',
    title: 'LLP Form 11 (Annual Return of Limited Liability Partnership)',
    code: 'LLP Form 11',
    entity: 'company',
    entityName: 'M/s Shankara Online Solutions LLP',
    category: 'MCA_LLP',
    frequency: 'annual',
    dueDate: '2027-05-30',
    periodCovered: 'FY 2026-27',
    statutoryAct: 'Limited Liability Partnership Act, 2008 (Section 35)',
    description: 'Annual return filed with the Ministry of Corporate Affairs (MCA) containing summary of management affairs and partners of the LLP within 60 days of financial year end.',
    statutoryLateFeesOrPenalty: 'Statutory additional fee of ₹100 per day of delay without any maximum ceiling.',
    portalName: 'MCA V3 Portal',
    portalUrl: 'https://www.mca.gov.in',
    status: 'pending',
    priority: 'high',
  },
  {
    id: 'comp-may27-tds-q4-return',
    title: 'Quarterly TDS Return (Form 26Q & 24Q) - Q4',
    code: 'Form 26Q / 24Q',
    entity: 'company',
    entityName: 'M/s Shankara Online Solutions LLP',
    category: 'TDS',
    frequency: 'quarterly',
    dueDate: '2027-05-31',
    periodCovered: 'Q4 FY 2026-27 (Jan - Mar 2027)',
    statutoryAct: 'Income Tax Act, 1961 (Section 200(3))',
    description: 'Quarterly statement of tax deducted at source for Q4 (Non-salary Form 26Q and Salary Form 24Q).',
    statutoryLateFeesOrPenalty: 'Late fee under Section 234E of ₹200 per day until filing, plus penalty under Section 271H.',
    portalName: 'TRACES Portal',
    portalUrl: 'https://www.tdscpc.gov.in',
    status: 'pending',
    priority: 'high',
  },

  // ==========================================
  // JULY 2027 COMPLIANCES (INCOME TAX RETURNS)
  // ==========================================
  {
    id: 'comp-jul27-itr-individual',
    title: 'Income Tax Return (ITR-3/4) - Individual',
    code: 'ITR Filing',
    entity: 'individual',
    entityName: 'Manjunath Naik S',
    category: 'INCOME_TAX',
    frequency: 'annual',
    dueDate: '2027-07-31',
    periodCovered: 'AY 2027-28 (FY 2026-27)',
    statutoryAct: 'Income Tax Act, 1961 (Section 139(1))',
    description: 'Filing of annual Income Tax Return for Manjunath Naik S (Partner / Individual business & professional income).',
    statutoryLateFeesOrPenalty: 'Late filing fee under Section 234F up to ₹5,000 + interest under Section 234A @ 1% per month on unpaid tax.',
    portalName: 'Income Tax e-Filing Portal',
    portalUrl: 'https://eportal.incometax.gov.in',
    status: 'pending',
    priority: 'high',
  },
  {
    id: 'comp-jul27-itr-llp',
    title: 'Income Tax Return (ITR-5) - Company (LLP)',
    code: 'ITR-5 (LLP)',
    entity: 'company',
    entityName: 'M/s Shankara Online Solutions LLP',
    category: 'INCOME_TAX',
    frequency: 'annual',
    dueDate: '2027-07-31',
    periodCovered: 'AY 2027-28 (FY 2026-27)',
    statutoryAct: 'Income Tax Act, 1961 (Section 139(1))',
    description: 'Annual Income Tax Return filing for Shankara Online Solutions LLP (for non-tax audit entities; if subject to tax audit under 44AB, extended to 31 Oct).',
    statutoryLateFeesOrPenalty: 'Late fee under Section 234F up to ₹5,000 + Section 234A interest @ 1% per month.',
    portalName: 'Income Tax e-Filing Portal',
    portalUrl: 'https://eportal.incometax.gov.in',
    status: 'pending',
    priority: 'high',
  },

  // ==========================================
  // SEPTEMBER - OCTOBER 2027 COMPLIANCES
  // ==========================================
  {
    id: 'comp-sep27-dir3-kyc',
    title: 'DIR-3 KYC for Designated Partners of LLP',
    code: 'DIR-3 KYC',
    entity: 'individual',
    entityName: 'Manjunath Naik S (Designated Partner)',
    category: 'MCA_LLP',
    frequency: 'annual',
    dueDate: '2027-09-30',
    periodCovered: 'FY 2027-28',
    statutoryAct: 'Companies (Appointment and Qualification of Directors) Rules, 2014',
    description: 'Annual KYC verification of Director / Designated Partner Identification Number (DPIN/DIN) on MCA V3 portal via Web-KYC OTP or Form DIR-3 KYC.',
    statutoryLateFeesOrPenalty: 'DIN deactivation / disqualification + mandatory statutory penalty of ₹5,000 per DIN for reactivation.',
    portalName: 'MCA V3 Portal',
    portalUrl: 'https://www.mca.gov.in',
    status: 'pending',
    priority: 'high',
  },
  {
    id: 'comp-oct27-llp-form8',
    title: 'LLP Form 8 (Statement of Account & Solvency)',
    code: 'LLP Form 8',
    entity: 'company',
    entityName: 'M/s Shankara Online Solutions LLP',
    category: 'MCA_LLP',
    frequency: 'annual',
    dueDate: '2027-10-30',
    periodCovered: 'FY 2026-27',
    statutoryAct: 'Limited Liability Partnership Act, 2008 (Section 34(2))',
    description: 'Statutory Statement of Account & Solvency filed with the Registrar of Companies (ROC) within 30 days of end of 6 months of FY.',
    statutoryLateFeesOrPenalty: 'Statutory additional fee of ₹100 per day of delay without any maximum ceiling.',
    portalName: 'MCA V3 Portal',
    portalUrl: 'https://www.mca.gov.in',
    status: 'pending',
    priority: 'high',
  },
];

/**
 * Storage helpers
 */
export const getStoredCompliances = (): ComplianceItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_COMPLIANCES);
    let items: ComplianceItem[] = [];
    if (!raw) {
      items = DEFAULT_COMPLIANCES;
    } else {
      const parsed = JSON.parse(raw);
      items = Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_COMPLIANCES;
    }

    // Always recompute dynamic status against current date
    const todayStr = '2026-11-23';
    return items.map((item) => {
      const { status, daysOverdue, daysUntilDue } = computeItemStatus(item, todayStr);
      return {
        ...item,
        status,
        daysOverdue,
        daysUntilDue,
      };
    });
  } catch (e) {
    console.error('Failed to parse compliances from storage:', e);
    return DEFAULT_COMPLIANCES;
  }
};

export const saveStoredCompliances = (items: ComplianceItem[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY_COMPLIANCES, JSON.stringify(items));
    window.dispatchEvent(new Event('compliance_updated'));
  } catch (e) {
    console.error('Failed to save compliances to storage:', e);
  }
};

export const markComplianceAsCompleted = (
  id: string,
  details: ComplianceFilingRecord
): void => {
  const items = getStoredCompliances();
  const updated = items.map((item) => {
    if (item.id === id) {
      return {
        ...item,
        status: 'completed' as ComplianceStatus,
        filingDetails: details,
      };
    }
    return item;
  });
  saveStoredCompliances(updated);
};

export const markComplianceAsPending = (id: string): void => {
  const items = getStoredCompliances();
  const updated = items.map((item) => {
    if (item.id === id) {
      const copy = { ...item };
      delete copy.filingDetails;
      const { status, daysOverdue, daysUntilDue } = computeItemStatus(copy);
      return { ...copy, status, daysOverdue, daysUntilDue };
    }
    return item;
  });
  saveStoredCompliances(updated);
};

export const addCustomCompliance = (
  newItem: Omit<ComplianceItem, 'id' | 'status' | 'daysOverdue' | 'daysUntilDue'>
): ComplianceItem => {
  const items = getStoredCompliances();
  const id = `comp-custom-${Date.now()}`;
  const fullItem: ComplianceItem = {
    ...newItem,
    id,
    isCustom: true,
    status: 'pending',
  };
  const { status, daysOverdue, daysUntilDue } = computeItemStatus(fullItem);
  fullItem.status = status;
  fullItem.daysOverdue = daysOverdue;
  fullItem.daysUntilDue = daysUntilDue;

  saveStoredCompliances([fullItem, ...items]);
  return fullItem;
};

export const updateCompliance = (
  id: string,
  updates: Partial<ComplianceItem>
): void => {
  const items = getStoredCompliances();
  const updated = items.map((item) => {
    if (item.id === id) {
      const merged = { ...item, ...updates };
      const { status, daysOverdue, daysUntilDue } = computeItemStatus(merged);
      return { ...merged, status, daysOverdue, daysUntilDue };
    }
    return item;
  });
  saveStoredCompliances(updated);
};

export const deleteCompliance = (id: string): void => {
  const items = getStoredCompliances();
  const updated = items.filter((item) => item.id !== id);
  saveStoredCompliances(updated);
};

export const resetToDefaultCompliances = (): void => {
  saveStoredCompliances(DEFAULT_COMPLIANCES);
};

/**
 * Category styling configuration
 */
export const COMPLIANCE_CATEGORY_CONFIG: Record<
  ComplianceCategory,
  { label: string; bg: string; text: string; border: string; pillColor: string }
> = {
  GST: {
    label: 'GST',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    pillColor: '#2563eb',
  },
  TDS: {
    label: 'TDS / TCS',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    pillColor: '#7c3aed',
  },
  INCOME_TAX: {
    label: 'Income Tax',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    pillColor: '#059669',
  },
  MCA_LLP: {
    label: 'MCA / ROC',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    pillColor: '#d97706',
  },
  PAYROLL_PT: {
    label: 'PT & Payroll',
    bg: 'bg-cyan-50',
    text: 'text-cyan-800',
    border: 'border-cyan-200',
    pillColor: '#0891b2',
  },
  PERSONAL_FINANCE: {
    label: 'Personal Tax & Assets',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    pillColor: '#e11d48',
  },
  OTHER: {
    label: 'Other Statutory',
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
    pillColor: '#4b5563',
  },
};
