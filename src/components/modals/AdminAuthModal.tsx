import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Lock, Eye, EyeOff, X, KeyRound, AlertCircle, ArrowRight, UserCheck, ShieldAlert } from 'lucide-react';
import { AuthRole } from '../../types';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (role: AuthRole) => void;
  adminPassword?: string;
  memberPassword?: string;
  // Legacy alias compatibility
  correctPassword?: string;
  savedAdminPin?: string;
  mode?: 'login' | 'upgrade_admin';
  appTitle?: string;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  adminPassword,
  memberPassword,
  correctPassword,
  savedAdminPin,
  mode = 'login',
  appTitle = 'Sổ Quỹ Nhóm',
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const activeAdminPassword = adminPassword || correctPassword || savedAdminPin || 'admin';
  const activeMemberPassword = memberPassword || '123';

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError('');
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = password.trim();
    if (!trimmed) {
      setError('Vui lòng nhập mật khẩu truy cập');
      return;
    }

    if (mode === 'upgrade_admin') {
      if (trimmed === activeAdminPassword) {
        setError('');
        onSuccess('admin');
        onClose();
      } else {
        setError('Mật khẩu Quản trị viên không chính xác. Vui lòng thử lại!');
        inputRef.current?.select();
      }
      return;
    }

    // Dual-password logic:
    // 1 password for admin, 1 password for member
    if (trimmed === activeAdminPassword) {
      setError('');
      onSuccess('admin');
      onClose();
    } else if (trimmed === activeMemberPassword) {
      setError('');
      onSuccess('member');
      onClose();
    } else {
      setError('Mật khẩu không chính xác! Vui lòng nhập mật khẩu thành viên để xem hoặc mật khẩu quản trị để quản lý.');
      inputRef.current?.select();
    }
  };

  return (
    <div
      id="auth-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs transition-all"
    >
      <div
        id="auth-modal-card"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              mode === 'upgrade_admin' 
                ? 'bg-amber-100 text-amber-700' 
                : 'bg-blue-100 text-blue-700'
            }`}>
              {mode === 'upgrade_admin' ? (
                <ShieldAlert className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                {mode === 'upgrade_admin' 
                  ? 'Xác Thực Quyền Quản Trị (Admin)' 
                  : `Đăng Nhập ${appTitle}`}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {mode === 'upgrade_admin'
                  ? 'Nhập mật khẩu Admin để truy cập toàn bộ tính năng quản trị'
                  : 'Hệ thống hỗ trợ mật khẩu Thành viên và Quản trị viên'}
              </p>
            </div>
          </div>
          {onClose && (
            <button
              id="close-auth-modal-btn"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/70 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 leading-relaxed animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              {mode === 'upgrade_admin' ? 'Mật khẩu Quản trị viên (Admin)' : 'Mật khẩu truy cập'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                ref={inputRef}
                id="auth-password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder={
                  mode === 'upgrade_admin'
                    ? 'Nhập mật khẩu quản trị...'
                    : 'Nhập mật khẩu Thành viên hoặc Admin...'
                }
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-hidden transition-all shadow-2xs placeholder:text-slate-400"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Dual Mode Description Cards */}
          {mode === 'login' ? (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-200/80 text-[11px] space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-purple-900">
                  <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                  <span>Thành viên (Xem)</span>
                </div>
                <p className="text-purple-800/80 leading-relaxed text-[10px]">
                  Nhập mật khẩu thành viên để tra cứu số dư, xem sổ thu chi, quét mã QR đóng quỹ.
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-[11px] space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-blue-900">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Quản trị viên</span>
                </div>
                <p className="text-blue-800/80 leading-relaxed text-[10px]">
                  Nhập mật khẩu Admin để ghi nhận thu chi, quản lý thành viên, cấu hình quỹ.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 space-y-1">
              <p className="flex items-center gap-1.5 font-bold">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>Quyền Quản trị viên (Admin)</span>
              </p>
              <p className="text-amber-800/90 leading-relaxed">
                Sau khi xác thực thành công, bạn sẽ có toàn quyền chỉnh sửa giao dịch, cài đặt tài khoản ngân hàng và cấu hình hệ thống.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              id="submit-auth-btn"
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold shadow-sm shadow-blue-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <span>{mode === 'upgrade_admin' ? 'Mở Quyền Admin' : 'Đăng Nhập'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
