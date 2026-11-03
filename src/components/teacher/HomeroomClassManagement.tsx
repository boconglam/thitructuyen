import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Student, SchoolClass, ExamAttempt } from '../../types';
import {
  School,
  Users,
  UserCheck,
  UserPlus,
  Trash2,
  Edit2,
  Search,
  Download,
  Upload,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
  AlertCircle,
  Clock,
  Award,
  BarChart3,
  Eye,
  ShieldAlert,
  Check,
  X,
} from 'lucide-react';
import { exportToExcel } from '../../utils/excelHelper';
import * as XLSX from 'xlsx';

type HomeroomTab = 'students' | 'tracking' | 'scores' | 'summary';

export const HomeroomClassManagement: React.FC = () => {
  const {
    currentUser,
    teachers,
    classes,
    students,
    exams,
    attempts,
    questions,
    currentAcademicYear,
    addStudent,
    updateStudent,
    deleteStudent,
    bulkDeleteStudents,
    bulkAddStudents,
    generateUniqueStudentCode,
    isStudentCodeUnique,
  } = useApp();

  // Find the current logged in teacher or default to the primary homeroom teacher
  const loggedTeacher =
    teachers.find((t) => t.id === currentUser?.teacherId) ||
    teachers.find((t) => t.isHomeroom) ||
    teachers[0];

  // Classes that this teacher is authorized to manage (homeroom + assigned classes)
  const teacherClasses: SchoolClass[] = classes.filter((c) => {
    if (loggedTeacher.homeroomClassId === c.id) return true;
    if (loggedTeacher.assignedClasses && loggedTeacher.assignedClasses.includes(c.id)) return true;
    if (c.homeroomTeacherId === loggedTeacher.id) return true;
    return false;
  });

  // Default to homeroom class, or fallback to first available teacher class, or first class
  const primaryHomeroomClass =
    classes.find((c) => c.id === loggedTeacher.homeroomClassId) ||
    teacherClasses[0] ||
    classes[0];

  const [selectedClassId, setSelectedClassId] = useState<string>(primaryHomeroomClass?.id || '');
  const activeClass = classes.find((c) => c.id === selectedClassId) || primaryHomeroomClass;

  // Active sub-tab
  const [activeTab, setActiveTab] = useState<HomeroomTab>('students');

  // Selected Exam for tracking, scores, and summary
  const availableExams = exams.filter(
    (e) => !e.assignedClassIds || e.assignedClassIds.length === 0 || e.assignedClassIds.includes(activeClass.id)
  );
  const [selectedExamId, setSelectedExamId] = useState<string>(availableExams[0]?.id || exams[0]?.id || '');
  const selectedExam = exams.find((e) => e.id === selectedExamId) || availableExams[0] || exams[0];

  // Students of the selected class
  const classStudents = students.filter((s) => s.classId === activeClass.id);

  // Search & Filters for Student List
  const [studentSearch, setStudentSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');

  // Multi-select for bulk delete
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Add / Edit student modal
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentFormError, setStudentFormError] = useState('');
  const [studentFormData, setStudentFormData] = useState({
    studentCode: '',
    fullName: '',
    gender: 'Nam' as 'Nam' | 'Nữ',
    dateOfBirth: '2008-01-01',
    email: '',
    phone: '',
    parentPhone: '',
    address: '',
    status: 'active' as 'active' | 'suspended' | 'graduated',
  });

  // Excel Import modal & state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Candidate attempt detail modal
  const [viewingAttempt, setViewingAttempt] = useState<ExamAttempt | null>(null);

  // PDF Preview / Print modal
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Filtered students for management tab
  const filteredStudents = classStudents.filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.phone.includes(studentSearch);
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Attempts for selected exam from students in THIS class
  const studentIdsInClass = new Set(classStudents.map((s) => s.id));
  const classAttempts = attempts.filter(
    (a) => a.examId === selectedExam?.id && studentIdsInClass.has(a.studentId)
  );

  // Helper to compute correct answers for an attempt
  const getAttemptCorrectCount = (att?: ExamAttempt | null) => {
    if (!att || !att.answers) return 0;
    return Object.entries(att.answers).filter(([qId, ans]) => {
      const q = questions.find((item) => item.id === qId);
      return q && q.correctAnswers.includes(String(ans));
    }).length;
  };

  // Metrics for Tracking & Progress
  const totalClassStudents = classStudents.length;
  const participatedAttempts = classAttempts.filter((a) => a.status === 'submitted' || a.status === 'in_progress');
  const participatedCount = participatedAttempts.length;
  const participationRate = totalClassStudents > 0 ? Math.round((participatedCount / totalClassStudents) * 100) : 0;

  const completedAttempts = classAttempts.filter((a) => a.status === 'submitted');
  const completedCount = completedAttempts.length;
  const completionRate = totalClassStudents > 0 ? Math.round((completedCount / totalClassStudents) * 100) : 0;

  const inProgressAttempts = classAttempts.filter((a) => a.status === 'in_progress');
  const notParticipatedCount = Math.max(0, totalClassStudents - participatedCount);

  // Score statistics for Class Summary
  const passedCount = completedAttempts.filter((a) => a.passed).length;
  const passRate = completedCount > 0 ? ((passedCount / completedCount) * 100).toFixed(1) : '0';
  const averageScore =
    completedCount > 0
      ? (completedAttempts.reduce((acc, curr) => acc + curr.score, 0) / completedCount).toFixed(2)
      : '0.00';
  const maxScore = completedCount > 0 ? Math.max(...completedAttempts.map((a) => a.score)).toFixed(1) : '0.0';
  const minScore = completedCount > 0 ? Math.min(...completedAttempts.map((a) => a.score)).toFixed(1) : '0.0';

  // Grade distributions
  const excellentCount = completedAttempts.filter((a) => a.score >= 9.0).length;
  const goodCount = completedAttempts.filter((a) => a.score >= 8.0 && a.score < 9.0).length;
  const fairCount = completedAttempts.filter((a) => a.score >= 6.5 && a.score < 8.0).length;
  const averageCount = completedAttempts.filter((a) => a.score >= 5.0 && a.score < 6.5).length;
  const poorCount = completedAttempts.filter((a) => a.score < 5.0).length;

  // Handlers for Add / Edit
  const handleOpenAddStudent = () => {
    setEditingStudent(null);
    setStudentFormError('');
    setStudentFormData({
      studentCode: generateUniqueStudentCode(),
      fullName: '',
      gender: 'Nam',
      dateOfBirth: '2008-05-15',
      email: '',
      phone: '',
      parentPhone: '',
      address: '',
      status: 'active',
    });
    setIsStudentModalOpen(true);
  };

  const handleOpenEditStudent = (s: Student) => {
    setEditingStudent(s);
    setStudentFormError('');
    setStudentFormData({
      studentCode: s.studentCode,
      fullName: s.fullName,
      gender: s.gender,
      dateOfBirth: s.dateOfBirth,
      email: s.email,
      phone: s.phone,
      parentPhone: s.parentPhone || '',
      address: s.address || '',
      status: s.status,
    });
    setIsStudentModalOpen(true);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentFormData.fullName.trim()) {
      setStudentFormError('Vui lòng nhập họ và tên học sinh.');
      return;
    }
    if (!studentFormData.studentCode.trim()) {
      setStudentFormError('Vui lòng nhập mã học sinh.');
      return;
    }
    if (!isStudentCodeUnique(studentFormData.studentCode, editingStudent?.id)) {
      setStudentFormError('Mã học sinh đã tồn tại trong hệ thống. Vui lòng chọn mã khác.');
      return;
    }

    if (editingStudent) {
      updateStudent(editingStudent.id, {
        studentCode: studentFormData.studentCode.trim().toUpperCase(),
        fullName: studentFormData.fullName.trim(),
        gender: studentFormData.gender,
        dateOfBirth: studentFormData.dateOfBirth,
        email: studentFormData.email.trim(),
        phone: studentFormData.phone.trim(),
        parentPhone: studentFormData.parentPhone.trim(),
        address: studentFormData.address.trim(),
        status: studentFormData.status,
      });
    } else {
      addStudent({
        studentCode: studentFormData.studentCode.trim().toUpperCase(),
        fullName: studentFormData.fullName.trim(),
        classId: activeClass.id,
        className: activeClass.name,
        gender: studentFormData.gender,
        dateOfBirth: studentFormData.dateOfBirth,
        email: studentFormData.email.trim() || `hs.${Date.now()}@tdc3htp.edu.vn`,
        phone: studentFormData.phone.trim() || '0356 000 000',
        parentPhone: studentFormData.parentPhone.trim(),
        address: studentFormData.address.trim(),
        status: studentFormData.status,
        totalPoints: 0,
        examCount: 0,
        rank: classStudents.length + 1,
      });
    }
    setIsStudentModalOpen(false);
  };

  // Bulk Delete
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedStudentIds(filteredStudents.map((s) => s.id));
    } else {
      setSelectedStudentIds([]);
    }
  };

  const handleToggleSelectOne = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (selectedStudentIds.length === 0) return;
    const confirmMessage = `Bạn có chắc chắn muốn xóa ${selectedStudentIds.length} học sinh đã chọn khỏi lớp ${activeClass.name}? Thao tác này không thể hoàn tác.`;
    if (confirm(confirmMessage)) {
      bulkDeleteStudents(selectedStudentIds);
      setSelectedStudentIds([]);
    }
  };

  const handleDeleteOne = (s: Student) => {
    if (confirm(`Bạn có chắc muốn xóa học sinh [${s.fullName}] (${s.studentCode}) khỏi lớp ${activeClass.name}?`)) {
      deleteStudent(s.id);
      setSelectedStudentIds((prev) => prev.filter((id) => id !== s.id));
    }
  };

  // Excel Import for class
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (!json || json.length === 0) {
          setImportStatus('File Excel không có dữ liệu hợp lệ.');
          return;
        }

        const newStudents: Omit<Student, 'id'>[] = [];
        json.forEach((row, idx) => {
          const fullName = row['Họ và tên'] || row['Họ tên'] || row['Ho va ten'] || row['Name'];
          if (fullName) {
            const studentCode =
              row['Mã học sinh'] ||
              row['Mã HS'] ||
              row['Ma HS'] ||
              `HS2026-${String(students.length + idx + 10).padStart(3, '0')}`;
            const gender = (row['Giới tính'] || row['Gioi tinh'] || 'Nam') === 'Nữ' ? 'Nữ' : 'Nam';
            const dateOfBirth = row['Ngày sinh'] || row['Ngay sinh'] || '2008-01-01';
            const email = row['Email'] || `hs.${studentCode.toLowerCase()}@tdc3htp.edu.vn`;
            const phone = row['Số điện thoại'] || row['SĐT'] || '0356 000 000';
            const parentPhone = row['Điện thoại phụ huynh'] || row['SĐT PH'] || '';
            const address = row['Địa chỉ'] || '';

            newStudents.push({
              studentCode,
              fullName,
              classId: activeClass.id,
              className: activeClass.name,
              gender,
              dateOfBirth,
              email,
              phone,
              parentPhone,
              address,
              status: 'active',
              totalPoints: 0,
              examCount: 0,
              rank: classStudents.length + idx + 1,
            });
          }
        });

        if (newStudents.length > 0) {
          bulkAddStudents(newStudents);
          setImportStatus(`Đã nhập thành công ${newStudents.length} học sinh vào lớp ${activeClass.name}!`);
          setTimeout(() => {
            setIsImportModalOpen(false);
            setImportStatus(null);
          }, 1500);
        } else {
          setImportStatus('Không tìm thấy danh sách học sinh hợp lệ. Vui lòng kiểm tra cột [Họ và tên].');
        }
      } catch (err) {
        setImportStatus('Lỗi đọc file Excel. Vui lòng kiểm tra lại định dạng file.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Export Class Student Roster
  const handleExportRosterExcel = () => {
    const data = classStudents.map((s, idx) => ({
      STT: idx + 1,
      'Mã học sinh': s.studentCode,
      'Họ và tên': s.fullName,
      Lớp: s.className,
      'Giới tính': s.gender,
      'Ngày sinh': s.dateOfBirth,
      Email: s.email,
      'Số điện thoại': s.phone,
      'SĐT Phụ huynh': s.parentPhone || '---',
      'Địa chỉ': s.address || '---',
      'Trạng thái': s.status === 'active' ? 'Đang học' : 'Đình chỉ',
      'Điểm tích lũy': s.totalPoints,
      'Số bài thi đã làm': s.examCount,
    }));
    exportToExcel(data, `Danh_Sach_Hoc_Sinh_Lop_${activeClass.name}`);
  };

  // Export Class Exam Scores Excel
  const handleExportClassScoresExcel = () => {
    const totalExamQuestions = selectedExam?.questionIds?.length || 0;
    const data = classStudents.map((s, idx) => {
      const att = classAttempts.find((a) => a.studentId === s.id && a.status === 'submitted');
      let statusText = 'Chưa tham gia';
      if (att) {
        statusText = att.passed ? 'Đạt' : 'Không đạt';
      } else {
        const inProg = classAttempts.find((a) => a.studentId === s.id && a.status === 'in_progress');
        if (inProg) statusText = 'Đang làm bài';
      }

      let rating = '---';
      if (att) {
        if (att.score >= 9.0) rating = 'Xuất sắc';
        else if (att.score >= 8.0) rating = 'Giỏi';
        else if (att.score >= 6.5) rating = 'Khá';
        else if (att.score >= 5.0) rating = 'Trung bình';
        else rating = 'Yếu';
      }

      const correctCount = getAttemptCorrectCount(att);

      return {
        STT: idx + 1,
        'Mã học sinh': s.studentCode,
        'Họ và tên': s.fullName,
        Lớp: activeClass.name,
        'Kỳ thi': selectedExam?.title || 'Kỳ thi',
        'Điểm số (Thang 10)': att ? att.score.toFixed(1) : '---',
        'Số câu đúng': att ? `${correctCount} / ${totalExamQuestions}` : '---',
        'Xếp loại': rating,
        'Kết quả': statusText,
        'Số lần vi phạm': att ? att.violations?.length || 0 : 0,
        'Thời gian nộp': att ? att.submitTime || att.startTime : '---',
      };
    });

    exportToExcel(data, `Bang_Diem_Lop_${activeClass.name}_${selectedExam?.title || 'KyThi'}`);
  };

  return (
    <div className="space-y-6">
      {/* Homeroom Teacher Header & Class Selector Banner */}
      <div className="bg-linear-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-indigo-200 shrink-0 shadow-inner">
              <School className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-amber-950 uppercase tracking-wider">
                  Quyền Giáo Viên Chủ Nhiệm
                </span>
                <span className="text-xs text-indigo-200 font-mono">
                  {currentAcademicYear.name}
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight text-white mt-1">
                Quản trị Lớp Chủ Nhiệm: <span className="text-amber-300 font-black">Lớp {activeClass.name}</span>
              </h2>
              <p className="text-sm text-indigo-200 mt-1 flex items-center gap-2">
                <span>GVCN: <strong>{loggedTeacher.fullName}</strong> ({loggedTeacher.subject})</span>
                <span>•</span>
                <span>Phòng học: {activeClass.room || 'Phòng bộ môn'}</span>
                <span>•</span>
                <span>Sĩ số: <strong className="text-white">{classStudents.length} học sinh</strong></span>
              </p>
            </div>
          </div>

          {/* Class Switcher for teachers with multiple classes */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-1.5 flex items-center gap-2">
              <span className="text-xs font-semibold text-indigo-200 pl-2">Chọn lớp:</span>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSelectedStudentIds([]);
                }}
                className="bg-indigo-950/80 text-white text-xs font-bold rounded-lg px-3 py-1.5 border border-white/20 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
              >
                {teacherClasses.map((c) => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                    Lớp {c.name} {c.id === loggedTeacher.homeroomClassId ? '(Chủ nhiệm)' : '(Bộ môn)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Export Button */}
            <button
              onClick={handleExportClassScoresExcel}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Tải Báo Cáo Điểm</span>
            </button>
          </div>
        </div>

        {/* 4 Quick Stat Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-[11px] font-medium text-indigo-200">Sĩ số lớp</div>
            <div className="text-2xl font-black text-white mt-0.5">{totalClassStudents} <span className="text-xs font-normal text-indigo-300">học sinh</span></div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-[11px] font-medium text-indigo-200">Đã tham gia thi</div>
            <div className="text-2xl font-black text-amber-300 mt-0.5">{participatedCount} <span className="text-xs font-normal text-indigo-300">({participationRate}%)</span></div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-[11px] font-medium text-indigo-200">Tỷ lệ hoàn thành</div>
            <div className="text-2xl font-black text-emerald-400 mt-0.5">{completionRate}%</div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-[11px] font-medium text-indigo-200">Điểm TB Lớp</div>
            <div className="text-2xl font-black text-white mt-0.5">{averageScore} <span className="text-xs font-normal text-indigo-300">/ 10</span></div>
          </div>
        </div>
      </div>

      {/* Homeroom Sub-Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto p-1 bg-slate-100 rounded-xl border border-slate-200/80">
          <button
            onClick={() => setActiveTab('students')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'students'
                ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>1. Danh sách Học sinh & Quản trị</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-50 text-indigo-700 font-bold">
              {classStudents.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('tracking')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'tracking'
                ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>2. Tiến độ & Tỷ lệ tham gia</span>
          </button>

          <button
            onClick={() => setActiveTab('scores')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'scores'
                ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>3. Xem Điểm thi cá nhân</span>
          </button>

          <button
            onClick={() => setActiveTab('summary')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'summary'
                ? 'bg-white text-indigo-700 shadow-xs ring-1 ring-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>4. Kết quả tổng hợp & Báo cáo lớp</span>
          </button>
        </div>

        {/* Exam selector for tabs 2, 3, 4 */}
        {activeTab !== 'students' && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Kỳ thi:</span>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="text-xs font-bold bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs max-w-xs truncate"
            >
              {availableExams.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.title} ({exam.subject})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DANH SÁCH HỌC SINH & QUẢN TRỊ LỚP (Nhập, Sửa, Xóa hàng loạt)       */}
      {/* ========================================================================= */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          {/* Action Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm học sinh theo tên, mã HS, SĐT..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang học</option>
                <option value="suspended">Tạm đình chỉ</option>
              </select>
            </div>

            {/* Actions for Homeroom Teacher */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportRosterExcel}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Xuất DS Excel</span>
              </button>

              <button
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-600" />
                <span>Nhập danh sách Excel</span>
              </button>

              <button
                onClick={handleOpenAddStudent}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Thêm học sinh mới</span>
              </button>
            </div>
          </div>

          {/* Bulk Action Bar (when 1 or more students selected) */}
          {selectedStudentIds.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-800">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
                <span>Đang chọn {selectedStudentIds.length} học sinh trong lớp {activeClass.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedStudentIds([])}
                  className="px-3 py-1.5 bg-white text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                >
                  Bỏ chọn tất cả
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa hàng loạt ({selectedStudentIds.length}) học sinh</span>
                </button>
              </div>
            </div>
          )}

          {/* Student Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredStudents.length > 0 &&
                          selectedStudentIds.length === filteredStudents.length
                        }
                        onChange={handleSelectAll}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </th>
                    <th className="py-3 px-3">STT</th>
                    <th className="py-3 px-4">Mã HS & Họ và tên</th>
                    <th className="py-3 px-3">Giới tính</th>
                    <th className="py-3 px-3">Ngày sinh</th>
                    <th className="py-3 px-4">Thông tin liên hệ</th>
                    <th className="py-3 px-3 text-center">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        Chưa có học sinh nào trong lớp {activeClass.name} phù hợp bộ lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s, idx) => {
                      const isSelected = selectedStudentIds.includes(s.id);
                      return (
                        <tr
                          key={s.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isSelected ? 'bg-indigo-50/40' : ''
                          }`}
                        >
                          <td className="py-3 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelectOne(s.id)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-3 text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                                {s.fullName.slice(-1)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">{s.fullName}</div>
                                <div className="text-[11px] font-mono text-indigo-600">{s.studentCode}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-700">{s.gender}</td>
                          <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">{s.dateOfBirth}</td>
                          <td className="py-3 px-4">
                            <div className="text-[11px] text-slate-800">{s.email}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              SĐT: {s.phone} {s.parentPhone && `• PH: ${s.parentPhone}`}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            {s.status === 'active' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Đang học
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                                Đình chỉ
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEditStudent(s)}
                                title="Sửa thông tin học sinh"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteOne(s)}
                                title="Xóa học sinh này"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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

      {/* ========================================================================= */}
      {/* TAB 2: TIẾN ĐỘ & TỶ LỆ HOÀN THÀNH BÀI THI (Real-time Tracking)             */}
      {/* ========================================================================= */}
      {activeTab === 'tracking' && (
        <div className="space-y-6">
          {/* Key KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-semibold">Tổng sĩ số lớp</span>
                <Users className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-black text-slate-900">{totalClassStudents}</div>
              <div className="text-[11px] text-slate-400 mt-1">Lớp {activeClass.name} ({currentAcademicYear.name})</div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center justify-between text-indigo-600 mb-2">
                <span className="text-xs font-semibold">Số HS đã tham gia</span>
                <UserCheck className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-black text-indigo-600">
                {participatedCount} <span className="text-sm font-semibold text-slate-400">/ {totalClassStudents}</span>
              </div>
              <div className="text-[11px] text-indigo-600 font-semibold mt-1">
                Tỷ lệ tham gia: {participationRate}%
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center justify-between text-emerald-600 mb-2">
                <span className="text-xs font-semibold">Tỷ lệ hoàn thành</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-emerald-600">{completionRate}%</div>
              <div className="text-[11px] text-slate-500 mt-1">
                {completedCount} học sinh đã nộp bài thành công
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <div className="flex items-center justify-between text-amber-600 mb-2">
                <span className="text-xs font-semibold">Chưa tham gia</span>
                <AlertCircle className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-600">{notParticipatedCount}</div>
              <div className="text-[11px] text-slate-500 mt-1">
                {inProgressAttempts.length > 0
                  ? `${inProgressAttempts.length} em đang làm bài trực tuyến`
                  : 'Chưa vào phòng thi'}
              </div>
            </div>
          </div>

          {/* Progress Bar Banner */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">Tiến độ nộp bài của Lớp {activeClass.name}</span>
              <span className="text-xs font-mono font-bold text-indigo-600">{completedCount} / {totalClassStudents} hoàn thành ({completionRate}%)</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${completionRate}%` }}
                className="bg-emerald-500 h-full transition-all duration-500"
                title={`Đã hoàn thành: ${completedCount} em`}
              ></div>
              <div
                style={{ width: `${totalClassStudents > 0 ? (inProgressAttempts.length / totalClassStudents) * 100 : 0}%` }}
                className="bg-indigo-500 h-full animate-pulse transition-all duration-500"
                title={`Đang làm bài: ${inProgressAttempts.length} em`}
              ></div>
            </div>
            <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Đã nộp bài ({completedCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                <span>Đang làm bài ({inProgressAttempts.length})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-200"></span>
                <span>Chưa vào thi ({notParticipatedCount})</span>
              </div>
            </div>
          </div>

          {/* Detailed Student Participation Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Chi tiết trạng thái dự thi từng học sinh</h3>
                <p className="text-xs text-slate-400 mt-0.5">Theo dõi thời gian thực tiến độ bài làm và số vi phạm</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">STT</th>
                    <th className="py-3 px-4">Mã HS & Họ tên</th>
                    <th className="py-3 px-3">Trạng thái thi</th>
                    <th className="py-3 px-3">Tiến độ câu</th>
                    <th className="py-3 px-3 text-center">Điểm số</th>
                    <th className="py-3 px-3 text-center">Cảnh báo</th>
                    <th className="py-3 px-4">Thời gian</th>
                    <th className="py-3 px-4 text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {classStudents.map((s, idx) => {
                    const att = classAttempts.find((a) => a.studentId === s.id);
                    const answeredCount = Object.keys(att?.answers || {}).length;
                    const totalQ = selectedExam?.questionIds?.length || 1;
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{s.fullName}</div>
                          <div className="text-[11px] font-mono text-indigo-600">{s.studentCode}</div>
                        </td>
                        <td className="py-3 px-3">
                          {!att ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                              Chưa tham gia
                            </span>
                          ) : att.status === 'in_progress' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                              Đang làm bài
                            </span>
                          ) : att.status === 'submitted' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Đã nộp bài
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              <ShieldAlert className="w-3 h-3 text-rose-600" />
                              Đình chỉ
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {att ? (
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs">{answeredCount} / {totalQ}</span>
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  style={{ width: `${Math.min(100, (answeredCount / totalQ) * 100)}%` }}
                                  className="h-full bg-indigo-600 rounded-full"
                                ></div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-400">---</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {att && att.status === 'submitted' ? (
                            <span className="font-bold text-slate-900 text-xs">{att.score.toFixed(1)} đ</span>
                          ) : (
                            <span className="text-slate-400">---</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {att && att.violations && att.violations.length > 0 ? (
                            <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-xs">
                              <ShieldAlert className="w-3 h-3" />
                              {att.violations.length}
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-medium">0</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                          {att?.submitTime || att?.startTime || '---'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {att ? (
                            <button
                              onClick={() => setViewingAttempt(att)}
                              className="p-1 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded cursor-pointer"
                              title="Xem chi tiết bài làm"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-slate-300">---</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: XEM ĐIỂM THI CÁ NHÂN CỦA HỌC SINH LỚP MÌNH                         */}
      {/* ========================================================================= */}
      {activeTab === 'scores' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Bảng điểm chi tiết: Lớp {activeClass.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kỳ thi: <strong className="text-indigo-600">{selectedExam?.title}</strong> ({selectedExam?.subject})
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportClassScoresExcel}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất Bảng Điểm Excel</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Hạng</th>
                    <th className="py-3 px-4">Mã HS & Họ và tên</th>
                    <th className="py-3 px-3 text-center">Điểm số</th>
                    <th className="py-3 px-3 text-center">Số câu đúng</th>
                    <th className="py-3 px-3 text-center">Tỷ lệ đúng</th>
                    <th className="py-3 px-3 text-center">Xếp loại</th>
                    <th className="py-3 px-3 text-center">Kết quả</th>
                    <th className="py-3 px-3 text-center">Cảnh báo vi phạm</th>
                    <th className="py-3 px-4">Thời gian nộp</th>
                    <th className="py-3 px-4 text-right">Bài làm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {classStudents.map((s, idx) => {
                    const att = classAttempts.find((a) => a.studentId === s.id && a.status === 'submitted');
                    const hasSubmitted = !!att;
                    const score = att ? att.score : null;
                    const correctCount = getAttemptCorrectCount(att);
                    const totalQ = selectedExam?.questionIds?.length || 1;

                    let rating = '---';
                    let ratingBadge = 'bg-slate-100 text-slate-600';
                    if (score !== null) {
                      if (score >= 9.0) {
                        rating = 'Xuất sắc';
                        ratingBadge = 'bg-purple-100 text-purple-800';
                      } else if (score >= 8.0) {
                        rating = 'Giỏi';
                        ratingBadge = 'bg-emerald-100 text-emerald-800';
                      } else if (score >= 6.5) {
                        rating = 'Khá';
                        ratingBadge = 'bg-indigo-100 text-indigo-800';
                      } else if (score >= 5.0) {
                        rating = 'Trung bình';
                        ratingBadge = 'bg-amber-100 text-amber-800';
                      } else {
                        rating = 'Chưa đạt';
                        ratingBadge = 'bg-rose-100 text-rose-800';
                      }
                    }

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-slate-400">
                          {hasSubmitted ? `#${idx + 1}` : '---'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{s.fullName}</div>
                          <div className="text-[11px] font-mono text-indigo-600">{s.studentCode}</div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {score !== null ? (
                            <span className="text-sm font-black text-slate-900">{score.toFixed(1)}</span>
                          ) : (
                            <span className="text-slate-400">Chưa thi</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          {att ? `${correctCount} / ${totalQ}` : '---'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {att ? (
                            <span className="font-semibold text-slate-700">
                              {Math.round((correctCount / totalQ) * 100)}%
                            </span>
                          ) : (
                            <span className="text-slate-400">---</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${ratingBadge}`}>
                            {rating}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {att ? (
                            att.passed ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs">
                                <Check className="w-3.5 h-3.5" /> Đạt
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-xs">
                                <X className="w-3.5 h-3.5" /> Chưa đạt
                              </span>
                            )
                          ) : (
                            <span className="text-slate-400 text-xs">Chưa thi</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {att && att.violations && att.violations.length > 0 ? (
                            <span className="text-rose-600 font-bold text-xs">
                              {att.violations.length} lần
                            </span>
                          ) : (
                            <span className="text-emerald-600">0</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                          {att?.submitTime || '---'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {att ? (
                            <button
                              onClick={() => setViewingAttempt(att)}
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded text-xs transition-colors cursor-pointer"
                            >
                              Xem bài làm
                            </button>
                          ) : (
                            <span className="text-slate-300">---</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: KẾT QUẢ TỔNG HỢP & BÁO CÁO LỚP (Tải Báo cáo Excel / PDF)            */}
      {/* ========================================================================= */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Top Action Bar for Homeroom Teacher Report */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                Báo Cáo Tổng Hợp Kết Quả Lớp: {activeClass.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Kỳ thi: <strong>{selectedExam?.title}</strong> • Năm học: <strong>{currentAcademicYear.name}</strong> • GVCN: <strong>{loggedTeacher.fullName}</strong>
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportClassScoresExcel}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Tải Báo Cáo Excel</span>
              </button>
              <button
                onClick={() => setIsPdfModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Tải / In Báo Cáo PDF</span>
              </button>
            </div>
          </div>

          {/* Key Academic Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Điểm trung bình lớp</div>
              <div className="text-3xl font-black text-indigo-600 mt-1">{averageScore}</div>
              <div className="text-[11px] text-slate-400 mt-1">Thang điểm 10</div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Tỷ lệ Đạt chuẩn</div>
              <div className="text-3xl font-black text-emerald-600 mt-1">{passRate}%</div>
              <div className="text-[11px] text-slate-400 mt-1">{passedCount} / {completedCount} học sinh đạt</div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Điểm cao nhất (Thủ khoa)</div>
              <div className="text-3xl font-black text-amber-500 mt-1">{maxScore}</div>
              <div className="text-[11px] text-slate-400 mt-1">Điểm thấp nhất: {minScore}</div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Tỷ lệ hoàn thành</div>
              <div className="text-3xl font-black text-purple-600 mt-1">{completionRate}%</div>
              <div className="text-[11px] text-slate-400 mt-1">{completedCount} / {totalClassStudents} học sinh</div>
            </div>
          </div>

          {/* Score Distribution Breakdown (Phổ điểm của lớp) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-sm text-slate-900">Phân Phối Xếp Loại Học Lực Lớp {activeClass.name}</h4>
              <span className="text-xs text-slate-400">Dựa trên {completedCount} học sinh đã hoàn thành</span>
            </div>

            <div className="space-y-3">
              {/* Xuất sắc */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-purple-800">Xuất sắc (9.0 - 10.0)</span>
                  <span className="font-mono font-bold text-slate-700">
                    {excellentCount} HS ({completedCount > 0 ? Math.round((excellentCount / completedCount) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${completedCount > 0 ? (excellentCount / completedCount) * 100 : 0}%` }}
                    className="h-full bg-purple-600 rounded-full"
                  ></div>
                </div>
              </div>

              {/* Giỏi */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-emerald-700">Giỏi (8.0 - 8.9)</span>
                  <span className="font-mono font-bold text-slate-700">
                    {goodCount} HS ({completedCount > 0 ? Math.round((goodCount / completedCount) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${completedCount > 0 ? (goodCount / completedCount) * 100 : 0}%` }}
                    className="h-full bg-emerald-500 rounded-full"
                  ></div>
                </div>
              </div>

              {/* Khá */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-indigo-700">Khá (6.5 - 7.9)</span>
                  <span className="font-mono font-bold text-slate-700">
                    {fairCount} HS ({completedCount > 0 ? Math.round((fairCount / completedCount) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${completedCount > 0 ? (fairCount / completedCount) * 100 : 0}%` }}
                    className="h-full bg-indigo-500 rounded-full"
                  ></div>
                </div>
              </div>

              {/* Trung bình */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-amber-700">Trung bình (5.0 - 6.4)</span>
                  <span className="font-mono font-bold text-slate-700">
                    {averageCount} HS ({completedCount > 0 ? Math.round((averageCount / completedCount) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${completedCount > 0 ? (averageCount / completedCount) * 100 : 0}%` }}
                    className="h-full bg-amber-500 rounded-full"
                  ></div>
                </div>
              </div>

              {/* Yếu / Chưa đạt */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-rose-700">Chưa đạt (&lt; 5.0)</span>
                  <span className="font-mono font-bold text-slate-700">
                    {poorCount} HS ({completedCount > 0 ? Math.round((poorCount / completedCount) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${completedCount > 0 ? (poorCount / completedCount) * 100 : 0}%` }}
                    className="h-full bg-rose-500 rounded-full"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: THÊM / SỬA HỌC SINH LỚP CHỦ NHIỆM                                   */}
      {/* ========================================================================= */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <School className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-base text-slate-900">
                  {editingStudent ? 'Sửa thông tin học sinh' : `Thêm học sinh mới - Lớp ${activeClass.name}`}
                </h3>
              </div>
              <button
                onClick={() => setIsStudentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4 mt-4">
              {studentFormError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{studentFormError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mã học sinh (*)</label>
                  <input
                    type="text"
                    value={studentFormData.studentCode}
                    onChange={(e) => setStudentFormData({ ...studentFormData, studentCode: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono"
                    placeholder="HS2026-001"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lớp</label>
                  <input
                    type="text"
                    disabled
                    value={`Lớp ${activeClass.name}`}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-slate-100 text-slate-500 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên (*)</label>
                <input
                  type="text"
                  value={studentFormData.fullName}
                  onChange={(e) => setStudentFormData({ ...studentFormData, fullName: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Ví dụ: Nguyễn Văn An"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Giới tính</label>
                  <select
                    value={studentFormData.gender}
                    onChange={(e) => setStudentFormData({ ...studentFormData, gender: e.target.value as any })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ngày sinh</label>
                  <input
                    type="date"
                    value={studentFormData.dateOfBirth}
                    onChange={(e) => setStudentFormData({ ...studentFormData, dateOfBirth: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={studentFormData.phone}
                    onChange={(e) => setStudentFormData({ ...studentFormData, phone: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="0356 123 456"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">SĐT Phụ huynh</label>
                  <input
                    type="text"
                    value={studentFormData.parentPhone}
                    onChange={(e) => setStudentFormData({ ...studentFormData, parentPhone: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="0912 345 678"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email học sinh</label>
                <input
                  type="email"
                  value={studentFormData.email}
                  onChange={(e) => setStudentFormData({ ...studentFormData, email: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="hs.an@tdc3htp.edu.vn"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  {editingStudent ? 'Cập nhật' : 'Thêm vào lớp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NHẬP DANH SÁCH HỌC SINH TỪ EXCEL CHO LỚP                           */}
      {/* ========================================================================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900">
                  Nhập danh sách học sinh Lớp {activeClass.name} từ Excel
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportStatus(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Tải lên file Excel (.xlsx / .xls) danh sách học sinh. Hệ thống sẽ tự động gán vào lớp <strong>{activeClass.name}</strong> và sinh mã học sinh duy nhất nếu chưa có.
              </p>

              <div className="p-4 border-2 border-dashed border-slate-300 rounded-xl text-center bg-slate-50/70 hover:bg-slate-50 transition-colors">
                <Upload className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                <div className="text-xs font-semibold text-slate-700">Chọn file Excel danh sách học sinh</div>
                <div className="text-[11px] text-slate-400 mt-1">Hỗ trợ các cột: Họ và tên, Giới tính, Ngày sinh, Email, Số điện thoại</div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs inline-flex items-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Chọn file từ máy tính
                </button>
              </div>

              {importStatus && (
                <div className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                  importStatus.includes('thành công')
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}>
                  {importStatus.includes('thành công') ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  )}
                  <span>{importStatus}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: XEM CHI TIẾT BÀI LÀM CỦA HỌC SINH                                  */}
      {/* ========================================================================= */}
      {viewingAttempt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Bài làm học sinh: {viewingAttempt.studentName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mã HS: <span className="font-mono text-indigo-600">{viewingAttempt.studentCode}</span> • Lớp: <strong>{activeClass.name}</strong> • Điểm số:{' '}
                  <strong className="text-indigo-600">{viewingAttempt.score.toFixed(1)} đ</strong>
                </p>
              </div>
              <button
                onClick={() => setViewingAttempt(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl text-center text-xs">
                <div>
                  <div className="text-slate-400">Số câu đúng</div>
                  <div className="font-bold text-emerald-600 text-sm mt-0.5">
                    {getAttemptCorrectCount(viewingAttempt)}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Số câu đã trả lời</div>
                  <div className="font-bold text-slate-800 text-sm mt-0.5">
                    {Object.keys(viewingAttempt.answers || {}).length}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Vi phạm giám sát</div>
                  <div className="font-bold text-amber-600 text-sm mt-0.5">
                    {viewingAttempt.violations?.length || 0} lần
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase text-slate-400 tracking-wider">
                  Chi tiết từng câu hỏi & đáp án
                </h4>
                {Object.entries(viewingAttempt.answers || {}).map(([qId, selectedAns], idx) => {
                  const q = questions.find((item) => item.id === qId);
                  const isCorrect = q && q.correctAnswers.includes(String(selectedAns));
                  return (
                    <div
                      key={qId}
                      className={`p-3.5 rounded-xl border text-xs ${
                        isCorrect
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : 'bg-rose-50/50 border-rose-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-800">Câu {idx + 1}: {q?.content || 'Nội dung câu hỏi'}</span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                            isCorrect ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'
                          }`}
                        >
                          {isCorrect ? '+ Đạt điểm' : 'Sai'}
                        </span>
                      </div>
                      <div className="text-slate-600 mt-2 space-y-1">
                        <div>
                          Đáp án học sinh chọn:{' '}
                          <span className="font-semibold text-slate-900">
                            {Array.isArray(selectedAns) ? selectedAns.join(', ') : String(selectedAns)}
                          </span>
                        </div>
                        {q?.explanation && (
                          <div className="text-slate-500 italic mt-1 bg-white/70 p-2 rounded border border-slate-100">
                            Giải thích: {q.explanation}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setViewingAttempt(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BÁO CÁO PDF / IN SỔ ĐIỂM CHÍNH THỨC CỦA LỚP CHỦ NHIỆM              */}
      {/* ========================================================================= */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Biên bản Báo Cáo Điểm Thi Lớp Chủ Nhiệm - Chuẩn Bộ GD&ĐT
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>In / Lưu PDF</span>
                </button>
                <button
                  onClick={() => setIsPdfModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-8 overflow-y-auto space-y-6 flex-1 bg-white print:p-0 print:m-0" id="print-area">
              {/* Official Ministerial Header */}
              <div className="flex justify-between items-start text-xs border-b border-slate-300 pb-4">
                <div className="text-center font-bold text-slate-800">
                  <div>SỞ GIÁO DỤC VÀ ĐÀO TẠO</div>
                  <div>TRƯỜNG THPT CHUYÊN TDC3HTP</div>
                  <div className="text-[10px] font-normal text-slate-500 mt-0.5">Số: ....../BC-TDC3HTP</div>
                </div>
                <div className="text-center font-bold text-slate-900">
                  <div>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                  <div className="font-serif italic font-normal text-slate-700 text-[11px]">Độc lập - Tự do - Hạnh phúc</div>
                  <div className="text-[10px] text-slate-400 mt-1 font-normal font-sans">
                    Hà Nội, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                  </div>
                </div>
              </div>

              {/* Title */}
              <div className="text-center space-y-1">
                <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
                  BÁO CÁO TỔNG HỢP KẾT QUẢ THI TRỰC TUYẾN
                </h2>
                <div className="text-xs font-bold text-indigo-700">
                  LỚP: {activeClass.name} • {selectedExam?.title}
                </div>
                <div className="text-[11px] text-slate-500">
                  Năm học: {currentAcademicYear.name} • Giáo viên chủ nhiệm: <strong>{loggedTeacher.fullName}</strong>
                </div>
              </div>

              {/* Statistical Summary Box */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs p-3 bg-slate-50 border border-slate-300 rounded-lg">
                <div>
                  <div className="text-slate-500 text-[10px]">Sĩ số lớp</div>
                  <div className="font-bold text-slate-900 text-sm">{totalClassStudents} học sinh</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px]">Đã dự thi</div>
                  <div className="font-bold text-indigo-700 text-sm">{completedCount} ({completionRate}%)</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px]">Điểm TB Lớp</div>
                  <div className="font-bold text-emerald-700 text-sm">{averageScore} / 10</div>
                </div>
                <div>
                  <div className="text-slate-500 text-[10px]">Tỷ lệ Đạt</div>
                  <div className="font-bold text-slate-900 text-sm">{passRate}%</div>
                </div>
              </div>

              {/* Official Table */}
              <table className="w-full text-left text-xs border border-slate-300">
                <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-700 border-b border-slate-300">
                  <tr>
                    <th className="p-2 border-r border-slate-300 text-center w-8">STT</th>
                    <th className="p-2 border-r border-slate-300">Mã học sinh</th>
                    <th className="p-2 border-r border-slate-300">Họ và tên</th>
                    <th className="p-2 border-r border-slate-300 text-center">Điểm số</th>
                    <th className="p-2 border-r border-slate-300 text-center">Xếp loại</th>
                    <th className="p-2 border-r border-slate-300 text-center">Kết quả</th>
                    <th className="p-2 text-center">Chữ ký HS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {classStudents.map((s, idx) => {
                    const att = classAttempts.find((a) => a.studentId === s.id && a.status === 'submitted');
                    const score = att ? att.score : null;
                    let rating = '---';
                    if (score !== null) {
                      if (score >= 9.0) rating = 'Xuất sắc';
                      else if (score >= 8.0) rating = 'Giỏi';
                      else if (score >= 6.5) rating = 'Khá';
                      else if (score >= 5.0) rating = 'Trung bình';
                      else rating = 'Chưa đạt';
                    }

                    return (
                      <tr key={s.id} className="text-[11px]">
                        <td className="p-2 border-r border-slate-300 text-center font-mono">{idx + 1}</td>
                        <td className="p-2 border-r border-slate-300 font-mono">{s.studentCode}</td>
                        <td className="p-2 border-r border-slate-300 font-semibold">{s.fullName}</td>
                        <td className="p-2 border-r border-slate-300 text-center font-bold">
                          {score !== null ? score.toFixed(1) : '---'}
                        </td>
                        <td className="p-2 border-r border-slate-300 text-center">{rating}</td>
                        <td className="p-2 border-r border-slate-300 text-center">
                          {att ? (att.passed ? 'Đạt' : 'Chưa đạt') : 'Vắng'}
                        </td>
                        <td className="p-2 text-center text-slate-300 font-serif">..................</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Signatures */}
              <div className="grid grid-cols-2 pt-6 text-center text-xs">
                <div>
                  <div className="font-bold text-slate-800">HIỆU TRƯỞNG / BAN GIÁM HIỆU</div>
                  <div className="text-[10px] text-slate-400 italic">(Ký và ghi rõ họ tên)</div>
                  <div className="h-16"></div>
                  <div className="font-bold text-slate-800">TS. Nguyễn Hoàng Nam</div>
                </div>
                <div>
                  <div className="font-bold text-slate-800">GIÁO VIÊN CHỦ NHIỆM</div>
                  <div className="text-[10px] text-slate-400 italic">(Ký và ghi rõ họ tên)</div>
                  <div className="h-16"></div>
                  <div className="font-bold text-slate-800">{loggedTeacher.fullName}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
