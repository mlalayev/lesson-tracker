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
    const loadTemplates = async () => {
      
      try {
        // First try localStorage for immediate loading
        const localRaw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS[templateType]) : null;
        if (localRaw) {
          const localTemplates = JSON.parse(localRaw);
          setLessons(localTemplates);
        }
        
        // Templates are now loaded only from localStorage above
        
      } catch (error) {
        console.error('Error loading templates:', error);
        // Final fallback to localStorage
        try {
          const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEYS[templateType]) : null;
          if (raw) {
            const fallbackTemplates = JSON.parse(raw);
            setLessons(fallbackTemplates);
          }
        } catch (fallbackError) {
          console.error('Fallback error:', fallbackError);
        }
      }
    };
    
    loadTemplates();
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

  const persist = async (items: TemplateLesson[]) => {
    setLessons(items);
    
    try {
      // Save to localStorage immediately for instant feedback
      if (typeof window !== 'undefined') {
        console.log(`💾 Saving ${items.length} ${templateType} templates to localStorage key: ${STORAGE_KEYS[templateType]}`);
        localStorage.setItem(STORAGE_KEYS[templateType], JSON.stringify(items));
        console.log(`✅ Successfully saved templates to localStorage`);
      }
      
      // Templates are now saved only to localStorage above
      
    } catch (error) {
      console.error('Error saving templates:', error);
      
      // Ensure localStorage fallback is working
      try {
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS[templateType], JSON.stringify(items));
        }
      } catch (fallbackError) {
        console.error('Error saving to localStorage fallback:', fallbackError);
      }
    }
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
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <div className={styles.headerActions}>
            <button className={styles.addButton} onClick={() => setShowAddModal(true)}>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Dərs əlavə et
            </button>
            <button className={styles.closeButton} onClick={() => {
              console.log('TemplatesModal closing with lessons:', lessons);
              console.log('localStorage before close:', localStorage.getItem(STORAGE_KEYS[templateType]));
              onClose();
            }}>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Dərs sayı:</span>
              <span className={styles.statValue}>{lessons.length}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLabel}>Ümumi gəlir:</span>
              <span className={styles.statValue}>{totalRevenue} AZN</span>
            </div>
          </div>


          {lessons.length > 0 ? (
            <div className={styles.lessonsList}>
              {lessons.map(item => (
                <div key={item.id} className={styles.lessonItem}>
                  <div className={styles.lessonInfo}>
                    <div className={styles.lessonTime}>{item.time}</div>
                    <div className={styles.lessonSubject}>{item.subject}</div>
                    <div className={styles.lessonStudent}>{item.studentName}</div>
                    {item.notes && <div className={styles.lessonNotes}>{item.notes}</div>}
                  </div>
                  <div className={styles.lessonActions}>
                    <button className={styles.editButton} onClick={() => handleEdit(item)}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button className={styles.deleteButton} onClick={() => handleDelete(item.id)}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>Hələ dərs əlavə edilməyib</p>
            </div>
          )}
        </div>

        {showAddModal && (
          <AddTemplateLessonModal
            onClose={() => { setShowAddModal(false); setEditLesson(null); }}
            onSave={handleSaveFromModal}
            initialData={editLesson || undefined}
            title={editLesson ? 'Dərsi redaktə et' : 'Dərs əlavə et'}
            existingLessons={lessons}
          />
        )}
      </div>
    </div>
  );
}


