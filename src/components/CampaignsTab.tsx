import React, { useState } from 'react';
import {
  Target,
  Plus,
  QrCode,
  CheckCircle2,
  Copy,
  Check,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Calendar,
  Search,
  CreditCard,
  BellRing,
  ReceiptText,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ContributionCampaign, Fund, Member, AppBranding } from '../types';
import { formatVND, formatDate, copyToClipboard } from '../utils/formatters';
import { CampaignPayModal } from './modals/CampaignPayModal';
import { useTranslation } from '../i18n/LanguageContext';
import { useFeedback } from '../context/FeedbackContext';
import { useTheme } from '../context/ThemeContext';

interface CampaignsTabProps {
  campaigns: ContributionCampaign[];
  funds?: Fund[];
  members: Member[];
  isAdmin?: boolean;
  onOpenCampaignModal?: (editingCamp?: ContributionCampaign) => void;
  onDeleteCampaign?: (id: string) => void;
  onUpdateParticipantPayment?: (campaignId: string, memberId: string, amountPaid: number, paidDate?: string, note?: string) => void;
  onOpenQRModal: (amount?: number, content?: string) => void;
  onOpenPrintDuesModal?: (campaignId?: string) => void;
  branding?: AppBranding;
}

export const CampaignsTab: React.FC<CampaignsTabProps> = ({
  campaigns,
  members,
  isAdmin = true,
  onOpenCampaignModal,
  onDeleteCampaign,
  onUpdateParticipantPayment,
  onOpenQRModal,
  onOpenPrintDuesModal,
  branding,
}) => {
  const { t } = useTranslation();
  const { showConfirm, showToast } = useFeedback();
  const { activePreset, privacyMode, maskAmount } = useTheme();

  const displayVND = (amount: number) => {
    return privacyMode ? maskAmount(amount) : formatVND(amount);
  };

  const [expandedCampId, setExpandedCampId] = useState<string>(campaigns[0]?.id || '');
  
  // Copy state feedback
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copyFeedbackText, setCopyFeedbackText] = useState<string | null>(null);
  const [activeCopyMenuId, setActiveCopyMenuId] = useState<string | null>(null);

  // Search and filter per campaign
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});
  const [filterStatuses, setFilterStatuses] = useState<Record<string, 'all' | 'unpaid' | 'paid' | 'partial'>>({});
  const [sortOptions, setSortOptions] = useState<Record<string, 'paidDate_desc' | 'paidDate_asc' | 'name_asc' | 'unpaid_first'>>({});

  const prefix = branding?.transferSyntaxPrefix?.trim() || 'DONG QUY';

  // Modal for custom payment date & amount
  const [payModalData, setPayModalData] = useState<{
    isOpen: boolean;
    campaign: ContributionCampaign | null;
    member: Member | null;
    participant: any | null;
  }>({
    isOpen: false,
    campaign: null,
    member: null,
    participant: null,
  });

  const memberMap = new Map<string, Member>(members.map(m => [m.id, m]));

  const toggleExpand = (id: string) => {
    setExpandedCampId(expandedCampId === id ? '' : id);
  };

  const handleOpenPayModal = (campaign: ContributionCampaign, memberId: string) => {
    const member = memberMap.get(memberId) || null;
    const participant = campaign.participants.find(p => p.memberId === memberId) || null;
    setPayModalData({
      isOpen: true,
      campaign,
      member,
      participant,
    });
  };

  const handleConfirmModalPayment = (amount: number, paidDate: string, note: string) => {
    if (!payModalData.campaign || !payModalData.member) return;

    onUpdateParticipantPayment(
      payModalData.campaign.id,
      payModalData.member.id,
      amount,
      paidDate,
      note
    );

    if (amount >= (payModalData.participant?.amountRequired || payModalData.campaign.amountPerMember)) {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.8 },
      });
    }

    setPayModalData({
      isOpen: false,
      campaign: null,
      member: null,
      participant: null,
    });
  };

  const handleCancelPaymentStatus = () => {
    if (!payModalData.campaign || !payModalData.member) return;

    onUpdateParticipantPayment(
      payModalData.campaign.id,
      payModalData.member.id,
      0,
      undefined,
      t('campaigns.unpaid_status_label', 'Chưa nộp')
    );
  };

  const showCopyToast = (key: string, message: string) => {
    setCopiedKey(key);
    setCopyFeedbackText(message);
    showToast(message, 'success');
    setTimeout(() => {
      setCopiedKey(null);
      setCopyFeedbackText(null);
    }, 2400);
  };

  // 1. Copy full campaign summary for Zalo/messaging
  const copyCampaignSummary = async (camp: ContributionCampaign) => {
    const collected = camp.participants.reduce((sum, p) => sum + p.amountPaid, 0);
    const paidMembers = camp.participants.filter(p => p.amountPaid >= p.amountRequired);
    const unpaidMembers = camp.participants.filter(p => p.amountPaid < p.amountRequired);

    let text = `📢 ${t('campaigns.copy_announce_prefix', 'THÔNG BÁO THU QUỸ')}: ${camp.title.toUpperCase()}\n`;
    text += `💰 ${t('campaigns.zalo_amount_prefix', 'Mức đóng:')} ${formatVND(camp.amountPerMember)}/người\n`;
    text += `🎯 ${t('campaigns.zalo_progress_prefix', 'Tiến độ:')} ${formatVND(collected)} / ${formatVND(camp.totalTarget)} (${Math.round((collected / (camp.totalTarget || 1)) * 100)}%)\n`;
    text += `📅 ${t('campaigns.zalo_launch_prefix', 'Ngày phát động:')} ${formatDate(camp.launchDate || camp.createdAt)}\n\n`;

    text += `✅ ${t('campaigns.zalo_paid_section', 'ĐÃ NỘP')} (${paidMembers.length}/${camp.participants.length}):\n`;
    if (paidMembers.length > 0) {
      paidMembers.forEach((p, idx) => {
        const m = memberMap.get(p.memberId);
        const dateStr = p.paidDate ? ` (${t('campaigns.member_col_date', 'Ngày')} ${formatDate(p.paidDate)})` : '';
        text += `${idx + 1}. ${m?.name || 'TV'}: ${formatVND(p.amountPaid)}${dateStr}\n`;
      });
    } else {
      text += `${t('campaigns.zalo_no_paid', '(Chưa có thành viên hoàn thành)')}\n`;
    }

    if (unpaidMembers.length > 0) {
      text += `\n⏳ ${t('campaigns.zalo_unpaid_section', 'CHƯA HOÀN THÀNH')} (${unpaidMembers.length} người):\n`;
      unpaidMembers.forEach((p, idx) => {
        const m = memberMap.get(p.memberId);
        const remain = p.amountRequired - p.amountPaid;
        text += `${idx + 1}. ${m?.name || 'TV'}: ${t('campaigns.zalo_remaining_prefix', 'Còn thiếu')} ${formatVND(remain)}\n`;
      });
    }

    text += `\n👉 ${t('campaigns.zalo_syntax_guide', 'Cú pháp chuyển khoản:')}\n${prefix} ${camp.title} [Họ và tên]`;

    const success = await copyToClipboard(text);
    if (success) {
      showCopyToast(camp.id + '_full', t('campaigns.copied_report_toast', 'Đã sao chép báo cáo!'));
    } else {
      showToast(t('common.copy_failed', 'Không thể sao chép, vui lòng thử lại!'), 'error');
    }
    setActiveCopyMenuId(null);
  };

  // 2. Copy unpaid members only for quick reminder
  const copyUnpaidReminder = async (camp: ContributionCampaign) => {
    const unpaidMembers = camp.participants.filter(p => p.amountPaid < p.amountRequired);
    if (unpaidMembers.length === 0) {
      showCopyToast(camp.id + '_unpaid', t('campaigns.all_completed_toast', 'Tất cả thành viên đã hoàn thành!'));
      setActiveCopyMenuId(null);
      return;
    }

    let text = `⏰ ${t('campaigns.copy_remind_prefix', 'NHẮC NỘP QUỸ')}: ${camp.title.toUpperCase()}\n`;
    text += `💰 ${t('campaigns.zalo_amount_prefix', 'Mức đóng:')} ${formatVND(camp.amountPerMember)}/người\n\n`;
    text += `${t('campaigns.zalo_remind_intro', 'Danh sách các thành viên chưa hoàn thành')} (${unpaidMembers.length} người):\n`;
    unpaidMembers.forEach((p, idx) => {
      const m = memberMap.get(p.memberId);
      const remain = p.amountRequired - p.amountPaid;
      text += `${idx + 1}. ${m?.name || 'TV'}: ${t('campaigns.zalo_needed_prefix', 'Cần nộp')} ${formatVND(remain)}\n`;
    });
    text += `\n👉 ${t('transactions.transfer_content', 'Cú pháp CK')}: ${prefix} ${camp.title} [Tên bạn]`;

    const success = await copyToClipboard(text);
    if (success) {
      showCopyToast(camp.id + '_unpaid', `${t('campaigns.copied_unpaid_prefix', 'Đã sao chép danh sách')} ${unpaidMembers.length} ${t('campaigns.copied_unpaid_suffix', 'người chưa nộp!')}`);
    } else {
      showToast(t('common.copy_failed', 'Không thể sao chép, vui lòng thử lại!'), 'error');
    }
    setActiveCopyMenuId(null);
  };

  // 3. Copy transfer syntax for this campaign
  const copyTransferSyntax = async (camp: ContributionCampaign) => {
    const syntax = `${prefix} ${camp.title}`.trim().toUpperCase();
    const success = await copyToClipboard(syntax);
    if (success) {
      showCopyToast(camp.id + '_syntax', `${t('campaigns.copied_syntax_prefix', 'Đã sao chép cú pháp:')} "${syntax}"`);
    } else {
      showToast(t('common.copy_failed', 'Không thể sao chép, vui lòng thử lại!'), 'error');
    }
    setActiveCopyMenuId(null);
  };

  // 4. Copy individual member transfer syntax
  const copyMemberTransferSyntax = async (camp: ContributionCampaign, member: Member) => {
    const syntax = `${prefix} ${camp.title} ${member.name}`.trim().toUpperCase();
    const success = await copyToClipboard(syntax);
    if (success) {
      showCopyToast(`${camp.id}_${member.id}`, `${t('campaigns.copied_member_syntax_prefix', 'Đã sao chép cú pháp cho')} ${member.name}`);
    } else {
      showToast(t('common.copy_failed', 'Không thể sao chép, vui lòng thử lại!'), 'error');
    }
  };

  return (
    <div id="campaigns-tab-content" className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Target className="w-5 h-5" style={{ color: activePreset.primary }} />
            {t('campaigns.title', 'Quản Lý Đợt Thu Quỹ & Chỉ Tiêu Đóng Góp')}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('campaigns.subtitle', 'Ghi nhận nộp đủ với tùy chọn ngày thực tế nộp tiền, tạo mã QR và copy báo cáo')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Nút xuất ảnh thống kê nợ & đóng quỹ (chỉ dành cho Admin) */}
          {isAdmin && onOpenPrintDuesModal && (
            <button
              id="export-campaigns-dues-btn"
              onClick={() => onOpenPrintDuesModal()}
              style={{
                backgroundColor: activePreset.primaryLight,
                color: activePreset.primaryText,
                borderColor: activePreset.primaryBorder,
              }}
              className="px-3.5 py-2.5 rounded-xl border active:scale-95 text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:opacity-90"
              title={t('campaigns.export_dues_btn_title', 'Xuất ảnh danh sách đóng quỹ & nợ quỹ chia sẻ')}
            >
              <ReceiptText className="w-4 h-4" />
              <span className="hidden sm:inline">{t('campaigns.export_dues_btn', 'Xuất ảnh đóng quỹ')}</span>
              <span className="sm:hidden">{t('campaigns.export_dues_btn_short', 'Xuất ảnh')}</span>
            </button>
          )}

          {isAdmin && (
            <button
              id="create-campaign-btn"
              onClick={() => onOpenCampaignModal()}
              style={{ background: activePreset.gradient }}
              className="px-4 py-2.5 rounded-xl active:scale-95 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer group hover:opacity-95"
            >
              <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
              <span>{t('campaigns.btn_add_campaign', 'Tạo đợt thu mới')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Global feedback toast when copying */}
      {copyFeedbackText && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{copyFeedbackText}</span>
        </div>
      )}

      {/* Campaigns List */}
      <div className="space-y-4">
        {campaigns.length > 0 ? (
          [...campaigns]
            .sort((a, b) => new Date(b.launchDate || b.createdAt || '').getTime() - new Date(a.launchDate || a.createdAt || '').getTime())
            .map((camp) => {
            const collected = camp.participants.reduce((sum, p) => sum + p.amountPaid, 0);
            const progress = camp.totalTarget > 0 ? Math.min(100, Math.round((collected / camp.totalTarget) * 100)) : 0;
            const paidMembers = camp.participants.filter(p => p.amountPaid >= p.amountRequired);
            const unpaidMembers = camp.participants.filter(p => p.amountPaid < p.amountRequired);
            const partialMembers = camp.participants.filter(p => p.amountPaid > 0 && p.amountPaid < p.amountRequired);
            const paidCount = paidMembers.length;
            const isExpanded = expandedCampId === camp.id;

            const searchQuery = (searchQueries[camp.id] || '').toLowerCase().trim();
            const currentFilter = filterStatuses[camp.id] || 'all';
            const currentSort = sortOptions[camp.id] || 'paidDate_desc';

            // Filter participants
            const filteredParticipants = camp.participants.filter((p) => {
              const m = memberMap.get(p.memberId);
              const mName = (m?.name || '').toLowerCase();
              const matchesSearch = !searchQuery || mName.includes(searchQuery);

              const isPaid = p.amountPaid >= p.amountRequired;
              const isPartial = p.amountPaid > 0 && p.amountPaid < p.amountRequired;
              const isUnpaid = p.amountPaid === 0;

              let matchesFilter = true;
              if (currentFilter === 'paid') matchesFilter = isPaid;
              else if (currentFilter === 'unpaid') matchesFilter = isUnpaid;
              else if (currentFilter === 'partial') matchesFilter = isPartial;

              return matchesSearch && matchesFilter;
            }).sort((a, b) => {
              const memberA = memberMap.get(a.memberId);
              const memberB = memberMap.get(b.memberId);
              const nameA = memberA?.name || '';
              const nameB = memberB?.name || '';

              if (currentSort === 'paidDate_desc') {
                // Paid with date first (latest first), then unpaid
                const dateA = a.paidDate ? new Date(a.paidDate).getTime() : (a.amountPaid > 0 ? 1 : 0);
                const dateB = b.paidDate ? new Date(b.paidDate).getTime() : (b.amountPaid > 0 ? 1 : 0);
                if (dateA !== dateB) return dateB - dateA;
                return nameA.localeCompare(nameB, 'vi');
              } else if (currentSort === 'paidDate_asc') {
                const dateA = a.paidDate ? new Date(a.paidDate).getTime() : 9999999999999;
                const dateB = b.paidDate ? new Date(b.paidDate).getTime() : 9999999999999;
                if (dateA !== dateB) return dateA - dateB;
                return nameA.localeCompare(nameB, 'vi');
              } else if (currentSort === 'unpaid_first') {
                const isPaidA = a.amountPaid >= a.amountRequired ? 1 : 0;
                const isPaidB = b.amountPaid >= b.amountRequired ? 1 : 0;
                if (isPaidA !== isPaidB) return isPaidA - isPaidB;
                return nameA.localeCompare(nameB, 'vi');
              } else {
                // name_asc
                return nameA.localeCompare(nameB, 'vi');
              }
            });

            const isMenuOpen = activeCopyMenuId === camp.id;

            return (
              <div
                key={camp.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 overflow-hidden"
              >
                {/* Campaign Header Card */}
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex items-start justify-between sm:justify-start gap-2.5 sm:gap-3.5 w-full lg:w-auto">
                      <div className="flex items-start gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                        <div
                          style={{ backgroundColor: activePreset.primaryLight, color: activePreset.primary }}
                          className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-xs"
                        >
                          <Target className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
                            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white break-words">
                              {camp.title}
                            </h3>
                            <span
                              style={{
                                backgroundColor: `${activePreset.primary}12`,
                                color: activePreset.primary,
                                borderColor: `${activePreset.primary}30`,
                              }}
                              className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold flex items-center gap-1 border shrink-0"
                            >
                              <Calendar className="w-3 h-3" style={{ color: activePreset.primary }} />
                              <span>{t('campaigns.launch_date_prefix', 'Phát động')}: {formatDate(camp.launchDate || camp.createdAt)}</span>
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2 sm:line-clamp-none">
                            {camp.description || t('campaigns.no_description', 'Chưa có mô tả')}
                          </p>
                        </div>
                      </div>

                      {/* Header quick action icons on mobile (< sm): Edit, Delete, Collapse/Expand */}
                      <div className="flex items-center gap-1 shrink-0 sm:hidden">
                        {isAdmin && (
                          <button
                            onClick={() => onOpenCampaignModal(camp)}
                            title={t('common.edit', 'Sửa đợt thu')}
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => {
                              showConfirm({
                                title: t('dialog.confirm_delete_title', 'Xác Nhận Xóa Dữ Liệu'),
                                message: `${t('dialog.confirm_delete_campaign', 'Bạn có chắc chắn muốn xóa đợt thu quỹ này? Lịch sử đóng góp của đợt thu sẽ bị xóa.')}\n(${camp.title})`,
                                type: 'danger',
                                confirmText: t('dialog.confirm_delete_btn', 'Đồng Ý Xóa'),
                                cancelText: t('common.cancel', 'Hủy bỏ'),
                                onConfirm: () => {
                                  onDeleteCampaign(camp.id);
                                  showToast(t('common.saved_success', 'Đã xóa đợt thu thành công!'), 'success');
                                },
                              });
                            }}
                            title={t('common.delete', 'Xóa đợt thu')}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all active:scale-95 cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => toggleExpand(camp.id)}
                          title={isExpanded ? t('campaigns.collapse_list', 'Thu gọn danh sách') : t('campaigns.expand_list', 'Mở rộng xem chi tiết từng người')}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 transition-all active:scale-95 cursor-pointer shadow-2xs min-h-[36px]"
                        >
                          <span>{isExpanded ? t('campaigns.collapse_list_short', 'Thu gọn') : t('campaigns.expand_list_short', 'Chi tiết')}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Quick Stats & Action Controls (Full-width 2-column grid on mobile, inline on desktop) */}
                    <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full lg:w-auto shrink-0 pt-1 lg:pt-0">
                      {/* Quick VietQR Button */}
                      <button
                        onClick={() => onOpenQRModal(camp.amountPerMember, `${prefix} ${camp.title}`.trim().toUpperCase())}
                        title={t('campaigns.create_vietqr_tooltip', 'Tạo mã QR chuyển khoản nhanh')}
                        style={{
                          borderColor: `${activePreset.primary}40`,
                          backgroundColor: `${activePreset.primary}10`,
                          color: activePreset.primary,
                        }}
                        className="w-full sm:w-auto px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 hover:opacity-85 hover:shadow-xs active:scale-95 transition-all cursor-pointer min-h-[38px]"
                      >
                        <QrCode className="w-4 h-4 shrink-0" style={{ color: activePreset.primary }} />
                        <span className="truncate">{t('campaigns.qr_code_label', 'Mã QR')} ({displayVND(camp.amountPerMember)})</span>
                      </button>

                      {/* Admin Copy Dropdown Menu vs Member Direct Syntax Copy */}
                      {isAdmin ? (
                        <div className="relative w-full sm:w-auto">
                          <button
                            onClick={() => setActiveCopyMenuId(isMenuOpen ? null : camp.id)}
                            title={t('campaigns.copy_options_tooltip', 'Sao chép danh sách, báo cáo hoặc cú pháp chuyển khoản')}
                            className={`w-full sm:w-auto px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 min-h-[38px] ${
                              copiedKey?.startsWith(camp.id)
                                ? 'border-theme-primary bg-theme-light text-theme-primary'
                                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 hover:border-slate-400'
                            }`}
                          >
                            {copiedKey?.startsWith(camp.id) ? (
                              <Check className="w-3.5 h-3.5 shrink-0" style={{ color: activePreset.primary }} />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            )}
                            <span className="truncate">{copiedKey?.startsWith(camp.id) ? t('campaigns.copied', 'Đã sao chép!') : t('campaigns.copy_dots', 'Sao chép...')}</span>
                            <ChevronDown className={`w-3 h-3 text-slate-400 shrink-0 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                          </button>

                          {/* Dropdown Options */}
                          {isMenuOpen && (
                            <>
                              {/* Backdrop for closing when clicking outside */}
                              <div
                                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-2xs"
                                onClick={() => setActiveCopyMenuId(null)}
                              />

                              {/* Responsive action menu: Clean centered Bottom Sheet on Mobile, Popover on Desktop */}
                              <div className="fixed inset-x-3 bottom-6 z-50 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:bottom-auto sm:mt-1.5 w-auto sm:w-72 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-xl shadow-2xl sm:shadow-xl border border-slate-200 dark:border-slate-700 p-2 sm:p-1.5 animate-in fade-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto">
                                <div className="text-[11px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-500 px-3 sm:px-2.5 py-2 sm:py-1 uppercase tracking-wider flex items-center justify-between border-b border-slate-100 dark:border-slate-800 mb-1">
                                  <span>{t('campaigns.copy_options', 'Tùy chọn sao chép & chia sẻ')}</span>
                                  <button
                                    type="button"
                                    onClick={() => setActiveCopyMenuId(null)}
                                    className="sm:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 py-0.5 rounded text-xs font-bold cursor-pointer"
                                  >
                                    Đóng ✕
                                  </button>
                                </div>

                                <div className="space-y-1">
                                  {/* Cú pháp chuyển khoản */}
                                  <button
                                    onClick={() => copyTransferSyntax(camp)}
                                    className="w-full text-left px-3 py-2.5 sm:py-2 rounded-xl sm:rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer active:scale-98"
                                  >
                                    <div
                                      style={{ backgroundColor: `${activePreset.primary}18`, color: activePreset.primary }}
                                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                    >
                                      <CreditCard className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between">
                                        <span>{t('campaigns.copy_transfer_syntax', 'Cú pháp chuyển khoản')}</span>
                                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">Nhanh nhất</span>
                                      </div>
                                      <div className="text-[11px] text-slate-400 font-mono truncate">{prefix} {camp.title}</div>
                                    </div>
                                  </button>

                                  {/* Báo cáo đầy đủ */}
                                  <button
                                    onClick={() => copyCampaignSummary(camp)}
                                    className="w-full text-left px-3 py-2.5 sm:py-2 rounded-xl sm:rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-purple-950/50 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-2.5 transition-colors cursor-pointer active:scale-98"
                                  >
                                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                                      <Copy className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="font-bold">{t('campaigns.copy_full_report', 'Báo cáo đầy đủ')}</div>
                                      <div className="text-[11px] text-slate-400">{t('campaigns.copy_full_report_desc', 'Gồm tiến độ, đã nộp & chưa nộp')}</div>
                                    </div>
                                  </button>

                                  {/* Danh sách nhắc nộp */}
                                  <button
                                    onClick={() => copyUnpaidReminder(camp)}
                                    className="w-full text-left px-3 py-2.5 sm:py-2 rounded-xl sm:rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-950/50 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-2.5 transition-colors cursor-pointer active:scale-98"
                                  >
                                    <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                                      <BellRing className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="font-bold flex items-center justify-between">
                                        <span>{t('campaigns.copy_unpaid_list', 'Danh sách nhắc nộp')}</span>
                                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">({unpaidMembers.length})</span>
                                      </div>
                                      <div className="text-[11px] text-slate-400">{t('campaigns.copy_unpaid_list_desc', 'Chỉ người chưa hoàn thành')}</div>
                                    </div>
                                  </button>

                                  {/* Xuất ảnh đóng quỹ đợt này */}
                                  {onOpenPrintDuesModal && (
                                    <button
                                      onClick={() => {
                                        setActiveCopyMenuId(null);
                                        onOpenPrintDuesModal(camp.id);
                                      }}
                                      className="w-full text-left px-3 py-2.5 sm:py-2 rounded-xl sm:rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer active:scale-98 border-t border-slate-100 dark:border-slate-800 pt-2"
                                    >
                                      <div
                                        style={{ backgroundColor: activePreset.primaryLight, color: activePreset.primary }}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                      >
                                        <ReceiptText className="w-4 h-4" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="font-bold text-slate-800 dark:text-slate-100">{t('campaigns.export_single_campaign_img', 'Xuất ảnh đóng quỹ đợt này')}</div>
                                        <div className="text-[11px] text-slate-400">{t('campaigns.export_single_campaign_img_desc', 'Tạo ảnh danh sách & mã QR VietQR')}</div>
                                      </div>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => copyTransferSyntax(camp)}
                          title={t('campaigns.copy_transfer_syntax_tooltip', 'Sao chép cú pháp nội dung chuyển khoản')}
                          className={`w-full sm:w-auto px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 min-h-[38px] ${
                            copiedKey === camp.id + '_syntax'
                              ? 'border-theme-primary bg-theme-light text-theme-primary'
                              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 hover:border-slate-400'
                          }`}
                        >
                          {copiedKey === camp.id + '_syntax' ? (
                            <Check className="w-3.5 h-3.5 shrink-0" style={{ color: activePreset.primary }} />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          )}
                          <span className="truncate">{copiedKey === camp.id + '_syntax' ? t('campaigns.copied_syntax_badge', 'Đã chép cú pháp!') : t('campaigns.copy_syntax_btn', 'Chép cú pháp')}</span>
                        </button>
                      )}

                      {/* Desktop / Tablet Quick Actions (sm+) */}
                      <div className="hidden sm:flex items-center gap-1">
                        {/* Edit Button */}
                        {isAdmin && (
                          <button
                            onClick={() => onOpenCampaignModal(camp)}
                            title={t('common.edit', 'Sửa đợt thu')}
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete Button */}
                        {isAdmin && (
                          <button
                            onClick={() => {
                              showConfirm({
                                title: t('dialog.confirm_delete_title', 'Xác Nhận Xóa Dữ Liệu'),
                                message: `${t('dialog.confirm_delete_campaign', 'Bạn có chắc chắn muốn xóa đợt thu quỹ này? Lịch sử đóng góp của đợt thu sẽ bị xóa.')}\n(${camp.title})`,
                                type: 'danger',
                                confirmText: t('dialog.confirm_delete_btn', 'Đồng Ý Xóa'),
                                cancelText: t('common.cancel', 'Hủy bỏ'),
                                onConfirm: () => {
                                  onDeleteCampaign(camp.id);
                                  showToast(t('common.saved_success', 'Đã xóa đợt thu thành công!'), 'success');
                                },
                              });
                            }}
                            title={t('common.delete', 'Xóa đợt thu')}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all active:scale-95 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* Toggle Collapse Button */}
                        <button
                          onClick={() => toggleExpand(camp.id)}
                          title={isExpanded ? t('campaigns.collapse_list', 'Thu gọn danh sách') : t('campaigns.expand_list', 'Mở rộng xem chi tiết từng người')}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-2xs min-h-[38px]"
                        >
                          <span>{isExpanded ? t('campaigns.collapse_list_short', 'Thu gọn') : t('campaigns.expand_list_short', 'Chi tiết')}</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Progress Metric Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-3 text-xs text-slate-600 dark:text-slate-400">
                      <div className="truncate">
                        {t('campaigns.collected_label', 'Đã thu')}: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{displayVND(collected)}</strong> / {displayVND(camp.totalTarget)}
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        <span>{t('campaigns.progress_label', 'Tiến độ')}: <strong>{paidCount}/{camp.participants.length} {t('common.members_unit', 'người')}</strong></span>
                        <span className="font-bold" style={{ color: activePreset.primary }}>{progress}%</span>
                      </div>
                    </div>

                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${progress}%`, background: activePreset.gradient }}
                      />
                    </div>

                    {/* Full-width, prominent expand / collapse bar for easy one-tap access on all devices */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(camp.id)}
                      className="w-full mt-2.5 pt-2 pb-0.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer group active:scale-[0.99] min-h-[40px]"
                    >
                      <span>
                        {isExpanded
                          ? t('campaigns.collapse_list', 'Thu gọn danh sách thành viên')
                          : `${t('campaigns.expand_list', 'Xem chi tiết danh sách')} (${paidCount}/${camp.participants.length} ${t('common.members_unit', 'người đã nộp')})`}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Member Checklist & Filtering */}
                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-5 pt-3 bg-slate-50/70 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 space-y-3.5">
                    {/* Header + Search + Status Filter & Sort Bar */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                      <div className="flex items-center flex-wrap gap-1.5">
                        <button
                          onClick={() => setFilterStatuses(prev => ({ ...prev, [camp.id]: 'all' }))}
                          style={currentFilter === 'all' ? { backgroundColor: activePreset.primary } : undefined}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            currentFilter === 'all'
                              ? 'text-white shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          {t('campaigns.filter_all', 'Tất cả')} ({camp.participants.length})
                        </button>
                        <button
                          onClick={() => setFilterStatuses(prev => ({ ...prev, [camp.id]: 'unpaid' }))}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            currentFilter === 'unpaid'
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-700'
                          }`}
                        >
                          {t('campaigns.filter_unpaid', 'Chưa nộp')} ({unpaidMembers.length})
                        </button>
                        <button
                          onClick={() => setFilterStatuses(prev => ({ ...prev, [camp.id]: 'paid' }))}
                          style={currentFilter === 'paid' ? { backgroundColor: activePreset.primary } : undefined}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            currentFilter === 'paid'
                              ? 'text-white shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          {t('campaigns.filter_paid', 'Đã nộp đủ')} ({paidMembers.length})
                        </button>
                        {partialMembers.length > 0 && (
                          <button
                            onClick={() => setFilterStatuses(prev => ({ ...prev, [camp.id]: 'partial' }))}
                            style={currentFilter === 'partial' ? { backgroundColor: activePreset.primary } : undefined}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              currentFilter === 'partial'
                                ? 'text-white shadow-xs'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:opacity-80'
                            }`}
                          >
                            {t('campaigns.filter_partial', 'Đã cọc')} ({partialMembers.length})
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Sort Selector: default by Payment Date */}
                        <div className="flex items-center gap-1.5">
                          <select
                            id={`sort-participants-${camp.id}`}
                            value={currentSort}
                            onChange={(e) => setSortOptions(prev => ({ ...prev, [camp.id]: e.target.value as any }))}
                            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs focus:ring-2 focus:ring-[var(--theme-primary)] focus:outline-hidden cursor-pointer"
                            title={t('campaigns.sort_title', 'Sắp xếp danh sách đóng quỹ')}
                          >
                            <option value="paidDate_desc">{t('campaigns.sort_latest_paid', '📅 Mới nộp gần nhất')}</option>
                            <option value="paidDate_asc">{t('campaigns.sort_oldest_paid', '📅 Ngày nộp cũ nhất')}</option>
                            <option value="unpaid_first">{t('campaigns.sort_unpaid_first', '⚠️ Chưa nộp lên đầu')}</option>
                            <option value="name_asc">{t('campaigns.sort_name_az', '🔤 Tên thành viên (A - Z)')}</option>
                          </select>
                        </div>

                        {/* Member search input inside campaign */}
                        <div className="relative min-w-[180px] sm:w-52">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            placeholder={t('campaigns.search_member_placeholder', 'Tìm tên thành viên...')}
                            value={searchQueries[camp.id] || ''}
                            onChange={(e) => setSearchQueries(prev => ({ ...prev, [camp.id]: e.target.value }))}
                            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-[var(--theme-primary)] focus:outline-hidden"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Member Items Grid */}
                    {filteredParticipants.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {filteredParticipants.map((p) => {
                          const member = memberMap.get(p.memberId);
                          const isPaid = p.amountPaid >= p.amountRequired;
                          const isPartial = p.amountPaid > 0 && p.amountPaid < p.amountRequired;
                          const memberCopiedKey = `${camp.id}_${p.memberId}`;
                          const isMemberCopied = copiedKey === memberCopiedKey;

                          return (
                            <div
                              key={p.memberId}
                              className={`p-3 rounded-xl border transition-all duration-200 flex items-center justify-between gap-2 group/card ${
                                isPaid
                                  ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 hover:border-emerald-300 hover:shadow-xs'
                                  : isPartial
                                  ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 hover:border-amber-300 hover:shadow-xs'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                    {member?.name || t('members.role_member', 'Thành viên')}
                                  </span>

                                  {/* Quick copy syntax button for this specific member */}
                                  {member && (
                                    <button
                                      onClick={() => copyMemberTransferSyntax(camp, member)}
                                      title={`${t('campaigns.copy_member_syntax_tooltip', 'Sao chép cú pháp chuyển khoản cho')} ${member.name}`}
                                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1.5 -m-1 rounded-lg transition-colors cursor-pointer active:scale-95 touch-manipulation"
                                    >
                                      {isMemberCopied ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5 opacity-70 group-hover/card:opacity-100" />
                                      )}
                                    </button>
                                  )}
                                </div>

                                <div className="text-[11px] text-slate-500 mt-0.5 flex items-center flex-wrap gap-1">
                                  {isPaid ? (
                                    <>
                                      <span className="text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                                        <span>{displayVND(p.amountPaid)}</span>
                                      </span>
                                      {p.paidDate && (
                                        <span className="text-[10px] font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 px-1.5 py-0.2 rounded font-mono">
                                          ({formatDate(p.paidDate)})
                                        </span>
                                      )}
                                    </>
                                  ) : isPartial ? (
                                    <>
                                      <span className="text-amber-700 dark:text-amber-300 font-semibold">
                                        {t('campaigns.partial_deposit', 'Đã cọc')} {displayVND(p.amountPaid)} (thiếu {displayVND(p.amountRequired - p.amountPaid)})
                                      </span>
                                      {p.paidDate && (
                                        <span className="text-[10px] font-mono text-slate-500">
                                          ({formatDate(p.paidDate)})
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-slate-400">
                                      {t('campaigns.need_pay', 'Cần nộp:')} <strong className="text-slate-600 dark:text-slate-300">{displayVND(p.amountRequired)}</strong>
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Actions: QR & Pay Toggle */}
                              <div className="shrink-0 flex items-center gap-1.5">
                                {isAdmin ? (
                                  <>
                                    <button
                                      onClick={() => {
                                        const dueAmount = isPaid ? p.amountPaid : Math.max(0, p.amountRequired - p.amountPaid);
                                        const memberName = member?.name || '';
                                        onOpenQRModal(dueAmount, `${prefix} ${camp.title} ${memberName}`.trim().toUpperCase());
                                      }}
                                      title={`${t('campaigns.create_vietqr_for_member', 'Tạo mã VietQR chuyển khoản cho')} ${member?.name || t('members.role_member', 'thành viên')}`}
                                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors active:scale-95 cursor-pointer shadow-2xs"
                                    >
                                      <QrCode className="w-3.5 h-3.5" />
                                    </button>

                                    {isPaid ? (
                                      <button
                                        onClick={() => handleOpenPayModal(camp, p.memberId)}
                                        title={t('campaigns.paid_edit_hint', 'Đã nộp (Nhấn để chỉnh sửa ngày/số tiền hoặc hủy)')}
                                        style={{ backgroundColor: activePreset.primary }}
                                        className="px-2.5 py-1.5 rounded-lg text-white hover:opacity-90 hover:shadow-xs text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                        <span>{t('campaigns.status_paid', 'Đã nộp')}</span>
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleOpenPayModal(camp, p.memberId)}
                                        title={t('campaigns.pay_modal_btn_title', 'Ghi nhận nộp quỹ (chọn ngày & số tiền tùy chỉnh)')}
                                        style={{ background: activePreset.gradient }}
                                        className="px-2.5 py-1.5 rounded-lg text-white text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer whitespace-nowrap shadow-xs hover:opacity-95"
                                      >
                                        <Calendar className="w-3 h-3" />
                                        <span>{t('campaigns.pay_full', 'Nộp đủ')}</span>
                                      </button>
                                    )}
                                  </>
                                ) : (
                                  /* Member Read-Only Mode */
                                  isPaid ? (
                                    <span className="px-2.5 py-1.5 rounded-lg bg-theme-light text-theme-primary text-[11px] font-bold flex items-center gap-1 border border-theme-light">
                                      <Check className="w-3.5 h-3.5" style={{ color: activePreset.primary }} />
                                      <span>{t('campaigns.status_paid', 'Đã nộp')}</span>
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        const dueAmount = Math.max(0, p.amountRequired - p.amountPaid);
                                        const memberName = member?.name || '';
                                        onOpenQRModal(dueAmount, `${prefix} ${camp.title} ${memberName}`.trim().toUpperCase());
                                      }}
                                      title={t('campaigns.scan_vietqr_tooltip', 'Quét mã VietQR để đóng quỹ')}
                                      style={{ background: activePreset.gradient }}
                                      className="px-3 py-1.5 rounded-lg text-white text-[11px] font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap hover:opacity-95"
                                    >
                                      <QrCode className="w-3.5 h-3.5" />
                                      <span>{t('campaigns.pay_fund', 'Nộp quỹ')}</span>
                                    </button>
                                  )
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-white/60 dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-slate-800 text-xs text-slate-500">
                        {t('campaigns.no_matching_members', 'Không tìm thấy thành viên nào phù hợp với bộ lọc.')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Target className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              {t('campaigns.empty', 'Chưa có đợt đóng quỹ nào')}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {t('campaigns.empty_hint', 'Hãy tạo đợt thu đầu tiên để quản lý các khoản hội phí định kỳ hoặc sự kiện')}
            </p>
          </div>
        )}
      </div>

      {/* Pay Modal with Custom Date Picker */}
      {payModalData.isOpen && payModalData.campaign && payModalData.member && (
        <CampaignPayModal
          isOpen={payModalData.isOpen}
          onClose={() => setPayModalData({ isOpen: false, campaign: null, member: null, participant: null })}
          memberName={payModalData.member.name}
          campaignTitle={payModalData.campaign.title}
          campaignLaunchDate={payModalData.campaign.launchDate || payModalData.campaign.createdAt?.slice(0, 10)}
          requiredAmount={payModalData.participant?.amountRequired || payModalData.campaign.amountPerMember}
          initialPaidAmount={payModalData.participant?.amountPaid}
          initialPaidDate={payModalData.participant?.paidDate}
          initialNote={payModalData.participant?.note}
          onConfirmPayment={handleConfirmModalPayment}
          onCancelPayment={handleCancelPaymentStatus}
        />
      )}
    </div>
  );
};
