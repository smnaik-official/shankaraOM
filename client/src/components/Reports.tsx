import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart,
  Bar,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  IndianRupee,
  BarChart3,
  Percent,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  CheckCircle2,
  Building2,
  FileText,
  ChevronDown,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { FinancialReportPDF } from './FinancialReportPDF';
import { getStoredBillingProfiles } from '../data/profile';
import { getStoredInvoices } from '../data/invoices';
import { getStoredExpenses } from '../data/expenses';
import { getStoredAdLedger } from './AdLedger';

interface MonthlyRecord {
  ym: string;
  month: string;
  fullMonth: string;
  year: number;
  income: number;
  expenses: number;
  payroll: number;
  adSpend: number;
  software: number;
  office: number;
  quarter: string;
}

export type TimeRangeOption = '3M' | '6M' | '9M' | '12M' | 'THIS_YEAR' | 'LAST_YEAR';

interface TimeRangeConfig {
  id: TimeRangeOption;
  label: string;
  shortLabel: string;
  badge?: string;
}

const currentYearNum = new Date().getFullYear();
const lastYearNum = currentYearNum - 1;

const timeRangeOptions: TimeRangeConfig[] = [
  { id: '3M', label: 'Last 3 Months', shortLabel: '3 Months' },
  { id: '6M', label: 'Last 6 Months', shortLabel: '6 Months' },
  { id: '9M', label: 'Last 9 Months', shortLabel: '9 Months' },
  { id: '12M', label: 'Last 12 Months', shortLabel: '12 Months' },
  { id: 'THIS_YEAR', label: 'This Year', shortLabel: `This Year (${currentYearNum})`, badge: String(currentYearNum) },
  { id: 'LAST_YEAR', label: 'Last Year', shortLabel: `Last Year (${lastYearNum})`, badge: String(lastYearNum) },
];

const CLIENT_SHARE_COLORS = ['#4f46e5', '#06b6d4', '#8b5cf6', '#f59e0b', '#64748b'];

const costCategoryColors: Record<string, string> = {
  Payroll: '#4f46e5',
  'Ad Spends': '#ec4899',
  'Software & IT': '#06b6d4',
  'Office & Operations': '#f59e0b',
};

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

const formatCompactCurrency = (val: number) => {
  if (Math.abs(val) >= 100000) {
    return `₹${(val / 100000).toFixed(1)}L`;
  }
  if (Math.abs(val) >= 1000) {
    return `₹${(val / 1000).toFixed(0)}k`;
  }
  return `₹${val}`;
};

const StatCard: React.FC<{
  title: string;
  value: string;
  sub: string;
  positive: boolean;
  icon: React.ElementType;
  caption?: string;
}> = ({ title, value, sub, positive, icon: Icon, caption }) => (
  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-3">
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <div className={`p-2.5 rounded-lg ${positive ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <h3 className="text-2xl font-heading font-bold text-gray-900 mb-1.5">{value}</h3>
    <div className="flex items-center justify-between">
      <div className={`flex items-center gap-1 text-xs font-semibold ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
        {positive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
        <span>{sub}</span>
      </div>
      {caption && <span className="text-xs text-gray-400">{caption}</span>}
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isProfitable = data.netProfit >= 0;
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-xl text-xs max-w-xs z-50">
        <p className="font-heading font-bold text-gray-900 border-b border-gray-100 pb-1.5 mb-2.5 text-sm">
          {data.fullMonth || label}
        </p>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-gray-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#6a5fa8' }}></span>
              Gross Income:
            </span>
            <span className="font-semibold text-gray-900">{formatCurrency(data.income)}</span>
          </div>
          <div className="flex justify-between items-center text-gray-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#cebbdb' }}></span>
              Total Expenses:
            </span>
            <span className="font-semibold text-gray-900">{formatCurrency(data.expenses)}</span>
          </div>
          <div className="border-t border-gray-100 pt-1.5 mt-1 flex justify-between items-center">
            <span className="font-medium text-gray-700">Net Profit (Savings):</span>
            <span className={`font-bold ${isProfitable ? 'text-indigo-600' : 'text-slate-600'}`}>
              {formatCurrency(data.netProfit)}
            </span>
          </div>
          <div className="flex justify-between items-center text-gray-500">
            <span>Net Profit Margin:</span>
            <span className="font-semibold text-indigo-600">{data.profitMargin}%</span>
          </div>
          {data.momIncomeGrowth !== null && data.momIncomeGrowth !== undefined && (
            <div className="flex justify-between items-center text-gray-500">
              <span>MoM Income Change:</span>
              <span className={`font-semibold ${data.momIncomeGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {data.momIncomeGrowth >= 0 ? `+${data.momIncomeGrowth}%` : `${data.momIncomeGrowth}%`}
              </span>
            </div>
          )}
          {data.momExpenseGrowth !== null && data.momExpenseGrowth !== undefined && (
            <div className="flex justify-between items-center text-gray-500">
              <span>MoM Expense Change:</span>
              <span className={`font-semibold ${data.momExpenseGrowth <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {data.momExpenseGrowth >= 0 ? `+${data.momExpenseGrowth}%` : `${data.momExpenseGrowth}%`}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

const Reports: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRangeOption>('12M');
  const [activeTab, setActiveTab] = useState<'all' | 'mom' | 'profit' | 'expenses' | 'revenue'>('all');
  const [chartMode, setChartMode] = useState<'grouped' | 'composed' | 'stacked'>('grouped');
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const exportDropdownRef = React.useRef<HTMLDivElement>(null);

  const [invoices, setInvoices] = useState(() => getStoredInvoices());
  const [expenses, setExpenses] = useState(() => getStoredExpenses());
  const [adLedger, setAdLedger] = useState(() => getStoredAdLedger());

  useEffect(() => {
    const refresh = () => {
      setInvoices(getStoredInvoices());
      setExpenses(getStoredExpenses());
      setAdLedger(getStoredAdLedger());
    };
    const events = ['invoices_updated', 'expenses_updated', 'ad_ledger_updated', 'storage'];
    events.forEach((ev) => window.addEventListener(ev, refresh));
    return () => events.forEach((ev) => window.removeEventListener(ev, refresh));
  }, []);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setExportDropdownOpen(false);
      }
    };
    if (exportDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [exportDropdownOpen]);

  // Build monthly series from live invoices, expenses & ad ledger (lastYear Jan .. current month)
  const rawMonthlyData = useMemo<MonthlyRecord[]>(() => {
    const now = new Date();
    const startYear = now.getFullYear() - 1;
    const endYear = now.getFullYear();
    const endMonth = now.getMonth();

    const buckets: MonthlyRecord[] = [];
    for (let y = startYear; y <= endYear; y++) {
      const maxM = y === endYear ? endMonth : 11;
      for (let m = 0; m <= maxM; m++) {
        const d = new Date(y, m, 1);
        const ym = `${y}-${String(m + 1).padStart(2, '0')}`;
        const shortM = d.toLocaleDateString('en-US', { month: 'short' });
        const longM = d.toLocaleDateString('en-US', { month: 'long' });
        const quarterNum = Math.floor(m / 3) + 1;

        const income = invoices
          .filter((inv) => inv.status !== 'Cancelled' && (inv.date || '').startsWith(ym))
          .reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);

        const monthExps = expenses.filter((exp) => (exp.date || '').startsWith(ym));
        const payroll = monthExps
          .filter((e) => e.category === 'Payroll')
          .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        const software = monthExps
          .filter((e) => e.category === 'IT')
          .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        const marketingExp = monthExps
          .filter((e) => e.category === 'Marketing')
          .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        const adSpendLedger = adLedger
          .filter((ad) => ad.type === 'Spend' && (ad.date || '').startsWith(ym))
          .reduce((sum, ad) => sum + (Number(ad.amount) || 0), 0);
        const adSpend = marketingExp + adSpendLedger;
        const office = monthExps
          .filter((e) => e.category !== 'Payroll' && e.category !== 'IT' && e.category !== 'Marketing')
          .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

        buckets.push({
          ym,
          month: `${shortM} ${String(y).slice(-2)}`,
          fullMonth: `${longM} ${y}`,
          year: y,
          income,
          expenses: payroll + adSpend + software + office,
          payroll,
          adSpend,
          software,
          office,
          quarter: `Q${quarterNum} ${y}`,
        });
      }
    }
    return buckets;
  }, [invoices, expenses, adLedger]);

  // Process raw data with MoM metrics across full history
  const enrichedData = useMemo(() => {
    return rawMonthlyData.map((curr, idx, arr) => {
      const prev = idx > 0 ? arr[idx - 1] : null;
      const netProfit = curr.income - curr.expenses;
      const profitMargin = curr.income > 0 ? Number(((netProfit / curr.income) * 100).toFixed(1)) : 0;
      const momIncomeGrowth =
        prev && prev.income > 0
          ? Number((((curr.income - prev.income) / prev.income) * 100).toFixed(1))
          : null;
      const momExpenseGrowth =
        prev && prev.expenses > 0
          ? Number((((curr.expenses - prev.expenses) / prev.expenses) * 100).toFixed(1))
          : null;
      const efficiencyRatio = curr.income > 0 ? Number(((curr.expenses / curr.income) * 100).toFixed(1)) : 0;

      return {
        ...curr,
        netProfit,
        profitMargin,
        momIncomeGrowth,
        momExpenseGrowth,
        efficiencyRatio,
      };
    });
  }, [rawMonthlyData]);

  // Filter dataset dynamically based on user's selected time range
  const displayData = useMemo(() => {
    switch (timeRange) {
      case '3M':
        return enrichedData.slice(-3);
      case '6M':
        return enrichedData.slice(-6);
      case '9M':
        return enrichedData.slice(-9);
      case '12M':
        return enrichedData.slice(-12);
      case 'THIS_YEAR':
        return enrichedData.filter((d) => d.year === currentYearNum);
      case 'LAST_YEAR':
        return enrichedData.filter((d) => d.year === lastYearNum);
      default:
        return enrichedData.slice(-12);
    }
  }, [enrichedData, timeRange]);

  // Dynamic client & profile revenue breakdown for selected period
  const { clientRevenueShare, invoiceProfileShare } = useMemo(() => {
    const activeMonths = new Set(displayData.map((d) => d.ym));
    const periodInvoices = invoices.filter(
      (inv) => inv.status !== 'Cancelled' && activeMonths.has((inv.date || '').slice(0, 7))
    );
    const totalRev = periodInvoices.reduce((s, inv) => s + (Number(inv.amount) || 0), 0);

    const byClient = new Map<string, number>();
    periodInvoices.forEach((inv) => {
      const name = inv.client || 'Unknown Client';
      byClient.set(name, (byClient.get(name) || 0) + (Number(inv.amount) || 0));
    });

    const sortedClients = Array.from(byClient.entries()).sort((a, b) => b[1] - a[1]);
    const topClients = sortedClients.slice(0, 4);
    const othersTotal = sortedClients.slice(4).reduce((s, [, val]) => s + val, 0);
    if (othersTotal > 0) {
      topClients.push(['Other Accounts', othersTotal]);
    }

    const clientShare = topClients.map(([name, value], idx) => ({
      name,
      value,
      percentage: totalRev > 0 ? Number(((value / totalRev) * 100).toFixed(1)) : 0,
      color: CLIENT_SHARE_COLORS[idx % CLIENT_SHARE_COLORS.length],
    }));

    const companyTotal = periodInvoices
      .filter((inv) => inv.type === 'COMPANY')
      .reduce((s, inv) => s + (Number(inv.amount) || 0), 0);
    const personalTotal = periodInvoices
      .filter((inv) => inv.type === 'PERSONAL')
      .reduce((s, inv) => s + (Number(inv.amount) || 0), 0);

    const profileShare = [
      {
        name: 'Company Billing',
        value: companyTotal,
        percentage: totalRev > 0 ? Number(((companyTotal / totalRev) * 100).toFixed(1)) : 0,
        color: '#4f46e5',
      },
      {
        name: 'Personal Billing',
        value: personalTotal,
        percentage: totalRev > 0 ? Number(((personalTotal / totalRev) * 100).toFixed(1)) : 0,
        color: '#ec4899',
      },
    ];

    return { clientRevenueShare: clientShare, invoiceProfileShare: profileShare };
  }, [displayData, invoices]);

  // Dynamic range label description
  const rangeDescription = useMemo(() => {
    if (displayData.length === 0) return '';
    const first = displayData[0];
    const last = displayData[displayData.length - 1];
    return `${first.fullMonth} – ${last.fullMonth} (${displayData.length} Months)`;
  }, [displayData]);

  // Aggregate Metrics for the selected period
  const aggregates = useMemo(() => {
    const totalIncome = displayData.reduce((acc, curr) => acc + curr.income, 0);
    const totalExpenses = displayData.reduce((acc, curr) => acc + curr.expenses, 0);
    const totalNetProfit = totalIncome - totalExpenses;
    const overallMargin = totalIncome > 0 ? Number(((totalNetProfit / totalIncome) * 100).toFixed(1)) : 0;
    const avgMonthlyIncome = displayData.length > 0 ? Math.round(totalIncome / displayData.length) : 0;
    const avgMonthlyExpense = displayData.length > 0 ? Math.round(totalExpenses / displayData.length) : 0;
    const overallEfficiency = totalIncome > 0 ? Number(((totalExpenses / totalIncome) * 100).toFixed(1)) : 0;

    // Latest month MoM performance
    const latest = displayData[displayData.length - 1];
    const prev = displayData.length > 1 ? displayData[displayData.length - 2] : null;
    const latestIncomeGrowth =
      latest && prev && prev.income > 0
        ? Number((((latest.income - prev.income) / prev.income) * 100).toFixed(1))
        : 0;
    const latestExpenseGrowth =
      latest && prev && prev.expenses > 0
        ? Number((((latest.expenses - prev.expenses) / prev.expenses) * 100).toFixed(1))
        : 0;

    // Breakdown for expenses
    const totalPayroll = displayData.reduce((acc, curr) => acc + curr.payroll, 0);
    const totalAdSpend = displayData.reduce((acc, curr) => acc + curr.adSpend, 0);
    const totalSoftware = displayData.reduce((acc, curr) => acc + curr.software, 0);
    const totalOffice = displayData.reduce((acc, curr) => acc + curr.office, 0);

    return {
      totalIncome,
      totalExpenses,
      totalNetProfit,
      overallMargin,
      avgMonthlyIncome,
      avgMonthlyExpense,
      overallEfficiency,
      latestIncomeGrowth,
      latestExpenseGrowth,
      costBreakdown: [
        { name: 'Payroll', value: totalPayroll, percent: totalExpenses > 0 ? ((totalPayroll / totalExpenses) * 100).toFixed(1) : '0' },
        { name: 'Ad Spends', value: totalAdSpend, percent: totalExpenses > 0 ? ((totalAdSpend / totalExpenses) * 100).toFixed(1) : '0' },
        { name: 'Software & IT', value: totalSoftware, percent: totalExpenses > 0 ? ((totalSoftware / totalExpenses) * 100).toFixed(1) : '0' },
        { name: 'Office & Operations', value: totalOffice, percent: totalExpenses > 0 ? ((totalOffice / totalExpenses) * 100).toFixed(1) : '0' },
      ],
    };
  }, [displayData]);

  // Quarterly summary
  const quarterlyData = useMemo(() => {
    const quarters: Record<string, { quarter: string; income: number; expenses: number; netProfit: number }> = {};
    displayData.forEach((item) => {
      if (!quarters[item.quarter]) {
        quarters[item.quarter] = { quarter: item.quarter, income: 0, expenses: 0, netProfit: 0 };
      }
      quarters[item.quarter].income += item.income;
      quarters[item.quarter].expenses += item.expenses;
      quarters[item.quarter].netProfit += item.netProfit;
    });
    return Object.values(quarters);
  }, [displayData]);

  // CSV Export for filtered range
  const handleExportCSV = () => {
    const headers = [
      'Month',
      'Year',
      'Gross Income (INR)',
      'Total Expenses (INR)',
      'Net Profit (INR)',
      'Profit Margin (%)',
      'Efficiency Ratio (%)',
      'MoM Income Growth (%)',
      'MoM Expense Growth (%)',
    ];
    const rows = displayData.map((d) => [
      d.fullMonth,
      d.year,
      d.income,
      d.expenses,
      d.netProfit,
      `${d.profitMargin}%`,
      `${d.efficiencyRatio}%`,
      d.momIncomeGrowth !== null ? `${d.momIncomeGrowth}%` : 'N/A',
      d.momExpenseGrowth !== null ? `${d.momExpenseGrowth}%` : 'N/A',
    ]);
    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `financial_business_analysis_${timeRange.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Programmatic PDF Export with loading state & direct download trigger
  const handleExportPDF = async () => {
    try {
      setIsExportingPdf(true);
      const companyProfile = getStoredBillingProfiles().company;
      const doc = (
        <FinancialReportPDF
          displayData={displayData}
          aggregates={aggregates}
          quarterlyData={quarterlyData}
          rangeDescription={rangeDescription}
          timeRange={timeRange}
          companyProfile={companyProfile}
        />
      );
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `financial_business_report_${timeRange.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setExportDropdownOpen(false);
    } catch (err) {
      console.error('Failed to generate PDF report:', err);
      alert('Failed to generate PDF report. Please try again.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">Financial Reports & Business Analysis</h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span className="font-medium text-gray-700">{rangeDescription}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time range selector button bar */}
          <div className="hidden lg:flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200 text-xs font-medium">
            {timeRangeOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setTimeRange(opt.id)}
                className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${
                  timeRange === opt.id
                    ? 'bg-white text-indigo-600 shadow-sm font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Compact / Mobile Dropdown */}
          <div className="lg:hidden flex items-center gap-1.5 bg-gray-100 p-1 rounded-lg border border-gray-200">
            <span className="text-xs font-medium text-gray-500 pl-1.5">Period:</span>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as TimeRangeOption)}
              className="bg-white border-0 text-gray-800 text-xs font-semibold rounded-md px-2.5 py-1 shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              {timeRangeOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Unified Export Button with Dropdown (PDF & CSV) */}
          <div className="relative" ref={exportDropdownRef}>
            <button
              type="button"
              onClick={() => setExportDropdownOpen((prev) => !prev)}
              className="flex items-center gap-1.5 bg-white border border-gray-300 hover:border-indigo-400 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              title="Export Report"
            >
              <Download className="w-3.5 h-3.5 text-gray-600" />
              <span>Export</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-150 ${
                  exportDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {exportDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-3.5 py-1.5 text-[10px] uppercase font-bold text-gray-400 tracking-wider border-b border-gray-100 mb-1">
                  Choose Export Format
                </div>

                {/* Option 1: PDF */}
                <button
                  type="button"
                  disabled={isExportingPdf}
                  onClick={handleExportPDF}
                  className="w-full text-left px-3.5 py-2 hover:bg-indigo-50/60 flex items-center gap-3 transition-colors group cursor-pointer disabled:opacity-60"
                >
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0 group-hover:bg-rose-100 transition-colors">
                    {isExportingPdf ? (
                      <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-gray-900 group-hover:text-indigo-600 flex items-center gap-1.5">
                      <span>{isExportingPdf ? 'Generating PDF...' : 'Download as PDF'}</span>
                    </div>
                    <div className="text-[10px] text-gray-500">
                      Executive report with tables & KPIs
                    </div>
                  </div>
                </button>

                {/* Option 2: CSV */}
                <button
                  type="button"
                  onClick={() => {
                    handleExportCSV();
                    setExportDropdownOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-emerald-50/60 flex items-center gap-3 transition-colors group cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-gray-900 group-hover:text-emerald-700">
                      Download as CSV
                    </div>
                    <div className="text-[10px] text-gray-500">
                      Spreadsheet dataset for Excel / Sheets
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 gap-1 overflow-x-auto text-sm">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2.5 border-b-2 font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'all'
              ? 'border-indigo-600 text-indigo-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Layers className="w-4 h-4" />
          Executive Overview
        </button>
        <button
          onClick={() => setActiveTab('mom')}
          className={`px-4 py-2.5 border-b-2 font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'mom'
              ? 'border-indigo-600 text-indigo-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          MoM Income vs Expenses (Bar Graph)
        </button>
        <button
          onClick={() => setActiveTab('profit')}
          className={`px-4 py-2.5 border-b-2 font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'profit'
              ? 'border-indigo-600 text-indigo-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Percent className="w-4 h-4" />
          Profitability & Margins
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-4 py-2.5 border-b-2 font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'expenses'
              ? 'border-indigo-600 text-indigo-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Wallet className="w-4 h-4" />
          Cost Structure & Burn
        </button>
        <button
          onClick={() => setActiveTab('revenue')}
          className={`px-4 py-2.5 border-b-2 font-medium flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'revenue'
              ? 'border-indigo-600 text-indigo-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Revenue Distribution
        </button>
      </div>

      {/* Top Level Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Period Revenue"
          value={formatCurrency(aggregates.totalIncome)}
          sub={`${aggregates.latestIncomeGrowth >= 0 ? '+' : ''}${aggregates.latestIncomeGrowth}% MoM`}
          positive={aggregates.latestIncomeGrowth >= 0}
          icon={IndianRupee}
          caption={`Avg ${formatCompactCurrency(aggregates.avgMonthlyIncome)}/mo`}
        />
        <StatCard
          title="Total Operating Expenses"
          value={formatCurrency(aggregates.totalExpenses)}
          sub={`${aggregates.latestExpenseGrowth >= 0 ? '+' : ''}${aggregates.latestExpenseGrowth}% MoM`}
          positive={aggregates.latestExpenseGrowth <= 0}
          icon={Wallet}
          caption={`Avg ${formatCompactCurrency(aggregates.avgMonthlyExpense)}/mo`}
        />
        <StatCard
          title="Net Operating Profit"
          value={formatCurrency(aggregates.totalNetProfit)}
          sub={`${aggregates.overallMargin}% Net Margin`}
          positive={aggregates.totalNetProfit > 0}
          icon={Percent}
          caption="Positive Cash Flow"
        />
        <StatCard
          title="Efficiency Ratio"
          value={`${aggregates.overallEfficiency}%`}
          sub="Expense to Income"
          positive={aggregates.overallEfficiency < 65}
          icon={TrendingUp}
          caption="Target < 65%"
        />
      </div>

      {/* Tab: All Analytics or MoM Dedicated Tab */}
      {(activeTab === 'all' || activeTab === 'mom') && (
        <div className="space-y-6">
          {/* Main Month-on-Month Income vs Expenses Bar Chart */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-heading font-bold text-gray-900">
                    Month-on-Month Income vs Expenses
                  </h3>
                  <span className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                    Core Business Metric
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Side-by-side comparison of cash inflow (invoiced gross income) against total outflow (operating costs).
                </p>
              </div>

              {/* Chart Mode Controls */}
              <div className="flex items-center bg-gray-50 p-1 rounded-lg border border-gray-200 text-xs">
                <button
                  onClick={() => setChartMode('grouped')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    chartMode === 'grouped'
                      ? 'bg-white text-indigo-600 font-semibold shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Grouped Bars
                </button>
                <button
                  onClick={() => setChartMode('composed')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    chartMode === 'composed'
                      ? 'bg-white text-indigo-600 font-semibold shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Bars + Profit Margin Line
                </button>
                <button
                  onClick={() => setChartMode('stacked')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    chartMode === 'stacked'
                      ? 'bg-white text-indigo-600 font-semibold shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Stacked
                </button>
              </div>
            </div>

            {/* Quick Chart KPI Callouts */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 bg-gray-50 p-3.5 rounded-lg border border-gray-100 text-xs">
              <div>
                <span className="text-gray-500">Highest Inflow Month:</span>
                <p className="font-semibold text-gray-800 text-sm mt-0.5">
                  {displayData.reduce((prev, curr) => (curr.income > prev.income ? curr : prev), displayData[0])?.month} (
                  {formatCurrency(
                    displayData.reduce((prev, curr) => (curr.income > prev.income ? curr : prev), displayData[0])?.income || 0
                  )})
                </p>
              </div>
              <div>
                <span className="text-gray-500">Highest Margin Month:</span>
                <p className="font-semibold text-indigo-600 text-sm mt-0.5">
                  {displayData.reduce((prev, curr) => (curr.profitMargin > prev.profitMargin ? curr : prev), displayData[0])?.month} (
                  {displayData.reduce((prev, curr) => (curr.profitMargin > prev.profitMargin ? curr : prev), displayData[0])?.profitMargin}% Margin)
                </p>
              </div>
              <div>
                <span className="text-gray-500">Lowest Burn Month:</span>
                <p className="font-semibold text-gray-800 text-sm mt-0.5">
                  {displayData.reduce((prev, curr) => (curr.expenses < prev.expenses ? curr : prev), displayData[0])?.month} (
                  {formatCurrency(
                    displayData.reduce((prev, curr) => (curr.expenses < prev.expenses ? curr : prev), displayData[0])?.expenses || 0
                  )})
                </p>
              </div>
              <div>
                <span className="text-gray-500">Average Monthly Spread:</span>
                <p className="font-semibold text-indigo-600 text-sm mt-0.5">
                  +{formatCompactCurrency(aggregates.totalNetProfit / (displayData.length || 1))} Net / mo
                </p>
              </div>
            </div>

            {/* Recharts Bar Graph */}
            <div className="h-80 sm:h-96">
              <ResponsiveContainer width="100%" height="100%">
                {chartMode === 'composed' ? (
                  <ComposedChart data={displayData} margin={{ top: 15, right: 25, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <YAxis
                      yAxisId="left"
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={formatCompactCurrency}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => `${val}%`}
                      tick={{ fill: '#8b5cf6', fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '15px' }} />
                    <Bar
                      yAxisId="left"
                      dataKey="income"
                      name="Gross Income"
                      fill="#6a5fa8"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="expenses"
                      name="Total Expenses"
                      fill="#cebbdb"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="profitMargin"
                      name="Net Profit Margin (%)"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#8b5cf6' }}
                      activeDot={{ r: 6 }}
                    />
                  </ComposedChart>
                ) : (
                  <BarChart data={displayData} margin={{ top: 15, right: 25, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={formatCompactCurrency}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: '15px' }} />
                    <Bar
                      dataKey="income"
                      name="Gross Income"
                      fill="#6a5fa8"
                      stackId={chartMode === 'stacked' ? 'a' : undefined}
                      radius={chartMode === 'stacked' ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                    <Bar
                      dataKey="expenses"
                      name="Total Expenses"
                      fill="#cebbdb"
                      stackId={chartMode === 'stacked' ? 'a' : undefined}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed MoM Breakdown & Variance Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-gray-900">Month-on-Month Variance & Growth Analysis</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Granular financial tracking with monthly growth rates and net retained earnings.
                </p>
              </div>
              <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md">
                {displayData.length} Months Tracked
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200 uppercase tracking-wider">
                    <th className="py-3 px-4">Period</th>
                    <th className="py-3 px-4">Gross Income</th>
                    <th className="py-3 px-4">MoM Income Growth</th>
                    <th className="py-3 px-4">Total Expenses</th>
                    <th className="py-3 px-4">MoM Expense Change</th>
                    <th className="py-3 px-4">Net Profit</th>
                    <th className="py-3 px-4">Profit Margin</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {displayData.map((row) => (
                    <tr key={row.month} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-gray-900">{row.fullMonth}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">{formatCurrency(row.income)}</td>
                      <td className="py-3 px-4">
                        {row.momIncomeGrowth !== null ? (
                          <span
                            className={`inline-flex items-center gap-1 font-semibold ${
                              row.momIncomeGrowth >= 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {row.momIncomeGrowth >= 0 ? (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowDownRight className="w-3.5 h-3.5" />
                            )}
                            {row.momIncomeGrowth >= 0 ? `+${row.momIncomeGrowth}%` : `${row.momIncomeGrowth}%`}
                          </span>
                        ) : (
                          <span className="text-gray-400">Baseline</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-800">{formatCurrency(row.expenses)}</td>
                      <td className="py-3 px-4">
                        {row.momExpenseGrowth !== null ? (
                          <span
                            className={`inline-flex items-center gap-1 font-semibold ${
                              row.momExpenseGrowth <= 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                          >
                            {row.momExpenseGrowth > 0 ? (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowDownRight className="w-3.5 h-3.5" />
                            )}
                            {row.momExpenseGrowth >= 0 ? `+${row.momExpenseGrowth}%` : `${row.momExpenseGrowth}%`}
                          </span>
                        ) : (
                          <span className="text-gray-400">Baseline</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-900">{formatCurrency(row.netProfit)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-700">{row.profitMargin}%</span>
                          <div className="w-16 bg-gray-100 rounded-full h-1.5 hidden sm:block">
                            <div
                              className="bg-indigo-600 h-1.5 rounded-full"
                              style={{ width: `${Math.min(row.profitMargin * 1.5, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            row.profitMargin >= 45
                              ? 'bg-indigo-50 text-indigo-700'
                              : row.profitMargin >= 30
                              ? 'bg-purple-50 text-purple-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {row.profitMargin >= 45 ? 'High Surplus' : row.profitMargin >= 30 ? 'Healthy' : 'Moderate'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t-2 border-gray-200 font-semibold text-gray-900">
                    <td className="py-3.5 px-4 font-heading">Total / Average</td>
                    <td className="py-3.5 px-4 text-indigo-700 font-semibold">{formatCurrency(aggregates.totalIncome)}</td>
                    <td className="py-3.5 px-4 text-gray-500">—</td>
                    <td className="py-3.5 px-4 text-slate-700 font-semibold">{formatCurrency(aggregates.totalExpenses)}</td>
                    <td className="py-3.5 px-4 text-gray-500">—</td>
                    <td className="py-3.5 px-4 text-indigo-700 font-bold">{formatCurrency(aggregates.totalNetProfit)}</td>
                    <td className="py-3.5 px-4 text-indigo-700 font-bold">{aggregates.overallMargin}% Avg</td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] ${
                          aggregates.totalIncome === 0 && aggregates.totalExpenses === 0
                            ? 'bg-gray-100 text-gray-600'
                            : aggregates.totalNetProfit >= 0
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {aggregates.totalIncome === 0 && aggregates.totalExpenses === 0
                          ? 'No Activity'
                          : aggregates.totalNetProfit >= 0
                            ? 'Overall Profitable'
                            : 'Net Deficit'}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Profitability & Margins */}
      {(activeTab === 'all' || activeTab === 'profit') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Net Profit & Margin Trend Area Chart */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-heading font-bold text-gray-900">Net Profit Trend & Cash Accumulation</h3>
                <p className="text-xs text-gray-500">Monthly net earnings (Income minus all expenses) over time</p>
              </div>
              <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">
                +{aggregates.overallMargin}% Avg Margin
              </span>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={displayData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={formatCompactCurrency} tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="netProfit"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#profitGrad)"
                    name="Net Profit"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quarterly Performance (QoQ Analysis) */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-heading font-bold text-gray-900">Quarterly (QoQ) Business Performance</h3>
                  <p className="text-xs text-gray-500">Aggregated performance across financial quarters in this period</p>
                </div>
                <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">
                  Fiscal Review
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                {quarterlyData.map((q) => {
                  const qMargin = q.income > 0 ? ((q.netProfit / q.income) * 100).toFixed(1) : '0';
                  return (
                    <div key={q.quarter} className="p-4 rounded-lg border border-gray-100 bg-gray-50 hover:bg-white hover:border-indigo-200 transition-all">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-heading font-bold text-gray-900 text-sm">{q.quarter}</span>
                        <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                          {qMargin}% Margin
                        </span>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between text-gray-600">
                          <span>Revenue:</span>
                          <span className="font-semibold text-gray-900">{formatCurrency(q.income)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                          <span>Expenses:</span>
                          <span className="font-semibold text-gray-900">{formatCurrency(q.expenses)}</span>
                        </div>
                        <div className="border-t border-gray-200 pt-1 flex justify-between font-bold text-indigo-600">
                          <span>Net Profit:</span>
                          <span>{formatCurrency(q.netProfit)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-600 flex-shrink-0" />
              <span>Consistent profit margin maintenance driven by stable overheads and growing client retainers.</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Cost Structure & Expenses Breakdown */}
      {(activeTab === 'all' || activeTab === 'expenses') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cost Category Pie Chart */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-heading font-bold text-gray-900">Expense Allocation</h3>
              <span className="text-xs text-gray-500 font-medium">By Category</span>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={aggregates.costBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {aggregates.costBreakdown.map((item) => (
                      <Cell key={item.name} fill={costCategoryColors[item.name] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-2 space-y-2 text-xs">
              {aggregates.costBreakdown.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: costCategoryColors[item.name] || '#94a3b8' }}
                    ></span>
                    <span className="text-gray-600">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-gray-900">{formatCurrency(item.value)}</span>
                    <span className="text-gray-400 ml-1.5">({item.percent}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Operational Burn Analysis & Fixed vs Variable Costs */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm lg:col-span-2 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-heading font-bold text-gray-900 mb-1">
                Cost Structure & Burn Rate Analysis
              </h3>
              <p className="text-xs text-gray-500 mb-5">
                Evaluation of fixed operational commitments versus flexible marketing ad spends.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700">Fixed Overhead</span>
                  <h4 className="text-xl font-heading font-bold text-gray-900 mt-1">
                    {formatCurrency(
                      (aggregates.costBreakdown.find((c) => c.name === 'Payroll')?.value || 0) +
                      (aggregates.costBreakdown.find((c) => c.name === 'Office & Operations')?.value || 0)
                    )}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Payroll, Office leases, utilities, and core software subscriptions.
                  </p>
                  <div className="mt-3 text-xs font-medium text-indigo-900 bg-white/80 px-2.5 py-1 rounded inline-block">
                    {aggregates.totalExpenses > 0
                      ? `${Math.round(
                          (((aggregates.costBreakdown.find((c) => c.name === 'Payroll')?.value || 0) +
                            (aggregates.costBreakdown.find((c) => c.name === 'Office & Operations')?.value || 0)) /
                            aggregates.totalExpenses) *
                            100
                        )}% of total expenditure`
                      : '0% of total expenditure'}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-pink-100 bg-pink-50/50">
                  <span className="text-xs font-semibold uppercase tracking-wider text-pink-700">Variable Costs</span>
                  <h4 className="text-xl font-heading font-bold text-gray-900 mt-1">
                    {formatCurrency(aggregates.costBreakdown.find((c) => c.name === 'Ad Spends')?.value || 0)}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Direct Client Ad Spends (Google/Meta) and project-linked expenses.
                  </p>
                  <div className="mt-3 text-xs font-medium text-pink-900 bg-white/80 px-2.5 py-1 rounded inline-block">
                    {aggregates.totalExpenses > 0
                      ? `${Math.round(
                          ((aggregates.costBreakdown.find((c) => c.name === 'Ad Spends')?.value || 0) /
                            aggregates.totalExpenses) *
                            100
                        )}% scaling with client demand`
                      : '0% of total expenditure'}
                  </div>
                </div>
              </div>

              {/* Progress Bar of Burn Rate */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-gray-700">Cost-to-Income Health Gauge</span>
                  <span className="font-bold" style={{ color: '#6a5fa8' }}>
                    {aggregates.overallEfficiency}% (
                    {aggregates.totalIncome === 0 && aggregates.totalExpenses === 0
                      ? 'No Activity'
                      : aggregates.overallEfficiency < 65
                        ? 'Safe Zone'
                        : 'High Burn'}
                    )
                  </span>
                </div>
                <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden flex">
                  <div
                    className="h-full"
                    style={{ width: `${Math.max(0, 100 - aggregates.overallEfficiency)}%`, backgroundColor: '#6a5fa8' }}
                    title="Retained Margin"
                  ></div>
                  <div
                    className="h-full"
                    style={{ width: `${Math.min(100, aggregates.overallEfficiency)}%`, backgroundColor: '#cebbdb' }}
                    title="Operating Expenses"
                  ></div>
                </div>
                <div className="flex justify-between text-[11px] text-gray-500">
                  <span className="font-medium flex items-center gap-1.5" style={{ color: '#6a5fa8' }}>
                    <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#6a5fa8' }}></span>
                    Retained Net Margin ({aggregates.overallMargin}%)
                  </span>
                  <span className="text-gray-600 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full inline-block border border-gray-300" style={{ backgroundColor: '#cebbdb' }}></span>
                    Operating Cost ({aggregates.overallEfficiency}%)
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>
                Status:{' '}
                <strong>
                  {aggregates.totalIncome === 0 && aggregates.totalExpenses === 0
                    ? 'No Activity'
                    : aggregates.totalNetProfit >= 0
                      ? 'Positive Cash Flow'
                      : 'Net Burn'}
                </strong>
              </span>
              <span>Average Monthly Burn: <strong>{formatCurrency(aggregates.avgMonthlyExpense)}</strong></span>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Revenue Sources & Client Breakdown */}
      {(activeTab === 'all' || activeTab === 'revenue') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Client Revenue Concentration */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-heading font-bold text-gray-900">Client Revenue Contribution</h3>
                <p className="text-xs text-gray-500">Share of total billing across top accounts</p>
              </div>
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                {clientRevenueShare.length > 1 ? 'Diversified' : clientRevenueShare.length === 1 ? 'Single Account' : 'No Invoices'}
              </span>
            </div>

            {clientRevenueShare.length === 0 ? (
              <div className="py-10 text-center text-xs text-gray-400">
                No invoice revenue recorded for this period.
              </div>
            ) : (
              <div className="space-y-3 mt-4">
                {clientRevenueShare.map((client) => (
                  <div key={client.name} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-gray-800">{client.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-600">{formatCurrency(client.value)}</span>
                        <span className="font-bold text-indigo-600 text-[11px] w-12 text-right">{client.percentage}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ width: `${client.percentage}%`, backgroundColor: client.color }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="mt-5 text-xs text-gray-400 border-t border-gray-100 pt-3">
              {clientRevenueShare.length > 0
                ? `Top client (${clientRevenueShare[0].name}) represents ${clientRevenueShare[0].percentage}% of total inflow for the selected period.`
                : 'Add invoices in the Invoices tab to track client revenue concentration.'}
            </p>
          </div>

          {/* Invoicing Mode: Company (GST) vs Personal */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-heading font-bold text-gray-900">Invoicing Profile Split</h3>
                  <p className="text-xs text-gray-500">Company vs Personal</p>
                </div>
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                  Tax Compliance
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-3">
                {invoiceProfileShare.map((profile) => (
                  <div key={profile.name} className="p-4 rounded-xl border border-gray-200 bg-gray-50/70">
                    <span className="text-xs text-gray-500 font-medium block mb-1">{profile.name}</span>
                    <h4 className="text-xl font-heading font-bold text-gray-900">{formatCurrency(profile.value)}</h4>
                    <div className="flex items-center justify-between mt-2 text-xs font-semibold text-indigo-600">
                      <span>{profile.percentage}% of Total</span>
                      <span className="text-gray-400 font-normal">
                        {profile.name.includes('Company') ? 'GST Invoiced' : 'Direct Service'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 p-3.5 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-900 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <span>
                {aggregates.totalIncome > 0
                  ? `${invoiceProfileShare[0]?.percentage ?? 0}% of billings are handled under the GST Registered Company profile.`
                  : 'No invoice billings recorded for the selected period yet.'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
