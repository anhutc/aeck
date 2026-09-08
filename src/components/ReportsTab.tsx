import React, { useState, useMemo } from 'react';
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import {
  Printer,
  FileDown,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  PieChart as PieIcon,
  Calendar,
  BarChart3,
  LineChart as LineChartIcon,
  CalendarDays,
  FileSpreadsheet,
  ChevronDown
} from 'lucide-react';
import { AppBranding, Category, Fund, Transaction } from '../types';
import { formatVND, formatNumberCompact, exportTransactionsToExcel, exportTransactionsToCSV, formatDate } from '../utils/formatters';
import { useTranslation } from '../i18n/LanguageContext';
import { useFeedback } from '../context/FeedbackContext';

interface ReportsTabProps {
  transactions: Transaction[];
  funds: Fund[];
  categories: Category[];
  branding?: AppBranding;
  onOpenPrintModal: () => void;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  transactions,
  funds,
  categories,
  branding,
  onOpenPrintModal,
}) => {
  const { t } = useTranslation();
  const { showToast } = useFeedback();
  const [period, setPeriod] = useState<'all' | 'this_month' | 'this_quarter' | 'this_year'>('all');
  const [activeChartTab, setActiveChartTab] = useState<'monthly' | 'yearly' | 'trend' | 'categories'>('monthly');
  const [isExporting, setIsExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const fundName = branding?.appTitle?.trim() || funds[0]?.name?.trim() || 'AE Cây Khế';

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      setShowExportMenu(false);
      await exportTransactionsToExcel(filteredTx, funds, categories, fundName);
      showToast('Đã xuất file Excel sao kê (.xlsx) thành công!', 'success');
    } catch (err) {
      console.error('Lỗi khi xuất file Excel:', err);
      showToast('Có lỗi xảy ra khi xuất file Excel', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = () => {
    try {
      setShowExportMenu(false);
      exportTransactionsToCSV(filteredTx, funds, categories, fundName);
      showToast('Đã xuất file CSV thành công!', 'success');
    } catch (err) {
      console.error('Lỗi khi xuất file CSV:', err);
      showToast('Có lỗi xảy ra khi xuất file CSV', 'error');
    }
  };

  const filteredTx = useMemo(() => {
    const now = new Date();
    return transactions.filter((t) => {
      if (t.status !== 'completed') return false;
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
  }, [transactions, period]);

  // Income vs Expense Totals
  const totalIncome = filteredTx
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTx
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalIncome - totalExpense;

  // Monthly breakdown data (all completed transactions chronologically)
  const monthlyData = useMemo(() => {
    const map = new Map<string, { month: string; rawMonth: string; income: number; expense: number; net: number }>();

    const sorted = [...transactions]
      .filter(t => t.status === 'completed')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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
  }, [transactions]);

  // Yearly breakdown data
  const yearlyData = useMemo(() => {
    const map = new Map<string, { year: string; income: number; expense: number; net: number }>();

    transactions
      .filter(t => t.status === 'completed')
      .forEach(t => {
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
  }, [transactions]);

  // Cumulative balance timeline data
  const cumulativeTrendData = useMemo(() => {
    let runningBalance = 0;
    const sorted = [...transactions]
      .filter(t => t.status === 'completed')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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
  }, [transactions]);

  // Category Expense Breakdown
  const expenseCatData = useMemo(() => {
    const map = new Map<string, number>();
    filteredTx
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
  }, [filteredTx, categories, t]);

  // Category Income Breakdown
  const incomeCatData = useMemo(() => {
    const map = new Map<string, number>();
    filteredTx
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
  }, [filteredTx, categories, t]);

  return (
    <div id="reports-tab-content" className="space-y-6 pb-12">
      {/* Top Banner & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            {t('reports.title', 'Báo Cáo & Phân Tích Tài Chính')}
          </h2>
          <p className="text-xs text-slate-500">
            {t('reports.subtitle', 'Xem báo cáo thu chi chi tiết theo tháng, quý, năm và xuất bản sao kê.')}
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Period selector */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setPeriod('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer active:scale-95 ${
                period === 'all'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60'
              }`}
            >
              {t('reports.period_all', 'Toàn bộ')}
            </button>
            <button
              onClick={() => setPeriod('this_month')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer active:scale-95 ${
                period === 'this_month'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60'
              }`}
            >
              {t('reports.period_month', 'Tháng này')}
            </button>
            <button
              onClick={() => setPeriod('this_quarter')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer active:scale-95 ${
                period === 'this_quarter'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60'
              }`}
            >
              {t('reports.period_quarter', 'Quý này')}
            </button>
            <button
              onClick={() => setPeriod('this_year')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer active:scale-95 ${
                period === 'this_year'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-700/60'
              }`}
            >
              {t('reports.period_year', 'Năm nay')}
            </button>
          </div>

          {/* Export Dropdown Group */}
          <div className="relative inline-flex rounded-xl shadow-xs">
            <button
              id="reports-export-excel-btn"
              onClick={handleExportExcel}
              disabled={isExporting}
              className="px-3.5 py-2 rounded-l-xl border border-emerald-300/80 dark:border-emerald-700/80 bg-emerald-50/60 dark:bg-emerald-950/40 hover:bg-emerald-100/90 dark:hover:bg-emerald-900/60 active:scale-95 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 transition-all duration-150 cursor-pointer group disabled:opacity-50"
              title="Xuất bảng kê chi tiết ra file Excel (.xlsx) chuyên nghiệp có kẻ ô và màu sắc"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 group-active:scale-95 transition-transform" />
              <span>{isExporting ? 'Đang xuất...' : 'Xuất File Excel (.xlsx)'}</span>
            </button>
            <button
              type="button"
              id="reports-export-options-toggle-btn"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-2.5 py-2 rounded-r-xl border-t border-r border-b border-l-0 border-emerald-300/80 dark:border-emerald-700/80 bg-emerald-50/60 dark:bg-emerald-950/40 hover:bg-emerald-100/90 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs transition-colors cursor-pointer"
              title="Tùy chọn định dạng xuất file (Excel / CSV)"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {showExportMenu && (
              <>
                <div 
                  className="fixed inset-0 z-20"
                  onClick={() => setShowExportMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1.5 z-30 text-xs">
                  <button
                    type="button"
                    onClick={handleExportExcel}
                    className="w-full px-3.5 py-2.5 text-left flex items-center gap-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-800 dark:text-slate-200 font-semibold cursor-pointer transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold text-emerald-700 dark:text-emerald-300">File Excel (.xlsx)</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">Kẻ khung, màu sắc, định dạng số tiền</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="w-full px-3.5 py-2.5 text-left flex items-center gap-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
                  >
                    <FileDown className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <div>
                      <div className="font-bold">File CSV (.csv)</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">Văn bản thuần UTF-8, mở nhanh</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            id="print-statement-btn"
            onClick={onOpenPrintModal}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-sm shadow-blue-600/20 hover:shadow-md hover:shadow-blue-600/30 flex items-center gap-1.5 transition-all duration-150 cursor-pointer group"
          >
            <Printer className="w-4 h-4 group-hover:scale-110 group-active:scale-95 transition-transform" />
            <span>{t('reports.print_statement', 'In Báo Cáo Sao Kê')}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
            <span>{t('reports.kpi_income', 'Tổng thu trong kỳ')}</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-3">
            +{formatVND(totalIncome)}
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
            <span>{t('reports.kpi_expense', 'Tổng chi trong kỳ')}</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-3">
            -{formatVND(totalExpense)}
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
            <span>{t('reports.kpi_net', 'Dòng tiền ròng (Thu - Chi)')}</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-black mt-3 ${netBalance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600'}`}>
            {netBalance >= 0 ? '+' : ''}{formatVND(netBalance)}
          </div>
        </div>
      </div>

      {/* Main Interactive Charts Hub */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              {t('reports.visual_title', 'Hệ thống trực quan hóa số liệu tài chính')}
            </h3>
            <p className="text-xs text-slate-500">{t('reports.visual_subtitle', 'Chuyển đổi các góc nhìn thống kê tài chính theo thời gian và cơ cấu')}</p>
          </div>

          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-semibold flex-wrap gap-1">
            <button
              onClick={() => setActiveChartTab('monthly')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeChartTab === 'monthly'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              {t('reports.tab_monthly', 'Theo tháng')}
            </button>

            <button
              onClick={() => setActiveChartTab('yearly')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeChartTab === 'yearly'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              {t('reports.tab_yearly', 'Theo năm')}
            </button>

            <button
              onClick={() => setActiveChartTab('trend')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeChartTab === 'trend'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <LineChartIcon className="w-3.5 h-3.5" />
              {t('reports.tab_trend', 'Xu hướng số dư')}
            </button>

            <button
              onClick={() => setActiveChartTab('categories')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                activeChartTab === 'categories'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <PieIcon className="w-3.5 h-3.5" />
              {t('reports.tab_categories', 'Cơ cấu thu & chi')}
            </button>
          </div>
        </div>

        {/* TAB 1: MONTHLY CHART */}
        {activeChartTab === 'monthly' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{t('reports.monthly_desc', 'So sánh tổng tiền thu vào và tổng tiền chi ra theo từng tháng')}</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{t('reports.total_recorded_months', 'Tổng cộng')} {monthlyData.length} {t('reports.months_recorded_unit', 'tháng ghi nhận')}</span>
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
                        name === 'income' ? t('transactions.type_income', 'Tổng Thu (+)') : t('transactions.type_expense', 'Tổng Chi (-)'),
                      ]}
                    />
                    <Legend
                      formatter={(value) => (value === 'income' ? t('transactions.type_income', 'Khoản Thu Vào (+)') : t('transactions.type_expense', 'Khoản Chi Ra (-)'))}
                      wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                    />
                    <Bar dataKey="income" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="expense" fill="#EF4444" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  {t('reports.no_data', 'Chưa có đủ dữ liệu thu chi theo tháng')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: YEARLY CHART */}
        {activeChartTab === 'yearly' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{t('reports.yearly_desc', 'So sánh quy mô tài chính tổng thể qua các năm')}</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{t('reports.total_recorded_years', 'Tổng cộng')} {yearlyData.length} {t('reports.years_recorded_unit', 'năm tài chính')}</span>
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
                        name === 'income' ? t('transactions.type_income', 'Tổng Thu Năm (+)') : t('transactions.type_expense', 'Tổng Chi Năm (-)'),
                      ]}
                    />
                    <Legend
                      formatter={(value) => (value === 'income' ? t('transactions.type_income', 'Tổng Thu Cả Năm (+)') : t('transactions.type_expense', 'Tổng Chi Cả Năm (-)'))}
                      wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                    />
                    <Bar dataKey="income" fill="#3B82F6" radius={[6, 6, 0, 0]} maxBarSize={52} />
                    <Bar dataKey="expense" fill="#F43F5E" radius={[6, 6, 0, 0]} maxBarSize={52} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  {t('reports.no_data', 'Chưa có đủ dữ liệu thu chi theo năm')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CUMULATIVE BALANCE TREND */}
        {activeChartTab === 'trend' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{t('reports.trend_desc', 'Đường biểu diễn sự tích lũy và tăng trưởng số dư quỹ theo từng giao dịch')}</span>
              <span className="font-semibold text-blue-600">{t('reports.current_balance_label', 'Số dư hiện tại:')} {formatVND(funds.reduce((s, f) => s + f.balance, 0))}</span>
            </div>

            <div className="h-72 sm:h-80 w-full">
              {cumulativeTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cumulativeTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(val) => formatNumberCompact(val)} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(val: number) => [formatVND(val), t('reports.cumulative_balance', 'Số Dư Tích Lũy')]}
                      labelFormatter={(label, payload) => {
                        const item = payload?.[0]?.payload;
                        return item ? `${label} - ${item.description}` : label;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="balance"
                      stroke="#2563EB"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#balanceGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  {t('reports.no_data', 'Chưa có đủ giao dịch để vẽ đường xu hướng số dư')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: CATEGORY BREAKDOWN PIES */}
        {activeChartTab === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
            {/* Expense Category Pie */}
            <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4 text-rose-500" />
                {t('reports.expense_category_title', 'Cơ Cấu Chi Tiêu Theo Danh Mục')}
              </h4>
              <p className="text-xs text-slate-500 mb-4">{t('reports.expense_category_subtitle', 'Các khoản chi tiêu chiếm tỷ trọng lớn nhất')}</p>

              <div className="h-52 w-full flex items-center justify-center">
                {expenseCatData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={expenseCatData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {expenseCatData.map((entry, index) => (
                          <Cell key={`cell-exp-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: number) => formatVND(val)} />
                    </RePieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-slate-400">{t('reports.no_expense_in_period', 'Không có dữ liệu chi tiêu trong kỳ')}</p>
                )}
              </div>

              <div className="space-y-2 mt-3">
                {expenseCatData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span>{item.name}</span>
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatVND(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Income Category Pie */}
            <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                {t('reports.income_category_title', 'Cơ Cấu Nguồn Thu')}
              </h4>
              <p className="text-xs text-slate-500 mb-4">{t('reports.income_category_subtitle', 'Hội phí, tài trợ và các khoản thu sự kiện')}</p>

              <div className="h-52 w-full flex items-center justify-center">
                {incomeCatData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                      <Pie
                        data={incomeCatData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {incomeCatData.map((entry, index) => (
                          <Cell key={`cell-inc-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val: number) => formatVND(val)} />
                    </RePieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-xs text-slate-400">{t('reports.no_income_in_period', 'Không có dữ liệu thu trong kỳ')}</p>
                )}
              </div>

              <div className="space-y-2 mt-3">
                {incomeCatData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <span>{item.name}</span>
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      +{formatVND(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
