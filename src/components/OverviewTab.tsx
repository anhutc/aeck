import React, { useMemo } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Target,
  Users,
  ChevronRight,
  ShieldAlert,
  RotateCcw,
  Printer,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart as RePieChart,
  Pie,
  Cell
} from 'recharts';
import { BankSettings, Category, ContributionCampaign, Fund, Member, TabType, Transaction, TransactionType } from '../types';
import { formatVND, formatDate, formatNumberCompact } from '../utils/formatters';
import { useTranslation } from '../i18n/LanguageContext';

interface OverviewTabProps {
  funds: Fund[];
  transactions: Transaction[];
  categories: Category[];
  campaigns: ContributionCampaign[];
  members: Member[];
  bankSettings: BankSettings;
  isAdmin?: boolean;
  onOpenTransactionModal?: (type?: TransactionType, editingTx?: Transaction) => void;
  onOpenQRModal?: (amount?: number, content?: string) => void;
  onOpenShareModal?: () => void;
  onOpenResetFundModal?: () => void;
  onOpenPrintModal?: () => void;
  setActiveTab: (tab: TabType) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  funds,
  transactions,
  categories,
  campaigns,
  members,
  bankSettings,
  isAdmin = true,
  onOpenTransactionModal,
  onOpenQRModal,
  onOpenShareModal,
  onOpenResetFundModal,
  onOpenPrintModal,
  setActiveTab,
}) => {
  const { t } = useTranslation();
  const fund = funds[0] || {
    id: 'fund_general',
    name: 'Quỹ Hoạt Động',
    balance: 0,
    minWarningBalance: 500000,
    color: '#3B82F6',
  };

  const totalBalance = fund.balance;
  const isBelowMin = fund.minWarningBalance ? fund.balance < fund.minWarningBalance : false;

  // All-time accumulated stats
  const completedTx = useMemo(() => transactions.filter(t => t.status === 'completed'), [transactions]);
  const totalIncome = useMemo(() => completedTx.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0), [completedTx]);
  const totalExpense = useMemo(() => completedTx.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0), [completedTx]);

  // Current month's flow
  const currentMonthPrefix = new Date().toISOString().slice(0, 7); // e.g. "2026-08"
  
  const monthTransactions = useMemo(() => {
    return transactions.filter(t => t.date.startsWith(currentMonthPrefix) && t.status === 'completed');
  }, [transactions, currentMonthPrefix]);

  const monthIncome = useMemo(() => {
    return monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthTransactions]);

  const monthExpense = useMemo(() => {
    return monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthTransactions]);

  const netCashFlow = monthIncome - monthExpense;

  // Chart Data: Monthly Cashflow aggregation (last 6 months)
  const monthlyChartData = useMemo(() => {
    const monthsMap = new Map<string, { month: string; income: number; expense: number }>();
    
    // Seed last 6 months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `T${d.getMonth() + 1}/${d.getFullYear().toString().slice(2)}`;
      monthsMap.set(key, { month: label, income: 0, expense: 0 });
    }

    transactions.forEach(t => {
      if (t.status !== 'completed') return;
      const key = t.date.slice(0, 7);
      if (monthsMap.has(key)) {
        const item = monthsMap.get(key)!;
        if (t.type === 'income') item.income += t.amount;
        if (t.type === 'expense') item.expense += t.amount;
      }
    });

    return Array.from(monthsMap.values());
  }, [transactions]);

  // Chart Data: Expense Category Breakdown
  const expensePieData = useMemo(() => {
    const catExpenseMap = new Map<string, number>();
    transactions
      .filter(t => t.type === 'expense' && t.status === 'completed')
      .forEach(t => {
        catExpenseMap.set(t.categoryId, (catExpenseMap.get(t.categoryId) || 0) + t.amount);
      });

    return Array.from(catExpenseMap.entries())
      .map(([catId, amount]) => {
        const cat = categories.find(c => c.id === catId);
        return {
          name: cat ? cat.name : 'Khác',
          value: amount,
          color: cat ? cat.color : '#6B7280',
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [transactions, categories]);

  // Recent 6 transactions
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 6);
  }, [transactions]);

  const activeCampaigns = campaigns;
  const catMap = new Map<string, Category>(categories.map(c => [c.id, c]));

  return (
    <div id="overview-tab-content" className="space-y-6 pb-12">
      {/* 1. Main Fund Balance Banner (Compact, Sleek & Modern) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white p-4 sm:p-5 shadow-md border border-blue-900/40">
        <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 backdrop-blur-xs flex items-center gap-1.5">
                <Wallet className="w-3 h-3" />
                {fund.name === 'Quỹ Hoạt Động' ? t('funds.default_fund_name', 'Quỹ Hoạt Động') : (fund.name || t('funds.default_fund_name', 'Quỹ Hoạt Động'))}
              </span>
              {isBelowMin && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" />
                  {t('funds.warning_min_balance', 'Dưới hạn mức')}
                </span>
              )}
              <span className="text-xs text-blue-200/70 font-medium hidden sm:inline">
                {t('funds.current_available_balance', 'Số Dư Khả Dụng')}
              </span>
            </div>

            <div className="flex items-baseline gap-3">
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {formatVND(totalBalance)}
              </div>
            </div>

            {isAdmin && (
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                {onOpenResetFundModal && (
                  <button
                    id="overview-reset-fund-btn"
                    onClick={onOpenResetFundModal}
                    className="px-2.5 py-1 rounded-lg border border-amber-300/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{t('funds.btn_reset', 'Đặt Lại Quỹ')}</span>
                  </button>
                )}
                {onOpenPrintModal && (
                  <button
                    id="overview-print-statement-btn"
                    onClick={onOpenPrintModal}
                    className="px-2.5 py-1 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Printer className="w-3 h-3 text-blue-300" />
                    <span>{t('reports.print_statement', 'In Báo Cáo')}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* All-time Accumulated Income & Expense Responsive Cards */}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3 w-full sm:w-auto mt-2 sm:mt-0">
            <div className="p-2.5 sm:px-3.5 sm:py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center gap-2 sm:gap-3 min-w-0 flex-1 sm:flex-initial">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <ArrowDownLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] sm:text-[10px] text-emerald-300/90 font-medium block uppercase tracking-wider truncate">
                  {t('funds.total_income', 'Tổng Đã Thu')}
                </span>
                <span className="text-xs xs:text-sm sm:text-base font-bold text-white block truncate" title={`+${formatVND(totalIncome)}`}>
                  +{formatVND(totalIncome)}
                </span>
              </div>
            </div>

            <div className="p-2.5 sm:px-3.5 sm:py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center gap-2 sm:gap-3 min-w-0 flex-1 sm:flex-initial">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] sm:text-[10px] text-rose-300/90 font-medium block uppercase tracking-wider truncate">
                  {t('funds.total_expense', 'Tổng Đã Chi')}
                </span>
                <span className="text-xs xs:text-sm sm:text-base font-bold text-white block truncate" title={`-${formatVND(totalExpense)}`}>
                  -{formatVND(totalExpense)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Monthly Flow Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Income this month */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t('overview.month_income', 'Tổng thu tháng này')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              +{formatVND(monthIncome)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {t('overview.from_fees', 'Từ hội phí, tài trợ & đóng góp')}
            </p>
          </div>
        </div>

        {/* Total Expense this month */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t('overview.month_expense', 'Tổng chi tháng này')}
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              -{formatVND(monthExpense)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {t('overview.expense_desc', 'Chi liên hoan, quà tặng, hoạt động')}
            </p>
          </div>
        </div>

        {/* Net Flow */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t('overview.net_cashflow', 'Dòng tiền ròng (Thu - Chi)')}
            </span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              netCashFlow >= 0 
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400' 
                : 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
            }`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className={`text-2xl font-bold ${
              netCashFlow >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'
            }`}>
              {netCashFlow >= 0 ? '+' : ''}{formatVND(netCashFlow)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {netCashFlow >= 0 ? t('overview.cashflow_surplus', 'Quỹ thặng dư tăng trưởng') : t('overview.cashflow_deficit', 'Quỹ thâm hụt trong tháng')}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cashflow Chart (2 Cols) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {t('overview.cashflow_chart_title', 'Dòng tiền thu & chi 6 tháng gần nhất')}
              </h3>
              <p className="text-xs text-slate-500">{t('overview.cashflow_chart_desc', 'So sánh lưu lượng tiền mặt vào và ra')}</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> {t('overview.income_legend', 'Thu vào')}
              </span>
              <span className="flex items-center gap-1.5 text-rose-500 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> {t('overview.expense_legend', 'Chi ra')}
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => formatNumberCompact(val)}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <Tooltip
                  formatter={(val: number) => [formatVND(val), '']}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                    border: 'none',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="income" name="Thu tiền" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#incomeGrad)" />
                <Area type="monotone" dataKey="expense" name="Chi tiêu" stroke="#EF4444" strokeWidth={2.5} fillOpacity={1} fill="url(#expenseGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Breakdown Pie (1 Col) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {t('overview.expense_structure', 'Cơ cấu chi tiêu')}
            </h3>
            <p className="text-xs text-slate-500">{t('overview.by_category', 'Theo danh mục phân loại')}</p>
          </div>

          <div className="h-44 w-full flex items-center justify-center my-2">
            {expensePieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={expensePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {expensePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
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
              <div className="text-center text-slate-400 text-xs">{t('overview.no_expense', 'Chưa có giao dịch chi tiêu')}</div>
            )}
          </div>

          <div className="space-y-1.5">
            {expensePieData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{item.name}</span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-white">{formatVND(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Active Campaigns & Recent Transactions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Campaigns */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {t('overview.active_campaigns', 'Đợt Đóng Quỹ Đang Thu')}
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold">
                {activeCampaigns.length} {t('overview.campaign_unit', 'đợt')}
              </span>
            </div>
            <button
              onClick={() => setActiveTab('campaigns')}
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              {t('overview.view_all', 'Xem tất cả')} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {activeCampaigns.length > 0 ? (
              activeCampaigns.slice(0, 2).map((camp) => {
                const collected = camp.participants.reduce((sum, p) => sum + p.amountPaid, 0);
                const progress = Math.min(100, Math.round((collected / camp.totalTarget) * 100));
                const paidCount = camp.participants.filter(p => p.amountPaid >= p.amountRequired).length;

                return (
                  <div
                    key={camp.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2.5"
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
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {t('overview.recent_transactions', 'Giao Dịch Thu Chi Mới Nhất')}
            </h3>
            <button
              onClick={() => setActiveTab('transactions')}
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
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
