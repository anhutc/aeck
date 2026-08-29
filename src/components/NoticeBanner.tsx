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
      bg: 'bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white',
      border: 'border-blue-900/40 shadow-md',
      text: 'text-blue-100/90',
      titleColor: 'text-white',
      dateColor: 'text-blue-200/70',
      dateStrong: 'text-blue-100',
      iconBg: 'bg-blue-500/20 text-blue-300 border border-blue-400/30 backdrop-blur-xs',
      btnBg: 'bg-white/10 hover:bg-white/20 text-white border-white/20',
      toggleBtn: 'hover:bg-white/10 text-blue-200',
      icon: <ScrollText className="w-4 h-4" />
    },
    warning: {
      bg: 'bg-gradient-to-br from-slate-900 via-amber-950/60 to-slate-900 text-white',
      border: 'border-amber-900/40 shadow-md',
      text: 'text-amber-100/90',
      titleColor: 'text-amber-200',
      dateColor: 'text-amber-200/70',
      dateStrong: 'text-amber-100',
      iconBg: 'bg-amber-500/20 text-amber-300 border border-amber-400/30 backdrop-blur-xs',
      btnBg: 'bg-white/10 hover:bg-white/20 text-white border-white/20',
      toggleBtn: 'hover:bg-white/10 text-amber-200',
      icon: <AlertCircle className="w-4 h-4" />
    },
    success: {
      bg: 'bg-gradient-to-br from-slate-900 via-emerald-950/60 to-slate-900 text-white',
      border: 'border-emerald-900/40 shadow-md',
      text: 'text-emerald-100/90',
      titleColor: 'text-emerald-200',
      dateColor: 'text-emerald-200/70',
      dateStrong: 'text-emerald-100',
      iconBg: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 backdrop-blur-xs',
      btnBg: 'bg-white/10 hover:bg-white/20 text-white border-white/20',
      toggleBtn: 'hover:bg-white/10 text-emerald-200',
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
              <Info className="w-3.5 h-3.5 text-blue-300" />
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
