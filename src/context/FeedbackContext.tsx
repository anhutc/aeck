import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Info, 
  HelpCircle,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { 
  ToastContainer, 
  ToastItem, 
  ToastPosition, 
  ToastType 
} from '../components/common/ToastContainer';

export type DialogType = 'danger' | 'warning' | 'info' | 'success' | 'confirm';

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: DialogType;
  icon?: 'trash' | 'alert' | 'info' | 'check' | 'question';
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export interface AlertOptions {
  title?: string;
  message: string;
  buttonText?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  onClose?: () => void;
}

export type { ToastItem, ToastPosition, ToastType };

interface FeedbackContextValue {
  showConfirm: (options: ConfirmOptions) => void;
  showAlert: (options: AlertOptions | string) => void;
  showToast: (message: string, type?: ToastType, title?: string, duration?: number) => void;
  toastPosition: ToastPosition;
  setToastPosition: (pos: ToastPosition) => void;
}

const FeedbackContext = createContext<FeedbackContextValue | undefined>(undefined);

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  // Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<ConfirmOptions | null>(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  // Alert Dialog State
  const [alertDialog, setAlertDialog] = useState<AlertOptions | null>(null);

  // Toast Position State (Defaults to 'top-center' for optimal visual balance and no overlap on buttons)
  const [toastPosition, setToastPositionState] = useState<ToastPosition>(() => {
    try {
      const saved = localStorage.getItem('app_toast_position');
      if (saved && ['top-center', 'top-right', 'top-left', 'bottom-center', 'bottom-right'].includes(saved)) {
        return saved as ToastPosition;
      }
    } catch {
      // ignore
    }
    return 'top-center';
  });

  const setToastPosition = useCallback((pos: ToastPosition) => {
    setToastPositionState(pos);
    try {
      localStorage.setItem('app_toast_position', pos);
    } catch {
      // ignore
    }
  }, []);

  // Toast State
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Show Toast
  const showToast = useCallback((
    message: string, 
    type: ToastType = 'success', 
    title?: string,
    duration: number = 3500
  ) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newToast: ToastItem = {
      id,
      title,
      message,
      type,
      duration,
    };

    // Keep at most 3 active toasts at once to prevent visual clutter
    setToasts(prev => [...prev.slice(-2), newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Show Confirm Modal
  const showConfirm = useCallback((options: ConfirmOptions) => {
    setConfirmDialog(options);
  }, []);

  // Show Alert Modal
  const showAlert = useCallback((options: AlertOptions | string) => {
    if (typeof options === 'string') {
      setAlertDialog({
        message: options,
        type: 'info',
      });
    } else {
      setAlertDialog(options);
    }
  }, []);

  const handleConfirmAction = async () => {
    if (!confirmDialog) return;
    try {
      setIsConfirmLoading(true);
      await confirmDialog.onConfirm();
      setConfirmDialog(null);
    } catch (error) {
      console.error('Error during confirm action:', error);
    } finally {
      setIsConfirmLoading(false);
    }
  };

  const handleCancelAction = () => {
    if (confirmDialog?.onCancel) {
      confirmDialog.onCancel();
    }
    setConfirmDialog(null);
  };

  const handleCloseAlert = () => {
    if (alertDialog?.onClose) {
      alertDialog.onClose();
    }
    setAlertDialog(null);
  };

  const contextValue = useMemo(() => ({
    showConfirm,
    showAlert,
    showToast,
    toastPosition,
    setToastPosition,
  }), [showConfirm, showAlert, showToast, toastPosition, setToastPosition]);

  return (
    <FeedbackContext.Provider value={contextValue}>
      {children}

      {/* 1. Optimized Toast Notification Container */}
      <ToastContainer
        toasts={toasts}
        onRemove={removeToast}
        position={toastPosition}
      />

      {/* 2. Custom Confirm Popup Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div 
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden p-6 animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                confirmDialog.type === 'danger'
                  ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800'
                  : confirmDialog.type === 'warning'
                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800'
                  : 'bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800'
              }`}>
                {confirmDialog.type === 'danger' ? (
                  <Trash2 className="w-6 h-6" />
                ) : confirmDialog.type === 'warning' ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <HelpCircle className="w-6 h-6" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {confirmDialog.title || (
                    confirmDialog.type === 'danger' 
                      ? t('dialog.confirm_delete_title', 'Xác Nhận Xóa') 
                      : t('dialog.confirm_action_title', 'Xác Nhận Thao Tác')
                  )}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed font-normal">
                  {confirmDialog.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleCancelAction}
                disabled={isConfirmLoading}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                {confirmDialog.cancelText || t('common.cancel', 'Hủy Bỏ')}
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={isConfirmLoading}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-md transition-all cursor-pointer flex items-center gap-2 ${
                  confirmDialog.type === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25 active:scale-98'
                    : confirmDialog.type === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/25 active:scale-98'
                    : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/25 active:scale-98'
                }`}
              >
                {isConfirmLoading && (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {confirmDialog.confirmText || (
                  confirmDialog.type === 'danger' 
                    ? t('dialog.confirm_delete_btn', 'Đồng Ý Xóa') 
                    : t('dialog.confirm_btn', 'Xác Nhận')
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Custom Alert Popup Modal */}
      {alertDialog && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div 
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xl overflow-hidden p-6 animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                alertDialog.type === 'error'
                  ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800'
                  : alertDialog.type === 'success'
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800'
                  : alertDialog.type === 'warning'
                  ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800'
                  : 'bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800'
              }`}>
                {alertDialog.type === 'error' ? (
                  <XCircle className="w-6 h-6" />
                ) : alertDialog.type === 'success' ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : alertDialog.type === 'warning' ? (
                  <AlertCircle className="w-6 h-6" />
                ) : (
                  <Info className="w-6 h-6" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {alertDialog.title || (
                    alertDialog.type === 'error'
                      ? t('dialog.alert_error_title', 'Thông Báo Lỗi')
                      : alertDialog.type === 'success'
                      ? t('dialog.alert_success_title', 'Thành Công')
                      : alertDialog.type === 'warning'
                      ? t('dialog.alert_warning_title', 'Cảnh Báo')
                      : t('dialog.alert_info_title', 'Thông Báo')
                  )}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed font-normal whitespace-pre-line">
                  {alertDialog.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleCloseAlert}
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/25 transition-all cursor-pointer active:scale-98"
              >
                {alertDialog.buttonText || t('dialog.btn_understood', 'Đã Hiểu')}
              </button>
            </div>
          </div>
        </div>
      )}
    </FeedbackContext.Provider>
  );
};

export const useFeedback = (): FeedbackContextValue => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};
