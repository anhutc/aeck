import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Tag,
  DollarSign,
  FileText,
  Check,
  AlertCircle
} from 'lucide-react';
import { AppBranding, Category, Fund, Transaction, TransactionType } from '../../types';
import { formatVND } from '../../utils/formatters';
import { useTranslation } from '../../i18n/LanguageContext';
import { AmountInput } from '../common/AmountInput';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id' | 'createdAt'>, editingId?: string) => void;
  funds: Fund[];
  categories: Category[];
  initialType?: TransactionType;
  initialFundId?: string;
  editingTransaction?: Transaction | null;
  branding?: AppBranding;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  funds,
  categories,
  initialType = 'income',
  editingTransaction,
  branding,
}) => {
  const { t } = useTranslation();
  const [type, setType] = useState<TransactionType>('income');
  const [amount, setAmount] = useState<number | string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState<string>('');
  const [error, setError] = useState<string>('');

  const appFundName = branding?.appTitle?.trim() || funds[0]?.name || 'AE Cây Khế';
  const targetFund = funds[0] || { id: 'fund_general', name: appFundName };

  // Filter categories by type
  const availableCategories = categories.filter(c => c.type === type);

  useEffect(() => {
    if (!isOpen) return;

    if (
      editingTransaction &&
      typeof editingTransaction === 'object' &&
      'amount' in editingTransaction &&
      typeof editingTransaction.amount === 'number'
    ) {
      setType(editingTransaction.type || 'income');
      setAmount(editingTransaction.amount);
      setCategoryId(editingTransaction.categoryId || '');
      setDate(editingTransaction.date || new Date().toISOString().slice(0, 10));
      setDescription(editingTransaction.description || '');
    } else {
      const activeType = initialType === 'expense' ? 'expense' : 'income';
      setType(activeType);
      setAmount('');
      setDate(new Date().toISOString().slice(0, 10));
      setDescription('');
      
      const matchingCats = categories.filter(c => c.type === activeType);
      setCategoryId(matchingCats[0]?.id || categories[0]?.id || '');
    }
    setError('');
  }, [editingTransaction, initialType, isOpen, categories]);

  // When type changes, ensure valid category is selected
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    const cat = categories.find(c => c.type === newType);
    if (cat) {
      setCategoryId(cat.id);
    } else {
      setCategoryId('');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = typeof amount === 'number' ? amount : parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError(t('transactions.error_amount_positive', 'Vui lòng nhập số tiền lớn hơn 0'));
      return;
    }

    if (!categoryId) {
      setError(t('transactions.error_category_required', 'Vui lòng chọn phân loại'));
      return;
    }

    if (!date) {
      setError(t('transactions.error_date_required', 'Vui lòng chọn ngày giao dịch'));
      return;
    }

    if (!description.trim()) {
      setError(t('transactions.error_desc_required', 'Vui lòng nhập lý do / nội dung thu chi'));
      return;
    }

    onSave(
      {
        type,
        fundId: targetFund.id,
        amount: parsedAmount,
        categoryId,
        date,
        description: description.trim(),
        status: 'completed',
      },
      editingTransaction ? editingTransaction.id : undefined
    );

    onClose();
  };

  return (
    <div
      id="transaction-modal-overlay"
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-all overflow-y-auto"
    >
      <div
        id="transaction-modal-card"
        className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden my-auto max-h-[calc(100vh-2rem)] flex flex-col animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header - Sticky, Never Clipped */}
        <div className="px-5 sm:px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 ${
                type === 'income' ? 'bg-emerald-600' : 'bg-rose-600'
              }`}
            >
              {type === 'income' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {editingTransaction
                  ? t('transactions.edit_tx_title', 'Chỉnh sửa giao dịch')
                  : type === 'income'
                  ? t('transactions.record_income_title', 'Ghi nhận thu tiền')
                  : t('transactions.record_expense_title', 'Ghi nhận khoản chi')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('transactions.modal_subtitle', `Ghi sổ ${appFundName} • Số tiền, Phân loại, Ngày, Lý do`)}
              </p>
            </div>
          </div>

          <button
            id="close-transaction-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transaction Type Segment Switch - Sticky */}
        <div className="px-5 sm:px-6 pt-4 pb-1 shrink-0 bg-white dark:bg-slate-900">
          <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
            <button
              type="button"
              id="tx-modal-type-income-btn"
              onClick={() => handleTypeChange('income')}
              className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                type === 'income'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>{t('transactions.type_income_btn', 'Tiền thu vào (+)')}</span>
            </button>

            <button
              type="button"
              id="tx-modal-type-expense-btn"
              onClick={() => handleTypeChange('expense')}
              className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                type === 'expense'
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>{t('transactions.type_expense_btn', 'Tiền chi ra (-)')}</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-5 sm:px-6 py-3 space-y-4 overflow-y-auto flex-1">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 1. SỐ TIỀN TỐI ƯU */}
            <AmountInput
              id="tx-amount-input"
              value={amount}
              onChange={(val) => {
                setAmount(val);
                if (error) setError('');
              }}
              type={type}
              label={t('transactions.amount_label', 'Số tiền (VNĐ)')}
              required
              autoFocus
              showAdders
              showInWords
              showPresets
            />

            {/* 2. PHÂN LOẠI (DANH MỤC) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-600" />
                {t('transactions.category_label', 'Phân loại')} <span className="text-rose-500">*</span>
              </label>
              <select
                id="tx-category-select"
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="" disabled>-- {t('transactions.select_category_prompt', 'Chọn phân loại')} {type === 'income' ? t('transactions.income_short', 'thu') : t('transactions.expense_short', 'chi')} --</option>
                {availableCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. NGÀY */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                {t('transactions.date_label', 'Ngày giao dịch')} <span className="text-rose-500">*</span>
              </label>
              <input
                id="tx-date-input"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
            </div>

            {/* 4. LÝ DO / NỘI DUNG */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                {t('transactions.desc_label', 'Lý do / Nội dung chi tiết')} <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="tx-description-input"
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={
                  type === 'income'
                    ? t('transactions.income_placeholder', 'VD: Thu quỹ tháng 8, Tiền thưởng dự án tài trợ quỹ...')
                    : t('transactions.expense_placeholder', 'VD: Mua trà sữa & bánh liên hoan, Mua giấy in và bút...')
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden leading-relaxed"
              />
            </div>
          </div>

          {/* Footer Buttons - Sticky, Non-clipping */}
          <div className="p-4 sm:p-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0 bg-white dark:bg-slate-900 sticky bottom-0 z-10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {t('common.cancel', 'Hủy bỏ')}
            </button>
            <button
              id="submit-transaction-btn"
              type="submit"
              className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 cursor-pointer ${
                type === 'income'
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{editingTransaction ? t('transactions.save_changes', 'Lưu thay đổi') : type === 'income' ? t('transactions.save_income', 'Ghi nhận thu') : t('transactions.save_expense', 'Ghi nhận chi')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
