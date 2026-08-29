import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Calendar, DollarSign, FileText, User } from 'lucide-react';
import { formatVND } from '../../utils/formatters';
import { useTranslation } from '../../i18n/LanguageContext';
import { useFeedback } from '../../context/FeedbackContext';

interface CampaignPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberName: string;
  campaignTitle: string;
  campaignLaunchDate?: string;
  requiredAmount: number;
  initialPaidAmount?: number;
  initialPaidDate?: string;
  initialNote?: string;
  onConfirmPayment: (amount: number, paidDate: string, note: string) => void;
  onCancelPayment?: () => void;
}

export const CampaignPayModal: React.FC<CampaignPayModalProps> = ({
  isOpen,
  onClose,
  memberName,
  campaignTitle,
  campaignLaunchDate,
  requiredAmount,
  initialPaidAmount,
  initialPaidDate,
  initialNote,
  onConfirmPayment,
  onCancelPayment,
}) => {
  const { t } = useTranslation();
  const { showConfirm, showToast } = useFeedback();
  const [amount, setAmount] = useState<string>('');
  const [paidDate, setPaidDate] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string>('');

  const todayStr = new Date().toISOString().slice(0, 10);
  const targetLaunchDate = campaignLaunchDate || todayStr;

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().slice(0, 10);
      setAmount(
        initialPaidAmount !== undefined && initialPaidAmount > 0
          ? initialPaidAmount.toString()
          : requiredAmount.toString()
      );
      setPaidDate(initialPaidDate || targetLaunchDate || today);
      setNote(initialNote || t('campaigns.paid_in_full_default_note', 'Đã nộp đủ tiền quỹ'));
      setError('');
    }
  }, [isOpen, requiredAmount, initialPaidAmount, initialPaidDate, initialNote, targetLaunchDate, t]);


  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError(t('campaigns.error_valid_amount', 'Vui lòng nhập số tiền hợp lệ'));
      return;
    }
    if (!paidDate) {
      setError(t('campaigns.error_paid_date_required', 'Vui lòng chọn ngày nộp tiền'));
      return;
    }

    onConfirmPayment(parsedAmount, paidDate, note.trim());
    onClose();
  };

  const isAlreadyPaid = initialPaidAmount !== undefined && initialPaidAmount >= requiredAmount;

  return (
    <div
      id="campaign-pay-modal-overlay"
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-all overflow-y-auto"
    >
      <div
        id="campaign-pay-modal-card"
        className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden my-auto max-h-[calc(100vh-2rem)] flex flex-col animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header - Sticky */}
        <div className="px-5 sm:px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t('campaigns.pay_modal_title', 'Ghi Nhận Nộp Quỹ')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('campaigns.pay_modal_subtitle', 'Cập nhật thông tin và ngày thực tế nộp tiền')}
              </p>
            </div>
          </div>
          <button
            id="close-campaign-pay-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Member & Campaign Context Summary */}
        <div className="px-5 sm:px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-xs space-y-1 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-500" />
              {t('campaigns.member_label', 'Thành viên:')}
            </span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">{memberName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">{t('campaigns.campaign_label', 'Đợt thu quỹ:')}</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 max-w-[200px] truncate">{campaignTitle}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">{t('campaigns.required_amount_label', 'Mức quy định:')}</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">{formatVND(requiredAmount)}</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs">
                {error}
              </div>
            )}

            {/* Payment Date - Custom Date picker as requested */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                {t('campaigns.actual_pay_date_label', 'Ngày nộp tiền (Tùy chọn ngày thực tế)')} <span className="text-rose-500">*</span>
              </label>
              <input
                id="campaign-pay-date-input"
                type="date"
                required
                value={paidDate}
                onChange={(e) => setPaidDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              
              {/* Quick preset date buttons */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {campaignLaunchDate && (
                  <button
                    type="button"
                    onClick={() => setPaidDate(campaignLaunchDate)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                      paidDate === campaignLaunchDate
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-100'
                    }`}
                  >
                    ⚡ Ngày tạo đợt ({campaignLaunchDate})
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPaidDate(todayStr)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                    paidDate === todayStr
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  📅 Hôm nay ({todayStr})
                </button>
              </div>

              <p className="text-[11px] text-slate-500 mt-1.5">
                {t('campaigns.date_picker_hint', 'Bạn có thể chọn nhanh ngày tạo đợt, ngày hôm nay hoặc bất kỳ ngày nào thành viên đã nộp tiền.')}
              </p>
            </div>

            {/* Payment Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                {t('campaigns.pay_amount_label', 'Số tiền nộp (VNĐ)')} <span className="text-rose-500">*</span>
              </label>
              <input
                id="campaign-pay-amount-input"
                type="number"
                required
                min="1000"
                step="1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="VD: 500000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <div className="flex items-center gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={() => setAmount(requiredAmount.toString())}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  {t('campaigns.pay_in_full_btn', 'Nộp đủ')} ({formatVND(requiredAmount)})
                </button>
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                {t('campaigns.pay_note_label', 'Ghi chú (Hình thức nộp, ngân hàng...)')}
              </label>
              <input
                id="campaign-pay-note-input"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('campaigns.pay_note_placeholder', 'VD: Chuyển khoản Vietcombank, Nộp tiền mặt...')}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 sm:p-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 bg-white dark:bg-slate-900 sticky bottom-0 z-10">
            {isAlreadyPaid && onCancelPayment ? (
              <button
                type="button"
                onClick={() => {
                  showConfirm({
                    title: t('dialog.confirm_action_title', 'Xác Nhận Thao Tác'),
                    message: t('campaigns.confirm_unmark_paid', `Hủy trạng thái đã nộp của ${memberName}?`),
                    type: 'warning',
                    confirmText: t('campaigns.unmark_paid_btn', 'Đánh dấu chưa nộp'),
                    cancelText: t('common.cancel', 'Hủy bỏ'),
                    onConfirm: () => {
                      onCancelPayment();
                      onClose();
                      showToast(t('common.saved_success', 'Đã hủy trạng thái nộp quỹ!'), 'info');
                    },
                  });
                }}
                className="px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-semibold transition-colors cursor-pointer"
              >
                {t('campaigns.unmark_paid_btn', 'Đánh dấu chưa nộp')}
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {t('common.close', 'Đóng')}
              </button>
              <button
                id="confirm-campaign-payment-submit-btn"
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('campaigns.confirm_paid_full_btn', 'Xác nhận nộp đủ')}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
