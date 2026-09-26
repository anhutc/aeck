import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Trash2,
  Edit2,
  Tag,
  RotateCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Receipt
} from 'lucide-react';
import { AppBranding, Category, Fund, Member, Transaction, TransactionType } from '../types';
import { formatVND, formatDate } from '../utils/formatters';
import { useTranslation } from '../i18n/LanguageContext';
import { useFeedback } from '../context/FeedbackContext';
import { useTheme } from '../context/ThemeContext';
import { BillViewModal } from './modals/BillViewModal';

interface TransactionsTabProps {
  transactions: Transaction[];
  funds?: Fund[];
  categories: Category[];
  members?: Member[];
  branding?: AppBranding;
  isAdmin?: boolean;
  onOpenTransactionModal?: (type?: TransactionType, editingTx?: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
  onOpenPrintModal?: (fundId?: string) => void;
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({
  transactions,
  categories,
  isAdmin = true,
  onOpenTransactionModal,
  onDeleteTransaction,
}) => {
  const { t } = useTranslation();
  const { showConfirm, showToast } = useFeedback();
  const { activePreset, privacyMode, maskAmount } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

  const displayVND = (amount: number, prefix: string = '') => {
    return maskAmount(amount, prefix);
  };
  const [selectedBillFilter, setSelectedBillFilter] = useState<'all' | 'has_bill' | 'no_bill'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);
  const [viewingBillTx, setViewingBillTx] = useState<Transaction | null>(null);

  const catMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);
  const countWithBill = useMemo(() => transactions.filter(t => !!t.billImage).length, [transactions]);

  // Filtered and Sorted transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const descMatch = tx.description?.toLowerCase().includes(query);
        const amountMatch = tx.amount.toString().includes(query);
        const payerMatch = tx.payerOrReceiver?.toLowerCase().includes(query);
        if (!descMatch && !amountMatch && !payerMatch) return false;
      }

      // Type
      if (selectedType !== 'all') {
        if (tx.type !== selectedType) return false;
      }

      // Category
      if (selectedCategoryId !== 'all') {
        if (tx.categoryId !== selectedCategoryId) return false;
      }

      // Bill Filter
      if (selectedBillFilter === 'has_bill' && !tx.billImage) return false;
      if (selectedBillFilter === 'no_bill' && tx.billImage) return false;

      // Date range
      if (startDate && tx.date < startDate) return false;
      if (endDate && tx.date > endDate) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'date_desc') {
        const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
        return diff !== 0 ? diff : (b.createdAt || '').localeCompare(a.createdAt || '');
      }
      if (sortBy === 'date_asc') {
        const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
        return diff !== 0 ? diff : (a.createdAt || '').localeCompare(b.createdAt || '');
      }
      if (sortBy === 'amount_desc') {
        return b.amount - a.amount;
      }
      if (sortBy === 'amount_asc') {
        return a.amount - b.amount;
      }
      return 0;
    });
  }, [
    transactions,
    searchQuery,
    selectedType,
    selectedCategoryId,
    selectedBillFilter,
    startDate,
    endDate,
    sortBy
  ]);

  // Summary of filtered results
  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach((tx) => {
      if (tx.status === 'completed') {
        if (tx.type === 'income') income += tx.amount;
        if (tx.type === 'expense') expense += tx.amount;
      }
    });
    return {
      income,
      expense,
      net: income - expense,
      count: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  const toggleSelectAll = () => {
    if (selectedTxIds.length === filteredTransactions.length) {
      setSelectedTxIds([]);
    } else {
      setSelectedTxIds(filteredTransactions.map(t => t.id));
    }
  };

  const toggleSelectTx = (id: string) => {
    if (selectedTxIds.includes(id)) {
      setSelectedTxIds(selectedTxIds.filter(i => i !== id));
    } else {
      setSelectedTxIds([...selectedTxIds, id]);
    }
  };

  const handleBatchDelete = () => {
    if (!isAdmin || !onDeleteTransaction || selectedTxIds.length === 0) return;
    showConfirm({
      title: t('dialog.confirm_delete_title', 'Xác Nhận Xóa Dữ Liệu'),
      message: t('dialog.confirm_batch_delete_tx', 'Bạn có chắc chắn muốn xóa {count} giao dịch đã chọn? Số dư quỹ sẽ được hoàn lại tương ứng.').replace('{count}', String(selectedTxIds.length)),
      type: 'danger',
      confirmText: t('dialog.confirm_delete_btn', 'Đồng Ý Xóa'),
      cancelText: t('common.cancel', 'Hủy bỏ'),
      onConfirm: () => {
        selectedTxIds.forEach(id => onDeleteTransaction(id));
        setSelectedTxIds([]);
        showToast(t('common.saved_success', 'Đã xóa các giao dịch thành công!'), 'success');
      },
    });
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedType('all');
    setSelectedCategoryId('all');
    setSelectedBillFilter('all');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div id="transactions-tab-content" className="space-y-5 pb-12">
      {/* Top Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            {t('transactions.title', 'Sổ Cái Thu Chi')}
          </h2>
          <p className="text-xs text-slate-500">
            {t('transactions.subtitle', 'Quản lý thu chi chỉ với 4 thông tin: Số tiền, Phân loại, Ngày, Lý do')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && onOpenTransactionModal && (
            <button
              type="button"
              id="header-add-tx-btn"
              onClick={() => onOpenTransactionModal()}
              style={{ background: activePreset.gradient }}
              className="w-8 h-8 rounded-xl text-white flex items-center justify-center shadow-xs transition-all hover:opacity-95 active:scale-95 cursor-pointer mr-1"
              title={t('transactions.btn_add_tooltip', 'Ghi nhận thu / chi mới')}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}

          <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
            {filteredTransactions.length} {t('transactions.record_count', 'giao dịch')}
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search by description / reason */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="search-transactions-input"
              type="text"
              placeholder={t('transactions.search_placeholder', 'Tìm theo lý do thu chi...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-slate-400 focus:outline-hidden"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              id="filter-type-select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-slate-400 focus:outline-hidden"
            >
              <option value="all">-- {t('transactions.all_types', 'Tất cả loại (Thu & Chi)')} --</option>
              <option value="income">{t('transactions.type_income', 'Chỉ khoản thu (+)')}</option>
              <option value="expense">{t('transactions.type_expense', 'Chỉ khoản chi (-)')}</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              id="filter-category-select"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-slate-400 focus:outline-hidden"
            >
              <option value="all">-- {t('transactions.all_categories', 'Tất cả phân loại')} --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.type === 'income' ? `[${t('common.income', 'Thu')}] ` : `[${t('common.expense', 'Chi')}] `} {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date range */}
          <div className="flex items-center gap-1.5">
            <input
              id="filter-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-1/2 px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-[11px] focus:ring-2 focus:ring-slate-400 focus:outline-hidden"
              title={t('common.from_date', 'Từ ngày')}
            />
            <span className="text-slate-400 text-xs">-</span>
            <input
              id="filter-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-1/2 px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-[11px] focus:ring-2 focus:ring-slate-400 focus:outline-hidden"
              title={t('common.to_date', 'Đến ngày')}
            />
          </div>
        </div>

        {/* Filter Summary and Sort Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span>{t('common.sort_by', 'Sắp xếp theo:')}</span>
              <select
                id="transactions-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-slate-400 focus:outline-hidden"
              >
                <option value="date_desc">📅 {t('common.date_newest', 'Ngày: Mới nhất trước')}</option>
                <option value="date_asc">📅 {t('common.date_oldest', 'Ngày: Cũ nhất trước')}</option>
                <option value="amount_desc">💰 {t('common.amount_highest', 'Số tiền: Cao nhất trước')}</option>
                <option value="amount_asc">💰 {t('common.amount_lowest', 'Số tiền: Thấp nhất trước')}</option>
              </select>
            </div>

            {/* Bill / Proof Filter */}
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <Receipt className="w-3.5 h-3.5" style={{ color: activePreset.primary }} />
              <span>{t('transactions.bill_filter_label', 'Hình ảnh:')}</span>
              <select
                id="filter-bill-select"
                value={selectedBillFilter}
                onChange={(e) => setSelectedBillFilter(e.target.value as any)}
                className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-slate-400 focus:outline-hidden"
              >
                <option value="all">{t('transactions.bill_filter_all', 'Tất cả')} ({transactions.length})</option>
                <option value="has_bill">{t('transactions.bill_filter_has', 'Có ảnh')} ({countWithBill})</option>
                <option value="no_bill">{t('transactions.bill_filter_no', 'Không có ảnh')}</option>
              </select>
            </div>

            {(searchQuery || selectedType !== 'all' || selectedCategoryId !== 'all' || selectedBillFilter !== 'all' || startDate || endDate) && (
              <button
                onClick={resetFilters}
                style={{ color: activePreset.primary }}
                className="font-semibold flex items-center gap-1 cursor-pointer hover:underline"
              >
                <RotateCcw className="w-3 h-3" />
                {t('common.clear_filter', 'Xóa bộ lọc')}
              </button>
            )}
          </div>

          <div className="text-slate-500">
            {t('common.found', 'Tìm thấy')} <strong className="text-slate-900 dark:text-white">{filteredTransactions.length}</strong> {t('common.transactions_unit', 'giao dịch')}
          </div>
        </div>
      </div>

      {/* Filtered Financial Summary Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs">
        <div>
          <span className="text-slate-500 block">{t('transactions.filter_income', 'Tổng Thu (theo bộ lọc):')}</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
            {displayVND(summary.income, '+')}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">{t('transactions.filter_expense', 'Tổng Chi (theo bộ lọc):')}</span>
          <span className="font-bold text-rose-600 dark:text-rose-400 text-sm">
            {displayVND(summary.expense, '-')}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">{t('transactions.filter_net', 'Chênh Lệch Dòng Tiền:')}</span>
          <span
            className="font-bold text-sm"
            style={{ color: summary.net >= 0 ? activePreset.primary : '#e11d48' }}
          >
            {displayVND(summary.net)}
          </span>
        </div>
        <div className="text-right flex items-center justify-end">
          {isAdmin && selectedTxIds.length > 0 && (
            <button
              onClick={handleBatchDelete}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t('common.delete', 'Xóa')} ({selectedTxIds.length})
            </button>
          )}
        </div>
      </div>

      {/* Mobile Smart Card List View (< md) */}
      <div className="block md:hidden space-y-3">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((tx) => {
            const cat = catMap.get(tx.categoryId);
            const isIncome = tx.type === 'income';
            const isSelected = selectedTxIds.includes(tx.id);
            const catColor = cat?.color || (isIncome ? '#10b981' : '#ef4444');

            return (
              <div
                key={tx.id}
                style={isSelected ? { borderColor: activePreset.primary, boxShadow: `0 0 0 1px ${activePreset.primary}40` } : undefined}
                className={`p-4 rounded-2xl border transition-all duration-200 active:scale-[0.99] ${
                  isSelected
                    ? 'bg-slate-50/95 dark:bg-slate-800/90 shadow-sm'
                    : 'bg-white/95 dark:bg-slate-900/90 border-slate-200/90 dark:border-slate-800/90 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 backdrop-blur-xs'
                }`}
              >
                {/* Top Row: Category Icon + Title/Date + Amount */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {/* Category Icon Badge */}
                    <div
                      style={{
                        backgroundColor: `${catColor}18`,
                        color: catColor,
                        borderColor: `${catColor}30`,
                      }}
                      className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs"
                    >
                      <Tag className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isAdmin && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectTx(tx.id)}
                            style={{ accentColor: activePreset.primary }}
                            className="rounded w-3.5 h-3.5 cursor-pointer mr-0.5"
                          />
                        )}
                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 font-medium">
                          {formatDate(tx.date)}
                        </span>
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.2 rounded-md text-[10px] font-bold"
                          style={{
                            backgroundColor: `${catColor}15`,
                            color: catColor,
                          }}
                        >
                          {cat?.name || t('common.other', 'Khác')}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1 leading-snug line-clamp-2">
                        {tx.description}
                      </h4>
                    </div>
                  </div>

                  {/* Amount Column */}
                  <div className="text-right shrink-0">
                    <span
                      className={`font-mono font-black text-base block ${
                        isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {displayVND(tx.amount, isIncome ? '+' : '-')}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md font-bold text-[10px] mt-0.5 ${
                        isIncome
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40'
                          : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isIncome ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      {isIncome ? t('transactions.type_income', 'Thu vào') : t('transactions.type_expense', 'Chi ra')}
                    </span>
                  </div>
                </div>

                {/* Bottom Row: Actions & Bill Receipt */}
                <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-2">
                    {tx.billImage ? (
                      <button
                        type="button"
                        onClick={() => setViewingBillTx(tx)}
                        style={{ color: activePreset.primary, borderColor: `${activePreset.primary}30` }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-slate-800/80 border hover:opacity-85 transition-all cursor-pointer active:scale-95 shadow-2xs"
                      >
                        <Receipt className="w-3.5 h-3.5" style={{ color: activePreset.primary }} />
                        <span>{t('transactions.bill_view_btn', 'Xem hóa đơn')}</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        {t('transactions.no_bill', 'Không có chứng từ')}
                      </span>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onOpenTransactionModal(tx.type, tx)}
                        title={t('common.edit', 'Sửa')}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          showConfirm({
                            title: t('dialog.confirm_delete_title', 'Xác Nhận Xóa Dữ Liệu'),
                            message: `${t('dialog.confirm_delete_tx', 'Bạn có chắc chắn muốn xóa giao dịch này? Số dư quỹ sẽ tự động được hoàn lại chính xác.')}\n(${tx.description})`,
                            type: 'danger',
                            confirmText: t('dialog.confirm_delete_btn', 'Đồng Ý Xóa'),
                            cancelText: t('common.cancel', 'Hủy bỏ'),
                            onConfirm: () => {
                              onDeleteTransaction?.(tx.id);
                              showToast(t('common.saved_success', 'Đã xóa giao dịch thành công!'), 'success');
                            },
                          });
                        }}
                        title={t('common.delete', 'Xóa')}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-10 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 p-4">
            <p className="text-sm font-medium">{t('transactions.empty', 'Không tìm thấy giao dịch nào phù hợp')}</p>
            <p className="text-xs mt-1 text-slate-500">{t('transactions.empty_hint', 'Thử thay đổi bộ lọc hoặc tạo giao dịch mới')}</p>
          </div>
        )}
      </div>

      {/* Desktop Ledger Table (hidden on mobile, block on md+) */}
      <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 uppercase font-semibold">
                {isAdmin && (
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedTxIds.length === filteredTransactions.length && filteredTransactions.length > 0}
                      onChange={toggleSelectAll}
                      style={{ accentColor: activePreset.primary }}
                      className="rounded cursor-pointer"
                    />
                  </th>
                )}
                <th 
                  className="py-3 px-3 cursor-pointer hover:opacity-80 select-none transition-opacity w-28 whitespace-nowrap"
                  onClick={() => setSortBy(prev => prev === 'date_desc' ? 'date_asc' : 'date_desc')}
                  title={t('transactions.sort_date_tooltip', 'Click để đổi chiều sắp xếp ngày')}
                >
                  <div className="flex items-center gap-1">
                    <span>{t('transactions.table_date', 'Ngày')}</span>
                    {sortBy === 'date_desc' && <ArrowDown className="w-3 h-3" style={{ color: activePreset.primary }} />}
                    {sortBy === 'date_asc' && <ArrowUp className="w-3 h-3" style={{ color: activePreset.primary }} />}
                    {!sortBy.startsWith('date') && <ArrowUpDown className="w-3 h-3 text-slate-400" />}
                  </div>
                </th>
                <th className="py-3 px-3 w-28 whitespace-nowrap">{t('transactions.table_type', 'Loại')}</th>
                <th className="py-3 px-3 w-48 whitespace-nowrap">{t('transactions.table_category', 'Phân loại')}</th>
                <th className="py-3 px-3">{t('transactions.table_description', 'Lý do / Nội dung')}</th>
                <th 
                  className="py-3 px-4 text-right cursor-pointer hover:opacity-80 select-none transition-opacity w-36 whitespace-nowrap"
                  onClick={() => setSortBy(prev => prev === 'amount_desc' ? 'amount_asc' : 'amount_desc')}
                  title={t('transactions.sort_amount_tooltip', 'Click để đổi chiều sắp xếp số tiền')}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>{t('transactions.table_amount', 'Số tiền')}</span>
                    {sortBy === 'amount_desc' && <ArrowDown className="w-3 h-3" style={{ color: activePreset.primary }} />}
                    {sortBy === 'amount_asc' && <ArrowUp className="w-3 h-3" style={{ color: activePreset.primary }} />}
                    {!sortBy.startsWith('amount') && <ArrowUpDown className="w-3 h-3 text-slate-400" />}
                  </div>
                </th>
                {isAdmin && <th className="py-3 px-3 text-center w-24 whitespace-nowrap">{t('transactions.table_actions', 'Thao tác')}</th>}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx) => {
                  const cat = catMap.get(tx.categoryId);
                  const isIncome = tx.type === 'income';
                  const isSelected = selectedTxIds.includes(tx.id);

                  return (
                    <tr
                      key={tx.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors ${
                        isSelected ? 'bg-slate-50 dark:bg-slate-800/80' : ''
                      }`}
                    >
                      {isAdmin && (
                        <td className="py-3.5 px-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectTx(tx.id)}
                            style={{ accentColor: activePreset.primary }}
                            className="rounded cursor-pointer"
                          />
                        </td>
                      )}

                      <td className="py-3.5 px-3 whitespace-nowrap font-mono text-slate-700 dark:text-slate-300 font-medium">
                        {formatDate(tx.date)}
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold text-[11px] ${
                            isIncome
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60'
                              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/60'
                          }`}
                        >
                          {isIncome ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {isIncome ? t('transactions.type_income', 'Thu (+)') : t('transactions.type_expense', 'Chi (-)')}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                          style={{
                            backgroundColor: `${cat?.color || activePreset.primary}15`,
                            color: cat?.color || activePreset.primary,
                          }}
                        >
                          <Tag className="w-3 h-3" />
                          {cat?.name || t('common.other', 'Khác')}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {tx.description}
                          </span>
                          {tx.billImage && (
                            <button
                              type="button"
                              onClick={() => setViewingBillTx(tx)}
                              title={t('transactions.bill_view_tooltip', 'Nhấp để xem ảnh hóa đơn / bill')}
                              style={{ color: activePreset.primary }}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:opacity-80 transition-opacity cursor-pointer shrink-0"
                            >
                              <Receipt className="w-3 h-3" style={{ color: activePreset.primary }} />
                              <span>{t('transactions.bill_view_btn', 'Xem ảnh')}</span>
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span
                          className={`font-mono font-bold text-sm ${
                            isIncome
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {displayVND(tx.amount, isIncome ? '+' : '-')}
                        </span>
                      </td>

                      {isAdmin && (
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => onOpenTransactionModal(tx.type, tx)}
                              title={t('common.edit', 'Sửa')}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                showConfirm({
                                  title: t('dialog.confirm_delete_title', 'Xác Nhận Xóa Dữ Liệu'),
                                  message: `${t('dialog.confirm_delete_tx', 'Bạn có chắc chắn muốn xóa giao dịch này? Số dư quỹ sẽ tự động được hoàn lại chính xác.')}\n(${tx.description})`,
                                  type: 'danger',
                                  confirmText: t('dialog.confirm_delete_btn', 'Đồng Ý Xóa'),
                                  cancelText: t('common.cancel', 'Hủy bỏ'),
                                  onConfirm: () => {
                                    onDeleteTransaction?.(tx.id);
                                    showToast(t('common.saved_success', 'Đã xóa giao dịch thành công!'), 'success');
                                  },
                                });
                              }}
                              title={t('common.delete', 'Xóa')}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={isAdmin ? 7 : 5} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-medium">{t('transactions.empty', 'Không tìm thấy giao dịch nào phù hợp')}</p>
                    <p className="text-xs mt-1 text-slate-500">{t('transactions.empty_hint', 'Thử thay đổi bộ lọc hoặc tạo giao dịch mới')}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal viewing bill image */}
      {viewingBillTx && (
        <BillViewModal
          isOpen={!!viewingBillTx}
          onClose={() => setViewingBillTx(null)}
          transaction={viewingBillTx}
          category={catMap.get(viewingBillTx.categoryId)}
        />
      )}
    </div>
  );
};
