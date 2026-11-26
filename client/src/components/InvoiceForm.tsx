import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Repeat, CheckCircle2, Zap } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getStoredClients, Client } from './ClientList';
import { formatDateDMY } from '../utils/date';
import { isKarnatakaLocation, calculateTaxes } from '../utils/gst';
import {
  Invoice,
  InvoiceLineItem,
  RecurringInvoiceTemplate,
  getStoredInvoices,
  saveStoredInvoices,
  getStoredRecurringTemplates,
  saveStoredRecurringTemplates,
  getNextInvoiceNumber,
} from '../data/invoices';

const InvoiceForm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [clients] = useState<Client[]>(() => getStoredClients());
  const [recurringTemplates] = useState<RecurringInvoiceTemplate[]>(() => getStoredRecurringTemplates());

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [type, setType] = useState<'COMPANY' | 'PERSONAL'>('COMPANY');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState<string>('');
  const [saveAsRecurring, setSaveAsRecurring] = useState<boolean>(false);
  const [recurringTitle, setRecurringTitle] = useState<string>('');
  const [isInterStateOverride, setIsInterStateOverride] = useState<boolean | null>(null);

  const [items, setItems] = useState<InvoiceLineItem[]>([
    { id: '1', desc: '', sac: '998311', units: 1, rate: 0 },
  ]);

  // Pre-fill from converted Proposal or query parameters
  useEffect(() => {
    const clientParam = searchParams.get('client');
    const descParam = searchParams.get('desc');
    const rateParam = searchParams.get('rate');
    const typeParam = searchParams.get('type');

    if (clientParam) setSelectedClient(clientParam);
    if (typeParam === 'COMPANY' || typeParam === 'PERSONAL') setType(typeParam);
    if (descParam || rateParam) {
      setItems([
        {
          id: '1',
          desc: descParam || '',
          sac: '998311',
          units: 1,
          rate: rateParam ? Number(rateParam) : 0,
        },
      ]);
    }
  }, [searchParams]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const currentClientObj = React.useMemo(() => {
    return clients.find((c) => c.name.toLowerCase() === selectedClient.toLowerCase());
  }, [clients, selectedClient]);

  const isInterState = React.useMemo(() => {
    if (isInterStateOverride !== null) return isInterStateOverride;
    if (!currentClientObj) return false;
    return !isKarnatakaLocation(currentClientObj);
  }, [currentClientObj, isInterStateOverride]);

  // 1-Click Load from Recurring Template
  const handleLoadTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;

    const t = recurringTemplates.find((rec) => rec.id === templateId);
    if (!t) return;

    setType(t.type);
    setSelectedClient(t.clientName);
    setNotes(t.notes || '');
    if (t.isInterState !== undefined) {
      setIsInterStateOverride(t.isInterState);
    } else {
      setIsInterStateOverride(null);
    }
    if (t.items && t.items.length > 0) {
      setItems(
        t.items.map((it, idx) => ({
          id: String(idx + 1),
          desc: it.desc,
          sac: it.sac || '998311',
          units: it.units || 1,
          rate: it.rate || 0,
        }))
      );
    }
    showToast(`Loaded details from "${t.title}"`);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      { id: String(Date.now()), desc: '', sac: '998311', units: 1, rate: 0 },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof InvoiceLineItem, value: string | number) => {
    const next = [...items];
    next[index] = { ...next[index], [field]: value };
    setItems(next);
  };

  const subtotal = items.reduce((acc, item) => acc + (item.units * item.rate), 0);
  const taxes = React.useMemo(() => {
    return calculateTaxes(subtotal, type, isInterState);
  }, [subtotal, type, isInterState]);
  const total = taxes.total;

  // Save Invoice & Navigate to /invoices
  const handleSaveInvoice = (status: 'Paid' | 'Pending' | 'Draft' = 'Pending') => {
    if (!selectedClient) {
      alert('Please select or specify a Client.');
      return;
    }
    if (items.length === 0 || !items.some((it) => it.desc.trim() && it.rate > 0)) {
      alert('Please enter at least one line item with description and rate.');
      return;
    }

    const currentInvoices = getStoredInvoices();
    const newInvoiceNumber = getNextInvoiceNumber(currentInvoices, invoiceDate);

    const newInvoice: Invoice = {
      id: newInvoiceNumber,
      client: selectedClient,
      date: invoiceDate,
      type,
      items: items.filter((it) => it.desc.trim()),
      subtotal,
      gst: taxes.totalGst,
      cgst: taxes.cgst,
      sgst: taxes.sgst,
      igst: taxes.igst,
      isInterState,
      amount: total,
      status,
      recurringTemplateId: selectedTemplateId || undefined,
      notes: notes || undefined,
    };

    const updatedInvoices = [newInvoice, ...currentInvoices];
    saveStoredInvoices(updatedInvoices);

    // If checkbox to save as recurring retainer was ticked
    if (saveAsRecurring) {
      const currentTemplates = getStoredRecurringTemplates();
      const newTemplate: RecurringInvoiceTemplate = {
        id: `rec-inv-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        title: recurringTitle.trim() || `Monthly Retainer - ${selectedClient}`,
        clientName: selectedClient,
        type,
        frequency: 'Monthly',
        dayOfMonth: parseInt(invoiceDate.split('-')[2]) || 1,
        items: items.filter((it) => it.desc.trim()),
        subtotal,
        gst: taxes.totalGst,
        cgst: taxes.cgst,
        sgst: taxes.sgst,
        igst: taxes.igst,
        isInterState,
        total,
        isActive: true,
        notes: notes || '',
      };
      saveStoredRecurringTemplates([newTemplate, ...currentTemplates]);
    }

    navigate('/invoices');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-gray-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-xl border border-gray-800 transition-all animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/invoices"
            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-heading font-bold text-gray-900">Create New Invoice</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Generate client invoice with automatic numbering, tax calculations, and PDF download.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Template Auto-Fill Banner */}
      {recurringTemplates.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="text-sm font-heading font-bold text-indigo-950">
                1-Click Load from Recurring Retainer
              </div>
              <div className="text-xs text-indigo-700/80">
                Instantly populate client, billing type, items, and rates without re-typing.
              </div>
            </div>
          </div>

          <div className="w-full sm:w-auto">
            <select
              value={selectedTemplateId}
              onChange={(e) => handleLoadTemplate(e.target.value)}
              className="w-full sm:w-72 bg-white border border-indigo-200 text-gray-800 text-xs font-medium rounded-lg px-3 py-2 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">⚡ Select Recurring Retainer Profile...</option>
              {recurringTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.clientName} - {t.title} (₹{t.total.toLocaleString()})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Main Form Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
        {/* Billing Entity Type Selection */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-2">Billing Entity & Tax Mode</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="cursor-pointer">
              <input
                type="radio"
                name="type"
                className="peer sr-only"
                checked={type === 'COMPANY'}
                onChange={() => setType('COMPANY')}
              />
              <div className="p-4 border border-gray-200 rounded-xl text-left peer-checked:border-indigo-600 peer-checked:bg-indigo-50/70 peer-checked:text-indigo-950 transition-all hover:bg-gray-50/80">
                <div className="font-heading font-semibold text-sm">Company</div>
                <p className="text-xs text-gray-500 mt-1">Applies Incl. 18% (CGST/SGST), Company Bank & GSTIN</p>
              </div>
            </label>

            <label className="cursor-pointer">
              <input
                type="radio"
                name="type"
                className="peer sr-only"
                checked={type === 'PERSONAL'}
                onChange={() => setType('PERSONAL')}
              />
              <div className="p-4 border border-gray-200 rounded-xl text-left peer-checked:border-indigo-600 peer-checked:bg-indigo-50/70 peer-checked:text-indigo-950 transition-all hover:bg-gray-50/80">
                <div className="font-heading font-semibold text-sm">Personal</div>
                <p className="text-xs text-gray-500 mt-1">Non-GST invoice, Personal Bank Details & UPI</p>
              </div>
            </label>
          </div>
        </div>

        {/* Client & Date Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Client / Customer <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedClient}
              onChange={(e) => {
                setSelectedClient(e.target.value);
                setIsInterStateOverride(null);
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select a client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-700">Invoice Date</label>
              <span className="text-xs text-indigo-600 font-semibold">{formatDateDMY(invoiceDate)}</span>
            </div>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* GST Place of Supply & Tax Rate Rule Indicator */}
        {type === 'COMPANY' && selectedClient && (
          <div className={`p-3.5 rounded-xl border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            isInterState 
              ? 'bg-amber-50/70 border-amber-200 text-amber-900' 
              : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
          }`}>
            <div className="flex items-start gap-2.5">
              <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${isInterState ? 'bg-amber-500' : 'bg-emerald-500'}`} />
              <div>
                <div className="font-heading font-bold text-xs flex items-center gap-2">
                  <span>Place of Supply: {isInterState ? 'Outside Karnataka (Inter-State)' : 'Karnataka (Intra-State)'}</span>
                  <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                    isInterState ? 'bg-amber-200 text-amber-900' : 'bg-emerald-200 text-emerald-900'
                  }`}>
                    {isInterState ? '18% IGST' : '9% CGST + 9% SGST'}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] opacity-90">
                  {isInterState
                    ? `Client is located outside Karnataka (${currentClientObj?.state || currentClientObj?.gstin?.substring(0, 2) ? `State Code: ${currentClientObj?.gstin?.substring(0, 2) || currentClientObj?.state}` : 'Inter-State'}). 18% IGST is charged (No CGST / SGST).`
                    : `Client is located within Karnataka (State Code: 29). 9% CGST + 9% SGST is charged (No IGST).`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsInterStateOverride(!isInterState)}
                className={`text-[11px] font-semibold underline hover:opacity-80 transition-opacity ${
                  isInterState ? 'text-amber-800' : 'text-emerald-800'
                }`}
              >
                {isInterState ? 'Switch to Intra-State (KA)' : 'Switch to Inter-State (Outside KA)'}
              </button>
              {isInterStateOverride !== null && (
                <button
                  type="button"
                  onClick={() => setIsInterStateOverride(null)}
                  className="text-[10px] bg-white/80 border border-current px-1.5 py-0.5 rounded text-gray-700 hover:bg-white"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        )}

        {/* Line Items */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-heading font-bold text-gray-900">Line Items & Services</h3>
            <button
              type="button"
              onClick={handleAddItem}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add Item
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row gap-3 items-end bg-gray-50/70 p-3 rounded-xl border border-gray-200"
              >
                <div className="flex-1 w-full">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                  <input
                    type="text"
                    value={item.desc}
                    onChange={(e) => updateItem(index, 'desc', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. Monthly Performance Marketing Retainer"
                  />
                </div>

                <div className="w-full sm:w-24">
                  <label className="block text-xs font-medium text-gray-500 mb-1">SAC Code</label>
                  <input
                    type="text"
                    value={item.sac || ''}
                    onChange={(e) => updateItem(index, 'sac', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="998311"
                  />
                </div>

                <div className="w-full sm:w-20">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Units</label>
                  <input
                    type="number"
                    min={1}
                    value={item.units}
                    onChange={(e) => updateItem(index, 'units', parseInt(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="w-full sm:w-32">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Rate (₹)</label>
                  <input
                    type="number"
                    value={item.rate}
                    onChange={(e) => updateItem(index, 'rate', parseInt(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="w-full sm:w-32">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Amount</label>
                  <div className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg font-semibold text-sm text-gray-800">
                    ₹{(item.units * item.rate).toLocaleString()}
                  </div>
                </div>

                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove Item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Save as Recurring Template Checkbox */}
        <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={saveAsRecurring}
              onChange={(e) => setSaveAsRecurring(e.target.checked)}
              className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <div className="text-xs">
              <span className="font-heading font-bold text-indigo-950 flex items-center gap-1.5">
                <Repeat className="w-3.5 h-3.5 text-indigo-600" /> Save this invoice as a Monthly Recurring Retainer
              </span>
              <p className="text-indigo-700/80 mt-0.5">
                Next month, you won&apos;t have to re-key any of these details. You can generate it with 1-click from the Recurring Invoices tab.
              </p>
              {saveAsRecurring && (
                <div className="mt-2.5">
                  <label className="block text-[11px] font-semibold text-indigo-900 mb-1">
                    Retainer Profile Title
                  </label>
                  <input
                    type="text"
                    placeholder={`e.g. Monthly Retainer - ${selectedClient || 'Client'}`}
                    value={recurringTitle}
                    onChange={(e) => setRecurringTitle(e.target.value)}
                    className="w-full max-w-md bg-white border border-indigo-200 rounded-lg px-3 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>
          </label>
        </div>

        {/* Notes & Calculations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Payment Terms & Notes</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Payment due within 7 days. Bank transfer to account listed."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span className="font-medium text-gray-900">₹{subtotal.toLocaleString()}</span>
            </div>
            {type === 'COMPANY' && (
              <>
                {isInterState ? (
                  <div className="flex justify-between text-gray-600">
                    <span className="flex items-center gap-1.5">
                      <span>IGST (18%):</span>
                      <span className="text-[10px] font-medium bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                        Inter-State (Outside KA)
                      </span>
                    </span>
                    <span className="font-medium text-gray-900">₹{taxes.igst.toLocaleString()}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-gray-600">
                      <span className="flex items-center gap-1.5">
                        <span>CGST (9%):</span>
                        <span className="text-[10px] font-medium bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                          Karnataka
                        </span>
                      </span>
                      <span className="font-medium text-gray-900">₹{taxes.cgst.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span className="flex items-center gap-1.5">
                        <span>SGST (9%):</span>
                        <span className="text-[10px] font-medium bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                          Karnataka
                        </span>
                      </span>
                      <span className="font-medium text-gray-900">₹{taxes.sgst.toLocaleString()}</span>
                    </div>
                  </>
                )}
              </>
            )}
            {type === 'PERSONAL' && (
              <div className="flex justify-between text-emerald-700 text-xs">
                <span>GST:</span>
                <span className="font-medium">0%</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-heading font-bold text-gray-900 border-t border-gray-200 pt-2.5 mt-2">
              <span>Total Invoice Amount:</span>
              <span>₹{total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-end gap-3">
          <Link
            to="/invoices"
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium text-center transition-colors shadow-2xs"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={() => handleSaveInvoice('Pending')}
            className="w-full sm:w-auto px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium shadow-sm transition-colors"
          >
            Save & Generate Invoice
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceForm;
