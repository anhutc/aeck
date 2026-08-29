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
  HelpCircle, 
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
  ArrowRight,
  ShieldCheck,
  Globe
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

  // Active guide tab: 'guide_create' | 'guide_integrate' | 'config_editor'
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
      // If it starts with const firebaseConfig = or similar
      if (cleaned.includes('=')) {
        const afterEqual = cleaned.substring(cleaned.indexOf('=') + 1).trim();
        cleaned = afterEqual.replace(/;$/, '').trim();
      }

      // Replace JS unquoted keys with quoted JSON format if needed
      // Try JSON.parse first
      let parsed: any = null;
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        // Evaluate using a safe Function constructor for JS object literal format
        const extractFn = new Function(`return (${cleaned})`);
        parsed = extractFn();
      }

      if (parsed && typeof parsed === 'object') {
        if (!parsed.apiKey || !parsed.projectId) {
          setParseError('Cấu hình thiếu apiKey hoặc projectId. Vui lòng kiểm tra lại!');
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
        showToast('Đã tự động trích xuất thông số cấu hình Firebase thành công!', 'success');
      }
    } catch (e: any) {
      setParseError('Không thể phân tích đoạn mã. Vui lòng kiểm tra lại cú pháp hoặc nhập thủ công từng ô bên dưới.');
    }
  };

  const handleSaveConfig = () => {
    if (!formConfig.apiKey.trim() || !formConfig.projectId.trim()) {
      showToast('Vui lòng nhập tối thiểu API Key và Project ID!', 'error');
      return;
    }

    showConfirm({
      title: 'Xác nhận đổi nguồn dữ liệu Cloud',
      message: `Ứng dụng sẽ chuyển sang kết nối với Cloud Firestore của dự án "${formConfig.projectId}". Trang web sẽ tự động làm mới để áp dụng kết nối mới. Bạn có chắc chắn muốn tiếp tục?`,
      confirmText: 'Lưu & Khởi động lại',
      type: 'warning',
      onConfirm: () => {
        saveCustomFirebaseConfig(formConfig);
        showToast('Đã lưu cấu hình Firebase mới! Đang tải lại ứng dụng...', 'success');
        setTimeout(() => {
          window.location.reload();
        }, 800);
      }
    });
  };

  const handleResetToDefault = () => {
    showConfirm({
      title: 'Khôi phục về Cloud Mặc định',
      message: 'Ứng dụng sẽ xóa cấu hình tùy chỉnh và kết nối lại cơ sở dữ liệu Cloud Firestore mặc định của hệ thống. Bạn có muốn tiếp tục?',
      confirmText: 'Khôi phục mặc định',
      type: 'info',
      onConfirm: () => {
        removeCustomFirebaseConfig();
        showToast('Đã khôi phục về Cloud Firestore mặc định! Đang tải lại...', 'success');
        setTimeout(() => {
          window.location.reload();
        }, 800);
      }
    });
  };

  const sampleRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Cho phép đọc và ghi dữ liệu quỹ tập trung
    match /qunlqu_settings/{document=**} {
      allow read, write: if true;
    }
    // Cho phép kiểm tra đường truyền (ping test)
    match /test/{document=**} {
      allow read, write: if true;
    }
  }
}`;

  const botExampleCode = `// Bot Telegram / Zalo NodeJS lắng nghe biến động thu chi quỹ
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, onSnapshot } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "${formConfig.apiKey || activeInfo.config.apiKey || 'YOUR_API_KEY'}",
  projectId: "${formConfig.projectId || activeInfo.config.projectId || 'YOUR_PROJECT_ID'}",
  authDomain: "${formConfig.authDomain || activeInfo.config.authDomain || 'YOUR_AUTH_DOMAIN'}"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Lắng nghe thay đổi dữ liệu thời gian thực
const unsub = onSnapshot(doc(db, "qunlqu_settings", "app_state"), (docSnap) => {
  if (docSnap.exists()) {
    const data = docSnap.data();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                <span>Nguồn Dữ Liệu Đám Mây (Cloud Firestore)</span>
                {savedCustom ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    Dự án Tùy chỉnh (Đang kết nối)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    Dự án Mặc định của Hệ thống
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Chỉnh sửa cấu hình để chuyển sang máy chủ Firestore khác hoặc xem hướng dẫn kết nối
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 px-4 pt-2 gap-2 overflow-x-auto text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('config_editor')}
            className={`py-2.5 px-3.5 rounded-t-xl border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'config_editor'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 shadow-2xs font-bold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Key className="w-4 h-4 text-blue-500" />
            <span>Chỉnh Sửa Nguồn Dữ Liệu Máy Chủ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guide_create')}
            className={`py-2.5 px-3.5 rounded-t-xl border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'guide_create'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 shadow-2xs font-bold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-500" />
            <span>Hướng Dẫn Tạo Firebase Riêng (5 Bước)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guide_integrate')}
            className={`py-2.5 px-3.5 rounded-t-xl border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'guide_integrate'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 shadow-2xs font-bold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Code2 className="w-4 h-4 text-purple-500" />
            <span>Kết Nối App Khác / Bot Zalo / Telegram</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* TAB 1: CONFIG EDITOR */}
          {activeTab === 'config_editor' && (
            <div className="space-y-6">
              {/* Feature Introduction Banner */}
              <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-blue-950 dark:text-blue-200 text-xs sm:text-sm">
                    Tùy chỉnh & Kết nối máy chủ Firestore khác
                  </h4>
                  <p className="text-[11px] sm:text-xs text-blue-800/90 dark:text-blue-300/90 leading-relaxed">
                    Bạn có thể tự do thay đổi kết nối sang dự án Firebase / Firestore của riêng bạn hoặc máy chủ khác. Chỉ cần dán đoạn mã cấu hình hoặc điền thông số bên dưới rồi bấm <strong>"Lưu & Chuyển Sang Database Này"</strong>, ứng dụng sẽ lập tức lưu trữ và đồng bộ vào máy chủ mới.
                  </p>
                </div>
              </div>

              {/* Current Active Info Banner */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-blue-500" />
                    Hạ Tầng Đang Hoạt Động Hiện Tại:
                  </span>
                  {savedCustom && (
                    <button
                      type="button"
                      onClick={handleResetToDefault}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Khôi phục về Cloud Mặc định</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Project ID</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                      {activeInfo.config.projectId || 'Chưa thiết lập'}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Database ID</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                      {activeInfo.config.firestoreDatabaseId || (savedCustom ? '(default)' : defaultFirebaseConfig.firestoreDatabaseId || '(default)')}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Auth Domain</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                      {activeInfo.config.authDomain || 'Không có'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Paste Snippet Area */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-blue-500" />
                    <span>Dán nhanh mã cấu hình Firebase SDK (Tự động nhận diện):</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Hỗ trợ dạng JS hoặc JSON</span>
                </div>

                <textarea
                  rows={4}
                  value={rawSnippet}
                  onChange={(e) => handleParseSnippet(e.target.value)}
                  placeholder={`const firebaseConfig = {\n  apiKey: "AIzaSy...",\n  authDomain: "my-app.firebaseapp.com",\n  projectId: "my-custom-project",\n  storageBucket: "...",\n  messagingSenderId: "...",\n  appId: "..."\n};`}
                  className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />

                {parseError && (
                  <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{parseError}</span>
                  </div>
                )}
              </div>

              {/* Form Input Fields */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Hoặc điền chi tiết từng trường thông số:
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                      API Key <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={formConfig.apiKey}
                      onChange={(e) => setFormConfig({ ...formConfig, apiKey: e.target.value })}
                      placeholder="AIzaSyB..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                      Project ID <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={formConfig.projectId}
                      onChange={(e) => setFormConfig({ ...formConfig, projectId: e.target.value })}
                      placeholder="my-fund-project-123"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                      Auth Domain
                    </label>
                    <input
                      type="text"
                      value={formConfig.authDomain || ''}
                      onChange={(e) => setFormConfig({ ...formConfig, authDomain: e.target.value })}
                      placeholder="my-fund-project-123.firebaseapp.com"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                      Database ID (mặc định là <code className="text-blue-500 font-bold">(default)</code>)
                    </label>
                    <input
                      type="text"
                      value={formConfig.firestoreDatabaseId || '(default)'}
                      onChange={(e) => setFormConfig({ ...formConfig, firestoreDatabaseId: e.target.value })}
                      placeholder="(default)"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                      App ID
                    </label>
                    <input
                      type="text"
                      value={formConfig.appId || ''}
                      onChange={(e) => setFormConfig({ ...formConfig, appId: e.target.value })}
                      placeholder="1:1234567890:web:abcdef..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                      Storage Bucket (Tùy chọn)
                    </label>
                    <input
                      type="text"
                      value={formConfig.storageBucket || ''}
                      onChange={(e) => setFormConfig({ ...formConfig, storageBucket: e.target.value })}
                      placeholder="my-fund-project-123.appspot.com"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Lưu & Chuyển Sang Database Này</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: STEP BY STEP GUIDE TO CREATE FIREBASE */}
          {activeTab === 'guide_create' && (
            <div className="space-y-6 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-blue-900 dark:text-blue-200 text-sm">
                    Tự sở hữu 100% Cơ Sở Dữ Liệu Miễn Phí Với Google Firebase
                  </h4>
                  <p className="text-blue-700/90 dark:text-blue-300/90 mt-1">
                    Gói miễn phí Spark của Firebase cung cấp 1 GB lưu trữ và 50,000 lượt đọc/ngày — hoàn toàn đủ cho nhu cầu quản lý quỹ hoạt động của đội nhóm trong nhiều năm mà không mất phí.
                  </p>
                </div>
              </div>

              {/* Step 1 */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">1</span>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Tạo Dự Án (Project) trên Firebase Console</h4>
                </div>
                <p className="text-slate-600 dark:text-slate-400 pl-8">
                  Truy cập{' '}
                  <a 
                    href="https://console.firebase.google.com/" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-blue-600 dark:text-blue-400 font-semibold underline inline-flex items-center gap-0.5"
                  >
                    <span>Firebase Console</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>{' '}
                  → Đăng nhập tài khoản Google → Bấm <strong>Add project (Tạo dự án)</strong> → Đặt tên dự án (ví dụ: <code>quan-ly-quy-nhom</code>) → Bấm <strong>Continue</strong> để hoàn tất.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">2</span>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Khởi Tạo Cloud Firestore Database</h4>
                </div>
                <p className="text-slate-600 dark:text-slate-400 pl-8">
                  Ở menu bên trái, chọn <strong>Build &gt; Firestore Database</strong> → Bấm <strong>Create database</strong> → Chọn vị trí máy chủ (nên chọn <code>asia-southeast1 (Singapore)</code> hoặc <code>asia-east1</code> để tốc độ truy cập từ Việt Nam nhanh nhất) → Bấm <strong>Next</strong>.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">3</span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Cài Đặt Quyền Truy Cập (Firestore Rules)</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(sampleRules, 'rules')}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                  >
                    {copiedKey === 'rules' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'rules' ? 'Đã chép!' : 'Sao chép Rules'}</span>
                  </button>
                </div>
                <p className="text-slate-600 dark:text-slate-400 pl-8">
                  Trong trang Firestore Database, bấm sang tab <strong>Rules</strong>, xóa nội dung cũ và dán đoạn mã quy tắc bảo mật sau rồi bấm <strong>Publish (Xuất bản)</strong>:
                </p>
                <pre className="p-3 bg-slate-950 text-slate-200 font-mono text-[11px] rounded-xl overflow-x-auto border border-slate-800 ml-8">
                  {sampleRules}
                </pre>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">4</span>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Tạo Web App & Lấy Mã Cấu Hình (firebaseConfig)</h4>
                </div>
                <p className="text-slate-600 dark:text-slate-400 pl-8">
                  Vào <strong>Cài đặt dự án (Project Settings ⚙️)</strong> → Tab <strong>General</strong> → Cuộn xuống phần <em>Your apps</em> → Bấm vào biểu tượng <strong>Web <code>&lt;/&gt;</code></strong> → Đặt tên Web App → Sao chép toàn bộ đoạn mã <code>const firebaseConfig = &#123; ... &#125;;</code>.
                </p>
              </div>

              {/* Step 5 */}
              <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">5</span>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Dán Vào Ứng Dụng & Hoàn Tất</h4>
                </div>
                <p className="text-slate-600 dark:text-slate-400 pl-8">
                  Quay lại tab <strong>Cấu Hình Nguồn Dữ Liệu</strong> trong bảng này → Dán đoạn mã vừa copy vào ô dán nhanh → Bấm <strong>Lưu & Chuyển Sang Database Này</strong>. Mọi dữ liệu thu chi từ nay sẽ được lưu trữ trực tiếp trên Firebase của bạn!
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: INTEGRATE WITH OTHER APPS */}
          {activeTab === 'guide_integrate' && (
            <div className="space-y-5 text-xs text-slate-700 dark:text-slate-300">
              <div className="p-4 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-start gap-3">
                <Bot className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-purple-900 dark:text-purple-200 text-sm">
                    Kết Nối Dữ Liệu Quỹ Với Hệ Thống Ngoài & Bot Tự Động
                  </h4>
                  <p className="text-purple-700/90 dark:text-purple-300/90 mt-1">
                    Vì toàn bộ dữ liệu lưu trữ tại document <code>qunlqu_settings/app_state</code>, các bot Zalo/Telegram hoặc app khác có thể truy xuất trực tiếp để đọc số dư, giao dịch thu chi theo thời gian thực.
                  </p>
                </div>
              </div>

              {/* Sub-selector */}
              <div className="flex gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIntegrationType('bot')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors border ${
                    integrationType === 'bot'
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Bot Telegram / Zalo (Realtime)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIntegrationType('nodejs')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors border ${
                    integrationType === 'nodejs'
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Node.js Backend (Admin SDK)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIntegrationType('sheets')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors border ${
                    integrationType === 'sheets'
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Table className="w-3.5 h-3.5" />
                  <span>Google Sheets (REST API)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIntegrationType('flutter')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors border ${
                    integrationType === 'flutter'
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile App (Flutter / Dart)</span>
                </button>
              </div>

              {/* Code Snippet Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-purple-500" />
                    <span>Mã nguồn mẫu kết nối sẵn sàng sử dụng:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const codeToCopy = 
                        integrationType === 'bot' ? botExampleCode :
                        integrationType === 'nodejs' ? nodejsAdminCode :
                        integrationType === 'sheets' ? googleSheetsCode : flutterCode;
                      handleCopy(codeToCopy, integrationType);
                    }}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                  >
                    {copiedKey === integrationType ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === integrationType ? 'Đã sao chép!' : 'Sao chép mã'}</span>
                  </button>
                </div>

                <pre className="p-4 bg-slate-950 text-slate-200 font-mono text-[11px] rounded-xl overflow-x-auto border border-slate-800 leading-relaxed">
                  {integrationType === 'bot' && botExampleCode}
                  {integrationType === 'nodejs' && nodejsAdminCode}
                  {integrationType === 'sheets' && googleSheetsCode}
                  {integrationType === 'flutter' && flutterCode}
                </pre>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
