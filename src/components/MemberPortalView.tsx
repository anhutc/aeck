import React, { useState } from 'react';
import {
  Category,
  ContributionCampaign,
  Fund,
  BankSettings,
  Member,
  Transaction,
  AppBranding,
  GroupNotice,
  MemberViewPermissions,
  TabType,
} from '../types';
import { NoticeBanner } from './NoticeBanner';
import { INITIAL_VIEW_PERMISSIONS } from '../data/initialData';
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
  branding?: AppBranding;
  groupNotice?: GroupNotice;
  viewPermissions?: MemberViewPermissions;
  bankSettings?: BankSettings;
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
  branding,
  groupNotice,
  viewPermissions = INITIAL_VIEW_PERMISSIONS,
  bankSettings,
  onOpenQRModal,
  onOpenPrintModal,
  activeTab: propsActiveTab,
  setActiveTab: propsSetActiveTab,
}) => {
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

  const isNoticeVisible = (groupNotice?.enabled ?? true) && (viewPermissions?.showNotice ?? true);

  return (
    <div id="member-portal-container" className="space-y-4 sm:space-y-5 pb-6">
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
              branding={branding}
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
              bankSettings={bankSettings}
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
