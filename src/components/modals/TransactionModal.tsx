import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Tag,
  FileText,
  Check,
  AlertCircle,
  Image as ImageIcon,
  Camera,
  Trash2,
  Eye,
  RefreshCw,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { AppBranding, Category, Fund, Transaction, TransactionType } from '../../types';
import { useTranslation } from '../../i18n/LanguageContext';
import { AmountInput } from '../common/AmountInput';
import { compressBillImage } from '../../utils/imageCompressor';
import { BillViewModal } from './BillViewModal';

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
  const [billImage, setBillImage] = useState<string>('');
  const [imageSizeKb, setImageSizeKb] = useState<number | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isPreviewBillOpen, setIsPreviewBillOpen] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setBillImage(editingTransaction.billImage || '');
      setImageSizeKb(null);
    } else {
      const activeType = initialType === 'expense' ? 'expense' : 'income';
      setType(activeType);
      setAmount('');
      setDate(new Date().toISOString().slice(0, 10));
      setDescription('');
      setBillImage('');
      setImageSizeKb(null);
      
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

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chỉ chọn tệp hình ảnh (JPG, PNG, WebP).');
      return;
    }
    try {
      setIsCompressing(true);
      setError('');
      const result = await compressBillImage(file, 1280, 0.78);
      setBillImage(result.dataUrl);
      setImageSizeKb(result.compressedSizeKb);
    } catch (err: any) {
      setError(err?.message || 'Không thể xử lý ảnh hóa đơn. Vui lòng thử lại.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset file input so user can choose the same file again if re-uploading
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleRemoveImage = () => {
    setBillImage('');
    setImageSizeKb(null);
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
        billImage: billImage ? billImage : undefined,
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

            {/* 5. ẢNH HÓA ĐƠN / BILL CHI TIÊU (TÙY CHỌN) */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ImageIcon className={`w-3.5 h-3.5 ${type === 'expense' ? 'text-rose-600' : 'text-emerald-600'}`} />
                  <span>{type === 'expense' ? t('transactions.bill_image_title', 'Ảnh hóa đơn') : t('transactions.receipt_image_title', 'Biên lai thu')}</span>
                </label>
                {type === 'expense' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200/60 dark:border-rose-900/60">
                    <ShieldCheck className="w-3 h-3 text-rose-500" />
                    {t('transactions.transparent_badge', 'Minh bạch')}
                  </span>
                )}
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="tx-bill-image-file-input"
              />

              {!billImage ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 scale-[0.99]'
                      : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                  }`}
                >
                  {isCompressing ? (
                    <div className="py-2 flex flex-col items-center justify-center gap-2 text-slate-500">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                      <span className="text-xs font-semibold">{t('transactions.bill_compressing', 'Đang xử lý & tối ưu độ nét ảnh hóa đơn...')}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-700 shadow-xs border border-slate-200/80 dark:border-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-300">
                        <Camera className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        {t('transactions.bill_upload_label', 'Đính kèm ảnh')}
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xs">
                        {t('transactions.bill_upload_hint', 'Chụp ảnh hóa đơn hoặc chọn tệp (JPG, PNG, WebP). Hệ thống tự động nén nhẹ & giữ nét chữ.')}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      onClick={() => setIsPreviewBillOpen(true)}
                      className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 shrink-0 cursor-pointer group"
                      title={t('transactions.bill_zoom_in', 'Nhấp để phóng to ảnh')}
                    >
                      <img
                        src={billImage}
                        alt="Hóa đơn"
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Eye className="w-4 h-4" />
                      </div>
                    </div>

                    <div className="min-w-0 text-xs">
                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span className="truncate">{t('transactions.bill_attached_success', 'Đã đính kèm ảnh hóa đơn')}</span>
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {imageSizeKb ? `~${imageSizeKb} KB` : t('transactions.bill_size_valid', 'Ảnh hóa đơn hợp lệ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsPreviewBillOpen(true)}
                      title={t('transactions.view_large_bill', 'Xem ảnh lớn')}
                      className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      title={t('transactions.change_bill_photo', 'Đổi ảnh khác')}
                      className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      title={t('transactions.delete_bill_photo', 'Xóa ảnh này')}
                      className="p-2 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
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

      {/* Quick Preview Modal inside form */}
      {billImage && (
        <BillViewModal
          isOpen={isPreviewBillOpen}
          onClose={() => setIsPreviewBillOpen(false)}
          transaction={{
            id: 'preview',
            type,
            fundId: targetFund.id,
            amount: typeof amount === 'number' ? amount : (parseFloat(amount) || 0),
            categoryId,
            date,
            description: description || 'Xem trước ảnh hóa đơn',
            billImage,
            status: 'completed',
            createdAt: new Date().toISOString(),
          }}
          category={availableCategories.find(c => c.id === categoryId)}
        />
      )}
    </div>
  );
};
