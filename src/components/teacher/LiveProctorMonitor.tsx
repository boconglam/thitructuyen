import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ExamAttempt, ViolationEvent } from '../../types';
import {
  ShieldAlert,
  Camera,
  AlertTriangle,
  UserX,
  Send,
  Eye,
  CheckCircle2,
  Clock,
  Radio,
  Maximize2,
  Search,
  Filter,
} from 'lucide-react';

export const LiveProctorMonitor: React.FC = () => {
  const { attempts, exams, disqualifyStudent, warnStudent } = useApp();
  const [selectedAttempt, setSelectedAttempt] = useState<ExamAttempt | null>(null);
  const [warningMessage, setWarningMessage] = useState('');
  const [isWarnModalOpen, setIsWarnModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter attempts
  const filteredAttempts = attempts.filter((a) => {
    const matchesSearch =
      a.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.className.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSendWarning = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttempt || !warningMessage) return;
    warnStudent(selectedAttempt.id, warningMessage);
    setIsWarnModalOpen(false);
    setWarningMessage('');
    alert(`Đã truyền tín hiệu cảnh báo đến màn hình thí sinh ${selectedAttempt.studentName}!`);
  };

  const handleDisqualify = (attempt: ExamAttempt) => {
    const reason = prompt(
      `Xác nhận đình chỉ thi thí sinh ${attempt.studentName} (${attempt.studentCode})? Nhập lý do:`
    );
    if (reason) {
      disqualifyStudent(attempt.id, reason);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
              Phòng Giám sát Trực tiếp (Live Proctoring Center)
            </span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">
            Giám thị & Phát hiện Gian lận Thời gian thực
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Theo dõi luồng webcam, phát hiện chuyển đổi ứng dụng, thoát toàn màn hình và xử lý vi phạm tức thời
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700 text-xs">
          <div>
            <span className="text-slate-400 block">Thí sinh đang thi:</span>
            <span className="text-emerald-400 font-bold text-sm">
              {attempts.filter((a) => a.status === 'in_progress').length} đang kết nối
            </span>
          </div>
          <div className="w-px h-8 bg-slate-700"></div>
          <div>
            <span className="text-slate-400 block">Cảnh báo vi phạm:</span>
            <span className="text-rose-400 font-bold text-sm">
              {attempts.reduce((acc, curr) => acc + curr.violations.length, 0)} sự kiện
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên thí sinh, mã số sinh viên, lớp..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        >
          <option value="all">Tất cả trạng thái thi</option>
          <option value="in_progress">Đang làm bài (In Progress)</option>
          <option value="submitted">Đã nộp bài (Submitted)</option>
          <option value="disqualified">Đã đình chỉ thi (Disqualified)</option>
        </select>
      </div>

      {/* Live Candidates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAttempts.map((attempt) => {
          const violationCount = attempt.violations.length;
          const isDanger = attempt.status === 'disqualified' || violationCount >= 3;
          const isWarning = violationCount > 0 && !isDanger;

          return (
            <div
              key={attempt.id}
              className={`bg-white rounded-xl border overflow-hidden shadow-xs transition-all flex flex-col justify-between ${
                isDanger
                  ? 'border-rose-400 ring-2 ring-rose-500/20'
                  : isWarning
                  ? 'border-amber-400 ring-2 ring-amber-500/20'
                  : 'border-slate-200 hover:border-indigo-200'
              }`}
            >
              <div>
                {/* Simulated Webcam Feeds Container */}
                <div className="relative aspect-video bg-slate-900 flex items-center justify-center overflow-hidden">
                  {/* Subtle video scanline & watermark overlay */}
                  <div className="absolute inset-0 bg-linear-to-b from-transparent via-emerald-500/5 to-transparent pointer-events-none"></div>

                  <div className="text-center p-4">
                    <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center mx-auto mb-2 text-slate-300 font-bold text-lg">
                      {attempt.studentName.slice(-1)}
                    </div>
                    <div className="text-xs text-emerald-400 font-mono flex items-center justify-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                      LIVE FEED • 1080p
                    </div>
                  </div>

                  {/* Top overlay badge */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[11px] font-mono text-white">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                    REC • {attempt.className}
                  </div>

                  <div className="absolute top-2.5 right-2.5">
                    {attempt.status === 'disqualified' ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-600 text-white shadow-xs">
                        ĐÃ ĐÌNH CHỈ
                      </span>
                    ) : violationCount > 0 ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500 text-white flex items-center gap-1 shadow-xs">
                        <AlertTriangle className="w-3 h-3" />
                        {violationCount} vi phạm
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-600 text-white flex items-center gap-1 shadow-xs">
                        <CheckCircle2 className="w-3 h-3" />
                        An toàn
                      </span>
                    )}
                  </div>

                  {/* Watermark bar on video */}
                  <div className="absolute bottom-1 inset-x-2 text-[10px] text-slate-400 font-mono truncate bg-black/40 px-1.5 py-0.5 rounded">
                    ID: {attempt.studentCode} • IP: 113.161.42.x
                  </div>
                </div>

                {/* Candidate Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{attempt.studentName}</h4>
                      <p className="text-xs font-mono text-indigo-600 font-medium">
                        {attempt.studentCode} • Lớp {attempt.className}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">{attempt.startTime.slice(11, 16)}</span>
                  </div>

                  <div className="text-xs text-slate-600 line-clamp-1 mb-3 font-medium">
                    Bài thi: {attempt.examTitle}
                  </div>

                  {/* Violation log snippet */}
                  {attempt.violations.length > 0 ? (
                    <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-200 text-xs text-rose-900 space-y-1 mb-2">
                      <div className="font-bold flex items-center gap-1 text-rose-700">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Nhật ký vi phạm gần nhất:
                      </div>
                      <div className="text-[11px] line-clamp-2">
                        {attempt.violations[attempt.violations.length - 1].detail} (Lúc{' '}
                        {attempt.violations[attempt.violations.length - 1].timestamp})
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-500 mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      Không ghi nhận hành vi bất thường.
                    </div>
                  )}

                  {attempt.proctorNotes && (
                    <div className="text-[11px] text-slate-500 italic mb-2">
                      Ghi chú: {attempt.proctorNotes}
                    </div>
                  )}
                </div>
              </div>

              {/* Proctor Action Buttons */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedAttempt(attempt);
                    setIsWarnModalOpen(true);
                  }}
                  disabled={attempt.status === 'disqualified'}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                >
                  <Send className="w-3 h-3" />
                  Cảnh báo
                </button>

                <button
                  onClick={() => handleDisqualify(attempt)}
                  disabled={attempt.status === 'disqualified'}
                  className="flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                  title="Đình chỉ thi ngay lập tức"
                >
                  <UserX className="w-3 h-3" />
                  Đình chỉ
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Warning Message Modal */}
      {isWarnModalOpen && selectedAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Gửi thông điệp cảnh báo tới thí sinh
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Thí sinh: <strong className="text-slate-800">{selectedAttempt.studentName}</strong> ({selectedAttempt.studentCode})
            </p>

            <form onSubmit={handleSendWarning} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Chọn mẫu cảnh báo nhanh:
                </label>
                <div className="space-y-1.5 mb-3">
                  {[
                    'Yêu cầu thí sinh giữ khuôn mặt trong khung hình camera!',
                    'Hệ thống phát hiện bạn vừa chuyển tab hoặc thu nhỏ màn hình!',
                    'Nghiêm cấm hành vi mở tài liệu bên ngoài hoặc dùng phím tắt!',
                    'Cảnh báo lần cuối: Tái phạm sẽ bị đình chỉ thi và 0 điểm!',
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setWarningMessage(preset)}
                      className="w-full text-left p-2 rounded-lg text-xs bg-slate-50 hover:bg-indigo-50 border border-slate-200 text-slate-700 transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Hoặc soạn nội dung cảnh báo:
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Nhập thông báo cảnh báo xuất hiện trên màn hình thí sinh..."
                  value={warningMessage}
                  onChange={(e) => setWarningMessage(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsWarnModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs cursor-pointer"
                >
                  Phát cảnh báo ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
