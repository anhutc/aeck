import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Calendar,
  Edit2,
  Trash2,
  Briefcase,
  Plane,
  ShieldCheck,
  LayoutGrid,
  Table as TableIcon,
  ReceiptText,
  QrCode,
  Copy,
  Check
} from 'lucide-react';
import { AppBranding, ContributionCampaign, Fund, Member } from '../types';
import { formatDate, formatVND, getMemberRoles } from '../utils/formatters';
import { useTranslation } from '../i18n/LanguageContext';
import { useFeedback } from '../context/FeedbackContext';
import { MemberContributionDetailModal } from './modals/MemberContributionDetailModal';

interface MembersTabProps {
  members: Member[];
  campaigns: ContributionCampaign[];
  funds?: Fund[];
  branding?: AppBranding;
  isAdmin?: boolean;
  onOpenMemberModal: (editingMember?: Member) => void;
  onDeleteMember: (id: string) => void;
  onSelectMemberForPortal?: (memberId: string) => void;
  onOpenQRModal?: (amount?: number, content?: string) => void;
  onUpdateParticipantPayment?: (campaignId: string, memberId: string, amountPaid: number, paidDate?: string, note?: string) => void;
  onOpenPrintDuesModal?: (campaignId?: string) => void;
}

export const MembersTab: React.FC<MembersTabProps> = ({
  members,
  campaigns,
  funds = [],
  branding,
  isAdmin = true,
  onOpenMemberModal,
  onDeleteMember,
  onOpenQRModal,
  onUpdateParticipantPayment,
  onOpenPrintDuesModal,
}) => {
  const { t } = useTranslation();
  const { showConfirm, showToast } = useFeedback();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [debtFilter, setDebtFilter] = useState<'all' | 'unpaid' | 'paid_full'>('all');
  const [memberSort, setMemberSort] = useState<'name_asc' | 'joined_desc' | 'joined_asc' | 'debt_desc' | 'paid_desc'>('name_asc');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);

  const prefix = branding?.transferSyntaxPrefix?.trim() || 'DONG QUY';

  // Selected member for detail modal
  const [detailMember, setDetailMember] = useState<Member | null>(null);

  // Extract all unique roles
  const allRoles = useMemo(() => {
    const roleSet = new Set<string>();
    members.forEach((m) => {
      getMemberRoles(m).forEach((r) => roleSet.add(r));
    });
    return Array.from(roleSet);
  }, [members]);

  // Compute contribution statistics for a member
  const computeMemberContributionStats = (member: Member) => {
    if (member.contributionType === 'exempt') {
      return {
        type: 'exempt' as const,
        totalAssigned: 0,
        paidCampaignsCount: 0,
        unpaidCampaignsCount: 0,
        totalRequired: 0,
        totalPaid: 0,
        totalRemaining: 0,
        isAllPaid: true,
        statusText: t('members.exempt_status', 'Miễn đóng quỹ'),
        badgeColor: 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200',
      };
    }

    if (member.contributionType === 'yearly') {
      const required = member.yearlyContributionAmount || 0;
      const paid = member.yearlyPaidAmount || 0;
      const remaining = Math.max(0, required - paid);
      const isPaidFull = paid >= required && required > 0;
      return {
        type: 'yearly' as const,
        totalAssigned: 1,
        paidCampaignsCount: isPaidFull ? 1 : 0,
        unpaidCampaignsCount: isPaidFull ? 0 : 1,
        totalRequired: required,
        totalPaid: paid,
        totalRemaining: remaining,
        isAllPaid: isPaidFull,
        paidDate: member.yearlyPaidDate,
        statusText: isPaidFull ? t('members.yearly_paid_full', 'Đã đóng trọn năm') : t('members.yearly_not_full', 'Chưa nộp đủ theo năm'),
        badgeColor: isPaidFull
          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200'
          : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200',
      };
    }

    // Normal campaign based
    let totalRequired = 0;
    let totalPaid = 0;
    let totalAssigned = 0;
    let paidCampaignsCount = 0;
    let unpaidCampaignsCount = 0;

    campaigns.forEach((camp) => {
      const p = camp.participants.find((part) => part.memberId === member.id);
      if (p) {
        totalAssigned++;
        const req = p.amountRequired !== undefined ? p.amountRequired : ((p as any).amountExpected || camp.amountPerMember || 0);
        const paid = p.amountPaid || 0;
        totalRequired += req;
        totalPaid += paid;
        if (req === 0 || paid >= req) {
          paidCampaignsCount++;
        } else {
          unpaidCampaignsCount++;
        }
      }
    });

    const totalRemaining = Math.max(0, totalRequired - totalPaid);
    const isAllPaid = totalAssigned > 0 && unpaidCampaignsCount === 0;
    const progressPercent = totalRequired > 0
      ? Math.min(100, Math.round((totalPaid / totalRequired) * 100))
      : (isAllPaid ? 100 : 0);

    let statusText = '';
    let badgeColor = '';

    if (totalAssigned === 0) {
      statusText = 'Chưa có đợt đóng';
      badgeColor = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
    } else if (unpaidCampaignsCount === 0) {
      statusText = `Đã nộp đủ (${paidCampaignsCount}/${totalAssigned} đợt)`;
      badgeColor = 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200';
    } else {
      statusText = `Chưa nộp ${unpaidCampaignsCount}/${totalAssigned} đợt`;
      badgeColor = 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200';
    }

    return {
      type: 'campaign' as const,
      totalAssigned,
      paidCampaignsCount,
      unpaidCampaignsCount,
      totalRequired,
      totalPaid,
      totalRemaining,
      progressPercent,
      isAllPaid,
      statusText,
      badgeColor,
    };
  };

  // Filtered members list with multi-criteria sorting
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      // Search by name, phone, or special note
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const nameMatch = m.name.toLowerCase().includes(query);
        const phoneMatch = m.phone ? m.phone.toLowerCase().includes(query) : false;
        const noteMatch = m.specialNote ? m.specialNote.toLowerCase().includes(query) : false;
        if (!nameMatch && !phoneMatch && !noteMatch) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && m.status !== statusFilter) {
        return false;
      }

      // Role filter
      if (roleFilter !== 'all') {
        const memberRoles = getMemberRoles(m);
        if (!memberRoles.includes(roleFilter)) return false;
      }

      // Debt filter
      if (debtFilter !== 'all') {
        const stats = computeMemberContributionStats(m);
        if (debtFilter === 'unpaid' && (stats.isAllPaid || stats.type === 'exempt')) return false;
        if (debtFilter === 'paid_full' && (!stats.isAllPaid || stats.type === 'exempt')) return false;
      }

      return true;
    }).sort((a, b) => {
      if (memberSort === 'name_asc') {
        return a.name.localeCompare(b.name, 'vi');
      } else if (memberSort === 'joined_desc') {
        const dateA = a.joinedDate ? new Date(a.joinedDate).getTime() : 0;
        const dateB = b.joinedDate ? new Date(b.joinedDate).getTime() : 0;
        return dateB - dateA;
      } else if (memberSort === 'joined_asc') {
        const dateA = a.joinedDate ? new Date(a.joinedDate).getTime() : 9999999999999;
        const dateB = b.joinedDate ? new Date(b.joinedDate).getTime() : 9999999999999;
        return dateA - dateB;
      } else if (memberSort === 'debt_desc') {
        const statsA = computeMemberContributionStats(a);
        const statsB = computeMemberContributionStats(b);
        return statsB.totalRemaining - statsA.totalRemaining;
      } else if (memberSort === 'paid_desc') {
        const statsA = computeMemberContributionStats(a);
        const statsB = computeMemberContributionStats(b);
        return statsB.totalPaid - statsA.totalPaid;
      }
      return 0;
    });
  }, [members, campaigns, searchQuery, statusFilter, roleFilter, debtFilter, memberSort]);

  const activeCount = members.filter((m) => m.status === 'active').length;
  const yearlyCount = members.filter((m) => m.contributionType === 'yearly').length;

  const totalMembersDebt = useMemo(() => {
    let sum = 0;
    members.forEach((m) => {
      const stats = computeMemberContributionStats(m);
      sum += stats.totalRemaining;
    });
    return sum;
  }, [members, campaigns]);

  return (
    <div id="members-tab-content" className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            {t('members.title', 'Danh Sách Thành Viên')} ({members.length})
          </h2>
          <p className="text-xs text-slate-500">
            {t('members.subtitle', 'Quản lý thông tin: Họ tên, SĐT, ngày tham gia/ra nhóm, các vai trò kiêm nhiệm và chế độ nộp quỹ')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
              title="Xem dạng thẻ"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
              title="Xem dạng bảng"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Xuất ảnh đóng quỹ & công nợ (chỉ dành cho Admin) */}
          {isAdmin && onOpenPrintDuesModal && (
            <button
              id="export-member-dues-btn"
              onClick={() => onOpenPrintDuesModal()}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all shrink-0 cursor-pointer active:scale-95"
              title="Xuất ảnh danh sách đóng quỹ & công nợ để chia sẻ vào Zalo"
            >
              <ReceiptText className="w-4 h-4" />
              <span className="hidden sm:inline">Xuất ảnh đóng quỹ</span>
              <span className="sm:hidden">Xuất ảnh</span>
            </button>
          )}

          {isAdmin && (
            <button
              id="add-member-btn"
              onClick={() => onOpenMemberModal()}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all shrink-0 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>{t('members.btn_add_member', '+ Thêm Thành Viên')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Stats Ribbon */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        {/* Quick KPI badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-800">
            <span className="text-slate-500 block">{t('members.kpi_total', 'Tổng thành viên:')}</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">{members.length} {t('common.members_unit', 'người')}</span>
          </div>
          <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/60 dark:border-emerald-900/60">
            <span className="text-emerald-700 dark:text-emerald-300 block">{t('members.status_active', 'Đang hoạt động:')}</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{activeCount} {t('common.members_unit', 'người')}</span>
          </div>
          <div
            onClick={() => {
              if (isAdmin && onOpenPrintDuesModal) {
                onOpenPrintDuesModal();
              }
            }}
            className={`p-3 bg-rose-50/60 dark:bg-rose-950/20 rounded-xl border border-rose-200/60 dark:border-rose-900/60 ${isAdmin ? 'cursor-pointer hover:bg-rose-100/60 dark:hover:bg-rose-900/40 transition-colors group' : ''}`}
            title={isAdmin ? "Bấm để xem và xuất ảnh danh sách nợ" : undefined}
          >
            <div className="flex items-center justify-between">
              <span className="text-rose-700 dark:text-rose-300 block">{t('members.total_debt_kpi', 'Tổng quỹ còn thiếu:')}</span>
              {isAdmin && (
                <span className="text-[10px] text-rose-500 underline opacity-0 group-hover:opacity-100 transition-opacity">Xuất ảnh</span>
              )}
            </div>
            <span className="font-bold text-rose-600 dark:text-rose-400 text-sm">{formatVND(totalMembersDebt)}</span>
          </div>
          <div className="p-3 bg-amber-50/60 dark:bg-amber-950/20 rounded-xl border border-amber-200/60 dark:border-amber-900/60">
            <span className="text-amber-700 dark:text-amber-300 block">{t('members.kpi_yearly', 'Đóng theo năm:')}</span>
            <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">{yearlyCount} {t('common.members_unit', 'người')}</span>
          </div>
        </div>

        {/* Filter controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="search-members-input"
              type="text"
              placeholder={t('members.search_placeholder', 'Tìm theo tên, SĐT, ghi chú...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <select
              id="filter-member-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
            >
              <option value="all">-- {t('members.filter_all_status', 'Tất cả trạng thái')} --</option>
              <option value="active">{t('members.status_active', 'Đang hoạt động')}</option>
              <option value="inactive">{t('members.status_inactive', 'Đã rời nhóm / Nghỉ')}</option>
            </select>
          </div>

          <div>
            <select
              id="filter-member-role"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
            >
              <option value="all">-- {t('members.filter_all_roles', 'Tất cả vai trò')} --</option>
              {allRoles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              id="filter-member-debt"
              value={debtFilter}
              onChange={(e) => setDebtFilter(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer"
            >
              <option value="all">-- {t('members.filter_debt_status', 'Tình trạng đóng quỹ')} --</option>
              <option value="unpaid">{t('members.filter_debt_unpaid', '⚠️ Còn thiếu tiền đóng')}</option>
              <option value="paid_full">{t('members.filter_debt_paid', '✅ Đã đóng đủ 100%')}</option>
            </select>
          </div>

          <div>
            <select
              id="sort-members"
              value={memberSort}
              onChange={(e) => setMemberSort(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden cursor-pointer font-medium"
              title="Sắp xếp danh sách thành viên"
            >
              <option value="name_asc">{t('members.sort_name_az', '🔤 Tên (A - Z)')}</option>
              <option value="joined_desc">{t('members.sort_joined_latest', '📅 Mới gia nhập')}</option>
              <option value="joined_asc">{t('members.sort_joined_oldest', '📅 Gia nhập lâu nhất')}</option>
              <option value="debt_desc">{t('members.sort_debt_desc', '⚠️ Còn thiếu nhiều nhất')}</option>
              <option value="paid_desc">{t('members.sort_paid_desc', '💰 Đã nộp nhiều nhất')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Render Members as Cards or Table */}
      {filteredMembers.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400">
          <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-medium">{t('members.empty', 'Không tìm thấy thành viên nào phù hợp')}</p>
          <p className="text-xs mt-1 text-slate-500">{t('members.empty_hint', 'Thử thay đổi bộ lọc tìm kiếm hoặc thêm thành viên mới')}</p>
        </div>
      ) : viewMode === 'cards' ? (
        /* Cards View - Optimized & Highly Structured */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => {
            const roles = getMemberRoles(member);
            const stats = computeMemberContributionStats(member);
            const isInactive = member.status === 'inactive';
            const isCopied = copiedPhoneId === member.id;

            const handleCopyPhone = (e: React.MouseEvent) => {
              e.stopPropagation();
              if (member.phone) {
                navigator.clipboard.writeText(member.phone);
                setCopiedPhoneId(member.id);
                setTimeout(() => setCopiedPhoneId(null), 2000);
              }
            };

            return (
              <div
                key={member.id}
                className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all flex flex-col justify-between space-y-3.5 hover:shadow-md ${
                  isInactive
                    ? 'border-slate-200 dark:border-slate-800 opacity-80 bg-slate-50/50 dark:bg-slate-900/50'
                    : 'border-slate-200/90 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600'
                }`}
              >
                {/* Member Card Top Header */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-base shadow-sm shrink-0">
                        {member.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                            {member.name}
                          </h3>
                          {isInactive ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {t('members.status_inactive', 'Đã nghỉ')}
                            </span>
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title={t('members.status_active', 'Đang hoạt động')} />
                          )}
                        </div>

                        {/* Phone with quick call & copy */}
                        {member.phone ? (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono mt-0.5">
                            <a
                              href={`tel:${member.phone}`}
                              className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              title="Gọi điện"
                            >
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{member.phone}</span>
                            </a>
                            <button
                              onClick={handleCopyPhone}
                              title="Sao chép số điện thoại"
                              className="text-slate-400 hover:text-blue-600 p-0.5 rounded transition-colors cursor-pointer"
                            >
                              {isCopied ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3 opacity-60 hover:opacity-100" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">{t('members.no_phone', 'Chưa có SĐT')}</span>
                        )}
                      </div>
                    </div>

                    {/* Admin Action Menu */}
                    {isAdmin && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => onOpenMemberModal(member)}
                          title={t('common.edit', 'Chỉnh sửa thông tin')}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            showConfirm({
                              title: t('dialog.confirm_delete_title', 'Xác Nhận Xóa Dữ Liệu'),
                              message: `${t('dialog.confirm_delete_member', 'Bạn có chắc chắn muốn xóa thành viên này khỏi danh sách nhóm?')}\n(${member.name})`,
                              type: 'danger',
                              confirmText: t('dialog.confirm_delete_btn', 'Đồng Ý Xóa'),
                              cancelText: t('common.cancel', 'Hủy bỏ'),
                              onConfirm: () => {
                                onDeleteMember(member.id);
                                showToast(t('common.saved_success', 'Đã xóa thành viên thành công!'), 'success');
                              },
                            });
                          }}
                          title={t('common.delete', 'Xóa thành viên')}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Roles Badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {roles.map((r) => (
                      <span
                        key={r}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/60"
                      >
                        <Briefcase className="w-3 h-3 text-blue-500" />
                        {r}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Dates & Special Contribution Mode */}
                <div className="space-y-2 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{t('members.joined_date_label', 'Tham gia')}: <strong className="text-slate-700 dark:text-slate-300 font-mono">{formatDate(member.joinedDate)}</strong></span>
                    </span>
                    {member.leftDate && (
                      <span className="text-rose-500 font-medium">
                        {t('members.left_date_prefix', 'Nghỉ:')} <strong className="font-mono">{formatDate(member.leftDate)}</strong>
                      </span>
                    )}
                  </div>

                  {/* Special mode badge / status */}
                  {member.contributionType === 'yearly' && (
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1">
                          <Plane className="w-3.5 h-3.5 text-amber-600" />
                          {t('members.mode_yearly', 'Đóng theo năm (Công tác)')}
                        </span>
                        <span>{formatVND(member.yearlyContributionAmount || 0)}</span>
                      </div>
                      {member.yearlyPaidDate && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400">
                          {t('members.paid_date_label', 'Đã nộp ngày:')} {formatDate(member.yearlyPaidDate)}
                        </p>
                      )}
                    </div>
                  )}

                  {member.contributionType === 'exempt' && (
                    <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-[11px] text-purple-700 dark:text-purple-300 font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                      <span>{t('members.exempt_badge', 'Thành viên được miễn đóng quỹ')}</span>
                    </div>
                  )}

                  {member.specialNote && (
                    <p className="text-[11px] text-slate-500 italic bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                      "{member.specialNote}"
                    </p>
                  )}
                </div>

                {/* Financial Progress & Debt Status */}
                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${stats.badgeColor}`}>
                      {stats.statusText}
                    </span>

                    {stats.type !== 'exempt' && (
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        {stats.progressPercent}%
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  {stats.type !== 'exempt' && (
                    <div className="space-y-1.5">
                      <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            stats.progressPercent === 100
                              ? 'bg-emerald-500'
                              : stats.progressPercent >= 50
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${stats.progressPercent}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">
                          Đã nộp: <strong className="text-emerald-600 dark:text-emerald-400">{formatVND(stats.totalPaid)}</strong>
                        </span>
                        {stats.totalRemaining > 0 ? (
                          <span className="text-rose-600 dark:text-rose-400 font-bold">
                            Thiếu: {formatVND(stats.totalRemaining)}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">
                            Đủ {formatVND(stats.totalRequired)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Footer: Detail history & Quick VietQR button */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => setDetailMember(member)}
                      className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <ReceiptText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>{t('members.view_history_btn', 'Xem lịch sử đóng quỹ')}</span>
                    </button>

                    {onOpenQRModal && (
                      <button
                        onClick={() => {
                          const dueAmount = stats.totalRemaining > 0 ? stats.totalRemaining : (stats.totalPaid > 0 ? stats.totalPaid : 200000);
                          const syntax = `${prefix} ${member.name}`.trim().toUpperCase();
                          onOpenQRModal(dueAmount, syntax);
                        }}
                        title={`Tạo mã VietQR thu quỹ cho ${member.name}`}
                        className="p-2 rounded-xl border border-purple-200/80 dark:border-slate-700 bg-purple-50/80 dark:bg-slate-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-950/70 hover:border-purple-300 dark:hover:border-purple-600 dark:hover:text-purple-200 transition-colors active:scale-95 cursor-pointer shadow-2xs shrink-0"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div>
          {/* Mobile Card List (< md) */}
          <div className="block md:hidden space-y-3">
            {filteredMembers.map((member) => {
              const roles = getMemberRoles(member);
              const stats = computeMemberContributionStats(member);

              return (
                <div
                  key={member.id}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                        {member.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{member.name}</h4>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span className="font-mono">{member.phone || 'Chưa có SĐT'}</span>
                          {roles.map(r => (
                            <span key={r} className="px-1.5 py-0.2 rounded bg-blue-50 text-blue-700 text-[10px] font-bold">
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${stats.badgeColor} shrink-0`}>
                      {stats.statusText}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Đã đóng</span>
                      <span className="font-mono font-bold text-emerald-600">
                        {formatVND(stats.totalPaid)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Còn thiếu</span>
                      <span className="font-mono font-bold text-rose-600">
                        {formatVND(stats.totalRemaining)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="text-xs text-slate-500">
                      Chế độ: {member.contributionType === 'yearly' ? 'Theo năm' : member.contributionType === 'exempt' ? 'Miễn đóng' : 'Theo đợt'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setDetailMember(member)}
                        title="Xem & cập nhật lịch sử đóng quỹ"
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <ReceiptText className="w-3.5 h-3.5" />
                        <span>Sổ quỹ</span>
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => onOpenMemberModal(member)}
                            title="Chỉnh sửa thông tin"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              showConfirm({
                                title: t('dialog.confirm_delete_title', 'Xác Nhận Xóa Dữ Liệu'),
                                message: `${t('dialog.confirm_delete_member', 'Bạn có chắc chắn muốn xóa thành viên này khỏi danh sách nhóm?')}\n(${member.name})`,
                                type: 'danger',
                                confirmText: t('dialog.confirm_delete_btn', 'Đồng Ý Xóa'),
                                cancelText: t('common.cancel', 'Hủy bỏ'),
                                onConfirm: () => {
                                  onDeleteMember(member.id);
                                  showToast(t('common.saved_success', 'Đã xóa thành viên thành công!'), 'success');
                                },
                              });
                            }}
                            title="Xóa thành viên"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table (hidden on mobile, block on md+) */}
          <div className="hidden md:block overflow-x-auto custom-scrollbar rounded-2xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">{t('members.th_member', 'Thành viên')}</th>
                  <th className="py-3 px-4">{t('members.th_phone', 'Số điện thoại')}</th>
                  <th className="py-3 px-4">{t('members.th_role', 'Vai trò')}</th>
                  <th className="py-3 px-4">{t('members.th_contribution_mode', 'Chế độ đóng')}</th>
                  <th className="py-3 px-4 text-right">{t('members.th_paid', 'Đã đóng')}</th>
                  <th className="py-3 px-4 text-right">{t('members.th_debt', 'Còn thiếu')}</th>
                  <th className="py-3 px-4 text-center">{t('members.th_status', 'Trạng thái')}</th>
                  <th className="py-3 px-4 text-right">{t('members.th_actions', 'Thao tác')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.map((member) => {
                  const roles = getMemberRoles(member);
                  const stats = computeMemberContributionStats(member);

                  return (
                    <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                            {member.name.slice(0, 1).toUpperCase()}
                          </div>
                          <span>{member.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {member.phone || '---'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {roles.map(r => (
                            <span key={r} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700">
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {member.contributionType === 'yearly' && t('members.mode_yearly_short', 'Theo năm')}
                        {member.contributionType === 'exempt' && t('members.mode_exempt_short', 'Miễn đóng')}
                        {(!member.contributionType || member.contributionType === 'campaign') && t('members.mode_campaign_short', 'Theo đợt')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                        {formatVND(stats.totalPaid)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                        {formatVND(stats.totalRemaining)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${stats.badgeColor}`}>
                          {stats.statusText}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setDetailMember(member)}
                            title="Xem & cập nhật lịch sử đóng quỹ"
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 cursor-pointer transition-colors"
                          >
                            <ReceiptText className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => onOpenMemberModal(member)}
                                title="Chỉnh sửa thông tin"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 cursor-pointer transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  showConfirm({
                                    title: t('dialog.confirm_delete_title', 'Xác Nhận Xóa Dữ Liệu'),
                                    message: `${t('dialog.confirm_delete_member', 'Bạn có chắc chắn muốn xóa thành viên này khỏi danh sách nhóm?')}\n(${member.name})`,
                                    type: 'danger',
                                    confirmText: t('dialog.confirm_delete_btn', 'Đồng Ý Xóa'),
                                    cancelText: t('common.cancel', 'Hủy bỏ'),
                                    onConfirm: () => {
                                      onDeleteMember(member.id);
                                      showToast(t('common.saved_success', 'Đã xóa thành viên thành công!'), 'success');
                                    },
                                  });
                                }}
                                title="Xóa thành viên"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 cursor-pointer transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal for Member */}
      {detailMember && (
        <MemberContributionDetailModal
          isOpen={!!detailMember}
          onClose={() => setDetailMember(null)}
          member={detailMember}
          campaigns={campaigns}
          funds={funds}
          branding={branding}
          onOpenQRModal={onOpenQRModal}
          onUpdateParticipantPayment={onUpdateParticipantPayment}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
};
