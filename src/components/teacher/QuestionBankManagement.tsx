import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Question, QuestionDifficulty, QuestionType } from '../../types';
import {
  HelpCircle,
  Plus,
  Search,
  Filter,
  Download,
  Edit2,
  Trash2,
  CheckCircle2,
  BookOpen,
  Tag,
  Lightbulb,
} from 'lucide-react';
import { exportToExcel } from '../../utils/excelHelper';

export const QuestionBankManagement: React.FC = () => {
  const { questions, addQuestion, updateQuestion, deleteQuestion } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    subject: 'Toán học',
    grade: 12,
    topic: '',
    difficulty: 'medium' as QuestionDifficulty,
    type: 'single' as QuestionType,
    content: '',
    options: ['', '', '', ''],
    correctAnswers: ['0'],
    explanation: '',
    points: 1,
    tags: '',
  });

  const subjects = ['Toán học', 'Vật lý', 'Hóa học', 'Sinh học', 'Ngữ văn', 'Tiếng Anh', 'Tin học', 'Lịch sử', 'Địa lý'];

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = subjectFilter === 'all' || q.subject === subjectFilter;
    const matchesGrade = gradeFilter === 'all' || q.grade === Number(gradeFilter);
    const matchesDiff = difficultyFilter === 'all' || q.difficulty === difficultyFilter;
    return matchesSearch && matchesSubject && matchesGrade && matchesDiff;
  });

  const handleOpenAdd = () => {
    setEditingQuestion(null);
    const nextNum = questions.length + 1;
    setFormData({
      code: `Q-${String(nextNum).padStart(3, '0')}`,
      subject: 'Toán học',
      grade: 12,
      topic: 'Khảo sát hàm số',
      difficulty: 'medium',
      type: 'single',
      content: '',
      options: ['', '', '', ''],
      correctAnswers: ['0'],
      explanation: '',
      points: 1,
      tags: 'Toán 12, Trắc nghiệm',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (q: Question) => {
    setEditingQuestion(q);
    setFormData({
      code: q.code,
      subject: q.subject,
      grade: q.grade,
      topic: q.topic,
      difficulty: q.difficulty,
      type: q.type,
      content: q.content,
      options: q.options && q.options.length === 4 ? q.options : ['', '', '', ''],
      correctAnswers: q.correctAnswers,
      explanation: q.explanation || '',
      points: q.points,
      tags: q.tags?.join(', ') || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content || !formData.code) {
      alert('Vui lòng điền đủ mã câu hỏi và nội dung.');
      return;
    }

    const tagsArray = formData.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (editingQuestion) {
      updateQuestion(editingQuestion.id, {
        ...formData,
        tags: tagsArray,
      });
    } else {
      addQuestion({
        ...formData,
        tags: tagsArray,
      });
    }

    setIsModalOpen(false);
  };

  const handleExport = () => {
    const exportData = filteredQuestions.map((q, idx) => ({
      'STT': idx + 1,
      'Mã câu hỏi': q.code,
      'Môn học': q.subject,
      'Khối': q.grade,
      'Chuyên đề': q.topic,
      'Mức độ': q.difficulty,
      'Nội dung câu hỏi': q.content,
      'Đáp án A': q.options?.[0] || '',
      'Đáp án B': q.options?.[1] || '',
      'Đáp án C': q.options?.[2] || '',
      'Đáp án D': q.options?.[3] || '',
      'Đáp án đúng': q.correctAnswers.join('; '),
      'Lời giải': q.explanation || '',
      'Điểm': q.points,
      'Ngày tạo': q.createdAt,
    }));

    exportToExcel(exportData, `Ngan_Hang_Cau_Hoi_${new Date().toISOString().slice(0, 10)}`);
  };

  const getDifficultyBadge = (diff: QuestionDifficulty) => {
    switch (diff) {
      case 'easy':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Nhận biết</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">Thông hiểu</span>;
      case 'hard':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Vận dụng</span>;
      case 'expert':
        return <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">Vận dụng cao</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
            Ngân hàng Câu hỏi & Đề cương ({questions.length} câu)
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý kho câu hỏi trắc nghiệm chuẩn hóa, phân loại theo chuyên đề ma trận và mức độ nhận thức
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Xuất Excel
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tạo câu hỏi mới
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm nội dung câu hỏi, chuyên đề hoặc mã..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="all">Tất cả môn</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="all">Tất cả khối</option>
            <option value="12">Khối 12</option>
            <option value="11">Khối 11</option>
            <option value="10">Khối 10</option>
          </select>

          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="all">Tất cả mức độ</option>
            <option value="easy">Nhận biết</option>
            <option value="medium">Thông hiểu</option>
            <option value="hard">Vận dụng</option>
            <option value="expert">Vận dụng cao</option>
          </select>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.map((q, qIndex) => (
          <div
            key={q.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-indigo-200 transition-all space-y-3"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {q.code}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  {q.subject} - Khối {q.grade}
                </span>
                <span className="text-xs text-slate-500">• {q.topic}</span>
                {getDifficultyBadge(q.difficulty)}
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                <button
                  onClick={() => handleOpenEdit(q)}
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                  title="Chỉnh sửa câu hỏi"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Bạn có chắc muốn xóa câu hỏi ${q.code}?`)) {
                      deleteQuestion(q.id);
                    }
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Xóa câu hỏi"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Question Content */}
            <div className="text-sm font-semibold text-slate-800 leading-relaxed font-sans">
              <span className="text-indigo-600 mr-2">Câu {qIndex + 1}:</span>
              {q.content}
            </div>

            {/* Options */}
            {q.options && q.options.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {q.options.map((opt, oIdx) => {
                  const letter = String.fromCharCode(65 + oIdx);
                  const isCorrect = q.correctAnswers.includes(String(oIdx)) || q.correctAnswers.includes(letter);
                  return (
                    <div
                      key={oIdx}
                      className={`p-2.5 rounded-lg text-xs font-medium border flex items-center gap-2.5 ${
                        isCorrect
                          ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 font-semibold'
                          : 'bg-slate-50/70 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {letter}
                      </span>
                      <span className="flex-1">{opt}</span>
                      {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Explanation */}
            {q.explanation && (
              <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Hướng dẫn giải: </strong>
                  <span>{q.explanation}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal Add/Edit Question */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-600" />
              {editingQuestion ? `Chỉnh sửa câu hỏi ${editingQuestion.code}` : 'Tạo câu hỏi trắc nghiệm mới'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Mã câu hỏi *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Chuyên đề kiến thức
                  </label>
                  <input
                    type="text"
                    placeholder="ví dụ: Khảo sát hàm số, An ninh mạng..."
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Mức độ nhận thức *
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as QuestionDifficulty })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="easy">Nhận biết (Dễ)</option>
                    <option value="medium">Thông hiểu (Trung bình)</option>
                    <option value="hard">Vận dụng (Khá)</option>
                    <option value="expert">Vận dụng cao (Giỏi)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Nội dung câu hỏi *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Nhập nội dung đề bài (hỗ trợ công thức f(x), x^2, ký hiệu...)"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                ></textarea>
              </div>

              {/* Options */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  4 Phương án lựa chọn (Chọn nút tròn để chỉ định đáp án đúng)
                </label>
                {formData.options.map((opt, idx) => {
                  const letter = String.fromCharCode(65 + idx);
                  const isChecked = formData.correctAnswers.includes(String(idx));
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, correctAnswers: [String(idx)] })}
                        className={`w-7 h-7 rounded-full font-bold text-xs shrink-0 cursor-pointer transition-all flex items-center justify-center ${
                          isChecked
                            ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {letter}
                      </button>
                      <input
                        type="text"
                        required
                        placeholder={`Nội dung đáp án ${letter}...`}
                        value={opt}
                        onChange={(e) => {
                          const updated = [...formData.options];
                          updated[idx] = e.target.value;
                          setFormData({ ...formData, options: updated });
                        }}
                        className="flex-1 px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      />
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Lời giải chi tiết / Hướng dẫn giải
                </label>
                <textarea
                  rows={2}
                  placeholder="Giải thích chi tiết phương pháp giải cho học sinh xem sau khi hoàn thành bài..."
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                ></textarea>
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
                  {editingQuestion ? 'Lưu thay đổi' : 'Lưu câu hỏi vào ngân hàng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
