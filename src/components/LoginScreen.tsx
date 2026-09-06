import React, { useState, useRef, useEffect } from 'react';
import { 
  Lock, 
  KeyRound, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  Users, 
  AlertCircle,
  Wallet
} from 'lucide-react';
import { AppBranding, AuthRole } from '../types';

interface LoginScreenProps {
  branding?: AppBranding;
  adminPassword?: string;
  memberPassword?: string;
  onLoginSuccess: (role: AuthRole) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  branding,
  adminPassword = 'admin',
  memberPassword = '123',
  onLoginSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const displayTitle = branding?.appTitle || 'Sổ Quỹ Nhóm';
  const displaySubtitle = branding?.appSubtitle || 'Hệ thống theo dõi thu chi & đóng quỹ minh bạch';

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = password.trim();

    if (!trimmed) {
      setError('Vui lòng nhập mật khẩu truy cập.');
      return;
    }

    if (trimmed === adminPassword) {
      setError('');
      onLoginSuccess('admin');
    } else if (trimmed === memberPassword) {
      setError('');
      onLoginSuccess('member');
    } else {
      setError('Mật khẩu không chính xác. Vui lòng nhập đúng mật khẩu Thành viên hoặc Quản trị viên.');
      inputRef.current?.select();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 select-none font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/60 p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Brand Header */}
        <div className="text-center space-y-2.5">
          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-linear-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 text-2xl sm:text-3xl">
            {branding?.groupEmoji ? (
              <span>{branding.groupEmoji}</span>
            ) : (
              <Wallet className="w-8 h-8" />
            )}
          </div>
          
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {displayTitle}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-normal mt-1 leading-relaxed">
              {displaySubtitle}
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 leading-relaxed animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Mật khẩu truy cập
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                ref={inputRef}
                id="login-screen-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Nhập mật khẩu Thành viên hoặc Admin..."
                className="w-full pl-10 pr-11 py-3 rounded-2xl border border-slate-300 bg-white text-slate-900 text-sm font-medium focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden transition-all shadow-2xs placeholder:text-slate-400"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            id="login-screen-submit-btn"
            type="submit"
            className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-sm shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>Đăng Nhập</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Dual Password Information Box */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Lock className="w-3.5 h-3.5 text-blue-600" />
            <span>Phân quyền</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 space-y-1">
              <div className="font-bold text-purple-700 flex items-center gap-1">
                <Users className="w-3 h-3 text-purple-600" />
                <span>Thành viên</span>
              </div>
              <p className="text-slate-600 text-[10px] leading-relaxed">
                Xem báo cáo, số dư quỹ, danh sách đóng góp, tạo mã VietQR.
              </p>
            </div>

            <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 space-y-1">
              <div className="font-bold text-blue-700 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-blue-600" />
                <span>Quản trị</span>
              </div>
              <p className="text-slate-600 text-[10px] leading-relaxed">
                Toàn quyền ghi thu chi, quản trị quỹ, cấu hình tài khoản & bảo mật.
              </p>
            </div>
          </div>
        </div>

      </div>

      <div className="text-center mt-6 text-xs text-slate-400">
        Hệ thống Quản lý Thu Chi
      </div>
    </div>
  );
};
