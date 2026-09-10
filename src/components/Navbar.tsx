import React, { useState, useEffect } from 'react';
import {
  Wallet,
  LayoutDashboard,
  ReceiptText,
  Target,
  Users,
  Settings,
  QrCode,
  Share2,
  Cloud,
  X,
  MoreHorizontal,
  ChevronRight,
  ShieldCheck,
  Check,
  Copy,
  UserCheck,
  LogOut
} from 'lucide-react';
import { TabType, Fund, AppBranding } from '../types';
import { formatVND, copyToClipboard, formatNumberCompact } from '../utils/formatters';
import { useTranslation } from '../i18n/LanguageContext';

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
  
  // States
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isTreasurerModalOpen, setIsTreasurerModalOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const totalBalance = funds.reduce((sum, f) => sum + f.balance, 0);
  const displayTitle = branding?.appTitle || t('portal.header_title', 'Quản Lý Quỹ');
  const treasurerName = branding?.treasurerName?.trim() || 'Trần Thị Mai';
  const treasurerPhone = branding?.treasurerPhone?.trim() || '0912345678';
  const treasurerTitle = branding?.treasurerTitle?.trim() || 'Thủ Quỹ Ban Quản Lý';

  // Close modals on escape or route change
  useEffect(() => {
    setIsMobileDrawerOpen(false);
    setIsTreasurerModalOpen(false);
  }, [activeTab, isMemberView]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileDrawerOpen(false);
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

  // Nav Items for Admin
  const navItems: { id: TabType; label: string; icon: React.ReactNode; badge?: number; description?: string }[] = [
    { id: 'overview', label: t('nav.overview', 'Tổng quan'), icon: <LayoutDashboard className="w-4 h-4" />, description: 'Thống kê & biểu đồ' },
    { id: 'transactions', label: t('nav.transactions', 'Sổ thu chi'), icon: <ReceiptText className="w-4 h-4" />, badge: pendingTransactionsCount, description: 'Lịch sử dòng tiền' },
    { id: 'campaigns', label: t('nav.campaigns', 'Đợt quỹ'), icon: <Target className="w-4 h-4" />, description: 'Thu tiền theo đợt' },
    { id: 'members', label: t('nav.members', 'Thành viên'), icon: <Users className="w-4 h-4" />, description: 'Danh bạ & đóng góp' },
    { id: 'settings', label: t('nav.settings', 'Cài đặt'), icon: <Settings className="w-4 h-4" />, description: 'Tuỳ biến hệ thống' },
  ];

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. TOP HEADER (PERFECTLY BALANCED & HARMONIOUS LAYOUT) */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-all shadow-2xs w-full">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
          
          {/* DESKTOP (xl+) VIEW: Perfectly balanced 3-column Grid (1fr - auto - 1fr) */}
          <div className="hidden xl:grid xl:grid-cols-[1fr_auto_1fr] items-center h-16 w-full gap-4">
            
            {/* COL 1 (LEFT): Brand Identity Capsule */}
            <div className="flex items-center gap-2.5 justify-self-start min-w-0">
              <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0 text-lg">
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
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/90 dark:border-emerald-800 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Thành viên</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/90 dark:border-blue-800 shrink-0">
                    <ShieldCheck className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    <span>Quản trị</span>
                  </span>
                )}
              </div>
            </div>

            {/* COL 2 (CENTER): Mathematically centered Segmented Navigation */}
            <div className="flex items-center justify-center justify-self-center">
              {!isMemberView ? (
                <nav className="flex items-center bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-2xl border border-slate-200/70 dark:border-slate-700 shadow-2xs gap-0.5">
                  {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        id={`header-nav-tab-${item.id}`}
                        onClick={() => setActiveTab(item.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                          isActive
                            ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold shadow-xs border border-slate-200/60 dark:border-slate-700'
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
              ) : (
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-semibold shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span>Sổ Quỹ Công Khai • Dữ liệu thời gian thực</span>
                </div>
              )}
            </div>

            {/* COL 3 (RIGHT): Proportional & Harmonious Action Group */}
            <div className="flex items-center gap-2 justify-self-end">
              {/* Tồn Quỹ Capsule (with integrated cloud indicator) */}
              <div 
                title={`Tổng tồn quỹ: ${formatVND(totalBalance)} • ${cloudSyncStatus === 'connected' ? 'Firestore Online' : 'Đang kết nối Cloud...'}`}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-2xs select-none"
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  cloudSyncStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-ping'
                }`} />
                <span className="text-xs font-black text-slate-900 dark:text-white font-mono">
                  {formatVND(totalBalance)}
                </span>
              </div>

              {/* VietQR Quick Trigger */}
              <button
                id="desktop-header-vietqr-btn"
                onClick={onOpenQRModal}
                title="Tạo mã VietQR nhận tiền đóng quỹ"
                className="px-2.5 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 transition-colors flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                <span>VietQR</span>
              </button>

              {/* Share Portal Button */}
              <button
                id="desktop-header-share-btn"
                onClick={onOpenShareModal}
                title="Chia sẻ link sổ quỹ cho thành viên"
                className="px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-all flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>Chia sẻ</span>
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
                  <span>Đăng xuất</span>
                </button>
              )}
            </div>
          </div>

          {/* TABLET & MOBILE (< xl) VIEW */}
          <div className="flex xl:hidden items-center justify-between h-14 md:h-16 gap-2 w-full min-w-0">
            
            {/* Left: Brand Identity */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0 text-base sm:text-lg">
                {branding?.groupEmoji ? (
                  <span>{branding.groupEmoji}</span>
                ) : (
                  <Wallet className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                )}
              </div>
              
              <div className="flex items-center gap-1.5 min-w-0">
                <span 
                  title={displayTitle}
                  className="font-black text-sm sm:text-base text-slate-900 dark:text-white tracking-tight truncate max-w-[110px] sm:max-w-[150px]"
                >
                  {displayTitle}
                </span>

                {/* Role Pill */}
                {isMemberView ? (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/90 dark:border-emerald-800 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Thành viên</span>
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/90 dark:border-blue-800 shrink-0">
                    <ShieldCheck className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    <span>Quản trị</span>
                  </span>
                )}
              </div>
            </div>

            {/* Medium Screen (md to xl) Controls */}
            <div className="hidden md:flex items-center gap-2 shrink-0">
              
              {/* Total Balance Pill */}
              <div 
                title={`Tổng tồn quỹ: ${formatVND(totalBalance)}`}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-2xs"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="text-xs font-black text-slate-900 dark:text-white font-mono">
                  {formatVND(totalBalance)}
                </span>
              </div>

              {/* VietQR Quick Trigger */}
              <button
                id="medium-header-vietqr-btn"
                onClick={onOpenQRModal}
                title="Tạo mã VietQR nhận tiền đóng quỹ"
                className="px-2.5 py-1.5 rounded-xl bg-teal-50 dark:bg-teal-950/50 hover:bg-teal-100 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 transition-colors flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                <span>VietQR</span>
              </button>

              {/* Share Portal Button */}
              <button
                id="medium-header-share-btn"
                onClick={onOpenShareModal}
                title="Chia sẻ link sổ quỹ cho thành viên"
                className="px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-all flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>Chia sẻ</span>
              </button>

              {/* Direct Desktop Logout Button */}
              {onLogout && (
                <button
                  type="button"
                  id="medium-header-logout-btn"
                  onClick={onLogout}
                  title={isMemberView ? "Đăng xuất tài khoản Thành viên" : "Đăng xuất tài khoản Quản trị"}
                  className="px-2.5 py-1.5 rounded-xl text-rose-600 dark:text-rose-400 bg-rose-50/80 hover:bg-rose-100 border border-rose-200 dark:border-rose-800 transition-all flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Đăng xuất</span>
                </button>
              )}
            </div>

            {/* MOBILE COMPACT TOP CONTROLS (< md) */}
            <div className="flex md:hidden items-center gap-1.5 shrink-0">
              
              {/* Mobile Compact Balance Badge */}
              <div 
                onClick={() => setIsTreasurerModalOpen(true)}
                className="flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-mono font-bold cursor-pointer"
                title="Bấm xem thông tin chủ quỹ"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{formatNumberCompact(totalBalance)} ₫</span>
              </div>

              {/* Mobile Quick Logout Button */}
              {onLogout && (
                <button
                  type="button"
                  id="mobile-quick-logout-btn"
                  onClick={onLogout}
                  title={isMemberView ? "Đăng xuất Thành viên" : "Đăng xuất Quản trị"}
                  className="p-2 rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 dark:border-rose-800 transition-all flex items-center justify-center cursor-pointer shrink-0"
                  aria-label="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}

              {/* Mobile Drawer Button */}
              <button
                type="button"
                id="mobile-top-drawer-btn"
                onClick={() => setIsMobileDrawerOpen(true)}
                className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-all flex items-center justify-center cursor-pointer"
                aria-label="Mở menu"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

            </div>

          </div>
        </div>

        {/* Medium Screen (md to xl) Navigation Strip - PERFECTLY CENTERED */}
        {!isMemberView && (
          <div className="hidden md:flex xl:hidden justify-center items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-100 dark:border-slate-800/80 py-2">
            <nav className="flex items-center bg-slate-100/90 dark:bg-slate-800/90 p-1 rounded-2xl border border-slate-200/70 dark:border-slate-700 shadow-2xs gap-0.5">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`medium-header-nav-tab-${item.id}`}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold shadow-xs border border-slate-200/60 dark:border-slate-700'
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
        )}
      </header>

      {/* ========================================================================= */}
      {/* 2. MOBILE BOTTOM NAVIGATION DOCK (NATIVE APP FEEL - FIXED AT BOTTOM) */}
      {/* ========================================================================= */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-xl px-1.5 py-1 flex items-center justify-around select-none">
        
        {!isMemberView ? (
          /* Admin Mobile Dock - 5 balanced items (20% width each) */
          <>
            {/* 1. Tổng quan */}
            <button
              type="button"
              id="mobile-dock-overview"
              onClick={() => setActiveTab('overview')}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'overview' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutDashboard className={`w-5 h-5 ${activeTab === 'overview' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] mt-0.5 whitespace-nowrap">Tổng quan</span>
            </button>

            {/* 2. Sổ thu chi */}
            <button
              type="button"
              id="mobile-dock-transactions"
              onClick={() => setActiveTab('transactions')}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all relative cursor-pointer ${
                activeTab === 'transactions' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <ReceiptText className={`w-5 h-5 ${activeTab === 'transactions' ? 'stroke-[2.5]' : ''}`} />
                {pendingTransactionsCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white animate-pulse" />
                )}
              </div>
              <span className="text-[10px] mt-0.5 whitespace-nowrap">Thu chi</span>
            </button>

            {/* 3. Đợt đóng quỹ */}
            <button
              type="button"
              id="mobile-dock-campaigns"
              onClick={() => setActiveTab('campaigns')}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all relative cursor-pointer ${
                activeTab === 'campaigns' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Target className={`w-5 h-5 ${activeTab === 'campaigns' ? 'stroke-[2.5]' : ''}`} />
                {activeCampaignsCount > 0 && (
                  <span className="absolute -top-1 -right-2 px-1 rounded-full text-[9px] font-black bg-blue-600 text-white min-w-[14px] text-center">
                    {activeCampaignsCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 whitespace-nowrap">Đợt quỹ</span>
            </button>

            {/* 4. Danh sách Thành viên */}
            <button
              type="button"
              id="mobile-dock-members"
              onClick={() => setActiveTab('members')}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'members' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className={`w-5 h-5 ${activeTab === 'members' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] mt-0.5 whitespace-nowrap">Thành viên</span>
            </button>

            {/* 5. Menu Thêm (Drawer) */}
            <button
              type="button"
              id="mobile-dock-more"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
            >
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 whitespace-nowrap">Thêm</span>
            </button>
          </>
        ) : (
          /* Member Mobile Dock - 5 balanced items (20% width each, perfectly aligned) */
          <>
            {/* 1. Tổng quan */}
            <button
              type="button"
              id="member-mobile-dock-overview"
              onClick={() => setActiveTab('overview')}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'overview' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutDashboard className={`w-5 h-5 ${activeTab === 'overview' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] mt-0.5 whitespace-nowrap">Tổng quan</span>
            </button>

            {/* 2. Giao dịch */}
            <button
              type="button"
              id="member-mobile-dock-transactions"
              onClick={() => setActiveTab('transactions')}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'transactions' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ReceiptText className={`w-5 h-5 ${activeTab === 'transactions' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] mt-0.5 whitespace-nowrap">Giao dịch</span>
            </button>

            {/* 3. Đóng quỹ */}
            <button
              type="button"
              id="member-mobile-dock-campaigns"
              onClick={() => setActiveTab('campaigns')}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all relative cursor-pointer ${
                activeTab === 'campaigns' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Target className={`w-5 h-5 ${activeTab === 'campaigns' ? 'stroke-[2.5]' : ''}`} />
                {activeCampaignsCount > 0 && (
                  <span className="absolute -top-1 -right-2 px-1 rounded-full text-[9px] font-black bg-blue-600 text-white min-w-[14px] text-center">
                    {activeCampaignsCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 whitespace-nowrap">Đóng quỹ</span>
            </button>

            {/* 4. Thành viên */}
            <button
              type="button"
              id="member-mobile-dock-members"
              onClick={() => setActiveTab('members')}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all cursor-pointer ${
                activeTab === 'members' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className={`w-5 h-5 ${activeTab === 'members' ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] mt-0.5 whitespace-nowrap">Thành viên</span>
            </button>

            {/* 5. Menu Thêm (Drawer) */}
            <button
              type="button"
              id="member-mobile-dock-more"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="flex-1 flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
            >
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-[10px] mt-0.5 whitespace-nowrap">Thêm</span>
            </button>
          </>
        )}

      </nav>

      {/* ========================================================================= */}
      {/* 3. MOBILE DRAWER (MENU THÊM CHO CẢ ADMIN & THÀNH VIÊN) */}
      {/* ========================================================================= */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div 
            className="absolute inset-0"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          <div className="relative w-full max-w-lg bg-white rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl z-10 animate-in slide-in-from-bottom-8 duration-200">
            
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 rounded-t-3xl">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white text-sm shadow-xs font-bold">
                  {branding?.groupEmoji || <Wallet className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 leading-tight">
                    {displayTitle}
                  </h3>
                  <span className="text-[11px] text-slate-500 font-normal">
                    {isMemberView ? 'Chế độ Thành viên' : 'Chế độ Quản trị viên'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar pb-8">
              
              {/* Total Balance Card */}
              <div className="p-4 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-blue-100 font-medium block">Tổng tồn quỹ hiện tại</span>
                  <span className="text-xl font-black tracking-tight text-white font-mono">
                    {formatVND(totalBalance)}
                  </span>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-pulse shadow-xs" />
              </div>

              {/* Fund Owner Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <span>Chủ quản lý quỹ</span>
                  </div>
                  <span className="text-[10px] text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full font-semibold">
                    {treasurerTitle}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/50">
                  <span className="text-slate-600 font-semibold">{treasurerName}</span>
                  {treasurerPhone && (
                    <a
                      href={`tel:${treasurerPhone}`}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-xs font-bold"
                    >
                      {treasurerPhone}
                    </a>
                  )}
                </div>
              </div>

              {/* Member Quick Tools in Drawer */}
              {isMemberView && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                    Công cụ nhanh
                  </span>
                  <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden bg-white">
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileDrawerOpen(false);
                        onOpenQRModal();
                      }}
                      className="w-full p-3 text-left flex items-center justify-between text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-teal-50 text-teal-600">
                          <QrCode className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold">Tạo mã VietQR đóng quỹ</div>
                          <div className="text-[11px] text-slate-400 font-normal">Quét mã chuyển khoản tự động kèm cú pháp</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileDrawerOpen(false);
                        onOpenShareModal();
                      }}
                      className="w-full p-3 text-left flex items-center justify-between text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
                          <Share2 className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold">Chia sẻ liên kết sổ quỹ</div>
                          <div className="text-[11px] text-slate-400 font-normal">Gửi đường dẫn xem quỹ cho các thành viên</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileDrawerOpen(false);
                        setIsTreasurerModalOpen(true);
                      }}
                      className="w-full p-3 text-left flex items-center justify-between text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-indigo-50 text-indigo-600">
                          <UserCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold">Thông tin & STK chủ quỹ</div>
                          <div className="text-[11px] text-slate-400 font-normal">Xem số tài khoản ngân hàng và số điện thoại</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>
              )}

              {/* Admin Remaining Navigation */}
              {!isMemberView && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                    Danh mục quản trị
                  </span>
                  <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 overflow-hidden bg-white">
                    {navItems.map((item) => {
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setActiveTab(item.id);
                            setIsMobileDrawerOpen(false);
                          }}
                          className={`w-full p-3 text-left flex items-center justify-between transition-colors cursor-pointer ${
                            isActive ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                              isActive ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {item.icon}
                            </div>
                            <div>
                              <div className="text-xs font-bold flex items-center gap-2">
                                <span>{item.label}</span>
                                {item.badge !== undefined && item.badge > 0 && (
                                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              {item.description && (
                                <div className="text-[11px] text-slate-400 font-normal">{item.description}</div>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Cloud Sync Status Indicator (Read-only status) */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <Cloud className={`w-4 h-4 shrink-0 ${
                    cloudSyncStatus === 'connected' ? 'text-emerald-500' : 'text-amber-500 animate-pulse'
                  }`} />
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">
                      Cloud Firestore: {cloudSyncStatus === 'connected' ? 'Đã kết nối' : 'Đang kết nối'}
                    </span>
                    <span className="text-[10px] text-slate-400">Tự động đồng bộ thời gian thực</span>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  cloudSyncStatus === 'connected' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {cloudSyncStatus === 'connected' ? 'Online' : 'Đang kết nối'}
                </span>
              </div>

              {/* Mobile Logout Button for Admin & Member */}
              {onLogout && (
                <button
                  type="button"
                  id="mobile-drawer-logout-btn"
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    onLogout();
                  }}
                  className="w-full py-2.5 px-3 rounded-2xl border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>{isMemberView ? 'Đăng Xuất Thành Viên' : 'Đăng Xuất Quản Trị Viên'}</span>
                </button>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. TREASURER INFO POPUP FOR MOBILE QUICK ACCESS */}
      {/* ========================================================================= */}
      {isTreasurerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div 
            className="absolute inset-0"
            onClick={() => setIsTreasurerModalOpen(false)}
          />

          <div className="relative w-full max-w-sm bg-white rounded-3xl p-5 space-y-4 shadow-2xl z-10 animate-in zoom-in-95 duration-150 border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>Thông tin Đại diện Chủ quỹ</span>
              </div>
              <button
                type="button"
                onClick={() => setIsTreasurerModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="text-[11px] text-slate-500 block">Thủ quỹ / Chủ quản:</span>
                <span className="text-sm font-bold text-slate-900 block">{treasurerName}</span>
                <span className="text-[11px] text-blue-600 font-medium block">{treasurerTitle}</span>
              </div>

              {treasurerPhone && (
                <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-emerald-800 font-medium block">Số điện thoại / Zalo</span>
                    <a
                      href={`tel:${treasurerPhone}`}
                      className="font-bold text-slate-900 font-mono text-sm"
                    >
                      {treasurerPhone}
                    </a>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopy('phone', treasurerPhone)}
                      className="p-1.5 rounded-lg bg-white border border-emerald-200 text-emerald-700 text-xs font-bold"
                    >
                      {copiedKey === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <a
                      href={`tel:${treasurerPhone}`}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs"
                    >
                      Gọi
                    </a>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsTreasurerModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </>
  );
};
