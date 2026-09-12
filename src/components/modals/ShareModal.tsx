import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  Download,
  Send,
  MessageCircle
} from 'lucide-react';
import { BankSettings, ContributionCampaign, Fund, AppBranding } from '../../types';
import { useTranslation } from '../../i18n/LanguageContext';
import { useFeedback } from '../../context/FeedbackContext';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  bankSettings?: BankSettings;
  funds?: Fund[];
  activeCampaigns?: ContributionCampaign[];
  branding?: AppBranding;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  branding,
}) => {
  const { t } = useTranslation();
  const { showToast } = useFeedback();

  const [copiedLink, setCopiedLink] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  // Compute clean URL without search parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      const pathname = window.location.pathname !== '/' ? window.location.pathname : '';
      setShareUrl(`${origin}${pathname}`);
    }
  }, [isOpen]);

  const appName = branding?.appTitle || t('branding.default_app_title', 'Sổ Quỹ Nhóm');
  const appSubtitle = branding?.appSubtitle || t('branding.default_app_subtitle', 'Hệ thống theo dõi thu chi & đóng quỹ minh bạch');

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      showToast(t('common.copied', 'Đã sao chép liên kết vào bộ nhớ tạm!'), 'success');
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      showToast(t('dialog.alert_error_title', 'Không thể sao chép liên kết'), 'error');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: appName,
          text: `${appName} - ${appSubtitle}`,
          url: shareUrl,
        });
      } catch {
        // User cancelled or share failed, fallback to copy
      }
    } else {
      handleCopyLink();
    }
  };

  // Generate QR code for clean sharing URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    shareUrl || 'https://localhost:3000'
  )}&margin=8`;

  const handleDownloadQr = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `QRCode_${appName.replace(/\s+/g, '_')}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(t('share.download_qr_success', 'Đang tải mã QR về thiết bị...'), 'success');
  };

  return (
    <div
      id="share-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs"
    >
      <div
        id="share-modal-card"
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg flex flex-col max-h-[calc(100vh-2rem)] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {t('share.modal_title', 'Chia Sẻ Đến Thành Viên')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('share.modal_subtitle', 'Chia sẻ liên kết truy cập công khai minh bạch hoặc quét mã QR')}
              </p>
            </div>
          </div>
          <button
            id="close-share-modal-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={t('common.close', 'Đóng')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">

          {/* Section 1: Direct Link */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              {t('share.member_link_label', 'Liên kết xem sổ quỹ trực tiếp:')}
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
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-sm shadow-blue-600/20 flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? t('common.copied', 'Đã chép!') : t('common.copy', 'Sao chép')}</span>
              </button>
            </div>

            {/* Quick Actions Row */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <a
                href={shareUrl || '#'}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-semibold hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>{t('share.open_new_tab', 'Mở trong tab mới')}</span>
              </a>

              <button
                type="button"
                onClick={handleNativeShare}
                className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-blue-600 font-semibold cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-blue-600" />
                <span>{t('share.quick_share', 'Chia sẻ nhanh...')}</span>
              </button>
            </div>
          </div>

          {/* Section 2: Quick Social Share */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              {t('share.quick_share_desc', 'Gửi trực tiếp qua ứng dụng:')}
            </span>
            <div className="grid grid-cols-3 gap-2">
              <a
                href={`https://zalo.me/share?url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100/60 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Zalo</span>
              </a>

              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100/60 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Facebook</span>
              </a>

              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(appName + ' - ' + appSubtitle)}`}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl border border-sky-200 dark:border-sky-800/60 bg-sky-50/50 dark:bg-sky-950/30 hover:bg-sky-100/60 dark:hover:bg-sky-900/40 text-sky-700 dark:text-sky-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4 text-sky-500 shrink-0" />
                <span>Telegram</span>
              </a>
            </div>
          </div>

          {/* Section 3: QR Code Card */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center gap-4">
              <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs shrink-0 flex items-center justify-center">
                <img
                  src={qrCodeUrl}
                  alt="QR Code Sổ Quỹ"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="space-y-2 flex-1 min-w-0">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{t('share.qr_title', 'Quét Mã QR Truy Cập Nhanh')}</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {t('share.qr_guide', 'Dùng Camera điện thoại hoặc ứng dụng Zalo quét mã để mở ngay')}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadQr}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>{t('share.download_qr', 'Tải ảnh QR')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 flex items-center justify-between text-xs text-slate-500">
          <span>{t('share.footer_note', 'Liên kết xem công khai minh bạch 100% dành cho thành viên')}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
          >
            {t('common.close', 'Đóng')}
          </button>
        </div>
      </div>
    </div>
  );
};
