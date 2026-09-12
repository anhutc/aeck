export type AuthRole = 'member' | 'admin';

export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
}

export interface Fund {
  id: string;
  name: string;
  description: string;
  balance: number;
  initialBalance: number;
  targetBudget?: number;
  minWarningBalance?: number;
  color: string;
  icon: string;
  isDefault?: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  fundId: string;
  amount: number;
  categoryId: string;
  date: string; // YYYY-MM-DD
  description: string; // Lý do / Nội dung chi tiết
  payerOrReceiver?: string; // Tùy chọn
  campaignId?: string; // Thuộc đợt thu nào (nếu có)
  billImage?: string; // Ảnh hóa đơn / bill chi tiêu (base64 data URL)
  status: 'completed' | 'pending';
  createdAt: string;
}

export type MemberContributionType = 'campaign' | 'yearly' | 'exempt';

export interface Member {
  id: string;
  name: string;
  phone?: string;
  roles: string[];
  role?: string;
  avatar?: string;
  joinedDate: string;
  leftDate?: string;
  status: 'active' | 'inactive';
  
  // Chế độ đóng quỹ đặc biệt (ví dụ đi công tác chỉ thu theo năm)
  contributionType?: MemberContributionType;
  yearlyContributionAmount?: number;
  yearlyPaidAmount?: number;
  yearlyPaidDate?: string;
  specialNote?: string;
}

export interface CampaignParticipant {
  memberId: string;
  amountRequired: number;
  amountPaid: number;
  paidDate?: string;
  note?: string;
  transactionId?: string;
}

export interface ContributionCampaign {
  id: string;
  title: string;
  description: string;
  fundId: string;
  amountPerMember: number;
  totalTarget: number;
  launchDate: string; // Ngày phát động thu quỹ (YYYY-MM-DD)
  dueDate?: string; // Optional for backward compatibility
  createdAt: string;
  status?: 'active' | 'completed' | 'expired'; // Optional for backward compatibility
  participants: CampaignParticipant[];
}

export interface GroupNotice {
  enabled: boolean;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'success';
  updatedAt: string; // YYYY-MM-DD
}

export type SupportedLanguage = 'vi';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export interface AppBranding {
  // 1. Nhận diện chính & Thương hiệu
  appTitle: string;
  appSubtitle: string;
  groupEmoji?: string;
  currencySymbol?: string;
  themeAccent?: string;

  // 2. Người đại diện & Liên hệ
  treasurerName?: string;
  treasurerPhone?: string;
  treasurerTitle?: string;

  // 3. Cổng thông tin Thành viên & Chân trang
  portalTitle?: string;
  portalSubtitle?: string;
  portalNoticeText?: string;
  customFooterText?: string;

  // 4. VietQR & Chuyển khoản
  transferSyntaxPrefix?: string;
  qrGuideNote?: string;
  qrShareHeader?: string;
  qrShareFooter?: string;

  // 5. In Sao Kê & Báo Cáo
  statementHeaderTitle?: string;
  statementSubtitle?: string;
  statementSignatory1Title?: string;
  statementSignatory1Name?: string;
  statementSignatory2Title?: string;
  statementSignatory2Name?: string;
  statementSignatory3Title?: string;
  statementSignatory3Name?: string;
  statementFooterNote?: string;
  statementShowSignatory1?: boolean;
  statementShowSignatory2?: boolean;
  statementShowSignatory3?: boolean;
  statementShowFooterNote?: boolean;
  statementShowSummary?: boolean;

  // 6. Tin nhắn Chia sẻ Zalo / Nhóm
  shareMessageGreeting?: string;
  shareMessageIncludeBank?: boolean;
  shareMessageIncludeCampaigns?: boolean;
  shareMessageBenefit1?: string;
  shareMessageBenefit2?: string;
  shareMessageBenefit3?: string;
  shareMessageClosing?: string;
  socialShareTemplate?: string;
}

export interface BankSettings {
  bankId: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  qrTemplate: 'compact' | 'qr_only' | 'print';
}

export interface MemberViewPermissions {
  showNotice: boolean;               // 1. Hiển thị Bảng nội quy / thông báo
  showCampaigns: boolean;            // 2. Hiển thị các đợt đóng quỹ đang diễn ra
  showExpenseStructure: boolean;     // 3. Hiển thị biểu đồ trực quan hóa tài chính
  showFullLedger: boolean;           // 4. Cho phép xem toàn bộ sổ cái thu chi minh bạch
  allowPublicPrint: boolean;         // 5. Cho phép thành viên tự in ấn sao kê / xuất báo cáo
  allowQuickQR: boolean;             // 6. Cho phép tạo mã QR đóng tiền
}

export interface FirebaseCustomConfig {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
  firestoreDatabaseId?: string;
}

export type TabType = 
  | 'overview' 
  | 'transactions' 
  | 'campaigns' 
  | 'members' 
  | 'settings';

