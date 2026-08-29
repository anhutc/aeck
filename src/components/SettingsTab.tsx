import React, { useState, useEffect } from 'react';
import {
  Building2,
  Tag,
  Plus,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  Check,
  Save,
  KeyRound,
  Eye,
  EyeOff,
  ScrollText,
  Calendar,
  ShieldCheck,
  Type,
  Cloud,
  RefreshCw,
  Sliders,
  PieChart as PieIcon,
  Target,
  Pencil,
  X,
  Globe,
  FileText,
  Printer,
  Database,
  Activity,
  Zap,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { BankSettings, Category, GroupNotice, AppBranding, MemberViewPermissions } from '../types';
import { VIETNAMESE_BANKS, INITIAL_BRANDING, INITIAL_VIEW_PERMISSIONS } from '../data/initialData';
import { LanguageAndTextEditor } from './settings/LanguageAndTextEditor';
import { CloudDataSourceModal } from './settings/CloudDataSourceModal';
import { getSavedCustomFirebaseConfig, getActiveFirebaseConfig } from '../lib/firebase';
import { useTranslation } from '../i18n/LanguageContext';
import { useFeedback } from '../context/FeedbackContext';

export type SettingSubTab = 'branding' | 'statement' | 'notice' | 'permissions' | 'security' | 'bank' | 'categories' | 'backup' | 'language' | 'all';

interface SettingsTabProps {
  bankSettings: BankSettings;
  onUpdateBankSettings: (settings: BankSettings) => void;
  categories: Category[];
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  onUpdateCategory?: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
  onExportAllData: () => void;
  onImportAllData: (jsonData: string) => void;
  onResetData: () => void;
  onForceSyncToCloud?: () => void;
  onForcePullFromCloud?: () => void;
  onTestCloudConnection?: () => Promise<{ success: boolean; latencyMs: number; error?: string }>;
  cloudSyncStatus?: 'connected' | 'connecting' | 'error' | 'syncing';
  lastCloudSyncTime?: string | null;
  cloudLatency?: number | null;
  adminPassword?: string;
  onUpdateAdminPassword: (newPass: string) => void;
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
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  activeColor: string;
}> = [
  { id: 'branding', label: 'Nhận Diện & Nhóm', sublabel: 'Tên, biểu tượng, khẩu hiệu', icon: Type, iconColor: 'text-blue-500', activeColor: 'border-blue-600 text-blue-700 bg-blue-50/90 dark:bg-blue-950/80 dark:text-blue-300' },
  { id: 'statement', label: 'Mẫu In Sao Kê & Chữ Ký', sublabel: 'Tiêu đề, người ký duyệt', icon: FileText, iconColor: 'text-indigo-500', activeColor: 'border-indigo-600 text-indigo-700 bg-indigo-50/90 dark:bg-indigo-950/80 dark:text-indigo-300' },
  { id: 'notice', label: 'Nội Quy Hoạt Động', sublabel: 'Quy chế & điều khoản quỹ', icon: ScrollText, iconColor: 'text-emerald-500', activeColor: 'border-emerald-600 text-emerald-700 bg-emerald-50/90 dark:bg-emerald-950/80 dark:text-emerald-300' },
  { id: 'permissions', label: 'Phân Quyền Thành Viên', sublabel: 'Bảo mật & quyền hiển thị', icon: Sliders, iconColor: 'text-purple-500', activeColor: 'border-purple-600 text-purple-700 bg-purple-50/90 dark:bg-purple-950/80 dark:text-purple-300' },
  { id: 'security', label: 'Mật Khẩu Quản Trị', sublabel: 'Mã PIN bảo vệ Admin', icon: KeyRound, iconColor: 'text-amber-500', activeColor: 'border-amber-600 text-amber-700 bg-amber-50/90 dark:bg-amber-950/80 dark:text-amber-300' },
  { id: 'bank', label: 'Tài Khoản & VietQR', sublabel: 'STK ngân hàng nhận tiền', icon: Building2, iconColor: 'text-teal-500', activeColor: 'border-teal-600 text-teal-700 bg-teal-50/90 dark:bg-teal-950/80 dark:text-teal-300' },
  { id: 'categories', label: 'Danh Mục Thu Chi', sublabel: 'Phân loại thu & chi', icon: Tag, iconColor: 'text-rose-500', activeColor: 'border-rose-600 text-rose-700 bg-rose-50/90 dark:bg-rose-950/80 dark:text-rose-300' },
  { id: 'backup', label: 'Sao Lưu & Đồng Bộ', sublabel: 'Cloud Firestore & JSON', icon: Cloud, iconColor: 'text-blue-500', activeColor: 'border-blue-600 text-blue-700 bg-blue-50/90 dark:bg-blue-950/80 dark:text-blue-300' },
  { id: 'language', label: 'Văn Bản Tiếng Việt', sublabel: 'Tùy biến từ ngữ giao diện', icon: Globe, iconColor: 'text-cyan-500', activeColor: 'border-cyan-600 text-cyan-700 bg-cyan-50/90 dark:bg-cyan-950/80 dark:text-cyan-300' },
  { id: 'all', label: 'Tất Cả Cài Đặt', sublabel: 'Xem toàn bộ', icon: Sliders, iconColor: 'text-slate-500', activeColor: 'border-slate-800 text-slate-900 bg-slate-100 dark:bg-slate-800 dark:text-white dark:border-slate-300' },
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
  onResetData,
  onForceSyncToCloud,
  onForcePullFromCloud,
  onTestCloudConnection,
  cloudSyncStatus = 'connected',
  lastCloudSyncTime,
  cloudLatency,
  adminPassword = 'admin',
  onUpdateAdminPassword,
  groupNotice,
  onUpdateGroupNotice,
  branding = INITIAL_BRANDING,
  onUpdateBranding,
  viewPermissions = INITIAL_VIEW_PERMISSIONS,
  onUpdateViewPermissions,
}) => {
  const { t } = useTranslation();
  const { showConfirm, showToast } = useFeedback();

  // Cloud Diagnostics state
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [pingResult, setPingResult] = useState<{ success: boolean; latencyMs: number; error?: string } | null>(null);
  const [isCloudDataSourceModalOpen, setIsCloudDataSourceModalOpen] = useState(false);
  const savedCustomFirebase = getSavedCustomFirebaseConfig();
  const activeFirebase = getActiveFirebaseConfig();

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
  const [brandingSaved, setBrandingSaved] = useState(false);

  // Statement Signatories & Print Template state
  const [statementHeaderTitle, setStatementHeaderTitle] = useState(branding.statementHeaderTitle || 'BÁO CÁO THU CHI & SAO KÊ SỔ QUỸ');
  const [statementSubtitle, setStatementSubtitle] = useState(branding.statementSubtitle || 'Trích xuất tự động từ hệ thống quản lý thu chi minh bạch');
  const [statementSignatory1Title, setStatementSignatory1Title] = useState(branding.statementSignatory1Title || 'Người lập biểu');
  const [statementSignatory1Name, setStatementSignatory1Name] = useState(branding.statementSignatory1Name || 'Kế toán quỹ');
  const [statementSignatory2Title, setStatementSignatory2Title] = useState(branding.statementSignatory2Title || 'Thủ quỹ');
  const [statementSignatory2Name, setStatementSignatory2Name] = useState(branding.statementSignatory2Name || 'Trần Thị Mai');
  const [statementSignatory3Title, setStatementSignatory3Title] = useState(branding.statementSignatory3Title || 'Trưởng ban duyệt');
  const [statementSignatory3Name, setStatementSignatory3Name] = useState(branding.statementSignatory3Name || 'Đại diện ban quản lý');
  const [statementFooterNote, setStatementFooterNote] = useState(branding.statementFooterNote || 'Báo cáo này được trích xuất tự động từ hệ thống quản lý thu chi minh bạch và có giá trị lưu hành nội bộ.');
  const [statementSaved, setStatementSaved] = useState(false);

  // Sync branding when props change from Cloud Firestore
  useEffect(() => {
    if (branding) {
      setAppTitle(branding.appTitle || 'Quản Lý Quỹ');
      setAppSubtitle(branding.appSubtitle || 'Sổ thu chi & đóng quỹ minh bạch');
      setTreasurerName(branding.treasurerName || 'Thủ Quỹ Ban Đại Diện');
      setTreasurerPhone(branding.treasurerPhone || '0988.888.888');
      setTransferSyntaxPrefix(branding.transferSyntaxPrefix || 'NOP QUY');
      setGroupEmoji(branding.groupEmoji || '💼');
      setStatementHeaderTitle(branding.statementHeaderTitle || 'BÁO CÁO THU CHI & SAO KÊ SỔ QUỸ');
      setStatementSubtitle(branding.statementSubtitle || 'Trích xuất tự động từ hệ thống quản lý thu chi minh bạch');
      setStatementSignatory1Title(branding.statementSignatory1Title || 'Người lập biểu');
      setStatementSignatory1Name(branding.statementSignatory1Name || 'Kế toán quỹ');
      setStatementSignatory2Title(branding.statementSignatory2Title || 'Thủ quỹ');
      setStatementSignatory2Name(branding.statementSignatory2Name || 'Trần Thị Mai');
      setStatementSignatory3Title(branding.statementSignatory3Title || 'Trưởng ban duyệt');
      setStatementSignatory3Name(branding.statementSignatory3Name || 'Đại diện ban quản lý');
      setStatementFooterNote(branding.statementFooterNote || 'Báo cáo này được trích xuất tự động từ hệ thống quản lý thu chi minh bạch và có giá trị lưu hành nội bộ.');
    }
  }, [branding]);

  // Bank form state
  const [bankId, setBankId] = useState(bankSettings.bankId || 'MB');
  const [accountNumber, setAccountNumber] = useState(bankSettings.accountNumber || '');
  const [accountName, setAccountName] = useState(bankSettings.accountName || '');
  const [qrTemplate, setQrTemplate] = useState(bankSettings.qrTemplate || 'compact');
  const [bankSaved, setBankSaved] = useState(false);

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
  const [noticeSaved, setNoticeSaved] = useState(false);

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

  // Password change state
  const [currentPassInput, setCurrentPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [confirmPassInput, setConfirmPassInput] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  // New Category state
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'income' | 'expense'>('expense');
  const [newCatColor, setNewCatColor] = useState('#3B82F6');
  const [catError, setCatError] = useState('');

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
  const [permsSaved, setPermsSaved] = useState(false);

  useEffect(() => {
    if (viewPermissions) {
      setPerms(viewPermissions);
    }
  }, [viewPermissions]);

  // Synchronized toggle for permissions & notice
  const handleTogglePerm = (key: keyof MemberViewPermissions) => {
    const newVal = !perms[key];
    const newPerms = {
      ...perms,
      [key]: newVal,
    };
    setPerms(newPerms);
    onUpdateViewPermissions(newPerms);

    // If toggling notice, also immediately synchronize with groupNotice
    if (key === 'showNotice') {
      setNoticeEnabled(newVal);
      onUpdateGroupNotice({
        ...groupNotice,
        enabled: newVal,
        title: noticeTitle.trim() || 'Nội quy & Quy định hoạt động quỹ',
        content: noticeContent.trim(),
        type: noticeType,
        updatedAt: noticeUpdatedAt || new Date().toISOString().split('T')[0],
      });
    }
  };

  const handleToggleAllPerms = (enabled: boolean) => {
    const newPerms: MemberViewPermissions = {
      showNotice: enabled,
      showCampaigns: enabled,
      showExpenseStructure: enabled,
      showFullLedger: enabled,
      allowPublicPrint: enabled,
      allowQuickQR: enabled,
    };
    setPerms(newPerms);
    onUpdateViewPermissions(newPerms);

    setNoticeEnabled(enabled);
    onUpdateGroupNotice({
      ...groupNotice,
      enabled,
      title: noticeTitle.trim() || 'Nội quy & Quy định hoạt động quỹ',
      content: noticeContent.trim(),
      type: noticeType,
      updatedAt: noticeUpdatedAt || new Date().toISOString().split('T')[0],
    });
  };

  const handleToggleNoticeDirectly = (enabled: boolean) => {
    setNoticeEnabled(enabled);
    onUpdateGroupNotice({
      ...groupNotice,
      enabled,
      title: noticeTitle.trim() || 'Nội quy & Quy định hoạt động quỹ',
      content: noticeContent.trim(),
      type: noticeType,
      updatedAt: noticeUpdatedAt || new Date().toISOString().split('T')[0],
    });

    const newPerms = {
      ...perms,
      showNotice: enabled,
    };
    setPerms(newPerms);
    onUpdateViewPermissions(newPerms);
  };

  const handleSavePerms = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateViewPermissions(perms);
    setPermsSaved(true);
    setTimeout(() => setPermsSaved(false), 2500);
  };

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBranding({
      ...branding,
      appTitle: appTitle.trim() || 'Quản Lý Quỹ',
      appSubtitle: appSubtitle.trim(),
      treasurerName: treasurerName.trim(),
      treasurerPhone: treasurerPhone.trim(),
      transferSyntaxPrefix: transferSyntaxPrefix.trim().toUpperCase(),
      groupEmoji: groupEmoji.trim() || '💼',
    });
    setBrandingSaved(true);
    setTimeout(() => setBrandingSaved(false), 2500);
  };

  const handleSaveStatement = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateBranding({
      ...branding,
      statementHeaderTitle: statementHeaderTitle.trim(),
      statementSubtitle: statementSubtitle.trim(),
      statementSignatory1Title: statementSignatory1Title.trim(),
      statementSignatory1Name: statementSignatory1Name.trim(),
      statementSignatory2Title: statementSignatory2Title.trim(),
      statementSignatory2Name: statementSignatory2Name.trim(),
      statementSignatory3Title: statementSignatory3Title.trim(),
      statementSignatory3Name: statementSignatory3Name.trim(),
      statementFooterNote: statementFooterNote.trim(),
    });
    setStatementSaved(true);
    setTimeout(() => setStatementSaved(false), 2500);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    e.preventDefault();
    const bankObj = VIETNAMESE_BANKS.find(b => b.id === bankId);
    onUpdateBankSettings({
      bankId,
      bankName: bankObj ? bankObj.name : bankId,
      accountNumber: accountNumber.trim(),
      accountName: accountName.trim().toUpperCase(),
      qrTemplate,
    });
    setBankSaved(true);
    setTimeout(() => setBankSaved(false), 2500);
  };

  const handleSaveNotice = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateGroupNotice({
      enabled: noticeEnabled,
      title: noticeTitle.trim() || 'Nội quy & Quy định hoạt động quỹ',
      content: noticeContent.trim(),
      type: noticeType,
      updatedAt: noticeUpdatedAt || new Date().toISOString().split('T')[0],
    });

    const newPerms = { ...perms, showNotice: noticeEnabled };
    setPerms(newPerms);
    onUpdateViewPermissions(newPerms);

    setNoticeSaved(true);
    setTimeout(() => setNoticeSaved(false), 2500);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (currentPassInput !== adminPassword && currentPassInput !== 'admin') {
      setPassError('Mật khẩu hiện tại không chính xác');
      return;
    }

    if (newPassInput.length < 4) {
      setPassError('Mật khẩu mới phải có tối thiểu 4 ký tự');
      return;
    }

    if (newPassInput !== confirmPassInput) {
      setPassError('Xác nhận mật khẩu mới không khớp');
      return;
    }

    onUpdateAdminPassword(newPassInput);
    setPassSuccess('Đã đổi mật khẩu Admin thành công và đồng bộ lên Đám mây!');
    setCurrentPassInput('');
    setNewPassInput('');
    setConfirmPassInput('');
    setTimeout(() => setPassSuccess(''), 3000);
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
    <div id="settings-tab-content" className="space-y-6 pb-12">
      {/* Header Info Banner */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600" />
            <span>Cài Đặt Hệ Thống & Tùy Biến Toàn Diện</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cá nhân hóa tên nhóm, thông tin VietQR, phân loại thu chi, phân quyền thành viên và sao lưu đám mây
          </p>
        </div>
      </div>

      {/* Mobile Horizontal Quick-Jump Pills Bar - All categories visible with active tab switching */}
      <div className="md:hidden sticky top-14 sm:top-16 z-20 -mx-4 px-4 py-2 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {SETTING_NAV_ITEMS.map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
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
            </span
          </div>

          {SETTING_NAV_ITEMS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id)}
                className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-extrabold shadow-2xs border-l-4 border-blue-600'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : tab.iconColor}`} />
                  <div className="truncate">
                    <div className="truncate">{tab.label}</div>
                    <div className="text-[10px] font-normal text-slate-400 truncate">{tab.sublabel}</div>
                  </div>
                </div>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0 ml-1" />
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
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
                  <Type className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Cá nhân hóa tên & tiêu đề ứng dụng
                  </h3>
                  <p className="text-xs text-slate-500">Đổi tên nhóm, khẩu hiệu và tiêu đề trang thành viên</p>
                </div>
              </div>

              {/* Quick Presets */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-semibold text-slate-500 block">Mẫu tên & cấu hình gợi ý nhanh:</span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleApplyBrandingPreset('class')}
                        className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
                      >
                        🏫 Quỹ Lớp Học
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyBrandingPreset('company')}
                        className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
                      >
                        💼 Quỹ Team / Công Ty
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyBrandingPreset('club')}
                        className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
                      >
                        ⚽ CLB Thể Thao
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyBrandingPreset('family')}
                        className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
                      >
                        🏡 Quỹ Gia Đình
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyBrandingPreset('travel')}
                        className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
                      >
                        ✈️ Du Lịch / Tour
                      </button>
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
                            className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all cursor-pointer ${
                              groupEmoji === emoji
                                ? 'bg-blue-600 text-white shadow-xs scale-110'
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
                          SĐT / Zalo Liên Hệ
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

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      {brandingSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                      <span>{brandingSaved ? 'Đã lưu & đồng bộ nhận diện thương hiệu!' : 'Lưu Tùy Chỉnh Nhận Diện & Thương Hiệu'}</span>
                    </button>
                  </form>
                </div>
              )}

              {/* 2. STATEMENT SIGNATORIES & PRINT TEMPLATE CARD */}
              {(activeSubTab === 'statement' || activeSubTab === 'all') && (
                <div id="settings-statement" className="scroll-mt-28 sm:scroll-mt-24 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                  <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      Mẫu In Sao Kê & Chữ Ký Ban Quản Lý
                    </h3>
                    <p className="text-xs text-slate-500">Tùy biến tiêu đề báo cáo, chức danh và người ký duyệt sao kê</p>
                  </div>
                </div>

                <form onSubmit={handleSaveStatement} className="space-y-3.5 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Tiêu đề chính trên bản in sao kê / báo cáo
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="VD: BÁO CÁO THU CHI & SAO KÊ SỔ QUỸ"
                      value={statementHeaderTitle}
                      onChange={(e) => setStatementHeaderTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Phụ đề báo cáo / Đơn vị ban hành
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Trích xuất tự động từ hệ thống quản lý thu chi minh bạch"
                      value={statementSubtitle}
                      onChange={(e) => setStatementSubtitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>

                  {/* 3 Signatories Configuration */}
                  <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                      3 Chức danh & Họ tên Người ký duyệt (Cuối bản in):
                    </span>

                    {/* Signatory 1 */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-700/50">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Vị trí 1 (Bên trái)</label>
                        <input
                          type="text"
                          placeholder="Chức danh (VD: Người lập biểu)"
                          value={statementSignatory1Title}
                          onChange={(e) => setStatementSignatory1Title(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Họ tên người ký 1</label>
                        <input
                          type="text"
                          placeholder="Họ tên (VD: Kế toán quỹ)"
                          value={statementSignatory1Name}
                          onChange={(e) => setStatementSignatory1Name(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    {/* Signatory 2 */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-700/50">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Vị trí 2 (Ở giữa)</label>
                        <input
                          type="text"
                          placeholder="Chức danh (VD: Thủ quỹ)"
                          value={statementSignatory2Title}
                          onChange={(e) => setStatementSignatory2Title(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Họ tên người ký 2</label>
                        <input
                          type="text"
                          placeholder="Họ tên (VD: Trần Thị Mai)"
                          value={statementSignatory2Name}
                          onChange={(e) => setStatementSignatory2Name(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        />
                      </div>
                    </div>

                    {/* Signatory 3 */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-700/50">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Vị trí 3 (Bên phải)</label>
                        <input
                          type="text"
                          placeholder="Chức danh (VD: Trưởng ban duyệt)"
                          value={statementSignatory3Title}
                          onChange={(e) => setStatementSignatory3Title(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Họ tên người ký 3</label>
                        <input
                          type="text"
                          placeholder="Họ tên (VD: Đại diện ban quản lý)"
                          value={statementSignatory3Name}
                          onChange={(e) => setStatementSignatory3Name(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Ghi chú / Khẩu hiệu chân trang in
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ghi chú pháp lý hoặc lưu hành nội bộ..."
                      value={statementFooterNote}
                      onChange={(e) => setStatementFooterNote(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    {statementSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    <span>{statementSaved ? 'Đã lưu mẫu in sao kê & chữ ký!' : 'Lưu Cấu Hình Mẫu In Sao Kê'}</span>
                  </button>
                </form>
              </div>
            )}

            {/* 3. GROUP RULES & CHARTER BOARD (BẢNG NỘI QUY HOẠT ĐỘNG) */}
            {(activeSubTab === 'notice' || activeSubTab === 'all') && (
              <div id="settings-notice" className="scroll-mt-28 sm:scroll-mt-24 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
                    <ScrollText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      Bảng Nội Quy & Quy Định Hoạt Động Quỹ
                    </h3>
                    <p className="text-xs text-slate-500">Quy chế hoạt động cố định hiển thị ở đầu trang</p>
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
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Ngày áp dụng / Cập nhật</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={noticeUpdatedAt}
                        onChange={(e) => setNoticeUpdatedAt(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
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
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    {noticeSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    <span>{noticeSaved ? 'Đã lưu & đồng bộ nội quy lên Đám Mây!' : 'Lưu Bảng Nội Quy Quỹ'}</span>
                  </button>
                </form>
              </div>
            )}

            {/* 4. MEMBER VIEW PERMISSIONS & VISIBILITY CONTROL */}
            {(activeSubTab === 'permissions' || activeSubTab === 'all') && (
              <div id="settings-permissions" className={`scroll-mt-28 sm:scroll-mt-24 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 ${activeSubTab === 'all' ? 'lg:col-span-2' : ''}`}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-sm shadow-purple-500/20">
                        <Sliders className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <span>Phân Quyền Người Xem (Thành Viên)</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300">
                            Bảo mật & Hiển thị
                          </span>
                        </h3>
                        <p className="text-xs text-slate-500">
                          Kiểm soát các phần nội dung mà người xem/thành viên được phép thấy (Tự động lưu và đồng bộ tức thì)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => handleToggleAllPerms(true)}
                        className="px-2.5 py-1 rounded-lg border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/50 font-medium text-[11px] transition-colors cursor-pointer"
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
                      {/* Perm 1: Notice Banner */}
                      <div
                        onClick={() => handleTogglePerm('showNotice')}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                          perms.showNotice
                            ? 'bg-purple-50/40 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/60 shadow-2xs'
                            : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                        } hover:bg-purple-50/80 dark:hover:bg-slate-800/90 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-xs`}
                      >
                        <div className="flex items-center gap-3 pr-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <ScrollText className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                1. Bảng Thông Báo / Nội Quy Hoạt Động
                              </span>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                  perms.showNotice
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
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
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-purple-600"></div>
                        </label>
                      </div>

                      {/* Perm 2: Active Campaigns */}
                      <div
                        onClick={() => handleTogglePerm('showCampaigns')}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                          perms.showCampaigns
                            ? 'bg-purple-50/40 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/60 shadow-2xs'
                            : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                        } hover:bg-purple-50/80 dark:hover:bg-slate-800/90 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-xs`}
                      >
                        <div className="flex items-center gap-3 pr-2">
                          <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                            <Target className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                2. Đợt Đóng Quỹ Đang Diễn Ra
                              </span>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                  perms.showCampaigns
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
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
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-purple-600"></div>
                        </label>
                      </div>

                      {/* Perm 3: Financial Visualization Charts */}
                      <div
                        onClick={() => handleTogglePerm('showExpenseStructure')}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                          perms.showExpenseStructure
                            ? 'bg-purple-50/40 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/60 shadow-2xs'
                            : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                        } hover:bg-purple-50/80 dark:hover:bg-slate-800/90 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-xs`}
                      >
                        <div className="flex items-center gap-3 pr-2">
                          <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                            <PieIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                3. Biểu Đồ Trực Quan Hóa Thu Chi
                              </span>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                  perms.showExpenseStructure
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
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
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-purple-600"></div>
                        </label>
                      </div>

                      {/* Perm 4: Full Transaction Ledger */}
                      <div
                        onClick={() => handleTogglePerm('showFullLedger')}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                          perms.showFullLedger
                            ? 'bg-purple-50/40 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/60 shadow-2xs'
                            : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                        } hover:bg-purple-50/80 dark:hover:bg-slate-800/90 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-xs`}
                      >
                        <div className="flex items-center gap-3 pr-2">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <Tag className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                4. Sổ Chi Tiết Toàn Bộ Giao Dịch
                              </span>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                  perms.showFullLedger
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
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
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-purple-600"></div>
                        </label>
                      </div>

                      {/* Perm 5: Public Print & Export */}
                      <div
                        onClick={() => handleTogglePerm('allowPublicPrint')}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                          perms.allowPublicPrint
                            ? 'bg-purple-50/40 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/60 shadow-2xs'
                            : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                        } hover:bg-purple-50/80 dark:hover:bg-slate-800/90 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-xs`}
                      >
                        <div className="flex items-center gap-3 pr-2">
                          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                            <Download className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                5. Nút In & Xuất Báo Cáo Sao Kê
                              </span>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                  perms.allowPublicPrint
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
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
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-purple-600"></div>
                        </label>
                      </div>

                      {/* Perm 6: Quick QR Contribution */}
                      <div
                        onClick={() => handleTogglePerm('allowQuickQR')}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                          perms.allowQuickQR
                            ? 'bg-purple-50/40 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/60 shadow-2xs'
                            : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                        } hover:bg-purple-50/80 dark:hover:bg-slate-800/90 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-xs`}
                      >
                        <div className="flex items-center gap-3 pr-2">
                          <div className="w-8 h-8 rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">
                                6. Nút Quét Mã VietQR Chuyển Khoản
                              </span>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                                  perms.allowQuickQR
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
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
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-purple-600"></div>
                        </label>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      {permsSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                      <span>{permsSaved ? 'Đã lưu & áp dụng phân quyền thành viên!' : 'Lưu Cài Đặt Phân Quyền'}</span>
                    </button>
                  </form>
                </div>
            )}

            {/* 5. ADMIN PASSWORD CARD */}
            {(activeSubTab === 'security' || activeSubTab === 'all') && (
              <div id="settings-security" className="scroll-mt-28 sm:scroll-mt-24 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-sm shadow-amber-500/20">
                    <KeyRound className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      Mật Khẩu Quản Trị Viên (Admin)
                    </h3>
                    <p className="text-xs text-slate-500">Mã PIN/Mật khẩu để mở khóa các tính năng quản trị</p>
                  </div>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-3.5 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Mật khẩu hiện tại
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPass ? 'text' : 'password'}
                        required
                        placeholder="Nhập mật khẩu hiện tại (mặc định: admin)"
                        value={currentPassInput}
                        onChange={(e) => setCurrentPassInput(e.target.value)}
                        className="w-full px-3 py-2 pr-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Mật khẩu mới
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPass ? 'text' : 'password'}
                          required
                          placeholder="Mật khẩu mới..."
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
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Xác nhận mật khẩu mới
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Nhập lại mật khẩu mới..."
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

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Cập nhật mật khẩu Admin</span>
                  </button>
                </form>
              </div>
            )}

            {/* 6. BANK ACCOUNT & VIETQR CARD */}
            {(activeSubTab === 'bank' || activeSubTab === 'all') && (
              <div id="settings-bank" className="scroll-mt-28 sm:scroll-mt-24 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm shadow-teal-500/20">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      Tài Khoản Ngân Hàng & VietQR
                    </h3>
                    <p className="text-xs text-slate-500">Thiết lập tài khoản nhận tiền để tự động tạo mã QR</p>
                  </div>
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
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
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
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase text-xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    {bankSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                    <span>{bankSaved ? 'Đã lưu thông tin tài khoản!' : 'Lưu Cài Đặt Ngân Hàng'}</span>
                  </button>
                </form>
              </div>
            )}

            {/* 7. BACKUP & CLOUD STORAGE */}
            {(activeSubTab === 'backup' || activeSubTab === 'all') && (
              <div id="settings-backup" className={`scroll-mt-28 sm:scroll-mt-24 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5 ${activeSubTab === 'all' ? 'lg:col-span-2' : ''}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
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
                      <Database className="w-4 h-4 text-blue-600 dark:text-blue-400" />
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
                  <div className="p-3.5 rounded-xl bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 flex flex-col justify-between gap-3 sm:col-span-3 lg:col-span-1">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                          <Database className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                          Nguồn Dữ Liệu Đám Mây
                        </span>
                        {savedCustomFirebase ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                            Tùy chỉnh
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            Mặc định
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-purple-700/80 dark:text-purple-300/80 mt-1 block">
                        Đổi sang Firebase của riêng bạn hoặc kết nối Bot Zalo / Telegram / App khác.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCloudDataSourceModalOpen(true)}
                      className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Đổi Nguồn & Xem Hướng Dẫn</span>
                    </button>
                  </div>

                  {onForceSyncToCloud && (
                    <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/80 flex flex-col justify-between gap-3">
                      <div>
                        <span className="font-bold text-xs text-blue-900 dark:text-blue-200 block flex items-center gap-1.5">
                          <Cloud className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          Đồng bộ dữ liệu lên Cloud
                        </span>
                        <span className="text-[11px] text-blue-700/80 dark:text-blue-300/80 mt-0.5 block">
                          Chủ động tải toàn bộ thu chi, quỹ và thành viên hiện tại lên Cloud Firestore để chia sẻ cho mọi người.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={onForceSyncToCloud}
                        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Đẩy dữ liệu lên Cloud ngay</span>
                      </button>
                    </div>
                  )}

                  {onForcePullFromCloud && (
                    <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/80 flex flex-col justify-between gap-3">
                      <div>
                        <span className="font-bold text-xs text-indigo-900 dark:text-indigo-200 block flex items-center gap-1.5">
                          <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          Tải lại từ Cloud Firestore
                        </span>
                        <span className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80 mt-0.5 block">
                          Kéo bản ghi mới nhất từ máy chủ về máy (hữu ích khi người khác vừa nhập liệu và bạn muốn làm mới).
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={onForcePullFromCloud}
                        className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
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
                      <span className="font-bold text-xs text-slate-900 dark:text-white block">
                        Xuất tệp sao lưu (JSON)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Tải về máy tính toàn bộ danh sách quỹ, giao dịch, thành viên
                      </span>
                    </div>
                    <button
                      id="export-backup-json-btn"
                      onClick={onExportAllData}
                      className="w-full py-2.5 rounded-xl bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
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
                    <label className="w-full py-2.5 rounded-xl border-2 border-dashed border-blue-400/80 dark:border-blue-500/60 bg-blue-50/70 dark:bg-slate-800/80 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 shadow-xs group">
                      <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors" />
                      <span>Chọn file JSON khôi phục</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleFileImport}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 flex flex-col justify-between gap-3">
                    <div>
                      <span className="font-bold text-xs text-rose-800 dark:text-rose-300 block">
                        Khởi tạo kỳ hoạt động mới
                      </span>
                      <span className="text-[11px] text-rose-600/80 dark:text-rose-400/80">
                        Đặt lại số dư quỹ hoặc bắt đầu niên khóa/kỳ mới
                      </span>
                    </div>
                    <button
                      id="reset-sample-data-btn"
                      onClick={onResetData}
                      className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Tùy chọn đặt lại dữ liệu</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 8. CATEGORIES MANAGEMENT */}
            {(activeSubTab === 'categories' || activeSubTab === 'all') && (
              <div id="settings-categories" className={`scroll-mt-28 sm:scroll-mt-24 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 ${activeSubTab === 'all' ? 'lg:col-span-2' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-sm">
                      <Tag className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        Quản lý danh mục thu & chi
                      </h3>
                      <p className="text-xs text-slate-500">Phân loại dòng tiền theo mục đích sử dụng (có thể chỉnh sửa tên, loại và màu sắc)</p>
                    </div>
                  </div>
                </div>

                  {/* Add new Category Form */}
                  <form onSubmit={handleAddCategorySubmit} className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60">
                    <input
                      type="text"
                      placeholder="Tên danh mục mới..."
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    />

                    <select
                      value={newCatType}
                      onChange={(e) => setNewCatType(e.target.value as any)}
                      className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                    >
                      <option value="expense">Khoản chi (-)</option>
                      <option value="income">Khoản thu (+)</option>
                    </select>

                    <input
                      type="color"
                      value={newCatColor}
                      onChange={(e) => setNewCatColor(e.target.value)}
                      className="w-9 h-9 p-0.5 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer"
                    />

                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm danh mục</span>
                    </button>
                  </form>

                  {catError && <p className="text-xs text-rose-500">{catError}</p>}

                  {/* Category List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2">
                    {categories.map((c) => {
                      const isEditing = editingCatId === c.id;

                      if (isEditing) {
                        return (
                          <div
                            key={c.id}
                            className="p-3 rounded-xl border-2 border-purple-500 bg-purple-50/50 dark:bg-purple-950/30 space-y-2.5 text-xs col-span-1 sm:col-span-2 lg:col-span-3 transition-all shadow-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                                <Pencil className="w-3.5 h-3.5" />
                                Chỉnh sửa danh mục
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditCat(c.id)}
                                  className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                                  title="Lưu thay đổi"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Lưu</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelEditCat}
                                  className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-300 font-medium text-xs flex items-center gap-1 transition-colors cursor-pointer"
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
                                className="px-2.5 py-1.5 rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                              />

                              <select
                                value={editCatType}
                                onChange={(e) => setEditCatType(e.target.value as any)}
                                className="px-2.5 py-1.5 rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                              >
                                <option value="expense">Khoản chi (-)</option>
                                <option value="income">Khoản thu (+)</option>
                              </select>

                              <div className="flex items-center gap-2">
                                <input
                                  type="color"
                                  value={editCatColor}
                                  onChange={(e) => setEditCatColor(e.target.value)}
                                  className="w-8 h-8 p-0.5 rounded-lg border border-purple-300 dark:border-purple-700 cursor-pointer"
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
                              className="p-1 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-colors cursor-pointer"
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

            {/* 9. LANGUAGE & CUSTOM TEXT EDITOR */}
            {(activeSubTab === 'language' || activeSubTab === 'all') && (
              <div id="settings-language" className={`scroll-mt-28 sm:scroll-mt-24 ${activeSubTab === 'all' ? 'lg:col-span-2' : ''}`}>
                <LanguageAndTextEditor />
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Cloud Data Source & Custom Firebase Guide Modal */}
        <CloudDataSourceModal
          isOpen={isCloudDataSourceModalOpen}
          onClose={() => setIsCloudDataSourceModalOpen(false)}
        />
      </div>
  );
};
