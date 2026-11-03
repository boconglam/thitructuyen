import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Calendar, Plus, CheckCircle2, Clock, Check, ChevronRight } from 'lucide-react';

export const AcademicYearManagement: React.FC = () => {
  const { academicYears, addAcademicYear, setCurrentAcademicYear } = useApp();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    startDate: '',
    endDate: '',
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name || !formData.startDate || !formData.endDate) {
      alert('Vui lòng điền đầy đủ thông tin năm học.');
      return;
    }

    addAcademicYear({
      code: formData.code,
      name: formData.name,
      startDate: formData.startDate,
      endDate: formData.endDate,
      isCurrent: false,
      semesters: [
        {
          id: `sem-${Date.now()}-1`,
          name: 'Học kỳ I',
          startDate: formData.startDate,
          endDate: formData.startDate.slice(0, 4) + '-12-31',
          isCurrent: false,
        },
        {
          id: `sem-${Date.now()}-2`,
          name: 'Học kỳ II',
          startDate: formData.endDate.slice(0, 4) + '-01-01',
          endDate: formData.endDate,
          isCurrent: false,
        },
      ],
    });

    setIsAddOpen(false);
    setFormData({ code: '', name: '', startDate: '', endDate: '' });
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Quản lý Năm học & Học kỳ
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý các chu kỳ niên khóa, học kỳ và thiết lập năm học hoạt động chính thức của toàn trường
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Thêm năm học mới
        </button>
      </div>

      {/* Academic Year Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {academicYears.map((ay) => (
          <div
            key={ay.id}
            className={`bg-white rounded-xl border p-5 transition-all shadow-xs relative flex flex-col justify-between ${
              ay.isCurrent
                ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-linear-to-b from-indigo-50/30 to-white'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                  {ay.code}
                </span>

                {ay.isCurrent ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Đang áp dụng
                  </span>
                ) : (
                  <button
                    onClick={() => setCurrentAcademicYear(ay.id)}
                    className="text-xs font-semibold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 px-2.5 py-1 rounded-md transition-colors border border-slate-200 hover:border-indigo-200 cursor-pointer"
                  >
                    Kích hoạt áp dụng
                  </button>
                )}
              </div>

              <h3 className="text-base font-bold text-slate-900 mb-1">{ay.name}</h3>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-4">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Thời gian: {ay.startDate} đến {ay.endDate}
              </p>

              {/* Semesters list */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <div className="text-xs font-semibold uppercase text-slate-400 tracking-wider">Danh sách học kỳ:</div>
                {ay.semesters.map((sem) => (
                  <div
                    key={sem.id}
                    className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-slate-50 border border-slate-100 text-slate-700"
                  >
                    <span className="font-medium flex items-center gap-1.5">
                      <ChevronRight className="w-3 h-3 text-indigo-500" />
                      {sem.name}
                    </span>
                    <span className="text-slate-400">
                      {sem.startDate} ~ {sem.endDate}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Add Year */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              Thêm năm học mới
            </h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Mã năm học *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ví dụ: 2027-2028"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Tên hiển thị *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ví dụ: Năm học 2027 - 2028"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Ngày bắt đầu *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Ngày kết thúc *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer"
                >
                  Lưu năm học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
