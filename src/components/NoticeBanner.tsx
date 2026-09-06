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
  const [isExpanded, setIsExpanded] = useState(true);

  if (!notice || !notice.enabled || !notice.content) {
    return null;
  }

  const typeConfig = {
    info: {
      bg: 'bg-linear-to-r from-blue-50/90 via-sky-50/50 to-indigo-50/60 text-slate-900',
      border: 'border-blue-200/90 shadow-2xs',
      text: 'text-slate-700',
      titleColor: 'text-slate-900 font-bold',
      dateColor: 'text-slate-500',
      dateStrong: 'text-slate-700',
      iconBg: 'bg-blue-600 text-white shadow-xs',
      btnBg: 'bg-white hover:bg-blue-50 text-blue-700 border-blue-200 shadow-2xs',
      toggleBtn: 'hover:bg-blue-100/70 text-slate-500 hover:text-slate-800',
      icon: <ScrollText className="w-4 h-4" />
    },
    warning: {
      bg: 'bg-linear-to-r from-amber-50/90 via-orange-50/40 to-amber-50/60 text-slate-900',
      border: 'border-amber-200/90 shadow-2xs',
      text: 'text-slate-700',
      titleColor: 'text-slate-900 font-bold',
      dateColor: 'text-slate-500',
      dateStrong: 'text-slate-700',
      iconBg: 'bg-amber-500 text-white shadow-xs',
      btnBg: 'bg-white hover:bg-amber-50 text-amber-800 border-amber-200 shadow-2xs',
      toggleBtn: 'hover:bg-amber-100/70 text-slate-500 hover:text-slate-800',
      icon: <AlertCircle className="w-4 h-4" />
    },
    success: {
      bg: 'bg-linear-to-r from-emerald-50/90 via-teal-50/40 to-emerald-50/60 text-slate-900',
      border: 'border-emerald-200/90 shadow-2xs',
      text: 'text-slate-700',
      titleColor: 'text-slate-900 font-bold',
      dateColor: 'text-slate-500',
      dateStrong: 'text-slate-700',
      iconBg: 'bg-emerald-600 text-white shadow-xs',
      btnBg: 'bg-white hover:bg-emerald-50 text-emerald-800 border-emerald-200 shadow-2xs',
      toggleBtn: 'hover:bg-emerald-100/70 text-slate-500 hover:text-slate-800',
      icon: <Sparkles className="w-4 h-4" />
    },
  }[notice.type || 'info'];

  return (
    <section
      id="group-rules-board-banner"
      aria-label={t('overview.rules_banner_aria', 'Thông báo & Quy định hoạt động')}
      className={`rounded-2xl border p-4 sm:p-5 transition-all ${typeConfig.bg} ${typeConfig.border}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${typeConfig.iconBg}`}>
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
                <Calendar className="w-3 h-3 opacity-80" />
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
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all shadow-xs cursor-pointer backdrop-blur-xs ${typeConfig.btnBg}`}
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
