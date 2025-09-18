'use client';

import { useEffect, useMemo, useState } from 'react';
import { calculatePrice, calculateStudentCount } from '@/types/pricing';
import styles from './TemplatesModal.module.css';
import AddTemplateLessonModal from './AddTemplateLessonModal';

type TemplateType = 'odd' | 'even';

interface TemplateLesson {
  id: string;
  time: string;
  subject: string;
  studentName: string;
  notes?: string;
  duration: number;
}

interface TemplatesModalProps {
  templateType: TemplateType;
  onClose: () => void;
}

const STORAGE_KEYS: Record<TemplateType, string> = {
  odd: 'template_odd_days',
  even: 'template_even_days',
};

export default function TemplatesModal({ templateType, onClose }: TemplatesModalProps) {
  const [lessons, setLessons] = useState<TemplateLesson[]>([]);
  const [formData, setFormData] = useState({
    time: '09:00',
    subject: 'İngilis dili',
    studentName: '',
    notes: '',
    duration: 60,
  });

  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editLesson, setEditLesson] = useState<TemplateLesson | null>(null);

  const title = useMemo(() => (templateType === 'odd' ? 'Odd days template' : 'Even days template'), [templateType]);

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS[templateType]) : null;
      if (raw) {
        setLessons(JSON.parse(raw));
      }
    } catch {}
  }, [templateType]);

  useEffect(() => {
    const count = calculateStudentCount(formData.studentName);
    const price = calculatePrice(formData.subject, count);
    setStudentCount(count);
    setCalculatedPrice(price);
  }, [formData.studentName, formData.subject]);

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

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const persist = (items: TemplateLesson[]) => {
    setLessons(items);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS[templateType], JSON.stringify(items));
      }
    } catch {}
  };

  const handleAddFromModal = (data: { time: string; subject: string; studentName: string; notes?: string; duration: number; }) => {
    const newItem: TemplateLesson = { id: Date.now().toString(), ...data };
    persist([...lessons, newItem]);
    setShowAddModal(false);
  };

  const handleDelete = (id: string) => {
    const filtered = lessons.filter(l => l.id !== id);
    persist(filtered);
  };

  const handleEdit = (item: TemplateLesson) => {
    setEditLesson(item);
    setShowAddModal(true);
  };

  const totalRevenue = useMemo(() => {
    try {
      return lessons.reduce((sum, l) => sum + calculatePrice(l.subject, calculateStudentCount(l.studentName)), 0);
    } catch {
      return 0;
    }
  }, [lessons]);

  const handleSaveFromModal = (data: { time: string; subject: string; studentName: string; notes?: string; duration: number; }) => {
    if (editLesson) {
      const updated = lessons.map(l => l.id === editLesson.id ? { ...l, ...data } : l);
      persist(updated);
      setEditLesson(null);
      setShowAddModal(false);
      return;
    }
    const newItem: TemplateLesson = { id: Date.now().toString(), ...data };
    persist([...lessons, newItem]);
    setShowAddModal(false);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.container} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div>
              <div className={styles.title}>{title}</div>
              <div className={styles.subtitle}>Şablon dərsləri idarə edin</div>
            </div>
            <div className={styles.headerButtons}>
              <div className={styles.revenueBadge}>{totalRevenue} AZN</div>
              <button className={styles.addHeaderButton} onClick={() => setShowAddModal(true)}>Dərs əlavə et</button>
              <button className={styles.closeButton} onClick={onClose} aria-label="Bağla">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className={styles.content}>
          {lessons.length > 0 && (
            <div className={styles.existingSection}>
              <div className={styles.existingTitle}>Mövcud dərslər</div>
              <div className={styles.existingList}>
                {lessons.map(item => (
                  <div key={item.id} className={styles.existingItem}>
                    <div className={styles.lessonInfo}>
                      <div className={styles.lessonTitle}>{item.time} - {item.subject}</div>
                      <div className={styles.lessonDetails}>{item.studentName}</div>
                      {item.notes && <div className={styles.lessonNotes}>{item.notes}</div>}
                    </div>
                    <div className={styles.itemActions}>
                      <button className={styles.iconBtn} title="Redaktə et" onClick={() => handleEdit(item)}>
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button className={`${styles.iconBtn} ${styles.iconDanger}`} title="Sil" onClick={() => handleDelete(item.id)}>
                        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        {showAddModal && (
          <AddTemplateLessonModal
            onClose={() => { setShowAddModal(false); setEditLesson(null); }}
            onSave={handleSaveFromModal}
            initialData={editLesson || undefined}
            title={editLesson ? 'Dərsi redaktə et' : 'Dərs əlavə et'}
          />
        )}
      </div>
    </div>
  );
}


