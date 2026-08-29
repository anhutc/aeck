import React, { useState } from 'react';
import {
  ShieldCheck,
  QrCode,
  Printer,
  Users,
  LayoutDashboard,
  ReceiptText,
  Layers,
  BarChart3,
  Lock
} from 'lucide-react';
import {
  BankSettings,
  Category,
  ContributionCampaign,
  Fund,
  Member,
  Transaction,
  AppBranding,
  GroupNotice,
  MemberViewPermissions,
} from '../types';
import { formatVND } from '../utils/formatters';
import { NoticeBanner } from './NoticeBanner';
import { INITIAL_VIEW_PERMISSIONS } from '../data/initialData';
import { useTranslation } from '../i18n/LanguageContext';
import { OverviewTab } from './OverviewTab';
import { TransactionsTab } from './TransactionsTab';
import { CampaignsTab } from './CampaignsTab';
import { MembersTab } from './MembersTab';
import { ReportsTab } from './ReportsTab';

type MemberSubTab = 'overview' | 'transactions' | 'campaigns' | 'members' | 'reports';

interface MemberPortalViewProps {
  funds: Fund[];
  transactions: Transaction[];
  categories: Category[];
  campaigns: ContributionCampaign[];
  members: Member[];
  bankSettings: BankSettings;
  branding?: AppBranding;
  groupNotice?: GroupNotice;
  viewPermissions?: MemberViewPermissions;
  onOpenQRModal: (amount?: number, content?: string) => void;
  onOpenPrintModal: (fundId?: string) => void;
  onSwitchToAdmin: () => void;
}

export const MemberPortalView: React.FC<MemberPortalViewProps> = ({
  funds,
  transactions,
  categories,
  campaigns,
  members,
  bankSettings,
  branding,
  groupNotice,
  viewPermissions = INITIAL_VIEW_PERMISSIONS,
  onOpenQRModal,
  onOpenPrintModal,
  onSwitchToAdmin,
}) => {
  const { t } = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState<MemberSubTab>('overview');

  const totalBalance = funds.reduce((sum, f) => sum + f.balance, 0);
  const prefix = branding?.transferSyntaxPrefix?.trim() || 'DONG QUY';

  interface SubTabItem {
    id: MemberSubTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
  }

  const subTabs: SubTabItem[] = [
    { id: 'overview', label: t('nav.overview', 'Tổng quan'), icon: LayoutDashboard },
    { id: 'transactions', label: t('nav.transactions', 'Sổ quỹ'), icon: ReceiptText },
    { id: 'campaigns', label: t('nav.campaigns', 'Đợt đóng quỹ'), icon: Layers, count: campaigns.length },
    { id: 'members', label: t('nav.members', 'Thành viên'), icon: Users, count: members.length },
    { id: 'reports', label: t('nav.reports', 'Báo cáo & sao kê'), icon: BarChart3 },
  ];

  const isNoticeVisible = (groupNotice?.enabled ?? true) && (viewPermissions?.showNotice ?? true);

  return (
    <div id="member-portal-container" className="space-y-6 pb-16">
      {/* Top Welcome & Transparency Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-5 sm:p-7 shadow-xl border border-blue-900/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold border border-blue-400/30">
              <Lock className="w-3.5 h-3.5 text-blue-300" />
              <span>Chế độ Thành viên • Chỉ xem minh bạch dữ liệu</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {branding?.appTitle || branding?.portalTitle || t('portal.header_title', 'Sổ Quỹ & Tài Chính Minh Bạch')}
            </h1>
            <p className="text-xs text-blue-100/80 leading-relaxed">
              {branding?.appSubtitle || branding?.portalSubtitle || t('portal.header_subtitle', 'Tất cả số dư, khoản thu, hóa đơn chi tiêu và đợt đóng quỹ được công khai minh bạch 100% theo thời gian thực.')}
            </p>
          </div>

          {/* Quick Balance & Action Card */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20">
            <div>
              <span className="text-[11px] text-blue-200 block font-medium">{t('portal.current_total_fund', 'Tổng tồn quỹ hiện tại')}</span>
              <span className="text-xl font-black text-white">
                {formatVND(totalBalance)}
              </span>
            </div>

            <div className="h-px sm:h-9 sm:w-px bg-white/20 my-0.5 sm:my-0" />

            <div className="flex flex-col sm:flex-row gap-2">
              {viewPermissions.allowQuickQR && (
                <button
                  id="member-open-general-qr-btn"
                  onClick={() => {
                    const appTitle = branding?.appTitle || 'QUY NHOM';
                    onOpenQRModal(undefined, `${prefix} ${appTitle}`.trim().toUpperCase());
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>{t('portal.scan_qr_pay', 'Quét mã nộp quỹ')}</span>
                </button>
              )}

              {viewPermissions.allowPublicPrint && (
                <button
                  id="member-print-statement-btn"
                  onClick={() => onOpenPrintModal()}
                  className="px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>{t('reports.print_statement', 'In sao kê')}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Switch to Admin Mode banner & Treasurer Contact */}
        <div className="mt-5 pt-3.5 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-blue-200 gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            {branding?.treasurerName && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/15 text-white font-medium text-[11px]">
                👤 {t('members.role_treasurer', 'Thủ quỹ')}: <strong>{branding.treasurerName}</strong>
                {branding.treasurerPhone && (
                  <span className="opacity-90">• 📞 {branding.treasurerPhone}</span>
                )}
              </span>
            )}
            <span className="text-[11px] text-blue-200/90">{t('portal.treasurer_question', 'Bạn là Thủ quỹ / Ban quản lý sổ sách?')}</span>
          </div>
          <button
            id="switch-to-admin-mode-btn"
            onClick={onSwitchToAdmin}
            className="inline-flex items-center gap-1.5 text-white font-bold underline hover:text-blue-100 transition-colors shrink-0 cursor-pointer text-xs"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t('nav.switch_to_admin', 'Chuyển sang giao diện Quản trị (Admin)')}</span>
          </button>
        </div>
      </div>

      {/* Group Notice & Operational Rules */}
      {isNoticeVisible && groupNotice && (
        <NoticeBanner
          notice={groupNotice}
          isAdmin={false}
        />
      )}

      {/* Member Sticky Navigation Tabs (Always pinned with smooth backdrop blur when scrolling) */}
      <div className="sticky top-[56px] sm:top-[64px] z-30 -mx-3 sm:mx-0 px-3 sm:px-1.5 py-2 sm:py-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-y sm:border border-slate-200/90 dark:border-slate-800 sm:rounded-2xl shadow-sm sm:shadow-md transition-all">
        <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth touch-pan-x">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`member-subtab-${tab.id}`}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sub-Tab Content Views */}
      {activeSubTab === 'overview' && (
        <OverviewTab
          funds={funds}
          transactions={transactions}
          categories={categories}
          campaigns={campaigns}
          members={members}
          bankSettings={bankSettings}
          isAdmin={false}
          onOpenQRModal={onOpenQRModal}
          onOpenPrintModal={() => onOpenPrintModal()}
          setActiveTab={(tab) => setActiveSubTab(tab as MemberSubTab)}
        />
      )}

      {activeSubTab === 'transactions' && (
        <TransactionsTab
          transactions={transactions}
          funds={funds}
          categories={categories}
          members={members}
          isAdmin={false}
          onOpenPrintModal={onOpenPrintModal}
        />
      )}

      {activeSubTab === 'campaigns' && (
        <CampaignsTab
          campaigns={campaigns}
          funds={funds}
          members={members}
          branding={branding}
          isAdmin={false}
          onOpenQRModal={onOpenQRModal}
        />
      )}

      {activeSubTab === 'members' && (
        <MembersTab
          members={members}
          campaigns={campaigns}
          funds={funds}
          branding={branding}
          isAdmin={false}
          onOpenQRModal={onOpenQRModal}
          onOpenMemberModal={() => {}}
          onDeleteMember={() => {}}
        />
      )}

      {activeSubTab === 'reports' && (
        <ReportsTab
          transactions={transactions}
          funds={funds}
          categories={categories}
          onOpenPrintModal={() => onOpenPrintModal()}
        />
      )}
    </div>
  );
};
