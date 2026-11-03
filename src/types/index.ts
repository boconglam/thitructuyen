export type UserRole = 'admin' | 'teacher' | 'student' | 'proctor';

export interface UserPermissions {
  canManageUsers: boolean;
  canManageAcademicYears: boolean;
  canManageClasses: boolean;
  canManageStudents: boolean;
  canManageTeachers: boolean;
  canManageQuestionBank: boolean;
  canCreateExams: boolean;
  canProctorExams: boolean;
  canViewReports: boolean;
  canExportData: boolean;
  canBackupRestore: boolean;
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: 'active' | 'locked';
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
  permissions: UserPermissions;
  // Specific entity references
  teacherId?: string;
  studentId?: string;
}

export interface AcademicYear {
  id: string;
  code: string; // e.g., "2025-2026"
  name: string; // e.g., "Năm học 2025 - 2026"
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  semesters: {
    id: string;
    name: string; // "Học kỳ I", "Học kỳ II"
    startDate: string;
    endDate: string;
    isCurrent: boolean;
  }[];
}

export interface SchoolClass {
  id: string;
  name: string; // e.g., "12A1", "11B2"
  grade: number; // 10, 11, 12
  academicYearId: string;
  homeroomTeacherId?: string;
  homeroomTeacherName?: string;
  room?: string;
  studentCount: number;
}

export interface Student {
  id: string;
  studentCode: string; // e.g., "HS2026-001"
  fullName: string;
  classId: string;
  className: string;
  gender: 'Nam' | 'Nữ';
  dateOfBirth: string;
  email: string;
  phone: string;
  parentPhone?: string;
  address?: string;
  status: 'active' | 'suspended' | 'graduated';
  totalPoints: number;
  examCount: number;
  rank: number;
}

export interface Teacher {
  id: string;
  teacherCode: string; // e.g., "GV-001"
  fullName: string;
  gender: 'Nam' | 'Nữ';
  subject: string; // "Toán học", "Ngữ văn", "Vật lý", "Tin học", "Tiếng Anh"...
  email: string;
  phone: string;
  isHomeroom: boolean;
  homeroomClassId?: string;
  assignedClasses: string[];
  status: 'active' | 'leave';
}

export type QuestionDifficulty = 'easy' | 'medium' | 'hard' | 'expert';
export type QuestionType = 'single' | 'multiple' | 'true_false' | 'fill_blank' | 'short_essay';

export interface Question {
  id: string;
  code: string;
  subject: string;
  grade: number;
  topic: string; // Chuyên đề
  difficulty: QuestionDifficulty;
  type: QuestionType;
  content: string; // Hỗ trợ công thức / markdown
  options?: string[]; // Cho single / multiple
  correctAnswers: string[]; // Danh sách đáp án đúng (index 0,1,2,3 hoặc từ khóa)
  explanation?: string;
  points: number;
  tags?: string[];
  createdAt: string;
  createdBy: string;
}

export interface ExamSecuritySettings {
  requireWebcam: boolean;
  requireFullscreen: boolean;
  maxTabViolations: number;
  blockCopyPaste: boolean;
  watermarkEnabled: boolean;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  autoSubmitOnViolationLimit: boolean;
  lockBrowserBack: boolean;
  allowReviewAfterSubmit: boolean;
}

export type ExamStatus = 'draft' | 'scheduled' | 'ongoing' | 'completed' | 'cancelled';

export interface Exam {
  id: string;
  code: string;
  title: string;
  description: string;
  subject: string;
  grade: number;
  academicYearId: string;
  durationMinutes: number;
  totalPoints: number;
  passingScore: number;
  startTime: string;
  endTime: string;
  status: ExamStatus;
  securitySettings: ExamSecuritySettings;
  questionIds: string[];
  assignedClassIds: string[]; // Các lớp được phép dự thi
  createdBy: string;
  createdAt: string;
}

export interface ViolationEvent {
  id: string;
  timestamp: string;
  type: 'tab_switch' | 'fullscreen_exit' | 'copy_paste_attempt' | 'devtools_attempt' | 'face_not_detected' | 'multiple_faces' | 'keyboard_shortcut';
  detail: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ExamAttempt {
  id: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  className: string;
  startTime: string;
  submitTime?: string;
  status: 'in_progress' | 'submitted' | 'disqualified' | 'timeout';
  score: number;
  totalScore: number;
  passed: boolean;
  answers: Record<string, string | string[]>;
  violations: ViolationEvent[];
  proctorNotes?: string;
  gradedBy?: string;
  feedback?: string;
  webcamSnapshotUrl?: string;
}

export type AuditAction = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'IMPORT' 
  | 'EXPORT' 
  | 'SECURITY_VIOLATION' 
  | 'BACKUP' 
  | 'RESTORE' 
  | 'SUBMIT_EXAM' 
  | 'DISQUALIFY';

export type AuditModule = 
  | 'USER' 
  | 'EXAM' 
  | 'QUESTION_BANK' 
  | 'CLASS' 
  | 'STUDENT' 
  | 'TEACHER' 
  | 'ACADEMIC_YEAR' 
  | 'SYSTEM' 
  | 'PROCTORING';

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: AuditAction;
  module: AuditModule;
  description: string;
  ipAddress: string;
  status: 'SUCCESS' | 'WARNING' | 'DANGER';
}

export interface StudyTopic {
  id: string;
  title: string;
  subject: string;
  grade: number;
  description: string;
  docCount: number;
  videoCount: number;
  tags: string[];
  updatedAt: string;
  author: string;
}

export interface ClassRanking {
  classId: string;
  className: string;
  grade: number;
  studentCount: number;
  examsCompleted: number;
  averageScore: number;
  participationRate: number; // Percentage
  totalCompetitionPoints: number;
  rank: number;
  badge: 'flag' | 'star' | 'trophy' | 'none';
}

export interface MoodleSyncConfig {
  enabled: boolean;
  serverUrl: string;
  apiToken: string;
  syncCourses: boolean;
  syncQuizzes: boolean;
  syncGrades: boolean;
  lastSyncTime?: string;
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
}
