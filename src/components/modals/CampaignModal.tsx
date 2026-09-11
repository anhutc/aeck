import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle, Calendar, Target, Plane, ShieldCheck, Search, Users } from 'lucide-react';
import { ContributionCampaign, Fund, Member } from '../../types';
import { formatVND, getMemberRoles } from '../../utils/formatters';
import { useTranslation } from '../../i18n/LanguageContext';
import { AmountInput } from '../common/AmountInput';

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (campaign: Omit<ContributionCampaign, 'id' | 'createdAt'>, editingId?: string) => void;
  funds: Fund[];
  members: Member[];
  initialData?: ContributionCampaign | null;
}

export const CampaignModal: React.FC<CampaignModalProps> = ({
  isOpen,
  onClose,
  onSave,
  funds,
  members,
  initialData,
}) => {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fundId, setFundId] = useState(funds[0]?.id || '');
  const [amountPerMember, setAmountPerMember] = useState<number | string>('300000');
  const [launchDate, setLaunchDate] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description);
      setFundId(initialData.fundId);
      setAmountPerMember(initialData.amountPerMember);
      setLaunchDate(initialData.launchDate || initialData.createdAt || new Date().toISOString().slice(0, 10));
      setSelectedMemberIds(initialData.participants.map(p => p.memberId));
    } else {
      setTitle('');
      setDescription('');
      setFundId(funds[0]?.id || '');
      setAmountPerMember('300000');
      setLaunchDate(new Date().toISOString().slice(0, 10));
      // By default select active members who contribute per campaign
      setSelectedMemberIds(
        members
          .filter(m => m.status === 'active' && m.contributionType !== 'yearly' && m.contributionType !== 'exempt')
          .map(m => m.id)
      );
    }
    setMemberSearch('');
    setError('');
  }, [initialData, isOpen, funds, members]);

  if (!isOpen) return null;

  const numAmount = typeof amountPerMember === 'number' ? amountPerMember : (parseFloat(amountPerMember) || 0);
  const calculatedTotal = numAmount * selectedMemberIds.length;

  const toggleSelectAll = () => {
    if (selectedMemberIds.length === members.length) {
      setSelectedMemberIds([]);
    } else {
      setSelectedMemberIds(members.map(m => m.id));
    }
  };

  const selectStandardOnly = () => {
    setSelectedMemberIds(
      members
        .filter(m => m.status === 'active' && m.contributionType !== 'yearly' && m.contributionType !== 'exempt')
        .map(m => m.id)
    );
  };

  const toggleMember = (id: string) => {
    if (selectedMemberIds.includes(id)) {
      setSelectedMemberIds(selectedMemberIds.filter(mId => mId !== id));
    } else {
      setSelectedMemberIds([...selectedMemberIds, id]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(t('campaigns.error_title_required', 'Vui lòng nhập tên đợt thu quỹ'));
      return;
    }
    if (numAmount <= 0) {
      setError(t('campaigns.error_amount_positive', 'Mức đóng mỗi người phải lớn hơn 0'));
      return;
    }
    if (!launchDate) {
      setError(t('campaigns.error_launch_date_required', 'Vui lòng chọn ngày phát động thu quỹ'));
      return;
    }
    if (selectedMemberIds.length === 0) {
      setError(t('campaigns.error_min_member_required', 'Vui lòng chọn ít nhất 1 thành viên tham gia đóng'));
      return;
    }

    const participants = selectedMemberIds.map(memId => {
      const existing = initialData?.participants.find(p => p.memberId === memId);
      return {
        memberId: memId,
        amountRequired: numAmount,
        amountPaid: existing ? existing.amountPaid : 0,
        paidDate: existing?.paidDate,
        note: existing?.note,
        transactionId: existing?.transactionId,
      };
    });

    onSave(
      {
        title: title.trim(),
        description: description.trim(),
        fundId,
        amountPerMember: numAmount,
        totalTarget: calculatedTotal,
        launchDate,
        participants,
      },
      initialData?.id
    );
    onClose();
  };

  const filteredMembers = members.filter(m => 
    !memberSearch.trim() || m.name.toLowerCase().includes(memberSearch.toLowerCase().trim())
  );

  return (
    <div id="campaign-modal-overlay" className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-all overflow-y-auto">
      <div 
        id="campaign-modal-card" 
        className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden my-auto max-h-[calc(100vh-2rem)] flex flex-col animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {initialData ? t('campaigns.edit_campaign_title', 'Chỉnh sửa đợt thu quỹ') : t('campaigns.create_campaign_title', 'Phát Động Đợt Thu Quỹ')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('campaigns.modal_subtitle', 'Tạo chỉ tiêu đóng góp theo kỳ, sự kiện hoặc dự án')}
              </p>
            </div>
          </div>
          <button 
            id="close-campaign-modal-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {t('campaigns.title_label', 'Tên đợt thu')} <span className="text-rose-500">*</span>
              </label>
              <input
                id="camp-title-input"
                type="text"
                required
                placeholder="VD: Đóng quỹ tháng 9/2026, Quỹ Chuyến Đi Dã Ngoại..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:outline-hidden hover:border-slate-400 dark:hover:border-slate-600 transition-colors"
              />
            </div>

            {/* Amount Per Member */}
            <div>
              <AmountInput
                id="camp-amount-input"
                value={amountPerMember}
                onChange={(val) => setAmountPerMember(val)}
                type="neutral"
                label={t('campaigns.amount_per_member_label', 'Mức đóng / Thành viên (VNĐ)')}
                required
                presets={[50000, 100000, 200000, 300000, 500000, 1000000]}
                showAdders
                showInWords
                showPresets
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('campaigns.fund_label', 'Nộp vào quỹ')} <span className="text-rose-500">*</span>
                </label>
                <select
                  id="camp-fund-select"
                  value={fundId}
                  onChange={(e) => setFundId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:outline-hidden hover:border-slate-400 dark:hover:border-slate-600 transition-colors cursor-pointer"
                >
                  {funds.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-purple-600" />
                  <span>{t('campaigns.launch_date_label', 'Ngày phát động thu quỹ')}</span> <span className="text-rose-500">*</span>
                </label>
                <input
                  id="camp-launch-date-input"
                  type="date"
                  required
                  value={launchDate}
                  onChange={(e) => setLaunchDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:outline-hidden hover:border-slate-400 dark:hover:border-slate-600 transition-colors cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                {t('campaigns.desc_notes_label', 'Mục đích & Ghi chú')}
              </label>
              <input
                id="camp-desc-input"
                type="text"
                placeholder={t('campaigns.desc_placeholder', 'Ghi chú cho các thành viên...')}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-purple-500 focus:outline-hidden hover:border-slate-400 dark:hover:border-slate-600 transition-colors"
              />
            </div>

            {/* Member Checklist with Search & Quick Filters */}
            <div className="space-y-2 pt-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-purple-600" />
                  <span>{t('campaigns.participant_list_label', 'Danh sách người tham gia')} ({selectedMemberIds.length}/{members.length})</span>
                </label>

                {/* Quick Selection Helpers */}
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={selectStandardOnly}
                    className="text-purple-600 dark:text-purple-400 hover:underline font-medium cursor-pointer"
                  >
                    Đóng theo đợt
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-purple-600 dark:text-purple-400 hover:underline font-medium cursor-pointer"
                  >
                    {selectedMemberIds.length === members.length ? 'Bỏ chọn' : 'Tất cả'}
                  </button>
                </div>
              </div>

              {/* Search bar inside member list */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Lọc tên thành viên..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                />
              </div>

              {/* List container */}
              <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl p-1.5 space-y-1 bg-slate-50/40 dark:bg-slate-800/40">
                {filteredMembers.map((m) => {
                  const isSelected = selectedMemberIds.includes(m.id);
                  const roles = getMemberRoles(m);
                  const isYearly = m.contributionType === 'yearly';
                  const isExempt = m.contributionType === 'exempt';
                  return (
                    <div
                      key={m.id}
                      onClick={() => toggleMember(m.id)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all duration-150 text-xs border ${
                        isSelected
                          ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-800/60 shadow-2xs'
                          : 'bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-100 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-4 h-4 rounded flex items-center justify-center transition-colors shrink-0 ${
                          isSelected ? 'bg-purple-600 text-white' : 'border border-slate-300 dark:border-slate-600'
                        }`}>
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                        <span className="font-semibold truncate">{m.name}</span>
                        <span className="text-[10px] text-slate-400 truncate">({roles.join(', ')})</span>
                        {isYearly && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-[10px] font-bold">
                            <Plane className="w-2.5 h-2.5" />
                            <span>Theo năm</span>
                          </span>
                        )}
                        {isExempt && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            <span>Miễn</span>
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-slate-600 dark:text-slate-300 text-[11px] shrink-0 ml-2">
                        {formatVND(numAmount)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Total Calculation summary box */}
              <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 flex items-center justify-between text-xs">
                <span className="text-purple-700 dark:text-purple-300 font-medium">
                  {t('campaigns.total_expected_label', 'Tổng thu dự kiến:')} ({selectedMemberIds.length} người)
                </span>
                <span className="font-extrabold text-purple-900 dark:text-purple-100 text-sm">
                  {formatVND(calculatedTotal)}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0 bg-white dark:bg-slate-900 sticky bottom-0 z-10">
            <button
              type="button"
              id="cancel-campaign-modal-btn"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {t('common.cancel', 'Hủy')}
            </button>
            <button
              type="submit"
              id="submit-campaign-btn"
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{initialData ? t('campaigns.save_update_btn', 'Lưu cập nhật') : t('campaigns.create_campaign_btn', 'Khởi tạo đợt thu')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
