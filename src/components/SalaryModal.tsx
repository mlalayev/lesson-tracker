import React from 'react';
import styles from './SalaryModal.module.css';
import { Lesson } from '../types/lesson';
import { calculateStudentCount, calculatePrice } from '../types/pricing';

interface SalaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessons: Lesson[];
  monthName: string;
  year: number;
}

interface LessonGroup {
  subject: string;
  studentCount: number;
  lessons: Lesson[];
  totalPrice: number;
}

export default function SalaryModal({ isOpen, onClose, lessons, monthName, year }: SalaryModalProps) {
  if (!isOpen) return null;

  // Group lessons by subject and student count
  const lessonGroups: LessonGroup[] = [];
  const groupMap = new Map<string, LessonGroup>();

  lessons.forEach(lesson => {
    const studentCount = calculateStudentCount(lesson.studentName);
    const price = calculatePrice(lesson.subject, studentCount);
    const key = `${lesson.subject}-${studentCount}`;

    if (groupMap.has(key)) {
      const group = groupMap.get(key)!;
      group.lessons.push(lesson);
      group.totalPrice += price;
    } else {
      const newGroup: LessonGroup = {
        subject: lesson.subject,
        studentCount,
        lessons: [lesson],
        totalPrice: price
      };
      groupMap.set(key, newGroup);
      lessonGroups.push(newGroup);
    }
  });

  // Sort by subject name, then by student count
  lessonGroups.sort((a, b) => {
    if (a.subject !== b.subject) {
      return a.subject.localeCompare(b.subject);
    }
    return a.studentCount - b.studentCount;
  });

  const totalSalary = lessonGroups.reduce((sum, group) => sum + group.totalPrice, 0);
  const totalLessons = lessons.length;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{monthName} {year} Maaş Hesabatı</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.summary}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryValue}>{totalSalary} AZN</div>
              <div className={styles.summaryLabel}>Ümumi Maaş</div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryValue}>{totalLessons}</div>
              <div className={styles.summaryLabel}>Dərs Sayı</div>
            </div>
          </div>

          <div className={styles.breakdown}>
            <h3>Dərs Bölgüsü</h3>
            {lessonGroups.length === 0 ? (
              <div className={styles.noLessons}>
                Bu ayda heç bir dərs tapılmadı.
              </div>
            ) : (
              <div className={styles.groupsList}>
                {lessonGroups.map((group, index) => (
                  <div key={index} className={styles.groupCard}>
                    <div className={styles.groupHeader}>
                      <div className={styles.groupTitle}>
                        <span className={styles.subject}>{group.subject}</span>
                        <span className={styles.studentInfo}>
                          {group.studentCount} tələbə
                        </span>
                      </div>
                      <div className={styles.groupTotal}>
                        {group.totalPrice} AZN
                      </div>
                    </div>
                    <div className={styles.groupDetails}>
                      <span className={styles.lessonCount}>
                        {group.lessons.length} dərs
                      </span>
                      <span className={styles.pricePerLesson}>
                        {calculatePrice(group.subject, group.studentCount)} AZN/dərs
                      </span>
                    </div>
                    
                    {/* Show student names in simplified format */}
                    <div className={styles.studentExamples}>
                      {group.lessons.slice(0, 3).map((lesson, idx) => (
                        <div key={idx} className={styles.studentExample}>
                          <span className={styles.date}>
                            {new Date(lesson.date).toLocaleDateString('az-AZ', { 
                              day: '2-digit', 
                              month: '2-digit' 
                            })}
                          </span>
                          <span className={styles.time}>{lesson.time}</span>
                          <span className={styles.students}>{lesson.studentName}</span>
                        </div>
                      ))}
                      {group.lessons.length > 3 && (
                        <div className={styles.moreIndicator}>
                          və daha {group.lessons.length - 3} dərs...
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
