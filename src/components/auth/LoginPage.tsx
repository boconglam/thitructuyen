import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole, Exam, StudyTopic, Student } from '../../types';
import {
  ShieldCheck,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  Sparkles,
  BookOpen,
  FileCheck,
  UserCheck,
  Trophy,
  ArrowRight,
  ShieldAlert,
  Server,
  Database,
  CheckCircle2,
  AlertCircle,
  ScrollText,
  Clock,
  Search,
  Award,
  Download,
  FileText,
  Video,
  Cable,
  Flame,
  RefreshCw,
  Play,
  Check,
  Printer,
  QrCode,
  Calendar,
  ChevronRight,
  Filter,
  GraduationCap,
  ExternalLink,
  Laptop,
  Camera,
  Layers,
  HelpCircle,
} from 'lucide-react';

type PortalTab = 'exams' | 'topics' | 'rankings' | 'lookup' | 'moodle' | 'login';

export const LoginPage: React.FC = () => {
  const {
    login,
    loginAsRole,
    exams,
    studyTopics,
    classRankings,
    students,
    attempts,
    currentAcademicYear,
    moodleConfig,
    triggerMoodleSync,
    firebaseStatus,
    syncToFirebase,
    startExam,
  } = useApp();

  const [activeTab, setActiveTab] = useState<PortalTab>('exams');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showRulesModal, setShowRulesModal] = useState(false);

  // Filters for Exams
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [examSearch, setExamSearch] = useState<string>('');

  // Lookup state
  const [lookupQuery, setLookupQuery] = useState('HS2026-001');
  const [searchedStudent, setSearchedStudent] = useState<Student | null>(
    students.find((s) => s.studentCode === 'HS2026-001') || students[0] || null
  );
  const [showCertificate, setShowCertificate] = useState(false);

  // Study Topic preview modal
  const [selectedTopic, setSelectedTopic] = useState<StudyTopic | null>(null);
  const [topicNotice, setTopicNotice] = useState<string | null>(null);

  // Candidate Identity Verification Modal State
  const [pendingExam, setPendingExam] = useState<Exam | null>(null);
  const [candidateUsername, setCandidateUsername] = useState('hs_tuananh');
  const [candidatePassword, setCandidatePassword] = useState('123456');
  const [showCandidatePassword, setShowCandidatePassword] = useState(false);
  const [candidateAuthError, setCandidateAuthError] = useState('');
  const [isCandidateVerifying, setIsCandidateVerifying] = useState(false);

  // Moodle syncing state
  const [isSyncingMoodle, setIsSyncingMoodle] = useState(false);
  const [moodleSyncResult, setMoodleSyncResult] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!username.trim()) {
      setErrorMsg('Vui lòng nhập tên đăng nhập hoặc email.');
      return;
    }

    const res = login(username, password);
    if (!res.success) {
      setErrorMsg(res.message);
    } else {
      setSuccessMsg(res.message);
    }
  };

  const handleQuickLogin = (role: UserRole) => {
    setErrorMsg('');
    loginAsRole(role);
  };

  const handleEnterExam = (exam: Exam) => {
    setPendingExam(exam);
    setCandidateAuthError('');
    setCandidateUsername('hs_tuananh');
    setCandidatePassword('123456');
  };

  const handleCandidateExamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCandidateAuthError('');

    if (!candidateUsername.trim()) {
      setCandidateAuthError('Vui lòng nhập tên đăng nhập hoặc mã học sinh.');
      return;
    }
    if (!candidatePassword) {
      setCandidateAuthError('Vui lòng nhập mật khẩu tài khoản.');
      return;
    }

    setIsCandidateVerifying(true);
    setTimeout(() => {
      const res = login(candidateUsername.trim(), candidatePassword);
      setIsCandidateVerifying(false);

      if (!res.success) {
        setCandidateAuthError(res.message || 'Xác thực thất bại! Tên đăng nhập hoặc mật khẩu không chính xác.');
        return;
      }

      // Validated successfully!
      if (pendingExam) {
        const examIdToStart = pendingExam.id;
        setPendingExam(null);
        startExam(examIdToStart);
      }
    }, 350);
  };

  const handleQuickFillCandidate = (userLogin: string, pass: string) => {
    setCandidateUsername(userLogin);
    setCandidatePassword(pass);
    setCandidateAuthError('');
  };

  const handleRedirectToFullLogin = () => {
    if (pendingExam) {
      setErrorMsg(`Vui lòng đăng nhập hệ thống để tiếp tục vào kỳ thi: "${pendingExam.title}"`);
    }
    setPendingExam(null);
    setActiveTab('login');
  };

  const handleLookup = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = lookupQuery.trim().toUpperCase();
    const found = students.find(
      (s) =>
        s.studentCode.toUpperCase() === query ||
        s.fullName.toLowerCase().includes(query.toLowerCase())
    );
    setSearchedStudent(found || null);
  };

  const handleTestMoodleSync = async () => {
    setIsSyncingMoodle(true);
    setMoodleSyncResult(null);
    try {
      await triggerMoodleSync();
      setMoodleSyncResult('Đồng bộ Moodle API thành công: Đã cập nhật 8 khóa học và 12 đề kiểm tra.');
    } catch {
      setMoodleSyncResult('Lỗi kết nối máy chủ Moodle. Vui lòng kiểm tra API Token.');
    } finally {
      setIsSyncingMoodle(false);
    }
  };

  // Filtered exams
  const filteredExams = exams.filter((ex) => {
    const matchesGrade =
      selectedGrade === 'all' || ex.grade.toString() === selectedGrade;
    const matchesSubject =
      selectedSubject === 'all' || ex.subject === selectedSubject;
    const matchesSearch =
      ex.title.toLowerCase().includes(examSearch.toLowerCase()) ||
      ex.code.toLowerCase().includes(examSearch.toLowerCase());
    return matchesGrade && matchesSubject && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative selection:bg-indigo-500 selection:text-white">
      {/* Background glowing effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[500px] bg-indigo-600/10 blur-[140px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-0 w-[600px] h-[450px] bg-sky-600/10 blur-[130px] rounded-full pointer-events-none -z-10" />

      {/* Top Banner / Domain header */}
      <header className="border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div
            onClick={() => setActiveTab('exams')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 border border-indigo-400/30 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base tracking-wide text-white group-hover:text-indigo-300 transition-colors">
                  CỔNG THI TRỰC TUYẾN
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Ứng dụng độc lập
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono flex items-center gap-2">
                <span>thitructuyen.tdc3htp.com</span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline text-indigo-400 font-sans font-semibold">
                  {currentAcademicYear.name}
                </span>
              </span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-800/60 p-1.5 rounded-2xl border border-slate-700/60 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('exams')}
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'exams'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>Cuộc thi & Phòng thi</span>
            </button>

            <button
              onClick={() => setActiveTab('topics')}
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'topics'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Chuyên đề ôn tập</span>
            </button>

            <button
              onClick={() => setActiveTab('rankings')}
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'rankings'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Bảng vinh danh & Xếp hạng</span>
            </button>

            <button
              onClick={() => setActiveTab('lookup')}
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'lookup'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Tra cứu điểm</span>
            </button>

            <button
              onClick={() => setActiveTab('moodle')}
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'moodle'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Cable className="w-4 h-4" />
              <span>CSDL & Moodle</span>
            </button>
          </nav>

          {/* Right Action: Rules & Login CTA */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowRulesModal(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition-colors cursor-pointer"
            >
              <ScrollText className="w-3.5 h-3.5 text-amber-400" />
              <span>Điều lệ thi</span>
            </button>

            <button
              onClick={() => setActiveTab('login')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-indigo-500 text-white ring-2 ring-indigo-400/50 shadow-lg shadow-indigo-500/20'
                  : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-md shadow-indigo-600/30'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Đăng nhập</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Architecture Banner (Faithfully matches image_d7412a8b) */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-6 pb-2">
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden border border-slate-800">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/15 to-transparent pointer-events-none" />

          <div className="text-center max-w-3xl mx-auto mb-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2.5 border border-indigo-500/30">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Kiến trúc Hệ thống Khảo thí & Giám sát Chống gian lận AI Đa tầng
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white uppercase">
              CỔNG THI TRỰC TUYẾN
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-mono mt-1">
              thitructuyen.tdc3htp.com • Ứng dụng độc lập • Bảo mật phòng thi toàn diện
            </p>
          </div>

          {/* 4 Core Modules from Blueprint Image (image_d7412a8b) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Module 1: Quản lý chuyên đề */}
            <div
              onClick={() => setActiveTab('topics')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer group text-left ${
                activeTab === 'topics'
                  ? 'bg-indigo-950/80 border-indigo-500 ring-2 ring-indigo-500/40 shadow-lg'
                  : 'bg-slate-900/90 hover:bg-slate-800/90 border-slate-800 hover:border-indigo-500/50'
              }`}
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
              onClick={() => setActiveTab('exams')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer group text-left ${
                activeTab === 'exams'
                  ? 'bg-sky-950/80 border-sky-500 ring-2 ring-sky-500/40 shadow-lg'
                  : 'bg-slate-900/90 hover:bg-slate-800/90 border-slate-800 hover:border-sky-500/50'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 group-hover:scale-105 transition-transform">
                  <FileCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-white">Quản lý cuộc thi</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Thể lệ, câu hỏi, đề thi trắc nghiệm, lịch thi, kết quả
              </p>
            </div>

            {/* Module 3: Quản lý cá nhân */}
            <div
              onClick={() => setActiveTab('lookup')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer group text-left ${
                activeTab === 'lookup'
                  ? 'bg-emerald-950/80 border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg'
                  : 'bg-slate-900/90 hover:bg-slate-800/90 border-slate-800 hover:border-emerald-500/50'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-white">Quản lý cá nhân</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Học sinh, lượt thi trực tuyến, điểm và thứ hạng
              </p>
            </div>

            {/* Module 4: Quản lý xếp hạng */}
            <div
              onClick={() => setActiveTab('rankings')}
              className={`p-4 rounded-2xl border transition-all cursor-pointer group text-left ${
                activeTab === 'rankings'
                  ? 'bg-amber-950/80 border-amber-500 ring-2 ring-amber-500/40 shadow-lg'
                  : 'bg-slate-900/90 hover:bg-slate-800/90 border-slate-800 hover:border-amber-500/50'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-105 transition-transform">
                  <Trophy className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-white">Quản lý xếp hạng</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Điểm tập thể, tiêu chí phụ, xếp hạng lớp
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Dynamic View Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
        {/* ===================== TAB 1: CUỘC THI & PHÒNG THI ===================== */}
        {activeTab === 'exams' && (
          <div className="space-y-6">
            {/* Header controls & Filters */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                  <FileCheck className="w-6 h-6 text-indigo-400" />
                  <span>Danh Sách Kỳ Thi & Phòng Thi Đang Mở</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Chọn đề thi để kiểm tra cấu trúc câu hỏi, thời gian và bắt đầu làm bài thi có giám sát an ninh AI.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                <div className="relative flex-1 sm:w-56">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={examSearch}
                    onChange={(e) => setExamSearch(e.target.value)}
                    placeholder="Tìm tên kỳ thi hoặc mã..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-hidden cursor-pointer"
                >
                  <option value="all">Tất cả Khối lớp</option>
                  <option value="12">Khối 12</option>
                  <option value="11">Khối 11</option>
                  <option value="10">Khối 10</option>
                </select>

                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-hidden cursor-pointer"
                >
                  <option value="all">Tất cả Môn học</option>
                  <option value="Toán học">Toán học</option>
                  <option value="Tiếng Anh">Tiếng Anh</option>
                  <option value="Tin học">Tin học</option>
                </select>
              </div>
            </div>

            {/* Exam Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredExams.map((exam) => (
                <div
                  key={exam.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/60 rounded-3xl p-5 shadow-xl transition-all flex flex-col justify-between group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-28 h-28 bg-radial from-indigo-500/10 to-transparent pointer-events-none" />

                  <div>
                    {/* Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {exam.subject}
                        </span>
                        <span className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          Khối {exam.grade}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Đang mở thi
                      </span>
                    </div>

                    <h3 className="font-extrabold text-base text-white group-hover:text-indigo-300 transition-colors line-clamp-2 mb-1.5">
                      {exam.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                      {exam.description}
                    </p>

                    {/* Metadata specs */}
                    <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs mb-4">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span>Thời gian: <strong>{exam.durationMinutes} phút</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <FileText className="w-4 h-4 text-sky-400 shrink-0" />
                        <span>Số câu: <strong>{exam.questionIds.length} câu</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Award className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Thang điểm: <strong>{exam.totalPoints}đ</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>Giám sát: <strong>AI Toàn diện</strong></span>
                      </div>
                    </div>

                    {/* Anti-cheat badges */}
                    <div className="flex flex-wrap gap-1.5 mb-5 text-[10px] text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 flex items-center gap-1">
                        <Camera className="w-3 h-3 text-emerald-400" /> Webcam AI
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 flex items-center gap-1">
                        <Laptop className="w-3 h-3 text-sky-400" /> Fullscreen Kiosk
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-amber-400" /> Chống chuyển tab
                      </span>
                    </div>
                  </div>

                  {/* CTA Actions */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                    <button
                      onClick={() => handleEnterExam(exam)}
                      className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer group-hover:scale-[1.02]"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Vào Phòng Thi Ngay</span>
                    </button>

                    <button
                      onClick={() => setShowRulesModal(true)}
                      title="Xem quy chế & thể lệ kỳ thi"
                      className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <ScrollText className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================== TAB 2: QUẢN LÝ CHUYÊN ĐỀ ===================== */}
        {activeTab === 'topics' && (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                  <BookOpen className="w-6 h-6 text-indigo-400" />
                  <span>Quản Lý Chuyên Đề & Kho Học Liệu Ôn Tập</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Hệ thống tài liệu ôn tập, ma trận kiến thức, video bài giảng chuẩn cấu trúc khảo thí.
                </p>
              </div>

              <div className="px-3.5 py-1.5 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-semibold border border-indigo-500/20">
                Tổng cộng {studyTopics.length} chuyên đề trọng tâm
              </div>
            </div>

            {/* Topics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {studyTopics.map((topic) => (
                <div
                  key={topic.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-3xl p-6 shadow-xl flex flex-col justify-between group transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {topic.subject} • Khối {topic.grade}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Cập nhật: {topic.updatedAt}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-base text-white group-hover:text-indigo-300 transition-colors mb-2">
                      {topic.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                      {topic.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {topic.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 mb-4">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-sky-400" />
                        <span>{topic.docCount} tài liệu PDF</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Video className="w-4 h-4 text-rose-400" />
                        <span>{topic.videoCount} video bài giảng</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">
                      Biên soạn: <strong className="text-slate-200">{topic.author}</strong>
                    </span>
                    <button
                      onClick={() => setSelectedTopic(topic)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-indigo-600 text-xs font-semibold text-slate-200 hover:text-white transition-all cursor-pointer"
                    >
                      Xem chi tiết →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================== TAB 3: BẢNG VINH DANH & XẾP HẠNG ===================== */}
        {activeTab === 'rankings' && (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                  <Trophy className="w-6 h-6 text-amber-400" />
                  <span>Bảng Vinh Danh Cá Nhân & Xếp Hạng Tập Thể</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Đánh giá kết quả dựa trên điểm số trung bình, tỷ lệ tham gia và tiêu chí kỷ luật phòng thi.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Cập nhật trực tiếp: {new Date().toLocaleDateString('vi-VN')}</span>
              </div>
            </div>

            {/* 2-Column Split: Top Students & Class Rankings */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Top Candidates (Bảng vinh danh cá nhân) */}
              <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-400" />
                    <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">
                      Top Thí Sinh Xuất Sắc Nhất
                    </h3>
                  </div>
                  <span className="text-xs text-indigo-400 font-semibold">Toàn trường</span>
                </div>

                <div className="space-y-3">
                  {students
                    .slice()
                    .sort((a, b) => b.totalPoints - a.totalPoints)
                    .slice(0, 5)
                    .map((student, idx) => {
                      const medal =
                        idx === 0
                          ? '🥇'
                          : idx === 1
                          ? '🥈'
                          : idx === 2
                          ? '🥉'
                          : `#${idx + 1}`;
                      return (
                        <div
                          key={student.id}
                          className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                            idx === 0
                              ? 'bg-amber-500/10 border-amber-500/30'
                              : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-black w-7 text-center">{medal}</span>
                            <div>
                              <div className="text-sm font-bold text-white flex items-center gap-2">
                                <span>{student.fullName}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">
                                  {student.className}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400">
                                SBD: {student.studentCode} • {student.examCount} lượt thi
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-base font-black text-amber-400">
                              {student.totalPoints.toFixed(1)}đ
                            </div>
                            <span className="text-[10px] text-emerald-400 font-semibold">
                              Hạng {student.rank}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Right Column: Class Rankings (Xếp hạng tập thể lớp) */}
              <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">
                      Bảng Xếp Hạng Tập Thể Lớp
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">Năm học {currentAcademicYear.code}</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                        <th className="py-2.5 px-3">Hạng</th>
                        <th className="py-2.5 px-3">Tập thể lớp</th>
                        <th className="py-2.5 px-3">Sĩ số</th>
                        <th className="py-2.5 px-3">Tỷ lệ tham gia</th>
                        <th className="py-2.5 px-3">Điểm TB</th>
                        <th className="py-2.5 px-3 text-right">Tổng điểm</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {classRankings.map((cls) => (
                        <tr key={cls.classId} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3 font-black">
                            {cls.rank === 1 ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                🏆 Hạng 1
                              </span>
                            ) : cls.rank === 2 ? (
                              <span className="px-2 py-0.5 rounded-full bg-slate-400/20 text-slate-300 border border-slate-400/30">
                                🚩 Hạng 2
                              </span>
                            ) : (
                              <span className="text-slate-400 font-mono">Hạng {cls.rank}</span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-bold text-white">
                            Lớp {cls.className}
                          </td>
                          <td className="py-3 px-3 text-slate-300">{cls.studentCount} HS</td>
                          <td className="py-3 px-3 text-emerald-400 font-semibold">
                            {cls.participationRate}%
                          </td>
                          <td className="py-3 px-3 font-bold text-indigo-300">
                            {cls.averageScore.toFixed(2)}
                          </td>
                          <td className="py-3 px-3 text-right font-black text-amber-400">
                            {cls.totalCompetitionPoints} điểm
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Secondary criteria explanation */}
                <div className="mt-4 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-300">Quy định tính điểm xếp hạng:</strong> Điểm tập thể = (Điểm TB bài thi × 60) + (Tỷ lệ tham gia × 3) + Tiêu chí phụ kỷ luật (+50 điểm nếu 0 vi phạm an ninh).
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 4: TRA CỨU ĐIỂM & CHỨNG NHẬN ===================== */}
        {activeTab === 'lookup' && (
          <div className="space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
                  <Search className="w-6 h-6 text-emerald-400" />
                  <span>Tra Cứu Kết Quả Khảo Thí & Chứng Nhận Điện Tử</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Nhập Mã học sinh (SBD) để tra cứu điểm số, nhật ký bảo mật và in Giấy chứng nhận trực tuyến.
                </p>
              </div>

              {/* Search Bar */}
              <form onSubmit={handleLookup} className="flex items-center gap-2 w-full md:w-auto">
                <input
                  type="text"
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  placeholder="Nhập mã: HS2026-001..."
                  className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 w-full sm:w-64"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-colors whitespace-nowrap"
                >
                  Tra cứu
                </button>
              </form>
            </div>

            {/* Quick Sample Student Code buttons */}
            <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
              <span>Mã mẫu thử nghiệm:</span>
              {['HS2026-001', 'HS2026-002', 'HS2026-003', 'HS2026-004'].map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    setLookupQuery(code);
                    const found = students.find((s) => s.studentCode === code);
                    setSearchedStudent(found || null);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 font-mono text-[11px] border border-slate-700 cursor-pointer"
                >
                  {code}
                </button>
              ))}
            </div>

            {/* Result Container */}
            {searchedStudent ? (
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-black text-2xl">
                      {searchedStudent.fullName.slice(-1)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-xl font-bold text-white">
                          {searchedStudent.fullName}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {searchedStudent.className}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-1">
                        Mã học sinh: <strong>{searchedStudent.studentCode}</strong> • Email: {searchedStudent.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowCertificate(true)}
                      className="px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Award className="w-4 h-4 text-amber-400" />
                      <span>Xem Giấy Chứng Nhận</span>
                    </button>
                  </div>
                </div>

                {/* Score Summary Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 my-6">
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <div className="text-xs text-slate-400 mb-1">Tổng điểm tích lũy</div>
                    <div className="text-2xl font-black text-amber-400">
                      {searchedStudent.totalPoints.toFixed(1)}đ
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <div className="text-xs text-slate-400 mb-1">Xếp hạng toàn trường</div>
                    <div className="text-2xl font-black text-emerald-400">
                      Hạng #{searchedStudent.rank}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <div className="text-xs text-slate-400 mb-1">Số kỳ thi tham gia</div>
                    <div className="text-2xl font-black text-sky-400">
                      {searchedStudent.examCount} đề thi
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <div className="text-xs text-slate-400 mb-1">Trạng thái hồ sơ</div>
                    <div className="text-sm font-bold text-emerald-400 mt-2 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Đạt chuẩn khảo thí
                    </div>
                  </div>
                </div>

                {/* Past Attempts Table for this student */}
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Lịch Sử Các Bài Thi Đã Thực Hiện
                </h4>

                <div className="space-y-3">
                  {attempts
                    .filter((att) => att.studentId === searchedStudent.id || att.studentCode === searchedStudent.studentCode)
                    .map((att) => (
                      <div
                        key={att.id}
                        className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="font-bold text-sm text-white flex items-center gap-2">
                            <span>{att.examTitle}</span>
                            {att.passed ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Đạt chuẩn
                              </span>
                            ) : att.status === 'disqualified' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                Đình chỉ thi (Vi phạm)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                Chưa đạt
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 mt-1">
                            Thời gian nộp: {att.submitTime || att.startTime} • Vi phạm an ninh: {att.violations.length} lần
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xl font-black text-indigo-300">
                            {att.score} / {att.totalScore} điểm
                          </div>
                          <span className="text-[11px] text-slate-400">
                            Chấm điểm: {att.gradedBy || 'Tự động'}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
                <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <p className="text-sm font-semibold">Không tìm thấy thông tin thí sinh với mã tra cứu trên.</p>
                <p className="text-xs text-slate-500 mt-1">Vui lòng thử lại với mã: HS2026-001, HS2026-002...</p>
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 5: CƠ SỞ DỮ LIỆU & MOODLE ===================== */}
        {activeTab === 'moodle' && (
          <div className="space-y-6">
            {/* Blueprint Showcase Card (Faithfully matches image_b7fd3537 & image_156d6c73) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
              <div className="text-center max-w-2xl mx-auto mb-8">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                  CƠ SỞ DỮ LIỆU TRUNG TÂM
                </h2>
                <p className="text-sm text-slate-400 mt-1.5 font-medium">
                  Danh mục năm học • Lớp • Học sinh • Giáo viên • Cuộc thi • Kết quả • Lịch sử
                </p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Lưu trữ thời gian thực: Firebase Firestore
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Ứng dụng độc lập
                  </span>
                </div>
              </div>

              {/* Central DB Schema Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
                {[
                  { name: 'Năm học', count: '3 niên khóa', icon: Calendar },
                  { name: 'Danh sách Lớp', count: '5 lớp chuẩn', icon: Layers },
                  { name: 'Học sinh', count: '188 thí sinh', icon: UserCheck },
                  { name: 'Giáo viên', count: '4 bộ môn', icon: GraduationCap },
                  { name: 'Cuộc thi', count: '3 kỳ thi mở', icon: FileCheck },
                  { name: 'Kết quả', count: 'Đồng bộ AI', icon: Award },
                  { name: 'Lịch sử', count: 'Audit Log 24/7', icon: Database },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-800/70 border border-slate-700/80 text-center"
                  >
                    <item.icon className="w-5 h-5 text-indigo-400 mx-auto mb-2" />
                    <div className="font-bold text-xs text-white">{item.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{item.count}</div>
                  </div>
                ))}
              </div>

              {/* Moodle Section Box (as in image_b7fd3537) */}
              <div className="p-6 rounded-3xl bg-slate-950/80 border border-slate-800">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                      <Cable className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white flex items-center gap-2">
                        <span>Kết nối Moodle (tùy chọn)</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {moodleConfig.status === 'connected' ? 'Đã kết nối' : 'Sẵn sàng'}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Đồng bộ khóa học, bài kiểm tra và kết quả thông qua API hoặc plugin kết nối. Ứng dụng thi trực tuyến vẫn hoạt động độc lập.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleTestMoodleSync}
                    disabled={isSyncingMoodle}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-slate-700 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingMoodle ? 'animate-spin text-emerald-400' : ''}`} />
                    <span>{isSyncingMoodle ? 'Đang đồng bộ Moodle...' : 'Thử nghiệm đồng bộ API'}</span>
                  </button>
                </div>

                {moodleSyncResult && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{moodleSyncResult}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block mb-1">Máy chủ Moodle LMS:</span>
                    <span className="font-mono text-slate-200">{moodleConfig.serverUrl}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block mb-1">Mã xác thực API Token:</span>
                    <span className="font-mono text-slate-200">wstoken_••••••••••••••</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block mb-1">Đồng bộ gần nhất:</span>
                    <span className="font-mono text-slate-200">{moodleConfig.lastSyncTime}</span>
                  </div>
                </div>
              </div>

              {/* Proposed Tech Stack Table (from image_156d6c73) */}
              <div className="mt-8 pt-6 border-t border-slate-800">
                <h3 className="font-extrabold text-sm text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>1. Công nghệ hệ thống đề xuất (image_156d6c73)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400">Giao diện:</span>
                    <p className="font-bold text-white mt-1">React 19 + TypeScript</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400">Công cụ xây dựng:</span>
                    <p className="font-bold text-white mt-1">Vite + Tailwind CSS</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400">Cơ sở dữ liệu:</span>
                    <p className="font-bold text-indigo-300 mt-1">Firebase Firestore</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400">Tên miền hệ thống:</span>
                    <p className="font-mono font-bold text-emerald-400 mt-1">thitructuyen.tdc3htp.com</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 6: ĐĂNG NHẬP HỆ THỐNG ===================== */}
        {activeTab === 'login' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-5xl mx-auto">
            {/* Left: Login Form Card */}
            <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Lock className="w-5 h-5 text-indigo-400" />
                    Đăng Nhập Cổng Khảo Thí
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Áp dụng cho Quản trị viên, Giáo viên, Giám thị và Thí sinh
                  </p>
                </div>
                <span className="text-xs font-mono px-2 py-1 bg-slate-800 rounded text-slate-400 border border-slate-700">
                  SSL 256-bit
                </span>
              </div>

              {errorMsg && (
                <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Tên đăng nhập hoặc Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="admin, gv_mai, proctor_tuan, hs_tuananh..."
                      className="w-full pl-10 pr-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Mật khẩu
                    </label>
                    <span className="text-xs text-indigo-400 cursor-pointer hover:underline">
                      Quên mật khẩu?
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Nhập mật khẩu..."
                      className="w-full pl-10 pr-10 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember me & Notice */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Ghi nhớ phiên làm việc</span>
                  </label>

                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                    Mặc định: Tự logout khi đóng tab
                  </span>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <span>Xác Thực & Đăng Nhập Hệ Thống</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-indigo-400" />
                  Cơ sở dữ liệu: <strong className="text-slate-400">Firebase Firestore</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Năm học: {currentAcademicYear.code}</span>
                </span>
              </div>
            </div>

            {/* Right: Quick Role Test Access */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
              <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Đăng Nhập Nhanh 1-Chạm (Kiểm Thử)
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  Bấm trực tiếp vào vai trò mong muốn để truy cập ngay không cần gõ mật khẩu:
                </p>

                <div className="space-y-2.5">
                  {/* Admin button */}
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('admin')}
                    className="w-full p-3 rounded-2xl bg-slate-800/70 hover:bg-indigo-950/60 border border-slate-700/80 hover:border-indigo-500/60 transition-all flex items-center justify-between group cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm border border-indigo-500/30 group-hover:scale-105 transition-transform">
                        👑
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-indigo-300">
                          Quản trị viên hệ thống
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Tài khoản: <code className="text-indigo-300 font-mono">admin</code> (Toàn quyền CSDL)
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-indigo-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                      Vào ngay →
                    </span>
                  </button>

                  {/* Teacher button */}
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('teacher')}
                    className="w-full p-3 rounded-2xl bg-slate-800/70 hover:bg-sky-950/60 border border-slate-700/80 hover:border-sky-500/60 transition-all flex items-center justify-between group cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-sm border border-sky-500/30 group-hover:scale-105 transition-transform">
                        🎓
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-sky-300">
                          Giáo viên bộ môn
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Tài khoản: <code className="text-sky-300 font-mono">gv_mai</code> (Đề thi & Thể lệ)
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-sky-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                      Vào ngay →
                    </span>
                  </button>

                  {/* Proctor button */}
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('proctor')}
                    className="w-full p-3 rounded-2xl bg-slate-800/70 hover:bg-rose-950/60 border border-slate-700/80 hover:border-rose-500/60 transition-all flex items-center justify-between group cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-sm border border-rose-500/30 group-hover:scale-105 transition-transform">
                        🛡️
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-rose-300">
                          Cán bộ Giám thị Trực tiếp
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Tài khoản: <code className="text-rose-300 font-mono">proctor_tuan</code> (Camera AI)
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-rose-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                      Vào ngay →
                    </span>
                  </button>

                  {/* Student button */}
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('student')}
                    className="w-full p-3 rounded-2xl bg-slate-800/70 hover:bg-emerald-950/60 border border-slate-700/80 hover:border-emerald-500/60 transition-all flex items-center justify-between group cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-500/30 group-hover:scale-105 transition-transform">
                        🎒
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white group-hover:text-emerald-300">
                          Thí sinh / Học sinh dự thi
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Tài khoản: <code className="text-emerald-300 font-mono">hs_tuananh</code> (Lớp 12A1)
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-emerald-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                      Vào ngay →
                    </span>
                  </button>
                </div>
              </div>

              {/* Security Guarantee Box */}
              <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <p className="text-[11px] leading-relaxed">
                  Tuân thủ quy chế an toàn dữ liệu khảo thí: Mã hóa đường truyền SSL 256-bit, tự động thu hồi phiên làm việc khi đăng xuất.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            © 2026 <strong>CỔNG THI TRỰC TUYẾN TDC3HTP</strong> • Tên miền: <span className="font-mono text-slate-400">thitructuyen.tdc3htp.com</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Máy chủ An ninh: Sẵn sàng
            </span>
            <span>•</span>
            <span>Đồng bộ: Firebase Cloud</span>
            <span>•</span>
            <button
              onClick={() => setShowRulesModal(true)}
              className="text-indigo-400 hover:underline cursor-pointer"
            >
              Điều lệ cuộc thi
            </button>
          </div>
        </div>
      </footer>

      {/* Rules & Regulations Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-3xl border border-slate-700 max-w-2xl w-full p-6 sm:p-8 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <ScrollText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Điều Lệ & Quy Chế Thi Trực Tuyến
                  </h3>
                  <p className="text-xs text-slate-400">
                    Cổng thi trực tuyến TDC3HTP • Năm học {currentAcademicYear.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRulesModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-2">
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <h4 className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" /> 1. Quy định về thiết bị và đường truyền
                </h4>
                <p>
                  Thí sinh chuẩn bị máy tính bàn hoặc laptop có trang bị Webcam và Micro hoạt động tốt. Trình duyệt khuyến nghị là Google Chrome hoặc Microsoft Edge phiên bản mới nhất.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <h4 className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> 2. Giám sát an ninh AI và Chống gian lận
                </h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Bắt buộc bật chế độ toàn màn hình (Fullscreen Kiosk Mode) trong suốt thời gian làm bài.</li>
                  <li>Nghiêm cấm hành vi chuyển tab, thu nhỏ trình duyệt hoặc mở phần mềm khác (hệ thống tự động ghi nhận nhật ký vi phạm).</li>
                  <li>Nếu vượt quá số lần cảnh báo cho phép (2 - 5 lần tùy đề thi), bài thi sẽ bị tự động đình chỉ và thu bài ngay lập tức.</li>
                  <li>Nghiêm cấm hành vi sao chép (Ctrl+C, Ctrl+V), khóa hoàn toàn chuột phải trên màn hình làm bài.</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
                <h4 className="font-bold text-amber-300 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> 3. Thời gian và nộp bài
                </h4>
                <p>
                  Thí sinh có thể nộp bài khi đã hoàn thành các câu hỏi hoặc khi hết giờ làm bài hệ thống sẽ tự động gửi dữ liệu về máy chủ Firebase Firestore. Kết quả và bảng điểm sẽ được công bố công khai trên bảng xếp hạng.
                </p>
              </div>
            </div>

            <div className="pt-5 border-t border-slate-800 mt-6 flex justify-end">
              <button
                onClick={() => setShowRulesModal(false)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs cursor-pointer"
              >
                Đã hiểu & Đóng điều lệ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Authentication & Secure Exam Entry Modal */}
      {pendingExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="bg-slate-900 rounded-3xl border border-slate-700 max-w-lg w-full p-6 sm:p-7 shadow-2xl text-slate-200 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Top decorative gradient */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />

            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-1">
                    <Lock className="w-3 h-3" />
                    <span>YÊU CẦU XÁC THỰC DANH TÍNH</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">Xác Thực Thí Sinh Vào Phòng Thi</h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPendingExam(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Exam info badge */}
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs mb-4">
              <div className="font-bold text-white text-sm line-clamp-1 mb-1">
                {pendingExam.title}
              </div>
              <div className="grid grid-cols-3 gap-2 text-slate-400 text-[11px] pt-1 border-t border-slate-800/80">
                <div>
                  Thời gian: <strong className="text-white">{pendingExam.durationMinutes}p</strong>
                </div>
                <div>
                  Số câu: <strong className="text-white">{pendingExam.questionIds.length} câu</strong>
                </div>
                <div>
                  Mã đề: <strong className="text-indigo-300 font-mono">{pendingExam.code}</strong>
                </div>
              </div>
            </div>

            {/* Security note */}
            <div className="p-3 rounded-xl bg-indigo-950/50 border border-indigo-800/40 text-[11px] text-indigo-200/90 flex items-start gap-2.5 mb-5">
              <ShieldAlert className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                Thí sinh phải đăng nhập đúng tài khoản và mật khẩu được hội đồng thi cấp. Sau khi xác thực, hệ thống sẽ tự động kích hoạt giám sát toàn màn hình và an ninh AI.
              </span>
            </div>

            {/* Candidate Authentication Form */}
            <form onSubmit={handleCandidateExamSubmit} className="space-y-4">
              {candidateAuthError && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-600/50 text-xs text-rose-200 flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{candidateAuthError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Tài khoản thí sinh / Mã số học sinh:
                </label>
                <div className="relative">
                  <UserCheck className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={candidateUsername}
                    onChange={(e) => setCandidateUsername(e.target.value)}
                    placeholder="Nhập tên đăng nhập thí sinh (ví dụ: hs_tuananh)"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Mật khẩu tài khoản:
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showCandidatePassword ? 'text' : 'password'}
                    value={candidatePassword}
                    onChange={(e) => setCandidatePassword(e.target.value)}
                    placeholder="Nhập mật khẩu (mặc định: 123456)"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950/90 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCandidatePassword(!showCandidatePassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showCandidatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Quick candidate credentials for testing */}
              <div className="pt-2">
                <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                  Chọn nhanh tài khoản thí sinh để kiểm thử xác thực:
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickFillCandidate('hs_tuananh', '123456')}
                    className={`p-2 rounded-xl border text-[11px] text-left transition-colors cursor-pointer ${
                      candidateUsername === 'hs_tuananh'
                        ? 'bg-indigo-600/30 border-indigo-500 text-white font-bold'
                        : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="truncate font-semibold">Tuấn Anh (12A1)</div>
                    <div className="text-[9px] text-indigo-300 font-mono">hs_tuananh</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickFillCandidate('hs_long', '123456')}
                    className={`p-2 rounded-xl border text-[11px] text-left transition-colors cursor-pointer ${
                      candidateUsername === 'hs_long'
                        ? 'bg-indigo-600/30 border-indigo-500 text-white font-bold'
                        : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="truncate font-semibold">Hoàng Long (12A1)</div>
                    <div className="text-[9px] text-indigo-300 font-mono">hs_long</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickFillCandidate('hs_linh', '123456')}
                    className={`p-2 rounded-xl border text-[11px] text-left transition-colors cursor-pointer ${
                      candidateUsername === 'hs_linh'
                        ? 'bg-indigo-600/30 border-indigo-500 text-white font-bold'
                        : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="truncate font-semibold">Khánh Linh (12A2)</div>
                    <div className="text-[9px] text-indigo-300 font-mono">hs_linh</div>
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-3 flex flex-col sm:flex-row items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setPendingExam(null)}
                  className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 cursor-pointer transition-colors"
                >
                  Hủy bỏ
                </button>

                <button
                  type="submit"
                  disabled={isCandidateVerifying}
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isCandidateVerifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang Xác Thực Danh Tính...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Xác Thực & Vào Phòng Thi</span>
                    </>
                  )}
                </button>
              </div>

              {/* Redirect to full role login */}
              <div className="pt-2 text-center border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleRedirectToFullLogin}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 cursor-pointer inline-flex items-center gap-1"
                >
                  <span>Đăng nhập bằng tài khoản Cán bộ coi thi / Quản trị viên</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Topic Preview Modal */}
      {selectedTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-3xl border border-slate-700 max-w-2xl w-full p-6 sm:p-7 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <span className="text-xs font-bold text-indigo-400">
                  {selectedTopic.subject} • Khối {selectedTopic.grade}
                </span>
                <h3 className="text-lg font-bold text-white">{selectedTopic.title}</h3>
              </div>
              <button
                onClick={() => {
                  setSelectedTopic(null);
                  setTopicNotice(null);
                }}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {topicNotice && (
              <div className="p-3 mb-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{topicNotice}</span>
              </div>
            )}

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              {selectedTopic.description}
            </p>

            <div className="space-y-3 mb-6">
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-sky-400" />
                  <div>
                    <div className="font-bold text-white">Tài liệu PDF: Ma trận và Câu hỏi trọng tâm</div>
                    <div className="text-[10px] text-slate-400">Dung lượng: 2.4 MB • Định dạng chuẩn THPT Quốc gia</div>
                  </div>
                </div>
                <button
                  onClick={() => setTopicNotice(`Đã sẵn sàng tải tài liệu: ${selectedTopic.title} (PDF 2.4 MB)`)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold cursor-pointer"
                >
                  Tải PDF
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Video className="w-4 h-4 text-rose-400" />
                  <div>
                    <div className="font-bold text-white">Video bài giảng: Kỹ năng giải nhanh trắc nghiệm</div>
                    <div className="text-[10px] text-slate-400">Thời lượng: 35 phút • Giáo viên phụ trách: {selectedTopic.author}</div>
                  </div>
                </div>
                <button
                  onClick={() => setTopicNotice(`Đang kết nối luồng video bài giảng của ${selectedTopic.author}...`)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold cursor-pointer"
                >
                  Xem video
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  setSelectedTopic(null);
                  setTopicNotice(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Electronic Certificate Modal */}
      {showCertificate && searchedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-3xl border-2 border-amber-500/50 max-w-xl w-full p-6 sm:p-8 shadow-2xl text-slate-200 relative">
            <div className="text-center pb-4 border-b border-slate-800 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center mb-2 border border-amber-500/40">
                <Award className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-amber-300 uppercase tracking-wider">
                GIẤY CHỨNG NHẬN KHẢO THÍ ĐIỆN TỬ
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Cổng thi trực tuyến TDC3HTP • Năm học {currentAcademicYear.name}
              </p>
            </div>

            <div className="text-center space-y-3 mb-6">
              <p className="text-xs text-slate-400">Hội đồng Khảo thí & Đánh giá năng lực chứng nhận thí sinh:</p>
              <h2 className="text-2xl font-black text-white">{searchedStudent.fullName}</h2>
              <p className="text-xs text-indigo-300 font-mono">
                Mã học sinh: {searchedStudent.studentCode} • Tập thể lớp: {searchedStudent.className}
              </p>
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 inline-block mx-auto min-w-64">
                <div className="text-xs text-slate-400">Thành tích khảo thí:</div>
                <div className="text-3xl font-black text-amber-400 mt-1">
                  {searchedStudent.totalPoints.toFixed(1)} Điểm
                </div>
                <div className="text-xs text-emerald-400 font-bold mt-1">
                  Xếp hạng: #{searchedStudent.rank} toàn trường (Đạt chuẩn Giỏi)
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-4 border-t border-slate-800 mb-6">
              <div className="flex items-center gap-2">
                <QrCode className="w-8 h-8 text-slate-400" />
                <div>
                  <div>Mã xác thực: TDC-E-{searchedStudent.studentCode}</div>
                  <div>Tra cứu: thitructuyen.tdc3htp.com</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-slate-400">CHỦ TỊCH HỘI ĐỒNG THI</div>
                <div className="text-[10px] italic">Đã ký điện tử xác thực</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>In Chứng Nhận</span>
              </button>
              <button
                onClick={() => setShowCertificate(false)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white cursor-pointer transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
