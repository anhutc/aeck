import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export type ToastPosition = 'top-center' | 'top-right' | 'top-left' | 'bottom-center' | 'bottom-right';

export interface ToastItem {
  id: string;
  title?: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastCardProps {
  toast: ToastItem;
  onRemove: (id: string) => void;
  position: ToastPosition;
}

const ToastCard: React.FC<ToastCardProps> = ({ toast, onRemove, position }) => {
  const { t } = useTranslation();
  const duration = toast.duration || 3500;
  const [remainingTime, setRemainingTime] = useState(duration);
  const [isPaused, setIsPaused] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const remainingRef = useRef<number>(duration);

  useEffect(() => {
    if (isPaused) return;

    startTimeRef.current = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const newRemaining = Math.max(0, remainingRef.current - elapsed);
      setRemainingTime(newRemaining);

      if (newRemaining <= 0) {
        clearInterval(interval);
        onRemove(toast.id);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isPaused, onRemove, toast.id]);

  const handleMouseEnter = () => {
    setIsPaused(true);
    remainingRef.current = remainingTime;
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
    startTimeRef.current = Date.now();
  };

  // Type-specific styling
  let iconBadgeClass = 'bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800';
  let progressBarClass = 'bg-blue-500';
  let borderAccentClass = 'border-slate-200/90 dark:border-slate-800 shadow-slate-900/10 dark:shadow-black/50';
  let IconComponent = Info;
  let typeLabel = t('toast.type_info', 'Thông tin');

  if (toast.type === 'success') {
    iconBadgeClass = 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800';
    progressBarClass = 'bg-emerald-500';
    borderAccentClass = 'border-emerald-200/90 dark:border-emerald-800/80 shadow-emerald-500/5';
    IconComponent = CheckCircle2;
    typeLabel = t('toast.type_success', 'Thành công');
  } else if (toast.type === 'error') {
    iconBadgeClass = 'bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800';
    progressBarClass = 'bg-rose-500';
    borderAccentClass = 'border-rose-200/90 dark:border-rose-800/80 shadow-rose-500/5';
    IconComponent = AlertCircle;
    typeLabel = t('toast.type_error', 'Lỗi');
  } else if (toast.type === 'warning') {
    iconBadgeClass = 'bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800';
    progressBarClass = 'bg-amber-500';
    borderAccentClass = 'border-amber-200/90 dark:border-amber-800/80 shadow-amber-500/5';
    IconComponent = AlertTriangle;
    typeLabel = t('toast.type_warning', 'Cảnh báo');
  }

  const isBottom = position.startsWith('bottom');
  const initialY = isBottom ? 24 : -24;
  const exitY = isBottom ? 16 : -16;

  const percentLeft = Math.max(0, Math.min(100, (remainingTime / duration) * 100));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: initialY, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: exitY, scale: 0.94, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      drag="y"
      dragConstraints={{ top: -50, bottom: 50 }}
      onDragEnd={(_, info) => {
        if (Math.abs(info.offset.y) > 40 || Math.abs(info.velocity.y) > 300) {
          onRemove(toast.id);
        }
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`pointer-events-auto relative w-full overflow-hidden rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl border ${borderAccentClass} transition-shadow cursor-default select-none`}
    >
      <div className="flex items-start gap-3 p-3.5 sm:p-4">
        {/* Icon Badge */}
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${iconBadgeClass}`}>
          <IconComponent className="w-5 h-5" />
        </div>

        {/* Text Area */}
        <div className="flex-1 min-w-0 pr-1 pt-0.5">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {toast.title || typeLabel}
            </span>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 leading-snug break-words">
            {toast.message}
          </p>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(toast.id);
          }}
          className="w-7 h-7 -mr-1 -mt-1 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          title={t('toast.close_btn', 'Đóng thông báo')}
          aria-label={t('common.close', 'Đóng')}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress countdown bar */}
      <div className="h-0.5 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          className={`h-full transition-all duration-75 ease-linear ${progressBarClass}`}
          style={{ width: `${percentLeft}%` }}
        />
      </div>
    </motion.div>
  );
};

interface ToastContainerProps {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
  position?: ToastPosition;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onRemove,
  position = 'top-center',
}) => {
  if (!toasts || toasts.length === 0) return null;

  // Position class definitions
  let containerClasses = 'fixed z-[9999] pointer-events-none px-3 w-full max-w-[94vw] sm:max-w-md';

  switch (position) {
    case 'top-center':
      containerClasses += ' top-4 sm:top-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2.5';
      break;
    case 'top-right':
      containerClasses += ' top-4 sm:top-5 right-3 sm:right-6 flex flex-col items-end gap-2.5 max-w-[94vw] sm:max-w-sm';
      break;
    case 'top-left':
      containerClasses += ' top-4 sm:top-5 left-3 sm:left-6 flex flex-col items-start gap-2.5 max-w-[94vw] sm:max-w-sm';
      break;
    case 'bottom-center':
      containerClasses += ' bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 flex flex-col-reverse items-center gap-2.5';
      break;
    case 'bottom-right':
      containerClasses += ' bottom-5 sm:bottom-6 right-3 sm:right-6 flex flex-col-reverse items-end gap-2.5 max-w-[94vw] sm:max-w-sm';
      break;
    default:
      containerClasses += ' top-4 sm:top-5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2.5';
  }

  return (
    <div className={containerClasses} id="toast-portal-container">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastCard
            key={toast.id}
            toast={toast}
            onRemove={onRemove}
            position={position}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
