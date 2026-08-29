import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  Check,
  AlertCircle,
  Plus,
  Calendar,
  Phone,
  Briefcase,
  Plane,
  ShieldCheck,
  Tag,
  Info,
  DollarSign
} from 'lucide-react';
import { Member, MemberContributionType } from '../../types';
import { getMemberRoles, formatVND } from '../../utils/formatters';
import { useTranslation } from '../../i18n/LanguageContext';

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: Omit<Member, 'id'>, editingId?: string) => void;
  initialData?: Member | null;
}

const PRESET_ROLES = [
  'Trưởng ban',
  'Phó ban',
  'Thủ quỹ',
  'Kế toán',
  'Hậu cần',
  'Văn nghệ / Sự kiện',
  'Kỹ thuật',
  'Đối ngoại',
  'Thành viên',
];

export const MemberModal: React.FC<MemberModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [roles, setRoles] = useState<string[]>(['Thành viên']);
  const [customRoleInput, setCustomRoleInput] = useState('');
  const [joinedDate, setJoinedDate] = useState('');
  const [leftDate, setLeftDate] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  // Special contribution mode (Đóng theo năm / Đi công tác)
  const [contributionType, setContributionType] = useState<MemberContributionType>('campaign');
  const [yearlyAmount, setYearlyAmount] = useState('');
  const [yearlyPaid, setYearlyPaid] = useState('');
  const [yearlyPaidDate, setYearlyPaidDate] = useState('');
  const [specialNote, setSpecialNote] = useState('');

  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setPhone(initialData.phone || '');
      setRoles(getMemberRoles(initialData));
      setJoinedDate(initialData.joinedDate || new Date().toISOString().slice(0, 10));
      setLeftDate(initialData.leftDate || '');
      setStatus(initialData.status || 'active');

      setContributionType(initialData.contributionType || 'campaign');
      setYearlyAmount(initialData.yearlyContributionAmount ? initialData.yearlyContributionAmount.toString() : '');
      setYearlyPaid(initialData.yearlyPaidAmount ? initialData.yearlyPaidAmount.toString() : '');
      setYearlyPaidDate(initialData.yearlyPaidDate || '');
      setSpecialNote(initialData.specialNote || '');
    } else {
      setName('');
      setPhone('');
      setRoles(['Thành viên']);
      setJoinedDate(new Date().toISOString().slice(0, 10));
      setLeftDate('');
      setStatus('active');

      setContributionType('campaign');
      setYearlyAmount('');
      setYearlyPaid('');
      setYearlyPaidDate('');
      setSpecialNote('');
    }
    setCustomRoleInput('');
    setError('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleToggleRole = (role: string) => {
    if (roles.includes(role)) {
      if (roles.length === 1) {
        setError(t('members.error_min_role', 'Thành viên phải có ít nhất 1 vai trò'));
        return;
      }
      setRoles(roles.filter(r => r !== role));
    } else {
      setRoles([...roles, role]);
    }
    setError('');
  };

  const handleAddCustomRole = () => {
    const trimmed = customRoleInput.trim();
    if (!trimmed) return;
    if (roles.includes(trimmed)) {
      setCustomRoleInput('');
      return;
    }
    setRoles([...roles, trimmed]);
    setCustomRoleInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError(t('members.error_name_required', 'Vui lòng nhập họ và tên thành viên'));
      return;
    }
    if (roles.length === 0) {
      setError(t('members.error_role_required', 'Vui lòng chọn ít nhất 1 vai trò'));
      return;
    }
    if (!joinedDate) {
      setError(t('members.error_joined_date_required', 'Vui lòng nhập ngày tham gia'));
      return;
    }

    const yearlyAmountNum = contributionType === 'yearly' && yearlyAmount ? parseFloat(yearlyAmount) : undefined;
    const yearlyPaidNum = contributionType === 'yearly' && yearlyPaid ? parseFloat(yearlyPaid) : undefined;

    onSave(
      {
        name: name.trim(),
        phone: phone.trim() || undefined,
        roles,
        role: roles.join(', '),
        joinedDate,
        leftDate: leftDate ? leftDate : undefined,
        status,
        contributionType,
        yearlyContributionAmount: yearlyAmountNum,
        yearlyPaidAmount: yearlyPaidNum,
        yearlyPaidDate: contributionType === 'yearly' && yearlyPaidDate ? yearlyPaidDate : undefined,
        specialNote: specialNote.trim() || undefined,
      },
      initialData ? initialData.id : undefined
    );
    onClose();
  };

  return (
    <div
      id="member-modal-overlay"
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-all overflow-y-auto"
    >
      <div
        id="member-modal-card"
        className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden my-auto max-h-[calc(100vh-2rem)] flex flex-col animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header - Sticky, Never Clipped */}
        <div className="px-5 sm:px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {initialData ? t('members.edit_member_title', 'Chỉnh Sửa Thông Tin Thành Viên') : t('members.add_member_title', 'Thêm Thành Viên Mới')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('members.modal_subtitle', 'Quản lý thông tin cá nhân, chức danh kiêm nhiệm và chế độ đóng quỹ')}
              </p>
            </div>
          </div>
          <button
            id="close-member-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Scrollable */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 1. Basic Info: Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('members.name_label', 'Họ và Tên')} <span className="text-rose-500">*</span>
                </label>
                <input
                  id="member-name-input"
                  type="text"
                  required
                  placeholder="VD: Nguyễn Văn An"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {t('members.phone_label', 'Số điện thoại')}
                </label>
                <input
                  id="member-phone-input"
                  type="tel"
                  placeholder="VD: 0912345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* 2. Multiple Roles Management */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                  {t('members.role_management_label', 'Vai trò / Chức danh (Một người có thể kiêm nhiều vai trò)')} <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-blue-600 font-semibold">{t('members.selected_count', 'Đã chọn:')} {roles.length}</span>
              </div>

              {/* Selected active roles chips */}
              <div className="flex flex-wrap gap-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                {PRESET_ROLES.map((r) => {
                  const isSelected = roles.includes(r);
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleToggleRole(r)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/30'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                      <span>{r}</span>
                    </button>
                  );
                })}

                {/* Custom added roles */}
                {roles
                  .filter((r) => !PRESET_ROLES.includes(r))
                  .map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleToggleRole(r)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{r}</span>
                    </button>
                  ))}
              </div>

              {/* Add custom role input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={customRoleInput}
                  onChange={(e) => setCustomRoleInput(e.target.value)}
                  placeholder={t('members.custom_role_placeholder', 'Thêm vai trò khác (VD: Ban cố vấn, Đại diện khu vực...)')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomRole();
                    }
                  }}
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleAddCustomRole}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-white text-xs font-bold transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t('common.add', 'Thêm')}
                </button>
              </div>
            </div>

            {/* 3. Joined Date & Left Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  {t('members.joined_date_label', 'Ngày tham gia nhóm')} <span className="text-rose-500">*</span>
                </label>
                <input
                  id="member-joined-date-input"
                  type="date"
                  required
                  value={joinedDate}
                  onChange={(e) => setJoinedDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-rose-500" />
                  {t('members.left_date_label', 'Ngày rời nhóm (Nếu đã nghỉ)')}
                </label>
                <input
                  id="member-left-date-input"
                  type="date"
                  value={leftDate}
                  onChange={(e) => {
                    setLeftDate(e.target.value);
                    if (e.target.value) {
                      setStatus('inactive');
                    }
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* 4. Status Switch */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {t('members.status_label', 'Trạng thái thành viên')}
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setStatus('active')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    status === 'active'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  {t('members.status_active', 'Đang hoạt động')}
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('inactive')}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    status === 'inactive'
                      ? 'border-slate-500 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-slate-400" />
                  {t('members.status_inactive', 'Đã rời nhóm / Tạm ngưng')}
                </button>
              </div>
            </div>

            {/* 5. Special Contribution Mode (Công tác / Đóng theo năm) */}
            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/60 space-y-3">
              <div className="flex items-start gap-2.5">
                <Plane className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900 dark:text-amber-300">
                    {t('members.special_mode_title', 'Chế Độ Đóng Quỹ Đặc Biệt')}
                  </h4>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400/90">
                    {t('members.special_mode_desc', 'Cấu hình cho thành viên đi công tác xa, đóng theo năm hoặc được miễn đóng')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setContributionType('campaign')}
                  className={`py-2 px-2 rounded-xl text-[11px] font-bold text-center border transition-all cursor-pointer ${
                    contributionType === 'campaign'
                      ? 'border-blue-600 bg-blue-600 text-white shadow-xs'
                      : 'border-amber-200 dark:border-amber-900/80 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-400'
                  }`}
                >
                  {t('members.contrib_campaign', 'Theo từng đợt')}
                </button>

                <button
                  type="button"
                  onClick={() => setContributionType('yearly')}
                  className={`py-2 px-2 rounded-xl text-[11px] font-bold text-center border transition-all cursor-pointer ${
                    contributionType === 'yearly'
                      ? 'border-amber-600 bg-amber-600 text-white shadow-xs'
                      : 'border-amber-200 dark:border-amber-900/80 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-400'
                  }`}
                >
                  {t('members.contrib_yearly', 'Đóng theo năm (Công tác)')}
                </button>

                <button
                  type="button"
                  onClick={() => setContributionType('exempt')}
                  className={`py-2 px-2 rounded-xl text-[11px] font-bold text-center border transition-all cursor-pointer ${
                    contributionType === 'exempt'
                      ? 'border-purple-600 bg-purple-600 text-white shadow-xs'
                      : 'border-amber-200 dark:border-amber-900/80 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-amber-400'
                  }`}
                >
                  {t('members.contrib_exempt', 'Miễn đóng quỹ')}
                </button>
              </div>

              {contributionType === 'yearly' && (
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-900 space-y-3 animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t('members.yearly_amount_label', 'Mức thu cả năm (VNĐ)')}
                      </label>
                      <input
                        type="number"
                        placeholder="VD: 2400000"
                        value={yearlyAmount}
                        onChange={(e) => setYearlyAmount(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {t('members.yearly_paid_label', 'Số tiền đã nộp (VNĐ)')}
                      </label>
                      <input
                        type="number"
                        placeholder="VD: 2400000"
                        value={yearlyPaid}
                        onChange={(e) => setYearlyPaid(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      {t('members.yearly_paid_date_label', 'Ngày nộp quỹ cả năm')}
                    </label>
                    <input
                      type="date"
                      value={yearlyPaidDate}
                      onChange={(e) => setYearlyPaidDate(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('members.special_note_label', 'Ghi chú thêm (Lý do công tác, phân công đặc thù...)')}
                </label>
                <input
                  type="text"
                  placeholder={t('members.special_note_placeholder', 'VD: Đi công tác chi nhánh miền Nam cả năm...')}
                  value={specialNote}
                  onChange={(e) => setSpecialNote(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Footer - Sticky, Non-clipping */}
          <div className="p-4 sm:p-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0 bg-white dark:bg-slate-900 sticky bottom-0 z-10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {t('common.cancel', 'Hủy bỏ')}
            </button>
            <button
              id="submit-member-btn"
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{initialData ? t('members.update_member_btn', 'Cập Nhật Thành Viên') : t('members.save_member_btn', 'Lưu Thành Viên')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
