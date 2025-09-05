'use client';

import { Lesson } from '@/types/lesson';
import styles from './ViewLessonsModal.module.css';

interface ViewLessonsModalProps {
  date: Date;
  lessons: Lesson[];
  onClose: () => void;
  onEdit?: (lesson: Lesson) => void;
  onDelete: (lessonId: string) => void;
}

export default function ViewLessonsModal({ 
  date, 
  lessons, 
  onClose, 
  onEdit,
  onDelete 
}: ViewLessonsModalProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('az-AZ', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time: string) => {
    return time;
  };

  const getSubjectColor = (subject: string) => {
    const colors: { [key: string]: string } = {
      'İngilis dili': '#3b82f6',
      'Riyaziyyat': '#10b981',
      'SAT': '#f59e0b',
      'TOEFL': '#ef4444',
      'IELTS': '#8b5cf6',
      'Digər': '#6b7280'
    };
    return colors[subject] || '#6b7280';
  };

  const getSubjectIcon = (subject: string) => {
    const icons: { [key: string]: string } = {
      'İngilis dili': '🇬🇧',
      'Riyaziyyat': '📐',
      'SAT': '📚',
      'TOEFL': '🎯',
      'IELTS': '📝',
      'Digər': '📖'
    };
    return icons[subject] || '📖';
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div>
              <h2 className={styles.title}>Dərslərə Baxış</h2>
              <p className={styles.subtitle}>{formatDate(date)}</p>
            </div>
            <button
              onClick={onClose}
              className={styles.closeButton}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className={styles.content}>
          {lessons.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📅</div>
              <h3 className={styles.emptyTitle}>Bu gün dərs yoxdur</h3>
              <p className={styles.emptyDescription}>
                Bu gün üçün heç bir dərs qeyd edilməyib.
              </p>
            </div>
          ) : (
            <div className={styles.lessonsList}>
              <div className={styles.lessonsHeader}>
                <h3 className={styles.lessonsTitle}>
                  <div className={styles.titleIndicator}></div>
                  {lessons.length} dərs tapıldı
                </h3>
              </div>
              
              <div className={styles.lessonsGrid}>
                {lessons
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((lesson) => (
                    <div
                      key={lesson.id}
                      className={styles.lessonCard}
                    >
                      <div className={styles.lessonHeader}>
                        <div className={styles.subjectInfo}>
                          <span 
                            className={styles.subjectIcon}
                            style={{ backgroundColor: getSubjectColor(lesson.subject) }}
                          >
                            {getSubjectIcon(lesson.subject)}
                          </span>
                          <div className={styles.subjectDetails}>
                            <h4 className={styles.subjectName}>{lesson.subject}</h4>
                            <p className={styles.studentName}>{lesson.studentName}</p>
                          </div>
                        </div>
                        
                        <div className={styles.lessonActions}>
                          {onEdit && (
                            <button
                              onClick={() => onEdit(lesson)}
                              className={styles.editButton}
                              title="Dərsi redaktə et"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => onDelete(lesson.id)}
                            className={styles.deleteButton}
                            title="Dərsi sil"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <div className={styles.lessonDetails}>
                        <div className={styles.timeInfo}>
                          <div className={styles.timeItem}>
                            <span className={styles.timeLabel}>Başlama:</span>
                            <span className={styles.timeValue}>{formatTime(lesson.time)}</span>
                          </div>
                          <div className={styles.timeItem}>
                            <span className={styles.timeLabel}>Müddət:</span>
                            <span className={styles.timeValue}>{lesson.duration} dəq</span>
                          </div>
                        </div>
                        
                        {lesson.notes && (
                          <div className={styles.notesSection}>
                            <span className={styles.notesLabel}>Qeydlər:</span>
                            <p className={styles.notesText}>{lesson.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
