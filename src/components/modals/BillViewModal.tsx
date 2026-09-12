import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Receipt,
  Calendar,
  Tag,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { Transaction, Category } from '../../types';
import { formatVND, formatDate } from '../../utils/formatters';
import { useTranslation } from '../../i18n/LanguageContext';

interface BillViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  category?: Category;
}

export const BillViewModal: React.FC<BillViewModalProps> = ({
  isOpen,
  onClose,
  transaction,
  category,
}) => {
  const { t } = useTranslation();
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Reset zoom and rotation whenever opening a new bill
  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setRotation(0);
    }
  }, [isOpen, transaction]);

  // Keyboard escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !transaction || !transaction.billImage) return null;

  const isIncome = transaction.type === 'income';

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = transaction.billImage!;
    const sanitizedDesc = (transaction.description || 'bill')
      .replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_')
      .slice(0, 30);
    link.download = `bill_${transaction.date}_${sanitizedDesc}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  return (
    <div
      id="bill-view-modal-overlay"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-all animate-in fade-in duration-150"
    >
      <div
        id="bill-view-modal-card"
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden max-h-[94vh] flex flex-col animate-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs ${
                isIncome ? 'bg-emerald-600 shadow-emerald-600/20' : 'bg-rose-600 shadow-rose-600/20'
              }`}
            >
              <Receipt className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 truncate">
                <span>{t('transactions.bill_modal_title', 'Hình ảnh đính kèm')}</span>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    isIncome
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  }`}
                >
                  {isIncome ? '+' : '-'}{formatVND(transaction.amount)}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {transaction.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleDownload}
              title={t('transactions.bill_download_btn', 'Tải ảnh')}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title={t('common.close', 'Đóng')}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Transaction Summary Sub-bar */}
        <div className="px-4 sm:px-6 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium">
              <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{formatDate(transaction.date)}</span>
            </span>
            {category && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium text-[11px]"
                style={{
                  backgroundColor: `${category.color || '#3B82F6'}15`,
                  color: category.color || '#3B82F6',
                }}
              >
                <Tag className="w-3 h-3" />
                <span>{category.name}</span>
              </span>
            )}
            <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-200">
              {isIncome ? <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" /> : <ArrowUpRight className="w-3.5 h-3.5 text-rose-600" />}
              <span>{isIncome ? t('transactions.record_income_title', 'Khoản thu') : t('transactions.record_expense_title', 'Khoản chi')}</span>
            </span>
          </div>

          {/* Quick Zoom/Rotate Controls */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              title={t('transactions.bill_zoom_out', 'Thu nhỏ')}
              className="p-1 rounded text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-30 cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-bold w-10 text-center text-slate-700 dark:text-slate-200">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              title={t('transactions.bill_zoom_in', 'Phóng to')}
              className="p-1 rounded text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-30 cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-3 bg-slate-200 dark:bg-slate-700 mx-1" />
            <button
              onClick={handleRotate}
              title={t('transactions.bill_rotate_btn', 'Xoay ảnh')}
              className="p-1 rounded text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleReset}
              title={t('text_editor.reset_all_btn', 'Kích thước ban đầu')}
              className="p-1 rounded text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bill Image Canvas Container */}
        <div className="flex-1 overflow-auto bg-slate-100/90 dark:bg-slate-950 p-4 sm:p-6 flex items-center justify-center min-h-[300px] sm:min-h-[420px] select-none">
          <div
            className="transition-transform duration-150 flex items-center justify-center"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'center center',
            }}
          >
            <img
              src={transaction.billImage}
              alt={`Hóa đơn ${transaction.description}`}
              className="max-w-full max-h-[68vh] object-contain rounded-xl shadow-lg border border-slate-200/80 dark:border-slate-800 bg-white pointer-events-auto"
              draggable={false}
            />
          </div>
        </div>

        {/* Footer info bar */}
        <div className="px-4 sm:px-6 py-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs flex items-center justify-between gap-3">
          <span className="truncate">
            {t('transactions.bill_transparent_badge', 'Hóa đơn minh bạch cho khoản')} {isIncome ? t('transactions.income_short', 'thu') : t('transactions.expense_short', 'chi')}: <strong className="text-slate-800 dark:text-slate-200">{transaction.description}</strong>
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t('transactions.bill_download_btn', 'Tải ảnh')}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
            >
              {t('common.close', 'Đóng')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
