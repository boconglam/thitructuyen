import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Exam, ExamStatus, ExamSecuritySettings } from '../../types';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Shield,
  Clock,
  Calendar,
  CheckCircle2,
  Trash2,
  Edit2,
  Camera,
  Maximize2,
  Copy,
  AlertTriangle,
  PlayCircle,
  Eye,
  ScrollText,
  BookOpenCheck,
  ShieldCheck,
  ChevronRight,
  X,
  Lock,
  Unlock,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

export const ExamManagement: React.FC = () => {
  const { exams, questions, classes, addExam, updateExam, deleteExam, toggleExamStatus, currentAcademicYear } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    title: '',
    description: '',
    subject: 'Toán học',
    grade: 12,
    durationMinutes: 45,
    totalPoints: 10,
    passingScore: 5.0,
    startTime: '2026-11-03 08:00',
    endTime: '2026-11-06 20:00',
    status: 'ongoing' as ExamStatus,
    questionIds: [] as string[],
    assignedClassIds: [] as string[],
    securitySettings: {
      requireWebcam: true,
      requireFullscreen: true,
      maxTabViolations: 3,
      blockCopyPaste: true,
      watermarkEnabled: true,
      shuffleQuestions: true,
      shuffleOptions: true,
      autoSubmitOnViolationLimit: true,
      lockBrowserBack: true,
      allowReviewAfterSubmit: true,
    } as ExamSecuritySettings,
  });

  // State for editing exam rules / điều lệ cuộc thi
  const [editingRulesExam, setEditingRulesExam] = useState<Exam | null>(null);
  const [rulesFormData, setRulesFormData] = useState({
    description: '',
    passingScore: 5.0,
    durationMinutes: 45,
    securitySettings: {
      requireWebcam: true,
      requireFullscreen: true,
      maxTabViolations: 3,
      blockCopyPaste: true,
      watermarkEnabled: true,
      shuffleQuestions: true,
      shuffleOptions: true,
      autoSubmitOnViolationLimit: true,
      lockBrowserBack: true,
      allowReviewAfterSubmit: true,
    } as ExamSecuritySettings,
  });

  const rulePresets = [
    {
      name: 'Quy chế Thi Học kỳ Nghiêm ngặt (Chống gian lận đa tầng)',
      desc: '1. Thí sinh phải mở camera trong suốt quá trình làm bài và khuôn mặt luôn nằm trong khung hình.\n2. Khóa toàn màn hình, không mở ứng dụng ngoài hoặc chuyển tab.\n3. Quá 3 lần vi phạm chuyển tab, hệ thống tự động đình chỉ thi và chấm 0 điểm.\n4. Nghiêm cấm mọi hành vi chụp màn hình hoặc sao chép đề bài.',
      settings: {
        requireWebcam: true,
        requireFullscreen: true,
        maxTabViolations: 3,
        blockCopyPaste: true,
        watermarkEnabled: true,
        shuffleQuestions: true,
        shuffleOptions: true,
        autoSubmitOnViolationLimit: true,
        lockBrowserBack: true,
        allowReviewAfterSubmit: false,
      },
    },
    {
      name: 'Quy chế Kiểm tra Thường xuyên / 1 Tiết (Tiêu chuẩn)',
      desc: '1. Thí sinh chuẩn bị kết nối mạng ổn định trước khi bắt đầu bài kiểm tra.\n2. Cảnh báo an ninh khi rời màn hình quá 3 lần.\n3. Hệ thống tự động thu bài khi hết giờ quy định.',
      settings: {
        requireWebcam: true,
        requireFullscreen: true,
        maxTabViolations: 3,
        blockCopyPaste: true,
        watermarkEnabled: true,
        shuffleQuestions: true,
        shuffleOptions: true,
        autoSubmitOnViolationLimit: true,
        lockBrowserBack: true,
        allowReviewAfterSubmit: true,
      },
    },
    {
      name: 'Quy chế Thi Thử & Tự luyện (Mở)',
      desc: '1. Thí sinh chủ động làm bài rèn luyện kỹ năng và kiến thức.\n2. Cho phép xem lại lời giải chi tiết và phân tích câu sai ngay sau khi nộp bài.\n3. Ngưỡng cảnh báo nới lỏng nhằm phục vụ mục đích học tập.',
      settings: {
        requireWebcam: false,
        requireFullscreen: false,
        maxTabViolations: 5,
        blockCopyPaste: false,
        watermarkEnabled: false,
        shuffleQuestions: true,
        shuffleOptions: true,
        autoSubmitOnViolationLimit: false,
        lockBrowserBack: true,
        allowReviewAfterSubmit: true,
      },
    },
  ];

  const handleOpenEditRules = (exam: Exam) => {
    setEditingRulesExam(exam);
    setRulesFormData({
      description: exam.description,
      passingScore: exam.passingScore,
      durationMinutes: exam.durationMinutes,
      securitySettings: { ...exam.securitySettings },
    });
  };

  const handleApplyPreset = (preset: (typeof rulePresets)[0]) => {
    setRulesFormData((prev) => ({
      ...prev,
      description: preset.desc,
      securitySettings: {
        ...prev.securitySettings,
        ...preset.settings,
      },
    }));
  };

  const handleSaveRules = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRulesExam) return;

    updateExam(editingRulesExam.id, {
      description: rulesFormData.description,
      passingScore: Number(rulesFormData.passingScore),
      durationMinutes: Number(rulesFormData.durationMinutes),
      securitySettings: rulesFormData.securitySettings,
    });

    setEditingRulesExam(null);
    alert(`Đã cập nhật thành công điều lệ & quy chế thi cho "${editingRulesExam.title}"!`);
  };

  const subjects = ['Toán học', 'Vật lý', 'Hóa học', 'Sinh học', 'Ngữ văn', 'Tiếng Anh', 'Tin học'];

  const filteredExams = exams.filter((e) => {
    const matchesSearch =
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenAdd = () => {
    setEditingExam(null);
    const nextNum = exams.length + 1;
    // select first 3 questions matching subject
    const defaultQIds = questions.slice(0, 3).map((q) => q.id);
    const defaultClassIds = classes.slice(0, 2).map((c) => c.id);

    setFormData({
      code: `EXAM-${String(nextNum).padStart(3, '0')}`,
      title: '',
      description: 'Đề thi trắc nghiệm áp dụng công nghệ giám sát chống gian lận đa tầng.',
      subject: 'Toán học',
      grade: 12,
      durationMinutes: 45,
      totalPoints: 10,
      passingScore: 5.0,
      startTime: '2026-11-03 08:00',
      endTime: '2026-11-06 20:00',
      status: 'ongoing',
      questionIds: defaultQIds,
      assignedClassIds: defaultClassIds,
      securitySettings: {
        requireWebcam: true,
        requireFullscreen: true,
        maxTabViolations: 3,
        blockCopyPaste: true,
        watermarkEnabled: true,
        shuffleQuestions: true,
        shuffleOptions: true,
        autoSubmitOnViolationLimit: true,
        lockBrowserBack: true,
        allowReviewAfterSubmit: true,
      },
    });
    setIsModalOpen(true);
  };

  const [modalError, setModalError] = useState('');

  const handleGenerateExamCode = () => {
    const subMap: Record<string, string> = {
      'Toán học': 'TOAN',
      'Tiếng Anh': 'ANH',
      'Tin học': 'TIN',
      'Vật lý': 'LY',
      'Hóa học': 'HOA',
      'Sinh học': 'SINH',
    };
    const prefix = subMap[formData.subject] || 'DE';
    const num = exams.length + 1;
    const generated = `${prefix}${formData.grade}-${String(num).padStart(3, '0')}`;
    setFormData((prev) => ({ ...prev, code: generated }));
  };

  const handleOpenEdit = (exam: Exam) => {
    setEditingExam(exam);
    setModalError('');
    setFormData({
      code: exam.code,
      title: exam.title,
      description: exam.description,
      subject: exam.subject,
      grade: exam.grade,
      durationMinutes: exam.durationMinutes,
      totalPoints: exam.totalPoints,
      passingScore: exam.passingScore,
      startTime: exam.startTime,
      endTime: exam.endTime,
      status: exam.status,
      questionIds: exam.questionIds,
      assignedClassIds: exam.assignedClassIds,
      securitySettings: exam.securitySettings,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    if (!formData.title.trim() || !formData.code.trim()) {
      setModalError('Vui lòng điền đủ Mã đề thi và Tiêu đề kỳ thi.');
      return;
    }

    if (formData.questionIds.length === 0) {
      setModalError('Vui lòng chọn ít nhất 1 câu hỏi từ ngân hàng câu hỏi.');
      return;
    }

    if (editingExam) {
      updateExam(editingExam.id, {
        ...formData,
        code: formData.code.trim().toUpperCase(),
        title: formData.title.trim(),
      });
    } else {
      addExam({
        ...formData,
        code: formData.code.trim().toUpperCase(),
        title: formData.title.trim(),
        academicYearId: currentAcademicYear.id,
      });
    }

    setIsModalOpen(false);
  };

  const getStatusBadge = (st: ExamStatus) => {
    switch (st) {
      case 'ongoing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Đang diễn ra
          </span>
        );
      case 'scheduled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            Sắp diễn ra
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            Đã kết thúc
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500">
            Bản nháp
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Quản lý Cuộc thi & Đề thi Trực tuyến
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Thiết lập đề thi từ ngân hàng câu hỏi, kích hoạt giám sát màn hình, chống gian lận và phân bổ lớp thi
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tạo kỳ thi mới
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tiêu đề kỳ thi, mã đề, môn học..."
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
          <option value="all">Tất cả trạng thái</option>
          <option value="ongoing">Đang diễn ra</option>
          <option value="scheduled">Sắp diễn ra</option>
          <option value="completed">Đã kết thúc</option>
          <option value="draft">Bản nháp</option>
        </select>
      </div>

      {/* Exam Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredExams.map((exam) => (
          <div
            key={exam.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-indigo-200 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    {exam.code}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    {exam.subject} - Khối {exam.grade}
                  </span>
                </div>
                {getStatusBadge(exam.status)}
              </div>

              <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">{exam.title}</h3>
              <p className="text-xs text-slate-500 line-clamp-2 mb-4">{exam.description}</p>

              {/* Meta metrics */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-slate-50 text-xs text-slate-600 mb-4 border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[11px]">Thời gian:</span>
                  <strong className="text-slate-800">{exam.durationMinutes} phút</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Số câu hỏi:</span>
                  <strong className="text-indigo-600">{exam.questionIds.length} câu</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Thang điểm:</span>
                  <strong className="text-slate-800">{exam.totalPoints} đ</strong>
                </div>
              </div>

              {/* Security features pill badges */}
              <div className="mb-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-indigo-600" />
                  Cơ chế bảo mật chống gian lận:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {exam.securitySettings.requireWebcam && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <Camera className="w-3 h-3" /> Giám sát Webcam
                    </span>
                  )}
                  {exam.securitySettings.requireFullscreen && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                      <Maximize2 className="w-3 h-3" /> Toàn màn hình
                    </span>
                  )}
                  {exam.securitySettings.blockCopyPaste && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                      <Copy className="w-3 h-3" /> Chặn Copy/Paste
                    </span>
                  )}
                  {exam.securitySettings.watermarkEnabled && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                      Watermark định danh
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                    Tối đa {exam.securitySettings.maxTabViolations} lần chuyển tab
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleExamStatus(exam.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                    exam.status === 'ongoing'
                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                  }`}
                  title={exam.status === 'ongoing' ? 'Đóng kỳ thi (Tạm dừng không cho thi)' : 'Mở kỳ thi trực tuyến ngay'}
                >
                  {exam.status === 'ongoing' ? (
                    <>
                      <Lock className="w-3.5 h-3.5 text-rose-600" />
                      <span>Đóng kỳ thi</span>
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Mở kỳ thi</span>
                    </>
                  )}
                </button>

                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  Tạo bởi: <strong className="text-slate-600">{exam.createdBy}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEditRules(exam)}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                  title="Chỉnh sửa điều lệ & thể lệ cuộc thi"
                >
                  <ScrollText className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Điều lệ</span>
                </button>
                <button
                  onClick={() => handleOpenEdit(exam)}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                  title="Chỉnh sửa kỳ thi"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Bạn có chắc muốn xóa đề thi ${exam.title}?`)) {
                      deleteExam(exam.id);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Xóa đề thi"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add/Edit Exam */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              {editingExam ? `Chỉnh sửa đề thi ${editingExam.code}` : 'Thiết lập kỳ thi & Đề thi trực tuyến mới'}
            </h3>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Mã đề thi *
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateExamCode}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 cursor-pointer"
                      title="Tạo mã đề thi tự động theo môn và khối"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Tạo mã</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="ví dụ: TOAN12-GK1"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Môn học *
                  </label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    {subjects.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Khối lớp *
                  </label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value={12}>Khối 12</option>
                    <option value={11}>Khối 11</option>
                    <option value={10}>Khối 10</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Tiêu đề kỳ thi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ví dụ: Khảo sát chất lượng Toán 12 - Học kỳ I..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Mô tả / Thể lệ thi
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                ></textarea>
              </div>

              {/* Time Configuration Section */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Cài đặt Thời gian & Trạng thái thi
                </span>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Thời lượng làm bài (phút) *
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={180}
                      value={formData.durationMinutes}
                      onChange={(e) => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Thang điểm tối đa
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={formData.totalPoints}
                      onChange={(e) => setFormData({ ...formData, totalPoints: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Mở / Đóng kỳ thi *
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as ExamStatus })}
                      className={`w-full px-3 py-2 text-sm font-bold border rounded-lg focus:outline-none ${
                        formData.status === 'ongoing'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      <option value="ongoing">🟢 Đang mở thi (Cho phép thi)</option>
                      <option value="scheduled">🟡 Sắp diễn ra (Lên lịch)</option>
                      <option value="draft">⚪ Bản nháp (Chưa mở)</option>
                      <option value="completed">🔴 Đã đóng / Kết thúc</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Thời điểm mở đề</span>
                    </label>
                    <input
                      type="text"
                      placeholder="YYYY-MM-DD HH:mm (ví dụ: 2026-11-03 08:00)"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-rose-600" />
                      <span>Thời điểm đóng đề</span>
                    </label>
                    <input
                      type="text"
                      placeholder="YYYY-MM-DD HH:mm (ví dụ: 2026-11-06 20:00)"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Questions Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Chọn câu hỏi từ Ngân hàng ({formData.questionIds.length} câu đã chọn)
                </label>
                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1.5 bg-slate-50">
                  {questions.map((q) => {
                    const isChecked = formData.questionIds.includes(q.id);
                    return (
                      <label
                        key={q.id}
                        className={`flex items-center gap-2 p-2 rounded text-xs cursor-pointer ${
                          isChecked ? 'bg-indigo-50 border border-indigo-200 font-semibold text-indigo-900' : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setFormData({
                                ...formData,
                                questionIds: formData.questionIds.filter((id) => id !== q.id),
                              });
                            } else {
                              setFormData({
                                ...formData,
                                questionIds: [...formData.questionIds, q.id],
                              });
                            }
                          }}
                          className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="font-mono text-slate-500 font-normal">[{q.code}]</span>
                        <span className="truncate flex-1">{q.content}</span>
                        <span className="text-[11px] text-slate-400">({q.subject})</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Security Settings Section */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-indigo-700">
                  <Shield className="w-4 h-4" />
                  Cấu hình Giám sát An ninh & Chống gian lận
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.securitySettings.requireWebcam}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          securitySettings: { ...formData.securitySettings, requireWebcam: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Bật giám sát Camera / AI</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.securitySettings.requireFullscreen}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          securitySettings: { ...formData.securitySettings, requireFullscreen: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Khóa toàn màn hình (Fullscreen)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.securitySettings.blockCopyPaste}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          securitySettings: { ...formData.securitySettings, blockCopyPaste: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Chặn Copy / Paste / Chuột phải</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.securitySettings.watermarkEnabled}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          securitySettings: { ...formData.securitySettings, watermarkEnabled: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Watermark chống chụp màn hình</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.securitySettings.shuffleQuestions}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          securitySettings: { ...formData.securitySettings, shuffleQuestions: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Đảo thứ tự câu hỏi & phương án</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.securitySettings.autoSubmitOnViolationLimit}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          securitySettings: {
                            ...formData.securitySettings,
                            autoSubmitOnViolationLimit: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Tự động đình chỉ thi khi vượt ngưỡng vi phạm</span>
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                  <span className="text-xs text-slate-600 font-semibold">Giới hạn vi phạm chuyển tab tối đa:</span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={formData.securitySettings.maxTabViolations}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        securitySettings: {
                          ...formData.securitySettings,
                          maxTabViolations: Number(e.target.value),
                        },
                      })
                    }
                    className="w-16 px-2 py-1 text-xs border border-slate-300 rounded bg-white text-center font-bold"
                  />
                  <span className="text-xs text-slate-500">lần cảnh báo</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer"
                >
                  {editingExam ? 'Lưu thay đổi' : 'Tạo đề thi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CHỈNH SỬA ĐIỀU LỆ & QUY CHẾ CUỘC THI */}
      {editingRulesExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Chỉnh sửa Điều lệ & Quy chế Cuộc thi
                  </h3>
                  <p className="text-xs text-slate-500">
                    Áp dụng cho: <span className="font-semibold text-slate-800">{editingRulesExam.title}</span> ({editingRulesExam.code})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingRulesExam(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRules} className="space-y-5">
              {/* Presets */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Áp dụng mẫu quy chế có sẵn:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {rulePresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-left transition-all cursor-pointer group"
                    >
                      <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 flex items-center justify-between mb-1">
                        <span>{preset.name}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500" />
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2">
                        {preset.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Rules Description / Notification text */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nội dung điều lệ & hướng dẫn thí sinh
                </label>
                <textarea
                  rows={4}
                  value={rulesFormData.description}
                  onChange={(e) => setRulesFormData({ ...rulesFormData, description: e.target.value })}
                  placeholder="Nhập chi tiết các quy định, thời gian làm bài, nguyên tắc bảo mật và kỷ luật phòng thi..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-800 placeholder-slate-400 leading-relaxed"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Thông điệp này sẽ được hiển thị trang trọng ở màn hình chờ trước khi thí sinh bấm xác nhận bắt đầu làm bài.
                </p>
              </div>

              {/* Security & Anti-cheat Options */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Cấu hình giám sát an ninh phòng thi
                  </span>
                  <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                    Chống gian lận AI
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <label className="flex items-center gap-2 text-slate-700 p-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rulesFormData.securitySettings.requireWebcam}
                      onChange={(e) =>
                        setRulesFormData({
                          ...rulesFormData,
                          securitySettings: {
                            ...rulesFormData.securitySettings,
                            requireWebcam: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Yêu cầu Webcam giám sát trực tiếp</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-700 p-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rulesFormData.securitySettings.requireFullscreen}
                      onChange={(e) =>
                        setRulesFormData({
                          ...rulesFormData,
                          securitySettings: {
                            ...rulesFormData.securitySettings,
                            requireFullscreen: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Bắt buộc toàn màn hình (Kiosk mode)</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-700 p-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rulesFormData.securitySettings.blockCopyPaste}
                      onChange={(e) =>
                        setRulesFormData({
                          ...rulesFormData,
                          securitySettings: {
                            ...rulesFormData.securitySettings,
                            blockCopyPaste: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Khóa chuột phải & Chống sao chép</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-700 p-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rulesFormData.securitySettings.watermarkEnabled}
                      onChange={(e) =>
                        setRulesFormData({
                          ...rulesFormData,
                          securitySettings: {
                            ...rulesFormData.securitySettings,
                            watermarkEnabled: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Đóng dấu chìm Watermark thí sinh</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-700 p-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rulesFormData.securitySettings.shuffleQuestions}
                      onChange={(e) =>
                        setRulesFormData({
                          ...rulesFormData,
                          securitySettings: {
                            ...rulesFormData.securitySettings,
                            shuffleQuestions: e.target.checked,
                            shuffleOptions: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Xáo trộn câu hỏi & phương án</span>
                  </label>

                  <label className="flex items-center gap-2 text-slate-700 p-2 bg-white rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rulesFormData.securitySettings.autoSubmitOnViolationLimit}
                      onChange={(e) =>
                        setRulesFormData({
                          ...rulesFormData,
                          securitySettings: {
                            ...rulesFormData.securitySettings,
                            autoSubmitOnViolationLimit: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Tự động thu bài khi quá số lần vi phạm</span>
                  </label>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-700 font-semibold">Giới hạn vi phạm chuyển tab:</span>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={rulesFormData.securitySettings.maxTabViolations}
                      onChange={(e) =>
                        setRulesFormData({
                          ...rulesFormData,
                          securitySettings: {
                            ...rulesFormData.securitySettings,
                            maxTabViolations: Number(e.target.value),
                          },
                        })
                      }
                      className="w-16 px-2 py-1 text-xs border border-slate-300 rounded bg-white text-center font-bold text-slate-800"
                    />
                    <span className="text-xs text-slate-500">lần tối đa</span>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rulesFormData.securitySettings.allowReviewAfterSubmit}
                      onChange={(e) =>
                        setRulesFormData({
                          ...rulesFormData,
                          securitySettings: {
                            ...rulesFormData.securitySettings,
                            allowReviewAfterSubmit: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Cho phép xem lại đề và lời giải sau khi nộp</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingRulesExam(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm cursor-pointer transition-colors flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Lưu Điều Lệ & Quy Chế
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
