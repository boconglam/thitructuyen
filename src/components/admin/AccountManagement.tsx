import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User, UserRole, UserPermissions } from '../../types';
import {
  Shield,
  UserPlus,
  Key,
  Lock,
  Unlock,
  Trash2,
  Edit2,
  CheckCircle,
  Search,
  Filter,
  CheckSquare,
  Square,
  AlertTriangle,
  X,
} from 'lucide-react';

export const AccountManagement: React.FC = () => {
  const {
    users,
    addUser,
    updateUser,
    deleteUser,
    bulkDeleteUsers,
    toggleUserStatus,
    updateUserPermissions,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedUserForPerms, setSelectedUserForPerms] = useState<User | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // New user form state
  const [newUser, setNewUser] = useState({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    role: 'teacher' as UserRole,
  });

  // Edit user form state
  const [editFormData, setEditFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    role: 'teacher' as UserRole,
    status: 'active' as 'active' | 'locked',
  });

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Non-admin selectable users
  const selectableFilteredUsers = filteredUsers.filter((u) => u.username !== 'admin');
  const isAllSelected =
    selectableFilteredUsers.length > 0 &&
    selectableFilteredUsers.every((u) => selectedUserIds.includes(u.id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(selectableFilteredUsers.map((u) => u.id));
    }
  };

  const handleToggleSelectUser = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedUserIds.length === 0) return;
    if (
      confirm(
        `CẢNH BÁO: Bạn có chắc chắn muốn xóa vĩnh viễn ${selectedUserIds.length} tài khoản đã chọn khỏi hệ thống?`
      )
    ) {
      bulkDeleteUsers(selectedUserIds);
      setSelectedUserIds([]);
    }
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      status: user.status,
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editFormData.username || !editFormData.fullName || !editFormData.email) {
      alert('Vui lòng điền đủ thông tin bắt buộc.');
      return;
    }

    updateUser(editingUser.id, {
      username: editFormData.username,
      fullName: editFormData.fullName,
      email: editFormData.email,
      phone: editFormData.phone,
      role: editFormData.role,
      status: editFormData.status,
    });

    setEditingUser(null);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username || !newUser.fullName || !newUser.email) {
      alert('Vui lòng điền đủ thông tin bắt buộc.');
      return;
    }

    const defaultPerms: UserPermissions = {
      canManageUsers: newUser.role === 'admin',
      canManageAcademicYears: newUser.role === 'admin',
      canManageClasses: newUser.role === 'admin',
      canManageStudents: newUser.role === 'admin',
      canManageTeachers: newUser.role === 'admin',
      canManageQuestionBank: newUser.role === 'admin' || newUser.role === 'teacher',
      canCreateExams: newUser.role === 'admin' || newUser.role === 'teacher',
      canProctorExams: newUser.role !== 'student',
      canViewReports: newUser.role !== 'student',
      canExportData: newUser.role === 'admin' || newUser.role === 'teacher',
      canBackupRestore: newUser.role === 'admin',
    };

    addUser({
      username: newUser.username,
      fullName: newUser.fullName,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      status: 'active',
      permissions: defaultPerms,
    });

    setIsCreateOpen(false);
    setNewUser({ username: '', fullName: '', email: '', phone: '', role: 'teacher' });
  };

  const roleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">👑 Quản trị viên</span>;
      case 'teacher':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">🎓 Giáo viên</span>;
      case 'proctor':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">🛡️ Giám thị</span>;
      case 'student':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">🎒 Học sinh</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            Quản lý Tài khoản & Phân quyền Hệ thống
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Thiết lập vai trò, chỉnh sửa hồ sơ người dùng, xóa hàng loạt và phân quyền bảo mật chi tiết
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-xs cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Thêm tài khoản mới
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên đăng nhập, họ tên, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="all">Tất cả vai trò</option>
            <option value="admin">Quản trị viên (Admin)</option>
            <option value="teacher">Giáo viên</option>
            <option value="proctor">Cán bộ giám thị</option>
            <option value="student">Học sinh</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Bar when users are selected */}
      {selectedUserIds.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-800">
            <CheckSquare className="w-4 h-4 text-rose-600" />
            <span>Đã chọn {selectedUserIds.length} tài khoản</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedUserIds([])}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-white border border-slate-200 transition-colors cursor-pointer"
            >
              Hủy chọn
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-xs transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Xóa {selectedUserIds.length} tài khoản đã chọn
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    title="Chọn tất cả tài khoản"
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4">Tài khoản & Họ tên</th>
                <th className="py-3.5 px-4">Email / Điện thoại</th>
                <th className="py-3.5 px-4">Vai trò</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4">Đăng nhập gần nhất</th>
                <th className="py-3.5 px-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => {
                const isSelected = selectedUserIds.includes(u.id);
                const isPrimaryAdmin = u.username === 'admin';

                return (
                  <tr
                    key={u.id}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      isSelected ? 'bg-indigo-50/30' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center">
                      {!isPrimaryAdmin ? (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectUser(u.id)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold" title="Tài khoản Quản trị gốc không thể chọn xóa">
                          🔒
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm border border-indigo-100">
                          {u.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{u.fullName}</div>
                          <div className="text-xs text-slate-400 font-mono">@{u.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-700">{u.email}</div>
                      <div className="text-xs text-slate-400">{u.phone || 'Chưa cập nhật'}</div>
                    </td>
                    <td className="py-3.5 px-4">{roleBadge(u.role)}</td>
                    <td className="py-3.5 px-4">
                      {u.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Đang hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                          Đang bị khóa
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">{u.lastLogin || 'Chưa đăng nhập'}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Edit Account button */}
                        <button
                          title="Chỉnh sửa tài khoản"
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {/* Permissions button */}
                        <button
                          title="Phân quyền chi tiết"
                          onClick={() => setSelectedUserForPerms(u)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        {/* Lock/Unlock */}
                        <button
                          title={u.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                          onClick={() => toggleUserStatus(u.id)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            u.status === 'active'
                              ? 'text-slate-600 hover:text-amber-600 hover:bg-amber-50'
                              : 'text-amber-600 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {u.status === 'active' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </button>
                        {/* Delete Single Account */}
                        {!isPrimaryAdmin && (
                          <button
                            title="Xóa tài khoản"
                            onClick={() => {
                              if (confirm(`Bạn có chắc chắn muốn xóa tài khoản @${u.username}?`)) {
                                deleteUser(u.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Edit User (Chỉnh sửa tài khoản) */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-600" />
                Chỉnh sửa tài khoản người dùng
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Tên đăng nhập *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.username}
                  onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.fullName}
                  onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Vai trò hệ thống *
                  </label>
                  <select
                    value={editFormData.role}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="admin">Quản trị viên (Admin)</option>
                    <option value="teacher">Giáo viên</option>
                    <option value="proctor">Cán bộ giám thị</option>
                    <option value="student">Học sinh</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Trạng thái hoạt động
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value as 'active' | 'locked' })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="active">Đang hoạt động</option>
                    <option value="locked">Bị khóa</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create User */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-600" />
              Thêm tài khoản người dùng mới
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Tên đăng nhập *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ví dụ: gv_nguyenvana"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Họ và tên *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ví dụ: Nguyễn Văn An"
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="email@tdc3htp.edu.vn"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    placeholder="0912..."
                    value={newUser.phone}
                    onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Vai trò hệ thống *
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="teacher">Giáo viên</option>
                  <option value="proctor">Cán bộ coi thi (Giám thị)</option>
                  <option value="student">Học sinh</option>
                  <option value="admin">Quản trị viên (SuperAdmin)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer"
                >
                  Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Permission Management */}
      {selectedUserForPerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Key className="w-5 h-5 text-indigo-600" />
                  Phân quyền chi tiết
                </h3>
                <p className="text-xs text-slate-500">
                  Tài khoản: <span className="font-semibold text-slate-700">{selectedUserForPerms.fullName}</span> (@{selectedUserForPerms.username})
                </p>
              </div>
              {roleBadge(selectedUserForPerms.role)}
            </div>

            <div className="space-y-3">
              {[
                { key: 'canManageUsers', label: 'Quản lý Tài khoản & Phân quyền', desc: 'Tạo, sửa, khóa và xóa người dùng' },
                { key: 'canManageAcademicYears', label: 'Quản lý Năm học', desc: 'Thêm, kích hoạt và cấu hình học kỳ' },
                { key: 'canManageClasses', label: 'Quản lý Danh sách Lớp', desc: 'Tạo lớp và gán giáo viên chủ nhiệm' },
                { key: 'canManageStudents', label: 'Quản lý Học sinh & Hồ sơ', desc: 'Thêm sửa xóa thông tin học sinh' },
                { key: 'canManageTeachers', label: 'Quản lý Giáo viên', desc: 'Thêm sửa xóa hồ sơ giáo viên bộ môn' },
                { key: 'canManageQuestionBank', label: 'Quản lý Ngân hàng câu hỏi', desc: 'Tạo, biên tập, nhập câu hỏi từ Excel' },
                { key: 'canCreateExams', label: 'Tạo & Quản lý Đề thi / Cuộc thi', desc: 'Lập lịch thi, cấu hình chống gian lận' },
                { key: 'canProctorExams', label: 'Giám thị & Cảnh báo gian lận', desc: 'Truy cập phòng giám thị, gửi cảnh báo' },
                { key: 'canViewReports', label: 'Xem Báo cáo & Thống kê kết quả', desc: 'Phổ điểm, tỷ lệ đạt, xếp hạng thi đua' },
                { key: 'canExportData', label: 'Xuất dữ liệu Excel', desc: 'Tải báo cáo kết quả thi và danh sách' },
                { key: 'canBackupRestore', label: 'Sao lưu & Khôi phục dữ liệu', desc: 'Tải bản sao lưu JSON và khôi phục' },
              ].map(({ key, label, desc }) => {
                const k = key as keyof UserPermissions;
                const isChecked = selectedUserForPerms.permissions[k];
                return (
                  <div
                    key={key}
                    onClick={() => {
                      const updated = {
                        ...selectedUserForPerms.permissions,
                        [k]: !isChecked,
                      };
                      setSelectedUserForPerms({
                        ...selectedUserForPerms,
                        permissions: updated,
                      });
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      isChecked
                        ? 'bg-indigo-50/50 border-indigo-200'
                        : 'bg-slate-50 border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div>
                      <div className="font-semibold text-sm text-slate-800">{label}</div>
                      <div className="text-xs text-slate-500">{desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-5">
              <button
                type="button"
                onClick={() => setSelectedUserForPerms(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  updateUserPermissions(selectedUserForPerms.id, selectedUserForPerms.permissions);
                  setSelectedUserForPerms(null);
                }}
                className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer"
              >
                Lưu quyền hạn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
