/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { StudentPortal } from './components/student/StudentPortal';
import { LiveProctorMonitor } from './components/teacher/LiveProctorMonitor';
import { SecureExamRoom } from './components/exam/SecureExamRoom';
import { ReportsAndAnalytics } from './components/reports/ReportsAndAnalytics';
import { LoginPage } from './components/auth/LoginPage';
import {
  BookOpen,
  FileCheck,
  UserCheck,
  Trophy,
  ShieldAlert,
  Server,
  Layers,
  Sparkles,
} from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { currentRole, activeExam, setCurrentRole, currentUser, isLoggedIn } = useApp();

  // Mặc định webapp ở trạng thái tất cả đều đã logout -> Hiện màn hình đăng nhập
  if (!isLoggedIn || !currentUser) {
    return <LoginPage />;
  }

  // If taking an exam, show the full-screen secure exam room directly
  if (activeExam) {
    return <SecureExamRoom />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
        {/* Architecture Navigation Banner (Matching image_d7412a8b) */}
        <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
          <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-radial from-indigo-500/10 to-transparent pointer-events-none"></div>

          <div className="text-center max-w-2xl mx-auto mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Kiến trúc Hệ thống Cổng thi Trực tuyến Bảo mật cao
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              CỔNG THI TRỰC TUYẾN
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-mono mt-1">
              thitructuyen.tdc3htp.com • Ứng dụng độc lập • Giám sát AI đa tầng
            </p>
          </div>

          {/* 4 Core Modules from Blueprint Image */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Module 1: Quản lý chuyên đề */}
            <div
              onClick={() => setCurrentRole('student')}
              className="bg-slate-800/80 hover:bg-slate-800 p-4 rounded-2xl border border-slate-700/80 hover:border-indigo-500/50 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-white">Quản lý chuyên đề</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Thông tin, tài liệu ôn tập, video bài giảng, nội dung học tập
              </p>
            </div>

            {/* Module 2: Quản lý cuộc thi */}
            <div
              onClick={() => setCurrentRole('teacher')}
              className="bg-slate-800/80 hover:bg-slate-800 p-4 rounded-2xl border border-slate-700/80 hover:border-indigo-500/50 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 group-hover:scale-105 transition-transform">
                  <FileCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-white">Quản lý cuộc thi</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Thể lệ, ngân hàng câu hỏi, đề thi trắc nghiệm, lịch thi, kết quả
              </p>
            </div>

            {/* Module 3: Quản lý cá nhân */}
            <div
              onClick={() => setCurrentRole('student')}
              className="bg-slate-800/80 hover:bg-slate-800 p-4 rounded-2xl border border-slate-700/80 hover:border-indigo-500/50 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-white">Quản lý cá nhân</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Hồ sơ học sinh, lượt thi trực tuyến, bảng điểm và thứ hạng
              </p>
            </div>

            {/* Module 4: Quản lý thi đua */}
            <div
              onClick={() => setCurrentRole('teacher')}
              className="bg-slate-800/80 hover:bg-slate-800 p-4 rounded-2xl border border-slate-700/80 hover:border-indigo-500/50 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform">
                  <Trophy className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-white">Quản lý thi đua</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Điểm tập thể, tiêu chí phụ, tỷ lệ tham gia, xếp hạng lớp
              </p>
            </div>
          </div>
        </div>

        {/* Current Active Role View */}
        {currentRole === 'admin' && <AdminDashboard />}
        {currentRole === 'teacher' && <TeacherDashboard />}
        {currentRole === 'student' && <StudentPortal />}
        {currentRole === 'proctor' && <LiveProctorMonitor />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div>
            © 2026 <strong>CỔNG THI TRỰC TUYẾN TDC3HTP</strong> • Phiên bản 2.4.0 Bảo mật cao
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Máy chủ An ninh: Hoạt động bình thường
            </span>
            <span>•</span>
            <span className="font-mono">SSL/TLS 256-bit</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
