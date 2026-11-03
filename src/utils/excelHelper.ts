import * as XLSX from 'xlsx';

// Export arbitrary data array to an Excel (.xlsx) file
export function exportToExcel(data: any[], fileName: string, sheetName: string = 'Sheet1') {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Auto-fit column widths
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  const colWidths = [];
  for (let C = range.s.c; C <= range.e.c; ++C) {
    let maxWidth = 12;
    for (let R = range.s.r; R <= range.e.r; ++R) {
      const cell = worksheet[XLSX.utils.encode_cell({ r: R, c: C })];
      if (cell && cell.v) {
        const strVal = String(cell.v);
        maxWidth = Math.max(maxWidth, Math.min(strVal.length + 3, 50));
      }
    }
    colWidths.push({ wch: maxWidth });
  }
  worksheet['!cols'] = colWidths;

  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

// Download Sample Template for Students
export function downloadStudentTemplate() {
  const sampleData = [
    {
      'Mã học sinh': 'HS2026-010',
      'Họ và tên': 'Nguyễn Văn Minh',
      'Lớp': '12A1',
      'Giới tính': 'Nam',
      'Ngày sinh': '2008-03-12',
      'Email': 'hs.minh@tdc3htp.edu.vn',
      'Số điện thoại': '0367 112 233',
      'Điện thoại phụ huynh': '0912 334 455',
      'Địa chỉ': '12 Hoàng Quốc Việt, Cầu Giấy, Hà Nội',
    },
    {
      'Mã học sinh': 'HS2026-011',
      'Họ và tên': 'Phạm Thùy Linh',
      'Lớp': '12A2',
      'Giới tính': 'Nữ',
      'Ngày sinh': '2008-09-18',
      'Email': 'hs.linh@tdc3htp.edu.vn',
      'Số điện thoại': '0388 990 011',
      'Điện thoại phụ huynh': '0903 221 100',
      'Địa chỉ': '45 Xuân Thủy, Cầu Giấy, Hà Nội',
    },
  ];
  exportToExcel(sampleData, 'Mau_Nhap_Hoc_Sinh_TDC3HTP', 'DanhSachHocSinh');
}

// Download Sample Template for Teachers
export function downloadTeacherTemplate() {
  const sampleData = [
    {
      'Mã giáo viên': 'GV-010',
      'Họ và tên': 'Hoàng Đình Khiêm',
      'Giới tính': 'Nam',
      'Bộ môn': 'Hóa học',
      'Email': 'khiem.hd@tdc3htp.edu.vn',
      'Số điện thoại': '0912 998 877',
      'Chủ nhiệm lớp': '12A1',
      'Danh sách lớp dạy': '12A1, 12A2, 11A1',
    },
    {
      'Mã giáo viên': 'GV-011',
      'Họ và tên': 'Vũ Thị Minh Nguyệt',
      'Giới tính': 'Nữ',
      'Bộ môn': 'Sinh học',
      'Email': 'nguyet.vtm@tdc3htp.edu.vn',
      'Số điện thoại': '0988 223 344',
      'Chủ nhiệm lớp': '',
      'Danh sách lớp dạy': '12A1, 12D1',
    },
  ];
  exportToExcel(sampleData, 'Mau_Nhap_Giao_Vien_TDC3HTP', 'DanhSachGiaoVien');
}

// Download Sample Template for Question Bank
export function downloadQuestionTemplate() {
  const sampleData = [
    {
      'Mã câu hỏi': 'MATH12-SAMPLE1',
      'Môn học': 'Toán học',
      'Khối': 12,
      'Chuyên đề': 'Khảo sát hàm số',
      'Mức độ': 'Thông hiểu', // Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao
      'Nội dung câu hỏi': 'Hàm số y = x^3 - 3x có bao nhiêu điểm cực trị?',
      'Đáp án A': '0',
      'Đáp án B': '1',
      'Đáp án C': '2',
      'Đáp án D': '3',
      'Đáp án đúng': 'C', // A, B, C, D hoặc chỉ số 0, 1, 2, 3
      'Lời giải chi tiết': 'y\' = 3x^2 - 3 = 0 <=> x = ±1. Do y\' đổi dấu qua 2 nghiệm phân biệt nên có 2 cực trị.',
      'Điểm': 1,
    },
    {
      'Mã câu hỏi': 'INFO12-SAMPLE1',
      'Môn học': 'Tin học',
      'Khối': 12,
      'Chuyên đề': 'An toàn thông tin',
      'Mức độ': 'Nhận biết',
      'Nội dung câu hỏi': 'Giao thức nào cung cấp kênh truyền dữ liệu bảo mật bằng cách mã hóa giữa máy khách và máy chủ web?',
      'Đáp án A': 'HTTP',
      'Đáp án B': 'HTTPS',
      'Đáp án C': 'FTP',
      'Đáp án D': 'SMTP',
      'Đáp án đúng': 'B',
      'Lời giải chi tiết': 'HTTPS (Hypertext Transfer Protocol Secure) sử dụng chứng chỉ SSL/TLS để mã hóa dữ liệu.',
      'Điểm': 1,
    },
  ];
  exportToExcel(sampleData, 'Mau_Nhap_Ngan_Hang_Cau_Hoi_TDC3HTP', 'NganHangCauHoi');
}

// Parse an uploaded Excel file to Array of JSON objects
export async function parseExcelFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}
