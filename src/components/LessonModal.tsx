'use client';

import { useState } from 'react';
import { Lesson } from '@/types/lesson';
import styles from './LessonModal.module.css';

interface LessonModalProps {
  date: Date;
  onSave: (lesson: Lesson) => void;
  onClose: () => void;
  existingLessons: Lesson[];
  onDelete: (lessonId: string) => void;
}

export default function LessonModal({ 
  date, 
  onSave, 
  onClose, 
  existingLessons, 
  onDelete 
}: LessonModalProps) {
  const [formData, setFormData] = useState({
    time: '09:00',
    subject: '',
    studentName: '',
    notes: '',
    duration: 60
  });

  const timeSlots = [];
  for (let hour = 8; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeSlots.push(time);
    }
  }

  const subjects = [
    'İngilis dili',
    'Riyaziyyat',
    'SAT',
    'TOEFL',
    'IELTS',
    'Digər'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newLesson: Lesson = {
      id: Date.now().toString(),
      date: date.toISOString().split('T')[0],
      ...formData
    };
    
    onSave(newLesson);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('az-AZ', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div>
              <h2 className={styles.title}>Yeni Dərs Əlavə Et</h2>
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
          {/* Mövcud dərslər */}
          {existingLessons.length > 0 && (
            <div className={styles.existingLessonsSection}>
              <h3 className={styles.existingLessonsTitle}>
                <div className={styles.titleIndicator}></div>
                Bu günün dərsləri:
              </h3>
              <div className={styles.existingLessonsList}>
                {existingLessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className={styles.existingLessonItem}
                  >
                    <div className={styles.lessonInfo}>
                      <div className={styles.lessonTitle}>
                        {lesson.time} - {lesson.subject}
                      </div>
                      <div className={styles.lessonDetails}>
                        {lesson.studentName} • {lesson.duration} dəq
                      </div>
                      {lesson.notes && (
                        <div className={styles.lessonNotes}>
                          {lesson.notes}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => onDelete(lesson.id)}
                      className={styles.deleteButton}
                      title="Dərsi sil"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Yeni dərs formu */}
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formRow}>
              {/* Vaxt */}
              <div className={styles.formField}>
                <label className={styles.label}>
                  Vaxt
                </label>
                <select
                  value={formData.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                  className={styles.select}
                  required
                >
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dərs müddəti */}
              <div className={styles.formField}>
                <label className={styles.label}>
                  Müddət (dəqiqə)
                </label>
                <select
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                  className={styles.select}
                  required
                >
                  <option value={30}>30 dəqiqə</option>
                  <option value={45}>45 dəqiqə</option>
                  <option value={60}>1 saat</option>
                  <option value={90}>1.5 saat</option>
                  <option value={120}>2 saat</option>
                </select>
              </div>
            </div>

            {/* Fənn */}
            <div className={styles.formField}>
              <label className={styles.label}>
                Fənn
              </label>
              <select
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                className={styles.select}
                required
              >
                <option value="">Fənn seçin</option>
                {subjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            {/* Tələbə adı */}
            <div className={styles.formField}>
              <label className={styles.label}>
                Tələbə adı
              </label>
              <input
                type="text"
                value={formData.studentName}
                onChange={(e) => handleInputChange('studentName', e.target.value)}
                className={styles.input}
                placeholder="Tələbənin adını yazın"
                required
              />
            </div>

            {/* Qeydlər */}
            <div className={styles.formField}>
              <label className={styles.label}>
                Qeydlər (əlavə)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className={styles.textarea}
                placeholder="Dərs haqqında əlavə qeydlər..."
                rows={3}
              />
            </div>

            {/* Düymələr */}
            <div className={styles.buttonGroup}>
              <button
                type="submit"
                className={styles.submitButton}
              >
                Dərs Əlavə Et
              </button>
              <button
                type="button"
                onClick={onClose}
                className={styles.cancelButton}
              >
                Ləğv Et
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
