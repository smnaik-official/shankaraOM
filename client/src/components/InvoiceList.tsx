import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Download,
  FileText,
  Repeat,
  CheckCircle2,
  Zap,
  Search,
  Filter,
  Trash2,
  Edit,
  X,
  Building,
  Building2,
  User,
  MapPin,
  Globe,
  Calendar,
  AlertTriangle,
  FileMinus,
  Clock,
} from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { InvoicePDF } from './InvoicePDF';
import { CreditNotePDF } from './CreditNotePDF';
import { getStoredClients } from './ClientList';
import { formatDateDMY } from '../utils/date';
import { isKarnatakaLocation, calculateTaxes } from '../utils/gst';
import {
  Invoice,
  RecurringInvoiceTemplate,
  CreditNote,
  getStoredInvoices,
  saveStoredInvoices,
  getStoredRecurringTemplates,
  saveStoredRecurringTemplates,
  getStoredCreditNotes,
  saveStoredCreditNotes,
  getNextInvoiceNumber,
  getNextCreditNoteNumber,
  generateFullInvoiceData,
  generateFullCreditNoteData,
} from '../data/invoices';

const REASON_PRESETS = [
  'Post-Sale Discount / Commercial Settlement',
  'Service Deficiency / SLA Waiver',
  'Correction in Invoice / Rate Discrepancy',
  'Partial Cancellation of Scope',
  'Goodwill & Relationship Adjustment',
  'Other Adjustment',
];

const InvoiceList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'ledger' | 'credit_notes' | 'recurring'>('ledger');
  const [invoices, setInvoices] = useState<Invoice[]>(() => getStoredInvoices());
  const [recurringTemplates, setRecurringTemplates] = useState<RecurringInvoiceTemplate[]>(() =>
    getStoredRecurringTemplates()
  );
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>(() => getStoredCreditNotes());

  // Filters for ledger
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Pending' | 'Hold' | 'Cancelled'>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | 'COMPANY' | 'PERSONAL'>('All');

  // Synchronize active tab and status filter from URL parameters (e.g. from alerts / notifications)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'recurring' || tabParam === 'retainers') {
      setActiveTab('recurring');
    } else if (tabParam === 'credit_notes') {
      setActiveTab('credit_notes');
    } else if (tabParam === 'ledger') {
      setActiveTab('ledger');
    }

    const statusParam = searchParams.get('status');
    if (statusParam && ['All', 'Paid', 'Pending', 'Hold', 'Cancelled'].includes(statusParam)) {
      setStatusFilter(statusParam as any);
    }
  }, [searchParams]);

  // Month selector for recurring automation (Defaults to current year-month: YYYY-MM)
  const currentMonthStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }, []);
  const [targetMonth, setTargetMonth] = useState<string>(currentMonthStr);

  // Month filter for KPI overview cards and billing records ('ALL' or 'YYYY-MM')
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');

  // Derive unique months from all invoices and recurring templates (descending order)
  const availableMonths = useMemo(() => {
    const monthSet = new Set<string>();
    invoices.forEach((inv) => {
      if (inv.date && inv.date.length >= 7) {
        monthSet.add(inv.date.substring(0, 7));
      }
    });
    monthSet.add(currentMonthStr);
    const sorted = Array.from(monthSet).sort().reverse();
    return sorted.map((val) => {
      const [y, m] = val.split('-').map(Number);
      const date = new Date(y, m - 1, 1);
      const label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      return { value: val, label };
    });
  }, [invoices, currentMonthStr]);

  const selectedMonthLabel = useMemo(() => {
    if (selectedMonth === 'ALL') return 'All Months';
    const match = availableMonths.find((m) => m.value === selectedMonth);
    return match ? match.label : selectedMonth;
  }, [selectedMonth, availableMonths]);

  // 4 Top Cards summary metrics computed based on selectedMonth
  const summaryMetrics = useMemo(() => {
    const filteredInvs = selectedMonth === 'ALL'
      ? invoices.filter((inv) => inv.status !== 'Cancelled')
      : invoices.filter((inv) => inv.status !== 'Cancelled' && inv.date.startsWith(selectedMonth));

    const companyInvoices = filteredInvs.filter((inv) => inv.type === 'COMPANY');
    const personalInvoices = filteredInvs.filter((inv) => inv.type === 'PERSONAL');

    const companyTotal = companyInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const personalTotal = personalInvoices.reduce((sum, inv) => sum + inv.amount, 0);

    const pendingInvoices = filteredInvs.filter((inv) => inv.status === 'Pending' || inv.status === 'Overdue');
    const pendingTotal = pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0);

    // Active recurring retainers volume
    const activeTemplates = recurringTemplates.filter((t) => t.isActive);
    const monthlyRetainerVolume = activeTemplates.reduce((sum, t) => sum + t.total, 0);

    return {
      companyTotal,
      companyCount: companyInvoices.length,
      personalTotal,
      personalCount: personalInvoices.length,
      pendingTotal,
      pendingCount: pendingInvoices.length,
      monthlyRetainerVolume,
      activeRetainerCount: activeTemplates.length,
    };
  }, [invoices, recurringTemplates, selectedMonth]);

  // Modal for Edit Invoice
  const [isEditInvoiceModalOpen, setIsEditInvoiceModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editInvoiceForm, setEditInvoiceForm] = useState<Partial<Invoice>>({});
  const [editInvoiceError, setEditInvoiceError] = useState<string | null>(null);

  // Modal for Add / Edit Recurring Template
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RecurringInvoiceTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState<Partial<RecurringInvoiceTemplate>>({});
  const [templateError, setTemplateError] = useState<string | null>(null);

  // Modal for Raising / Editing Credit Note
  const [isCreditNoteModalOpen, setIsCreditNoteModalOpen] = useState(false);
  const [editingCreditNote, setEditingCreditNote] = useState<CreditNote | null>(null);
  const [creditNoteForm, setCreditNoteForm] = useState<Partial<CreditNote>>({});
  const [creditNoteError, setCreditNoteError] = useState<string | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [clients, setClients] = useState(() => getStoredClients());

  // Listen for storage events
  useEffect(() => {
    const handleSync = () => {
      setInvoices(getStoredInvoices());
      setRecurringTemplates(getStoredRecurringTemplates());
      setCreditNotes(getStoredCreditNotes());
      setClients(getStoredClients());
    };
    window.addEventListener('invoices_updated', handleSync);
    window.addEventListener('recurring_invoices_updated', handleSync);
    window.addEventListener('credit_notes_updated', handleSync);
    window.addEventListener('clients_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('invoices_updated', handleSync);
      window.removeEventListener('recurring_invoices_updated', handleSync);
      window.removeEventListener('credit_notes_updated', handleSync);
      window.removeEventListener('clients_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Month label formatter (e.g. "November 2026")
  const targetMonthLabel = useMemo(() => {
    try {
      const [y, m] = targetMonth.split('-').map(Number);
      const date = new Date(y, m - 1, 1);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return targetMonth;
    }
  }, [targetMonth]);


  // Check which recurring templates are generated for targetMonth
  const recurringStatusMap = useMemo(() => {
    const map = new Map<string, Invoice>();
    invoices.forEach((inv) => {
      if (inv.recurringTemplateId && inv.date.startsWith(targetMonth)) {
        map.set(inv.recurringTemplateId, inv);
      }
    });
    return map;
  }, [invoices, targetMonth]);

  // Metrics for recurring retainers
  const recurringMetrics = useMemo(() => {
    const active = recurringTemplates.filter((t) => t.isActive);
    const totalVolume = active.reduce((sum, t) => sum + t.total, 0);

    let generatedCount = 0;
    let pendingCount = 0;
    let pendingAmount = 0;

    active.forEach((t) => {
      if (recurringStatusMap.has(t.id)) {
        generatedCount++;
      } else {
        pendingCount++;
        pendingAmount += t.total;
      }
    });

    return {
      totalVolume,
      activeCount: active.length,
      generatedCount,
      pendingCount,
      pendingAmount,
    };
  }, [recurringTemplates, recurringStatusMap]);

  // Generate single invoice from recurring template for targetMonth
  const handleGenerateSingle = (template: RecurringInvoiceTemplate) => {
    if (recurringStatusMap.has(template.id)) {
      showToast(`Invoice already generated for ${template.clientName} in ${targetMonthLabel}`);
      return;
    }

    const [y, m] = targetMonth.split('-').map(Number);
    const day = Math.min(template.dayOfMonth || 1, 28);
    const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const newId = getNextInvoiceNumber(invoices, dateStr);

    const matchedClient = clients.find((c) => c.name.toLowerCase() === template.clientName.toLowerCase());
    const isInterState = template.isInterState !== undefined 
      ? template.isInterState 
      : !isKarnatakaLocation(matchedClient);
    const taxes = calculateTaxes(template.subtotal, template.type, isInterState);

    const newInvoice: Invoice = {
      id: newId,
      client: template.clientName,
      clientId: template.clientId,
      date: dateStr,
      type: template.type,
      items: template.items,
      subtotal: template.subtotal,
      gst: taxes.totalGst,
      cgst: taxes.cgst,
      sgst: taxes.sgst,
      igst: taxes.igst,
      isInterState,
      amount: taxes.total,
      status: 'Pending',
      recurringTemplateId: template.id,
      notes: template.notes || `Generated from recurring retainer for ${targetMonthLabel}`,
    };

    const updated = [newInvoice, ...invoices];
    setInvoices(updated);
    saveStoredInvoices(updated);
    showToast(`Invoice ${newId} generated for ${template.clientName}`);
  };

  // 1-Click Generate All Pending for Target Month
  const handleGenerateAllPending = () => {
    const active = recurringTemplates.filter((t) => t.isActive);
    const pendingTemplates = active.filter((t) => !recurringStatusMap.has(t.id));

    if (pendingTemplates.length === 0) {
      showToast(`All recurring invoices for ${targetMonthLabel} are already generated!`);
      return;
    }

    const [y, m] = targetMonth.split('-').map(Number);

    let currentInvoiceList = [...invoices];
    const generatedIds: string[] = [];

    pendingTemplates.forEach((t) => {
      const day = Math.min(t.dayOfMonth || 1, 28);
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const newId = getNextInvoiceNumber(currentInvoiceList, dateStr);

      const matchedClient = clients.find((c) => c.name.toLowerCase() === t.clientName.toLowerCase());
      const isInterState = t.isInterState !== undefined 
        ? t.isInterState 
        : !isKarnatakaLocation(matchedClient);
      const taxes = calculateTaxes(t.subtotal, t.type, isInterState);

      const inv: Invoice = {
        id: newId,
        client: t.clientName,
        clientId: t.clientId,
        date: dateStr,
        type: t.type,
        items: t.items,
        subtotal: t.subtotal,
        gst: taxes.totalGst,
        cgst: taxes.cgst,
        sgst: taxes.sgst,
        igst: taxes.igst,
        isInterState,
        amount: taxes.total,
        status: 'Pending',
        recurringTemplateId: t.id,
        notes: t.notes || `Generated from recurring retainer for ${targetMonthLabel}`,
      };

      currentInvoiceList = [inv, ...currentInvoiceList];
      generatedIds.push(newId);
    });

    setInvoices(currentInvoiceList);
    saveStoredInvoices(currentInvoiceList);
    showToast(`Generated ${pendingTemplates.length} recurring invoices for ${targetMonthLabel}!`);
  };

  // Change invoice status (Paid / Pending / Hold / Cancelled)
  const handleStatusChange = (invoiceId: string, newStatus: Invoice['status']) => {
    const updated = invoices.map((inv) => (inv.id === invoiceId ? { ...inv, status: newStatus } : inv));
    setInvoices(updated);
    saveStoredInvoices(updated);
    showToast(`Invoice ${invoiceId} marked as ${newStatus}`);
  };

  // Open Edit Invoice Modal
  const handleOpenEditInvoice = (inv: Invoice) => {
    setEditingInvoice(inv);
    setEditInvoiceForm({
      ...inv,
      items: inv.items ? inv.items.map((it) => ({ ...it })) : [],
    });
    setEditInvoiceError(null);
    setIsEditInvoiceModalOpen(true);
  };

  // Save Edited Invoice
  const handleSaveEditInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;

    const trimmedId = (editInvoiceForm.id || '').trim();
    if (!trimmedId) {
      setEditInvoiceError('Please enter a valid invoice number.');
      return;
    }

    if (
      invoices.some(
        (inv) =>
          inv.id !== editingInvoice.id &&
          inv.id.trim().toLowerCase() === trimmedId.toLowerCase()
      )
    ) {
      setEditInvoiceError(`Invoice number "${trimmedId}" already exists.`);
      return;
    }

    if (!editInvoiceForm.client?.trim()) {
      setEditInvoiceError('Please select or enter a client name.');
      return;
    }

    const items = editInvoiceForm.items || [];
    if (items.length === 0 || !items.some((it) => it.desc.trim() && (it.rate || 0) > 0)) {
      setEditInvoiceError('Please enter at least one line item with description and rate.');
      return;
    }

    const subtotal = items.reduce((sum, it) => sum + (it.units || 1) * (it.rate || 0), 0);
    const matchedClient = clients.find((c) => c.name.toLowerCase() === editInvoiceForm.client?.toLowerCase());
    const isInterState = editInvoiceForm.isInterState !== undefined 
      ? editInvoiceForm.isInterState 
      : !isKarnatakaLocation(matchedClient);
    const taxes = calculateTaxes(subtotal, editInvoiceForm.type || 'COMPANY', isInterState);

    const updatedInvoices = invoices.map((inv) =>
      inv.id === editingInvoice.id
        ? ({
            ...inv,
            id: trimmedId,
            client: editInvoiceForm.client!.trim(),
            date: editInvoiceForm.date || inv.date,
            type: editInvoiceForm.type || 'COMPANY',
            status: editInvoiceForm.status || inv.status,
            items: items.filter((it) => it.desc.trim()),
            subtotal,
            gst: taxes.totalGst,
            cgst: taxes.cgst,
            sgst: taxes.sgst,
            igst: taxes.igst,
            isInterState,
            amount: taxes.total,
            notes: editInvoiceForm.notes || '',
          } as Invoice)
        : inv
    );

    setInvoices(updatedInvoices);
    saveStoredInvoices(updatedInvoices);
    showToast(`Invoice ${trimmedId} updated successfully!`);
    setIsEditInvoiceModalOpen(false);
    setEditingInvoice(null);
  };

  // Delete invoice
  const handleDeleteInvoice = (invoiceId: string) => {
    if (confirm(`Delete invoice ${invoiceId}?`)) {
      const updated = invoices.filter((i) => i.id !== invoiceId);
      setInvoices(updated);
      saveStoredInvoices(updated);
      showToast(`Invoice ${invoiceId} deleted`);
    }
  };

  // Toggle recurring template active status
  const handleToggleTemplateActive = (templateId: string) => {
    const updated = recurringTemplates.map((t) =>
      t.id === templateId ? { ...t, isActive: !t.isActive } : t
    );
    setRecurringTemplates(updated);
    saveStoredRecurringTemplates(updated);
  };

  // Delete recurring template
  const handleDeleteTemplate = (templateId: string, title: string) => {
    if (confirm(`Delete recurring retainer "${title}"?`)) {
      const updated = recurringTemplates.filter((t) => t.id !== templateId);
      setRecurringTemplates(updated);
      saveStoredRecurringTemplates(updated);
      showToast(`Recurring retainer removed`);
    }
  };

  // Open modal to add new template
  const handleOpenAddTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm({
      title: '',
      clientName: clients[0]?.name || '',
      type: 'COMPANY',
      frequency: 'Monthly',
      dayOfMonth: 1,
      isActive: true,
      items: [{ id: '1', desc: 'Monthly Retainer Services', units: 1, rate: 25000, sac: '998311' }],
      notes: 'Monthly recurring retainer invoice.',
    });
    setTemplateError(null);
    setIsTemplateModalOpen(true);
  };

  // Open modal to edit existing template
  const handleOpenEditTemplate = (template: RecurringInvoiceTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      ...template,
      items: template.items.map((it) => ({ ...it })),
    });
    setTemplateError(null);
    setIsTemplateModalOpen(true);
  };

  // Save template from modal
  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!templateForm.title?.trim()) {
      setTemplateError('Please enter a retainer title.');
      return;
    }
    if (!templateForm.clientName?.trim()) {
      setTemplateError('Please select or enter a client name.');
      return;
    }

    const items = templateForm.items || [];
    if (items.length === 0 || !items.some((it) => it.desc.trim() && it.rate > 0)) {
      setTemplateError('Please enter at least one line item with description and rate.');
      return;
    }

    const subtotal = items.reduce((sum, it) => sum + (it.units || 1) * (it.rate || 0), 0);
    const matchedClient = clients.find((c) => c.name.toLowerCase() === templateForm.clientName?.toLowerCase());
    const isInterState = templateForm.isInterState !== undefined 
      ? templateForm.isInterState 
      : !isKarnatakaLocation(matchedClient);
    const taxes = calculateTaxes(subtotal, templateForm.type || 'COMPANY', isInterState);
    const gst = taxes.totalGst;
    const total = taxes.total;

    if (editingTemplate) {
      const updated = recurringTemplates.map((t) =>
        t.id === editingTemplate.id
          ? ({
              ...t,
              title: templateForm.title!.trim(),
              clientName: templateForm.clientName!.trim(),
              type: templateForm.type || 'COMPANY',
              frequency: templateForm.frequency || 'Monthly',
              dayOfMonth: Number(templateForm.dayOfMonth) || 1,
              items: items,
              subtotal,
              gst,
              cgst: taxes.cgst,
              sgst: taxes.sgst,
              igst: taxes.igst,
              isInterState,
              total,
              isActive: templateForm.isActive !== false,
              notes: templateForm.notes || '',
            } as RecurringInvoiceTemplate)
          : t
      );
      setRecurringTemplates(updated);
      saveStoredRecurringTemplates(updated);
      showToast(`Updated recurring retainer "${templateForm.title}"`);
    } else {
      const created: RecurringInvoiceTemplate = {
        id: `rec-inv-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        title: templateForm.title!.trim(),
        clientName: templateForm.clientName!.trim(),
        type: templateForm.type || 'COMPANY',
        frequency: templateForm.frequency || 'Monthly',
        dayOfMonth: Number(templateForm.dayOfMonth) || 1,
        items: items,
        subtotal,
        gst,
        cgst: taxes.cgst,
        sgst: taxes.sgst,
        igst: taxes.igst,
        isInterState,
        total,
        isActive: templateForm.isActive !== false,
        notes: templateForm.notes || '',
      };
      const updated = [created, ...recurringTemplates];
      setRecurringTemplates(updated);
      saveStoredRecurringTemplates(updated);
      showToast(`New recurring retainer created for ${created.clientName}`);
    }

    setIsTemplateModalOpen(false);
    setEditingTemplate(null);
  };

  // ==================== CREDIT NOTE LOGIC ====================

  // Open modal to raise a Credit Note against an invoice
  const handleOpenRaiseCreditNote = (inv?: Invoice) => {
    const targetInvoice = inv || invoices[0];
    if (!targetInvoice) {
      showToast('No invoices available to raise a credit note against.');
      return;
    }

    const matchedClient = clients.find((c) => c.name.toLowerCase() === targetInvoice.client.toLowerCase());
    const isInterState = targetInvoice.isInterState !== undefined 
      ? targetInvoice.isInterState 
      : !isKarnatakaLocation(matchedClient);

    setEditingCreditNote(null);
    setCreditNoteForm({
      originalInvoiceId: targetInvoice.id,
      originalInvoiceDate: targetInvoice.date,
      client: targetInvoice.client,
      type: targetInvoice.type,
      isInterState,
      date: new Date().toISOString().slice(0, 10),
      reason: REASON_PRESETS[0],
      items:
        targetInvoice.items && targetInvoice.items.length > 0
          ? targetInvoice.items.map((it, idx) => ({
              id: String(idx + 1),
              desc: `Credit Adjustment: ${it.desc}`,
              sac: it.sac || '998311',
              units: it.units || 1,
              rate: it.rate || 0,
            }))
          : [
              {
                id: '1',
                desc: `Credit adjustment against invoice #${targetInvoice.id}`,
                sac: '998311',
                units: 1,
                rate: targetInvoice.subtotal || targetInvoice.amount,
              },
            ],
      notes: `Credit note issued against Tax Invoice #${targetInvoice.id} dated ${targetInvoice.date}`,
    });
    setCreditNoteError(null);
    setIsCreditNoteModalOpen(true);
  };

  // Open modal to edit existing Credit Note
  const handleOpenEditCreditNote = (cn: CreditNote) => {
    setEditingCreditNote(cn);
    setCreditNoteForm({
      ...cn,
      items: cn.items.map((it) => ({ ...it })),
    });
    setCreditNoteError(null);
    setIsCreditNoteModalOpen(true);
  };

  // When changing the referenced invoice in the Credit Note modal
  const handleSelectInvoiceForCN = (invoiceId: string) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) return;

    const matchedClient = clients.find((c) => c.name.toLowerCase() === inv.client.toLowerCase());
    const isInterState = inv.isInterState !== undefined 
      ? inv.isInterState 
      : !isKarnatakaLocation(matchedClient);

    setCreditNoteForm({
      ...creditNoteForm,
      originalInvoiceId: inv.id,
      originalInvoiceDate: inv.date,
      client: inv.client,
      type: inv.type,
      isInterState,
      items:
        inv.items && inv.items.length > 0
          ? inv.items.map((it, idx) => ({
              id: String(idx + 1),
              desc: `Credit Adjustment: ${it.desc}`,
              sac: it.sac || '998311',
              units: it.units || 1,
              rate: it.rate || 0,
            }))
          : [
              {
                id: '1',
                desc: `Credit adjustment against invoice #${inv.id}`,
                sac: '998311',
                units: 1,
                rate: inv.subtotal || inv.amount,
              },
            ],
      notes: `Credit note issued against Tax Invoice #${inv.id} dated ${inv.date}`,
    });
  };

  // Save Credit Note
  const handleSaveCreditNote = (e: React.FormEvent) => {
    e.preventDefault();

    if (!creditNoteForm.originalInvoiceId) {
      setCreditNoteError('Please select the reference invoice.');
      return;
    }
    if (!creditNoteForm.reason?.trim()) {
      setCreditNoteError('Please provide a reason for the credit note.');
      return;
    }

    const items = creditNoteForm.items || [];
    if (items.length === 0 || !items.some((it) => it.desc.trim() && it.rate > 0)) {
      setCreditNoteError('Please enter at least one credit line item with description and rate.');
      return;
    }

    const subtotal = items.reduce((sum, it) => sum + (it.units || 1) * (it.rate || 0), 0);
    const matchedClient = clients.find((c) => c.name.toLowerCase() === creditNoteForm.client?.toLowerCase());
    const isInterState = creditNoteForm.isInterState !== undefined 
      ? creditNoteForm.isInterState 
      : !isKarnatakaLocation(matchedClient);
    const taxes = calculateTaxes(subtotal, creditNoteForm.type || 'COMPANY', isInterState);
    const gst = taxes.totalGst;
    const total = taxes.total;

    if (editingCreditNote) {
      const updated = creditNotes.map((cn) =>
        cn.id === editingCreditNote.id
          ? ({
              ...cn,
              originalInvoiceId: creditNoteForm.originalInvoiceId!,
              originalInvoiceDate: creditNoteForm.originalInvoiceDate || '',
              client: creditNoteForm.client || '',
              date: creditNoteForm.date || new Date().toISOString().slice(0, 10),
              reason: creditNoteForm.reason!.trim(),
              type: creditNoteForm.type || 'COMPANY',
              items,
              subtotal,
              gst,
              cgst: taxes.cgst,
              sgst: taxes.sgst,
              igst: taxes.igst,
              isInterState,
              amount: total,
              notes: creditNoteForm.notes || '',
            } as CreditNote)
          : cn
      );
      setCreditNotes(updated);
      saveStoredCreditNotes(updated);
      showToast(`Updated Credit Note ${editingCreditNote.id}`);
    } else {
      const newCnId = getNextCreditNoteNumber(creditNotes, creditNoteForm.date);
      const created: CreditNote = {
        id: newCnId,
        originalInvoiceId: creditNoteForm.originalInvoiceId!,
        originalInvoiceDate: creditNoteForm.originalInvoiceDate || '',
        client: creditNoteForm.client || '',
        date: creditNoteForm.date || new Date().toISOString().slice(0, 10),
        reason: creditNoteForm.reason!.trim(),
        type: creditNoteForm.type || 'COMPANY',
        items,
        subtotal,
        gst,
        cgst: taxes.cgst,
        sgst: taxes.sgst,
        igst: taxes.igst,
        isInterState,
        amount: total,
        notes: creditNoteForm.notes || '',
      };
      const updated = [created, ...creditNotes];
      setCreditNotes(updated);
      saveStoredCreditNotes(updated);
      showToast(`Credit Note ${newCnId} issued against invoice #${created.originalInvoiceId}!`);
    }

    setIsCreditNoteModalOpen(false);
    setEditingCreditNote(null);
  };

  // Delete Credit Note
  const handleDeleteCreditNote = (cnId: string) => {
    if (confirm(`Delete Credit Note ${cnId}?`)) {
      const updated = creditNotes.filter((c) => c.id !== cnId);
      setCreditNotes(updated);
      saveStoredCreditNotes(updated);
      showToast(`Credit Note ${cnId} deleted`);
    }
  };

  // Filtered invoices in ledger
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (selectedMonth !== 'ALL' && !inv.date.startsWith(selectedMonth)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = inv.id.toLowerCase().includes(q);
        const matchClient = inv.client.toLowerCase().includes(q);
        const matchDate = inv.date.includes(q) || formatDateDMY(inv.date).toLowerCase().includes(q);
        if (!matchId && !matchClient && !matchDate) return false;
      }
      if (statusFilter !== 'All' && inv.status !== statusFilter) return false;
      if (typeFilter !== 'All' && inv.type !== typeFilter) return false;
      return true;
    });
  }, [invoices, selectedMonth, searchQuery, statusFilter, typeFilter]);

  // Filtered credit notes
  const filteredCreditNotes = useMemo(() => {
    return creditNotes.filter((cn) => {
      if (selectedMonth !== 'ALL' && !cn.date.startsWith(selectedMonth)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          cn.id.toLowerCase().includes(q) ||
          cn.originalInvoiceId.toLowerCase().includes(q) ||
          cn.client.toLowerCase().includes(q) ||
          cn.reason.toLowerCase().includes(q) ||
          cn.date.includes(q) ||
          formatDateDMY(cn.date).includes(q) ||
          cn.originalInvoiceDate.includes(q) ||
          formatDateDMY(cn.originalInvoiceDate).includes(q)
        );
      }
      return true;
    });
  }, [creditNotes, selectedMonth, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-gray-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-xl border border-gray-800 transition-all animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header with Title, Month Filter, and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">Invoices & Billing</h1>
          <p className="text-xs text-gray-500 mt-1">
            Generate and manage client invoices, credit notes, automated recurring retainers, and tax receipts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Month Filter Selector */}
          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-2xs hover:border-gray-400 transition-colors">
            <Calendar className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">Filter Month:</span>
            <select
              value={selectedMonth}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedMonth(val);
                if (val !== 'ALL') {
                  setTargetMonth(val);
                }
              }}
              className="bg-transparent text-xs font-semibold text-gray-800 focus:outline-none cursor-pointer pr-1"
            >
              <option value="ALL">All Months (All Time)</option>
              {availableMonths.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            {selectedMonth !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedMonth('ALL')}
                className="text-gray-400 hover:text-rose-600 ml-0.5 p-0.5 rounded transition-colors"
                title="Reset to All Months"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action Button */}
          {activeTab === 'recurring' ? (
            <button
              onClick={handleOpenAddTemplate}
              className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 active:bg-indigo-800 flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Recurring Retainer
            </button>
          ) : activeTab === 'credit_notes' ? (
            <button
              onClick={() => handleOpenRaiseCreditNote()}
              className="bg-red-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 active:bg-red-800 flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Raise Credit Note
            </button>
          ) : (
            <Link
              to="/invoices/new"
              className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 active:bg-indigo-800 flex items-center justify-center gap-2 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> New Invoice
            </Link>
          )}
        </div>
      </div>

      {/* 4 Summary KPI Cards (Company Total, Personal Total, Pending Receivables, Recurring Retainers) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Invoice Amount (from company) */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Total Invoice Amount (Company)</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-gray-900">
              ₹{summaryMetrics.companyTotal.toLocaleString()}
            </div>
            <div className="flex items-center justify-between mt-1.5 text-[11px]">
              <span className="font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                {summaryMetrics.companyCount} {summaryMetrics.companyCount === 1 ? 'Invoice' : 'Invoices'}
              </span>
              <span className="text-gray-400">18% GST Registered</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total invoice amount (from personal) */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Total Invoice Amount (Personal)</span>
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-gray-900">
              ₹{summaryMetrics.personalTotal.toLocaleString()}
            </div>
            <div className="flex items-center justify-between mt-1.5 text-[11px]">
              <span className="font-semibold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full">
                {summaryMetrics.personalCount} {summaryMetrics.personalCount === 1 ? 'Invoice' : 'Invoices'}
              </span>
              <span className="text-gray-400">Non-GST Consulting</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Pending Receivable Amount */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Total Pending Receivables</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-gray-900">
              ₹{summaryMetrics.pendingTotal.toLocaleString()}
            </div>
            <div className="flex items-center justify-between mt-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('ledger');
                  setStatusFilter('Pending');
                }}
                className="font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full transition-colors flex items-center gap-1"
                title="Filter ledger by Pending invoices"
              >
                <Clock className="w-3 h-3" />
                {summaryMetrics.pendingCount} Awaiting Payment
              </button>
              <span className="text-gray-400">
                {summaryMetrics.pendingCount === 0 ? 'All Settled' : 'Unpaid'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Total amount of Monthly Recurring Retainer */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Monthly Recurring Retainers</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Repeat className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-gray-900">
              ₹{summaryMetrics.monthlyRetainerVolume.toLocaleString()}
            </div>
            <div className="flex items-center justify-between mt-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('recurring');
                  setSearchParams((prev) => {
                    const next = new URLSearchParams(prev);
                    next.set('tab', 'recurring');
                    return next;
                  });
                }}
                className="font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full transition-colors flex items-center gap-1"
                title="View Recurring Retainers & Automation"
              >
                <Repeat className="w-3 h-3" />
                {summaryMetrics.activeRetainerCount} Active Retainers
              </button>
              <span className="text-gray-400">Monthly Run-rate</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => {
            setActiveTab('ledger');
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              next.set('tab', 'ledger');
              return next;
            });
          }}
          className={`pb-3 px-3 text-sm font-heading font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'ledger'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Invoices Ledger</span>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
            {invoices.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('credit_notes');
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              next.set('tab', 'credit_notes');
              return next;
            });
          }}
          className={`pb-3 px-3 text-sm font-heading font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'credit_notes'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <FileMinus className="w-4 h-4" />
          <span>Credit Notes</span>
          <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full font-medium">
            {creditNotes.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('recurring');
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              next.set('tab', 'recurring');
              return next;
            });
          }}
          className={`pb-3 px-3 text-sm font-heading font-semibold border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'recurring'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Repeat className="w-4 h-4" />
          <span>Recurring Retainers & Automation</span>
          <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
            {recurringTemplates.length}
          </span>
        </button>
      </div>

      {/* ======================= TAB 1: INVOICES LEDGER ======================= */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          {/* Search and Filters Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by invoice #, client, date..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all placeholder:text-gray-400"
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

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                <span>Status:</span>
              </div>
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg text-xs">
                {(['All', 'Paid', 'Pending', 'Hold', 'Cancelled'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                      statusFilter === s ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg text-xs ml-2">
                {(['All', 'COMPANY', 'PERSONAL'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                      typeFilter === t ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {t === 'All' ? 'All Types' : t === 'COMPANY' ? 'Company' : 'Personal'}
                  </button>
                ))}
              </div>

              {selectedMonth !== 'ALL' && (
                <div className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs px-2.5 py-1 rounded-md font-medium ml-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{selectedMonthLabel}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedMonth('ALL')}
                    className="hover:text-indigo-900 ml-0.5"
                    title="Clear month filter to show all invoices"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/90 border-b border-gray-200 text-xs font-heading font-semibold text-gray-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4 whitespace-nowrap">Invoice Number</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Date</th>
                    <th className="py-3.5 px-4">Client Name</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Amount</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Invoice Type</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-indigo-50/20 transition-colors">
                      {/* 1. Invoice Number */}
                      <td className="py-3.5 px-4 font-semibold text-gray-900 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                          <span>{inv.id}</span>
                        </div>
                      </td>

                      {/* 2. Date */}
                      <td className="py-3.5 px-4 text-gray-700 whitespace-nowrap text-sm font-medium">
                        {formatDateDMY(inv.date)}
                      </td>

                      {/* 3. Client Name */}
                      <td className="py-3.5 px-4 font-medium text-gray-900 min-w-[190px]">
                        {inv.client}
                      </td>

                      {/* 4. Amount */}
                      <td className="py-3.5 px-4 font-bold text-gray-900 whitespace-nowrap text-sm">
                        ₹{inv.amount.toLocaleString()}
                      </td>

                      {/* 5. Invoice Type */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 text-xs rounded-full font-medium inline-block ${
                            inv.type === 'COMPANY'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}
                        >
                          {inv.type === 'COMPANY' ? 'Company' : 'Personal'}
                        </span>
                      </td>

                      {/* 6. Option to change Status (Paid/Pending/Hold/Cancelled) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          value={inv.status}
                          onChange={(e) => handleStatusChange(inv.id, e.target.value as Invoice['status'])}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg border cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all ${
                            inv.status === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-400'
                              : inv.status === 'Pending'
                              ? 'bg-amber-50 text-amber-700 border-amber-200 focus:ring-amber-400'
                              : inv.status === 'Hold'
                              ? 'bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-400'
                              : 'bg-rose-50 text-rose-700 border-rose-200 focus:ring-rose-400'
                          }`}
                          title="Click to change status"
                        >
                          <option value="Paid">Paid</option>
                          <option value="Pending">Pending</option>
                          <option value="Hold">Hold</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>

                      {/* 7. Actions: Edit Option, Download PDF option, Delete Option */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit Option */}
                          <button
                            onClick={() => handleOpenEditInvoice(inv)}
                            className="p-1.5 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 transition-colors inline-flex items-center gap-1 text-xs font-medium shadow-2xs"
                            title={`Edit Invoice #${inv.id}`}
                          >
                            <Edit className="w-3.5 h-3.5 text-indigo-600" />
                            <span className="hidden sm:inline">Edit</span>
                          </button>

                          {/* Download PDF Option */}
                          <PDFDownloadLink
                            document={<InvoicePDF invoiceData={generateFullInvoiceData(inv)} />}
                            fileName={`invoice_${inv.id.replace('/', '_')}.pdf`}
                            className="p-1.5 rounded-lg text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 transition-colors inline-flex items-center gap-1 text-xs font-medium shadow-2xs"
                            title="Download PDF"
                          >
                            {/* @ts-expect-error: react-pdf types */}
                            {({ loading }: { loading: boolean }) =>
                              loading ? (
                                <span className="text-xs text-gray-400">...</span>
                              ) : (
                                <>
                                  <Download className="w-3.5 h-3.5 text-indigo-600" />
                                  <span className="hidden sm:inline">PDF</span>
                                </>
                              )
                            }
                          </PDFDownloadLink>

                          {/* Delete Option */}
                          <button
                            onClick={() => handleDeleteInvoice(inv.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors shadow-2xs"
                            title={`Delete Invoice #${inv.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredInvoices.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500">
                        <div className="max-w-xs mx-auto space-y-2">
                          <FileText className="w-8 h-8 mx-auto text-gray-300" />
                          <p className="font-heading font-semibold text-gray-700">No invoices found</p>
                          <p className="text-xs text-gray-400">
                            {searchQuery
                              ? `No invoices match "${searchQuery}".`
                              : 'Create a new invoice or generate from recurring retainers.'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB 2: CREDIT NOTES LEDGER ======================= */}
      {activeTab === 'credit_notes' && (
        <div className="space-y-4">
          {/* Credit Notes Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/90 border-b border-gray-200 text-xs font-heading font-semibold text-gray-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4 whitespace-nowrap">Credit Note #</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Credit Note Date</th>
                    <th className="py-3.5 px-4">Client</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Credit Note Amount</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredCreditNotes.map((cn) => (
                    <tr key={cn.id} className="hover:bg-red-50/20 transition-colors">
                      {/* 1. Credit Note # */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FileMinus className="w-4 h-4 text-red-600 flex-shrink-0" />
                          <div>
                            <span className="font-semibold text-gray-900">{cn.id}</span>
                            {cn.originalInvoiceId && (
                              <span className="block text-[11px] text-gray-400 font-normal">
                                Inv #{cn.originalInvoiceId}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. Credit Note Date */}
                      <td className="py-3.5 px-4 text-gray-700 whitespace-nowrap text-sm font-medium">
                        {formatDateDMY(cn.date)}
                      </td>

                      {/* 3. Client */}
                      <td className="py-3.5 px-4 font-medium text-gray-900 min-w-[200px]">
                        {cn.client}
                      </td>

                      {/* 4. Credit Note Amount */}
                      <td className="py-3.5 px-4 font-bold text-gray-900 whitespace-nowrap text-sm">
                        <div>₹{cn.amount.toLocaleString()}</div>
                        {cn.type === 'COMPANY' && (
                          <span className="text-[11px] text-gray-500 font-normal block">
                            {cn.isInterState || (cn.igst && cn.igst > 0) ? 'Incl. 18% IGST' : 'Incl. 18% (CGST/SGST)'}
                          </span>
                        )}
                      </td>

                      {/* 5. Actions: PDF Download, Edit, Delete Options */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* PDF Download Option */}
                          <PDFDownloadLink
                            document={<CreditNotePDF creditNoteData={generateFullCreditNoteData(cn)} />}
                            fileName={`credit_note_${cn.id.replace(/[\/-]/g, '_')}.pdf`}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors inline-flex items-center gap-1 text-xs font-medium"
                            title="Download Credit Note PDF"
                          >
                            {/* @ts-expect-error: react-pdf types */}
                            {({ loading }: { loading: boolean }) =>
                              loading ? (
                                <span className="text-xs text-gray-400">Loading...</span>
                              ) : (
                                <>
                                  <Download className="w-3.5 h-3.5 text-red-600" />
                                  <span className="hidden sm:inline text-red-700">PDF</span>
                                </>
                              )
                            }
                          </PDFDownloadLink>

                          {/* Edit Option */}
                          <button
                            onClick={() => handleOpenEditCreditNote(cn)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-colors inline-flex items-center gap-1 text-xs font-medium"
                            title="Edit Credit Note"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Edit</span>
                          </button>

                          {/* Delete Option */}
                          <button
                            onClick={() => handleDeleteCreditNote(cn.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors inline-flex items-center gap-1 text-xs font-medium"
                            title="Delete Credit Note"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredCreditNotes.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-500">
                        <div className="max-w-xs mx-auto space-y-2">
                          <FileMinus className="w-8 h-8 mx-auto text-gray-300" />
                          <p className="font-heading font-semibold text-gray-700">No credit notes found</p>
                          <p className="text-xs text-gray-400">
                            You can raise a credit note against any invoice from the Invoices Ledger or using the button
                            above.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB 3: RECURRING RETAINERS & AUTOMATION ======================= */}
      {activeTab === 'recurring' && (
        <div className="space-y-4">
          {/* Top Control Toolbar (Clean, Compact, Modern) */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            {/* Left: Billing Month Selector & Summary Stats */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>Billing Month:</span>
                <input
                  type="month"
                  value={targetMonth}
                  onChange={(e) => setTargetMonth(e.target.value)}
                  className="bg-white border border-gray-300 rounded px-2 py-0.5 text-xs text-gray-900 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              {/* Stat Pills */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md font-medium">
                  Total: <strong className="text-gray-900">₹{recurringMetrics.totalVolume.toLocaleString()}/mo</strong>
                </span>
                <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-md font-medium">
                  Generated: <strong>{recurringMetrics.generatedCount}</strong>
                </span>
                <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-md font-medium">
                  Pending: <strong>{recurringMetrics.pendingCount}</strong>
                </span>
              </div>
            </div>

            {/* Right: Generate All Action */}
            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button
                onClick={handleGenerateAllPending}
                disabled={recurringMetrics.pendingCount === 0}
                className={`px-4 py-2 rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs ${
                  recurringMetrics.pendingCount > 0
                    ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white cursor-pointer'
                    : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>
                  {recurringMetrics.pendingCount > 0
                    ? `Generate All Pending (${recurringMetrics.pendingCount})`
                    : `All Generated for ${targetMonthLabel}`}
                </span>
              </button>
            </div>
          </div>

          {/* Retainers Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/90 border-b border-gray-200 text-xs font-heading font-semibold text-gray-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4 whitespace-nowrap">Client & Retainer</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Billing Schedule</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Invoice Type</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Monthly Amount</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Current Status</th>
                    <th className="py-3.5 px-4 text-center whitespace-nowrap">Active</th>
                    <th className="py-3.5 px-4 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {recurringTemplates.map((template) => {
                    const generatedInvoice = recurringStatusMap.get(template.id);
                    const isGenerated = !!generatedInvoice;

                    return (
                      <tr key={template.id} className="hover:bg-indigo-50/20 transition-colors">
                        {/* 1. Client & Retainer */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                              <Building className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{template.clientName}</div>
                              <div className="text-xs text-gray-500">{template.title}</div>
                            </div>
                          </div>
                        </td>

                        {/* 2. Billing Schedule */}
                        <td className="py-3.5 px-4 text-gray-700 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span>Day {template.dayOfMonth} ({template.frequency})</span>
                          </div>
                        </td>

                        {/* 3. Invoice Type */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {template.type === 'COMPANY' ? (
                            <span className="px-2.5 py-1 text-xs rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              Company
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 text-xs rounded-full font-medium bg-purple-50 text-purple-700 border border-purple-200">
                              Personal
                            </span>
                          )}
                        </td>

                        {/* 4. Monthly Amount */}
                        <td className="py-3.5 px-4 font-bold text-gray-900 whitespace-nowrap text-sm">
                          <div>₹{template.total.toLocaleString()}</div>
                          {template.type === 'COMPANY' && (
                            <span className="text-[11px] text-gray-500 font-normal block">
                              {template.isInterState ? 'Incl. 18% IGST' : 'Incl. 18% (CGST/SGST)'}
                            </span>
                          )}
                        </td>

                        {/* 5. Status for Target Month */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isGenerated ? (
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Generated: #{generatedInvoice.id}</span>
                              </span>
                              <PDFDownloadLink
                                document={<InvoicePDF invoiceData={generateFullInvoiceData(generatedInvoice)} />}
                                fileName={`invoice_${generatedInvoice.id.replace(/[\/-]/g, '_')}.pdf`}
                                className="p-1 text-gray-400 hover:text-indigo-600 rounded hover:bg-gray-100 transition-colors"
                                title="Download Generated Invoice PDF"
                              >
                                {/* @ts-expect-error: react-pdf function child */}
                                {({ loading }: { loading: boolean }) =>
                                  loading ? null : <Download className="w-3.5 h-3.5" />
                                }
                              </PDFDownloadLink>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleGenerateSingle(template)}
                              disabled={!template.isActive}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-2xs ${
                                template.isActive
                                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer active:scale-95'
                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                              }`}
                            >
                              <Zap className="w-3 h-3 text-amber-300" />
                              <span>Generate Invoice</span>
                            </button>
                          )}
                        </td>

                        {/* 6. Active Toggle */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleToggleTemplateActive(template.id)}
                            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              template.isActive ? 'bg-indigo-600' : 'bg-gray-300'
                            }`}
                            title={template.isActive ? 'Active — Click to Pause' : 'Paused — Click to Activate'}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                template.isActive ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </td>

                        {/* 7. Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditTemplate(template)}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-colors inline-flex items-center gap-1 text-xs font-medium"
                              title="Edit Retainer Details"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate(template.id, template.title)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors inline-flex items-center gap-1 text-xs font-medium"
                              title="Delete Retainer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {recurringTemplates.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500">
                        <div className="max-w-xs mx-auto space-y-2">
                          <Repeat className="w-8 h-8 mx-auto text-gray-300" />
                          <p className="font-heading font-semibold text-gray-700">No recurring retainers found</p>
                          <p className="text-xs text-gray-400">
                            Configure recurring retainers to automatically generate client invoices every month.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL: EDIT INVOICE ======================= */}
      {isEditInvoiceModalOpen && editingInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 sm:p-6">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Header (Sticky) */}
            <div className="px-6 py-4 border-b border-gray-200 bg-white flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-heading font-bold text-gray-900">
                      Edit Invoice <span className="text-indigo-600">#{editingInvoice.id}</span>
                    </h2>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Modify client details, billing entity, service line items, and payment notes.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditInvoiceModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEditInvoice} className="flex-1 overflow-y-auto p-6 space-y-5">
              {editInvoiceError && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span>{editInvoiceError}</span>
                </div>
              )}

              {/* Top Section: Invoice Number, Client Details, Date & Status */}
              <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200/80 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  {/* Invoice Number (Col 3) */}
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Invoice Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editInvoiceForm.id || ''}
                      onChange={(e) => setEditInvoiceForm({ ...editInvoiceForm, id: e.target.value })}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                    />
                  </div>

                  {/* Client Name (Col 4) */}
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Client / Company <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editInvoiceForm.client || ''}
                      onChange={(e) => {
                        const nextClient = e.target.value;
                        const matched = clients.find((c) => c.name.toLowerCase() === nextClient.toLowerCase());
                        setEditInvoiceForm({
                          ...editInvoiceForm,
                          client: nextClient,
                          isInterState: matched ? !isKarnatakaLocation(matched) : false,
                        });
                      }}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs font-medium"
                    >
                      <option value="">Select a client...</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Invoice Date (Col 3) */}
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Invoice Date
                    </label>
                    <input
                      type="date"
                      value={editInvoiceForm.date || ''}
                      onChange={(e) => setEditInvoiceForm({ ...editInvoiceForm, date: e.target.value })}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                    />
                    <div className="text-[11px] text-indigo-600 font-semibold mt-1">
                      {formatDateDMY(editInvoiceForm.date)}
                    </div>
                  </div>

                  {/* Status (Col 2) */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Invoice Status
                    </label>
                    <select
                      value={editInvoiceForm.status || 'Pending'}
                      onChange={(e) =>
                        setEditInvoiceForm({
                          ...editInvoiceForm,
                          status: e.target.value as Invoice['status'],
                        })
                      }
                      className={`w-full border rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 shadow-2xs transition-all ${
                        editInvoiceForm.status === 'Paid'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 focus:ring-emerald-500'
                          : editInvoiceForm.status === 'Pending'
                          ? 'bg-amber-50 text-amber-800 border-amber-300 focus:ring-amber-500'
                          : editInvoiceForm.status === 'Hold'
                          ? 'bg-blue-50 text-blue-800 border-blue-300 focus:ring-blue-500'
                          : 'bg-rose-50 text-rose-800 border-rose-300 focus:ring-rose-500'
                      }`}
                    >
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending</option>
                      <option value="Hold">Hold</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Billing Entity & Place of Supply (Balanced 2-Column Section) */}
                <div className="pt-3 border-t border-gray-200/80 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Billing Entity */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                        Billing Entity
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">Tax Registration</span>
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 bg-gray-200/60 p-1 rounded-xl border border-gray-200">
                      <button
                        type="button"
                        onClick={() => setEditInvoiceForm({ ...editInvoiceForm, type: 'COMPANY' })}
                        className={`py-2 px-2.5 rounded-lg text-xs font-semibold transition-all flex flex-col items-center justify-center gap-0.5 ${
                          editInvoiceForm.type === 'COMPANY'
                            ? 'bg-white text-indigo-700 shadow-2xs border border-indigo-100 ring-1 ring-indigo-200/70'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Company</span>
                        </span>
                        <span className={`text-[10px] font-medium ${editInvoiceForm.type === 'COMPANY' ? 'text-indigo-600 font-semibold' : 'text-gray-500'}`}>
                          18% GST Registered
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditInvoiceForm({ ...editInvoiceForm, type: 'PERSONAL' })}
                        className={`py-2 px-2.5 rounded-lg text-xs font-semibold transition-all flex flex-col items-center justify-center gap-0.5 ${
                          editInvoiceForm.type === 'PERSONAL'
                            ? 'bg-white text-purple-700 shadow-2xs border border-purple-100 ring-1 ring-purple-200/70'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
                        }`}
                      >
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-purple-600" />
                          <span>Personal</span>
                        </span>
                        <span className={`text-[10px] font-medium ${editInvoiceForm.type === 'PERSONAL' ? 'text-purple-600 font-semibold' : 'text-gray-500'}`}>
                          Non-GST invoice
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Right: Place of Supply & Tax Jurisdiction */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        Place of Supply (GST Jurisdiction)
                      </span>
                      {editInvoiceForm.type === 'COMPANY' && (
                        <span className="text-[10px] font-semibold text-gray-500">
                          {editInvoiceForm.isInterState ? 'Inter-State' : 'Intra-State'}
                        </span>
                      )}
                    </label>

                    {editInvoiceForm.type === 'COMPANY' ? (
                      <div className="grid grid-cols-2 gap-1.5 bg-gray-200/60 p-1 rounded-xl border border-gray-200">
                        <button
                          type="button"
                          onClick={() => setEditInvoiceForm({ ...editInvoiceForm, isInterState: false })}
                          className={`py-2 px-2.5 rounded-lg text-xs font-semibold transition-all flex flex-col items-center justify-center gap-0.5 ${
                            !editInvoiceForm.isInterState
                              ? 'bg-white text-emerald-800 shadow-2xs border border-emerald-200 ring-1 ring-emerald-300/70'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span>Karnataka (KA)</span>
                          </span>
                          <span className={`text-[10px] font-medium ${!editInvoiceForm.isInterState ? 'text-emerald-700 font-semibold' : 'text-gray-500'}`}>
                            9% CGST + 9% SGST
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditInvoiceForm({ ...editInvoiceForm, isInterState: true })}
                          className={`py-2 px-2.5 rounded-lg text-xs font-semibold transition-all flex flex-col items-center justify-center gap-0.5 ${
                            editInvoiceForm.isInterState
                              ? 'bg-white text-blue-800 shadow-2xs border border-blue-200 ring-1 ring-blue-300/70'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
                          }`}
                        >
                          <span className="flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-blue-600" />
                            <span>Outside Karnataka</span>
                          </span>
                          <span className={`text-[10px] font-medium ${editInvoiceForm.isInterState ? 'text-blue-700 font-semibold' : 'text-gray-500'}`}>
                            18% IGST
                          </span>
                        </button>
                      </div>
                    ) : (
                      <div className="h-[46px] rounded-xl border border-dashed border-gray-300 bg-white/70 flex items-center justify-center px-3 text-xs text-gray-500 gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span className="font-medium text-gray-600">GST Not Applicable</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Middle Section: Line Items Table */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-sm font-heading font-bold text-gray-900">
                    Line Items & Services
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      const next = [
                        ...(editInvoiceForm.items || []),
                        { id: String(Date.now()), desc: '', sac: '998311', units: 1, rate: 0 },
                      ];
                      setEditInvoiceForm({ ...editInvoiceForm, items: next });
                    }}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Line Item
                  </button>
                </div>

                {/* Styled Table with Headers */}
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-100/70 border-b border-gray-200 text-[11px] font-heading font-semibold text-gray-600 uppercase tracking-wider">
                          <th className="py-2.5 px-3 min-w-[240px]">Description</th>
                          <th className="py-2.5 px-2.5 w-24 text-center">SAC Code</th>
                          <th className="py-2.5 px-2.5 w-20 text-center">Units</th>
                          <th className="py-2.5 px-2.5 w-32 text-right">Rate (₹)</th>
                          <th className="py-2.5 px-3 w-32 text-right">Amount (₹)</th>
                          <th className="py-2.5 px-2 w-10 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {(editInvoiceForm.items || []).map((it, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                            {/* Description */}
                            <td className="p-2">
                              <input
                                type="text"
                                placeholder="Service description..."
                                value={it.desc}
                                onChange={(e) => {
                                  const next = [...(editInvoiceForm.items || [])];
                                  next[idx].desc = e.target.value;
                                  setEditInvoiceForm({ ...editInvoiceForm, items: next });
                                }}
                                className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </td>

                            {/* SAC */}
                            <td className="p-2">
                              <input
                                type="text"
                                placeholder="998311"
                                value={it.sac || ''}
                                onChange={(e) => {
                                  const next = [...(editInvoiceForm.items || [])];
                                  next[idx].sac = e.target.value;
                                  setEditInvoiceForm({ ...editInvoiceForm, items: next });
                                }}
                                className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 bg-white font-mono text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </td>

                            {/* Units */}
                            <td className="p-2">
                              <input
                                type="number"
                                min={1}
                                value={it.units}
                                onChange={(e) => {
                                  const next = [...(editInvoiceForm.items || [])];
                                  next[idx].units = parseInt(e.target.value) || 0;
                                  setEditInvoiceForm({ ...editInvoiceForm, items: next });
                                }}
                                className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 bg-white text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </td>

                            {/* Rate */}
                            <td className="p-2">
                              <input
                                type="number"
                                value={it.rate}
                                onChange={(e) => {
                                  const next = [...(editInvoiceForm.items || [])];
                                  next[idx].rate = parseInt(e.target.value) || 0;
                                  setEditInvoiceForm({ ...editInvoiceForm, items: next });
                                }}
                                className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 bg-white text-right font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </td>

                            {/* Amount */}
                            <td className="p-2 text-right font-semibold text-xs text-gray-900 whitespace-nowrap">
                              ₹{((it.units || 1) * (it.rate || 0)).toLocaleString()}
                            </td>

                            {/* Action */}
                            <td className="p-2 text-center">
                              {(editInvoiceForm.items || []).length > 1 ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = (editInvoiceForm.items || []).filter((_, i) => i !== idx);
                                    setEditInvoiceForm({ ...editInvoiceForm, items: next });
                                  }}
                                  className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
                                  title="Remove item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ) : null}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Lower Section: 2 Columns for Notes and Financial Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                {/* Notes (Left) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Payment Terms & Notes
                  </label>
                  <textarea
                    rows={4}
                    placeholder="e.g. Due within 7 days. Bank transfer to account listed."
                    value={editInvoiceForm.notes || ''}
                    onChange={(e) => setEditInvoiceForm({ ...editInvoiceForm, notes: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none shadow-2xs"
                  />
                </div>

                {/* Calculation Summary Card (Right) */}
                {(() => {
                  const subtotal = (editInvoiceForm.items || []).reduce(
                    (sum, it) => sum + (it.units || 1) * (it.rate || 0),
                    0
                  );
                  const matchedClient = clients.find(
                    (c) => c.name.toLowerCase() === editInvoiceForm.client?.toLowerCase()
                  );
                  const isInterState =
                    editInvoiceForm.isInterState !== undefined
                      ? editInvoiceForm.isInterState
                      : !isKarnatakaLocation(matchedClient);
                  const taxes = calculateTaxes(subtotal, editInvoiceForm.type || 'COMPANY', isInterState);

                  return (
                    <div className="bg-gray-50/80 rounded-xl border border-gray-200 p-4 space-y-2 text-xs">
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal:</span>
                        <span className="font-medium text-gray-900">₹{subtotal.toLocaleString()}</span>
                      </div>

                      {editInvoiceForm.type === 'COMPANY' && (
                        <>
                          {isInterState ? (
                            <div className="flex justify-between text-gray-600">
                              <span>IGST (18% - Inter-State):</span>
                              <span className="font-medium text-gray-900">₹{taxes.igst.toLocaleString()}</span>
                            </div>
                          ) : (
                            <>
                              <div className="flex justify-between text-gray-600">
                                <span>CGST (9% - Karnataka):</span>
                                <span className="font-medium text-gray-900">₹{taxes.cgst.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-gray-600">
                                <span>SGST (9% - Karnataka):</span>
                                <span className="font-medium text-gray-900">₹{taxes.sgst.toLocaleString()}</span>
                              </div>
                            </>
                          )}
                        </>
                      )}

                      {editInvoiceForm.type === 'PERSONAL' && (
                        <div className="flex justify-between text-emerald-700">
                          <span>GST:</span>
                          <span className="font-medium">0%</span>
                        </div>
                      )}

                      <div className="flex justify-between text-base font-heading font-bold text-gray-900 border-t border-gray-200 pt-2 mt-2">
                        <span>Total Amount:</span>
                        <span className="text-indigo-600 font-bold">₹{taxes.total.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Sticky Modal Footer */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white -mx-6 px-6 pb-1">
                <button
                  type="button"
                  onClick={() => setIsEditInvoiceModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 active:bg-indigo-800 shadow-sm transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL: RAISE / EDIT CREDIT NOTE ======================= */}
      {isCreditNoteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 sm:p-6">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Header (Sticky) */}
            <div className="px-6 py-4 border-b border-gray-200 bg-white flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shadow-2xs">
                  <FileMinus className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-heading font-bold text-gray-900">
                      {editingCreditNote ? (
                        <>
                          Edit Credit Note <span className="text-rose-600">#{editingCreditNote.id}</span>
                        </>
                      ) : (
                        'Issue Credit Note'
                      )}
                    </h2>
                    <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full font-medium">
                      GST Credit Adjustment
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Issue a GST-compliant credit note linked to original invoice for commercial settlement or rate adjustments.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreditNoteModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveCreditNote} className="flex-1 overflow-y-auto p-6 space-y-5">
              {creditNoteError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                  <span>{creditNoteError}</span>
                </div>
              )}

              {/* Target Invoice to Credit Card */}
              <div className="bg-rose-50/40 border border-rose-200/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-rose-900 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-rose-600" />
                    Target Invoice to Credit <span className="text-rose-500">*</span>
                  </span>
                  <span className="text-[11px] font-medium text-rose-600">
                    Statutory reference to original invoice number &amp; date
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-600 mb-1.5">
                    Select Reference Invoice
                  </label>
                  <select
                    value={creditNoteForm.originalInvoiceId || ''}
                    onChange={(e) => handleSelectInvoiceForCN(e.target.value)}
                    className="w-full bg-white border border-rose-300/80 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-2xs font-semibold"
                  >
                    {invoices.map((inv) => (
                      <option key={inv.id} value={inv.id}>
                        Invoice #{inv.id} — {inv.client} ({formatDateDMY(inv.date)} • ₹{inv.amount.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Linked Invoice Details Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-rose-200/60">
                  <div className="bg-white/80 p-2 rounded-lg border border-rose-100">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                      Original Date
                    </span>
                    <span className="text-xs font-semibold text-gray-900">
                      {formatDateDMY(creditNoteForm.originalInvoiceDate) || 'N/A'}
                    </span>
                  </div>

                  <div className="bg-white/80 p-2 rounded-lg border border-rose-100">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                      Client Name
                    </span>
                    <span className="text-xs font-semibold text-gray-900 truncate block" title={creditNoteForm.client}>
                      {creditNoteForm.client || 'N/A'}
                    </span>
                  </div>

                  <div className="bg-white/80 p-2 rounded-lg border border-rose-100">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                      Tax Mode
                    </span>
                    <span className="text-xs font-semibold text-gray-900">
                      {creditNoteForm.type === 'COMPANY' ? 'Company' : 'Personal'}
                    </span>
                  </div>

                  <div className="bg-white/80 p-2 rounded-lg border border-rose-100">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                      Jurisdiction
                    </span>
                    <span className="text-xs font-semibold text-gray-900">
                      {creditNoteForm.type === 'COMPANY'
                        ? creditNoteForm.isInterState
                          ? 'Outside KA (18% IGST)'
                          : 'Karnataka (Incl. 18% CGST/SGST)'
                        : 'Exempt / Non-GST'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Credit Note Date & Reason Preset Row */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-5">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
                    <span>Credit Note Date <span className="text-rose-500">*</span></span>
                    <span className="text-[11px] text-rose-600 font-semibold">{formatDateDMY(creditNoteForm.date)}</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={creditNoteForm.date || ''}
                    onChange={(e) => setCreditNoteForm({ ...creditNoteForm, date: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-2xs"
                  />
                </div>

                <div className="sm:col-span-7">
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Reason for Credit Note <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={creditNoteForm.reason || ''}
                    onChange={(e) => setCreditNoteForm({ ...creditNoteForm, reason: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-500 shadow-2xs font-medium"
                  >
                    {REASON_PRESETS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Credited Items & Services Table */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div>
                    <h3 className="text-sm font-heading font-bold text-gray-900">
                      Credited Items &amp; Values (Editable)
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      Customize descriptions, units, or rates to represent the exact credit or discount granted.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const items = creditNoteForm.items || [];
                      setCreditNoteForm({
                        ...creditNoteForm,
                        items: [
                          ...items,
                          { id: `item-${Date.now()}`, desc: 'Credit Adjustment', units: 1, rate: 0, sac: '998311' },
                        ],
                      });
                    }}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Credit Line
                  </button>
                </div>

                {/* Styled Table with Headers */}
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-100/70 border-b border-gray-200 text-[11px] font-heading font-semibold text-gray-600 uppercase tracking-wider">
                          <th className="py-2.5 px-3 min-w-[240px]">Credit Description</th>
                          <th className="py-2.5 px-2.5 w-24 text-center">SAC Code</th>
                          <th className="py-2.5 px-2.5 w-20 text-center">Units</th>
                          <th className="py-2.5 px-2.5 w-32 text-right">Credit Rate (₹)</th>
                          <th className="py-2.5 px-3 w-32 text-right">Credit Amount (₹)</th>
                          <th className="py-2.5 px-2 w-10 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {(creditNoteForm.items || []).map((it, idx) => (
                          <tr key={idx} className="hover:bg-rose-50/20 transition-colors">
                            {/* Description */}
                            <td className="p-2">
                              <input
                                type="text"
                                placeholder="Credit Description..."
                                value={it.desc}
                                onChange={(e) => {
                                  const next = [...(creditNoteForm.items || [])];
                                  next[idx].desc = e.target.value;
                                  setCreditNoteForm({ ...creditNoteForm, items: next });
                                }}
                                className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                              />
                            </td>

                            {/* SAC */}
                            <td className="p-2">
                              <input
                                type="text"
                                placeholder="998311"
                                value={it.sac || ''}
                                onChange={(e) => {
                                  const next = [...(creditNoteForm.items || [])];
                                  next[idx].sac = e.target.value;
                                  setCreditNoteForm({ ...creditNoteForm, items: next });
                                }}
                                className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 bg-white font-mono text-center focus:outline-none focus:ring-2 focus:ring-rose-500"
                              />
                            </td>

                            {/* Units */}
                            <td className="p-2">
                              <input
                                type="number"
                                min={1}
                                value={it.units}
                                onChange={(e) => {
                                  const next = [...(creditNoteForm.items || [])];
                                  next[idx].units = parseInt(e.target.value) || 0;
                                  setCreditNoteForm({ ...creditNoteForm, items: next });
                                }}
                                className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 bg-white text-center focus:outline-none focus:ring-2 focus:ring-rose-500"
                              />
                            </td>

                            {/* Rate */}
                            <td className="p-2">
                              <input
                                type="number"
                                value={it.rate}
                                onChange={(e) => {
                                  const next = [...(creditNoteForm.items || [])];
                                  next[idx].rate = parseInt(e.target.value) || 0;
                                  setCreditNoteForm({ ...creditNoteForm, items: next });
                                }}
                                className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-rose-700 bg-white text-right font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                              />
                            </td>

                            {/* Amount */}
                            <td className="p-2 text-right font-bold text-xs text-rose-700 whitespace-nowrap">
                              ₹{((it.units || 1) * (it.rate || 0)).toLocaleString()}
                            </td>

                            {/* Action */}
                            <td className="p-2 text-center">
                              {(creditNoteForm.items || []).length > 1 ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = (creditNoteForm.items || []).filter((_, i) => i !== idx);
                                    setCreditNoteForm({ ...creditNoteForm, items: next });
                                  }}
                                  className="text-gray-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors"
                                  title="Remove item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ) : null}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Lower Section: 2 Columns for Remarks and Financial Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                {/* Remarks & Settlement Notes (Left) */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Remarks &amp; Settlement Notes
                  </label>
                  <textarea
                    rows={4}
                    placeholder="e.g. Adjusted against next month billing / Credited via bank refund"
                    value={creditNoteForm.notes || ''}
                    onChange={(e) => setCreditNoteForm({ ...creditNoteForm, notes: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none shadow-2xs"
                  />
                </div>

                {/* Calculation Summary Card (Right) */}
                {(() => {
                  const subtotal = (creditNoteForm.items || []).reduce(
                    (sum, it) => sum + (it.units || 1) * (it.rate || 0),
                    0
                  );
                  const matchedClient = clients.find(
                    (c) => c.name.toLowerCase() === creditNoteForm.client?.toLowerCase()
                  );
                  const isInterState =
                    creditNoteForm.isInterState !== undefined
                      ? creditNoteForm.isInterState
                      : !isKarnatakaLocation(matchedClient);
                  const taxes = calculateTaxes(subtotal, creditNoteForm.type || 'COMPANY', isInterState);

                  return (
                    <div className="bg-rose-50/50 rounded-xl border border-rose-200/90 p-4 space-y-2 text-xs">
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal Credit:</span>
                        <span className="font-medium text-gray-900">₹{subtotal.toLocaleString()}</span>
                      </div>

                      {creditNoteForm.type === 'COMPANY' && (
                        <>
                          {isInterState ? (
                            <div className="flex justify-between text-gray-600">
                              <span>IGST Credit (18% - Inter-State):</span>
                              <span className="font-medium text-gray-900">₹{taxes.igst.toLocaleString()}</span>
                            </div>
                          ) : (
                            <>
                              <div className="flex justify-between text-gray-600">
                                <span>CGST Credit (9% - Karnataka):</span>
                                <span className="font-medium text-gray-900">₹{taxes.cgst.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-gray-600">
                                <span>SGST Credit (9% - Karnataka):</span>
                                <span className="font-medium text-gray-900">₹{taxes.sgst.toLocaleString()}</span>
                              </div>
                            </>
                          )}
                        </>
                      )}

                      {creditNoteForm.type === 'PERSONAL' && (
                        <div className="flex justify-between text-emerald-700">
                          <span>GST:</span>
                          <span className="font-medium">0%</span>
                        </div>
                      )}

                      <div className="flex justify-between text-base font-heading font-bold text-rose-900 border-t border-rose-200 pt-2 mt-2">
                        <span>Total Credit Note Amount:</span>
                        <span className="text-rose-700 font-bold">-₹{taxes.total.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Sticky Modal Footer */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white -mx-6 px-6 pb-1">
                <button
                  type="button"
                  onClick={() => setIsCreditNoteModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 active:bg-rose-800 shadow-sm transition-colors"
                >
                  {editingCreditNote ? 'Save Changes' : 'Issue Credit Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL: ADD / EDIT RECURRING RETAINER ======================= */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 sm:p-6">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-200">
            {/* Header (Sticky) */}
            <div className="px-6 py-4 border-b border-gray-200 bg-white flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-2xs">
                  <Repeat className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-heading font-bold text-gray-900">
                    {editingTemplate ? 'Edit Recurring Retainer Profile' : 'New Recurring Retainer Profile'}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Pre-configure client service items and schedule for 1-click monthly invoice generation.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-100 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveTemplate} className="flex-1 overflow-y-auto p-6 space-y-5">
              {templateError && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span>{templateError}</span>
                </div>
              )}

              {/* Retainer Details Overview */}
              <div className="bg-gray-50/70 p-4 rounded-xl border border-gray-200/80 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Retainer Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Monthly Performance Marketing Retainer"
                      value={templateForm.title || ''}
                      onChange={(e) => {
                        setTemplateForm({ ...templateForm, title: e.target.value });
                        if (templateError) setTemplateError(null);
                      }}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs font-medium"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      Client <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={templateForm.clientName || ''}
                      onChange={(e) => {
                        setTemplateForm({ ...templateForm, clientName: e.target.value });
                        if (templateError) setTemplateError(null);
                      }}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs font-medium"
                    >
                      <option value="">Select client...</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Invoice Type, Frequency, Day of Month */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-gray-200/80">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Invoice Type</label>
                    <select
                      value={templateForm.type || 'COMPANY'}
                      onChange={(e) =>
                        setTemplateForm({ ...templateForm, type: e.target.value as 'COMPANY' | 'PERSONAL' })
                      }
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs font-medium"
                    >
                      <option value="COMPANY">Company</option>
                      <option value="PERSONAL">Personal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Billing Frequency</label>
                    <select
                      value={templateForm.frequency || 'Monthly'}
                      onChange={(e) =>
                        setTemplateForm({
                          ...templateForm,
                          frequency: e.target.value as 'Monthly' | 'Quarterly' | 'Yearly',
                        })
                      }
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs font-medium"
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Quarterly">Quarterly</option>
                      <option value="Yearly">Yearly</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Billing Day of Month</label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={templateForm.dayOfMonth || 1}
                      onChange={(e) => setTemplateForm({ ...templateForm, dayOfMonth: parseInt(e.target.value) || 1 })}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Pre-configured Line Items Table */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="text-sm font-heading font-bold text-gray-900">
                    Pre-configured Line Items
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      const items = templateForm.items || [];
                      setTemplateForm({
                        ...templateForm,
                        items: [
                          ...items,
                          { id: `item-${Date.now()}`, desc: '', units: 1, rate: 0, sac: '998311' },
                        ],
                      });
                    }}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 px-2.5 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Line Item
                  </button>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-100/70 border-b border-gray-200 text-[11px] font-heading font-semibold text-gray-600 uppercase tracking-wider">
                          <th className="py-2.5 px-3 min-w-[240px]">Description</th>
                          <th className="py-2.5 px-2.5 w-24 text-center">SAC Code</th>
                          <th className="py-2.5 px-2.5 w-20 text-center">Units</th>
                          <th className="py-2.5 px-2.5 w-32 text-right">Rate (₹)</th>
                          <th className="py-2.5 px-3 w-32 text-right">Amount (₹)</th>
                          <th className="py-2.5 px-2 w-10 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {(templateForm.items || []).map((it, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-2">
                              <input
                                type="text"
                                placeholder="Service description..."
                                value={it.desc}
                                onChange={(e) => {
                                  const next = [...(templateForm.items || [])];
                                  next[idx].desc = e.target.value;
                                  setTemplateForm({ ...templateForm, items: next });
                                }}
                                className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                placeholder="998311"
                                value={it.sac || ''}
                                onChange={(e) => {
                                  const next = [...(templateForm.items || [])];
                                  next[idx].sac = e.target.value;
                                  setTemplateForm({ ...templateForm, items: next });
                                }}
                                className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 bg-white font-mono text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                min={1}
                                value={it.units}
                                onChange={(e) => {
                                  const next = [...(templateForm.items || [])];
                                  next[idx].units = parseInt(e.target.value) || 1;
                                  setTemplateForm({ ...templateForm, items: next });
                                }}
                                className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 bg-white text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                value={it.rate}
                                onChange={(e) => {
                                  const next = [...(templateForm.items || [])];
                                  next[idx].rate = parseInt(e.target.value) || 0;
                                  setTemplateForm({ ...templateForm, items: next });
                                }}
                                className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 bg-white text-right font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </td>
                            <td className="p-2 text-right font-semibold text-xs text-gray-900 whitespace-nowrap">
                              ₹{((it.units || 1) * (it.rate || 0)).toLocaleString()}
                            </td>
                            <td className="p-2 text-center">
                              {(templateForm.items || []).length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = (templateForm.items || []).filter((_, i) => i !== idx);
                                    setTemplateForm({ ...templateForm, items: next });
                                  }}
                                  className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
                                  title="Remove item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Lower Section: 2 Columns for Notes and Financial Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Notes / Standard Terms
                  </label>
                  <textarea
                    rows={4}
                    placeholder="e.g. Due within 7 days of invoice date"
                    value={templateForm.notes || ''}
                    onChange={(e) => setTemplateForm({ ...templateForm, notes: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none shadow-2xs"
                  />
                </div>

                {/* Calculation Summary Card */}
                {(() => {
                  const subtotal = (templateForm.items || []).reduce(
                    (sum, it) => sum + (it.units || 1) * (it.rate || 0),
                    0
                  );
                  const matchedClient = clients.find(
                    (c) => c.name.toLowerCase() === templateForm.clientName?.toLowerCase()
                  );
                  const isInterState =
                    templateForm.isInterState !== undefined
                      ? templateForm.isInterState
                      : !isKarnatakaLocation(matchedClient);
                  const taxes = calculateTaxes(subtotal, templateForm.type || 'COMPANY', isInterState);

                  return (
                    <div className="bg-gray-50/80 rounded-xl border border-gray-200 p-4 space-y-2 text-xs">
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal:</span>
                        <span className="font-medium text-gray-900">₹{subtotal.toLocaleString()}</span>
                      </div>
                      {templateForm.type === 'COMPANY' && (
                        <>
                          {isInterState ? (
                            <div className="flex justify-between text-gray-600">
                              <span>IGST (18% - Inter-State):</span>
                              <span className="font-medium text-gray-900">₹{taxes.igst.toLocaleString()}</span>
                            </div>
                          ) : (
                            <>
                              <div className="flex justify-between text-gray-600">
                                <span>CGST (9% - Karnataka):</span>
                                <span className="font-medium text-gray-900">₹{taxes.cgst.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-gray-600">
                                <span>SGST (9% - Karnataka):</span>
                                <span className="font-medium text-gray-900">₹{taxes.sgst.toLocaleString()}</span>
                              </div>
                            </>
                          )}
                        </>
                      )}
                      {templateForm.type === 'PERSONAL' && (
                        <div className="flex justify-between text-emerald-700">
                          <span>GST:</span>
                          <span className="font-medium">0%</span>
                        </div>
                      )}
                      <div className="flex justify-between text-base font-heading font-bold text-gray-900 border-t border-gray-200 pt-2 mt-2">
                        <span>Monthly Retainer Amount:</span>
                        <span className="text-indigo-600 font-bold">₹{taxes.total.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Sticky Modal Footer */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white -mx-6 px-6 pb-1">
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 active:bg-indigo-800 shadow-sm transition-colors"
                >
                  {editingTemplate ? 'Save Changes' : 'Create Retainer Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceList;
