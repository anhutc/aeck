import React, { useState, useEffect } from 'react';
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
  FileText,
  Database,
  Activity,
  Zap,
  CheckCircle2,
  AlertCircle,
  Copy,
  Lock,
  Bell,
  MessageSquare,
  RotateCcw
} from 'lucide-react';
import { BankSettings, Category, GroupNotice, AppBranding, MemberViewPermissions, ContributionCampaign } from '../types';
import { VIETNAMESE_BANKS, INITIAL_BRANDING, INITIAL_VIEW_PERMISSIONS } from '../data/initialData';
import { CloudDataSourceModal } from './settings/CloudDataSourceModal';
import { getSavedCustomFirebaseConfig } from '../lib/firebase';
import { useTranslation } from '../i18n/LanguageContext';
import { useFeedback } from '../context/FeedbackContext';
import { generateZaloShareMessage } from '../utils/shareMessage';

export type SettingSubTab = 'branding' | 'share' | 'statement' | 'notice' | 'permissions' | 'security' | 'bank' | 'categories' | 'backup' | 'all';

interface SettingsTabProps {
  bankSettings: BankSettings;
  onUpdateBankSettings: (settings: BankSettings) => void;
  categories: Category[];
  campaigns?: ContributionCampaign[];
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
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  activeColor: string;
}> = [
  { id: 'branding', label: 'Nhận Diện & Thông Báo', sublabel: 'Tên nhóm, vị trí thông báo Toast', icon: Type, iconColor: 'text-blue-500', activeColor: 'border-blue-600 text-blue-700 bg-blue-50' },
  { id: 'share', label: 'Tin Nhắn & Chia Sẻ', sublabel: 'Mẫu thông báo, ngân hàng, link', icon: MessageSquare, iconColor: 'text-emerald-500', activeColor: 'border-emerald-600 text-emerald-700 bg-emerald-50' },
  { id: 'statement', label: 'Mẫu In Sao Kê & Chữ Ký', sublabel: 'Tiêu đề, người ký duyệt', icon: FileText, iconColor: 'text-indigo-500', activeColor: 'border-indigo-600 text-indigo-700 bg-indigo-50' },
  { id: 'notice', label: 'Nội Quy Hoạt Động', sublabel: 'Quy chế & điều khoản quỹ', icon: ScrollText, iconColor: 'text-emerald-500', activeColor: 'border-emerald-600 text-emerald-700 bg-emerald-50' },
  { id: 'permissions', label: 'Phân Quyền Thành Viên', sublabel: 'Bảo mật & quyền hiển thị', icon: Sliders, iconColor: 'text-purple-500', activeColor: 'border-purple-600 text-purple-700 bg-purple-50' },
  { id: 'security', label: 'Bảo Mật & Mật Khẩu', sublabel: 'Mật khẩu Admin & Thành viên', icon: KeyRound, iconColor: 'text-amber-500', activeColor: 'border-amber-600 text-amber-700 bg-amber-50' },
  { id: 'bank', label: 'Tài Khoản & VietQR', sublabel: 'STK ngân hàng nhận tiền', icon: Building2, iconColor: 'text-teal-500', activeColor: 'border-teal-600 text-teal-700 bg-teal-50' },
  { id: 'categories', label: 'Danh Mục Thu Chi', sublabel: 'Phân loại thu & chi', icon: Tag, iconColor: 'text-rose-500', activeColor: 'border-rose-600 text-rose-700 bg-rose-50' },
  { id: 'backup', label: 'Sao Lưu & Đồng Bộ', sublabel: 'Cloud Firestore & JSON', icon: Cloud, iconColor: 'text-blue-500', activeColor: 'border-blue-600 text-blue-700 bg-blue-50' },
  { id: 'all', label: 'Tất Cả Cài Đặt', sublabel: 'Xem toàn bộ', icon: Sliders, iconColor: 'text-slate-500', activeColor: 'border-slate-800 text-slate-900 bg-slate-100' },
];

export const SettingsTab: React.FC<SettingsTabProps> = ({
  bankSettings,
  onUpdateBankSettings,
  categories,
  campaigns = [],
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
  const [statementShowSummary, setStatementShowSummary] = useState(branding.statementShowSummary !== false);
  const [statementShowSignatory1, setStatementShowSignatory1] = useState(branding.statementShowSignatory1 !== false);
  const [statementShowSignatory2, setStatementShowSignatory2] = useState(branding.statementShowSignatory2 !== false);
  const [statementShowSignatory3, setStatementShowSignatory3] = useState(branding.statementShowSignatory3 !== false);
  const [statementShowFooterNote, setStatementShowFooterNote] = useState(branding.statementShowFooterNote !== false);
  const [statementSaved, setStatementSaved] = useState(false);

  // Zalo Share Message Template state
  const [shareMessageGreeting, setShareMessageGreeting] = useState(branding.shareMessageGreeting || INITIAL_BRANDING.shareMessageGreeting || '');
  const [shareMessageIncludeBank, setShareMessageIncludeBank] = useState(branding.shareMessageIncludeBank !== false);
  const [shareMessageIncludeCampaigns, setShareMessageIncludeCampaigns] = useState(branding.shareMessageIncludeCampaigns !== false);
  const [shareMessageBenefit1, setShareMessageBenefit1] = useState(branding.shareMessageBenefit1 || INITIAL_BRANDING.shareMessageBenefit1 || '');
  const [shareMessageBenefit2, setShareMessageBenefit2] = useState(branding.shareMessageBenefit2 || INITIAL_BRANDING.shareMessageBenefit2 || '');
  const [shareMessageBenefit3, setShareMessageBenefit3] = useState(branding.shareMessageBenefit3 || INITIAL_BRANDING.shareMessageBenefit3 || '');
  const [shareMessageClosing, setShareMessageClosing] = useState(branding.shareMessageClosing || INITIAL_BRANDING.shareMessageClosing || '');
  const [socialShareTemplate, setSocialShareTemplate] = useState(branding.socialShareTemplate || '');
  const [useCustomFullTemplate, setUseCustomFullTemplate] = useState(Boolean(branding.socialShareTemplate && branding.socialShareTemplate.trim()));
  const [shareMsgSaved, setShareMsgSaved] = useState(false);
  const [copiedShareTest, setCopiedShareTest] = useState(false);

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
      setStatementShowSummary(branding.statementShowSummary !== false);
      setStatementShowSignatory1(branding.statementShowSignatory1 !== false);
      setStatementShowSignatory2(branding.statementShowSignatory2 !== false);
      setStatementShowSignatory3(branding.statementShowSignatory3 !== false);
      setStatementShowFooterNote(branding.statementShowFooterNote !== false);
      setShareMessageGreeting(branding.shareMessageGreeting || INITIAL_BRANDING.shareMessageGreeting || '');
      setShareMessageIncludeBank(branding.shareMessageIncludeBank !== false);
      setShareMessageIncludeCampaigns(branding.shareMessageIncludeCampaigns !== false);
      setShareMessageBenefit1(branding.shareMessageBenefit1 || INITIAL_BRANDING.shareMessageBenefit1 || '');
      setShareMessageBenefit2(branding.shareMessageBenefit2 || INITIAL_BRANDING.shareMessageBenefit2 || '');
      setShareMessageBenefit3(branding.shareMessageBenefit3 || INITIAL_BRANDING.shareMessageBenefit3 || '');
      setShareMessageClosing(branding.shareMessageClosing || INITIAL_BRANDING.shareMessageClosing || '');
      setSocialShareTemplate(branding.socialShareTemplate || '');
      setUseCustomFullTemplate(Boolean(branding.socialShareTemplate && branding.socialShareTemplate.trim()));
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

  const handleSavePerms = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateViewPermissions(perms);
    setPermsSaved(true);
    showToast('Đã lưu & áp dụng phân quyền thành viên!', 'success');
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
      statementShowSummary,
      statementShowSignatory1,
      statementShowSignatory2,
      statementShowSignatory3,
      statementShowFooterNote,
    });
    setStatementSaved(true);
    setTimeout(() => setStatementSaved(false), 2500);
  };

  const handleSaveShareMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onUpdateBranding({
      ...branding,
      shareMessageGreeting: shareMessageGreeting.trim(),
      shareMessageIncludeBank,
      shareMessageIncludeCampaigns,
      shareMessageBenefit1: shareMessageBenefit1.trim(),
      shareMessageBenefit2: shareMessageBenefit2.trim(),
      shareMessageBenefit3: shareMessageBenefit3.trim(),
      shareMessageClosing: shareMessageClosing.trim(),
      socialShareTemplate: useCustomFullTemplate ? socialShareTemplate.trim() : '',
    });
    setShareMsgSaved(true);
    showToast('Đã lưu cấu hình mẫu tin nhắn thành công!', 'success');
    setTimeout(() => setShareMsgSaved(false), 2500);
  };

  const handleResetShareMessage = () => {
    setShareMessageGreeting(INITIAL_BRANDING.shareMessageGreeting || '');
    setShareMessageIncludeBank(true);
    setShareMessageIncludeCampaigns(true);
    setShareMessageBenefit1(INITIAL_BRANDING.shareMessageBenefit1 || '');
    setShareMessageBenefit2(INITIAL_BRANDING.shareMessageBenefit2 || '');
    setShareMessageBenefit3(INITIAL_BRANDING.shareMessageBenefit3 || '');
    setShareMessageClosing(INITIAL_BRANDING.shareMessageClosing || '');
    setSocialShareTemplate('');
    setUseCustomFullTemplate(false);
    showToast('Đã khôi phục các câu chữ mẫu tin nhắn về mặc định chuẩn!', 'info');
  };

  const handleResetBranding = () => {
    if (branding) {
      setAppTitle(branding.appTitle || 'Quản Lý Quỹ');
      setAppSubtitle(branding.appSubtitle || 'Sổ thu chi & đóng quỹ minh bạch');
      setTreasurerName(branding.treasurerName || 'Thủ quỹ');
      setTreasurerPhone(branding.treasurerPhone || '');
      setTransferSyntaxPrefix(branding.transferSyntaxPrefix || 'DONG QUY');
      setGroupEmoji(branding.groupEmoji || '💼');
      showToast('Đã hủy thay đổi nhận diện thương hiệu!', 'info');
    }
  };

  const handleResetStatement = () => {
    if (branding) {
      setStatementHeaderTitle(branding.statementHeaderTitle || 'BÁO CÁO THU CHI & SAO KÊ QUỸ NHÓM');
      setStatementSubtitle(branding.statementSubtitle || 'Bảng kê khai chi tiết các khoản thu, chi và tồn quỹ');
      setStatementSignatory1Title(branding.statementSignatory1Title || 'Người lập biểu');
      setStatementSignatory1Name(branding.statementSignatory1Name || 'Thủ quỹ ghi sổ');
      setStatementSignatory2Title(branding.statementSignatory2Title || 'Kế toán / Kiểm soát');
      setStatementSignatory2Name(branding.statementSignatory2Name || 'Người kiểm tra số liệu');
      setStatementSignatory3Title(branding.statementSignatory3Title || 'Trưởng ban duyệt');
      setStatementSignatory3Name(branding.statementSignatory3Name || 'Đại diện ban quản lý');
      setStatementFooterNote(branding.statementFooterNote || 'Báo cáo này được trích xuất tự động từ hệ thống quản lý thu chi minh bạch và có giá trị lưu hành nội bộ.');
      setStatementShowSummary(branding.statementShowSummary !== false);
      setStatementShowSignatory1(branding.statementShowSignatory1 !== false);
      setStatementShowSignatory2(branding.statementShowSignatory2 !== false);
      setStatementShowSignatory3(branding.statementShowSignatory3 !== false);
      setStatementShowFooterNote(branding.statementShowFooterNote !== false);
      showToast('Đã hủy thay đổi mẫu in sao kê!', 'info');
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

    setNoticeSaved(true);
    showToast('Đã lưu nội quy hoạt động quỹ!', 'success');
    setTimeout(() => setNoticeSaved(false), 2500);
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
            </span>
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

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleResetBranding}
                        className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-all cursor-pointer"
                      >
                        Hủy thay đổi
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        {brandingSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                        <span>{brandingSaved ? 'Đã lưu & đồng bộ nhận diện thương hiệu!' : 'Lưu Tùy Chỉnh Nhận Diện & Thương Hiệu'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* 1.1 TOAST NOTIFICATION POSITION CARD */}
              {(activeSubTab === 'branding' || activeSubTab === 'all') && (
                <div id="settings-toast" className="scroll-mt-28 sm:scroll-mt-24 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        Vị trí hiển thị Thông báo (Toast Notification)
                      </h3>
                      <p className="text-xs text-slate-500">Tối ưu hóa vị trí và giao diện thông báo phản hồi thao tác trên ứng dụng</p>
                    </div>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Chọn vị trí hiển thị ưu tiên:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Option 1: Top Center (Default & Recommended) */}
                      <button
                        type="button"
                        onClick={() => {
                          setToastPosition('top-center');
                          showToast('Đã chuyển vị trí thông báo sang: Trên - Chính Giữa', 'success', 'Vị Trí Thông Báo');
                        }}
                        className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                          toastPosition === 'top-center'
                            ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-500/20'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-bold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                            🎯 Trên - Chính Giữa
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold">
                            Mặc định tối ưu
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                          Cân đối trực diện, không che các nút góc phải (Theme, Ngôn ngữ, Menu, Nút X đóng cửa sổ).
                        </p>
                      </button>

                      {/* Option 2: Top Right */}
                      <button
                        type="button"
                        onClick={() => {
                          setToastPosition('top-right');
                          showToast('Đã chuyển vị trí thông báo sang: Trên - Góc Phải', 'info', 'Vị Trí Thông Báo');
                        }}
                        className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                          toastPosition === 'top-right'
                            ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-950 dark:text-blue-100 ring-2 ring-blue-500/20'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-bold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                            ↗️ Trên - Góc Phải
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                          Góc trên bên phải màn hình theo kiểu website truyền thống.
                        </p>
                      </button>

                      {/* Option 3: Bottom Center */}
                      <button
                        type="button"
                        onClick={() => {
                          setToastPosition('bottom-center');
                          showToast('Đã chuyển vị trí thông báo sang: Dưới - Chính Giữa', 'success', 'Vị Trí Thông Báo');
                        }}
                        className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                          toastPosition === 'bottom-center'
                            ? 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/40 text-purple-950 dark:text-purple-100 ring-2 ring-purple-500/20'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-bold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
                            ⬇️ Dưới - Chính Giữa
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-medium">
                            Di động tiện lợi
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                          Phù hợp khi dùng điện thoại, nằm ngay tầm mắt và dễ dàng quan sát.
                        </p>
                      </button>

                      {/* Option 4: Bottom Right */}
                      <button
                        type="button"
                        onClick={() => {
                          setToastPosition('bottom-right');
                          showToast('Đã chuyển vị trí thông báo sang: Dưới - Góc Phải', 'info', 'Vị Trí Thông Báo');
                        }}
                        className={`text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                          toastPosition === 'bottom-right'
                            ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-100 ring-2 ring-indigo-500/20'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-bold flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                            ↘️ Dưới - Góc Phải
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                          Góc dưới bên phải màn hình theo phong cách dashboard phần mềm.
                        </p>
                      </button>
                    </div>

                    {/* Interactive Test Buttons */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] font-semibold text-slate-500 block mb-2">
                        Bấm thử nghiệm thông báo tại vị trí đã chọn:
                      </span>
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
                          onClick={() => showToast('Số dư quỹ sắp chạm hạn mức tối thiểu.', 'warning', 'Cảnh Báo Quỹ')}
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

              {/* 1.2 ZALO SHARE MESSAGE TEMPLATE CARD */}
              {(activeSubTab === 'share' || activeSubTab === 'all') && (
                <div id="settings-share" className="scroll-mt-28 sm:scroll-mt-24 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                          <span>Mẫu Tin Nhắn Chia Sẻ</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
                            Hành động nhanh
                          </span>
                        </h3>
                        <p className="text-xs text-slate-500">
                          Tùy chỉnh nội dung thông báo kèm liên kết sạch và thông tin chuyển khoản VietQR gửi đến thành viên
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleResetShareMessage}
                        className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Khôi phục mẫu chuẩn ban đầu"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Khôi phục chuẩn</span>
                      </button>
                    </div>
                  </div>

                  {/* Mode switch */}
                  <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <button
                      type="button"
                      onClick={() => setUseCustomFullTemplate(false)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        !useCustomFullTemplate
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      Cấu trúc từng phần (Khuyến nghị)
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseCustomFullTemplate(true)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        useCustomFullTemplate
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                      }`}
                    >
                      Toàn văn tự do (Thẻ biến {'{...}'})
                    </button>
                  </div>

                  <form onSubmit={handleSaveShareMessage} className="space-y-4">
                    {!useCustomFullTemplate ? (
                      <div className="space-y-4">
                        {/* Greeting */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            1. Lời mở đầu thông báo (Greeting):
                          </label>
                          <textarea
                            rows={3}
                            value={shareMessageGreeting}
                            onChange={(e) => setShareMessageGreeting(e.target.value)}
                            placeholder="Nhập lời mở đầu hoặc kính gửi các thành viên..."
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                          />
                        </div>

                        {/* Automatic inclusion toggles */}
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
                          <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                            2. Tùy chọn đính kèm tự động:
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer font-medium">
                              <input
                                type="checkbox"
                                checked={shareMessageIncludeBank}
                                onChange={(e) => setShareMessageIncludeBank(e.target.checked)}
                                className="rounded text-emerald-600 focus:ring-emerald-500"
                              />
                              <span>Đính kèm Thông tin STK Ngân hàng ({bankSettings.bankName || 'Chưa cấu hình'})</span>
                            </label>
                            <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer font-medium">
                              <input
                                type="checkbox"
                                checked={shareMessageIncludeCampaigns}
                                onChange={(e) => setShareMessageIncludeCampaigns(e.target.checked)}
                                className="rounded text-emerald-600 focus:ring-emerald-500"
                              />
                              <span>Đính kèm danh sách đợt thu quỹ đang mở ({campaigns.filter(c => c.status === 'active').length})</span>
                            </label>
                          </div>
                        </div>

                        {/* System benefits */}
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                            3. Danh sách tiện ích trên cổng thành viên:
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                              <span className="text-[11px] text-slate-500 block mb-1">Gạch đầu dòng 1:</span>
                              <input
                                type="text"
                                value={shareMessageBenefit1}
                                onChange={(e) => setShareMessageBenefit1(e.target.value)}
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs"
                              />
                            </div>
                            <div>
                              <span className="text-[11px] text-slate-500 block mb-1">Gạch đầu dòng 2:</span>
                              <input
                                type="text"
                                value={shareMessageBenefit2}
                                onChange={(e) => setShareMessageBenefit2(e.target.value)}
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs"
                              />
                            </div>
                            <div>
                              <span className="text-[11px] text-slate-500 block mb-1">Gạch đầu dòng 3:</span>
                              <input
                                type="text"
                                value={shareMessageBenefit3}
                                onChange={(e) => setShareMessageBenefit3(e.target.value)}
                                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Closing Note */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            4. Lời kết / Lời cảm ơn (Closing):
                          </label>
                          <input
                            type="text"
                            value={shareMessageClosing}
                            onChange={(e) => setShareMessageClosing(e.target.value)}
                            placeholder="Nhập lời kết..."
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                          Nội dung toàn văn tùy biến (Sử dụng các biến dynamic):
                        </label>
                        <textarea
                          rows={10}
                          value={socialShareTemplate}
                          onChange={(e) => setSocialShareTemplate(e.target.value)}
                          placeholder="Nhập mẫu tin nhắn đầy đủ..."
                          className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                        />
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                          <span className="font-bold block text-slate-700 dark:text-slate-300">Các thẻ biến được hỗ trợ:</span>
                          <div className="flex flex-wrap gap-1.5 font-mono text-emerald-700 dark:text-emerald-300">
                            <span className="bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">{`{appName}`}</span>
                            <span className="bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">{`{shareUrl}`}</span>
                            <span className="bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">{`{bankInfo}`}</span>
                            <span className="bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">{`{bankName}`}</span>
                            <span className="bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">{`{accountNumber}`}</span>
                            <span className="bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">{`{accountName}`}</span>
                            <span className="bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">{`{syntaxPrefix}`}</span>
                            <span className="bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">{`{campaigns}`}</span>
                            <span className="bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">{`{greeting}`}</span>
                            <span className="bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">{`{closing}`}</span>
                            <span className="bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">{`{treasurerName}`}</span>
                            <span className="bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">{`{treasurerPhone}`}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Live Preview of the Zalo message */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <span>Xem trước thực tế tin nhắn gửi đi:</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const origin = typeof window !== 'undefined' ? window.location.origin : '';
                            const pathname = typeof window !== 'undefined' && window.location.pathname !== '/' ? window.location.pathname : '';
                            const cleanShareUrl = `${origin}${pathname}`;
                            const previewText = generateZaloShareMessage({
                              appName: appTitle,
                              shareUrl: cleanShareUrl,
                              branding: {
                                ...branding,
                                shareMessageGreeting,
                                shareMessageBenefit1,
                                shareMessageBenefit2,
                                shareMessageBenefit3,
                                shareMessageClosing,
                                socialShareTemplate: useCustomFullTemplate ? socialShareTemplate : '',
                              } as AppBranding,
                              bankSettings,
                              activeCampaigns: campaigns.filter(c => c.status === 'active'),
                              includeBank: shareMessageIncludeBank,
                              includeCampaigns: shareMessageIncludeCampaigns,
                            });
                            navigator.clipboard.writeText(previewText);
                            setCopiedShareTest(true);
                            showToast('Đã sao chép nội dung xem trước vào clipboard!', 'success');
                            setTimeout(() => setCopiedShareTest(false), 2500);
                          }}
                          className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copiedShareTest ? 'Đã sao chép!' : 'Sao chép thử'}</span>
                        </button>
                      </div>

                      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono whitespace-pre-wrap text-slate-800 dark:text-slate-200 max-h-56 overflow-y-auto leading-relaxed select-all">
                        {generateZaloShareMessage({
                          appName: appTitle,
                          shareUrl: typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname !== '/' ? window.location.pathname : ''}` : 'https://soquy.app',
                          branding: {
                            ...branding,
                            shareMessageGreeting,
                            shareMessageBenefit1,
                            shareMessageBenefit2,
                            shareMessageBenefit3,
                            shareMessageClosing,
                            socialShareTemplate: useCustomFullTemplate ? socialShareTemplate : '',
                          } as AppBranding,
                          bankSettings,
                          activeCampaigns: campaigns.filter(c => c.status === 'active'),
                          includeBank: shareMessageIncludeBank,
                          includeCampaigns: shareMessageIncludeCampaigns,
                        })}
                      </div>
                    </div>

                    {/* Submit button */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer"
                      >
                        {shareMsgSaved ? <Check className="w-4 h-4 text-white" /> : <Save className="w-4 h-4" />}
                        <span>{shareMsgSaved ? 'Đã lưu cấu hình tin nhắn!' : 'Lưu Cài Đặt Tin Nhắn'}</span>
                      </button>
                    </div>
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

                  {/* General Component Visibility Toggles */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                      Tùy chọn Ẩn / Hiện các phần trên Báo cáo & Bản in:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setStatementShowSummary(!statementShowSummary)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          statementShowSummary 
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700 line-through'
                        }`}
                      >
                        {statementShowSummary ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>Bảng tổng hợp thu chi (KPI)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStatementShowFooterNote(!statementShowFooterNote)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          statementShowFooterNote 
                            ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700 line-through'
                        }`}
                      >
                        {statementShowFooterNote ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>Ghi chú chân trang in ấn</span>
                      </button>
                    </div>
                  </div>

                  {/* 3 Signatories Configuration */}
                  <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Chức danh, Họ tên & Bật/Tắt 3 Vị trí Chữ ký:
                      </span>
                      <span className="text-[10px] text-slate-500">
                        Bật/tắt để quyết định chữ ký có xuất hiện trên bản in hay không
                      </span>
                    </div>

                    {/* Signatory 1 */}
                    <div className={`p-3 rounded-xl border transition-all ${
                      statementShowSignatory1 
                        ? 'bg-slate-50 dark:bg-slate-800/40 border-indigo-200 dark:border-indigo-800/50' 
                        : 'bg-slate-100/60 dark:bg-slate-800/20 border-slate-200 dark:border-slate-700 opacity-70'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Vị trí 1 (Bên trái)
                        </span>
                        <button
                          type="button"
                          onClick={() => setStatementShowSignatory1(!statementShowSignatory1)}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                            statementShowSignatory1
                              ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-400'
                          }`}
                        >
                          {statementShowSignatory1 ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          <span>{statementShowSignatory1 ? 'Đang hiện' : 'Đã ẩn'}</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Chức danh</label>
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
                    </div>

                    {/* Signatory 2 */}
                    <div className={`p-3 rounded-xl border transition-all ${
                      statementShowSignatory2 
                        ? 'bg-slate-50 dark:bg-slate-800/40 border-indigo-200 dark:border-indigo-800/50' 
                        : 'bg-slate-100/60 dark:bg-slate-800/20 border-slate-200 dark:border-slate-700 opacity-70'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Vị trí 2 (Ở giữa)
                        </span>
                        <button
                          type="button"
                          onClick={() => setStatementShowSignatory2(!statementShowSignatory2)}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                            statementShowSignatory2
                              ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-400'
                          }`}
                        >
                          {statementShowSignatory2 ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          <span>{statementShowSignatory2 ? 'Đang hiện' : 'Đã ẩn'}</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Chức danh</label>
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
                    </div>

                    {/* Signatory 3 */}
                    <div className={`p-3 rounded-xl border transition-all ${
                      statementShowSignatory3 
                        ? 'bg-slate-50 dark:bg-slate-800/40 border-indigo-200 dark:border-indigo-800/50' 
                        : 'bg-slate-100/60 dark:bg-slate-800/20 border-slate-200 dark:border-slate-700 opacity-70'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Vị trí 3 (Bên phải)
                        </span>
                        <button
                          type="button"
                          onClick={() => setStatementShowSignatory3(!statementShowSignatory3)}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                            statementShowSignatory3
                              ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-400'
                          }`}
                        >
                          {statementShowSignatory3 ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          <span>{statementShowSignatory3 ? 'Đang hiện' : 'Đã ẩn'}</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Chức danh</label>
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

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleResetStatement}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-all cursor-pointer"
                    >
                      Hủy thay đổi
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      {statementSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                      <span>{statementSaved ? 'Đã lưu mẫu in sao kê & chữ ký!' : 'Lưu Cấu Hình Mẫu In Sao Kê'}</span>
                    </button>
                  </div>
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

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleResetNotice}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-all cursor-pointer"
                    >
                      Hủy thay đổi
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      {noticeSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                      <span>{noticeSaved ? 'Đã lưu & áp dụng nội quy!' : 'Lưu Bảng Nội Quy Quỹ'}</span>
                    </button>
                  </div>
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
                          Kiểm soát các phần nội dung mà người xem/thành viên được phép thấy. Bấm Lưu Cài Đặt để áp dụng.
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

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleResetPerms}
                        className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-all cursor-pointer"
                      >
                        Hủy thay đổi
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        {permsSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                        <span>{permsSaved ? 'Đã lưu & áp dụng phân quyền thành viên!' : 'Lưu Cài Đặt Phân Quyền'}</span>
                      </button>
                    </div>
                  </form>
                </div>
            )}

            {/* 5. SECURITY & PASSWORDS CARD */}
            {(activeSubTab === 'security' || activeSubTab === 'all') && (
              <div id="settings-security" className="scroll-mt-28 sm:scroll-mt-24 space-y-5">
                {/* Information Header */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 text-xs">
                    <h4 className="font-bold text-slate-900">
                      Cơ Chế Phân Quyền 2 Mật Khẩu Độc Lập
                    </h4>
                    <p className="text-slate-600 leading-relaxed">
                      Hệ thống hoạt động với 2 mật khẩu riêng biệt: <strong>Mật khẩu Admin</strong> (toàn quyền quản lý, thêm/sửa/xóa thu chi, cấu hình) và <strong>Mật khẩu Thành viên</strong> (chỉ mở xem bảng minh bạch số dư, giao dịch, nộp quỹ VietQR và in sao kê).
                    </p>
                  </div>
                </div>

                {/* Card 1: Admin Password */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm shadow-amber-500/20">
                        <KeyRound className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900">
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
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 transition-colors flex items-center gap-1 cursor-pointer"
                        title={showAdminPassValue ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showAdminPassValue ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{showAdminPassValue ? 'Ẩn' : 'Hiện'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyPassword(adminPassword || 'admin', 'Admin')}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 transition-colors flex items-center gap-1 cursor-pointer"
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
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Mật khẩu Admin mới
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPass ? 'text' : 'password'}
                            required
                            placeholder="Tối thiểu 4 ký tự..."
                            value={newPassInput}
                            onChange={(e) => setNewPassInput(e.target.value)}
                            className="w-full px-3 py-2 pr-10 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPass(!showNewPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Xác nhận mật khẩu Admin mới
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="Nhập lại mật khẩu Admin mới..."
                          value={confirmPassInput}
                          onChange={(e) => setConfirmPassInput(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
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
                        className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-all cursor-pointer"
                        title="Đặt lại mật khẩu Admin về 'admin'"
                      >
                        Khôi phục về "admin"
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-[0.99] text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <KeyRound className="w-4 h-4" />
                        <span>Lưu mật khẩu Admin mới</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* Card 2: Member Password */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm shadow-blue-500/20">
                        <Lock className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900">
                          2. Mật Khẩu Thành Viên (Chỉ Xem)
                        </h3>
                        <p className="text-xs text-slate-500">Mật khẩu cung cấp cho các thành viên trong nhóm để truy cập cổng tra cứu</p>
                      </div>
                    </div>
                  </div>

                  {/* Active Member Password Display */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600">Mật khẩu Thành viên hiện tại:</span>
                      <span className="font-mono text-sm font-bold text-blue-700 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 tracking-wider">
                        {showMemberPassValue ? (memberPassword || '123') : '••••••'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => setShowMemberPassValue(!showMemberPassValue)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 transition-colors flex items-center gap-1 cursor-pointer"
                        title={showMemberPassValue ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showMemberPassValue ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{showMemberPassValue ? 'Ẩn' : 'Hiện'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyPassword(memberPassword || '123', 'Thành viên')}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-1.5 cursor-pointer border border-blue-200/60"
                        title="Sao chép mật khẩu gửi cho thành viên trong nhóm"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Sao chép gửi nhóm</span>
                      </button>
                    </div>
                  </div>

                  {/* Change Member Password Form */}
                  <form onSubmit={handleChangeMemberPassword} className="space-y-3.5 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Mật khẩu Thành viên mới
                        </label>
                        <div className="relative">
                          <input
                            type={showNewMemberPass ? 'text' : 'password'}
                            required
                            placeholder="Tối thiểu 3 ký tự..."
                            value={newMemberPassInput}
                            onChange={(e) => setNewMemberPassInput(e.target.value)}
                            className="w-full px-3 py-2 pr-10 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewMemberPass(!showNewMemberPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showNewMemberPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Xác nhận mật khẩu Thành viên mới
                        </label>
                        <input
                          type="password"
                          required
                          placeholder="Nhập lại mật khẩu Thành viên mới..."
                          value={confirmMemberPassInput}
                          onChange={(e) => setConfirmMemberPassInput(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
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
                        className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-all cursor-pointer"
                        title="Đặt lại mật khẩu Thành viên về '123'"
                      >
                        Khôi phục về "123"
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Lock className="w-4 h-4" />
                        <span>Lưu mật khẩu Thành viên mới</span>
                      </button>
                    </div>
                  </form>
                </div>
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

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleResetBank}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-all cursor-pointer"
                    >
                      Hủy thay đổi
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      {bankSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                      <span>{bankSaved ? 'Đã lưu thông tin tài khoản!' : 'Lưu Cài Đặt Ngân Hàng'}</span>
                    </button>
                  </div>
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
