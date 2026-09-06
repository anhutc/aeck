import React, { useState } from 'react';
import { 
  Cloud, 
  Database, 
  Server, 
  Key, 
  Copy, 
  Check, 
  ExternalLink, 
  Code2, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Zap, 
  BookOpen, 
  FileCode, 
  Bot, 
  Smartphone, 
  Table, 
  Terminal, 
  X,
  ShieldCheck,
} from 'lucide-react';
import { FirebaseCustomConfig } from '../../types';
import { 
  getSavedCustomFirebaseConfig, 
  saveCustomFirebaseConfig, 
  removeCustomFirebaseConfig, 
  getActiveFirebaseConfig, 
  defaultFirebaseConfig 
} from '../../lib/firebase';
import { getCloudConfigInfo, testCloudConnection } from '../../lib/cloudStore';
import { useFeedback } from '../../context/FeedbackContext';

interface CloudDataSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudDataSourceModal: React.FC<CloudDataSourceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { showToast, showConfirm } = useFeedback();

  // Active guide tab: 'config_editor' | 'guide_create' | 'guide_integrate'
  const [activeTab, setActiveTab] = useState<'config_editor' | 'guide_create' | 'guide_integrate'>('config_editor');

  // Guide sub-tab for integrations
  const [integrationType, setIntegrationType] = useState<'bot' | 'nodejs' | 'sheets' | 'flutter'>('bot');

  // Form states
  const activeInfo = getActiveFirebaseConfig();
  const savedCustom = getSavedCustomFirebaseConfig();

  const [rawSnippet, setRawSnippet] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);

  const [formConfig, setFormConfig] = useState<FirebaseCustomConfig>({
    apiKey: savedCustom?.apiKey || '',
    authDomain: savedCustom?.authDomain || '',
    projectId: savedCustom?.projectId || '',
    storageBucket: savedCustom?.storageBucket || '',
    messagingSenderId: savedCustom?.messagingSenderId || '',
    appId: savedCustom?.appId || '',
    firestoreDatabaseId: savedCustom?.firestoreDatabaseId || '(default)',
  });

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latencyMs: number; error?: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast('Đã sao chép vào bộ nhớ tạm!', 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Helper to parse JS object or JSON pasted by user
  const handleParseSnippet = (snippet: string) => {
    setRawSnippet(snippet);
    setParseError(null);
    if (!snippet.trim()) return;

    try {
      let cleaned = snippet.trim();
      if (cleaned.includes('=')) {
        const afterEqual = cleaned.substring(cleaned.indexOf('=') + 1).trim();
        cleaned = afterEqual.replace(/;$/, '').trim();
      }

      // Try JSON.parse first
      let parsed: any;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        // Fallback: use regex extraction for JS object keys
        const extractField = (fieldName: string) => {
          const regex = new RegExp(`${fieldName}\\s*:\\s*["']([^"']+)["']`);
          const match = cleaned.match(regex);
          return match ? match[1] : '';
        };

        parsed = {
          apiKey: extractField('apiKey'),
          authDomain: extractField('authDomain'),
          projectId: extractField('projectId'),
          storageBucket: extractField('storageBucket'),
          messagingSenderId: extractField('messagingSenderId'),
          appId: extractField('appId'),
          firestoreDatabaseId: extractField('firestoreDatabaseId') || '(default)',
        };
      }

      if (!parsed.projectId || !parsed.apiKey) {
        setParseError('Đoạn mã thiếu apiKey hoặc projectId. Vui lòng kiểm tra lại!');
        return;
      }

      setFormConfig({
        apiKey: parsed.apiKey || '',
        authDomain: parsed.authDomain || '',
        projectId: parsed.projectId || '',
        storageBucket: parsed.storageBucket || '',
        messagingSenderId: parsed.messagingSenderId || '',
        appId: parsed.appId || '',
        firestoreDatabaseId: parsed.firestoreDatabaseId || '(default)',
      });

      showToast('Đã nhận diện thành công cấu hình Firebase!', 'success');
    } catch {
      setParseError('Không thể nhận diện cú pháp. Bạn có thể tự điền từng trường bên dưới.');
    }
  };

  const handleTestConnection = async () => {
    if (!formConfig.projectId || !formConfig.apiKey) {
      showToast('Vui lòng điền tối thiểu API Key và Project ID để kiểm tra!', 'error');
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testCloudConnection();
      setTestResult(res);
      if (res.success) {
        showToast(`Kết nối máy chủ thành công! (${res.latencyMs}ms)`, 'success');
      } else {
        showToast(`Kết nối thất bại: ${res.error || 'Không xác định'}`, 'error');
      }
    } catch (err: any) {
      setTestResult({ success: false, latencyMs: 0, error: err?.message || 'Lỗi mạng' });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveConfig = () => {
    if (!formConfig.projectId.trim() || !formConfig.apiKey.trim()) {
      showToast('Vui lòng điền đủ API Key và Project ID!', 'error');
      return;
    }

    showConfirm({
      title: 'Chuyển Đổi Máy Chủ Firestore',
      message: `Bạn có chắc chắn muốn chuyển sang dự án Firebase mới:\n"${formConfig.projectId}"?\n\nỨng dụng sẽ nạp lại trang để kết nối cơ sở dữ liệu mới.`,
      type: 'info',
      confirmText: 'Lưu & Khởi Động Lại',
      cancelText: 'Hủy Bỏ',
      onConfirm: () => {
        saveCustomFirebaseConfig({
          ...formConfig,
          firestoreDatabaseId: formConfig.firestoreDatabaseId?.trim() || '(default)',
        });
        showToast('Đã lưu cấu hình! Đang tải lại ứng dụng...', 'success');
        setTimeout(() => {
          window.location.reload();
        }, 800);
      },
    });
  };

  const handleResetToDefault = () => {
    showConfirm({
      title: 'Khôi Phục Về Máy Chủ Mặc Định',
      message: 'Bạn có muốn quay về sử dụng máy chủ Firebase mặc định của hệ thống?',
      type: 'warning',
      confirmText: 'Đồng Ý Khôi Phục',
      cancelText: 'Hủy Bỏ',
      onConfirm: () => {
        removeCustomFirebaseConfig();
        showToast('Đã khôi phục về máy chủ mặc định! Đang tải lại...', 'success');
        setTimeout(() => {
          window.location.reload();
        }, 800);
      },
    });
  };

  const firestoreRulesSample = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      // Cho phép đọc/ghi dữ liệu sổ quỹ nhóm
      allow read, write: if true;
    }
  }
}`;

  const botTelegramCode = `// Code ví dụ Bot Node.js / Telegram lắng nghe biến động quỹ
const { initializeApp } = require("firebase/app");
const { getFirestore, doc, onSnapshot } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "${formConfig.apiKey || activeInfo.config.apiKey || 'YOUR_API_KEY'}",
  projectId: "${formConfig.projectId || activeInfo.config.projectId || 'YOUR_PROJECT_ID'}",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Lắng nghe thay đổi dữ liệu thời gian thực
onSnapshot(doc(db, "qunlqu_settings", "app_state"), (doc) => {
  if (doc.exists()) {
    const data = doc.data();
    console.log("💰 Tổng số giao dịch hiện tại:", data.transactions?.length);
    console.log("👥 Số thành viên:", data.members?.length);
    // Gửi thông báo đến Bot Telegram / Nhóm Zalo...
  }
});`;

  const nodejsAdminCode = `// Node.js Backend API đọc/ghi quỹ bằng Firebase Admin SDK
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function getFundData() {
  const doc = await db.collection('qunlqu_settings').doc('app_state').get();
  if (!doc.exists) {
    console.log('Chưa có dữ liệu quỹ');
    return null;
  }
  const appData = doc.data();
  console.log('Danh sách quỹ:', appData.funds);
  return appData;
}`;

  const googleSheetsCode = `// Google Apps Script đồng bộ dữ liệu vào Google Sheets
function syncFundToSheets() {
  const projectId = "${formConfig.projectId || activeInfo.config.projectId || 'YOUR_PROJECT_ID'}";
  const apiKey = "${formConfig.apiKey || activeInfo.config.apiKey || 'YOUR_API_KEY'}";
  const url = \`https://firestore.googleapis.com/v1/projects/\${projectId}/databases/(default)/documents/qunlqu_settings/app_state?key=\${apiKey}\`;
  
  const response = UrlFetchApp.fetch(url);
  const json = JSON.parse(response.getContentText());
  Logger.log(json);
  // Đổ dữ liệu json vào Spreadsheet...
}`;

  const flutterCode = `// Flutter / Dart kết nối Cloud Firestore
import 'package:cloud_firestore/cloud_firestore.dart';

void listenToFund() {
  FirebaseFirestore.instance
      .collection('qunlqu_settings')
      .doc('app_state')
      .snapshots()
      .listen((snapshot) {
        if (snapshot.exists) {
          final data = snapshot.data();
          print("Cập nhật số dư quỹ: \${data?['funds']}");
        }
      });
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-900 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                <span>Nguồn Dữ Liệu Đám Mây (Cloud Firestore)</span>
                {savedCustom ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                    Dự án Tùy chỉnh (Đang kết nối)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                    Dự án Mặc định của Hệ thống
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Chỉnh sửa cấu hình để kết nối sang máy chủ Firestore khác hoặc xem hướng dẫn tích hợp
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs with High Contrast Light Styling */}
        <div className="flex border-b border-slate-200 bg-white px-4 pt-2 gap-2 overflow-x-auto text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('config_editor')}
            className={`py-2.5 px-3.5 rounded-t-xl border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'config_editor'
                ? 'border-blue-600 text-blue-700 bg-blue-50/70 font-bold shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <Key className="w-4 h-4 text-blue-600" />
            <span>Chỉnh Sửa Nguồn Dữ Liệu Máy Chủ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guide_create')}
            className={`py-2.5 px-3.5 rounded-t-xl border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'guide_create'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/70 font-bold shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>Hướng Dẫn Tạo Firebase Riêng (5 Bước)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guide_integrate')}
            className={`py-2.5 px-3.5 rounded-t-xl border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'guide_integrate'
                ? 'border-purple-600 text-purple-700 bg-purple-50/70 font-bold shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <Code2 className="w-4 h-4 text-purple-600" />
            <span>Kết Nối App Khác / Bot Zalo / Telegram</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/40">
          
          {/* TAB 1: CONFIG EDITOR */}
          {activeTab === 'config_editor' && (
            <div className="space-y-5">
              {/* Feature Introduction Banner */}
              <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/90 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-blue-950 text-xs sm:text-sm">
                    Tùy chỉnh & Kết nối máy chủ Firestore khác
                  </h4>
                  <p className="text-[11px] sm:text-xs text-blue-900/80 leading-relaxed">
                    Bạn có thể tự do thay đổi kết nối sang dự án Firebase / Firestore của riêng bạn hoặc máy chủ khác. Chỉ cần dán đoạn mã cấu hình hoặc điền thông số bên dưới rồi bấm <strong>"Lưu & Chuyển Sang Database Này"</strong>, ứng dụng sẽ lập tức lưu trữ và đồng bộ vào máy chủ mới.
                  </p>
                </div>
              </div>

              {/* Current Active Info Banner */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-blue-600" />
                    Hạ Tầng Đang Hoạt Động Hiện Tại:
                  </span>
                  {savedCustom && (
                    <button
                      type="button"
                      onClick={handleResetToDefault}
                      className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Khôi phục về Cloud Mặc định</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-medium block">Project ID</span>
                    <span className="font-bold text-slate-900 truncate block mt-0.5">
                      {activeInfo.config.projectId || 'Chưa thiết lập'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-medium block">Database ID</span>
                    <span className="font-bold text-slate-900 truncate block mt-0.5">
                      {activeInfo.config.firestoreDatabaseId || (savedCustom ? '(default)' : defaultFirebaseConfig.firestoreDatabaseId || '(default)')}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] text-slate-500 font-medium block">Auth Domain</span>
                    <span className="font-bold text-slate-900 truncate block mt-0.5">
                      {activeInfo.config.authDomain || 'Không có'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Paste Snippet Area */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-blue-600" />
                    <span>Dán nhanh mã cấu hình Firebase SDK (Tự động nhận diện):</span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-medium">Hỗ trợ JS hoặc JSON</span>
                </div>

                <textarea
                  rows={4}
                  value={rawSnippet}
                  onChange={(e) => handleParseSnippet(e.target.value)}
                  placeholder={`const firebaseConfig = {\n  apiKey: "AIzaSy...",\n  authDomain: "my-app.firebaseapp.com",\n  projectId: "my-custom-project",\n  storageBucket: "...",\n  messagingSenderId: "...",\n  appId: "..."\n};`}
                  className="w-full p-3 font-mono text-xs rounded-2xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-hidden shadow-2xs placeholder:text-slate-400"
                />

                {parseError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{parseError}</span>
                  </div>
                )}
              </div>

              {/* Form Input Fields */}
              <div className="space-y-3 pt-1">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Hoặc điền chi tiết từng trường thông số:
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      API Key <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={formConfig.apiKey}
                      onChange={(e) => setFormConfig({ ...formConfig, apiKey: e.target.value })}
                      placeholder="AIzaSyB..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-mono focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Project ID <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={formConfig.projectId}
                      onChange={(e) => setFormConfig({ ...formConfig, projectId: e.target.value })}
                      placeholder="my-fund-project-123"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-mono focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Auth Domain
                    </label>
                    <input
                      type="text"
                      value={formConfig.authDomain || ''}
                      onChange={(e) => setFormConfig({ ...formConfig, authDomain: e.target.value })}
                      placeholder="my-fund-project-123.firebaseapp.com"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-mono focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Database ID (mặc định là <code className="text-blue-600 font-bold">(default)</code>)
                    </label>
                    <input
                      type="text"
                      value={formConfig.firestoreDatabaseId || '(default)'}
                      onChange={(e) => setFormConfig({ ...formConfig, firestoreDatabaseId: e.target.value })}
                      placeholder="(default)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-mono focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      App ID
                    </label>
                    <input
                      type="text"
                      value={formConfig.appId || ''}
                      onChange={(e) => setFormConfig({ ...formConfig, appId: e.target.value })}
                      placeholder="1:1234567890:web:abcdef..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-mono focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Storage Bucket (Tùy chọn)
                    </label>
                    <input
                      type="text"
                      value={formConfig.storageBucket || ''}
                      onChange={(e) => setFormConfig({ ...formConfig, storageBucket: e.target.value })}
                      placeholder="my-fund-project-123.appspot.com"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-mono focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm shadow-blue-600/25 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Lưu & Chuyển Sang Database Này</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: STEP BY STEP GUIDE TO CREATE FIREBASE */}
          {activeTab === 'guide_create' && (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-blue-950 text-sm">
                    Tự sở hữu 100% Cơ Sở Dữ Liệu Miễn Phí Với Google Firebase
                  </h4>
                  <p className="text-blue-900/80 mt-1">
                    Gói miễn phí Spark của Firebase cung cấp 1 GB lưu trữ và 50,000 lượt đọc/ngày — hoàn toàn đủ cho nhu cầu quản lý quỹ hoạt động của đội nhóm trong nhiều năm mà không mất phí.
                  </p>
                </div>
              </div>

              {/* Step 1 */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">1</span>
                  <h4 className="font-bold text-slate-900 text-sm">Tạo Dự Án (Project) trên Firebase Console</h4>
                </div>
                <p className="text-slate-600 pl-8">
                  Truy cập{' '}
                  <a 
                    href="https://console.firebase.google.com/" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-blue-600 font-semibold underline inline-flex items-center gap-0.5"
                  >
                    <span>Firebase Console</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>{' '}
                  → Đăng nhập tài khoản Google → Bấm <strong>Add project (Tạo dự án)</strong> → Đặt tên dự án (ví dụ: <code>quan-ly-quy-nhom</code>) → Bấm <strong>Continue</strong> để hoàn tất.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">2</span>
                  <h4 className="font-bold text-slate-900 text-sm">Khởi Tạo Cloud Firestore Database</h4>
                </div>
                <p className="text-slate-600 pl-8">
                  Ở menu bên trái, chọn <strong>Build &gt; Firestore Database</strong> → Bấm <strong>Create database</strong> → Chọn vị trí máy chủ (nên chọn <code>asia-southeast1 (Singapore)</code> hoặc <code>asia-east1</code> để tốc độ truy cập từ Việt Nam nhanh nhất) → Bấm <strong>Next</strong>.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">3</span>
                    <h4 className="font-bold text-slate-900 text-sm">Cài Đặt Quyền Bảo Mật (Rules)</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(firestoreRulesSample, 'rules')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedKey === 'rules' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'rules' ? 'Đã sao chép' : 'Sao chép Rules'}</span>
                  </button>
                </div>
                <p className="text-slate-600 pl-8">
                  Chuyển sang tab <strong>Rules</strong> trên Firestore Console, dán đoạn mã phân quyền dưới đây rồi bấm <strong>Publish</strong>:
                </p>
                <div className="ml-8 p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto">
                  <pre>{firestoreRulesSample}</pre>
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">4</span>
                  <h4 className="font-bold text-slate-900 text-sm">Đăng Ký Web App Để Lấy Mã Cấu Hình</h4>
                </div>
                <p className="text-slate-600 pl-8">
                  Bấm vào biểu tượng bánh răng <strong>Project settings</strong> ở góc trên bên trái → Kéo xuống mục <strong>Your apps</strong> → Bấm vào biểu tượng <strong>Web (<code>&lt;/&gt;</code>)</strong> → Đặt tên ứng dụng → Bấm <strong>Register app</strong>.
                </p>
              </div>

              {/* Step 5 */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">5</span>
                  <h4 className="font-bold text-slate-900 text-sm">Dán Mã Cấu Hình Vào Ứng Dụng</h4>
                </div>
                <p className="text-slate-600 pl-8">
                  Sao chép toàn bộ khối <code>const firebaseConfig = &#123; ... &#125;;</code> hiển thị trên màn hình Firebase, quay lại ứng dụng này tại tab <strong>"Chỉnh Sửa Nguồn Dữ Liệu Máy Chủ"</strong>, dán vào ô nhập rồi bấm <strong>"Lưu & Chuyển Sang Database Này"</strong>.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: INTEGRATE WITH EXTERNAL APPS */}
          {activeTab === 'guide_integrate' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setIntegrationType('bot')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    integrationType === 'bot'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Bot className="w-4 h-4" />
                  <span>Bot Telegram / Zalo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIntegrationType('nodejs')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    integrationType === 'nodejs'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Terminal className="w-4 h-4" />
                  <span>Node.js Backend / API</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIntegrationType('sheets')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    integrationType === 'sheets'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Table className="w-4 h-4" />
                  <span>Google Sheets (Apps Script)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIntegrationType('flutter')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    integrationType === 'flutter'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Mobile App (Flutter / React Native)</span>
                </button>
              </div>

              {/* Snippet Card */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-blue-600" />
                    <span>Mã Nguồn Mẫu Kết Nối:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const text = 
                        integrationType === 'bot' ? botTelegramCode :
                        integrationType === 'nodejs' ? nodejsAdminCode :
                        integrationType === 'sheets' ? googleSheetsCode : flutterCode;
                      handleCopy(text, integrationType);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedKey === integrationType ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === integrationType ? 'Đã sao chép' : 'Sao chép đoạn mã'}</span>
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px] overflow-x-auto leading-relaxed">
                  <pre>
                    {integrationType === 'bot' && botTelegramCode}
                    {integrationType === 'nodejs' && nodejsAdminCode}
                    {integrationType === 'sheets' && googleSheetsCode}
                    {integrationType === 'flutter' && flutterCode}
                  </pre>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
