'use client';

import { useState } from 'react';
import { Lesson } from '@/types/lesson';
import styles from './Calendar.module.css';

interface CalendarProps {
  lessons: Lesson[];
  onDateClick: (date: Date) => void;
}

export default function Calendar({ lessons, onDateClick }: CalendarProps) {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const months = [
    'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun',
    'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
  ];

  const weekDays = ['B', 'Ç', 'Ç', 'C', 'C', 'Ş', 'B'];

  const getDaysInMonth = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    
    // Əvvəlki ayın son günləri
    for (let i = startingDay - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i);
      days.push({ date: prevDate, isCurrentMonth: false });
    }
    
    // Cari ayın günləri
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, month, i);
      days.push({ date: currentDate, isCurrentMonth: true });
    }
    
    // Növbəti ayın ilk günləri
    const remainingDays = 42 - days.length; // 6 sətir x 7 gün
    for (let i = 1; i <= remainingDays; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({ date: nextDate, isCurrentMonth: false });
    }
    
    return days;
  };

  const getLessonsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return lessons.filter(lesson => lesson.date === dateString);
  };

  const handleMonthClick = (monthIndex: number) => {
    setSelectedMonth(monthIndex);
    setIsExpanded(true);
  };

  const handleCloseMonth = () => {
    setIsExpanded(false);
    setTimeout(() => setSelectedMonth(null), 300);
  };

  const goToPreviousYear = () => {
    setCurrentYear(prev => prev - 1);
  };

  const goToNextYear = () => {
    setCurrentYear(prev => prev + 1);
  };

  const goToCurrentYear = () => {
    setCurrentYear(new Date().getFullYear());
  };

  // Əgər ay seçilibsə və expanded-dirsə, o ayın calendar-ini göstər
  if (selectedMonth !== null && isExpanded) {
    const days = getDaysInMonth(currentYear, selectedMonth);
    
    return (
      <div className={styles.expandedOverlay}>
        <div className={styles.expandedContainer}>
          {/* Header */}
          <div className={styles.expandedHeader}>
            <div className={styles.expandedHeaderContent}>
              <div>
                <h2 className={styles.expandedTitle}>{months[selectedMonth]} {currentYear}</h2>
                <p className={styles.expandedSubtitle}>Aya vuraraq günlərə dərs əlavə edin</p>
              </div>
              <button
                onClick={handleCloseMonth}
                className={styles.closeButton}
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Calendar Content */}
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
                const isToday = day.date.toDateString() === new Date().toDateString();
                const isCurrentMonth = day.isCurrentMonth;
                
                const dayClasses = [
                  styles.calendarDay,
                  isCurrentMonth ? styles.calendarDayCurrentMonth : styles.calendarDayOtherMonth,
                  isToday ? styles.calendarDayToday : '',
                  dayLessons.length > 0 ? styles.calendarDayWithLessons : ''
                ].filter(Boolean).join(' ');
                
                const numberClasses = [
                  styles.dayNumber,
                  isCurrentMonth ? styles.dayNumberCurrentMonth : styles.dayNumberOtherMonth,
                  isToday ? styles.dayNumberToday : ''
                ].filter(Boolean).join(' ');
                
                return (
                  <div
                    key={dayIndex}
                    onClick={() => onDateClick(day.date)}
                    className={dayClasses}
                  >
                    <div className={numberClasses}>
                      {day.date.getDate()}
                    </div>
                    
                    {/* Lesson indicators */}
                    {dayLessons.slice(0, 2).map((lesson, lessonIndex) => (
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
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Əsas səhifə - ayların grid-i
  return (
    <div className={styles.container}>
      {/* Year Navigation */}
      <div className={styles.yearNavigation}>
        <div className={styles.yearNavigationContent}>
          <button
            onClick={goToPreviousYear}
            className={styles.navButton}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="text-center">
            <h2 className={styles.yearTitle}>
              {currentYear}
            </h2>
            <button
              onClick={goToCurrentYear}
              className={styles.currentYearButton}
            >
              Bu il
            </button>
          </div>
          
          <button
            onClick={goToNextYear}
            className={styles.navButton}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Months Grid */}
      <div className={styles.monthsGrid}>
        {months.map((monthName, monthIndex) => {
          const monthLessons = lessons.filter(lesson => {
            const lessonDate = new Date(lesson.date);
            return lessonDate.getFullYear() === currentYear && lessonDate.getMonth() === monthIndex;
          });
          
          return (
            <div
              key={monthIndex}
              onClick={() => handleMonthClick(monthIndex)}
              className={styles.monthCard}
            >
              <div className={styles.monthCardContent}>
                <h3 className={styles.monthTitle}>
                  {monthName}
                </h3>
                
                {/* Month stats */}
                <div className={styles.monthStats}>
                  <div className={styles.lessonCount}>
                    {monthLessons.length} dərs
                  </div>
                  
                  {/* Visual indicator */}
                  <div className={styles.visualIndicator}>
                    <div className={`${styles.indicatorDot} ${monthLessons.length > 0 ? styles.indicatorDotActive : styles.indicatorDotInactive}`}></div>
                  </div>
                </div>
                
                {/* Hover effect */}
                <div className={styles.hoverText}>
                  Vuraraq açın →
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
