import React, { useState, useEffect } from 'react';
import {
  Wallet,
  LayoutDashboard,
  ReceiptText,
  Target,
  Users,
  User,
  Settings,
  QrCode,
  Share2,
  X,
  ShieldCheck,
  Check,
  Copy,
  UserCheck,
  LogOut,
  Eye,
  EyeOff,
  Sun,
  Moon,
} from 'lucide-react';
import { TabType, Fund, AppBranding } from '../types';
import { formatVND, copyToClipboard, formatNumberCompact } from '../utils/formatters';
import { useTranslation } from '../i18n/LanguageContext';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  funds: Fund[];
  branding?: AppBranding;
  onOpenQRModal: () => void;
  onOpenShareModal: () => void;
  isMemberView: boolean;
  pendingTransactionsCount: number;
  activeCampaignsCount?: number;
  cloudSyncStatus?: 'connected' | 'connecting' | 'error' | 'syncing';
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  funds,
  branding,
  onOpenQRModal,
  onOpenShareModal,
  isMemberView,
  pendingTransactionsCount,
  activeCampaignsCount = 0,
  cloudSyncStatus = 'connected',
  onLogout,
}) => {
  const { t } = useTranslation();
  const {
    activePreset,
    privacyMode,
    togglePrivacyMode,
    isDarkMode,
    defaultThemeMode,
    toggleHeaderTheme,
    isHeaderThemeCustomized,
  } = useTheme();

  const handleToggleTheme = () => {
    toggleHeaderTheme();
  };

  const defaultModeLabel =
    defaultThemeMode === 'dark' ? 'Tối' : defaultThemeMode === 'system' ? 'Theo thiết bị' : 'Sáng';
  
  // States
  const [isTreasurerModalOpen, setIsTreasurerModalOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const totalBalance = funds.reduce((sum, f) => sum + f.balance, 0);
  const displayTitle = branding?.appTitle || t('portal.header_title', 'Quản Lý Quỹ');
  const treasurerName = branding?.treasurerName?.trim() || 'Trần Thị Mai';
  const treasurerPhone = branding?.treasurerPhone?.trim() || '0912345678';
  const treasurerTitle = branding?.treasurerTitle?.trim() || 'Thủ Quỹ Ban Quản Lý';

  // Close modals on escape or route change
  useEffect(() => {
    setIsTreasurerModalOpen(false);
  }, [activeTab, isMemberView]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsTreasurerModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCopy = async (key: string, text: string) => {
    if (!text) return;
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  // Nav items based on role (Admin has settings, Member has overview, transactions, campaigns, members)
  const navItems: { id: TabType; label: string; icon: React.ReactNode; badge?: number; description?: string }[] = isMemberView
    ? [
        { id: 'overview' as TabType, label: t('nav.overview', 'Tổng quan'), icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'transactions' as TabType, label: t('nav.transactions', 'Giao dịch'), icon: <ReceiptText className="w-4 h-4" /> },
        { id: 'campaigns' as TabType, label: t('nav.campaigns', 'Đóng quỹ'), icon: <Target className="w-4 h-4" /> },
        { id: 'members' as TabType, label: t('nav.members', 'Thành viên'), icon: <Users className="w-4 h-4" /> },
      ]
    : [
        { id: 'overview' as TabType, label: t('nav.overview', 'Tổng quan'), icon: <LayoutDashboard className="w-4 h-4" />, description: t('nav.desc_overview', 'Thống kê & biểu đồ') },
        { id: 'transactions' as TabType, label: t('nav.transactions', 'Giao dịch'), icon: <ReceiptText className="w-4 h-4" />, badge: pendingTransactionsCount, description: t('nav.desc_transactions', 'Lịch sử dòng tiền') },
        { id: 'campaigns' as TabType, label: t('nav.campaigns', 'Đóng quỹ'), icon: <Target className="w-4 h-4" />, description: t('nav.desc_campaigns', 'Thu tiền theo đợt') },
        { id: 'members' as TabType, label: t('nav.members', 'Thành viên'), icon: <Users className="w-4 h-4" />, description: t('nav.desc_members', 'Danh bạ & đóng góp') },
        { id: 'settings' as TabType, label: t('nav.settings', 'Cài đặt'), icon: <Settings className="w-4 h-4" />, description: t('nav.desc_settings', 'Tuỳ biến hệ thống') },
      ];

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. TOP HEADER (PERFECTLY BALANCED & HARMONIOUS LAYOUT) */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-all shadow-2xs w-full">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 w-full">
          
          {/* DESKTOP (xl+) VIEW: Perfectly balanced 3-column Grid (1fr - auto - 1fr) */}
          <div className="hidden xl:grid xl:grid-cols-[1fr_auto_1fr] items-center h-16 w-full gap-4">
            
            {/* COL 1 (LEFT): Brand Identity Capsule */}
            <div className="flex items-center gap-2.5 justify-self-start min-w-0">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 text-lg transition-all duration-300"
                style={{ background: activePreset.gradient, boxShadow: `0 4px 12px ${activePreset.primary}33` }}
              >
                {branding?.groupEmoji ? (
                  <span>{branding.groupEmoji}</span>
                ) : (
                  <Wallet className="w-4.5 h-4.5" />
                )}
              </div>
              
              <div className="flex items-center gap-2 min-w-0">
                <span 
                  title={displayTitle}
                  className="font-black text-base text-slate-900 dark:text-white tracking-tight truncate max-w-[180px]"
                >
                  {displayTitle}
                </span>

                {/* Role Pill */}
                {isMemberView ? (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 border"
                    style={{
                      backgroundColor: activePreset.primaryLight,
                      color: activePreset.primaryText,
                      borderColor: activePreset.primaryBorder,
                    }}
                  >
                    <User className="w-3 h-3" style={{ color: activePreset.primary }} />
                    <span>{t('nav.member', 'Thành viên')}</span>
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 border"
                    style={{
                      backgroundColor: activePreset.primaryLight,
                      color: activePreset.primaryText,
                      borderColor: activePreset.primaryBorder,
                    }}
                  >
                    <ShieldCheck className="w-3 h-3" style={{ color: activePreset.primary }} />
                    <span>{t('nav.admin', 'Quản trị')}</span>
                  </span>
                )}
              </div>
            </div>

            {/* COL 2 (CENTER): Mathematically centered Segmented Navigation */}
            <div className="flex items-center justify-center justify-self-center">
              <nav className="flex items-center bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-2xl border border-slate-200/70 dark:border-slate-700 shadow-2xs gap-0.5">
                {navItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`header-nav-tab-${item.id}`}
                      onClick={() => setActiveTab(item.id)}
                      style={{
                        color: isActive ? activePreset.primary : undefined,
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        isActive
                          ? 'bg-white dark:bg-slate-900 font-bold shadow-xs border border-slate-200/60 dark:border-slate-700'
                          : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                          isActive ? 'bg-amber-500 text-white' : 'bg-amber-500 text-white animate-pulse'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* COL 3 (RIGHT): Proportional & Harmonious Action Group */}
            <div className="flex items-center gap-2 justify-self-end">
              {/* Tồn Quỹ Capsule (with integrated cloud indicator + Privacy Eye) */}
              <div 
                title={`Tổng tồn quỹ: ${privacyMode ? '•••••••• ₫' : formatVND(totalBalance)} • Bấm mắt để ẩn/hiện`}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-2xs select-none"
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  cloudSyncStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-ping'
                }`} />
                <span className="text-xs font-black text-slate-900 dark:text-white font-mono">
                  {privacyMode ? '•••••••• ₫' : formatVND(totalBalance)}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    togglePrivacyMode();
                  }}
                  title={privacyMode ? 'Hiện số tiền quỹ' : 'Ẩn số tiền quỹ (Chế độ riêng tư)'}
                  className="p-0.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer ml-0.5 transition-colors"
                >
                  {privacyMode ? <EyeOff className="w-3.5 h-3.5 text-amber-500" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* VietQR Quick Trigger */}
              <button
                id="desktop-header-vietqr-btn"
                onClick={onOpenQRModal}
                title={t('vietqr.title', 'Tạo mã VietQR nhận tiền đóng quỹ')}
                style={{
                  backgroundColor: `${activePreset.primary}12`,
                  borderColor: `${activePreset.primary}30`,
                  color: activePreset.primary,
                }}
                className="px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer hover:opacity-85 border"
              >
                <QrCode className="w-3.5 h-3.5 shrink-0" style={{ color: activePreset.primary }} />
                <span>{t('nav.vietqr', 'VietQR')}</span>
              </button>

              {/* Share Portal Button */}
              <button
                id="desktop-header-share-btn"
                onClick={onOpenShareModal}
                title={t('share.subtitle', 'Chia sẻ liên kết truy cập công khai minh bạch hoặc quét mã QR')}
                style={{
                  backgroundColor: `${activePreset.primary}12`,
                  borderColor: `${activePreset.primary}30`,
                  color: activePreset.primary,
                }}
                className="px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer hover:opacity-85 border"
              >
                <Share2 className="w-3.5 h-3.5 shrink-0" style={{ color: activePreset.primary }} />
                <span>{t('nav.share', 'Chia sẻ')}</span>
              </button>

              {/* Theme Mode Quick Toggle (Sun / Moon) - Tùy chọn sau khi truy cập */}
              <button
                type="button"
                id="desktop-header-theme-toggle-btn"
                onClick={handleToggleTheme}
                title={
                  isDarkMode
                    ? `Tùy chọn sau khi truy cập: Đang xem nền Tối • Bấm đổi sang nền Sáng (Mặc định khi truy cập: ${defaultModeLabel})`
                    : `Tùy chọn sau khi truy cập: Đang xem nền Sáng • Bấm đổi sang nền Tối (Mặc định khi truy cập: ${defaultModeLabel})`
                }
                className="relative w-8 h-8 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-amber-400 hover:text-slate-900 dark:hover:text-amber-300 transition-all flex items-center justify-center cursor-pointer shadow-2xs shrink-0"
                aria-label="Tùy chọn giao diện sau khi truy cập"
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-400 fill-amber-400/20" /> : <Moon className="w-4 h-4 text-slate-600" />}
                {isHeaderThemeCustomized && (
                  <span
                    title={`Đang dùng giao diện tùy chọn phiên hiện tại (Khác mặc định: ${defaultModeLabel})`}
                    className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 ring-1.5 ring-white dark:ring-slate-900"
                  />
                )}
              </button>

              {/* Direct Desktop Logout Button */}
              {onLogout && (
                <button
                  type="button"
                  id="desktop-header-logout-btn"
                  onClick={onLogout}
                  title={isMemberView ? "Đăng xuất tài khoản Thành viên" : "Đăng xuất tài khoản Quản trị"}
                  className="px-2.5 py-1.5 rounded-xl text-rose-600 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 hover:text-rose-700 border border-rose-200 dark:border-rose-800 transition-all flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t('nav.logout', 'Đăng xuất')}</span>
                </button>
              )}
            </div>
          </div>

          {/* TABLET & MOBILE (< xl) VIEW */}
          <div className="flex xl:hidden items-center justify-between h-14 md:h-16 gap-1.5 sm:gap-2 w-full min-w-0">
            
            {/* Left: Brand Identity */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 min-w-0">
              <div
                className="w-7.5 h-7.5 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-white shrink-0 text-sm sm:text-lg transition-all duration-300"
                style={{ background: activePreset.gradient, boxShadow: `0 4px 12px ${activePreset.primary}33` }}
              >
                {branding?.groupEmoji ? (
                  <span>{branding.groupEmoji}</span>
                ) : (
                  <Wallet className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                )}
              </div>
              
              <div className="flex items-center gap-1.5 min-w-0">
                <span 
                  title={displayTitle}
                  className="font-black text-xs xs:text-sm sm:text-base text-slate-900 dark:text-white tracking-tight truncate max-w-[80px] xs:max-w-[115px] sm:max-w-[150px]"
                >
                  {displayTitle}
                </span>

                {/* Role Pill */}
                {isMemberView ? (
                  <span
                    className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 border"
                    style={{
                      backgroundColor: activePreset.primaryLight,
                      color: activePreset.primaryText,
                      borderColor: activePreset.primaryBorder,
                    }}
                  >
                    <User className="w-3 h-3" style={{ color: activePreset.primary }} />
                    <span>{t('nav.member', 'Thành viên')}</span>
                  </span>
                ) : (
                  <span
                    className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 border"
                    style={{
                      backgroundColor: activePreset.primaryLight,
                      color: activePreset.primaryText,
                      borderColor: activePreset.primaryBorder,
                    }}
                  >
                    <ShieldCheck className="w-3 h-3" style={{ color: activePreset.primary }} />
                    <span>{t('nav.admin', 'Quản trị')}</span>
                  </span>
                )}
              </div>
            </div>

              {/* Medium Screen (md to xl) Controls */}
            <div className="hidden md:flex items-center gap-2 shrink-0">
              
              {/* Total Balance Pill */}
              <div 
                title={`${t('nav.balance_title', 'Tổng tồn quỹ')}: ${privacyMode ? '•••••••• ₫' : formatVND(totalBalance)}`}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-2xs"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="text-xs font-black text-slate-900 dark:text-white font-mono">
                  {privacyMode ? '•••••••• ₫' : formatVND(totalBalance)}
                </span>
                <button
                  type="button"
                  onClick={togglePrivacyMode}
                  className="p-0.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                >
                  {privacyMode ? <EyeOff className="w-3 h-3 text-amber-500" /> : <Eye className="w-3 h-3" />}
                </button>
              </div>

              {/* VietQR Quick Trigger */}
              <button
                id="medium-header-vietqr-btn"
                onClick={onOpenQRModal}
                title={t('vietqr.title', 'Tạo mã VietQR nhận tiền đóng quỹ')}
                style={{
                  backgroundColor: `${activePreset.primary}12`,
                  borderColor: `${activePreset.primary}30`,
                  color: activePreset.primary,
                }}
                className="px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer hover:opacity-85 border"
              >
                <QrCode className="w-3.5 h-3.5 shrink-0" style={{ color: activePreset.primary }} />
                <span>{t('nav.vietqr', 'VietQR')}</span>
              </button>

              {/* Share Portal Button */}
              <button
                id="medium-header-share-btn"
                onClick={onOpenShareModal}
                title={t('share.subtitle', 'Chia sẻ liên kết truy cập công khai minh bạch hoặc quét mã QR')}
                style={{
                  backgroundColor: `${activePreset.primary}12`,
                  borderColor: `${activePreset.primary}30`,
                  color: activePreset.primary,
                }}
                className="px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer hover:opacity-85 border"
              >
                <Share2 className="w-3.5 h-3.5 shrink-0" style={{ color: activePreset.primary }} />
                <span>{t('nav.share', 'Chia sẻ')}</span>
              </button>

              {/* Theme Mode Quick Toggle (Sun / Moon) - Tùy chọn sau khi truy cập */}
              <button
                type="button"
                id="medium-header-theme-toggle-btn"
                onClick={handleToggleTheme}
                title={
                  isDarkMode
                    ? `Tùy chọn sau khi truy cập: Đang xem nền Tối • Bấm đổi sang nền Sáng (Mặc định khi truy cập: ${defaultModeLabel})`
                    : `Tùy chọn sau khi truy cập: Đang xem nền Sáng • Bấm đổi sang nền Tối (Mặc định khi truy cập: ${defaultModeLabel})`
                }
                className="relative w-8 h-8 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-amber-400 hover:text-slate-900 dark:hover:text-amber-300 transition-all flex items-center justify-center cursor-pointer shadow-2xs shrink-0"
                aria-label="Tùy chọn giao diện sau khi truy cập"
              >
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-400 fill-amber-400/20" /> : <Moon className="w-4 h-4 text-slate-600" />}
                {isHeaderThemeCustomized && (
                  <span
                    title={`Đang dùng giao diện tùy chọn phiên hiện tại (Khác mặc định: ${defaultModeLabel})`}
                    className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 ring-1.5 ring-white dark:ring-slate-900"
                  />
                )}
              </button>

              {/* Direct Desktop Logout Button */}
              {onLogout && (
                <button
                  type="button"
                  id="medium-header-logout-btn"
                  onClick={onLogout}
                  title={isMemberView ? "Đăng xuất tài khoản Thành viên" : "Đăng xuất tài khoản Quản trị"}
                  className="px-2.5 py-1.5 rounded-xl text-rose-600 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 transition-all flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Đăng xuất</span>
                </button>
              )}
            </div>

            {/* MOBILE COMPACT TOP CONTROLS (< md) */}
            <div className="flex md:hidden items-center gap-1 shrink-0">
              
              {/* Mobile Compact Balance Badge */}
              <div 
                onClick={() => setIsTreasurerModalOpen(true)}
                className="flex items-center gap-1 px-1.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-mono font-bold cursor-pointer active:scale-95 transition-all shadow-2xs shrink-0 select-none"
                title="Bấm xem thông tin chủ quỹ"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>{privacyMode ? '••••••' : `${formatNumberCompact(totalBalance)} ₫`}</span>
              </div>

              {/* VietQR Quick Trigger */}
              <button
                type="button"
                id="mobile-top-vietqr-btn"
                onClick={onOpenQRModal}
                title="Tạo mã VietQR đóng quỹ"
                style={{
                  backgroundColor: isDarkMode ? `${activePreset.primary}22` : activePreset.primaryLight,
                  borderColor: isDarkMode ? `${activePreset.primary}45` : activePreset.primaryBorder,
                  color: isDarkMode ? '#ffffff' : activePreset.primaryText,
                }}
                className="w-8 h-8 rounded-xl border active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-2xs shrink-0"
                aria-label="VietQR"
              >
                <QrCode className="w-4 h-4" style={{ color: activePreset.primary }} />
              </button>

              {/* Share Portal Button */}
              <button
                type="button"
                id="mobile-top-share-btn"
                onClick={onOpenShareModal}
                title="Chia sẻ link sổ quỹ"
                style={{
                  backgroundColor: isDarkMode ? `${activePreset.primary}22` : activePreset.primaryLight,
                  borderColor: isDarkMode ? `${activePreset.primary}45` : activePreset.primaryBorder,
                  color: isDarkMode ? '#ffffff' : activePreset.primaryText,
                }}
                className="w-8 h-8 rounded-xl border active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-2xs shrink-0 hover:opacity-85"
                aria-label="Chia sẻ"
              >
                <Share2 className="w-4 h-4" style={{ color: activePreset.primary }} />
              </button>

              {/* Mobile Theme Toggle Button - Tùy chọn sau khi truy cập */}
              <button
                type="button"
                id="mobile-top-theme-btn"
                onClick={handleToggleTheme}
                title={
                  isDarkMode
                    ? `Tùy chọn: Chuyển sang Sáng (Mặc định: ${defaultModeLabel})`
                    : `Tùy chọn: Chuyển sang Tối (Mặc định: ${defaultModeLabel})`
                }
                className="relative w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-amber-400 border border-slate-200 dark:border-slate-700 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-2xs shrink-0"
                aria-label="Tùy chọn giao diện"
              >
                {isDarkMode ? <Sun className="w-4 h-4 fill-amber-400/20" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Mobile Quick Logout Button */}
              {onLogout && (
                <button
                  type="button"
                  id="mobile-quick-logout-btn"
                  onClick={onLogout}
                  title={isMemberView ? "Đăng xuất Thành viên" : "Đăng xuất Quản trị"}
                  className="w-8 h-8 rounded-xl text-rose-600 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 active:scale-95 transition-all flex items-center justify-center cursor-pointer shrink-0 shadow-2xs"
                  aria-label="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}

            </div>

          </div>
        </div>

        {/* Medium Screen (md to xl) Navigation Strip - PERFECTLY CENTERED */}
        <div className="hidden md:flex xl:hidden justify-center items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-100 dark:border-slate-800/80 py-1.5">
          <nav className="flex items-center bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-2xl border border-slate-200/70 dark:border-slate-700 shadow-2xs gap-0.5">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`medium-header-nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    color: isActive ? activePreset.primary : undefined,
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 font-bold shadow-xs border border-slate-200/60 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-amber-500 text-white' : 'bg-amber-500 text-white animate-pulse'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MOBILE BOTTOM NAVIGATION DOCK (NATIVE APP FEEL - OPTIMIZED BUTTONS) */}
      {/* ========================================================================= */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/90 dark:border-slate-800 shadow-xl px-2 pt-1.5 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] flex items-center justify-around select-none">
        
        {!isMemberView ? (
          /* Admin Mobile Dock - 5 balanced primary tabs (20% width each) */
          <>
            {/* 1. Tổng quan */}
            <button
              type="button"
              id="mobile-dock-overview"
              onClick={() => setActiveTab('overview')}
              style={{
                color: activeTab === 'overview' ? activePreset.primary : undefined,
                backgroundColor: activeTab === 'overview' ? (isDarkMode ? `${activePreset.primary}25` : activePreset.primaryLight) : undefined,
              }}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all duration-150 active:scale-90 cursor-pointer ${
                activeTab === 'overview' 
                  ? 'font-bold shadow-2xs' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className={`w-5 h-5 ${activeTab === 'overview' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] mt-0.5 whitespace-nowrap">{t('nav.overview', 'Tổng quan')}</span>
            </button>

            {/* 2. Sổ thu chi */}
            <button
              type="button"
              id="mobile-dock-transactions"
              onClick={() => setActiveTab('transactions')}
              style={{
                color: activeTab === 'transactions' ? activePreset.primary : undefined,
                backgroundColor: activeTab === 'transactions' ? (isDarkMode ? `${activePreset.primary}25` : activePreset.primaryLight) : undefined,
              }}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all duration-150 active:scale-90 relative cursor-pointer ${
                activeTab === 'transactions' 
                  ? 'font-bold shadow-2xs' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <ReceiptText className={`w-5 h-5 ${activeTab === 'transactions' ? 'stroke-[2.5]' : ''}`} />
                {pendingTransactionsCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
                )}
              </div>
              <span className="text-[10px] mt-0.5 whitespace-nowrap">{t('nav.transactions', 'Thu chi')}</span>
            </button>

            {/* 3. Đợt đóng quỹ */}
            <button
              type="button"
              id="mobile-dock-campaigns"
              onClick={() => setActiveTab('campaigns')}
              style={{
                color: activeTab === 'campaigns' ? activePreset.primary : undefined,
                backgroundColor: activeTab === 'campaigns' ? (isDarkMode ? `${activePreset.primary}25` : activePreset.primaryLight) : undefined,
              }}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all duration-150 active:scale-90 relative cursor-pointer ${
                activeTab === 'campaigns' 
                  ? 'font-bold shadow-2xs' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Target className={`w-5 h-5 ${activeTab === 'campaigns' ? 'stroke-[2.5]' : ''}`} />
                {activeCampaignsCount > 0 && (
                  <span
                    style={{ backgroundColor: activePreset.primary }}
                    className="absolute -top-1 -right-2 px-1 rounded-full text-[9px] font-black text-white min-w-[14px] text-center"
                  >
                    {activeCampaignsCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 whitespace-nowrap">{t('nav.campaigns', 'Đợt quỹ')}</span>
            </button>

            {/* 4. Danh sách Thành viên */}
            <button
              type="button"
              id="mobile-dock-members"
              onClick={() => setActiveTab('members')}
              style={{
                color: activeTab === 'members' ? activePreset.primary : undefined,
                backgroundColor: activeTab === 'members' ? (isDarkMode ? `${activePreset.primary}25` : activePreset.primaryLight) : undefined,
              }}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all duration-150 active:scale-90 cursor-pointer ${
                activeTab === 'members' 
                  ? 'font-bold shadow-2xs' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Users className={`w-5 h-5 ${activeTab === 'members' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] mt-0.5 whitespace-nowrap">{t('nav.members', 'Thành viên')}</span>
            </button>

            {/* 5. Cài đặt hệ thống */}
            <button
              type="button"
              id="mobile-dock-settings"
              onClick={() => setActiveTab('settings')}
              style={{
                color: activeTab === 'settings' ? activePreset.primary : undefined,
                backgroundColor: activeTab === 'settings' ? (isDarkMode ? `${activePreset.primary}25` : activePreset.primaryLight) : undefined,
              }}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all duration-150 active:scale-90 cursor-pointer ${
                activeTab === 'settings' 
                  ? 'font-bold shadow-2xs' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Settings className={`w-5 h-5 ${activeTab === 'settings' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] mt-0.5 whitespace-nowrap">{t('nav.settings', 'Cài đặt')}</span>
            </button>
          </>
        ) : (
          /* Member Mobile Dock - 4 balanced primary items (25% width each) */
          <>
            {/* 1. Tổng quan */}
            <button
              type="button"
              id="member-mobile-dock-overview"
              onClick={() => setActiveTab('overview')}
              style={{
                color: activeTab === 'overview' ? activePreset.primary : undefined,
                backgroundColor: activeTab === 'overview' ? (isDarkMode ? `${activePreset.primary}25` : activePreset.primaryLight) : undefined,
              }}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-150 active:scale-90 cursor-pointer ${
                activeTab === 'overview' 
                  ? 'font-bold shadow-2xs' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className={`w-5 h-5 ${activeTab === 'overview' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] mt-0.5 whitespace-nowrap">{t('nav.overview', 'Tổng quan')}</span>
            </button>

            {/* 2. Giao dịch */}
            <button
              type="button"
              id="member-mobile-dock-transactions"
              onClick={() => setActiveTab('transactions')}
              style={{
                color: activeTab === 'transactions' ? activePreset.primary : undefined,
                backgroundColor: activeTab === 'transactions' ? (isDarkMode ? `${activePreset.primary}25` : activePreset.primaryLight) : undefined,
              }}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-150 active:scale-90 cursor-pointer ${
                activeTab === 'transactions' 
                  ? 'font-bold shadow-2xs' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <ReceiptText className={`w-5 h-5 ${activeTab === 'transactions' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] mt-0.5 whitespace-nowrap">{t('nav.transactions', 'Giao dịch')}</span>
            </button>

            {/* 3. Đóng quỹ */}
            <button
              type="button"
              id="member-mobile-dock-campaigns"
              onClick={() => setActiveTab('campaigns')}
              style={{
                color: activeTab === 'campaigns' ? activePreset.primary : undefined,
                backgroundColor: activeTab === 'campaigns' ? (isDarkMode ? `${activePreset.primary}25` : activePreset.primaryLight) : undefined,
              }}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-150 active:scale-90 relative cursor-pointer ${
                activeTab === 'campaigns' 
                  ? 'font-bold shadow-2xs' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Target className={`w-5 h-5 ${activeTab === 'campaigns' ? 'stroke-[2.5]' : ''}`} />
                {activeCampaignsCount > 0 && (
                  <span
                    style={{ backgroundColor: activePreset.primary }}
                    className="absolute -top-1 -right-2 px-1 rounded-full text-[9px] font-black text-white min-w-[14px] text-center"
                  >
                    {activeCampaignsCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 whitespace-nowrap">{t('nav.campaigns', 'Đóng quỹ')}</span>
            </button>

            {/* 4. Thành viên */}
            <button
              type="button"
              id="member-mobile-dock-members"
              onClick={() => setActiveTab('members')}
              style={{
                color: activeTab === 'members' ? activePreset.primary : undefined,
                backgroundColor: activeTab === 'members' ? (isDarkMode ? `${activePreset.primary}25` : activePreset.primaryLight) : undefined,
              }}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-150 active:scale-90 cursor-pointer ${
                activeTab === 'members' 
                  ? 'font-bold shadow-2xs' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Users className={`w-5 h-5 ${activeTab === 'members' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] mt-0.5 whitespace-nowrap">{t('nav.members', 'Thành viên')}</span>
            </button>
          </>
        )}

      </nav>

      {/* ========================================================================= */}
      {/* 3. TREASURER INFO POPUP FOR MOBILE QUICK ACCESS */}
      {/* ========================================================================= */}
      {isTreasurerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div 
            className="absolute inset-0"
            onClick={() => setIsTreasurerModalOpen(false)}
          />

          <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 space-y-4 shadow-2xl z-10 animate-in zoom-in-95 duration-150 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                <UserCheck className="w-4 h-4" style={{ color: activePreset.primary }} />
                <span>{t('login.owner_info_title', 'Thông tin chủ quỹ')}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsTreasurerModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700 space-y-1">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">{t('common.treasurer_title', 'Thủ quỹ / Chủ quản')}:</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white block">{treasurerName}</span>
                <span className="text-[11px] font-medium block" style={{ color: activePreset.primary }}>{treasurerTitle}</span>
              </div>

              {treasurerPhone && (
                <div
                  style={{ backgroundColor: `${activePreset.primary}0D`, borderColor: `${activePreset.primary}25` }}
                  className="p-3 rounded-2xl border flex items-center justify-between"
                >
                  <div>
                    <span className="text-[11px] font-medium block" style={{ color: activePreset.primary }}>{t('common.phone', 'Số điện thoại')}</span>
                    <a
                      href={`tel:${treasurerPhone}`}
                      className="font-bold text-slate-900 dark:text-white font-mono text-sm"
                    >
                      {treasurerPhone}
                    </a>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopy('phone', treasurerPhone)}
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:opacity-80 transition-colors cursor-pointer"
                    >
                      {copiedKey === 'phone' ? <Check className="w-3.5 h-3.5" style={{ color: activePreset.primary }} /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <a
                      href={`tel:${treasurerPhone}`}
                      style={{ background: activePreset.gradient }}
                      className="px-2.5 py-1.5 rounded-lg hover:opacity-90 active:scale-95 text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
                    >
                      {t('common.call', 'Gọi')}
                    </a>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsTreasurerModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
            >
              {t('common.close', 'Đóng')}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
