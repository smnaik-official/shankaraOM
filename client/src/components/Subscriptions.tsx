import React, { useState, useMemo, useEffect } from 'react';
import {
  CalendarClock,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building,
  ExternalLink,
  CreditCard,
  Download,
  X,
  Wallet,
  TrendingUp,
  Layers,
  Tag,
} from 'lucide-react';
import {
  Subscription,
  SubscriptionDuration,
  CurrencyCode,
  CURRENCY_SYMBOLS,
  APPROX_TO_INR_RATES,
  getStoredSubscriptions,
  saveStoredSubscriptions,
  getStoredSubscriptionCategories,
  saveStoredSubscriptionCategories,
  getNormalizedMonthlyInr,
  getDaysUntilRenewal,
  resolveSubscriptionStatus,
  advanceRenewalDate,
} from '../data/subscriptions';
import { getStoredClients } from './ClientList';
import { formatDateDMY } from '../utils/date';
import { getStoredExpenses, saveStoredExpenses, Expense } from '../data/expenses';

const DURATIONS: SubscriptionDuration[] = [
  'Monthly',
  'Quarterly',
  'Half-Yearly',
  'Yearly',
  'Biennial',
];

const CURRENCIES: CurrencyCode[] = ['INR', 'USD', 'EUR', 'GBP'];

export const Subscriptions: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() =>
    getStoredSubscriptions()
  );

  // Dynamic Categories from LocalStorage
  const [categories, setCategories] = useState<string[]>(() =>
    getStoredSubscriptionCategories()
  );
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Active Ownership Tab: 'ALL' | 'Company' | 'Client'
  const [activeOwnershipTab, setActiveOwnershipTab] = useState<'ALL' | 'Company' | 'Client'>('ALL');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [durationFilter, setDurationFilter] = useState<string>('All');
  const [clientFilter, setClientFilter] = useState<string>('All');

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [formData, setFormData] = useState<Partial<Subscription>>({
    ownership: 'Company',
    billingDuration: 'Monthly',
    currency: 'INR',
    category: 'SaaS & Software',
    startDate: new Date().toISOString().split('T')[0],
    renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  // Quick Renewal Modal State
  const [renewingSub, setRenewingSub] = useState<Subscription | null>(null);
  const [logToExpenseLedger, setLogToExpenseLedger] = useState(true);

  // Clients list for dropdowns
  const clientList = useMemo(() => getStoredClients(), []);

  // Save subscriptions to localStorage
  useEffect(() => {
    saveStoredSubscriptions(subscriptions);
    window.dispatchEvent(new CustomEvent('notifications-changed'));
  }, [subscriptions]);

  // Save categories to localStorage
  useEffect(() => {
    saveStoredSubscriptionCategories(categories);
  }, [categories]);

  // Category Management Handlers
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;

    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setCategoryError('This category already exists.');
      return;
    }

    const updated = [...categories, trimmed];
    setCategories(updated);
    setNewCategoryName('');
    setCategoryError(null);

    // If modal is open, auto-select newly added category
    if (isModalOpen) {
      setFormData((prev) => ({ ...prev, category: trimmed }));
    }
  };

  const handleRemoveCategory = (catToRemove: string) => {
    if (categories.length <= 1) {
      alert('You must maintain at least one category.');
      return;
    }

    const inUseCount = subscriptions.filter((s) => s.category === catToRemove).length;
    if (inUseCount > 0) {
      const confirmed = window.confirm(
        `Category "${catToRemove}" is currently assigned to ${inUseCount} subscription(s). If removed, those subscriptions will be moved to "${categories[0]}". Continue?`
      );
      if (!confirmed) return;

      const fallback = categories.find((c) => c !== catToRemove) || 'Other';
      setSubscriptions((prev) =>
        prev.map((s) => (s.category === catToRemove ? { ...s, category: fallback } : s))
      );
    }

    const updated = categories.filter((c) => c !== catToRemove);
    setCategories(updated);

    if (formData.category === catToRemove) {
      setFormData((prev) => ({ ...prev, category: updated[0] || 'Other' }));
    }
  };

  // Overall KPI Metrics
  const metrics = useMemo(() => {
    const totalCount = subscriptions.length;
    const companyCount = subscriptions.filter((s) => s.ownership === 'Company').length;
    const clientCount = subscriptions.filter((s) => s.ownership === 'Client').length;

    // Monthly normalized run-rate in INR
    const totalMonthlyRunRate = subscriptions
      .filter((s) => s.status !== 'Paused' && s.status !== 'Cancelled')
      .reduce((sum, s) => sum + getNormalizedMonthlyInr(s), 0);

    const annualRunRate = totalMonthlyRunRate * 12;

    // Renewals due soon (within next 30 days) or overdue
    const upcomingRenewals = subscriptions.filter((s) => {
      if (s.status === 'Paused' || s.status === 'Cancelled') return false;
      const days = getDaysUntilRenewal(s.renewalDate);
      return days <= 30;
    });

    const overdueCount = upcomingRenewals.filter(
      (s) => getDaysUntilRenewal(s.renewalDate) < 0
    ).length;

    const dueSoonAmountInr = upcomingRenewals.reduce(
      (sum, s) => sum + (s.amount * (APPROX_TO_INR_RATES[s.currency] || 1)),
      0
    );

    return {
      totalCount,
      companyCount,
      clientCount,
      totalMonthlyRunRate: Math.round(totalMonthlyRunRate),
      annualRunRate: Math.round(annualRunRate),
      upcomingRenewalsCount: upcomingRenewals.length,
      overdueCount,
      dueSoonAmountInr: Math.round(dueSoonAmountInr),
    };
  }, [subscriptions]);

  // Filtered subscriptions list
  const filteredSubscriptions = useMemo(() => {
    return subscriptions
      .filter((sub) => {
        // Ownership tab filter
        if (activeOwnershipTab !== 'ALL' && sub.ownership !== activeOwnershipTab) {
          return false;
        }

        // Specific Client filter
        if (clientFilter !== 'All') {
          if (sub.clientName !== clientFilter && sub.clientId !== clientFilter) {
            return false;
          }
        }

        // Category filter
        if (categoryFilter !== 'All' && sub.category !== categoryFilter) {
          return false;
        }

        // Duration filter
        if (durationFilter !== 'All' && sub.billingDuration !== durationFilter) {
          return false;
        }

        // Status filter
        const resolvedStatus = resolveSubscriptionStatus(sub);
        if (statusFilter !== 'All') {
          if (statusFilter === 'Active' && resolvedStatus !== 'Active') return false;
          if (statusFilter === 'Expiring Soon' && resolvedStatus !== 'Expiring Soon') return false;
          if (statusFilter === 'Overdue' && resolvedStatus !== 'Overdue') return false;
          if (statusFilter === 'Paused' && sub.status !== 'Paused') return false;
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = sub.name.toLowerCase().includes(q);
          const matchClient = (sub.clientName || '').toLowerCase().includes(q);
          const matchCategory = sub.category.toLowerCase().includes(q);
          const matchEmail = (sub.loginEmail || '').toLowerCase().includes(q);
          const matchNotes = (sub.notes || '').toLowerCase().includes(q);
          const matchVendor = (sub.vendorUrl || '').toLowerCase().includes(q);
          const matchRenewalDate = formatDateDMY(sub.renewalDate).toLowerCase().includes(q);
          if (
            !matchName &&
            !matchClient &&
            !matchCategory &&
            !matchEmail &&
            !matchNotes &&
            !matchVendor &&
            !matchRenewalDate
          ) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => a.renewalDate.localeCompare(b.renewalDate));
  }, [
    subscriptions,
    activeOwnershipTab,
    clientFilter,
    categoryFilter,
    durationFilter,
    statusFilter,
    searchQuery,
  ]);

  // Modal Handlers
  const handleOpenAdd = () => {
    setEditingSub(null);
    setFormData({
      ownership: activeOwnershipTab === 'Client' ? 'Client' : 'Company',
      billingDuration: 'Monthly',
      currency: 'INR',
      category: categories[0] || 'SaaS & Software',
      startDate: new Date().toISOString().split('T')[0],
      renewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const handleEdit = (sub: Subscription) => {
    setEditingSub(sub);
    setFormData({ ...sub });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this subscription?')) {
      setSubscriptions(subscriptions.filter((s) => s.id !== id));
    }
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.amount || !formData.renewalDate) {
      alert('Please fill in all required fields (Service Name, Cost, and Renewal Date).');
      return;
    }

    const payload: Subscription = {
      id: editingSub ? editingSub.id : `sub-${Date.now()}`,
      name: formData.name.trim(),
      category: formData.category || categories[0] || 'SaaS & Software',
      ownership: formData.ownership || 'Company',
      clientId: formData.ownership === 'Client' ? formData.clientId : undefined,
      clientName: formData.ownership === 'Client' ? formData.clientName : undefined,
      billingDuration: formData.billingDuration || 'Monthly',
      amount: Number(formData.amount),
      currency: formData.currency || 'INR',
      startDate: formData.startDate || new Date().toISOString().split('T')[0],
      renewalDate: formData.renewalDate,
      loginEmail: formData.loginEmail?.trim(),
      vendorUrl: formData.vendorUrl?.trim(),
      notes: formData.notes?.trim(),
      status: formData.status || 'Active',
      lastRenewedDate: editingSub ? editingSub.lastRenewedDate : undefined,
    };

    if (editingSub) {
      setSubscriptions(subscriptions.map((s) => (s.id === editingSub.id ? payload : s)));
    } else {
      setSubscriptions([payload, ...subscriptions]);
    }

    setIsModalOpen(false);
    setEditingSub(null);
  };

  // 1-Click Renewal Execution
  const handleConfirmRenewal = () => {
    if (!renewingSub) return;

    const newRenewalDate = advanceRenewalDate(renewingSub.renewalDate, renewingSub.billingDuration);
    const todayStr = new Date().toISOString().split('T')[0];

    // Optionally post expense to expense ledger if company subscription
    if (renewingSub.ownership === 'Company' && logToExpenseLedger) {
      try {
        const storedExpenses = getStoredExpenses();
        const inrAmount =
          renewingSub.amount * (APPROX_TO_INR_RATES[renewingSub.currency] || 1);

        const newExpenseEntry: Expense = {
          id: `exp-sub-${Date.now()}`,
          description: `Subscription Renewal: ${renewingSub.name} (${renewingSub.billingDuration})`,
          category: 'IT',
          amount: Math.round(inrAmount),
          date: todayStr,
          isRecurring: true,
        };

        saveStoredExpenses([newExpenseEntry, ...storedExpenses]);
      } catch (e) {
        console.error('Failed to log subscription to expenses:', e);
      }
    }

    // Update the subscription in state
    setSubscriptions(
      subscriptions.map((s) => {
        if (s.id === renewingSub.id) {
          return {
            ...s,
            renewalDate: newRenewalDate,
            lastRenewedDate: todayStr,
            status: 'Active',
          };
        }
        return s;
      })
    );

    setRenewingSub(null);
  };

  // CSV Export for filtered range
  const handleExportCSV = () => {
    if (filteredSubscriptions.length === 0) {
      alert('No subscriptions to export with current filters.');
      return;
    }

    const escapeCsv = (val: string | number | undefined) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = [
      'Service Name',
      'Ownership',
      'Client Name',
      'Category',
      'Duration',
      'Amount',
      'Currency',
      'Est Monthly (INR)',
      'Next Renewal Date',
      'Status',
      'Days Remaining',
      'Admin Email',
      'Vendor Website',
      'Notes',
    ];

    const rows = filteredSubscriptions.map((s) => {
      const days = getDaysUntilRenewal(s.renewalDate);
      const status = resolveSubscriptionStatus(s);
      return [
        escapeCsv(s.name),
        escapeCsv(s.ownership === 'Company' ? 'Company (Shankara)' : 'Client Managed'),
        escapeCsv(s.clientName || 'N/A'),
        escapeCsv(s.category),
        escapeCsv(s.billingDuration),
        escapeCsv(s.amount),
        escapeCsv(s.currency),
        escapeCsv(Math.round(getNormalizedMonthlyInr(s))),
        escapeCsv(formatDateDMY(s.renewalDate)),
        escapeCsv(status),
        escapeCsv(days),
        escapeCsv(s.loginEmail || ''),
        escapeCsv(s.vendorUrl || ''),
        escapeCsv(s.notes || ''),
      ];
    });

    const summaryBlock = [
      [],
      ['--- SUMMARY METRICS ---'],
      ['Total Subscriptions Exported', escapeCsv(filteredSubscriptions.length)],
      ['Ownership Scope', escapeCsv(activeOwnershipTab === 'ALL' ? 'All (Company & Clients)' : activeOwnershipTab)],
      ['Total Normalized Monthly Commitment (INR)', escapeCsv(metrics.totalMonthlyRunRate)],
      ['Projected Annual Spend (INR)', escapeCsv(metrics.annualRunRate)],
      ['Exported On', escapeCsv(formatDateDMY(new Date()))],
    ];

    const allLines = [
      headers.join(','),
      ...rows.map((r) => r.join(',')),
      ...summaryBlock.map((r) => r.join(',')),
    ];

    const csvContent = '\uFEFF' + allLines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `subscriptions_and_renewals_${activeOwnershipTab.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-heading font-bold text-gray-900 tracking-tight">
              Subscriptions & Renewals
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              License & SaaS Tracking
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Track software renewals, billing frequencies, and deadlines for Shankara and managed clients.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Manage Categories Button */}
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="flex items-center gap-1.5 bg-white border border-gray-300 hover:border-indigo-400 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            title="Add or remove subscription categories"
          >
            <Tag className="w-3.5 h-3.5 text-indigo-600" />
            <span>Categories ({categories.length})</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-white border border-gray-300 hover:border-indigo-400 hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            title="Export filtered subscriptions to CSV"
          >
            <Download className="w-3.5 h-3.5 text-gray-600" />
            <span>Export CSV</span>
          </button>

          {/* Add Subscription Button */}
          <button
            onClick={handleOpenAdd}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 flex items-center gap-2 shadow-2xs hover:shadow-xs transition-all text-xs"
          >
            <Plus className="w-4 h-4" /> Add Subscription
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Subscriptions */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Active Subscriptions
            </span>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-heading font-bold text-gray-900">
              {metrics.totalCount} Subscriptions
            </p>
            <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1.5">
              <span className="font-semibold text-indigo-700">{metrics.companyCount} Company</span>
              <span>•</span>
              <span className="font-semibold text-emerald-700">{metrics.clientCount} Client Managed</span>
            </p>
          </div>
        </div>

        {/* Card 2: Monthly Run-Rate */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Monthly Run-Rate
            </span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-heading font-bold text-gray-900">
              ₹{metrics.totalMonthlyRunRate.toLocaleString('en-IN')} <span className="text-xs font-normal text-gray-400">/ mo</span>
            </p>
            <p className="text-[11px] text-gray-500 mt-1">
              Normalized monthly software commitment
            </p>
          </div>
        </div>

        {/* Card 3: Annual Spend Commitment */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Annual Projected Spend
            </span>
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-heading font-bold text-gray-900">
              ₹{metrics.annualRunRate.toLocaleString('en-IN')} <span className="text-xs font-normal text-gray-400">/ yr</span>
            </p>
            <p className="text-[11px] text-gray-500 mt-1">
              12-month license & hosting run-rate
            </p>
          </div>
        </div>

        {/* Card 4: Upcoming Renewals Alert */}
        <div
          className={`p-5 rounded-xl border shadow-2xs flex flex-col justify-between transition-all ${
            metrics.overdueCount > 0
              ? 'bg-rose-50/50 border-rose-200'
              : metrics.upcomingRenewalsCount > 0
              ? 'bg-amber-50/50 border-amber-200'
              : 'bg-white border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                metrics.overdueCount > 0
                  ? 'text-rose-700'
                  : metrics.upcomingRenewalsCount > 0
                  ? 'text-amber-700'
                  : 'text-gray-500'
              }`}
            >
              Renewals Due Soon (30d)
            </span>
            <div
              className={`p-2.5 rounded-xl ${
                metrics.overdueCount > 0
                  ? 'bg-rose-100 text-rose-700'
                  : metrics.upcomingRenewalsCount > 0
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <CalendarClock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <p
              className={`text-2xl font-heading font-bold ${
                metrics.overdueCount > 0
                  ? 'text-rose-700'
                  : metrics.upcomingRenewalsCount > 0
                  ? 'text-amber-800'
                  : 'text-gray-900'
              }`}
            >
              {metrics.upcomingRenewalsCount} {metrics.upcomingRenewalsCount === 1 ? 'Renewal' : 'Renewals'}
            </p>
            <p className="text-[11px] text-gray-500 mt-1">
              {metrics.overdueCount > 0 ? (
                <span className="text-rose-600 font-semibold">
                  {metrics.overdueCount} overdue renewal requiring attention
                </span>
              ) : (
                `₹${metrics.dueSoonAmountInr.toLocaleString('en-IN')} due in next 30 days`
              )}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Ownership View Filter Tabs */}
      <div className="flex items-center justify-between border-b border-gray-200 gap-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveOwnershipTab('ALL')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all ${
              activeOwnershipTab === 'ALL'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>All Subscriptions ({subscriptions.length})</span>
          </button>

          <button
            onClick={() => setActiveOwnershipTab('Company')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all ${
              activeOwnershipTab === 'Company'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Company / Self ({metrics.companyCount})</span>
          </button>

          <button
            onClick={() => setActiveOwnershipTab('Client')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all ${
              activeOwnershipTab === 'Client'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Client Managed ({metrics.clientCount})</span>
          </button>
        </div>

        <div className="text-[11px] text-gray-400 hidden sm:block">
          Showing {filteredSubscriptions.length} of {subscriptions.length} records
        </div>
      </div>

      {/* 4. Search Bar & Clean Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by tool name, client, email, category..."
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

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Client Filter (when viewing All or Client Managed) */}
            {activeOwnershipTab !== 'Company' && (
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs">
                <Building className="w-3.5 h-3.5 text-gray-500" />
                <select
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value)}
                  className="bg-transparent border-none text-gray-700 font-medium focus:outline-none cursor-pointer pr-1"
                >
                  <option value="All">All Clients</option>
                  {clientList.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Renewal Status Filter */}
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs">
              <Clock className="w-3.5 h-3.5 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-none text-gray-700 font-medium focus:outline-none cursor-pointer pr-1"
              >
                <option value="All">All Renewal Status</option>
                <option value="Expiring Soon">Expiring Soon (≤ 15d)</option>
                <option value="Overdue">Overdue</option>
                <option value="Active">Healthy / Active</option>
                <option value="Paused">Paused</option>
              </select>
            </div>

            {/* Duration Filter */}
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-gray-500" />
              <select
                value={durationFilter}
                onChange={(e) => setDurationFilter(e.target.value)}
                className="bg-transparent border-none text-gray-700 font-medium focus:outline-none cursor-pointer pr-1"
              >
                <option value="All">All Durations</option>
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            {/* Dynamic Category Filter */}
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs">
              <Tag className="w-3.5 h-3.5 text-gray-500" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent border-none text-gray-700 font-medium focus:outline-none cursor-pointer pr-1"
              >
                <option value="All">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Filters */}
            {(searchQuery || categoryFilter !== 'All' || statusFilter !== 'All' || durationFilter !== 'All' || clientFilter !== 'All') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCategoryFilter('All');
                  setStatusFilter('All');
                  setDurationFilter('All');
                  setClientFilter('All');
                }}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. Clean, Uncluttered Subscriptions Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                <th className="py-3 px-4">Service & Tool</th>
                <th className="py-3 px-4">Managed For</th>
                <th className="py-3 px-4">Duration & Cost</th>
                <th className="py-3 px-4">Next Renewal Date</th>
                <th className="py-3 px-4">Renewal Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-xs">
              {filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <CalendarClock className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <p className="font-semibold text-gray-700 text-sm">No subscriptions found</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Try adjusting your search criteria or add a new subscription entry.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSubscriptions.map((sub) => {
                  const days = getDaysUntilRenewal(sub.renewalDate);
                  const status = resolveSubscriptionStatus(sub);
                  const symbol = CURRENCY_SYMBOLS[sub.currency] || '₹';
                  const inrEquivalent = sub.currency !== 'INR'
                    ? Math.round(sub.amount * (APPROX_TO_INR_RATES[sub.currency] || 1))
                    : null;

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-gray-50/75 transition-colors group"
                    >
                      {/* 1. Service & Tool */}
                      <td className="py-3.5 px-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                            <span>{sub.name}</span>
                            {sub.vendorUrl && (
                              <a
                                href={sub.vendorUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-gray-400 hover:text-indigo-600"
                                title="Open Vendor Portal"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                              {sub.category}
                            </span>
                            {sub.loginEmail && (
                              <span className="text-[11px] text-gray-400 truncate max-w-[180px]" title={sub.loginEmail}>
                                {sub.loginEmail}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. Managed For (Ownership) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {sub.ownership === 'Company' ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <Building className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Shankara (Self)</span>
                          </div>
                        ) : (
                          <div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                              <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                              <span className="truncate max-w-[170px]" title={sub.clientName || 'Client'}>
                                {sub.clientName || 'Client Account'}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-0.5 pl-1">
                              Client Managed
                            </p>
                          </div>
                        )}
                      </td>

                      {/* 3. Duration & Cost */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-heading font-bold text-gray-900 text-sm">
                          {symbol}
                          {sub.amount.toLocaleString()}
                          <span className="text-xs font-medium text-gray-500">
                            {' '}
                            / {sub.billingDuration.toLowerCase().replace('yearly', 'yr').replace('monthly', 'mo')}
                          </span>
                        </div>
                        {inrEquivalent && (
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            ≈ ₹{inrEquivalent.toLocaleString('en-IN')} INR
                          </p>
                        )}
                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-50 border border-gray-200 text-gray-600">
                          {sub.billingDuration}
                        </span>
                      </td>

                      {/* 4. Next Renewal Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-bold text-gray-900">
                          <CalendarClock className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{formatDateDMY(sub.renewalDate)}</span>
                        </div>
                        {sub.lastRenewedDate && (
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            Last renewed: {formatDateDMY(sub.lastRenewedDate)}
                          </p>
                        )}
                      </td>

                      {/* 5. Renewal Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {status === 'Overdue' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Overdue by {Math.abs(days)}d</span>
                          </span>
                        )}
                        {status === 'Expiring Soon' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>{days === 0 ? 'Due Today!' : `Renews in ${days}d`}</span>
                          </span>
                        )}
                        {status === 'Active' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Active ({days}d)</span>
                          </span>
                        )}
                        {status === 'Paused' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                            <span>Paused</span>
                          </span>
                        )}
                      </td>

                      {/* 6. Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1-Click Renew Button */}
                          <button
                            onClick={() => {
                              setRenewingSub(sub);
                              setLogToExpenseLedger(sub.ownership === 'Company');
                            }}
                            className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Renew Subscription & Advance Renewal Date"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>

                          {/* Edit Button */}
                          <button
                            onClick={() => handleEdit(sub)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit Subscription Details"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDelete(sub.id)}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Subscription"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===================== CLEAN & SPACIOUS POP-UP: ADD / EDIT SUBSCRIPTION ===================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-gray-200 flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Fixed Modal Header */}
            <div className="flex-shrink-0 px-6 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-heading font-bold">
                  {editingSub ? 'Edit Subscription' : 'Add New Subscription'}
                </h3>
                <p className="text-[11px] text-indigo-100 mt-0.5">
                  Track recurring software tool, billing frequency, and renewal deadline.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg transition-colors hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Modal Form Body */}
            <form id="subscriptionModalForm" onSubmit={handleSaveModal} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs overscroll-contain">
              {/* 1. Ownership Selection */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1.5">
                  Subscription For <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, ownership: 'Company', clientName: undefined, clientId: undefined })
                    }
                    className={`py-2 px-3.5 rounded-xl border font-semibold text-xs flex items-center justify-center gap-2 transition-all ${
                      formData.ownership === 'Company'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Building className="w-4 h-4" />
                    <span>Company (Self)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        ownership: 'Client',
                        clientName: clientList[0]?.name || 'Client',
                        clientId: clientList[0]?.id || '1',
                      })
                    }
                    className={`py-2 px-3.5 rounded-xl border font-semibold text-xs flex items-center justify-center gap-2 transition-all ${
                      formData.ownership === 'Client'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Client Managed</span>
                  </button>
                </div>
              </div>

              {/* 2. Client Selection (Conditional) */}
              {formData.ownership === 'Client' && (
                <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-200">
                  <label className="block font-semibold text-purple-900 mb-1">
                    Select Client Account <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.clientName || ''}
                    onChange={(e) => {
                      const chosen = clientList.find((c) => c.name === e.target.value);
                      setFormData({
                        ...formData,
                        clientName: e.target.value,
                        clientId: chosen?.id,
                      });
                    }}
                    className="w-full bg-white border border-purple-300 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none font-medium text-gray-800"
                  >
                    {clientList.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 3. Service Name & Category Row */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-7">
                  <label className="block font-semibold text-gray-700 mb-1">
                    Service / Tool Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Google Workspace, AWS, Figma"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full bg-gray-50/50 border border-gray-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                  />
                </div>

                <div className="sm:col-span-5">
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-gray-700">
                      Category <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsCategoryModalOpen(true)}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 transition-colors"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      <span>Manage</span>
                    </button>
                  </div>
                  <select
                    value={formData.category || categories[0] || 'SaaS & Software'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-gray-50/50 border border-gray-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 4. Duration, Cost & Currency in a 3-Column Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Duration <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.billingDuration || 'Monthly'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        billingDuration: e.target.value as SubscriptionDuration,
                      })
                    }
                    className="w-full bg-gray-50/50 border border-gray-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold text-indigo-700"
                  >
                    {DURATIONS.map((dur) => (
                      <option key={dur} value={dur}>
                        {dur}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Cost <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 10400"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    required
                    className="w-full bg-gray-50/50 border border-gray-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold text-gray-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Currency</label>
                  <select
                    value={formData.currency || 'INR'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        currency: e.target.value as CurrencyCode,
                      })
                    }
                    className="w-full bg-gray-50/50 border border-gray-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold text-gray-800"
                  >
                    {CURRENCIES.map((cur) => (
                      <option key={cur} value={cur}>
                        {cur} ({CURRENCY_SYMBOLS[cur]})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 5. Dates Row: Start Date & Renewal Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate || ''}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-gray-50/50 border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  {formData.startDate && (
                    <p className="text-[10px] text-gray-400 mt-1">
                      Started: {formatDateDMY(formData.startDate)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Next Renewal Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.renewalDate || ''}
                    onChange={(e) => setFormData({ ...formData, renewalDate: e.target.value })}
                    required
                    className="w-full bg-gray-50/50 border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold text-indigo-700"
                  />
                  {formData.renewalDate && (
                    <p className="text-[10px] text-indigo-600 font-semibold mt-1">
                      Renews: {formatDateDMY(formData.renewalDate)} (
                      {getDaysUntilRenewal(formData.renewalDate) >= 0
                        ? `in ${getDaysUntilRenewal(formData.renewalDate)} days`
                        : `overdue by ${Math.abs(getDaysUntilRenewal(formData.renewalDate))} days`}
                      )
                    </p>
                  )}
                </div>
              </div>

              {/* 6. Optional Details (Vendor URL, Account Email, Notes) */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-gray-600 mb-1">
                      Vendor URL <span className="font-normal text-gray-400">(Optional)</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://workspace.google.com"
                      value={formData.vendorUrl || ''}
                      onChange={(e) => setFormData({ ...formData, vendorUrl: e.target.value })}
                      className="w-full bg-gray-50/50 border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-600 mb-1">
                      Account Email <span className="font-normal text-gray-400">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="admin@shankaraonline.com"
                      value={formData.loginEmail || ''}
                      onChange={(e) => setFormData({ ...formData, loginEmail: e.target.value })}
                      className="w-full bg-gray-50/50 border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-gray-600 mb-1">
                    Notes & Remarks <span className="font-normal text-gray-400">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Short description, contract terms, or special instructions..."
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full bg-gray-50/50 border border-gray-300 rounded-lg px-3 py-1.5 text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </form>

            {/* Fixed Modal Footer */}
            <div className="flex-shrink-0 px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-100 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="subscriptionModalForm"
                className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-semibold hover:bg-indigo-700 shadow-2xs transition-colors"
              >
                {editingSub ? 'Save Changes' : 'Create Subscription'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: MANAGE CATEGORIES ===================== */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 flex flex-col max-h-[88vh] overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex-shrink-0 px-5 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5" />
                <h3 className="text-base font-heading font-bold">Manage Categories</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setCategoryError(null);
                  setNewCategoryName('');
                }}
                className="text-white/80 hover:text-white p-1 rounded-lg transition-colors hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {/* Add New Category Form */}
              <form onSubmit={handleAddCategory} className="space-y-2">
                <label className="block font-semibold text-gray-700">
                  Add New Category
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Analytics & Data, Cyber Security..."
                    value={newCategoryName}
                    onChange={(e) => {
                      setNewCategoryName(e.target.value);
                      setCategoryError(null);
                    }}
                    className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-lg font-bold flex items-center gap-1 shadow-2xs whitespace-nowrap"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>
                {categoryError && (
                  <p className="text-[11px] text-rose-600 font-medium">{categoryError}</p>
                )}
              </form>

              {/* Existing Categories List */}
              <div className="pt-2 border-t border-gray-200">
                <label className="block font-semibold text-gray-700 mb-2">
                  Existing Categories ({categories.length})
                </label>
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {categories.map((cat) => {
                    const usageCount = subscriptions.filter((s) => s.category === cat).length;
                    return (
                      <div
                        key={cat}
                        className="flex items-center justify-between p-2.5 bg-gray-50 hover:bg-gray-100/80 rounded-lg border border-gray-200 transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Tag className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                          <span className="font-semibold text-gray-800 truncate">{cat}</span>
                          <span className="text-[10px] text-gray-400 bg-white border border-gray-200 px-1.5 py-0.2 rounded-full">
                            {usageCount} in use
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCategory(cat)}
                          className="text-gray-400 hover:text-rose-600 p-1 rounded transition-colors"
                          title={`Delete "${cat}"`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setCategoryError(null);
                  setNewCategoryName('');
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: 1-CLICK RENEWAL CONFIRMATION ===================== */}
      {renewingSub && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-gray-200 flex flex-col max-h-[88vh] overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex-shrink-0 px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                <h3 className="text-base font-heading font-bold">Renew Subscription</h3>
              </div>
              <button
                type="button"
                onClick={() => setRenewingSub(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg transition-colors hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Service:</span>
                  <span className="font-bold text-gray-900 text-sm">{renewingSub.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Managed For:</span>
                  <span className="font-semibold text-gray-800">
                    {renewingSub.ownership === 'Company' ? 'Shankara Online Solutions (Self)' : `Client: ${renewingSub.clientName}`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Billing Duration:</span>
                  <span className="font-semibold text-indigo-700">{renewingSub.billingDuration}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Renewal Cost:</span>
                  <span className="font-bold text-gray-900">
                    {CURRENCY_SYMBOLS[renewingSub.currency]}
                    {renewingSub.amount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                  <span className="text-gray-500">Previous Renewal:</span>
                  <span className="font-medium text-gray-600">{formatDateDMY(renewingSub.renewalDate)}</span>
                </div>
                <div className="flex justify-between items-center font-bold text-emerald-700">
                  <span>New Next Renewal Date:</span>
                  <span>{formatDateDMY(advanceRenewalDate(renewingSub.renewalDate, renewingSub.billingDuration))}</span>
                </div>
              </div>

              {/* Option to log as expense if company-owned */}
              {renewingSub.ownership === 'Company' && (
                <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="logExpenseCheck"
                    checked={logToExpenseLedger}
                    onChange={(e) => setLogToExpenseLedger(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 mt-0.5"
                  />
                  <div>
                    <label htmlFor="logExpenseCheck" className="font-semibold text-gray-900 cursor-pointer block">
                      Post to Expense Ledger
                    </label>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Automatically record this renewal payment (₹
                      {Math.round(
                        renewingSub.amount * (APPROX_TO_INR_RATES[renewingSub.currency] || 1)
                      ).toLocaleString('en-IN')}{' '}
                      under IT category) in your monthly Expenses.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-shrink-0 px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setRenewingSub(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRenewal}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-bold shadow-2xs flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Advance Renewal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscriptions;
