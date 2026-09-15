import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { SettingsTab } from './components/SettingsTab';
import { TransactionModal } from './components/modals/TransactionModal';
import { CampaignModal } from './components/modals/CampaignModal';
import { MemberModal } from './components/modals/MemberModal';
import { VietQRModal } from './components/modals/VietQRModal';
import { PrintStatementModal } from './components/modals/PrintStatementModal';
import { PrintMemberDuesModal } from './components/modals/PrintMemberDuesModal';
import { ShareModal } from './components/modals/ShareModal';
import { ThemeCustomizerModal } from './components/modals/ThemeCustomizerModal';
import { MemberPortalView } from './components/MemberPortalView';
import { FloatingTransactionButton } from './components/common/FloatingTransactionButton';
import { subscribeToCloudState, saveCloudState, fetchCloudStateOnce, testCloudConnection, CloudConnectionResult } from './lib/cloudStore';
import { safeStorage } from './utils/safeStorage';
import { useFeedback } from './context/FeedbackContext';
import { useTheme } from './context/ThemeContext';
import { useTranslation, flattenDictionary } from './i18n/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';

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
  const { t, activeCustomTexts, syncFromCloud } = useTranslation();
  const { showToast, showConfirm, setToastPosition } = useFeedback();
  const { isCustomizerOpen, setIsCustomizerOpen, syncFromBranding, revertToSavedTheme } = useTheme();

  // User Authentication State (dual-password: 'member' or 'admin')
  // Session is strictly kept in-memory for the current page life only.
  // Refreshing, reloading or reopening the page will ALWAYS reset role to null and require entering password.
  const [currentUserRole, setCurrentUserRole] = useState<AuthRole | null>(null);

  // Clear any legacy cached tokens and handle bfcache (back-forward cache) to ensure password is required on reload
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem(STORAGE_KEYS.AUTH_ROLE);
      }
      safeStorage.removeItem(STORAGE_KEYS.AUTH_ROLE);
    } catch {
      // Ignore storage access errors
    }

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        // Page was restored from back-forward cache; lock immediately
        setCurrentUserRole(null);
      }
    };

    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  // Member View is active when logged in as member
  const isMemberView = currentUserRole === 'member';

  // Admin Password
  const [adminPassword, setAdminPassword] = useState<string>(() => {
    const saved = safeStorage.getItem(STORAGE_KEYS.ADMIN_PASS);
    return saved || DEFAULT_ADMIN_PASSWORD;
  });

  // Member Password
  const [memberPassword, setMemberPassword] = useState<string>(() => {
    const saved = safeStorage.getItem(STORAGE_KEYS.MEMBER_PASS);
    return saved || DEFAULT_MEMBER_PASSWORD;
  });

  // App Title / Branding Personalization State
  const [branding, setBranding] = useState<AppBranding>(() => {
    try {
      const saved = safeStorage.getItem(STORAGE_KEYS.BRANDING);
      return saved ? JSON.parse(saved) : INITIAL_BRANDING;
    } catch {
      return INITIAL_BRANDING;
    }
  });

  // Navigation State
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Core Data States with SafeStorage Initialization
  const [funds, setFunds] = useState<Fund[]>(() => {
    try {
      const saved = safeStorage.getItem(STORAGE_KEYS.FUNDS);
      const parsed: Fund[] = saved ? deduplicateById(JSON.parse(saved)) : INITIAL_FUNDS;
      const savedBranding = safeStorage.getItem(STORAGE_KEYS.BRANDING);
      const parsedBranding: AppBranding = savedBranding ? JSON.parse(savedBranding) : INITIAL_BRANDING;
      const appName = parsedBranding?.appTitle?.trim() || 'AE Cây Khế';
      return parsed.map((f, idx) => {
        if (idx === 0 && (f.name === 'Quỹ Hoạt Động' || f.name === 'Quỹ Chung' || !f.name)) {
          return { ...f, name: appName };
        }
        return f;
      });
    } catch {
      return INITIAL_FUNDS;
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = safeStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return saved ? deduplicateById(JSON.parse(saved)) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = safeStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return saved ? deduplicateById(JSON.parse(saved)) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  });

  const [campaigns, setCampaigns] = useState<ContributionCampaign[]>(() => {
    try {
      const saved = safeStorage.getItem(STORAGE_KEYS.CAMPAIGNS);
      return saved ? deduplicateById(JSON.parse(saved)) : INITIAL_CAMPAIGNS;
    } catch {
      return INITIAL_CAMPAIGNS;
    }
  });

  const [members, setMembers] = useState<Member[]>(() => {
    try {
      const saved = safeStorage.getItem(STORAGE_KEYS.MEMBERS);
      return saved ? deduplicateById(JSON.parse(saved)) : INITIAL_MEMBERS;
    } catch {
      return INITIAL_MEMBERS;
    }
  });

  const [bankSettings, setBankSettings] = useState<BankSettings>(() => {
    try {
      const saved = safeStorage.getItem(STORAGE_KEYS.BANK);
      return saved ? JSON.parse(saved) : INITIAL_BANK_SETTINGS;
    } catch {
      return INITIAL_BANK_SETTINGS;
    }
  });

  const [groupNotice, setGroupNotice] = useState<GroupNotice>(() => {
    try {
      const saved = safeStorage.getItem(STORAGE_KEYS.NOTICE);
      return saved ? JSON.parse(saved) : INITIAL_GROUP_NOTICE;
    } catch {
      return INITIAL_GROUP_NOTICE;
    }
  });

  const [viewPermissions, setViewPermissions] = useState<MemberViewPermissions>(() => {
    try {
      const saved = safeStorage.getItem(STORAGE_KEYS.VIEW_PERMISSIONS);
      return saved ? JSON.parse(saved) : INITIAL_VIEW_PERMISSIONS;
    } catch {
      return INITIAL_VIEW_PERMISSIONS;
    }
  });

  // Cloud connection & synchronization status
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'connected' | 'connecting' | 'error' | 'syncing'>('connecting');
  const [lastCloudSyncTime, setLastCloudSyncTime] = useState<string | null>(null);
  const [cloudLatency, setCloudLatency] = useState<number | null>(null);
  const isSyncingFromCloud = useRef(false);
  const hasInitializedCloud = useRef(false);
  const lastSyncedJsonRef = useRef<string>('');

  // Always retrieves the freshest custom dictionary from storage or state (prevents stale closure issues)
  const getLatestCustomDictionary = useCallback((): Record<string, string> => {
    try {
      const saved = safeStorage.getItem('quanlyquy_custom_dictionary_v2');
      if (saved !== null && saved !== undefined) {
        const parsed = JSON.parse(saved);
        return flattenDictionary(parsed);
      }
    } catch {}
    return activeCustomTexts || {};
  }, [activeCustomTexts]);

  // Realtime Cloud Firestore sync
  useEffect(() => {
    const unsubscribe = subscribeToCloudState((cloudData, exists) => {
      isSyncingFromCloud.current = true;
      const now = new Date();
      setLastCloudSyncTime(now.toLocaleTimeString('vi-VN') + ' ' + now.toLocaleDateString('vi-VN'));

      if (exists && cloudData) {
        let newFunds = funds;
        let newTx = transactions;
        let newCats = categories;
        let newCamps = campaigns;
        let newMembers = members;
        let newBank = bankSettings;
        let newNotice = groupNotice;
        let newPerms = viewPermissions;
        let newBrand = branding;
        let newAdminPass = adminPassword;
        let newMemberPass = memberPassword;

        if (cloudData.funds && Array.isArray(cloudData.funds)) {
          const appName = cloudData.branding?.appTitle?.trim() || branding?.appTitle?.trim() || 'AE Cây Khế';
          newFunds = deduplicateById(cloudData.funds).map((f, idx) => {
            // Always ensure the primary fund reflects the customized appTitle
            if (idx === 0) {
              return { ...f, name: appName };
            }
            return f;
          });
          setFunds(newFunds);
          safeStorage.setItem(STORAGE_KEYS.FUNDS, JSON.stringify(newFunds));
        }
        if (cloudData.transactions && Array.isArray(cloudData.transactions)) {
          newTx = deduplicateById(cloudData.transactions);
          setTransactions(newTx);
          safeStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(newTx));
        }
        if (cloudData.categories && Array.isArray(cloudData.categories)) {
          newCats = deduplicateById(cloudData.categories);
          setCategories(newCats);
          safeStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(newCats));
        }
        if (cloudData.campaigns && Array.isArray(cloudData.campaigns)) {
          newCamps = deduplicateById(cloudData.campaigns);
          setCampaigns(newCamps);
          safeStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(newCamps));
        }
        if (cloudData.members && Array.isArray(cloudData.members)) {
          newMembers = deduplicateById(cloudData.members);
          setMembers(newMembers);
          safeStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(newMembers));
        }
        if (cloudData.bankSettings) {
          newBank = cloudData.bankSettings;
          setBankSettings(newBank);
          safeStorage.setItem(STORAGE_KEYS.BANK, JSON.stringify(newBank));
        }
        if (cloudData.groupNotice) {
          newNotice = cloudData.groupNotice;
          setGroupNotice(newNotice);
          safeStorage.setItem(STORAGE_KEYS.NOTICE, JSON.stringify(newNotice));
        }
        if (cloudData.viewPermissions) {
          newPerms = cloudData.viewPermissions;
          setViewPermissions(newPerms);
          safeStorage.setItem(STORAGE_KEYS.VIEW_PERMISSIONS, JSON.stringify(newPerms));
        }
        if (cloudData.branding) {
          newBrand = cloudData.branding;
          setBranding(newBrand);
          safeStorage.setItem(STORAGE_KEYS.BRANDING, JSON.stringify(newBrand));
          syncFromBranding(newBrand);
          if (newBrand.toastPosition) {
            setToastPosition(newBrand.toastPosition);
          }
          if (newBrand.appTitle && typeof document !== 'undefined') {
            document.title = `${newBrand.appTitle.trim()} - Quản Lý Quỹ Minh Bạch`;
          }
        }
        if (cloudData.adminPassword) {
          newAdminPass = cloudData.adminPassword;
          setAdminPassword(newAdminPass);
          safeStorage.setItem(STORAGE_KEYS.ADMIN_PASS, newAdminPass);
        }
        if (cloudData.memberPassword) {
          newMemberPass = cloudData.memberPassword;
          setMemberPassword(newMemberPass);
          safeStorage.setItem(STORAGE_KEYS.MEMBER_PASS, newMemberPass);
        }
        if (cloudData.customDictionary !== undefined && cloudData.customDictionary !== null) {
          syncFromCloud(cloudData.customDictionary);
        }

        const freshDict = getLatestCustomDictionary();
        // Cache the exact JSON to prevent ping-pong auto-sync loop
        lastSyncedJsonRef.current = JSON.stringify({
          funds: newFunds,
          transactions: newTx,
          categories: newCats,
          campaigns: newCamps,
          members: newMembers,
          bankSettings: newBank,
          groupNotice: newNotice,
          viewPermissions: newPerms,
          branding: newBrand,
          adminPassword: newAdminPass,
          memberPassword: newMemberPass,
          customDictionary: (cloudData.customDictionary !== undefined && cloudData.customDictionary !== null)
            ? flattenDictionary(cloudData.customDictionary)
            : freshDict,
        });

        setCloudSyncStatus('connected');
      } else if (!exists) {
        // Initial setup for first time ever run on cloud
        const initialFullState = {
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
          customDictionary: getLatestCustomDictionary(),
        };
        saveCloudState(initialFullState).then(() => {
          lastSyncedJsonRef.current = JSON.stringify(initialFullState);
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

  const [isPrintDuesModalOpen, setIsPrintDuesModalOpen] = useState(false);
  const [printDuesCampaignId, setPrintDuesCampaignId] = useState<string>('all');

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Save individual items to SafeStorage immediately for instant local persistence
  useEffect(() => {
    safeStorage.setItem(STORAGE_KEYS.FUNDS, JSON.stringify(funds));
  }, [funds]);

  useEffect(() => {
    safeStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    safeStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    safeStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(campaigns));
  }, [campaigns]);

  useEffect(() => {
    safeStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    safeStorage.setItem(STORAGE_KEYS.BANK, JSON.stringify(bankSettings));
  }, [bankSettings]);

  useEffect(() => {
    safeStorage.setItem(STORAGE_KEYS.NOTICE, JSON.stringify(groupNotice));
  }, [groupNotice]);

  useEffect(() => {
    safeStorage.setItem(STORAGE_KEYS.VIEW_PERMISSIONS, JSON.stringify(viewPermissions));
  }, [viewPermissions]);

  useEffect(() => {
    safeStorage.setItem(STORAGE_KEYS.BRANDING, JSON.stringify(branding));
  }, [branding]);

  useEffect(() => {
    safeStorage.setItem(STORAGE_KEYS.ADMIN_PASS, adminPassword);
  }, [adminPassword]);

  useEffect(() => {
    safeStorage.setItem(STORAGE_KEYS.MEMBER_PASS, memberPassword);
  }, [memberPassword]);

  // Consolidated Debounced Auto-Sync to Cloud Firestore (Atomic Full State)
  useEffect(() => {
    if (!hasInitializedCloud.current || isSyncingFromCloud.current) return;

    const latestDict = getLatestCustomDictionary();
    const currentState = {
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
      customDictionary: latestDict,
    };
    const currentStateJson = JSON.stringify(currentState);

    // Skip network round-trip if data is identical to what Firestore already has
    if (lastSyncedJsonRef.current && currentStateJson === lastSyncedJsonRef.current) {
      setCloudSyncStatus('connected');
      return;
    }

    setCloudSyncStatus('syncing');
    const timer = setTimeout(() => {
      saveCloudState(currentState)
        .then(() => {
          lastSyncedJsonRef.current = currentStateJson;
          setCloudSyncStatus('connected');
        })
        .catch((err) => {
          console.warn('Could not sync to Firestore, fallback to local storage:', err);
          setCloudSyncStatus('error');
        });
    }, 600);

    return () => clearTimeout(timer);
  }, [funds, transactions, categories, campaigns, members, bankSettings, groupNotice, viewPermissions, branding, adminPassword, memberPassword, activeCustomTexts, getLatestCustomDictionary]);

  const handleAdminAuthSuccess = (role: AuthRole = 'admin') => {
    setCurrentUserRole(role);
    if (role === 'admin') {
      showToast('Đã đăng nhập thành công quyền Quản trị viên!', 'success');
    } else {
      showToast('Đã đăng nhập thành công quyền Thành viên!', 'info');
    }
  };

  const handleLogout = () => {
    showConfirm({
      title: 'Đăng Xuất',
      message: 'Bạn có chắc chắn muốn đăng xuất khỏi phiên làm việc hiện tại không?',
      type: 'confirm',
      icon: 'logout',
      confirmText: 'Đăng xuất',
      cancelText: 'Hủy bỏ',
      onConfirm: () => {
        setCurrentUserRole(null);
        sessionStorage.removeItem(STORAGE_KEYS.AUTH_ROLE);
        localStorage.removeItem(STORAGE_KEYS.AUTH_ROLE);
        revertToSavedTheme(branding);
        showToast('Đã đăng xuất!', 'info');
      },
    });
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

  // Full Export & Import JSON
  const handleExportAllData = () => {
    const fullBackup = {
      version: '2.5',
      exportedAt: new Date().toISOString(),
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
      customDictionary: activeCustomTexts,
    };

    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sổ_quỹ_${(branding.appTitle || 'AE_Cay_Khe').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportAllData = (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      if (data.categories) setCategories(data.categories);
      if (data.members) setMembers(data.members);
      if (data.bankSettings) setBankSettings(data.bankSettings);
      if (data.groupNotice) setGroupNotice(data.groupNotice);
      if (data.branding) {
        setBranding(prev => ({
          ...INITIAL_BRANDING,
          ...prev,
          ...data.branding,
        }));
      }
      if (data.viewPermissions) setViewPermissions(data.viewPermissions);
      if (data.adminPassword) setAdminPassword(data.adminPassword);
      if (data.memberPassword) setMemberPassword(data.memberPassword);
      if (data.customDictionary) syncFromCloud(data.customDictionary);

      if (data.transactions) {
        const normalizedTx: Transaction[] = data.transactions.map((t: any) => ({
          ...t,
          fundId: t.fundId || 'fund_general',
        }));
        setTransactions(normalizedTx);

        // Auto-recalculate group treasury balance from transactions
        const compTx = normalizedTx.filter((t: Transaction) => t.status === 'completed');
        const netBalance = compTx.reduce(
          (sum: number, t: Transaction) => sum + (t.type === 'income' ? t.amount : -t.amount),
          0
        );
        setFunds(prev => {
          const appName = data.branding?.appTitle?.trim() || prev[0]?.name || 'AE Cây Khế';
          return [{
            ...(prev[0] || INITIAL_FUNDS[0]),
            name: appName,
            balance: netBalance,
          }];
        });
      } else if (data.funds && Array.isArray(data.funds) && data.funds.length > 0) {
        // Fallback backward compatibility for legacy backup files that still contained funds
        setFunds(data.funds);
      }

      if (data.campaigns) {
        const normalizedCamp: ContributionCampaign[] = data.campaigns.map((c: any) => ({
          ...c,
          fundId: c.fundId || 'fund_general',
        }));
        setCampaigns(normalizedCamp);
      }

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

  const handleOpenPrintDuesModal = (campaignId: string = 'all') => {
    if (isMemberView) return;
    setPrintDuesCampaignId(campaignId);
    setIsPrintDuesModalOpen(true);
  };

  const handleForceSyncToCloud = async () => {
    try {
      setCloudSyncStatus('syncing');
      const latestDict = getLatestCustomDictionary();
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
        customDictionary: latestDict,
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
              const appName = cloudData.branding?.appTitle?.trim() || branding?.appTitle?.trim() || 'AE Cây Khế';
              const cleanFunds = deduplicateById(cloudData.funds).map((f, idx) => {
                if (idx === 0) {
                  return { ...f, name: appName };
                }
                return f;
              });
              setFunds(cleanFunds);
              safeStorage.setItem(STORAGE_KEYS.FUNDS, JSON.stringify(cleanFunds));
            }
            if (cloudData.transactions) {
              const cleanTx = deduplicateById(cloudData.transactions);
              setTransactions(cleanTx);
              safeStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(cleanTx));
            }
            if (cloudData.categories) {
              const cleanCats = deduplicateById(cloudData.categories);
              setCategories(cleanCats);
              safeStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(cleanCats));
            }
            if (cloudData.campaigns) {
              const cleanCamps = deduplicateById(cloudData.campaigns);
              setCampaigns(cleanCamps);
              safeStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(cleanCamps));
            }
            if (cloudData.members) {
              const cleanMembers = deduplicateById(cloudData.members);
              setMembers(cleanMembers);
              safeStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(cleanMembers));
            }
            if (cloudData.bankSettings) {
              setBankSettings(cloudData.bankSettings);
              safeStorage.setItem(STORAGE_KEYS.BANK, JSON.stringify(cloudData.bankSettings));
            }
            if (cloudData.groupNotice) {
              setGroupNotice(cloudData.groupNotice);
              safeStorage.setItem(STORAGE_KEYS.NOTICE, JSON.stringify(cloudData.groupNotice));
            }
            if (cloudData.viewPermissions) {
              setViewPermissions(cloudData.viewPermissions);
              safeStorage.setItem(STORAGE_KEYS.VIEW_PERMISSIONS, JSON.stringify(cloudData.viewPermissions));
            }
            if (cloudData.branding) {
              setBranding(cloudData.branding);
              safeStorage.setItem(STORAGE_KEYS.BRANDING, JSON.stringify(cloudData.branding));
              if (cloudData.branding.appTitle && typeof document !== 'undefined') {
                document.title = `${cloudData.branding.appTitle.trim()} - Quản Lý Quỹ Minh Bạch`;
              }
            }
            if (cloudData.adminPassword) {
              setAdminPassword(cloudData.adminPassword);
              safeStorage.setItem(STORAGE_KEYS.ADMIN_PASS, cloudData.adminPassword);
            }
            if (cloudData.memberPassword) {
              setMemberPassword(cloudData.memberPassword);
              safeStorage.setItem(STORAGE_KEYS.MEMBER_PASS, cloudData.memberPassword);
            }
            if (cloudData.customDictionary) {
              syncFromCloud(cloudData.customDictionary);
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

  const handleUpdateBranding = (newBranding: AppBranding) => {
    setBranding(newBranding);
    safeStorage.setItem(STORAGE_KEYS.BRANDING, JSON.stringify(newBranding));
    syncFromBranding(newBranding);
    if (newBranding?.toastPosition) {
      setToastPosition(newBranding.toastPosition);
    }
    const newAppName = newBranding?.appTitle?.trim() || 'AE Cây Khế';
    setFunds(prev => {
      if (prev.length === 0) return prev;
      const updated = [{ ...prev[0], name: newAppName }, ...prev.slice(1)];
      safeStorage.setItem(STORAGE_KEYS.FUNDS, JSON.stringify(updated));
      return updated;
    });
    if (typeof document !== 'undefined') {
      document.title = `${newAppName} - Quản Lý Quỹ Minh Bạch`;
    }
  };

  // Ensure the primary fund name stays synchronized with appTitle
  useEffect(() => {
    const targetName = branding?.appTitle?.trim() || 'AE Cây Khế';
    const primaryFundName = funds[0]?.name;
    if (funds.length > 0 && primaryFundName !== targetName) {
      setFunds(prev => {
        if (prev.length === 0) return prev;
        const updated = [{ ...prev[0], name: targetName }, ...prev.slice(1)];
        safeStorage.setItem(STORAGE_KEYS.FUNDS, JSON.stringify(updated));
        return updated;
      });
    }
    if (typeof document !== 'undefined' && targetName) {
      document.title = `${targetName} - Quản Lý Quỹ Minh Bạch`;
    }
  }, [branding?.appTitle, funds]);

  const pendingTransactionsCount = transactions.filter(t => t.status === 'pending').length;

  if (!currentUserRole) {
    return (
      <LoginScreen
        branding={branding}
        bankSettings={bankSettings}
        adminPassword={adminPassword}
        memberPassword={memberPassword}
        onLoginSuccess={(role) => {
          handleAdminAuthSuccess(role);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-600 selection:text-white transition-colors duration-200">
      {/* Header & Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        funds={funds}
        branding={branding}
        onOpenQRModal={() => handleOpenQRModal()}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        isMemberView={isMemberView}
        pendingTransactionsCount={pendingTransactionsCount}
        activeCampaignsCount={campaigns.filter(c => c.status === 'active').length}
        cloudSyncStatus={cloudSyncStatus}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-3 sm:pt-4 pb-20 md:pb-6 space-y-4 sm:space-y-5">
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
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
            >
              {activeTab === 'overview' && (
                <OverviewTab
                  funds={funds}
                  transactions={transactions}
                  categories={categories}
                  campaigns={campaigns}
                  branding={branding}
                  isAdmin={true}
                  onOpenPrintModal={() => handleOpenPrintModal()}
                  setActiveTab={setActiveTab}
                />
              )}

              {activeTab === 'transactions' && (
                <TransactionsTab
                  transactions={transactions}
                  funds={funds}
                  categories={categories}
                  branding={branding}
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
                  onOpenPrintDuesModal={handleOpenPrintDuesModal}
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
                  onOpenPrintDuesModal={handleOpenPrintDuesModal}
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
                  onUpdateBranding={handleUpdateBranding}
                  viewPermissions={viewPermissions}
                  onUpdateViewPermissions={setViewPermissions}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Global Modals */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        onSave={handleSaveTransaction}
        funds={funds}
        categories={categories}
        editingTransaction={editingTransaction}
        initialType={txModalType}
        branding={branding}
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
        isAdmin={!isMemberView}
      />

      <PrintStatementModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        transactions={transactions}
        funds={funds}
        categories={categories}
        activeFundId={printFundId}
        branding={branding}
      />

      <PrintMemberDuesModal
        isOpen={isPrintDuesModalOpen && !isMemberView}
        onClose={() => setIsPrintDuesModalOpen(false)}
        members={members}
        campaigns={campaigns}
        funds={funds}
        bankSettings={bankSettings}
        branding={branding}
        defaultCampaignId={printDuesCampaignId}
        isAdmin={!isMemberView}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        branding={branding}
      />

      <ThemeCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        isAdmin={!isMemberView}
        branding={branding}
        onUpdateBranding={handleUpdateBranding}
      />

      {/* Dedicated Floating Thu/Chi Action Button at bottom-right */}
      <FloatingTransactionButton
        onOpenTransactionModal={(type) => handleOpenTransactionModal(type)}
        isMemberView={isMemberView}
        activeTab={activeTab}
      />
    </div>
  );
}
