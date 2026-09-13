import React, { useState } from 'react';
import { 
  ScrollText, 
  AlertCircle, 
  Sparkles, 
  ChevronDown, 
  ChevronUp,
  Calendar,
  Info
} from 'lucide-react';
import { GroupNotice } from '../types';
import { formatDate } from '../utils/formatters';
import { useTranslation } from '../i18n/LanguageContext';
import { useTheme } from '../context/ThemeContext';

interface NoticeBannerProps {
  notice?: GroupNotice;
  isAdmin?: boolean;
  onEditNotice?: () => void;
}

export const NoticeBanner: React.FC<NoticeBannerProps> = ({
  notice,
  isAdmin = false,
  onEditNotice,
}) => {
  const { t } = useTranslation();
  const { activePreset } = useTheme();
  const [isExpanded, setIsExpanded] = useState(true);

  if (!notice || !notice.enabled || !notice.content) {
    return null;
  }

  const isInfo = !notice.type || notice.type === 'info';

  const typeConfig = {
    info: {
      style: {
        background: `linear-gradient(135deg, ${activePreset.primary}12 0%, ${activePreset.primary}05 100%)`,
        borderColor: `${activePreset.primary}35`,
      },
      text: 'text-slate-700 dark:text-slate-200',
      titleColor: 'text-slate-900 dark:text-white font-bold',
      dateColor: 'text-slate-500 dark:text-slate-400',
      dateStrong: 'text-slate-700 dark:text-slate-200',
      iconBgStyle: {
        backgroundColor: activePreset.primary,
      },
      btnBgStyle: {
        backgroundColor: activePreset.primaryLight,
        color: activePreset.primaryText,
        borderColor: activePreset.primaryBorder,
      },
      toggleBtn: 'hover:bg-slate-100/70 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200',
      icon: <ScrollText className="w-4 h-4 text-white" />
    },
    warning: {
      style: undefined,
      className: 'bg-linear-to-r from-amber-50/90 via-orange-50/40 to-amber-50/60 dark:from-amber-950/40 dark:to-amber-900/30 border-amber-200/90 dark:border-amber-800 shadow-2xs',
      text: 'text-slate-700 dark:text-slate-200',
      titleColor: 'text-slate-900 dark:text-white font-bold',
      dateColor: 'text-slate-500 dark:text-slate-400',
      dateStrong: 'text-slate-700 dark:text-slate-200',
      iconBgStyle: { backgroundColor: '#f59e0b' },
      btnBgStyle: undefined,
      btnClass: 'bg-white hover:bg-amber-50 text-amber-800 border-amber-200 shadow-2xs',
      toggleBtn: 'hover:bg-amber-100/70 text-slate-500 hover:text-slate-800',
      icon: <AlertCircle className="w-4 h-4 text-white" />
    },
    success: {
      style: undefined,
      className: 'bg-linear-to-r from-emerald-50/90 via-teal-50/40 to-emerald-50/60 dark:from-emerald-950/40 dark:to-emerald-900/30 border-emerald-200/90 dark:border-emerald-800 shadow-2xs',
      text: 'text-slate-700 dark:text-slate-200',
      titleColor: 'text-slate-900 dark:text-white font-bold',
      dateColor: 'text-slate-500 dark:text-slate-400',
      dateStrong: 'text-slate-700 dark:text-slate-200',
      iconBgStyle: { backgroundColor: '#10b981' },
      btnBgStyle: undefined,
      btnClass: 'bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs',
      toggleBtn: 'hover:bg-emerald-100/70 text-slate-500 hover:text-slate-800',
      icon: <Sparkles className="w-4 h-4 text-white" />
    },
  }[notice.type || 'info'];

  return (
    <section
      id="group-rules-board-banner"
      aria-label={t('overview.rules_banner_aria', 'Thông báo & Quy định hoạt động')}
      style={typeConfig.style}
      className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-xs ${typeConfig.className || ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          <div
            style={typeConfig.iconBgStyle}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
          >
            {typeConfig.icon}
          </div>

          <div className="space-y-1 flex-1 min-w-0">
            {/* Single clean title */}
            <h2 className={`font-bold text-sm sm:text-base tracking-tight ${typeConfig.titleColor}`}>
              {notice.title || t('overview.rules_default_title', 'Nội quy & Quy định hoạt động')}
            </h2>

            {/* Effective date */}
            {notice.updatedAt && (
              <div className={`flex items-center gap-1.5 text-[11px] ${typeConfig.dateColor}`}>
                <Calendar className="w-3.5 h-3.5 opacity-80" />
                <span>{t('overview.applied_from', 'Áp dụng từ:')} <strong className={`font-semibold ${typeConfig.dateStrong}`}>{formatDate(notice.updatedAt)}</strong></span>
              </div>
            )}

            {/* Collapsible Content */}
            {isExpanded && (
              <div className={`text-xs sm:text-sm leading-relaxed whitespace-pre-line ${typeConfig.text} pt-2 font-normal`}>
                {notice.content}
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {isAdmin && onEditNotice && (
            <button
              id="edit-rules-banner-btn"
              onClick={onEditNotice}
              title={t('overview.edit_rules_title', 'Chỉnh sửa nội dung & ngày hiệu lực')}
              style={typeConfig.btnBgStyle}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all shadow-xs cursor-pointer backdrop-blur-xs ${typeConfig.btnClass || ''}`}
            >
              <Info className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('overview.edit_notice_btn', 'Sửa thông báo')}</span>
            </button>
          )}

          <button
            id="toggle-rules-expand-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? t('common.collapse', 'Thu gọn') : t('common.expand', 'Mở rộng')}
            className={`p-1.5 rounded-xl transition-colors cursor-pointer ${typeConfig.toggleBtn}`}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </section>
  );
};
