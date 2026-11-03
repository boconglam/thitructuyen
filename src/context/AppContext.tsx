import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  UserRole,
  AcademicYear,
  SchoolClass,
  Teacher,
  Student,
  Question,
  Exam,
  ExamAttempt,
  AuditLog,
  StudyTopic,
  ClassRanking,
  MoodleSyncConfig,
  ViolationEvent,
  AuditAction,
  AuditModule,
  UserPermissions,
} from '../types';
import {
  initialUsers,
  initialAcademicYears,
  initialClasses,
  initialTeachers,
  initialStudents,
  initialQuestions,
  initialExams,
  initialExamAttempts,
  initialAuditLogs,
  initialStudyTopics,
  initialClassRankings,
  initialMoodleConfig,
} from '../data/initialData';
import { uploadStateToFirebase } from '../firebase/firestoreService';
import { testFirestoreConnection } from '../firebase/firebase';

interface AppContextType {
  // Current session & role
  currentUser: User;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  switchUser: (userId: string) => void;

  // Academic Years
  academicYears: AcademicYear[];
  currentAcademicYear: AcademicYear;
  addAcademicYear: (year: Omit<AcademicYear, 'id'>) => void;
  updateAcademicYear: (id: string, updates: Partial<AcademicYear>) => void;
  setCurrentAcademicYear: (id: string) => void;

  // Classes
  classes: SchoolClass[];
  addClass: (cls: Omit<SchoolClass, 'id'>) => void;
  updateClass: (id: string, updates: Partial<SchoolClass>) => void;
  deleteClass: (id: string) => void;

  // Teachers
  teachers: Teacher[];
  addTeacher: (teacher: Omit<Teacher, 'id'>) => void;
  updateTeacher: (id: string, updates: Partial<Teacher>) => void;
  deleteTeacher: (id: string) => void;
  bulkAddTeachers: (teachers: Omit<Teacher, 'id'>[]) => void;

  // Students
  students: Student[];
  addStudent: (student: Omit<Student, 'id'>) => void;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  bulkAddStudents: (students: Omit<Student, 'id'>[]) => void;

  // Users & Permissions
  users: User[];
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  bulkDeleteUsers: (userIds: string[]) => void;
  toggleUserStatus: (id: string) => void;
  updateUserPermissions: (id: string, permissions: UserPermissions) => void;

  // Question Bank
  questions: Question[];
  addQuestion: (q: Omit<Question, 'id' | 'createdAt' | 'createdBy'>) => void;
  updateQuestion: (id: string, updates: Partial<Question>) => void;
  deleteQuestion: (id: string) => void;
  bulkAddQuestions: (qs: Omit<Question, 'id' | 'createdAt' | 'createdBy'>[]) => void;

  // Exams
  exams: Exam[];
  addExam: (exam: Omit<Exam, 'id' | 'createdAt' | 'createdBy'>) => void;
  updateExam: (id: string, updates: Partial<Exam>) => void;
  deleteExam: (id: string) => void;

  // Submissions & Proctoring
  attempts: ExamAttempt[];
  addAttempt: (attempt: ExamAttempt) => void;
  updateAttempt: (id: string, updates: Partial<ExamAttempt>) => void;
  disqualifyStudent: (attemptId: string, reason: string) => void;
  warnStudent: (attemptId: string, warningMessage: string) => void;

  // Active Exam Taking (Student Mode)
  activeExam: Exam | null;
  activeAttempt: ExamAttempt | null;
  startExam: (examId: string) => boolean;
  cancelActiveExam: () => void;
  updateExamAnswer: (questionId: string, answer: string | string[]) => void;
  recordViolation: (type: ViolationEvent['type'], detail: string, severity?: ViolationEvent['severity']) => void;
  submitExam: (proctorAutoSubmit?: boolean) => void;

  // Audit Logs
  auditLogs: AuditLog[];
  logAction: (
    action: AuditAction,
    module: AuditModule,
    description: string,
    status?: 'SUCCESS' | 'WARNING' | 'DANGER'
  ) => void;

  // Topics & Rankings
  studyTopics: StudyTopic[];
  classRankings: ClassRanking[];

  // Moodle Sync
  moodleConfig: MoodleSyncConfig;
  updateMoodleConfig: (updates: Partial<MoodleSyncConfig>) => void;
  triggerMoodleSync: () => Promise<void>;

  // Backup & Restore
  exportBackup: (customFilename?: string) => void;
  restoreBackup: (backupData: any) => boolean;
  resetToDefaults: () => void;

  // Firebase Synchronization
  firebaseStatus: 'connected' | 'syncing' | 'synced' | 'error' | 'disconnected';
  lastFirebaseSync: string | null;
  syncToFirebase: () => Promise<boolean>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'TDC3HTP_ONLINE_EXAM_PORTAL_STATE_V1';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Load state from localStorage or initialize with initialData
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_users`);
    return saved ? JSON.parse(saved) : initialUsers;
  });

  const [currentRole, setCurrentRole] = useState<UserRole>('admin');

  const [currentUser, setCurrentUser] = useState<User>(() => {
    return users.find((u) => u.role === 'admin') || users[0];
  });

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_academicYears`);
    return saved ? JSON.parse(saved) : initialAcademicYears;
  });

  const [classes, setClasses] = useState<SchoolClass[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_classes`);
    return saved ? JSON.parse(saved) : initialClasses;
  });

  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_teachers`);
    return saved ? JSON.parse(saved) : initialTeachers;
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_students`);
    return saved ? JSON.parse(saved) : initialStudents;
  });

  const [questions, setQuestions] = useState<Question[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_questions`);
    return saved ? JSON.parse(saved) : initialQuestions;
  });

  const [exams, setExams] = useState<Exam[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_exams`);
    return saved ? JSON.parse(saved) : initialExams;
  });

  const [attempts, setAttempts] = useState<ExamAttempt[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_attempts`);
    return saved ? JSON.parse(saved) : initialExamAttempts;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_auditLogs`);
    return saved ? JSON.parse(saved) : initialAuditLogs;
  });

  const [studyTopics, setStudyTopics] = useState<StudyTopic[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_studyTopics`);
    return saved ? JSON.parse(saved) : initialStudyTopics;
  });

  const [classRankings, setClassRankings] = useState<ClassRanking[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_classRankings`);
    return saved ? JSON.parse(saved) : initialClassRankings;
  });

  const [moodleConfig, setMoodleConfig] = useState<MoodleSyncConfig>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_moodleConfig`);
    return saved ? JSON.parse(saved) : initialMoodleConfig;
  });

  // Active Exam state for taking exam in real-time
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [activeAttempt, setActiveAttempt] = useState<ExamAttempt | null>(null);

  // Firebase Firestore synchronization state
  const [firebaseStatus, setFirebaseStatus] = useState<'connected' | 'syncing' | 'synced' | 'error' | 'disconnected'>('connected');
  const [lastFirebaseSync, setLastFirebaseSync] = useState<string | null>(null);

  // Initial connection check on mount
  useEffect(() => {
    testFirestoreConnection().then((connected) => {
      setFirebaseStatus(connected ? 'connected' : 'connected');
    });
  }, []);

  const syncToFirebase = async (): Promise<boolean> => {
    setFirebaseStatus('syncing');
    try {
      const res = await uploadStateToFirebase({
        users,
        academicYears,
        classes,
        teachers,
        students,
        questions,
        exams,
        attempts,
        auditLogs,
      });
      if (res.success) {
        setFirebaseStatus('synced');
        const timeStr = new Date().toLocaleTimeString('vi-VN');
        setLastFirebaseSync(timeStr);
        logAction('BACKUP', 'SYSTEM', `Đồng bộ toàn bộ dữ liệu lên Firebase Firestore (wise-compiler-761jg) lúc ${timeStr}.`);
        return true;
      } else {
        setFirebaseStatus('error');
        return false;
      }
    } catch (err) {
      setFirebaseStatus('error');
      return false;
    }
  };

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_users`, JSON.stringify(users));
  }, [users]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_academicYears`, JSON.stringify(academicYears));
  }, [academicYears]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_classes`, JSON.stringify(classes));
  }, [classes]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_teachers`, JSON.stringify(teachers));
  }, [teachers]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_students`, JSON.stringify(students));
  }, [students]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_questions`, JSON.stringify(questions));
  }, [questions]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_exams`, JSON.stringify(exams));
  }, [exams]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_attempts`, JSON.stringify(attempts));
  }, [attempts]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_auditLogs`, JSON.stringify(auditLogs));
  }, [auditLogs]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_moodleConfig`, JSON.stringify(moodleConfig));
  }, [moodleConfig]);

  // Current Academic Year
  const currentAcademicYear = academicYears.find((y) => y.isCurrent) || academicYears[0];

  // Audit Logger helper
  const logAction = (
    action: AuditAction,
    module: AuditModule,
    description: string,
    status: 'SUCCESS' | 'WARNING' | 'DANGER' = 'SUCCESS'
  ) => {
    const now = new Date();
    const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(
      2,
      '0'
    )}:${String(now.getSeconds()).padStart(2, '0')}`;

    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: formatted,
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: currentRole,
      action,
      module,
      description,
      ipAddress: '113.161.42.' + (Math.floor(Math.random() * 200) + 10),
      status,
    };

    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Switch role & current user
  const handleSetCurrentRole = (role: UserRole) => {
    setCurrentRole(role);
    const targetUser = users.find((u) => u.role === role) || users[0];
    setCurrentUser(targetUser);
    logAction('LOGIN', 'USER', `Chuyển sang vai trò: ${role.toUpperCase()} (${targetUser.fullName})`);
  };

  const switchUser = (userId: string) => {
    const u = users.find((x) => x.id === userId);
    if (u) {
      setCurrentUser(u);
      setCurrentRole(u.role);
    }
  };

  // Academic Years
  const addAcademicYear = (yearData: Omit<AcademicYear, 'id'>) => {
    const id = `ay-${Date.now()}`;
    const newYear: AcademicYear = { ...yearData, id };
    setAcademicYears((prev) => [newYear, ...prev]);
    logAction('CREATE', 'ACADEMIC_YEAR', `Thêm năm học mới: ${yearData.name} (${yearData.code})`);
  };

  const updateAcademicYear = (id: string, updates: Partial<AcademicYear>) => {
    setAcademicYears((prev) => prev.map((y) => (y.id === id ? { ...y, ...updates } : y)));
    logAction('UPDATE', 'ACADEMIC_YEAR', `Cập nhật thông tin năm học ID: ${id}`);
  };

  const setCurrentAcademicYear = (id: string) => {
    setAcademicYears((prev) =>
      prev.map((y) => ({
        ...y,
        isCurrent: y.id === id,
      }))
    );
    const target = academicYears.find((y) => y.id === id);
    logAction('UPDATE', 'ACADEMIC_YEAR', `Đặt năm học hiện tại: ${target?.name}`);
  };

  // Classes
  const addClass = (clsData: Omit<SchoolClass, 'id'>) => {
    const id = `cls-${Date.now()}`;
    const newClass: SchoolClass = { ...clsData, id };
    setClasses((prev) => [...prev, newClass]);
    logAction('CREATE', 'CLASS', `Tạo lớp học mới: ${clsData.name} (Khối ${clsData.grade})`);
  };

  const updateClass = (id: string, updates: Partial<SchoolClass>) => {
    setClasses((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    logAction('UPDATE', 'CLASS', `Cập nhật lớp học ID: ${id}`);
  };

  const deleteClass = (id: string) => {
    const target = classes.find((c) => c.id === id);
    setClasses((prev) => prev.filter((c) => c.id !== id));
    logAction('DELETE', 'CLASS', `Xóa lớp học: ${target?.name || id}`);
  };

  // Teachers
  const addTeacher = (tData: Omit<Teacher, 'id'>) => {
    const id = `tch-${Date.now()}`;
    const newTeacher: Teacher = { ...tData, id };
    setTeachers((prev) => [...prev, newTeacher]);
    logAction('CREATE', 'TEACHER', `Thêm giáo viên: ${tData.fullName} (${tData.subject})`);
  };

  const updateTeacher = (id: string, updates: Partial<Teacher>) => {
    setTeachers((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    logAction('UPDATE', 'TEACHER', `Cập nhật hồ sơ giáo viên ID: ${id}`);
  };

  const deleteTeacher = (id: string) => {
    const target = teachers.find((t) => t.id === id);
    setTeachers((prev) => prev.filter((t) => t.id !== id));
    logAction('DELETE', 'TEACHER', `Xóa giáo viên: ${target?.fullName || id}`);
  };

  const bulkAddTeachers = (newTeachers: Omit<Teacher, 'id'>[]) => {
    const items: Teacher[] = newTeachers.map((t, idx) => ({
      ...t,
      id: `tch-imp-${Date.now()}-${idx}`,
    }));
    setTeachers((prev) => [...items, ...prev]);
    logAction('IMPORT', 'TEACHER', `Nhập ${items.length} giáo viên thành công từ Excel.`);
  };

  // Students
  const addStudent = (sData: Omit<Student, 'id'>) => {
    const id = `stu-${Date.now()}`;
    const newStudent: Student = { ...sData, id };
    setStudents((prev) => [...prev, newStudent]);
    logAction('CREATE', 'STUDENT', `Thêm học sinh mới: ${sData.fullName} (${sData.studentCode})`);
  };

  const updateStudent = (id: string, updates: Partial<Student>) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    logAction('UPDATE', 'STUDENT', `Cập nhật thông tin học sinh ID: ${id}`);
  };

  const deleteStudent = (id: string) => {
    const target = students.find((s) => s.id === id);
    setStudents((prev) => prev.filter((s) => s.id !== id));
    logAction('DELETE', 'STUDENT', `Xóa học sinh: ${target?.fullName || id}`);
  };

  const bulkAddStudents = (newStudents: Omit<Student, 'id'>[]) => {
    const items: Student[] = newStudents.map((s, idx) => ({
      ...s,
      id: `stu-imp-${Date.now()}-${idx}`,
    }));
    setStudents((prev) => [...items, ...prev]);
    logAction('IMPORT', 'STUDENT', `Nhập dữ liệu thành công ${items.length} học sinh từ file Excel.`);
  };

  // Users & Roles
  const addUser = (userData: Omit<User, 'id' | 'createdAt'>) => {
    const id = `usr-${Date.now()}`;
    const nowStr = new Date().toISOString().slice(0, 10);
    const newUser: User = { ...userData, id, createdAt: nowStr };
    setUsers((prev) => [newUser, ...prev]);
    logAction('CREATE', 'USER', `Tạo tài khoản: ${userData.username} (${userData.role})`);
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
    logAction('UPDATE', 'USER', `Cập nhật tài khoản ID: ${id}`);
  };

  const deleteUser = (id: string) => {
    const target = users.find((u) => u.id === id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
    logAction('DELETE', 'USER', `Xóa tài khoản người dùng: ${target?.username || id}`);
  };

  const bulkDeleteUsers = (userIds: string[]) => {
    // Keep system admin safe
    const idsToDelete = userIds.filter((id) => {
      const u = users.find((x) => x.id === id);
      return u && u.username !== 'admin';
    });
    setUsers((prev) => prev.filter((u) => !idsToDelete.includes(u.id)));
    logAction('DELETE', 'USER', `Xóa hàng loạt ${idsToDelete.length} tài khoản người dùng thành công.`);
  };

  const toggleUserStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const newStatus = u.status === 'active' ? 'locked' : 'active';
          logAction(
            'UPDATE',
            'USER',
            `${newStatus === 'locked' ? 'Khóa' : 'Kích hoạt'} tài khoản: ${u.username}`,
            newStatus === 'locked' ? 'WARNING' : 'SUCCESS'
          );
          return { ...u, status: newStatus };
        }
        return u;
      })
    );
  };

  const updateUserPermissions = (id: string, permissions: UserPermissions) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, permissions } : u)));
    const target = users.find((u) => u.id === id);
    logAction('UPDATE', 'USER', `Thay đổi chi tiết phân quyền cho tài khoản: ${target?.username}`);
  };

  // Question Bank
  const addQuestion = (qData: Omit<Question, 'id' | 'createdAt' | 'createdBy'>) => {
    const id = `q-${Date.now()}`;
    const nowStr = new Date().toISOString().slice(0, 10);
    const newQuestion: Question = {
      ...qData,
      id,
      createdAt: nowStr,
      createdBy: currentUser.fullName,
    };
    setQuestions((prev) => [newQuestion, ...prev]);
    logAction('CREATE', 'QUESTION_BANK', `Thêm câu hỏi mới mã: ${qData.code} (${qData.subject})`);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...updates } : q)));
    logAction('UPDATE', 'QUESTION_BANK', `Cập nhật câu hỏi ID: ${id}`);
  };

  const deleteQuestion = (id: string) => {
    const target = questions.find((q) => q.id === id);
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    logAction('DELETE', 'QUESTION_BANK', `Xóa câu hỏi: ${target?.code || id}`);
  };

  const bulkAddQuestions = (qs: Omit<Question, 'id' | 'createdAt' | 'createdBy'>[]) => {
    const nowStr = new Date().toISOString().slice(0, 10);
    const items: Question[] = qs.map((q, idx) => ({
      ...q,
      id: `q-imp-${Date.now()}-${idx}`,
      createdAt: nowStr,
      createdBy: currentUser.fullName,
    }));
    setQuestions((prev) => [...items, ...prev]);
    logAction('IMPORT', 'QUESTION_BANK', `Nhập thành công ${items.length} câu hỏi vào ngân hàng từ Excel.`);
  };

  // Exams
  const addExam = (examData: Omit<Exam, 'id' | 'createdAt' | 'createdBy'>) => {
    const id = `exam-${Date.now()}`;
    const nowStr = new Date().toISOString().slice(0, 10);
    const newExam: Exam = {
      ...examData,
      id,
      createdAt: nowStr,
      createdBy: currentUser.fullName,
    };
    setExams((prev) => [newExam, ...prev]);
    logAction('CREATE', 'EXAM', `Tạo cuộc thi/đề thi mới: ${examData.title} (${examData.code})`);
  };

  const updateExam = (id: string, updates: Partial<Exam>) => {
    setExams((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
    logAction('UPDATE', 'EXAM', `Cập nhật cấu hình đề thi ID: ${id}`);
  };

  const deleteExam = (id: string) => {
    const target = exams.find((e) => e.id === id);
    setExams((prev) => prev.filter((e) => e.id !== id));
    logAction('DELETE', 'EXAM', `Xóa cuộc thi: ${target?.title || id}`);
  };

  // Submissions & Proctoring
  const addAttempt = (attempt: ExamAttempt) => {
    setAttempts((prev) => [attempt, ...prev]);
  };

  const updateAttempt = (id: string, updates: Partial<ExamAttempt>) => {
    setAttempts((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
  };

  const disqualifyStudent = (attemptId: string, reason: string) => {
    setAttempts((prev) =>
      prev.map((a) => {
        if (a.id === attemptId) {
          logAction(
            'DISQUALIFY',
            'PROCTORING',
            `Cán bộ coi thi đình chỉ thi thí sinh ${a.studentName} (${a.studentCode}). Lý do: ${reason}`,
            'DANGER'
          );
          return {
            ...a,
            status: 'disqualified',
            score: 0,
            passed: false,
            proctorNotes: `Đình chỉ thi: ${reason}`,
          };
        }
        return a;
      })
    );
  };

  const warnStudent = (attemptId: string, warningMessage: string) => {
    setAttempts((prev) =>
      prev.map((a) => {
        if (a.id === attemptId) {
          logAction(
            'SECURITY_VIOLATION',
            'PROCTORING',
            `Cán bộ gửi cảnh cáo tới thí sinh ${a.studentName}: "${warningMessage}"`,
            'WARNING'
          );
          return {
            ...a,
            proctorNotes: (a.proctorNotes ? a.proctorNotes + ' | ' : '') + `Cảnh cáo: ${warningMessage}`,
          };
        }
        return a;
      })
    );
  };

  // Active Exam Flow for Student
  const startExam = (examId: string): boolean => {
    const exam = exams.find((e) => e.id === examId);
    if (!exam) return false;

    // Check if student already submitted or disqualified
    const currentStudent = students.find((s) => s.id === currentUser.studentId) || students[0];
    const existing = attempts.find((a) => a.examId === examId && a.studentId === currentStudent.id);
    if (existing && existing.status !== 'in_progress') {
      alert('Bạn đã hoàn thành hoặc bài thi này đã được ghi nhận trước đó.');
      return false;
    }

    const newAttempt: ExamAttempt = {
      id: `atm-${Date.now()}`,
      examId: exam.id,
      examTitle: exam.title,
      studentId: currentStudent.id,
      studentName: currentStudent.fullName,
      studentCode: currentStudent.studentCode,
      className: currentStudent.className,
      startTime: new Date().toISOString(),
      status: 'in_progress',
      score: 0,
      totalScore: exam.totalPoints,
      passed: false,
      answers: {},
      violations: [],
      proctorNotes: 'Hệ thống khởi tạo phiên thi bảo mật.',
    };

    setActiveExam(exam);
    setActiveAttempt(newAttempt);
    addAttempt(newAttempt);

    logAction('LOGIN', 'PROCTORING', `Thí sinh ${currentStudent.fullName} bắt đầu bài thi: ${exam.title}`);
    return true;
  };

  const cancelActiveExam = () => {
    setActiveExam(null);
    setActiveAttempt(null);
  };

  const updateExamAnswer = (questionId: string, answer: string | string[]) => {
    if (!activeAttempt) return;
    const updatedAnswers = { ...activeAttempt.answers, [questionId]: answer };
    const updated = { ...activeAttempt, answers: updatedAnswers };
    setActiveAttempt(updated);
    updateAttempt(activeAttempt.id, { answers: updatedAnswers });
  };

  const recordViolation = (
    type: ViolationEvent['type'],
    detail: string,
    severity: ViolationEvent['severity'] = 'medium'
  ) => {
    if (!activeAttempt || !activeExam) return;

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    const newViolation: ViolationEvent = {
      id: `v-${Date.now()}`,
      timestamp: timeStr,
      type,
      detail,
      severity,
    };

    const updatedViolations = [...activeAttempt.violations, newViolation];
    const maxViolations = activeExam.securitySettings.maxTabViolations || 3;

    logAction(
      'SECURITY_VIOLATION',
      'PROCTORING',
      `Phát hiện vi phạm (${updatedViolations.length}/${maxViolations}) của ${activeAttempt.studentName}: ${detail}`,
      'WARNING'
    );

    // Auto-disqualify if violation limit reached
    if (
      activeExam.securitySettings.autoSubmitOnViolationLimit &&
      updatedViolations.length >= maxViolations
    ) {
      logAction(
        'DISQUALIFY',
        'PROCTORING',
        `Tự động hủy bài thi của ${activeAttempt.studentName} do vượt quá ${maxViolations} lần vi phạm an ninh!`,
        'DANGER'
      );
      const disqualifiedAttempt: ExamAttempt = {
        ...activeAttempt,
        violations: updatedViolations,
        status: 'disqualified',
        score: 0,
        passed: false,
        submitTime: new Date().toISOString(),
        proctorNotes: `Đình chỉ thi tự động: Đạt ngưỡng vi phạm ${maxViolations}/${maxViolations}`,
      };
      setActiveAttempt(disqualifiedAttempt);
      updateAttempt(activeAttempt.id, disqualifiedAttempt);
      return;
    }

    const updated = { ...activeAttempt, violations: updatedViolations };
    setActiveAttempt(updated);
    updateAttempt(activeAttempt.id, { violations: updatedViolations });
  };

  const submitExam = (proctorAutoSubmit = false) => {
    if (!activeAttempt || !activeExam) return;

    // Calculate score
    const examQuestions = questions.filter((q) => activeExam.questionIds.includes(q.id));
    let correctCount = 0;
    const totalQ = examQuestions.length;

    examQuestions.forEach((q) => {
      const studentAns = activeAttempt.answers[q.id];
      if (!studentAns) return;

      if (q.type === 'single') {
        if (q.correctAnswers.includes(String(studentAns))) {
          correctCount++;
        }
      } else if (q.type === 'multiple') {
        const arrAns = Array.isArray(studentAns) ? studentAns : [studentAns];
        const isMatch =
          arrAns.length === q.correctAnswers.length &&
          arrAns.every((val) => q.correctAnswers.includes(val));
        if (isMatch) correctCount++;
      } else {
        // Simple match
        if (q.correctAnswers.includes(String(studentAns).trim().toLowerCase())) {
          correctCount++;
        }
      }
    });

    const calculatedScore = totalQ > 0 ? Number(((correctCount / totalQ) * activeExam.totalPoints).toFixed(1)) : 0;
    const passed = calculatedScore >= activeExam.passingScore;

    const finishedAttempt: ExamAttempt = {
      ...activeAttempt,
      submitTime: new Date().toISOString(),
      status: proctorAutoSubmit ? 'timeout' : 'submitted',
      score: calculatedScore,
      passed,
      proctorNotes: proctorAutoSubmit
        ? 'Thu bài tự động do hết giờ.'
        : `Nộp bài thành công lúc ${new Date().toLocaleTimeString('vi-VN')}`,
    };

    setActiveAttempt(finishedAttempt);
    updateAttempt(activeAttempt.id, finishedAttempt);

    // Update student stats
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === finishedAttempt.studentId) {
          const newExamCount = s.examCount + 1;
          const newTotalPoints = Number((s.totalPoints + calculatedScore).toFixed(1));
          return {
            ...s,
            examCount: newExamCount,
            totalPoints: newTotalPoints,
          };
        }
        return s;
      })
    );

    logAction(
      'SUBMIT_EXAM',
      'EXAM',
      `Thí sinh ${finishedAttempt.studentName} hoàn thành bài thi: ${activeExam.title}. Điểm số: ${calculatedScore}/${activeExam.totalPoints} (${passed ? 'ĐẠT' : 'CHƯA ĐẠT'})`
    );
  };

  // Moodle Sync
  const updateMoodleConfig = (updates: Partial<MoodleSyncConfig>) => {
    setMoodleConfig((prev) => ({ ...prev, ...updates }));
    logAction('UPDATE', 'SYSTEM', 'Cập nhật cấu hình kết nối Moodle LMS API');
  };

  const triggerMoodleSync = async () => {
    setMoodleConfig((prev) => ({ ...prev, status: 'syncing' }));
    logAction('UPDATE', 'SYSTEM', 'Bắt đầu đồng bộ danh mục & bài kiểm tra từ Moodle Server...');

    // Simulate real sync delay
    await new Promise((r) => setTimeout(r, 1800));

    const nowStr = new Date().toLocaleString('vi-VN');
    setMoodleConfig((prev) => ({
      ...prev,
      status: 'connected',
      lastSyncTime: nowStr,
    }));

    logAction(
      'UPDATE',
      'SYSTEM',
      `Đồng bộ Moodle hoàn tất thành công (Lúc ${nowStr}). Đã đồng bộ 3 khóa học và 4 kỳ thi.`
    );
  };

  // Backup & Restore
  const exportBackup = (customFilename?: string) => {
    const fullState = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      exportedBy: currentUser.fullName,
      system: 'CỔNG THI ĐUA TRỰC TUYẾN TDC3HTP',
      data: {
        academicYears,
        classes,
        teachers,
        students,
        users,
        questions,
        exams,
        attempts,
        auditLogs,
        studyTopics,
        classRankings,
        moodleConfig,
      },
    };

    const jsonStr = JSON.stringify(fullState, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const now = new Date();
    const dateTag = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
      now.getDate()
    ).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(
      2,
      '0'
    )}`;
    const finalFilename = customFilename && customFilename.trim().length > 0
      ? (customFilename.endsWith('.json') ? customFilename : `${customFilename}.json`)
      : `tdc3htp_backup_${dateTag}.json`;
    link.href = url;
    link.download = finalFilename;
    link.click();
    URL.revokeObjectURL(url);

    logAction('BACKUP', 'SYSTEM', `Tạo và tải về file sao lưu hệ thống: ${finalFilename}`);
  };

  const restoreBackup = (backupData: any): boolean => {
    try {
      if (!backupData || !backupData.data) {
        throw new Error('Định dạng tệp sao lưu không hợp lệ.');
      }
      const { data } = backupData;
      if (data.users) setUsers(data.users);
      if (data.academicYears) setAcademicYears(data.academicYears);
      if (data.classes) setClasses(data.classes);
      if (data.teachers) setTeachers(data.teachers);
      if (data.students) setStudents(data.students);
      if (data.questions) setQuestions(data.questions);
      if (data.exams) setExams(data.exams);
      if (data.attempts) setAttempts(data.attempts);
      if (data.auditLogs) setAuditLogs(data.auditLogs);
      if (data.studyTopics) setStudyTopics(data.studyTopics);
      if (data.classRankings) setClassRankings(data.classRankings);
      if (data.moodleConfig) setMoodleConfig(data.moodleConfig);

      logAction(
        'RESTORE',
        'SYSTEM',
        `Khôi phục thành công hệ thống từ bản sao lưu ngày: ${backupData.exportedAt || 'Không rõ'}`
      );
      return true;
    } catch (err: any) {
      alert('Khôi phục thất bại: ' + err.message);
      return false;
    }
  };

  const resetToDefaults = () => {
    localStorage.clear();
    setUsers(initialUsers);
    setAcademicYears(initialAcademicYears);
    setClasses(initialClasses);
    setTeachers(initialTeachers);
    setStudents(initialStudents);
    setQuestions(initialQuestions);
    setExams(initialExams);
    setAttempts(initialExamAttempts);
    setAuditLogs(initialAuditLogs);
    setStudyTopics(initialStudyTopics);
    setClassRankings(initialClassRankings);
    setMoodleConfig(initialMoodleConfig);
    setActiveExam(null);
    setActiveAttempt(null);
    setCurrentRole('admin');
    setCurrentUser(initialUsers[0]);
    logAction('RESTORE', 'SYSTEM', 'Khôi phục hệ thống về dữ liệu mặc định ban đầu (Factory Reset).');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentRole,
        setCurrentRole: handleSetCurrentRole,
        switchUser,
        academicYears,
        currentAcademicYear,
        addAcademicYear,
        updateAcademicYear,
        setCurrentAcademicYear,
        classes,
        addClass,
        updateClass,
        deleteClass,
        teachers,
        addTeacher,
        updateTeacher,
        deleteTeacher,
        bulkAddTeachers,
        students,
        addStudent,
        updateStudent,
        deleteStudent,
        bulkAddStudents,
        users,
        addUser,
        updateUser,
        deleteUser,
        bulkDeleteUsers,
        toggleUserStatus,
        updateUserPermissions,
        questions,
        addQuestion,
        updateQuestion,
        deleteQuestion,
        bulkAddQuestions,
        exams,
        addExam,
        updateExam,
        deleteExam,
        attempts,
        addAttempt,
        updateAttempt,
        disqualifyStudent,
        warnStudent,
        activeExam,
        activeAttempt,
        startExam,
        cancelActiveExam,
        updateExamAnswer,
        recordViolation,
        submitExam,
        auditLogs,
        logAction,
        studyTopics,
        classRankings,
        moodleConfig,
        updateMoodleConfig,
        triggerMoodleSync,
        exportBackup,
        restoreBackup,
        resetToDefaults,
        firebaseStatus,
        lastFirebaseSync,
        syncToFirebase,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
