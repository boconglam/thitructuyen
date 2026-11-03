import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Student } from '../../types';
import {
  GraduationCap,
  UserPlus,
  Search,
  Filter,
  Download,
  Edit2,
  Trash2,
  Award,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Lock,
} from 'lucide-react';
import { exportToExcel } from '../../utils/excelHelper';

export const StudentManagement: React.FC = () => {
  const {
    students,
    classes,
    addStudent,
    updateStudent,
    deleteStudent,
    bulkDeleteStudents,
    isStudentCodeUnique,
    generateUniqueStudentCode,
  } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    studentCode: '',
    fullName: '',
    classId: classes[0]?.id || '',
    gender: 'Nam' as 'Nam' | 'Nữ',
    dateOfBirth: '2008-01-01',
    email: '',
    phone: '',
    parentPhone: '',
    address: '',
    status: 'active' as 'active' | 'suspended' | 'graduated',
  });

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = classFilter === 'all' || s.classId === classFilter;
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesClass && matchesStatus;
  });

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormError('');
    const uniqueCode = generateUniqueStudentCode();
    setFormData({
      studentCode: uniqueCode,
      fullName: '',
      classId: classes[0]?.id || '',
      gender: 'Nam',
      dateOfBirth: '2008-05-15',
      email: '',
      phone: '',
      parentPhone: '',
      address: '',
      status: 'active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Student) => {
    setEditingStudent(s);
    setFormError('');
    setFormData({
      studentCode: s.studentCode,
      fullName: s.fullName,
      classId: s.classId,
      gender: s.gender,
      dateOfBirth: s.dateOfBirth,
      email: s.email,
      phone: s.phone,
      parentPhone: s.parentPhone || '',
      address: s.address || '',
      status: s.status,
    });
    setIsModalOpen(true);
  };

  const handleAutoGenerateCode = () => {
    const code = generateUniqueStudentCode();
    setFormData((prev) => ({ ...prev, studentCode: code }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanCode = formData.studentCode.trim().toUpperCase();
    if (!cleanCode || !formData.fullName.trim()) {
      setFormError('Vui lòng điền đủ Mã học sinh và Họ tên.');
      return;
    }

    // Enforce student code uniqueness
    const isUnique = isStudentCodeUnique(cleanCode, editingStudent?.id);
    if (!isUnique) {
      setFormError(`Mã học sinh "${cleanCode}" đã tồn tại trong hệ thống! Vui lòng chọn mã khác hoặc bấm tạo mã tự động.`);
      return;
    }

    const targetClass = classes.find((c) => c.id === formData.classId);
    if (!targetClass) {
      setFormError('Vui lòng chọn lớp học hợp lệ.');
      return;
    }

    // Check if target class is locked
    if (targetClass.isLocked && (!editingStudent || editingStudent.classId !== targetClass.id)) {
      setFormError(`Lớp ${targetClass.name} đã được khóa sổ danh sách! Không thể thêm hoặc chuyển học sinh vào lớp này.`);
      return;
    }

    const className = targetClass.name;

    if (editingStudent) {
      updateStudent(editingStudent.id, {
        ...formData,
        studentCode: cleanCode,
        fullName: formData.fullName.trim(),
        className,
      });
    } else {
      addStudent({
        ...formData,
        studentCode: cleanCode,
        fullName: formData.fullName.trim(),
        className,
        totalPoints: 0,
        examCount: 0,
        rank: students.length + 1,
      });
    }

    setIsModalOpen(false);
  };

  const handleExport = () => {
    const exportData = filteredStudents.map((s, idx) => ({
      'STT': idx + 1,
      'Mã học sinh': s.studentCode,
      'Họ và tên': s.fullName,
      'Lớp': s.className,
      'Giới tính': s.gender,
      'Ngày sinh': s.dateOfBirth,
      'Email': s.email,
      'Số điện thoại': s.phone,
      'Điện thoại phụ huynh': s.parentPhone || '',
      'Địa chỉ': s.address || '',
      'Số bài thi đã làm': s.examCount,
      'Tổng điểm thi': s.totalPoints,
      'Trạng thái': s.status === 'active' ? 'Đang học' : 'Tạm khóa',
    }));

    exportToExcel(exportData, `Danh_Sach_Hoc_Sinh_${new Date().toISOString().slice(0, 10)}`);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-indigo-600" />
            Quản lý Hồ sơ Học sinh ({students.length} học sinh)
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Tra cứu lý lịch, kết quả thi cử, điểm thi đua và trạng thái tham gia thi trực tuyến
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
            <UserPlus className="w-4 h-4" />
            Thêm học sinh
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo mã học sinh, họ tên, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="all">Tất cả lớp</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                Lớp {c.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang học</option>
            <option value="suspended">Tạm đình chỉ</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedStudentIds.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-800">
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
            <span>Đang chọn {selectedStudentIds.length} học sinh</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedStudentIds([])}
              className="px-3 py-1.5 bg-white text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
            >
              Bỏ chọn
            </button>
            <button
              onClick={() => {
                if (confirm(`Bạn có chắc chắn muốn xóa ${selectedStudentIds.length} học sinh đã chọn? Thao tác này không thể hoàn tác.`)) {
                  bulkDeleteStudents(selectedStudentIds);
                  setSelectedStudentIds([]);
                }
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa hàng loạt ({selectedStudentIds.length}) học sinh</span>
            </button>
          </div>
        </div>
      )}

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStudentIds(filteredStudents.map((s) => s.id));
                      } else {
                        setSelectedStudentIds([]);
                      }
                    }}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4">Mã HS & Họ tên</th>
                <th className="py-3.5 px-4">Lớp</th>
                <th className="py-3.5 px-4">Giới tính / Ngày sinh</th>
                <th className="py-3.5 px-4">Liên hệ</th>
                <th className="py-3.5 px-4 text-center">Bài thi / Điểm</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((s) => (
                <tr
                  key={s.id}
                  className={`hover:bg-slate-50/70 transition-colors ${
                    selectedStudentIds.includes(s.id) ? 'bg-indigo-50/40' : ''
                  }`}
                >
                  <td className="py-3.5 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.includes(s.id)}
                      onChange={() => {
                        setSelectedStudentIds((prev) =>
                          prev.includes(s.id) ? prev.filter((id) => id !== s.id) : [...prev, s.id]
                        );
                      }}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs border border-emerald-100">
                        {s.fullName.slice(-1)}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{s.fullName}</div>
                        <div className="text-xs font-mono font-medium text-indigo-600">{s.studentCode}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700">{s.className}</td>
                  <td className="py-3.5 px-4">
                    <div>{s.gender}</div>
                    <div className="text-xs text-slate-400">{s.dateOfBirth}</div>
                  </td>
                  <td className="py-3.5 px-4 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {s.email}
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400 mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {s.phone}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="font-bold text-slate-800">{s.totalPoints} đ</div>
                    <div className="text-xs text-slate-400">{s.examCount} bài thi</div>
                  </td>
                  <td className="py-3.5 px-4">
                    {s.status === 'active' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Đang học
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        Đình chỉ
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        title="Chỉnh sửa hồ sơ"
                        onClick={() => handleOpenEdit(s)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        title="Xóa học sinh"
                        onClick={() => {
                          if (confirm(`Bạn có chắc chắn muốn xóa học sinh ${s.fullName}?`)) {
                            deleteStudent(s.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit Student */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
              {editingStudent ? `Chỉnh sửa hồ sơ ${editingStudent.fullName}` : 'Thêm học sinh mới'}
            </h3>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Mã học sinh (Duy nhất) *
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoGenerateCode}
                      className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 cursor-pointer"
                      title="Tạo mã học sinh duy nhất tự động"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Tạo mã mới</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="ví dụ: HS2026-001"
                    value={formData.studentCode}
                    onChange={(e) => setFormData({ ...formData, studentCode: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono font-semibold"
                  />
                  {/* Uniqueness feedback */}
                  {formData.studentCode.trim() && (
                    <div className="mt-1">
                      {isStudentCodeUnique(formData.studentCode, editingStudent?.id) ? (
                        <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Mã hợp lệ & duy nhất
                        </span>
                      ) : (
                        <span className="text-[10px] text-rose-600 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Mã đã tồn tại trong hệ thống!
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Lớp học *
                  </label>
                  <select
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} (Khối {c.grade}) {c.isLocked ? '• [🔒 Đã khóa sổ]' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ví dụ: Nguyễn Tuấn Anh"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Giới tính
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'Nam' | 'Nữ' })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Ngày sinh
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="email@tdc3htp.edu.vn"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    placeholder="0356..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Điện thoại phụ huynh
                </label>
                <input
                  type="tel"
                  placeholder="0912..."
                  value={formData.parentPhone}
                  onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Địa chỉ thường trú
                </label>
                <input
                  type="text"
                  placeholder="Số nhà, đường, quận/huyện..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
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
                  {editingStudent ? 'Lưu thay đổi' : 'Thêm học sinh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
