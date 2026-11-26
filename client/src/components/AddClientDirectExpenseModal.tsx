import React, { useState } from 'react';
import { X, CreditCard, AlertCircle } from 'lucide-react';
import {
  ClientDirectExpense,
  DirectExpenseCategory,
  getStoredClientDirectExpenses,
  saveStoredClientDirectExpenses,
} from '../data/clientProfitability';
import { getStoredClients, Client } from './ClientList';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const CATEGORIES: DirectExpenseCategory[] = [
  'Freelancer',
  'Outsourcing',
  'Client Software',
  'Ad Spend',
  'Travel',
  'Project Expense',
  'Other',
];

export const AddClientDirectExpenseModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [clients] = useState<Client[]>(() => getStoredClients());
  const [clientId, setClientId] = useState('');
  const [category, setCategory] = useState<DirectExpenseCategory>('Freelancer');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [vendorOrPerson, setVendorOrPerson] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      setError('Please select a client.');
      return;
    }
    if (!description.trim()) {
      setError('Please provide an expense description.');
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    const matchedClient = clients.find((c) => c.id === clientId);

    const newExpense: ClientDirectExpense = {
      id: `cde-${Date.now()}`,
      clientId,
      clientName: matchedClient?.name || 'Client',
      category,
      description: description.trim(),
      amount: numAmount,
      date,
      vendorOrPerson: vendorOrPerson.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    const existing = getStoredClientDirectExpenses();
    saveStoredClientDirectExpenses([newExpense, ...existing]);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-hidden animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[88vh] flex flex-col border border-gray-100 overflow-hidden">
        {/* Pinned Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-indigo-50/40 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-tight">
                Record Direct Client Expense
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Associate project-specific costs (Freelancers, software, travel) to a client.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Client Account *
            </label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">-- Select Client --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Expense Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DirectExpenseCategory)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Expense Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Description / Deliverable *
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Freelance 3D packaging rendering, Copywriting..."
              required
              className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Amount (INR, Ex-GST) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-gray-500">₹</span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 7500"
                  required
                  className="w-full pl-7 pr-3 py-2 text-xs rounded-lg border border-gray-300 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Vendor / Contractor Name
              </label>
              <input
                type="text"
                value={vendorOrPerson}
                onChange={(e) => setVendorOrPerson(e.target.value)}
                placeholder="e.g. Devraj 3D Studio"
                className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Notes & Project Reference (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Details on contract, project deliverable, or client signoff..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 bg-white"
            />
          </div>

          {/* Form Action */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm shadow-indigo-100"
            >
              Record Direct Cost
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddClientDirectExpenseModal;
