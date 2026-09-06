import React, { useState, useEffect, useRef } from 'react';
import {
  BankSettings,
  Category,
  ContributionCampaign,
  Fund,
  Member,
  TabType,
  Transaction,
  TransactionType,
  GroupNotice,
  AppBranding,
  ResetCustomOptions,
  MemberViewPermissions,
  AuthRole
} from './types';
import {
  INITIAL_BANK_SETTINGS,
  INITIAL_CATEGORIES,
  INITIAL_CAMPAIGNS,
  INITIAL_FUNDS,
  INITIAL_MEMBERS,
  INITIAL_TRANSACTIONS,
  DEFAULT_ADMIN_PASSWORD,
  DEFAULT_MEMBER_PASSWORD,
  INITIAL_GROUP_NOTICE,
  INITIAL_BRANDING,
  INITIAL_VIEW_PERMISSIONS
} from './data/initialData';
import { Navbar } from './components/Navbar';
import { LoginScreen } from './components/LoginScreen';
import { OverviewTab } from './components/OverviewTab';
import { TransactionsTab } from './components/TransactionsTab';
import { CampaignsTab } from './components/CampaignsTab';
import { MembersTab } from './components/MembersTab';
import { ReportsTab } from './components/ReportsTab';
import { SettingsTab } from './components/SettingsTab';
import { NoticeBanner } from './components/NoticeBanner';
import { TransactionModal } from './components/modals/TransactionModal';
import { CampaignModal } from './components/modals/CampaignModal';
import { MemberModal } from './components/modals/MemberModal';
import { VietQRModal } from './components/modals/VietQRModal';
import { PrintStatementModal } from './components/modals/PrintStatementModal';
import { ShareModal } from './components/modals/ShareModal';
import { AdminAuthModal } from './components/modals/AdminAuthModal';
import { ResetFundModal } from './components/modals/ResetFundModal';
import { NoticeEditModal } from './components/modals/NoticeEditModal';
import { MemberPortalView } from './components/MemberPortalView';
import { subscribeToCloudState, saveCloudState, fetchCloudStateOnce, testCloudConnection, CloudConnectionResult, CLOUD_CONFIG_INFO } from './lib/cloudStore';
import { useFeedback } from './context/FeedbackContext';

const STORAGE_KEYS = {
  FUNDS: 'quanlyquy_funds_v2',
  TRANSACTIONS: 'quanlyquy_transactions_v2',
  CATEGORIES: 'quanlyquy_categories_v2',
  CAMPAIGNS: 'quanlyquy_campaigns_v2',
  MEMBERS: 'quanlyquy_members_v2',
  BANK: 'quanlyquy_bank_v2',
  NOTICE: 'quanlyquy_notice_v2',
  BRANDING: 'quanlyquy_branding_v2',
  ADMIN_PASS: 'quanlyquy_admin_pass_v2',
  MEMBER_PASS: 'quanlyquy_member_pass_v2',
  AUTH_ROLE: 'quanlyquy_auth_role_v2',
  VIEW_PERMISSIONS: 'quanlyquy_view_permissions_v2',
};

function deduplicateById<T extends { id: string }>(items: T[]): T[] {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item || typeof item.id !== 'string') return false;
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export default function App() {
  const { showToast, showConfirm } = useFeedback();

  // User Authentication State (dual-password: 'member' or 'admin')
  const [currentUserRole, setCurrentUserRole] = useState<AuthRole | null>(() => {
    const saved = sessionStorage.getItem(STORAGE_KEYS.AUTH_ROLE) || localStorage.getItem(STORAGE_KEYS.AUTH_ROLE);
    if (saved === 'admin' || saved === 'member') {
      return saved as AuthRole;
    }
    return null;
  });

  // Always default to Member View on initial load or if role is member
  const [isMemberView, setIsMemberView] = useState<boolean>(() => {
    const saved = sessionStorage.getItem(STORAGE_KEYS.AUTH_ROLE) || localStorage.getItem(STORAGE_KEYS.AUTH_ROLE);
    return saved !== 'admin';
  });

  // Admin Password
  const [adminPassword, setAdminPassword] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_PASS);
    return saved || DEFAULT_ADMIN_PASSWORD;
  });

  // Member Password
  const [memberPassword, setMemberPassword] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MEMBER_PASS);
    return saved || DEFAULT_MEMBER_PASSWORD;
  });

  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState(false);
  const [isResetFundModalOpen, setIsResetFundModalOpen] = useState(false);

  // App Title / Branding Personalization State
  const [branding, setBranding] = useState<AppBranding>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BRANDING);
    return saved ? JSON.parse(saved) : INITIAL_BRANDING;
  });

  // Navigation State
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Core Data States with LocalStorage Initialization
  const [funds, setFunds] = useState<Fund[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FUNDS);
    return saved ? deduplicateById(JSON.parse(saved)) : INITIAL_FUNDS;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return saved ? deduplicateById(JSON.parse(saved)) : INITIAL_TRANSACTIONS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return saved ? deduplicateById(JSON.parse(saved)) : INITIAL_CATEGORIES;
  });

  const [campaigns, setCampaigns] = useState<ContributionCampaign[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CAMPAIGNS);
    return saved ? deduplicateById(JSON.parse(saved)) : INITIAL_CAMPAIGNS;
  });

  const [members, setMembers] = useState<Member[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    return saved ? deduplicateById(JSON.parse(saved)) : INITIAL_MEMBERS;
  });

  const [bankSettings, setBankSettings] = useState<BankSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BANK);
    return saved ? JSON.parse(saved) : INITIAL_BANK_SETTINGS;
  });

  const [groupNotice, setGroupNotice] = useState<GroupNotice>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTICE);
    return saved ? JSON.parse(saved) : INITIAL_GROUP_NOTICE;
  });

  const [viewPermissions, setViewPermissions] = useState<MemberViewPermissions>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.VIEW_PERMISSIONS);
    return saved ? JSON.parse(saved) : INITIAL_VIEW_PERMISSIONS;
  });

  const [isNoticeEditModalOpen, setIsNoticeEditModalOpen] = useState(false);

  // Check URL parameters on mount: if user navigated with ?view=admin, prompt password modal!
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const wantsAdmin = params.get('view') === 'admin' || params.get('mode') === 'admin';
      if (wantsAdmin) {
        setIsAdminAuthModalOpen(true);
      }
    }
  }, []);

  // Cloud connection & synchronization status
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'connected' | 'connecting' | 'error' | 'syncing'>('connecting');
  const [lastCloudSyncTime, setLastCloudSyncTime] = useState<string | null>(null);
  const [cloudLatency, setCloudLatency] = useState<number | null>(null);
  const isSyncingFromCloud = useRef(false);
  const hasInitializedCloud = useRef(false);

  // Realtime Cloud Firestore sync
  useEffect(() => {
    const unsubscribe = subscribeToCloudState((cloudData, exists) => {
      isSyncingFromCloud.current = true;
      const now = new Date();
      setLastCloudSyncTime(now.toLocaleTimeString('vi-VN') + ' ' + now.toLocaleDateString('vi-VN'));

      if (exists && cloudData) {
        if (cloudData.funds) {
          const cleanFunds = deduplicateById(cloudData.funds);
          setFunds(cleanFunds);
          localStorage.setItem(STORAGE_KEYS.FUNDS, JSON.stringify(cleanFunds));
        }
        if (cloudData.transactions) {
          const cleanTx = deduplicateById(cloudData.transactions);
          setTransactions(cleanTx);
          localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(cleanTx));
        }
        if (cloudData.categories) {
          const cleanCats = deduplicateById(cloudData.categories);
          setCategories(cleanCats);
          localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(cleanCats));
        }
        if (cloudData.campaigns) {
          const cleanCamps = deduplicateById(cloudData.campaigns);
          setCampaigns(cleanCamps);
          localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(cleanCamps));
        }
        if (cloudData.members) {
          const cleanMembers = deduplicateById(cloudData.members);
          setMembers(cleanMembers);
          localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(cleanMembers));
        }
        if (cloudData.bankSettings) {
          setBankSettings(cloudData.bankSettings);
          localStorage.setItem(STORAGE_KEYS.BANK, JSON.stringify(cloudData.bankSettings));
        }
        if (cloudData.groupNotice) {
          setGroupNotice(cloudData.groupNotice);
          localStorage.setItem(STORAGE_KEYS.NOTICE, JSON.stringify(cloudData.groupNotice));
        }
        if (cloudData.viewPermissions) {
          setViewPermissions(cloudData.viewPermissions);
          localStorage.setItem(STORAGE_KEYS.VIEW_PERMISSIONS, JSON.stringify(cloudData.viewPermissions));
        }
        if (cloudData.branding) {
          setBranding(cloudData.branding);
          localStorage.setItem(STORAGE_KEYS.BRANDING, JSON.stringify(cloudData.branding));
        }
        if (cloudData.adminPassword) {
          setAdminPassword(cloudData.adminPassword);
          localStorage.setItem(STORAGE_KEYS.ADMIN_PASS, cloudData.adminPassword);
        }
        if (cloudData.memberPassword) {
          setMemberPassword(cloudData.memberPassword);
          localStorage.setItem(STORAGE_KEYS.MEMBER_PASS, cloudData.memberPassword);
        }
        setCloudSyncStatus('connected');
      } else if (!exists) {
        // Initial setup for first time ever run on cloud
        saveCloudState({
          funds,
          transactions,
          categories,
          campaigns,
          members,
          bankSettings,
          groupNotice,
          viewPermissions,
          branding,
          adminPassword,
          memberPassword,
        }).then(() => {
          setCloudSyncStatus('connected');
        }).catch(() => {
          setCloudSyncStatus('connected');
        });
      }
      hasInitializedCloud.current = true;
      setTimeout(() => {
        isSyncingFromCloud.current = false;
      }, 300);
    }, (err) => {
      console.warn('Firestore subscription notice:', err);
      setCloudSyncStatus('error');
    });

    return () => unsubscribe();
  }, []);

  // Modal Control States
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [txModalType, setTxModalType] = useState<TransactionType>('income');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<ContributionCampaign | null>(null);

  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [qrAmount, setQrAmount] = useState<number | undefined>(undefined);
  const [qrContent, setQrContent] = useState<string>(() => {
    const prefix = branding?.transferSyntaxPrefix?.trim() || 'DONG QUY';
    const title = branding?.appTitle || '';
    return `${prefix} ${title}`.trim().toUpperCase();
  });

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printFundId, setPrintFundId] = useState<string | undefined>(undefined);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Save individual items to LocalStorage immediately for instant local persistence
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FUNDS, JSON.stringify(funds));
  }, [funds]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(campaigns));
  }, [campaigns]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BANK, JSON.stringify(bankSettings));
  }, [bankSettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTICE, JSON.stringify(groupNotice));
  }, [groupNotice]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VIEW_PERMISSIONS, JSON.stringify(viewPermissions));
  }, [viewPermissions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BRANDING, JSON.stringify(branding));
  }, [branding]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ADMIN_PASS, adminPassword);
  }, [adminPassword]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MEMBER_PASS, memberPassword);
  }, [memberPassword]);

  // Consolidated Debounced Auto-Sync to Cloud Firestore (Atomic Full State)
  useEffect(() => {
    if (!hasInitializedCloud.current || isSyncingFromCloud.current) return;

    setCloudSyncStatus('syncing');
    const timer = setTimeout(() => {
      saveCloudState({
        funds,
        transactions,
        categories,
        campaigns,
        members,
        bankSettings,
        groupNotice,
        viewPermissions,
        branding,
        adminPassword,
        memberPassword,
      })
        .then(() => {
          setCloudSyncStatus('connected');
        })
        .catch((err) => {
          console.warn('Could not sync to Firestore, fallback to local storage:', err);
          setCloudSyncStatus('error');
        });
    }, 400);

    return () => clearTimeout(timer);
  }, [funds, transactions, categories, campaigns, members, bankSettings, groupNotice, viewPermissions, branding, adminPassword, memberPassword]);

  // Admin authentication
  const handleRequestAdminAccess = () => {
    setIsAdminAuthModalOpen(true);
  };

  const handleAdminAuthSuccess = (role: AuthRole = 'admin') => {
    setCurrentUserRole(role);
    sessionStorage.setItem(STORAGE_KEYS.AUTH_ROLE, role);
    localStorage.setItem(STORAGE_KEYS.AUTH_ROLE, role);
    if (role === 'admin') {
      setIsMemberView(false);
      updateUrlParam(false);
      showToast('Đã đăng nhập thành công quyền Quản trị viên!', 'success');
    } else {
      setIsMemberView(true);
      updateUrlParam(true);
      showToast('Đã đăng nhập thành công quyền Thành viên!', 'info');
    }
  };

  const handleSwitchToMemberView = () => {
    setIsMemberView(true);
    updateUrlParam(true);
  };

  const handleToggleViewMode = () => {
    if (currentUserRole === 'admin') {
      const nextView = !isMemberView;
      setIsMemberView(nextView);
      updateUrlParam(nextView);
    } else {
      setIsAdminAuthModalOpen(true);
    }
  };

  const handleLogout = () => {
    showConfirm({
      title: 'Đăng Xuất',
      message: 'Bạn có chắc chắn muốn đăng xuất khỏi phiên làm việc hiện tại không?',
      type: 'warning',
      confirmText: 'Đăng xuất',
      cancelText: 'Hủy bỏ',
      onConfirm: () => {
        setCurrentUserRole(null);
        sessionStorage.removeItem(STORAGE_KEYS.AUTH_ROLE);
        localStorage.removeItem(STORAGE_KEYS.AUTH_ROLE);
        setIsMemberView(true);
        showToast('Đã đăng xuất!', 'info');
      },
    });
  };

  const updateUrlParam = (memberMode: boolean) => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (memberMode) {
        url.searchParams.set('view', 'member');
      } else {
        url.searchParams.set('view', 'admin');
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  // Recalculate fund balance whenever a transaction is modified
  const applyTransactionBalanceDiff = (
    newTx: Omit<Transaction, 'id' | 'createdAt'>,
    oldTx?: Transaction
  ) => {
    setFunds(prevFunds => {
      let updated = [...prevFunds];

      // Revert old transaction impact if editing
      if (oldTx && oldTx.status === 'completed') {
        updated = updated.map(f => {
          if (oldTx.type === 'income' && f.id === oldTx.fundId) {
            return { ...f, balance: f.balance - oldTx.amount };
          }
          if (oldTx.type === 'expense' && f.id === oldTx.fundId) {
            return { ...f, balance: f.balance + oldTx.amount };
          }
          return f;
        });
      }

      // Apply new transaction impact
      if (newTx.status === 'completed') {
        updated = updated.map(f => {
          if (newTx.type === 'income' && f.id === newTx.fundId) {
            return { ...f, balance: f.balance + newTx.amount };
          }
          if (newTx.type === 'expense' && f.id === newTx.fundId) {
            return { ...f, balance: f.balance - newTx.amount };
          }
          return f;
        });
      }

      return updated;
    });
  };

  // Transaction Actions (Amount, Category, Date, Reason)
  const handleSaveTransaction = (
    txData: Omit<Transaction, 'id' | 'createdAt'>,
    editingId?: string
  ) => {
    if (editingId) {
      const oldTx = transactions.find(t => t.id === editingId);
      applyTransactionBalanceDiff(txData, oldTx);
      setTransactions(prev =>
        prev.map(t => (t.id === editingId ? { ...t, ...txData } : t))
      );
    } else {
      const uniqueSuffix = Math.random().toString(36).substring(2, 8);
      const newTx: Transaction = {
        ...txData,
        id: `tx_${Date.now()}_${uniqueSuffix}`,
        createdAt: new Date().toISOString(),
      };
      applyTransactionBalanceDiff(newTx);
      setTransactions(prev => deduplicateById([newTx, ...prev]));
    }
    setIsTransactionModalOpen(false);
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    if (tx.status === 'completed') {
      setFunds(prev =>
        prev.map(f => {
          if (tx.type === 'income' && f.id === tx.fundId) {
            return { ...f, balance: f.balance - tx.amount };
          }
          if (tx.type === 'expense' && f.id === tx.fundId) {
            return { ...f, balance: f.balance + tx.amount };
          }
          return f;
        })
      );
    }
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // Campaign Actions (Title, Target, Deadline, Contributions)
  const handleSaveCampaign = (
    campData: Omit<ContributionCampaign, 'id'>,
    editingId?: string
  ) => {
    if (editingId) {
      setCampaigns(prev =>
        prev.map(c => {
          if (c.id !== editingId) return c;
          return {
            ...c,
            ...campData,
          };
        })
      );
    } else {
      const uniqueSuffix = Math.random().toString(36).substring(2, 8);
      const newCamp: ContributionCampaign = {
        ...campData,
        id: `camp_${Date.now()}_${uniqueSuffix}`,
      };
      setCampaigns(prev => deduplicateById([newCamp, ...prev]));
    }
    setIsCampaignModalOpen(false);
    setEditingCampaign(null);
  };

  const handleDeleteCampaign = (id: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== id));
  };

  const handleUpdateParticipantPayment = (
    campaignId: string,
    memberId: string,
    amountPaid: number,
    paymentDate: string,
    note?: string
  ) => {
    const targetCamp = campaigns.find(c => c.id === campaignId);
    if (!targetCamp) return;
    const targetParticipant = targetCamp.participants.find(p => p.memberId === memberId);
    const oldAmount = targetParticipant ? targetParticipant.amountPaid : 0;
    const diff = amountPaid - oldAmount;

    // 1. Update Campaign Participants
    setCampaigns(prev =>
      prev.map(camp => {
        if (camp.id !== campaignId) return camp;
        return {
          ...camp,
          participants: camp.participants.map(p => {
            if (p.memberId !== memberId) return p;
            return {
              ...p,
              amountPaid,
              paidDate: amountPaid > 0 ? paymentDate : undefined,
              note: note !== undefined ? note : p.note,
            };
          }),
        };
      })
    );

    // 2. If positive difference, record transaction & fund update cleanly
    if (diff > 0) {
      const member = members.find(m => m.id === memberId);
      const uniqueSuffix = Math.random().toString(36).substring(2, 9);
      const autoTx: Transaction = {
        id: `tx_camp_${Date.now()}_${uniqueSuffix}_${memberId}`,
        type: 'income',
        fundId: targetCamp.fundId || 'fund_general',
        amount: diff,
        categoryId: 'cat_inc_member_fee',
        date: paymentDate,
        description: `Nộp ${targetCamp.title} - ${member?.name || 'Thành viên'}`,
        campaignId: targetCamp.id,
        status: 'completed',
        createdAt: new Date().toISOString(),
      };
      setTransactions(tPrev => deduplicateById([autoTx, ...tPrev.filter(t => t.id !== autoTx.id)]));
      setFunds(fPrev =>
        fPrev.map(f => (f.id === (targetCamp.fundId || 'fund_general') ? { ...f, balance: f.balance + diff } : f))
      );
    }
  };

  // Member Actions (Name, Phone, Roles, Joined Date, Left Date, Status, Special Contribution)
  const handleSaveMember = (
    memberData: Omit<Member, 'id'>,
    editingId?: string
  ) => {
    if (editingId) {
      setMembers(prev =>
        prev.map(m => (m.id === editingId ? { ...m, ...memberData } : m))
      );
    } else {
      const uniqueSuffix = Math.random().toString(36).substring(2, 8);
      const newMember: Member = {
        ...memberData,
        id: `mem_${Date.now()}_${uniqueSuffix}`,
      };
      setMembers(prev => deduplicateById([...prev, newMember]));

      // Automatically add new member to active campaigns
      setCampaigns(prev =>
        prev.map(camp => {
          if (camp.status === 'active') {
            const exists = camp.participants.some(p => p.memberId === newMember.id);
            if (!exists) {
              return {
                ...camp,
                participants: [
                  ...camp.participants,
                  {
                    memberId: newMember.id,
                    amountRequired: camp.amountPerMember,
                    amountPaid: 0,
                  },
                ],
              };
            }
          }
          return camp;
        })
      );
    }
    setIsMemberModalOpen(false);
    setEditingMember(null);
  };

  const handleDeleteMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
    // Remove from campaigns
    setCampaigns(prev =>
      prev.map(c => ({
        ...c,
        participants: c.participants.filter(p => p.memberId !== id),
      }))
    );
  };

  // Category Actions
  const handleAddCategory = (cat: Omit<Category, 'id'>) => {
    const uniqueSuffix = Math.random().toString(36).substring(2, 8);
    const newCat: Category = {
      ...cat,
      id: `cat_custom_${Date.now()}_${uniqueSuffix}`,
    };
    setCategories(prev => deduplicateById([...prev, newCat]));
  };

  const handleUpdateCategory = (updatedCat: Category) => {
    setCategories(prev => prev.map(c => (c.id === updatedCat.id ? updatedCat : c)));
  };

  const handleDeleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  // Reset Operations
  const handleResetBalanceToZero = (reason: string, initialBalance: number = 0) => {
    setFunds(prev =>
      prev.map(f => ({
        ...f,
        balance: f.id === 'fund_general' ? initialBalance : 0,
      }))
    );

    const uniqueSuffix = Math.random().toString(36).substring(2, 8);
    const resetTx: Transaction = {
      id: `tx_reset_${Date.now()}_${uniqueSuffix}`,
      type: 'expense',
      fundId: 'fund_general',
      amount: 0,
      categoryId: 'cat_exp_other',
      date: new Date().toISOString().split('T')[0],
      description: `Khởi tạo số dư ban đầu: ${reason}`,
      status: 'completed',
      createdAt: new Date().toISOString(),
    };
    setTransactions([resetTx]);
  };

  const handleResetAllDataForNewPeriod = (periodName: string, initialBalance: number = 0) => {
    setFunds(prev =>
      prev.map(f => ({
        ...f,
        balance: f.id === 'fund_general' ? initialBalance : 0,
      }))
    );

    const uniqueSuffix = Math.random().toString(36).substring(2, 8);
    const startTx: Transaction = {
      id: `tx_new_period_${Date.now()}_${uniqueSuffix}`,
      type: initialBalance > 0 ? 'income' : 'expense',
      fundId: 'fund_general',
      amount: initialBalance,
      categoryId: initialBalance > 0 ? 'cat_inc_other' : 'cat_exp_other',
      date: new Date().toISOString().split('T')[0],
      description: `Bắt đầu kỳ hoạt động mới (${periodName})`,
      status: 'completed',
      createdAt: new Date().toISOString(),
    };

    setTransactions(initialBalance > 0 ? [startTx] : []);

    // Reset campaign payments for new period
    setCampaigns(prev =>
      prev.map(camp => ({
        ...camp,
        status: 'closed',
      }))
    );
  };

  const handleRestoreDemoData = () => {
    setFunds(INITIAL_FUNDS);
    setTransactions(INITIAL_TRANSACTIONS);
    setCampaigns(INITIAL_CAMPAIGNS);
    setCategories(INITIAL_CATEGORIES);
    setMembers(INITIAL_MEMBERS);
    setBankSettings(INITIAL_BANK_SETTINGS);
    setGroupNotice(INITIAL_GROUP_NOTICE);
    setBranding(INITIAL_BRANDING);
  };

  // Granular Reset per user choice
  const handleResetCustomOptions = (options: ResetCustomOptions) => {
    if (options.resetBalanceOnly) {
      setFunds(prev =>
        prev.map(f => ({
          ...f,
          balance: 0,
        }))
      );
    }
    if (options.clearAllTransactions) {
      setTransactions([]);
    }
    if (options.resetCampaigns) {
      setCampaigns([]);
    }
    if (options.resetMembers) {
      setMembers(INITIAL_MEMBERS);
    }
    if (options.resetCategories) {
      setCategories(INITIAL_CATEGORIES);
    }
    if (options.resetNotice) {
      setGroupNotice(INITIAL_GROUP_NOTICE);
    }
    if (options.resetBankAndBranding) {
      setBankSettings(INITIAL_BANK_SETTINGS);
      setBranding(INITIAL_BRANDING);
    }
  };

  // Full Export & Import JSON
  const handleExportAllData = () => {
    const fullBackup = {
      version: '2.3',
      exportedAt: new Date().toISOString(),
      funds,
      transactions,
      categories,
      campaigns,
      members,
      bankSettings,
      groupNotice,
      viewPermissions,
      branding,
      adminPassword,
      memberPassword,
    };

    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sổ_quỹ_${branding.appTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportAllData = (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.funds) setFunds(data.funds);
      if (data.transactions) setTransactions(data.transactions);
      if (data.categories) setCategories(data.categories);
      if (data.campaigns) setCampaigns(data.campaigns);
      if (data.members) setMembers(data.members);
      if (data.bankSettings) setBankSettings(data.bankSettings);
      if (data.groupNotice) setGroupNotice(data.groupNotice);
      if (data.branding) setBranding(data.branding);
      if (data.viewPermissions) setViewPermissions(data.viewPermissions);
      if (data.adminPassword) setAdminPassword(data.adminPassword);
      if (data.memberPassword) setMemberPassword(data.memberPassword);
      showToast('Đã nhập dữ liệu sao lưu thành công!', 'success');
    } catch (err) {
      showToast('Tệp dữ liệu không hợp lệ!', 'error');
    }
  };

  // Quick Open Modal helpers (handles create & edit)
  const handleOpenTransactionModal = (typeOrTx?: TransactionType | Transaction, editing?: Transaction) => {
    if (typeOrTx && typeof typeOrTx === 'object' && 'id' in typeOrTx) {
      // Called with (transactionToEdit)
      setEditingTransaction(typeOrTx);
      setTxModalType(typeOrTx.type || 'income');
    } else if (editing && typeof editing === 'object' && 'id' in editing) {
      // Called with (type, transactionToEdit)
      setEditingTransaction(editing);
      setTxModalType(editing.type || (typeOrTx as TransactionType) || 'income');
    } else {
      // Called with ('income' | 'expense' | undefined)
      setEditingTransaction(null);
      if (typeOrTx === 'income' || typeOrTx === 'expense') {
        setTxModalType(typeOrTx);
      } else {
        setTxModalType('income');
      }
    }
    setIsTransactionModalOpen(true);
  };

  const handleOpenQRModal = (amount?: number, content?: string) => {
    setQrAmount(amount);
    const prefix = branding?.transferSyntaxPrefix?.trim() || 'DONG QUY';
    const appTitle = branding?.appTitle || '';
    const defaultSyntax = `${prefix} ${appTitle}`.trim().toUpperCase();
    setQrContent(content || defaultSyntax);
    setIsQRModalOpen(true);
  };

  const handleOpenPrintModal = (fundId?: string) => {
    setPrintFundId(fundId);
    setIsPrintModalOpen(true);
  };

  const handleForceSyncToCloud = async () => {
    try {
      setCloudSyncStatus('syncing');
      await saveCloudState({
        funds,
        transactions,
        categories,
        campaigns,
        members,
        bankSettings,
        groupNotice,
        viewPermissions,
        branding,
        adminPassword,
        memberPassword,
      });
      const now = new Date();
      setLastCloudSyncTime(now.toLocaleTimeString('vi-VN') + ' ' + now.toLocaleDateString('vi-VN'));
      setCloudSyncStatus('connected');
      showToast('Đã đồng bộ toàn bộ dữ liệu lên Cloud Firestore thành công!', 'success');
    } catch (err: any) {
      console.error('Manual sync error:', err);
      setCloudSyncStatus('error');
      showToast('Lỗi đồng bộ lên Đám mây: ' + (err?.message || 'Vui lòng kiểm tra lại kết nối'), 'error');
    }
  };

  const handleForcePullFromCloud = () => {
    showConfirm({
      title: 'Tải lại dữ liệu từ Cloud',
      message: 'Hệ thống sẽ tải bản ghi mới nhất từ máy chủ Cloud Firestore về thiết bị này. Các thay đổi cục bộ chưa lưu có thể bị ghi đè. Bạn có chắc chắn muốn tải lại?',
      confirmText: 'Tải lại ngay',
      type: 'warning',
      onConfirm: async () => {
        try {
          setCloudSyncStatus('syncing');
          const cloudData = await fetchCloudStateOnce();
          if (cloudData) {
            if (cloudData.funds) {
              const cleanFunds = deduplicateById(cloudData.funds);
              setFunds(cleanFunds);
              localStorage.setItem(STORAGE_KEYS.FUNDS, JSON.stringify(cleanFunds));
            }
            if (cloudData.transactions) {
              const cleanTx = deduplicateById(cloudData.transactions);
              setTransactions(cleanTx);
              localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(cleanTx));
            }
            if (cloudData.categories) {
              const cleanCats = deduplicateById(cloudData.categories);
              setCategories(cleanCats);
              localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(cleanCats));
            }
            if (cloudData.campaigns) {
              const cleanCamps = deduplicateById(cloudData.campaigns);
              setCampaigns(cleanCamps);
              localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(cleanCamps));
            }
            if (cloudData.members) {
              const cleanMembers = deduplicateById(cloudData.members);
              setMembers(cleanMembers);
              localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(cleanMembers));
            }
            if (cloudData.bankSettings) {
              setBankSettings(cloudData.bankSettings);
              localStorage.setItem(STORAGE_KEYS.BANK, JSON.stringify(cloudData.bankSettings));
            }
            if (cloudData.groupNotice) {
              setGroupNotice(cloudData.groupNotice);
              localStorage.setItem(STORAGE_KEYS.NOTICE, JSON.stringify(cloudData.groupNotice));
            }
            if (cloudData.viewPermissions) {
              setViewPermissions(cloudData.viewPermissions);
              localStorage.setItem(STORAGE_KEYS.VIEW_PERMISSIONS, JSON.stringify(cloudData.viewPermissions));
            }
            if (cloudData.branding) {
              setBranding(cloudData.branding);
              localStorage.setItem(STORAGE_KEYS.BRANDING, JSON.stringify(cloudData.branding));
            }
            if (cloudData.adminPassword) {
              setAdminPassword(cloudData.adminPassword);
              localStorage.setItem(STORAGE_KEYS.ADMIN_PASS, cloudData.adminPassword);
            }
            if (cloudData.memberPassword) {
              setMemberPassword(cloudData.memberPassword);
              localStorage.setItem(STORAGE_KEYS.MEMBER_PASS, cloudData.memberPassword);
            }

            const now = new Date();
            setLastCloudSyncTime(now.toLocaleTimeString('vi-VN') + ' ' + now.toLocaleDateString('vi-VN'));
            setCloudSyncStatus('connected');
            showToast('Đã tải và cập nhật dữ liệu từ Cloud Firestore thành công!', 'success');
          } else {
            showToast('Không tìm thấy dữ liệu trên Cloud.', 'info');
          }
        } catch (err: any) {
          console.error('Pull cloud error:', err);
          showToast('Lỗi khi tải dữ liệu từ Cloud: ' + (err?.message || 'Vui lòng thử lại'), 'error');
        }
      }
    });
  };

  const handleTestCloudConnection = async (): Promise<CloudConnectionResult> => {
    const result = await testCloudConnection();
    if (result.success) {
      setCloudLatency(result.latencyMs);
      setCloudSyncStatus('connected');
      showToast(`Kết nối Cloud Firestore hoạt động tốt! Tốc độ phản hồi: ${result.latencyMs}ms`, 'success');
    } else {
      setCloudSyncStatus('error');
      showToast(`Lỗi kết nối Cloud Firestore: ${result.error}`, 'error');
    }
    return result;
  };

  const pendingTransactionsCount = transactions.filter(t => t.status === 'pending').length;
  const currentFund = funds[0] || { id: 'fund_general', name: 'Quỹ Chung', balance: 0 };

  if (!currentUserRole) {
    return (
      <LoginScreen
        branding={branding}
        adminPassword={adminPassword}
        memberPassword={memberPassword}
        onLoginSuccess={(role) => {
          handleAdminAuthSuccess(role);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Header & Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        funds={funds}
        branding={branding}
        onOpenTransactionModal={(type) => handleOpenTransactionModal(type)}
        onOpenQRModal={() => handleOpenQRModal()}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        isMemberView={isMemberView}
        onRequestAdminLogin={handleRequestAdminAccess}
        pendingTransactionsCount={pendingTransactionsCount}
        cloudSyncStatus={cloudSyncStatus}
        onForceSyncToCloud={handleForceSyncToCloud}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-12 sm:pb-8 space-y-6">
        {isMemberView ? (
          <MemberPortalView
            funds={funds}
            transactions={transactions}
            categories={categories}
            campaigns={campaigns}
            members={members}
            bankSettings={bankSettings}
            branding={branding}
            groupNotice={groupNotice}
            viewPermissions={viewPermissions}
            onOpenQRModal={handleOpenQRModal}
            onOpenPrintModal={handleOpenPrintModal}
            onSwitchToAdmin={handleRequestAdminAccess}
          />
        ) : (
          <>
            {activeTab === 'overview' && (
              <OverviewTab
                funds={funds}
                transactions={transactions}
                categories={categories}
                campaigns={campaigns}
                members={members}
                bankSettings={bankSettings}
                isAdmin={true}
                onOpenTransactionModal={(type, tx) => handleOpenTransactionModal(type, tx)}
                onOpenQRModal={handleOpenQRModal}
                onOpenShareModal={() => setIsShareModalOpen(true)}
                onOpenResetFundModal={() => setIsResetFundModalOpen(true)}
                onOpenPrintModal={() => handleOpenPrintModal()}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === 'transactions' && (
              <TransactionsTab
                transactions={transactions}
                funds={funds}
                categories={categories}
                members={members}
                onOpenTransactionModal={(type, tx) => handleOpenTransactionModal(type, tx)}
                onDeleteTransaction={handleDeleteTransaction}
                onOpenPrintModal={handleOpenPrintModal}
              />
            )}

            {activeTab === 'campaigns' && (
              <CampaignsTab
                campaigns={campaigns}
                funds={funds}
                members={members}
                branding={branding}
                onOpenCampaignModal={(c) => {
                  setEditingCampaign(c || null);
                  setIsCampaignModalOpen(true);
                }}
                onDeleteCampaign={handleDeleteCampaign}
                onUpdateParticipantPayment={handleUpdateParticipantPayment}
                onOpenQRModal={handleOpenQRModal}
              />
            )}

            {activeTab === 'members' && (
              <MembersTab
                members={members}
                campaigns={campaigns}
                funds={funds}
                branding={branding}
                onOpenQRModal={handleOpenQRModal}
                onUpdateParticipantPayment={handleUpdateParticipantPayment}
                onOpenMemberModal={(m) => {
                  setEditingMember(m || null);
                  setIsMemberModalOpen(true);
                }}
                onDeleteMember={handleDeleteMember}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsTab
                transactions={transactions}
                funds={funds}
                categories={categories}
                onOpenPrintModal={() => handleOpenPrintModal()}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsTab
                bankSettings={bankSettings}
                onUpdateBankSettings={setBankSettings}
                categories={categories}
                onAddCategory={handleAddCategory}
                onUpdateCategory={handleUpdateCategory}
                onDeleteCategory={handleDeleteCategory}
                onExportAllData={handleExportAllData}
                onImportAllData={handleImportAllData}
                onResetData={() => setIsResetFundModalOpen(true)}
                onForceSyncToCloud={handleForceSyncToCloud}
                onForcePullFromCloud={handleForcePullFromCloud}
                onTestCloudConnection={handleTestCloudConnection}
                cloudSyncStatus={cloudSyncStatus}
                lastCloudSyncTime={lastCloudSyncTime}
                cloudLatency={cloudLatency}
                adminPassword={adminPassword}
                onUpdateAdminPassword={setAdminPassword}
                memberPassword={memberPassword}
                onUpdateMemberPassword={setMemberPassword}
                groupNotice={groupNotice}
                onUpdateGroupNotice={setGroupNotice}
                branding={branding}
                onUpdateBranding={setBranding}
                viewPermissions={viewPermissions}
                onUpdateViewPermissions={setViewPermissions}
              />
            )}
          </>
        )}
      </main>

      {/* Global Modals */}
      <NoticeEditModal
        isOpen={isNoticeEditModalOpen}
        onClose={() => setIsNoticeEditModalOpen(false)}
        notice={groupNotice}
        onSaveNotice={setGroupNotice}
      />

      <AdminAuthModal
        isOpen={isAdminAuthModalOpen}
        onClose={() => setIsAdminAuthModalOpen(false)}
        adminPassword={adminPassword}
        memberPassword={memberPassword}
        correctPassword={adminPassword}
        savedAdminPin={adminPassword}
        mode={currentUserRole === 'member' ? 'upgrade_admin' : 'login'}
        appTitle={branding?.appTitle}
        onSuccess={handleAdminAuthSuccess}
      />

      <ResetFundModal
        isOpen={isResetFundModalOpen}
        onClose={() => setIsResetFundModalOpen(false)}
        currentBalance={currentFund.balance}
        onResetBalanceToZero={handleResetBalanceToZero}
        onResetAllDataForNewPeriod={handleResetAllDataForNewPeriod}
        onRestoreDemoData={handleRestoreDemoData}
        onResetCustomOptions={handleResetCustomOptions}
      />

      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSave={handleSaveTransaction}
        funds={funds}
        categories={categories}
        editingTransaction={editingTransaction}
        initialType={txModalType}
      />

      <CampaignModal
        isOpen={isCampaignModalOpen}
        onClose={() => setIsCampaignModalOpen(false)}
        onSave={handleSaveCampaign}
        funds={funds}
        members={members}
        initialData={editingCampaign}
      />

      <MemberModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        onSave={handleSaveMember}
        initialData={editingMember}
      />

      <VietQRModal
        isOpen={isQRModalOpen}
        onClose={() => setIsQRModalOpen(false)}
        bankSettings={bankSettings}
        defaultAmount={qrAmount}
        defaultContent={qrContent}
        branding={branding}
      />

      <PrintStatementModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        transactions={transactions}
        funds={funds}
        categories={categories}
        activeFundId={printFundId}
        branding={branding}
        onUpdateBranding={setBranding}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onSwitchToMemberView={handleSwitchToMemberView}
        bankSettings={bankSettings}
        funds={funds}
        activeCampaigns={campaigns.filter(c => c.status === 'active')}
        branding={branding}
      />
    </div>
  );
}
