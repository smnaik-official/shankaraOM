import { useState, useMemo, useEffect, useRef } from 'react';
import { apiBatchSave } from '../services/api';
import {
  Plus,
  Trash2,
  Megaphone,
  Edit,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  Wallet,
  TrendingUp,
  TrendingDown,
  Calendar,
  Search,
  X,
  CreditCard,
  Building2,
  AlertCircle,
  Download,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  Loader2,
} from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { getStoredClients } from './ClientList';
import { formatDateDMY } from '../utils/date';
import { getStoredBillingProfiles } from '../data/profile';
import { AdLedgerPDF } from './AdLedgerPDF';

export interface AdLedgerEntry {
  id: string;
  transactionId: string;
  client: string;
  platform: string;
  type: 'Deposit' | 'Spend';
  amount: number;
  date: string;
}

const STORAGE_KEY_AD_LEDGER = 'shankara_ad_ledger_data';

const getStoredAdLedger = (): AdLedgerEntry[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AD_LEDGER);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveStoredAdLedger = (entries: AdLedgerEntry[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_AD_LEDGER, JSON.stringify(entries));
    window.dispatchEvent(new Event('ad_ledger_updated'));
    apiBatchSave('ad_ledger', entries).catch(console.warn);
  } catch (e) {
    console.error('Failed to save ad ledger:', e);
  }
};

const AdLedger = () => {
  const [adSpends, setAdSpends] = useState<AdLedgerEntry[]>(() => getStoredAdLedger());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<AdLedgerEntry | null>(null);
  const [formState, setFormState] = useState<Partial<AdLedgerEntry>>({
    type: 'Spend',
    date: new Date().toISOString().split('T')[0],
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Spend' | 'Deposit'>('All');
  const [clientFilter, setClientFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<string>('Maximum');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  // Export states
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  // Close export dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setExportDropdownOpen(false);
      }
    };
    if (exportDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [exportDropdownOpen]);

  // Listen for cloud sync & cross-tab updates
  useEffect(() => {
    const handleSync = () => {
      setAdSpends(getStoredAdLedger());
    };
    window.addEventListener('ad_ledger_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('ad_ledger_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Clients list for autocomplete
  const registeredClients = useMemo(() => {
    const fromStorage = getStoredClients().map((c) => c.name);
    const fromLedger = adSpends.map((e) => e.client);
    return Array.from(new Set([...fromStorage, ...fromLedger])).filter(Boolean);
  }, [adSpends]);

  // Date Range calculation
  const dateRange = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const startOfDay = (d: Date) => {
      const newD = new Date(d);
      newD.setHours(0, 0, 0, 0);
      return newD;
    };

    switch (dateFilter) {
      case 'Last 7 Days':
        return { start: startOfDay(new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000)), end: today };
      case 'Last 15 Days':
        return { start: startOfDay(new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000)), end: today };
      case 'Last 30 Days':
        return { start: startOfDay(new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000)), end: today };
      case 'This Month':
        return { start: new Date(today.getFullYear(), today.getMonth(), 1), end: today };
      case 'Last Month':
        return {
          start: new Date(today.getFullYear(), today.getMonth() - 1, 1),
          end: new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59, 999),
        };
      case 'This Quarter': {
        const quarterMonth = Math.floor(today.getMonth() / 3) * 3;
        return { start: new Date(today.getFullYear(), quarterMonth, 1), end: today };
      }
      case 'This Year':
        return { start: new Date(today.getFullYear(), 0, 1), end: today };
      case 'Last Year':
        return {
          start: new Date(today.getFullYear() - 1, 0, 1),
          end: new Date(today.getFullYear() - 1, 11, 31, 23, 59, 59, 999),
        };
      case 'Custom Range':
        return {
          start: customStart ? startOfDay(new Date(customStart)) : new Date(0),
          end: customEnd ? new Date(new Date(customEnd).setHours(23, 59, 59, 999)) : today,
        };
      default:
        return null;
    }
  }, [dateFilter, customStart, customEnd]);

  // Overall calculations for selected client
  const clientSpends = useMemo(() => {
    return clientFilter === 'All'
      ? adSpends
      : adSpends.filter((e) => e.client === clientFilter);
  }, [adSpends, clientFilter]);

  const overallDeposit = useMemo(
    () => clientSpends.filter((e) => e.type === 'Deposit').reduce((acc, curr) => acc + curr.amount, 0),
    [clientSpends]
  );
  const overallSpend = useMemo(
    () => clientSpends.filter((e) => e.type === 'Spend').reduce((acc, curr) => acc + curr.amount, 0),
    [clientSpends]
  );
  const remainingBalance = overallDeposit - overallSpend;

  // Filtered entries for table & period stats
  const filteredSpends = useMemo(() => {
    return adSpends
      .filter((e) => {
        // Client filter
        if (clientFilter !== 'All' && e.client !== clientFilter) return false;

        // Type filter
        if (typeFilter !== 'All' && e.type !== typeFilter) return false;

        // Date range filter
        if (dateRange) {
          const d = new Date(e.date);
          if (d < dateRange.start || d > dateRange.end) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchClient = e.client.toLowerCase().includes(q);
          const matchPlatform = e.platform.toLowerCase().includes(q);
          const matchTxn = e.transactionId.toLowerCase().includes(q);
          const matchDate = formatDateDMY(e.date).toLowerCase().includes(q) || e.date.includes(q);
          const matchAmount = e.amount.toString().includes(q);
          if (!matchClient && !matchPlatform && !matchTxn && !matchDate && !matchAmount) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [adSpends, clientFilter, typeFilter, dateRange, searchQuery]);

  const periodDeposit = useMemo(
    () => filteredSpends.filter((e) => e.type === 'Deposit').reduce((acc, curr) => acc + curr.amount, 0),
    [filteredSpends]
  );
  const periodSpend = useMemo(
    () => filteredSpends.filter((e) => e.type === 'Spend').reduce((acc, curr) => acc + curr.amount, 0),
    [filteredSpends]
  );

  // Counts for pills
  const typeCounts = useMemo(() => {
    const base = adSpends.filter((e) => {
      if (clientFilter !== 'All' && e.client !== clientFilter) return false;
      if (dateRange) {
        const d = new Date(e.date);
        if (d < dateRange.start || d > dateRange.end) return false;
      }
      return true;
    });
    return {
      all: base.length,
      spend: base.filter((e) => e.type === 'Spend').length,
      deposit: base.filter((e) => e.type === 'Deposit').length,
    };
  }, [adSpends, clientFilter, dateRange]);

  // Modal actions
  const handleOpenNew = () => {
    setEditingEntry(null);
    setFormState({
      type: 'Spend',
      date: new Date().toISOString().split('T')[0],
      client: clientFilter !== 'All' ? clientFilter : '',
      platform: 'Google Ads',
      transactionId: `TXN-${Math.floor(1000000 + Math.random() * 9000000)}`,
      amount: undefined,
    });
    setIsModalOpen(true);
  };

  const handleEdit = (entry: AdLedgerEntry) => {
    setEditingEntry(entry);
    setFormState({ ...entry });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this ad ledger entry?')) {
      const updated = adSpends.filter((e) => e.id !== id);
      setAdSpends(updated);
      saveStoredAdLedger(updated);
    }
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.client || !formState.amount || !formState.platform || !formState.transactionId) {
      alert('Please fill in all required fields.');
      return;
    }

    const payload: AdLedgerEntry = {
      id: editingEntry ? editingEntry.id : `AD-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      transactionId: formState.transactionId.trim(),
      client: formState.client.trim(),
      platform: formState.platform.trim(),
      type: formState.type || 'Spend',
      amount: Number(formState.amount),
      date: formState.date || new Date().toISOString().split('T')[0],
    };

    const updated = editingEntry
      ? adSpends.map((item) => (item.id === editingEntry.id ? payload : item))
      : [payload, ...adSpends];

    setAdSpends(updated);
    saveStoredAdLedger(updated);

    setIsModalOpen(false);
    setEditingEntry(null);
  };

  // Time Range Description for display & reports
  const timeRangeDescription = useMemo(() => {
    if (dateFilter === 'Custom Range') {
      if (customStart && customEnd) {
        return `${formatDateDMY(customStart)} to ${formatDateDMY(customEnd)}`;
      }
      if (customStart) return `From ${formatDateDMY(customStart)}`;
      if (customEnd) return `Up to ${formatDateDMY(customEnd)}`;
      return 'Custom Range';
    }
    if (dateRange) {
      return `${formatDateDMY(dateRange.start)} to ${formatDateDMY(dateRange.end)} (${dateFilter})`;
    }
    return 'All Time (Maximum)';
  }, [dateFilter, dateRange, customStart, customEnd]);

  // CSV Export for filtered range
  const handleExportCSV = () => {
    if (filteredSpends.length === 0) {
      alert('No records available to export for the selected filter.');
      return;
    }

    const escapeCsv = (val: string | number) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = [
      'Date',
      'Transaction ID',
      'Client Name',
      'Type',
      'Platform / Method',
      'Amount (INR)',
    ];

    const rows = filteredSpends.map((e) => [
      escapeCsv(formatDateDMY(e.date)),
      escapeCsv(e.transactionId),
      escapeCsv(e.client),
      escapeCsv(e.type),
      escapeCsv(e.platform),
      escapeCsv(e.type === 'Deposit' ? e.amount : -e.amount),
    ]);

    const sanitize = (s: string) =>
      s.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
    const clientSlug = clientFilter === 'All' ? 'all_clients' : sanitize(clientFilter);
    const rangeSlug = sanitize(dateFilter);
    const todayStr = new Date().toISOString().slice(0, 10);

    const summaryRows = [
      [],
      ['--- SUMMARY METRICS ---'],
      ['Reporting Period', escapeCsv(timeRangeDescription)],
      ['Selected Client', escapeCsv(clientFilter === 'All' ? 'All Clients' : clientFilter)],
      ['Total Records', escapeCsv(filteredSpends.length)],
      ['Period Deposits (INR)', escapeCsv(periodDeposit)],
      ['Period Ad Spend (INR)', escapeCsv(periodSpend)],
      ['Period Net Flow (INR)', escapeCsv(periodDeposit - periodSpend)],
      ['Overall Account Balance (INR)', escapeCsv(remainingBalance)],
      ['Generated On', escapeCsv(formatDateDMY(new Date()))],
    ];

    const allLines = [
      headers.join(','),
      ...rows.map((r) => r.join(',')),
      ...summaryRows.map((r) => r.join(',')),
    ];

    const csvContent = '\uFEFF' + allLines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ad_ledger_${clientSlug}_${rangeSlug}_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  // PDF Export for filtered range
  const handleExportPDF = async () => {
    if (filteredSpends.length === 0) {
      alert('No records available to export for the selected filter.');
      return;
    }

    try {
      setIsExportingPdf(true);
      const companyProfile = getStoredBillingProfiles().company;

      const doc = (
        <AdLedgerPDF
          entries={filteredSpends}
          clientFilter={clientFilter}
          timeRangeDescription={timeRangeDescription}
          remainingBalance={remainingBalance}
          periodDeposit={periodDeposit}
          periodSpend={periodSpend}
          companyProfile={companyProfile}
        />
      );

      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const sanitize = (s: string) =>
        s.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
      const clientSlug = clientFilter === 'All' ? 'all_clients' : sanitize(clientFilter);
      const rangeSlug = sanitize(dateFilter);
      const todayStr = new Date().toISOString().slice(0, 10);

      link.setAttribute('download', `ad_ledger_${clientSlug}_${rangeSlug}_${todayStr}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      setExportDropdownOpen(false);
    } catch (err) {
      console.error('Failed to generate Ad Ledger PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">Client Ad Spend Ledger</h1>
          <p className="text-xs text-gray-500 mt-1">
            Track client ad budget deposits, outward ad spends, and live account balances.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {/* Export Dropdown (PDF & CSV) */}
          <div className="relative" ref={exportDropdownRef}>
            <button
              type="button"
              onClick={() => setExportDropdownOpen((prev) => !prev)}
              className="flex items-center gap-1.5 bg-white border border-gray-300 hover:border-indigo-400 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              title="Export entries for selected time range"
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
                  Range: {dateFilter} ({filteredSpends.length} {filteredSpends.length === 1 ? 'record' : 'records'})
                </div>

                {/* Option 1: PDF */}
                <button
                  type="button"
                  disabled={isExportingPdf || filteredSpends.length === 0}
                  onClick={handleExportPDF}
                  className="w-full text-left px-3.5 py-2 hover:bg-indigo-50/60 flex items-center gap-3 transition-colors group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
                      Statement with KPI metrics & balances
                    </div>
                  </div>
                </button>

                {/* Option 2: CSV */}
                <button
                  type="button"
                  disabled={filteredSpends.length === 0}
                  onClick={() => {
                    handleExportCSV();
                    setExportDropdownOpen(false);
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-emerald-50/60 flex items-center gap-3 transition-colors group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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

          <button
            onClick={handleOpenNew}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 flex items-center gap-2 shadow-2xs hover:shadow-xs transition-all text-xs"
          >
            <Plus className="w-4 h-4" /> Add Entry
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Remaining Balance */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
              Remaining Balance
            </p>
            <p
              className={`text-2xl font-heading font-bold ${
                remainingBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              ₹{remainingBalance.toLocaleString()}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              {clientFilter === 'All' ? 'Overall (All Time)' : `Balance for ${clientFilter}`}
            </p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* Total Deposit */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
              Total Deposit
            </p>
            <p className="text-2xl font-heading font-bold text-gray-900">
              ₹{periodDeposit.toLocaleString()}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">For selected period</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Total Spend */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
              Total Spend
            </p>
            <p className="text-2xl font-heading font-bold text-gray-900">
              ₹{periodSpend.toLocaleString()}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">For selected period</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Search Bar, Type Tabs & Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by client, platform, transaction ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-100 rounded-lg self-start sm:self-auto text-xs font-semibold">
            <button
              onClick={() => setTypeFilter('All')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                typeFilter === 'All'
                  ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All ({typeCounts.all})
            </button>
            <button
              onClick={() => setTypeFilter('Spend')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1 ${
                typeFilter === 'Spend'
                  ? 'bg-white text-amber-700 shadow-2xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-amber-600" />
              Spend ({typeCounts.spend})
            </button>
            <button
              onClick={() => setTypeFilter('Deposit')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1 ${
                typeFilter === 'Deposit'
                  ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
              Deposit ({typeCounts.deposit})
            </button>
          </div>

          {/* Client & Time Range Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Client Filter */}
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-700">
              <Filter className="w-3.5 h-3.5 text-gray-500" />
              <select
                className="bg-transparent focus:outline-none cursor-pointer"
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
              >
                <option value="All">All Clients</option>
                {registeredClients.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Range Filter */}
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-700">
              <Calendar className="w-3.5 h-3.5 text-gray-500" />
              <select
                className="bg-transparent focus:outline-none cursor-pointer"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="Maximum">All Time (Maximum)</option>
                <option value="This Month">This Month</option>
                <option value="Last Month">Last Month</option>
                <option value="Last 30 Days">Last 30 Days</option>
                <option value="Last 15 Days">Last 15 Days</option>
                <option value="Last 7 Days">Last 7 Days</option>
                <option value="This Quarter">This Quarter</option>
                <option value="This Year">This Year</option>
                <option value="Last Year">Last Year</option>
                <option value="Custom Range">Custom Range</option>
              </select>
            </div>
          </div>
        </div>

        {/* Custom Date Range Row */}
        {dateFilter === 'Custom Range' && (
          <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center gap-3 text-xs">
            <span className="font-semibold text-gray-600">From:</span>
            <input
              type="date"
              className="border border-gray-300 rounded-lg px-2.5 py-1 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
            />
            {customStart && (
              <span className="text-indigo-600 font-semibold">{formatDateDMY(customStart)}</span>
            )}
            <span className="font-semibold text-gray-600">To:</span>
            <input
              type="date"
              className="border border-gray-300 rounded-lg px-2.5 py-1 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
            />
            {customEnd && (
              <span className="text-indigo-600 font-semibold">{formatDateDMY(customEnd)}</span>
            )}
          </div>
        )}
      </div>

      {/* 4. Ledger Table (Date in 1st Column, Transaction ID before Amount) */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
            <h3 className="font-heading font-bold text-gray-900 text-sm">Ad Ledger Entries</h3>
            <span className="text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 font-semibold">
              {filteredSpends.length} {filteredSpends.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>
          {(clientFilter !== 'All' || typeFilter !== 'All' || dateFilter !== 'Maximum' || searchQuery) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('All');
                setClientFilter('All');
                setDateFilter('Maximum');
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/80 text-gray-600 font-semibold border-b border-gray-200 uppercase tracking-wider text-[11px]">
                {/* 1. Date */}
                <th className="py-3 px-4">Date</th>
                {/* 2. Client Name */}
                <th className="py-3 px-4">Client Name</th>
                {/* 3. Type */}
                <th className="py-3 px-4">Type</th>
                {/* 4. Platform / Method */}
                <th className="py-3 px-4">Platform / Method</th>
                {/* 5. Transaction ID (before Amount) */}
                <th className="py-3 px-4">Transaction ID</th>
                {/* 6. Amount */}
                <th className="py-3 px-4 text-right">Amount</th>
                {/* 7. Actions */}
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSpends.map((entry) => (
                <tr key={entry.id} className="hover:bg-indigo-50/30 transition-colors">
                  {/* 1. Date (1st Column) */}
                  <td className="py-3.5 px-4 text-gray-700 font-semibold whitespace-nowrap">
                    {formatDateDMY(entry.date)}
                  </td>

                  {/* 2. Client Name */}
                  <td className="py-3.5 px-4 font-semibold text-gray-900">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span>{entry.client}</span>
                    </div>
                  </td>

                  {/* 3. Type */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        entry.type === 'Deposit'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {entry.type === 'Deposit' ? (
                        <ArrowDownRight className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <ArrowUpRight className="w-3 h-3 text-amber-600" />
                      )}
                      {entry.type}
                    </span>
                  </td>

                  {/* 4. Platform / Method */}
                  <td className="py-3.5 px-4 text-gray-700 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 font-medium">
                      {entry.type === 'Spend' ? (
                        <Megaphone className="w-3.5 h-3.5 text-gray-400" />
                      ) : (
                        <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                      )}
                      <span>{entry.platform}</span>
                    </div>
                  </td>

                  {/* 5. Transaction ID (before Amount) */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                      {entry.transactionId}
                    </span>
                  </td>

                  {/* 6. Amount */}
                  <td
                    className={`py-3.5 px-4 font-bold text-right text-sm whitespace-nowrap ${
                      entry.type === 'Deposit' ? 'text-emerald-600' : 'text-gray-900'
                    }`}
                  >
                    {entry.type === 'Deposit' ? '+' : '-'}₹{entry.amount.toLocaleString()}
                  </td>

                  {/* 7. Actions */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(entry)}
                        className="p-1 text-gray-400 hover:text-indigo-600 rounded hover:bg-gray-100 transition-colors"
                        title="Edit Entry"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="p-1 text-gray-400 hover:text-rose-600 rounded hover:bg-gray-100 transition-colors"
                        title="Delete Entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredSpends.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500">
                    <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-semibold text-gray-700">No ad spend ledger entries found</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {searchQuery || clientFilter !== 'All' || typeFilter !== 'All' || dateFilter !== 'Maximum'
                        ? 'Try clearing search or adjusting your filters.'
                        : 'Click "+ Add Entry" to record your first client ad deposit or spend.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Add / Edit Pop Up Modal Window */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-700 to-indigo-800 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold leading-tight">
                  {editingEntry ? 'Edit Ad Ledger Entry' : 'New Ad Ledger Entry'}
                </h3>
                <p className="text-[11px] text-indigo-200 mt-0.5">
                  Record client ad spend disbursement or inward client funds deposit
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-indigo-200 hover:text-white rounded-lg hover:bg-indigo-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveModal} className="p-6 space-y-4">
              {/* 1. Entry Type Toggle */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1.5">
                  Entry Type <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const isChanging = formState.type !== 'Spend';
                      setFormState({
                        ...formState,
                        type: 'Spend',
                        platform: isChanging ? 'Google Ads' : formState.platform,
                        transactionId: isChanging
                          ? `TXN-${Math.floor(1000000 + Math.random() * 9000000)}`
                          : formState.transactionId,
                      });
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      formState.type === 'Spend'
                        ? 'bg-amber-50 text-amber-800 border-amber-300 ring-2 ring-amber-200'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4 text-amber-600" />
                    <span>Ad Spend (Outward)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const isChanging = formState.type !== 'Deposit';
                      setFormState({
                        ...formState,
                        type: 'Deposit',
                        platform: isChanging ? 'Bank Transfer' : formState.platform,
                        transactionId: isChanging
                          ? `DEP-${Math.floor(10000 + Math.random() * 90000)}`
                          : formState.transactionId,
                      });
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      formState.type === 'Deposit'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-200'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                    <span>Deposit (Inward)</span>
                  </button>
                </div>
              </div>

              {/* 2. Client Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Client Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  list="client-options-ledger"
                  required
                  placeholder="e.g. M/s Tamagna Personalcare Pvt Ltd"
                  value={formState.client || ''}
                  onChange={(e) => setFormState({ ...formState, client: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                />
                <datalist id="client-options-ledger">
                  {registeredClients.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              {/* 3. Platform / Method & Transaction ID in 2 columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    {formState.type === 'Deposit' ? 'Payment Method *' : 'Ad Platform *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      formState.type === 'Deposit' ? 'e.g. Bank Transfer, UPI, Cheque' : 'e.g. Google Ads, Meta Ads'
                    }
                    value={formState.platform || ''}
                    onChange={(e) => setFormState({ ...formState, platform: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Transaction ID / Ref *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TXN-9823471"
                    value={formState.transactionId || ''}
                    onChange={(e) => setFormState({ ...formState, transactionId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* 4. Amount & Date in 2 columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Amount (₹) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400">₹</span>
                    <input
                      type="number"
                      required
                      min={1}
                      placeholder="e.g. 5000"
                      value={formState.amount !== undefined ? formState.amount : ''}
                      onChange={(e) => setFormState({ ...formState, amount: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formState.date || ''}
                    onChange={(e) => setFormState({ ...formState, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <div className="text-[11px] text-indigo-600 font-semibold mt-1">
                    {formatDateDMY(formState.date)}
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition-colors shadow-2xs hover:shadow-xs"
                >
                  {editingEntry ? 'Update Entry' : 'Save Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdLedger;
