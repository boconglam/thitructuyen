import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
  Briefcase,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import {
  downloadStudentTemplate,
  downloadTeacherTemplate,
  downloadQuestionTemplate,
  parseExcelFile
} from '../../utils/excelHelper';
import { Student, Teacher, Question } from '../../types';

type ImportType = 'students' | 'teachers' | 'questions';

export const ExcelImportView: React.FC = () => {
  const { classes, bulkAddStudents, bulkAddTeachers, bulkAddQuestions } = useApp();
  const [selectedType, setSelectedType] = useState<ImportType>('students');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  const handleDownloadTemplate = () => {
    if (selectedType === 'students') downloadStudentTemplate();
    else if (selectedType === 'teachers') downloadTeacherTemplate();
    else if (selectedType === 'questions') downloadQuestionTemplate();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsProcessing(true);
    setImportSuccess(null);

    try {
      const rows = await parseExcelFile(selectedFile);
      setParsedData(rows);
    } catch (err: any) {
      alert('Không thể đọc tệp Excel: ' + err.message);
      setParsedData([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommitImport = () => {
    if (parsedData.length === 0) {
      alert('Chưa có dữ liệu nào để nhập.');
      return;
    }

    if (selectedType === 'students') {
      const studentsToInsert: Omit<Student, 'id'>[] = parsedData.map((row, idx) => {
        const studentCode = row['Mã học sinh'] || row['studentCode'] || `HS2026-IMP${idx + 1}`;
        const fullName = row['Họ và tên'] || row['fullName'] || 'Học sinh chưa đặt tên';
        const className = row['Lớp'] || row['className'] || '12A1';
        const targetClass = classes.find((c) => c.name.toLowerCase() === className.toLowerCase());

        return {
          studentCode,
          fullName,
          classId: targetClass?.id || classes[0]?.id || 'cls-12a1',
          className,
          gender: (row['Giới tính'] || 'Nam') as 'Nam' | 'Nữ',
          dateOfBirth: row['Ngày sinh'] || '2008-01-01',
          email: row['Email'] || `${studentCode.toLowerCase()}@tdc3htp.edu.vn`,
          phone: String(row['Số điện thoại'] || ''),
          parentPhone: String(row['Điện thoại phụ huynh'] || ''),
          address: row['Địa chỉ'] || '',
          status: 'active',
          totalPoints: 0,
          examCount: 0,
          rank: idx + 1,
        };
      });

      bulkAddStudents(studentsToInsert);
      setImportSuccess(`Đã nhập thành công ${studentsToInsert.length} học sinh vào hệ thống!`);
    } else if (selectedType === 'teachers') {
      const teachersToInsert: Omit<Teacher, 'id'>[] = parsedData.map((row, idx) => {
        const teacherCode = row['Mã giáo viên'] || row['teacherCode'] || `GV-IMP${idx + 1}`;
        const fullName = row['Họ và tên'] || row['fullName'] || 'Giáo viên mới';
        const subject = row['Bộ môn'] || row['subject'] || 'Toán học';
        const homeroomClass = row['Chủ nhiệm lớp'] || '';
        const targetClass = classes.find((c) => c.name.toLowerCase() === homeroomClass.toLowerCase());

        return {
          teacherCode,
          fullName,
          gender: (row['Giới tính'] || 'Nữ') as 'Nam' | 'Nữ',
          subject,
          email: row['Email'] || `gv_${idx + 1}@tdc3htp.edu.vn`,
          phone: String(row['Số điện thoại'] || ''),
          isHomeroom: Boolean(targetClass),
          homeroomClassId: targetClass?.id,
          assignedClasses: targetClass ? [targetClass.id] : [],
          status: 'active',
        };
      });

      bulkAddTeachers(teachersToInsert);
      setImportSuccess(`Đã nhập thành công ${teachersToInsert.length} giáo viên vào hệ thống!`);
    } else if (selectedType === 'questions') {
      const questionsToInsert: Omit<Question, 'id' | 'createdAt' | 'createdBy'>[] = parsedData.map((row, idx) => {
        const code = row['Mã câu hỏi'] || `Q-IMP-${Date.now()}-${idx + 1}`;
        const subject = row['Môn học'] || 'Toán học';
        const grade = Number(row['Khối'] || 12);
        const topic = row['Chuyên đề'] || 'Chung';
        const rawDiff = (row['Mức độ'] || 'Thông hiểu').toLowerCase();
        let difficulty: Question['difficulty'] = 'medium';
        if (rawDiff.includes('nhận biết') || rawDiff.includes('dễ')) difficulty = 'easy';
        else if (rawDiff.includes('vận dụng cao') || rawDiff.includes('khó nhất')) difficulty = 'expert';
        else if (rawDiff.includes('vận dụng')) difficulty = 'hard';

        const optA = row['Đáp án A'] || 'Đáp án A';
        const optB = row['Đáp án B'] || 'Đáp án B';
        const optC = row['Đáp án C'] || 'Đáp án C';
        const optD = row['Đáp án D'] || 'Đáp án D';

        const rawCorrect = String(row['Đáp án đúng'] || 'A').trim().toUpperCase();
        let correctIdx = '0';
        if (rawCorrect === 'B' || rawCorrect === '1') correctIdx = '1';
        else if (rawCorrect === 'C' || rawCorrect === '2') correctIdx = '2';
        else if (rawCorrect === 'D' || rawCorrect === '3') correctIdx = '3';

        return {
          code,
          subject,
          grade,
          topic,
          difficulty,
          type: 'single',
          content: row['Nội dung câu hỏi'] || `Câu hỏi trắc nghiệm số ${idx + 1}`,
          options: [optA, optB, optC, optD],
          correctAnswers: [correctIdx],
          explanation: row['Lời giải chi tiết'] || '',
          points: Number(row['Điểm'] || 1),
          tags: [subject, topic],
        };
      });

      bulkAddQuestions(questionsToInsert);
      setImportSuccess(`Đã nhập thành công ${questionsToInsert.length} câu hỏi vào Ngân hàng đề thi!`);
    }

    setParsedData([]);
    setFile(null);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
          Nhập dữ liệu hàng loạt từ Excel (.xlsx / .csv)
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Hỗ trợ nhập danh sách học sinh, giáo viên và bộ câu hỏi trắc nghiệm từ bảng tính chuẩn hóa
        </p>
      </div>

      {/* Select category cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            id: 'students',
            label: 'Danh sách Học sinh',
            desc: 'Mã HS, Họ tên, Lớp, Ngày sinh, Phụ huynh',
            icon: Users,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50/70',
          },
          {
            id: 'teachers',
            label: 'Danh sách Giáo viên',
            desc: 'Mã GV, Bộ môn, Lớp chủ nhiệm, Liên hệ',
            icon: Briefcase,
            color: 'text-amber-600',
            bg: 'bg-amber-50/70',
          },
          {
            id: 'questions',
            label: 'Ngân hàng Câu hỏi',
            desc: 'Câu hỏi trắc nghiệm, 4 đáp án, Lời giải',
            icon: HelpCircle,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50/70',
          },
        ].map((item) => {
          const Icon = item.icon;
          const isSelected = selectedType === item.id;
          return (
            <div
              key={item.id}
              onClick={() => {
                setSelectedType(item.id as ImportType);
                setParsedData([]);
                setFile(null);
                setImportSuccess(null);
              }}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'border-indigo-600 bg-white shadow-md ring-2 ring-indigo-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2.5 rounded-lg ${item.bg}`}>
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{item.label}</h3>
                  <span className="text-xs text-slate-500">{item.desc}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Step 1: Download Template */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm">
            1
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 text-sm">Tải về tệp mẫu Excel chuẩn hóa</h4>
            <p className="text-xs text-slate-500">
              Sử dụng đúng định dạng cột tiêu đề mẫu để hệ thống tự động nhận diện chính xác
            </p>
          </div>
        </div>

        <button
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-4 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Tải file mẫu Excel (.xlsx)
        </button>
      </div>

      {/* Step 2: Upload File */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm">
            2
          </div>
          <div>
            <h4 className="font-semibold text-slate-800 text-sm">Tải lên tệp dữ liệu đã chuẩn bị</h4>
            <p className="text-xs text-slate-500">Kéo thả tệp hoặc chọn file từ máy tính của bạn</p>
          </div>
        </div>

        <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-8 text-center bg-slate-50/50 hover:bg-indigo-50/20 transition-all">
          <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700 mb-1">
            Chọn tệp Excel (.xlsx, .xls) hoặc .csv
          </p>
          <p className="text-xs text-slate-400 mb-4">Dung lượng tối đa 15MB</p>

          <label className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold cursor-pointer transition-colors shadow-xs">
            <Upload className="w-4 h-4" />
            Chọn tệp từ máy
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {file && (
            <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 text-xs font-semibold">
              <FileText className="w-4 h-4" />
              Đã chọn: {file.name} ({Math.round(file.size / 1024)} KB)
            </div>
          )}
        </div>
      </div>

      {/* Success alert */}
      {importSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{importSuccess}</span>
        </div>
      )}

      {/* Step 3: Preview Data & Commit */}
      {parsedData.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <h3 className="font-bold text-slate-800 text-base">
                  Bản xem trước dữ liệu ({parsedData.length} dòng hợp lệ)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Vui lòng kiểm tra lại dữ liệu trước khi bấm xác nhận lưu vào hệ thống
              </p>
            </div>

            <button
              onClick={handleCommitImport}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-md transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Xác nhận nhập vào hệ thống
            </button>
          </div>

          <div className="overflow-x-auto max-h-80 border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">STT</th>
                  {Object.keys(parsedData[0] || {}).map((col) => (
                    <th key={col} className="py-2.5 px-3 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsedData.slice(0, 15).map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-mono text-slate-400">{idx + 1}</td>
                    {Object.values(row).map((val: any, cIdx) => (
                      <td key={cIdx} className="py-2 px-3 max-w-xs truncate">
                        {String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {parsedData.length > 15 && (
            <p className="text-xs text-slate-400 text-center italic">
              Và {parsedData.length - 15} dòng khác...
            </p>
          )}
        </div>
      )}
    </div>
  );
};
