import { useState, useMemo, useEffect } from 'react';
import { apiBatchSave } from '../services/api';
import {
  Plus,
  Edit,
  Trash2,
  Users,
  FileText,
  X,
  Search,
  Wallet,
  TrendingUp,
  Building,
  Phone,
  Calendar,
  AlertCircle,
  Download,
} from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { PayslipPDF } from './PayslipPDF';
import { formatDateDMY } from '../utils/date';

export interface Employee {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  address: string;
  pan: string;
  grossSalary: number;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  dateOfJoining: string;
}

export const STORAGE_KEY_EMPLOYEES = 'shankara_employees_data';

export const initialEmployees: Employee[] = [
  {
    id: '1',
    name: 'John Doe',
    role: 'Software Engineer',
    email: 'john@example.com',
    phone: '9876543210',
    address: '123 Tech Park, Bangalore',
    pan: 'ABCDE1234F',
    grossSalary: 85000,
    bankName: 'HDFC Bank',
    accountNumber: '1234567890',
    ifscCode: 'HDFC0001234',
    dateOfJoining: '2025-01-15',
  },
  {
    id: '2',
    name: 'Jane Smith',
    role: 'Designer',
    email: 'jane@example.com',
    phone: '9876543211',
    address: '456 Design Studio, Mumbai',
    pan: 'FGHIJ5678K',
    grossSalary: 75000,
    bankName: 'ICICI Bank',
    accountNumber: '0987654321',
    ifscCode: 'ICIC0005678',
    dateOfJoining: '2025-03-01',
  },
  {
    id: '3',
    name: 'Priya Sharma',
    role: 'Social Media Executive',
    email: 'priya@example.com',
    phone: '9876543212',
    address: 'Indiranagar 100ft Road, Bangalore',
    pan: 'JKLMN9012O',
    grossSalary: 25000,
    bankName: 'HDFC Bank',
    accountNumber: '5566778899',
    ifscCode: 'HDFC0004321',
    dateOfJoining: '2025-06-01',
  },
  {
    id: '4',
    name: 'Rohan Verma',
    role: 'Video Editor',
    email: 'rohan@example.com',
    phone: '9876543213',
    address: 'Koramangala 4th Block, Bangalore',
    pan: 'PQRST3456U',
    grossSalary: 20000,
    bankName: 'Kotak Mahindra Bank',
    accountNumber: '1122334455',
    ifscCode: 'KKBK0001122',
    dateOfJoining: '2025-07-15',
  },
  {
    id: '5',
    name: 'Ankit Patel',
    role: 'Ads Resource',
    email: 'ankit@example.com',
    phone: '9876543214',
    address: 'Whitefield Main Road, Bangalore',
    pan: 'VWXYZ7890A',
    grossSalary: 25000,
    bankName: 'Axis Bank',
    accountNumber: '9988776655',
    ifscCode: 'UTIB0009876',
    dateOfJoining: '2025-08-01',
  },
];

export const getStoredEmployees = (): Employee[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EMPLOYEES);
    if (!raw) return initialEmployees;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialEmployees;
  } catch {
    return initialEmployees;
  }
};

const Employees = () => {
  const [employees, setEmployees] = useState<Employee[]>(() => getStoredEmployees());
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newEmp, setNewEmp] = useState<Partial<Employee>>({});

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  // Payslip Modal State
  const [payslipEmployee, setPayslipEmployee] = useState<Employee | null>(null);
  const [payslipData, setPayslipData] = useState({
    month: new Date().toISOString().slice(0, 7),
    tds: 0,
    pt: 200,
  });

  // Save to localStorage whenever employees change & sync to Atlas
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(employees));
      apiBatchSave('employees', employees).catch(console.warn);
    } catch (e) {
      console.error('Failed to save employees:', e);
    }
  }, [employees]);

  // Distinct roles for filter
  const distinctRoles = useMemo(() => {
    return Array.from(new Set(employees.map((e) => e.role).filter(Boolean)));
  }, [employees]);

  // Aggregate Metrics
  const totalMonthlyPayroll = useMemo(() => {
    return employees.reduce((sum, emp) => sum + (Number(emp.grossSalary) || 0), 0);
  }, [employees]);

  const annualPayrollRunRate = useMemo(() => {
    return totalMonthlyPayroll * 12;
  }, [totalMonthlyPayroll]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (roleFilter !== 'All' && emp.role !== roleFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = emp.name.toLowerCase().includes(q);
        const matchRole = emp.role.toLowerCase().includes(q);
        const matchEmail = emp.email.toLowerCase().includes(q);
        const matchPhone = emp.phone.toLowerCase().includes(q);
        const matchPan = emp.pan.toLowerCase().includes(q);
        const matchSalary = emp.grossSalary.toString().includes(q);
        const matchBank = emp.bankName.toLowerCase().includes(q);
        const matchJoining = formatDateDMY(emp.dateOfJoining).toLowerCase().includes(q);

        if (!matchName && !matchRole && !matchEmail && !matchPhone && !matchPan && !matchSalary && !matchBank && !matchJoining) {
          return false;
        }
      }
      return true;
    });
  }, [employees, roleFilter, searchQuery]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmp.name || !newEmp.role) {
      alert('Please fill in Employee Name and Designation.');
      return;
    }

    const payload: Employee = {
      id: editingId || `EMP-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: newEmp.name.trim(),
      role: newEmp.role.trim(),
      email: (newEmp.email || '').trim(),
      phone: (newEmp.phone || '').trim(),
      address: (newEmp.address || '').trim(),
      pan: (newEmp.pan || '').trim().toUpperCase(),
      grossSalary: Number(newEmp.grossSalary || 0),
      bankName: (newEmp.bankName || '').trim(),
      accountNumber: (newEmp.accountNumber || '').trim(),
      ifscCode: (newEmp.ifscCode || '').trim().toUpperCase(),
      dateOfJoining: newEmp.dateOfJoining || new Date().toISOString().split('T')[0],
    };

    if (editingId) {
      setEmployees(employees.map((e) => (e.id === editingId ? payload : e)));
    } else {
      setEmployees([payload, ...employees]);
    }

    handleCancel();
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setNewEmp({});
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setNewEmp({
      dateOfJoining: new Date().toISOString().split('T')[0],
      grossSalary: 50000,
    });
    setIsAdding(true);
  };

  const handleEdit = (emp: Employee) => {
    setNewEmp({ ...emp });
    setEditingId(emp.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to remove this employee record?')) {
      setEmployees(employees.filter((e) => e.id !== id));
    }
  };

  const handleOpenPayslipModal = (emp: Employee) => {
    setPayslipEmployee(emp);
    setPayslipData({
      month: new Date().toISOString().slice(0, 7),
      tds: Math.round(emp.grossSalary * 0.05), // sensible default 5%
      pt: 200,
    });
  };

  // Helper for employee avatar initials
  const getInitials = (name: string) => {
    if (!name) return 'EM';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">Employees & Payroll</h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage team members, salary packages, bank credentials, and download monthly payslips.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenAdd}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 flex items-center gap-2 shadow-2xs hover:shadow-xs transition-all text-xs"
          >
            <Plus className="w-4 h-4" /> Add Employee
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Active Team */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
              Active Team Members
            </p>
            <p className="text-2xl font-heading font-bold text-gray-900">
              {employees.length} {employees.length === 1 ? 'Member' : 'Members'}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">Full-time & contracted staff</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Monthly Payroll */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
              Monthly Payroll Commitment
            </p>
            <p className="text-2xl font-heading font-bold text-gray-900">
              ₹{totalMonthlyPayroll.toLocaleString()}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">Total monthly gross expenditure</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        {/* Annual Payroll Run-Rate */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
              Annual Payroll Run-Rate
            </p>
            <p className="text-2xl font-heading font-bold text-gray-900">
              ₹{annualPayrollRunRate.toLocaleString()}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">12-month base salary forecast</p>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Search Bar & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, role, email, phone, or PAN..."
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

        {/* Role Filter & Counter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-700">
            <Building className="w-3.5 h-3.5 text-gray-500" />
            <select
              className="bg-transparent focus:outline-none cursor-pointer"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="All">All Designations</option>
              {distinctRoles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200 font-semibold whitespace-nowrap">
            {filteredEmployees.length} {filteredEmployees.length === 1 ? 'employee' : 'employees'}
          </span>
        </div>
      </div>

      {/* 4. Employees Roster Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/80 text-gray-600 font-semibold border-b border-gray-200 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Role & Joining</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Statutory (PAN)</th>
                <th className="py-3 px-4 text-right">Gross Salary</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-indigo-50/30 transition-colors">
                  {/* 1. Employee Name & Avatar */}
                  <td className="py-3.5 px-4 font-semibold text-gray-900">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                        {getInitials(emp.name)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-sm hover:text-indigo-600 transition-colors">
                          {emp.name}
                        </div>
                        <div className="text-[11px] text-gray-400 font-normal mt-0.5">{emp.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* 2. Role & Joining Date */}
                  <td className="py-3.5 px-4 text-gray-700">
                    <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-800 rounded font-semibold text-[11px]">
                      {emp.role}
                    </span>
                    {emp.dateOfJoining && (
                      <div className="text-[11px] text-gray-400 font-medium flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3 text-gray-400 shrink-0" />
                        <span>Joined: {formatDateDMY(emp.dateOfJoining)}</span>
                      </div>
                    )}
                  </td>

                  {/* 3. Contact Info */}
                  <td className="py-3.5 px-4 text-gray-700">
                    <div className="flex items-center gap-1.5 font-medium text-gray-800">
                      <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                      <span>{emp.phone || 'N/A'}</span>
                    </div>
                    {emp.address && (
                      <div className="text-[11px] text-gray-400 truncate max-w-[200px] mt-0.5" title={emp.address}>
                        {emp.address}
                      </div>
                    )}
                  </td>

                  {/* 4. PAN */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-mono text-xs text-gray-700 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded font-bold">
                      {emp.pan || 'N/A'}
                    </span>
                  </td>

                  {/* 5. Gross Salary */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="font-heading font-bold text-gray-900 text-sm">
                      ₹{emp.grossSalary ? emp.grossSalary.toLocaleString() : '0'}
                    </div>
                    <div className="text-[10px] text-gray-400 font-medium mt-0.5">/ month</div>
                  </td>

                  {/* 6. Actions */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenPayslipModal(emp)}
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors shadow-2xs"
                        title="Generate Monthly Payslip"
                      >
                        <FileText className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Payslip</span>
                      </button>

                      <button
                        onClick={() => handleEdit(emp)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Edit Employee Profile"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(emp.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Remove Employee"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-semibold text-gray-700">No employees found</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {searchQuery || roleFilter !== 'All'
                        ? 'Try clearing your search query or role filter.'
                        : 'Click "+ Add Employee" to register your first team member.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Add / Edit Employee Pop Up Window */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-150 my-6">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-700 to-indigo-800 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold leading-tight font-heading">
                  {editingId ? 'Edit Employee Profile' : 'Add New Employee'}
                </h3>
                <p className="text-[11px] text-indigo-200 mt-0.5">
                  Configure employee identity, role, contact details, and payroll bank information.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                className="p-1.5 text-indigo-200 hover:text-white rounded-lg hover:bg-indigo-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Card: Personal & Role Details */}
                <div className="p-4 bg-gray-50/70 rounded-xl border border-gray-200 space-y-3.5">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-gray-200">
                    <Users className="w-4 h-4 text-indigo-600" />
                    <span>Personal & Designation Details</span>
                  </h4>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                      value={newEmp.name || ''}
                      onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Designation / Role <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Software Engineer, UI Designer"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                      value={newEmp.role || ''}
                      onChange={(e) => setNewEmp({ ...newEmp, role: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        placeholder="john@example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                        value={newEmp.email || ''}
                        onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Phone</label>
                      <input
                        type="text"
                        placeholder="9876543210"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                        value={newEmp.phone || ''}
                        onChange={(e) => setNewEmp({ ...newEmp, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Address</label>
                    <textarea
                      rows={2}
                      placeholder="Residential / Office address..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white leading-relaxed"
                      value={newEmp.address || ''}
                      onChange={(e) => setNewEmp({ ...newEmp, address: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Date of Joining</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                      value={newEmp.dateOfJoining || ''}
                      onChange={(e) => setNewEmp({ ...newEmp, dateOfJoining: e.target.value })}
                    />
                    {newEmp.dateOfJoining && (
                      <div className="text-[11px] text-indigo-600 font-semibold mt-1">
                        {formatDateDMY(newEmp.dateOfJoining)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Card: Payroll & Financial Details */}
                <div className="p-4 bg-gray-50/70 rounded-xl border border-gray-200 space-y-3.5">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-gray-200">
                    <Wallet className="w-4 h-4 text-emerald-600" />
                    <span>Payroll & Financial Details</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Monthly Gross Salary (₹) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400 text-xs">
                          ₹
                        </span>
                        <input
                          type="number"
                          required
                          min={0}
                          placeholder="e.g. 85000"
                          className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                          value={newEmp.grossSalary !== undefined ? newEmp.grossSalary : ''}
                          onChange={(e) => setNewEmp({ ...newEmp, grossSalary: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        PAN Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. ABCDE1234F"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                        value={newEmp.pan || ''}
                        onChange={(e) => setNewEmp({ ...newEmp, pan: e.target.value.toUpperCase() })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Bank Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. HDFC Bank, ICICI Bank"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
                      value={newEmp.bankName || ''}
                      onChange={(e) => setNewEmp({ ...newEmp, bankName: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Account Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 1234567890"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                        value={newEmp.accountNumber || ''}
                        onChange={(e) => setNewEmp({ ...newEmp, accountNumber: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        IFSC Code <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. HDFC0001234"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono uppercase font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                        value={newEmp.ifscCode || ''}
                        onChange={(e) => setNewEmp({ ...newEmp, ifscCode: e.target.value.toUpperCase() })}
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-lg text-[11px] text-indigo-900 leading-relaxed">
                    <strong>Statutory Note:</strong> Accurate PAN and bank account credentials are used directly for
                    monthly payslip PDF generations and bank payout advice.
                  </div>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition-colors shadow-2xs hover:shadow-xs"
                >
                  {editingId ? 'Update Employee' : 'Save Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Generate Payslip Pop Up Window */}
      {payslipEmployee && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-700 to-indigo-800 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-heading">Generate Monthly Payslip</h3>
                <p className="text-[11px] text-indigo-200 mt-0.5">
                  Calculate net pay and export official company payslip PDF.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPayslipEmployee(null)}
                className="p-1.5 text-indigo-200 hover:text-white rounded-lg hover:bg-indigo-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              {/* Employee Summary Card */}
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                    {getInitials(payslipEmployee.name)}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm">{payslipEmployee.name}</div>
                    <div className="text-[11px] text-gray-500">{payslipEmployee.role}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 font-semibold block uppercase">Base Gross</span>
                  <span className="font-heading font-bold text-gray-900 text-sm">
                    ₹{payslipEmployee.grossSalary.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Month Selector */}
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Payroll Month</label>
                <input
                  type="month"
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={payslipData.month}
                  onChange={(e) => setPayslipData({ ...payslipData, month: e.target.value })}
                />
              </div>

              {/* Deductions: TDS & Professional Tax in 2 columns */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">TDS Deduction (₹)</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={payslipData.tds}
                    onChange={(e) => setPayslipData({ ...payslipData, tds: Number(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Professional Tax (₹)</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={payslipData.pt}
                    onChange={(e) => setPayslipData({ ...payslipData, pt: Number(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Net Pay Calculation Card */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                <div className="flex justify-between text-gray-600 text-[11px]">
                  <span>Gross Salary:</span>
                  <span>₹{payslipEmployee.grossSalary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-rose-600 text-[11px]">
                  <span>Total Deductions (TDS + PT):</span>
                  <span>-₹{(Number(payslipData.tds) + Number(payslipData.pt)).toLocaleString()}</span>
                </div>
                <div className="pt-1.5 border-t border-emerald-200 flex justify-between items-center text-sm">
                  <span className="font-bold text-gray-900">Net Take-Home Pay:</span>
                  <span className="font-heading font-bold text-emerald-700 text-base">
                    ₹{(
                      payslipEmployee.grossSalary -
                      Number(payslipData.tds) -
                      Number(payslipData.pt)
                    ).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPayslipEmployee(null)}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>

                <PDFDownloadLink
                  document={<PayslipPDF employee={payslipEmployee} data={payslipData} />}
                  fileName={`Payslip_${payslipEmployee.name.replace(/\s+/g, '_')}_${payslipData.month}.pdf`}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-xs inline-flex items-center gap-1.5 shadow-2xs hover:shadow-xs transition-all"
                >
                  {/* @ts-expect-error: react-pdf render props typing */}
                  {({ loading }: { loading: boolean }) => (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>{loading ? 'Preparing...' : 'Download PDF'}</span>
                    </>
                  )}
                </PDFDownloadLink>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
