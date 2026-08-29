import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  FileDown,
  Printer,
  Trash2,
  Edit2,
  Calendar,
  Tag,
  RotateCcw,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Category, Fund, Member, Transaction, TransactionType } from '../types';
import { formatVND, formatDate, exportTransactionsToCSV } from '../utils/formatters';
import { useTranslation } from '../i18n/LanguageContext';
import { useFeedback } from '../context/FeedbackContext';

interface TransactionsTabProps {
  transactions: Transaction[];
  funds: Fund[];
  categories: Category[];
  members: Member[];
  isAdmin?: boolean;
  onOpenTransactionModal?: (type?: TransactionType, editingTx?: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
  onOpenPrintModal: (fundId?: string) => void;
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({
  transactions,
  funds,
  categories,
  isAdmin = true,
  onOpenTransactionModal,
  onDeleteTransaction,
  onOpenPrintModal,
}) => {
  const { t } = useTranslation();
  const { showConfirm, showToast } = useFeedback();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);

  const catMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

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
    setStartDate('');
    setEndDate('');
  };

  const handleExportCSV = () => {
    exportTransactionsToCSV(filteredTransactions, funds, categories);
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

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="export-csv-btn"
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileDown className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">{t('reports.export_excel', 'Xuất CSV')}</span>
          </button>

          <button
            id="print-statement-btn"
            onClick={() => onOpenPrintModal()}
            className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">{t('reports.print_statement', 'In sổ cái')}</span>
          </button>

          {isAdmin && (
            <>
              <button
                id="new-income-btn"
                onClick={() => onOpenTransactionModal('income')}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>{t('transactions.btn_add_income', 'Thu tiền (+)')}</span>
              </button>

              <button
                id="new-expense-btn"
                onClick={() => onOpenTransactionModal('expense')}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm shadow-rose-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>{t('transactions.btn_add_expense', 'Chi tiền (-)')}</span>
              </button>
            </>
          )}
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
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              id="filter-type-select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
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
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
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
              className="w-1/2 px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-[11px] focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              title={t('common.from_date', 'Từ ngày')}
            />
            <span className="text-slate-400 text-xs">-</span>
            <input
              id="filter-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-1/2 px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-[11px] focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
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
                className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="date_desc">📅 {t('common.date_newest', 'Ngày: Mới nhất trước')}</option>
                <option value="date_asc">📅 {t('common.date_oldest', 'Ngày: Cũ nhất trước')}</option>
                <option value="amount_desc">💰 {t('common.amount_highest', 'Số tiền: Cao nhất trước')}</option>
                <option value="amount_asc">💰 {t('common.amount_lowest', 'Số tiền: Thấp nhất trước')}</option>
              </select>
            </div>

            {(searchQuery || selectedType !== 'all' || selectedCategoryId !== 'all' || startDate || endDate) && (
              <button
                onClick={resetFilters}
                className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer"
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
            +{formatVND(summary.income)}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">{t('transactions.filter_expense', 'Tổng Chi (theo bộ lọc):')}</span>
          <span className="font-bold text-rose-600 dark:text-rose-400 text-sm">
            -{formatVND(summary.expense)}
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">{t('transactions.filter_net', 'Chênh Lệch Dòng Tiền:')}</span>
          <span className={`font-bold text-sm ${summary.net >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {formatVND(summary.net)}
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

      {/* Ledger Table - Streamlined 4-field focus */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 uppercase font-semibold">
                {isAdmin && (
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedTxIds.length === filteredTransactions.length && filteredTransactions.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded text-blue-600"
                    />
                  </th>
                )}
                <th 
                  className="py-3 px-3 cursor-pointer hover:text-blue-600 select-none transition-colors"
                  onClick={() => setSortBy(prev => prev === 'date_desc' ? 'date_asc' : 'date_desc')}
                  title="Click để đổi chiều sắp xếp ngày"
                >
                  <div className="flex items-center gap-1">
                    <span>{t('transactions.table_date', 'Ngày')}</span>
                    {sortBy === 'date_desc' && <ArrowDown className="w-3 h-3 text-blue-600" />}
                    {sortBy === 'date_asc' && <ArrowUp className="w-3 h-3 text-blue-600" />}
                    {!sortBy.startsWith('date') && <ArrowUpDown className="w-3 h-3 text-slate-400" />}
                  </div>
                </th>
                <th className="py-3 px-3">{t('transactions.table_type', 'Loại')}</th>
                <th className="py-3 px-3">{t('transactions.table_category', 'Phân loại')}</th>
                <th className="py-3 px-3">{t('transactions.table_description', 'Lý do / Nội dung')}</th>
                <th 
                  className="py-3 px-4 text-right cursor-pointer hover:text-blue-600 select-none transition-colors"
                  onClick={() => setSortBy(prev => prev === 'amount_desc' ? 'amount_asc' : 'amount_desc')}
                  title="Click để đổi chiều sắp xếp số tiền"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>{t('transactions.table_amount', 'Số tiền')}</span>
                    {sortBy === 'amount_desc' && <ArrowDown className="w-3 h-3 text-blue-600" />}
                    {sortBy === 'amount_asc' && <ArrowUp className="w-3 h-3 text-blue-600" />}
                    {!sortBy.startsWith('amount') && <ArrowUpDown className="w-3 h-3 text-slate-400" />}
                  </div>
                </th>
                {isAdmin && <th className="py-3 px-3 text-center">{t('transactions.table_actions', 'Thao tác')}</th>}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx) => {
                  const cat = catMap.get(tx.categoryId);
                  const isIncome = tx.type === 'income';
                  const isSelected = selectedTxIds.includes(tx.id);

                  return (
                    <tr
                      key={tx.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                        isSelected ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      {isAdmin && (
                        <td className="py-3.5 px-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectTx(tx.id)}
                            className="rounded text-blue-600"
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
                              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                              : 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
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
                            backgroundColor: `${cat?.color || '#3B82F6'}15`,
                            color: cat?.color || '#3B82F6',
                          }}
                        >
                          <Tag className="w-3 h-3" />
                          {cat?.name || t('common.other', 'Khác')}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 max-w-md">
                        <div className="font-semibold text-slate-900 dark:text-white line-clamp-2">
                          {tx.description}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span
                          className={`font-black text-sm ${
                            isIncome
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {isIncome ? '+' : '-'}{formatVND(tx.amount)}
                        </span>
                      </td>

                      {isAdmin && (
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => onOpenTransactionModal(tx.type, tx)}
                              title={t('common.edit', 'Sửa')}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
    </div>
  );
};
