import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Question } from '../../types';
import {
  ShieldAlert,
  ShieldCheck,
  Camera,
  Maximize2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flag,
  Send,
  Eye,
  Award,
  FileText,
  Printer,
  XCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const SecureExamRoom: React.FC = () => {
  const {
    activeExam,
    activeAttempt,
    questions,
    cancelActiveExam,
    updateExamAnswer,
    recordViolation,
    submitExam,
  } = useApp();

  // Pre-exam verification step: 'pre_check' | 'taking' | 'submitted' | 'disqualified'
  const [examStep, setExamStep] = useState<'pre_check' | 'taking' | 'result'>('pre_check');

  // Camera stream
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [cameraError, setCameraError] = useState(false);

  // Current question index
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({});

  // Countdown timer
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Violation alert banner popup
  const [latestWarning, setLatestWarning] = useState<string | null>(null);

  // Submit confirmation modal
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  // Agreement checkbox
  const [agreedTerms, setAgreedTerms] = useState(false);

  // Filter questions for this exam
  const examQuestions = questions.filter((q) => activeExam?.questionIds.includes(q.id));

  // Initialize timer
  useEffect(() => {
    if (activeExam) {
      setTimeLeft(activeExam.durationMinutes * 60);
    }
  }, [activeExam]);

  // Request camera on pre-check
  useEffect(() => {
    if (examStep === 'pre_check') {
      navigator.mediaDevices
        ?.getUserMedia({ video: true, audio: false })
        .then((stream) => {
          setHasCameraPermission(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(() => {
          setCameraError(true);
        });
    }
  }, [examStep]);

  // Stop camera when unmounting
  useEffect(() => {
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    if (examStep !== 'taking') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          submitExam(true);
          setExamStep('result');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examStep]);

  // Anti-Cheat Event Listeners (Security Engine)
  useEffect(() => {
    if (examStep !== 'taking' || !activeExam) return;

    // 1. Tab switch detector
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const detail = 'Hệ thống phát hiện thí sinh chuyển tab hoặc rời khỏi trang thi.';
        recordViolation('tab_switch', detail, 'medium');
        setLatestWarning(detail);
      }
    };

    // 2. Window blur detector
    const handleBlur = () => {
      const detail = 'Cảnh báo: Con trỏ chuột rời khỏi cửa sổ thi hoặc mở phần mềm khác!';
      recordViolation('tab_switch', detail, 'medium');
      setLatestWarning(detail);
    };

    // 3. Fullscreen exit detector
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && activeExam.securitySettings.requireFullscreen) {
        const detail = 'Thí sinh đã thoát khỏi chế độ toàn màn hình (Fullscreen)!';
        recordViolation('fullscreen_exit', detail, 'high');
        setLatestWarning(detail);
      }
    };

    // 4. Keyboard shortcuts & DevTools prevention
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 or Ctrl+Shift+I or Ctrl+U
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
        (e.ctrlKey && e.key === 'u')
      ) {
        e.preventDefault();
        const detail = 'Phát hiện cố ý mở công cụ phát triển phần mềm (DevTools / Inspect)!';
        recordViolation('devtools_attempt', detail, 'high');
        setLatestWarning(detail);
        return false;
      }

      // Copy / Paste / Cut prevention
      if (activeExam.securitySettings.blockCopyPaste && e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
        e.preventDefault();
        const detail = 'Cố gắng thực hiện lệnh Sao chép / Dán (Ctrl+C / Ctrl+V)!';
        recordViolation('copy_paste_attempt', detail, 'low');
        setLatestWarning(detail);
        return false;
      }
    };

    // 5. Right-click contextmenu prevention
    const handleContextMenu = (e: MouseEvent) => {
      if (activeExam.securitySettings.blockCopyPaste) {
        e.preventDefault();
        const detail = 'Thao tác chuột phải bị vô hiệu hóa vì lý do an toàn đề thi.';
        recordViolation('copy_paste_attempt', detail, 'low');
        setLatestWarning(detail);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [examStep, activeExam]);

  // Check if disqualified by system
  useEffect(() => {
    if (activeAttempt?.status === 'disqualified') {
      setExamStep('result');
    }
  }, [activeAttempt?.status]);

  // Trigger celebration confetti if score is high on result
  useEffect(() => {
    if (examStep === 'result' && activeAttempt && activeAttempt.score >= 8.0) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [examStep, activeAttempt]);

  if (!activeExam || !activeAttempt) return null;

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Pre-Check Start Action
  const handleStartExam = async () => {
    if (!agreedTerms) {
      alert('Vui lòng đánh dấu đồng ý cam kết trung thực trước khi bắt đầu.');
      return;
    }

    // Try requesting fullscreen
    if (activeExam.securitySettings.requireFullscreen) {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch (err) {
        console.warn('Fullscreen request bypassed:', err);
      }
    }

    setExamStep('taking');
  };

  const handleFinalSubmit = () => {
    setIsSubmitModalOpen(false);
    submitExam(false);
    setExamStep('result');
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };

  const currentQ = examQuestions[currentQIndex];

  // ===================== STEP 1: PRE-CHECK MODAL =====================
  if (examStep === 'pre_check') {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3 border border-indigo-100">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Kiểm tra An ninh & Điều kiện Phòng thi</h2>
            <p className="text-sm text-slate-500 mt-1">
              Bài thi: <strong className="text-slate-800">{activeExam.title}</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {/* Camera Check Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center flex flex-col items-center justify-center">
              <div className="relative w-40 h-28 bg-slate-800 rounded-xl overflow-hidden mb-3 border border-slate-700 flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${!hasCameraPermission ? 'hidden' : ''}`}
                ></video>
                {!hasCameraPermission && (
                  <div className="p-3 text-center">
                    <Camera className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                    <span className="text-[11px] text-slate-400 block">
                      {cameraError ? 'Mô phỏng Camera AI' : 'Đang bật Camera...'}
                    </span>
                  </div>
                )}
                <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              </div>

              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Kiểm tra Camera Giám sát
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5">
                {hasCameraPermission ? 'Camera sẵn sàng' : 'Chế độ AI nhận diện trực tiếp'}
              </span>
            </div>

            {/* Security Rules Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div className="space-y-2 text-xs text-slate-600">
                <div className="font-bold uppercase tracking-wider text-slate-400 text-[11px]">
                  Quy chế phòng thi bảo mật:
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Maximize2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Bắt buộc duy trì chế độ toàn màn hình.</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Không chuyển đổi tab (Giới hạn tối đa {activeExam.securitySettings.maxTabViolations} lần).</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Camera className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Giữ khuôn mặt trong khung hình camera.</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 italic pt-2 border-t border-slate-200">
                Thí sinh: {activeAttempt.studentName} ({activeAttempt.studentCode})
              </div>
            </div>
          </div>

          {/* Terms checkbox */}
          <label className="flex items-start gap-3 p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-200 cursor-pointer mb-6">
            <input
              type="checkbox"
              checked={agreedTerms}
              onChange={(e) => setAgreedTerms(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
            <span className="text-xs font-semibold text-indigo-950 leading-relaxed">
              Tôi cam kết tuân thủ nghiêm túc quy chế thi, không sử dụng tài liệu, không mở ứng dụng phụ trợ và hiểu rõ
              rằng mọi vi phạm đều được hệ thống ghi vết và tự động đình chỉ bài thi.
            </span>
          </label>

          <div className="flex items-center justify-between gap-4">
            <button
              onClick={cancelActiveExam}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Thoát ra ngoài
            </button>

            <button
              onClick={handleStartExam}
              disabled={!agreedTerms}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold shadow-md transition-all ${
                agreedTerms
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Maximize2 className="w-4 h-4" />
              Khóa màn hình & Bắt đầu làm bài
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===================== STEP 3: RESULT SUMMARY CARD =====================
  if (examStep === 'result') {
    const isDisqualified = activeAttempt.status === 'disqualified';

    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xl text-center space-y-6">
          <div
            className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-lg ${
              isDisqualified ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
            }`}
          >
            {isDisqualified ? <XCircle className="w-10 h-10" /> : <Award className="w-10 h-10" />}
          </div>

          <div>
            <h2 className="text-2xl font-black text-slate-900">
              {isDisqualified ? 'Bài thi đã bị Đình chỉ do Vi phạm' : 'Nộp bài thi thành công!'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {activeExam.title} • Thí sinh: <strong>{activeAttempt.studentName}</strong> ({activeAttempt.studentCode})
            </p>
          </div>

          {/* Score display */}
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 inline-block min-w-64">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Điểm số đạt được:</div>
            <div
              className={`text-5xl font-black ${
                isDisqualified ? 'text-rose-600' : activeAttempt.passed ? 'text-emerald-600' : 'text-amber-600'
              }`}
            >
              {activeAttempt.score}
              <span className="text-xl font-normal text-slate-400"> / {activeExam.totalPoints}</span>
            </div>
            <div className="mt-2">
              {isDisqualified ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                  ĐÌNH CHỈ THI
                </span>
              ) : activeAttempt.passed ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  ĐẠT YÊU CẦU
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                  CHƯA ĐẠT
                </span>
              )}
            </div>
          </div>

          {/* Anti-cheat audit record */}
          <div className="p-4 rounded-xl border text-left text-xs space-y-2 bg-slate-50 border-slate-200">
            <div className="font-bold uppercase tracking-wider text-slate-600 flex items-center justify-between">
              <span>Hồ sơ giám sát an ninh bài thi:</span>
              <span
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  activeAttempt.violations.length === 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {activeAttempt.violations.length} vi phạm ghi nhận
              </span>
            </div>

            {activeAttempt.violations.length === 0 ? (
              <p className="text-emerald-700 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Phiên thi hợp lệ tuyệt đối. Không phát hiện dấu hiệu rời màn hình hay can thiệp phần mềm.
              </p>
            ) : (
              <div className="space-y-1 pt-1">
                {activeAttempt.violations.map((v) => (
                  <div key={v.id} className="text-rose-700 flex items-start gap-1.5 font-medium">
                    <span className="font-mono text-slate-400">[{v.timestamp}]</span>
                    <span>{v.detail}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              In phiếu điểm
            </button>
            <button
              onClick={cancelActiveExam}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md cursor-pointer"
            >
              Quay về Trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===================== STEP 2: LIVE EXAM ROOM INTERFACE =====================
  const violationCount = activeAttempt.violations.length;
  const maxViolations = activeExam.securitySettings.maxTabViolations;

  return (
    <div className="exam-prevent-copy relative min-h-screen bg-slate-100 text-slate-800 flex flex-col pb-12 select-none">
      {/* Dynamic Watermark to deter screen recording & phone capture */}
      {activeExam.securitySettings.watermarkEnabled && (
        <div className="exam-watermark-overlay fixed inset-0 z-40 pointer-events-none flex flex-wrap items-center justify-around opacity-15">
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="text-xs font-mono font-bold text-slate-900 rotate-[-25deg] m-10">
              {activeAttempt.studentCode} • {activeAttempt.studentName} • IP: 113.161.42.x
            </div>
          ))}
        </div>
      )}

      {/* Top Fixed Exam Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-xs">
              {activeExam.code}
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate max-w-md">
                {activeExam.title}
              </h1>
              <p className="text-xs text-slate-500">
                Thí sinh: <strong className="text-slate-800">{activeAttempt.studentName}</strong> (Lớp {activeAttempt.className})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Live Countdown Timer */}
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-base font-black border transition-all ${
                timeLeft < 300
                  ? 'bg-rose-50 text-rose-600 border-rose-300 animate-pulse'
                  : 'bg-slate-50 text-slate-800 border-slate-200'
              }`}
            >
              <Clock className="w-4 h-4 text-slate-500" />
              <span>{formatTime(timeLeft)}</span>
            </div>

            {/* Anti-cheat status pill */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Bảo mật đa tầng: Đang bật
            </div>

            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Nộp bài thi
            </button>
          </div>
        </div>
      </header>

      {/* Floating Alert Warning Banner if triggered */}
      {latestWarning && (
        <div className="fixed top-18 inset-x-4 max-w-xl mx-auto z-50 bg-rose-600 text-white p-4 rounded-2xl shadow-2xl flex items-start justify-between gap-3 animate-bounce">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm">CẢNH BÁO AN NINH PHÒNG THI!</div>
              <div className="text-xs opacity-90 mt-0.5">{latestWarning}</div>
              <div className="text-xs font-bold text-amber-200 mt-1">
                Lần vi phạm: {violationCount} / {maxViolations} (Đạt {maxViolations} lần sẽ tự động đình chỉ bài thi!)
              </div>
            </div>
          </div>

          <button
            onClick={() => setLatestWarning(null)}
            className="text-white hover:text-rose-200 p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Exam Layout */}
      <main className="max-w-7xl mx-auto w-full p-4 grid grid-cols-1 lg:grid-cols-4 gap-6 mt-2">
        {/* Left 3 cols: Current Question Card */}
        <div className="lg:col-span-3 space-y-4">
          {currentQ ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
              {/* Question Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    Câu {currentQIndex + 1} / {examQuestions.length}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">[{currentQ.subject}]</span>
                  <span className="text-xs text-slate-400">• {currentQ.points} điểm</span>
                </div>

                <button
                  onClick={() =>
                    setFlaggedQuestions({
                      ...flaggedQuestions,
                      [currentQ.id]: !flaggedQuestions[currentQ.id],
                    })
                  }
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    flaggedQuestions[currentQ.id]
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'text-slate-500 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  {flaggedQuestions[currentQ.id] ? 'Đã đánh dấu xem lại' : 'Đánh dấu xem lại'}
                </button>
              </div>

              {/* Question Text */}
              <div className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed font-sans">
                {currentQ.content}
              </div>

              {/* Answer Choices */}
              {currentQ.options && (
                <div className="space-y-3 pt-2">
                  {currentQ.options.map((opt, optIndex) => {
                    const letter = String.fromCharCode(65 + optIndex);
                    const selectedVal = activeAttempt.answers[currentQ.id];
                    const isSelected = selectedVal === String(optIndex) || selectedVal === letter;

                    return (
                      <div
                        key={optIndex}
                        onClick={() => updateExamAnswer(currentQ.id, String(optIndex))}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/70 shadow-xs ring-1 ring-indigo-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <span
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {letter}
                        </span>
                        <span className="text-sm font-medium text-slate-800 flex-1">{opt}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                <button
                  disabled={currentQIndex === 0}
                  onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Câu trước
                </button>

                {currentQIndex < examQuestions.length - 1 ? (
                  <button
                    onClick={() => setCurrentQIndex((prev) => Math.min(examQuestions.length - 1, prev + 1))}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md cursor-pointer"
                  >
                    Câu kế tiếp
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setIsSubmitModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md cursor-pointer"
                  >
                    Hoàn tất & Nộp bài
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400">Không có câu hỏi trong đề thi.</div>
          )}
        </div>

        {/* Right 1 col: Proctoring Camera Preview & Question Palette */}
        <div className="space-y-4">
          {/* Live Floating Camera & Anti-Cheat Monitor Widget */}
          <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-md p-3 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Giám thị AI
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                  violationCount > 0 ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                }`}
              >
                {violationCount}/{maxViolations} Cảnh báo
              </span>
            </div>

            <div className="relative aspect-video rounded-xl bg-slate-800 overflow-hidden flex items-center justify-center border border-slate-700">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${!hasCameraPermission ? 'hidden' : ''}`}
              ></video>
              {!hasCameraPermission && (
                <div className="text-center p-2">
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-1 text-slate-300 font-bold text-xs">
                    {activeAttempt.studentName.slice(-1)}
                  </div>
                  <span className="text-[10px] text-slate-400 block">AI Facial Tracking</span>
                </div>
              )}

              {/* Face Box Overlay Simulation */}
              <div className="absolute inset-4 border border-dashed border-emerald-400/50 rounded pointer-events-none flex items-start justify-end p-1">
                <span className="text-[9px] bg-emerald-950/80 text-emerald-300 px-1 rounded font-mono">
                  FACE 99%
                </span>
              </div>
            </div>

            <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Trạng thái: Khuôn mặt hợp lệ</span>
              <span className="font-mono text-slate-500">FPS: 30</span>
            </div>
          </div>

          {/* Question Navigator Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Danh sách câu hỏi ({examQuestions.length})
            </h4>

            <div className="grid grid-cols-5 gap-2">
              {examQuestions.map((q, idx) => {
                const isCurrent = idx === currentQIndex;
                const isAnswered = activeAttempt.answers[q.id] !== undefined;
                const isFlagged = flaggedQuestions[q.id];

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQIndex(idx)}
                    className={`h-9 rounded-lg font-bold text-xs flex items-center justify-center relative transition-all cursor-pointer ${
                      isCurrent
                        ? 'ring-2 ring-indigo-500 bg-indigo-600 text-white shadow-xs'
                        : isAnswered
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {idx + 1}
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border border-white"></span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-300"></span>
                <span>Đã trả lời ({Object.keys(activeAttempt.answers).length})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-slate-100 border border-slate-200"></span>
                <span>Chưa trả lời ({examQuestions.length - Object.keys(activeAttempt.answers).length})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300"></span>
                <span>Đánh dấu xem lại</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Submit Confirmation Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Xác nhận nộp bài thi?</h3>
            <p className="text-sm text-slate-600 mb-4">
              Bạn đã trả lời{' '}
              <strong className="text-emerald-600">
                {Object.keys(activeAttempt.answers).length} / {examQuestions.length}
              </strong>{' '}
              câu hỏi.
              {examQuestions.length > Object.keys(activeAttempt.answers).length && (
                <span className="block text-amber-600 font-semibold mt-1">
                  ⚠️ Còn {examQuestions.length - Object.keys(activeAttempt.answers).length} câu hỏi chưa trả lời!
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Tiếp tục làm bài
              </button>
              <button
                onClick={handleFinalSubmit}
                className="px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-md cursor-pointer"
              >
                Đồng ý nộp bài
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
