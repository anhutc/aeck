import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Tag,
  Plus,
  Trash2,
  Download,
  Upload,
  Check,
  Save,
  KeyRound,
  Eye,
  EyeOff,
  ScrollText,
  Calendar,
  Type,
  Cloud,
  RefreshCw,
  Sliders,
  PieChart as PieIcon,
  Target,
  Pencil,
  X,
  Database,
  Activity,
  Zap,
  CheckCircle2,
  AlertCircle,
  Copy,
  Lock,
  Bell,
  RotateCcw,
  Palette,
  Sun,
  Moon,
  Laptop,
  Sparkles,
  QrCode,
  Languages
} from 'lucide-react';
import { BankSettings, Category, GroupNotice, AppBranding, MemberViewPermissions } from '../types';
import { VIETNAMESE_BANKS, INITIAL_BRANDING, INITIAL_VIEW_PERMISSIONS } from '../data/initialData';
import { CloudDataSourceModal } from './settings/CloudDataSourceModal';
import { TextCustomizerSection } from './settings/TextCustomizerSection';
import { getSavedCustomFirebaseConfig } from '../lib/firebase';
import { useTranslation } from '../i18n/LanguageContext';
import { useFeedback, ToastPosition } from '../context/FeedbackContext';
import { useTheme } from '../context/ThemeContext';
import { THEME_PRESETS, RADIUS_OPTIONS, ThemeDensity, ThemeMode } from '../utils/theme';

export type SettingSubTab = 'branding' | 'notice' | 'permissions' | 'security' | 'bank' | 'categories' | 'backup' | 'language' | 'all';

interface SettingsTabProps {
  bankSettings: BankSettings;
  onUpdateBankSettings: (settings: BankSettings) => void;
  categories: Category[];
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  onUpdateCategory?: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
  onExportAllData: () => void;
  onImportAllData: (jsonData: string) => void;
  onForceSyncToCloud?: () => void;
  onForcePullFromCloud?: () => void;
  onTestCloudConnection?: () => Promise<{ success: boolean; latencyMs: number; error?: string }>;
  cloudSyncStatus?: 'connected' | 'connecting' | 'error' | 'syncing';
  lastCloudSyncTime?: string | null;
  cloudLatency?: number | null;
  adminPassword?: string;
  onUpdateAdminPassword: (newPass: string) => void;
  memberPassword?: string;
  onUpdateMemberPassword?: (newPass: string) => void;
  groupNotice: GroupNotice;
  onUpdateGroupNotice: (notice: GroupNotice) => void;
  branding?: AppBranding;
  onUpdateBranding: (branding: AppBranding) => void;
  viewPermissions?: MemberViewPermissions;
  onUpdateViewPermissions: (permissions: MemberViewPermissions) => void;
}

const SETTING_NAV_ITEMS: Array<{
  id: SettingSubTab;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  iconColor: string;
  activeColor: string;
}> = [
  { id: 'branding', label: 'Nhận Diện & Giao Diện', sublabel: 'Tên nhóm, bảng màu & giao diện, Toast', icon: Palette, iconColor: 'text-indigo-500', activeColor: 'border-indigo-600 text-indigo-700 bg-indigo-50' },
  { id: 'notice', label: 'Nội Quy Hoạt Động', sublabel: 'Quy chế & điều khoản quỹ', icon: ScrollText, iconColor: 'text-emerald-500', activeColor: 'border-emerald-600 text-emerald-700 bg-emerald-50' },
  { id: 'permissions', label: 'Phân Quyền Thành Viên', sublabel: 'Bảo mật & quyền hiển thị', icon: Sliders, iconColor: 'text-purple-500', activeColor: 'border-purple-600 text-purple-700 bg-purple-50' },
  { id: 'security', label: 'Bảo Mật & Mật Khẩu', sublabel: 'Mật khẩu Admin & Thành viên', icon: KeyRound, iconColor: 'text-amber-500', activeColor: 'border-amber-600 text-amber-700 bg-amber-50' },
  { id: 'bank', label: 'Tài Khoản & VietQR', sublabel: 'STK ngân hàng nhận tiền', icon: Building2, iconColor: 'text-teal-500', activeColor: 'border-teal-600 text-teal-700 bg-teal-50' },
  { id: 'categories', label: 'Danh Mục Thu Chi', sublabel: 'Phân loại thu & chi', icon: Tag, iconColor: 'text-rose-500', activeColor: 'border-rose-600 text-rose-700 bg-rose-50' },
  { id: 'language', label: 'Tùy Chỉnh Câu Chữ', sublabel: 'Toàn bộ từ ngữ & từ điển ứng dụng', icon: Languages, iconColor: 'text-sky-500', activeColor: 'border-sky-600 text-sky-700 bg-sky-50' },
  { id: 'backup', label: 'Sao Lưu & Đồng Bộ', sublabel: 'Cloud Firestore & JSON', icon: Cloud, iconColor: 'text-blue-500', activeColor: 'border-blue-600 text-blue-700 bg-blue-50' },
  { id: 'all', label: 'Tất Cả Cài Đặt', sublabel: 'Xem toàn bộ', icon: Sliders, iconColor: 'text-slate-500', activeColor: 'border-slate-800 text-slate-900 bg-slate-100' },
];

export const SettingsTab: React.FC<SettingsTabProps> = ({
  bankSettings,
  onUpdateBankSettings,
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onExportAllData,
  onImportAllData,
  onForceSyncToCloud,
  onForcePullFromCloud,
  onTestCloudConnection,
  cloudSyncStatus = 'connected',
  lastCloudSyncTime,
  cloudLatency,
  adminPassword = 'admin',
  onUpdateAdminPassword,
  memberPassword = '123',
  onUpdateMemberPassword,
  groupNotice,
  onUpdateGroupNotice,
  branding = INITIAL_BRANDING,
  onUpdateBranding,
  viewPermissions = INITIAL_VIEW_PERMISSIONS,
  onUpdateViewPermissions,
}) => {
  const { t } = useTranslation();
  const { showConfirm, showToast, toastPosition, setToastPosition } = useFeedback();

  // Cloud Diagnostics state
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [pingResult, setPingResult] = useState<{ success: boolean; latencyMs: number; error?: string } | null>(null);
  const [isCloudDataSourceModalOpen, setIsCloudDataSourceModalOpen] = useState(false);
  const savedCustomFirebase = getSavedCustomFirebaseConfig();

  const handleRunPingTest = async () => {
    if (!onTestCloudConnection) return;
    setIsTestingPing(true);
    try {
      const res = await onTestCloudConnection();
      setPingResult(res);
    } catch (err: any) {
      setPingResult({ success: false, latencyMs: 0, error: err?.message || 'Lỗi không xác định' });
    } finally {
      setIsTestingPing(false);
    }
  };

  // Active sub-tab in sidebar (desktop, tablet, mobile)
  const [activeSubTab, setActiveSubTab] = useState<SettingSubTab>('branding');

  // App Branding state
  const [appTitle, setAppTitle] = useState(branding.appTitle || 'Quản Lý Quỹ');
  const [appSubtitle, setAppSubtitle] = useState(branding.appSubtitle || 'Sổ thu chi & đóng quỹ minh bạch');
  const [treasurerName, setTreasurerName] = useState(branding.treasurerName || 'Thủ Quỹ Ban Đại Diện');
  const [treasurerPhone, setTreasurerPhone] = useState(branding.treasurerPhone || '0988.888.888');
  const [transferSyntaxPrefix, setTransferSyntaxPrefix] = useState(branding.transferSyntaxPrefix || 'NOP QUY');
  const [groupEmoji, setGroupEmoji] = useState(branding.groupEmoji || '💼');

  // Sync branding when props change from Cloud Firestore
  useEffect(() => {
    if (branding) {
      setAppTitle(branding.appTitle || 'Quản Lý Quỹ');
      setAppSubtitle(branding.appSubtitle || 'Sổ thu chi & đóng quỹ minh bạch');
      setTreasurerName(branding.treasurerName || 'Thủ Quỹ Ban Đại Diện');
      setTreasurerPhone(branding.treasurerPhone || '0988.888.888');
      setTransferSyntaxPrefix(branding.transferSyntaxPrefix || 'NOP QUY');
      setGroupEmoji(branding.groupEmoji || '💼');
    }
  }, [branding]);

  // Theme state from ThemeContext
  const {
    themeAccent,
    setThemeAccent,
    customColor,
    setCustomColor,
    defaultThemeMode,
    setDefaultThemeMode,
    themeRadius,
    setThemeRadius,
    themeDensity,
    setThemeDensity,
    activePreset,
    setIsCustomizerOpen,
    resetToDefaultTheme,
    revertToSavedTheme,
  } = useTheme();

  // Selected default theme mode for access, configured in Settings
  const [selectedDefaultTheme, setSelectedDefaultTheme] = useState<ThemeMode>(() => {
    return branding?.themeMode || defaultThemeMode || 'light';
  });

  // Sync selectedDefaultTheme when branding updates
  useEffect(() => {
    if (branding?.themeMode) {
      setSelectedDefaultTheme(branding.themeMode);
    }
  }, [branding?.themeMode]);

  // Toast Position state - stored in draft state until user clicks Save
  const savedToastPosition = (branding?.toastPosition || toastPosition || 'top-center') as ToastPosition;
  const [draftToastPosition, setDraftToastPosition] = useState<ToastPosition>(savedToastPosition);

  // Sync draftToastPosition when props change
  useEffect(() => {
    if (branding?.toastPosition) {
      setDraftToastPosition(branding.toastPosition);
    } else if (toastPosition) {
      setDraftToastPosition(toastPosition);
    }
  }, [branding?.toastPosition, toastPosition]);

  const [customHexInput, setCustomHexInput] = useState(customColor);
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  // Bank form state
  const [bankId, setBankId] = useState(bankSettings.bankId || 'MB');
  const [accountNumber, setAccountNumber] = useState(bankSettings.accountNumber || '');
  const [accountName, setAccountName] = useState(bankSettings.accountName || '');
  const [qrTemplate, setQrTemplate] = useState(bankSettings.qrTemplate || 'compact');

  // Sync bank settings when props change from Cloud Firestore
  useEffect(() => {
    if (bankSettings) {
      setBankId(bankSettings.bankId || 'MB');
      setAccountNumber(bankSettings.accountNumber || '');
      setAccountName(bankSettings.accountName || '');
      setQrTemplate(bankSettings.qrTemplate || 'compact');
    }
  }, [bankSettings]);

  // Group Notice (Rules) state
  const [noticeEnabled, setNoticeEnabled] = useState(groupNotice?.enabled ?? true);
  const [noticeTitle, setNoticeTitle] = useState(groupNotice?.title || '');
  const [noticeContent, setNoticeContent] = useState(groupNotice?.content || '');
  const [noticeType, setNoticeType] = useState<'info' | 'warning' | 'success'>(groupNotice?.type || 'info');
  const [noticeUpdatedAt, setNoticeUpdatedAt] = useState(groupNotice?.updatedAt || '2026-08-28');

  // Sync group notice when props change from Cloud Firestore
  useEffect(() => {
    if (groupNotice) {
      setNoticeEnabled(groupNotice.enabled ?? true);
      setNoticeTitle(groupNotice.title || '');
      setNoticeContent(groupNotice.content || '');
      setNoticeType(groupNotice.type || 'info');
      setNoticeUpdatedAt(groupNotice.updatedAt || '2026-08-28');
    }
  }, [groupNotice]);

  // Admin Password change state
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showAdminPassValue, setShowAdminPassValue] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  // Member Password change state
  const [newMemberPassInput, setNewMemberPassInput] = useState('');
  const [confirmMemberPassInput, setConfirmMemberPassInput] = useState('');
  const [showNewMemberPass, setShowNewMemberPass] = useState(false);
  const [showMemberPassValue, setShowMemberPassValue] = useState(false);
  const [memberPassError, setMemberPassError] = useState('');
  const [memberPassSuccess, setMemberPassSuccess] = useState('');

  // New Category state
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'income' | 'expense'>('expense');
  const [newCatColor, setNewCatColor] = useState('#3B82F6');
  const [catError, setCatError] = useState('');
  const [catFilter, setCatFilter] = useState<'all' | 'income' | 'expense'>('all');

  // Editing Category state
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatType, setEditCatType] = useState<'income' | 'expense'>('expense');
  const [editCatColor, setEditCatColor] = useState('#3B82F6');
  const [editCatError, setEditCatError] = useState('');

  const handleStartEditCat = (cat: Category) => {
    setEditingCatId(cat.id);
    setEditCatName(cat.name);
    setEditCatType(cat.type);
    setEditCatColor(cat.color || (cat.type === 'income' ? '#10B981' : '#EF4444'));
    setEditCatError('');
  };

  const handleCancelEditCat = () => {
    setEditingCatId(null);
    setEditCatName('');
    setEditCatError('');
  };

  const handleSaveEditCat = (catId: string) => {
    if (!editCatName.trim()) {
      setEditCatError('Vui lòng nhập tên danh mục');
      return;
    }
    const originalCat = categories.find(c => c.id === catId);
    if (onUpdateCategory && originalCat) {
      onUpdateCategory({
        ...originalCat,
        name: editCatName.trim(),
        type: editCatType,
        color: editCatColor,
        icon: editCatType === 'income' ? 'PlusCircle' : 'MinusCircle',
      });
    }
    setEditingCatId(null);
    setEditCatName('');
    setEditCatError('');
  };

  // Member View Permissions state
  const [perms, setPerms] = useState<MemberViewPermissions>(viewPermissions || INITIAL_VIEW_PERMISSIONS);

  useEffect(() => {
    if (viewPermissions) {
      setPerms(viewPermissions);
    }
  }, [viewPermissions]);

  // Toggle local draft state ONLY - NO auto-save!
  const handleTogglePerm = (key: keyof MemberViewPermissions) => {
    setPerms((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleToggleAllPerms = (enabled: boolean) => {
    setPerms({
      showNotice: enabled,
      showCampaigns: enabled,
      showExpenseStructure: enabled,
      showFullLedger: enabled,
      allowPublicPrint: enabled,
      allowQuickQR: enabled,
    });
  };

  const handleResetPerms = () => {
    if (viewPermissions) {
      setPerms(viewPermissions);
      showToast('Đã hủy thay đổi phân quyền!', 'info');
    }
  };

  const handleResetNotice = () => {
    if (groupNotice) {
      setNoticeEnabled(groupNotice.enabled !== false);
      setNoticeTitle(groupNotice.title || 'Nội quy & Quy định hoạt động quỹ');
      setNoticeContent(groupNotice.content || '');
      setNoticeType(groupNotice.type || 'info');
      setNoticeUpdatedAt(groupNotice.updatedAt || '2026-08-28');
      showToast('Đã hủy thay đổi nội quy!', 'info');
    }
  };

  // Dirty state tracking to detect unsaved changes across all configuration sections
  const isBrandingDirty =
    appTitle.trim() !== (branding.appTitle || 'Quản Lý Quỹ').trim() ||
    appSubtitle.trim() !== (branding.appSubtitle || 'Sổ thu chi & đóng quỹ minh bạch').trim() ||
    treasurerName.trim() !== (branding.treasurerName || 'Thủ Quỹ Ban Đại Diện').trim() ||
    treasurerPhone.trim() !== (branding.treasurerPhone || '0988.888.888').trim() ||
    transferSyntaxPrefix.trim().toUpperCase() !== (branding.transferSyntaxPrefix || 'NOP QUY').trim().toUpperCase() ||
    groupEmoji.trim() !== (branding.groupEmoji || '💼').trim();

  const savedAccent = (branding.themeAccent === 'blue' ? 'emerald' : branding.themeAccent) || 'emerald';
  const savedCustomColor = branding.customColor || '#059669';
  const savedThemeMode = branding.themeMode || 'light';
  const savedThemeRadius = branding.themeRadius || 'modern';
  const savedThemeDensity = branding.themeDensity || 'comfortable';

  const isThemeDirty =
    themeAccent !== savedAccent ||
    (themeAccent === 'custom' && customColor !== savedCustomColor) ||
    selectedDefaultTheme !== savedThemeMode ||
    themeRadius !== savedThemeRadius ||
    themeDensity !== savedThemeDensity;

  const isThemeDirtyRef = useRef(isThemeDirty);
  isThemeDirtyRef.current = isThemeDirty;
  const brandingRef = useRef(branding);
  brandingRef.current = branding;

  // Auto-revert previewed theme if user navigates away from settings tab without saving
  useEffect(() => {
    return () => {
      if (isThemeDirtyRef.current) {
        revertToSavedTheme(brandingRef.current);
      }
    };
  }, [revertToSavedTheme]);

  const isBankDirty =
    bankId !== (bankSettings.bankId || 'MB') ||
    accountNumber.trim() !== (bankSettings.accountNumber || '').trim() ||
    accountName.trim().toUpperCase() !== (bankSettings.accountName || '').trim().toUpperCase() ||
    qrTemplate !== (bankSettings.qrTemplate || 'compact');

  const isNoticeDirty =
    noticeEnabled !== (groupNotice?.enabled ?? true) ||
    noticeTitle.trim() !== (groupNotice?.title || '').trim() ||
    noticeContent.trim() !== (groupNotice?.content || '').trim() ||
    noticeType !== (groupNotice?.type || 'info') ||
    noticeUpdatedAt !== (groupNotice?.updatedAt || '2026-08-28');

  const isPermsDirty =
    Boolean(perms.showNotice) !== Boolean(viewPermissions?.showNotice ?? true) ||
    Boolean(perms.showCampaigns) !== Boolean(viewPermissions?.showCampaigns ?? true) ||
    Boolean(perms.showExpenseStructure) !== Boolean(viewPermissions?.showExpenseStructure ?? true) ||
    Boolean(perms.showFullLedger) !== Boolean(viewPermissions?.showFullLedger ?? true) ||
    Boolean(perms.allowPublicPrint) !== Boolean(viewPermissions?.allowPublicPrint ?? true) ||
    Boolean(perms.allowQuickQR) !== Boolean(viewPermissions?.allowQuickQR ?? true);

  const isToastPositionDirty = draftToastPosition !== savedToastPosition;

  const hasUnsavedChanges = isBrandingDirty || isThemeDirty || isBankDirty || isNoticeDirty || isPermsDirty || isToastPositionDirty;
  const dirtyCount = [isBrandingDirty, isThemeDirty, isBankDirty, isNoticeDirty, isPermsDirty, isToastPositionDirty].filter(Boolean).length;

  const getTabDirty = (tabId: SettingSubTab): boolean => {
    switch (tabId) {
      case 'branding':
        return isBrandingDirty || isThemeDirty || isToastPositionDirty;
      case 'notice':
        return isNoticeDirty;
      case 'permissions':
        return isPermsDirty;
      case 'bank':
        return isBankDirty;
      case 'all':
        return hasUnsavedChanges;
      default:
        return false;
    }
  };

  // Unified Save All Handler - commits all modified settings in one atomic update
  const handleSaveAllSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    isThemeDirtyRef.current = false;

    // 1. Save Branding & Theme
    const updatedBranding: AppBranding = {
      ...branding,
      appTitle: appTitle.trim() || 'Quản Lý Quỹ',
      appSubtitle: appSubtitle.trim(),
      treasurerName: treasurerName.trim(),
      treasurerPhone: treasurerPhone.trim(),
      transferSyntaxPrefix: transferSyntaxPrefix.trim().toUpperCase() || 'NOP QUY',
      groupEmoji: groupEmoji.trim() || '💼',
      themeAccent,
      customColor: themeAccent === 'custom' ? customColor : undefined,
      themeMode: selectedDefaultTheme,
      themeRadius,
      themeDensity,
      toastPosition: draftToastPosition,
    };
    onUpdateBranding(updatedBranding);
    setToastPosition(draftToastPosition);

    // 2. Save Bank Settings
    const bankObj = VIETNAMESE_BANKS.find(b => b.id === bankId);
    onUpdateBankSettings({
      bankId,
      bankName: bankObj ? bankObj.name : bankId,
      accountNumber: accountNumber.trim(),
      accountName: accountName.trim().toUpperCase(),
      qrTemplate,
    });

    // 3. Save Group Notice
    onUpdateGroupNotice({
      enabled: noticeEnabled,
      title: noticeTitle.trim() || 'Nội quy & Quy định hoạt động quỹ',
      content: noticeContent.trim(),
      type: noticeType,
      updatedAt: noticeUpdatedAt || new Date().toISOString().split('T')[0],
    });

    // 4. Save View Permissions
    onUpdateViewPermissions(perms);

    showToast('Đã lưu và đồng bộ toàn bộ cài đặt thành công!', 'success', 'Cài Đặt Hệ Thống');
    setIsSavedRecently(true);

    setTimeout(() => {
      setIsSavedRecently(false);
    }, 2500);
  };

  // Discard all pending changes across all sections & revert theme preview
  const handleDiscardAll = () => {
    // Revert Branding
    if (branding) {
      setAppTitle(branding.appTitle || 'Quản Lý Quỹ');
      setAppSubtitle(branding.appSubtitle || 'Sổ thu chi & đóng quỹ minh bạch');
      setTreasurerName(branding.treasurerName || 'Thủ Quỹ Ban Đại Diện');
      setTreasurerPhone(branding.treasurerPhone || '0988.888.888');
      setTransferSyntaxPrefix(branding.transferSyntaxPrefix || 'NOP QUY');
      setGroupEmoji(branding.groupEmoji || '💼');
      setSelectedDefaultTheme(branding.themeMode || 'light');
      setDraftToastPosition((branding.toastPosition || 'top-center') as ToastPosition);

      // Revert theme preview back to saved branding configuration
      revertToSavedTheme(branding);
    } else {
      setDraftToastPosition(savedToastPosition);
    }

    // Revert Bank
    if (bankSettings) {
      setBankId(bankSettings.bankId || 'MB');
      setAccountNumber(bankSettings.accountNumber || '');
      setAccountName(bankSettings.accountName || '');
      setQrTemplate(bankSettings.qrTemplate || 'compact');
    }

    // Revert Notice
    if (groupNotice) {
      setNoticeEnabled(groupNotice.enabled !== false);
      setNoticeTitle(groupNotice.title || 'Nội quy & Quy định hoạt động quỹ');
      setNoticeContent(groupNotice.content || '');
      setNoticeType(groupNotice.type || 'info');
      setNoticeUpdatedAt(groupNotice.updatedAt || '2026-08-28');
    }

    // Revert Permissions
    if (viewPermissions) {
      setPerms(viewPermissions);
    }

    showToast('Đã hủy bỏ toàn bộ thay đổi chưa lưu!', 'info', 'Khôi Phục Cài Đặt');
  };

  const handleSavePerms = (e: React.FormEvent) => {
    handleSaveAllSettings(e);
  };

  const handleSaveBranding = (e: React.FormEvent) => {
    handleSaveAllSettings(e);
  };

  const handleResetBranding = () => {
    if (branding) {
      setAppTitle(branding.appTitle || 'Quản Lý Quỹ');
      setAppSubtitle(branding.appSubtitle || 'Sổ thu chi & đóng quỹ minh bạch');
      setTreasurerName(branding.treasurerName || 'Thủ Quỹ Ban Đại Diện');
      setTreasurerPhone(branding.treasurerPhone || '0988.888.888');
      setTransferSyntaxPrefix(branding.transferSyntaxPrefix || 'NOP QUY');
      setGroupEmoji(branding.groupEmoji || '💼');
      setSelectedDefaultTheme(branding.themeMode || 'light');
      setDraftToastPosition((branding.toastPosition || 'top-center') as ToastPosition);
      revertToSavedTheme(branding);
      showToast('Đã hủy thay đổi nhận diện & giao diện!', 'info');
    } else {
      setDraftToastPosition(savedToastPosition);
    }
  };

  const handleResetBank = () => {
    if (bankSettings) {
      setBankId(bankSettings.bankId || 'MB');
      setAccountNumber(bankSettings.accountNumber || '');
      setAccountName(bankSettings.accountName || '');
      setQrTemplate(bankSettings.qrTemplate || 'compact');
      showToast('Đã hủy thay đổi tài khoản ngân hàng!', 'info');
    }
  };

  const handleApplyBrandingPreset = (preset: 'class' | 'company' | 'club' | 'family' | 'travel') => {
    if (preset === 'class') {
      setAppTitle('Quỹ Lớp Học & Bạn Bè');
      setAppSubtitle('Sổ quỹ lớp học, liên hoan và sự kiện');
      setTransferSyntaxPrefix('LOP');
      setGroupEmoji('🏫');
      setTreasurerName('Lớp Trưởng / Thủ Quỹ');
    } else if (preset === 'company') {
      setAppTitle('Quỹ Team Kỹ Thuật');
      setAppSubtitle('Minh bạch thu chi liên hoan & teambuilding');
      setTransferSyntaxPrefix('TEAM');
      setGroupEmoji('💼');
      setTreasurerName('Thủ Quỹ Team');
    } else if (preset === 'club') {
      setAppTitle('Quỹ Câu Lạc Bộ Thể Thao');
      setAppSubtitle('Đóng quỹ & chi phí sân bãi thi đấu');
      setTransferSyntaxPrefix('CLB');
      setGroupEmoji('⚽');
      setTreasurerName('Ban Quản Lý CLB');
    } else if (preset === 'family') {
      setAppTitle('Quỹ Gia Đình & Dòng Họ');
      setAppSubtitle('Gắn kết tình thân, hiếu hỉ tương thân tương ái');
      setTransferSyntaxPrefix('GD');
      setGroupEmoji('🏡');
      setTreasurerName('Đại Diện Gia Đình');
    } else if (preset === 'travel') {
      setAppTitle('Quỹ Đi Phượt & Du Lịch');
      setAppSubtitle('Chia tiền ăn ở, xăng xe và trải nghiệm tour');
      setTransferSyntaxPrefix('TOUR');
      setGroupEmoji('✈️');
      setTreasurerName('Trưởng Đoàn Du Lịch');
    }
  };

  const handleSaveBank = (e: React.FormEvent) => {
    handleSaveAllSettings(e);
  };

  const handleSaveNotice = (e: React.FormEvent) => {
    handleSaveAllSettings(e);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    const newPass = newPassInput.trim();
    const confirmPass = confirmPassInput.trim();

    if (newPass.length < 4) {
      setPassError('Mật khẩu mới phải có tối thiểu 4 ký tự');
      return;
    }

    if (newPass !== confirmPass) {
      setPassError('Xác nhận mật khẩu mới không khớp');
      return;
    }

    onUpdateAdminPassword(newPass);
    showToast('Đã đổi mật khẩu Quản trị viên thành công và đồng bộ!', 'success');
    setPassSuccess('Đã đổi mật khẩu Quản trị viên thành công!');
    setNewPassInput('');
    setConfirmPassInput('');
    setTimeout(() => setPassSuccess(''), 3000);
  };

  const handleResetAdminPasswordToDefault = () => {
    showConfirm({
      title: 'Khôi phục mật khẩu Quản trị viên',
      message: 'Bạn có chắc chắn muốn đặt lại mật khẩu Quản trị viên về mặc định "admin"?',
      confirmText: 'Khôi phục "admin"',
      type: 'warning',
      onConfirm: () => {
        onUpdateAdminPassword('admin');
        showToast('Đã khôi phục mật khẩu Quản trị viên về mặc định (admin)!', 'success');
        setPassError('');
        setPassSuccess('Đã khôi phục về "admin"');
        setNewPassInput('');
        setConfirmPassInput('');
        setTimeout(() => setPassSuccess(''), 3000);
      },
    });
  };

  const handleChangeMemberPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setMemberPassError('');
    setMemberPassSuccess('');

    const newPass = newMemberPassInput.trim();
    const confirmPass = confirmMemberPassInput.trim();

    if (newPass.length < 3) {
      setMemberPassError('Mật khẩu Thành viên mới phải có tối thiểu 3 ký tự');
      return;
    }

    if (newPass !== confirmPass) {
      setMemberPassError('Xác nhận mật khẩu Thành viên mới không khớp');
      return;
    }

    if (onUpdateMemberPassword) {
      onUpdateMemberPassword(newPass);
    }
    showToast('Đã đổi mật khẩu Thành viên thành công và đồng bộ!', 'success');
    setMemberPassSuccess('Đã đổi mật khẩu Thành viên thành công!');
    setNewMemberPassInput('');
    setConfirmMemberPassInput('');
    setTimeout(() => setMemberPassSuccess(''), 3000);
  };

  const handleResetMemberPasswordToDefault = () => {
    showConfirm({
      title: 'Khôi phục mật khẩu Thành viên',
      message: 'Bạn có chắc chắn muốn đặt lại mật khẩu Thành viên về mặc định "123"?',
      confirmText: 'Khôi phục "123"',
      type: 'warning',
      onConfirm: () => {
        if (onUpdateMemberPassword) {
          onUpdateMemberPassword('123');
        }
        showToast('Đã khôi phục mật khẩu Thành viên về mặc định (123)!', 'success');
        setMemberPassError('');
        setMemberPassSuccess('Đã khôi phục về "123"');
        setNewMemberPassInput('');
        setConfirmMemberPassInput('');
        setTimeout(() => setMemberPassSuccess(''), 3000);
      },
    });
  };

  const handleCopyPassword = (pass: string, roleName: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(pass);
    }
    showToast(`Đã sao chép mật khẩu ${roleName} (${pass})!`, 'info');
  };

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      setCatError('Vui lòng nhập tên danh mục');
      return;
    }

    onAddCategory({
      name: newCatName.trim(),
      type: newCatType,
      color: newCatColor,
      icon: newCatType === 'income' ? 'PlusCircle' : 'MinusCircle',
    });

    setNewCatName('');
    setCatError('');
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        onImportAllData(text);
        alert('Nhập dữ liệu sao lưu thành công!');
      } catch (err) {
        alert('Tệp dữ liệu không hợp lệ!');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div id="settings-tab-content" className={`space-y-5 sm:space-y-6 ${hasUnsavedChanges ? 'pb-36 sm:pb-28' : 'pb-24 sm:pb-16'}`}>
      {/* Header Info Banner & Master Status (Natural static flow, never collides with Navbar) */}
      <div className="relative bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
        <div className="flex items-center gap-3.5 min-w-0">
          <div
            style={{
              background: activePreset.gradient,
              boxShadow: `0 4px 14px ${activePreset.primary}35`,
            }}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-white shrink-0"
          >
            <Sliders className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight truncate">
                Cài Đặt Hệ Thống
              </h2>
              {hasUnsavedChanges ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse shrink-0">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>{dirtyCount} mục chưa lưu</span>
                </span>
              ) : isSavedRecently ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0">
                  <Check className="w-3.5 h-3.5" />
                  <span>Đã đồng bộ</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span>Hệ thống ổn định</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
              Cá nhân hóa tên sổ quỹ, tài khoản VietQR, giao diện màu sắc, quy chế và phân quyền
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Horizontal Category Tabs Bar (Clean scrollable pills, non-sticky) */}
      <div className="md:hidden relative w-full overflow-x-auto no-scrollbar py-1 -mx-1 px-1 flex items-center gap-1.5">
        {SETTING_NAV_ITEMS.map((tab) => {
          const isActive = activeSubTab === tab.id;
          const isDirty = getTabDirty(tab.id);
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              style={isActive ? {
                backgroundColor: activePreset.primary,
                boxShadow: `0 2px 8px ${activePreset.primary}35`,
              } : undefined}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                isActive
                  ? 'text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {isDirty && (
                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Main 2-Column Layout: Left Vertical Sidebar (Desktop & Tablet) + Right Settings Content */}
      <div className="flex flex-col md:flex-row gap-5 lg:gap-6 items-start">
        {/* Left Vertical Navigation Menu (Desktop & Tablet: md+) */}
        <aside className="hidden md:block w-56 lg:w-64 shrink-0 bg-white dark:bg-slate-900 p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs md:sticky md:top-20 space-y-1">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1 flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Danh Mục Cài Đặt
            </span>
            {hasUnsavedChanges && (
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                {dirtyCount} chưa lưu
              </span>
            )}
          </div>

          {SETTING_NAV_ITEMS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            const isDirty = getTabDirty(tab.id);
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id)}
                style={isActive ? {
                  backgroundColor: `${activePreset.primary}15`,
                  color: activePreset.primary,
                  borderLeftColor: activePreset.primary,
                } : undefined}
                className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all text-left cursor-pointer ${
                  isActive
                    ? 'font-extrabold shadow-2xs border-l-4'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className="w-4 h-4 shrink-0 transition-colors"
                    style={isActive ? { color: activePreset.primary } : undefined}
                  />
                  <div className="truncate">
                    <div className="truncate flex items-center gap-1.5">
                      <span>{tab.label}</span>
                      {isDirty && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Có thay đổi chưa lưu" />
                      )}
                    </div>
                    <div className="text-[10px] font-normal text-slate-400 truncate">{tab.sublabel}</div>
                  </div>
                </div>
                {isActive && (
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0 ml-1"
                    style={{ backgroundColor: activePreset.primary }}
                  />
                )}
              </button>
            );
          })}
        </aside>

        {/* Right Settings Content Area */}
        <div className="flex-1 min-w-0 w-full space-y-6">
          {/* Grid Container for Cards */}
          <div className={activeSubTab === 'all' ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : "w-full space-y-6"}>
            {/* 1. APP BRANDING & TITLE PERSONALIZATION CARD */}
            {(activeSubTab === 'branding' || activeSubTab === 'all') && (
            <div id="settings-branding" className="scroll-mt-28 sm:scroll-mt-24 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                    style={{
                      backgroundColor: activePreset.primary,
                      boxShadow: `0 2px 10px ${activePreset.primary}35`,
                    }}
                  >
                    <Type className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Cá nhân hóa tên & tiêu đề ứng dụng</span>
                      {isBrandingDirty && (
                        <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                          Chưa lưu
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500">Đổi tên nhóm, khẩu hiệu và tiêu đề trang thành viên</p>
                  </div>
                </div>
              </div>

                  <form onSubmit={handleSaveBranding} className="space-y-3.5 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-3">
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Tên Ứng Dụng / Tên Nhóm (Hiển thị trên Navbar & Logo)
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="VD: Quỹ Lớp 12A1, Quỹ Team Dev..."
                          value={appTitle}
                          onChange={(e) => setAppTitle(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Biểu Tượng
                        </label>
                        <input
                          type="text"
                          value={groupEmoji}
                          onChange={(e) => setGroupEmoji(e.target.value)}
                          className="w-full px-3 py-2 text-center rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-base focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    {/* Quick Emoji selection */}
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">Chọn nhanh biểu tượng:</span>
                      <div className="flex flex-wrap gap-1">
                        {['💼', '🏫', '⚽', '🏡', '🎓', '✈️', '💰', '⭐', '🔥', '🏆', '🍕', '☕', '🎮', '🚗'].map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setGroupEmoji(emoji)}
                            style={groupEmoji === emoji ? {
                              backgroundColor: activePreset.primary,
                              boxShadow: `0 4px 12px ${activePreset.primary}40`,
                            } : undefined}
                            className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all cursor-pointer ${
                              groupEmoji === emoji
                                ? 'text-white shadow-xs scale-110'
                                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Khẩu hiệu / Phụ đề Nhóm
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Sổ thu chi & đóng quỹ minh bạch..."
                        value={appSubtitle}
                        onChange={(e) => setAppSubtitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Tên Thủ Quỹ / Người Đại Diện
                        </label>
                        <input
                          type="text"
                          placeholder="VD: Nguyễn Văn A (Thủ Quỹ)"
                          value={treasurerName}
                          onChange={(e) => setTreasurerName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          SĐT Liên Hệ
                        </label>
                        <input
                          type="text"
                          placeholder="VD: 0988.888.888"
                          value={treasurerPhone}
                          onChange={(e) => setTreasurerPhone(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Tiền tố Cú Pháp Chuyển Khoản Mặc Định
                      </label>
                      <input
                        type="text"
                        placeholder="VD: NOPQUY, DONGQUY, LOP12A..."
                        value={transferSyntaxPrefix}
                        onChange={(e) => setTransferSyntaxPrefix(e.target.value.toUpperCase())}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">
                        Cú pháp sinh mã QR VietQR sẽ tự động nối: [Tiền tố] [Tên người nộp]
                      </p>
                    </div>

                    {/* Live Preview Box for Branding */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                          Xem trước thanh nhận diện (Live Preview)
                        </span>
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${activePreset.primary}15`,
                            color: activePreset.primary,
                          }}
                        >
                          Mô phỏng thực tế
                        </span>
                      </div>
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-2xl shrink-0 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl">{groupEmoji || '💰'}</span>
                          <div className="min-w-0">
                            <div className="font-black text-sm text-slate-900 dark:text-white truncate">{appTitle || 'Sổ Quỹ Nhóm'}</div>
                            <div className="text-[11px] text-slate-500 truncate">{appSubtitle || 'Sổ thu chi & đóng quỹ minh bạch'}</div>
                          </div>
                        </div>
                        {(treasurerName || transferSyntaxPrefix) && (
                          <div className="text-left sm:text-right shrink-0">
                            <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                              {treasurerName || 'Thủ Quỹ'} {treasurerPhone ? `(${treasurerPhone})` : ''}
                            </div>
                            <div
                              className="text-[10px] font-mono font-bold px-2 py-0.5 rounded mt-0.5 inline-block"
                              style={{
                                backgroundColor: `${activePreset.primary}15`,
                                color: activePreset.primary,
                              }}
                            >
                              {transferSyntaxPrefix || 'NOPQUY'} [TEN THANH VIEN]
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Hidden submit button to support pressing Enter key */}
                    <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
                  </form>
                </div>
              )}

              {/* 1.2 THEME & COLOR PALETTE CUSTOMIZER CARD */}
              {(activeSubTab === 'branding' || activeSubTab === 'all') && (
                <div id="settings-theme" className="scroll-mt-28 sm:scroll-mt-24 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm transition-all duration-300 shrink-0"
                        style={{ background: activePreset.gradient }}
                      >
                        <Palette className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                          <span>Bảng Màu & Giao Diện Ứng Dụng</span>
                          <span
                            className="px-2 py-0.5 rounded-full text-[11px] font-bold border"
                            style={{
                              backgroundColor: activePreset.primaryLight,
                              color: activePreset.primaryText,
                              borderColor: activePreset.primaryBorder,
                            }}
                          >
                            {activePreset.name}
                          </span>
                        </h3>
                        <p className="text-xs text-slate-500">Tùy biến bảng màu thương hiệu, chế độ Sáng / Tối, độ bo góc và mật độ giao diện</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsCustomizerOpen(true)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer shadow-2xs shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5" style={{ color: activePreset.primary }} />
                      <span>Studio Xem Trước Nâng Cao</span>
                    </button>
                  </div>

                  {/* 1. Color Palette Presets */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Palette className="w-3.5 h-3.5 text-slate-500" />
                        <span>1. Tông Màu Chủ Đạo (Theme Palettes)</span>
                      </label>
                      <span className="text-[11px] text-slate-500 hidden sm:inline">
                        {THEME_PRESETS.length} màu chuẩn + Mã HEX tự chọn
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {THEME_PRESETS.map((preset) => {
                        const isSelected = themeAccent === preset.id;
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setThemeAccent(preset.id)}
                            className={`text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-2.5 cursor-pointer ${
                              isSelected
                                ? 'border-2 shadow-sm ring-1'
                                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/60'
                            }`}
                            style={{
                              borderColor: isSelected ? preset.primary : undefined,
                              boxShadow: isSelected ? `0 0 0 2px ${preset.primaryLight}` : undefined,
                            }}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-xs shrink-0 text-xs"
                                style={{ background: preset.gradient }}
                              >
                                {preset.sampleEmoji}
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-xs text-slate-800 dark:text-slate-100 block truncate">
                                  {preset.name}
                                </span>
                                <span className="text-[10px] text-slate-500 block truncate">
                                  {preset.tagline}
                                </span>
                              </div>
                            </div>
                            {isSelected && (
                              <div
                                className="w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0"
                                style={{ backgroundColor: preset.primary }}
                              >
                                <Check className="w-3 h-3" />
                              </div>
                            )}
                          </button>
                        );
                      })}

                      {/* Custom Hex Card */}
                      <div
                        className={`p-3 rounded-xl border transition-all ${
                          themeAccent === 'custom'
                            ? 'border-2 shadow-sm ring-1'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60'
                        }`}
                        style={{
                          borderColor: themeAccent === 'custom' ? customColor : undefined,
                        }}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={customColor}
                              onChange={(e) => {
                                setCustomColor(e.target.value);
                                setCustomHexInput(e.target.value);
                                setThemeAccent('custom');
                              }}
                              className="w-7 h-7 rounded-lg border-0 cursor-pointer shrink-0 p-0"
                              title="Chọn màu sắc tùy ý"
                            />
                            <span className="font-bold text-xs text-slate-800 dark:text-slate-100">
                              Mã Màu Tự Chọn
                            </span>
                          </div>
                          {themeAccent === 'custom' && (
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0"
                              style={{ backgroundColor: customColor }}
                            >
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                        <input
                          type="text"
                          value={customHexInput}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomHexInput(val);
                            if (/^#[0-9A-F]{6}$/i.test(val)) {
                              setCustomColor(val);
                              setThemeAccent('custom');
                            }
                          }}
                          placeholder="#10B981"
                          className="w-full px-2.5 py-1 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 uppercase"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 2. Theme Mode Default upon Access */}
                  <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Sun className="w-3.5 h-3.5 text-amber-500" />
                        <span>2. Giao Diện Mặc Định Khi Truy Cập</span>
                      </label>
                      <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/80 shrink-0 w-fit">
                        Mặc định khi truy cập
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Thiết lập chế độ hiển thị mặc định (Sáng / Tối / Tự động) khi người dùng bắt đầu truy cập ứng dụng. Sau khi truy cập, người dùng có thể đổi nhanh sáng/tối trên thanh Header mà không làm thay đổi thiết lập mặc định này.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {[
                        { id: 'light' as ThemeMode, name: 'Sáng (Light)', icon: Sun, desc: 'Mặc định nền trắng sáng khi mở app' },
                        { id: 'dark' as ThemeMode, name: 'Tối (Dark)', icon: Moon, desc: 'Mặc định nền tối bảo vệ mắt khi mở app' },
                        { id: 'system' as ThemeMode, name: 'Hệ thống (Auto)', icon: Laptop, desc: 'Mặc định tự động theo thiết bị người dùng' },
                      ].map((item) => {
                        const isSelected = selectedDefaultTheme === item.id;
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setSelectedDefaultTheme(item.id);
                              setDefaultThemeMode(item.id);
                            }}
                            className={`p-3 rounded-xl border text-center transition-all cursor-pointer relative ${
                              isSelected
                                ? 'border-2 shadow-xs ring-1 bg-white dark:bg-slate-800 font-bold'
                                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                            }`}
                            style={{
                              borderColor: isSelected ? activePreset.primary : undefined,
                            }}
                          >
                            {isSelected && (
                              <span 
                                style={{ backgroundColor: activePreset.primary }}
                                className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full"
                              />
                            )}
                            <div className="flex flex-col items-center gap-1.5">
                              <Icon
                                className="w-5 h-5"
                                style={{ color: isSelected ? activePreset.primary : undefined }}
                              />
                              <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">
                                {item.name}
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                {item.desc}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Radius & Density */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {/* Radius */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                        3. Độ Bo Góc (Corner Radius)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {RADIUS_OPTIONS.map((opt) => {
                          const isSelected = themeRadius === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setThemeRadius(opt.id)}
                              className={`px-3 py-2 border text-left transition-all cursor-pointer ${opt.pillRadius} ${
                                isSelected
                                  ? 'border-2 shadow-xs bg-white dark:bg-slate-800 font-bold'
                                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                              }`}
                              style={{
                                borderColor: isSelected ? activePreset.primary : undefined,
                                color: isSelected ? activePreset.primary : undefined,
                              }}
                            >
                              <span className="text-xs block font-semibold">{opt.name}</span>
                              <span className="text-[10px] text-slate-500 block truncate">{opt.desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Density */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                        4. Mật Độ Hiển Thị (Density)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'comfortable' as ThemeDensity, name: 'Thoáng Đãng', desc: 'Rộng rãi, dễ đọc và chạm' },
                          { id: 'compact' as ThemeDensity, name: 'Gọn Gàng', desc: 'Mật độ cao, hiển thị nhiều dữ liệu' },
                        ].map((item) => {
                          const isSelected = themeDensity === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setThemeDensity(item.id)}
                              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-2 shadow-xs bg-white dark:bg-slate-800 font-bold'
                                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                              }`}
                              style={{
                                borderColor: isSelected ? activePreset.primary : undefined,
                                color: isSelected ? activePreset.primary : undefined,
                              }}
                            >
                              <span className="text-xs block font-semibold">{item.name}</span>
                              <span className="text-[10px] text-slate-500 block truncate">{item.desc}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Reset to Default */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        resetToDefaultTheme();
                        showToast('Đã đặt lại giao diện về thiết lập mặc định của hệ thống', 'info', 'Khôi Phục');
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer w-full sm:w-auto justify-center transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Khôi phục mặc định</span>
                    </button>

                    {isThemeDirty && (
                      <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium text-center sm:text-right">
                        Đang xem trước màu mới • Bấm &quot;Lưu cài đặt&quot; ở trên để áp dụng
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* 1.1 TOAST NOTIFICATION POSITION CARD */}
              {(activeSubTab === 'branding' || activeSubTab === 'all') && (
                <div id="settings-toast" className="scroll-mt-28 sm:scroll-mt-24 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        style={{
                          backgroundColor: activePreset.primary,
                          boxShadow: `0 2px 10px ${activePreset.primary}35`,
                        }}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                      >
                        <Bell className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <span>Vị trí hiển thị Thông báo (Toast Notification)</span>
                          {isToastPositionDirty && (
                            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                              Chưa lưu
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-slate-500">
                          Tùy chỉnh góc xuất hiện của thông báo phản hồi thao tác. Thay đổi sẽ áp dụng sau khi bấm Lưu.
                        </p>
                      </div>
                    </div>

                    {isToastPositionDirty && (
                      <button
                        type="button"
                        onClick={() => setDraftToastPosition(savedToastPosition)}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
                      >
                        Khôi phục ban đầu
                      </button>
                    )}
                  </div>

                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span>Chọn vị trí hiển thị mong muốn:</span>
                      {isToastPositionDirty && (
                        <span className="text-[11px] text-amber-600 dark:text-amber-400 font-normal">
                          Đã chọn vị trí mới • Bấm &quot;Lưu ngay&quot; để áp dụng
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Option 1: Top Center */}
                      <button
                        type="button"
                        onClick={() => setDraftToastPosition('top-center')}
                        style={
                          draftToastPosition === 'top-center'
                            ? {
                                borderColor: activePreset.primary,
                                backgroundColor: `${activePreset.primary}0d`,
                                boxShadow: `0 0 0 2px ${activePreset.primary}25`,
                              }
                            : undefined
                        }
                        className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                          draftToastPosition === 'top-center'
                            ? 'text-slate-900 dark:text-white'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-xs font-bold flex items-center gap-1.5">
                            <span
                              style={draftToastPosition === 'top-center' ? { backgroundColor: activePreset.primary } : undefined}
                              className={`w-2.5 h-2.5 rounded-full inline-block ${draftToastPosition === 'top-center' ? '' : 'bg-slate-300 dark:bg-slate-600'}`}
                            />
                            🎯 Trên - Chính Giữa
                          </span>
                          {draftToastPosition === 'top-center' ? (
                            <span
                              style={{
                                backgroundColor: isToastPositionDirty ? '#fef3c7' : `${activePreset.primary}18`,
                                color: isToastPositionDirty ? '#b45309' : activePreset.primary,
                              }}
                              className="text-[10px] px-1.5 py-0.5 rounded-md font-bold"
                            >
                              {isToastPositionDirty ? 'Chờ lưu' : 'Đang áp dụng'}
                            </span>
                          ) : savedToastPosition === 'top-center' ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                              Đang dùng
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                              Mặc định tối ưu
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                          Cân đối trực diện, không che các nút góc phải (Theme, Ngôn ngữ, Menu, Nút X đóng cửa sổ).
                        </p>
                      </button>

                      {/* Option 2: Top Right */}
                      <button
                        type="button"
                        onClick={() => setDraftToastPosition('top-right')}
                        style={
                          draftToastPosition === 'top-right'
                            ? {
                                borderColor: activePreset.primary,
                                backgroundColor: `${activePreset.primary}0d`,
                                boxShadow: `0 0 0 2px ${activePreset.primary}25`,
                              }
                            : undefined
                        }
                        className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                          draftToastPosition === 'top-right'
                            ? 'text-slate-900 dark:text-white'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-xs font-bold flex items-center gap-1.5">
                            <span
                              style={draftToastPosition === 'top-right' ? { backgroundColor: activePreset.primary } : undefined}
                              className={`w-2.5 h-2.5 rounded-full inline-block ${draftToastPosition === 'top-right' ? '' : 'bg-slate-300 dark:bg-slate-600'}`}
                            />
                            ↗️ Trên - Góc Phải
                          </span>
                          {draftToastPosition === 'top-right' ? (
                            <span
                              style={{
                                backgroundColor: isToastPositionDirty ? '#fef3c7' : `${activePreset.primary}18`,
                                color: isToastPositionDirty ? '#b45309' : activePreset.primary,
                              }}
                              className="text-[10px] px-1.5 py-0.5 rounded-md font-bold"
                            >
                              {isToastPositionDirty ? 'Chờ lưu' : 'Đang áp dụng'}
                            </span>
                          ) : savedToastPosition === 'top-right' ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                              Đang dùng
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                          Góc trên bên phải màn hình theo kiểu website truyền thống.
                        </p>
                      </button>

                      {/* Option 3: Bottom Center */}
                      <button
                        type="button"
                        onClick={() => setDraftToastPosition('bottom-center')}
                        style={
                          draftToastPosition === 'bottom-center'
                            ? {
                                borderColor: activePreset.primary,
                                backgroundColor: `${activePreset.primary}0d`,
                                boxShadow: `0 0 0 2px ${activePreset.primary}25`,
                              }
                            : undefined
                        }
                        className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                          draftToastPosition === 'bottom-center'
                            ? 'text-slate-900 dark:text-white'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-xs font-bold flex items-center gap-1.5">
                            <span
                              style={draftToastPosition === 'bottom-center' ? { backgroundColor: activePreset.primary } : undefined}
                              className={`w-2.5 h-2.5 rounded-full inline-block ${draftToastPosition === 'bottom-center' ? '' : 'bg-slate-300 dark:bg-slate-600'}`}
                            />
                            ⬇️ Dưới - Chính Giữa
                          </span>
                          {draftToastPosition === 'bottom-center' ? (
                            <span
                              style={{
                                backgroundColor: isToastPositionDirty ? '#fef3c7' : `${activePreset.primary}18`,
                                color: isToastPositionDirty ? '#b45309' : activePreset.primary,
                              }}
                              className="text-[10px] px-1.5 py-0.5 rounded-md font-bold"
                            >
                              {isToastPositionDirty ? 'Chờ lưu' : 'Đang áp dụng'}
                            </span>
                          ) : savedToastPosition === 'bottom-center' ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                              Đang dùng
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                              Di động tiện lợi
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                          Phù hợp khi dùng điện thoại, nằm ngay tầm mắt và dễ dàng quan sát.
                        </p>
                      </button>

                      {/* Option 4: Bottom Right */}
                      <button
                        type="button"
                        onClick={() => setDraftToastPosition('bottom-right')}
                        style={
                          draftToastPosition === 'bottom-right'
                            ? {
                                borderColor: activePreset.primary,
                                backgroundColor: `${activePreset.primary}0d`,
                                boxShadow: `0 0 0 2px ${activePreset.primary}25`,
                              }
                            : undefined
                        }
                        className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                          draftToastPosition === 'bottom-right'
                            ? 'text-slate-900 dark:text-white'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-xs font-bold flex items-center gap-1.5">
                            <span
                              style={draftToastPosition === 'bottom-right' ? { backgroundColor: activePreset.primary } : undefined}
                              className={`w-2.5 h-2.5 rounded-full inline-block ${draftToastPosition === 'bottom-right' ? '' : 'bg-slate-300 dark:bg-slate-600'}`}
                            />
                            ↘️ Dưới - Góc Phải
                          </span>
                          {draftToastPosition === 'bottom-right' ? (
                            <span
                              style={{
                                backgroundColor: isToastPositionDirty ? '#fef3c7' : `${activePreset.primary}18`,
                                color: isToastPositionDirty ? '#b45309' : activePreset.primary,
                              }}
                              className="text-[10px] px-1.5 py-0.5 rounded-md font-bold"
                            >
                              {isToastPositionDirty ? 'Chờ lưu' : 'Đang áp dụng'}
                            </span>
                          ) : savedToastPosition === 'bottom-right' ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                              Đang dùng
                            </span>
                          ) : null}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                          Góc dưới bên phải màn hình theo phong cách dashboard phần mềm.
                        </p>
                      </button>
                    </div>

                    {/* Interactive Test Buttons */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between flex-wrap gap-1.5 mb-2">
                        <span className="text-[11px] font-semibold text-slate-500">
                          Bấm thử nghiệm thông báo tại vị trí hiện tại:
                        </span>
                        {isToastPositionDirty && (
                          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                            Vị trí mới sẽ có hiệu lực ngay sau khi bấm &quot;Lưu ngay&quot;
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => showToast('Giao dịch của bạn đã được ghi sổ thành công!', 'success', 'Thành Công')}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900 transition-colors cursor-pointer border border-emerald-200 dark:border-emerald-800"
                        >
                          ✓ Thử Thành Công
                        </button>
                        <button
                          type="button"
                          onClick={() => showToast('Số dư quỹ sắp chạm hạn mức tối thiểu.', 'warning', 'Cảnh Báo')}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900 transition-colors cursor-pointer border border-amber-200 dark:border-amber-800"
                        >
                          ⚠ Thử Cảnh Báo
                        </button>
                        <button
                          type="button"
                          onClick={() => showToast('Không thể kết nối đến máy chủ, vui lòng thử lại.', 'error', 'Thông Báo Lỗi')}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900 transition-colors cursor-pointer border border-rose-200 dark:border-rose-800"
                        >
                          ✕ Thử Báo Lỗi
                        </button>
                        <button
                          type="button"
                          onClick={() => showToast('Đang đồng bộ dữ liệu với máy chủ đám mây...', 'info', 'Thông Tin')}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors cursor-pointer border border-blue-200 dark:border-blue-800"
                        >
                          ℹ Thử Thông Tin
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 dark:text-slate-500 pt-1">
                      💡 <strong>Tính năng mới:</strong> Thanh đếm ngược hiển thị thời gian còn lại. Khi rê chuột qua hoặc nhấn giữ thông báo, thời gian sẽ tự động tạm dừng để bạn đọc trọn vẹn thông tin!
                    </p>
                  </div>
                </div>
              )}

            {/* 3. GROUP RULES & CHARTER BOARD (BẢNG NỘI QUY HOẠT ĐỘNG) */}
            {(activeSubTab === 'notice' || activeSubTab === 'all') && (
              <div id="settings-notice" className="scroll-mt-28 sm:scroll-mt-24 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      style={{
                        backgroundColor: activePreset.primary,
                        boxShadow: `0 2px 10px ${activePreset.primary}35`,
                      }}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                    >
                      <ScrollText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Bảng Nội Quy & Quy Định Hoạt Động Quỹ</span>
                        {isNoticeDirty && (
                          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                            Chưa lưu
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-500">Quy chế hoạt động cố định hiển thị ở đầu trang</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSaveNotice} className="space-y-3.5 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Tiêu đề nội quy
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="VD: Nội quy hoạt động quỹ..."
                        value={noticeTitle}
                        onChange={(e) => setNoticeTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-(--theme-primary) focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" style={{ color: activePreset.primary }} />
                        <span>Ngày áp dụng / Cập nhật</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={noticeUpdatedAt}
                        onChange={(e) => setNoticeUpdatedAt(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-(--theme-primary) focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Nội dung các điều khoản quy định hoạt động
                    </label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Nhập từng điều khoản quy định hoạt động, mức đóng góp, nguyên tắc thu chi minh bạch..."
                      value={noticeContent}
                      onChange={(e) => setNoticeContent(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-(--theme-primary) focus:outline-hidden leading-relaxed"
                    />
                  </div>

                  {/* Live Preview Box for Notice */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Xem trước bảng quy chế (Live Preview)
                      </span>
                      <span
                        style={{
                          backgroundColor: activePreset.primary,
                          color: '#ffffff',
                          boxShadow: `0 2px 8px ${activePreset.primary}30`,
                        }}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                      >
                        Hiển thị trang chủ
                      </span>
                    </div>
                    <div
                      style={{
                        background: `linear-gradient(135deg, ${activePreset.primary}12 0%, ${activePreset.primary}05 100%)`,
                        borderColor: `${activePreset.primary}35`,
                      }}
                      className="p-4 rounded-xl border space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2.5">
                          <div
                            style={{
                              backgroundColor: activePreset.primary,
                              boxShadow: `0 2px 8px ${activePreset.primary}35`,
                            }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
                          >
                            <ScrollText className="w-3.5 h-3.5 text-white" />
                          </div>
                          <h4
                            style={{ color: activePreset.primary }}
                            className="font-bold text-xs sm:text-sm tracking-tight"
                          >
                            {noticeTitle || 'Nội quy & Quy định hoạt động'}
                          </h4>
                        </div>
                        <span
                          style={{ color: activePreset.primary }}
                          className="text-[10px] font-semibold opacity-90"
                        >
                          Áp dụng từ: {noticeUpdatedAt || 'Hôm nay'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed sm:pl-9.5">
                        {noticeContent || 'Nội dung quy định hoạt động quỹ...'}
                      </p>
                    </div>
                  </div>

                  {/* Hidden submit button to support pressing Enter */}
                  <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
                </form>
              </div>
            )}

            {/* 4. MEMBER VIEW PERMISSIONS & VISIBILITY CONTROL */}
            {(activeSubTab === 'permissions' || activeSubTab === 'all') && (
              <div id="settings-permissions" className={`scroll-mt-28 sm:scroll-mt-24 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 ${activeSubTab === 'all' ? 'lg:col-span-2' : ''}`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        style={{
                          backgroundColor: activePreset.primary,
                          boxShadow: `0 2px 10px ${activePreset.primary}35`,
                        }}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                      >
                        <Sliders className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <span>Phân Quyền Người Xem (Thành Viên)</span>
                          {isPermsDirty && (
                            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                              Chưa lưu
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-slate-500">
                          Kiểm soát các phần nội dung mà người xem/thành viên được phép thấy
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => handleToggleAllPerms(true)}
                        style={{
                          backgroundColor: activePreset.primary,
                          boxShadow: `0 2px 8px ${activePreset.primary}35`,
                        }}
                        className="px-3 py-1 rounded-lg text-white font-bold text-[11px] transition-all cursor-pointer hover:brightness-110 active:scale-95 shadow-2xs flex items-center gap-1"
                      >
                        Bật tất cả
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleAllPerms(false)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-[11px] transition-colors cursor-pointer"
                      >
                        Tắt tất cả
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleSavePerms} className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {/* Perm 1: Group Rules / Notice Board */}
                      <div
                        onClick={() => handleTogglePerm('showNotice')}
                        style={perms.showNotice ? { backgroundColor: `${activePreset.primary}0D`, borderColor: `${activePreset.primary}33` } : undefined}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                          perms.showNotice
                            ? 'shadow-2xs'
                            : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                        } hover:opacity-90 hover:shadow-xs`}
                      >
                        <div className="flex items-center gap-3 pr-2">
                          <div
                            style={perms.showNotice ? {
                              backgroundColor: `${activePreset.primary}18`,
                              color: activePreset.primary,
                            } : undefined}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              perms.showNotice ? '' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}
                          >
                            <ScrollText className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                1. Bảng Thông Báo / Nội Quy Hoạt Động
                              </span>
                              <span
                                style={perms.showNotice ? {
                                  backgroundColor: activePreset.primary,
                                  boxShadow: `0 1px 6px ${activePreset.primary}35`,
                                } : undefined}
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                  perms.showNotice
                                    ? 'text-white'
                                    : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                }`}
                              >
                                {perms.showNotice ? 'Đang bật' : 'Đã tắt'}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-600 dark:text-slate-400 block mt-0.5">
                              Hiển thị khung nội quy & quy chế quỹ ở đầu trang thành viên
                            </span>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0 pointer-events-none">
                          <input
                            type="checkbox"
                            checked={perms.showNotice}
                            onChange={() => {}}
                            className="sr-only peer"
                          />
                          <div
                            style={perms.showNotice ? { backgroundColor: activePreset.primary } : undefined}
                            className={`w-9 h-5 rounded-full peer peer-focus:outline-hidden peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 ${
                              perms.showNotice ? '' : 'bg-slate-200 dark:bg-slate-700'
                            }`}
                          ></div>
                        </label>
                      </div>

                      {/* Perm 2: Active Campaigns */}
                      <div
                        onClick={() => handleTogglePerm('showCampaigns')}
                        style={perms.showCampaigns ? { backgroundColor: `${activePreset.primary}0D`, borderColor: `${activePreset.primary}33` } : undefined}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                          perms.showCampaigns
                            ? 'shadow-2xs'
                            : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                        } hover:opacity-90 hover:shadow-xs`}
                      >
                        <div className="flex items-center gap-3 pr-2">
                          <div
                            style={perms.showCampaigns ? {
                              backgroundColor: `${activePreset.primary}18`,
                              color: activePreset.primary,
                            } : undefined}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              perms.showCampaigns ? '' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}
                          >
                            <Target className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                2. Đợt Đóng Quỹ Đang Diễn Ra
                              </span>
                              <span
                                style={perms.showCampaigns ? {
                                  backgroundColor: activePreset.primary,
                                  boxShadow: `0 1px 6px ${activePreset.primary}35`,
                                } : undefined}
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                  perms.showCampaigns
                                    ? 'text-white'
                                    : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                }`}
                              >
                                {perms.showCampaigns ? 'Đang bật' : 'Đã tắt'}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-600 dark:text-slate-400 block mt-0.5">
                              Hiển thị các chiến dịch thu tiền, hạn nộp, tỷ lệ hoàn thành
                            </span>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0 pointer-events-none">
                          <input
                            type="checkbox"
                            checked={perms.showCampaigns}
                            onChange={() => {}}
                            className="sr-only peer"
                          />
                          <div
                            style={perms.showCampaigns ? { backgroundColor: activePreset.primary } : undefined}
                            className={`w-9 h-5 rounded-full peer peer-focus:outline-hidden peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 ${
                              perms.showCampaigns ? '' : 'bg-slate-200 dark:bg-slate-700'
                            }`}
                          ></div>
                        </label>
                      </div>

                      {/* Perm 3: Financial Visualization Charts */}
                      <div
                        onClick={() => handleTogglePerm('showExpenseStructure')}
                        style={perms.showExpenseStructure ? { backgroundColor: `${activePreset.primary}0D`, borderColor: `${activePreset.primary}33` } : undefined}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                          perms.showExpenseStructure
                            ? 'shadow-2xs'
                            : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                        } hover:opacity-90 hover:shadow-xs`}
                      >
                        <div className="flex items-center gap-3 pr-2">
                          <div
                            style={perms.showExpenseStructure ? {
                              backgroundColor: `${activePreset.primary}18`,
                              color: activePreset.primary,
                            } : undefined}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              perms.showExpenseStructure ? '' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}
                          >
                            <PieIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                3. Biểu Đồ Trực Quan Hóa Thu Chi
                              </span>
                              <span
                                style={perms.showExpenseStructure ? {
                                  backgroundColor: activePreset.primary,
                                  boxShadow: `0 1px 6px ${activePreset.primary}35`,
                                } : undefined}
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                  perms.showExpenseStructure
                                    ? 'text-white'
                                    : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                }`}
                              >
                                {perms.showExpenseStructure ? 'Đang bật' : 'Đã tắt'}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-600 dark:text-slate-400 block mt-0.5">
                              Biểu đồ trực quan theo tháng, theo năm và phân bổ tỷ trọng
                            </span>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0 pointer-events-none">
                          <input
                            type="checkbox"
                            checked={perms.showExpenseStructure}
                            onChange={() => {}}
                            className="sr-only peer"
                          />
                          <div
                            style={perms.showExpenseStructure ? { backgroundColor: activePreset.primary } : undefined}
                            className={`w-9 h-5 rounded-full peer peer-focus:outline-hidden peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 ${
                              perms.showExpenseStructure ? '' : 'bg-slate-200 dark:bg-slate-700'
                            }`}
                          ></div>
                        </label>
                      </div>

                      {/* Perm 4: Full Transaction Ledger */}
                      <div
                        onClick={() => handleTogglePerm('showFullLedger')}
                        style={perms.showFullLedger ? { backgroundColor: `${activePreset.primary}0D`, borderColor: `${activePreset.primary}33` } : undefined}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                          perms.showFullLedger
                            ? 'shadow-2xs'
                            : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                        } hover:opacity-90 hover:shadow-xs`}
                      >
                        <div className="flex items-center gap-3 pr-2">
                          <div
                            style={perms.showFullLedger ? {
                              backgroundColor: `${activePreset.primary}18`,
                              color: activePreset.primary,
                            } : undefined}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              perms.showFullLedger ? '' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}
                          >
                            <Tag className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                4. Sổ Chi Tiết Toàn Bộ Giao Dịch
                              </span>
                              <span
                                style={perms.showFullLedger ? {
                                  backgroundColor: activePreset.primary,
                                  boxShadow: `0 1px 6px ${activePreset.primary}35`,
                                } : undefined}
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                  perms.showFullLedger
                                    ? 'text-white'
                                    : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                }`}
                              >
                                {perms.showFullLedger ? 'Đang bật' : 'Đã tắt'}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-600 dark:text-slate-400 block mt-0.5">
                              Cho phép thành viên xem toàn bộ lịch sử chi tiết
                            </span>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0 pointer-events-none">
                          <input
                            type="checkbox"
                            checked={perms.showFullLedger}
                            onChange={() => {}}
                            className="sr-only peer"
                          />
                          <div
                            style={perms.showFullLedger ? { backgroundColor: activePreset.primary } : undefined}
                            className={`w-9 h-5 rounded-full peer peer-focus:outline-hidden peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 ${
                              perms.showFullLedger ? '' : 'bg-slate-200 dark:bg-slate-700'
                            }`}
                          ></div>
                        </label>
                      </div>

                      {/* Perm 5: Public Print & Export */}
                      <div
                        onClick={() => handleTogglePerm('allowPublicPrint')}
                        style={perms.allowPublicPrint ? { backgroundColor: `${activePreset.primary}0D`, borderColor: `${activePreset.primary}33` } : undefined}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                          perms.allowPublicPrint
                            ? 'shadow-2xs'
                            : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                        } hover:opacity-90 hover:shadow-xs`}
                      >
                        <div className="flex items-center gap-3 pr-2">
                          <div
                            style={perms.allowPublicPrint ? {
                              backgroundColor: `${activePreset.primary}18`,
                              color: activePreset.primary,
                            } : undefined}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              perms.allowPublicPrint ? '' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}
                          >
                            <Download className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                5. Nút In & Xuất Báo Cáo Sao Kê
                              </span>
                              <span
                                style={perms.allowPublicPrint ? {
                                  backgroundColor: activePreset.primary,
                                  boxShadow: `0 1px 6px ${activePreset.primary}35`,
                                } : undefined}
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                  perms.allowPublicPrint
                                    ? 'text-white'
                                    : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                }`}
                              >
                                {perms.allowPublicPrint ? 'Đang bật' : 'Đã tắt'}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-600 dark:text-slate-400 block mt-0.5">
                              Cho phép thành viên in ấn báo cáo tài chính PDF
                            </span>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0 pointer-events-none">
                          <input
                            type="checkbox"
                            checked={perms.allowPublicPrint}
                            onChange={() => {}}
                            className="sr-only peer"
                          />
                          <div
                            style={perms.allowPublicPrint ? { backgroundColor: activePreset.primary } : undefined}
                            className={`w-9 h-5 rounded-full peer peer-focus:outline-hidden peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 ${
                              perms.allowPublicPrint ? '' : 'bg-slate-200 dark:bg-slate-700'
                            }`}
                          ></div>
                        </label>
                      </div>

                      {/* Perm 6: Quick QR Contribution */}
                      <div
                        onClick={() => handleTogglePerm('allowQuickQR')}
                        style={perms.allowQuickQR ? { backgroundColor: `${activePreset.primary}0D`, borderColor: `${activePreset.primary}33` } : undefined}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                          perms.allowQuickQR
                            ? 'shadow-2xs'
                            : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                        } hover:opacity-90 hover:shadow-xs`}
                      >
                        <div className="flex items-center gap-3 pr-2">
                          <div
                            style={perms.allowQuickQR ? {
                              backgroundColor: `${activePreset.primary}18`,
                              color: activePreset.primary,
                            } : undefined}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              perms.allowQuickQR ? '' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}
                          >
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                6. Nút Quét Mã VietQR Chuyển Khoản
                              </span>
                              <span
                                style={perms.allowQuickQR ? {
                                  backgroundColor: activePreset.primary,
                                  boxShadow: `0 1px 6px ${activePreset.primary}35`,
                                } : undefined}
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                  perms.allowQuickQR
                                    ? 'text-white'
                                    : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                }`}
                              >
                                {perms.allowQuickQR ? 'Đang bật' : 'Đã tắt'}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-600 dark:text-slate-400 block mt-0.5">
                              Hiển thị nút quét mã VietQR tự sinh kèm cú pháp
                            </span>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer shrink-0 pointer-events-none">
                          <input
                            type="checkbox"
                            checked={perms.allowQuickQR}
                            onChange={() => {}}
                            className="sr-only peer"
                          />
                          <div
                            style={perms.allowQuickQR ? { backgroundColor: activePreset.primary } : undefined}
                            className={`w-9 h-5 rounded-full peer peer-focus:outline-hidden peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 ${
                              perms.allowQuickQR ? '' : 'bg-slate-200 dark:bg-slate-700'
                            }`}
                          ></div>
                        </label>
                      </div>
                    </div>

                    {/* Hidden submit button to support form submit */}
                    <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
                  </form>
                </div>
            )}

            {/* 5. SECURITY & PASSWORDS CARD */}
            {(activeSubTab === 'security' || activeSubTab === 'all') && (
              <div id="settings-security" className="scroll-mt-28 sm:scroll-mt-24 space-y-5">
                {/* Information Header */}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex items-start gap-3">
                  <div
                    style={{
                      backgroundColor: `${activePreset.primary}15`,
                      color: activePreset.primary,
                    }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  >
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <h4 className="font-bold text-slate-900 dark:text-white">
                      Cơ Chế Phân Quyền 2 Mật Khẩu Độc Lập
                    </h4>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      Hệ thống hoạt động với 2 mật khẩu riêng biệt: <strong>Mật khẩu Admin</strong> (toàn quyền quản lý, thêm/sửa/xóa thu chi, cấu hình) và <strong>Mật khẩu Thành viên</strong> (chỉ mở xem bảng minh bạch số dư, giao dịch, nộp quỹ VietQR và in sao kê).
                    </p>
                  </div>
                </div>

                {/* Card 1: Admin Password */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        style={{
                          backgroundColor: activePreset.primary,
                          boxShadow: `0 2px 10px ${activePreset.primary}35`,
                        }}
                        className="w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-sm shrink-0"
                      >
                        <KeyRound className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                          1. Mật Khẩu Quản Trị Viên (Admin)
                        </h3>
                        <p className="text-xs text-slate-500">Mã khóa mở toàn bộ quyền can thiệp dữ liệu và cài đặt hệ thống</p>
                      </div>
                    </div>
                  </div>

                  {/* Active Admin Password Display */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600">Mật khẩu Admin hiện tại:</span>
                      <span className="font-mono text-sm font-bold text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 tracking-wider">
                        {showAdminPassValue ? (adminPassword || 'admin') : '••••••••'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setShowAdminPassValue(!showAdminPassValue)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                        title={showAdminPassValue ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showAdminPassValue ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{showAdminPassValue ? 'Ẩn' : 'Hiện'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyPassword(adminPassword || 'admin', 'Admin')}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Sao chép mật khẩu Admin"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Sao chép</span>
                      </button>
                    </div>
                  </div>

                  {/* Change Admin Password Form */}
                  <form onSubmit={handleChangePassword} className="space-y-3.5 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Mật khẩu Admin mới
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPass ? 'text' : 'password'}
                            required
                            placeholder="Tối thiểu 4 ký tự..."
                            value={newPassInput}
                            onChange={(e) => setNewPassInput(e.target.value)}
                            className="w-full px-3 py-2 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPass(!showNewPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          >
                            {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Xác nhận mật khẩu Admin mới
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="Nhập lại mật khẩu Admin mới..."
                          value={confirmPassInput}
                          onChange={(e) => setConfirmPassInput(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    {passError && (
                      <p className="text-xs text-rose-500 font-medium">{passError}</p>
                    )}
                    {passSuccess && (
                      <p className="text-xs text-emerald-600 font-medium">{passSuccess}</p>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleResetAdminPasswordToDefault}
                        className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold text-xs transition-all cursor-pointer"
                        title="Đặt lại mật khẩu Admin về 'admin'"
                      >
                        Khôi phục về "admin"
                      </button>
                      <button
                        type="submit"
                        style={{
                          backgroundColor: activePreset.primary,
                          boxShadow: `0 2px 10px ${activePreset.primary}35`,
                        }}
                        className="flex-1 py-2.5 rounded-xl hover:brightness-110 active:scale-[0.99] text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <KeyRound className="w-4 h-4" />
                        <span>Cập nhật mật khẩu Admin</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Card 2: Member Password */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-sm"
                        style={{
                          backgroundColor: activePreset.primary,
                          boxShadow: `0 2px 10px ${activePreset.primary}35`,
                        }}
                      >
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                          2. Mật Khẩu Thành Viên (Chỉ Xem)
                        </h3>
                        <p className="text-xs text-slate-500">Mật khẩu cung cấp cho các thành viên trong nhóm để truy cập cổng tra cứu</p>
                      </div>
                    </div>
                  </div>

                  {/* Active Member Password Display */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Mật khẩu Thành viên hiện tại:</span>
                      <span
                        className="font-mono text-sm font-bold bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 tracking-wider"
                        style={{ color: activePreset.primary }}
                      >
                        {showMemberPassValue ? (memberPassword || '123') : '••••••'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setShowMemberPassValue(!showMemberPassValue)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                        title={showMemberPassValue ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showMemberPassValue ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{showMemberPassValue ? 'Ẩn' : 'Hiện'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyPassword(memberPassword || '123', 'Thành viên')}
                        style={{
                          backgroundColor: `${activePreset.primary}15`,
                          color: activePreset.primary,
                          borderColor: `${activePreset.primary}35`,
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border"
                        title="Sao chép mật khẩu gửi cho thành viên trong nhóm"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Sao chép</span>
                      </button>
                    </div>
                  </div>

                  {/* Change Member Password Form */}
                  <form onSubmit={handleChangeMemberPassword} className="space-y-3.5 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Mật khẩu Thành viên mới
                        </label>
                        <div className="relative">
                          <input
                            type={showNewMemberPass ? 'text' : 'password'}
                            required
                            placeholder="Tối thiểu 3 ký tự..."
                            value={newMemberPassInput}
                            onChange={(e) => setNewMemberPassInput(e.target.value)}
                            className="w-full px-3 py-2 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewMemberPass(!showNewMemberPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                          >
                            {showNewMemberPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Xác nhận mật khẩu Thành viên mới
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="Nhập lại mật khẩu Thành viên mới..."
                          value={confirmMemberPassInput}
                          onChange={(e) => setConfirmMemberPassInput(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    {memberPassError && (
                      <p className="text-xs text-rose-500 font-medium">{memberPassError}</p>
                    )}
                    {memberPassSuccess && (
                      <p className="text-xs text-emerald-600 font-medium">{memberPassSuccess}</p>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleResetMemberPasswordToDefault}
                        className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-semibold text-xs transition-all cursor-pointer"
                        title="Đặt lại mật khẩu Thành viên về '123'"
                      >
                        Khôi phục về "123"
                      </button>
                      <button
                        type="submit"
                        style={{
                          backgroundColor: activePreset.primary,
                          boxShadow: `0 2px 10px ${activePreset.primary}35`,
                        }}
                        className="flex-1 py-2.5 rounded-xl hover:brightness-110 active:scale-[0.99] text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Lock className="w-4 h-4" />
                        <span>Cập nhật mật khẩu Thành viên</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* 6. BANK ACCOUNT & VIETQR CARD */}
            {(activeSubTab === 'bank' || activeSubTab === 'all') && (
              <div id="settings-bank" className="scroll-mt-28 sm:scroll-mt-24 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      style={{
                        backgroundColor: activePreset.primary,
                        boxShadow: `0 2px 10px ${activePreset.primary}35`,
                      }}
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                    >
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Tài Khoản Ngân Hàng & VietQR</span>
                        {isBankDirty && (
                          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                            Chưa lưu
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-500">Thiết lập tài khoản nhận tiền để tự động tạo mã QR</p>
                    </div>
                  </div>
                  {isBankDirty && (
                    <button
                      type="button"
                      onClick={handleResetBank}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
                      title="Khôi phục lại thông tin tài khoản ban đầu"
                    >
                      Khôi phục
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveBank} className="space-y-3.5 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Ngân hàng thụ hưởng
                    </label>
                    <select
                      value={bankId}
                      onChange={(e) => setBankId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    >
                      {VIETNAMESE_BANKS.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.id} - {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Số tài khoản ngân hàng
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: 0988888888"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-(--theme-primary) focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Tên chủ tài khoản (Không dấu)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: NGUYEN VAN A"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase text-xs focus:ring-2 focus:ring-(--theme-primary) focus:outline-hidden"
                    />
                  </div>

                  {/* Live Preview VietQR Card */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                        Xem trước thẻ thụ hưởng (Live Preview)
                      </span>
                      <span
                        style={{
                          backgroundColor: activePreset.primary,
                          color: '#ffffff',
                          boxShadow: `0 2px 8px ${activePreset.primary}30`,
                        }}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                      >
                        Chuẩn VietQR
                      </span>
                    </div>
                    <div
                      style={{
                        background: `linear-gradient(135deg, ${activePreset.primary} 0%, ${activePreset.primaryHover || activePreset.primary} 100%)`,
                        boxShadow: `0 6px 20px ${activePreset.primary}40`,
                      }}
                      className="p-4 sm:p-5 rounded-2xl text-white shadow-md relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      {/* Decorative background glow */}
                      <div
                        className="absolute -right-10 -bottom-10 w-36 h-36 rounded-full blur-2xl opacity-30 pointer-events-none"
                        style={{ backgroundColor: '#ffffff' }}
                      />
                      <div className="space-y-2 z-10">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-white/90" />
                          <span className="text-xs font-bold uppercase tracking-wide text-white">
                            {VIETNAMESE_BANKS.find(b => b.id === bankId)?.name || bankId}
                          </span>
                        </div>
                        <div className="pt-1">
                          <span className="text-[10px] text-white/75 block uppercase font-semibold">Số tài khoản</span>
                          <span className="font-mono text-base sm:text-lg font-black tracking-wider text-white drop-shadow-xs">
                            {accountNumber || 'Chưa nhập số tài khoản'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-white/75 block uppercase font-semibold">Chủ tài khoản</span>
                          <span className="font-bold text-xs sm:text-sm tracking-wide text-white uppercase drop-shadow-xs">
                            {accountName || 'CHƯA NHẬP TÊN CHỦ TÀI KHOẢN'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 bg-white/15 backdrop-blur-md p-2.5 rounded-xl border border-white/20 shrink-0 self-start sm:self-auto z-10 shadow-xs">
                        <QrCode className="w-9 h-9 sm:w-10 sm:h-10 text-white" />
                        <div className="text-[10px] text-white leading-tight font-semibold">
                          Mã QR nộp quỹ<br />tự động sinh<br />chuẩn Napas247
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hidden submit button to support pressing Enter */}
                  <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
                </form>
              </div>
            )}

            {/* 7. BACKUP & CLOUD STORAGE */}
            {(activeSubTab === 'backup' || activeSubTab === 'all') && (
              <div id="settings-backup" className={`scroll-mt-28 sm:scroll-mt-24 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5 ${activeSubTab === 'all' ? 'lg:col-span-2' : ''}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                      style={{
                        backgroundColor: activePreset.primary,
                        boxShadow: `0 2px 10px ${activePreset.primary}35`,
                      }}
                    >
                      <Cloud className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                        <span>Đồng bộ đám mây & Quản lý dữ liệu</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                          cloudSyncStatus === 'connected'
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : cloudSyncStatus === 'syncing'
                            ? 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                            : 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            cloudSyncStatus === 'connected'
                              ? 'bg-emerald-500 animate-pulse'
                              : cloudSyncStatus === 'syncing'
                              ? 'bg-blue-500 animate-spin'
                              : 'bg-amber-500'
                          }`} />
                          {cloudSyncStatus === 'connected' ? 'Cloud Firestore Online' : cloudSyncStatus === 'syncing' ? 'Đang đồng bộ...' : 'Chế độ Cục bộ'}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Dữ liệu lưu trữ tập trung trên máy chủ Cloud Firestore – cập nhật tức thì trên mọi máy tính và điện thoại
                      </p>
                    </div>
                  </div>
                </div>

                {/* Cloud Status & Diagnostic Monitor Card */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4" style={{ color: activePreset.primary }} />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Thông Tin Hạ Tầng Máy Chủ Đám Mây
                      </span>
                    </div>
                    {onTestCloudConnection && (
                      <button
                        type="button"
                        onClick={handleRunPingTest}
                        disabled={isTestingPing}
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 text-[11px] font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer disabled:opacity-50"
                      >
                        <Zap className={`w-3 h-3 text-amber-500 ${isTestingPing ? 'animate-bounce' : ''}`} />
                        <span>{isTestingPing ? 'Đang kiểm tra...' : 'Kiểm tra kết nối (Ping Test)'}</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
                      <span className="text-[11px] text-slate-500 block">Cơ sở dữ liệu (Database)</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 text-[11px] truncate block" title="ai-studio-aecykh-da837c9f-f6d4-4ecc-8775-b97c31a3dc6c">
                        ai-studio-aecykh...
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
                      <span className="text-[11px] text-slate-500 block">Dự án (Project)</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 text-[11px] truncate block">
                        proverbial-volt-7fs6l
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
                      <span className="text-[11px] text-slate-500 block">Lần đồng bộ gần nhất</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 text-[11px] truncate block">
                        {lastCloudSyncTime || 'Tự động theo thời gian thực'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800">
                      <span className="text-[11px] text-slate-500 block">Độ trễ máy chủ (Latency)</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-[11px] flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        {pingResult?.latencyMs ? `${pingResult.latencyMs} ms` : cloudLatency ? `${cloudLatency} ms` : '< 50 ms (Cực nhanh)'}
                      </span>
                    </div>
                  </div>

                  {pingResult && (
                    <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                      pingResult.success
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    }`}>
                      {pingResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      )}
                      <span>
                        {pingResult.success
                          ? `Kết nối máy chủ Cloud Firestore hoàn hảo! Tốc độ phản hồi: ${pingResult.latencyMs}ms.`
                          : `Lỗi kết nối: ${pingResult.error}`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Cloud Action Buttons Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Change Cloud Data Source & Instructions Card */}
                  <div
                    style={{
                      backgroundColor: `${activePreset.primary}0D`,
                      borderColor: `${activePreset.primary}30`,
                    }}
                    className="p-3.5 rounded-xl border flex flex-col justify-between gap-3 sm:col-span-3 lg:col-span-1"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="font-bold text-xs flex items-center gap-1.5"
                          style={{ color: activePreset.primary }}
                        >
                          <Database className="w-3.5 h-3.5" style={{ color: activePreset.primary }} />
                          Nguồn Dữ Liệu Đám Mây
                        </span>
                        {savedCustomFirebase ? (
                          <span
                            style={{
                              backgroundColor: `${activePreset.primary}20`,
                              color: activePreset.primary,
                            }}
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                          >
                            Tùy chỉnh
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            Mặc định
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 block">
                        Đổi sang Firebase của riêng bạn hoặc kết nối Bot Zalo / Telegram / App khác.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCloudDataSourceModalOpen(true)}
                      style={{
                        backgroundColor: activePreset.primary,
                        boxShadow: `0 2px 10px ${activePreset.primary}35`,
                      }}
                      className="w-full py-2.5 rounded-xl hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Đổi Nguồn & Xem Hướng Dẫn</span>
                    </button>
                  </div>

                  {onForceSyncToCloud && (
                    <div
                      style={{ backgroundColor: `${activePreset.primary}0D`, borderColor: `${activePreset.primary}30` }}
                      className="p-3.5 rounded-xl border flex flex-col justify-between gap-3"
                    >
                      <div>
                        <span className="font-bold text-xs block flex items-center gap-1.5" style={{ color: activePreset.primary }}>
                          <Cloud className="w-3.5 h-3.5" style={{ color: activePreset.primary }} />
                          Đồng bộ dữ liệu lên Cloud
                        </span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 block">
                          Chủ động tải toàn bộ thu chi, quỹ và thành viên hiện tại lên Cloud Firestore để chia sẻ cho mọi người.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={onForceSyncToCloud}
                        style={{
                          backgroundColor: activePreset.primary,
                          boxShadow: `0 2px 10px ${activePreset.primary}35`,
                        }}
                        className="w-full py-2.5 rounded-xl hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Đẩy dữ liệu lên Cloud ngay</span>
                      </button>
                    </div>
                  )}

                  {onForcePullFromCloud && (
                    <div
                      style={{ backgroundColor: `${activePreset.primary}0D`, borderColor: `${activePreset.primary}30` }}
                      className="p-3.5 rounded-xl border flex flex-col justify-between gap-3"
                    >
                      <div>
                        <span className="font-bold text-xs block flex items-center gap-1.5" style={{ color: activePreset.primary }}>
                          <Download className="w-3.5 h-3.5" style={{ color: activePreset.primary }} />
                          Tải lại từ Cloud Firestore
                        </span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 block">
                          Kéo bản ghi mới nhất từ máy chủ về máy (hữu ích khi người khác vừa nhập liệu và bạn muốn làm mới).
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={onForcePullFromCloud}
                        style={{
                          backgroundColor: activePreset.primary,
                          boxShadow: `0 2px 10px ${activePreset.primary}35`,
                        }}
                        className="w-full py-2.5 rounded-xl hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Tải lại dữ liệu mới nhất</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Local JSON Files & Reset Period Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between gap-3">
                    <div>
                      <span className="font-bold text-xs text-slate-900 dark:text-white block flex items-center gap-1.5">
                        <Download className="w-3.5 h-3.5" style={{ color: activePreset.primary }} />
                        Xuất tệp sao lưu (JSON)
                      </span>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">
                        Tải về máy tính toàn bộ giao dịch, đợt thu, thành viên và cài đặt
                      </span>
                    </div>
                    <button
                      id="export-backup-json-btn"
                      onClick={onExportAllData}
                      style={{
                        backgroundColor: activePreset.primary,
                        boxShadow: `0 2px 10px ${activePreset.primary}35`,
                      }}
                      className="w-full py-2.5 rounded-xl hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Tải file sao lưu (.JSON)</span>
                    </button>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between gap-3">
                    <div>
                      <span className="font-bold text-xs text-slate-900 dark:text-white block">
                        Nhập dữ liệu từ tệp
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Khôi phục từ tệp JSON đã sao lưu trước đó
                      </span>
                    </div>
                    <label
                      style={{
                        borderColor: `${activePreset.primary}60`,
                        backgroundColor: `${activePreset.primary}0D`,
                        color: activePreset.primary,
                      }}
                      className="w-full py-2.5 rounded-xl border-2 border-dashed font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 shadow-xs hover:opacity-85 group"
                    >
                      <Upload className="w-4 h-4" style={{ color: activePreset.primary }} />
                      <span>Chọn file JSON khôi phục</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleFileImport}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 8. CATEGORIES MANAGEMENT */}
            {(activeSubTab === 'categories' || activeSubTab === 'all') && (
              <div id="settings-categories" className={`scroll-mt-28 sm:scroll-mt-24 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 ${activeSubTab === 'all' ? 'lg:col-span-2' : ''}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                      style={{
                        backgroundColor: activePreset.primary,
                        boxShadow: `0 2px 10px ${activePreset.primary}35`,
                      }}
                    >
                      <Tag className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        Quản lý danh mục thu & chi
                      </h3>
                      <p className="text-xs text-slate-500">Phân loại dòng tiền theo mục đích sử dụng (chỉnh sửa tên, loại thu/chi và màu sắc)</p>
                    </div>
                  </div>

                  {/* Filter Pills for Categories */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setCatFilter('all')}
                      style={catFilter === 'all' ? { color: activePreset.primary } : undefined}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        catFilter === 'all'
                          ? 'bg-white dark:bg-slate-700 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Tất cả ({categories.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setCatFilter('expense')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        catFilter === 'expense'
                          ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Khoản chi ({categories.filter(c => c.type === 'expense').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setCatFilter('income')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        catFilter === 'income'
                          ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Khoản thu ({categories.filter(c => c.type === 'income').length})
                    </button>
                  </div>
                </div>

                {/* Add new Category Form */}
                <form onSubmit={handleAddCategorySubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60">
                  <input
                    type="text"
                    placeholder="Tên danh mục mới (VD: Tiền điện, Mua quà, Tài trợ)..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                  />

                  <div className="flex items-center gap-2">
                    <select
                      value={newCatType}
                      onChange={(e) => setNewCatType(e.target.value as any)}
                      className="flex-1 sm:flex-initial px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    >
                      <option value="expense">Khoản chi (-)</option>
                      <option value="income">Khoản thu (+)</option>
                    </select>

                    <input
                      type="color"
                      value={newCatColor}
                      onChange={(e) => setNewCatColor(e.target.value)}
                      title="Chọn màu sắc đại diện"
                      className="w-9 h-9 p-0.5 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer shrink-0"
                    />

                    <button
                      type="submit"
                      style={{
                        backgroundColor: activePreset.primary,
                        boxShadow: `0 2px 10px ${activePreset.primary}35`,
                      }}
                      className="flex-1 sm:flex-initial px-4 py-2 rounded-lg hover:brightness-110 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm</span>
                    </button>
                  </div>
                </form>

                {catError && <p className="text-xs text-rose-500 font-medium">{catError}</p>}

                {/* Category List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                  {categories
                    .filter((c) => catFilter === 'all' || c.type === catFilter)
                    .map((c) => {
                      const isEditing = editingCatId === c.id;

                      if (isEditing) {
                        return (
                          <div
                            key={c.id}
                            style={{
                              borderColor: activePreset.primary,
                              backgroundColor: `${activePreset.primary}0D`,
                            }}
                            className="p-3 rounded-xl border-2 space-y-2.5 text-xs col-span-1 sm:col-span-2 lg:col-span-3 transition-all shadow-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className="font-bold text-xs flex items-center gap-1.5"
                                style={{ color: activePreset.primary }}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                Chỉnh sửa danh mục
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditCat(c.id)}
                                  style={{
                                    backgroundColor: activePreset.primary,
                                    boxShadow: `0 2px 8px ${activePreset.primary}35`,
                                  }}
                                  className="px-3 py-1 rounded-lg hover:brightness-110 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                                  title="Lưu thay đổi"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Lưu</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelEditCat}
                                  className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium text-xs flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Hủy"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Hủy</span>
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <input
                                type="text"
                                value={editCatName}
                                onChange={(e) => setEditCatName(e.target.value)}
                                placeholder="Tên danh mục..."
                                className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden"
                              />

                              <select
                                value={editCatType}
                                onChange={(e) => setEditCatType(e.target.value as any)}
                                className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:outline-hidden"
                              >
                                <option value="expense">Khoản chi (-)</option>
                                <option value="income">Khoản thu (+)</option>
                              </select>

                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={editCatColor}
                                  onChange={(e) => setEditCatColor(e.target.value)}
                                  className="w-8 h-8 p-0.5 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer"
                                />
                                <span className="text-[11px] text-slate-500 font-mono">{editCatColor}</span>
                              </div>
                            </div>

                            {editCatError && <p className="text-[11px] text-rose-500">{editCatError}</p>}
                          </div>
                        );
                      }

                      return (
                        <div
                          key={c.id}
                          className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-slate-300 dark:hover:border-slate-700 transition-all text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: c.color || (c.type === 'income' ? '#10B981' : '#EF4444') }}
                            />
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {c.name}
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                c.type === 'income'
                                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
                              }`}
                            >
                              {c.type === 'income' ? '+' : '-'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEditCat(c)}
                              title="Chỉnh sửa danh mục"
                              style={{
                                color: undefined,
                              }}
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                showConfirm({
                                  title: t('dialog.confirm_delete_title', 'Xác Nhận Xóa Dữ Liệu'),
                                  message: `${t('dialog.confirm_delete_category', 'Bạn có chắc chắn muốn xóa danh mục này?')}\n(${c.name})`,
                                  type: 'danger',
                                  confirmText: t('dialog.confirm_delete_btn', 'Đồng Ý Xóa'),
                                  cancelText: t('common.cancel', 'Hủy bỏ'),
                                  onConfirm: () => {
                                    onDeleteCategory(c.id);
                                    showToast(t('common.saved_success', 'Đã xóa danh mục thành công!'), 'success');
                                  },
                                });
                              }}
                              title="Xóa danh mục"
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* 8. TEXT & LANGUAGE CUSTOMIZER CARD */}
            {(activeSubTab === 'language' || activeSubTab === 'all') && (
              <div id="settings-language" className={activeSubTab === 'all' ? 'lg:col-span-2' : 'w-full'}>
                <TextCustomizerSection onNotifyDirty={onForceSyncToCloud} />
              </div>
            )}

            </div>
          </div>
        </div>

        {/* Floating Sticky Save/Discard Bar when there are unsaved edits */}
        {hasUnsavedChanges && (
          <div className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] md:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-900 dark:text-white px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-2xl shadow-xl shadow-slate-900/10 dark:shadow-2xl dark:shadow-black/60 border border-slate-200/90 dark:border-slate-800 flex items-center justify-between gap-2.5 sm:gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 animate-pulse" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap">
                  <span className="sm:hidden">{dirtyCount} thay đổi chưa lưu</span>
                  <span className="hidden sm:inline">Có {dirtyCount} mục thay đổi chưa lưu</span>
                </p>
                <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 overflow-x-auto no-scrollbar pt-0.5">
                  {isBrandingDirty && <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded font-medium">Nhận diện</span>}
                  {isThemeDirty && <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded font-medium">Giao diện</span>}
                  {isBankDirty && <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded font-medium">Tài khoản</span>}
                  {isNoticeDirty && <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded font-medium">Nội quy</span>}
                  {isPermsDirty && <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded font-medium">Phân quyền</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDiscardAll}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => handleSaveAllSettings()}
                style={{
                  backgroundColor: activePreset.primary,
                  boxShadow: `0 4px 14px ${activePreset.primary}40`,
                }}
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl hover:brightness-110 active:scale-[0.98] text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu ngay</span>
              </button>
            </div>
          </div>
        )}

        {/* Cloud Data Source & Custom Firebase Guide Modal */}
        <CloudDataSourceModal
          isOpen={isCloudDataSourceModalOpen}
          onClose={() => setIsCloudDataSourceModalOpen(false)}
        />
      </div>
  );
};
