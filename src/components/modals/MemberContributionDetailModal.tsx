import React, { useState, useMemo } from 'react';
import {
  X,
  Phone,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Clock,
  QrCode,
  Calendar,
  DollarSign,
  Search,
  ShieldCheck,
  Plane,
  Sparkles
} from 'lucide-react';
import { ContributionCampaign, Member, Fund, AppBranding } from '../../types';
import { formatVND, formatDate, getMemberRoles } from '../../utils/formatters';
import { useTranslation } from '../../i18n/LanguageContext';
import { useFeedback } from '../../context/FeedbackContext';
import { useTheme } from '../../context/ThemeContext';

interface MemberContributionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  campaigns: ContributionCampaign[];
  funds: Fund[];
  branding?: AppBranding;
  onOpenQRModal: (amount?: number, content?: string) => void;
  isAdmin?: boolean;
  onUpdatePayment?: (campaignId: string, memberId: string, amountPaid: number, paidDate?: string, note?: string) => void;
  onUpdateParticipantPayment?: (campaignId: string, memberId: string, amountPaid: number, paidDate?: string, note?: string) => void;
}

export const MemberContributionDetailModal: React.FC<MemberContributionDetailModalProps> = ({
  isOpen,
  onClose,
  member,
  campaigns,
  funds,
  branding,
  onOpenQRModal,
  isAdmin = false,
  onUpdatePayment,
  onUpdateParticipantPayment,
}) => {
  const handlePaymentUpdate = onUpdateParticipantPayment || onUpdatePayment;
  const { t } = useTranslation();
  const { showConfirm, showToast } = useFeedback();
  const { activePreset, privacyMode } = useTheme();
  const [filterStatus, setFilterStatus] = useState<'all' | 'unpaid' | 'paid'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const displayVND = (val: number) => {
    if (privacyMode) return '•••••••• ₫';
    return formatVND(val);
  };

  const fundMap = useMemo(() => new Map(funds.map(f => [f.id, f])), [funds]);

  if (!isOpen || !member) return null;

  const roles = getMemberRoles(member);
  const isYearly = member.contributionType === 'yearly';
  const isExempt = member.contributionType === 'exempt';

  // Compute all campaign participation for this member
  const memberCampaignsData = useMemo(() => {
    return campaigns
      .filter((camp) => camp.participants.some((p) => p.memberId === member.id))
      .map((camp) => {
        const participant = camp.participants.find((p) => p.memberId === member.id)!;
        const required = participant.amountRequired !== undefined ? participant.amountRequired : ((participant as any).amountExpected ?? camp.amountPerMember ?? 0);
        const paid = participant.amountPaid || 0;
        const isPaidInFull = required === 0 ? true : paid >= required;
        const isPartial = paid > 0 && paid < required;
        const remaining = Math.max(0, required - paid);
        const fund = fundMap.get(camp.fundId);

        return {
          campaign: camp,
          participant,
          required,
          paid,
          remaining,
          isPaidInFull,
          isPartial,
          paidDate: participant.paidDate,
          note: participant.note,
          fundName: fund?.name || 'Quỹ chung',
        };
      })
      .sort((a, b) => new Date(b.campaign.launchDate || b.campaign.createdAt).getTime() - new Date(a.campaign.launchDate || a.campaign.createdAt).getTime());
  }, [campaigns, member.id, fundMap]);

  // Overall Statistics for this member
  const totalCampaigns = memberCampaignsData.length;
  const paidCampaignsCount = memberCampaignsData.filter((c) => c.isPaidInFull).length;
  const unpaidCampaignsCount = memberCampaignsData.filter((c) => !c.isPaidInFull).length;
  const totalRequired = isYearly
    ? member.yearlyContributionAmount || 0
    : memberCampaignsData.reduce((sum, c) => sum + c.required, 0);
  const totalPaid = isYearly
    ? member.yearlyPaidAmount || 0
    : memberCampaignsData.reduce((sum, c) => sum + c.paid, 0);
  const totalRemaining = Math.max(0, totalRequired - totalPaid);
  const overallProgress = totalRequired > 0 ? Math.min(100, Math.round((totalPaid / totalRequired) * 100)) : 0;

  // Filtered campaigns
  const filteredCampaigns = memberCampaignsData.filter((item) => {
    if (filterStatus === 'unpaid' && item.isPaidInFull) return false;
    if (filterStatus === 'paid' && !item.isPaidInFull) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = item.campaign.title.toLowerCase().includes(q);
      const matchDesc = item.campaign.description?.toLowerCase().includes(q);
      const matchFund = item.fundName.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchFund) return false;
    }
    return true;
  });

  const prefix = branding?.transferSyntaxPrefix?.trim() || 'DONG QUY';

  const handlePayAllMissing = () => {
    if (totalRemaining <= 0) return;
    const syntax = `${prefix} TAT CA CAC DOT ${member.name}`.trim().toUpperCase();
    onOpenQRModal(totalRemaining, syntax);
  };

  const handlePaySingleCampaign = (item: typeof memberCampaignsData[0]) => {
    const amount = item.remaining > 0 ? item.remaining : item.required;
    const syntax = `${prefix} ${item.campaign.title} ${member.name}`.trim().toUpperCase();
    onOpenQRModal(amount, syntax);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white relative">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
            aria-label={t('members.detail_modal_close', 'Đóng')}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4 pr-10">
            <div
              style={{ background: activePreset.gradient }}
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md shrink-0"
            >
              {member.name.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">{member.name}</h2>
                {member.status === 'inactive' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    {t('members.status_inactive_badge', 'Đã nghỉ / Rời nhóm')}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {t('members.status_active_badge', 'Đang hoạt động')}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                {member.phone && (
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3.5 h-3.5" style={{ color: activePreset.primary }} />
                    {member.phone}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {t('members.joined_label', 'Tham gia:')} {formatDate(member.joinedDate)}
                </span>
              </div>

              {/* Roles */}
              <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                {roles.map((r) => (
                  <span
                    key={r}
                    style={{ backgroundColor: `${activePreset.primary}12`, color: activePreset.primary, borderColor: `${activePreset.primary}25` }}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border"
                  >
                    <Briefcase className="w-3 h-3" style={{ color: activePreset.primary }} />
                    {r}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* Special mode notices if yearly or exempt */}
          {isExempt && (
            <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 text-xs text-purple-800 dark:text-purple-300 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold text-sm block">{t('members.detail_exempt_title', 'Thành viên được miễn đóng quỹ')}</strong>
                <p className="mt-0.5 text-purple-700 dark:text-purple-400">
                  {t('members.detail_exempt_desc', 'Thành viên này được áp dụng chính sách miễn trừ tham gia các đợt đóng quỹ theo quy định nhóm.')}
                </p>
                {member.specialNote && (
                  <p className="mt-1 font-italic bg-purple-100/60 dark:bg-purple-900/60 p-2 rounded-lg">
                    {t('members.detail_special_note', 'Ghi chú:')} "{member.specialNote}"
                  </p>
                )}
              </div>
            </div>
          )}

          {isYearly && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-300 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5 text-sm">
                  <Plane className="w-4 h-4 text-amber-600" />
                  {t('members.detail_yearly_title', 'Chế độ đóng quỹ trọn gói theo năm (Đi công tác)')}
                </span>
                <span className="font-mono font-black text-sm">
                  {displayVND(member.yearlyContributionAmount || 0)}{t('members.detail_yearly_unit', '/năm')}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-amber-200/80 dark:border-amber-900/80">
                <div>
                  <span className="text-amber-700 dark:text-amber-400 block text-[11px]">{t('members.detail_yearly_paid_in_year', 'Đã nộp trong năm:')}</span>
                  <span className="font-bold text-sm text-emerald-700 dark:text-emerald-400">
                    {displayVND(member.yearlyPaidAmount || 0)}
                  </span>
                  {member.yearlyPaidDate && (
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {t('members.detail_yearly_paid_date', 'Ngày nộp:')} {formatDate(member.yearlyPaidDate)}
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-amber-700 dark:text-amber-400 block text-[11px]">{t('members.detail_yearly_status_label', 'Tình trạng:')}</span>
                  <span className={`font-bold text-sm ${totalRemaining === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {totalRemaining === 0 ? t('members.detail_yearly_completed', '✅ Đã hoàn thành cả năm') : `${t('members.detail_yearly_remaining', '⚠️ Còn thiếu:')} ${displayVND(totalRemaining)}`}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Overview KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 block font-medium">{t('members.detail_kpi_campaigns', 'Tổng đợt tham gia')}</span>
              <span className="text-base font-black text-slate-900 dark:text-white mt-0.5 block">
                {totalCampaigns} {t('members.detail_campaign_unit', 'đợt')}
              </span>
            </div>

            <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200/70 dark:border-emerald-900/60">
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block font-medium">{t('members.detail_kpi_paid', 'Tổng tiền đã nộp')}</span>
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                {displayVND(totalPaid)}
              </span>
            </div>

            <div className="p-3.5 bg-rose-50/70 dark:bg-rose-950/30 rounded-2xl border border-rose-200/70 dark:border-rose-900/60">
              <span className="text-[11px] text-rose-700 dark:text-rose-400 block font-medium">{t('members.detail_kpi_missing', 'Số tiền còn thiếu')}</span>
              <span className="text-base font-black text-rose-600 dark:text-rose-400 mt-0.5 block">
                {displayVND(totalRemaining)}
              </span>
            </div>

            <div
              style={{ backgroundColor: `${activePreset.primary}10`, borderColor: `${activePreset.primary}25` }}
              className="p-3.5 rounded-2xl border"
            >
              <span className="text-[11px] block font-medium" style={{ color: activePreset.primary }}>{t('members.detail_kpi_progress', 'Tỷ lệ hoàn thành')}</span>
              <span className="text-base font-black mt-0.5 block" style={{ color: activePreset.primary }}>
                {overallProgress}% ({paidCampaignsCount}/{totalCampaigns})
              </span>
            </div>
          </div>

          {/* Quick 1-Click QR Pay All Missing Button if debt > 0 */}
          {totalRemaining > 0 && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" style={{ color: activePreset.primary }} />
                  {t('members.detail_pay_all_title', 'Thanh toán toàn bộ các khoản còn thiếu')}
                </span>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('members.detail_pay_all_desc', 'Quét 1 mã QR duy nhất để nộp tổng số tiền nợ:')} <strong className="font-bold" style={{ color: activePreset.primary }}>{displayVND(totalRemaining)}</strong>
                </p>
              </div>

              <button
                onClick={handlePayAllMissing}
                style={{ background: activePreset.gradient }}
                className="px-4 py-2.5 rounded-xl text-white text-xs font-bold shadow-md hover:opacity-90 active:scale-95 flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>{t('members.detail_pay_all_btn', 'Quét QR nộp')} {displayVND(totalRemaining)}</span>
              </button>
            </div>
          )}

          {/* Campaigns Breakdown List */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4" style={{ color: activePreset.primary }} />
                {t('members.detail_history_title', 'Lịch sử & chi tiết từng đợt đóng quỹ')} ({memberCampaignsData.length})
              </h3>

              {/* Filter pills */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
                <button
                  onClick={() => setFilterStatus('all')}
                  style={filterStatus === 'all' ? { color: activePreset.primary } : undefined}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    filterStatus === 'all'
                      ? 'bg-white dark:bg-slate-700 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {t('members.detail_filter_all', 'Tất cả')} ({totalCampaigns})
                </button>
                <button
                  onClick={() => setFilterStatus('unpaid')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    filterStatus === 'unpaid'
                      ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {t('members.detail_filter_unpaid', 'Chưa nộp')} ({unpaidCampaignsCount})
                </button>
                <button
                  onClick={() => setFilterStatus('paid')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    filterStatus === 'paid'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {t('members.detail_filter_paid', 'Đã nộp')} ({paidCampaignsCount})
                </button>
              </div>
            </div>

            {/* Search within member campaigns */}
            {totalCampaigns > 4 && (
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder={t('members.detail_search_placeholder', 'Tìm đợt thu theo tên, quỹ hoặc ghi chú...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:outline-hidden"
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = activePreset.primary;
                    e.currentTarget.style.boxShadow = `0 0 0 2px ${activePreset.primary}33`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '';
                    e.currentTarget.style.boxShadow = '';
                  }}
                />
              </div>
            )}

            {/* Campaign Cards List */}
            <div className="space-y-3">
              {filteredCampaigns.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-slate-400 text-xs">
                  {totalCampaigns === 0
                    ? t('members.detail_empty_no_campaigns', 'Thành viên này chưa được phân bổ tham gia đợt đóng quỹ nào.')
                    : t('members.detail_empty_no_results', 'Không tìm thấy đợt đóng quỹ nào phù hợp với bộ lọc.')}
                </div>
              ) : (
                filteredCampaigns.map((item) => {
                  return (
                    <div
                      key={item.campaign.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        item.isPaidInFull
                          ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                          : 'bg-rose-50/20 dark:bg-rose-950/10 border-rose-200/80 dark:border-rose-900/60 shadow-xs'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Campaign Info */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                              {item.campaign.title}
                            </h4>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {item.fundName}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                            <span>
                              {t('members.detail_campaign_launch', 'Phát động:')} <strong className="text-slate-700 dark:text-slate-300">{formatDate(item.campaign.launchDate || item.campaign.createdAt)}</strong>
                            </span>
                            {item.paidDate && (
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                                • {t('members.detail_campaign_paid_date', 'Ngày nộp:')} {formatDate(item.paidDate)}
                              </span>
                            )}
                            {item.note && (
                              <span className="italic text-slate-400">
                                • "{item.note}"
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Amount & Status Badge & Action */}
                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                          <div className="text-right">
                            <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                              {displayVND(item.paid)} / {displayVND(item.required)}
                            </div>
                            <div>
                              {item.isPaidInFull ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  {t('members.detail_paid_full_badge', 'Đã nộp đủ')}
                                </span>
                              ) : item.isPartial ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                                  <Clock className="w-3.5 h-3.5" />
                                  {t('members.detail_remaining_badge', 'Còn thiếu')} {displayVND(item.remaining)}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  {t('members.detail_unpaid_badge', 'Chưa nộp')} ({displayVND(item.required)})
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-1.5">
                            {!item.isPaidInFull && (
                              <button
                                onClick={() => handlePaySingleCampaign(item)}
                                title={t('members.detail_qr_title', 'Quét mã QR nộp đợt này')}
                                style={{ background: activePreset.gradient }}
                                className="p-2 rounded-xl text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1 hover:opacity-90"
                              >
                                <QrCode className="w-4 h-4" />
                                <span className="hidden sm:inline">{t('members.detail_qr_btn', 'Quét QR')}</span>
                              </button>
                            )}

                            {/* Admin fast toggle payment */}
                            {isAdmin && handlePaymentUpdate && (
                              <button
                                onClick={() => {
                                  if (item.isPaidInFull) {
                                    showConfirm({
                                      title: t('dialog.confirm_action_title', 'Xác Nhận Thao Tác'),
                                      message: `${t('members.detail_cancel_pay_confirm_msg', 'Hủy ghi nhận nộp tiền đợt')} "${item.campaign.title}" của ${member.name}?`,
                                      type: 'warning',
                                      confirmText: t('members.detail_cancel_pay_confirm_btn', 'Hủy Ghi Nhận'),
                                      cancelText: t('common.cancel', 'Hủy bỏ'),
                                      onConfirm: () => {
                                        handlePaymentUpdate(item.campaign.id, member.id, 0, undefined, t('campaigns.unpaid_status_label', 'Chưa nộp'));
                                        showToast(t('members.detail_cancel_pay_toast', 'Đã hủy trạng thái nộp tiền'), 'info');
                                      },
                                    });
                                  } else {
                                    const today = new Date().toISOString().slice(0, 10);
                                    handlePaymentUpdate(item.campaign.id, member.id, item.required, today, t('campaigns.paid_full_status_label', 'Đã nộp đủ'));
                                    showToast(t('members.detail_mark_paid_toast', 'Đã ghi nhận nộp đủ thành công!'), 'success');
                                  }
                                }}
                                title={item.isPaidInFull ? t('members.detail_btn_cancel_pay_title', 'Hủy trạng thái đã nộp') : t('members.detail_btn_mark_paid_title', 'Đánh dấu đã nộp đủ')}
                                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                  item.isPaidInFull
                                    ? 'border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 hover:text-rose-600 dark:hover:text-rose-400'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                }`}
                              >
                                {item.isPaidInFull ? t('members.detail_btn_cancel_pay', 'Hủy nộp') : t('members.detail_btn_mark_paid', 'Nộp đủ')}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {isYearly ? t('members.detail_footer_yearly', 'Chế độ đóng theo năm') : `${t('members.detail_total_prefix', 'Tổng:')} ${totalCampaigns} ${t('members.detail_campaign_unit', 'đợt')} • ${t('members.detail_paid_prefix', 'Đã nộp')} ${paidCampaignsCount} ${t('members.detail_campaign_unit', 'đợt')}`}
          </span>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white text-xs font-bold transition-colors cursor-pointer"
          >
            {t('common.close', 'Đóng')}
          </button>
        </div>
      </div>
    </div>
  );
};
