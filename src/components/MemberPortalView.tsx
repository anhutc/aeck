import React, { useState } from 'react';
import {
  QrCode,
  Users,
  LayoutDashboard,
  ReceiptText,
  Layers,
  LogOut
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
  TabType,
} from '../types';
import { formatVND } from '../utils/formatters';
import { NoticeBanner } from './NoticeBanner';
import { INITIAL_VIEW_PERMISSIONS } from '../data/initialData';
import { useTranslation } from '../i18n/LanguageContext';
import { OverviewTab } from './OverviewTab';
import { TransactionsTab } from './TransactionsTab';
import { CampaignsTab } from './CampaignsTab';
import { MembersTab } from './MembersTab';

export type MemberSubTab = 'overview' | 'transactions' | 'campaigns' | 'members';

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
  onSwitchToAdmin?: () => void;
  onLogout?: () => void;
  activeTab?: TabType;
  setActiveTab?: (tab: TabType) => void;
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
  onLogout,
  activeTab: propsActiveTab,
  setActiveTab: propsSetActiveTab,
}) => {
  const { t } = useTranslation();
  const [internalSubTab, setInternalSubTab] = useState<MemberSubTab>('overview');

  const activeSubTab: MemberSubTab = (propsActiveTab && ['overview', 'transactions', 'campaigns', 'members'].includes(propsActiveTab)
    ? propsActiveTab
    : internalSubTab) as MemberSubTab;

  const handleSelectSubTab = (tab: MemberSubTab) => {
    if (propsSetActiveTab) {
      propsSetActiveTab(tab);
    } else {
      setInternalSubTab(tab);
    }
  };

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
  ];

  const isNoticeVisible = (groupNotice?.enabled ?? true) && (viewPermissions?.showNotice ?? true);

  return (
    <div id="member-portal-container" className="space-y-6 pb-16">
      {/* Top Welcome & Transparency Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-white text-slate-900 p-5 sm:p-6 shadow-xs border border-slate-200">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {branding?.appTitle || branding?.portalTitle || t('portal.header_title', 'Sổ Quỹ & Tài Chính Minh Bạch')}
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed">
              {branding?.appSubtitle || branding?.portalSubtitle || t('portal.header_subtitle', 'Tất cả số dư, khoản thu, hóa đơn chi tiêu và đợt đóng quỹ được công khai minh bạch 100% theo thời gian thực.')}
            </p>
          </div>

          {/* Quick Balance & Action Card */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-[11px] text-slate-500 block font-medium">{t('portal.current_total_fund', 'Tổng tồn quỹ hiện tại')}</span>
              <span className="text-xl font-bold text-slate-900 font-mono">
                {formatVND(totalBalance)}
              </span>
            </div>

            <div className="h-px sm:h-9 sm:w-px bg-slate-200 my-0.5 sm:my-0" />

            <div className="flex flex-col sm:flex-row gap-2">
              {viewPermissions.allowQuickQR && (
                <button
                  id="member-open-general-qr-btn"
                  onClick={() => {
                    const appTitle = branding?.appTitle || 'QUY NHOM';
                    onOpenQRModal(undefined, `${prefix} ${appTitle}`.trim().toUpperCase());
                  }}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <QrCode className="w-4 h-4" />
                  <span>{t('portal.scan_qr_pay', 'Quét mã nộp quỹ')}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Switch to Admin Mode banner & Treasurer Contact */}
        <div className="mt-4 pt-3.5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            {branding?.treasurerName && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-[11px] border border-slate-200">
                👤 {t('members.role_treasurer', 'Thủ quỹ')}: <strong>{branding.treasurerName}</strong>
                {branding.treasurerPhone && (
                  <span className="text-slate-500">• 📞 {branding.treasurerPhone}</span>
                )}
              </span>
            )}
          </div>

          {onLogout && (
            <button
              id="member-portal-logout-btn"
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer self-start sm:self-auto"
              title="Đăng xuất khỏi sổ quỹ"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng xuất</span>
            </button>
          )}
        </div>
      </div>

      {/* Group Notice & Operational Rules */}
      {isNoticeVisible && groupNotice && (
        <NoticeBanner
          notice={groupNotice}
          isAdmin={false}
        />
      )}

      {/* Member Sticky Navigation Tabs (Shown on desktop/tablet, hidden on mobile in favor of bottom dock) */}
      <div className="hidden md:flex sticky top-[56px] sm:top-[64px] z-30 -mx-3 sm:mx-0 px-3 sm:px-1.5 py-2 sm:py-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-y sm:border border-slate-200/90 dark:border-slate-800 sm:rounded-2xl shadow-sm sm:shadow-md transition-all">
        <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth touch-pan-x">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`member-subtab-${tab.id}`}
                onClick={() => handleSelectSubTab(tab.id)}
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
          setActiveTab={(tab) => handleSelectSubTab(tab as MemberSubTab)}
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
    </div>
  );
};
