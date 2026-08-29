import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  QrCode,
  Eye,
  ExternalLink,
  ShieldCheck,
  Users,
  Smartphone,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { BankSettings, ContributionCampaign, Fund, AppBranding } from '../../types';
import { formatVND } from '../../utils/formatters';
import { useTranslation } from '../../i18n/LanguageContext';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToMemberView: () => void;
  bankSettings: BankSettings;
  funds: Fund[];
  activeCampaigns: ContributionCampaign[];
  branding?: AppBranding;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  onSwitchToMemberView,
  bankSettings,
  funds,
  activeCampaigns,
  branding,
}) => {
  const { t } = useTranslation();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      // Use clean origin with query param to ensure zero 404 risk on any platform
      setShareUrl(`${origin}/?view=member`);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalBalance = funds.reduce((sum, f) => sum + f.balance, 0);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const appName = branding?.appTitle || t('portal.header_title', 'Sổ Quỹ Tập Thể');

  const getZaloShareMessage = () => {
    const template = branding?.socialShareTemplate;
    if (template && template.trim()) {
      return template
        .replace('{appName}', appName)
        .replace('{shareUrl}', shareUrl);
    }

    let msg = `📢 CỔNG THÔNG TIN ${appName.toUpperCase()} MINH BẠCH\n\n`;
    msg += `Kính gửi các thành viên,\n`;
    msg += `Để đảm bảo tính công khai & minh bạch tài chính, mọi người có thể xem số dư quỹ, sao kê thu chi và tiến độ đóng góp qua link dưới đây:\n\n`;
    msg += `🔗 Link xem trực tuyến: ${shareUrl}\n\n`;
    msg += `✨ Tại đây bạn có thể:\n`;
    msg += `• Xem đợt đóng quỹ & tiến độ hoàn thành\n`;
    msg += `• Quét mã VietQR chuyển khoản đóng quỹ tự động\n`;
    msg += `• Xem chi tiết từng hóa đơn, chứng từ thu chi đã duyệt\n\n`;
    
    if (activeCampaigns.length > 0) {
      msg += `🎯 Đợt thu đang diễn ra:\n`;
      activeCampaigns.forEach((c, idx) => {
        msg += `${idx + 1}. ${c.title} (${formatVND(c.amountPerMember)}/người)\n`;
      });
      msg += `\n`;
    }

    msg += `Trân trọng cảm ơn sự đồng hành của mọi người!`;
    return msg;
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(getZaloShareMessage());
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2500);
  };

  // Generate QR code for sharing URL using Google Chart API or QR server
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    shareUrl
  )}&margin=8`;

  return (
    <div
      id="share-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs"
    >
      <div
        id="share-modal-card"
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl flex flex-col max-h-[calc(100vh-2rem)] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {t('share.modal_title', 'Tạo Link Chia Sẻ Cho Thành Viên')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('share.modal_subtitle', 'Giao diện xem công khai minh bạch (chỉ xem sao kê, tiến độ & quét mã đóng quỹ)')}
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
          {/* Member View Description & Security Notice */}
          <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-start gap-3.5">
            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 dark:text-blue-200 space-y-1">
              <span className="font-bold block">
                {t('share.security_title', 'Chế độ xem an toàn dành riêng cho Thành viên')}
              </span>
              <p className="text-blue-700/90 dark:text-blue-300 leading-relaxed">
                {t('share.security_desc', 'Khi truy cập liên kết này, thành viên không thể sửa, xóa hay thay đổi số dư sổ quỹ. Họ có thể xem tiến độ đóng quỹ, sao kê minh bạch và quét mã VietQR để nộp tiền trực tiếp.')}
              </p>
            </div>
          </div>

          {/* Share Link Input Box */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              {t('share.member_link_label', 'Liên kết công khai (Member Link)')}
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
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-600/20 flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
              >
                {copiedLink ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? t('common.copied', 'Đã chép!') : t('common.copy', 'Sao chép')}</span>
              </button>
            </div>
          </div>

          {/* QR Code & Preview Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* QR Code for Mobile scanning */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex flex-col items-center justify-center text-center">
              <div className="w-36 h-36 bg-white p-2 rounded-xl border border-slate-200 shadow-xs flex items-center justify-center">
                <img
                  src={qrCodeUrl}
                  alt="QR Link Chia Sẻ"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 font-semibold">
                <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                <span>{t('share.scan_phone', 'Quét mã mở trên điện thoại')}</span>
              </div>
            </div>

            {/* Quick Actions & Live Preview Switch */}
            <div className="flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  {t('share.quick_actions_label', 'Hành động nhanh')}
                </span>
                
                <button
                  id="copy-zalo-message-btn"
                  onClick={handleCopyMessage}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-2.5 transition-all text-left shadow-2xs cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="block font-bold">
                      {copiedMsg ? t('share.copied_msg', 'Đã sao chép tin nhắn!') : t('share.copy_msg_btn', 'Sao chép tin nhắn Zalo / Nhóm')}
                    </span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      {t('share.copy_msg_desc', 'Soạn sẵn nội dung thông báo kèm link')}
                    </span>
                  </div>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/60 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-900 dark:text-purple-200">
                  <Eye className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>{t('share.preview_member_box_title', 'Trải nghiệm góc nhìn thành viên')}</span>
                </div>
                <button
                  id="preview-member-view-btn"
                  onClick={() => {
                    onClose();
                    onSwitchToMemberView();
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{t('share.preview_member_btn', 'Xem thử giao diện Thành viên')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
