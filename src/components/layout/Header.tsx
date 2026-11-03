import React from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import {
  Shield,
  GraduationCap,
  Briefcase,
  Radio,
  Download,
  Calendar,
  Cable,
  CheckCircle2,
  ChevronDown,
  Layers,
  LogOut,
  Flame,
  RefreshCw,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    currentRole,
    setCurrentRole,
    currentUser,
    isLoggedIn,
    logout,
    currentAcademicYear,
    moodleConfig,
    exportBackup,
    activeExam,
    firebaseStatus,
    lastFirebaseSync,
    syncToFirebase,
  } = useApp();

  // If in active exam, keep header simple
  if (activeExam) return null;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row items-center justify-between py-3 gap-3">
          {/* Logo & Branding (referencing image_d7412a8b) */}
          <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-linear-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-black text-lg shadow-md shadow-indigo-600/20">
                <Shield className="w-5 h-5 text-indigo-100" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight leading-tight">
                    CỔNG THI TRỰC TUYẾN
                  </h1>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Ứng dụng độc lập
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
                  <span>thitructuyen.tdc3htp.com</span>
                  <span>•</span>
                  <span className="text-indigo-600 font-sans font-semibold flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-indigo-500" />
                    {currentAcademicYear.name}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 lg:hidden">
              <button
                onClick={() => exportBackup()}
                title="Tải bản sao lưu hệ thống JSON"
                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg cursor-pointer"
              >
                <Download className="w-4 h-4" />
              </button>
              {currentUser && (
                <button
                  onClick={() => {
                    if (confirm(`Bạn có chắc chắn muốn đăng xuất tài khoản [${currentUser.fullName}]?`)) {
                      logout();
                    }
                  }}
                  title="Đăng xuất"
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Role Switcher pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/80 w-full lg:w-auto overflow-x-auto">
            <button
              onClick={() => setCurrentRole('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                currentRole === 'admin'
                  ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>👑</span>
              <span>Quản trị viên</span>
            </button>

            <button
              onClick={() => setCurrentRole('teacher')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                currentRole === 'teacher'
                  ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🎓</span>
              <span>Giáo viên</span>
            </button>

            <button
              onClick={() => setCurrentRole('student')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                currentRole === 'student'
                  ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>🎒</span>
              <span>Học sinh</span>
            </button>

            <button
              onClick={() => setCurrentRole('proctor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                currentRole === 'proctor'
                  ? 'bg-slate-900 text-rose-300 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              <span>Giám thị Live</span>
            </button>
          </div>

          {/* Right Action & User Profile */}
          <div className="hidden lg:flex items-center gap-3">
            {/* 1-click Quick Backup */}
            <button
              onClick={() => exportBackup()}
              title="Sao lưu cơ sở dữ liệu nhanh (.json)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-indigo-500" />
              <span>Sao lưu DB</span>
            </button>

            {/* Firebase Sync Button & Status */}
            <button
              onClick={async () => {
                const ok = await syncToFirebase();
                if (ok) {
                  alert('Đã đồng bộ cơ sở dữ liệu lên Firebase Firestore thành công (Dự án: wise-compiler-761jg)!');
                } else {
                  alert('Lỗi đồng bộ Firebase. Vui lòng kiểm tra kết nối mạng.');
                }
              }}
              disabled={firebaseStatus === 'syncing'}
              title="Đồng bộ dữ liệu lên Firebase Firestore (firebase.google.com)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
              <span>{firebaseStatus === 'syncing' ? 'Đang đồng bộ...' : 'Đồng bộ Firebase'}</span>
              <RefreshCw className={`w-3 h-3 text-amber-600 ${firebaseStatus === 'syncing' ? 'animate-spin' : ''}`} />
            </button>

            {/* Moodle Status */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
              <Cable className="w-3.5 h-3.5 text-emerald-600" />
              <span>Moodle</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            </div>

            {/* Current user badge */}
            {currentUser ? (
              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs border border-indigo-200">
                  {currentUser.fullName.slice(-1)}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-800 leading-none">{currentUser.fullName}</div>
                  <div className="text-[10px] text-slate-400 capitalize mt-0.5">
                    {currentRole === 'admin'
                      ? 'Quản trị hệ thống'
                      : currentRole === 'teacher'
                      ? 'Giáo viên bộ môn'
                      : currentRole === 'student'
                      ? 'Học sinh dự thi'
                      : 'Cán bộ coi thi'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 text-xs text-slate-400">
                <span>Chưa đăng nhập</span>
              </div>
            )}

            {/* Logout button */}
            {currentUser && (
              <button
                onClick={() => {
                  if (confirm(`Bạn có chắc chắn muốn đăng xuất tài khoản [${currentUser.fullName}]?`)) {
                    logout();
                  }
                }}
                title="Đăng xuất khỏi hệ thống"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-rose-600 transition-all cursor-pointer shadow-2xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng xuất</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
