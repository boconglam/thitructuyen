import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AuditLog, AuditAction, AuditModule } from '../../types';
import { History, Search, Filter, Download, ShieldAlert, CheckCircle, AlertTriangle, UserCheck } from 'lucide-react';
import { exportToExcel } from '../../utils/excelHelper';

export const AuditLogsView: React.FC = () => {
  const { auditLogs } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ipAddress.includes(searchTerm);
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesModule = moduleFilter === 'all' || log.module === moduleFilter;
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    return matchesSearch && matchesAction && matchesModule && matchesStatus;
  });

  const handleExport = () => {
    const exportData = filteredLogs.map((l, idx) => ({
      'STT': idx + 1,
      'Thời gian': l.timestamp,
      'Người thực hiện': l.actorName,
      'Vai trò': l.actorRole,
      'Hành động': l.action,
      'Phân hệ': l.module,
      'Mô tả chi tiết': l.description,
      'Địa chỉ IP': l.ipAddress,
      'Mức độ': l.status,
    }));

    exportToExcel(exportData, `Nhat_Ky_Lich_Su_Thao_Tac_${new Date().toISOString().slice(0, 10)}`);
  };

  const getStatusBadge = (status: AuditLog['status']) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            Thành công
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Cảnh báo
          </span>
        );
      case 'DANGER':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <ShieldAlert className="w-3 h-3 text-rose-600" />
            Nguy cơ / Đình chỉ
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            Theo dõi Nhật ký Lịch sử Thao tác & An ninh
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Ghi vết mọi hoạt động đăng nhập, sửa đổi đề thi, thay đổi cấu hình và sự kiện vi phạm an ninh phòng thi
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-xs cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Xuất tệp Excel (.xlsx)
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo nội dung mô tả, người thực hiện, địa chỉ IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="all">Tất cả hành động</option>
            <option value="LOGIN">Đăng nhập (LOGIN)</option>
            <option value="CREATE">Tạo mới (CREATE)</option>
            <option value="UPDATE">Cập nhật (UPDATE)</option>
            <option value="DELETE">Xóa (DELETE)</option>
            <option value="SECURITY_VIOLATION">Vi phạm bảo mật (SECURITY)</option>
            <option value="DISQUALIFY">Đình chỉ thi (DISQUALIFY)</option>
            <option value="IMPORT">Nhập dữ liệu (IMPORT)</option>
            <option value="BACKUP">Sao lưu (BACKUP)</option>
          </select>

          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="all">Tất cả phân hệ</option>
            <option value="PROCTORING">Giám thị & An ninh (PROCTORING)</option>
            <option value="EXAM">Cuộc thi / Đề thi (EXAM)</option>
            <option value="QUESTION_BANK">Ngân hàng câu hỏi (BANK)</option>
            <option value="USER">Tài khoản & Phân quyền (USER)</option>
            <option value="STUDENT">Học sinh (STUDENT)</option>
            <option value="TEACHER">Giáo viên (TEACHER)</option>
            <option value="SYSTEM">Hệ thống (SYSTEM)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="all">Mức độ an ninh</option>
            <option value="SUCCESS">Thành công (SUCCESS)</option>
            <option value="WARNING">Cảnh báo (WARNING)</option>
            <option value="DANGER">Nguy hiểm (DANGER)</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4">Người thực hiện</th>
                <th className="py-3 px-4">Phân hệ & Hành động</th>
                <th className="py-3 px-4">Nội dung chi tiết</th>
                <th className="py-3 px-4">Địa chỉ IP</th>
                <th className="py-3 px-4">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className={`hover:bg-slate-50 transition-colors ${
                    log.status === 'DANGER'
                      ? 'bg-rose-50/30'
                      : log.status === 'WARNING'
                      ? 'bg-amber-50/30'
                      : ''
                  }`}
                >
                  <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-semibold text-slate-800">{log.actorName}</div>
                    <div className="text-[11px] text-slate-400 capitalize">{log.actorRole}</div>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px] border border-indigo-100">
                      {log.module}
                    </span>
                    <span className="ml-1.5 text-slate-500 font-mono text-[11px] font-semibold">{log.action}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-700 leading-relaxed font-medium">
                    {log.description}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">{log.ipAddress}</td>
                  <td className="py-3 px-4 whitespace-nowrap">{getStatusBadge(log.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
