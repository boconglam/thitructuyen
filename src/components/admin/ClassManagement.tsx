import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SchoolClass } from '../../types';
import {
  School,
  Plus,
  Users,
  Edit2,
  Trash2,
  Filter,
  Search,
  UserCheck,
  Lock,
  Unlock,
  AlertCircle,
  Shield,
} from 'lucide-react';

export const ClassManagement: React.FC = () => {
  const { classes, addClass, updateClass, deleteClass, toggleClassLock, teachers, currentAcademicYear } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [modalError, setModalError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    grade: 12,
    homeroomTeacherId: '',
    room: '',
    studentCount: 35,
    isLocked: false,
  });

  const filteredClasses = classes.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = gradeFilter === 'all' || c.grade === Number(gradeFilter);
    return matchesSearch && matchesGrade;
  });

  const handleOpenAdd = () => {
    setEditingClass(null);
    setModalError('');
    setFormData({
      name: '',
      grade: 12,
      homeroomTeacherId: teachers[0]?.id || '',
      room: '',
      studentCount: 35,
      isLocked: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: SchoolClass) => {
    setEditingClass(c);
    setModalError('');
    setFormData({
      name: c.name,
      grade: c.grade,
      homeroomTeacherId: c.homeroomTeacherId || '',
      room: c.room || '',
      studentCount: c.studentCount,
      isLocked: !!c.isLocked,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');
    if (!formData.name.trim()) {
      setModalError('Vui lòng nhập tên lớp.');
      return;
    }

    const teacher = teachers.find((t) => t.id === formData.homeroomTeacherId);

    if (editingClass) {
      updateClass(editingClass.id, {
        name: formData.name.trim(),
        grade: Number(formData.grade),
        homeroomTeacherId: formData.homeroomTeacherId,
        homeroomTeacherName: teacher?.fullName,
        room: formData.room,
        studentCount: Number(formData.studentCount),
        isLocked: formData.isLocked,
      });
    } else {
      addClass({
        name: formData.name.trim(),
        grade: Number(formData.grade),
        academicYearId: currentAcademicYear.id,
        homeroomTeacherId: formData.homeroomTeacherId,
        homeroomTeacherName: teacher?.fullName,
        room: formData.room,
        studentCount: Number(formData.studentCount),
        isLocked: formData.isLocked,
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <School className="w-5 h-5 text-indigo-600" />
            Quản lý Danh sách Lớp học ({currentAcademicYear.name})
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý các phân lớp theo khối, phân công giáo viên chủ nhiệm và sĩ số học sinh
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Thêm lớp học mới
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên lớp (12A1, 11B2...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
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
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredClasses.map((c) => (
          <div
            key={c.id}
            className={`bg-white rounded-xl border p-5 shadow-xs transition-all flex flex-col justify-between ${
              c.isLocked ? 'border-amber-200 bg-amber-50/10' : 'border-slate-200 hover:border-indigo-200 hover:shadow-md'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Khối {c.grade}
                </span>
                {c.isLocked ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    <Lock className="w-3 h-3 text-rose-600" />
                    Đã khóa danh sách
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Unlock className="w-3 h-3 text-emerald-600" />
                    Đang mở
                  </span>
                )}
              </div>

              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">Lớp {c.name}</h3>

              <div className="space-y-2 text-sm text-slate-600 mb-4">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-slate-400" />
                  <span>
                    GVCN:{' '}
                    <strong className="text-slate-800">
                      {c.homeroomTeacherName || 'Chưa phân công'}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span>Sĩ số: <strong className="text-indigo-600">{c.studentCount}</strong> học sinh</span>
                </div>
                <div className="text-xs text-slate-400">
                  Phòng: <span className="text-slate-600 font-medium">{c.room || 'Chưa xếp phòng'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => toggleClassLock(c.id)}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                  c.isLocked
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200'
                }`}
                title={c.isLocked ? 'Mở khóa danh sách lớp' : 'Khóa sổ danh sách lớp'}
              >
                {c.isLocked ? <Unlock className="w-3.5 h-3.5 text-slate-600" /> : <Lock className="w-3.5 h-3.5 text-amber-600" />}
                <span>{c.isLocked ? 'Mở khóa' : 'Khóa sổ lớp'}</span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleOpenEdit(c)}
                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                  title="Sửa lớp học"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Bạn có chắc muốn xóa lớp ${c.name}?`)) {
                      deleteClass(c.id);
                    }
                  }}
                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Xóa lớp học"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <School className="w-5 h-5 text-indigo-600" />
              {editingClass ? `Chỉnh sửa lớp ${editingClass.name}` : 'Thêm lớp học mới'}
            </h3>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Tên lớp *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ví dụ: 12A1"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Khối *
                  </label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value={12}>Khối 12</option>
                    <option value={11}>Khối 11</option>
                    <option value={10}>Khối 10</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Giáo viên chủ nhiệm (GVCN)
                </label>
                <select
                  value={formData.homeroomTeacherId}
                  onChange={(e) => setFormData({ ...formData, homeroomTeacherId: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="">-- Chưa phân công --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} ({t.subject} - {t.teacherCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Phòng học
                  </label>
                  <input
                    type="text"
                    placeholder="ví dụ: Phòng 301 - Khu A"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Sĩ số học sinh
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={formData.studentCount}
                    onChange={(e) => setFormData({ ...formData, studentCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Lock class checkbox */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Khóa sổ danh sách lớp</span>
                  <span className="text-[11px] text-slate-500">Khóa lớp để ngăn chặn thêm bớt hoặc đổi học sinh</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.isLocked}
                  onChange={(e) => setFormData({ ...formData, isLocked: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer"
                >
                  {editingClass ? 'Lưu thay đổi' : 'Tạo lớp học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
