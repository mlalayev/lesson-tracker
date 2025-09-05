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
