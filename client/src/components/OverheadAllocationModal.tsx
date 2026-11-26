import React, { useState, useMemo } from 'react';
import {
  X,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Percent,
  Building,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';
import {
  OverheadAllocationConfig,
  getStoredOverheadConfig,
  saveStoredOverheadConfig,
  DEFAULT_OVERHEAD_CONFIG,
  ProfitabilityPeriod,
  calculateTotalOverheadsForPeriod,
  calculateClientProfitability,
} from '../data/clientProfitability';
import { getStoredExpenses } from '../data/expenses';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  period: ProfitabilityPeriod;
  onConfigSaved?: () => void;
}

const AVAILABLE_CATEGORIES = [
  { id: 'Office', label: 'Office & Facilities', desc: 'Rent, Maintenance, Utilities, Broadband' },
  { id: 'Operations', label: 'Operations & Compliance', desc: 'Accounting, CA Retainers, Legal, ROC' },
  { id: 'IT', label: 'Internal IT & Tools', desc: 'General agency cloud, internal infrastructure' },
  { id: 'Meals', label: 'Hospitality & Meals', desc: 'Office pantry, meeting hospitality' },
  { id: 'Travel', label: 'General Travel & Admin', desc: 'Administrative local transport, stationery' },
];

export const OverheadAllocationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  period,
  onConfigSaved,
}) => {
  const [config, setConfig] = useState<OverheadAllocationConfig>(() => getStoredOverheadConfig());
  const [activeTab, setActiveTab] = useState<'rules' | 'categories' | 'overrides'>('rules');

  const expenses = useMemo(() => getStoredExpenses(), []);

  // Compute live overhead expenses pool from the Expenses tab for the active period
  const { totalOverheadPool, categoryBreakdown } = useMemo(() => {
    return calculateTotalOverheadsForPeriod(expenses, period, config);
  }, [expenses, period, config]);

  // Compute live preview of client allocations under current draft config
  const preview = useMemo(() => {
    return calculateClientProfitability(period, config);
  }, [period, config]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveStoredOverheadConfig(config);
    if (onConfigSaved) onConfigSaved();
    onClose();
  };

  const handleReset = () => {
    setConfig({ ...DEFAULT_OVERHEAD_CONFIG });
  };

  const toggleCategory = (catId: string) => {
    const exists = config.includeCategories.includes(catId);
    let updated: string[];
    if (exists) {
      if (config.includeCategories.length <= 1) {
        alert('You must select at least one expense category for overheads.');
        return;
      }
      updated = config.includeCategories.filter((c) => c !== catId);
    } else {
      updated = [...config.includeCategories, catId];
    }
    setConfig({ ...config, includeCategories: updated });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-gray-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-purple-700 px-6 py-4 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
              <Sliders className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg leading-tight">
                Overhead Allocation Settings
              </h3>
              <p className="text-xs text-indigo-100 mt-0.5">
                Decide common overhead costs and customize the revenue capping percentage.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Status Bar */}
        <div className="bg-indigo-50/70 border-b border-indigo-100 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-700">Period:</span>
            <span className="font-bold text-indigo-900 bg-white px-2.5 py-0.5 rounded-lg border border-indigo-200 shadow-2xs">
              {period.label}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-gray-600">
              Recorded in <strong className="text-indigo-950 font-semibold">Expenses Tab</strong>:
            </div>
            <div className="font-bold text-sm text-indigo-700 bg-white px-3 py-1 rounded-lg border border-indigo-200 shadow-2xs">
              ₹{totalOverheadPool.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 px-6 bg-gray-50/60 flex-shrink-0 text-xs font-bold">
          <button
            onClick={() => setActiveTab('rules')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'rules'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>1. Allocation Rules & Capping %</span>
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'categories'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>2. Expense Categories Pool ({config.includeCategories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('overrides')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'overrides'
                ? 'border-indigo-600 text-indigo-600 bg-white'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>3. Client Overrides & Preview</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: RULES & CAPPING % */}
          {activeTab === 'rules' && (
            <div className="space-y-6">
              {/* Method Selection */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 tracking-wider mb-2.5">
                  Choose Overhead Allocation Method
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Method 1: Proportional Share with Cap */}
                  <label
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      config.method === 'proportional_revenue'
                        ? 'border-indigo-600 bg-indigo-50/30 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="overheadMethod"
                        checked={config.method === 'proportional_revenue'}
                        onChange={() => setConfig({ ...config, method: 'proportional_revenue' })}
                        className="mt-1 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <div className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                          <span>Proportional Revenue Share</span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-100 text-indigo-800 font-semibold">
                            Recommended
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                          Divides the Expenses tab pool among clients based on their earned revenue share, protected by your custom capping %.
                        </p>
                      </div>
                    </div>
                  </label>

                  {/* Method 2: Direct % of Ex-GST Revenue */}
                  <label
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      config.method === 'revenue_percentage'
                        ? 'border-indigo-600 bg-indigo-50/30 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="overheadMethod"
                        checked={config.method === 'revenue_percentage'}
                        onChange={() => setConfig({ ...config, method: 'revenue_percentage' })}
                        className="mt-1 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <div className="font-bold text-gray-900 text-sm">
                          Direct % of Ex-GST Revenue
                        </div>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                          Allocates a fixed percentage of each client's ex-GST revenue as overheads (e.g. 15% or 20%).
                        </p>
                      </div>
                    </div>
                  </label>

                  {/* Method 3: Equal Split */}
                  <label
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      config.method === 'equal_split'
                        ? 'border-indigo-600 bg-indigo-50/30 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="overheadMethod"
                        checked={config.method === 'equal_split'}
                        onChange={() => setConfig({ ...config, method: 'equal_split' })}
                        className="mt-1 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <div className="font-bold text-gray-900 text-sm">
                          Equal Split Across Active Clients
                        </div>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                          Divides the total overhead pool equally across all active clients in this period.
                        </p>
                      </div>
                    </div>
                  </label>

                  {/* Method 4: Fixed Amount */}
                  <label
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      config.method === 'fixed_amount'
                        ? 'border-indigo-600 bg-indigo-50/30 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="overheadMethod"
                        checked={config.method === 'fixed_amount'}
                        onChange={() => setConfig({ ...config, method: 'fixed_amount' })}
                        className="mt-1 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <div className="font-bold text-gray-900 text-sm">
                          Fixed Monthly Rupee Amount
                        </div>
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                          Allocates an exact fixed rupee amount per client per month (e.g. ₹10,000/mo).
                        </p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Capping Percentage Control (Requested by User) */}
              <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span className="font-bold text-gray-900 text-sm">
                      Revenue Capping Percentage (%)
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.applyCapping}
                      onChange={(e) => setConfig({ ...config, applyCapping: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed">
                  The capping percentage ensures that common agency overheads (rent, compliance, admin) never exceed this percentage of any client's earned revenue.
                </p>

                {config.applyCapping ? (
                  <div className="pt-2">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-gray-700">Maximum Cap:</span>
                      <div className="relative w-32">
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={config.cappingPercentage}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              cappingPercentage: Math.max(1, Math.min(100, Number(e.target.value) || 20)),
                            })
                          }
                          className="w-full pl-3 pr-8 py-2 rounded-xl border border-gray-300 text-sm font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        />
                        <span className="absolute right-3 top-2.5 text-xs font-bold text-gray-400">
                          %
                        </span>
                      </div>

                      {/* Quick presets */}
                      <div className="flex items-center gap-1.5">
                        {[10, 15, 20, 25, 30].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setConfig({ ...config, cappingPercentage: pct })}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${
                              config.cappingPercentage === pct
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-amber-700 bg-amber-100/60 p-2.5 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Capping is disabled. Clients will absorb uncapped overhead shares.</span>
                  </div>
                )}
              </div>

              {/* Direct Revenue Percentage or Fixed Amount Settings */}
              {config.method === 'revenue_percentage' && (
                <div className="bg-indigo-50/40 border border-indigo-200/80 rounded-2xl p-5 space-y-3">
                  <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <Percent className="w-4 h-4 text-indigo-600" />
                    <span>Set Direct Percentage of Ex-GST Revenue</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative w-32">
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={config.directRevenuePercentage}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            directRevenuePercentage: Math.max(1, Math.min(100, Number(e.target.value) || 15)),
                          })
                        }
                        className="w-full pl-3 pr-8 py-2 rounded-xl border border-gray-300 text-sm font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-gray-400">
                        %
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {[10, 12, 15, 18, 20].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setConfig({ ...config, directRevenuePercentage: pct })}
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${
                            config.directRevenuePercentage === pct
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {config.method === 'fixed_amount' && (
                <div className="bg-indigo-50/40 border border-indigo-200/80 rounded-2xl p-5 space-y-3">
                  <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                    <span>Fixed Monthly Overhead Allocation per Client</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative w-44">
                      <span className="absolute left-3 top-2.5 text-xs font-bold text-gray-400">
                        ₹
                      </span>
                      <input
                        type="number"
                        step={500}
                        value={config.fixedAmountPerClient}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            fixedAmountPerClient: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        className="w-full pl-7 pr-3 py-2 rounded-xl border border-gray-300 text-sm font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                    </div>
                    <span className="text-xs text-gray-500">per month (scales with period multiplier)</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EXPENSE CATEGORIES POOL (Connected to Expenses Tab) */}
          {activeTab === 'categories' && (
            <div className="space-y-5">
              <div>
                <h4 className="font-bold text-gray-900 text-sm">
                  Select Overhead Expense Categories from 'Expenses' Tab
                </h4>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Only expenses tagged under the selected categories in your Expenses ledger will form the common overhead pool.
                </p>
              </div>

              <div className="space-y-3">
                {AVAILABLE_CATEGORIES.map((cat) => {
                  const isChecked = config.includeCategories.includes(cat.id);
                  const recordedAmount = categoryBreakdown[cat.id] || 0;

                  return (
                    <div
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isChecked
                          ? 'border-indigo-300 bg-indigo-50/20 shadow-2xs'
                          : 'border-gray-200 bg-gray-50/60 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by parent div
                          className="mt-1 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                        />
                        <div>
                          <div className="font-bold text-gray-900 text-xs sm:text-sm">
                            {cat.label}
                          </div>
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            {cat.desc}
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0 ml-4">
                        <div className="text-sm font-bold text-gray-900">
                          ₹{recordedAmount.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-gray-400 font-semibold">
                          Recorded in period
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-sky-800">
                <Info className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
                <p>
                  <strong>Note on Staff Payroll:</strong> Staff Salaries (Payroll) are intentionally excluded from this common pool because team members are directly allocated to individual clients in the <em>Employee Allocations</em> module.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: CLIENT OVERRIDES & LIVE IMPACT PREVIEW */}
          {activeTab === 'overrides' && (
            <div className="space-y-5">
              <div>
                <h4 className="font-bold text-gray-900 text-sm">
                  Live Overhead Impact Preview
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  Preview how your chosen overhead rules and capping percentage apply to each client account in {period.label}.
                </p>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs bg-white">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-600 uppercase text-[10px] border-b border-gray-200">
                    <tr>
                      <th className="py-2.5 px-4 font-bold">Client Account</th>
                      <th className="py-2.5 px-4 font-bold text-right">Revenue (Ex-GST)</th>
                      <th className="py-2.5 px-4 font-bold text-right">Direct Costs</th>
                      <th className="py-2.5 px-4 font-bold text-right text-indigo-700">Allocated Overheads</th>
                      <th className="py-2.5 px-4 font-bold text-right">Effective %</th>
                      <th className="py-2.5 px-4 font-bold text-right">Net Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {preview.records.map((r) => (
                      <tr key={r.clientId} className="hover:bg-gray-50/50">
                        <td className="py-3 px-4 font-bold text-gray-900">
                          <div>{r.clientName}</div>
                          <div className="text-[10px] text-gray-400 font-normal">
                            {r.overheadCalculationDetail}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-gray-900">
                          ₹{r.netEarnedRevenue.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right text-rose-600 font-semibold">
                          ₹{r.totalDirectCosts.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-indigo-700">
                          ₹{r.allocatedOverheads.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="px-2 py-0.5 rounded font-bold bg-indigo-50 text-indigo-800 text-[11px]">
                            {r.netEarnedRevenue > 0
                              ? `${((r.allocatedOverheads / r.netEarnedRevenue) * 100).toFixed(1)}%`
                              : '0%'}
                          </span>
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-bold ${
                            r.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          ₹{r.netProfit.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-200/60 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Defaults</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-2xs"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-xs shadow-indigo-200 hover:shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply Overhead Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
