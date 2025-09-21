"use client";

import { useState, useRef, useEffect } from "react";
import { Lesson } from "@/types/lesson";
import { calculatePrice, calculateStudentCount } from "@/types/pricing";
import styles from "./Calendar.module.css";
import ViewLessonsModal from "./ViewLessonsModal";
import TemplatesModal from "./TemplatesModal";

interface CalendarProps {
  lessons: Lesson[];
  onDateClick: (date: Date) => void;
  onDeleteLesson?: (lessonId: string) => void;
  onClearDay?: (date: Date) => void;
}

export default function Calendar({
  lessons,
  onDateClick,
  onDeleteLesson,
  onClearDay,
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

  // Helper function to check if templates exist
  const checkTemplatesExist = (templateType: "odd" | "even") => {
    const key = templateType === "odd" ? "template_odd_days" : "template_even_days";
    const raw = typeof window !== "undefined" ? localStorage.getItem(key) : null;
    const templateLessons = raw ? JSON.parse(raw) : [];
    return templateLessons && templateLessons.length > 0;
  };

  // Async version to check templates from MongoDB first
  const checkTemplatesExistAsync = async (templateType: "odd" | "even") => {
    try {
      const { loadUserData } = await import('../lib/lessonSync');
      const userData = await loadUserData();
      return userData.templates[templateType] && userData.templates[templateType].length > 0;
    } catch (error) {
      console.error('Error checking templates from MongoDB:', error);
      // Fallback to localStorage check
      return checkTemplatesExist(templateType);
    }
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
    return lessons.filter((lesson) => lesson.date === dateString);
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

  const calculateMonthlySalary = (monthIndex: number) => {
    // Maaş dövrü: ayın 1-dən ayın son gününə qədər
    const salaryStartDate = new Date(currentYear, monthIndex, 1, 12, 0, 0);
    const salaryEndDate = new Date(currentYear, monthIndex + 1, 0, 12, 0, 0);

    const monthLessons = lessons.filter((lesson) => {
      const lessonDate = new Date(lesson.date + 'T12:00:00');
      return lessonDate >= salaryStartDate && lessonDate <= salaryEndDate;
    });

    let totalSalary = 0;

    monthLessons.forEach((lesson) => {
      const studentCount = calculateStudentCount(lesson.studentName);
      const lessonPrice = calculatePrice(lesson.subject, studentCount);
      totalSalary += lessonPrice;
    });

    const startDateStr = `${salaryStartDate.getDate()}.${(
      salaryStartDate.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}`;
    const endDateStr = `${salaryEndDate.getDate()}.${(
      salaryEndDate.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}`;

    alert(
      `${months[monthIndex]} ${currentYear} maaşı\n(${startDateStr} - ${endDateStr})\n\nÜmumi maaş: ${totalSalary} AZN\nDərs sayı: ${monthLessons.length}`
    );
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
              const year = lesson.date.split('-')[0];
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
        
        // Also update MongoDB using lessonSync
        try {
          const { saveLessons } = await import('../lib/lessonSync');
          await saveLessons(filtered);
          console.log('Successfully updated MongoDB after clearing day');
        } catch (error) {
          console.error('Error updating MongoDB after clearing day:', error);
        }
        
        window.location.reload();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleClearMonth = async (monthIndex: number) => {
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
            const year = lesson.date.split('-')[0];
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
      
      // Also update MongoDB using lessonSync
      try {
        const { saveLessons } = await import('../lib/lessonSync');
        await saveLessons(filtered);
        console.log('Successfully updated MongoDB after clearing month');
      } catch (error) {
        console.error('Error updating MongoDB after clearing month:', error);
      }
      
      alert(`Cleared all lessons in ${months[monthIndex]} ${currentYear}.`);
      window.location.reload();
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
      const key = pendingTemplateType === "odd" ? "template_odd_days" : "template_even_days";
      const raw = typeof window !== "undefined" ? localStorage.getItem(key) : null;
      
      console.log(`handleApplyTemplateToSelectedDays - template: ${pendingTemplateType}, key: ${key}, raw data:`, raw);
      
      const templateLessons: Array<{
        time: string;
        subject: string;
        studentName: string;
        notes?: string;
        duration: number;
      }> = raw ? JSON.parse(raw) : [];
      
      console.log(`handleApplyTemplateToSelectedDays - parsed templateLessons:`, templateLessons);
      
      if (!templateLessons || templateLessons.length === 0) {
        alert(`No ${pendingTemplateType} template lessons found. Please create template lessons first by going to Templates menu and adding lessons to the ${pendingTemplateType} template.`);
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
        const year = lesson.date.split('-')[0];
        if (!lessonsByYear[year]) {
          lessonsByYear[year] = [];
        }
        lessonsByYear[year].push(lesson);
      });
      localStorage.setItem("lessons", JSON.stringify(lessonsByYear));
      
      // Also save to MongoDB using lessonSync
      try {
        const { saveLessons } = await import('../lib/lessonSync');
        await saveLessons(existingLessons);
        console.log('Successfully saved selected days template lessons to MongoDB');
      } catch (error) {
        console.error('Error saving selected days template lessons to MongoDB:', error);
      }
      
      alert(`Added ${addedCount} lessons to selected days.`);
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert("Failed to apply template to selected days.");
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
    try {
      // Load templates from MongoDB first
      const { loadUserData } = await import('../lib/lessonSync');
      const userData = await loadUserData();
      
      console.log(`copyTemplateToMonth - template: ${template}, loaded userData:`, userData);
      
      const templateLessons = userData.templates[template] || [];
      
      console.log(`copyTemplateToMonth - templateLessons for ${template}:`, templateLessons);
      
      if (!templateLessons || templateLessons.length === 0) {
        alert(`No ${template} template lessons found. Please create template lessons first by going to Templates menu and adding lessons to the ${template} template.`);
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

      console.log('copyTemplateToMonth - templateLessons:', templateLessons);
      console.log('copyTemplateToMonth - targetWeekdays:', targetWeekdays);
      console.log('copyTemplateToMonth - daysInMonth:', daysInMonth);
      
      let addedCount = 0;
      for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(currentYear, monthIndex, d, 12, 0, 0);
        const weekday = dateObj.getDay(); // 0 Sun ... 6 Sat (Sunday-first)
        if (!targetWeekdays.includes(weekday)) continue;

        const yyyy = dateObj.getFullYear();
        const mm = (dateObj.getMonth() + 1).toString().padStart(2, "0");
        const dd = dateObj.getDate().toString().padStart(2, "0");
        const dateStr = `${yyyy}-${mm}-${dd}`;

        console.log(`Processing day ${d}, date: ${dateStr}, weekday: ${weekday}`);

        for (const tl of templateLessons) {
          // Prevent duplicate same date+time entries
          const duplicate = existingLessons.some(
            (l) => l.date === dateStr && l.time === tl.time
          );
          if (duplicate) {
            console.log(`Skipping duplicate lesson: ${dateStr} ${tl.time}`);
            continue;
          }
          
          const newLesson = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            date: dateStr,
            time: tl.time,
            subject: tl.subject,
            studentName: tl.studentName,
            notes: tl.notes || "",
            duration: tl.duration || 60,
          };
          
          console.log('Adding lesson:', newLesson);
          existingLessons.push(newLesson);
          addedCount++;
        }
      }
      
      console.log('copyTemplateToMonth - total addedCount:', addedCount);

      // Save to localStorage organized by year
      const lessonsByYear: { [year: string]: Lesson[] } = {};
      existingLessons.forEach(lesson => {
        const year = lesson.date.split('-')[0];
        if (!lessonsByYear[year]) {
          lessonsByYear[year] = [];
        }
        lessonsByYear[year].push(lesson);
      });
      localStorage.setItem("lessons", JSON.stringify(lessonsByYear));
      
      // Also save to MongoDB using lessonSync
      try {
        const { saveLessons } = await import('../lib/lessonSync');
        await saveLessons(existingLessons);
        console.log('Successfully saved template lessons to MongoDB');
      } catch (error) {
        console.error('Error saving template lessons to MongoDB:', error);
      }
      
      alert(
        `Added ${addedCount} lessons to ${months[monthIndex]} ${currentYear}.`
      );
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert("Failed to copy template to month.");
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
                    {(!checkTemplatesExist("odd") && !checkTemplatesExist("even")) && (
                      <div className={styles.templateInfo}>
                        <small>
                          💡 Templates are empty. Go to Templates menu to create odd/even day templates first.
                        </small>
                      </div>
                    )}
                  </div>
                  <div className={styles.headerActions}>
                    <button
                      className={styles.templateButton}
                      onClick={() => copyTemplateToMonth("odd", selectedMonth!)}
                      title="Apply odd days template to entire month"
                      disabled={!checkTemplatesExist("odd")}
                    >
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8M8 11h8m-7 4h6M5 7h.01M5 11h.01M5 15h.01" />
                      </svg>
                      Add Odd Template {!checkTemplatesExist("odd") && "(Empty)"}
                    </button>
                    <button
                      className={styles.templateButton}
                      onClick={() => copyTemplateToMonth("even", selectedMonth!)}
                      title="Apply even days template to entire month"
                      disabled={!checkTemplatesExist("even")}
                    >
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8M8 11h8m-7 4h6M19 7h.01M19 11h.01M19 15h.01" />
                      </svg>
                      Add Even Template {!checkTemplatesExist("even") && "(Empty)"}
                    </button>
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
                      // Sunday highlight
                      weekday === 0 ? styles.calendarDaySunday : "",
                      // Mon(1), Wed(3), Fri(5) highlight
                      weekday === 1 || weekday === 3 || weekday === 5
                        ? styles.calendarDayMonWedFri
                        : "",
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
                    title={checkTemplatesExist("odd") ? "Copy odd days template" : "No odd template found - create template first"}
                    disabled={!checkTemplatesExist("odd")}
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
                    title={checkTemplatesExist("even") ? "Copy even days template" : "No even template found - create template first"}
                    disabled={!checkTemplatesExist("even")}
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
          }}
        />
      )}
    </div>
  );
}
