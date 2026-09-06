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
  Cloud,
  X,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  LogOut,
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
  onRequestAdminLogin?: () => void;
  onToggleViewMode?: () => void;
  pendingTransactionsCount: number;
  cloudSyncStatus?: 'connected' | 'connecting' | 'error' | 'syncing';
  onForceSyncToCloud?: () => void;
  onLogout?: () => void;
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
  pendingTransactionsCount,
  cloudSyncStatus = 'connected',
  onForceSyncToCloud,
  onLogout,
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
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-colors shadow-2xs">
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
                  className="font-black text-sm sm:text-base lg:text-lg text-slate-900 tracking-tight truncate max-w-[120px] xs:max-w-[160px] sm:max-w-xs"
                >
                  {displayTitle}
                </h1>
              </div>
            </div>

            {/* Center (Desktop): Total Fund Balance Indicator */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200/80 shrink-0">
              <div className="text-right">
                <span className="text-[9px] text-slate-500 font-medium block">{t('nav.total_balance_label', 'Tổng tồn quỹ')}</span>
                <span className="text-xs font-black text-slate-900">
                  {formatVND(totalBalance)}
                </span>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            {/* Right: Desktop Action Bar (md+) */}
            <div className="hidden md:flex items-center gap-2 lg:gap-2.5 shrink-0">
              {/* Quick Action (+ Thu / - Chi) in Admin mode */}
              {!isMemberView && (
                <div className="flex items-center p-0.5 rounded-xl bg-slate-100/90 border border-slate-200/80 shadow-2xs gap-0.5">
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
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold shrink-0 transition-colors cursor-pointer"
              >
                <Cloud className={`w-3.5 h-3.5 ${
                  cloudSyncStatus === 'connected'
                    ? 'text-emerald-600'
                    : cloudSyncStatus === 'syncing'
                    ? 'text-blue-600 animate-spin'
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
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors flex items-center gap-1.5 text-xs font-semibold shrink-0 cursor-pointer"
                aria-label="Tạo mã VietQR"
              >
                <QrCode className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold">{t('nav.vietqr', 'VietQR')}</span>
              </button>

              {/* Share Link for Members Button */}
              <button
                id="navbar-share-member-link-btn"
                onClick={onOpenShareModal}
                title={t('nav.share_link_tooltip', 'Chia sẻ liên kết sổ quỹ cho thành viên')}
                className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-all flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer"
                aria-label="Chia sẻ liên kết"
              >
                <Share2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{t('nav.share', 'Chia sẻ')}</span>
              </button>

              {/* Logout / Lock Button */}
              {onLogout && (
                <button
                  id="navbar-logout-btn"
                  type="button"
                  onClick={onLogout}
                  title="Đăng xuất"
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-rose-300 text-slate-500 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                  aria-label="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden lg:inline">Đăng xuất</span>
                </button>
              )}
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
                    <div className="absolute right-0 mt-2 w-40 rounded-2xl bg-white shadow-xl border border-slate-200 py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <button
                        type="button"
                        onClick={() => {
                          setIsQuickAddOpen(false);
                          onOpenTransactionModal('income');
                        }}
                        className="w-full px-3 py-2 text-xs font-bold text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 transition-colors cursor-pointer text-left"
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
                        className="w-full px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors cursor-pointer text-left"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                        <span>{t('nav.expense_short', '- Chi')}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Mobile Drawer Toggle (Menu Button) */}
              <button
                type="button"
                id="mobile-menu-toggle-btn"
                onClick={() => setIsMobileDrawerOpen(true)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-all flex items-center justify-center relative cursor-pointer"
                aria-label="Mở menu điều hướng"
              >
                <SlidersHorizontal className="w-4 h-4" />
                {/* Cloud status small dot indicator */}
                <span className={`absolute top-1 right-1 w-2 h-2 rounded-full ring-2 ring-white ${
                  cloudSyncStatus === 'connected' ? 'bg-emerald-500' : cloudSyncStatus === 'syncing' ? 'bg-blue-500 animate-spin' : 'bg-amber-500'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar for Admin with Sleek Horizontal Scrolling & Visual Edge Masks */}
        {!isMemberView && (
          <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 border-t border-slate-100 relative">
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
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          {/* Backdrop click to dismiss */}
          <div 
            className="absolute inset-0"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl border border-slate-200 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col z-10 animate-in slide-in-from-bottom-6 duration-250">
            
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white text-sm shadow-xs">
                  {branding?.groupEmoji || <Wallet className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 leading-tight">
                    {displayTitle}
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
                aria-label="Đóng menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content Scrollable Area */}
            <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              
              {/* Total Balance Card */}
              <div className="p-3.5 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 text-white shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-blue-100 font-medium block">{t('nav.mobile_balance_title', 'Tổng tồn quỹ hiện tại')}</span>
                  <span className="text-lg font-black tracking-tight text-white">
                    {formatVND(totalBalance)}
                  </span>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-300 animate-pulse shadow-xs" />
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
                        className="p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                        <span>{t('nav.income_short', '+ Thu tiền')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileDrawerOpen(false);
                          onOpenTransactionModal('expense');
                        }}
                        className="p-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <ArrowUpRight className="w-4 h-4 text-rose-600" />
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
                    className="p-3 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <QrCode className="w-4 h-4 text-teal-600" />
                    <span>{t('nav.vietqr', 'Tạo VietQR')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileDrawerOpen(false);
                      onOpenShareModal();
                    }}
                    className="p-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 text-blue-600" />
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
                            isActive
                              ? 'bg-blue-50 text-blue-700 font-bold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                              isActive
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600'
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

              {/* Active Role Status in Mobile Drawer */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  {t('nav.access_and_view', 'Phiên đăng nhập')}
                </span>
                {isMemberView ? (
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0">
                        👥
                      </div>
                      <div className="text-left min-w-0 flex-1">
                        <div className="font-bold text-xs text-slate-800">
                          {t('nav.in_member_mode', 'Chế độ Thành viên (Chỉ xem)')}
                        </div>
                        <div className="text-[11px] text-slate-500 font-normal">
                          Xem công khai số dư & lịch sử thu chi
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200/90">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs">
                        👑
                      </div>
                      <div className="text-left min-w-0 flex-1">
                        <div className="font-bold text-xs text-blue-950">
                          {t('nav.in_admin_mode', 'Quyền Quản trị viên (Admin)')}
                        </div>
                        <div className="text-[11px] text-slate-600 font-normal">
                          Toàn quyền ghi chép thu chi & quản trị quỹ
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Cloud Status & Manual Sync */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Cloud className={`w-4 h-4 ${
                    cloudSyncStatus === 'connected' ? 'text-emerald-500' : cloudSyncStatus === 'syncing' ? 'text-blue-500 animate-spin' : 'text-amber-500'
                  }`} />
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">
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
                    className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>{t('nav.sync_btn', 'Đồng bộ')}</span>
                  </button>
                )}
              </div>

              {/* Mobile Logout Button */}
              {onLogout && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    onLogout();
                  }}
                  className="w-full py-2.5 px-3 rounded-2xl border border-rose-200 text-rose-600 bg-rose-50/70 hover:bg-rose-100 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Đăng Xuất</span>
                </button>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
};
