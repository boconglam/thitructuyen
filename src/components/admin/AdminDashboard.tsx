import React, { useState } from 'react';
import {
  Shield,
  Calendar,
  School,
  GraduationCap,
  Briefcase,
  FileSpreadsheet,
  Database,
  History,
  Cable,
  FileText,
  HelpCircle,
  BarChart3,
  Radio,
} from 'lucide-react';
import { AccountManagement } from './AccountManagement';
import { AcademicYearManagement } from './AcademicYearManagement';
import { ClassManagement } from './ClassManagement';
import { StudentManagement } from './StudentManagement';
import { TeacherManagement } from './TeacherManagement';
import { ExcelImportView } from './ExcelImportView';
import { BackupRestoreView } from './BackupRestoreView';
import { AuditLogsView } from './AuditLogsView';
import { MoodleSyncView } from './MoodleSyncView';
import { ExamManagement } from '../teacher/ExamManagement';
import { QuestionBankManagement } from '../teacher/QuestionBankManagement';
import { LiveProctorMonitor } from '../teacher/LiveProctorMonitor';
import { ReportsAndAnalytics } from '../reports/ReportsAndAnalytics';

type AdminTab =
  | 'accounts'
  | 'academicYears'
  | 'classes'
  | 'students'
  | 'teachers'
  | 'exams'
  | 'questions'
  | 'liveMonitoring'
  | 'reports'
  | 'excelImport'
  | 'backup'
  | 'auditLogs'
  | 'moodle';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('accounts');

  const tabs = [
    { id: 'accounts', label: 'Tài khoản & Phân quyền', icon: Shield },
    { id: 'academicYears', label: 'Năm học & Học kỳ', icon: Calendar },
    { id: 'classes', label: 'Danh sách Lớp (Khóa/Mở)', icon: School },
    { id: 'students', label: 'Quản lý Học sinh & Mã duy nhất', icon: GraduationCap },
    { id: 'teachers', label: 'Quản lý Giáo viên', icon: Briefcase },
    { id: 'exams', label: 'Quản lý Đề thi & Mã đề', icon: FileText },
    { id: 'questions', label: 'Ngân hàng Câu hỏi', icon: HelpCircle },
    { id: 'liveMonitoring', label: 'Theo dõi Trực tiếp (Live)', icon: Radio },
    { id: 'reports', label: 'Kết quả, Xếp hạng & Khóa kết quả', icon: BarChart3 },
    { id: 'excelImport', label: 'Nhập dữ liệu Excel', icon: FileSpreadsheet },
    { id: 'backup', label: 'Sao lưu & Khôi phục', icon: Database },
    { id: 'auditLogs', label: 'Lịch sử thao tác', icon: History },
    { id: 'moodle', label: 'Kết nối Moodle', icon: Cable },
  ];

  return (
    <div className="space-y-6">
      {/* Admin horizontal tab bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-1.5 shadow-xs overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Render active module */}
      {activeTab === 'accounts' && <AccountManagement />}
      {activeTab === 'academicYears' && <AcademicYearManagement />}
      {activeTab === 'classes' && <ClassManagement />}
      {activeTab === 'students' && <StudentManagement />}
      {activeTab === 'teachers' && <TeacherManagement />}
      {activeTab === 'exams' && <ExamManagement />}
      {activeTab === 'questions' && <QuestionBankManagement />}
      {activeTab === 'liveMonitoring' && <LiveProctorMonitor />}
      {activeTab === 'reports' && <ReportsAndAnalytics />}
      {activeTab === 'excelImport' && <ExcelImportView />}
      {activeTab === 'backup' && <BackupRestoreView />}
      {activeTab === 'auditLogs' && <AuditLogsView />}
      {activeTab === 'moodle' && <MoodleSyncView />}
    </div>
  );
};
