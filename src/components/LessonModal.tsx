'use client';

import { useState, useEffect } from 'react';
import { Lesson } from '@/types/lesson';
import { calculateStudentCount, calculatePrice } from '@/types/pricing';
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
    duration: 60,
    isGroupLesson: false,
    groupDays: [] as number[]
  });

  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [studentCount, setStudentCount] = useState(0);

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

  const weekDays = [
    { value: 1, label: 'Bazar ertəsi' },
    { value: 2, label: 'Çərşənbə axşamı' },
    { value: 3, label: 'Çərşənbə' },
    { value: 4, label: 'Cümə axşamı' },
    { value: 5, label: 'Cümə' },
    { value: 6, label: 'Şənbə' },
    { value: 7, label: 'Bazar' }
  ];

  // Qiymət hesablama
  useEffect(() => {
    const count = calculateStudentCount(formData.studentName);
    const price = calculatePrice(formData.subject, count);
    
    setStudentCount(count);
    setCalculatedPrice(price);
  }, [formData.studentName, formData.subject]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newLesson: Lesson = {
      id: Date.now().toString(),
      date: date.toISOString().split('T')[0],
      ...formData
    };
    
    onSave(newLesson);
  };

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGroupDayToggle = (dayValue: number) => {
    setFormData(prev => ({
      ...prev,
      groupDays: prev.groupDays.includes(dayValue)
        ? prev.groupDays.filter(day => day !== dayValue)
        : [...prev.groupDays, dayValue]
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
                placeholder="Tələbə adlarını vergüllə ayırın (məs: Əli, Ayşə, Məmməd)"
                required
              />
              {studentCount > 0 && (
                <div className={styles.priceInfo}>
                  <span className={styles.studentCount}>
                    {studentCount} tələbə
                  </span>
                  <span className={styles.calculatedPrice}>
                    {calculatedPrice} manat
                  </span>
                </div>
              )}
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

            {/* Qrup Dərsi */}
            <div className={styles.formField}>
              <label className={styles.label}>
                <input
                  type="checkbox"
                  checked={formData.isGroupLesson}
                  onChange={(e) => handleInputChange('isGroupLesson', e.target.checked)}
                  className={styles.checkbox}
                />
                <span className={styles.checkboxLabel}>Qrup dərsi (həftədə 3 dəfə)</span>
              </label>
            </div>

            {/* Qrup Günləri */}
            {formData.isGroupLesson && (
              <div className={styles.formField}>
                <label className={styles.label}>
                  Qrupun gəldiyi günlər:
                </label>
                <div className={styles.groupDaysContainer}>
                  {weekDays.map((day) => (
                    <label key={day.value} className={styles.groupDayOption}>
                      <input
                        type="checkbox"
                        checked={formData.groupDays.includes(day.value)}
                        onChange={() => handleGroupDayToggle(day.value)}
                        className={styles.groupDayCheckbox}
                      />
                      <span className={styles.groupDayLabel}>{day.label}</span>
                    </label>
                  ))}
                </div>
                <p className={styles.groupDaysHint}>
                  Qrup dərsi seçsəniz, həmin ayın bütün seçilmiş günlərində avtomatik dərs yaradılacaq.
                </p>
              </div>
            )}

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
