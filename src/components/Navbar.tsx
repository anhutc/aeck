import React, { useState, useEffect } from 'react';
import {
  Wallet,
  LayoutDashboard,
  ReceiptText,
  PieChart,
  Target,
  Users,
  Settings,
  ArrowDownLeft,
  ArrowUpRight,
  QrCode,
  Share2,
  Eye,
  Lock,
  Cloud,
  X,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
} from 'lucide-react';
import { TabType, Fund, AppBranding } from '../types';
import { formatVND } from '../utils/formatters';
import { useTranslation } from '../i18n/LanguageContext';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  funds: Fund[];
  branding?: AppBranding;
  onOpenTransactionModal: (type?: 'income' | 'expense' | 'transfer') => void;
  onOpenQRModal: () => void;
  onOpenShareModal: () => void;
  isMemberView: boolean;
  onToggleViewMode: () => void;
  pendingTransactionsCount: number;
  cloudSyncStatus?: 'connected' | 'connecting' | 'error' | 'syncing';
  onForceSyncToCloud?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  funds,
  branding,
  onOpenTransactionModal,
  onOpenQRModal,
  onOpenShareModal,
  isMemberView,
  onToggleViewMode,
  pendingTransactionsCount,
  cloudSyncStatus = 'connected',
  onForceSyncToCloud,
}) => {
  const { t } = useTranslation();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const totalBalance = funds.reduce((sum, f) => sum + f.balance, 0);
  const displayTitle = branding?.appTitle || t('portal.header_title', 'Quản Lý Quỹ');

  // Close mobile drawer when route/tab changes or Esc key pressed
  useEffect(() => {
    setIsMobileDrawerOpen(false);
    setIsQuickAddOpen(false);
  }, [activeTab, isMemberView]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileDrawerOpen(false);
        setIsQuickAddOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItems: { id: TabType; label: string; icon: React.ReactNode; badge?: number; description?: string }[] = [
    { id: 'overview', label: t('nav.overview', 'Tổng quan'), icon: <LayoutDashboard className="w-4 h-4" />, description: 'Thống kê & biểu đồ' },
    { id: 'transactions', label: t('nav.transactions', 'Sổ thu chi'), icon: <ReceiptText className="w-4 h-4" />, badge: pendingTransactionsCount, description: 'Lịch sử dòng tiền' },
    { id: 'campaigns', label: t('nav.campaigns', 'Đợt đóng quỹ'), icon: <Target className="w-4 h-4" />, description: 'Thu tiền theo đợt' },
    { id: 'members', label: t('nav.members', 'Thành viên'), icon: <Users className="w-4 h-4" />, description: 'Danh bạ & đóng góp' },
    { id: 'reports', label: t('nav.reports', 'Báo cáo & sao kê'), icon: <PieChart className="w-4 h-4" />, description: 'Xuất PDF & Excel' },
    { id: 'settings', label: t('nav.settings', 'Cài đặt'), icon: <Settings className="w-4 h-4" />, description: 'Tuỳ biến hệ thống' },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/90 dark:border-slate-800 transition-colors shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          {/* Main Header Bar */}
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
            
            {/* Left: Branding & Role */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0 text-base sm:text-lg">
                {branding?.groupEmoji ? (
                  <span>{branding.groupEmoji}</span>
                ) : (
                  <Wallet className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                )}
              </div>
              
              <div className="min-w-0 flex items-center gap-1.5 sm:gap-2">
                <h1 
                  title={displayTitle}
                  className="font-black text-sm sm:text-base lg:text-lg text-slate-900 dark:text-white tracking-tight truncate max-w-[120px] xs:max-w-[160px] sm:max-w-xs"
                >
                  {displayTitle}
                </h1>
                
                {/* Role Badge */}
                <span className={`px-1.5 py-0.5 text-[9px] sm:text-[10px] font-extrabold rounded-md uppercase tracking-wider shrink-0 ${
                  isMemberView 
                    ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800'
                    : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800'
                }`}>
                  {isMemberView ? t('nav.member_view', 'Thành viên') : t('nav.admin_view', 'Admin')}
                </span>
              </div>
            </div>

            {/* Center (Desktop): Total Fund Balance Indicator */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 shrink-0">
              <div className="text-right">
                <span className="text-[9px] text-slate-500 font-medium block">{t('nav.total_balance_label', 'Tổng tồn quỹ')}</span>
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  {formatVND(totalBalance)}
                </span>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            {/* Right: Desktop Action Bar (md+) */}
            <div className="hidden md:flex items-center gap-2 lg:gap-2.5 shrink-0">
              {/* Quick Action (+ Thu / - Chi) in Admin mode */}
              {!isMemberView && (
                <div className="flex items-center p-0.5 rounded-xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 shadow-2xs gap-0.5">
                  <button
                    id="quick-income-btn"
                    onClick={() => onOpenTransactionModal('income')}
                    title={t('nav.income_tooltip', 'Ghi nhận khoản thu tiền (+)')}
                    className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{t('nav.income_short', '+ Thu')}</span>
                  </button>

                  <button
                    id="quick-expense-btn"
                    onClick={() => onOpenTransactionModal('expense')}
                    title={t('nav.expense_tooltip', 'Ghi nhận khoản chi tiêu (-)')}
                    className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>{t('nav.expense_short', '- Chi')}</span>
                  </button>
                </div>
              )}

              {/* Cloud Status Badge */}
              <button
                type="button"
                onClick={() => {
                  if (!isMemberView) {
                    setActiveTab('settings');
                  }
                }}
                title={
                  cloudSyncStatus === 'connected'
                    ? t('nav.cloud_connected_tooltip', 'Đã kết nối Cloud Firestore (Đồng bộ thời gian thực). Nhấp để mở cài đặt đám mây.')
                    : cloudSyncStatus === 'syncing'
                    ? t('nav.cloud_syncing_tooltip', 'Đang đồng bộ dữ liệu lên Đám mây...')
                    : t('nav.cloud_connecting_tooltip', 'Đang kết nối Cloud Firestore...')
                }
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 text-xs font-semibold shrink-0 transition-colors cursor-pointer"
              >
                <Cloud className={`w-3.5 h-3.5 ${
                  cloudSyncStatus === 'connected'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : cloudSyncStatus === 'syncing'
                    ? 'text-blue-600 dark:text-blue-400 animate-spin'
                    : 'text-amber-500 animate-pulse'
                }`} />
                <span className="hidden lg:inline text-[11px] font-medium">
                  {cloudSyncStatus === 'connected' ? t('nav.cloud_label_connected', 'Cloud') : cloudSyncStatus === 'syncing' ? t('nav.cloud_label_syncing', 'Đang đồng bộ...') : t('nav.cloud_label_connecting', 'Đang kết nối')}
                </span>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  cloudSyncStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                }`} />
              </button>

              {/* Quick VietQR Button */}
              <button
                id="quick-qr-btn"
                onClick={onOpenQRModal}
                title={t('nav.create_vietqr_tooltip', 'Tạo mã VietQR thu tiền')}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold shrink-0 cursor-pointer"
                aria-label="Tạo mã VietQR"
              >
                <QrCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-bold">{t('nav.vietqr', 'VietQR')}</span>
              </button>

              {/* Share Link for Members Button */}
              <button
                id="navbar-share-member-link-btn"
                onClick={onOpenShareModal}
                title={t('nav.share_link_tooltip', 'Chia sẻ liên kết sổ quỹ cho thành viên')}
                className="px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 transition-all flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer"
                aria-label="Chia sẻ liên kết"
              >
                <Share2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>{t('nav.share', 'Chia sẻ')}</span>
              </button>

              {/* View Mode Toggle Button */}
              <button
                id="toggle-view-mode-btn"
                onClick={onToggleViewMode}
                title={isMemberView ? t('nav.admin_login_tooltip', 'Đăng nhập quyền Quản trị (Admin) - Yêu cầu nhập mật khẩu') : t('nav.member_view_tooltip', 'Chuyển sang chế độ Thành viên')}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                  isMemberView
                    ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600 shadow-xs shadow-purple-600/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                aria-label={isMemberView ? "Đăng nhập Admin" : "Xem chế độ Thành viên"}
              >
                {isMemberView ? (
                  <>
                    <Lock className="w-4 h-4 text-white" />
                    <span>{t('nav.admin_view', 'Admin')}</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    <span>{t('nav.member_view', 'Thành viên')}</span>
                  </>
                )}
              </button>
            </div>

            {/* Right: Mobile Clean Header Controls (< md) */}
            <div className="flex md:hidden items-center gap-1.5 shrink-0">
              {/* Quick Transaction Button (Admin Only) */}
              {!isMemberView && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsQuickAddOpen(!isQuickAddOpen)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                    aria-label="Thao tác thu chi"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span className="text-[11px]">Thu/Chi</span>
                  </button>

                  {/* Quick Add Dropdown */}
                  {isQuickAddOpen && (
                    <div className="absolute right-0 mt-2 w-40 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <button
                        type="button"
                        onClick={() => {
                          setIsQuickAddOpen(false);
                          onOpenTransactionModal('income');
                        }}
                        className="w-full px-3 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center gap-2 transition-colors cursor-pointer text-left"
                      >
                        <ArrowDownLeft className="w-4 h-4" />
                        <span>{t('nav.income_short', '+ Thu')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsQuickAddOpen(false);
                          onOpenTransactionModal('expense');
                        }}
                        className="w-full px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition-colors cursor-pointer text-left"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                        <span>{t('nav.expense_short', '- Chi')}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* View Mode Toggle Pill (Mobile) */}
              <button
                type="button"
                onClick={onToggleViewMode}
                title={isMemberView ? t('nav.admin_login_tooltip', 'Đăng nhập Admin') : t('nav.member_view_tooltip', 'Xem chế độ Thành viên')}
                className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                  isMemberView
                    ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
                aria-label={isMemberView ? "Đăng nhập Admin" : "Xem chế độ Thành viên"}
              >
                {isMemberView ? <Lock className="w-4 h-4" /> : <Eye className="w-4 h-4 text-slate-600 dark:text-slate-400" />}
              </button>

              {/* Mobile Drawer Toggle (Menu Button) */}
              <button
                type="button"
                id="mobile-menu-toggle-btn"
                onClick={() => setIsMobileDrawerOpen(true)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all flex items-center justify-center relative cursor-pointer"
                aria-label="Mở menu điều hướng"
              >
                <SlidersHorizontal className="w-4 h-4" />
                {/* Cloud status small dot indicator */}
                <span className={`absolute top-1 right-1 w-2 h-2 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                  cloudSyncStatus === 'connected' ? 'bg-emerald-500' : cloudSyncStatus === 'syncing' ? 'bg-blue-500 animate-spin' : 'bg-amber-500'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar for Admin with Sleek Horizontal Scrolling & Visual Edge Masks */}
        {!isMemberView && (
          <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 border-t border-slate-100 dark:border-slate-800 relative">
            <nav className="flex space-x-1 sm:space-x-1.5 overflow-x-auto no-scrollbar py-2 sm:py-2.5 scroll-smooth touch-pan-x">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-tab-${item.id}`}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white font-bold shadow-xs shadow-blue-600/25'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-white text-blue-600' : 'bg-amber-500 text-white'
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

      {/* MOBILE ACTION & NAVIGATION DRAWER (BOTTOM SHEET / SLIDE-OVER) */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          {/* Backdrop click to dismiss */}
          <div 
            className="absolute inset-0"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col z-10 animate-in slide-in-from-bottom-6 duration-250">
            
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white text-sm shadow-xs">
                  {branding?.groupEmoji || <Wallet className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                    {displayTitle}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {t('nav.mode_label', 'Chế độ:')} <strong className={isMemberView ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'}>{isMemberView ? t('nav.member_view', 'Thành viên') : t('nav.admin_view', 'Quản trị viên (Admin)')}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors cursor-pointer"
                aria-label="Đóng menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content Scrollable Area */}
            <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              
              {/* Total Balance Card */}
              <div className="p-3.5 rounded-2xl bg-linear-to-br from-slate-900 to-blue-950 text-white shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-blue-200/80 font-medium block">{t('nav.mobile_balance_title', 'Tổng tồn quỹ hiện tại')}</span>
                  <span className="text-lg font-black tracking-tight text-white">
                    {formatVND(totalBalance)}
                  </span>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-xs shadow-emerald-400/50" />
              </div>

              {/* Quick Actions Grid */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  {t('nav.quick_actions', 'Thao tác nhanh')}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {!isMemberView && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileDrawerOpen(false);
                          onOpenTransactionModal('income');
                        }}
                        className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <ArrowDownLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>{t('nav.income_short', '+ Thu tiền')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileDrawerOpen(false);
                          onOpenTransactionModal('expense');
                        }}
                        className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <ArrowUpRight className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        <span>{t('nav.expense_short', '- Chi tiêu')}</span>
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileDrawerOpen(false);
                      onOpenQRModal();
                    }}
                    className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/40 text-teal-700 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <QrCode className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>{t('nav.vietqr', 'Tạo VietQR')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileDrawerOpen(false);
                      onOpenShareModal();
                    }}
                    className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>{t('nav.share', 'Chia sẻ link')}</span>
                  </button>
                </div>
              </div>

              {/* Admin Navigation List (If Admin Mode) */}
              {!isMemberView && (
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                    {t('nav.admin_categories', 'Danh mục quản trị')}
                  </span>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
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
                            isActive
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                              isActive
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
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

              {/* View Mode Switcher Button */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  {t('nav.access_and_view', 'Quyền truy cập & Chế độ xem')}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    onToggleViewMode();
                  }}
                  className={`w-full p-3 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                    isMemberView
                      ? 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      isMemberView ? 'bg-purple-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}>
                      {isMemberView ? <Lock className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </div>
                    <div className="text-left">
                      <div className="font-bold">{isMemberView ? t('nav.in_member_mode', 'Đang ở Chế độ Thành viên') : t('nav.in_admin_mode', 'Đang ở Chế độ Quản trị (Admin)')}</div>
                      <div className="text-[11px] text-slate-500 font-normal">
                        {isMemberView ? t('nav.click_to_login_admin', 'Nhấn để đăng nhập quyền Admin') : t('nav.click_to_view_member', 'Nhấn để chuyển sang giao diện xem công khai')}
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                    {t('nav.switch_mode_btn', 'Chuyển đổi →')}
                  </span>
                </button>
              </div>

              {/* Cloud Status & Manual Sync */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Cloud className={`w-4 h-4 ${
                    cloudSyncStatus === 'connected' ? 'text-emerald-500' : cloudSyncStatus === 'syncing' ? 'text-blue-500 animate-spin' : 'text-amber-500'
                  }`} />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                      {t('nav.cloud_firestore_title', 'Cloud Firestore:')} {cloudSyncStatus === 'connected' ? t('nav.cloud_label_connected', 'Đã kết nối') : cloudSyncStatus === 'syncing' ? t('nav.cloud_label_syncing', 'Đang đồng bộ...') : t('nav.cloud_label_connecting', 'Đang kết nối')}
                    </span>
                    <span className="text-[10px] text-slate-400">{t('nav.cloud_realtime_sync', 'Tự động đồng bộ thời gian thực')}</span>
                  </div>
                </div>

                {onForceSyncToCloud && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileDrawerOpen(false);
                      onForceSyncToCloud();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-200 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>{t('nav.sync_btn', 'Đồng bộ')}</span>
                  </button>
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
};
