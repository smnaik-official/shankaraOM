import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  IndianRupee,
  FileText,
  Users,
  Repeat,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Calendar,
  Building2,
  Plus,
  FileCheck,
  Send,
  Wallet,
} from 'lucide-react';
import {
  getStoredInvoices,
  getStoredRecurringTemplates,
  getStoredCreditNotes,
} from '../data/invoices';
import { getStoredExpenses } from '../data/expenses';
import { getStoredClients } from './ClientList';
import { getStoredProposals, calculatePipelineMetrics } from '../data/proposals';
import { formatDateDMY } from '../utils/date';

// 6-Month financial trend matching the business scale
const monthlyTrendData = [
  { month: 'Jun 26', revenue: 72000, expenses: 38000, profit: 34000 },
  { month: 'Jul 26', revenue: 78500, expenses: 41200, profit: 37300 },
  { month: 'Aug 26', revenue: 84080, expenses: 39500, profit: 44580 },
  { month: 'Sep 26', revenue: 81000, expenses: 42000, profit: 39000 },
  { month: 'Oct 26', revenue: 88500, expenses: 43500, profit: 45000 },
  { month: 'Nov 26', revenue: 94780, expenses: 44200, profit: 50580 },
];

const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const revenue = payload.find((p: any) => p.dataKey === 'revenue')?.value || 0;
    const profit = payload.find((p: any) => p.dataKey === 'profit')?.value || 0;
    const expenses = payload.find((p: any) => p.dataKey === 'expenses')?.value || 0;

    return (
      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-lg text-xs space-y-1.5 min-w-[170px]">
        <div className="font-semibold text-gray-900 border-b border-gray-100 pb-1">{label}</div>
        <div className="flex justify-between items-center text-indigo-700">
          <span>Revenue:</span>
          <span className="font-semibold">₹{revenue.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center text-slate-600">
          <span>Expenses:</span>
          <span className="font-semibold">₹{expenses.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center text-purple-700 border-t border-gray-100 pt-1 font-semibold">
          <span>Net Profit:</span>
          <span>₹{profit.toLocaleString()}</span>
        </div>
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC = () => {
  const [invoices, setInvoices] = useState(() => getStoredInvoices());
  const [recurringTemplates, setRecurringTemplates] = useState(() => getStoredRecurringTemplates());
  const [clients, setClients] = useState(() => getStoredClients());
  const [creditNotes, setCreditNotes] = useState(() => getStoredCreditNotes());
  const [expenses, setExpenses] = useState(() => getStoredExpenses());

  useEffect(() => {
    const refresh = () => {
      setInvoices(getStoredInvoices());
      setRecurringTemplates(getStoredRecurringTemplates());
      setClients(getStoredClients());
      setCreditNotes(getStoredCreditNotes());
      setExpenses(getStoredExpenses());
    };
    const events = [
      'invoices_updated',
      'recurring_invoices_updated',
      'clients_updated',
      'credit_notes_updated',
      'expenses_updated',
      'proposals-changed',
      'storage',
    ];
    events.forEach((ev) => window.addEventListener(ev, refresh));
    return () => events.forEach((ev) => window.removeEventListener(ev, refresh));
  }, []);

  // Total Expenses for Current Month (Nov 2026)
  const currentMonthExpenses = useMemo(() => {
    return expenses.filter((e) => e.date.startsWith('2026-11'));
  }, [expenses]);

  const totalExpenseThisMonth = useMemo(() => {
    return currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [currentMonthExpenses]);

  // Total collected (Paid invoices)
  const totalPaidRevenue = useMemo(() => {
    return invoices
      .filter((inv) => inv.status === 'Paid')
      .reduce((sum, inv) => sum + inv.amount, 0);
  }, [invoices]);

  const paidCount = useMemo(() => {
    return invoices.filter((inv) => inv.status === 'Paid').length;
  }, [invoices]);

  // Outstanding Receivables (Pending / Overdue invoices)
  const totalPendingReceivables = useMemo(() => {
    return invoices
      .filter((inv) => inv.status === 'Pending' || inv.status === 'Overdue')
      .reduce((sum, inv) => sum + inv.amount, 0);
  }, [invoices]);

  const pendingCount = useMemo(() => {
    return invoices.filter((inv) => inv.status === 'Pending' || inv.status === 'Overdue').length;
  }, [invoices]);

  // Billing Entity Split (Company vs Personal)
  const companyInvoiceTotal = useMemo(() => {
    return invoices
      .filter((inv) => inv.type === 'COMPANY')
      .reduce((sum, inv) => sum + inv.amount, 0);
  }, [invoices]);

  const personalInvoiceTotal = useMemo(() => {
    return invoices
      .filter((inv) => inv.type === 'PERSONAL')
      .reduce((sum, inv) => sum + inv.amount, 0);
  }, [invoices]);

  const totalAllInvoices = companyInvoiceTotal + personalInvoiceTotal || 1;
  const companyPercent = Math.round((companyInvoiceTotal / totalAllInvoices) * 100);
  const personalPercent = 100 - companyPercent;

  // Credit notes total
  const totalCredited = useMemo(() => {
    return creditNotes.reduce((sum, cn) => sum + cn.amount, 0);
  }, [creditNotes]);

  // Recent 4 invoices
  const recentInvoices = useMemo(() => {
    return invoices.slice(0, 4);
  }, [invoices]);

  // Proposals & Income Forecasting Pipeline
  const proposals = useMemo(() => getStoredProposals(), []);
  const proposalMetrics = useMemo(() => calculatePipelineMetrics(proposals, '2026-11'), [proposals]);

  const currentDateFormatted = formatDateDMY(new Date());

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* 1. Header Greeting & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            {currentDateFormatted} • Shankara Online Solutions & Consulting
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/prospects"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
            title="Track Prospective Deals & Status"
          >
            <Send className="w-3.5 h-3.5 text-purple-600" />
            <span>Prospects ({proposalMetrics.activeCount})</span>
          </Link>
          <Link
            to="/invoices/new"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Invoice</span>
          </Link>
          <Link
            to="/invoices?tab=recurring"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
          >
            <Repeat className="w-3.5 h-3.5 text-indigo-600" />
            <span>Monthly Retainers</span>
          </Link>
        </div>
      </div>

      {/* 2. Top 4 Meaningful KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Paid Revenue */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Collected Revenue</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-gray-900">
              ₹{totalPaidRevenue.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {paidCount} Settled
              </span>
              <span className="text-[11px] text-gray-400">Paid in full</span>
            </div>
          </div>
        </div>

        {/* Card 2: Pending Receivables */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Pending Receivables</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-gray-900">
              ₹{totalPendingReceivables.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Link
                to="/invoices?tab=ledger&status=Pending"
                className="text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-100 px-2 py-0.5 rounded-full transition-colors"
                title="View Pending Invoices"
              >
                {pendingCount} Pending Invoices
              </Link>
              <span className="text-[11px] text-gray-400">Awaiting payment</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Expense */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Total Expense</span>
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-gray-900">
              ₹{totalExpenseThisMonth.toLocaleString()}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Link
                to="/expenses"
                className="text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-100 px-2 py-0.5 rounded-full transition-colors"
                title="View Operating Expenses Ledger"
              >
                {currentMonthExpenses.length} Recorded
              </Link>
              <span className="text-[11px] text-gray-400">This Month</span>
            </div>
          </div>
        </div>

        {/* Card 4: Active Clients */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Active Client Accounts</span>
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-gray-900">{clients.length} Clients</div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-full">
                Retainer & Ad-hoc
              </span>
              <span className="text-[11px] text-gray-400">Engaged</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Visual Charts & Business Health (Balanced 2-Column Section) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Revenue & Net Profit Trend Area Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-gray-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Revenue & Profit Performance</h3>
              <p className="text-xs text-gray-500 mt-0.5">Monthly gross revenue vs. operating net profit</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                <span className="text-gray-600 font-medium">Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                <span className="text-gray-600 font-medium">Net Profit</span>
              </div>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${val / 1000}k`}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#revenueGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="#a855f7"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#profitGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right 1 Col: Billing Entity Split & Cashflow Health */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-2xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Billing Entity Distribution</h3>
              <Building2 className="w-4 h-4 text-gray-400" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Breakdown between Company & Personal invoices</p>

            <div className="space-y-4 mt-4">
              {/* Company Breakdown */}
              <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-900">
                    Company
                  </span>
                  <span className="text-xs font-bold text-blue-700">₹{companyInvoiceTotal.toLocaleString()}</span>
                </div>
                <div className="w-full bg-blue-200/60 rounded-full h-1.5 mt-2">
                  <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${companyPercent}%` }}></div>
                </div>
                <div className="flex justify-between text-[11px] text-blue-600 mt-1.5 font-medium">
                  <span>18% GST Applicable</span>
                  <span>{companyPercent}% of total</span>
                </div>
              </div>

              {/* Personal Breakdown */}
              <div className="p-3 bg-purple-50/50 border border-purple-100 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-purple-900">
                    Personal
                  </span>
                  <span className="text-xs font-bold text-purple-700">₹{personalInvoiceTotal.toLocaleString()}</span>
                </div>
                <div className="w-full bg-purple-200/60 rounded-full h-1.5 mt-2">
                  <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: `${personalPercent}%` }}></div>
                </div>
                <div className="flex justify-between text-[11px] text-purple-600 mt-1.5 font-medium">
                  <span>Non-GST Invoices</span>
                  <span>{personalPercent}% of total</span>
                </div>
              </div>

              {/* Credit Note Adjustments */}
              {totalCredited > 0 && (
                <div className="flex items-center justify-between px-3 py-2 bg-rose-50/50 border border-rose-100 rounded-lg text-xs">
                  <span className="text-rose-700 font-medium flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-rose-500" />
                    Credit Note Adjustments
                  </span>
                  <span className="font-semibold text-rose-700">-₹{totalCredited.toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>

          <Link
            to="/profile"
            className="w-full py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Configure Billing Details</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 4. Meaningful Bottom Section: Recent Invoices & Upcoming Retainers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Recent Invoices */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Recent Invoices</h3>
                <p className="text-xs text-gray-500 mt-0.5">Latest generated client billing records</p>
              </div>
              <Link
                to="/invoices"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <span>View all</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-gray-100">
              {recentInvoices.map((inv) => (
                <div key={inv.id} className="p-3.5 flex items-center justify-between hover:bg-gray-50/60 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-gray-900">{inv.id}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            inv.type === 'COMPANY'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}
                        >
                          {inv.type === 'COMPANY' ? 'Company' : 'Personal'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 truncate mt-0.5">
                        {inv.client} • {formatDateDMY(inv.date)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 ml-3">
                    <div className="text-xs font-bold text-gray-900">₹{inv.amount.toLocaleString()}</div>
                    <span
                      className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md mt-1 ${
                        inv.status === 'Paid'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Scheduled Retainer Profiles */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Monthly Retainer Automations</h3>
                <p className="text-xs text-gray-500 mt-0.5">Pre-configured client billing schedules</p>
              </div>
              <Link
                to="/invoices?tab=recurring"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <span>Manage</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-gray-100">
              {recurringTemplates.map((template) => (
                <div key={template.id} className="p-3.5 flex items-center justify-between hover:bg-gray-50/60 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-600">
                      <Repeat className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-gray-900 truncate">
                        {template.clientName}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" /> Day {template.dayOfMonth}
                        </span>
                        <span>•</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                            template.type === 'COMPANY'
                              ? 'text-blue-700 bg-blue-50'
                              : 'text-purple-700 bg-purple-50'
                          }`}
                        >
                          {template.type === 'COMPANY' ? 'Company' : 'Personal'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 ml-3">
                    <div className="text-xs font-bold text-gray-900">₹{template.total.toLocaleString()}</div>
                    <div className="text-[10px] text-gray-500 font-medium">Monthly Retainer</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
