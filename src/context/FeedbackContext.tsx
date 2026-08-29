import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Info, 
  X, 
  HelpCircle,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

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

export interface ToastItem {
  id: string;
  title?: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

interface FeedbackContextValue {
  showConfirm: (options: ConfirmOptions) => void;
  showAlert: (options: AlertOptions | string) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info', title?: string) => void;
}

const FeedbackContext = createContext<FeedbackContextValue | undefined>(undefined);

export const FeedbackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  // Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<ConfirmOptions | null>(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);

  // Alert Dialog State
  const [alertDialog, setAlertDialog] = useState<AlertOptions | null>(null);

  // Toast State
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Show Toast
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success', title?: string) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newToast: ToastItem = {
      id,
      title,
      message,
      type,
      duration: 3500,
    };

    setToasts(prev => [...prev, newToast]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, newToast.duration);
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
  }), [showConfirm, showAlert, showToast]);

  return (
    <FeedbackContext.Provider value={contextValue}>
      {children}

      {/* 1. Toast Notification Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3">
        {toasts.map(toast => {
          let bgColor = 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100';
          let iconColor = 'text-blue-500';
          let IconComp = Info;

          if (toast.type === 'success') {
            bgColor = 'bg-emerald-50 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100';
            iconColor = 'text-emerald-600 dark:text-emerald-400';
            IconComp = CheckCircle2;
          } else if (toast.type === 'error') {
            bgColor = 'bg-rose-50 dark:bg-rose-950/90 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-100';
            iconColor = 'text-rose-600 dark:text-rose-400';
            IconComp = XCircle;
          } else if (toast.type === 'warning') {
            bgColor = 'bg-amber-50 dark:bg-amber-950/90 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100';
            iconColor = 'text-amber-600 dark:text-amber-400';
            IconComp = AlertTriangle;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-2 ${bgColor}`}
            >
              <div className={`p-1 rounded-lg shrink-0 ${iconColor}`}>
                <IconComp className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0 pr-1">
                {toast.title && (
                  <h4 className="text-xs font-bold leading-tight mb-0.5">{toast.title}</h4>
                )}
                <p className="text-xs font-medium leading-relaxed break-words">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* 2. Custom Confirm Popup Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
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
