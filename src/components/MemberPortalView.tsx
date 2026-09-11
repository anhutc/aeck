import React, { useState } from 'react';
import {
  QrCode
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
import { motion, AnimatePresence } from 'motion/react';
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

  const isNoticeVisible = (groupNotice?.enabled ?? true) && (viewPermissions?.showNotice ?? true);

  return (
    <div id="member-portal-container" className="space-y-4 sm:space-y-5 pb-6">
      {/* Top Welcome & Transparency Banner (Displayed on Overview) */}
      {activeSubTab === 'overview' && (
        <div className="relative overflow-hidden rounded-2xl bg-white text-slate-900 p-4 sm:p-5 shadow-xs border border-slate-200">
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
          </div>
        </div>
      )}

      {/* Group Notice & Operational Rules */}
      {isNoticeVisible && groupNotice && (
        <NoticeBanner
          notice={groupNotice}
          isAdmin={false}
        />
      )}

      {/* Sub-Tab Content Views */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
        >
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
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
