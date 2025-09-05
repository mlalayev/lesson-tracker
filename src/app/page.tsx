'use client';

import { useState, useEffect } from 'react';
import Calendar from '../components/Calendar';
import LessonModal from '../components/LessonModal';
import { Lesson } from '../types/lesson';
import styles from './page.module.css';

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    // Local storage-dan dərsləri yüklə
    const savedLessons = localStorage.getItem('lessons');
    if (savedLessons) {
      setLessons(JSON.parse(savedLessons));
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
      const year = baseDate.getFullYear();
      const month = baseDate.getMonth();
      
      // Həmin ayın bütün günlərini yoxla
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month, day);
        const dayOfWeek = currentDate.getDay() === 0 ? 7 : currentDate.getDay(); // Bazar = 7
        
        // Əgər bu gün qrupun gəldiyi günlərdəndirsə
        if (lesson.groupDays.includes(dayOfWeek)) {
          const groupLesson: Lesson = {
            ...lesson,
            id: `${groupId}_${day}`,
            date: currentDate.toISOString().split('T')[0],
            groupId: groupId,
            isGroupLesson: true
          };
          
          // Əgər bu gün üçün dərs yoxdursa əlavə et
          const existingLesson = newLessons.find(l => 
            l.date === groupLesson.date && 
            l.time === groupLesson.time && 
            l.studentName === groupLesson.studentName
          );
          
          if (!existingLesson) {
            newLessons.push(groupLesson);
          }
        }
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

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            📚 Dərs Tracker
          </h1>
          <p className={styles.subtitle}>
            Keçdiyin dərsləri qeyd et və izlə
          </p>
        </div>
        
        <Calendar 
          lessons={lessons}
          onDateClick={handleDateClick}
          onDeleteLesson={handleDeleteLesson}
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
      </div>
    </div>
  );
}
