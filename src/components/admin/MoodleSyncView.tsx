import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Cable, RefreshCw, CheckCircle2, Globe, Key, Settings, Server, Layers } from 'lucide-react';

export const MoodleSyncView: React.FC = () => {
  const { moodleConfig, updateMoodleConfig, triggerMoodleSync } = useApp();
  const [serverUrl, setServerUrl] = useState(moodleConfig.serverUrl);
  const [apiToken, setApiToken] = useState(moodleConfig.apiToken);
  const [syncCourses, setSyncCourses] = useState(moodleConfig.syncCourses);
  const [syncQuizzes, setSyncQuizzes] = useState(moodleConfig.syncQuizzes);
  const [syncGrades, setSyncGrades] = useState(moodleConfig.syncGrades);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMoodleConfig({
      serverUrl,
      apiToken,
      syncCourses,
      syncQuizzes,
      syncGrades,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Cable className="w-5 h-5 text-indigo-600" />
          Kết nối Moodle LMS (Tùy chọn)
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Đồng bộ khóa học, bài kiểm tra và kết quả qua Moodle REST API / Webservice. Cổng thi trực tuyến vẫn hoạt động độc lập.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Settings form */}
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4 text-slate-500" />
            Cấu hình WebService Moodle API
          </h3>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Địa chỉ máy chủ Moodle URL *
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="url"
                  required
                  placeholder="https://moodle.your-school.edu.vn"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Mã WebService Token (API Key) *
              </label>
              <div className="relative">
                <Key className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="wstoken_********************"
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                Các hạng mục đồng bộ 2 chiều:
              </label>
              <div className="space-y-2">
                {[
                  {
                    checked: syncCourses,
                    toggle: () => setSyncCourses(!syncCourses),
                    title: 'Đồng bộ Danh mục Khóa học (Courses & Categories)',
                  },
                  {
                    checked: syncQuizzes,
                    toggle: () => setSyncQuizzes(!syncQuizzes),
                    title: 'Đồng bộ Đề thi & Ngân hàng câu hỏi (Quizzes)',
                  },
                  {
                    checked: syncGrades,
                    toggle: () => setSyncGrades(!syncGrades),
                    title: 'Đồng bộ Điểm số & Xếp hạng vào Sổ điểm Moodle (Gradebook)',
                  },
                ].map((item, idx) => (
                  <label
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={item.toggle}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-slate-700">{item.title}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-xs text-slate-400">
                {isSaved && '✓ Đã lưu cài đặt kết nối'}
              </span>
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-xs cursor-pointer"
              >
                Lưu cấu hình Moodle
              </button>
            </div>
          </form>
        </div>

        {/* Sync Status Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Trạng thái kết nối</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Đã kết nối
              </span>
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-xs text-slate-500 mb-1">Máy chủ LMS:</div>
                <div className="text-xs font-mono font-semibold text-slate-800 truncate">
                  {moodleConfig.serverUrl}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-xs text-slate-500 mb-1">Đồng bộ gần nhất:</div>
                <div className="text-xs font-semibold text-slate-800">
                  {moodleConfig.lastSyncTime || 'Chưa thực hiện'}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={triggerMoodleSync}
            disabled={moodleConfig.status === 'syncing'}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${moodleConfig.status === 'syncing' ? 'animate-spin' : ''}`} />
            {moodleConfig.status === 'syncing' ? 'Đang đồng bộ...' : 'Đồng bộ dữ liệu ngay'}
          </button>
        </div>
      </div>
    </div>
  );
};
