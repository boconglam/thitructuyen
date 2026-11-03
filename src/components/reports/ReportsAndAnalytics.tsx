import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ExamAttempt } from '../../types';
import {
  BarChart3,
  TrendingUp,
  Award,
  Download,
  Users,
  Trophy,
  Flag,
  Star,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BookOpen,
  Lock,
  Unlock,
  Radio,
  FileText,
  Printer,
  Search,
  Filter,
  Eye,
  Camera,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Sparkles,
  School,
  UserCheck,
  X,
} from 'lucide-react';
import { exportToExcel } from '../../utils/excelHelper';

type ReportTab = 'realtime' | 'individual' | 'classes' | 'rankings' | 'analytics';

export const ReportsAndAnalytics: React.FC = () => {
  const {
    exams,
    attempts,
    questions,
    classes,
    classRankings,
    students,
    toggleLockExamResults,
    currentAcademicYear,
    currentUser,
  } = useApp();

  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');
  const [reportTab, setReportTab] = useState<ReportTab>('realtime');

  // Search & filter for individual results
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal detail for candidate attempt
  const [viewingAttempt, setViewingAttempt] = useState<ExamAttempt | null>(null);

  // PDF Preview & Print modal
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const selectedExam = exams.find((e) => e.id === selectedExamId) || exams[0];
  const examAttempts = attempts.filter((a) => a.examId === selectedExam?.id);

  // Assigned classes and total assigned students
  const assignedClasses = classes.filter((c) =>
    selectedExam?.assignedClassIds ? selectedExam.assignedClassIds.includes(c.id) : true
  );
  const totalAssignedStudents = assignedClasses.reduce((sum, c) => sum + c.studentCount, 0) || students.length;

  // Real-time metrics
  const liveInProgressAttempts = examAttempts.filter((a) => a.status === 'in_progress');
  const submittedAttempts = examAttempts.filter((a) => a.status === 'submitted');
  const disqualifiedAttempts = examAttempts.filter((a) => a.status === 'disqualified');
  const totalSubmissions = examAttempts.length;

  const participationRate =
    totalAssignedStudents > 0
      ? Math.min(Math.round((totalSubmissions / totalAssignedStudents) * 100), 100)
      : 100;

  // Score statistics
  const passedCount = examAttempts.filter((a) => a.passed).length;
  const passRate = totalSubmissions > 0 ? ((passedCount / totalSubmissions) * 100).toFixed(1) : '0';
  const averageScore =
    totalSubmissions > 0
      ? (examAttempts.reduce((acc, curr) => acc + curr.score, 0) / totalSubmissions).toFixed(2)
      : '0.00';
  const maxScore =
    totalSubmissions > 0 ? Math.max(...examAttempts.map((a) => a.score)).toFixed(1) : '0.0';
  const minScore =
    totalSubmissions > 0 ? Math.min(...examAttempts.map((a) => a.score)).toFixed(1) : '0.0';

  // Filtered individual attempts
  const filteredIndividualAttempts = examAttempts.filter((att) => {
    const matchesSearch =
      att.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      att.studentCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = classFilter === 'all' || att.className === classFilter;
    const matchesStatus = statusFilter === 'all' || att.status === statusFilter;
    return matchesSearch && matchesClass && matchesStatus;
  });

  // Ranked individual attempts (sorted by score descending)
  const rankedAttempts = [...examAttempts].sort((a, b) => b.score - a.score);

  // Class-level statistics calculation
  const classStatistics = assignedClasses.map((cls) => {
    const classAtts = examAttempts.filter((a) => a.className === cls.name);
    const count = classAtts.length;
    const passed = classAtts.filter((a) => a.passed).length;
    const excellent = classAtts.filter((a) => a.score >= 8.0).length;
    const avg =
      count > 0 ? (classAtts.reduce((sum, a) => sum + a.score, 0) / count).toFixed(2) : '0.00';
    const highest = count > 0 ? Math.max(...classAtts.map((a) => a.score)).toFixed(1) : '0.0';
    const lowest = count > 0 ? Math.min(...classAtts.map((a) => a.score)).toFixed(1) : '0.0';
    const rate = count > 0 ? Math.round((passed / count) * 100) : 0;
    const partRate = cls.studentCount > 0 ? Math.round((count / cls.studentCount) * 100) : 0;

    return {
      classId: cls.id,
      className: cls.name,
      grade: cls.grade,
      homeroomTeacher: cls.homeroomTeacherName || 'Chưa phân công',
      totalStudents: cls.studentCount,
      participatedCount: count,
      participationRate: partRate,
      averageScore: Number(avg),
      highestScore: highest,
      lowestScore: lowest,
      passedCount: passed,
      passRate: rate,
      excellentCount: excellent,
    };
  }).sort((a, b) => b.averageScore - a.averageScore);

  // Score distribution bins
  const bins = [
    { label: '0 - 2.0', count: examAttempts.filter((a) => a.score < 2.0).length },
    { label: '2.0 - 4.9', count: examAttempts.filter((a) => a.score >= 2.0 && a.score < 5.0).length },
    { label: '5.0 - 6.9', count: examAttempts.filter((a) => a.score >= 5.0 && a.score < 7.0).length },
    { label: '7.0 - 8.4', count: examAttempts.filter((a) => a.score >= 7.0 && a.score < 8.5).length },
    { label: '8.5 - 10', count: examAttempts.filter((a) => a.score >= 8.5).length },
  ];
  const maxBinCount = Math.max(...bins.map((b) => b.count), 1);

  // Question Analytics
  const examQuestions = questions.filter((q) => selectedExam?.questionIds.includes(q.id));
  const questionAnalytics = examQuestions.map((q) => {
    let wrongCount = 0;
    let rightCount = 0;
    examAttempts.forEach((att) => {
      const ans = att.answers[q.id];
      if (ans && q.correctAnswers.includes(String(ans))) {
        rightCount++;
      } else {
        wrongCount++;
      }
    });
    const totalAnswers = rightCount + wrongCount;
    const correctPercentage = totalAnswers > 0 ? Math.round((rightCount / totalAnswers) * 100) : 100;
    return {
      ...q,
      totalAnswers,
      rightCount,
      wrongCount,
      correctPercentage,
    };
  });

  const getRankBadgeClass = (score: number) => {
    if (score >= 9.0) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (score >= 8.0) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (score >= 6.5) return 'bg-sky-100 text-sky-800 border-sky-200';
    if (score >= 5.0) return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    return 'bg-rose-100 text-rose-800 border-rose-200';
  };

  const getRankTitle = (score: number) => {
    if (score >= 9.0) return 'Xuất sắc';
    if (score >= 8.0) return 'Giỏi';
    if (score >= 6.5) return 'Khá';
    if (score >= 5.0) return 'Trung bình';
    return 'Chưa đạt';
  };

  const handleExportExcel = () => {
    const exportData = examAttempts.map((a, idx) => ({
      'STT': idx + 1,
      'Mã học sinh': a.studentCode,
      'Họ và tên': a.studentName,
      'Lớp': a.className,
      'Điểm số': a.score,
      'Thang điểm': a.totalScore,
      'Xếp loại': getRankTitle(a.score),
      'Kết quả': a.passed ? 'ĐẠT' : 'CHƯA ĐẠT',
      'Số vi phạm': a.violations.length,
      'Thời gian nộp': a.submitTime || a.startTime,
      'Trạng thái': a.status === 'submitted' ? 'Đã nộp bài' : a.status === 'in_progress' ? 'Đang thi' : 'Đình chỉ',
      'Ghi chú giám thị': a.proctorNotes || '',
    }));

    exportToExcel(
      exportData,
      `Ket_Qua_${selectedExam?.code || 'EXAM'}_${new Date().toISOString().slice(0, 10)}`,
      'BangDiemChiTiet'
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              Báo Cáo Kết Quả, Bảng Xếp Hạng & Khóa Hội Thi
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Quản trị viên
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi thời gian thực, xem kết quả cá nhân và từng lớp, vinh danh xếp hạng, xuất file Excel & PDF
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Exam Selector */}
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.code} - {ex.title} {ex.isResultsLocked ? '🔒 [Đã khóa]' : ''}
              </option>
            ))}
          </select>

          {/* Lock / Unlock Results Button */}
          <button
            type="button"
            onClick={() => toggleLockExamResults(selectedExam.id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer border ${
              selectedExam?.isResultsLocked
                ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'
                : 'bg-rose-600 hover:bg-rose-700 text-white border-rose-600'
            }`}
            title={selectedExam?.isResultsLocked ? 'Mở khóa để hiệu chỉnh kết quả' : 'Khóa sổ kết quả sau khi kết thúc hội thi'}
          >
            {selectedExam?.isResultsLocked ? (
              <>
                <Unlock className="w-3.5 h-3.5" />
                <span>Mở Khóa Kết Quả</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Khóa Kết Quả Hội Thi</span>
              </>
            )}
          </button>

          {/* Export Excel Button */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất Excel</span>
          </button>

          {/* Export PDF Button */}
          <button
            type="button"
            onClick={() => setIsPdfModalOpen(true)}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Xuất PDF / In Báo Cáo</span>
          </button>
        </div>
      </div>

      {/* Results Locked Security Banner */}
      {selectedExam?.isResultsLocked && (
        <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-indigo-950 text-white p-4 sm:p-5 rounded-2xl border-2 border-rose-500/60 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/40 shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 mb-1">
                <span>HỘI THI ĐÃ KẾT THÚC & NIÊM PHONG KẾT QUẢ</span>
              </div>
              <h3 className="font-extrabold text-sm text-white">
                Bảng điểm và Kết quả kỳ thi &quot;{selectedExam.title}&quot; đã được Khóa sổ chính thức
              </h3>
              <p className="text-[11px] text-slate-300 mt-0.5 font-mono">
                Khóa vào lúc: <strong>{selectedExam.resultsLockedAt || 'Vừa xong'}</strong> • Cán bộ thực hiện: <strong>{selectedExam.resultsLockedBy || 'Quản trị viên'}</strong>
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="inline-block px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Điểm số cố định • Chống sửa đổi
            </span>
          </div>
        </div>
      )}

      {/* Main Feature Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-1.5 shadow-xs overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          <button
            onClick={() => setReportTab('realtime')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              reportTab === 'realtime'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Theo dõi Thời gian thực ({liveInProgressAttempts.length} đang thi)</span>
          </button>

          <button
            onClick={() => setReportTab('individual')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              reportTab === 'individual'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Kết quả Cá nhân Thí sinh</span>
          </button>

          <button
            onClick={() => setReportTab('classes')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              reportTab === 'classes'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <School className="w-4 h-4" />
            <span>Kết quả Từng Lớp ({classStatistics.length} lớp)</span>
          </button>

          <button
            onClick={() => setReportTab('rankings')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              reportTab === 'rankings'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Bảng Xếp Hạng & Vinh Danh</span>
          </button>

          <button
            onClick={() => setReportTab('analytics')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              reportTab === 'analytics'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Phổ điểm & Độ khó Câu hỏi</span>
          </button>
        </div>
      </div>

      {/* ==================== TAB 1: THEO DÕI THỜI GIAN THỰC (REAL-TIME) ==================== */}
      {reportTab === 'realtime' && (
        <div className="space-y-6">
          {/* Real-time KPI Metric Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Đang làm bài trực tiếp
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-emerald-600">{liveInProgressAttempts.length}</span>
                <span className="text-xs text-slate-400">thí sinh online</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                <Camera className="w-3.5 h-3.5 text-indigo-500" />
                <span>Camera & AI proctoring đang kích hoạt</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Đã nộp bài hoàn tất
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-indigo-600">{submittedAttempts.length}</span>
                <span className="text-xs text-slate-400">bài thi</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                Tỷ lệ nộp bài: <strong className="text-slate-800">{passRate}% đạt chuẩn</strong>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Sĩ số đăng ký dự thi
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-slate-800">{totalAssignedStudents}</span>
                <span className="text-xs text-slate-400">học sinh ({assignedClasses.length} lớp)</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                Tỷ lệ tham gia: <strong className="text-indigo-600">{participationRate}%</strong>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Cảnh báo an ninh AI
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-rose-600">
                  {disqualifiedAttempts.length > 0 ? disqualifiedAttempts.length : '0'}
                </span>
                <span className="text-xs text-slate-400">ca đình chỉ</span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                Chuyển tab / Rời màn hình: <strong className="text-rose-600">Kiểm soát chặt chẽ</strong>
              </div>
            </div>
          </div>

          {/* Real-time Active Sessions Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Danh Sách Thí Sinh Đang Dự Thi Trực Tiếp Theo Thời Gian Thực
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Cập nhật liên tục tiến độ trả lời câu hỏi và trạng thái giám sát AI của từng phòng thi
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {liveInProgressAttempts.length} phiên đang mở
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 uppercase font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Thí sinh</th>
                    <th className="py-3 px-4">Lớp</th>
                    <th className="py-3 px-4">Thời gian bắt đầu</th>
                    <th className="py-3 px-4">Tiến độ câu hỏi</th>
                    <th className="py-3 px-4">Giám sát AI</th>
                    <th className="py-3 px-4">Vi phạm</th>
                    <th className="py-3 px-4 text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {liveInProgressAttempts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Hiện không có thí sinh nào đang làm bài trực tiếp trong kỳ thi này.
                      </td>
                    </tr>
                  ) : (
                    liveInProgressAttempts.map((att) => {
                      const answeredCount = Object.keys(att.answers || {}).length;
                      const totalQ = selectedExam.questionIds.length || 1;
                      const pct = Math.round((answeredCount / totalQ) * 100);

                      return (
                        <tr key={att.id} className="hover:bg-slate-50/80">
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-800">{att.studentName}</span>
                            <span className="block text-[10px] font-mono text-slate-400">{att.studentCode}</span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-700">{att.className}</td>
                          <td className="py-3 px-4 font-mono text-slate-500">{new Date(att.startTime).toLocaleTimeString('vi-VN')}</td>
                          <td className="py-3 px-4">
                            <div className="w-36">
                              <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                                <span>{answeredCount}/{totalQ} câu</span>
                                <span className="font-bold text-indigo-600">{pct}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div style={{ width: `${pct}%` }} className="h-full bg-indigo-600 rounded-full" />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <Camera className="w-3 h-3 text-emerald-600" />
                              Webcam AI Online
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {att.violations.length > 0 ? (
                              <span className="inline-flex items-center gap-1 font-bold text-rose-600">
                                <AlertCircle className="w-3.5 h-3.5" />
                                {att.violations.length} lỗi
                              </span>
                            ) : (
                              <span className="text-emerald-600 font-medium">0 (Tuân thủ)</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Đang làm bài
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: KẾT QUẢ CÁ NHÂN THÍ SINH ==================== */}
      {reportTab === 'individual' && (
        <div className="space-y-5">
          {/* Search & Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full sm:w-auto">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo mã học sinh hoặc họ tên thí sinh..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">Tất cả lớp</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.name}>
                    Lớp {c.name}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="submitted">Đã nộp bài</option>
                <option value="in_progress">Đang thi</option>
                <option value="disqualified">Đình chỉ thi</option>
              </select>
            </div>
          </div>

          {/* Individual Results Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                Bảng Điểm Cá Nhân Thí Sinh ({filteredIndividualAttempts.length} bản ghi)
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {selectedExam.code} • Điểm đạt: {selectedExam.passingScore}/{selectedExam.totalPoints}đ
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 uppercase font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Hạng</th>
                    <th className="py-3 px-4">Mã số HS</th>
                    <th className="py-3 px-4">Họ và tên</th>
                    <th className="py-3 px-4">Lớp</th>
                    <th className="py-3 px-4">Điểm số</th>
                    <th className="py-3 px-4">Xếp loại</th>
                    <th className="py-3 px-4">Kết quả</th>
                    <th className="py-3 px-4">Vi phạm</th>
                    <th className="py-3 px-4">Thời gian nộp</th>
                    <th className="py-3 px-4 text-right">Chi tiết bài thi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredIndividualAttempts.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400">
                        Không tìm thấy thí sinh phù hợp với bộ lọc tìm kiếm.
                      </td>
                    </tr>
                  ) : (
                    filteredIndividualAttempts.map((att, idx) => (
                      <tr key={att.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 font-black text-slate-700">#{idx + 1}</td>
                        <td className="py-3 px-4 font-mono font-bold text-indigo-700">{att.studentCode}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{att.studentName}</td>
                        <td className="py-3 px-4 font-semibold text-slate-600">{att.className}</td>
                        <td className="py-3 px-4 font-black text-slate-900 text-sm">
                          {att.score.toFixed(1)} <span className="text-slate-400 text-[10px]">/ {att.totalScore}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getRankBadgeClass(att.score)}`}>
                            {getRankTitle(att.score)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              att.passed
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}
                          >
                            {att.passed ? 'ĐẠT' : 'CHƯA ĐẠT'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {att.violations.length > 0 ? (
                            <span className="font-bold text-rose-600">{att.violations.length} lỗi</span>
                          ) : (
                            <span className="text-emerald-600">0</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-400">
                          {att.submitTime ? new Date(att.submitTime).toLocaleString('vi-VN') : 'Đang thi'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setViewingAttempt(att)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer inline-flex items-center gap-1"
                            title="Xem chi tiết bài làm"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Xem bài</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: KẾT QUẢ TỪNG LỚP ==================== */}
      {reportTab === 'classes' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Thống Kê Kết Quả Khảo Thí Theo Từng Tập Thể Lớp
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tổng hợp điểm trung bình, tỷ lệ tham gia và tỷ lệ đạt chuẩn của từng lớp được phân bổ dự thi
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {classStatistics.length} phân lớp
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 uppercase font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Thứ hạng</th>
                    <th className="py-3 px-4">Tên lớp</th>
                    <th className="py-3 px-4">Khối</th>
                    <th className="py-3 px-4">Giáo viên chủ nhiệm</th>
                    <th className="py-3 px-4">Sĩ số</th>
                    <th className="py-3 px-4">Đã dự thi</th>
                    <th className="py-3 px-4">Tỷ lệ tham gia</th>
                    <th className="py-3 px-4">Điểm TB Lớp</th>
                    <th className="py-3 px-4">Cao nhất</th>
                    <th className="py-3 px-4">Thấp nhất</th>
                    <th className="py-3 px-4 text-right">Tỷ lệ Đạt (≥ 5.0)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classStatistics.map((cs, idx) => (
                    <tr key={cs.classId} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-black">
                        {idx === 0 ? (
                          <span className="w-6 h-6 rounded-full bg-amber-400 text-amber-900 inline-flex items-center justify-center font-bold">
                            1
                          </span>
                        ) : idx === 1 ? (
                          <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-800 inline-flex items-center justify-center font-bold">
                            2
                          </span>
                        ) : idx === 2 ? (
                          <span className="w-6 h-6 rounded-full bg-amber-700 text-white inline-flex items-center justify-center font-bold">
                            3
                          </span>
                        ) : (
                          `#${idx + 1}`
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 text-sm">Lớp {cs.className}</td>
                      <td className="py-3 px-4 font-semibold text-slate-600">Khối {cs.grade}</td>
                      <td className="py-3 px-4 text-slate-700">{cs.homeroomTeacher}</td>
                      <td className="py-3 px-4 font-mono font-medium">{cs.totalStudents} HS</td>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600">{cs.participatedCount} HS</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-700">{cs.participationRate}%</span>
                      </td>
                      <td className="py-3 px-4 font-black text-indigo-600 text-sm">
                        {cs.averageScore.toFixed(2)} đ
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-600">{cs.highestScore}</td>
                      <td className="py-3 px-4 font-bold text-rose-600">{cs.lowestScore}</td>
                      <td className="py-3 px-4 text-right font-black text-emerald-600">
                        {cs.passRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 4: BẢNG XẾP HẠNG & VINH DANH ==================== */}
      {reportTab === 'rankings' && (
        <div className="space-y-6">
          {/* Top 3 Podium Cards */}
          <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="text-center max-w-xl mx-auto mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-amber-200 text-xs font-semibold mb-2">
                <Trophy className="w-4 h-4 text-amber-300" />
                Vinh Danh Thí Sinh Điểm Cao Nhất Hội Thi
              </div>
              <h3 className="text-2xl font-black">Bảng Vàng Khảo Thí Xuất Sắc</h3>
              <p className="text-xs text-amber-100 mt-1">
                Kỳ thi: {selectedExam.title} • {currentAcademicYear.name}
              </p>
            </div>

            {/* Top 3 Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {rankedAttempts.slice(0, 3).map((top, idx) => (
                <div
                  key={top.id}
                  className={`bg-white/10 backdrop-blur-md rounded-2xl p-5 border text-center transition-all ${
                    idx === 0
                      ? 'border-amber-400 bg-amber-500/20 shadow-lg scale-105'
                      : idx === 1
                      ? 'border-slate-300'
                      : 'border-amber-700'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center font-black text-xl mb-3 shadow-md bg-white text-slate-900">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                  </div>
                  <h4 className="font-extrabold text-base text-white">{top.studentName}</h4>
                  <p className="text-xs text-amber-200 font-mono mt-0.5">
                    {top.studentCode} • Lớp {top.className}
                  </p>
                  <div className="mt-3 p-2.5 rounded-xl bg-black/20 inline-block min-w-32">
                    <span className="text-2xl font-black text-amber-300">{top.score.toFixed(1)}</span>
                    <span className="text-[11px] text-slate-300 block">Điểm chung cuộc</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top 10 Detailed Leaderboard Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                Top 10 Thí Sinh Đạt Thành Tích Cao Nhất Toàn Trường
              </h3>
              <span className="text-xs text-slate-400">Xếp hạng theo điểm & thời gian hoàn thành</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 uppercase font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Thứ tự</th>
                    <th className="py-3 px-4">Mã thí sinh</th>
                    <th className="py-3 px-4">Họ và tên</th>
                    <th className="py-3 px-4">Lớp</th>
                    <th className="py-3 px-4">Điểm số</th>
                    <th className="py-3 px-4">Danh hiệu</th>
                    <th className="py-3 px-4 text-right">Thời gian hoàn thành</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rankedAttempts.slice(0, 10).map((cand, idx) => (
                    <tr key={cand.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-black">
                        {idx === 0 ? '🏆 Hạng 1' : idx === 1 ? '🥈 Hạng 2' : idx === 2 ? '🥉 Hạng 3' : `#${idx + 1}`}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">{cand.studentCode}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{cand.studentName}</td>
                      <td className="py-3 px-4 font-semibold text-slate-600">{cand.className}</td>
                      <td className="py-3 px-4 font-black text-indigo-600 text-sm">{cand.score.toFixed(1)} đ</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {getRankTitle(cand.score)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">
                        {cand.submitTime ? new Date(cand.submitTime).toLocaleTimeString('vi-VN') : '---'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 5: PHỔ ĐIỂM & ĐỘ KHÓ CÂU HỎI ==================== */}
      {reportTab === 'analytics' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Tổng số bài thi
              </span>
              <span className="text-3xl font-black text-indigo-600 mt-2 block">{totalSubmissions}</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Điểm trung bình
              </span>
              <span className="text-3xl font-black text-slate-800 mt-2 block">{averageScore}</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Tỷ lệ Đạt (≥ 5.0)
              </span>
              <span className="text-3xl font-black text-emerald-600 mt-2 block">{passRate}%</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Điểm cao nhất
              </span>
              <span className="text-3xl font-black text-amber-500 mt-2 block">{maxScore}</span>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Điểm thấp nhất
              </span>
              <span className="text-3xl font-black text-rose-500 mt-2 block">{minScore}</span>
            </div>
          </div>

          {/* Score Distribution Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-2">Biểu đồ Phổ điểm Thí sinh</h3>
            <p className="text-xs text-slate-500 mb-6">
              Phân bố số lượng học sinh theo từng dải điểm số trong kỳ thi đang chọn
            </p>

            <div className="grid grid-cols-5 gap-4 items-end h-48 pt-4 pb-2 border-b border-slate-200">
              {bins.map((bin, idx) => {
                const heightPercent = totalSubmissions > 0 ? Math.max((bin.count / maxBinCount) * 100, 8) : 8;
                return (
                  <div key={idx} className="flex flex-col items-center h-full justify-end group">
                    <span className="text-xs font-bold text-slate-700 mb-1.5 opacity-90 group-hover:scale-110 transition-transform">
                      {bin.count} HS
                    </span>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full max-w-16 rounded-t-xl bg-gradient-to-t from-indigo-600 to-indigo-400 group-hover:from-indigo-700 group-hover:to-indigo-500 transition-all shadow-xs relative"
                    ></div>
                    <span className="text-xs font-semibold text-slate-600 mt-2">{bin.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Question Analytics Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Phân tích Chi tiết Độ khó Từng Câu hỏi</h3>
              <span className="text-xs text-slate-400">{questionAnalytics.length} câu hỏi</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 uppercase font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Mã câu hỏi</th>
                    <th className="py-3 px-4">Nội dung</th>
                    <th className="py-3 px-4">Chuyên đề</th>
                    <th className="py-3 px-4">Độ khó</th>
                    <th className="py-3 px-4">Trả lời đúng</th>
                    <th className="py-3 px-4">Trả lời sai</th>
                    <th className="py-3 px-4 text-right">Tỷ lệ đúng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {questionAnalytics.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">{q.code}</td>
                      <td className="py-3 px-4 max-w-xs truncate">{q.content}</td>
                      <td className="py-3 px-4 text-slate-700">{q.topic}</td>
                      <td className="py-3 px-4 font-semibold">{q.difficulty}</td>
                      <td className="py-3 px-4 text-emerald-600 font-bold">{q.rightCount}</td>
                      <td className="py-3 px-4 text-rose-600 font-bold">{q.wrongCount}</td>
                      <td className="py-3 px-4 text-right font-black text-indigo-600">
                        {q.correctPercentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Detail Candidate Attempt Modal */}
      {viewingAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl text-slate-800 border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <span className="text-[11px] font-bold text-indigo-600">Chi tiết bài làm thí sinh</span>
                <h3 className="text-lg font-bold text-slate-900">{viewingAttempt.studentName}</h3>
                <span className="text-xs text-slate-400 font-mono">
                  Mã: {viewingAttempt.studentCode} • Lớp {viewingAttempt.className}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewingAttempt(null)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-50 text-xs mb-4 border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px]">Điểm đạt được:</span>
                <strong className="text-indigo-600 text-base">{viewingAttempt.score} đ</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Xếp loại:</span>
                <strong className="text-slate-800">{getRankTitle(viewingAttempt.score)}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Vi phạm an ninh:</span>
                <strong className={viewingAttempt.violations.length > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                  {viewingAttempt.violations.length} lần
                </strong>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Câu trả lời đã ghi nhận ({Object.keys(viewingAttempt.answers || {}).length} câu)
              </h4>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {Object.entries(viewingAttempt.answers || {}).map(([qId, ans], idx) => {
                  const qObj = questions.find((q) => q.id === qId);
                  const isCorrect = qObj && qObj.correctAnswers.includes(String(ans));
                  return (
                    <div
                      key={qId}
                      className={`p-3 rounded-xl border text-xs ${
                        isCorrect ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-700">Câu {idx + 1}: {qObj?.code || qId}</span>
                        <span className={`text-[10px] font-bold ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {isCorrect ? '✓ Đúng' : '✗ Sai'}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] mb-1">{qObj?.content || 'Nội dung câu hỏi'}</p>
                      <div className="text-[10px] text-slate-500">
                        Đáp án chọn: <strong className="text-slate-800">{String(ans)}</strong> • Đáp án đúng: <strong className="text-emerald-700">{qObj?.correctAnswers.join(', ')}</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setViewingAttempt(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== PRINT / PDF EXPORT MODAL ==================== */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl text-slate-800 border border-slate-200 max-h-[92vh] overflow-y-auto">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-base">Xem Trước Bản In & Xuất Báo Cáo PDF</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>In / Lưu PDF Ngay</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPdfModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Formal Printable Document Content */}
            <div className="border border-slate-300 p-8 rounded-2xl bg-white space-y-6 text-slate-900">
              {/* Official Header */}
              <div className="grid grid-cols-2 text-center text-xs pb-4 border-b border-slate-300">
                <div>
                  <p className="font-bold uppercase tracking-wider">HỘI ĐỒNG KHẢO THÍ & ĐÁNH GIÁ</p>
                  <p className="font-black text-indigo-900 uppercase">CỔNG THI TRỰC TUYẾN TDC3HTP</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">Mã số: TDC3HTP-{selectedExam.code}</p>
                </div>
                <div>
                  <p className="font-bold uppercase tracking-wider">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                  <p className="font-bold underline text-xs">Độc lập - Tự do - Hạnh phúc</p>
                  <p className="text-[10px] text-slate-500 mt-1 italic">
                    Hà Nội, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                  </p>
                </div>
              </div>

              {/* Document Title */}
              <div className="text-center space-y-1">
                <h2 className="text-xl font-black uppercase text-slate-900 tracking-wide">
                  BÁO CÁO KẾT QUẢ KHẢO THÍ VÀ XẾP HẠNG HỘI THI TRỰC TUYẾN
                </h2>
                <p className="text-xs font-semibold text-indigo-700">
                  Kỳ thi: {selectedExam.title} (Mã đề: {selectedExam.code})
                </p>
                <p className="text-[11px] text-slate-500">
                  Năm học: {currentAcademicYear.name} • Khối: {selectedExam.grade} • Môn thi: {selectedExam.subject}
                </p>
              </div>

              {/* Statistical Summary Box */}
              <div className="grid grid-cols-4 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-300 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Tổng thí sinh</span>
                  <strong className="text-sm font-black text-slate-900">{totalSubmissions} HS</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Điểm trung bình</span>
                  <strong className="text-sm font-black text-indigo-700">{averageScore} đ</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Tỷ lệ Đạt chuẩn</span>
                  <strong className="text-sm font-black text-emerald-700">{passRate}%</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Tình trạng khóa sổ</span>
                  <strong className={selectedExam.isResultsLocked ? 'text-rose-700' : 'text-emerald-700'}>
                    {selectedExam.isResultsLocked ? 'Đã khóa niêm phong' : 'Đang mở'}
                  </strong>
                </div>
              </div>

              {/* Table of Top Candidates */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider mb-2 text-slate-700">
                  I. Danh Sách Thí Sinh Đạt Thành Tích Xuất Sắc Nhất
                </h4>
                <table className="w-full text-left text-xs border border-slate-300">
                  <thead className="bg-slate-100 font-bold border-b border-slate-300">
                    <tr>
                      <th className="py-2 px-3 border-r border-slate-300">STT</th>
                      <th className="py-2 px-3 border-r border-slate-300">Mã HS</th>
                      <th className="py-2 px-3 border-r border-slate-300">Họ và tên thí sinh</th>
                      <th className="py-2 px-3 border-r border-slate-300">Lớp</th>
                      <th className="py-2 px-3 border-r border-slate-300">Điểm số</th>
                      <th className="py-2 px-3">Xếp loại</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {rankedAttempts.slice(0, 8).map((cand, idx) => (
                      <tr key={cand.id}>
                        <td className="py-1.5 px-3 border-r border-slate-300 text-center font-bold">{idx + 1}</td>
                        <td className="py-1.5 px-3 border-r border-slate-300 font-mono">{cand.studentCode}</td>
                        <td className="py-1.5 px-3 border-r border-slate-300 font-bold">{cand.studentName}</td>
                        <td className="py-1.5 px-3 border-r border-slate-300">{cand.className}</td>
                        <td className="py-1.5 px-3 border-r border-slate-300 font-bold text-indigo-700">
                          {cand.score.toFixed(1)}
                        </td>
                        <td className="py-1.5 px-3 font-semibold">{getRankTitle(cand.score)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 text-center text-xs pt-8">
                <div>
                  <p className="font-bold uppercase">TRƯỞNG BAN THƯ KÝ KHẢO THÍ</p>
                  <p className="text-[10px] italic text-slate-500 mb-14">(Ký, ghi rõ họ tên)</p>
                  <p className="font-bold text-slate-800">Trần Thị Mai</p>
                </div>
                <div>
                  <p className="font-bold uppercase">CHỦ TỊCH HỘI ĐỒNG THI</p>
                  <p className="text-[10px] italic text-slate-500 mb-14">(Ký tên và đóng dấu điện tử)</p>
                  <p className="font-black text-slate-900">TS. Nguyễn Văn Quản Trị</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
