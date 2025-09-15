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
      const templates = JSON.parse(savedTemplates);
      // Debug: Clear templates to fix day assignments - remove this after testing
      console.log('Current templates:', templates);
      setTemplates(templates);
    }
  }, []);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleSaveLesson = (lesson: Lesson) => {
    const newLessons = [...lessons, lesson];
    setLessons(newLessons);
    localStorage.setItem('lessons', JSON.stringify(newLessons));
    setIsModalOpen(false);
  };

  const handleDeleteLesson = (lessonId: string) => {
    const newLessons = lessons.filter(lesson => lesson.id !== lessonId);
    setLessons(newLessons);
    localStorage.setItem('lessons', JSON.stringify(newLessons));
  };

  const handleDeleteLessonsByDate = (date: Date) => {
    const dateString = date.toISOString().split("T")[0];
    const dayLessons = lessons.filter((lesson) => lesson.date === dateString);
    
    if (dayLessons.length === 0) {
      return;
    }

    // Bütün dərsləri bir dəfədə sil
    const newLessons = lessons.filter(lesson => lesson.date !== dateString);
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

    // Fix: JavaScript getDay() returns 0=Sunday, 1=Monday, etc.
    // For odd days: Monday(1), Wednesday(3), Friday(5)
    // For even days: Tuesday(2), Thursday(4), Saturday(6)
    const days = type === 'odd' ? [1, 3, 5] : [2, 4, 6]; // Monday(1), Wednesday(3), Friday(5) vs Tuesday(2), Thursday(4), Saturday(6)
    const newLessons = [...lessons];
    
    // Maaş dövrü: ayın 1-dən ayın son gününə qədər
    const salaryStartDate = new Date(targetYear, targetMonth, 1);
    const salaryEndDate = new Date(targetYear, targetMonth + 1, 0);
    
    const currentDate = new Date(salaryStartDate);
    
    while (currentDate <= salaryEndDate) {
      const dayOfWeek = currentDate.getDay(); // 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
      
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
          onDeleteLessonsByDate={handleDeleteLessonsByDate}
          onClearMonth={handleClearMonth}
          onCopyTemplate={handleCopyTemplate}
          onOpenTemplate={handleOpenTemplate}
        />


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
