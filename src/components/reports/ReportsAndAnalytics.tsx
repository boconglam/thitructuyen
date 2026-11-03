import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
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
} from 'lucide-react';
import { exportToExcel } from '../../utils/excelHelper';

export const ReportsAndAnalytics: React.FC = () => {
  const { exams, attempts, questions, classes, classRankings } = useApp();
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');
  const [reportTab, setReportTab] = useState<'overview' | 'classes' | 'items'>('overview');

  const selectedExam = exams.find((e) => e.id === selectedExamId) || exams[0];
  const examAttempts = attempts.filter((a) => a.examId === selectedExam?.id);

  // Stats calculation
  const totalSubmissions = examAttempts.length;
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

  // Score distribution bins
  const bins = [
    { label: '0 - 2.0', count: examAttempts.filter((a) => a.score < 2.0).length },
    { label: '2.0 - 4.9', count: examAttempts.filter((a) => a.score >= 2.0 && a.score < 5.0).length },
    { label: '5.0 - 6.9', count: examAttempts.filter((a) => a.score >= 5.0 && a.score < 7.0).length },
    { label: '7.0 - 8.4', count: examAttempts.filter((a) => a.score >= 7.0 && a.score < 8.5).length },
    { label: '8.5 - 10', count: examAttempts.filter((a) => a.score >= 8.5).length },
  ];

  const maxBinCount = Math.max(...bins.map((b) => b.count), 1);

  // Item analysis for questions
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

  const handleExportReport = () => {
    const exportData = examAttempts.map((a, idx) => ({
      'STT': idx + 1,
      'Mã học sinh': a.studentCode,
      'Họ và tên': a.studentName,
      'Lớp': a.className,
      'Điểm số': a.score,
      'Thang điểm': a.totalScore,
      'Kết quả': a.passed ? 'ĐẠT' : 'CHƯA ĐẠT',
      'Thời gian nộp': a.submitTime || a.startTime,
      'Số vi phạm an ninh': a.violations.length,
      'Trạng thái': a.status,
    }));

    exportToExcel(exportData, `Bao_Cao_Ket_Qua_Thi_${selectedExam?.code || 'EXAM'}`);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            Hệ thống Báo cáo Kết quả & Phân tích Thống kê
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Phân tích phổ điểm tự động, độ khó câu hỏi và bảng xếp hạng thi đua phong trào giữa các lớp
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="text-sm bg-white border border-slate-200 rounded-lg px-3.5 py-2 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.code} - {ex.title}
              </option>
            ))}
          </select>

          <button
            onClick={handleExportReport}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Xuất Excel
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setReportTab('overview')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            reportTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Phổ điểm & Thống kê chung
        </button>
        <button
          onClick={() => setReportTab('classes')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
            reportTab === 'classes'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Trophy className="w-4 h-4" />
          Quản lý Thi đua Tập thể Lớp
        </button>
        <button
          onClick={() => setReportTab('items')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            reportTab === 'items'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Phân tích độ khó Câu hỏi
        </button>
      </div>

      {/* TAB 1: OVERVIEW METRICS & DISTRIBUTION CHART */}
      {reportTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Số bài đã nộp
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
                      className="w-full max-w-16 rounded-t-xl bg-linear-to-t from-indigo-600 to-indigo-400 group-hover:from-indigo-700 group-hover:to-indigo-500 transition-all shadow-xs relative"
                    ></div>
                    <span className="text-xs font-semibold text-slate-600 mt-2">{bin.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submissions Detail Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Danh sách Điểm chi tiết</h3>
              <span className="text-xs text-slate-400">{examAttempts.length} bản ghi</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 uppercase font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Thí sinh</th>
                    <th className="py-3 px-4">Lớp</th>
                    <th className="py-3 px-4">Điểm số</th>
                    <th className="py-3 px-4">Kết quả</th>
                    <th className="py-3 px-4">Vi phạm bảo mật</th>
                    <th className="py-3 px-4">Thời gian nộp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {examAttempts.map((att) => (
                    <tr key={att.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {att.studentName}
                        <span className="block text-[11px] font-mono text-slate-400 font-normal">
                          {att.studentCode}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium">{att.className}</td>
                      <td className="py-3 px-4 font-black text-indigo-600 text-sm">{att.score} đ</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                            att.passed ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {att.passed ? 'ĐẠT' : 'CHƯA ĐẠT'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {att.violations.length > 0 ? (
                          <span className="font-bold text-rose-600">{att.violations.length} cảnh báo</span>
                        ) : (
                          <span className="text-emerald-600">0 (Hợp lệ)</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">{att.submitTime || att.startTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CLASS COMPETITION & LEADERBOARDS (Quản lý thi đua - image_d7412a8b) */}
      {reportTab === 'classes' && (
        <div className="space-y-6">
          <div className="bg-linear-to-r from-amber-500 via-amber-600 to-amber-700 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-5 h-5 text-amber-200" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-200">
                  Bảng xếp hạng Thi đua Tập thể
                </span>
              </div>
              <h3 className="text-2xl font-black">Xếp hạng Thi đua Học tập Toàn trường</h3>
              <p className="text-xs text-amber-100 mt-1">
                Đánh giá tổng hợp dựa trên: Điểm thi trung bình, Tỷ lệ tham gia làm bài và Kỷ luật phòng thi
              </p>
            </div>

            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 text-xs font-bold">
              <span>Đơn vị dẫn đầu:</span>
              <span className="text-white font-extrabold text-sm">Lớp 12A1 🏆</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {classRankings.map((cr) => (
              <div
                key={cr.classId}
                className={`bg-white rounded-2xl border p-5 shadow-xs transition-all flex flex-col justify-between ${
                  cr.rank === 1
                    ? 'border-amber-400 ring-2 ring-amber-400/30 bg-linear-to-b from-amber-50/40 to-white'
                    : cr.rank === 2
                    ? 'border-slate-300'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${
                        cr.rank === 1
                          ? 'bg-amber-500 text-white shadow-md'
                          : cr.rank === 2
                          ? 'bg-slate-300 text-slate-800'
                          : cr.rank === 3
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      #{cr.rank}
                    </span>

                    {cr.badge === 'trophy' && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                        <Trophy className="w-3.5 h-3.5 text-amber-600" /> Cúp Nhất Tuần
                      </span>
                    )}
                    {cr.badge === 'flag' && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
                        <Flag className="w-3.5 h-3.5 text-rose-600" /> Cờ Thi Đua
                      </span>
                    )}
                    {cr.badge === 'star' && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-indigo-600" /> Ngôi sao Tiến bộ
                      </span>
                    )}
                  </div>

                  <h4 className="text-2xl font-black text-slate-900 mb-2">Lớp {cr.className}</h4>
                  <div className="text-xs text-slate-500 mb-4">Sĩ số: {cr.studentCount} học sinh</div>

                  <div className="space-y-2 p-3 rounded-xl bg-slate-50 text-xs text-slate-600 border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Điểm TB thi:</span>
                      <strong className="text-slate-900 font-bold">{cr.averageScore} đ</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Tỷ lệ tham gia:</span>
                      <strong className="text-emerald-600 font-bold">{cr.participationRate}%</strong>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                      <span className="text-slate-500 font-semibold">Điểm thi đua tổng:</span>
                      <strong className="text-amber-600 font-black text-sm">{cr.totalCompetitionPoints} đ</strong>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: QUESTION ITEM ANALYSIS (Độ khó câu hỏi) */}
      {reportTab === 'items' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Phân tích Thống kê Câu hỏi & Độ phân hóa</h3>
          <p className="text-xs text-slate-500">
            Xác định các câu hỏi có tỷ lệ học sinh làm sai cao nhất để giáo viên kịp thời bổ sung củng cố kiến thức
          </p>

          <div className="space-y-3 pt-2">
            {questionAnalytics.map((q, idx) => (
              <div key={q.id} className="p-4 rounded-xl border border-slate-200 space-y-2 hover:bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-600">[{q.code}]</span>
                    <span className="text-xs font-semibold text-slate-700">Câu {idx + 1}</span>
                    <span className="text-xs text-slate-400">• {q.topic}</span>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      q.correctPercentage >= 70
                        ? 'bg-emerald-50 text-emerald-700'
                        : q.correctPercentage >= 40
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    Tỷ lệ đúng: {q.correctPercentage}%
                  </span>
                </div>

                <div className="text-sm font-semibold text-slate-800">{q.content}</div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${q.correctPercentage}%` }}
                    className={`h-full rounded-full ${
                      q.correctPercentage >= 70
                        ? 'bg-emerald-500'
                        : q.correctPercentage >= 40
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
