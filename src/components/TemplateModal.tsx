"use client";

import { useState } from "react";
import { Lesson } from "@/types/lesson";
import { calculatePrice, calculateStudentCount } from "@/types/pricing";
import styles from "./TemplateModal.module.css";

interface TemplateModalProps {
  type: 'odd' | 'even';
  onClose: () => void;
  onSave: (type: 'odd' | 'even', lessons: Lesson[]) => void;
  onCopy: (type: 'odd' | 'even', targetYear: number, targetMonth: number) => void;
  existingLessons: Lesson[];
  currentYear: number;
}

export default function TemplateModal({ 
  type, 
  onClose, 
  onSave, 
  onCopy, 
  existingLessons, 
  currentYear 
}: TemplateModalProps) {
  const [lessons, setLessons] = useState<Lesson[]>(existingLessons);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCopySelector, setShowCopySelector] = useState(false);
  
  // Form states
  const [time, setTime] = useState('10:00');
  const [subject, setSubject] = useState('İngilis dili');
  const [studentName, setStudentName] = useState('');
  const [duration, setDuration] = useState(60);

  const months = [
    "Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun",
    "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"
  ];

  const subjects = [
    'İngilis dili',
    'SAT', 
    'IELTS',
    'Speaking',
    'Kids'
  ];

  const dayNames = type === 'odd' ? 
    ['Bazar ertəsi', 'Çərşənbə', 'Cümə'] : 
    ['Çərşənbə axşamı', 'Cümə axşamı', 'Şənbə'];

  const handleAddLesson = () => {
    if (!studentName.trim()) {
      alert('Tələbə adını daxil edin');
      return;
    }

    const newLesson: Lesson = {
      id: `template_${type}_${Date.now()}_${Math.random()}`,
      date: '2024-01-01', // Template date
      time,
      subject,
      studentName: studentName.trim(),
      duration,
      isGroupLesson: false
    };

    setLessons([...lessons, newLesson]);
    setStudentName('');
    setShowAddForm(false);
  };

  const handleDeleteLesson = (lessonId: string) => {
    setLessons(lessons.filter(l => l.id !== lessonId));
  };

  const handleSave = () => {
    onSave(type, lessons);
    onClose();
  };

  const handleCopyToMonth = (monthIndex: number) => {
    onCopy(type, currentYear, monthIndex);
    setShowCopySelector(false);
  };

  const calculateTotalSalary = () => {
    return lessons.reduce((total, lesson) => {
      const studentCount = calculateStudentCount(lesson.studentName);
      const price = calculatePrice(lesson.subject, studentCount);
      return total + price;
    }, 0);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div>
              <h2 className={styles.title}>
                {type === 'odd' ? 'Tək günlər' : 'Cüt günlər'} Template
              </h2>
              <p className={styles.subtitle}>
                {dayNames.join(', ')} günləri üçün dərs template-i
              </p>
            </div>
            <button onClick={onClose} className={styles.closeButton}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Control Buttons */}
          <div className={styles.controls}>
            <button 
              className={styles.controlButton}
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Dərs əlavə et
            </button>
            <button 
              className={`${styles.controlButton} ${styles.copyButton}`}
              onClick={() => setShowCopySelector(!showCopySelector)}
              disabled={lessons.length === 0}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Template-i kopyala
            </button>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className={styles.addForm}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Vaxt</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Fənn</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className={styles.select}
                  >
                    {subjects.map(subj => (
                      <option key={subj} value={subj}>{subj}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Tələbələr (vergüllə ayırın)</label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Məsələn: Ali Məmmədov, Ayşə Həsənova"
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Müddət (dəqiqə)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className={styles.input}
                    min="30"
                    max="180"
                  />
                </div>
              </div>
              <div className={styles.formActions}>
                <button onClick={handleAddLesson} className={styles.addButton}>
                  Əlavə et
                </button>
                <button onClick={() => setShowAddForm(false)} className={styles.cancelButton}>
                  Ləğv et
                </button>
              </div>
            </div>
          )}

          {/* Copy Month Selector */}
          {showCopySelector && (
            <div className={styles.monthSelector}>
              <h3>Hansı aya kopyalamaq istəyirsiniz?</h3>
              <div className={styles.monthGrid}>
                {months.map((month, index) => (
                  <button
                    key={index}
                    onClick={() => handleCopyToMonth(index)}
                    className={styles.monthButton}
                  >
                    {month}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Lessons List */}
          <div className={styles.lessonsList}>
            <div className={styles.lessonsHeader}>
              <h3>Dərslər ({lessons.length})</h3>
              {lessons.length > 0 && (
                <div className={styles.totalSalary}>
                  Ümumi qiymət: {calculateTotalSalary()} AZN
                </div>
              )}
            </div>
            
            {lessons.length === 0 ? (
              <div className={styles.emptyState}>
                <p>Hələ dərs əlavə edilməyib</p>
              </div>
            ) : (
              <div className={styles.lessons}>
                {lessons.map((lesson) => {
                  const studentCount = calculateStudentCount(lesson.studentName);
                  const price = calculatePrice(lesson.subject, studentCount);
                  
                  return (
                    <div key={lesson.id} className={styles.lessonItem}>
                      <div className={styles.lessonInfo}>
                        <div className={styles.lessonTime}>{lesson.time}</div>
                        <div className={styles.lessonSubject}>{lesson.subject}</div>
                        <div className={styles.lessonStudents}>
                          {lesson.studentName} ({studentCount} tələbə)
                        </div>
                        <div className={styles.lessonDuration}>{lesson.duration} dəq</div>
                      </div>
                      <div className={styles.lessonActions}>
                        <div className={styles.lessonPrice}>{price} AZN</div>
                        <button
                          onClick={() => handleDeleteLesson(lesson.id)}
                          className={styles.deleteButton}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button onClick={handleSave} className={styles.saveButton}>
            Template-i saxla
          </button>
        </div>
      </div>
    </div>
  );
}
