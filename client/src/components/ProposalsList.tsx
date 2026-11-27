import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  FileText,
  Building2,
  User,
  X,
  CheckCircle2,
  Clock,
  TrendingUp,
  Kanban,
  Table as TableIcon,
  Send,
  AlertCircle,
  IndianRupee,
  Users,
} from 'lucide-react';
import {
  Proposal,
  ProposalStatus,
  BillingType,
  BillingEntity,
  getStoredProposals,
  saveStoredProposals,
  calculatePipelineMetrics,
  getNextProposalId,
} from '../data/proposals';
import { getCurrencySymbol, getCurrencyLocale } from '../data/quotations';
import { formatDateDMY } from '../utils/date';

const STATUS_CONFIG: Record<
  ProposalStatus,
  { label: string; badgeClass: string; borderClass: string; bgSoft: string; icon: any }
> = {
  'Sent to Client': {
    label: 'Sent to Client',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    borderClass: 'border-blue-300',
    bgSoft: 'bg-blue-50/40',
    icon: Send,
  },
  'Under Review': {
    label: 'Under Review',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    borderClass: 'border-amber-300',
    bgSoft: 'bg-amber-50/40',
    icon: Clock,
  },
  Accepted: {
    label: 'Accepted',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    borderClass: 'border-emerald-300',
    bgSoft: 'bg-emerald-50/40',
    icon: CheckCircle2,
  },
  Declined: {
    label: 'Declined',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    borderClass: 'border-rose-300',
    bgSoft: 'bg-rose-50/40',
    icon: X,
  },
};

const ProposalsList: React.FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>(() => getStoredProposals());
  const shouldPersistRef = useRef(false);

  // Views & Filters
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ProposalStatus>('ALL');
  const [entityFilter, setEntityFilter] = useState<'ALL' | BillingEntity>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | BillingType>('ALL');
  const [sortBy, setSortBy] = useState<'value_desc' | 'value_asc' | 'date_desc' | 'prob_desc'>('value_desc');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [formState, setFormState] = useState<Partial<Proposal>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  useEffect(() => {
    if (!shouldPersistRef.current) return;
    shouldPersistRef.current = false;
    saveStoredProposals(proposals);
  }, [proposals]);

  useEffect(() => {
    const handleSync = () => {
      shouldPersistRef.current = false;
      setProposals(getStoredProposals());
    };
    window.addEventListener('proposals-changed', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('proposals-changed', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Income & Pipeline Forecasting Metrics
  const metrics = useMemo(() => {
    return calculatePipelineMetrics(proposals, '2026-11');
  }, [proposals]);

  // Filtered & Sorted Proposals
  const filteredProposals = useMemo(() => {
    return proposals
      .filter((p) => {
        if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
        if (entityFilter !== 'ALL' && p.billingEntity !== entityFilter) return false;
        if (typeFilter !== 'ALL' && p.billingType !== typeFilter) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchClient = p.clientName.toLowerCase().includes(q);
          const matchService = p.serviceTitle.toLowerCase().includes(q);
          const matchDesc = p.serviceDescription.toLowerCase().includes(q);
          const matchPoc = p.contactPerson.toLowerCase().includes(q);
          const matchLoc = p.location.toLowerCase().includes(q);
          if (!matchClient && !matchService && !matchDesc && !matchPoc && !matchLoc) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'value_desc') return b.tentativeValue - a.tentativeValue;
        if (sortBy === 'value_asc') return a.tentativeValue - b.tentativeValue;
        if (sortBy === 'prob_desc') return b.probability - a.probability;
        if (sortBy === 'date_desc') return b.expectedCloseDate.localeCompare(a.expectedCloseDate);
        return 0;
      });
  }, [proposals, statusFilter, entityFilter, typeFilter, searchQuery, sortBy]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingProposal(null);
    setFormState({
      id: getNextProposalId(proposals),
      clientName: '',
      contactPerson: '',
      email: '',
      phone: '',
      location: 'Bangalore, Karnataka',
      serviceTitle: '',
      serviceDescription: '',
      tentativeValue: 50000,
      billingType: 'One-Time Project',
      billingEntity: 'COMPANY',
      probability: 60,
      status: 'Sent to Client',
      sentDate: new Date().toISOString().slice(0, 10),
      expectedCloseDate: '2026-11-30',
      validUntil: '2026-12-15',
      notes: '',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (proposal: Proposal) => {
    setEditingProposal(proposal);
    setFormState({ ...proposal });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Save Proposal
  const handleSaveProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.clientName?.trim()) {
      setFormError('Please enter the prospective client name.');
      return;
    }
    if (!formState.serviceTitle?.trim()) {
      setFormError('Please specify the pitched service title.');
      return;
    }
    if (!formState.serviceDescription?.trim()) {
      setFormError('Please describe the pitched scope of services.');
      return;
    }
    if (!formState.tentativeValue || formState.tentativeValue <= 0) {
      setFormError('Please enter a valid tentative project value.');
      return;
    }

    const nowStr = new Date().toISOString().slice(0, 10);

    if (editingProposal) {
      // Update
      const updatedList = proposals.map((p) =>
        p.id === editingProposal.id
          ? ({
              ...p,
              ...formState,
              updatedAt: nowStr,
            } as Proposal)
          : p
      );
      shouldPersistRef.current = true;
      setProposals(updatedList);
      showToast(`Proposal "${formState.clientName}" updated successfully.`);
    } else {
      // Create
      const newEntry: Proposal = {
        id: formState.id || getNextProposalId(proposals),
        clientName: formState.clientName!.trim(),
        contactPerson: formState.contactPerson?.trim() || '',
        email: formState.email?.trim() || '',
        phone: formState.phone?.trim() || '',
        location: formState.location?.trim() || 'Bangalore, Karnataka',
        serviceTitle: formState.serviceTitle!.trim(),
        serviceDescription: formState.serviceDescription!.trim(),
        tentativeValue: Number(formState.tentativeValue) || 0,
        billingType: formState.billingType || 'One-Time Project',
        billingEntity: formState.billingEntity || 'COMPANY',
        probability: Number(formState.probability) || 50,
        status: formState.status || 'Sent to Client',
        sentDate: formState.sentDate || nowStr,
        expectedCloseDate: formState.expectedCloseDate || nowStr,
        validUntil: formState.validUntil || nowStr,
        notes: formState.notes || '',
        createdAt: nowStr,
        updatedAt: nowStr,
      };
      shouldPersistRef.current = true;
      setProposals([newEntry, ...proposals]);
      showToast(`New quote for "${newEntry.clientName}" logged into pipeline.`);
    }

    setIsModalOpen(false);
  };

  // Quick Status Change
  const handleQuickStatusChange = (id: string, newStatus: ProposalStatus) => {
    const updated = proposals.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          status: newStatus,
          probability:
            newStatus === 'Accepted'
              ? 100
              : newStatus === 'Declined'
              ? 0
              : newStatus === 'Under Review'
              ? 70
              : 50,
          updatedAt: new Date().toISOString().slice(0, 10),
        };
      }
      return p;
    });
    shouldPersistRef.current = true;
    setProposals(updated);
    showToast(`Status updated to "${newStatus}".`);
  };

  // Delete Proposal
  const handleDeleteProposal = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete proposal for "${name}"?`)) {
      shouldPersistRef.current = true;
      setProposals(proposals.filter((p) => p.id !== id));
      showToast(`Proposal for "${name}" removed.`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Feedback Notification */}
      {feedbackToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-fade-in border border-gray-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold font-heading text-gray-900">
              Prospects
            </h1>
            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2.5 py-0.5 rounded-full">
              Pipeline Status
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Track prospective client pitches, service scopes, tentative deal values, and status.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Mode Toggle */}
          <div className="inline-flex bg-gray-100 p-1 rounded-lg border border-gray-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-gray-900 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Table Ledger View"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-white text-gray-900 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
              title="Kanban Pipeline View"
            >
              <Kanban className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pipeline</span>
            </button>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Proposal / Quote</span>
          </button>
        </div>
      </div>

      {/* 2. Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Pipeline Value */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Total Pipeline Value</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-heading text-gray-900">
              ₹{metrics.totalPipelineValue.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                {metrics.activeCount} Active Deals Pitched
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Number of Prospects */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Total Number of Prospects</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-heading text-purple-900">
              {metrics.totalCount}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full">
                {metrics.sentToClientCount} Sent · {metrics.underReviewCount} Under Review
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Won Proposals */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Won Proposals</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-heading text-emerald-800">
              ₹{metrics.wonValue.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                {metrics.wonCount} Accepted Proposal{metrics.wonCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Win Conversion Rate */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Win Conversion Rate</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-heading text-blue-900">
              {metrics.winRate}%
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                {metrics.wonCount} Won · {metrics.lostCount} Declined
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Filter & Search Controls */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search prospective client, pitched services, or contact person..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Statuses ({proposals.length})</option>
            <option value="Sent to Client">Sent to Client</option>
            <option value="Under Review">Under Review</option>
            <option value="Accepted">Accepted</option>
            <option value="Declined">Declined</option>
          </select>

          {/* Billing Entity Filter */}
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value as any)}
            className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Entities</option>
            <option value="COMPANY">Company</option>
            <option value="PERSONAL">Personal</option>
          </select>

          {/* Project / Billing Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="ALL">All Billing Types</option>
            <option value="One-Time Project">One-Time Project</option>
            <option value="Monthly Retainer">Monthly Retainer</option>
            <option value="Milestone-Based">Milestone-Based</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="value_desc">Highest Value</option>
            <option value="value_asc">Lowest Value</option>
            <option value="prob_desc">Highest Win Probability</option>
            <option value="date_desc">Expected Close Date</option>
          </select>
        </div>
      </div>

      {/* 5. Main Content: Table or Kanban View */}
      {viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 whitespace-nowrap">Date</th>
                  <th className="py-3 px-4">Prospective Client</th>
                  <th className="py-3 px-4">Pitched Services & Scope</th>
                  <th className="py-3 px-4 whitespace-nowrap">Tentative Value & Type</th>
                  <th className="py-3 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProposals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-500">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2 text-gray-400">
                        <FileText className="w-6 h-6" />
                      </div>
                      <p className="font-semibold text-gray-700 text-sm">No proposals match your filters</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Try modifying search keywords or create a new quote.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredProposals.map((item) => {
                    const statusMeta = STATUS_CONFIG[item.status] || STATUS_CONFIG['Sent to Client'];

                    return (
                      <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                        {/* 1. Date */}
                        <td className="py-3.5 px-4 text-gray-700 whitespace-nowrap text-xs font-semibold">
                          {formatDateDMY(item.sentDate)}
                        </td>

                        {/* 2. Client & Entity */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-bold text-gray-900 text-sm">{item.clientName}</div>
                          <div className="mt-1">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                item.billingEntity === 'COMPANY'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-purple-50 text-purple-700 border-purple-200'
                              }`}
                            >
                              {item.billingEntity === 'COMPANY' ? 'Company' : 'Personal'}
                            </span>
                          </div>
                        </td>

                        {/* 3. Pitched Services & Scope */}
                        <td className="py-3.5 px-4 max-w-sm">
                          <div
                            className="font-semibold text-gray-900 truncate flex items-center gap-1.5"
                            title={item.serviceTitle}
                          >
                            <span className="truncate">{item.serviceTitle}</span>
                            {item.quotationNumber && (
                              <span className="text-[10px] text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded font-mono shrink-0">
                                {item.quotationNumber}
                              </span>
                            )}
                          </div>
                          <p
                            className="text-gray-500 text-[11px] line-clamp-2 mt-0.5 leading-relaxed"
                            title={item.serviceDescription}
                          >
                            {item.serviceDescription}
                          </p>
                        </td>

                        {/* 4. Tentative Value & Type */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                            <span>
                              {getCurrencySymbol(item.currency)} {item.tentativeValue.toLocaleString(getCurrencyLocale(item.currency))}
                            </span>
                            {item.currency && item.currency !== 'INR' && (
                              <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200 font-mono font-bold">
                                {item.currency}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded mt-0.5 inline-block">
                            {item.billingType}
                          </span>
                        </td>

                        {/* 5. Status with quick changer */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <select
                            value={item.status}
                            onChange={(e) => handleQuickStatusChange(item.id, e.target.value as ProposalStatus)}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500 ${statusMeta.badgeClass}`}
                          >
                            <option value="Sent to Client">Sent to Client</option>
                            <option value="Under Review">Under Review</option>
                            <option value="Accepted">Accepted</option>
                            <option value="Declined">Declined</option>
                          </select>
                        </td>

                        {/* 6. Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                              title="Edit Proposal Details"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteProposal(item.id, item.clientName)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              title="Delete Proposal"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
      ) : (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(['Sent to Client', 'Under Review', 'Accepted', 'Declined'] as ProposalStatus[]).map((stage) => {
            const stageDeals = filteredProposals.filter((p) => p.status === stage);
            const stageTotal = stageDeals.reduce((sum, p) => sum + p.tentativeValue, 0);
            const stageWeighted = Math.round(
              stageDeals.reduce((sum, p) => sum + (p.tentativeValue * p.probability) / 100, 0)
            );
            const meta = STATUS_CONFIG[stage];

            return (
              <div
                key={stage}
                className="bg-gray-50/70 rounded-xl border border-gray-200 p-3.5 flex flex-col min-h-[500px]"
              >
                {/* Column Header */}
                <div className="pb-3 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <span className="font-heading font-bold text-gray-900 text-xs flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${meta.badgeClass.split(' ')[0]}`}></span>
                      {meta.label}
                    </span>
                    <span className="text-[11px] text-gray-500 font-medium block mt-0.5">
                      ₹{stageTotal.toLocaleString()} ({stageDeals.length})
                    </span>
                  </div>
                  <span className="text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-100 font-semibold px-2 py-0.5 rounded">
                    ₹{stageWeighted.toLocaleString()} wtd
                  </span>
                </div>

                {/* Cards List */}
                <div className="space-y-3 mt-3 flex-1 overflow-y-auto">
                  {stageDeals.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 text-xs border border-dashed border-gray-200 rounded-lg">
                      No proposals in this stage
                    </div>
                  ) : (
                    stageDeals.map((deal) => (
                      <div
                        key={deal.id}
                        className="bg-white p-3.5 rounded-lg border border-gray-200 hover:border-indigo-300 shadow-2xs hover:shadow-xs transition-all space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-gray-900 text-xs">{deal.clientName}</h4>
                            <span
                              className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border inline-block mt-1 ${
                                deal.billingEntity === 'COMPANY'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : 'bg-purple-50 text-purple-700 border-purple-200'
                              }`}
                            >
                              {deal.billingEntity === 'COMPANY' ? 'Company' : 'Personal'}
                            </span>
                          </div>
                          <span className="text-[10px] font-semibold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">
                            {deal.billingType === 'Monthly Retainer' ? 'Retainer' : 'Project'}
                          </span>
                        </div>

                        <div>
                          <div className="text-xs font-semibold text-gray-800 line-clamp-1">
                            {deal.serviceTitle}
                          </div>
                          <p className="text-[11px] text-gray-500 line-clamp-2 mt-0.5 leading-snug">
                            {deal.serviceDescription}
                          </p>
                        </div>

                        {/* Value */}
                        <div className="p-2 bg-gray-50 rounded-lg flex items-center justify-between text-xs">
                          <span className="text-[10px] text-gray-500 font-medium">Tentative Value</span>
                          <span className="font-bold text-gray-900 text-sm flex items-center gap-1">
                            {getCurrencySymbol(deal.currency)} {deal.tentativeValue.toLocaleString(getCurrencyLocale(deal.currency))}
                            {deal.currency && deal.currency !== 'INR' && (
                              <span className="text-[9px] text-purple-700 bg-purple-50 px-1 py-0.2 rounded border border-purple-200 font-mono">
                                {deal.currency}
                              </span>
                            )}
                          </span>
                        </div>

                        {/* Card Footer: Status Action Buttons */}
                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px]">
                          <span className="text-gray-400 text-[10px]">
                            Sent: {formatDateDMY(deal.sentDate)}
                          </span>

                          <div className="flex items-center gap-1">
                            {stage === 'Sent to Client' && (
                              <button
                                onClick={() => handleQuickStatusChange(deal.id, 'Under Review')}
                                className="px-2 py-0.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded font-semibold text-[10px]"
                                title="Move to Under Review"
                              >
                                Review
                              </button>
                            )}
                            {stage === 'Under Review' && (
                              <>
                                <button
                                  onClick={() => handleQuickStatusChange(deal.id, 'Accepted')}
                                  className="px-2 py-0.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded font-semibold text-[10px]"
                                  title="Mark as Accepted / Won"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleQuickStatusChange(deal.id, 'Declined')}
                                  className="px-2 py-0.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded font-semibold text-[10px]"
                                  title="Mark as Declined"
                                >
                                  Decline
                                </button>
                              </>
                            )}
                            {stage === 'Declined' && (
                              <button
                                onClick={() => handleQuickStatusChange(deal.id, 'Under Review')}
                                className="px-2 py-0.5 bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 rounded font-semibold text-[10px]"
                                title="Reopen Quote"
                              >
                                Reopen
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenEditModal(deal)}
                              className="p-1 text-gray-400 hover:text-gray-700 rounded"
                              title="Edit"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. CREATE / EDIT PROPOSAL MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-gray-200 overflow-hidden animate-fade-in my-8">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-gray-900 text-base">
                    {editingProposal ? `Edit Proposal: ${editingProposal.clientName}` : 'Log New Proposal / Quote'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Save prospective client, pitched service scope, tentative value, and status.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form - Streamlined & Uncluttered */}
            <form onSubmit={handleSaveProposal} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Row 1: Client Name, Proposal Date & Billing Entity */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Prospective Client Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nexus Retail Dynamics"
                    value={formState.clientName || ''}
                    onChange={(e) => setFormState({ ...formState, clientName: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Proposal Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formState.sentDate || ''}
                    onChange={(e) => setFormState({ ...formState, sentDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                  />
                  <div className="text-[11px] text-indigo-600 font-semibold mt-1">
                    {formatDateDMY(formState.sentDate)}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Billing Entity <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormState({ ...formState, billingEntity: 'COMPANY' })}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                        formState.billingEntity === 'COMPANY'
                          ? 'bg-blue-50 text-blue-700 border-blue-300'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Company</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormState({ ...formState, billingEntity: 'PERSONAL' })}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                        formState.billingEntity === 'PERSONAL'
                          ? 'bg-purple-50 text-purple-700 border-purple-300'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span>Personal</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 2: Type of Services Pitched (Title) */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Type of Services Pitched <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Omnichannel D2C Storefront & Performance Marketing"
                  value={formState.serviceTitle || ''}
                  onChange={(e) => setFormState({ ...formState, serviceTitle: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                />
              </div>

              {/* Row 3: Scope of Services Description */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Scope of Services Pitched (Description) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detail the scope of services, deliverables, milestones, or SLA terms presented in the proposal..."
                  value={formState.serviceDescription || ''}
                  onChange={(e) => setFormState({ ...formState, serviceDescription: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed font-sans"
                />
              </div>

              {/* Row 4: Tentative Value, Billing Arrangement & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Tentative Value (₹) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">₹</span>
                    <input
                      type="number"
                      required
                      min={1000}
                      step={1000}
                      placeholder="e.g. 250000"
                      value={formState.tentativeValue || ''}
                      onChange={(e) => setFormState({ ...formState, tentativeValue: Number(e.target.value) })}
                      className="w-full pl-8 pr-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Billing Arrangement</label>
                  <select
                    value={formState.billingType || 'One-Time Project'}
                    onChange={(e) => setFormState({ ...formState, billingType: e.target.value as BillingType })}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                  >
                    <option value="One-Time Project">One-Time Project</option>
                    <option value="Monthly Retainer">Monthly Retainer</option>
                    <option value="Milestone-Based">Milestone-Based</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Current Status</label>
                  <select
                    value={formState.status || 'Sent to Client'}
                    onChange={(e) => {
                      const newSt = e.target.value as ProposalStatus;
                      setFormState({
                        ...formState,
                        status: newSt,
                        probability:
                          newSt === 'Accepted'
                            ? 100
                            : newSt === 'Declined'
                            ? 0
                            : newSt === 'Under Review'
                            ? 70
                            : 50,
                      });
                    }}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                  >
                    <option value="Sent to Client">Sent to Client</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Declined">Declined</option>
                  </select>
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
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg font-semibold text-xs transition-colors shadow-2xs"
                >
                  {editingProposal ? 'Save Changes' : 'Add to Pipeline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProposalsList;
