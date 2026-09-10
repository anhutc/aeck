import React, { useState, useMemo } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  ChevronRight,
  ShieldAlert,
  Printer,
  Calendar,
  CalendarDays,
  BarChart3,
  PieChart as PieIcon,
  LineChart as LineChartIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart as RePieChart,
  Pie,
  Cell
} from 'recharts';
import { AppBranding, Category, ContributionCampaign, Fund, TabType, Transaction } from '../types';
import { formatVND, formatDate, formatNumberCompact } from '../utils/formatters';
import { useTranslation } from '../i18n/LanguageContext';

interface OverviewTabProps {
  funds: Fund[];
  transactions: Transaction[];
  categories: Category[];
  campaigns: ContributionCampaign[];
  branding?: AppBranding;
  isAdmin?: boolean;
  onOpenPrintModal?: () => void;
  setActiveTab: (tab: TabType) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  funds,
  transactions,
  categories,
  campaigns,
  branding,
  isAdmin = true,
  onOpenPrintModal,
  setActiveTab,
}) => {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<'all' | 'this_month' | 'this_quarter' | 'this_year'>('this_month');
  const [activeChartTab, setActiveChartTab] = useState<'monthly' | 'yearly' | 'trend' | 'categories'>('monthly');

  const appFundName = branding?.appTitle?.trim() || 'AE Cây Khế';
  const fund = funds[0] || {
    id: 'fund_general',
    name: appFundName,
    balance: 0,
    minWarningBalance: 500000,
    color: '#3B82F6',
  };

  const totalBalance = fund.balance;
  const isBelowMin = fund.minWarningBalance ? fund.balance < fund.minWarningBalance : false;

  // All-time accumulated stats
  const completedTx = useMemo(() => transactions.filter(t => t.status === 'completed'), [transactions]);
  const totalIncomeAllTime = useMemo(() => completedTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0), [completedTx]);
  const totalExpenseAllTime = useMemo(() => completedTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0), [completedTx]);

  // Filtered transactions by selected period
  const periodFilteredTx = useMemo(() => {
    const now = new Date();
    return completedTx.filter((t) => {
      const txDate = new Date(t.date);

      if (period === 'this_month') {
        return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
      }
      if (period === 'this_quarter') {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const txQuarter = Math.floor(txDate.getMonth() / 3);
        return txQuarter === currentQuarter && txDate.getFullYear() === now.getFullYear();
      }
      if (period === 'this_year') {
        return txDate.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [completedTx, period]);

  // Income vs Expense Totals in selected period
  const periodIncome = useMemo(() => {
    return periodFilteredTx
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [periodFilteredTx]);

  const periodExpense = useMemo(() => {
    return periodFilteredTx
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [periodFilteredTx]);

  const netBalance = periodIncome - periodExpense;

  // Monthly breakdown data (all completed transactions chronologically)
  const monthlyData = useMemo(() => {
    const map = new Map<string, { month: string; rawMonth: string; income: number; expense: number; net: number }>();

    const sorted = [...completedTx].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sorted.forEach(t => {
      const monthKey = t.date.slice(0, 7); // "YYYY-MM"
      if (!monthKey) return;

      const [yr, mo] = monthKey.split('-');
      const label = `T${parseInt(mo, 10)}/${yr}`;

      if (!map.has(monthKey)) {
        map.set(monthKey, { month: label, rawMonth: monthKey, income: 0, expense: 0, net: 0 });
      }

      const item = map.get(monthKey)!;
      if (t.type === 'income') item.income += t.amount;
      if (t.type === 'expense') item.expense += t.amount;
      item.net = item.income - item.expense;
    });

    return Array.from(map.values());
  }, [completedTx]);

  // Yearly breakdown data
  const yearlyData = useMemo(() => {
    const map = new Map<string, { year: string; income: number; expense: number; net: number }>();

    completedTx.forEach(t => {
      const yr = t.date.slice(0, 4);
      if (!yr) return;

      if (!map.has(yr)) {
        map.set(yr, { year: `Năm ${yr}`, income: 0, expense: 0, net: 0 });
      }

      const item = map.get(yr)!;
      if (t.type === 'income') item.income += t.amount;
      if (t.type === 'expense') item.expense += t.amount;
      item.net = item.income - item.expense;
    });

    return Array.from(map.values()).sort((a, b) => a.year.localeCompare(b.year));
  }, [completedTx]);

  // Cumulative balance timeline data
  const cumulativeTrendData = useMemo(() => {
    let runningBalance = 0;
    const sorted = [...completedTx].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return sorted.map((t, idx) => {
      if (t.type === 'income') runningBalance += t.amount;
      if (t.type === 'expense') runningBalance -= t.amount;

      return {
        index: idx + 1,
        date: formatDate(t.date),
        description: t.description,
        amount: t.amount,
        type: t.type,
        balance: runningBalance,
      };
    });
  }, [completedTx]);

  // Category Expense Breakdown
  const expenseCatData = useMemo(() => {
    const map = new Map<string, number>();
    periodFilteredTx
      .filter(t => t.type === 'expense')
      .forEach(t => {
        map.set(t.categoryId, (map.get(t.categoryId) || 0) + t.amount);
      });

    return Array.from(map.entries()).map(([catId, val]) => {
      const cat = categories.find(c => c.id === catId);
      return {
        name: cat?.name || t('common.other', 'Khác'),
        value: val,
        color: cat?.color || '#EF4444',
      };
    }).sort((a, b) => b.value - a.value);
  }, [periodFilteredTx, categories, t]);

  // Category Income Breakdown
  const incomeCatData = useMemo(() => {
    const map = new Map<string, number>();
    periodFilteredTx
      .filter(t => t.type === 'income')
      .forEach(t => {
        map.set(t.categoryId, (map.get(t.categoryId) || 0) + t.amount);
      });

    return Array.from(map.entries()).map(([catId, val]) => {
      const cat = categories.find(c => c.id === catId);
      return {
        name: cat?.name || t('common.other', 'Khác'),
        value: val,
        color: cat?.color || '#10B981',
      };
    }).sort((a, b) => b.value - a.value);
  }, [periodFilteredTx, categories, t]);

  // Recent 6 transactions
  const recentTransactions = useMemo(() => {
    return [...completedTx]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);
  }, [completedTx]);

  const activeCampaigns = campaigns;
  const catMap = useMemo(() => new Map<string, Category>(categories.map(c => [c.id, c])), [categories]);

  const getPeriodLabel = () => {
    switch (period) {
      case 'this_month': return t('reports.period_month', 'Tháng này');
      case 'this_quarter': return t('reports.period_quarter', 'Quý này');
      case 'this_year': return t('reports.period_year', 'Năm nay');
      default: return t('reports.period_all', 'Toàn bộ thời gian');
    }
  };

  return (
    <div id="overview-tab-content" className="space-y-6 pb-12">
      {/* 1. Main Fund Balance Banner (Clean, High Contrast, with Print Report action) */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white p-5 sm:p-6 shadow-xs border border-slate-200/80 dark:border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5" />
                {appFundName}
              </span>
              {isBelowMin && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  {t('funds.warning_min_balance', 'Dưới hạn mức cảnh báo')}
                </span>
              )}
              <span className="text-xs text-slate-500 font-medium">
                {t('funds.current_available_balance', 'Số Dư Khả Dụng Hiện Tại')}
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <div className="text-3xl sm:text-4xl font-mono font-black tracking-tight text-slate-900 dark:text-white">
                {formatVND(totalBalance)}
              </div>
            </div>

            {onOpenPrintModal && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  id="overview-print-statement-btn"
                  onClick={onOpenPrintModal}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-sm shadow-blue-600/20 hover:shadow-md hover:shadow-blue-600/30 flex items-center gap-2 transition-all cursor-pointer group"
                  title="In báo cáo sao kê sổ quỹ chuẩn A4"
                >
                  <Printer className="w-4 h-4 group-hover:scale-110 group-active:scale-95 transition-transform" />
                  <span>{t('reports.print_statement', 'In Báo Cáo')}</span>
                </button>
              </div>
            )}
          </div>

          {/* All-time Accumulated Income & Expense Responsive Cards */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3.5 w-full md:w-auto">
            {/* Tổng đã thu */}
            <div className="p-2.5 sm:px-4 sm:py-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 flex flex-col justify-between gap-1 min-w-0 flex-1 sm:flex-initial">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <ArrowDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <span className="text-[11px] sm:text-xs text-emerald-800 dark:text-emerald-300 font-bold whitespace-nowrap">
                  {t('funds.total_income', 'Tổng đã thu')}
                </span>
              </div>
              <div className="pt-0.5 min-w-0">
                <span
                  className="text-xs sm:text-sm md:text-base font-mono font-black text-emerald-700 dark:text-emerald-300 block whitespace-nowrap overflow-hidden text-ellipsis"
                  title={`+${formatVND(totalIncomeAllTime)}`}
                >
                  +{formatVND(totalIncomeAllTime)}
                </span>
              </div>
            </div>

            {/* Tổng đã chi */}
            <div className="p-2.5 sm:px-4 sm:py-3 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/60 flex flex-col justify-between gap-1 min-w-0 flex-1 sm:flex-initial">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-5 h-5 rounded-md bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center justify-center shrink-0">
                  <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <span className="text-[11px] sm:text-xs text-rose-800 dark:text-rose-300 font-bold whitespace-nowrap">
                  {t('funds.total_expense', 'Tổng đã chi')}
                </span>
              </div>
              <div className="pt-0.5 min-w-0">
                <span
                  className="text-xs sm:text-sm md:text-base font-mono font-black text-rose-700 dark:text-rose-300 block whitespace-nowrap overflow-hidden text-ellipsis"
                  title={`-${formatVND(totalExpenseAllTime)}`}
                >
                  -{formatVND(totalExpenseAllTime)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Financial Period Filter & Flow Performance (Consolidated from Reports) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>Báo cáo & Phân tích thu chi ({getPeriodLabel()})</span>
            </h3>
            <p className="text-xs text-slate-500">
              {t('reports.subtitle', 'Xem biến động dòng tiền và cơ cấu tài chính linh hoạt theo kỳ')}
            </p>
          </div>

          {/* Period Selector Tabs */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/90 rounded-2xl text-xs font-semibold self-start sm:self-auto">
            <button
              onClick={() => setPeriod('this_month')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                period === 'this_month'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('reports.period_month', 'Tháng này')}
            </button>
            <button
              onClick={() => setPeriod('this_quarter')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                period === 'this_quarter'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('reports.period_quarter', 'Quý này')}
            </button>
            <button
              onClick={() => setPeriod('this_year')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                period === 'this_year'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('reports.period_year', 'Năm nay')}
            </button>
            <button
              onClick={() => setPeriod('all')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                period === 'all'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t('reports.period_all', 'Toàn bộ')}
            </button>
          </div>
        </div>

        {/* 3 KPI Cards for Selected Period */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
              <span>{t('reports.kpi_income', 'Tổng thu trong kỳ')}</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                +{formatVND(periodIncome)}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {periodFilteredTx.filter(t => t.type === 'income').length} {t('transactions.record_count', 'giao dịch thu')}
              </p>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
              <span>{t('reports.kpi_expense', 'Tổng chi trong kỳ')}</span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                -{formatVND(periodExpense)}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {periodFilteredTx.filter(t => t.type === 'expense').length} {t('transactions.record_count', 'giao dịch chi')}
              </p>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
              <span>{t('reports.kpi_net', 'Dòng tiền ròng (Thu - Chi)')}</span>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                netBalance >= 0 
                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400' 
                  : 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
              }`}>
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className={`text-2xl font-black ${
                netBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'
              }`}>
                {netBalance >= 0 ? '+' : ''}{formatVND(netBalance)}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {netBalance >= 0 ? t('overview.cashflow_surplus', 'Quỹ thặng dư tăng trưởng') : t('overview.cashflow_deficit', 'Quỹ thâm hụt trong kỳ')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Interactive Financial Analytics Hub */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {t('reports.visual_title', 'Hệ thống trực quan hóa số liệu tài chính')}
            </h3>
            <p className="text-xs text-slate-500">
              {t('reports.visual_subtitle', 'Chuyển đổi các góc nhìn thống kê tài chính theo thời gian và cơ cấu')}
            </p>
          </div>

          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-semibold flex-wrap gap-1">
            <button
              onClick={() => setActiveChartTab('monthly')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeChartTab === 'monthly'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{t('reports.tab_monthly', 'Theo tháng')}</span>
            </button>

            <button
              onClick={() => setActiveChartTab('yearly')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeChartTab === 'yearly'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>{t('reports.tab_yearly', 'Theo năm')}</span>
            </button>

            <button
              onClick={() => setActiveChartTab('trend')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeChartTab === 'trend'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LineChartIcon className="w-3.5 h-3.5" />
              <span>{t('reports.tab_trend', 'Xu hướng số dư')}</span>
            </button>

            <button
              onClick={() => setActiveChartTab('categories')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeChartTab === 'categories'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <PieIcon className="w-3.5 h-3.5" />
              <span>{t('reports.tab_categories', 'Cơ cấu thu & chi')}</span>
            </button>
          </div>
        </div>

        {/* TAB 1: MONTHLY BAR CHART */}
        {activeChartTab === 'monthly' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{t('reports.monthly_desc', 'So sánh tổng tiền thu vào và tổng tiền chi ra theo từng tháng')}</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {monthlyData.length} {t('reports.months_recorded_unit', 'tháng ghi nhận')}
              </span>
            </div>

            <div className="h-72 sm:h-80 w-full">
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(val) => formatNumberCompact(val)} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(val: number, name: string) => [
                        formatVND(val),
                        name === 'income' ? t('reports.kpi_income', 'Thu vào') : t('reports.kpi_expense', 'Chi ra')
                      ]}
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderRadius: '12px',
                        color: '#fff',
                        border: 'none',
                        fontSize: '12px',
                      }}
                    />
                    <Legend
                      formatter={(val) => (val === 'income' ? t('reports.kpi_income', 'Thu vào') : t('reports.kpi_expense', 'Chi ra'))}
                      wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                    />
                    <Bar dataKey="income" name="income" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="expense" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  {t('overview.no_transactions', 'Chưa có dữ liệu giao dịch')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: YEARLY BAR CHART */}
        {activeChartTab === 'yearly' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{t('reports.yearly_desc', 'Tổng hợp quy mô thu chi qua các năm hoạt động của quỹ')}</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {yearlyData.length} {t('reports.years_recorded_unit', 'năm hoạt động')}
              </span>
            </div>

            <div className="h-72 sm:h-80 w-full">
              {yearlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(val) => formatNumberCompact(val)} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(val: number, name: string) => [
                        formatVND(val),
                        name === 'income' ? t('reports.kpi_income', 'Thu vào') : t('reports.kpi_expense', 'Chi ra')
                      ]}
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderRadius: '12px',
                        color: '#fff',
                        border: 'none',
                        fontSize: '12px',
                      }}
                    />
                    <Legend
                      formatter={(val) => (val === 'income' ? t('reports.kpi_income', 'Thu vào') : t('reports.kpi_expense', 'Chi ra'))}
                      wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                    />
                    <Bar dataKey="income" name="income" fill="#10B981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="expense" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  {t('overview.no_transactions', 'Chưa có dữ liệu theo năm')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CUMULATIVE BALANCE TREND (AREA CHART) */}
        {activeChartTab === 'trend' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{t('reports.trend_desc', 'Biểu đồ tích lũy số dư thực tế theo trình tự thời gian')}</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {t('reports.current_balance_status', 'Số dư hiện tại')}: {formatVND(totalBalance)}
              </span>
            </div>

            <div className="h-72 sm:h-80 w-full">
              {cumulativeTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cumulativeTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="balanceTrendGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(val) => formatNumberCompact(val)} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(val: number) => [formatVND(val), t('reports.trend_balance_label', 'Số dư tích lũy')]}
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderRadius: '12px',
                        color: '#fff',
                        border: 'none',
                        fontSize: '12px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="balance"
                      name={t('reports.trend_balance_label', 'Số dư tích lũy')}
                      stroke="#3B82F6"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#balanceTrendGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  {t('overview.no_transactions', 'Chưa có dữ liệu xu hướng')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: CATEGORY BREAKDOWN (DUAL PIE CHARTS) */}
        {activeChartTab === 'categories' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Expense Breakdown */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  {t('overview.expense_structure', 'Cơ cấu chi tiêu')}
                </span>
                <span className="text-xs font-black text-rose-600">
                  -{formatVND(periodExpense)}
                </span>
              </div>

              <div className="h-44 w-full flex items-center justify-center">
                {expenseCatData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={expenseCatData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {expenseCatData.map((entry, index) => (
                          <Cell key={`exp-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: number) => [formatVND(val), t('common.amount', 'Số tiền')]}
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          borderRadius: '12px',
                          color: '#fff',
                          border: 'none',
                          fontSize: '12px',
                        }}
                      />
                    </RePieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-slate-400 text-xs">
                    {t('overview.no_expense', 'Chưa có giao dịch chi tiêu trong kỳ')}
                  </div>
                )}
              </div>

              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {expenseCatData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-700 dark:text-slate-300 font-medium truncate">{item.name}</span>
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-white ml-2 shrink-0">{formatVND(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Income Breakdown */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Cơ cấu nguồn thu
                </span>
                <span className="text-xs font-black text-emerald-600">
                  +{formatVND(periodIncome)}
                </span>
              </div>

              <div className="h-44 w-full flex items-center justify-center">
                {incomeCatData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={incomeCatData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {incomeCatData.map((entry, index) => (
                          <Cell key={`inc-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: number) => [formatVND(val), t('common.amount', 'Số tiền')]}
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          borderRadius: '12px',
                          color: '#fff',
                          border: 'none',
                          fontSize: '12px',
                        }}
                      />
                    </RePieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-slate-400 text-xs">
                    Chưa có giao dịch thu trong kỳ
                  </div>
                )}
              </div>

              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {incomeCatData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-700 dark:text-slate-300 font-medium truncate">{item.name}</span>
                    </div>
                    <span className="font-semibold text-slate-900 dark:text-white ml-2 shrink-0">{formatVND(item.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Active Campaigns & Recent Transactions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Campaigns */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {t('overview.active_campaigns', 'Đợt Đóng Quỹ Đang Thu')}
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold">
                {activeCampaigns.length} {t('overview.campaign_unit', 'đợt')}
              </span>
            </div>
            <button
              onClick={() => setActiveTab('campaigns')}
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              {t('overview.view_all', 'Xem tất cả')} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {activeCampaigns.length > 0 ? (
              activeCampaigns.slice(0, 3).map((camp) => {
                const collected = camp.participants.reduce((sum, p) => sum + p.amountPaid, 0);
                const progress = Math.min(100, Math.round((collected / camp.totalTarget) * 100));
                const paidCount = camp.participants.filter(p => p.amountPaid >= p.amountRequired).length;

                return (
                  <div
                    key={camp.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                          {camp.title}
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          {formatVND(camp.amountPerMember)}/{t('common.person', 'người')} • {t('overview.launch_date', 'Phát động')}: {formatDate(camp.launchDate || camp.createdAt)}
                        </span>
                      </div>
                      <span className="font-black text-xs text-purple-600 dark:text-purple-400">
                        {progress}%
                      </span>
                    </div>

                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-600 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>{t('overview.collected', 'Đã thu')}: <strong>{formatVND(collected)}</strong></span>
                      <span>{t('overview.paid_count', 'Đã nộp')}: <strong>{paidCount}/{camp.participants.length} {t('common.person', 'người')}</strong></span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                {t('overview.no_campaigns', 'Không có đợt thu quỹ nào đang mở')}
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {t('overview.recent_transactions', 'Giao Dịch Thu Chi Mới Nhất')}
            </h3>
            <button
              onClick={() => setActiveTab('transactions')}
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              {t('overview.open_ledger', 'Mở sổ cái')} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => {
                const cat = catMap.get(tx.categoryId);
                const isIncome = tx.type === 'income';

                return (
                  <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isIncome ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                        }`}
                      >
                        {isIncome ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">
                          {tx.description}
                        </p>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {formatDate(tx.date)} • {cat?.name || t('common.other', 'Khác')}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`font-black whitespace-nowrap ml-2 ${
                        isIncome ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isIncome ? '+' : '-'}{formatVND(tx.amount)}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                {t('overview.no_transactions', 'Chưa có giao dịch nào')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
