'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Calendar from '../components/Calendar';
import LessonModal from '../components/LessonModal';
import TemplateModal from '../components/TemplateModal';
import { Lesson } from '../types/lesson';
import styles from './page.module.css';

export default function Home() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [templates, setTemplates] = useState<{
    odd: Lesson[];
    even: Lesson[];
  }>({
    odd: [],
    even: []
  });
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [currentTemplateType, setCurrentTemplateType] = useState<'odd' | 'even'>('odd');

  useEffect(() => {
    // Auth guard: require token
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (!token) {
      router.replace('/login');
      return;
    }

    // Local storage-dan dərsləri və template-ləri yüklə
    const savedLessons = localStorage.getItem('lessons');
    if (savedLessons) {
      setLessons(JSON.parse(savedLessons));
    }
    
    const savedTemplates = localStorage.getItem('templates');
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    }
  }, []);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleSaveLesson = (lesson: Lesson) => {
    let newLessons = [...lessons];
    
    if (lesson.isGroupLesson && lesson.groupDays && lesson.groupDays.length > 0) {
      // Qrup dərsi üçün avtomatik dərslər yarat
      const groupId = `group_${Date.now()}`;
      const baseDate = new Date(lesson.date);
      // Maaş dövrü: seçilmiş ayın 1-dən ayın son gününə qədər
      const selectedMonth = baseDate.getMonth();
      const selectedYear = baseDate.getFullYear();
      const salaryStartDate = new Date(selectedYear, selectedMonth, 1);
      const salaryEndDate = new Date(selectedYear, selectedMonth + 1, 0);
      
      // Başlanğıc tarixi maaş dövrünün içində olmalıdır (həmişə seçilmiş tarixdən başla)
      const actualStartDate = baseDate < salaryStartDate ? salaryStartDate : baseDate;
      
      // Maaş dövrünün sonuna qədər bütün günləri yoxla
      const currentDate = new Date(actualStartDate);
      
      while (currentDate <= salaryEndDate) {
        const isOddDate = currentDate.getDate() % 2 === 1;
        const isEvenDate = currentDate.getDate() % 2 === 0;

        // Nümunə: [1,3,5] → tək günlər, [2,4,6] → cüt günlər
        const isOddPattern = lesson.groupDays.length === 3 && lesson.groupDays.every(d => [1,3,5].includes(d));
        const isEvenPattern = lesson.groupDays.length === 3 && lesson.groupDays.every(d => [2,4,6].includes(d));

        const shouldAdd = isOddPattern ? isOddDate : isEvenPattern ? isEvenDate : false;

        if (shouldAdd) {
          const groupLesson: Lesson = {
            ...lesson,
            id: `${groupId}_${currentDate.getTime()}`,
            date: currentDate.toISOString().split('T')[0],
            groupId: groupId,
            isGroupLesson: true
          };
          
          const existingLesson = newLessons.find(l => 
            l.date === groupLesson.date && 
            l.time === groupLesson.time && 
            l.studentName === groupLesson.studentName
          );
          
          if (!existingLesson) {
            newLessons.push(groupLesson);
          }
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
    } else {
      // Adi dərs
      newLessons.push(lesson);
    }
    
    setLessons(newLessons);
    localStorage.setItem('lessons', JSON.stringify(newLessons));
    setIsModalOpen(false);
  };

  const handleDeleteLesson = (lessonId: string) => {
    const lessonToDelete = lessons.find(lesson => lesson.id === lessonId);
    let newLessons = [...lessons];
    
    if (lessonToDelete?.isGroupLesson && lessonToDelete.groupId) {
      // Qrup dərsi silinirsə, yalnız gələcək günlərdə sil
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Günün başlanğıcı
      
      newLessons = newLessons.filter(lesson => {
        if (lesson.groupId === lessonToDelete.groupId) {
          const lessonDate = new Date(lesson.date);
          lessonDate.setHours(0, 0, 0, 0);
          
          // Əgər dərs tarixi bugündən sonradırsa sil, əks halda qalsın
          return lessonDate < today;
        }
        return true; // Qrup dərsi deyilsə qalsın
      });
    } else {
      // Adi dərs silinirsə
      newLessons = newLessons.filter(lesson => lesson.id !== lessonId);
    }
    
    setLessons(newLessons);
    localStorage.setItem('lessons', JSON.stringify(newLessons));
  };

  const handleClearMonth = (year: number, month: number, startDate?: Date, endDate?: Date) => {
    let newLessons;
    
    if (startDate && endDate) {
      // Maaş dövrü əsasında sil
      newLessons = lessons.filter((lesson) => {
        const lessonDate = new Date(lesson.date);
        return !(lessonDate >= startDate && lessonDate <= endDate);
      });
    } else {
      // Köhnə metod (fallback)
      newLessons = lessons.filter((lesson) => {
        const lessonDate = new Date(lesson.date);
        return !(
          lessonDate.getFullYear() === year &&
          lessonDate.getMonth() === month
        );
      });
    }
    
    setLessons(newLessons);
    localStorage.setItem('lessons', JSON.stringify(newLessons));
  };

  const handleCreateTemplate = (type: 'odd' | 'even') => {
    setCurrentTemplateType(type);
    setIsTemplateModalOpen(true);
  };

  const handleOpenTemplate = (type: 'odd' | 'even', year: number) => {
    setCurrentTemplateType(type);
    setIsTemplateModalOpen(true);
  };

  const handleSaveTemplate = (type: 'odd' | 'even', templateLessons: Lesson[]) => {
    const newTemplates = { ...templates, [type]: templateLessons };
    setTemplates(newTemplates);
    localStorage.setItem('templates', JSON.stringify(newTemplates));
  };

  const handleCloseTemplateModal = () => {
    setIsTemplateModalOpen(false);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authUser');
      localStorage.removeItem('authToken');
    }
    router.replace('/login');
  };

  const handleCopyTemplate = (type: 'odd' | 'even', targetYear: number, targetMonth: number) => {
    const template = templates[type];
    if (template.length === 0) {
      alert(`${type === 'odd' ? 'Tək günlər' : 'Cüt günlər'} template-i yoxdur!`);
      return;
    }

    const days = type === 'odd' ? [1, 3, 5] : [2, 4, 6];
    const newLessons = [...lessons];
    
    // Maaş dövrü: ayın 1-dən ayın son gününə qədər
    const salaryStartDate = new Date(targetYear, targetMonth, 1);
    const salaryEndDate = new Date(targetYear, targetMonth + 1, 0);
    
    const currentDate = new Date(salaryStartDate);
    
    while (currentDate <= salaryEndDate) {
      const dayOfWeek = currentDate.getDay() === 0 ? 7 : currentDate.getDay();
      
      if (days.includes(dayOfWeek)) {
        template.forEach((templateLesson) => {
          const newLesson: Lesson = {
            ...templateLesson,
            id: `copied_${Date.now()}_${Math.random()}`,
            date: currentDate.toISOString().split('T')[0]
          };
          
          // Həmin gün və vaxtda dərs yoxdursa əlavə et
          const existingLesson = newLessons.find(l => 
            l.date === newLesson.date && 
            l.time === newLesson.time
          );
          
          if (!existingLesson) {
            newLessons.push(newLesson);
          }
        });
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    setLessons(newLessons);
    localStorage.setItem('lessons', JSON.stringify(newLessons));
    
    alert(`${type === 'odd' ? 'Tək günlər' : 'Cüt günlər'} template-i kopyalandı!`);
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
       
        
        <Calendar 
          lessons={lessons}
          onDateClick={handleDateClick}
          onDeleteLesson={handleDeleteLesson}
          onClearMonth={handleClearMonth}
          onCopyTemplate={handleCopyTemplate}
          onOpenTemplate={handleOpenTemplate}
        />

        {/* Floating Template Button */}
        <div className={styles.floatingButton}>
          <div className={styles.floatingButtonContent}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2h-2m-5-3v4m0 0h4m-4 0l4-4m-4 4L9 9" />
            </svg>
          </div>
          
          {/* Hover Menu */}
          <div className={styles.floatingMenu}>
            <button 
              className={styles.templateButton}
              onClick={() => handleCreateTemplate('odd')}
            >
              <span>Tək günlər (1,3,5)</span>
            </button>
            <button 
              className={styles.templateButton}
              onClick={() => handleCreateTemplate('even')}
            >
              <span>Cüt günlər (2,4,6)</span>
            </button>
          </div>
        </div>
        
        {/* Logout button */}
        <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 50 }}>
          <button
            onClick={handleLogout}
            className={styles.cancelButton}
            title="Çıxış"
          >
            Çıxış
          </button>
        </div>

        {isModalOpen && selectedDate && (
          <LessonModal
            date={selectedDate}
            onSave={handleSaveLesson}
            onClose={() => setIsModalOpen(false)}
            existingLessons={[]}
            onDelete={() => {}}
          />
        )}

        {isTemplateModalOpen && (
          <TemplateModal
            type={currentTemplateType}
            onClose={handleCloseTemplateModal}
            onSave={handleSaveTemplate}
            onCopy={handleCopyTemplate}
            existingLessons={templates[currentTemplateType]}
            currentYear={new Date().getFullYear()}
          />
        )}
      </div>
    </div>
  );
}
