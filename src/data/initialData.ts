import { BankSettings, Category, ContributionCampaign, Fund, Member, Transaction, GroupNotice, AppBranding, MemberViewPermissions } from '../types';

export const INITIAL_CATEGORIES: Category[] = [
  // Thu (Income)
  { id: 'cat_inc_member_fee', name: 'Đóng quỹ định kỳ', type: 'income', icon: 'Users', color: '#10B981' },
  { id: 'cat_inc_sponsor', name: 'Tài trợ & Ủng hộ', type: 'income', icon: 'Gift', color: '#3B82F6' },
  { id: 'cat_inc_event_fee', name: 'Thu phí sự kiện', type: 'income', icon: 'PartyPopper', color: '#8B5CF6' },
  { id: 'cat_inc_interest', name: 'Lãi tiền gửi', type: 'income', icon: 'TrendingUp', color: '#06B6D4' },
  { id: 'cat_inc_other', name: 'Thu khác', type: 'income', icon: 'PlusCircle', color: '#6B7280' },

  // Chi (Expense)
  { id: 'cat_exp_food', name: 'Ăn uống & Liên hoan', type: 'expense', icon: 'Utensils', color: '#EF4444' },
  { id: 'cat_exp_event', name: 'Tổ chức sự kiện & Teambuilding', type: 'expense', icon: 'Calendar', color: '#F97316' },
  { id: 'cat_exp_supplies', name: 'Mua sắm vật tư & Thiết bị', type: 'expense', icon: 'ShoppingBag', color: '#F59E0B' },
  { id: 'cat_exp_venue', name: 'Thuê địa điểm & Phòng họp', type: 'expense', icon: 'Building', color: '#6366F1' },
  { id: 'cat_exp_gift', name: 'Thăm hỏi & Quà tặng sinh nhật', type: 'expense', icon: 'HeartHandshake', color: '#EC4899' },
  { id: 'cat_exp_service', name: 'Chi phí dịch vụ & In ấn', type: 'expense', icon: 'FileText', color: '#14B8A6' },
  { id: 'cat_exp_other', name: 'Chi tiêu khác', type: 'expense', icon: 'MinusCircle', color: '#64748B' },
];

export const INITIAL_FUNDS: Fund[] = [
  {
    id: 'fund_general',
    name: 'AE Cây Khế',
    description: 'Sổ quỹ chung của nhóm',
    balance: 0,
    initialBalance: 0,
    targetBudget: 0,
    minWarningBalance: 0,
    color: '#2563EB',
    icon: 'Wallet',
    isDefault: true,
    createdAt: '2026-01-01',
  },
];

export const INITIAL_MEMBERS: Member[] = [
  { id: 'mem_1', name: 'Nguyễn Văn An', phone: '0901234567', roles: ['Trưởng ban', 'Đối ngoại'], joinedDate: '2026-01-01', status: 'active', contributionType: 'campaign' },
  { id: 'mem_2', name: 'Trần Thị Mai', phone: '0912345678', roles: ['Thủ quỹ', 'Hậu cần'], joinedDate: '2026-01-01', status: 'active', contributionType: 'campaign' },
  { id: 'mem_3', name: 'Lê Hoàng Long', phone: '0923456789', roles: ['Kế toán'], joinedDate: '2026-01-05', status: 'active', contributionType: 'campaign' },
  { id: 'mem_4', name: 'Phạm Thu Hà', phone: '0934567890', roles: ['Văn nghệ / Sự kiện'], joinedDate: '2026-01-10', status: 'active', contributionType: 'campaign' },
  { id: 'mem_5', name: 'Vũ Đức Thịnh', phone: '0945678901', roles: ['Thành viên', 'Hậu cần'], joinedDate: '2026-01-15', status: 'active', contributionType: 'campaign' },
  { id: 'mem_6', name: 'Đỗ Bích Ngọc', phone: '0956789012', roles: ['Thành viên'], joinedDate: '2026-02-01', status: 'active', contributionType: 'campaign' },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_CAMPAIGNS: ContributionCampaign[] = [];

export const DEFAULT_ADMIN_PASSWORD = 'admin';
export const DEFAULT_MEMBER_PASSWORD = '123';

export const INITIAL_BANK_SETTINGS: BankSettings = {
  bankId: 'MB',
  bankName: 'Ngân hàng Quân Đội (MB Bank)',
  accountNumber: '999988886666',
  accountName: 'TRAN THI MAI (THU QUY)',
  qrTemplate: 'compact',
};

export const INITIAL_GROUP_NOTICE: GroupNotice = {
  enabled: true,
  title: 'Nội quy & Quy định hoạt động quỹ',
  content: '1. Quỹ hoạt động với mục tiêu minh bạch, công khai 100% cho toàn thể thành viên.\n2. Mọi khoản thu đóng góp theo tháng/quý và các khoản chi sinh hoạt, liên hoan, thăm hỏi đều có chứng từ hóa đơn rõ ràng.\n3. Thành viên có quyền kiểm tra số dư và đóng góp ý kiến xây dựng quỹ bất kỳ lúc nào.',
  type: 'info',
  updatedAt: '2026-08-28',
};

export const INITIAL_BRANDING: AppBranding = {
  // 1. Nhận diện chính & Thương hiệu
  appTitle: 'AE Cây Khế',
  appSubtitle: 'Sổ thu chi & đóng quỹ minh bạch',
  groupEmoji: '💰',
  currencySymbol: 'VNĐ',
  themeAccent: 'blue',

  // 2. Người đại diện & Liên hệ
  treasurerName: 'Trần Thị Mai',
  treasurerPhone: '0912345678',
  treasurerTitle: 'Thủ Quỹ Ban Đại Diện',

  // 3. Cổng thông tin Thành viên & Chân trang
  portalTitle: 'Sổ Quỹ & Tài Chính Minh Bạch',
  portalSubtitle: 'Tất cả số dư, khoản thu, hóa đơn chi tiêu và đợt đóng quỹ được công khai minh bạch 100% theo thời gian thực.',
  portalNoticeText: 'Mọi đóng góp và chi tiêu đều được kiểm soát chặt chẽ và lưu trữ chứng từ đầy đủ.',
  customFooterText: 'Sổ quỹ minh bạch theo thời gian thực • Mọi ý kiến đóng góp hoặc thắc mắc thu chi xin vui lòng liên hệ Ban đại diện & Thủ quỹ.',

  // 4. VietQR & Chuyển khoản
  transferSyntaxPrefix: 'DONG QUY',
  qrGuideNote: 'Vui lòng giữ nguyên nội dung chuyển khoản tự sinh để hệ thống đối soát chính xác.',
  qrShareHeader: 'THÔNG TIN CHUYỂN KHOẢN ĐÓNG QUỸ',
  qrShareFooter: 'Trân trọng cảm ơn sự đồng hành và đóng góp của bạn! ✨',

  // 5. In Sao Kê & Báo Cáo
  statementHeaderTitle: 'BÁO CÁO THU CHI & SAO KÊ SỔ QUỸ',
  statementSubtitle: 'Trích xuất tự động từ hệ thống quản lý thu chi minh bạch',
  statementSignatory1Title: 'Người lập biểu',
  statementSignatory1Name: 'Kế toán quỹ',
  statementSignatory2Title: 'Thủ quỹ',
  statementSignatory2Name: 'Trần Thị Mai',
  statementSignatory3Title: 'Trưởng ban duyệt',
  statementSignatory3Name: 'Đại diện ban quản lý',
  statementFooterNote: 'Báo cáo này được trích xuất tự động từ hệ thống quản lý thu chi minh bạch và có giá trị lưu hành nội bộ.',
  statementShowSignatory1: true,
  statementShowSignatory2: true,
  statementShowSignatory3: true,
  statementShowFooterNote: true,
  statementShowSummary: true,

  // 6. Tin nhắn Chia sẻ Zalo / Nhóm
  shareMessageGreeting: 'Kính gửi các thành viên,\nĐể đảm bảo tính công khai & minh bạch tài chính, mọi người có thể theo dõi số dư, xem sao kê và đóng quỹ theo liên kết dưới đây:',
  shareMessageBenefit1: 'Xem số dư tồn quỹ & tiến độ các đợt đóng góp theo thời gian thực',
  shareMessageBenefit2: 'Quét mã VietQR chuyển khoản nhanh đúng cú pháp và tự động',
  shareMessageBenefit3: 'Xem chi tiết từng khoản thu và hóa đơn chứng từ chi tiêu minh bạch',
  shareMessageClosing: 'Trân trọng cảm ơn sự gắn kết và đồng hành của mọi người!',
};

export const INITIAL_VIEW_PERMISSIONS: MemberViewPermissions = {
  showNotice: true,
  showCampaigns: true,
  showExpenseStructure: true,
  showFullLedger: true,
  allowPublicPrint: true,
  allowQuickQR: true,
};

export const VIETNAMESE_BANKS = [
  { id: 'MB', name: 'MB Bank (Quân Đội)', code: 'MB' },
  { id: 'VCB', name: 'Vietcombank (Ngoại Thương)', code: 'VCB' },
  { id: 'TCB', name: 'Techcombank (Kỹ Thương)', code: 'TCB' },
  { id: 'VPB', name: 'VPBank (Việt Nam Thịnh Vượng)', code: 'VPB' },
  { id: 'ACB', name: 'ACB (Á Châu)', code: 'ACB' },
  { id: 'BIDV', name: 'BIDV (Đầu tư & Phát triển)', code: 'BIDV' },
  { id: 'CTG', name: 'VietinBank (Công Thương)', code: 'CTG' },
  { id: 'TPB', name: 'TPBank (Tiên Phong)', code: 'TPB' },
  { id: 'STB', name: 'Sacombank (Sài Gòn Thương Tín)', code: 'STB' },
  { id: 'VIB', name: 'VIB (Quốc Tế)', code: 'VIB' },
  { id: 'TIMO', name: 'Timo Digital Bank', code: 'TIMO' },
];
