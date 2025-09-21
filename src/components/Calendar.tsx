"use client";

import { useState, useRef, useEffect } from "react";
import { Lesson } from "@/types/lesson";
import { calculatePrice, calculateStudentCount } from "@/types/pricing";
import { saveLessons } from "@/lib/lessonSync";
import styles from "./Calendar.module.css";
import ViewLessonsModal from "./ViewLessonsModal";
import TemplatesModal from "./TemplatesModal";
import SalaryModal from "./SalaryModal";
import NotificationModal from "./NotificationModal";
import ConfirmationModal from "./ConfirmationModal";

interface CalendarProps {
  lessons: Lesson[];
  onDateClick: (date: Date) => void;
  onDeleteLesson?: (lessonId: string) => void;
  onClearDay?: (date: Date) => void;
  onLessonsUpdate?: () => void; // Callback to refresh lessons after template operations
}

export default function Calendar({
  lessons,
  onDateClick,
  onDeleteLesson,
  onClearDay,
  onLessonsUpdate,
}: CalendarProps) {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [isGrowing, setIsGrowing] = useState(false);
  const [expandedPosition, setExpandedPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
  });
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedDateForView, setSelectedDateForView] = useState<Date | null>(
    null
  );
  const monthRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [userName, setUserName] = useState<string>("");
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showTemplatesDropdown, setShowTemplatesDropdown] = useState(false);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [templateType, setTemplateType] = useState<"odd" | "even" | null>(null);
  const [showDaySelection, setShowDaySelection] = useState(false);
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());
  const [pendingTemplateType, setPendingTemplateType] = useState<"odd" | "even" | null>(null);
  const [templatesRefreshKey, setTemplatesRefreshKey] = useState(0);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [salaryModalData, setSalaryModalData] = useState<{
    lessons: Lesson[];
    monthName: string;
    year: number;
  } | null>(null);
  
  // Notification modal state
  const [notificationModal, setNotificationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  // Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });
  
  // Client-side only state for template existence
  const [templatesStatus, setTemplatesStatus] = useState<{
    odd: boolean;
    even: boolean;
    loaded: boolean;
  }>({
    odd: false,
    even: false,
    loaded: false
  });

  // Debug helper - log localStorage contents
  const debugLocalStorage = () => {
    console.log('🔍 DEBUG: localStorage contents:');
    console.log('template_odd_days:', localStorage.getItem('template_odd_days'));
    console.log('template_even_days:', localStorage.getItem('template_even_days'));
    console.log('lessons:', localStorage.getItem('lessons'));
    console.log('Current templatesStatus:', templatesStatus);
  };

  // Expose debug function globally (only in development)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).debugTemplates = debugLocalStorage;
      console.log('🛠️ Debug function available: call debugTemplates() in console');
    }
  }, [templatesStatus]);

  // Load template status on client side only
  useEffect(() => {
    const loadTemplateStatus = async () => {
      try {
        // Load templates from localStorage only using correct keys
        const STORAGE_KEYS = {
          odd: 'template_odd_days',
          even: 'template_even_days',
        };
        
        const oddTemplatesRaw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.odd) : null;
        const evenTemplatesRaw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.even) : null;
        
        const oddTemplates = oddTemplatesRaw ? JSON.parse(oddTemplatesRaw) : [];
        const evenTemplates = evenTemplatesRaw ? JSON.parse(evenTemplatesRaw) : [];
        
        const newStatus = {
          odd: oddTemplates.length > 0,
          even: evenTemplates.length > 0,
          loaded: true
        };
        
        console.log(`📊 Template Status:`, {
          oddCount: oddTemplates.length,
          evenCount: evenTemplates.length,
          newStatus
        });
        
        setTemplatesStatus(newStatus);
      } catch (error) {
        console.error('Error loading template status:', error);
        // Set loaded to true even on error to prevent infinite loading
        setTemplatesStatus(prev => ({ ...prev, loaded: true }));
      }
    };

    loadTemplateStatus();
  }, [templatesRefreshKey]);

  // Helper function to check if templates exist (client-side safe)
  const checkTemplatesExist = (templateType: "odd" | "even") => {
    const result = templatesStatus.loaded ? templatesStatus[templateType] : false;
    console.log(`🔍 checkTemplatesExist(${templateType}): loaded=${templatesStatus.loaded}, status=${templatesStatus[templateType]}, result=${result}`);
    return result;
  };

  useEffect(() => {
    try {
      const raw =
        typeof window !== "undefined" ? localStorage.getItem("authUser") : null;
      if (raw) {
        const u = JSON.parse(raw);
        setUserName(u?.name || u?.email || "");
      }
    } catch {}
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".dropdown")) {
        setShowProfileDropdown(false);
        setShowTemplatesDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const months = [
    "Yanvar",
    "Fevral",
    "Mart",
    "Aprel",
    "May",
    "İyun",
    "İyul",
    "Avqust",
    "Sentyabr",
    "Oktyabr",
    "Noyabr",
    "Dekabr",
  ];

  const weekDays = ["S", "M", "T", "W", "Th", "Fr", "Sa"];

  const getDaysInMonth = (year: number, month: number) => {
    // Maaş dövrü: ayın 1-dən ayın son gününə qədər
    const salaryStartDate = new Date(year, month, 1, 12, 0, 0);
    const salaryEndDate = new Date(year, month + 1, 0, 12, 0, 0);

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay(); // 0=Sun ... 6=Sat

    const days: {
      date: Date;
      isCurrentMonth: boolean;
      isSalaryPeriod: boolean;
    }[] = [];

    // Əvvəlki ayın son günləri (həftə düzülüşü üçün) - Sunday başlanğıc
    const sundayStartingDay = startingDay; // 0=Sun ... 6=Sat, use as-is for Sunday-first calendar
    for (let i = sundayStartingDay - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i, 12, 0, 0);
      const isSalaryPeriod =
        prevDate >= salaryStartDate && prevDate <= salaryEndDate;
      days.push({ date: prevDate, isCurrentMonth: false, isSalaryPeriod });
    }

    // Cari ayın günləri - timezone problemi yoxdur
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, month, i, 12, 0, 0); // Günün ortasında yarat
      const isSalaryPeriod =
        currentDate >= salaryStartDate && currentDate <= salaryEndDate;
      days.push({ date: currentDate, isCurrentMonth: true, isSalaryPeriod });
    }

    // Növbəti ayın ilk günləri (6x7 = 42 hüceyrə)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i, 12, 0, 0);
      const isSalaryPeriod =
        nextDate >= salaryStartDate && nextDate <= salaryEndDate;
      days.push({ date: nextDate, isCurrentMonth: false, isSalaryPeriod });
    }

    return days;
  };

  const getLessonsForDate = (date: Date) => {
    const dateString = date.toISOString().split("T")[0];
    const filteredLessons = lessons.filter((lesson) => lesson.date === dateString);
    
    // Debug logging for the first few days to see what's happening
    if (date.getDate() <= 3 && date.getMonth() === 0) { // First 3 days of January
      console.log(`getLessonsForDate: ${dateString}, found ${filteredLessons.length} lessons`);
      console.log('Available lessons sample:', lessons.slice(0, 5).map(l => ({ date: l.date, subject: l.subject })));
    }
    
    return filteredLessons;
  };

  const handleMonthClick = (monthIndex: number) => {
    const monthElement = monthRefs.current[monthIndex];
    if (monthElement) {
      const rect = monthElement.getBoundingClientRect();
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft =
        window.pageXOffset || document.documentElement.scrollLeft;

      setExpandedPosition({
        top: rect.top + scrollTop,
        left: rect.left + scrollLeft,
        width: rect.width,
        height: rect.height,
      });

      setSelectedMonth(monthIndex);
      setIsExpanded(true);
      setIsClosing(false);
      setShowContent(false);
      setIsGrowing(false);

      // after center animation (600ms), start grow and show content
      setTimeout(() => {
        setIsGrowing(true);
        setShowContent(true);
      }, 600);
    }
  };

  const handleCloseMonth = () => {
    setIsClosing(true);
    setShowContent(false);
    setIsGrowing(false);
    setTimeout(() => {
      setIsExpanded(false);
      setIsClosing(false);
      setSelectedMonth(null);
    }, 1000);
  };

  const goToPreviousYear = () => {
    setCurrentYear((prev) => prev - 1);
  };

  const goToNextYear = () => {
    setCurrentYear((prev) => prev + 1);
  };

  const handleViewLessons = (date: Date) => {
    setSelectedDateForView(date);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedDateForView(null);
  };

  const goToCurrentYear = () => {
    setCurrentYear(new Date().getFullYear());
  };

  const showNotification = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotificationModal({
      isOpen: true,
      title,
      message,
      type
    });
  };

  const closeNotification = () => {
    setNotificationModal(prev => ({ ...prev, isOpen: false }));
  };

  const calculateMonthlySalary = (monthIndex: number) => {
    // Maaş dövrü: ayın 1-dən ayın son gününə qədər
    const salaryStartDate = new Date(currentYear, monthIndex, 1, 12, 0, 0);
    const salaryEndDate = new Date(currentYear, monthIndex + 1, 0, 12, 0, 0);

    const monthLessons = lessons.filter((lesson) => {
      const lessonDate = new Date(lesson.date + 'T12:00:00');
      return lessonDate >= salaryStartDate && lessonDate <= salaryEndDate;
    });

    // Open the detailed salary modal
    setSalaryModalData({
      lessons: monthLessons,
      monthName: months[monthIndex],
      year: currentYear
    });
    setIsSalaryModalOpen(true);
  };

  const handleClearDay = async (date: Date) => {
    if (onClearDay) {
      onClearDay(date);
    } else {
      // Fallback to old behavior if no callback provided
      try {
        const yyyy = date.getFullYear();
        const mm = (date.getMonth() + 1).toString().padStart(2, "0");
        const dd = date.getDate().toString().padStart(2, "0");
        const dateStr = `${yyyy}-${mm}-${dd}`;
        const existingRaw =
          typeof window !== "undefined" ? localStorage.getItem("lessons") : null;
        
        let existingLessons: any[] = [];
        if (existingRaw) {
          const lessonsData = JSON.parse(existingRaw);
          if (typeof lessonsData === 'object' && !Array.isArray(lessonsData)) {
            // New format: organized by year
            existingLessons = Object.values(lessonsData).flat();
          } else {
            // Old format: flat array
            existingLessons = lessonsData;
          }
        }
        
        const filtered = existingLessons.filter((l) => l.date !== dateStr);
        
        // Save back in the same format
        if (existingRaw) {
          const lessonsData = JSON.parse(existingRaw);
          if (typeof lessonsData === 'object' && !Array.isArray(lessonsData)) {
            // New format: organize by year
            const lessonsByYear: { [year: string]: any[] } = {};
            filtered.forEach(lesson => {
              const year = lesson.date ? lesson.date.split('-')[0] : new Date().getFullYear().toString();
              if (!lessonsByYear[year]) {
                lessonsByYear[year] = [];
              }
              lessonsByYear[year].push(lesson);
            });
            localStorage.setItem("lessons", JSON.stringify(lessonsByYear));
          } else {
            // Old format: flat array
            localStorage.setItem("lessons", JSON.stringify(filtered));
          }
        }
        
        
        // Refresh lessons in parent component
        if (onLessonsUpdate) {
          onLessonsUpdate();
        } else {
          window.location.reload();
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleClearMonth = (monthIndex: number) => {
    const monthName = months[monthIndex];
    
    // Show confirmation modal first
    setConfirmationModal({
      isOpen: true,
      title: 'Ayı təmizlə',
      message: `${monthName} ${currentYear} ayındakı bütün dərslər silinəcək. Bu əməliyyat geri alına bilməz. Davam etmək istəyirsiniz?`,
      onConfirm: () => performClearMonth(monthIndex)
    });
  };

  const performClearMonth = async (monthIndex: number) => {
    try {
      const monthStart = new Date(currentYear, monthIndex, 1, 12, 0, 0);
      const monthEnd = new Date(currentYear, monthIndex + 1, 0, 12, 0, 0);
      const existingRaw =
        typeof window !== "undefined" ? localStorage.getItem("lessons") : null;
      
      let existingLessons: any[] = [];
      if (existingRaw) {
        const lessonsData = JSON.parse(existingRaw);
        if (typeof lessonsData === 'object' && !Array.isArray(lessonsData)) {
          // New format: organized by year
          existingLessons = Object.values(lessonsData).flat();
        } else {
          // Old format: flat array
          existingLessons = lessonsData;
        }
      }
      
      const filtered = existingLessons.filter((l) => {
        const d = new Date(l.date + 'T12:00:00');
        return d < monthStart || d > monthEnd;
      });
      
      // Save back in the same format
      if (existingRaw) {
        const lessonsData = JSON.parse(existingRaw);
        if (typeof lessonsData === 'object' && !Array.isArray(lessonsData)) {
          // New format: organize by year
          const lessonsByYear: { [year: string]: any[] } = {};
          filtered.forEach(lesson => {
            const year = lesson.date ? lesson.date.split('-')[0] : new Date().getFullYear().toString();
            if (!lessonsByYear[year]) {
              lessonsByYear[year] = [];
            }
            lessonsByYear[year].push(lesson);
          });
          localStorage.setItem("lessons", JSON.stringify(lessonsByYear));
        } else {
          // Old format: flat array
          localStorage.setItem("lessons", JSON.stringify(filtered));
        }
      }
      
      // Also save to MongoDB
      try {
        await saveLessons(filtered);
        console.log('Successfully saved filtered lessons to MongoDB after clearing month');
      } catch (error) {
        console.error('Error saving filtered lessons to MongoDB:', error);
      }
      
      
      showNotification(
        "Ay təmizləndi",
        `${months[monthIndex]} ${currentYear} ayındakı bütün dərslər silindi.`,
        'success'
      );
      
      // Refresh lessons in parent component
      if (onLessonsUpdate) {
        onLessonsUpdate();
      } else {
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTemplateButtonClick = (template: "odd" | "even") => {
    setPendingTemplateType(template);
    setShowDaySelection(true);
    setSelectedDays(new Set());
  };

  const handleDayToggle = (dayNumber: number) => {
    const newSelectedDays = new Set(selectedDays);
    if (newSelectedDays.has(dayNumber)) {
      newSelectedDays.delete(dayNumber);
    } else {
      newSelectedDays.add(dayNumber);
    }
    setSelectedDays(newSelectedDays);
  };

  const handleApplyTemplateToSelectedDays = async () => {
    if (!pendingTemplateType || selectedDays.size === 0) return;
    
    try {
      // Load templates from localStorage only using correct keys
      const STORAGE_KEYS = {
        odd: 'template_odd_days',
        even: 'template_even_days',
      };
      
      const templatesRaw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS[pendingTemplateType!]) : null;
      const templateLessons = templatesRaw ? JSON.parse(templatesRaw) : [];
      
      console.log(`handleApplyTemplateToSelectedDays - template: ${pendingTemplateType}, loaded templateLessons:`, templateLessons);
      
      if (!templateLessons || templateLessons.length === 0) {
        showNotification(
          "Template tapılmadı",
          `${pendingTemplateType} template dərsləri tapılmadı. Əvvəlcə Templates menyusuna gedərək ${pendingTemplateType} template-ə dərslər əlavə edin.`,
          'error'
        );
        return;
      }

      const existingRaw = typeof window !== "undefined" ? localStorage.getItem("lessons") : null;
      
      let existingLessons: any[] = [];
      if (existingRaw) {
        const lessonsData = JSON.parse(existingRaw);
        if (typeof lessonsData === 'object' && !Array.isArray(lessonsData)) {
          // New format: organized by year
          existingLessons = Object.values(lessonsData).flat();
        } else {
          // Old format: flat array
          existingLessons = lessonsData;
        }
      }

      let addedCount = 0;
      selectedDays.forEach(dayNumber => {
        const dateObj = new Date(currentYear, selectedMonth!, dayNumber, 12, 0, 0);
        const yyyy = dateObj.getFullYear();
        const mm = (dateObj.getMonth() + 1).toString().padStart(2, "0");
        const dd = dateObj.getDate().toString().padStart(2, "0");
        const dateStr = `${yyyy}-${mm}-${dd}`;

        for (const tl of templateLessons) {
          // Prevent duplicate same date+time entries
          const duplicate = existingLessons.some(
            (l) => l.date === dateStr && l.time === tl.time
          );
          if (duplicate) continue;
          existingLessons.push({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            date: dateStr,
            time: tl.time,
            subject: tl.subject,
            studentName: tl.studentName,
            notes: tl.notes || "",
            duration: tl.duration || 60,
          });
          addedCount++;
        }
      });

      // Save to localStorage organized by year
      const lessonsByYear: { [year: string]: Lesson[] } = {};
      existingLessons.forEach(lesson => {
        const year = lesson.date ? lesson.date.split('-')[0] : new Date().getFullYear().toString();
        if (!lessonsByYear[year]) {
          lessonsByYear[year] = [];
        }
        lessonsByYear[year].push(lesson);
      });
      localStorage.setItem("lessons", JSON.stringify(lessonsByYear));
      
      // Also save to MongoDB
      try {
        console.log('Saving template lessons to MongoDB:', existingLessons.length, 'lessons');
        await saveLessons(existingLessons);
        console.log('Successfully saved template lessons to MongoDB');
      } catch (error) {
        console.error('Error saving template lessons to MongoDB:', error);
      }
      
      // Refresh lessons in parent component FIRST
      if (onLessonsUpdate) {
        await onLessonsUpdate();
      }
      
      // Refresh template status after successful operation
      setTemplatesRefreshKey(prev => prev + 1);
      
      showNotification(
        "Template tətbiq edildi",
        `Seçilmiş günlərə ${addedCount} dərs əlavə edildi.`,
        'success'
      );
      
      // Fallback reload if no callback provided
      if (!onLessonsUpdate) {
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
      showNotification(
        "Xəta",
        "Template seçilmiş günlərə tətbiq edilə bilmədi.",
        'error'
      );
      
      // Refresh template status even on error to ensure UI is up to date
      setTemplatesRefreshKey(prev => prev + 1);
    }

    // Reset state
    setShowDaySelection(false);
    setSelectedDays(new Set());
    setPendingTemplateType(null);
  };

  const copyTemplateToMonth = async (
    template: "odd" | "even",
    monthIndex: number
  ) => {
    console.log(`🔥 copyTemplateToMonth called with template: ${template}, monthIndex: ${monthIndex}`);
    
    try {
      // Load templates from localStorage only using correct keys
      const STORAGE_KEYS = {
        odd: 'template_odd_days',
        even: 'template_even_days',
      };
      
      console.log(`🔍 Looking for template key: ${STORAGE_KEYS[template]}`);
      const templatesRaw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS[template]) : null;
      console.log(`📦 Raw template data:`, templatesRaw);
      
      const templateLessons = templatesRaw ? JSON.parse(templatesRaw) : [];
      console.log(`📚 Parsed template lessons:`, templateLessons);
      
      if (templateLessons.length > 0) {
        console.log(`✅ Found ${templateLessons.length} template lessons`);
      }
      
      if (!templateLessons || templateLessons.length === 0) {
        console.log(`❌ No template lessons found for ${template}`);
        showNotification(
          "Template tapılmadı",
          `${template} template dərsləri tapılmadı. Əvvəlcə Templates menyusuna gedərək ${template} template-ə dərslər əlavə edin.`,
          'error'
        );
        // Refresh template status to reflect current state
        setTemplatesRefreshKey(prev => prev + 1);
        return;
      }

      const start = new Date(currentYear, monthIndex, 1, 12, 0, 0);
      const end = new Date(currentYear, monthIndex + 1, 0, 12, 0, 0);
      const daysInMonth = end.getDate();

      // odd => Mon(1), Wed(3), Fri(5); even => Tue(2), Thu(4), Sat(6)
      // Using Sunday-first indexing: Sun=0, Mon=1, ... Sat=6
      const targetWeekdays = template === "odd" ? [1, 3, 5] : [2, 4, 6];

      const existingRaw =
        typeof window !== "undefined" ? localStorage.getItem("lessons") : null;
      
      let existingLessons: any[] = [];
      if (existingRaw) {
        const lessonsData = JSON.parse(existingRaw);
        if (typeof lessonsData === 'object' && !Array.isArray(lessonsData)) {
          // New format: organized by year
          existingLessons = Object.values(lessonsData).flat();
        } else {
          // Old format: flat array
          existingLessons = lessonsData;
        }
      }

      
      let addedCount = 0;
      
      for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(currentYear, monthIndex, d, 12, 0, 0);
        const weekday = dateObj.getDay(); // 0 Sun ... 6 Sat (Sunday-first)
        if (!targetWeekdays.includes(weekday)) continue;

        const yyyy = dateObj.getFullYear();
        const mm = (dateObj.getMonth() + 1).toString().padStart(2, "0");
        const dd = dateObj.getDate().toString().padStart(2, "0");
        const dateStr = `${yyyy}-${mm}-${dd}`;


        for (const tl of templateLessons) {
          console.log('Template lesson (tl):', tl);
          console.log('Date string being assigned:', dateStr);
          
          // Prevent duplicate same date+time entries
          const duplicate = existingLessons.some(
            (l) => l.date === dateStr && l.time === tl.time
          );
          if (duplicate) {
            console.log('Skipping duplicate lesson');
            continue;
          }
          
          const newLesson = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            date: dateStr, // EXPLICITLY set the date
            time: tl.time,
            subject: tl.subject,
            studentName: tl.studentName,
            notes: tl.notes || "",
            duration: tl.duration || 60,
          };
          
          // FORCE date field multiple times to ensure it's never lost
          newLesson.date = dateStr;
          newLesson['date'] = dateStr;
          Object.defineProperty(newLesson, 'date', { value: dateStr, writable: true, enumerable: true, configurable: true });
          
          console.log('Created newLesson from template:', newLesson);
          console.log('newLesson has date?', !!newLesson.date);
          console.log('newLesson date value:', newLesson.date);
          
          existingLessons.push(newLesson);
          addedCount++;
        }
      }
      

      if (addedCount === 0) {
        showNotification(
          "Dərs əlavə edilmədi",
          `${months[monthIndex]} ayındakı bütün ${template} günlər artıq dərslərə malikdir, və ya bu ayda ${template} günlər mövcud deyil.`,
          'info'
        );
        return;
      }

      // Save to localStorage organized by year
      const lessonsByYear: { [year: string]: Lesson[] } = {};
      existingLessons.forEach(lesson => {
        const year = lesson.date ? lesson.date.split('-')[0] : new Date().getFullYear().toString();
        if (!lessonsByYear[year]) {
          lessonsByYear[year] = [];
        }
        lessonsByYear[year].push(lesson);
      });
      localStorage.setItem("lessons", JSON.stringify(lessonsByYear));
      
      // Also save to MongoDB
      try {
        console.log('Saving copyTemplateToMonth lessons to MongoDB:', existingLessons.length, 'lessons');
        await saveLessons(existingLessons);
        console.log('Successfully saved copyTemplateToMonth lessons to MongoDB');
      } catch (error) {
        console.error('Error saving copyTemplateToMonth lessons to MongoDB:', error);
      }

      // Refresh lessons in parent component FIRST
      if (onLessonsUpdate) {
        await onLessonsUpdate();
      }
      
      // Refresh template status after successful operation
      setTemplatesRefreshKey(prev => prev + 1);
      
      showNotification(
        "Template tətbiq edildi",
        `${months[monthIndex]} ${currentYear} ayına ${addedCount} dərs əlavə edildi.`,
        'success'
      );
      
      // Fallback reload if no callback provided
      if (!onLessonsUpdate) {
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
      showNotification(
        "Xəta",
        "Template aya kopyalanmadı.",
        'error'
      );
      
      // Refresh template status even on error to ensure UI is up to date
      setTemplatesRefreshKey(prev => prev + 1);
    }
  };

  // Əgər ay seçilibsə və expanded-dirsə, o ayın calendar-ini göstər
  if (selectedMonth !== null && isExpanded) {
    const days = getDaysInMonth(currentYear, selectedMonth);

    return (
      <>
        <div className={styles.expandedOverlay}>
          {/* Container with two-stage animation */}
          <div
            className={`${styles.expandedContainer} ${
              isClosing
                ? styles.closeAnimation
                : isGrowing
                ? styles.growAnimation
                : styles.expandAnimation
            }`}
            style={
              {
                position: "fixed",
                top: expandedPosition.top,
                left: expandedPosition.left,
                width: expandedPosition.width,
                height: expandedPosition.height,
                zIndex: 50,
                "--start-top": `${expandedPosition.top}px`,
                "--start-left": `${expandedPosition.left}px`,
                "--start-width": `${expandedPosition.width}px`,
                "--start-height": `${expandedPosition.height}px`,
              } as any
            }
          >
            {/* Header inside container */}
            {showContent && (
              <div className={styles.expandedHeader}>
                <div className={styles.expandedHeaderContent}>
                  <div>
                    <h2 className={styles.expandedTitle}>
                      {months[selectedMonth]} {currentYear}
                    </h2>
                    <p className={styles.expandedSubtitle}>
                      Aya vuraraq günlərə dərs əlavə edin
                    </p>
                    {templatesStatus.loaded && (!checkTemplatesExist("odd") && !checkTemplatesExist("even")) && (
                      <div className={styles.templateInfo} key={templatesRefreshKey}>
                        <small>
                          💡 Templates are empty. Go to Templates menu to create odd/even day templates first.
                        </small>
                      </div>
                    )}
                    {!templatesStatus.loaded && (
                      <div className={styles.templateInfo}>
                        <small>
                          🔄 Loading templates...
                        </small>
                      </div>
                    )}
                  </div>
                  <div className={styles.headerActions}>

                    <button
                      className={styles.templateButton}
                      onClick={() => handleTemplateButtonClick("odd")}
                      title="Select specific days for odd template"
                    >
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Select Odd Days
                    </button>
                    <button
                      className={styles.templateButton}
                      onClick={() => handleTemplateButtonClick("even")}
                      title="Select specific days for even template"
                    >
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Select Even Days
                    </button>
                    <button
                      onClick={handleCloseMonth}
                      className={styles.closeButton}
                    >
                      <svg
                        className="w-8 h-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Calendar Content */}
            {showContent && (
              <div className={styles.calendarContent}>
                {/* Week days header */}
                <div className={styles.weekDaysHeader}>
                  {weekDays.map((day, index) => (
                    <div key={index} className={styles.weekDay}>
                      {day}
                    </div>
                  ))}
                </div>

                {/* Day selection controls */}
                {showDaySelection && (
                  <div className={styles.daySelectionControls}>
                    <div className={styles.selectionInfo}>
                      <span>Select days for {pendingTemplateType} template:</span>
                      <span className={styles.selectedCount}>{selectedDays.size} selected</span>
                    </div>
                    <div className={styles.selectionActions}>
                      <button
                        className={styles.cancelButton}
                        onClick={() => {
                          setShowDaySelection(false);
                          setSelectedDays(new Set());
                          setPendingTemplateType(null);
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        className={styles.applyButton}
                        onClick={handleApplyTemplateToSelectedDays}
                        disabled={selectedDays.size === 0}
                      >
                        Apply to {selectedDays.size} days
                      </button>
                    </div>
                  </div>
                )}

                {/* Calendar grid */}
                <div className={styles.calendarGrid}>
                  {days.map((day, dayIndex) => {
                    const dayLessons = getLessonsForDate(day.date);
                    const isToday =
                      day.date.toDateString() === new Date().toDateString();
                    const isCurrentMonth = day.isCurrentMonth;
                    const isSalaryPeriod = day.isSalaryPeriod;
                    const weekday = day.date.getDay(); // 0 Sun ... 6 Sat
                    const dayNumber = day.date.getDate();
                    const isSelected = selectedDays.has(dayNumber);

                    const dayClasses = [
                      styles.calendarDay,
                      isCurrentMonth
                        ? styles.calendarDayCurrentMonth
                        : styles.calendarDayOtherMonth,
                      isToday ? styles.calendarDayToday : "",
                      dayLessons.length > 0
                        ? styles.calendarDayWithLessons
                        : "",
                      isSalaryPeriod ? styles.calendarDaySalaryPeriod : "",
                      // Sunday highlight (yellow)
                      weekday === 0 ? styles.calendarDaySunday : "",
                      // Monday, Wednesday, Friday (light gray)
                      weekday === 1 || weekday === 3 || weekday === 5 ? styles.calendarDayMonWedFri : "",
                      // Tuesday, Thursday, Saturday (darker gray)
                      weekday === 2 || weekday === 4 || weekday === 6 ? styles.calendarDayTueThuSat : "",
                    ]
                      .filter(Boolean)
                      .join(" ");

                    const numberClasses = [
                      styles.dayNumber,
                      isCurrentMonth
                        ? styles.dayNumberCurrentMonth
                        : styles.dayNumberOtherMonth,
                      isToday ? styles.dayNumberToday : "",
                    ]
                      .filter(Boolean)
                      .join(" ");

                    return (
                      <div
                        key={dayIndex}
                        onClick={() => {
                          if (showDaySelection && isCurrentMonth) {
                            handleDayToggle(dayNumber);
                          } else {
                            onDateClick(day.date);
                          }
                        }}
                        className={dayClasses}
                      >
                        {showDaySelection && isCurrentMonth && (
                          <div className={styles.dayCheckbox}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleDayToggle(dayNumber)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        )}
                        <div className={numberClasses}>
                          {day.date.getDate()}
                        </div>

                        {/* Lesson indicators */}
                        {dayLessons.slice(0, 2).map((lesson) => (
                          <div
                            key={lesson.id}
                            className={styles.lessonIndicator}
                            title={`${lesson.time} - ${lesson.subject}`}
                          >
                            {lesson.time}
                          </div>
                        ))}

                        {dayLessons.length > 2 && (
                          <div className={styles.moreLessonsText}>
                            +{dayLessons.length - 2} daha
                          </div>
                        )}

                        {/* Hover actions */}
                        <div className={styles.hoverActions}>
                          <div
                            className={styles.hoverAction}
                            onClick={(e) => {
                              e.stopPropagation();
                              onDateClick(day.date);
                            }}
                            title="Dərs əlavə et"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            <span>Əlavə et</span>
                          </div>
                          <div
                            className={styles.hoverAction}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewLessons(day.date);
                            }}
                            title="Dərslərə bax"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                            <span>Bax</span>
                          </div>
                          {dayLessons.length > 0 && (
                            <div
                              className={`${styles.hoverAction} ${styles.hoverActionDanger}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClearDay(day.date);
                              }}
                              title="Günü təmizlə"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                              <span>Təmizlə</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* View Lessons Modal - Outside expanded overlay */}
        {isViewModalOpen && selectedDateForView && (
          <ViewLessonsModal
            date={selectedDateForView}
            lessons={lessons.filter(
              (lesson) =>
                lesson.date === selectedDateForView.toISOString().split("T")[0]
            )}
            onClose={handleCloseViewModal}
            onDelete={onDeleteLesson || (() => {})}
          />
        )}
      </>
    );
  }

  // Əsas səhifə - ayların grid-i
  return (
    <div className={styles.container}>
      {/* Header Navigation */}
      <div className={styles.modernHeader}>
        <div className={styles.headerContainer}>
          {/* Left Section - Welcome */}
          <div className={styles.left}>
            <div className={styles.welcome}>
              {userName ? (
                <>
                  <div className={styles.icon}>
                    <svg
                      width="20"
                      height="20"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <span className={styles.text}>Welcome, {userName}</span>
                </>
              ) : (
                <div className={styles.title}>Lesson Tracker</div>
              )}
            </div>
          </div>

          {/* Center Section - Year Navigation */}
          <div className={styles.center}>
            <div className={styles.yearNav}>
              <button onClick={goToPreviousYear} className={styles.navBtn}>
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <div className={styles.yearDisplay}>
                <h1 className={styles.year}>{currentYear}</h1>
              </div>

              <button onClick={goToNextYear} className={styles.navBtn}>
                <svg
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Right Section - Controls */}
          <div className={styles.right}>
            {/* Templates Dropdown */}
            <div className={`${styles.dropdown} dropdown`}>
              <button
                className={styles.dropdownButton}
                onClick={() => {
                  setShowTemplatesDropdown(!showTemplatesDropdown);
                  setShowProfileDropdown(false);
                }}
                title="Templates"
              >
                <svg
                  width="18"
                  height="18"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                Templates
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {showTemplatesDropdown && (
                <div className={styles.dropdownMenu}>
                  <button
                    className={styles.dropdownItem}
                    onClick={() => {
                      setTemplateType("odd");
                      setIsTemplatesModalOpen(true);
                      setShowTemplatesDropdown(false);
                    }}
                  >
                    Odd days template
                  </button>
                  <button
                    className={styles.dropdownItem}
                    onClick={() => {
                      setTemplateType("even");
                      setIsTemplatesModalOpen(true);
                      setShowTemplatesDropdown(false);
                    }}
                  >
                    Even days template
                  </button>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className={`${styles.dropdown} dropdown`}>
              <button
                className={styles.profileButton}
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                title="Profile Menu"
              >
                <div className={styles.profileAvatar}>
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <span className={styles.profileText}>Profile</span>
                <svg
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {showProfileDropdown && (
                <div className={styles.dropdownMenu}>
                  <button
                    className={styles.dropdownItem}
                    onClick={() => {
                      window.location.href = "/login";
                      setShowProfileDropdown(false);
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    View Profile
                  </button>
                  <button
                    className={styles.dropdownItem}
                    onClick={() => {
                      localStorage.removeItem("authUser");
                      window.location.href = "/login";
                      setShowProfileDropdown(false);
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Months Grid */}
      <div className={styles.monthsGrid}>
        {months.map((monthName, monthIndex) => {
          // Maaş dövrü: ayın 1-dən ayın son gününə qədər
          const salaryStartDate = new Date(currentYear, monthIndex, 1, 12, 0, 0);
          const salaryEndDate = new Date(currentYear, monthIndex + 1, 0, 12, 0, 0);

          const monthLessons = lessons.filter((lesson) => {
            const lessonDate = new Date(lesson.date + 'T12:00:00');
            return lessonDate >= salaryStartDate && lessonDate <= salaryEndDate;
          });

          return (
            <div
              key={monthIndex}
              ref={(el) => {
                monthRefs.current[monthIndex] = el;
              }}
              onClick={() => handleMonthClick(monthIndex)}
              className={styles.monthCard}
            >
              <div className={styles.monthCardContent}>
                <h3 className={styles.monthTitle}>{monthName}</h3>

                {/* Month stats */}
                <div className={styles.monthStats}>
                  <div className={styles.lessonCount}>
                    {monthLessons.length} dərs
                  </div>

                  {/* Visual indicator */}
                  <div className={styles.visualIndicator}>
                    <div
                      className={`${styles.indicatorDot} ${
                        monthLessons.length > 0
                          ? styles.indicatorDotActive
                          : styles.indicatorDotInactive
                      }`}
                    ></div>
                  </div>
                </div>

                {/* Hover effect */}
                <div className={styles.hoverText}>Vuraraq açın →</div>

                {/* Hover Action Buttons */}
                <div className={styles.monthHoverButtons}>
                  <button
                    className={styles.monthActionButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      calculateMonthlySalary(monthIndex);
                    }}
                    title="Maaşı hesabla"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      />
                    </svg>
                    <span>Maaş</span>
                  </button>
                  <button
                    className={`${styles.monthActionButton} ${styles.monthActionButtonSuccess}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      copyTemplateToMonth("odd", monthIndex);
                    }}
                    title={!templatesStatus.loaded ? "Loading templates..." : (checkTemplatesExist("odd") ? "Copy odd days template" : "No odd template found - create template first")}
                    disabled={!templatesStatus.loaded || !checkTemplatesExist("odd")}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7h8M8 11h8m-7 4h6M5 7h.01M5 11h.01M5 15h.01"
                      />
                    </svg>
                    <span>Odd</span>
                  </button>
                  <button
                    className={`${styles.monthActionButton} ${styles.monthActionButtonSuccess}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      copyTemplateToMonth("even", monthIndex);
                    }}
                    title={!templatesStatus.loaded ? "Loading templates..." : (checkTemplatesExist("even") ? "Copy even days template" : "No even template found - create template first")}
                    disabled={!templatesStatus.loaded || !checkTemplatesExist("even")}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7h8M8 11h8m-7 4h6M19 7h.01M19 11h.01M19 15h.01"
                      />
                    </svg>
                    <span>Even</span>
                  </button>
                  <button
                    className={`${styles.monthActionButton} ${styles.monthActionButtonDanger}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearMonth(monthIndex);
                    }}
                    title="Clear month"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    <span>Clear</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* View Lessons Modal */}
      {isViewModalOpen && selectedDateForView && (
        <ViewLessonsModal
          date={selectedDateForView}
          lessons={lessons.filter(
            (lesson) =>
              lesson.date === selectedDateForView.toISOString().split("T")[0]
          )}
          onClose={handleCloseViewModal}
          onDelete={onDeleteLesson || (() => {})}
        />
      )}

      {/* Templates Modal */}
      {isTemplatesModalOpen && templateType && (
        <TemplatesModal
          templateType={templateType}
          onClose={() => {
            setIsTemplatesModalOpen(false);
            setTemplateType(null);
            setTemplatesRefreshKey(prev => prev + 1); // Force refresh template checks
          }}
        />
      )}

      {/* Salary Modal */}
      {isSalaryModalOpen && salaryModalData && (
        <SalaryModal
          isOpen={isSalaryModalOpen}
          onClose={() => {
            setIsSalaryModalOpen(false);
            setSalaryModalData(null);
          }}
          lessons={salaryModalData.lessons}
          monthName={salaryModalData.monthName}
          year={salaryModalData.year}
        />
      )}

      {/* Notification Modal */}
      <NotificationModal
        isOpen={notificationModal.isOpen}
        onClose={closeNotification}
        title={notificationModal.title}
        message={notificationModal.message}
        type={notificationModal.type}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmationModal.onConfirm}
        title={confirmationModal.title}
        message={confirmationModal.message}
        confirmText="Sil"
        cancelText="Ləğv et"
      />
    </div>
  );
}
