import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  ShieldCheck,
  Smartphone,
  MessageSquare,
  ExternalLink
} from 'lucide-react';
import { BankSettings, ContributionCampaign, Fund, AppBranding } from '../../types';
import { useTranslation } from '../../i18n/LanguageContext';
import { useFeedback } from '../../context/FeedbackContext';
import { generateZaloShareMessage } from '../../utils/shareMessage';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  bankSettings?: BankSettings;
  funds?: Fund[];
  activeCampaigns: ContributionCampaign[];
  branding?: AppBranding;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  isAdmin = false,
  bankSettings,
  activeCampaigns,
  branding,
}) => {
  const { t } = useTranslation();
  const { showToast } = useFeedback();

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  // Toggles for Zalo message components (Admin only)
  const [includeBank, setIncludeBank] = useState<boolean>(branding?.shareMessageIncludeBank !== false);
  const [includeCampaigns, setIncludeCampaigns] = useState<boolean>(branding?.shareMessageIncludeCampaigns !== false);

  // Compute clean URL without ?view=member
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      const pathname = window.location.pathname !== '/' ? window.location.pathname : '';
      setShareUrl(`${origin}${pathname}`);
    }
  }, [isOpen]);

  const appName = branding?.appTitle || t('portal.header_title', 'Sổ Quỹ Tập Thể');

  // Generate message based purely on settings configured in SettingsTab
  const zaloMessage = generateZaloShareMessage({
    appName,
    shareUrl,
    branding,
    bankSettings,
    activeCampaigns,
    includeBank,
    includeCampaigns,
  });

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    showToast('Đã sao chép liên kết sạch!', 'success');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(zaloMessage);
    setCopiedMsg(true);
    showToast('Đã sao chép tin nhắn vào bộ nhớ tạm!', 'success');
    setTimeout(() => setCopiedMsg(false), 3000);
  };

  // Generate QR code for clean sharing URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    shareUrl || 'https://localhost:3000'
  )}&margin=8`;

  return (
    <div
      id="share-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs"
    >
      <div
        id="share-modal-card"
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl flex flex-col max-h-[calc(100vh-2rem)] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {isAdmin ? t('share.modal_title', 'Chia Sẻ Đến Thành Viên') : 'Chia Sẻ Liên Kết'}
              </h2>
              <p className="text-xs text-slate-500">
                {isAdmin
                  ? 'Gửi liên kết trực tiếp hoặc sao chép nhanh mẫu tin nhắn kèm thông tin chuyển khoản'
                  : 'Sao chép liên kết hoặc quét mã QR để truy cập'}
              </p>
            </div>
          </div>
          <button
            id="close-share-modal-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Security & Access Notice */}
          <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 dark:text-blue-200 space-y-0.5">
              <span className="font-bold block">
                {t('share.security_title', 'Chế độ xem cho Thành viên')}
              </span>
              <p className="text-blue-700/90 dark:text-blue-300 leading-relaxed text-[11px]">
                {t('share.security_desc', 'Thành viên truy cập liên kết xem công khai minh bạch số dư, các khoản chi tiêu và tiến độ đóng góp.')}
              </p>
            </div>
          </div>

          {/* Section 1: Clean Share Link & QR Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Clean Link Input & Quick Open */}
            <div className="sm:col-span-2 space-y-2 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('share.member_link_label', 'Liên kết:')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="share-member-url-input"
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 text-xs font-mono select-all focus:outline-hidden"
                  />
                  <button
                    id="copy-member-url-btn"
                    onClick={handleCopyLink}
                    className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-600/20 flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? t('common.copied', 'Đã chép!') : t('common.copy', 'Sao chép')}</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2 text-xs text-slate-500">
                <a
                  href={shareUrl || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Mở liên kết trong tab mới</span>
                </a>
              </div>
            </div>

            {/* QR Code */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-white p-1.5 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-center">
                <img
                  src={qrCodeUrl}
                  alt="QR Link Chia Sẻ"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400 font-semibold">
                <Smartphone className="w-3 h-3 text-blue-600" />
                <span>Quét mở trên ĐT</span>
              </div>
            </div>
          </div>

          {/* Section 2: Zalo Share Message (ONLY FOR ADMIN - Read-only from Settings, no in-popup editing) */}
          {isAdmin && (
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold text-xs">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>Mẫu tin nhắn chia sẻ</span>
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
                        Quản trị
                      </span>
                    </h3>
                  </div>
                </div>

                {/* Inclusion Switches */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <label className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeBank}
                      onChange={(e) => setIncludeBank(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Kèm STK</span>
                  </label>

                  <label className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeCampaigns}
                      onChange={(e) => setIncludeCampaigns(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Kèm đợt thu ({activeCampaigns.length})</span>
                  </label>
                </div>
              </div>

              {/* Message Box (Read-only preview generated from Settings) */}
              <div className="relative">
                <div
                  className="w-full max-h-44 overflow-y-auto p-3 text-xs font-mono leading-relaxed rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 whitespace-pre-wrap select-all"
                >
                  {zaloMessage}
                </div>
              </div>

              {/* Action Bar for Zalo message */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">

                <button
                  id="copy-zalo-message-btn"
                  type="button"
                  onClick={handleCopyMessage}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer ml-auto"
                >
                  {copiedMsg ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Đã sao chép tin nhắn!</span>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4" />
                      <span>Sao chép tin nhắn</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 flex items-center justify-between text-xs text-slate-500">
          <span>Liên kết xem công khai minh bạch 100% dành cho thành viên</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
