import React, { useState } from 'react';
import {
  RotateCcw,
  AlertTriangle,
  X,
  Check,
  Trash2,
  Sparkles,
  ShieldAlert,
  Sliders,
  DollarSign,
  Users,
  Target,
  Tag,
  ScrollText,
  Building2,
  RefreshCw,
  CheckSquare,
  Square,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { ResetCustomOptions } from '../../types';
import { formatVND } from '../../utils/formatters';
import { useTranslation } from '../../i18n/LanguageContext';

interface ResetFundModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  onResetBalanceToZero: () => void;
  onResetAllDataForNewPeriod: () => void;
  onRestoreDemoData: () => void;
  onResetCustomOptions: (options: ResetCustomOptions) => void;
}

export const ResetFundModal: React.FC<ResetFundModalProps> = ({
  isOpen,
  onClose,
  currentBalance,
  onResetBalanceToZero,
  onResetAllDataForNewPeriod,
  onRestoreDemoData,
  onResetCustomOptions,
}) => {
  const { t } = useTranslation();

  // Active preset tracker for visual highlight
  const [activePreset, setActivePreset] = useState<'balance_zero' | 'new_period' | 'clear_all' | 'demo_data' | 'custom'>('new_period');

  // Custom granular options selection
  const [customOptions, setCustomOptions] = useState<ResetCustomOptions>({
    resetBalanceOnly: true,
    clearAllTransactions: true,
    resetCampaigns: true,
    resetMembers: false,
    resetCategories: false,
    resetNotice: false,
    resetBankAndBranding: false,
  });

  // Safety confirmation states
  const [confirmCheckbox, setConfirmCheckbox] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const toggleCustomOption = (key: keyof ResetCustomOptions) => {
    setCustomOptions(prev => {
      const next = { ...prev, [key]: !prev[key] };
      setActivePreset('custom');
      return next;
    });
    setError('');
  };

  const handleSelectAll = () => {
    setCustomOptions({
      resetBalanceOnly: true,
      clearAllTransactions: true,
      resetCampaigns: true,
      resetMembers: true,
      resetCategories: true,
      resetNotice: true,
      resetBankAndBranding: true,
    });
    setActivePreset('custom');
    setError('');
  };

  const handleDeselectAll = () => {
    setCustomOptions({
      resetBalanceOnly: false,
      clearAllTransactions: false,
      resetCampaigns: false,
      resetMembers: false,
      resetCategories: false,
      resetNotice: false,
      resetBankAndBranding: false,
    });
    setActivePreset('custom');
    setError('');
  };

  const handleApplyPreset = (type: 'balance_zero' | 'new_period' | 'clear_all' | 'demo_data') => {
    setActivePreset(type);
    setError('');
    setConfirmCheckbox(false);
    setConfirmText('');

    if (type === 'balance_zero') {
      setCustomOptions({
        resetBalanceOnly: true,
        clearAllTransactions: false,
        resetCampaigns: false,
        resetMembers: false,
        resetCategories: false,
        resetNotice: false,
        resetBankAndBranding: false,
      });
    } else if (type === 'new_period') {
      setCustomOptions({
        resetBalanceOnly: true,
        clearAllTransactions: true,
        resetCampaigns: true,
        resetMembers: false,
        resetCategories: false,
        resetNotice: false,
        resetBankAndBranding: false,
      });
    } else if (type === 'clear_all') {
      setCustomOptions({
        resetBalanceOnly: true,
        clearAllTransactions: true,
        resetCampaigns: true,
        resetMembers: true,
        resetCategories: true,
        resetNotice: true,
        resetBankAndBranding: false,
      });
    }
  };

  const isDemoMode = activePreset === 'demo_data';
  const selectedCount = Object.values(customOptions).filter(Boolean).length;
  const isDestructive = isDemoMode || customOptions.clearAllTransactions || customOptions.resetCampaigns || customOptions.resetMembers;
  const isTextConfirmValid = !isDestructive || confirmText.trim().toUpperCase() === 'RESET' || confirmText.trim().toUpperCase() === 'XAC NHAN' || confirmText.trim().toUpperCase() === 'XÁC NHẬN';

  const handleExecute = () => {
    if (!isDemoMode && selectedCount === 0) {
      setError(t('reset.error_select_one', 'Vui lòng chọn ít nhất 1 mục bạn muốn đặt lại'));
      return;
    }

    if (!confirmCheckbox) {
      setError('Vui lòng tích chọn xác nhận an toàn trước khi thực hiện.');
      return;
    }

    // Require text confirmation if destructive
    if (isDestructive && !isTextConfirmValid) {
      setError(t('reset.error_type_reset', 'Vui lòng gõ chữ "RESET" để xác nhận hành động này'));
      return;
    }

    if (isDemoMode) {
      onRestoreDemoData();
      onClose();
      return;
    }

    onResetCustomOptions(customOptions);
    onClose();
  };

  return (
    <div
      id="reset-fund-modal-overlay"
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-all overflow-y-auto"
    >
      <div
        id="reset-fund-modal-card"
        className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden my-auto max-h-[calc(100vh-2rem)] flex flex-col animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header - Sticky & High Contrast */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {t('reset.modal_title', 'Tùy Chọn Đặt Lại & Reset Dữ Liệu')}
              </h2>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span>{t('reset.current_balance_prefix', 'Số dư hiện tại:')}</span>
                <strong className="text-emerald-600 dark:text-emerald-400">{formatVND(currentBalance)}</strong>
              </p>
            </div>
          </div>
          <button
            id="close-reset-fund-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Quick Presets Bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{t('reset.quick_presets_label', 'Mẫu cấu hình đặt lại nhanh:')}</span>
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleApplyPreset('balance_zero')}
                className={`p-3 rounded-xl border text-left transition-all text-xs cursor-pointer ${
                  activePreset === 'balance_zero'
                    ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 ring-1 ring-blue-500/30'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-blue-300 hover:bg-blue-50/40 dark:hover:bg-slate-800/80 hover:shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white block text-[11px]">
                    {t('reset.preset_zero_title', 'Cân đối về 0')}
                  </span>
                  {activePreset === 'balance_zero' && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">{t('reset.preset_zero_desc', 'Giữ nguyên lịch sử')}</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('new_period')}
                className={`p-3 rounded-xl border text-left transition-all text-xs cursor-pointer ${
                  activePreset === 'new_period'
                    ? 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/40 ring-1 ring-purple-500/30'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-purple-300 hover:bg-purple-50/40 dark:hover:bg-slate-800/80 hover:shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-700 dark:text-purple-300 block text-[11px]">
                    {t('reset.preset_period_title', 'Niên khóa mới')}
                  </span>
                  {activePreset === 'new_period' && <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">{t('reset.preset_period_desc', 'Xóa giao dịch cũ')}</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('clear_all')}
                className={`p-3 rounded-xl border text-left transition-all text-xs cursor-pointer ${
                  activePreset === 'clear_all'
                    ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/40 ring-1 ring-rose-500/30'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-rose-300 hover:bg-rose-50/40 dark:hover:bg-slate-800/80 hover:shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-700 dark:text-rose-300 block text-[11px]">
                    {t('reset.preset_clear_title', 'Làm sạch hết')}
                  </span>
                  {activePreset === 'clear_all' && <Check className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">{t('reset.preset_clear_desc', 'Sổ trắng hoàn toàn')}</span>
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset('demo_data')}
                className={`p-3 rounded-xl border text-left transition-all text-xs cursor-pointer ${
                  activePreset === 'demo_data'
                    ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 ring-1 ring-emerald-500/30'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-slate-800/80 hover:shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-700 dark:text-emerald-300 block text-[11px]">
                    {t('reset.preset_demo_title', 'Nạp mẫu thử')}
                  </span>
                  {activePreset === 'demo_data' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <RefreshCw className="w-3 h-3 text-emerald-600 shrink-0" />
                  )}
                </div>
                <span className="text-[10px] text-slate-500 block mt-0.5">{t('reset.preset_demo_desc', 'Dữ liệu ban đầu')}</span>
              </button>
            </div>
          </div>

          {/* If in Demo Data Preset Mode, show dedicated explanation card */}
          {isDemoMode ? (
            <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/90 dark:border-emerald-900/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs text-emerald-800 dark:text-emerald-300">
                  <RefreshCw className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Chế độ: Nạp lại Dữ liệu Mẫu (Demo Starter)</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('new_period')}
                  className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  ← Đổi tùy chọn khác
                </button>
              </div>

              <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                Hành động này sẽ tải lại toàn bộ bộ dữ liệu mẫu chuẩn của ứng dụng để bạn thử nghiệm các chức năng quản lý quỹ, thu chi, đóng góp thành viên và sao kê.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700 dark:text-slate-300 pt-1">
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>10+ giao dịch thu/chi mẫu & số dư khởi tạo</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>5 thành viên mẫu kèm thông tin liên lạc</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>2 đợt đóng quỹ (Đang thu & Hoàn thành)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Bảng nội quy & danh mục thu chi tiêu chuẩn</span>
                </div>
              </div>
            </div>
          ) : (
            /* Granular Selection Controls & Counter */
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {t('reset.custom_checklist_title', 'Tùy chọn từng phần cần đặt lại:')}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                  Đã chọn {selectedCount} / 7
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-2 py-1 rounded-lg border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/60 font-medium text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <CheckSquare className="w-3 h-3" />
                  <span>Chọn tất cả</span>
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Square className="w-3 h-3" />
                  <span>Bỏ chọn</span>
                </button>
              </div>
            </div>

            {/* Checklist Cards with Enhanced Hover and Selection */}
            <div className="space-y-2">
              {/* Option 1: Reset Balance to 0 */}
              <div
                onClick={() => toggleCustomOption('resetBalanceOnly')}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer select-none transition-all ${
                  customOptions.resetBalanceOnly
                    ? 'border-blue-500/80 bg-blue-50/50 dark:bg-blue-950/30 ring-1 ring-blue-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60'
                } hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/30 dark:hover:bg-slate-800/80 hover:shadow-xs`}
              >
                <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border transition-all ${
                  customOptions.resetBalanceOnly
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                }`}>
                  {customOptions.resetBalanceOnly && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {t('reset.opt_1_title', '1. Đưa số dư Quỹ Hoạt Động về 0 VNĐ')}
                      </span>
                    </div>
                    {customOptions.resetBalanceOnly && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 shrink-0">
                        Đã chọn
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    {t('reset.opt_1_desc', 'Đặt lại tổng tồn quỹ hiện tại về 0 VNĐ.')}
                  </p>
                </div>
              </div>

              {/* Option 2: Clear Transactions */}
              <div
                onClick={() => toggleCustomOption('clearAllTransactions')}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer select-none transition-all ${
                  customOptions.clearAllTransactions
                    ? 'border-rose-500/80 bg-rose-50/50 dark:bg-rose-950/30 ring-1 ring-rose-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60'
                } hover:border-rose-300 dark:hover:border-rose-700 hover:bg-rose-50/30 dark:hover:bg-slate-800/80 hover:shadow-xs`}
              >
                <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border transition-all ${
                  customOptions.clearAllTransactions
                    ? 'bg-rose-600 border-rose-600 text-white'
                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                }`}>
                  {customOptions.clearAllTransactions && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Trash2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {t('reset.opt_2_title', '2. Xóa toàn bộ lịch sử Thu / Chi trong sổ cái')}
                      </span>
                    </div>
                    {customOptions.clearAllTransactions && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 shrink-0">
                        Xóa lịch sử
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    {t('reset.opt_2_desc', 'Xóa sạch các giao dịch thu tiền và phiếu chi tiêu cũ để lập sổ mới.')}
                  </p>
                </div>
              </div>

              {/* Option 3: Reset Campaigns */}
              <div
                onClick={() => toggleCustomOption('resetCampaigns')}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer select-none transition-all ${
                  customOptions.resetCampaigns
                    ? 'border-purple-500/80 bg-purple-50/50 dark:bg-purple-950/30 ring-1 ring-purple-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60'
                } hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50/30 dark:hover:bg-slate-800/80 hover:shadow-xs`}
              >
                <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border transition-all ${
                  customOptions.resetCampaigns
                    ? 'bg-purple-600 border-purple-600 text-white'
                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                }`}>
                  {customOptions.resetCampaigns && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Target className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {t('reset.opt_3_title', '3. Đặt lại / Xóa các Đợt đóng quỹ & Chiến dịch')}
                      </span>
                    </div>
                    {customOptions.resetCampaigns && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 shrink-0">
                        Đã chọn
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    {t('reset.opt_3_desc', 'Xóa các đợt đóng quỹ cũ và lịch sử tiến độ thu từng thành viên.')}
                  </p>
                </div>
              </div>

              {/* Option 4: Reset Members */}
              <div
                onClick={() => toggleCustomOption('resetMembers')}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer select-none transition-all ${
                  customOptions.resetMembers
                    ? 'border-amber-500/80 bg-amber-50/50 dark:bg-amber-950/30 ring-1 ring-amber-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60'
                } hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50/30 dark:hover:bg-slate-800/80 hover:shadow-xs`}
              >
                <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border transition-all ${
                  customOptions.resetMembers
                    ? 'bg-amber-600 border-amber-600 text-white'
                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                }`}>
                  {customOptions.resetMembers && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {t('reset.opt_4_title', '4. Đặt lại Danh sách Thành viên về mặc định')}
                      </span>
                    </div>
                    {customOptions.resetMembers && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 shrink-0">
                        Đã chọn
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    {t('reset.opt_4_desc', 'Khôi phục danh sách thành viên mẫu ban đầu.')}
                  </p>
                </div>
              </div>

              {/* Option 5: Reset Categories */}
              <div
                onClick={() => toggleCustomOption('resetCategories')}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer select-none transition-all ${
                  customOptions.resetCategories
                    ? 'border-indigo-500/80 bg-indigo-50/50 dark:bg-indigo-950/30 ring-1 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60'
                } hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/30 dark:hover:bg-slate-800/80 hover:shadow-xs`}
              >
                <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border transition-all ${
                  customOptions.resetCategories
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                }`}>
                  {customOptions.resetCategories && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {t('reset.opt_5_title', '5. Đặt lại Danh mục Thu / Chi')}
                      </span>
                    </div>
                    {customOptions.resetCategories && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 shrink-0">
                        Đã chọn
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    {t('reset.opt_5_desc', 'Khôi phục các hạng mục thu/chi phân loại chuẩn.')}
                  </p>
                </div>
              </div>

              {/* Option 6: Reset Notice */}
              <div
                onClick={() => toggleCustomOption('resetNotice')}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer select-none transition-all ${
                  customOptions.resetNotice
                    ? 'border-emerald-500/80 bg-emerald-50/50 dark:bg-emerald-950/30 ring-1 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60'
                } hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/30 dark:hover:bg-slate-800/80 hover:shadow-xs`}
              >
                <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border transition-all ${
                  customOptions.resetNotice
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                }`}>
                  {customOptions.resetNotice && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ScrollText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {t('reset.opt_6_title', '6. Đặt lại Bảng Nội quy & Quy định hoạt động')}
                      </span>
                    </div>
                    {customOptions.resetNotice && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
                        Đã chọn
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    {t('reset.opt_6_desc', 'Khôi phục nội dung quy chế hoạt động mẫu chuẩn.')}
                  </p>
                </div>
              </div>

              {/* Option 7: Reset Bank & Branding */}
              <div
                onClick={() => toggleCustomOption('resetBankAndBranding')}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer select-none transition-all ${
                  customOptions.resetBankAndBranding
                    ? 'border-blue-500/80 bg-blue-50/50 dark:bg-blue-950/30 ring-1 ring-blue-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60'
                } hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/30 dark:hover:bg-slate-800/80 hover:shadow-xs`}
              >
                <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border transition-all ${
                  customOptions.resetBankAndBranding
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                }`}>
                  {customOptions.resetBankAndBranding && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {t('reset.opt_7_title', '7. Đặt lại Cấu hình Ngân hàng & Tên Nhóm/Branding')}
                      </span>
                    </div>
                    {customOptions.resetBankAndBranding && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 shrink-0">
                        Đã chọn
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    {t('reset.opt_7_desc', 'Khôi phục thông tin tài khoản VietQR và tiêu đề nhóm mặc định.')}
                  </p>
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Mandatory Confirmation Step Section */}
          <div className="p-4 bg-amber-50/70 dark:bg-amber-950/40 rounded-2xl border border-amber-200/80 dark:border-amber-900/60 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Xác nhận an toàn trước khi thực hiện</span>
            </div>

            {/* Checkbox 1: Mandatory confirmation checkbox */}
            <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none">
              <input
                type="checkbox"
                checked={confirmCheckbox}
                onChange={(e) => {
                  setConfirmCheckbox(e.target.checked);
                  setError('');
                }}
                className="mt-0.5 w-4 h-4 text-amber-600 border-amber-300 rounded-sm focus:ring-amber-500 cursor-pointer"
              />
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px] leading-relaxed">
                {isDemoMode ? (
                  <>Tôi hiểu rõ và xác nhận muốn <strong>nạp lại toàn bộ dữ liệu mẫu thử ban đầu</strong> (hệ thống sẽ thay thế dữ liệu hiện tại bằng dữ liệu mẫu chuẩn).</>
                ) : (
                  <>Tôi hiểu rõ và xác nhận muốn đặt lại <strong>{selectedCount} mục</strong> đã chọn trên hệ thống sổ quỹ (hành động này không thể hoàn tác).</>
                )}
              </span>
            </label>

            {/* Code confirmation if destructive */}
            {isDestructive && (
              <div className="pt-2 border-t border-amber-200/60 dark:border-amber-900/50 space-y-1.5">
                <p className="text-[11px] text-amber-800 dark:text-amber-300">
                  {isDemoMode ? (
                    <>Hành động này sẽ thay thế dữ liệu hiện tại bằng dữ liệu mẫu. Vui lòng gõ chữ <strong className="px-1.5 py-0.5 bg-amber-200/70 dark:bg-amber-900/80 rounded-md font-mono text-rose-700 dark:text-rose-300">RESET</strong> vào ô dưới để xác nhận:</>
                  ) : (
                    <>
                      {t('reset.confirm_danger_desc', 'Bạn đã chọn xóa dữ liệu quan trọng. Vui lòng nhập chữ ')}
                      <strong className="px-1.5 py-0.5 bg-amber-200/70 dark:bg-amber-900/80 rounded-md font-mono text-rose-700 dark:text-rose-300">RESET</strong>
                      {t('reset.confirm_danger_suffix', ' vào ô dưới để xác nhận:')}
                    </>
                  )}
                </p>
                <div className="relative">
                  <input
                    id="reset-confirm-input"
                    type="text"
                    value={confirmText}
                    onChange={(e) => {
                      setConfirmText(e.target.value);
                      setError('');
                    }}
                    placeholder="Gõ RESET để xác nhận..."
                    className="w-full pl-3 pr-10 py-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                  />
                  {isTextConfirmValid && confirmText.trim().length > 0 && (
                    <div className="absolute right-3 top-2.5 text-emerald-600 dark:text-emerald-400 flex items-center">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer - Sticky & Safe Actions */}
        <div className="p-4 sm:p-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 bg-white dark:bg-slate-900 sticky bottom-0 z-10">
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            {isDemoMode
              ? 'Chế độ: Nạp lại bộ dữ liệu mẫu (Demo)'
              : selectedCount === 0
                ? 'Chưa chọn mục nào'
                : `Đã chọn ${selectedCount} mục đặt lại`}
          </span>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {t('common.cancel', 'Hủy bỏ')}
            </button>
            <button
              id="execute-reset-fund-btn"
              type="button"
              onClick={handleExecute}
              disabled={(!isDemoMode && selectedCount === 0) || !confirmCheckbox || (isDestructive && !isTextConfirmValid)}
              className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer ${
                (!isDemoMode && selectedCount === 0) || !confirmCheckbox || (isDestructive && !isTextConfirmValid)
                  ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                  : isDemoMode
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 active:scale-98'
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20 active:scale-98'
              }`}
            >
              {isDemoMode ? <RefreshCw className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
              <span>{isDemoMode ? 'Tiến Hành Nạp Mẫu Thử' : t('reset.execute_btn', 'Thực Hiện Đặt Lại')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
