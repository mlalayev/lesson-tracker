"use client";

import { useState, useRef } from "react";
import { Lesson } from "@/types/lesson";
import { calculatePrice, calculateStudentCount } from "@/types/pricing";
import styles from "./Calendar.module.css";
import ViewLessonsModal from "./ViewLessonsModal";

interface CalendarProps {
  lessons: Lesson[];
  onDateClick: (date: Date) => void;
  onDeleteLesson?: (lessonId: string) => void;
  onClearMonth?: (year: number, month: number, startDate?: Date, endDate?: Date) => void;
  onCopyTemplate?: (type: 'odd' | 'even', year: number, month: number) => void;
  onOpenTemplate?: (type: 'odd' | 'even', year: number) => void;
}

export default function Calendar({ lessons, onDateClick, onDeleteLesson, onClearMonth, onCopyTemplate, onOpenTemplate }: CalendarProps) {
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
  const [selectedDateForView, setSelectedDateForView] = useState<Date | null>(null);
  const monthRefs = useRef<(HTMLDivElement | null)[]>([]);

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
    const salaryStartDate = new Date(year, month, 1);
    const salaryEndDate = new Date(year, month + 1, 0);

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay(); // 0=Sun ... 6=Sat

    const days: {
      date: Date;
      isCurrentMonth: boolean;
      isSalaryPeriod: boolean;
    }[] = [];

    // Əvvəlki ayın son günləri (həftə düzülüşü üçün)
    for (let i = startingDay - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      const isSalaryPeriod =
        prevDate >= salaryStartDate && prevDate <= salaryEndDate;
      days.push({ date: prevDate, isCurrentMonth: false, isSalaryPeriod });
    }

    // Cari ayın günləri
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, month, i);
      const isSalaryPeriod =
        currentDate >= salaryStartDate && currentDate <= salaryEndDate;
      days.push({ date: currentDate, isCurrentMonth: true, isSalaryPeriod });
    }

    // Növbəti ayın ilk günləri (6x7 = 42 hüceyrə)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
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
    const salaryStartDate = new Date(currentYear, monthIndex, 1);
    const salaryEndDate = new Date(currentYear, monthIndex + 1, 0);
    
    const monthLessons = lessons.filter((lesson) => {
      const lessonDate = new Date(lesson.date);
      return lessonDate >= salaryStartDate && lessonDate <= salaryEndDate;
    });

    let totalSalary = 0;
    
    monthLessons.forEach((lesson) => {
      const studentCount = calculateStudentCount(lesson.studentName);
      const lessonPrice = calculatePrice(lesson.subject, studentCount);
      totalSalary += lessonPrice;
    });

    const startDateStr = `${salaryStartDate.getDate()}.${(salaryStartDate.getMonth() + 1).toString().padStart(2, '0')}`;
    const endDateStr = `${salaryEndDate.getDate()}.${(salaryEndDate.getMonth() + 1).toString().padStart(2, '0')}`;
    
    alert(`${months[monthIndex]} ${currentYear} maaşı\n(${startDateStr} - ${endDateStr})\n\nÜmumi maaş: ${totalSalary} AZN\nDərs sayı: ${monthLessons.length}`);
  };

  const clearMonth = (monthIndex: number) => {
    // Maaş dövrü: ayın 1-dən ayın son gününə qədər
    const salaryStartDate = new Date(currentYear, monthIndex, 1);
    const salaryEndDate = new Date(currentYear, monthIndex + 1, 0);
    
    const monthLessons = lessons.filter((lesson) => {
      const lessonDate = new Date(lesson.date);
      return lessonDate >= salaryStartDate && lessonDate <= salaryEndDate;
    });

    if (monthLessons.length === 0) {
      const startDateStr = `${salaryStartDate.getDate()}.${(salaryStartDate.getMonth() + 1).toString().padStart(2, '0')}`;
      const endDateStr = `${salaryEndDate.getDate()}.${(salaryEndDate.getMonth() + 1).toString().padStart(2, '0')}`;
      alert(`${months[monthIndex]} maaş dövründə (${startDateStr} - ${endDateStr}) silinəcək dərs yoxdur.`);
      return;
    }

    const startDateStr = `${salaryStartDate.getDate()}.${(salaryStartDate.getMonth() + 1).toString().padStart(2, '0')}`;
    const endDateStr = `${salaryEndDate.getDate()}.${(salaryEndDate.getMonth() + 1).toString().padStart(2, '0')}`;
    
    const confirmDelete = window.confirm(
      `${months[monthIndex]} ${currentYear} maaş dövründəki bütün dərslər silinəcək\n(${startDateStr} - ${endDateStr})\n\n${monthLessons.length} dərs silinəcək. Davam etmək istəyirsiniz?`
    );

    if (confirmDelete && onClearMonth) {
      onClearMonth(currentYear, monthIndex, salaryStartDate, salaryEndDate);
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
                </div>
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

              {/* Calendar grid */}
              <div className={styles.calendarGrid}>
                {days.map((day, dayIndex) => {
                  const dayLessons = getLessonsForDate(day.date);
                  const isToday =
                    day.date.toDateString() === new Date().toDateString();
                  const isCurrentMonth = day.isCurrentMonth;
                  const isSalaryPeriod = day.isSalaryPeriod;

                  const dayClasses = [
                    styles.calendarDay,
                    isCurrentMonth
                      ? styles.calendarDayCurrentMonth
                      : styles.calendarDayOtherMonth,
                    isToday ? styles.calendarDayToday : "",
                    dayLessons.length > 0 ? styles.calendarDayWithLessons : "",
                    isSalaryPeriod ? styles.calendarDaySalaryPeriod : "",
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
                      onClick={() => onDateClick(day.date)}
                      className={dayClasses}
                    >
                      <div className={numberClasses}>{day.date.getDate()}</div>

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

                      {/* Hover icons */}
                      <div className={styles.hoverIcons}>
                        <button
                          className={styles.hoverIcon}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDateClick(day.date);
                          }}
                          title="Dərs əlavə et"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          className={styles.hoverIcon}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewLessons(day.date);
                          }}
                          title="Dərslərə bax"
                        >
                          <svg className="w-40 h-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
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
            lessons={lessons.filter(lesson =>
              lesson.date === selectedDateForView.toISOString().split('T')[0]
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
      {/* Year Navigation */}
      <div className={styles.yearNavigation}>
        <div className={styles.yearNavigationContent}>
          <button onClick={goToPreviousYear} className={styles.navButton}>
            <svg
              className="w-6 h-6"
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

          <div className="text-center">
            <h2 className={styles.yearTitle}>{currentYear}</h2>
            <button
              onClick={goToCurrentYear}
              className={styles.currentYearButton}
            >
              Bu il
            </button>
          </div>

          <button onClick={goToNextYear} className={styles.navButton}>
            <svg
              className="w-6 h-6"
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

      {/* Months Grid */}
      <div className={styles.monthsGrid}>
        {months.map((monthName, monthIndex) => {
          // Maaş dövrü: ayın 1-dən ayın son gününə qədər
          const salaryStartDate = new Date(currentYear, monthIndex, 1);
          const salaryEndDate = new Date(currentYear, monthIndex + 1, 0);
          
          const monthLessons = lessons.filter((lesson) => {
            const lessonDate = new Date(lesson.date);
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
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <span>Maaş</span>
                  </button>
                  <button
                    className={`${styles.monthActionButton} ${styles.monthActionButtonSuccess}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onCopyTemplate && onCopyTemplate('odd', currentYear, monthIndex);
                    }}
                    title="Tək günlər template-ini kopyala"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Tək</span>
                  </button>
                  <button
                    className={`${styles.monthActionButton} ${styles.monthActionButtonSuccess}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onCopyTemplate && onCopyTemplate('even', currentYear, monthIndex);
                    }}
                    title="Cüt günlər template-ini kopyala"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Cüt</span>
                  </button>
                  <button
                    className={`${styles.monthActionButton} ${styles.monthActionButtonDanger}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      clearMonth(monthIndex);
                    }}
                    title="Ayı təmizlə"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Təmizlə</span>
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
          lessons={lessons.filter(lesson =>
            lesson.date === selectedDateForView.toISOString().split('T')[0]
          )}
          onClose={handleCloseViewModal}
          onDelete={onDeleteLesson || (() => {})}
        />
      )}
    </div>
  );
}
