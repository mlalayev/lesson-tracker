import React, { useState } from 'react';
import styles from './TeacherDetailsModal.module.css';
import { Lesson } from '@/types/lesson';
import { calculatePrice, calculateStudentCount } from '@/types/pricing';

interface Teacher {
  id: string;
  name: string;
  email: string;
  currentMonthLessons?: number;
  currentMonthSalary?: number;
}

interface TeacherDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: Teacher | null;
  lessons: Lesson[];
  monthName: string;
  year: number;
}

export default function TeacherDetailsModal({
  isOpen,
  onClose,
  teacher,
  lessons,
  monthName,
  year
}: TeacherDetailsModalProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  if (!isOpen || !teacher) return null;


  // Calculate total salary using teacher's custom pricing
  const totalSalary = lessons.reduce((sum, lesson) => {
    const studentCount = calculateStudentCount(lesson.studentName);
    return sum + calculatePrice(lesson.subject, studentCount, teacher.id);
  }, 0);

  // Get unique students
  const allStudents = new Set<string>();
  lessons.forEach(lesson => {
    const students = lesson.studentName.split(',').map(s => s.trim());
    students.forEach(student => allStudents.add(student));
  });

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{teacher.name} - {monthName} {year}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.content}>
          {/* Summary Cards */}
          <div className={styles.summary}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryValue}>{lessons.length}</div>
              <div className={styles.summaryLabel}>Ümumi Dərs</div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryValue}>{totalSalary.toFixed(2)} AZN</div>
              <div className={styles.summaryLabel}>Ümumi Maaş</div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryValue}>{allStudents.size}</div>
              <div className={styles.summaryLabel}>Tələbə Sayı</div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryValue}>
                {new Set(lessons.map(lesson => lesson.subject)).size}
              </div>
              <div className={styles.summaryLabel}>Fənn Sayı</div>
            </div>
          </div>

          {/* Students List */}
          <div className={styles.section}>
            <h3>📚 Tələbələr</h3>
            <div className={styles.studentsList}>
              {Array.from(allStudents).map((student, index) => (
                <div key={index} className={styles.studentTag}>
                  {student}
                </div>
              ))}
            </div>
          </div>

          {/* Lessons by Subject and Student Count */}
          <div className={styles.section}>
            <h3>📚 Dərslər Fənn və Tələbə Sayına Görə</h3>
            <div className={styles.subjectsList}>
              {(() => {
                // Group lessons by subject and student count
                const groupedLessons: Record<string, Record<number, Lesson[]>> = {};
                
                lessons.forEach(lesson => {
                  const studentCount = calculateStudentCount(lesson.studentName);
                  const key = `${lesson.subject}_${studentCount}`;
                  
                  if (!groupedLessons[lesson.subject]) {
                    groupedLessons[lesson.subject] = {};
                  }
                  
                  if (!groupedLessons[lesson.subject][studentCount]) {
                    groupedLessons[lesson.subject][studentCount] = [];
                  }
                  
                  groupedLessons[lesson.subject][studentCount].push(lesson);
                });

                return Object.entries(groupedLessons).map(([subject, studentGroups]) => (
                  <div key={subject} className={styles.subjectCard}>
                    <div className={styles.subjectHeader}>
                      <h4>{subject}</h4>
                    </div>
                    
                    {Object.entries(studentGroups)
                      .sort(([a], [b]) => parseInt(a) - parseInt(b))
                      .map(([studentCount, subjectLessons]) => {
                        const groupPrice = subjectLessons.reduce((sum, lesson) => {
                          return sum + calculatePrice(lesson.subject, parseInt(studentCount), teacher.id);
                        }, 0);
                        
                        const allStudents = new Set<string>();
                        subjectLessons.forEach(lesson => {
                          lesson.studentName.split(',').forEach(name => allStudents.add(name.trim()));
                        });

                        const groupKey = `${subject}_${studentCount}`;
                        const isExpanded = expandedGroups.has(groupKey);
                        const showAllLessons = isExpanded || subjectLessons.length <= 3;

                        const toggleExpanded = () => {
                          const newExpanded = new Set(expandedGroups);
                          if (isExpanded) {
                            newExpanded.delete(groupKey);
                          } else {
                            newExpanded.add(groupKey);
                          }
                          setExpandedGroups(newExpanded);
                        };

                        return (
                          <div key={studentCount} className={styles.studentGroupCard}>
                            <div className={styles.groupHeader}>
                              <div className={styles.groupTitle}>
                                <span className={styles.studentCount}>{studentCount} nəfər</span>
                                <span className={styles.lessonCount}>({subjectLessons.length} dərs)</span>
                              </div>
                              <div className={styles.groupTotal}>
                                {groupPrice.toFixed(2)} AZN
                              </div>
                            </div>
                            
                            <div className={styles.groupStudents}>
                              Tələbələr: {Array.from(allStudents).sort().join(', ')}
                            </div>
                            
                            <div className={styles.lessonsList}>
                              {subjectLessons.slice(0, showAllLessons ? subjectLessons.length : 3).map((lesson, idx) => (
                                <div key={idx} className={styles.lessonItem}>
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
                              {subjectLessons.length > 3 && (
                                <div 
                                  className={styles.moreIndicator}
                                  onClick={toggleExpanded}
                                  style={{ cursor: 'pointer' }}
                                >
                                  {isExpanded 
                                    ? 'Daha az göstər' 
                                    : `və daha ${subjectLessons.length - 3} dərs...`
                                  }
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
