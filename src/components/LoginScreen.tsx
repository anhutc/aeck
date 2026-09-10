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
  Wallet,
  Phone,
  Landmark,
  Copy,
  Check,
  UserCheck
} from 'lucide-react';
import { AppBranding, AuthRole, BankSettings } from '../types';
import { copyToClipboard } from '../utils/formatters';

interface LoginScreenProps {
  branding?: AppBranding;
  bankSettings?: BankSettings;
  adminPassword?: string;
  memberPassword?: string;
  onLoginSuccess: (role: AuthRole) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  branding,
  bankSettings,
  adminPassword = 'admin',
  memberPassword = '123',
  onLoginSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayTitle = branding?.appTitle || 'Sổ Quỹ Nhóm';
  const displaySubtitle = branding?.appSubtitle || 'Hệ thống theo dõi thu chi & đóng quỹ minh bạch';

  // Fund owner information
  const ownerName = branding?.treasurerName?.trim() || 'Trần Thị Mai';
  const ownerTitle = branding?.treasurerTitle?.trim() || 'Thủ Quỹ Ban Quản Lý';
  const ownerPhone = branding?.treasurerPhone?.trim() || '0912345678';
  const bankName = bankSettings?.bankName?.trim() || 'Ngân hàng Quân Đội (MB Bank)';
  const accountNumber = bankSettings?.accountNumber?.trim() || '999988886666';
  const accountHolder = bankSettings?.accountName?.trim() || (branding?.treasurerName?.trim() ? branding.treasurerName.toUpperCase() : 'TRAN THI MAI');

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleCopy = async (key: string, text: string) => {
    if (!text) return;
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 select-none font-sans py-8">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/60 p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        
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
        <form onSubmit={handleLogin} className="space-y-3.5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 leading-relaxed animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Mật khẩu truy cập
              </label>
              <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" />
                Khóa khi tải lại trang
              </span>
            </div>
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
                autoComplete="new-password"
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

        {/* Security Reassurance Note */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 flex items-center gap-2 leading-tight">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Bảo mật dữ liệu: Hệ thống không lưu phiên trên máy. Mỗi lần tải lại trang hoặc mở lại tab đều bắt buộc nhập lại mật khẩu.</span>
        </div>

        {/* Fund Owner Information Card (Thông tin chủ quỹ) */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-linear-to-b from-blue-50/70 to-slate-50/90 border border-blue-100/90 space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-blue-200/50">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span>Thông tin Chủ quỹ</span>
            </div>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100/80 text-blue-700 border border-blue-200/60">
              Đại diện quản lý
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {/* Owner Name & Role */}
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-[11px]">Chủ quỹ / Thủ quỹ:</span>
              <div className="text-right">
                <span className="font-bold text-slate-900 block">{ownerName}</span>
                <span className="text-[10px] text-blue-600 font-medium">{ownerTitle}</span>
              </div>
            </div>

            {/* Phone Number */}
            {ownerPhone && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/40">
                <span className="text-slate-500 text-[11px] flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-600" />
                  <span>Điện thoại / Zalo:</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <a
                    href={`tel:${ownerPhone}`}
                    className="font-bold text-slate-900 hover:text-blue-600 font-mono text-xs transition-colors"
                    title="Gọi điện cho chủ quỹ"
                  >
                    {ownerPhone}
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopy('phone', ownerPhone)}
                    className="p-1 rounded-md hover:bg-slate-200/80 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    title="Sao chép số điện thoại"
                  >
                    {copiedKey === 'phone' ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Bank Account Details */}
            {accountNumber && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/40">
                <span className="text-slate-500 text-[11px] flex items-center gap-1">
                  <Landmark className="w-3 h-3 text-indigo-600" />
                  <span>Tài khoản quỹ:</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <div className="text-right">
                    <span className="font-bold text-slate-900 font-mono text-xs block">{accountNumber}</span>
                    <span className="text-[10px] text-slate-500">{bankName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('bank', accountNumber)}
                    className="p-1 rounded-md hover:bg-slate-200/80 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    title="Sao chép số tài khoản"
                  >
                    {copiedKey === 'bank' ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dual Password Information Box */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Lock className="w-3.5 h-3.5 text-blue-600" />
            <span>Phân quyền truy cập</span>
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

      <div className="text-center mt-5 text-xs text-slate-400">
        Hệ thống Quản lý Thu Chi • AE Cây Khế
      </div>
    </div>
  );
};
