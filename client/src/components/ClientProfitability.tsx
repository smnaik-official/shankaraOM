import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  Building,
  Search,
  FileSpreadsheet,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  PieChart,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Download,
  FileText,
  Layers,
  IndianRupee,
  ShieldAlert,
  Loader2,
  ArrowLeft,
  Eye,
  Sliders,
} from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import {
  calculateClientProfitability,
  ClientProfitabilityRecord,
  ProfitabilityPeriod,
  PREDEFINED_PERIODS,
} from '../data/clientProfitability';
import { EmployeeAllocationModal } from './EmployeeAllocationModal';
import { AddClientDirectExpenseModal } from './AddClientDirectExpenseModal';
import { OverheadAllocationModal } from './OverheadAllocationModal';
import { ClientProfitabilityPDF, ClientProfitabilityRegisterPDF } from './ClientProfitabilityPDF';
import { getStoredBillingProfiles } from '../data/profile';
import { formatDateDMY } from '../utils/date';

type PeriodMode = 'monthly' | 'quarterly' | 'financial_year' | 'all_time';

export const ClientProfitability: React.FC = () => {
  // Period Frequency Mode
  const [periodMode, setPeriodMode] = useState<PeriodMode>('monthly');

  // Predefined lists by category
  const monthlyOptions = useMemo(
    () => PREDEFINED_PERIODS.filter((p) => p.type === 'monthly'),
    []
  );
  const quarterlyOptions = useMemo(
    () => PREDEFINED_PERIODS.filter((p) => p.type === 'quarterly'),
    []
  );
  const fyOptions = useMemo(
    () => PREDEFINED_PERIODS.filter((p) => p.type === 'financial_year'),
    []
  );
  const allTimeOption = useMemo(
    () => PREDEFINED_PERIODS.find((p) => p.type === 'all_time') || PREDEFINED_PERIODS[PREDEFINED_PERIODS.length - 1],
    []
  );

  // Active Period
  const [selectedPeriod, setSelectedPeriod] = useState<ProfitabilityPeriod>(monthlyOptions[0]);

  // Selected Client Filter: 'ALL' or specific clientId
  const [selectedClientId, setSelectedClientId] = useState<string>('1'); // Default to first client

  // Report Active Tab (when viewing single client)
  const [activeReportTab, setActiveReportTab] = useState<'pnl' | 'invoices' | 'trends'>('pnl');

  // Search & Register Filter (when viewing ALL clients)
  const [searchQuery, setSearchQuery] = useState('');
  const [profitFilter, setProfitFilter] = useState<'all' | 'profitable' | 'loss'>('all');
  const [sortBy, setSortBy] = useState<'highest_revenue' | 'highest_profit' | 'highest_margin' | 'lowest_profit'>('highest_revenue');

  // PDF Export Loading State
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Unified Export Dropdown State
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setIsExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Modals
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
  const [isDirectExpenseModalOpen, setIsDirectExpenseModalOpen] = useState(false);
  const [isOverheadModalOpen, setIsOverheadModalOpen] = useState(false);

  // Trigger re-computation
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setRefreshKey((k) => k + 1);
    window.addEventListener('invoices_updated', handleUpdate);
    window.addEventListener('clients_updated', handleUpdate);
    window.addEventListener('credit_notes_updated', handleUpdate);
    window.addEventListener('subscriptions_updated', handleUpdate);
    window.addEventListener('employees_updated', handleUpdate);
    window.addEventListener('employee_allocations_updated', handleUpdate);
    window.addEventListener('client_direct_expenses_updated', handleUpdate);
    window.addEventListener('overhead_config_updated', handleUpdate);
    window.addEventListener('expenses_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('invoices_updated', handleUpdate);
      window.removeEventListener('clients_updated', handleUpdate);
      window.removeEventListener('credit_notes_updated', handleUpdate);
      window.removeEventListener('subscriptions_updated', handleUpdate);
      window.removeEventListener('employees_updated', handleUpdate);
      window.removeEventListener('employee_allocations_updated', handleUpdate);
      window.removeEventListener('client_direct_expenses_updated', handleUpdate);
      window.removeEventListener('overhead_config_updated', handleUpdate);
      window.removeEventListener('expenses_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Compute records & summary
  const { records, summary } = useMemo(() => {
    return calculateClientProfitability(selectedPeriod);
  }, [selectedPeriod, refreshKey]);

  // Ensure selectedClientId is valid
  useEffect(() => {
    if (selectedClientId !== 'ALL' && records.length > 0) {
      const exists = records.some((r) => r.clientId === selectedClientId);
      if (!exists) {
        setSelectedClientId(records[0].clientId);
      }
    }
  }, [records, selectedClientId]);

  // Selected client record (if viewing single client)
  const selectedRecord = useMemo<ClientProfitabilityRecord | undefined>(() => {
    if (selectedClientId === 'ALL') return undefined;
    return records.find((r) => r.clientId === selectedClientId) || records[0];
  }, [records, selectedClientId]);

  // Switch Frequency Mode
  const handleModeChange = (mode: PeriodMode) => {
    setPeriodMode(mode);
    if (mode === 'monthly') {
      setSelectedPeriod(monthlyOptions[0]);
    } else if (mode === 'quarterly') {
      setSelectedPeriod(quarterlyOptions[0]);
    } else if (mode === 'financial_year') {
      setSelectedPeriod(fyOptions[0]);
    } else {
      setSelectedPeriod(allTimeOption);
    }
  };

  // Month navigation helpers
  const currentMonthIndex = monthlyOptions.findIndex((p) => p.value === selectedPeriod.value);

  const handlePrevMonth = () => {
    if (currentMonthIndex < monthlyOptions.length - 1) {
      setSelectedPeriod(monthlyOptions[currentMonthIndex + 1]);
    }
  };

  const handleNextMonth = () => {
    if (currentMonthIndex > 0) {
      setSelectedPeriod(monthlyOptions[currentMonthIndex - 1]);
    }
  };

  // Quarter navigation helpers
  const currentQuarterIndex = quarterlyOptions.findIndex((p) => p.value === selectedPeriod.value);

  const handlePrevQuarter = () => {
    if (currentQuarterIndex < quarterlyOptions.length - 1) {
      setSelectedPeriod(quarterlyOptions[currentQuarterIndex + 1]);
    }
  };

  const handleNextQuarter = () => {
    if (currentQuarterIndex > 0) {
      setSelectedPeriod(quarterlyOptions[currentQuarterIndex - 1]);
    }
  };

  // Financial Year navigation helpers
  const currentFyIndex = fyOptions.findIndex((p) => p.value === selectedPeriod.value);

  const handlePrevFy = () => {
    if (currentFyIndex < fyOptions.length - 1) {
      setSelectedPeriod(fyOptions[currentFyIndex + 1]);
    }
  };

  const handleNextFy = () => {
    if (currentFyIndex > 0) {
      setSelectedPeriod(fyOptions[currentFyIndex - 1]);
    }
  };

  // Custom month handler
  const handleCustomMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) return;

    const [yearStr, monthStr] = val.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    const monthName = monthNames[month - 1] || 'Custom Month';
    const lastDay = new Date(year, month, 0).getDate();

    setSelectedPeriod({
      type: 'monthly',
      value: val,
      label: `${monthName} ${year}`,
      startDate: `${val}-01`,
      endDate: `${val}-${String(lastDay).padStart(2, '0')}`,
      monthMultiplier: 1,
    });
  };

  // Download PDF Report (for selected client or full register)
  const handleDownloadPdf = async () => {
    try {
      setIsExportingPdf(true);
      const profiles = getStoredBillingProfiles();
      const doc = selectedRecord ? (
        <ClientProfitabilityPDF
          record={selectedRecord}
          period={selectedPeriod}
          companyInfo={profiles.company}
        />
      ) : (
        <ClientProfitabilityRegisterPDF
          records={records}
          summary={summary}
          period={selectedPeriod}
          companyInfo={profiles.company}
        />
      );
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = selectedRecord
        ? `Profitability-Report-${selectedRecord.clientName.replace(/[^a-zA-Z0-9]/g, '_')}-${selectedPeriod.value}.pdf`
        : `Client-Profitability-Register-${selectedPeriod.value}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Export selected client report to CSV
  const handleExportClientCsv = () => {
    if (!selectedRecord) return;
    const r = selectedRecord;
    const rows: string[][] = [
      ['Client Profitability Analysis Report'],
      ['Client Name', r.clientName],
      ['GSTIN', r.clientGstin || 'Unregistered / Non-GST'],
      ['Analysis Period', selectedPeriod.label],
      ['Generated On', formatDateDMY(new Date().toISOString().slice(0, 10))],
      ['Status', r.isProfitable ? 'Profitable' : 'Loss-Making'],
      [],
      ['Financial Performance (Ex-GST)', 'Amount (INR)', '% of Revenue'],
      ['Gross Invoiced Revenue (Ex-GST)', r.invoicedGrossRevenue.toString(), '-'],
      ['Credit Notes & Adjustments', `-${r.creditNotesDeduction}`, '-'],
      ['Net Earned Revenue (Ex-GST)', r.netEarnedRevenue.toString(), '100.0%'],
      ['Allocated Employee Costs', r.allocatedEmployeeCost.toString(), `${r.netEarnedRevenue > 0 ? ((r.allocatedEmployeeCost / r.netEarnedRevenue) * 100).toFixed(1) : 0}%`],
      ['Freelancer & Outsourced Work', r.freelancerCost.toString(), `${r.netEarnedRevenue > 0 ? ((r.freelancerCost / r.netEarnedRevenue) * 100).toFixed(1) : 0}%`],
      ['Client Software & Tools', r.clientSoftwareCost.toString(), `${r.netEarnedRevenue > 0 ? ((r.clientSoftwareCost / r.netEarnedRevenue) * 100).toFixed(1) : 0}%`],
      ['Other Direct Costs & Travel', r.otherDirectCosts.toString(), `${r.netEarnedRevenue > 0 ? ((r.otherDirectCosts / r.netEarnedRevenue) * 100).toFixed(1) : 0}%`],
      ['Total Direct Client Costs', r.totalDirectCosts.toString(), `${r.netEarnedRevenue > 0 ? ((r.totalDirectCosts / r.netEarnedRevenue) * 100).toFixed(1) : 0}%`],
      ['Client Contribution (Gross Profit)', r.contribution.toString(), `${r.contributionMargin.toFixed(1)}%`],
      ['Allocated Agency Overheads', r.allocatedOverheads.toString(), `${r.netEarnedRevenue > 0 ? ((r.allocatedOverheads / r.netEarnedRevenue) * 100).toFixed(1) : 0}%`],
      ['Net Client Profit', r.netProfit.toString(), `${r.netProfitMargin.toFixed(1)}%`],
      ['Actual Cash Received', r.cashReceived.toString(), '-'],
      ['Outstanding Receivables', r.outstandingReceivables.toString(), '-'],
      [],
      ['Employee Cost Allocations'],
      ['Employee Name', 'Role', 'Gross Monthly Salary', 'Allocation %', 'Period Cost (INR)'],
      ...r.employeeAllocations.map((e) => [
        e.employeeName,
        e.role,
        e.grossSalary.toString(),
        `${e.allocationPercentage}%`,
        e.periodCost.toString(),
      ]),
      [],
      ['Invoices History'],
      ['Invoice #', 'Date', 'Subtotal (Ex-GST)', 'GST', 'Total Amount', 'Status'],
      ...r.invoices.map((inv) => [
        inv.id,
        inv.date,
        (inv.subtotal ?? (inv.amount - (inv.gst || 0))).toString(),
        (inv.gst || 0).toString(),
        inv.amount.toString(),
        inv.status,
      ]),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Profitability-${r.clientName.replace(/[^a-zA-Z0-9]/g, '_')}-${selectedPeriod.value}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export full register table to CSV
  const handleExportRegisterCsv = () => {
    const headers = [
      'Client Name',
      'GSTIN',
      'Revenue (Ex-GST)',
      'Allocated Employee Cost',
      'Freelancer Costs',
      'Software Subscriptions',
      'Other Direct Costs',
      'Total Direct Costs',
      'Contribution (INR)',
      'Contribution Margin (%)',
      'Allocated Overheads',
      'Net Profit (INR)',
      'Net Profit Margin (%)',
      'Account Status',
    ];

    const rows = records.map((r) => [
      r.clientName,
      r.clientGstin || 'Unregistered',
      r.netEarnedRevenue.toString(),
      r.allocatedEmployeeCost.toString(),
      r.freelancerCost.toString(),
      r.clientSoftwareCost.toString(),
      r.otherDirectCosts.toString(),
      r.totalDirectCosts.toString(),
      r.contribution.toString(),
      `${r.contributionMargin.toFixed(1)}%`,
      r.allocatedOverheads.toString(),
      r.netProfit.toString(),
      `${r.netProfitMargin.toFixed(1)}%`,
      r.isProfitable ? 'Profitable' : 'Loss-Making',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [[`Client Profitability Register - ${selectedPeriod.label}`], [], headers, ...rows]
        .map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Client-Profitability-Register-${selectedPeriod.value}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered records when viewing ALL clients
  const filteredRecords = useMemo(() => {
    return records
      .filter((rec) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches =
            rec.clientName.toLowerCase().includes(q) ||
            (rec.clientGstin && rec.clientGstin.toLowerCase().includes(q));
          if (!matches) return false;
        }
        if (profitFilter === 'profitable' && !rec.isProfitable) return false;
        if (profitFilter === 'loss' && rec.isProfitable) return false;
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'highest_revenue':
            return b.netEarnedRevenue - a.netEarnedRevenue;
          case 'highest_profit':
            return b.netProfit - a.netProfit;
          case 'highest_margin':
            return b.contributionMargin - a.contributionMargin;
          case 'lowest_profit':
            return a.netProfit - b.netProfit;
          default:
            return 0;
        }
      });
  }, [records, searchQuery, profitFilter, sortBy]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 1. Top Header & Primary Action Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-heading font-bold text-gray-900 tracking-tight">
              Client Profitability Analysis
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
              Ex-GST Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Real-time contribution margins, ex-GST revenue, employee cost allocations, and net account profitability.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-nowrap flex-shrink-0">
          <button
            onClick={() => setIsDirectExpenseModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-all shadow-xs shadow-indigo-100 hover:shadow-md"
            title="Record direct costs for a client (Freelancers, special software, travel)"
          >
            <Plus className="w-4 h-4" />
            <span>Record Direct Cost</span>
          </button>

          <button
            onClick={() => setIsAllocationModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 text-xs font-semibold hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-xs"
            title="Configure employee percentage allocations per client"
          >
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            <span>Employee Allocations</span>
          </button>

          <button
            onClick={() => setIsOverheadModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 text-xs font-semibold hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-xs"
            title="Configure common agency overhead allocation rules, categories and capping percentage"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-600" />
            <span>Overhead Settings</span>
          </button>

          {/* Unified Export Button with Dropdown (PDF / CSV) */}
          <div className="relative" ref={exportDropdownRef}>
            <button
              type="button"
              onClick={() => setIsExportDropdownOpen((prev) => !prev)}
              disabled={isExportingPdf}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 text-xs font-semibold hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-xs disabled:opacity-60 cursor-pointer"
              title="Export report to PDF or CSV"
            >
              {isExportingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
              ) : (
                <Download className="w-3.5 h-3.5 text-indigo-600" />
              )}
              <span>Export</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
            </button>

            {isExportDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <button
                  type="button"
                  onClick={() => {
                    setIsExportDropdownOpen(false);
                    handleDownloadPdf();
                  }}
                  className="w-full text-left px-3.5 py-2.5 text-xs text-gray-700 hover:bg-indigo-50/60 hover:text-indigo-900 flex items-center gap-2.5 transition-colors group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100">
                    <Download className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-800">Export as PDF</div>
                    <div className="text-[11px] text-gray-400 font-normal">
                      {selectedRecord ? 'Executive client P&L report' : 'Full accounts register report'}
                    </div>
                  </div>
                </button>

                <div className="h-px bg-gray-100 my-1 mx-2" />

                <button
                  type="button"
                  onClick={() => {
                    setIsExportDropdownOpen(false);
                    if (selectedRecord) {
                      handleExportClientCsv();
                    } else {
                      handleExportRegisterCsv();
                    }
                  }}
                  className="w-full text-left px-3.5 py-2.5 text-xs text-gray-700 hover:bg-emerald-50/60 hover:text-emerald-900 flex items-center gap-2.5 transition-colors group cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-800">Export as CSV</div>
                    <div className="text-[11px] text-gray-400 font-normal">
                      {selectedRecord ? 'Client statement CSV' : 'Full accounts register CSV'}
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Top Filter Bar: Client Selector (Left) + Time Range on Right (Exact layout requested) */}
      <div className="bg-white px-4 py-2.5 rounded-2xl border border-gray-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Client Selection Filter */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
            <Building className="w-4 h-4 text-indigo-600" />
            <span>Client:</span>
          </div>

          <div className="relative">
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 bg-indigo-50/70 border border-indigo-200 text-indigo-950 text-xs font-bold rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
            >
              <option value="ALL">All Clients (Compare Register)</option>
              {records.map((r) => (
                <option key={r.clientId} value={r.clientId}>
                  {r.clientName}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-indigo-600 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {selectedClientId !== 'ALL' && (
            <button
              onClick={() => setSelectedClientId('ALL')}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline underline-offset-2 ml-1"
            >
              Compare All
            </button>
          )}
        </div>

        {/* Right Side: Time Range Toolbar (Segmented frequency + Stepper navigation) */}
        <div className="flex items-center gap-3 self-end md:self-auto flex-wrap sm:flex-nowrap">
          {/* Segmented Frequency Tabs */}
          <div className="flex items-center gap-1 bg-gray-100/90 p-1 rounded-xl text-xs font-semibold text-gray-600">
            <button
              type="button"
              onClick={() => handleModeChange('monthly')}
              className={`px-3 py-1 rounded-lg transition-all ${
                periodMode === 'monthly'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('quarterly')}
              className={`px-3 py-1 rounded-lg transition-all ${
                periodMode === 'quarterly'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'hover:text-gray-900'
              }`}
            >
              Quarterly
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('financial_year')}
              className={`px-3 py-1 rounded-lg transition-all ${
                periodMode === 'financial_year'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'hover:text-gray-900'
              }`}
            >
              FY
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('all_time')}
              className={`px-3 py-1 rounded-lg transition-all ${
                periodMode === 'all_time'
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'hover:text-gray-900'
              }`}
            >
              All Time
            </button>
          </div>

          {/* Stepper Navigator for Active Frequency */}
          {periodMode === 'monthly' && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                disabled={currentMonthIndex >= monthlyOptions.length - 1}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="relative">
                <select
                  value={selectedPeriod.value}
                  onChange={(e) => {
                    const found = monthlyOptions.find((p) => p.value === e.target.value);
                    if (found) setSelectedPeriod(found);
                  }}
                  className="appearance-none pl-3 pr-8 py-1.5 bg-white border border-gray-300 text-gray-800 text-xs font-bold rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                >
                  {monthlyOptions.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-2 pointer-events-none" />
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                disabled={currentMonthIndex <= 0}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Native Calendar Picker for custom months */}
              <div className="relative ml-0.5" title="Pick any specific custom month">
                <input
                  type="month"
                  onChange={handleCustomMonthChange}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <button
                  type="button"
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {periodMode === 'quarterly' && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevQuarter}
                disabled={currentQuarterIndex >= quarterlyOptions.length - 1}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                title="Previous Quarter"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="relative">
                <select
                  value={selectedPeriod.value}
                  onChange={(e) => {
                    const found = quarterlyOptions.find((q) => q.value === e.target.value);
                    if (found) setSelectedPeriod(found);
                  }}
                  className="appearance-none pl-3 pr-8 py-1.5 bg-white border border-gray-300 text-gray-800 text-xs font-bold rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs hover:border-gray-400 transition-colors"
                >
                  {quarterlyOptions.map((q) => (
                    <option key={q.value} value={q.value}>
                      {q.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>

              <button
                type="button"
                onClick={handleNextQuarter}
                disabled={currentQuarterIndex <= 0}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                title="Next Quarter"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {periodMode === 'financial_year' && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrevFy}
                disabled={currentFyIndex >= fyOptions.length - 1}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                title="Previous Financial Year"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="relative">
                <select
                  value={selectedPeriod.value}
                  onChange={(e) => {
                    const found = fyOptions.find((fy) => fy.value === e.target.value);
                    if (found) setSelectedPeriod(found);
                  }}
                  className="appearance-none pl-3 pr-8 py-1.5 bg-white border border-gray-300 text-gray-800 text-xs font-bold rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs hover:border-gray-400 transition-colors"
                >
                  {fyOptions.map((fy) => (
                    <option key={fy.value} value={fy.value}>
                      {fy.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>

              <button
                type="button"
                onClick={handleNextFy}
                disabled={currentFyIndex <= 0}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                title="Next Financial Year"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {periodMode === 'all_time' && (
            <span className="px-3.5 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold shadow-2xs">
              All Time Cumulative
            </span>
          )}
        </div>
      </div>

      {/* 3. MAIN SECTION: Inline Report for Selected Client OR All Clients Register */}
      {selectedRecord ? (
        /* ================= INLINE CLIENT REPORT VIEW ================= */
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Client Profile Header Banner */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-bold text-gray-900 leading-tight">
                  {selectedRecord.clientName}
                </h2>
                <span
                  className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold ${
                    selectedRecord.isProfitable
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/70'
                      : 'bg-rose-50 text-rose-700 border border-rose-200/70'
                  }`}
                >
                  {selectedRecord.isProfitable ? (
                    <>
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Profitable Account (+{selectedRecord.netProfitMargin.toFixed(1)}% margin)</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                      <span>Loss-Making Account ({selectedRecord.netProfitMargin.toFixed(1)}% margin)</span>
                    </>
                  )}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-3">
                <span>Period: <strong className="text-gray-800">{selectedPeriod.label}</strong></span>
                {selectedRecord.clientGstin && (
                  <span>• GSTIN: <strong className="text-gray-800">{selectedRecord.clientGstin}</strong></span>
                )}
                {selectedRecord.clientAddress && (
                  <span className="hidden sm:inline">• {selectedRecord.clientAddress.split(',')[0]}</span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedClientId('ALL')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>All Clients Register</span>
              </button>
            </div>
          </div>

          {/* 4 Executive KPI Cards for Selected Client */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Revenue */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs hover:border-indigo-200 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Net Revenue (Ex-GST)
                </span>
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-sm">
                  ₹
                </div>
              </div>
              <div className="mt-2.5">
                <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                  ₹{selectedRecord.netEarnedRevenue.toLocaleString()}
                </h3>
                <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                  Ex-GST invoiced revenue earned
                </p>
              </div>
              <div className="mt-3.5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  Recv: <strong className="text-emerald-600 font-semibold">₹{selectedRecord.cashReceived.toLocaleString()}</strong>
                </span>
                <span className="text-gray-500">
                  Due: <strong className="text-amber-600 font-semibold">₹{selectedRecord.outstandingReceivables.toLocaleString()}</strong>
                </span>
              </div>
            </div>

            {/* KPI 2: Direct Costs */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs hover:border-indigo-200 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Total Direct Costs
                </span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5">
                <h3 className="text-2xl font-bold text-rose-600 tracking-tight">
                  ₹{selectedRecord.totalDirectCosts.toLocaleString()}
                </h3>
                <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                  Staff, freelancers & direct tools
                </p>
              </div>
              <div className="mt-3.5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  Staff: <strong className="text-gray-800 font-semibold">₹{selectedRecord.allocatedEmployeeCost.toLocaleString()}</strong>
                </span>
                <span className="text-gray-500">
                  Direct: <strong className="text-gray-800 font-semibold">₹{(selectedRecord.totalDirectCosts - selectedRecord.allocatedEmployeeCost).toLocaleString()}</strong>
                </span>
              </div>
            </div>

            {/* KPI 3: Contribution */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs hover:border-indigo-200 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Client Contribution
                </span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <PieChart className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5">
                <h3
                  className={`text-2xl font-bold tracking-tight ${
                    selectedRecord.contribution >= 0 ? 'text-indigo-600' : 'text-rose-600'
                  }`}
                >
                  ₹{selectedRecord.contribution.toLocaleString()}
                </h3>
                <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                  Contribution Margin:{' '}
                  <strong className="text-indigo-700">
                    {selectedRecord.contributionMargin.toFixed(1)}%
                  </strong>
                </p>
              </div>
              <div className="mt-3.5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>Overheads Share:</span>
                <strong className="text-gray-700 font-semibold">
                  ₹{selectedRecord.allocatedOverheads.toLocaleString()}
                </strong>
              </div>
            </div>

            {/* KPI 4: Net Profit */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs hover:border-indigo-200 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Net Client Profit
                </span>
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    selectedRecord.netProfit >= 0
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-rose-50 text-rose-600'
                  }`}
                >
                  {selectedRecord.netProfit >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                </div>
              </div>
              <div className="mt-2.5">
                <h3
                  className={`text-2xl font-bold tracking-tight ${
                    selectedRecord.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  ₹{selectedRecord.netProfit.toLocaleString()}
                </h3>
                <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                  Net Margin: {selectedRecord.netProfitMargin.toFixed(1)}% of Revenue
                </p>
              </div>
              <div className="mt-3.5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  Gross Invoiced: <strong className="text-gray-800 font-semibold">₹{selectedRecord.invoicedGrossRevenue.toLocaleString()}</strong>
                </span>
                {selectedRecord.creditNotesDeduction > 0 && (
                  <span className="text-rose-600 font-semibold">
                    -₹{selectedRecord.creditNotesDeduction.toLocaleString()} CN
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Deep-Dive Report Container (Tabs for P&L, Invoices, Trends) */}
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden">
            {/* Tab Selector Toolbar */}
            <div className="flex border-b border-gray-200 px-6 bg-gray-50/50">
              <button
                onClick={() => setActiveReportTab('pnl')}
                className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
                  activeReportTab === 'pnl'
                    ? 'border-indigo-600 text-indigo-600 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>P&L & Direct Cost Breakdown</span>
              </button>

              <button
                onClick={() => setActiveReportTab('invoices')}
                className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
                  activeReportTab === 'invoices'
                    ? 'border-indigo-600 text-indigo-600 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Invoices & Collections ({selectedRecord.invoices.length})</span>
              </button>

              <button
                onClick={() => setActiveReportTab('trends')}
                className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
                  activeReportTab === 'trends'
                    ? 'border-indigo-600 text-indigo-600 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Profitability Trends</span>
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeReportTab === 'pnl' && (
                <div className="space-y-6">
                  {/* P&L Statement Table */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                        Client Profit & Loss Statement (Ex-GST)
                      </h4>
                      <span className="text-xs text-gray-500">
                        {selectedPeriod.label}
                      </span>
                    </div>

                    <div className="divide-y divide-gray-100 text-xs">
                      <div className="flex justify-between items-center px-4 py-2.5 font-semibold text-gray-800">
                        <span>1. Invoiced Gross Revenue (Excluding GST)</span>
                        <span className="font-bold">₹{selectedRecord.invoicedGrossRevenue.toLocaleString()}</span>
                      </div>

                      {selectedRecord.creditNotesDeduction > 0 && (
                        <div className="flex justify-between items-center px-4 py-2 text-rose-600 bg-rose-50/40">
                          <span className="pl-3">Less: Credit Notes & Commercial Adjustments</span>
                          <span className="font-semibold">-₹{selectedRecord.creditNotesDeduction.toLocaleString()}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-center px-4 py-2.5 font-bold text-indigo-900 bg-indigo-50/50">
                        <span>Net Earned Revenue</span>
                        <span className="text-sm font-bold">₹{selectedRecord.netEarnedRevenue.toLocaleString()}</span>
                      </div>

                      {/* Direct Costs Group */}
                      <div className="bg-gray-50/40 px-4 py-1 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        Direct Client Costs
                      </div>

                      <div className="flex justify-between items-center px-4 py-2 text-gray-700">
                        <span className="pl-3 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          Allocated Employee Costs ({selectedRecord.employeeAllocations.length} staff allocated)
                        </span>
                        <span className="font-medium text-gray-800">₹{selectedRecord.allocatedEmployeeCost.toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between items-center px-4 py-2 text-gray-700">
                        <span className="pl-3 flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                          Freelancer & Outsourced Services
                        </span>
                        <span className="font-medium text-gray-800">₹{selectedRecord.freelancerCost.toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between items-center px-4 py-2 text-gray-700">
                        <span className="pl-3 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-gray-400" />
                          Client-Dedicated Software & Subscriptions (Agency Borne)
                        </span>
                        <span className="font-medium text-gray-800">₹{selectedRecord.clientSoftwareCost.toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between items-center px-4 py-2 text-gray-700">
                        <span className="pl-3 flex items-center gap-1.5">
                          <IndianRupee className="w-3.5 h-3.5 text-gray-400" />
                          Other Direct Costs, Travel & Media
                        </span>
                        <span className="font-medium text-gray-800">₹{selectedRecord.otherDirectCosts.toLocaleString()}</span>
                      </div>

                      <div className="flex justify-between items-center px-4 py-2.5 font-semibold text-rose-700 bg-rose-50/40">
                        <span>Total Direct Client Costs</span>
                        <span className="font-bold">₹{selectedRecord.totalDirectCosts.toLocaleString()}</span>
                      </div>

                      {/* Contribution */}
                      <div className="flex justify-between items-center px-4 py-3 font-bold bg-indigo-50/70 text-indigo-950">
                        <div className="flex items-center gap-2">
                          <span>Client Contribution (Gross Margin)</span>
                          <span className="text-[11px] font-normal px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                            {selectedRecord.contributionMargin.toFixed(1)}% margin
                          </span>
                        </div>
                        <span className="text-sm font-bold">₹{selectedRecord.contribution.toLocaleString()}</span>
                      </div>

                      {/* Overheads */}
                      <div className="flex justify-between items-center px-4 py-2.5 text-gray-600 bg-gray-50/30">
                        <div className="pl-3">
                          <div className="flex items-center gap-2 font-medium text-gray-700 flex-wrap">
                            <span>Less: Allocated Common Agency Overheads</span>
                            {summary.overheadConfig?.applyCapping && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                Capped at {summary.overheadConfig.cappingPercentage}%
                              </span>
                            )}
                            <button
                              onClick={() => setIsOverheadModalOpen(true)}
                              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 underline underline-offset-2 flex items-center gap-1 cursor-pointer"
                            >
                              <Sliders className="w-3 h-3" />
                              <span>Customize Rules & Cap</span>
                            </button>
                          </div>
                          <p className="text-[11px] text-gray-500 font-normal mt-0.5">
                            {selectedRecord.overheadCalculationDetail ||
                              `Calculated from Expenses tab overhead pool (₹${(summary.totalOverheadPool || 0).toLocaleString()})`}
                          </p>
                        </div>
                        <span className="font-semibold text-gray-700">₹{selectedRecord.allocatedOverheads.toLocaleString()}</span>
                      </div>

                      {/* Net Profit */}
                      <div
                        className={`flex justify-between items-center px-4 py-3.5 font-bold ${
                          selectedRecord.netProfit >= 0
                            ? 'bg-emerald-50 text-emerald-900 border-t-2 border-emerald-500'
                            : 'bg-rose-50 text-rose-900 border-t-2 border-rose-500'
                        }`}
                      >
                        <div>
                          <span className="text-sm">Net Client Profit (Final Account EBITDA)</span>
                          <p className="text-[11px] font-normal opacity-80">
                            Net Profit Margin: {selectedRecord.netProfitMargin.toFixed(1)}% of Ex-GST Revenue
                          </p>
                        </div>
                        <span className="text-base font-bold">
                          ₹{selectedRecord.netProfit.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Employee Cost Allocations Breakdown Table */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-600" />
                        Allocated Employee Cost Breakdown
                      </h4>
                      <button
                        onClick={() => setIsAllocationModalOpen(true)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                      >
                        Edit Allocations
                      </button>
                    </div>

                    {selectedRecord.employeeAllocations.length === 0 ? (
                      <p className="p-4 text-xs text-gray-400 text-center italic">
                        No team members currently allocated to this client.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-gray-50/60 text-gray-500 uppercase text-[10px] border-b border-gray-200">
                            <tr>
                              <th className="py-2.5 px-4 font-semibold">Employee Name</th>
                              <th className="py-2.5 px-4 font-semibold">Designation / Role</th>
                              <th className="py-2.5 px-4 font-semibold text-right">Gross Monthly Salary</th>
                              <th className="py-2.5 px-4 font-semibold text-right">Allocation %</th>
                              <th className="py-2.5 px-4 font-semibold text-right">Period Cost</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {selectedRecord.employeeAllocations.map((emp, idx) => (
                              <tr key={idx} className="hover:bg-gray-50/50">
                                <td className="py-2.5 px-4 font-bold text-gray-900">{emp.employeeName}</td>
                                <td className="py-2.5 px-4 text-gray-600">{emp.role}</td>
                                <td className="py-2.5 px-4 text-right text-gray-600">
                                  ₹{emp.grossSalary.toLocaleString()}
                                </td>
                                <td className="py-2.5 px-4 text-right">
                                  <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded">
                                    {emp.allocationPercentage}%
                                  </span>
                                </td>
                                <td className="py-2.5 px-4 text-right font-bold text-gray-900">
                                  ₹{emp.periodCost.toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Subscriptions & Direct Expenses Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Client Subscriptions */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-indigo-600" />
                          Client Subscriptions ({selectedRecord.clientSubscriptions.length})
                        </h4>
                      </div>
                      {selectedRecord.clientSubscriptions.length === 0 ? (
                        <p className="p-4 text-xs text-gray-400 text-center">
                          No client software subscriptions recorded.
                        </p>
                      ) : (
                        <div className="divide-y divide-gray-100 text-xs">
                          {selectedRecord.clientSubscriptions.map((sub) => (
                            <div key={sub.id} className="p-3 flex justify-between items-center">
                              <div>
                                <p className="font-semibold text-gray-900">{sub.name}</p>
                                <p className="text-[11px] text-gray-500">
                                  {sub.category} • {sub.duration} ({sub.currency} {sub.amount})
                                  {sub.isClientDirectBilled && (
                                    <span className="ml-2 px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-semibold">
                                      Client Direct Billed
                                    </span>
                                  )}
                                </p>
                              </div>
                              <span className="font-bold text-gray-900">
                                ₹{sub.periodCost.toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Freelancers & Other Direct Expenses */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                          Direct Project Expenses ({selectedRecord.directExpenses.length})
                        </h4>
                        <button
                          onClick={() => setIsDirectExpenseModalOpen(true)}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                        >
                          + Add Expense
                        </button>
                      </div>
                      {selectedRecord.directExpenses.length === 0 ? (
                        <p className="p-4 text-xs text-gray-400 text-center">
                          No direct project expenses recorded for this period.
                        </p>
                      ) : (
                        <div className="divide-y divide-gray-100 text-xs">
                          {selectedRecord.directExpenses.map((exp) => (
                            <div key={exp.id} className="p-3 flex justify-between items-center">
                              <div>
                                <p className="font-semibold text-gray-900">{exp.description}</p>
                                <p className="text-[11px] text-gray-500">
                                  {exp.category} • {formatDateDMY(exp.date)} {exp.vendorOrPerson ? `• ${exp.vendorOrPerson}` : ''}
                                </p>
                              </div>
                              <span className="font-bold text-gray-900">
                                ₹{exp.amount.toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeReportTab === 'invoices' && (
                <div className="space-y-6">
                  {/* Issued Invoices Table */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        Invoices Incurred in Period ({selectedRecord.invoices.length})
                      </h4>
                      <span className="text-xs text-gray-500">
                        Net Ex-GST: <strong className="text-gray-900">₹{selectedRecord.netEarnedRevenue.toLocaleString()}</strong>
                      </span>
                    </div>

                    {selectedRecord.invoices.length === 0 ? (
                      <p className="p-6 text-xs text-gray-500 text-center">
                        No issued invoices found for this client in {selectedPeriod.label}.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-gray-50/60 text-gray-500 uppercase text-[10px] border-b border-gray-200">
                            <tr>
                              <th className="py-2.5 px-4 font-semibold">Invoice #</th>
                              <th className="py-2.5 px-4 font-semibold">Date</th>
                              <th className="py-2.5 px-4 font-semibold">Deliverables</th>
                              <th className="py-2.5 px-4 font-semibold text-right">Revenue (Ex-GST)</th>
                              <th className="py-2.5 px-4 font-semibold text-right">GST</th>
                              <th className="py-2.5 px-4 font-semibold text-right">Total Invoiced</th>
                              <th className="py-2.5 px-4 font-semibold text-center">Payment Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {selectedRecord.invoices.map((inv) => {
                              const subtotal = inv.subtotal ?? (inv.amount - (inv.gst || 0));
                              return (
                                <tr key={inv.id} className="hover:bg-gray-50/50">
                                  <td className="py-3 px-4 font-bold text-indigo-600">{inv.id}</td>
                                  <td className="py-3 px-4 text-gray-600">{formatDateDMY(inv.date)}</td>
                                  <td className="py-3 px-4 text-gray-700 max-w-xs truncate" title={inv.items?.map((i) => i.desc).join(', ')}>
                                    {inv.items?.[0]?.desc || 'Retainer Services'}
                                  </td>
                                  <td className="py-3 px-4 text-right font-bold text-gray-900">
                                    ₹{subtotal.toLocaleString()}
                                  </td>
                                  <td className="py-3 px-4 text-right text-gray-500">
                                    ₹{(inv.gst || 0).toLocaleString()}
                                  </td>
                                  <td className="py-3 px-4 text-right font-semibold text-gray-800">
                                    ₹{inv.amount.toLocaleString()}
                                  </td>
                                  <td className="py-3 px-4 text-center">
                                    <span
                                      className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                        inv.status === 'Paid'
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                          : inv.status === 'Cancelled'
                                          ? 'bg-gray-100 text-gray-600'
                                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                                      }`}
                                    >
                                      {inv.status}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Credit Notes Table */}
                  {selectedRecord.creditNotes.length > 0 && (
                    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                      <div className="bg-rose-50/60 px-4 py-3 border-b border-rose-200/60 flex justify-between items-center">
                        <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-rose-600" />
                          Credit Notes Deducted ({selectedRecord.creditNotes.length})
                        </h4>
                        <span className="text-xs font-semibold text-rose-700">
                          Total Ex-GST: -₹{selectedRecord.creditNotesDeduction.toLocaleString()}
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-gray-50/60 text-gray-500 uppercase text-[10px] border-b border-gray-200">
                            <tr>
                              <th className="py-2.5 px-4 font-semibold">Credit Note #</th>
                              <th className="py-2.5 px-4 font-semibold">Date</th>
                              <th className="py-2.5 px-4 font-semibold">Settlement Reason</th>
                              <th className="py-2.5 px-4 font-semibold text-right">Subtotal (Ex-GST)</th>
                              <th className="py-2.5 px-4 font-semibold text-right">GST Reversal</th>
                              <th className="py-2.5 px-4 font-semibold text-right">Total Credited</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {selectedRecord.creditNotes.map((cn) => (
                              <tr key={cn.id} className="hover:bg-gray-50/50">
                                <td className="py-3 px-4 font-bold text-rose-600">{cn.id}</td>
                                <td className="py-3 px-4 text-gray-600">{formatDateDMY(cn.date)}</td>
                                <td className="py-3 px-4 text-gray-700">{cn.reason}</td>
                                <td className="py-3 px-4 text-right font-bold text-rose-700">
                                  -₹{(cn.subtotal ?? cn.amount).toLocaleString()}
                                </td>
                                <td className="py-3 px-4 text-right text-gray-500">
                                  ₹{(cn.gst || 0).toLocaleString()}
                                </td>
                                <td className="py-3 px-4 text-right font-semibold text-gray-800">
                                  ₹{cn.amount.toLocaleString()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeReportTab === 'trends' && (
                <div className="space-y-6">
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                      Profitability & Margin Trajectory
                    </h4>
                    <p className="text-xs text-indigo-700 mt-1">
                      Monthly progression comparing earned ex-GST revenue, direct execution costs, and bottom-line net profit.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {(selectedRecord.monthlyTrends || []).map((t, idx) => (
                      <div
                        key={idx}
                        className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-900">{t.monthLabel}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              t.netProfit >= 0
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {t.revenue > 0 ? `${((t.netProfit / t.revenue) * 100).toFixed(1)}% net` : '0%'}
                          </span>
                        </div>

                        <div className="mt-3 space-y-1.5 text-xs">
                          <div className="flex justify-between text-gray-600">
                            <span>Revenue:</span>
                            <strong className="text-gray-900">₹{t.revenue.toLocaleString()}</strong>
                          </div>
                          <div className="flex justify-between text-gray-600">
                            <span>Direct Costs:</span>
                            <span className="text-rose-600 font-medium">₹{t.directCosts.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-gray-600">
                            <span>Contribution:</span>
                            <span className="text-indigo-600 font-medium">₹{t.contribution.toLocaleString()}</span>
                          </div>
                          <div className="pt-2 border-t border-gray-100 flex justify-between font-bold">
                            <span>Net Profit:</span>
                            <span className={t.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                              ₹{t.netProfit.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ================= ALL CLIENTS COMPARATIVE REGISTER ================= */
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top 4 KPI Cards for All Clients */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs hover:border-indigo-200 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Total Client Revenue
                </span>
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-sm">
                  ₹
                </div>
              </div>
              <div className="mt-2.5">
                <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                  ₹{summary.totalClientRevenue.toLocaleString()}
                </h3>
                <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                  Net ex-GST revenue earned
                </p>
              </div>
              <div className="mt-3.5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  Recv: <strong className="text-emerald-600 font-semibold">₹{summary.totalCashReceived.toLocaleString()}</strong>
                </span>
                <span className="text-gray-500">
                  Due: <strong className="text-amber-600 font-semibold">₹{summary.totalOutstandingReceivables.toLocaleString()}</strong>
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs hover:border-indigo-200 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Total Direct Costs
                </span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5">
                <h3 className="text-2xl font-bold text-rose-600 tracking-tight">
                  ₹{summary.totalDirectCosts.toLocaleString()}
                </h3>
                <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                  Staff, freelancers & direct tools
                </p>
              </div>
              <div className="mt-3.5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  Staff: <strong className="text-gray-800 font-semibold">₹{summary.totalEmployeeCost.toLocaleString()}</strong>
                </span>
                <span className="text-gray-500">
                  Direct: <strong className="text-gray-800 font-semibold">₹{(summary.totalDirectCosts - summary.totalEmployeeCost).toLocaleString()}</strong>
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs hover:border-indigo-200 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Agency Contribution
                </span>
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <PieChart className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2.5">
                <h3
                  className={`text-2xl font-bold tracking-tight ${
                    summary.totalContribution >= 0 ? 'text-indigo-600' : 'text-rose-600'
                  }`}
                >
                  ₹{summary.totalContribution.toLocaleString()}
                </h3>
                <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                  Contribution Margin:{' '}
                  <strong className="text-indigo-700">
                    {summary.overallContributionMargin.toFixed(1)}%
                  </strong>
                </p>
              </div>
              <div className="mt-3.5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>Overheads Share:</span>
                <strong className="text-gray-700 font-semibold">
                  ₹{summary.totalAllocatedOverheads.toLocaleString()}
                </strong>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs hover:border-indigo-200 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Net Client Profit
                </span>
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    summary.totalNetProfit >= 0
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-rose-50 text-rose-600'
                  }`}
                >
                  {summary.totalNetProfit >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                </div>
              </div>
              <div className="mt-2.5">
                <h3
                  className={`text-2xl font-bold tracking-tight ${
                    summary.totalNetProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  ₹{summary.totalNetProfit.toLocaleString()}
                </h3>
                <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                  Net Margin: {summary.overallNetProfitMargin.toFixed(1)}% of Revenue
                </p>
              </div>
              <div className="mt-3.5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {summary.profitableClientsCount} Profitable
                </span>
                <span className="inline-flex items-center gap-1 text-rose-600 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {summary.lossMakingClientsCount} Loss-making
                </span>
              </div>
            </div>
          </div>

          {/* All Clients Register Table */}
          <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden">
            {/* Table Filter Controls Toolbar */}
            <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search clients by name, GSTIN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-gray-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <div className="inline-flex rounded-xl border border-gray-200 bg-white p-0.5 text-xs shadow-2xs">
                  <button
                    onClick={() => setProfitFilter('all')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                      profitFilter === 'all'
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    All ({records.length})
                  </button>
                  <button
                    onClick={() => setProfitFilter('profitable')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                      profitFilter === 'profitable'
                        ? 'bg-emerald-50 text-emerald-700 font-bold'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Profitable ({summary.profitableClientsCount})
                  </button>
                  <button
                    onClick={() => setProfitFilter('loss')}
                    className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                      profitFilter === 'loss'
                        ? 'bg-rose-50 text-rose-700 font-bold'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Loss-Making ({summary.lossMakingClientsCount})
                  </button>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <span className="font-medium">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-2.5 py-1.5 rounded-xl border border-gray-300 bg-white text-xs text-gray-700 font-medium focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="highest_revenue">Highest Revenue</option>
                    <option value="highest_profit">Highest Net Profit</option>
                    <option value="highest_margin">Highest Contribution Margin</option>
                    <option value="lowest_profit">Lowest Profitability</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table Rows */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/80 text-gray-500 uppercase text-[10px] tracking-wider border-b border-gray-200 font-semibold">
                  <tr>
                    <th className="py-3.5 px-4">Client Name</th>
                    <th className="py-3.5 px-4 text-right">Revenue (Ex-GST)</th>
                    <th className="py-3.5 px-4 text-right">Employee Cost</th>
                    <th className="py-3.5 px-4 text-right">Other Direct</th>
                    <th className="py-3.5 px-4 text-right">Total Direct</th>
                    <th className="py-3.5 px-4 text-right">Contribution</th>
                    <th className="py-3.5 px-4 text-right">Contr. %</th>
                    <th className="py-3.5 px-4 text-right">Overheads</th>
                    <th className="py-3.5 px-4 text-right">Net Profit</th>
                    <th className="py-3.5 px-4 text-right">Net Margin</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRecords.map((r) => (
                    <tr
                      key={r.clientId}
                      onClick={() => setSelectedClientId(r.clientId)}
                      className="hover:bg-indigo-50/20 transition-colors group cursor-pointer"
                    >
                        <td className="py-3.5 px-4 font-semibold text-gray-900 min-w-[220px]">
                          <div>
                            <div className="font-bold text-gray-900 truncate" title={r.clientName}>
                              {r.clientName}
                            </div>
                            <div className="text-[11px] text-gray-400 font-normal truncate">
                              {r.clientGstin ? `GSTIN: ${r.clientGstin}` : 'Non-GST / Direct'}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right font-bold text-gray-900 whitespace-nowrap">
                          ₹{r.netEarnedRevenue.toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 text-right text-gray-700 whitespace-nowrap">
                          ₹{r.allocatedEmployeeCost.toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 text-right text-gray-700 whitespace-nowrap">
                          ₹{(r.freelancerCost + r.clientSoftwareCost + r.otherDirectCosts).toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 text-right font-semibold text-rose-600 whitespace-nowrap">
                          ₹{r.totalDirectCosts.toLocaleString()}
                        </td>

                        <td
                          className={`py-3.5 px-4 text-right font-bold whitespace-nowrap ${
                            r.contribution >= 0 ? 'text-indigo-600' : 'text-rose-600'
                          }`}
                        >
                          ₹{r.contribution.toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md font-bold text-xs ${
                              r.contributionMargin >= 35
                                ? 'bg-emerald-50 text-emerald-700'
                                : r.contributionMargin > 0
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {r.contributionMargin.toFixed(1)}%
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right text-gray-500 whitespace-nowrap">
                          ₹{r.allocatedOverheads.toLocaleString()}
                        </td>

                        <td
                          className={`py-3.5 px-4 text-right font-bold whitespace-nowrap ${
                            r.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          ₹{r.netProfit.toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <span
                            className={`font-semibold ${
                              r.netProfitMargin >= 15
                                ? 'text-emerald-700'
                                : r.netProfitMargin > 0
                                ? 'text-gray-800'
                                : 'text-rose-600'
                            }`}
                          >
                            {r.netProfitMargin.toFixed(1)}%
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              r.isProfitable
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {r.isProfitable ? 'Profitable' : 'Loss-Making'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedClientId(r.clientId);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold text-xs transition-colors shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Report</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Employee Allocations Modal */}
      <EmployeeAllocationModal
        isOpen={isAllocationModalOpen}
        onClose={() => setIsAllocationModalOpen(false)}
        onSaved={() => setRefreshKey((k) => k + 1)}
      />

      {/* Add Direct Client Expense Modal */}
      <AddClientDirectExpenseModal
        isOpen={isDirectExpenseModalOpen}
        onClose={() => setIsDirectExpenseModalOpen(false)}
        onSaved={() => setRefreshKey((k) => k + 1)}
      />

      {/* Overhead Allocation Settings Modal */}
      <OverheadAllocationModal
        isOpen={isOverheadModalOpen}
        onClose={() => setIsOverheadModalOpen(false)}
        period={selectedPeriod}
        onConfigSaved={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
};

export default ClientProfitability;
