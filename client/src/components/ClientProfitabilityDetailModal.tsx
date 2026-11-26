import React, { useState } from 'react';
import {
  X,
  Download,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  FileText,
  Users,
  Layers,
  CreditCard,
  IndianRupee,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import {
  ClientProfitabilityRecord,
  ProfitabilityPeriod,
} from '../data/clientProfitability';
import { formatDateDMY } from '../utils/date';
import { getStoredBillingProfiles } from '../data/profile';
import { ClientProfitabilityPDF } from './ClientProfitabilityPDF';

interface Props {
  record: ClientProfitabilityRecord;
  period: ProfitabilityPeriod;
  onClose: () => void;
}

export const ClientProfitabilityDetailModal: React.FC<Props> = ({
  record,
  period,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'pnl' | 'invoices' | 'trends'>('pnl');
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Generate & Download PDF
  const handleDownloadPdf = async () => {
    try {
      setIsExportingPdf(true);
      const profiles = getStoredBillingProfiles();
      const doc = (
        <ClientProfitabilityPDF
          record={record}
          period={period}
          companyInfo={profiles.company}
        />
      );
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Profitability-Report-${record.clientName.replace(/[^a-zA-Z0-9]/g, '_')}-${period.value}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Export to CSV
  const handleExportCsv = () => {
    const rows: string[][] = [
      ['Client Profitability Analysis Report'],
      ['Client Name', record.clientName],
      ['GSTIN', record.clientGstin || 'N/A'],
      ['Analysis Period', period.label],
      ['Generated On', formatDateDMY(new Date().toISOString().slice(0, 10))],
      ['Status', record.isProfitable ? 'Profitable' : 'Loss-Making'],
      [],
      ['Executive Metrics', 'Amount (INR)', '% of Revenue'],
      ['Gross Invoiced Revenue (Ex-GST)', record.invoicedGrossRevenue.toString(), '-'],
      ['Credit Notes & Adjustments', `-${record.creditNotesDeduction}`, '-'],
      ['Net Earned Revenue (Ex-GST)', record.netEarnedRevenue.toString(), '100.0%'],
      ['Allocated Employee Costs', record.allocatedEmployeeCost.toString(), `${record.netEarnedRevenue > 0 ? ((record.allocatedEmployeeCost / record.netEarnedRevenue) * 100).toFixed(1) : 0}%`],
      ['Freelancer & Outsourced Work', record.freelancerCost.toString(), `${record.netEarnedRevenue > 0 ? ((record.freelancerCost / record.netEarnedRevenue) * 100).toFixed(1) : 0}%`],
      ['Client Software & Subscriptions', record.clientSoftwareCost.toString(), `${record.netEarnedRevenue > 0 ? ((record.clientSoftwareCost / record.netEarnedRevenue) * 100).toFixed(1) : 0}%`],
      ['Other Direct Costs & Travel', record.otherDirectCosts.toString(), `${record.netEarnedRevenue > 0 ? ((record.otherDirectCosts / record.netEarnedRevenue) * 100).toFixed(1) : 0}%`],
      ['Total Direct Client Costs', record.totalDirectCosts.toString(), `${record.netEarnedRevenue > 0 ? ((record.totalDirectCosts / record.netEarnedRevenue) * 100).toFixed(1) : 0}%`],
      ['Client Contribution', record.contribution.toString(), `${record.contributionMargin.toFixed(1)}%`],
      ['Allocated Agency Overheads', record.allocatedOverheads.toString(), `${record.netEarnedRevenue > 0 ? ((record.allocatedOverheads / record.netEarnedRevenue) * 100).toFixed(1) : 0}%`],
      ['Net Client Profit', record.netProfit.toString(), `${record.netProfitMargin.toFixed(1)}%`],
      ['Actual Cash Received', record.cashReceived.toString(), '-'],
      ['Outstanding Receivables', record.outstandingReceivables.toString(), '-'],
      [],
      ['Employee Cost Allocations'],
      ['Employee Name', 'Role', 'Gross Monthly', 'Allocation %', 'Period Cost (INR)'],
      ...record.employeeAllocations.map((e) => [
        e.employeeName,
        e.role,
        e.grossSalary.toString(),
        `${e.allocationPercentage}%`,
        e.periodCost.toString(),
      ]),
      [],
      ['Invoices History'],
      ['Invoice #', 'Date', 'Subtotal (Ex-GST)', 'GST', 'Total Amount', 'Status'],
      ...record.invoices.map((inv) => [
        inv.id,
        inv.date,
        (inv.subtotal ?? (inv.amount - (inv.gst || 0))).toString(),
        (inv.gst || 0).toString(),
        inv.amount.toString(),
        inv.status,
      ]),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Profitability-${record.clientName.replace(/[^a-zA-Z0-9]/g, '_')}-${period.value}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-hidden animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col border border-gray-100 overflow-hidden">
        {/* Pinned Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 via-white to-indigo-50/30 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100 font-bold text-lg">
              {record.clientName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900 leading-tight">
                  {record.clientName}
                </h3>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    record.isProfitable
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                      : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                  }`}
                >
                  {record.isProfitable ? (
                    <>
                      <TrendingUp className="w-3 h-3" /> Profitable Account
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-3 h-3" /> Loss-Making Account
                    </>
                  )}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                <span>Period: <strong className="text-gray-700">{period.label}</strong></span>
                {record.clientGstin && (
                  <span>• GSTIN: <strong className="text-gray-700">{record.clientGstin}</strong></span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 text-xs font-semibold hover:bg-gray-50 transition-colors shadow-sm"
              title="Export report data to CSV/Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-100 disabled:opacity-60"
              title="Download formal executive PDF report"
            >
              {isExportingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Download PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Executive KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 py-3.5 bg-gray-50/70 border-b border-gray-100 flex-shrink-0">
          <div className="bg-white p-3 rounded-xl border border-gray-200/80 shadow-xs">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Net Revenue (Ex-GST)
            </p>
            <p className="text-lg font-bold text-gray-900 mt-0.5">
              ₹{record.netEarnedRevenue.toLocaleString()}
            </p>
            <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1">
              <span>Recv: <strong className="text-emerald-600">₹{record.cashReceived.toLocaleString()}</strong></span>
              <span>Due: <strong className="text-amber-600">₹{record.outstandingReceivables.toLocaleString()}</strong></span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-gray-200/80 shadow-xs">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Total Direct Costs
            </p>
            <p className="text-lg font-bold text-rose-600 mt-0.5">
              ₹{record.totalDirectCosts.toLocaleString()}
            </p>
            <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1">
              <span>Staff: ₹{record.allocatedEmployeeCost.toLocaleString()}</span>
              <span>Other: ₹{(record.totalDirectCosts - record.allocatedEmployeeCost).toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-gray-200/80 shadow-xs">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Contribution Margin
            </p>
            <p
              className={`text-lg font-bold mt-0.5 ${
                record.contribution >= 0 ? 'text-indigo-600' : 'text-rose-600'
              }`}
            >
              {record.contributionMargin.toFixed(1)}%
            </p>
            <p className="text-[11px] text-gray-500 mt-1">
              Contribution: <strong className="text-gray-800">₹{record.contribution.toLocaleString()}</strong>
            </p>
          </div>

          <div className="bg-white p-3 rounded-xl border border-gray-200/80 shadow-xs">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              Net Client Profit
            </p>
            <p
              className={`text-lg font-bold mt-0.5 ${
                record.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              ₹{record.netProfit.toLocaleString()}
            </p>
            <p className="text-[11px] text-gray-500 mt-1">
              Net Margin: <strong className={record.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}>{record.netProfitMargin.toFixed(1)}%</strong>
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-gray-200 px-6 bg-white flex-shrink-0">
          <button
            onClick={() => setActiveTab('pnl')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'pnl'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>P&L & Cost Breakdown</span>
          </button>

          <button
            onClick={() => setActiveTab('invoices')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'invoices'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Invoices & Collections ({record.invoices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('trends')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'trends'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Profitability Trends</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'pnl' && (
            <div className="space-y-6">
              {/* Detailed P&L Statement */}
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Client Profit & Loss Statement (Ex-GST)
                  </h4>
                </div>

                <div className="divide-y divide-gray-100 text-xs">
                  <div className="flex justify-between items-center px-4 py-2.5 font-semibold text-gray-800">
                    <span>1. Invoiced Gross Revenue (Excluding GST)</span>
                    <span className="font-bold">₹{record.invoicedGrossRevenue.toLocaleString()}</span>
                  </div>

                  {record.creditNotesDeduction > 0 && (
                    <div className="flex justify-between items-center px-4 py-2 text-rose-600 bg-rose-50/40">
                      <span className="pl-3">Less: Credit Notes & Commercial Adjustments</span>
                      <span className="font-semibold">-₹{record.creditNotesDeduction.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center px-4 py-2.5 font-bold text-indigo-900 bg-indigo-50/50">
                    <span>Net Earned Revenue</span>
                    <span className="text-sm font-bold">₹{record.netEarnedRevenue.toLocaleString()}</span>
                  </div>

                  {/* Direct Costs Group */}
                  <div className="bg-gray-50/30 px-4 py-1 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    Direct Client Costs
                  </div>

                  <div className="flex justify-between items-center px-4 py-2 text-gray-700">
                    <span className="pl-3 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      Employee Cost Allocations ({record.employeeAllocations.length} staff)
                    </span>
                    <span className="font-medium text-gray-800">₹{record.allocatedEmployeeCost.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center px-4 py-2 text-gray-700">
                    <span className="pl-3 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                      Freelancer & Outsourced Services
                    </span>
                    <span className="font-medium text-gray-800">₹{record.freelancerCost.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center px-4 py-2 text-gray-700">
                    <span className="pl-3 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-gray-400" />
                      Client-Dedicated Software & Subscriptions
                    </span>
                    <span className="font-medium text-gray-800">₹{record.clientSoftwareCost.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center px-4 py-2 text-gray-700">
                    <span className="pl-3 flex items-center gap-1.5">
                      <IndianRupee className="w-3.5 h-3.5 text-gray-400" />
                      Other Direct Costs & Project Expenses
                    </span>
                    <span className="font-medium text-gray-800">₹{record.otherDirectCosts.toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center px-4 py-2.5 font-semibold text-rose-700 bg-rose-50/30">
                    <span>Total Direct Client Costs</span>
                    <span className="font-bold">₹{record.totalDirectCosts.toLocaleString()}</span>
                  </div>

                  {/* Contribution */}
                  <div className="flex justify-between items-center px-4 py-3 font-bold bg-indigo-50/70 text-indigo-950">
                    <div className="flex items-center gap-2">
                      <span>Client Contribution (Gross Margin)</span>
                      <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                        {record.contributionMargin.toFixed(1)}% margin
                      </span>
                    </div>
                    <span className="text-sm font-bold">₹{record.contribution.toLocaleString()}</span>
                  </div>

                  {/* Overheads */}
                  <div className="flex justify-between items-center px-4 py-2.5 text-gray-600 bg-gray-50/30">
                    <div className="pl-3">
                      <div className="flex items-center gap-1.5 font-medium text-gray-700">
                        <span>Less: Allocated Common Agency Overheads</span>
                      </div>
                      <p className="text-[11px] text-gray-500 font-normal mt-0.5">
                        {record.overheadCalculationDetail ||
                          'Share of common overhead expenses allocated based on current overhead settings.'}
                      </p>
                    </div>
                    <span className="font-semibold text-gray-700">₹{record.allocatedOverheads.toLocaleString()}</span>
                  </div>

                  {/* Net Profit */}
                  <div
                    className={`flex justify-between items-center px-4 py-3.5 font-bold ${
                      record.netProfit >= 0
                        ? 'bg-emerald-50 text-emerald-900 border-t-2 border-emerald-500'
                        : 'bg-rose-50 text-rose-900 border-t-2 border-rose-500'
                    }`}
                  >
                    <div>
                      <span className="text-sm">Net Client Profit (Final Profitability)</span>
                      <p className="text-[11px] font-normal opacity-80">
                        Net Profit Margin: {record.netProfitMargin.toFixed(1)}% of Ex-GST Revenue
                      </p>
                    </div>
                    <span className="text-base font-bold">
                      ₹{record.netProfit.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Employee Cost Breakdown Table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    Allocated Employee Cost Breakdown
                  </h4>
                  <span className="text-xs font-semibold text-gray-500">
                    Total: ₹{record.allocatedEmployeeCost.toLocaleString()}
                  </span>
                </div>

                {record.employeeAllocations.length === 0 ? (
                  <p className="p-4 text-xs text-gray-500 text-center">
                    No employee costs currently allocated to this client.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50/60 text-gray-500 uppercase text-[10px] border-b border-gray-200">
                        <tr>
                          <th className="py-2.5 px-4 font-semibold">Employee</th>
                          <th className="py-2.5 px-4 font-semibold">Role</th>
                          <th className="py-2.5 px-4 font-semibold text-right">Gross Monthly Salary</th>
                          <th className="py-2.5 px-4 font-semibold text-right">Client Allocation %</th>
                          <th className="py-2.5 px-4 font-semibold text-right">Period Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {record.employeeAllocations.map((emp, idx) => (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="py-2.5 px-4 font-semibold text-gray-900">
                              {emp.employeeName}
                            </td>
                            <td className="py-2.5 px-4 text-gray-600">{emp.role}</td>
                            <td className="py-2.5 px-4 text-right text-gray-600">
                              ₹{emp.grossSalary.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded">
                                {emp.allocationPercentage}%
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-right font-bold text-gray-900">
                              ₹{emp.periodCost.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Subscriptions & Direct Expenses Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Client Subscriptions */}
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      Client Subscriptions ({record.clientSubscriptions.length})
                    </h4>
                  </div>
                  {record.clientSubscriptions.length === 0 ? (
                    <p className="p-4 text-xs text-gray-400 text-center">
                      No client-managed software subscriptions recorded.
                    </p>
                  ) : (
                    <div className="divide-y divide-gray-100 text-xs">
                      {record.clientSubscriptions.map((sub) => (
                        <div key={sub.id} className="p-3 flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-gray-900">{sub.name}</p>
                            <p className="text-[11px] text-gray-500">
                              {sub.category} • {sub.duration} ({sub.currency} {sub.amount})
                            </p>
                          </div>
                          <span className="font-bold text-gray-900">
                            ₹{sub.periodCost.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Freelancers & Other Direct Expenses */}
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                    <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                      Direct Project Expenses ({record.directExpenses.length})
                    </h4>
                  </div>
                  {record.directExpenses.length === 0 ? (
                    <p className="p-4 text-xs text-gray-400 text-center">
                      No direct project expenses recorded for this period.
                    </p>
                  ) : (
                    <div className="divide-y divide-gray-100 text-xs">
                      {record.directExpenses.map((exp) => (
                        <div key={exp.id} className="p-3 flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-gray-900">{exp.description}</p>
                            <p className="text-[11px] text-gray-500">
                              {exp.category} • {formatDateDMY(exp.date)} {exp.vendorOrPerson ? `• ${exp.vendorOrPerson}` : ''}
                            </p>
                          </div>
                          <span className="font-bold text-gray-900">
                            ₹{exp.amount.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="space-y-6">
              {/* Issued Invoices Table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    Issued Invoices in Period ({record.invoices.length})
                  </h4>
                  <span className="text-xs text-gray-500">
                    Ex-GST Total: <strong className="text-gray-900">₹{record.invoicedGrossRevenue.toLocaleString()}</strong>
                  </span>
                </div>

                {record.invoices.length === 0 ? (
                  <p className="p-6 text-xs text-gray-500 text-center">
                    No issued invoices found for this client in the selected period.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50/60 text-gray-500 uppercase text-[10px] border-b border-gray-200">
                        <tr>
                          <th className="py-2.5 px-4 font-semibold">Invoice #</th>
                          <th className="py-2.5 px-4 font-semibold">Date</th>
                          <th className="py-2.5 px-4 font-semibold">Service Description</th>
                          <th className="py-2.5 px-4 font-semibold text-right">Revenue (Ex-GST)</th>
                          <th className="py-2.5 px-4 font-semibold text-right">GST</th>
                          <th className="py-2.5 px-4 font-semibold text-right">Total Invoiced</th>
                          <th className="py-2.5 px-4 font-semibold text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {record.invoices.map((inv) => {
                          const subtotal = inv.subtotal ?? (inv.amount - (inv.gst || 0));
                          return (
                            <tr key={inv.id} className="hover:bg-gray-50/50">
                              <td className="py-3 px-4 font-semibold text-indigo-600">
                                {inv.id}
                              </td>
                              <td className="py-3 px-4 text-gray-600">
                                {formatDateDMY(inv.date)}
                              </td>
                              <td className="py-3 px-4 text-gray-700 max-w-xs truncate" title={inv.items?.map((i) => i.desc).join(', ')}>
                                {inv.items?.[0]?.desc || 'Retainer Services'}
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-gray-900">
                                ₹{subtotal.toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-right text-gray-500">
                                ₹{(inv.gst || 0).toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-right font-semibold text-gray-800">
                                ₹{inv.amount.toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span
                                  className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                    inv.status === 'Paid'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                                      : inv.status === 'Cancelled'
                                      ? 'bg-gray-100 text-gray-600'
                                      : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                                  }`}
                                >
                                  {inv.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Credit Notes Table */}
              {record.creditNotes.length > 0 && (
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs">
                  <div className="bg-rose-50/60 px-4 py-3 border-b border-rose-200/60 flex justify-between items-center">
                    <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      Credit Notes Deducted ({record.creditNotes.length})
                    </h4>
                    <span className="text-xs font-semibold text-rose-700">
                      Total Ex-GST: -₹{record.creditNotesDeduction.toLocaleString()}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50/60 text-gray-500 uppercase text-[10px] border-b border-gray-200">
                        <tr>
                          <th className="py-2.5 px-4 font-semibold">Credit Note #</th>
                          <th className="py-2.5 px-4 font-semibold">Date</th>
                          <th className="py-2.5 px-4 font-semibold">Reason</th>
                          <th className="py-2.5 px-4 font-semibold text-right">Subtotal (Ex-GST)</th>
                          <th className="py-2.5 px-4 font-semibold text-right">GST Reversal</th>
                          <th className="py-2.5 px-4 font-semibold text-right">Total Credited</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {record.creditNotes.map((cn) => (
                          <tr key={cn.id} className="hover:bg-gray-50/50">
                            <td className="py-3 px-4 font-semibold text-rose-600">{cn.id}</td>
                            <td className="py-3 px-4 text-gray-600">{formatDateDMY(cn.date)}</td>
                            <td className="py-3 px-4 text-gray-700">{cn.reason}</td>
                            <td className="py-3 px-4 text-right font-bold text-rose-700">
                              -₹{(cn.subtotal ?? cn.amount).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right text-gray-500">
                              ₹{(cn.gst || 0).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-gray-800">
                              ₹{cn.amount.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'trends' && (
            <div className="space-y-6">
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4">
                <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                  Profitability & Margin Trajectory
                </h4>
                <p className="text-xs text-indigo-700 mt-1">
                  Monthly progression comparing earned ex-GST revenue, direct execution costs, and bottom-line net profit.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(record.monthlyTrends || []).map((t, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900">{t.monthLabel}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          t.netProfit >= 0
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {t.revenue > 0 ? `${((t.netProfit / t.revenue) * 100).toFixed(1)}% net` : '0%'}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1.5 text-xs">
                      <div className="flex justify-between text-gray-600">
                        <span>Revenue:</span>
                        <strong className="text-gray-900">₹{t.revenue.toLocaleString()}</strong>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Direct Costs:</span>
                        <span className="text-rose-600 font-medium">₹{t.directCosts.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Contribution:</span>
                        <span className="text-indigo-600 font-medium">₹{t.contribution.toLocaleString()}</span>
                      </div>
                      <div className="pt-2 border-t border-gray-100 flex justify-between font-bold">
                        <span>Net Profit:</span>
                        <span className={t.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                          ₹{t.netProfit.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pinned Modal Footer */}
        <div className="px-6 py-3.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between flex-shrink-0">
          <p className="text-[11px] text-gray-500">
            GST is excluded from revenue calculations. Employee allocations derived from Employee Cost Analysis.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-xs"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientProfitabilityDetailModal;
