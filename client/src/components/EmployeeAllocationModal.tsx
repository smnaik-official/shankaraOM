import React, { useState } from 'react';
import {
  X,
  Users,
  Plus,
  Trash2,
  Check,
  Building,
  AlertCircle,
} from 'lucide-react';
import {
  EmployeeCostAllocation,
  getStoredEmployeeAllocations,
  saveStoredEmployeeAllocations,
} from '../data/clientProfitability';
import { getStoredEmployees, Employee } from './Employees';
import { getStoredClients, Client } from './ClientList';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const EmployeeAllocationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [allocations, setAllocations] = useState<EmployeeCostAllocation[]>(() =>
    getStoredEmployeeAllocations()
  );
  const [employees] = useState<Employee[]>(() => getStoredEmployees());
  const [clients] = useState<Client[]>(() => getStoredClients());

  // New allocation form state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newEmployeeId, setNewEmployeeId] = useState('');
  const [newClientId, setNewClientId] = useState('');
  const [newPercentage, setNewPercentage] = useState<number>(20);
  const [newNotes, setNewNotes] = useState('');
  const [formError, setFormError] = useState('');

  if (!isOpen) return null;

  const handleUpdatePercentage = (id: string, newPct: number) => {
    const val = Math.max(0, Math.min(100, newPct));
    setAllocations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, allocationPercentage: val } : a))
    );
  };

  const handleDeleteAllocation = (id: string) => {
    setAllocations((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAddAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployeeId || !newClientId) {
      setFormError('Please select both an employee and a client.');
      return;
    }

    const emp = employees.find((e) => e.id === newEmployeeId);
    const client = clients.find((c) => c.id === newClientId);

    if (!emp || !client) {
      setFormError('Invalid selection.');
      return;
    }

    // Check if this pair already exists
    const exists = allocations.some(
      (a) => a.employeeId === newEmployeeId && a.clientId === newClientId
    );
    if (exists) {
      setFormError('An allocation for this employee and client already exists.');
      return;
    }

    const newAlloc: EmployeeCostAllocation = {
      id: `alloc-${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.name,
      employeeRole: emp.role,
      clientId: client.id,
      clientName: client.name,
      allocationPercentage: newPercentage,
      notes: newNotes,
    };

    setAllocations((prev) => [...prev, newAlloc]);
    setIsAddingNew(false);
    setNewEmployeeId('');
    setNewClientId('');
    setNewPercentage(20);
    setNewNotes('');
    setFormError('');
  };

  const handleSaveAll = () => {
    saveStoredEmployeeAllocations(allocations);
    onSaved();
    onClose();
  };

  // Group allocations by client for clean viewing
  const clientGroups = clients.map((c) => ({
    client: c,
    items: allocations.filter((a) => a.clientId === c.id || a.clientName === c.name),
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-hidden animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[88vh] flex flex-col border border-gray-100 overflow-hidden">
        {/* Pinned Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-indigo-50/40 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-tight">
                Employee Cost Allocations
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Allocate employee time (%) across clients to calculate accurate direct staffing costs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isAddingNew && (
              <button
                type="button"
                onClick={() => setIsAddingNew(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Allocation</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Add New Allocation Form */}
          {isAddingNew && (
            <form
              onSubmit={handleAddAllocation}
              className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-4 space-y-3 animate-in fade-in duration-150"
            >
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                  New Employee Allocation
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Select Employee *
                  </label>
                  <select
                    value={newEmployeeId}
                    onChange={(e) => setNewEmployeeId(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">-- Choose Employee --</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.role} - ₹{emp.grossSalary.toLocaleString()}/mo)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Select Client *
                  </label>
                  <select
                    value={newClientId}
                    onChange={(e) => setNewClientId(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">-- Choose Client --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Allocation Percentage (%) *
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={newPercentage}
                      onChange={(e) => setNewPercentage(Number(e.target.value))}
                      required
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white"
                    />
                    <span className="text-gray-500 font-semibold">%</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-700 font-semibold mb-1">
                  Scope / Work Remarks (Optional)
                </label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Social media creatives and reels branding"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-sm"
                >
                  Confirm Allocation
                </button>
              </div>
            </form>
          )}

          {/* Grouped Allocations by Client */}
          <div className="space-y-4">
            {clientGroups.map(({ client, items }) => (
              <div
                key={client.id}
                className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs"
              >
                <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-gray-900">{client.name}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-gray-500">
                    {items.length} employee{items.length === 1 ? '' : 's'} assigned
                  </span>
                </div>

                {items.length === 0 ? (
                  <p className="p-4 text-xs text-gray-400 text-center italic">
                    No team members allocated to {client.name} yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50/50 text-gray-500 uppercase text-[10px] border-b border-gray-100">
                        <tr>
                          <th className="py-2 px-4 font-semibold">Employee</th>
                          <th className="py-2 px-4 font-semibold">Role</th>
                          <th className="py-2 px-4 font-semibold text-right">Gross Monthly</th>
                          <th className="py-2 px-4 font-semibold text-center w-36">Allocation %</th>
                          <th className="py-2 px-4 font-semibold text-right">Monthly Cost</th>
                          <th className="py-2 px-4 font-semibold text-center w-12">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {items.map((alloc) => {
                          const emp = employees.find((e) => e.id === alloc.employeeId);
                          const gross = emp?.grossSalary || 25000;
                          const monthlyCost = Math.round((alloc.allocationPercentage / 100) * gross);

                          return (
                            <tr key={alloc.id} className="hover:bg-gray-50/40">
                              <td className="py-2.5 px-4 font-semibold text-gray-900">
                                {alloc.employeeName}
                              </td>
                              <td className="py-2.5 px-4 text-gray-600">{alloc.employeeRole}</td>
                              <td className="py-2.5 px-4 text-right text-gray-600">
                                ₹{gross.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                <div className="inline-flex items-center gap-1.5 justify-center">
                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={alloc.allocationPercentage}
                                    onChange={(e) =>
                                      handleUpdatePercentage(alloc.id, Number(e.target.value))
                                    }
                                    className="w-16 px-2 py-1 border border-gray-300 rounded text-center font-bold text-indigo-700 bg-indigo-50/40"
                                  />
                                  <span className="text-gray-500 font-semibold">%</span>
                                </div>
                              </td>
                              <td className="py-2.5 px-4 text-right font-bold text-gray-900">
                                ₹{monthlyCost.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAllocation(alloc.id)}
                                  className="p-1 text-gray-400 hover:text-rose-600 transition-colors"
                                  title="Remove allocation"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Pinned Footer */}
        <div className="px-6 py-3.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between flex-shrink-0">
          <p className="text-[11px] text-gray-500">
            Changes directly update client direct costs and profitability contribution margins.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-100"
            >
              <Check className="w-4 h-4" />
              <span>Save & Apply Allocations</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeAllocationModal;
