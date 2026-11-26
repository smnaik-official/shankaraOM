import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Download,
  Search,
  Trash2,
  Edit,
  Copy,
  FileText,
  Building,
  CheckCircle2,
  Sparkles,
  Layers,
  ChevronRight,
  ChevronLeft,
  X,
  Calendar,
} from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import {
  Quotation,
  ProposalPillar,
  ScopePhase,
  ProposalDeliverable,
  CommercialItem,
  sampleStelaarcQuotation,
  sampleEcommerceQuotation,
  getStoredQuotations,
  saveStoredQuotations,
  syncQuotationToProposal,
  getNextQuotationNumber,
  SUPPORTED_CURRENCIES,
  getCurrencySymbol,
  getCurrencyLocale,
  CurrencyCode,
} from '../data/quotations';
import { formatDateDDMMYYYY } from '../utils/date';
import { QuotationPDF } from './QuotationPDF';

export const Quotations: React.FC = () => {
  const [quotations, setQuotations] = useState<Quotation[]>(() => getStoredQuotations());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'client' | 'objectives' | 'scope' | 'commercials' | 'terms'>('client');
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);

  // Save to localStorage when state changes
  useEffect(() => {
    saveStoredQuotations(quotations);
  }, [quotations]);

  // Generate next quotation number in QUO/0001/2026-27 format
  const generateNextQuotationNumber = () => {
    return getNextQuotationNumber(quotations);
  };

  // Open modal for new quotation
  const handleCreateNew = () => {
    const blank: Quotation = {
      id: `QUO-${Date.now()}`,
      quotationNumber: generateNextQuotationNumber(),
      date: new Date().toISOString().split('T')[0],
      currency: 'INR',
      clientName: '',
      clientCity: 'Bengaluru',
      attention: '',
      subject: '',
      brandName: '',
      salutation: 'Dear Sir,',
      introText:
        'This is regarding our discussion regarding the requirement of branding, website development, and digital growth services for your business.\n\nOur engagement is structured to build commercial credibility, technical capability, and direct enquiry conversion.',
      objectiveHeading: '1. Understanding the Brand & Objective',
      objectiveIntro:
        'The immediate commercial opportunity is to translate your domain expertise into a credible brand presence and dependable lead-generation engine.',
      includePillars: true,
      pillars: [
        {
          id: 'p1',
          title: 'CREDIBILITY',
          description: 'Establish your brand as an experienced and trusted market leader through cohesive branding.',
        },
        {
          id: 'p2',
          title: 'CAPABILITY',
          description: 'Showcase craftsmanship, technical capabilities, and project portfolio across digital touchpoints.',
        },
        {
          id: 'p3',
          title: 'CONVERSION',
          description: 'Architect seamless digital enquiry flows and high-intent conversion pathways.',
        },
      ],
      includePhilosophy: true,
      philosophyTitle: '2. Brand Marketing Philosophy',
      philosophyPoints: [
        'Design should make the brand look established and benchmark in its industry.',
        'Content should demonstrate concrete work quality and domain authority.',
        'Marketing actions must be measured against qualified inquiries and pipeline growth.',
      ],
      scopeHeading: '3. Scope of Work',
      scopePhases: [
        {
          id: `phase-${Date.now()}-1`,
          phaseTitle: 'Phase 1: Brand & Digital Foundation',
          deliverables: [
            {
              id: `del-${Date.now()}-1`,
              title: 'Corporate Website & Digital Assets',
              subtitle: 'Design and develop responsive, SEO-ready corporate web showcase.',
              indicativeDeliverables: 'Responsive website layout, enquiry forms, on-page SEO, speed optimization.',
            },
          ],
        },
      ],
      commercialHeading: '4. Commercial Proposal',
      commercialItems: [
        {
          id: `c-${Date.now()}-1`,
          service: 'Corporate Website Design & Development',
          investment: 45000,
          billing: 'One-time',
          taxNote: '+ 18% GST',
        },
      ],
      pricingNotesHeading: 'Pricing Notes & Exclusions (e.g. Ad Spend, GST, Domains)',
      pricingNotes:
        'Note: Third-party domain, hosting, email, paid plugins, and paid advertising budgets are funded directly by the client. Taxes extra as applicable.',
      clientInputsHeading: 'Client Inputs Required (Prerequisites)',
      clientInputsRequired:
        'High-resolution logos, brand guidelines, content/service copy, product imagery, and access credentials where necessary.',
      termsHeading: '5. Engagement Terms and Service Exclusions',
      terms: [
        {
          title: 'Payment Terms',
          detail: '50% advance to initiate work; 50% upon milestone completion and final deployment.',
        },
        {
          title: 'Revisions',
          detail: 'Reasonable revisions included within approved scope. Major architectural shifts estimated separately.',
        },
        {
          title: 'Third-party costs',
          detail: 'Excluded from service fees unless explicitly detailed.',
        },
      ],
      additionalExclusions: [
        'Paid media spends and influencer fees are separate from professional service retainers.',
      ],
      closingNote:
        'We look forward to an impactful, long-term commercial engagement. Please reach out with any clarifications or questions.',
      thankYouNote: 'Thank you for your trust in our services.',
      signatoryName: 'Manjunath Naik S',
      signatoryDesignation: 'Founder & CEO',
      signatoryPhone: '+91-9986703161',
      signatoryEmail: 'naik@shankaraonline.com',
      signatoryWebsite: 'www.shankaraonline.com',
      totalTentativeValue: 45000,
      status: 'Draft',
      updatedAt: new Date().toISOString().split('T')[0],
    };

    setEditingQuotation(blank);
    setActiveTab('client');
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleEdit = (q: Quotation) => {
    setEditingQuotation(JSON.parse(JSON.stringify(q)));
    setActiveTab('client');
    setIsModalOpen(true);
  };

  // Duplicate proposal
  const handleDuplicate = (q: Quotation) => {
    const clone: Quotation = {
      ...JSON.parse(JSON.stringify(q)),
      id: `QUO-${Date.now()}`,
      quotationNumber: generateNextQuotationNumber(),
      clientName: `${q.clientName} (Copy)`,
      status: 'Draft',
      date: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setQuotations([clone, ...quotations]);
  };

  // Delete proposal
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this commercial quotation?')) {
      setQuotations(quotations.filter((q) => q.id !== id));
    }
  };

  // Save current edited quotation
  const handleSaveQuotation = () => {
    if (!editingQuotation) return;

    // Recalculate total value
    const totalVal = editingQuotation.commercialItems.reduce(
      (sum, item) => sum + (Number(item.investment) || 0),
      0
    );

    const updated: Quotation = {
      ...editingQuotation,
      totalTentativeValue: totalVal,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    const exists = quotations.some((q) => q.id === updated.id);
    if (exists) {
      setQuotations(quotations.map((q) => (q.id === updated.id ? updated : q)));
    } else {
      setQuotations([updated, ...quotations]);
    }

    if (updated.status === 'Sent to Client') {
      syncQuotationToProposal(updated);
      showToast(
        `Quotation #${updated.quotationNumber} marked as 'Sent to Client' and reflected in Prospects!`
      );
    } else {
      showToast(`Quotation #${updated.quotationNumber} saved as Draft.`);
    }

    setIsModalOpen(false);
    setEditingQuotation(null);
  };

  const handleStatusChange = (q: Quotation, newStatus: 'Draft' | 'Sent to Client') => {
    const updated: Quotation = {
      ...q,
      status: newStatus,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setQuotations(quotations.map((item) => (item.id === q.id ? updated : item)));
    if (newStatus === 'Sent to Client') {
      syncQuotationToProposal(updated);
      showToast(
        `Quotation #${q.quotationNumber} marked as 'Sent to Client' and reflected in Prospects!`
      );
    } else {
      showToast(`Quotation #${q.quotationNumber} updated to Draft.`);
    }
  };

  // Quick Preset Loader inside modal
  const handleLoadPreset = (preset: 'stelaarc' | 'ecommerce') => {
    if (!window.confirm('Load preset template? Any unsaved edits in this modal will be overwritten.')) return;
    const base = preset === 'stelaarc' ? sampleStelaarcQuotation : sampleEcommerceQuotation;
    const loaded: Quotation = {
      ...JSON.parse(JSON.stringify(base)),
      id: editingQuotation ? editingQuotation.id : `QUO-${Date.now()}`,
      quotationNumber: editingQuotation?.quotationNumber || generateNextQuotationNumber(),
      date: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setEditingQuotation(loaded);
  };

  // Filtered quotations
  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      const matchesSearch =
        q.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.brandName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'All' || q.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [quotations, searchQuery, statusFilter]);

  // Pipeline Metrics
  const metrics = useMemo(() => {
    const totalCount = quotations.length;
    const sentQuotations = quotations.filter((q) => q.status === 'Sent to Client');
    const sentCount = sentQuotations.length;
    const sentValue = sentQuotations.reduce(
      (sum, q) => sum + (q.totalTentativeValue || 0),
      0
    );
    const draftQuotations = quotations.filter((q) => q.status === 'Draft');
    const draftCount = draftQuotations.length;
    const draftValue = draftQuotations.reduce(
      (sum, q) => sum + (q.totalTentativeValue || 0),
      0
    );
    const totalValue = quotations.reduce(
      (sum, q) => sum + (q.totalTentativeValue || 0),
      0
    );

    return {
      totalCount,
      sentCount,
      sentValue,
      draftCount,
      draftValue,
      totalValue,
    };
  }, [quotations]);

  // Helper for Status Badge styling
  const getStatusBadge = (status: Quotation['status']) => {
    switch (status) {
      case 'Sent to Client':
        return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
      case 'Draft':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100';
    }
  };

  // ---------------- Sub-component Editors ---------------- //

  // 1. Pillar management
  const updatePillar = (id: string, field: keyof ProposalPillar, value: string) => {
    if (!editingQuotation) return;
    const nextPillars = editingQuotation.pillars.map((p) =>
      p.id === id ? { ...p, [field]: value } : p
    );
    setEditingQuotation({ ...editingQuotation, pillars: nextPillars });
  };

  const addPillar = () => {
    if (!editingQuotation) return;
    const newPillar: ProposalPillar = {
      id: `p-${Date.now()}`,
      title: 'STRATEGY',
      description: 'Detail the strategic objective or pillar focus for this proposal.',
    };
    setEditingQuotation({
      ...editingQuotation,
      pillars: [...editingQuotation.pillars, newPillar],
    });
  };

  const removePillar = (id: string) => {
    if (!editingQuotation) return;
    setEditingQuotation({
      ...editingQuotation,
      pillars: editingQuotation.pillars.filter((p) => p.id !== id),
    });
  };

  // 2. Philosophy points management
  const addPhilosophyPoint = () => {
    if (!editingQuotation) return;
    setEditingQuotation({
      ...editingQuotation,
      philosophyPoints: [
        ...editingQuotation.philosophyPoints,
        'Enter new marketing philosophy guideline...',
      ],
    });
  };

  const updatePhilosophyPoint = (idx: number, value: string) => {
    if (!editingQuotation) return;
    const updated = [...editingQuotation.philosophyPoints];
    updated[idx] = value;
    setEditingQuotation({ ...editingQuotation, philosophyPoints: updated });
  };

  const removePhilosophyPoint = (idx: number) => {
    if (!editingQuotation) return;
    setEditingQuotation({
      ...editingQuotation,
      philosophyPoints: editingQuotation.philosophyPoints.filter((_, i) => i !== idx),
    });
  };

  // 3. Scope Phases management
  const addPhase = () => {
    if (!editingQuotation) return;
    const newPhase: ScopePhase = {
      id: `phase-${Date.now()}`,
      phaseTitle: `Phase ${editingQuotation.scopePhases.length + 1}: Custom Milestone`,
      deliverables: [
        {
          id: `del-${Date.now()}`,
          title: 'Scope Deliverable',
          subtitle: 'Detailed description of tasks and outcomes included in this deliverable.',
          indicativeDeliverables: 'Assets, documentation, code repositories, or reports handed over.',
        },
      ],
    };
    setEditingQuotation({
      ...editingQuotation,
      scopePhases: [...editingQuotation.scopePhases, newPhase],
    });
  };

  const updatePhaseTitle = (phaseId: string, title: string) => {
    if (!editingQuotation) return;
    const nextPhases = editingQuotation.scopePhases.map((phase) =>
      phase.id === phaseId ? { ...phase, phaseTitle: title } : phase
    );
    setEditingQuotation({ ...editingQuotation, scopePhases: nextPhases });
  };

  const removePhase = (phaseId: string) => {
    if (!editingQuotation) return;
    setEditingQuotation({
      ...editingQuotation,
      scopePhases: editingQuotation.scopePhases.filter((p) => p.id !== phaseId),
    });
  };

  const addDeliverable = (phaseId: string) => {
    if (!editingQuotation) return;
    const nextPhases = editingQuotation.scopePhases.map((phase) => {
      if (phase.id === phaseId) {
        const newDel: ProposalDeliverable = {
          id: `del-${Date.now()}`,
          title: 'New Key Deliverable',
          subtitle: 'Description of scope or technical implementation.',
          indicativeDeliverables: 'Deliverable artifacts and formats.',
        };
        return { ...phase, deliverables: [...phase.deliverables, newDel] };
      }
      return phase;
    });
    setEditingQuotation({ ...editingQuotation, scopePhases: nextPhases });
  };

  const updateDeliverable = (
    phaseId: string,
    delId: string,
    field: keyof ProposalDeliverable,
    val: unknown
  ) => {
    if (!editingQuotation) return;
    const nextPhases = editingQuotation.scopePhases.map((phase) => {
      if (phase.id === phaseId) {
        const nextDels = phase.deliverables.map((del) =>
          del.id === delId ? { ...del, [field]: val } : del
        );
        return { ...phase, deliverables: nextDels };
      }
      return phase;
    });
    setEditingQuotation({ ...editingQuotation, scopePhases: nextPhases });
  };

  const removeDeliverable = (phaseId: string, delId: string) => {
    if (!editingQuotation) return;
    const nextPhases = editingQuotation.scopePhases.map((phase) => {
      if (phase.id === phaseId) {
        return {
          ...phase,
          deliverables: phase.deliverables.filter((d) => d.id !== delId),
        };
      }
      return phase;
    });
    setEditingQuotation({ ...editingQuotation, scopePhases: nextPhases });
  };

  // 4. Commercial items management
  const addCommercialItem = () => {
    if (!editingQuotation) return;
    const newItem: CommercialItem = {
      id: `c-${Date.now()}`,
      service: 'Professional Service / Milestone Deliverable',
      investment: 25000,
      billing: 'One-time',
      taxNote: '+ 18% GST',
    };
    const nextItems = [...editingQuotation.commercialItems, newItem];
    const newTotal = nextItems.reduce((acc, i) => acc + (Number(i.investment) || 0), 0);
    setEditingQuotation({
      ...editingQuotation,
      commercialItems: nextItems,
      totalTentativeValue: newTotal,
    });
  };

  const updateCommercialItem = (
    id: string,
    field: keyof CommercialItem,
    val: string | number
  ) => {
    if (!editingQuotation) return;
    const nextItems = editingQuotation.commercialItems.map((item) =>
      item.id === id ? { ...item, [field]: val } : item
    );
    const newTotal = nextItems.reduce((acc, i) => acc + (Number(i.investment) || 0), 0);
    setEditingQuotation({
      ...editingQuotation,
      commercialItems: nextItems,
      totalTentativeValue: newTotal,
    });
  };

  const removeCommercialItem = (id: string) => {
    if (!editingQuotation) return;
    const nextItems = editingQuotation.commercialItems.filter((i) => i.id !== id);
    const newTotal = nextItems.reduce((acc, i) => acc + (Number(i.investment) || 0), 0);
    setEditingQuotation({
      ...editingQuotation,
      commercialItems: nextItems,
      totalTentativeValue: newTotal,
    });
  };

  // 5. Terms management
  const addTerm = () => {
    if (!editingQuotation) return;
    setEditingQuotation({
      ...editingQuotation,
      terms: [
        ...editingQuotation.terms,
        { title: 'New Condition', detail: 'Specify the agreement or milestone term here.' },
      ],
    });
  };

  const updateTerm = (idx: number, field: 'title' | 'detail', val: string) => {
    if (!editingQuotation) return;
    const nextTerms = [...editingQuotation.terms];
    nextTerms[idx] = { ...nextTerms[idx], [field]: val };
    setEditingQuotation({ ...editingQuotation, terms: nextTerms });
  };

  const removeTerm = (idx: number) => {
    if (!editingQuotation) return;
    setEditingQuotation({
      ...editingQuotation,
      terms: editingQuotation.terms.filter((_, i) => i !== idx),
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-heading font-bold text-gray-900">Quotations</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
              Commercial Proposals & Pitch Decks
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Draft, customize, and export high-conversion commercial proposals on your official letterhead.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleCreateNew()}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs hover:shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Draft Quotation</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by client, brand, or quotation number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:bg-white transition-all"
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

        {/* Status Filter Tabs with Counts */}
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
          {[
            { label: 'All', value: 'All', count: metrics.totalCount },
            { label: 'Draft', value: 'Draft', count: metrics.draftCount },
            { label: 'Sent to Client', value: 'Sent to Client', count: metrics.sentCount },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === opt.value
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>{opt.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  statusFilter === opt.value
                    ? 'bg-purple-700 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {opt.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Quotations List Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/90 text-[11px] uppercase font-bold text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3.5">Quotation # & Date</th>
                <th className="px-6 py-3.5">Client & Brand</th>
                <th className="px-6 py-3.5 text-right">Investment (₹)</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredQuotations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    <FileText className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <p className="text-base font-medium text-gray-600">No commercial quotations found</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {searchQuery
                        ? 'Try adjusting your search terms or filter criteria.'
                        : 'Click "Draft Quotation" to create your first branded proposal.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredQuotations.map((q) => (
                  <tr key={q.id} className="hover:bg-purple-50/30 transition-colors">
                    {/* Quotation # & Date */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleEdit(q)}
                        className="font-bold text-purple-900 hover:text-purple-700 text-sm hover:underline text-left block"
                        title="Click to view & edit quotation"
                      >
                        {q.quotationNumber}
                      </button>
                      <div className="text-xs text-gray-400 flex items-center gap-1.5 mt-1 font-medium">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span>{formatDateDDMMYYYY(q.date)}</span>
                      </div>
                    </td>

                    {/* Client & Brand */}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900 text-sm">{q.clientName}</div>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {q.brandName && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-bold rounded-md border border-purple-200">
                            <Sparkles className="w-2.5 h-2.5 text-purple-500" />
                            {q.brandName}
                          </span>
                        )}
                        {q.attention && (
                          <span className="text-xs text-gray-500 font-medium">
                            Attn: {q.attention}
                          </span>
                        )}
                        {q.clientCity && (
                          <span className="text-xs text-gray-400 font-normal">
                            • {q.clientCity}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Investment Value */}
                    <td className="px-6 py-4 text-right">
                      <div className="font-bold font-heading text-gray-900 text-base flex items-center justify-end gap-1.5">
                        <span>
                          {getCurrencySymbol(q.currency)} {q.totalTentativeValue.toLocaleString(getCurrencyLocale(q.currency))}
                        </span>
                        {q.currency && q.currency !== 'INR' && (
                          <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 font-mono font-bold">
                            {q.currency}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400 font-medium mt-0.5">
                        {q.commercialItems && q.commercialItems.length > 0
                          ? `${q.commercialItems.length} deliverable${q.commercialItems.length !== 1 ? 's' : ''}`
                          : '+ Taxes applicable'}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 text-center">
                      <select
                        value={q.status}
                        onChange={(e) =>
                          handleStatusChange(
                            q,
                            e.target.value as 'Draft' | 'Sent to Client'
                          )
                        }
                        className={`text-xs font-semibold px-3 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all ${getStatusBadge(
                          q.status
                        )}`}
                        title="Click to toggle status between Draft and Sent to Client"
                      >
                        <option value="Draft">Draft</option>
                        <option value="Sent to Client">Sent to Client</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Download PDF Button */}
                        <PDFDownloadLink
                          document={<QuotationPDF quotation={q} />}
                          fileName={`${q.quotationNumber.replace(/[\/\\]/g, '_')}_Commercial_Proposal.pdf`}
                          className="p-1.5 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors border border-transparent hover:border-purple-200"
                          title="Download Letterhead PDF"
                        >
                          {/* @ts-expect-error: react-pdf types */}
                          {({ loading }: { loading: boolean }) => (
                            <Download
                              className={`w-4 h-4 ${loading ? 'animate-pulse text-gray-400' : ''}`}
                            />
                          )}
                        </PDFDownloadLink>

                        {/* Edit Button */}
                        <button
                          onClick={() => handleEdit(q)}
                          className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200"
                          title="Edit Proposal Details"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* Duplicate Button */}
                        <button
                          onClick={() => handleDuplicate(q)}
                          className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-200"
                          title="Duplicate / Clone Proposal"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(q.id)}
                          className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                          title="Delete Proposal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        {filteredQuotations.length > 0 && (
          <div className="px-6 py-3 bg-gray-50/60 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
            <div>
              Showing <span className="font-semibold text-gray-700">{filteredQuotations.length}</span> of{' '}
              <span className="font-semibold text-gray-700">{quotations.length}</span> quotation{quotations.length !== 1 ? 's' : ''}
            </div>
            <div className="font-medium">
              Total Filtered Investment:{' '}
              <span className="font-bold font-heading text-purple-900 text-sm ml-1">
                ₹ {filteredQuotations.reduce((sum, q) => sum + (q.totalTentativeValue || 0), 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* FULL-FEATURED DRAFTING & EDITING PROPOSAL BUILDER MODAL   */}
      {/* ========================================================= */}
      {isModalOpen && editingQuotation && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-gray-100">
            {/* Modal Header */}
            <div className="px-6 py-3 bg-purple-700 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-800/80 rounded-lg flex items-center justify-center text-purple-200">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold leading-tight">
                    {editingQuotation.clientName
                      ? `Proposal for ${editingQuotation.clientName}`
                      : 'Draft Commercial Proposal'}
                  </h3>
                  <p className="text-[11px] text-purple-200 leading-normal">
                    {editingQuotation.quotationNumber} • Multi-Page Branded Quotation
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleLoadPreset('stelaarc')}
                  className="px-2.5 py-1 text-xs bg-purple-600/90 hover:bg-purple-500 text-white font-medium rounded-lg transition"
                  title="Load the 4-page reference STELAARC website & marketing proposal"
                >
                  Load STELAARC Sample
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadPreset('ecommerce')}
                  className="px-2.5 py-1 text-xs bg-purple-600/90 hover:bg-purple-500 text-white font-medium rounded-lg transition"
                  title="Load modern D2C e-commerce storefront proposal"
                >
                  Load D2C Sample
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 text-purple-200 hover:text-white rounded-lg hover:bg-purple-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Stepped Tab Navigation (height-adjusted with scrollbars hidden) */}
            <div
              className="px-6 py-1.5 bg-gray-50 border-b border-gray-200 flex items-center gap-1.5 overflow-x-auto overflow-y-hidden text-xs font-semibold shrink-0"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <button
                onClick={() => setActiveTab('client')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'client'
                    ? 'bg-purple-100 text-purple-700 shadow-2xs font-bold'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                Client & Header
              </button>
              <button
                onClick={() => setActiveTab('objectives')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'objectives'
                    ? 'bg-purple-100 text-purple-700 shadow-2xs font-bold'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                1. Business Objectives
              </button>
              <button
                onClick={() => setActiveTab('scope')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'scope'
                    ? 'bg-purple-100 text-purple-700 shadow-2xs font-bold'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                2. Scope of Work ({editingQuotation.scopePhases.length} Phases)
              </button>
              <button
                onClick={() => setActiveTab('commercials')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'commercials'
                    ? 'bg-purple-100 text-purple-700 shadow-2xs font-bold'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="font-bold">{getCurrencySymbol(editingQuotation.currency)}</span>
                3. Commercials ({getCurrencySymbol(editingQuotation.currency)}{editingQuotation.totalTentativeValue.toLocaleString(getCurrencyLocale(editingQuotation.currency))})
              </button>
              <button
                onClick={() => setActiveTab('terms')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                  activeTab === 'terms'
                    ? 'bg-purple-100 text-purple-700 shadow-2xs font-bold'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                4. Terms & Signoff
              </button>
            </div>

            {/* Modal Body: Scrollable Form by Tab */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* TAB 1: CLIENT & HEADER */}
              {activeTab === 'client' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                        Quotation Number *
                      </label>
                      <input
                        type="text"
                        value={editingQuotation.quotationNumber}
                        onChange={(e) =>
                          setEditingQuotation({
                            ...editingQuotation,
                            quotationNumber: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                        Proposal Date *
                      </label>
                      <input
                        type="date"
                        value={editingQuotation.date}
                        onChange={(e) =>
                          setEditingQuotation({
                            ...editingQuotation,
                            date: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                      />
                      <div className="text-[11px] text-purple-700 font-semibold mt-1">
                        {formatDateDDMMYYYY(editingQuotation.date)}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1 flex items-center justify-between">
                        <span>Currency *</span>
                        <span className="text-[11px] text-purple-600 font-bold lowercase">({getCurrencySymbol(editingQuotation.currency || 'INR')})</span>
                      </label>
                      <select
                        value={editingQuotation.currency || 'INR'}
                        onChange={(e) =>
                          setEditingQuotation({
                            ...editingQuotation,
                            currency: e.target.value as CurrencyCode,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 font-semibold bg-white cursor-pointer"
                      >
                        {SUPPORTED_CURRENCIES.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                      <div className="text-[11px] text-gray-400 font-medium mt-1">
                        Active: <strong className="text-purple-700 font-bold">{editingQuotation.currency || 'INR'}</strong>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                        Status
                      </label>
                      <select
                        value={editingQuotation.status}
                        onChange={(e) =>
                          setEditingQuotation({
                            ...editingQuotation,
                            status: e.target.value as 'Draft' | 'Sent to Client',
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 font-medium"
                      >
                        <option value="Draft">Draft</option>
                        <option value="Sent to Client">Sent to Client</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                        Client Legal Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. M/s Anugraha Technocrats"
                        value={editingQuotation.clientName}
                        onChange={(e) =>
                          setEditingQuotation({
                            ...editingQuotation,
                            clientName: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                        Client City / Location
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Bengaluru"
                        value={editingQuotation.clientCity}
                        onChange={(e) =>
                          setEditingQuotation({
                            ...editingQuotation,
                            clientCity: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                        Kind Attention (Contact Persons)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Mr. Rinson / Mr. Mathew"
                        value={editingQuotation.attention}
                        onChange={(e) =>
                          setEditingQuotation({
                            ...editingQuotation,
                            attention: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                        Proposal Subject Line *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Commercial Proposal for Designing, Website Development and Digital Marketing Services"
                        value={editingQuotation.subject}
                        onChange={(e) =>
                          setEditingQuotation({
                            ...editingQuotation,
                            subject: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                        Brand Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. STELAARC"
                        value={editingQuotation.brandName}
                        onChange={(e) =>
                          setEditingQuotation({
                            ...editingQuotation,
                            brandName: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Salutation
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dear Sir,"
                      value={editingQuotation.salutation}
                      onChange={(e) =>
                        setEditingQuotation({
                          ...editingQuotation,
                          salutation: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Introductory Paragraph(s)
                    </label>
                    <textarea
                      rows={3}
                      value={editingQuotation.introText}
                      onChange={(e) =>
                        setEditingQuotation({
                          ...editingQuotation,
                          introText: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: BUSINESS OBJECTIVES */}
              {activeTab === 'objectives' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Section 1 Heading
                    </label>
                    <input
                      type="text"
                      value={editingQuotation.objectiveHeading}
                      onChange={(e) =>
                        setEditingQuotation({
                          ...editingQuotation,
                          objectiveHeading: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Objective Context / Narrative
                    </label>
                    <textarea
                      rows={3}
                      value={editingQuotation.objectiveIntro}
                      onChange={(e) =>
                        setEditingQuotation({
                          ...editingQuotation,
                          objectiveIntro: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* 3 Strategic Pillars Grid (Optional) */}
                  <div className="space-y-3 p-4 bg-gray-50/70 rounded-xl border border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="includePillarsCheckbox"
                          checked={editingQuotation.includePillars !== false}
                          onChange={(e) =>
                            setEditingQuotation({
                              ...editingQuotation,
                              includePillars: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500 cursor-pointer"
                        />
                        <label htmlFor="includePillarsCheckbox" className="cursor-pointer">
                          <span className="text-sm font-bold text-gray-900 block">
                            Strategic Pillars (Optional)
                          </span>
                          <span className="text-xs text-gray-500 block">
                            Rendered in 3-column bordered cards on the PDF (e.g. CREDIBILITY, CAPABILITY, CONVERSION)
                          </span>
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                            editingQuotation.includePillars !== false
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {editingQuotation.includePillars !== false ? 'Included' : 'Omitted'}
                        </span>
                        {editingQuotation.includePillars !== false && (
                          <button
                            type="button"
                            onClick={addPillar}
                            className="px-2.5 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition"
                          >
                            + Add Pillar
                          </button>
                        )}
                      </div>
                    </div>

                    {editingQuotation.includePillars !== false ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                        {editingQuotation.pillars.map((pillar) => (
                          <div
                            key={pillar.id}
                            className="p-3 border border-purple-200 rounded-lg bg-white relative space-y-2 shadow-2xs"
                          >
                            <div className="flex items-center justify-between">
                              <input
                                type="text"
                                value={pillar.title}
                                onChange={(e) =>
                                  updatePillar(pillar.id, 'title', e.target.value)
                                }
                                className="font-bold text-xs uppercase px-2 py-1 bg-purple-50 border border-purple-200 rounded text-purple-900 w-3/4"
                                placeholder="PILLAR TITLE"
                              />
                              {editingQuotation.pillars.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removePillar(pillar.id)}
                                  className="text-gray-400 hover:text-rose-500 p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            <textarea
                              rows={3}
                              value={pillar.description}
                              onChange={(e) =>
                                updatePillar(pillar.id, 'description', e.target.value)
                              }
                              className="w-full text-xs p-2 bg-gray-50 border border-gray-200 rounded focus:ring-1 focus:ring-purple-500"
                              placeholder="Detail strategic objectives here..."
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 text-center text-xs text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
                        Strategic Pillars are omitted and will not appear on this quote's PDF.{' '}
                        <button
                          type="button"
                          onClick={() =>
                            setEditingQuotation({ ...editingQuotation, includePillars: true })
                          }
                          className="text-purple-600 font-semibold hover:underline ml-1"
                        >
                          Enable Strategic Pillars
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Brand Marketing Philosophy (Optional) */}
                  <div className="space-y-3 p-4 bg-gray-50/70 rounded-xl border border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="includePhilosophyCheckbox"
                          checked={editingQuotation.includePhilosophy !== false}
                          onChange={(e) =>
                            setEditingQuotation({
                              ...editingQuotation,
                              includePhilosophy: e.target.checked,
                            })
                          }
                          className="w-4 h-4 text-purple-600 rounded border-gray-300 focus:ring-purple-500 cursor-pointer"
                        />
                        <label htmlFor="includePhilosophyCheckbox" className="cursor-pointer">
                          <span className="text-sm font-bold text-gray-900 block">
                            Philosophy & Strategic Principles (Optional)
                          </span>
                          <span className="text-xs text-gray-500 block">
                            Marketing philosophy or strategic guidelines displayed as bullet points on the PDF.
                          </span>
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                            editingQuotation.includePhilosophy !== false
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {editingQuotation.includePhilosophy !== false ? 'Included' : 'Omitted'}
                        </span>
                        {editingQuotation.includePhilosophy !== false && (
                          <button
                            type="button"
                            onClick={addPhilosophyPoint}
                            className="px-2.5 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition"
                          >
                            + Add Bullet Point
                          </button>
                        )}
                      </div>
                    </div>

                    {editingQuotation.includePhilosophy !== false ? (
                      <div className="space-y-3 pt-2">
                        <div>
                          <label className="block text-[11px] font-semibold text-gray-700 uppercase mb-1">
                            Philosophy / Strategy Title
                          </label>
                          <input
                            type="text"
                            value={editingQuotation.philosophyTitle}
                            onChange={(e) =>
                              setEditingQuotation({
                                ...editingQuotation,
                                philosophyTitle: e.target.value,
                              })
                            }
                            className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-medium"
                          />
                        </div>

                        <div className="space-y-2">
                          {editingQuotation.philosophyPoints.map((point, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="w-5 text-center text-purple-600 font-bold">•</span>
                              <input
                                type="text"
                                value={point}
                                onChange={(e) => updatePhilosophyPoint(idx, e.target.value)}
                                className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => removePhilosophyPoint(idx)}
                                className="text-gray-400 hover:text-rose-500 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 text-center text-xs text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
                        Marketing Philosophy points are omitted and will not appear on this quote's PDF.{' '}
                        <button
                          type="button"
                          onClick={() =>
                            setEditingQuotation({ ...editingQuotation, includePhilosophy: true })
                          }
                          className="text-purple-600 font-semibold hover:underline ml-1"
                        >
                          Enable Philosophy Points
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: SCOPE OF WORK */}
              {activeTab === 'scope' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="w-2/3">
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                        Scope Section Heading
                      </label>
                      <input
                        type="text"
                        value={editingQuotation.scopeHeading}
                        onChange={(e) =>
                          setEditingQuotation({
                            ...editingQuotation,
                            scopeHeading: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addPhase}
                      className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Phase</span>
                    </button>
                  </div>

                  {/* Phases List */}
                  <div className="space-y-6">
                    {editingQuotation.scopePhases.map((phase, pIndex) => (
                      <div
                        key={phase.id}
                        className="border border-purple-200 rounded-xl bg-purple-50/20 p-4 space-y-4"
                      >
                        {/* Phase Header */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="w-6 h-6 rounded-full bg-purple-700 text-white text-xs font-bold flex items-center justify-center">
                              {pIndex + 1}
                            </span>
                            <input
                              type="text"
                              value={phase.phaseTitle}
                              onChange={(e) =>
                                updatePhaseTitle(phase.id, e.target.value)
                              }
                              className="font-bold text-sm text-purple-900 bg-white border border-purple-200 rounded-lg px-3 py-1.5 flex-1"
                              placeholder="Phase Title (e.g. Phase 1: Branding and Digital Foundation)"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => addDeliverable(phase.id)}
                              className="px-2.5 py-1 text-xs bg-purple-100 hover:bg-purple-200 text-purple-800 font-semibold rounded-lg transition"
                            >
                              + Add Deliverable
                            </button>
                            {editingQuotation.scopePhases.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removePhase(phase.id)}
                                className="text-gray-400 hover:text-rose-600 p-1"
                                title="Remove Phase"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Deliverables inside this phase */}
                        <div className="space-y-3 pl-6 border-l-2 border-purple-200">
                          {phase.deliverables.map((del) => (
                            <div
                              key={del.id}
                              className="bg-white p-3.5 rounded-lg border border-gray-200 space-y-2 relative"
                            >
                              <div className="flex items-center justify-between">
                                <input
                                  type="text"
                                  value={del.title}
                                  onChange={(e) =>
                                    updateDeliverable(phase.id, del.id, 'title', e.target.value)
                                  }
                                  className="font-semibold text-xs text-gray-900 border-b border-gray-200 focus:border-purple-500 px-1 py-0.5 w-4/5"
                                  placeholder="Deliverable Title (e.g. WordPress Corporate Website)"
                                />
                                {phase.deliverables.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeDeliverable(phase.id, del.id)}
                                    className="text-gray-400 hover:text-rose-500 p-1"
                                    title="Remove Deliverable"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>

                              <textarea
                                rows={2}
                                value={del.subtitle || ''}
                                onChange={(e) =>
                                  updateDeliverable(phase.id, del.id, 'subtitle', e.target.value)
                                }
                                className="w-full text-xs p-2 bg-gray-50 border border-gray-200 rounded"
                                placeholder="Subtitle or brief scope explanation..."
                              />

                              <div>
                                <label className="block text-[10px] font-semibold text-gray-500 uppercase">
                                  Indicative deliverables (comma separated)
                                </label>
                                <input
                                  type="text"
                                  value={del.indicativeDeliverables || ''}
                                  onChange={(e) =>
                                    updateDeliverable(
                                      phase.id,
                                      del.id,
                                      'indicativeDeliverables',
                                      e.target.value
                                    )
                                  }
                                  className="w-full text-xs italic px-2 py-1 bg-white border border-gray-200 rounded mt-0.5"
                                  placeholder="e.g. Vector logo files, color reverse versions, responsive web framework..."
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: COMMERCIALS & INCLUSIONS */}
              {activeTab === 'commercials' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Commercial Section Heading
                    </label>
                    <input
                      type="text"
                      value={editingQuotation.commercialHeading}
                      onChange={(e) =>
                        setEditingQuotation({
                          ...editingQuotation,
                          commercialHeading: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium"
                    />
                  </div>

                  {/* Pricing Items Table */}
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">
                          Commercial Pricing Schedule
                        </h4>
                        <p className="text-[11px] text-gray-500">
                          Set deliverables and investment in your selected currency
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Currency Selector */}
                        <div className="flex items-center gap-1.5 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                          <label htmlFor="commercialCurrencySelect" className="text-[11px] font-bold text-purple-900 cursor-pointer">
                            Currency:
                          </label>
                          <select
                            id="commercialCurrencySelect"
                            value={editingQuotation.currency || 'INR'}
                            onChange={(e) =>
                              setEditingQuotation({
                                ...editingQuotation,
                                currency: e.target.value as CurrencyCode,
                              })
                            }
                            className="text-xs font-bold text-purple-900 bg-transparent border-none focus:outline-none cursor-pointer"
                          >
                            {SUPPORTED_CURRENCIES.map((c) => (
                              <option key={c.code} value={c.code}>
                                {c.code} ({c.symbol})
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={addCommercialItem}
                          className="px-2.5 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition"
                        >
                          + Add Pricing Item
                        </button>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-purple-50 text-purple-900 font-bold uppercase text-[10px] border-b border-purple-100">
                          <tr>
                            <th className="px-4 py-2.5 w-1/2">Service / Deliverable</th>
                            <th className="px-4 py-2.5 w-1/4">Investment ({editingQuotation.currency || 'INR'})</th>
                            <th className="px-4 py-2.5 w-1/4">Billing Arrangement</th>
                            <th className="px-2 py-2.5 text-center w-10"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {editingQuotation.commercialItems.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50/50">
                              <td className="px-4 py-2">
                                <input
                                  type="text"
                                  value={item.service}
                                  onChange={(e) =>
                                    updateCommercialItem(item.id, 'service', e.target.value)
                                  }
                                  className="w-full px-2 py-1 border border-gray-200 rounded font-medium text-xs"
                                  placeholder="e.g. WordPress Corporate Website"
                                />
                              </td>
                              <td className="px-4 py-2">
                                <div className="flex items-center gap-1">
                                  <span className="font-bold text-purple-700 min-w-[14px]">
                                    {getCurrencySymbol(editingQuotation.currency)}
                                  </span>
                                  <input
                                    type="number"
                                    value={item.investment}
                                    onChange={(e) =>
                                      updateCommercialItem(
                                        item.id,
                                        'investment',
                                        Number(e.target.value) || 0
                                      )
                                    }
                                    className="w-full px-2 py-1 border border-gray-200 rounded font-bold text-xs"
                                  />
                                </div>
                              </td>
                              <td className="px-4 py-2">
                                <div className="space-y-1">
                                  <input
                                    type="text"
                                    value={item.billing}
                                    onChange={(e) =>
                                      updateCommercialItem(item.id, 'billing', e.target.value)
                                    }
                                    className="w-full px-2 py-1 border border-gray-200 rounded text-xs"
                                    placeholder="e.g. One-time, Monthly Retainer"
                                  />
                                  <input
                                    type="text"
                                    value={item.taxNote || ''}
                                    onChange={(e) =>
                                      updateCommercialItem(item.id, 'taxNote', e.target.value)
                                    }
                                    className="w-full px-2 py-0.5 border border-gray-100 text-[10px] text-gray-400 rounded"
                                    placeholder="+ 18% GST"
                                  />
                                </div>
                              </td>
                              <td className="px-2 py-2 text-center">
                                {editingQuotation.commercialItems.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeCommercialItem(item.id)}
                                    className="text-gray-400 hover:text-rose-500 p-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-purple-100/60 font-bold border-t border-purple-200">
                          <tr>
                            <td className="px-4 py-2.5 text-purple-900">
                              Total Estimated Investment
                            </td>
                            <td className="px-4 py-2.5 text-purple-900 text-sm">
                              {getCurrencySymbol(editingQuotation.currency)}{' '}
                              {editingQuotation.totalTentativeValue.toLocaleString(
                                getCurrencyLocale(editingQuotation.currency)
                              )}
                            </td>
                            <td colSpan={2} className="px-4 py-2.5 text-purple-700 text-[11px]">
                              Taxes extra where applicable
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Pricing Notes & Exclusions (Editable Heading + Content) */}
                  <div className="space-y-2 p-3.5 bg-gray-50/70 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide">
                        Pricing Notes & Exclusions Heading (Editable)
                      </label>
                      <span className="text-[10px] text-gray-400">Header title printed on PDF</span>
                    </div>
                    <input
                      type="text"
                      value={
                        editingQuotation.pricingNotesHeading !== undefined
                          ? editingQuotation.pricingNotesHeading
                          : 'Pricing Notes & Exclusions (e.g. Ad Spend, GST, Domains)'
                      }
                      onChange={(e) =>
                        setEditingQuotation({
                          ...editingQuotation,
                          pricingNotesHeading: e.target.value,
                        })
                      }
                      className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-purple-950 focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g. Pricing Notes & Exclusions (e.g. Ad Spend, GST, Domains)"
                    />
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">
                        Notes Details / Description
                      </label>
                      <textarea
                        rows={3}
                        value={editingQuotation.pricingNotes}
                        onChange={(e) =>
                          setEditingQuotation({
                            ...editingQuotation,
                            pricingNotes: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500"
                        placeholder="Detail exclusions, budget conditions, external tools..."
                      />
                    </div>
                  </div>

                  {/* Client Inputs Required (Editable Heading + Content) */}
                  <div className="space-y-2 p-3.5 bg-gray-50/70 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide">
                        Client Inputs Required Heading (Editable)
                      </label>
                      <span className="text-[10px] text-gray-400">Header title printed on PDF</span>
                    </div>
                    <input
                      type="text"
                      value={
                        editingQuotation.clientInputsHeading !== undefined
                          ? editingQuotation.clientInputsHeading
                          : 'Client Inputs Required (Prerequisites)'
                      }
                      onChange={(e) =>
                        setEditingQuotation({
                          ...editingQuotation,
                          clientInputsHeading: e.target.value,
                        })
                      }
                      className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-purple-950 focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g. Client Inputs Required (Prerequisites)"
                    />
                    <div>
                      <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">
                        Prerequisites & Client Inputs Description
                      </label>
                      <textarea
                        rows={2}
                        value={editingQuotation.clientInputsRequired}
                        onChange={(e) =>
                          setEditingQuotation({
                            ...editingQuotation,
                            clientInputsRequired: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-purple-500"
                        placeholder="Detail materials, logos, credentials, assets required from client..."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: TERMS & SIGNOFF */}
              {activeTab === 'terms' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                      Terms Section Heading
                    </label>
                    <input
                      type="text"
                      value={editingQuotation.termsHeading}
                      onChange={(e) =>
                        setEditingQuotation({
                          ...editingQuotation,
                          termsHeading: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium"
                    />
                  </div>

                  {/* Engagement Terms List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-gray-900">
                        Engagement & Payment Terms
                      </h4>
                      <button
                        type="button"
                        onClick={addTerm}
                        className="px-2.5 py-1 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold rounded-lg transition"
                      >
                        + Add Term
                      </button>
                    </div>

                    <div className="space-y-2">
                      {editingQuotation.terms.map((term, tIdx) => (
                        <div
                          key={tIdx}
                          className="flex items-start gap-2 p-2 bg-gray-50 border border-gray-200 rounded-lg"
                        >
                          <input
                            type="text"
                            value={term.title}
                            onChange={(e) => updateTerm(tIdx, 'title', e.target.value)}
                            className="w-1/3 px-2 py-1 bg-white border border-gray-300 rounded text-xs font-semibold"
                            placeholder="Term Title (e.g. Payment)"
                          />
                          <input
                            type="text"
                            value={term.detail}
                            onChange={(e) => updateTerm(tIdx, 'detail', e.target.value)}
                            className="flex-1 px-2 py-1 bg-white border border-gray-300 rounded text-xs"
                            placeholder="Term condition / details..."
                          />
                          <button
                            type="button"
                            onClick={() => removeTerm(tIdx)}
                            className="text-gray-400 hover:text-rose-500 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Closing & Signoff */}
                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                        Closing Proposal Note
                      </label>
                      <textarea
                        rows={2}
                        value={editingQuotation.closingNote}
                        onChange={(e) =>
                          setEditingQuotation({
                            ...editingQuotation,
                            closingNote: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                          Signatory Name
                        </label>
                        <input
                          type="text"
                          value={editingQuotation.signatoryName}
                          onChange={(e) =>
                            setEditingQuotation({
                              ...editingQuotation,
                              signatoryName: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                          Designation
                        </label>
                        <input
                          type="text"
                          value={editingQuotation.signatoryDesignation}
                          onChange={(e) =>
                            setEditingQuotation({
                              ...editingQuotation,
                              signatoryDesignation: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                          Signatory Phone
                        </label>
                        <input
                          type="text"
                          value={editingQuotation.signatoryPhone}
                          onChange={(e) =>
                            setEditingQuotation({
                              ...editingQuotation,
                              signatoryPhone: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                          Signatory Email
                        </label>
                        <input
                          type="text"
                          value={editingQuotation.signatoryEmail}
                          onChange={(e) =>
                            setEditingQuotation({
                              ...editingQuotation,
                              signatoryEmail: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                          Website
                        </label>
                        <input
                          type="text"
                          value={editingQuotation.signatoryWebsite}
                          onChange={(e) =>
                            setEditingQuotation({
                              ...editingQuotation,
                              signatoryWebsite: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              {/* Previous / Next tab navigators */}
              <div className="flex items-center gap-2">
                {activeTab !== 'client' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTab === 'terms') setActiveTab('commercials');
                      else if (activeTab === 'commercials') setActiveTab('scope');
                      else if (activeTab === 'scope') setActiveTab('objectives');
                      else if (activeTab === 'objectives') setActiveTab('client');
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Back
                  </button>
                )}
                {activeTab !== 'terms' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTab === 'client') setActiveTab('objectives');
                      else if (activeTab === 'objectives') setActiveTab('scope');
                      else if (activeTab === 'scope') setActiveTab('commercials');
                      else if (activeTab === 'commercials') setActiveTab('terms');
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold hover:bg-purple-100"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Actions: Direct PDF Download & Save Proposal */}
              <div className="flex items-center gap-3">
                <PDFDownloadLink
                  document={<QuotationPDF quotation={editingQuotation} />}
                  fileName={`${editingQuotation.quotationNumber.replace(/[\/\\]/g, '_')}_Commercial_Proposal.pdf`}
                  className="flex items-center gap-1.5 px-4 py-2 border border-purple-300 text-purple-700 hover:bg-purple-50 rounded-lg text-xs font-semibold transition"
                >
                  {/* @ts-expect-error: react-pdf types */}
                  {({ loading }: { loading: boolean }) => (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      {loading ? 'Preparing PDF...' : 'Download PDF'}
                    </>
                  )}
                </PDFDownloadLink>

                <button
                  type="button"
                  onClick={handleSaveQuotation}
                  className="flex items-center gap-1.5 px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Save Proposal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Synchronized Feedback Toast */}
      {feedbackToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-fade-in border border-gray-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackToast}</span>
        </div>
      )}
    </div>
  );
};
