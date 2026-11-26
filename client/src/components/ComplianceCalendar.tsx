import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Search,
  Building,
  User,
  Trash2,
  X,
  Edit2,
  Download,
} from 'lucide-react';
import {
  ComplianceItem,
  ComplianceEntity,
  getStoredCompliances,
  markComplianceAsCompleted,
  markComplianceAsPending,
  addCustomCompliance,
  deleteCompliance,
  updateCompliance,
} from '../data/compliance';
import { formatDateDMY } from '../utils/date';

export const ComplianceCalendar: React.FC = () => {
  // Compliances state
  const [compliances, setCompliances] = useState<ComplianceItem[]>(() => getStoredCompliances());

  // Reload compliances on event
  useEffect(() => {
    const handleUpdate = () => {
      setCompliances(getStoredCompliances());
    };
    window.addEventListener('compliance_updated', handleUpdate);
    return () => window.removeEventListener('compliance_updated', handleUpdate);
  }, []);

  // Filter States
  const [entityFilter, setEntityFilter] = useState<'all' | ComplianceEntity>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ComplianceItem | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formEntity, setFormEntity] = useState<ComplianceEntity>('company');
  const [formDueDate, setFormDueDate] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormCode('');
    setFormEntity('company');
    setFormDueDate('');
    setFormDescription('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ComplianceItem) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormCode(item.code);
    setFormEntity(item.entity);
    setFormDueDate(item.dueDate);
    setFormDescription(item.description);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDueDate) return;

    if (editingItem) {
      updateCompliance(editingItem.id, {
        title: formTitle.trim(),
        code: formCode.trim() || formTitle.trim().slice(0, 8).toUpperCase(),
        entity: formEntity,
        entityName: formEntity === 'company' ? 'M/s Shankara Online Solutions LLP' : 'Manjunath Naik S',
        dueDate: formDueDate,
        description: formDescription.trim(),
      });
    } else {
      addCustomCompliance({
        title: formTitle.trim(),
        code: formCode.trim() || formTitle.trim().slice(0, 8).toUpperCase(),
        entity: formEntity,
        entityName: formEntity === 'company' ? 'M/s Shankara Online Solutions LLP' : 'Manjunath Naik S',
        category: 'OTHER',
        frequency: 'one_time',
        dueDate: formDueDate,
        periodCovered: 'FY 2026-27',
        statutoryAct: 'Statutory Compliance',
        description: formDescription.trim(),
        statutoryLateFeesOrPenalty: 'Statutory late fees apply if filed past deadline',
        portalName: 'Official Portal',
        portalUrl: '',
      });
    }
    setIsModalOpen(false);
  };

  // One-click Toggle Status
  const handleToggleStatus = (item: ComplianceItem) => {
    if (item.status === 'completed') {
      markComplianceAsPending(item.id);
    } else {
      markComplianceAsCompleted(item.id, {
        filedDate: '2026-11-23',
        remarks: 'Marked completed by user',
      });
    }
  };

  // Filtered Compliances
  const filteredCompliances = useMemo(() => {
    return compliances
      .filter((item) => {
        // Entity Filter
        if (entityFilter !== 'all' && item.entity !== entityFilter) return false;

        // Status Filter
        if (statusFilter === 'pending') {
          if (item.status === 'completed') return false;
        } else if (statusFilter === 'completed') {
          if (item.status !== 'completed') return false;
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchCode = item.code.toLowerCase().includes(q);
          const matchDesc = item.description.toLowerCase().includes(q);
          if (!matchTitle && !matchCode && !matchDesc) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Incompleted first, then by due date
        if (a.status === 'completed' && b.status !== 'completed') return 1;
        if (a.status !== 'completed' && b.status === 'completed') return -1;
        return a.dueDate.localeCompare(b.dueDate);
      });
  }, [compliances, entityFilter, statusFilter, searchQuery]);

  // Counts for entity filter tabs
  const counts = useMemo(() => {
    const total = compliances.length;
    const company = compliances.filter((c) => c.entity === 'company').length;
    const individual = compliances.filter((c) => c.entity === 'individual').length;
    const pending = compliances.filter((c) => c.status !== 'completed').length;
    const completed = compliances.filter((c) => c.status === 'completed').length;
    return { total, company, individual, pending, completed };
  }, [compliances]);

  // Export clean CSV
  const handleExportCSV = () => {
    const headers = ['Compliance Code', 'Compliance Name', 'Entity', 'Deadline', 'Status', 'Completed Date'];
    const rows = filteredCompliances.map((c) => [
      c.code,
      c.title,
      c.entity === 'company' ? 'Company (LLP)' : 'Individual',
      c.dueDate,
      c.status.toUpperCase(),
      c.filingDetails?.filedDate || '-',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [['Compliance Deadlines & Status List'], [`Exported on: ${formatDateDMY('2026-11-23')}`], [], headers, ...rows]
        .map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Compliance-List-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-heading font-bold text-gray-900 tracking-tight">
              Compliance Calendar
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              Deadlines & Status
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Track statutory deadlines and filing status for your company and individual profile.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors shadow-xs cursor-pointer"
            title="Export compliances as CSV"
          >
            <Download className="w-3.5 h-3.5 text-gray-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-all shadow-xs shadow-indigo-100 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Compliance</span>
          </button>
        </div>
      </div>

      {/* 2. Filters & Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-gray-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Entity Tabs (All / Company / Individual) */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-gray-100 p-1 rounded-xl flex items-center">
            <button
              onClick={() => setEntityFilter('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                entityFilter === 'all'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Entities ({counts.total})
            </button>
            <button
              onClick={() => setEntityFilter('company')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                entityFilter === 'company'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Building className="w-3.5 h-3.5 text-indigo-600" />
              <span>Company ({counts.company})</span>
            </button>
            <button
              onClick={() => setEntityFilter('individual')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                entityFilter === 'individual'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="w-3.5 h-3.5 text-purple-600" />
              <span>Individual ({counts.individual})</span>
            </button>
          </div>

          {/* Status Segment (All / Pending / Completed) */}
          <div className="bg-gray-100 p-1 rounded-xl flex items-center">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Status
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pending ({counts.pending})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                statusFilter === 'completed'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Completed ({counts.completed})
            </button>
          </div>
        </div>

        {/* Right: Search Box */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search compliances..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* 3. The Compliances List Table */}
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/80 text-gray-500 uppercase text-[10px] tracking-wider border-b border-gray-200">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Compliance</th>
                <th className="py-3.5 px-4 font-semibold">Applicable For</th>
                <th className="py-3.5 px-4 font-semibold">Deadline</th>
                <th className="py-3.5 px-4 font-semibold text-center">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCompliances.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400 italic">
                    No compliances match your selected filter or search.
                  </td>
                </tr>
              ) : (
                filteredCompliances.map((item) => {
                  const isCompleted = item.status === 'completed';
                  const isOverdue = item.status === 'overdue';
                  const isDueSoon = item.status === 'due_soon';

                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors ${
                        isCompleted
                          ? 'bg-emerald-50/20 hover:bg-emerald-50/40 text-gray-500'
                          : isOverdue
                          ? 'bg-rose-50/20 hover:bg-rose-50/40 text-gray-900'
                          : 'hover:bg-gray-50/60 text-gray-900'
                      }`}
                    >
                      {/* Compliance Name & Code */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-xs">
                            {item.title}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                            {item.code}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1 max-w-lg">
                            {item.description}
                          </p>
                        )}
                      </td>

                      {/* Applicable For */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {item.entity === 'company' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            <Building className="w-3 h-3 text-indigo-500" />
                            <span>Company (LLP)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            <User className="w-3 h-3 text-purple-500" />
                            <span>Individual</span>
                          </span>
                        )}
                      </td>

                      {/* Deadline Date */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-gray-900">
                          {formatDateDMY(item.dueDate)}
                        </div>
                        <div className="text-[10px] mt-0.5">
                          {isCompleted ? (
                            <span className="text-emerald-600 font-semibold">
                              Completed on {formatDateDMY(item.filingDetails?.filedDate || item.dueDate)}
                            </span>
                          ) : isOverdue ? (
                            <span className="text-rose-600 font-bold">
                              Overdue by {item.daysOverdue} days
                            </span>
                          ) : isDueSoon ? (
                            <span className="text-amber-600 font-bold">
                              Due in {item.daysUntilDue} days
                            </span>
                          ) : (
                            <span className="text-gray-400 font-medium">
                              {item.periodCovered || 'Upcoming'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Completed</span>
                          </span>
                        ) : isOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Overdue</span>
                          </span>
                        ) : isDueSoon ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Due Soon</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-100 text-gray-600">
                            <span>Pending</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Mark Done / Revert button */}
                          <button
                            onClick={() => handleToggleStatus(item)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                              isCompleted
                                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs'
                            }`}
                          >
                            {isCompleted ? 'Mark Pending' : 'Mark Done'}
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit deadline"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete (custom compliances) */}
                          {item.isCustom && (
                            <button
                              onClick={() => {
                                if (confirm(`Delete "${item.title}"?`)) {
                                  deleteCompliance(item.id);
                                }
                              }}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                              title="Delete compliance"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* 4. Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200">
            <div className="bg-indigo-600 px-5 py-3.5 text-white flex items-center justify-between">
              <h3 className="font-heading font-bold text-sm">
                {editingItem ? 'Edit Compliance' : 'Add Compliance'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Compliance Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GSTR-3B Monthly Return"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Code / Form
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. GSTR-3B"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-sans"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">
                    Applicable For *
                  </label>
                  <select
                    value={formEntity}
                    onChange={(e) => setFormEntity(e.target.value as ComplianceEntity)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-bold"
                  >
                    <option value="company">Company (LLP)</option>
                    <option value="individual">Individual</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Deadline (Due Date) *
                </label>
                <input
                  type="date"
                  required
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-sans"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Description / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief note about return, challan or payment..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-sans"
                />
              </div>

              <div className="pt-2 border-t border-gray-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-xs cursor-pointer"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceCalendar;
