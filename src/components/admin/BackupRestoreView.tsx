import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Database, Download, Upload, RefreshCw, AlertTriangle, CheckCircle2, ShieldCheck, History, Flame } from 'lucide-react';

export const BackupRestoreView: React.FC = () => {
  const {
    exportBackup,
    restoreBackup,
    resetToDefaults,
    users,
    students,
    teachers,
    questions,
    exams,
    attempts,
    auditLogs,
    firebaseStatus,
    lastFirebaseSync,
    syncToFirebase,
  } = useApp();

  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suggestedNames = [
    `TDC3HTP_SaoLuu_ToanHeThong_${todayStr}.json`,
    `TDC3HTP_DuLieuHocKy1_2025_2026.json`,
    `TDC3HTP_NganHangCauHoi_Va_DeThi_${todayStr}.json`,
    `TDC3HTP_NhatKyGiamSat_ChongGianLan_${todayStr}.json`,
  ];
  const [customFilename, setCustomFilename] = useState(suggestedNames[0]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setRestoreFile(f);
  };

  const handleExecuteRestore = () => {
    if (!restoreFile) {
      alert('Vui lòng chọn tệp tin sao lưu (.json).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        const success = restoreBackup(json);
        if (success) {
          setRestoreStatus('Khôi phục cơ sở dữ liệu thành công! Tất cả các phân hệ đã được đồng bộ.');
          setRestoreFile(null);
        }
      } catch (err: any) {
        alert('Tệp sao lưu không đúng định dạng JSON: ' + err.message);
      }
    };
    reader.readAsText(restoreFile);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-600" />
          Sao lưu và Khôi phục Dữ liệu Trung tâm
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Bảo vệ toàn vẹn dữ liệu hệ thống: Tài khoản, Đề thi, Ngân hàng câu hỏi, Kết quả thi và Lịch sử giám sát
        </p>
      </div>

      {/* System Data Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Tài khoản', count: users.length },
          { label: 'Học sinh', count: students.length },
          { label: 'Giáo viên', count: teachers.length },
          { label: 'Câu hỏi', count: questions.length },
          { label: 'Cuộc thi', count: exams.length },
          { label: 'Bài thi nộp', count: attempts.length },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs text-center">
            <div className="text-xs text-slate-400 font-semibold uppercase">{stat.label}</div>
            <div className="text-2xl font-black text-indigo-600 mt-1">{stat.count}</div>
          </div>
        ))}
      </div>

      {/* Firebase Cloud Sync Card */}
      <div className="bg-linear-to-r from-amber-500/10 via-amber-600/5 to-indigo-50/50 rounded-2xl border border-amber-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
            <Flame className="w-6 h-6 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-extrabold text-slate-900 text-base">Đồng bộ Đám mây Firebase Firestore</h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Đã kết nối Cloud
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
              Cơ sở dữ liệu được đồng bộ hóa trực tiếp lên máy chủ <strong>firebase.google.com</strong> (Dự án: <code className="bg-white px-1.5 py-0.5 rounded text-amber-900 font-mono text-[11px] border border-amber-200">wise-compiler-761jg</code>).
              {lastFirebaseSync && ` Đồng bộ gần nhất lúc: ${lastFirebaseSync}.`}
            </p>
          </div>
        </div>

        <button
          onClick={async () => {
            const ok = await syncToFirebase();
            if (ok) {
              setRestoreStatus('Đã đồng bộ toàn bộ cơ sở dữ liệu lên Firebase Firestore thành công!');
            }
          }}
          disabled={firebaseStatus === 'syncing'}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all shrink-0 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${firebaseStatus === 'syncing' ? 'animate-spin' : ''}`} />
          <span>{firebaseStatus === 'syncing' ? 'Đang tải lên Firestore...' : 'Đồng bộ lên Firebase ngay'}</span>
        </button>
      </div>

      {/* Action Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Backup Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Tạo bản sao lưu dữ liệu hệ thống</h3>
            <p className="text-sm text-slate-600 mb-3 leading-relaxed">
              Xuất toàn bộ trạng thái cơ sở dữ liệu hiện tại (bao gồm cả nhật ký vi phạm và đề thi) thành một tệp tin
              JSON an toàn được mã hóa chuẩn hóa. Khuyến nghị sao lưu trước mỗi kỳ thi lớn.
            </p>

            {/* Custom Filename & Suggestions */}
            <div className="space-y-2 mb-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Tên file dữ liệu khi lưu:
              </label>
              <input
                type="text"
                placeholder="Nhập tên tệp (ví dụ: TDC3HTP_SaoLuu_2026.json)..."
                value={customFilename}
                onChange={(e) => setCustomFilename(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />

              <div>
                <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                  💡 Gợi ý tên file chuẩn hóa (bấm để chọn):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedNames.map((sug, sIdx) => (
                    <button
                      key={sIdx}
                      type="button"
                      onClick={() => setCustomFilename(sug)}
                      className={`text-[11px] px-2 py-1 rounded-md font-mono border transition-all cursor-pointer ${
                        customFilename === sug
                          ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                          : 'bg-white hover:bg-indigo-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => exportBackup(customFilename)}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Tải tệp sao lưu ({customFilename || 'Mặc định'})
          </button>
        </div>

        {/* Restore Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Khôi phục dữ liệu từ tệp sao lưu</h3>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              Chọn tệp sao lưu JSON đã tải về trước đó để phục hồi lại trạng thái hệ thống. Dữ liệu hiện tại sẽ được thay
              thế bằng nội dung trong tệp sao lưu.
            </p>

            <div className="border border-dashed border-slate-300 rounded-xl p-3.5 mb-4 text-center bg-slate-50">
              <input
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
              />
              {restoreFile && (
                <div className="text-xs font-semibold text-indigo-600 mt-2">
                  Đã nạp file: {restoreFile.name} ({Math.round(restoreFile.size / 1024)} KB)
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleExecuteRestore}
            disabled={!restoreFile}
            className={`flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl text-sm font-bold shadow-md transition-all ${
              restoreFile
                ? 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Upload className="w-4 h-4" />
            Bắt đầu khôi phục dữ liệu
          </button>
        </div>
      </div>

      {/* Restore status message */}
      {restoreStatus && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{restoreStatus}</span>
        </div>
      )}

      {/* Danger Zone: Factory Reset */}
      <div className="bg-rose-50/50 rounded-xl border border-rose-200 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-rose-950 text-base">Khôi phục cài đặt gốc (Factory Reset)</h4>
              <p className="text-xs text-rose-700 mt-1">
                Xóa sạch bộ nhớ tạm trình duyệt và đưa toàn bộ cơ sở dữ liệu về dữ liệu mẫu ban đầu của trường. Thao tác
                này không thể hoàn tác.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            Khôi phục mặc định
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center mb-2">
              Xác nhận khôi phục cài đặt gốc?
            </h3>
            <p className="text-sm text-slate-600 text-center mb-6">
              Mọi dữ liệu bạn vừa tạo thêm hoặc sửa đổi sẽ bị thiết lập lại về trạng thái mẫu ban đầu của hệ thống. Bạn
              có chắc chắn muốn tiếp tục?
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="flex-1 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  resetToDefaults();
                  setIsResetConfirmOpen(false);
                  setRestoreStatus('Hệ thống đã được thiết lập lại về dữ liệu ban đầu!');
                }}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs cursor-pointer"
              >
                Xác nhận khôi phục
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
