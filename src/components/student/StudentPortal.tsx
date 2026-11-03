import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  Clock,
  Award,
  BookOpen,
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
  Search,
  ChevronRight,
  Shield,
  TrendingUp,
  GraduationCap,
} from 'lucide-react';

export const StudentPortal: React.FC = () => {
  const { exams, currentUser, students, attempts, startExam, studyTopics } = useApp();
  const [activeTab, setActiveTab] = useState<'exams' | 'history' | 'topics'>('exams');
  const [searchTerm, setSearchTerm] = useState('');

  // Find student record for currently logged in student
  const student = students.find((s) => s.id === currentUser.studentId) || students[0];

  // My attempts
  const myAttempts = attempts.filter((a) => a.studentId === student.id);

  // Available exams
  const availableExams = exams.filter(
    (e) => e.status === 'ongoing' || e.status === 'scheduled'
  );

  return (
    <div className="space-y-6">
      {/* Student Welcome Banner (Matching image_d7412a8b - Quản lý cá nhân) */}
      <div className="bg-linear-to-r from-indigo-700 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-white/10 to-transparent pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-black text-2xl text-white shadow-inner">
              {student.fullName.slice(-1)}
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold mb-1 border border-white/10">
                <GraduationCap className="w-3.5 h-3.5" />
                Lớp {student.className} • Niên khóa 2025 - 2026
              </div>
              <h2 className="text-2xl font-black tracking-tight">{student.fullName}</h2>
              <p className="text-xs text-indigo-200 font-mono mt-0.5">Mã số: {student.studentCode}</p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 text-center">
              <span className="text-[11px] text-indigo-200 font-medium block">Số bài thi</span>
              <span className="text-xl font-black text-white">{myAttempts.length}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 text-center">
              <span className="text-[11px] text-indigo-200 font-medium block">Tổng điểm</span>
              <span className="text-xl font-black text-amber-300">{student.totalPoints} đ</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 text-center">
              <span className="text-[11px] text-indigo-200 font-medium block">Thứ hạng lớp</span>
              <span className="text-xl font-black text-emerald-300">#{student.rank}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('exams')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'exams'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          Kỳ thi đang mở ({availableExams.length})
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          Kết quả & Lịch sử làm bài ({myAttempts.length})
        </button>

        <button
          onClick={() => setActiveTab('topics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'topics'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Chuyên đề ôn tập ({studyTopics.length})
        </button>
      </div>

      {/* TAB 1: AVAILABLE EXAMS */}
      {activeTab === 'exams' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {availableExams.map((exam) => {
            const hasAttempted = myAttempts.some(
              (a) => a.examId === exam.id && a.status !== 'in_progress'
            );

            return (
              <div
                key={exam.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {exam.subject} - Khối {exam.grade}
                    </span>
                    <span className="text-xs font-mono text-slate-400">{exam.code}</span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">{exam.title}</h3>
                  <p className="text-xs text-slate-500 mb-4 line-clamp-2">{exam.description}</p>

                  <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-50 text-xs text-slate-600 mb-4 border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Thời gian:</span>
                      <strong className="text-slate-800">{exam.durationMinutes} phút</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Số câu:</span>
                      <strong className="text-indigo-600">{exam.questionIds.length} câu</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Thang điểm:</span>
                      <strong className="text-slate-800">{exam.totalPoints} đ</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                    <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Yêu cầu Camera & Giám sát toàn màn hình</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Hạn nộp: {exam.endTime.slice(0, 10)}
                  </span>

                  {hasAttempted ? (
                    <span className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-600">
                      ✓ Đã hoàn thành
                    </span>
                  ) : (
                    <button
                      onClick={() => startExam(exam.id)}
                      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                    >
                      <PlayCircle className="w-4 h-4" />
                      Vào phòng thi bảo mật
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: MY EXAM RESULTS & SUBMISSIONS */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {myAttempts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
              <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-600">Bạn chưa có bài thi nào đã nộp.</p>
              <p className="text-xs mt-1">Hãy tham gia các bài kiểm tra đang mở để tích lũy điểm thi đua!</p>
            </div>
          ) : (
            myAttempts.map((atm) => (
              <div
                key={atm.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-indigo-200 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-slate-500">{atm.startTime.slice(0, 10)}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        atm.status === 'disqualified'
                          ? 'bg-rose-100 text-rose-800'
                          : atm.passed
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {atm.status === 'disqualified' ? 'Đình chỉ' : atm.passed ? 'ĐẠT' : 'CHƯA ĐẠT'}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900">{atm.examTitle}</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Thời gian nộp: {atm.submitTime || 'Chưa ghi nhận'} • Vi phạm an ninh:{' '}
                    <strong className={atm.violations.length > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                      {atm.violations.length} sự kiện
                    </strong>
                  </p>
                </div>

                <div className="text-right sm:self-center">
                  <div className="text-3xl font-black text-indigo-600">
                    {atm.score} <span className="text-sm font-normal text-slate-400">/ {atm.totalScore}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Điểm số chính thức</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: STUDY TOPICS (Chuyên đề học tập) */}
      {activeTab === 'topics' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {studyTopics.map((topic) => (
            <div
              key={topic.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-indigo-200 transition-all flex flex-col justify-between"
            >
              <div>
                <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 mb-3 inline-block">
                  {topic.subject} - Khối {topic.grade}
                </span>

                <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">{topic.title}</h3>
                <p className="text-xs text-slate-500 mb-4 line-clamp-3">{topic.description}</p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {topic.tags.map((tag, tIdx) => (
                    <span key={tIdx} className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-600">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Tác giả: {topic.author}</span>
                <span className="font-semibold text-indigo-600 cursor-pointer hover:underline">
                  Xem tài liệu →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
