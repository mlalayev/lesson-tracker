'use client';

import { useEffect, useState } from 'react';
import { calculatePrice, calculateStudentCount } from '@/types/pricing';
import styles from './AddTemplateLessonModal.module.css';

interface TemplateLessonInput {
  time: string;
  subject: string;
  studentName: string;
  notes?: string;
  duration: number;
}

interface AddTemplateLessonModalProps {
  onClose: () => void;
  onSave: (lesson: TemplateLessonInput) => void;
  initialData?: Partial<TemplateLessonInput>;
  title?: string;
  existingLessons?: Array<{ time: string; id?: string }>;
}

export default function AddTemplateLessonModal({ onClose, onSave, initialData, title, existingLessons = [] }: AddTemplateLessonModalProps) {
  const [formData, setFormData] = useState<TemplateLessonInput>({
    time: initialData?.time || '09:00',
    subject: initialData?.subject || 'İngilis dili',
    studentName: initialData?.studentName || '',
    notes: initialData?.notes || '',
    duration: initialData?.duration ?? 60,
  });

  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [studentCount, setStudentCount] = useState(0);

  const subjects = [
    'İngilis dili',
    'Riyaziyyat',
    'SAT',
    'TOEFL',
    'IELTS',
    'Speaking',
    'Kids',
    'Digər',
  ];

  const timeSlots: string[] = [];
  for (let hour = 8; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const t = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeSlots.push(t);
    }
  }

  // Get taken time slots (excluding current lesson if editing)
  const takenTimeSlots = existingLessons
    .filter(lesson => lesson.id !== initialData?.id) // Exclude current lesson when editing
    .map(lesson => lesson.time);

  const isTimeSlotTaken = (time: string) => takenTimeSlots.includes(time);

  useEffect(() => {
    const count = calculateStudentCount(formData.studentName);
    const price = calculatePrice(formData.subject, count);
    setStudentCount(count);
    setCalculatedPrice(price);
  }, [formData.studentName, formData.subject]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <div className={styles.title}>{title || 'Dərs əlavə et'}</div>
          <button className={styles.iconButton} onClick={onClose} aria-label="Bağla">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form className={styles.body} onSubmit={handleSubmit}>
          <div className={styles.grid}>
            <div className={styles.field}> 
              <label className={styles.label}>Saat</label>
              <select className={styles.control} value={formData.time} onChange={(e) => handleInputChange('time', e.target.value)}>
                {timeSlots.map(t => (
                  <option 
                    key={t} 
                    value={t} 
                    disabled={isTimeSlotTaken(t)}
                    className={isTimeSlotTaken(t) ? styles.disabledOption : ''}
                  >
                    {t} {isTimeSlotTaken(t) ? '(məşğul)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Fənn</label>
              <select className={styles.control} value={formData.subject} onChange={(e) => handleInputChange('subject', e.target.value)}>
                {subjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Müddət (dəqiqə)</label>
              <input className={styles.control} type="number" min={30} step={30} value={formData.duration} onChange={(e) => handleInputChange('duration', Number(e.target.value))} />
            </div>

            <div className={styles.fieldFull}>
              <label className={styles.label}>Tələbə adları</label>
              <input className={styles.control} type="text" value={formData.studentName} onChange={(e) => handleInputChange('studentName', e.target.value)} placeholder="Tələbə adlarını vergüllə ayırın (məs: Əli, Ayşə, Məmməd)" />
              {studentCount > 0 && (
                <div className={styles.priceInfo}>
                  <span>{studentCount} tələbə</span>
                  <span>{calculatedPrice} manat</span>
                </div>
              )}
            </div>

            <div className={styles.fieldFull}>
              <label className={styles.label}>Qeydlər</label>
              <textarea className={styles.control} rows={3} value={formData.notes} onChange={(e) => handleInputChange('notes', e.target.value)} />
            </div>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.secondary} onClick={onClose}>Bağla</button>
            <button type="submit" className={styles.primary}>Yadda saxla</button>
          </div>
        </form>
      </div>
    </div>
  );
}


