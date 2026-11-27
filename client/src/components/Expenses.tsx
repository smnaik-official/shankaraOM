import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Plus,
  Edit,
  Trash2,
  IndianRupee,
  Filter,
  Calendar,
  X,
  Repeat,
  CheckCircle2,
  AlertCircle,
  Zap,
  Layers,
  Clock,
  Search,
  Wallet,
  TrendingUp,
  TrendingDown,
  CalendarClock,
  ArrowRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatDateDMY } from '../utils/date';
import {
  getStoredExpenses,
  saveStoredExpenses,
  getStoredExpenseTemplates,
  saveStoredExpenseTemplates,
} from '../data/expenses';

export interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  isRecurring?: boolean;
  recurringTemplateId?: string;
}

export interface RecurringTemplate {
  id: string;
  title: string;
  category: string;
  amount: number;
  dayOfMonth: number;
  frequency: 'Monthly' | 'Quarterly' | 'Yearly';
  isActive: boolean;
  notes?: string;
}

export type OverviewTimeRange = 'THIS_MONTH' | 'LAST_MONTH' | 'LAST_QUARTER' | 'THIS_YEAR' | 'LAST_YEAR';

export const OVERVIEW_RANGES: { id: OverviewTimeRange; label: string; periodLabel: string }[] = [
  { id: 'THIS_MONTH', label: 'This Month', periodLabel: 'November 2026' },
  { id: 'LAST_MONTH', label: 'Last Month', periodLabel: 'October 2026' },
  { id: 'LAST_QUARTER', label: 'Last Quarter', periodLabel: 'Q3 2026 (Jul - Sep)' },
  { id: 'THIS_YEAR', label: 'This Year', periodLabel: 'FY 2026 (YTD)' },
  { id: 'LAST_YEAR', label: 'Last Year', periodLabel: 'FY 2025' },
];

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

const Expenses: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [expenses, setExpenses] = useState<Expense[]>(() => getStoredExpenses());
  const [recurringTemplates, setRecurringTemplates] = useState<RecurringTemplate[]>(() => getStoredExpenseTemplates());
  const [activeTab, setActiveTab] = useState<'ledger' | 'templates'>('ledger');

  // Synchronize active tab from URL query params (e.g. from alerts / notifications)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'templates' || tabParam === 'recurring' || tabParam === 'subscriptions') {
      setActiveTab('templates');
    } else if (tabParam === 'ledger') {
      setActiveTab('ledger');
    }
  }, [searchParams]);

  const shouldPersistExpensesRef = useRef(false);
  const shouldPersistTemplatesRef = useRef(false);

  // Listen for cloud sync & cross-tab updates
  useEffect(() => {
    const handleExpenseSync = () => {
      shouldPersistExpensesRef.current = false;
      setExpenses(getStoredExpenses());
    };
    const handleTemplateSync = () => {
      shouldPersistTemplatesRef.current = false;
      setRecurringTemplates(getStoredExpenseTemplates());
    };
    window.addEventListener('expenses_updated', handleExpenseSync);
    window.addEventListener('expense_templates_updated', handleTemplateSync);
    window.addEventListener('storage', handleExpenseSync);
    window.addEventListener('storage', handleTemplateSync);
    return () => {
      window.removeEventListener('expenses_updated', handleExpenseSync);
      window.removeEventListener('expense_templates_updated', handleTemplateSync);
      window.removeEventListener('storage', handleExpenseSync);
      window.removeEventListener('storage', handleTemplateSync);
    };
  }, []);

  useEffect(() => {
    if (!shouldPersistExpensesRef.current) return;
    shouldPersistExpensesRef.current = false;
    saveStoredExpenses(expenses);
    window.dispatchEvent(new CustomEvent('notifications-changed'));
    window.dispatchEvent(new Event('expenses_updated'));
  }, [expenses]);

  useEffect(() => {
    if (!shouldPersistTemplatesRef.current) return;
    shouldPersistTemplatesRef.current = false;
    saveStoredExpenseTemplates(recurringTemplates);
    window.dispatchEvent(new CustomEvent('notifications-changed'));
    window.dispatchEvent(new Event('expense_templates_updated'));
  }, [recurringTemplates]);

  // Modal states for One-Time Expense
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [newExpense, setNewExpense] = useState<Partial<Expense> & { saveAsRecurring?: boolean }>({});

  // Modal states for Recurring Template
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [newTemplate, setNewTemplate] = useState<Partial<RecurringTemplate>>({
    frequency: 'Monthly',
    dayOfMonth: 1,
    isActive: true,
  });

  // Filter states
  const [categories, setCategories] = useState<string[]>(['Payroll', 'Office', 'IT', 'Operations', 'Meals', 'Travel', 'Marketing']);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Recurring' | 'One-Time'>('All');
  const [dateFilter, setDateFilter] = useState<string>('Maximum');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  // Target month for posting (defaults to current month YYYY-MM e.g. 2026-11)
  const currentMonthStr = '2026-11';
  const [targetPostingMonth, setTargetPostingMonth] = useState<string>(currentMonthStr);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Search and filter states
  const [expenseSearch, setExpenseSearch] = useState<string>('');
  const [recurringSearch, setRecurringSearch] = useState<string>('');
  const [recurringCategoryFilter, setRecurringCategoryFilter] = useState<string>('All');
  const [recurringStatusFilter, setRecurringStatusFilter] = useState<'All' | 'Active' | 'Paused'>('All');

  // Check how many active recurring items are pending for target month
  const pendingTemplatesForTargetMonth = useMemo(() => {
    return recurringTemplates.filter((template) => {
      if (!template.isActive) return false;
      const alreadyPosted = expenses.some(
        (exp) => exp.recurringTemplateId === template.id && exp.date.startsWith(targetPostingMonth)
      );
      return !alreadyPosted;
    });
  }, [recurringTemplates, expenses, targetPostingMonth]);

  const totalMonthlyCommitment = useMemo(() => {
    return recurringTemplates
      .filter((t) => t.isActive && t.frequency === 'Monthly')
      .reduce((sum, curr) => sum + curr.amount, 0);
  }, [recurringTemplates]);

  // Overview Time Range filter state (This Month, Last Month, Last Quarter, This Year, Last Year)
  const [overviewTimeRange, setOverviewTimeRange] = useState<OverviewTimeRange>('THIS_MONTH');

  // Filter expenses matching the selected Overview Time Range
  const isExpenseInOverviewRange = (expDate: string, range: OverviewTimeRange) => {
    switch (range) {
      case 'THIS_MONTH':
        return expDate.startsWith('2026-11');
      case 'LAST_MONTH':
        return expDate.startsWith('2026-10');
      case 'LAST_QUARTER': {
        const monthPrefix = expDate.slice(0, 7);
        return monthPrefix === '2026-07' || monthPrefix === '2026-08' || monthPrefix === '2026-09';
      }
      case 'THIS_YEAR':
        return expDate.startsWith('2026');
      case 'LAST_YEAR':
        return expDate.startsWith('2025');
      default:
        return false;
    }
  };

  // Calculated metrics for the 4 Overview Cards based on selected Time Range
  const overviewMetrics = useMemo(() => {
    const currentRangeObj = OVERVIEW_RANGES.find((r) => r.id === overviewTimeRange) || OVERVIEW_RANGES[0];
    const rangeExpenses = expenses.filter((e) => isExpenseInOverviewRange(e.date, overviewTimeRange));

    const totalExpense = rangeExpenses.reduce((sum, e) => sum + e.amount, 0);
    const recurringExpenseLogged = rangeExpenses
      .filter((e) => e.isRecurring)
      .reduce((sum, e) => sum + e.amount, 0);
    const oneTimeExpenseLogged = rangeExpenses
      .filter((e) => !e.isRecurring)
      .reduce((sum, e) => sum + e.amount, 0);

    const pendingRecurringForMonth = recurringTemplates
      .filter((t) => t.isActive && !expenses.some((e) => e.recurringTemplateId === t.id && e.date.startsWith('2026-11')))
      .reduce((sum, t) => sum + t.amount, 0);

    // Displayed recurring expenses
    // In THIS_MONTH: if recurring hasn't been posted yet into ledger, show commitment base
    const displayRecurringExpense =
      overviewTimeRange === 'THIS_MONTH' && recurringExpenseLogged === 0
        ? totalMonthlyCommitment
        : recurringExpenseLogged;

    const recurringPercentage =
      totalExpense > 0
        ? Math.round((recurringExpenseLogged / totalExpense) * 100)
        : overviewTimeRange === 'THIS_MONTH' && totalMonthlyCommitment > 0
          ? 100
          : 0;

    const oneTimePercentage =
      totalExpense > 0
        ? Math.round((oneTimeExpenseLogged / totalExpense) * 100)
        : 0;

    // Category breakdown
    const categoryTotals: Record<string, number> = {};
    rangeExpenses.forEach((e) => {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    });

    // If viewing This Month and recurring items are still pending, combine pending commitments for preview
    const effectiveCategoryTotals = { ...categoryTotals };
    if (overviewTimeRange === 'THIS_MONTH' && recurringExpenseLogged === 0) {
      recurringTemplates.filter((t) => t.isActive).forEach((t) => {
        effectiveCategoryTotals[t.category] = (effectiveCategoryTotals[t.category] || 0) + t.amount;
      });
    }

    const effectiveTotal = Object.values(effectiveCategoryTotals).reduce((s, a) => s + a, 0);

    const categoryColorMap: Record<string, string> = {
      Payroll: '#4F46E5',    // Indigo
      Office: '#10B981',     // Emerald
      IT: '#F59E0B',         // Amber
      Operations: '#8B5CF6', // Purple
      Meals: '#EC4899',      // Pink
      Travel: '#06B6D4',     // Cyan
      Marketing: '#F97316',  // Orange
    };

    const sortedCategories = Object.entries(effectiveCategoryTotals)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amt]) => ({
        category: cat,
        amount: amt,
        percentage: effectiveTotal > 0 ? Math.round((amt / effectiveTotal) * 100) : 0,
        color: categoryColorMap[cat] || '#6B7280',
      }));

    // Forecasted Expense computed strictly from actual recorded expenses & recurring commitments
    let forecastAmount = 0;
    let forecastSubtitle = '';
    let forecastBadge = 'Projected Run-rate';

    switch (overviewTimeRange) {
      case 'THIS_MONTH':
        forecastAmount = totalExpense + (recurringExpenseLogged === 0 ? totalMonthlyCommitment : pendingRecurringForMonth);
        forecastSubtitle =
          forecastAmount > 0
            ? `Commitments (${formatCurrency(totalMonthlyCommitment)}) + logged spend`
            : 'No expenses or commitments recorded';
        forecastBadge = 'Month-End Run-rate';
        break;
      case 'LAST_MONTH':
        forecastAmount = totalExpense;
        forecastSubtitle =
          totalExpense > 0 ? `Closed at ${formatCurrency(totalExpense)}` : 'No expenses recorded last month';
        forecastBadge = 'Actual Closed';
        break;
      case 'LAST_QUARTER':
        forecastAmount = totalExpense > 0 ? totalExpense : totalMonthlyCommitment * 3;
        forecastSubtitle =
          totalMonthlyCommitment > 0
            ? `Quarterly run-rate (${formatCurrency(totalMonthlyCommitment * 3)} base commitments)`
            : 'Based on recorded quarterly expenses';
        forecastBadge = 'Quarterly Run-rate';
        break;
      case 'THIS_YEAR':
        forecastAmount =
          totalMonthlyCommitment > 0 ? totalMonthlyCommitment * 12 + oneTimeExpenseLogged : totalExpense;
        forecastSubtitle =
          totalMonthlyCommitment > 0
            ? 'Annualized pacing for FY 2026 across 12 months'
            : 'Based on recorded FY 2026 expenses';
        forecastBadge = 'Annual Pacing';
        break;
      case 'LAST_YEAR':
        forecastAmount = totalExpense;
        forecastSubtitle =
          totalExpense > 0 ? `Closed at ${formatCurrency(totalExpense)}` : 'No expenses recorded for FY 2025';
        forecastBadge = 'Actual Closed';
        break;
    }

    return {
      rangeLabel: currentRangeObj.label,
      periodLabel: currentRangeObj.periodLabel,
      totalExpense,
      recurringExpenseLogged,
      displayRecurringExpense,
      recurringPercentage,
      oneTimeExpenseLogged,
      oneTimePercentage,
      totalEntriesCount: rangeExpenses.length,
      recurringEntriesCount: rangeExpenses.filter((e) => e.isRecurring).length,
      oneTimeEntriesCount: rangeExpenses.filter((e) => !e.isRecurring).length,
      pendingRecurringForMonth,
      sortedCategories,
      forecastAmount,
      forecastSubtitle,
      forecastBadge,
    };
  }, [overviewTimeRange, expenses, recurringTemplates, totalMonthlyCommitment]);

  // Date filtering logic
  const dateRange = useMemo(() => {
    const today = new Date('2026-11-17T12:00:00');
    today.setHours(23, 59, 59, 999);

    const startOfDay = (d: Date) => {
      const newD = new Date(d);
      newD.setHours(0, 0, 0, 0);
      return newD;
    };

    switch (dateFilter) {
      case 'Last 7 Days':
        return { start: startOfDay(new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000)), end: today };
      case 'Last 15 Days':
        return { start: startOfDay(new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000)), end: today };
      case 'Last 30 Days':
        return { start: startOfDay(new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000)), end: today };
      case 'This Month':
        return { start: new Date('2026-11-01T00:00:00'), end: new Date('2026-11-30T23:59:59') };
      case 'This Quarter':
        // Q4 2026 (Oct 1 to Dec 31)
        return { start: new Date('2026-10-01T00:00:00'), end: new Date('2026-12-31T23:59:59') };
      case 'This Year':
        return { start: new Date('2026-01-01T00:00:00'), end: new Date('2026-12-31T23:59:59') };
      case 'Last Month':
        return { start: new Date('2026-10-01T00:00:00'), end: new Date('2026-10-31T23:59:59') };
      case 'Last Year':
        return { start: new Date('2025-01-01T00:00:00'), end: new Date('2025-12-31T23:59:59') };
      case 'Custom Range':
        return {
          start: customStart ? startOfDay(new Date(customStart)) : new Date(0),
          end: customEnd ? new Date(new Date(customEnd).setHours(23, 59, 59, 999)) : today,
        };
      default:
        return null;
    }
  }, [dateFilter, customStart, customEnd]);

  // Filtered expenses list for table ledger
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      // Search filter
      if (expenseSearch.trim()) {
        const query = expenseSearch.toLowerCase().trim();
        const matchDesc = e.description.toLowerCase().includes(query);
        const matchCat = e.category.toLowerCase().includes(query);
        const matchAmount = e.amount.toString().includes(query) || formatCurrency(e.amount).toLowerCase().includes(query);
        const matchDate = e.date.toLowerCase().includes(query) || formatDateDMY(e.date).toLowerCase().includes(query);
        if (!matchDesc && !matchCat && !matchAmount && !matchDate) return false;
      }
      // Category filter
      if (categoryFilter !== 'All' && e.category !== categoryFilter) return false;
      // Type filter
      if (typeFilter === 'Recurring' && !e.isRecurring) return false;
      if (typeFilter === 'One-Time' && e.isRecurring) return false;
      // Date filter
      if (dateRange) {
        const d = new Date(e.date);
        if (d < dateRange.start || d > dateRange.end) return false;
      }
      return true;
    });
  }, [expenses, expenseSearch, categoryFilter, typeFilter, dateRange]);

  // Comparison interfaces
  interface CategoryDiff {
    category: string;
    currentAmount: number;
    previousAmount: number;
    diff: number;
    percentChange: number;
    color: string;
  }

  // Aggregate data for category chart
  const getMonthYear = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('default', { month: 'short', year: 'numeric' });
  };

  const categoryColorMap: Record<string, string> = {
    Payroll: '#4F46E5',
    Office: '#10B981',
    IT: '#F59E0B',
    Operations: '#8B5CF6',
    Meals: '#EC4899',
    Travel: '#06B6D4',
    Marketing: '#F97316',
  };

  // Comparative metrics and Chart data
  const { periodComparison, chartData, activeCategories } = useMemo(() => {
    let currentExpenses: Expense[] = [];
    let previousExpenses: Expense[] = [];
    let currentPeriodName = '';
    let previousPeriodName = '';
    let hasComparison = false;
    let chartExpenses: Expense[] = filteredExpenses;

    // Filter candidate expenses according to search, category, and type filters
    const baseExpenses = expenses.filter((e) => {
      if (categoryFilter !== 'All' && e.category !== categoryFilter) return false;
      if (typeFilter === 'Recurring' && !e.isRecurring) return false;
      if (typeFilter === 'One-Time' && e.isRecurring) return false;
      if (expenseSearch.trim()) {
        const query = expenseSearch.toLowerCase().trim();
        const matchDesc = e.description.toLowerCase().includes(query);
        const matchCat = e.category.toLowerCase().includes(query);
        const matchAmount = e.amount.toString().includes(query) || formatCurrency(e.amount).toLowerCase().includes(query);
        if (!matchDesc && !matchCat && !matchAmount) return false;
      }
      return true;
    });

    if (dateFilter === 'This Month') {
      hasComparison = true;
      currentPeriodName = 'This Month (Nov 2026)';
      previousPeriodName = 'Last Month (Oct 2026)';
      currentExpenses = baseExpenses.filter((e) => e.date.startsWith('2026-11'));
      previousExpenses = baseExpenses.filter((e) => e.date.startsWith('2026-10'));
      chartExpenses = [...previousExpenses, ...currentExpenses];
    } else if (dateFilter === 'This Quarter') {
      hasComparison = true;
      currentPeriodName = 'This Quarter (Q4 2026)';
      previousPeriodName = 'Last Quarter (Q3 2026)';
      currentExpenses = baseExpenses.filter((e) => e.date.startsWith('2026-10') || e.date.startsWith('2026-11') || e.date.startsWith('2026-12'));
      previousExpenses = baseExpenses.filter((e) => e.date.startsWith('2026-07') || e.date.startsWith('2026-08') || e.date.startsWith('2026-09'));
      chartExpenses = [...previousExpenses, ...currentExpenses];
    } else if (dateFilter === 'This Year') {
      hasComparison = true;
      currentPeriodName = 'This Year (FY 2026)';
      previousPeriodName = 'Last Year (FY 2025)';
      currentExpenses = baseExpenses.filter((e) => e.date.startsWith('2026'));
      previousExpenses = baseExpenses.filter((e) => e.date.startsWith('2025'));
      chartExpenses = baseExpenses;
    } else if (dateFilter === 'Last Month') {
      hasComparison = true;
      currentPeriodName = 'October 2026';
      previousPeriodName = 'September 2026';
      currentExpenses = baseExpenses.filter((e) => e.date.startsWith('2026-10'));
      previousExpenses = baseExpenses.filter((e) => e.date.startsWith('2026-09'));
      chartExpenses = [...previousExpenses, ...currentExpenses];
    } else {
      chartExpenses = filteredExpenses;
    }

    const currentTotal = currentExpenses.reduce((s, e) => s + e.amount, 0);
    const previousTotal = previousExpenses.reduce((s, e) => s + e.amount, 0);
    const diff = currentTotal - previousTotal;
    const percentChange = previousTotal > 0 ? Math.round((diff / previousTotal) * 100) : 0;

    const allCategoriesInvolved = Array.from(
      new Set([...currentExpenses.map((e) => e.category), ...previousExpenses.map((e) => e.category)])
    );

    const categoryComparisons: CategoryDiff[] = allCategoriesInvolved.map((cat) => {
      const cAmt = currentExpenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0);
      const pAmt = previousExpenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0);
      const cDiff = cAmt - pAmt;
      const cPct = pAmt > 0 ? Math.round((cDiff / pAmt) * 100) : cAmt > 0 ? 100 : 0;
      return {
        category: cat,
        currentAmount: cAmt,
        previousAmount: pAmt,
        diff: cDiff,
        percentChange: cPct,
        color: categoryColorMap[cat] || '#6B7280',
      };
    }).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

    let pendingNote: string | undefined = undefined;
    if (dateFilter === 'This Month' && pendingTemplatesForTargetMonth.length > 0) {
      pendingNote = `${pendingTemplatesForTargetMonth.length} recurring commitments pending to post for Nov`;
    }

    const grouped = chartExpenses.reduce((acc, curr) => {
      const month = getMonthYear(curr.date);
      if (!acc[month]) acc[month] = { name: month };
      if (!acc[month][curr.category]) acc[month][curr.category] = 0;
      acc[month][curr.category] += curr.amount;
      return acc;
    }, {} as Record<string, Record<string, any>>);

    const sortedChartData = Object.values(grouped).sort((a, b) => {
      const da = new Date('1 ' + a.name);
      const db = new Date('1 ' + b.name);
      return da.getTime() - db.getTime();
    });

    const activeCats = new Set<string>();
    sortedChartData.forEach((row) => {
      Object.keys(row).forEach((k) => {
        if (k !== 'name') activeCats.add(k);
      });
    });

    return {
      periodComparison: {
        hasComparison,
        currentPeriodName,
        previousPeriodName,
        currentTotal,
        previousTotal,
        diff,
        percentChange,
        categoryComparisons,
        pendingNote,
      },
      chartData: sortedChartData,
      activeCategories: Array.from(activeCats),
    };
  }, [dateFilter, expenses, categoryFilter, typeFilter, expenseSearch, pendingTemplatesForTargetMonth, filteredExpenses]);

  // Type breakdown for the current period (% and actuals of Recurring vs One-time)
  const typeBreakdown = useMemo(() => {
    const recurringAmount = filteredExpenses
      .filter((e) => e.isRecurring)
      .reduce((sum, e) => sum + e.amount, 0);
    const oneTimeAmount = filteredExpenses
      .filter((e) => !e.isRecurring)
      .reduce((sum, e) => sum + e.amount, 0);
    const totalAmount = recurringAmount + oneTimeAmount;

    const recurringPct = totalAmount > 0 ? Math.round((recurringAmount / totalAmount) * 100) : 0;
    const oneTimePct = totalAmount > 0 ? 100 - recurringPct : 0;

    const pieData = [
      { name: 'Recurring Expense', value: recurringAmount, color: '#10B981' },
      { name: 'One-time Expense', value: oneTimeAmount, color: '#F59E0B' },
    ].filter((d) => d.value > 0);

    return {
      recurringAmount,
      oneTimeAmount,
      totalAmount,
      recurringPct,
      oneTimePct,
      recurringCount: filteredExpenses.filter((e) => e.isRecurring).length,
      oneTimeCount: filteredExpenses.filter((e) => !e.isRecurring).length,
      pieData: pieData.length > 0 ? pieData : [{ name: 'No Expense', value: 1, color: '#E5E7EB' }],
    };
  }, [filteredExpenses]);

  // 1-Click Apply all recurring expenses for the selected month
  const handleApplyRecurringForMonth = (monthStr: string) => {
    const itemsToPost = recurringTemplates.filter((t) => {
      if (!t.isActive) return false;
      const alreadyPosted = expenses.some(
        (exp) => exp.recurringTemplateId === t.id && exp.date.startsWith(monthStr)
      );
      return !alreadyPosted;
    });

    if (itemsToPost.length === 0) {
      setActionMessage(`All active recurring expenses for ${monthStr} have already been applied.`);
      setTimeout(() => setActionMessage(null), 4000);
      return;
    }

    const newExpenseEntries: Expense[] = itemsToPost.map((t) => {
      const day = String(Math.min(Math.max(t.dayOfMonth, 1), 28)).padStart(2, '0');
      return {
        id: `rec-entry-${Math.random().toString(36).substr(2, 9)}`,
        description: t.title,
        category: t.category,
        amount: t.amount,
        date: `${monthStr}-${day}`,
        isRecurring: true,
        recurringTemplateId: t.id,
      };
    });

    shouldPersistExpensesRef.current = true;
    setExpenses((prev) => [...newExpenseEntries, ...prev]);
    setActionMessage(`Successfully posted ${newExpenseEntries.length} recurring expenses (${formatCurrency(
      newExpenseEntries.reduce((s, c) => s + c.amount, 0)
    )}) for ${monthStr}!`);
    setTimeout(() => setActionMessage(null), 5000);
  };

  // Post a single template immediately for the target month
  const handlePostSingleTemplate = (template: RecurringTemplate) => {
    const alreadyPosted = expenses.some(
      (exp) => exp.recurringTemplateId === template.id && exp.date.startsWith(targetPostingMonth)
    );
    if (alreadyPosted) {
      alert(`"${template.title}" has already been posted for ${targetPostingMonth}.`);
      return;
    }
    const day = String(Math.min(Math.max(template.dayOfMonth, 1), 28)).padStart(2, '0');
    const newEntry: Expense = {
      id: `rec-entry-${Math.random().toString(36).substr(2, 9)}`,
      description: template.title,
      category: template.category,
      amount: template.amount,
      date: `${targetPostingMonth}-${day}`,
      isRecurring: true,
      recurringTemplateId: template.id,
    };
    shouldPersistExpensesRef.current = true;
    setExpenses((prev) => [newEntry, ...prev]);
    setActionMessage(`Posted "${template.title}" for ${targetPostingMonth}!`);
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Toggle template active / paused
  const handleToggleTemplateActive = (id: string) => {
    shouldPersistTemplatesRef.current = true;
    setRecurringTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isActive: !t.isActive } : t))
    );
  };

  // Delete recurring template
  const handleDeleteTemplate = (id: string) => {
    if (window.confirm('Are you sure you want to delete this recurring expense?')) {
      shouldPersistTemplatesRef.current = true;
      setRecurringTemplates((prev) => prev.filter((t) => t.id !== id));
    }
  };

  // Filtered recurring templates based on search, category, and status filters
  const filteredRecurringTemplates = useMemo(() => {
    return recurringTemplates.filter((t) => {
      // Search matching across all attributes of recurring expense
      if (recurringSearch.trim()) {
        const query = recurringSearch.toLowerCase().trim();
        const matchTitle = t.title.toLowerCase().includes(query);
        const matchNotes = (t.notes || '').toLowerCase().includes(query);
        const matchCat = t.category.toLowerCase().includes(query);
        const matchAmount = t.amount.toString().includes(query) || formatCurrency(t.amount).toLowerCase().includes(query);
        const matchSchedule = `day ${t.dayOfMonth}`.toLowerCase().includes(query) || t.frequency.toLowerCase().includes(query);
        const isAlreadyPosted = expenses.some(
          (exp) => exp.recurringTemplateId === t.id && exp.date.startsWith(targetPostingMonth)
        );
        const matchStatus = (isAlreadyPosted ? 'posted' : 'pending').includes(query);
        const matchActive = (t.isActive ? 'active' : 'paused').includes(query);

        if (!matchTitle && !matchNotes && !matchCat && !matchAmount && !matchSchedule && !matchStatus && !matchActive) {
          return false;
        }
      }
      // Category filter
      if (recurringCategoryFilter !== 'All' && t.category !== recurringCategoryFilter) {
        return false;
      }
      // Status filter
      if (recurringStatusFilter === 'Active' && !t.isActive) return false;
      if (recurringStatusFilter === 'Paused' && t.isActive) return false;

      return true;
    });
  }, [recurringTemplates, recurringSearch, recurringCategoryFilter, recurringStatusFilter, expenses, targetPostingMonth]);

  // Save Recurring Template Modal
  const handleSaveTemplate = () => {
    if (!newTemplate.title || !newTemplate.amount) {
      alert('Please enter a title and amount for the recurring expense.');
      return;
    }

    const cat = newTemplate.category || 'Office';
    if (!categories.includes(cat)) {
      setCategories([...categories, cat]);
    }

    if (editingTemplateId) {
      shouldPersistTemplatesRef.current = true;
      setRecurringTemplates((prev) =>
        prev.map((t) =>
          t.id === editingTemplateId
            ? ({
              ...t,
              ...newTemplate,
              amount: Number(newTemplate.amount),
              dayOfMonth: Number(newTemplate.dayOfMonth || 1),
              category: cat,
            } as RecurringTemplate)
            : t
        )
      );
    } else {
      const created: RecurringTemplate = {
        id: `rec-${Math.random().toString(36).substr(2, 9)}`,
        title: newTemplate.title,
        category: cat,
        amount: Number(newTemplate.amount),
        dayOfMonth: Number(newTemplate.dayOfMonth || 1),
        frequency: (newTemplate.frequency as any) || 'Monthly',
        isActive: newTemplate.isActive !== false,
        notes: newTemplate.notes || '',
      };
      shouldPersistTemplatesRef.current = true;
      setRecurringTemplates((prev) => [...prev, created]);
    }

    setIsAddingTemplate(false);
    setEditingTemplateId(null);
    setNewTemplate({ frequency: 'Monthly', dayOfMonth: 1, isActive: true });
  };

  // Save Regular Expense Modal
  const handleSaveExpense = () => {
    if (!newExpense.description || !newExpense.amount) {
      alert('Please fill in Description and Amount.');
      return;
    }

    const categoryToSave = newExpense.category || 'Office';
    if (!categories.includes(categoryToSave)) {
      setCategories([...categories, categoryToSave]);
    }

    const expDate = newExpense.date || new Date().toISOString().split('T')[0];

    // If marked to save as recurring template too
    if (newExpense.saveAsRecurring && !editingExpenseId) {
      const templateDay = new Date(expDate).getDate() || 1;
      const createdTemplate: RecurringTemplate = {
        id: `rec-${Math.random().toString(36).substr(2, 9)}`,
        title: newExpense.description,
        category: categoryToSave,
        amount: Number(newExpense.amount),
        dayOfMonth: templateDay,
        frequency: 'Monthly',
        isActive: true,
        notes: 'Created from manual expense entry',
      };
      shouldPersistTemplatesRef.current = true;
      setRecurringTemplates((prev) => [...prev, createdTemplate]);
    }

    if (editingExpenseId) {
      shouldPersistExpensesRef.current = true;
      setExpenses((prev) =>
        prev.map((e) =>
          e.id === editingExpenseId
            ? {
              ...e,
              description: newExpense.description || '',
              category: categoryToSave,
              amount: Number(newExpense.amount),
              date: expDate,
            }
            : e
        )
      );
    } else {
      shouldPersistExpensesRef.current = true;
      setExpenses((prev) => [
        {
          id: Math.random().toString(36).substr(2, 9),
          description: newExpense.description || '',
          category: categoryToSave,
          amount: Number(newExpense.amount),
          date: expDate,
          isRecurring: !!newExpense.saveAsRecurring,
        },
        ...prev,
      ]);
    }

    setIsAddingExpense(false);
    setEditingExpenseId(null);
    setNewExpense({});
  };

  const handleEditExpenseClick = (expense: Expense) => {
    setNewExpense(expense);
    setEditingExpenseId(expense.id);
    setIsAddingExpense(true);
  };

  const handleDeleteExpense = (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      shouldPersistExpensesRef.current = true;
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Notification Toast/Banner */}
      {actionMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{actionMessage}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header and Quick Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-heading font-bold text-gray-900">Expenses & Fixed Commitments</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Track operational spending, automate recurring subscriptions & salaries, and review cost allocations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {pendingTemplatesForTargetMonth.length > 0 && activeTab === 'ledger' && (
            <button
              onClick={() => setActiveTab('templates')}
              className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-3 py-2 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
              title="Click to view and post pending recurring expenses"
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>{pendingTemplatesForTargetMonth.length} Recurring Pending ({targetPostingMonth})</span>
            </button>
          )}

          {activeTab === 'ledger' ? (
            <button
              onClick={() => {
                setNewExpense({ date: new Date().toISOString().split('T')[0] });
                setIsAddingExpense(true);
              }}
              className="bg-indigo-600 text-white px-3.5 py-2 rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2 text-sm shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Expense
            </button>
          ) : (
            <button
              onClick={() => {
                setNewTemplate({ frequency: 'Monthly', dayOfMonth: 1, isActive: true });
                setEditingTemplateId(null);
                setIsAddingTemplate(true);
              }}
              className="bg-indigo-600 text-white px-3.5 py-2 rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2 text-sm shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Recurring Expense
            </button>
          )}
        </div>
      </div>

      {/* Time Range Selector & High-Level Overview Section */}
      <div className="space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-gray-900 font-heading flex items-center gap-2">
              Expense Overview
              <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2.5 py-0.5 rounded-full font-sans">
                {overviewMetrics.periodLabel}
              </span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              High-level spending overview, recurring obligations, one-time expenses, and forecasted run-rate.
            </p>
          </div>

          {/* Time Range Filter Bar */}
          <div className="inline-flex p-1 bg-gray-100 rounded-xl border border-gray-200 self-start sm:self-auto shadow-inner text-xs">
            {OVERVIEW_RANGES.map((rng) => {
              const isSelected = overviewTimeRange === rng.id;
              return (
                <button
                  key={rng.id}
                  onClick={() => setOverviewTimeRange(rng.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all duration-150 ${isSelected
                      ? 'bg-white text-indigo-600 shadow-sm font-semibold'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                    }`}
                >
                  {rng.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4 Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
          {/* Card 1: Total Expenses */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                {overviewMetrics.totalEntriesCount} {overviewMetrics.totalEntriesCount === 1 ? 'Expense' : 'Expenses'}
              </span>
            </div>
            <div className="mt-3">
              <span className="text-xs font-medium text-gray-500 block">Total Expenses</span>
              <h3 className="text-2xl sm:text-[26px] font-bold font-heading text-gray-900 tracking-tight mt-1">
                {formatCurrency(overviewMetrics.totalExpense)}
              </h3>
            </div>
          </div>

          {/* Card 2: Total of Recurring Expenses */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <Repeat className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                {overviewMetrics.recurringPercentage}% of total
              </span>
            </div>
            <div className="mt-3">
              <span className="text-xs font-medium text-gray-500 block">Total Recurring Expenses</span>
              <h3 className="text-2xl sm:text-[26px] font-bold font-heading text-gray-900 tracking-tight mt-1">
                {formatCurrency(overviewMetrics.displayRecurringExpense)}
              </h3>
            </div>
          </div>

          {/* Card 3: Total One-time Expense */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                <IndianRupee className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                {overviewMetrics.oneTimePercentage}% of total
              </span>
            </div>
            <div className="mt-3">
              <span className="text-xs font-medium text-gray-500 block">Total One-time Expense</span>
              <h3 className="text-2xl sm:text-[26px] font-bold font-heading text-gray-900 tracking-tight mt-1">
                {formatCurrency(overviewMetrics.oneTimeExpenseLogged)}
              </h3>
            </div>
          </div>

          {/* Card 4: Forecasted Expense */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                {overviewMetrics.forecastBadge}
              </span>
            </div>
            <div className="mt-3">
              <span className="text-xs font-medium text-gray-500 block">Forecasted Expense</span>
              <h3 className="text-2xl sm:text-[26px] font-bold font-heading text-gray-900 tracking-tight mt-1">
                {formatCurrency(overviewMetrics.forecastAmount)}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-gray-200 gap-1 text-sm font-medium">
        <button
          onClick={() => {
            setActiveTab('ledger');
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              next.set('tab', 'ledger');
              return next;
            });
          }}
          className={`px-4 py-2.5 border-b-2 flex items-center gap-2 transition-colors ${activeTab === 'ledger'
              ? 'border-indigo-600 text-indigo-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
        >
          <Layers className="w-4 h-4" />
          <span>Expenses Ledger ({filteredExpenses.length})</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('templates');
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              next.set('tab', 'templates');
              return next;
            });
          }}
          className={`px-4 py-2.5 border-b-2 flex items-center gap-2 transition-colors ${activeTab === 'templates'
              ? 'border-indigo-600 text-indigo-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
        >
          <Repeat className="w-4 h-4" />
          <span>Recurring Expenses ({recurringTemplates.length})</span>
        </button>
      </div>

      {/* ===================== VIEW 1: EXPENSES LEDGER ===================== */}
      {activeTab === 'ledger' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm text-xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search Bar */}
              <div className="relative min-w-[180px] max-w-xs">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search expenses..."
                  value={expenseSearch}
                  onChange={(e) => setExpenseSearch(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                />
                {expenseSearch && (
                  <button
                    onClick={() => setExpenseSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Type Filter */}
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setTypeFilter('All')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${typeFilter === 'All' ? 'bg-white text-indigo-600 shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  All Expenses
                </button>
                <button
                  onClick={() => setTypeFilter('Recurring')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${typeFilter === 'Recurring' ? 'bg-white text-indigo-600 shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <Repeat className="w-3 h-3 text-indigo-500" /> Recurring Only
                </button>
                <button
                  onClick={() => setTypeFilter('One-Time')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${typeFilter === 'One-Time' ? 'bg-white text-indigo-600 shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  One-Time Only
                </button>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 shadow-2xs">
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                <select
                  className="focus:outline-none text-xs bg-transparent cursor-pointer font-medium text-gray-700"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="All">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Filter */}
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <select
                  className="focus:outline-none text-xs bg-transparent cursor-pointer font-medium text-gray-700"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="This Month">This Month (vs Last Month)</option>
                  <option value="This Quarter">This Quarter (vs Last Quarter)</option>
                  <option value="This Year">This Year (vs Last Year)</option>
                  <option value="Last Month">Last Month (vs Prev Month)</option>
                  <option value="Last 30 Days">Last 30 Days</option>
                  <option value="Maximum">All Time</option>
                  <option value="Custom Range">Custom Range</option>
                </select>
              </div>

              {dateFilter === 'Custom Range' && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    className="border border-gray-300 rounded px-2 py-1 text-xs"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                  />
                  <span className="text-gray-400">to</span>
                  <input
                    type="date"
                    className="border border-gray-300 rounded px-2 py-1 text-xs"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="text-gray-500 font-medium">
              Total In View: <strong className="text-gray-900">{formatCurrency(filteredExpenses.reduce((s, c) => s + c.amount, 0))}</strong>
            </div>
          </div>

          {/* 2-Column Expense Breakdown Section */}
          <div className="space-y-4">
            {/* Period Comparison & Variance Summary Banner */}
            {periodComparison.hasComparison && (
              <div className="bg-gradient-to-r from-gray-50 via-indigo-50/20 to-gray-50 p-4 rounded-xl border border-gray-200/90 text-xs shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg flex-shrink-0 ${periodComparison.diff <= 0
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                        }`}
                    >
                      {periodComparison.diff <= 0 ? (
                        <TrendingDown className="w-5 h-5" />
                      ) : (
                        <TrendingUp className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm">
                          {periodComparison.currentPeriodName} vs {periodComparison.previousPeriodName}
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${periodComparison.diff <= 0
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                        >
                          {periodComparison.diff > 0 ? '+' : ''}
                          {formatCurrency(periodComparison.diff)} ({periodComparison.percentChange > 0 ? '+' : ''}
                          {periodComparison.percentChange}%)
                        </span>
                      </div>
                      <p className="text-gray-500 text-xs mt-0.5">
                        Current Period: <strong className="text-gray-800">{formatCurrency(periodComparison.currentTotal)}</strong>
                        {' · '}
                        Previous Period: <strong className="text-gray-800">{formatCurrency(periodComparison.previousTotal)}</strong>
                        {periodComparison.pendingNote && (
                          <span className="text-indigo-600 font-medium ml-1.5">
                            ({periodComparison.pendingNote})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right self-start sm:self-auto">
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-gray-400 block">
                      Net Period Difference
                    </span>
                    <span
                      className={`text-sm font-bold font-heading ${periodComparison.diff <= 0 ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                    >
                      {periodComparison.diff <= 0 ? 'Decreased by ' : 'Increased by '}
                      {formatCurrency(Math.abs(periodComparison.diff))}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 2-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Column 1: Expense Breakdown by Category */}
              <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <div>
                      <h3 className="text-base font-heading font-bold text-gray-900">Expenses Breakdown by Category</h3>
                      <p className="text-xs text-gray-500">
                        {periodComparison.hasComparison
                          ? `Monthly category volume for ${periodComparison.currentPeriodName}`
                          : 'Monthly expense volume across categories'}
                      </p>
                    </div>
                    <span className="text-xs text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md font-semibold self-start sm:self-auto">
                      {chartData.length} {chartData.length === 1 ? 'Month Tracked' : 'Months Tracked'}
                    </span>
                  </div>

                  <div className="h-64 sm:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#6B7280', fontSize: 11 }}
                          tickFormatter={(val) => `₹${val >= 1000 ? `${Math.round(val / 1000)}k` : val}`}
                        />
                        <RechartsTooltip cursor={{ fill: '#F9FAFB' }} formatter={(val) => [`₹${Number(val).toLocaleString()}`, undefined]} />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                        {activeCategories.map((category) => (
                          <Bar
                            key={category}
                            dataKey={category}
                            fill={categoryColorMap[category] || '#6366F1'}
                            radius={[4, 4, 0, 0]}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Column 2: Expense Breakdown by Type (Pie Chart) */}
              <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div>
                      <h3 className="text-base font-heading font-bold text-gray-900">Expense Breakdown by Type</h3>
                      <p className="text-xs text-gray-500">Recurring commitments vs one-time expenses</p>
                    </div>
                    <span className="text-xs text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md font-semibold self-start sm:self-auto">
                      Total: {formatCurrency(typeBreakdown.totalAmount)}
                    </span>
                  </div>

                  <div className="h-52 sm:h-56 relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={typeBreakdown.pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {typeBreakdown.pieData.map((entry, index) => (
                            <Cell key={`type-cell-${index}`} fill={entry.color} stroke="#FFFFFF" strokeWidth={2} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={(val) => [
                            `${formatCurrency(Number(val))} (${typeBreakdown.totalAmount > 0 ? Math.round((Number(val) / typeBreakdown.totalAmount) * 100) : 0}%)`,
                            'Amount',
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Actuals & % Detail Cards */}
                <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-100">
                  <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-semibold mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      <span>Recurring Expense</span>
                    </div>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-base font-bold font-heading text-gray-900">
                        {formatCurrency(typeBreakdown.recurringAmount)}
                      </span>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                        {typeBreakdown.recurringPct}%
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500 block mt-0.5">
                      {typeBreakdown.recurringCount} obligations paid
                    </span>
                  </div>

                  <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl">
                    <div className="flex items-center gap-1.5 text-xs text-amber-800 font-semibold mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      <span>One-Time Expense</span>
                    </div>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-base font-bold font-heading text-gray-900">
                        {formatCurrency(typeBreakdown.oneTimeAmount)}
                      </span>
                      <span className="text-xs font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                        {typeBreakdown.oneTimePct}%
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500 block mt-0.5">
                      {typeBreakdown.oneTimeCount} variable expenses
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Expenses Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-heading font-bold text-gray-900 text-sm">Expense Records</h3>
              <span className="text-xs text-gray-500">{filteredExpenses.length} entries</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200 uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3.5 px-4 text-gray-700 font-medium whitespace-nowrap">
                        {formatDateDMY(expense.date)}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-gray-900 flex items-center gap-2">
                        <IndianRupee className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span>{expense.description}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[11px] font-medium">
                          {expense.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {expense.isRecurring ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                            <Repeat className="w-3 h-3 text-indigo-600" />
                            Recurring
                          </span>
                        ) : (
                          <span className="text-[11px] text-gray-500 font-medium">One-Time</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-gray-900 whitespace-nowrap">
                        ₹{expense.amount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleEditExpenseClick(expense)}
                          className="text-gray-400 hover:text-indigo-600 transition-colors mr-3"
                          title="Edit Expense"
                        >
                          <Edit className="w-4 h-4 inline" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="text-gray-400 hover:text-rose-600 transition-colors"
                          title="Delete Expense"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredExpenses.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-500">
                        <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="font-medium">No expenses found matching the selected filters.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== VIEW 2: RECURRING EXPENSES ===================== */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          {/* Dedicated Subscriptions Callout Banner */}
          <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 border border-indigo-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="flex items-start sm:items-center gap-3 text-indigo-950">
              <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg flex-shrink-0">
                <CalendarClock className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-sm block sm:inline">Looking to track Subscriptions & Software Renewals?</span>
                <span className="text-indigo-700 sm:ml-1.5 block sm:inline mt-0.5 sm:mt-0">
                  Track SaaS tools, renewal dates, and billing durations (for Shankara & on behalf of clients) in the dedicated Subscriptions window.
                </span>
              </div>
            </div>
            <Link
              to="/subscriptions"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-lg font-semibold whitespace-nowrap shadow-2xs transition-colors flex items-center justify-center gap-1.5 self-start sm:self-auto"
            >
              <span>Open Subscriptions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Header Controls Bar */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div>
              <h2 className="text-lg font-heading font-bold text-gray-900">Recurring Expenses</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Manage monthly repeating operational obligations (salaries, office lease, accounting retainer, broadband). Post them directly to your monthly ledger with 1-click.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Target Month Picker */}
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg text-xs font-medium">
                <span className="text-gray-500">Target Month:</span>
                <input
                  type="month"
                  value={targetPostingMonth}
                  onChange={(e) => setTargetPostingMonth(e.target.value)}
                  className="bg-white border border-gray-300 rounded px-2 py-0.5 font-bold text-gray-800 cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Post All Pending Button */}
              <button
                onClick={() => handleApplyRecurringForMonth(targetPostingMonth)}
                disabled={pendingTemplatesForTargetMonth.length === 0}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${pendingTemplatesForTargetMonth.length > 0
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer hover:shadow'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                  }`}
              >
                <Zap className="w-4 h-4" />
                <span>
                  {pendingTemplatesForTargetMonth.length > 0
                    ? `Post All Pending (${pendingTemplatesForTargetMonth.length}) for ${targetPostingMonth}`
                    : `All Posted for ${targetPostingMonth}`}
                </span>
              </button>

              {/* Add Recurring Expense Button */}
              <button
                onClick={() => {
                  setNewTemplate({ frequency: 'Monthly', dayOfMonth: 1, isActive: true });
                  setEditingTemplateId(null);
                  setIsAddingTemplate(true);
                }}
                className="bg-indigo-600 text-white px-3.5 py-2 rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2 text-xs shadow-sm transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 h-4" /> Add Recurring Expense
              </button>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm text-xs">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search recurring expenses..."
                  value={recurringSearch}
                  onChange={(e) => setRecurringSearch(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                />
                {recurringSearch && (
                  <button
                    onClick={() => setRecurringSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 shadow-2xs">
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                <select
                  className="focus:outline-none text-xs bg-transparent cursor-pointer font-medium text-gray-700"
                  value={recurringCategoryFilter}
                  onChange={(e) => setRecurringCategoryFilter(e.target.value)}
                >
                  <option value="All">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 shadow-2xs">
                <span className="text-gray-400">Status:</span>
                <select
                  className="focus:outline-none text-xs bg-transparent cursor-pointer font-medium text-gray-700"
                  value={recurringStatusFilter}
                  onChange={(e) => setRecurringStatusFilter(e.target.value as any)}
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active Only</option>
                  <option value="Paused">Paused Only</option>
                </select>
              </div>
            </div>

            <div className="text-gray-500 font-medium">
              Showing <strong>{filteredRecurringTemplates.length}</strong> of {recurringTemplates.length} expenses • Total: <strong className="text-gray-900">{formatCurrency(totalMonthlyCommitment)}/mo</strong>
            </div>
          </div>

          {/* Table / Rows View (Without Checkboxes) */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200 uppercase tracking-wider">
                    <th className="py-3 px-4">Recurring Expense & Description</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Schedule</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4 text-center">Month Status</th>
                    <th className="py-3 px-4 text-center">Active</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRecurringTemplates.map((template) => {
                    const isAlreadyPosted = expenses.some(
                      (exp) => exp.recurringTemplateId === template.id && exp.date.startsWith(targetPostingMonth)
                    );

                    return (
                      <tr key={template.id} className="hover:bg-gray-50 transition-colors">
                        {/* Title and Notes */}
                        <td className="py-3.5 px-4">
                          <div className="font-heading font-bold text-gray-900 text-sm">{template.title}</div>
                          {template.notes && (
                            <p className="text-gray-500 text-[11px] mt-0.5 line-clamp-1">{template.notes}</p>
                          )}
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4">
                          <span className="bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded text-[11px] font-semibold">
                            {template.category}
                          </span>
                        </td>

                        {/* Schedule */}
                        <td className="py-3.5 px-4 text-gray-600">
                          <div className="flex items-center gap-1.5 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span>Day {template.dayOfMonth} ({template.frequency})</span>
                          </div>
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-4 font-heading font-bold text-gray-900 text-sm">
                          {formatCurrency(template.amount)}
                        </td>

                        {/* Simplified Month Status */}
                        <td className="py-3.5 px-4 text-center">
                          {isAlreadyPosted ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Posted
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                              <Clock className="w-3 h-3 text-amber-500" /> Pending
                            </span>
                          )}
                        </td>

                        {/* Interactive Toggle Switch */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              role="switch"
                              aria-checked={template.isActive}
                              onClick={() => handleToggleTemplateActive(template.id)}
                              className={`relative inline-flex h-5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 ${template.isActive ? 'bg-indigo-600' : 'bg-gray-300'
                                }`}
                              title={template.isActive ? 'Active (click to pause)' : 'Paused (click to activate)'}
                            >
                              <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${template.isActive ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                              />
                            </button>
                            <span className={`text-[10px] font-semibold w-10 text-left ${template.isActive ? 'text-indigo-600' : 'text-gray-400'}`}>
                              {template.isActive ? 'Active' : 'Paused'}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isAlreadyPosted ? (
                              <span
                                className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold bg-gray-100 text-gray-400 cursor-default"
                                title={`Already posted for ${targetPostingMonth}`}
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Posted</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => handlePostSingleTemplate(template)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer"
                                title={`Post to ${targetPostingMonth}`}
                              >
                                <Zap className="w-3 h-3" />
                                <span>Post</span>
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setNewTemplate(template);
                                setEditingTemplateId(template.id);
                                setIsAddingTemplate(true);
                              }}
                              className="text-gray-400 hover:text-indigo-600 p-1"
                              title="Edit Recurring Expense"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTemplate(template.id)}
                              className="text-gray-400 hover:text-rose-600 p-1"
                              title="Delete Recurring Expense"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredRecurringTemplates.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-gray-500">
                        <AlertCircle className="w-7 h-7 text-gray-300 mx-auto mb-1.5" />
                        <p className="font-medium">No recurring expenses found matching your search or filters.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t-2 border-gray-200 font-semibold text-gray-900">
                    <td className="py-3 px-4 font-heading" colSpan={3}>
                      Total Monthly Commitments ({recurringTemplates.filter((t) => t.isActive).length} Active)
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-900" colSpan={4}>
                      {formatCurrency(totalMonthlyCommitment)} / month
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: ADD / EDIT REGULAR EXPENSE ===================== */}
      {isAddingExpense && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-heading font-bold text-gray-900">
                {editingExpenseId ? 'Edit Expense Record' : 'Record New Expense'}
              </h2>
              <button
                onClick={() => {
                  setIsAddingExpense(false);
                  setEditingExpenseId(null);
                  setNewExpense({});
                }}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Expense Description</label>
                <input
                  type="text"
                  placeholder="e.g. Server hosting, Team lunch, Stationery"
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newExpense.description || ''}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    list="expense-categories"
                    placeholder="Select or enter category"
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newExpense.category || ''}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  />
                  <datalist id="expense-categories">
                    {categories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newExpense.amount || ''}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-700">Date</label>
                  <span className="text-xs text-indigo-600 font-semibold">{formatDateDMY(newExpense.date || new Date())}</span>
                </div>
                <input
                  type="date"
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newExpense.date || ''}
                  onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                />
              </div>

              {!editingExpenseId && (
                <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!newExpense.saveAsRecurring}
                      onChange={(e) => setNewExpense({ ...newExpense, saveAsRecurring: e.target.checked })}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold text-indigo-900 flex items-center gap-1">
                        <Repeat className="w-3.5 h-3.5 text-indigo-600" /> Save as Monthly Recurring Expense
                      </span>
                      <p className="text-indigo-700/80 mt-0.5">
                        Automatically adds this to Recurring Expenses & Subscriptions so you can 1-click apply it every month without re-keying.
                      </p>
                    </div>
                  </label>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
              <button
                onClick={() => {
                  setIsAddingExpense(false);
                  setEditingExpenseId(null);
                  setNewExpense({});
                }}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveExpense}
                className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm"
              >
                {editingExpenseId ? 'Update Expense' : 'Save Expense'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== MODAL: ADD / EDIT RECURRING TEMPLATE ===================== */}
      {isAddingTemplate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-heading font-bold text-gray-900">
                {editingTemplateId ? 'Edit Recurring Expense' : 'Add Recurring Expense'}
              </h2>
              <button
                onClick={() => {
                  setIsAddingTemplate(false);
                  setEditingTemplateId(null);
                }}
                className="text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Title / Expense Name</label>
                <input
                  type="text"
                  placeholder="e.g. Employee Salaries, AWS Cloud, Office Rent"
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newTemplate.title || ''}
                  onChange={(e) => setNewTemplate({ ...newTemplate, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    list="template-categories"
                    placeholder="Payroll, IT, Office, etc."
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newTemplate.category || ''}
                    onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                  />
                  <datalist id="template-categories">
                    {categories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Monthly Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="0"
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newTemplate.amount || ''}
                    onChange={(e) => setNewTemplate({ ...newTemplate, amount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Monthly Due Day (1-28)</label>
                  <input
                    type="number"
                    min="1"
                    max="28"
                    placeholder="1"
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newTemplate.dayOfMonth || 1}
                    onChange={(e) => setNewTemplate({ ...newTemplate, dayOfMonth: parseInt(e.target.value) || 1 })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Frequency</label>
                  <select
                    className="border border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    value={newTemplate.frequency || 'Monthly'}
                    onChange={(e) => setNewTemplate({ ...newTemplate, frequency: e.target.value as any })}
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Notes / Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Details about vendor, plan tier, or employees covered..."
                  className="border border-gray-300 rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newTemplate.notes || ''}
                  onChange={(e) => setNewTemplate({ ...newTemplate, notes: e.target.value })}
                ></textarea>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="templateActiveCheck"
                  checked={newTemplate.isActive !== false}
                  onChange={(e) => setNewTemplate({ ...newTemplate, isActive: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="templateActiveCheck" className="text-xs font-semibold text-gray-700 cursor-pointer">
                  Active (Included in monthly 1-click generation)
                </label>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
              <button
                onClick={() => {
                  setIsAddingTemplate(false);
                  setEditingTemplateId(null);
                }}
                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm"
              >
                {editingTemplateId ? 'Update Recurring Expense' : 'Save Recurring Expense'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
