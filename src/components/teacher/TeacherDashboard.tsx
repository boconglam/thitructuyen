import React, { useState } from 'react';
import { HelpCircle, FileText, Radio, BarChart3, School } from 'lucide-react';
import { QuestionBankManagement } from './QuestionBankManagement';
import { ExamManagement } from './ExamManagement';
import { LiveProctorMonitor } from './LiveProctorMonitor';
import { ReportsAndAnalytics } from '../reports/ReportsAndAnalytics';
import { HomeroomClassManagement } from './HomeroomClassManagement';

type TeacherTab = 'homeroom' | 'exams' | 'questions' | 'proctor' | 'reports';

export const TeacherDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TeacherTab>('homeroom');

  const tabs = [
    { id: 'homeroom', label: 'Quản trị Lớp chủ nhiệm & Báo cáo lớp', icon: School },
    { id: 'exams', label: 'Quản lý Cuộc thi & Đề thi', icon: FileText },
    { id: 'questions', label: 'Ngân hàng Câu hỏi', icon: HelpCircle },
    { id: 'proctor', label: 'Phòng Giám thị Trực tiếp', icon: Radio },
    { id: 'reports', label: 'Báo cáo & Phân tích toàn trường', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* Teacher sub-navigation bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-1.5 shadow-xs overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TeacherTab)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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

      {activeTab === 'homeroom' && <HomeroomClassManagement />}
      {activeTab === 'exams' && <ExamManagement />}
      {activeTab === 'questions' && <QuestionBankManagement />}
      {activeTab === 'proctor' && <LiveProctorMonitor />}
      {activeTab === 'reports' && <ReportsAndAnalytics />}
    </div>
  );
};
