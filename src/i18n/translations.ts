export interface TranslationItem {
  key: string;
  category: string;
  categoryName: string;
  description: string;
  defaultValue: string;
}

export const DEFAULT_VI_DICTIONARY: Record<string, string> = {
  // === 0. Tên Quỹ & Số Dư (funds.*) ===
  "funds.default_fund_name": "AE Cây Khế",
  "funds.single_fund_badge": "AE Cây Khế",
  "funds.name_activity_fund": "AE Cây Khế",
  "funds.name_general": "AE Cây Khế",
  "funds.name_reserve": "Quỹ Dự Phòng",
  "funds.name_charity": "Quỹ Từ Thiện",
  "funds.warning_min_balance": "Dưới hạn mức",
  "funds.current_available_balance": "Số Dư Khả Dụng",
  "funds.btn_reset": "Đặt Lại Quỹ",
  "funds.total_income": "Tổng Đã Thu",
  "funds.total_expense": "Tổng Đã Chi",
  "funds.fund_name_label": "Tên Quỹ",
  "funds.fund_balance_label": "Số dư ban đầu",
  "funds.fund_warning_label": "Hạn mức cảnh báo số dư thấp",

  // === 1. Menu Điều Hướng & Tiêu Đề Chung (nav.* / header) ===
  "nav.overview": "Tổng quan",
  "nav.transactions": "Giao dịch",
  "nav.campaigns": "Đóng quỹ",
  "nav.members": "Thành viên",
  "nav.reports": "Báo cáo & sao kê",
  "nav.settings": "Cài đặt",
  "nav.switch_to_member": "Chế độ Thành Viên",
  "nav.switch_to_admin": "Chế độ Quản Trị",
  "nav.cloud_sync_connected": "Đã kết nối Firestore",
  "nav.cloud_sync_syncing": "Đang đồng bộ...",
  "nav.cloud_sync_error": "Mất kết nối Cloud",
  "nav.cloud_sync_connecting": "Đang kết nối...",
  "nav.btn_sync_now": "Đồng bộ ngay",
  "nav.btn_quick_income": "+ Thu Quỹ",
  "nav.btn_quick_expense": "- Chi Tiền",
  "nav.btn_quick_qr": "Mã VietQR",
  "nav.btn_share": "Chia sẻ",
  "nav.pending_count_suffix": "giao dịch chờ",
  "nav.view_mode_tooltip": "Chuyển đổi giao diện xem giữa Thành Viên và Quản Trị",
  "nav.total_balance_label": "Tổng tồn quỹ",
  "nav.admin_view": "Admin",
  "nav.member_view": "Thành viên",
  "nav.share": "Chia sẻ",
  "nav.vietqr": "VietQR",
  "nav.income_short": "+ Thu",
  "nav.expense_short": "- Chi",
  "nav.cloud_label_connected": "Cloud",
  "nav.cloud_label_syncing": "Đang đồng bộ...",
  "nav.cloud_label_connecting": "Đang kết nối",
  "nav.quick_actions": "Thao tác nhanh",
  "nav.admin_categories": "Danh mục quản trị",
  "nav.access_and_view": "Quyền truy cập & Chế độ xem",
  "nav.in_member_mode": "Đang ở Chế độ Thành viên",
  "nav.in_admin_mode": "Đang ở Chế độ Quản trị (Admin)",
  "nav.click_to_login_admin": "Nhấn để đăng nhập quyền Admin",
  "nav.click_to_view_member": "Nhấn để chuyển sang giao diện xem công khai",
  "nav.switch_mode_btn": "Chuyển đổi →",
  "nav.cloud_firestore_title": "Cloud Firestore:",
  "nav.cloud_realtime_sync": "Tự động đồng bộ thời gian thực",
  "nav.sync_btn": "Đồng bộ",
  "nav.mode_label": "Chế độ:",
  "nav.mobile_balance_title": "Tổng tồn quỹ hiện tại",
  "nav.create_vietqr_tooltip": "Tạo mã VietQR thu tiền",
  "nav.share_link_tooltip": "Chia sẻ liên kết sổ quỹ cho thành viên",
  "nav.admin_login_tooltip": "Đăng nhập quyền Quản trị (Admin) - Yêu cầu nhập mật khẩu",
  "nav.admin_login_btn": "Đăng nhập Admin",
  "nav.member_view_tooltip": "Chuyển sang chế độ Thành viên",
  "nav.income_tooltip": "Ghi nhận khoản thu tiền (+)",
  "nav.expense_tooltip": "Ghi nhận khoản chi tiêu (-)",
  "nav.cloud_connected_tooltip": "Đã kết nối Cloud Firestore (Đồng bộ thời gian thực)",
  "nav.cloud_syncing_tooltip": "Đang đồng bộ dữ liệu lên Đám mây...",
  "nav.cloud_connecting_tooltip": "Đang kết nối Cloud Firestore...",
  "nav.member_mode_sub": "Chế độ Thành viên • Chỉ xem minh bạch dữ liệu",

  // === 2. Cổng Thông Tin Thành Viên (portal.*) ===
  "portal.header_title": "Sổ Quỹ Nhóm Minh Bạch",
  "portal.header_subtitle": "Theo dõi thu chi, kiểm tra đợt đóng quỹ và quét mã QR chuyển khoản chuẩn VietQR",
  "portal.total_balance_card": "Tổng Số Dư Quỹ Hiện Tại",
  "portal.available_balance_note": "Số dư thực tế sau khi đã đối trừ các khoản chi tiêu",
  "portal.btn_pay_fund": "Nộp Quỹ Nhanh (VietQR)",
  "portal.btn_print_statement": "In Sao Kê / Xuất PDF",
  "portal.btn_admin_unlock": "Mở Khóa Quản Trị",
  "portal.tab_overview": "Tổng quan",
  "portal.tab_transactions": "Sổ Thu Chi",
  "portal.tab_campaigns": "Đợt Thu Quỹ",
  "portal.tab_members": "Thành Viên",
  "portal.tab_reports": "Báo Cáo Tài Chính",
  "portal.footer_note": "Hệ thống quản lý tài chính minh bạch cho hội đồng hương, lớp học, câu lạc bộ & hội nhóm.",
  "portal.notice_board_title": "Bảng Thông Báo & Nội Quy Quỹ",
  "portal.scan_qr_pay": "Đóng quỹ",

  // === 3. Tổng Quan & Số Dư (overview.*) ===
  "overview.total_balance": "Tổng Số Dư Quỹ",
  "overview.total_income": "Tổng Tiền Thu Vào",
  "overview.total_expense": "Tổng Tiền Đã Chi",
  "overview.active_members": "Thành Viên Đang Hoạt Động",
  "overview.recent_transactions_title": "Giao Dịch Gần Đây",
  "overview.recent_transactions_subtitle": "Các khoản thu chi mới nhất được cập nhật vào sổ quỹ",
  "overview.view_all_transactions": "Xem toàn bộ sổ cái",
  "overview.active_campaigns_title": "Đợt Thu Quỹ Đang Diễn Ra",
  "overview.active_campaigns_subtitle": "Tiến độ nộp hội phí và các khoản đóng góp theo kế hoạch",
  "overview.view_all_campaigns": "Xem tất cả đợt thu",
  "overview.cashflow_chart_title": "Dòng tiền thu & chi 6 tháng gần nhất",
  "overview.cashflow_chart_desc": "So sánh lưu lượng tiền vào và ra",
  "overview.expense_structure_title": "Cơ Cấu Chi Tiêu Theo Danh Mục",
  "overview.no_expense_data": "Chưa có dữ liệu chi tiêu trong kỳ",
  "overview.no_campaigns_running": "Hiện không có đợt thu quỹ nào đang mở",
  "overview.quick_actions_title": "Thao Tác Nhanh",
  "overview.btn_record_income": "Ghi Nhận Thu Vào",
  "overview.btn_record_expense": "Ghi Nhận Chi Tiền",
  "overview.btn_create_campaign": "Tạo Đợt Thu Mới",
  "overview.btn_add_member": "Thêm Thành Viên",
  "overview.btn_reset_fund": "Đặt Lại Sổ Quỹ",
  "overview.safe_balance_alert": "Số dư quỹ đang ở mức an toàn",
  "overview.low_balance_alert": "Cảnh báo: Số dư quỹ đang chạm mức cảnh báo tối thiểu!",
  "overview.chart_income_legend": "Thu vào",
  "overview.chart_expense_legend": "Chi ra",
  "overview.quick_add_income": "Thu Quỹ",
  "overview.quick_add_expense": "Chi Tiền",
  "overview.quick_create_campaign": "Tạo Đợt Thu",
  "overview.quick_add_member": "Thêm Thành Viên",
  "overview.quick_reset_fund": "Đặt Lại Quỹ",
  "overview.month_income": "Tổng thu tháng này",
  "overview.from_fees": "Từ hội phí, tài trợ & đóng góp",
  "overview.month_expense": "Tổng chi tháng này",
  "overview.expense_desc": "Chi liên hoan, quà tặng, hoạt động",
  "overview.net_cashflow": "Dòng tiền ròng (Thu - Chi)",
  "overview.cashflow_surplus": "Quỹ thặng dư tăng trưởng",
  "overview.cashflow_deficit": "Quỹ thâm hụt trong tháng",
  "overview.income_legend": "Thu vào",
  "overview.expense_legend": "Chi ra",
  "overview.expense_structure": "Cơ cấu chi tiêu",
  "overview.by_category": "Theo danh mục phân loại",
  "overview.no_expense": "Chưa có giao dịch chi tiêu",
  "overview.active_campaigns": "Đợt Đóng Quỹ",
  "overview.campaign_unit": "đợt",
  "overview.view_all": "Xem tất cả",
  "overview.launch_date": "Phát động",
  "overview.collected": "Đã thu",
  "overview.paid_count": "Đã nộp",
  "overview.no_campaigns": "Không có đợt thu quỹ nào đang mở",
  "overview.recent_transactions": "Giao Dịch Mới",
  "overview.open_ledger": "Xem tất cả",
  "overview.no_transactions": "Chưa có giao dịch nào",

  // === 4. Sổ Thu Chi & Giao Dịch (transactions.*) ===
  "transactions.title": "Lịch sử giao dịch",
  "transactions.subtitle": "Quản lý và tra cứu toàn bộ dòng tiền vào/ra chi tiết theo thời gian thực",
  "transactions.search_placeholder": "Tìm theo lý do chi tiêu, người nộp/nhận, danh mục...",
  "transactions.filter_all": "Tất Cả",
  "transactions.filter_income": "Chỉ Khoản Thu (+)",
  "transactions.filter_expense": "Chỉ Khoản Chi (-)",
  "transactions.filter_category": "Danh mục:",
  "transactions.filter_from_date": "Từ ngày:",
  "transactions.filter_to_date": "Đến ngày:",
  "transactions.clear_filters": "Xóa bộ lọc",
  "transactions.btn_add_income": "+ Ghi Khoản Thu",
  "transactions.btn_add_expense": "- Ghi Khoản Chi",
  "transactions.btn_batch_delete": "Xóa ({count}) đã chọn",
  "transactions.batch_selected_label": "đã chọn",
  "transactions.batch_delete_btn": "Xóa giao dịch đã chọn",
  "transactions.col_date": "Ngày GD",
  "transactions.col_description": "Nội Dung / Lý Do Chi Tiết",
  "transactions.col_category": "Danh Mục",
  "transactions.col_amount": "Số Tiền (VNĐ)",
  "transactions.col_person": "Người Nộp / Nhận",
  "transactions.col_campaign": "Đợt Thu",
  "transactions.col_actions": "Thao Tác",
  "transactions.empty": "Không tìm thấy giao dịch nào phù hợp",
  "transactions.empty_hint": "Thử thay đổi bộ lọc tìm kiếm hoặc tạo giao dịch mới",
  "transactions.total_income_filtered": "Tổng thu lọc:",
  "transactions.total_expense_filtered": "Tổng chi lọc:",
  "transactions.net_change_filtered": "Chênh lệch dòng tiền:",
  "transactions.status_completed": "Đã hoàn tất",
  "transactions.status_pending": "Chờ xác nhận",
  "transactions.col_id": "Mã GD",
  "transactions.type_income": "Thu vào",
  "transactions.type_expense": "Chi ra",
  "transactions.type_transfer": "Chuyển quỹ",
  "transactions.all_types": "Tất cả loại (Thu & Chi)",
  "transactions.all_categories": "Tất cả phân loại",
  "transactions.table_date": "Ngày",
  "transactions.table_type": "Loại",
  "transactions.table_category": "Phân loại",
  "transactions.table_description": "Lý do / Nội dung",
  "transactions.table_amount": "Số tiền",
  "transactions.table_actions": "Thao tác",
  "transactions.sort_date_tooltip": "Click để đổi chiều sắp xếp ngày",
  "transactions.sort_amount_tooltip": "Click để đổi chiều sắp xếp số tiền",

  // === 5. Modal Giao Dịch (modal_tx.*) ===
  "modal_tx.title_add_income": "Ghi Nhận Khoản Thu Vào Quỹ",
  "modal_tx.title_add_expense": "Ghi Nhận Khoản Chi Tiêu",
  "modal_tx.title_edit": "Chỉnh Sửa Thông Tin Giao Dịch",
  "modal_tx.subtitle": "Cập nhật dữ liệu vào sổ quỹ, số dư sẽ tự động cân đối",
  "modal_tx.amount_label": "Số tiền (VNĐ)",
  "modal_tx.amount_placeholder": "Nhập số tiền...",
  "modal_tx.category_label": "Danh mục phân loại",
  "modal_tx.date_label": "Ngày giao dịch thực tế",
  "modal_tx.description_label": "Lý do / Nội dung chi tiết",
  "modal_tx.description_placeholder": "Ví dụ: Mua nước ngọt liên hoan, Tiền đóng quỹ tháng 10...",
  "modal_tx.person_income_label": "Người nộp tiền (Thành viên / Mạnh thường quân)",
  "modal_tx.person_expense_label": "Người nhận tiền / Người thanh toán",
  "modal_tx.person_placeholder": "Tên người nộp hoặc người nhận...",
  "modal_tx.campaign_link_label": "Gắn vào đợt thu quỹ (Nếu có)",
  "modal_tx.campaign_link_none": "-- Không gắn vào đợt thu nào --",
  "modal_tx.save_btn": "Lưu Giao Dịch",
  "modal_tx.error_amount_required": "Vui lòng nhập số tiền hợp lệ lớn hơn 0",
  "modal_tx.error_desc_required": "Vui lòng nhập nội dung lý do giao dịch",
  "modal_tx.error_category_required": "Vui lòng chọn danh mục",

  // === 6. Đợt Đóng Quỹ & Chỉ Tiêu (campaigns.*) ===
  "campaigns.title": "Quản Lý Đợt Thu Quỹ & Chỉ Tiêu Đóng Góp",
  "campaigns.subtitle": "Theo dõi tiến độ nộp tiền theo từng đợt, phát động thu quỹ và tạo mã QR đóng tiền cá nhân",
  "campaigns.btn_add_campaign": "Tạo Đợt Thu Mới",
  "campaigns.campaign_label": "Đợt thu:",
  "campaigns.launch_date_prefix": "Phát động",
  "campaigns.amount_per_member_label": "Mức đóng / người:",
  "campaigns.total_expected_label": "Tổng thu dự kiến:",
  "campaigns.collected_label": "Đã thu vào:",
  "campaigns.progress_label": "Tiến độ hoàn thành",
  "campaigns.member_list_title": "Danh Sách Thành Viên & Tình Trạng Đóng Quỹ",
  "campaigns.btn_quick_qr": "Mã QR Nộp",
  "campaigns.copy_zalo": "Sao Chép Báo Cáo",
  "campaigns.pay_in_full_btn": "Nộp đủ",
  "campaigns.paid_label": "Đã nộp",
  "campaigns.unpaid_label": "Chưa nộp",
  "campaigns.exempt_badge": "Miễn đóng",
  "campaigns.yearly_badge": "Đóng theo năm",
  "campaigns.partial_deposit": "Đã cọc",
  "campaigns.empty": "Chưa có đợt đóng quỹ nào được tạo",
  "campaigns.empty_hint": "Hãy tạo đợt thu đầu tiên để quản lý các khoản thu định kỳ hoặc sự kiện",
  "campaigns.modal_create_title": "Khởi Tạo Đợt Thu Quỹ Mới",
  "campaigns.modal_edit_title": "Chỉnh Sửa Đợt Thu Quỹ",
  "campaigns.modal_subtitle": "Quy định mức đóng góp theo đầu người hoặc mục tiêu tài chính của nhóm",
  "campaigns.name_label": "Tên đợt thu quỹ",
  "campaigns.name_placeholder": "Ví dụ: Quỹ sinh hoạt Quý 4, Tiền Tất niên 2026...",
  "campaigns.desc_label": "Mô tả mục đích & Ghi chú",
  "campaigns.desc_placeholder": "Chi tiết mục đích sử dụng số tiền thu được...",
  "campaigns.amount_label": "Mức đóng trên mỗi thành viên (VNĐ)",
  "campaigns.launch_date_label": "Ngày phát động thu quỹ",
  "campaigns.participant_select_title": "Chọn thành viên tham gia đóng góp",
  "campaigns.select_all": "Chọn tất cả",
  "campaigns.deselect_all": "Bỏ chọn tất cả",
  "campaigns.save_btn": "Khởi Tạo Đợt Thu",
  "campaigns.save_edit_btn": "Lưu Cập Nhật",
  "campaigns.error_title_required": "Vui lòng nhập tên đợt thu quỹ",
  "campaigns.error_amount_positive": "Mức đóng mỗi người phải lớn hơn 0",
  "campaigns.error_min_member_required": "Vui lòng chọn ít nhất 1 thành viên tham gia",
  "campaigns.status_active": "Đang mở",
  "campaigns.status_closed": "Đã đóng",
  "campaigns.member_col_name": "Họ và tên",
  "campaigns.member_col_phone": "Số điện thoại",
  "campaigns.member_col_required": "Mức cần nộp",
  "campaigns.member_col_paid": "Đã nộp",
  "campaigns.member_col_date": "Ngày nộp",
  "campaigns.member_col_status": "Trạng thái",
  "campaigns.member_col_actions": "Thao tác",
  "campaigns.action_pay": "Ghi nhận nộp",
  "campaigns.action_unpay": "Hủy nộp",
  "campaigns.unmark_paid_btn": "Đánh dấu chưa nộp",
  "campaigns.confirm_unmark_paid": "Hủy trạng thái đã nộp của thành viên này?",
  "campaigns.copy_options_title": "Tùy chọn sao chép",
  "campaigns.copy_full_report": "Báo cáo đầy đủ",
  "campaigns.copy_full_report_desc": "Gồm tiến độ, đã nộp & chưa nộp",
  "campaigns.copy_reminder_list": "Danh sách nhắc nộp",
  "campaigns.copy_reminder_list_desc": "Chỉ người chưa hoàn thành",
  "campaigns.copy_transfer_syntax": "Cú pháp chuyển khoản",
  "campaigns.copy_success_short": "Đã sao chép!",
  "campaigns.copy_btn_short": "Sao chép...",
  "campaigns.sort_paid_newest": "Mới nộp gần nhất",
  "campaigns.sort_paid_oldest": "Ngày nộp cũ nhất",
  "campaigns.sort_unpaid_first": "Chưa nộp lên đầu",
  "campaigns.sort_name_az": "Tên thành viên (A - Z)",
  "campaigns.filter_all_count": "Tất cả",
  "campaigns.filter_unpaid_count": "Chưa nộp",
  "campaigns.filter_paid_count": "Đã nộp đủ",
  "campaigns.filter_partial_count": "Đã cọc",
  "campaigns.search_member_placeholder": "Tìm tên thành viên...",
  "campaigns.pay_btn_label": "Nộp quỹ",
  "campaigns.mark_paid_action": "Đã nộp",
  "campaigns.no_matching_members": "Không tìm thấy thành viên nào phù hợp với bộ lọc.",
  "campaigns.zalo_amount_prefix": "Mức đóng:",
  "campaigns.zalo_progress_prefix": "Tiến độ:",
  "campaigns.zalo_launch_prefix": "Ngày phát động:",
  "campaigns.zalo_paid_section": "ĐÃ NỘP",
  "campaigns.zalo_unpaid_section": "CHƯA HOÀN THÀNH",
  "campaigns.zalo_no_paid": "(Chưa có thành viên hoàn thành)",
  "campaigns.zalo_remaining_prefix": "Còn thiếu",
  "campaigns.zalo_needed_prefix": "Cần nộp",
  "campaigns.zalo_syntax_guide": "Cú pháp chuyển khoản:",
  "campaigns.zalo_remind_intro": "Danh sách các thành viên chưa hoàn thành",
  "campaigns.collapse_tooltip": "Thu gọn danh sách",
  "campaigns.expand_tooltip": "Mở rộng xem chi tiết từng người",
  "campaigns.sort_tooltip": "Sắp xếp danh sách đóng quỹ",
  "campaigns.qr_btn_tooltip": "Tạo mã QR chuyển khoản nhanh",
  "campaigns.copy_menu_tooltip": "Sao chép danh sách, báo cáo hoặc cú pháp chuyển khoản",
  "campaigns.record_custom_pay_tooltip": "Ghi nhận nộp quỹ (chọn ngày & số tiền tùy chỉnh)",
  "campaigns.scan_qr_tooltip": "Quét mã VietQR để đóng quỹ",

  // === 7. Modal Ghi Nhận Nộp Tiền (modal_pay.*) ===
  "modal_pay.title": "Ghi Nhận Nộp Tiền Quỹ",
  "modal_pay.subtitle": "Cập nhật ngày nộp tiền thực tế và số tiền đã đóng",
  "modal_pay.member_label": "Thành viên nộp tiền",
  "modal_pay.campaign_label": "Đợt thu quỹ áp dụng",
  "modal_pay.amount_due_label": "Mức tiền quy định",
  "modal_pay.paid_amount_label": "Số tiền thực nộp (VNĐ)",
  "modal_pay.date_label": "Ngày nộp tiền",
  "modal_pay.notes_label": "Ghi chú thêm (Nếu có)",
  "modal_pay.save_btn": "Lưu Ghi Nhận Nộp Tiền",
  "modal_pay.quick_full_btn": "Nộp đủ 100%",

  // === 8. Quản Lý Thành Viên (members.*) ===
  "members.title": "Danh Sách Thành Viên",
  "members.subtitle": "Quản lý thông tin liên lạc, chức danh và theo dõi tổng thể lịch sử nộp quỹ của từng người",
  "members.btn_add_member": "+ Thêm Thành Viên Mới",
  "members.search_placeholder": "Tìm theo họ tên, số điện thoại, vai trò...",
  "members.filter_role_all": "Tất Cả Vai Trò",
  "members.filter_role_leader": "Trưởng Ban / Trưởng Nhóm",
  "members.filter_role_treasurer": "Thủ Quỹ / Kế Toán",
  "members.filter_role_member": "Thành Viên Thường",
  "members.filter_status_all": "Tất Cả Trạng Thái Đóng Quỹ",
  "members.filter_status_full": "Đã Nộp Đủ Mọi Đợt",
  "members.filter_status_unpaid": "Còn Khoản Chưa Nộp",
  "members.col_name": "Họ và Tên",
  "members.col_phone": "Điện Thoại / Liên Hệ",
  "members.col_role": "Vai Trò",
  "members.col_status": "Tình Trạng Nộp Quỹ",
  "members.col_joined_date": "Ngày Tham Gia",
  "members.col_actions": "Thao Tác",
  "members.empty": "Chưa có thành viên nào trong danh sách",
  "members.empty_hint": "Thêm các thành viên để bắt đầu phân bổ đợt thu quỹ và quản lý minh bạch",
  "members.modal_create_title": "Thêm Thành Viên Mới",
  "members.modal_edit_title": "Cập Nhật Thông Tin Thành Viên",
  "members.modal_subtitle": "Thông tin thành viên sẽ được lưu trữ và đồng bộ an toàn",
  "members.name_label": "Họ và tên thành viên",
  "members.name_placeholder": "Ví dụ: Nguyễn Văn An, Trần Thị Bình...",
  "members.phone_label": "Số điện thoại",
  "members.phone_placeholder": "0912 345 678",
  "members.role_label": "Chức vụ / Vai trò trong nhóm",
  "members.role_leader": "Trưởng Nhóm / Lớp Trưởng",
  "members.role_treasurer": "Liên hệ",
  "members.role_member": "Thành Viên",
  "members.joined_date_label": "Ngày gia nhập",
  "members.exempt_label": "Miễn trừ nghĩa vụ đóng quỹ các đợt",
  "members.yearly_label": "Đóng theo năm (Đã thanh toán trọn năm)",
  "members.save_btn": "Lưu Thành Viên",
  "members.error_name_required": "Vui lòng nhập họ tên thành viên",
  "members.detail_modal_title": "Lịch Sử Đóng Quỹ Của Thành Viên",
  "members.view_card": "Xem dạng thẻ",
  "members.view_table": "Xem dạng bảng",
  "members.status_no_campaigns": "Chưa có đợt đóng",
  "members.status_paid_all": "Đã nộp đủ",
  "members.status_unpaid_prefix": "Chưa nộp",
  "members.campaigns_unit": "đợt",
  "members.status_debt": "Còn nợ",

  // === 9. Báo Cáo, Sao Kê & In Ấn (reports.* / print.*) ===
  "reports.title": "Báo Cáo & Sao Kê Thu Chi",
  "reports.subtitle": "Tổng hợp thu chi minh bạch, thống kê dòng tiền.",
  "reports.btn_print_a4": "In Mẫu Sao Kê (Khổ A4)",
  "reports.print_statement": "In Báo Cáo",
  "reports.time_filter_title": "Kỳ Báo Cáo:",
  "reports.time_all": "Toàn bộ thời gian",
  "reports.time_this_month": "Tháng này",
  "reports.time_last_month": "Tháng trước",
  "reports.time_this_quarter": "Quý này",
  "reports.time_this_year": "Năm nay",
  "reports.custom_range": "Tùy chọn khoảng ngày",
  "reports.summary_title": "Tổng Hợp Số Liệu Tài Chính",
  "reports.opening_balance": "Số Dư Đầu Kỳ",
  "reports.period_income": "Tổng Thu Trong Kỳ",
  "reports.period_expense": "Tổng Chi Trong Kỳ",
  "reports.closing_balance": "Số Dư Cuối Kỳ (Tồn Quỹ)",
  "reports.income_breakdown_title": "Chi Tiết Nguồn Thu Theo Danh Mục",
  "reports.expense_breakdown_title": "Chi Tiết Các Khoản Chi Theo Danh Mục",
  "reports.ledger_table_title": "Nhật Ký Thu Chi Chi Tiết Trong Kỳ",
  "reports.signature_treasurer": "Thủ Quỹ Lập Biểu",
  "reports.signature_leader": "Đại Diện Ban Quản Trị / Trưởng Nhóm",
  "reports.signature_note": "(Ký, ghi rõ họ tên)",
  "reports.print_date": "Ngày in sao kê:",
  "reports.months_recorded_unit":"",

  // === 10. Thanh Toán Chuẩn VietQR (vietqr.*) ===
  "vietqr.modal_title": "Mã Thanh Toán Chuẩn VietQR",
  "vietqr.modal_subtitle": "Quét mã bằng bất kỳ ứng dụng ngân hàng hoặc ví điện tử (MoMo, ZaloPay, ViettelPay...)",
  "vietqr.bank_name_label": "Ngân hàng thụ hưởng:",
  "vietqr.account_no_label": "Số tài khoản:",
  "vietqr.account_name_label": "Chủ tài khoản:",
  "vietqr.amount_label": "Số tiền nộp:",
  "vietqr.content_label": "Nội dung chuyển khoản:",
  "vietqr.copy_content_btn": "Sao Chép Nội Dung CK",
  "vietqr.copy_account_btn": "Sao Chép Số TK",
  "vietqr.download_qr_btn": "Tải Mã QR Về Máy",
  "vietqr.guide_title": "Hướng Dẫn Quét Mã Nhanh",
  "vietqr.guide_step1": "1. Mở ứng dụng ngân hàng bất kỳ trên điện thoại của bạn.",
  "vietqr.guide_step2": "2. Chọn chức năng 'Quét QR' và hướng camera vào mã phía trên.",
  "vietqr.guide_step3": "3. Hệ thống sẽ tự động điền đúng Số Tiền và Cú Pháp chuyển khoản chuẩn xác 100%.",

  // === 11. Cài Đặt Hệ Thống & Tùy Biến (settings.*) ===
  "settings.title": "Cài Đặt Hệ Thống & Quản Trị Sổ Quỹ",
  "settings.subtitle": "Tùy chỉnh thông tin tài khoản ngân hàng VietQR, mật khẩu quản trị, phân loại thu chi và câu chữ giao diện",
  "settings.tab_general": "Thông Tin Chung & Ngân Hàng",
  "settings.tab_categories": "Danh Mục Thu Chi",
  "settings.tab_text_editor": "Tùy Biến Từ Ngữ Giao Diện",
  "settings.tab_backup": "Sao Lưu & Đồng Bộ Cloud",
  
  // Section Bank & General Info
  "settings.general_title": "Thông Tin Nhóm & Ngân Hàng Nhận Tiền",
  "settings.general_subtitle": "Thiết lập thông tin hiển thị trên bảng tin và mã VietQR nhận tiền tự động",
  "settings.group_name_label": "Tên hội nhóm / Lớp học / Câu lạc bộ",
  "settings.group_name_placeholder": "Ví dụ: Hội Đồng Hương Hà Tĩnh, Lớp 12A1 Khóa 2020...",
  "settings.bank_select_label": "Ngân hàng nhận tiền (Chuẩn Napas 247)",
  "settings.bank_account_no_label": "Số tài khoản ngân hàng thụ hưởng",
  "settings.bank_account_name_label": "Tên chủ tài khoản (In hoa không dấu)",
  "settings.transfer_prefix_label": "Cú pháp tiền tố chuyển khoản",
  "settings.transfer_prefix_placeholder": "Ví dụ: NOPQUY, HOIPHI, DONGQUY...",
  "settings.admin_pass_label": "Mật khẩu Quản trị (Admin)",
  "settings.admin_pass_placeholder": "Mật khẩu dùng để mở khóa quyền quản lý...",
  "settings.btn_save_settings": "Lưu Cài Đặt Chung",

  // Section Categories
  "settings.categories_title": "Quản Lý Danh Mục Thu Chi",
  "settings.categories_subtitle": "Phân loại các khoản tiền thu vào và chi ra để báo cáo thống kê chính xác",
  "settings.btn_add_category": "+ Thêm Danh Mục Mới",
  "settings.cat_name_label": "Tên danh mục",
  "settings.cat_type_label": "Loại danh mục",
  "settings.cat_type_income": "Danh Mục Thu (+)",
  "settings.cat_type_expense": "Danh Mục Chi (-)",
  "settings.cat_icon_label": "Biểu tượng",
  "settings.cat_color_label": "Màu sắc",

  // Section Backup & Sync
  "settings.backup_title": "Sao Lưu Dữ Liệu & Đồng Bộ Cloud",
  "settings.backup_subtitle": "Lưu trữ dữ liệu an toàn trên Firestore Cloud và xuất/nhập tệp JSON sao lưu dự phòng",
  "settings.cloud_status_title": "Trạng Thái Đồng Bộ Firebase Firestore",
  "settings.btn_force_sync": "Đồng Bộ Lên Cloud Ngay",
  "settings.btn_export_data": "Tải Tệp Sao Lưu Toàn Bộ (JSON)",
  "settings.btn_import_data": "Nhập Dữ Liệu Từ Tệp Sao Lưu (JSON)",
  "settings.reset_fund_title": "Vùng Nguy Hiểm: Đặt Lại Quỹ",
  "settings.btn_open_reset_modal": "Mở Bảng Điều Khiển Đặt Lại Quỹ",

  // Section Text Editor UI (text_editor.*)
  "text_editor.banner_title": "Tùy Chỉnh Toàn Bộ Câu Chữ & Thuật Ngữ Trên Toàn Bộ Giao Diện",
  "text_editor.banner_desc": "Tất cả câu chữ (tiêu đề, nút bấm, bảng số liệu, thông báo popup, mã QR, mẫu in...) đã được nạp sẵn 100%. Bạn chỉ cần bấm nút [Sửa chữ] tại bất kỳ mục nào hoặc gõ từ vào ô tìm kiếm để đổi ngay!",
  "text_editor.search_placeholder": "Gõ từ tiếng Việt, tên nút bấm hoặc nội dung cần sửa (VD: Tổng số dư, Số dư khả dụng, Nộp tiền, VietQR)...",
  "text_editor.export_btn": "Xuất JSON",
  "text_editor.import_btn": "Nhập JSON",
  "text_editor.reset_all_btn": "Khôi phục gốc",
  "text_editor.category_label": "Chọn chuyên mục để xem & sửa:",
  "text_editor.filter_all": "Tất cả",
  "text_editor.filter_customized": "Đã sửa",
  "text_editor.cat_all": "Tất Cả Chuyên Mục",
  "text_editor.empty_title": "Không tìm thấy văn bản nào khớp với từ khóa",
  "text_editor.empty_hint": "Thử tìm với từ khóa khác hoặc xóa ô tìm kiếm",
  "text_editor.badge_customized": "Đã tùy biến",
  "text_editor.orig_label": "Văn bản gốc:",
  "text_editor.display_label": "Văn bản hiển thị trên ứng dụng:",
  "text_editor.btn_edit": "Sửa chữ",
  "text_editor.btn_save": "Lưu",
  "text_editor.btn_cancel": "Hủy",
  "text_editor.btn_reset_item": "Khôi phục về văn bản gốc mặc định",
  "text_editor.import_title": "Nhập Từ Điển Tùy Chỉnh (JSON)",
  "text_editor.import_desc": "Dán nội dung tệp JSON từ điển đã xuất trước đó để khôi phục hoặc sao chép sang thiết bị khác:",
  "text_editor.import_submit": "Áp dụng từ điển",

  // === 12. Reset Sổ Quỹ (reset.*) ===
  "reset.modal_title": "Bảng Điều Khiển Đặt Lại Sổ Quỹ",
  "reset.modal_subtitle": "Đặt lại số dư ban đầu, xóa lịch sử hoặc làm mới dữ liệu",
  "reset.mode_full_title": "Đặt Lại Toàn Bộ (Khởi đầu mới)",
  "reset.mode_tx_only_title": "Chỉ Xóa Lịch Sử Giao Dịch Thu Chi",
  "reset.mode_campaign_only_title": "Chỉ Đặt Lại Các Đợt Thu Quỹ",
  "reset.keep_members": "Giữ lại danh sách thành viên",
  "reset.keep_categories": "Giữ lại các danh mục thu chi",
  "reset.btn_execute": "Tiến Hành Đặt Lại",
  "reset.confirm_phrase": "XAC NHAN",
  "reset.opt_1_title": "1. Đưa số dư quỹ về 0 VNĐ",

  // === 13. Xác Thực & Phân Quyền (auth.*) ===
  "auth.title": "Xác Thực Quản Trị Viên",
  "auth.subtitle": "Nhập mật khẩu để mở khóa toàn bộ quyền quản lý thu chi và chỉnh sửa quỹ",
  "auth.password_label": "Mật khẩu Quản trị",
  "auth.password_placeholder": "Nhập mật khẩu quản trị...",
  "auth.btn_confirm": "Mở Khóa Quản Trị",
  "auth.security_notice_title": "Bảo mật phân quyền",
  "auth.security_notice_desc": "Mật khẩu mặc định là 'admin'. Bạn có thể thay đổi mật khẩu bất kỳ lúc nào trong phần Cài đặt.",
  "auth.error_required": "Vui lòng nhập mật khẩu quản trị",
  "auth.error_incorrect": "Mật khẩu không chính xác! Vui lòng thử lại.",

  // === 14. Chia Sẻ & Mẫu Tin Nhắn (share.*) ===
  "share.title": "Chia Sẻ Sổ Quỹ Đến Thành Viên",
  "share.subtitle": "Gửi liên kết xem công khai hoặc sao chép mẫu tin nhắn",
  "share.link_label": "Liên kết xem sổ quỹ trực tuyến:",
  "share.btn_copy_link": "Sao Chép Liên Kết",
  "share.zalo_template_title": "Mẫu tin nhắn:",
  "share.btn_copy_zalo": "Sao Chép Mẫu Tin Nhắn",

  // === 15. Hộp Thoại, Xác Nhận & Cảnh Báo (dialog.* / toast.*) ===
  "dialog.confirm_delete_title": "Xác Nhận Xóa Dữ Liệu",
  "dialog.confirm_action_title": "Xác Nhận Thao Tác",
  "dialog.confirm_delete_btn": "Đồng Ý Xóa",
  "dialog.confirm_btn": "Xác Nhận",
  "dialog.btn_understood": "Đã Hiểu",
  "dialog.alert_info_title": "Thông Báo",
  "dialog.alert_success_title": "Thao Tác Thành Công",
  "dialog.alert_warning_title": "Cảnh Báo",
  "dialog.alert_error_title": "Thông Báo Lỗi",
  "dialog.confirm_delete_tx": "Bạn có chắc chắn muốn xóa giao dịch này? Số dư quỹ sẽ tự động được hoàn lại chính xác.",
  "dialog.confirm_batch_delete_tx": "Bạn có chắc chắn muốn xóa {count} giao dịch đã chọn? Số dư quỹ sẽ được hoàn lại tương ứng.",
  "dialog.confirm_delete_campaign": "Bạn có chắc chắn muốn xóa đợt thu quỹ này? Lịch sử đóng góp của đợt thu sẽ bị xóa.",
  "dialog.confirm_delete_member": "Bạn có chắc chắn muốn xóa thành viên này khỏi danh sách nhóm?",
  "dialog.confirm_delete_category": "Bạn có chắc chắn muốn xóa danh mục này?",
  "dialog.confirm_reset_all_custom_text": "Bạn có chắc chắn muốn khôi phục toàn bộ các câu chữ đã tùy chỉnh về mặc định gốc ban đầu?",
  "dialog.sync_success": "Đã đồng bộ toàn bộ dữ liệu hiện tại lên Cloud Firestore thành công! Mọi thiết bị khác truy cập đều sẽ thấy dữ liệu này.",
  "dialog.sync_error": "Không thể đồng bộ lên Đám mây: ",
  "dialog.import_success": "Đã nhập dữ liệu từ tệp sao lưu thành công!",
  "dialog.import_invalid": "Tệp dữ liệu sao lưu không đúng định dạng hợp lệ!",

  // === 16. Thao Tác Chung & Nhãn (common.*) ===
  "common.add": "Thêm",
  "common.edit": "Sửa",
  "common.delete": "Xóa",
  "common.save": "Lưu",
  "common.cancel": "Hủy bỏ",
  "common.close": "Đóng",
  "common.copy": "Sao chép",
  "common.copied": "Đã sao chép!",
  "common.amount": "Số tiền",
  "common.income": "Khoản Thu",
  "common.expense": "Khoản Chi",
  "common.from_date": "Từ ngày",
  "common.to_date": "Đến ngày",
  "common.sort_by": "Sắp xếp:",
  "common.date_newest": "Ngày: Mới nhất trước",
  "common.date_oldest": "Ngày: Cũ nhất trước",
  "common.amount_highest": "Số tiền: Cao nhất trước",
  "common.amount_lowest": "Số tiền: Thấp nhất trước",
  "common.clear_filter": "Xóa bộ lọc",
  "common.person": "người",
  "common.members_unit": "thành viên",
  "common.transactions_unit": "giao dịch",
  "common.other": "Khác",
  "common.expand": "Mở rộng",
  "common.collapse": "Thu gọn",
  "common.found": "Tìm thấy",
  "common.saved_success": "Đã lưu thành công!",
  "common.status": "Trạng thái",
  "common.actions": "Thao tác",
  "common.total": "Tổng cộng",
  "common.notes": "Ghi chú",
  "common.search": "Tìm kiếm...",
};

// Generate list of all dictionary keys with clear category metadata for UI editor
export const ALL_DICTIONARY_KEYS: TranslationItem[] = Object.entries(DEFAULT_VI_DICTIONARY).map(([key, defaultValue]) => {
  let category = 'common';
  let categoryName = 'Nút Bấm & Thao Tác Chung';
  let description = `Văn bản hiển thị cho: ${key}`;

  if (key.startsWith('funds.')) {
    category = 'funds';
    categoryName = 'Tên Quỹ & Số Dư';
    description = 'Tên quỹ hoạt động, nhãn số dư khả dụng, hạn mức cảnh báo và tổng tích lũy';
  } else if (key.startsWith('nav.')) {
    category = 'nav';
    categoryName = 'Menu Điều Hướng & Tiêu Đề';
    description = 'Các mục menu trên thanh điều hướng chính, huy hiệu và nút thao tác nhanh';
  } else if (key.startsWith('portal.')) {
    category = 'portal';
    categoryName = 'Cổng Thông Tin Thành Viên';
    description = 'Nội dung và nhãn trên giao diện xem công khai của thành viên';
  } else if (key.startsWith('overview.')) {
    category = 'overview';
    categoryName = 'Trang Tổng Quan & Số Dư';
    description = 'Thẻ số dư tổng, biểu đồ dòng tiền, giao dịch gần đây và đợt thu đang mở';
  } else if (key.startsWith('transactions.') || key.startsWith('modal_tx.')) {
    category = 'transactions';
    categoryName = 'Sổ Thu Chi & Giao Dịch';
    description = 'Bảng kê sổ cái thu chi, bộ lọc, phân loại và modal nhập liệu giao dịch';
  } else if (key.startsWith('campaigns.') || key.startsWith('modal_pay.')) {
    category = 'campaigns';
    categoryName = 'Đợt Đóng Quỹ & Chỉ Tiêu';
    description = 'Tiến độ thu quỹ theo đợt, danh sách người nộp, ghi nhận nộp tiền và báo cáo';
  } else if (key.startsWith('members.')) {
    category = 'members';
    categoryName = 'Quản Lý Thành Viên';
    description = 'Danh bạ thành viên, phân quyền chức danh, chế độ đóng quỹ theo năm/miễn trừ';
  } else if (key.startsWith('reports.') || key.startsWith('print.')) {
    category = 'reports';
    categoryName = 'Báo Cáo & In Sao Kê';
    description = 'Báo cáo cơ cấu chi tiêu, bảng kê in ấn A4 và chữ ký phê duyệt';
  } else if (key.startsWith('vietqr.')) {
    category = 'vietqr';
    categoryName = 'Thanh Toán & Mã VietQR';
    description = 'Thông tin tài khoản ngân hàng thụ hưởng, hướng dẫn quét mã VietQR tự động';
  } else if (key.startsWith('text_editor.')) {
    category = 'text_editor';
    categoryName = 'Trình Tùy Biến Từ Ngữ Giao Diện';
    description = 'Các nhãn, nút bấm, ô tìm kiếm và hướng dẫn trong Trình chỉnh sửa từ ngữ';
  } else if (key.startsWith('settings.')) {
    category = 'settings';
    categoryName = 'Cài Đặt & Cấu Hình Quỹ';
    description = 'Thông tin thương hiệu nhóm, bảo mật, phân quyền và sao lưu dữ liệu';
  } else if (key.startsWith('reset.')) {
    category = 'reset';
    categoryName = 'Đặt Lại Quỹ (Reset)';
    description = 'Hộp thoại và các chế độ đặt lại sổ quỹ';
  } else if (key.startsWith('notice.')) {
    category = 'notice';
    categoryName = 'Bảng Thông Báo & Nội Quy';
    description = 'Nội dung và tiêu đề bảng thông báo ghim trên sổ quỹ';
  } else if (key.startsWith('auth.')) {
    category = 'auth';
    categoryName = 'Xác Thực & Quản Trị';
    description = 'Hộp thoại đăng nhập quản trị viên, thông báo bảo mật và mật khẩu';
  } else if (key.startsWith('share.')) {
    category = 'share';
    categoryName = 'Chia Sẻ & Mẫu Tin Nhắn';
    description = 'Liên kết chia sẻ sổ quỹ và mẫu tin nhắn gửi vào nhóm chat';
  } else if (key.startsWith('dialog.') || key.startsWith('toast.')) {
    category = 'dialog';
    categoryName = 'Hộp Thoại Popup & Cảnh Báo';
    description = 'Thông báo xác nhận xóa, cảnh báo an toàn số dư và thông báo kết quả';
  }

  return {
    key,
    category,
    categoryName,
    description,
    defaultValue,
  };
});
