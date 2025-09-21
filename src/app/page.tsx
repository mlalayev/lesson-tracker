"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Calendar from "../components/Calendar";
import LessonModal from "../components/LessonModal";
import { Lesson } from "../types/lesson";
import {
  loadLessons,
  deleteLesson,
  clearDayLessons,
  saveLessons,
} from "../lib/lessonSync";
import styles from "./page.module.css";

export default function Home() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    // Auth guard: require token
    const token =
      typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    if (!token) {
      router.replace("/login");
      return;
    }

    // Load lessons from MongoDB (with localStorage fallback)
    const loadLessonsData = async () => {
      try {
        const lessonsData = await loadLessons();
        setLessons(lessonsData);
      } catch (error) {
        console.error("Error loading lessons:", error);
        // Fallback to localStorage only
        const savedLessons = localStorage.getItem("lessons");
        if (savedLessons) {
          setLessons(JSON.parse(savedLessons));
        }
      }
    };

    loadLessonsData();
  }, []);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleSaveLesson = async (lesson: Lesson) => {
    console.log('=== DEBUGGING handleSaveLesson ===');
    console.log('Received lesson from modal:', lesson);
    console.log('Lesson has date?', !!lesson.date);
    console.log('Lesson date value:', lesson.date);
    console.log('All lesson fields:', Object.keys(lesson));
    
    // CHECK: Make sure the new lesson has date before adding to array
    if (!lesson.date) {
      console.error('CRITICAL ERROR: Lesson received without date!', lesson);
      alert('ERROR: Lesson missing date field. Cannot save.');
      return;
    }
    
    const newLessons = [...lessons, lesson];
    console.log('New lessons array length:', newLessons.length);
    console.log('Last lesson in array:', newLessons[newLessons.length - 1]);
    console.log('Last lesson has date?', !!newLessons[newLessons.length - 1].date);
    
    setLessons(newLessons);
    
    // Save to MongoDB and localStorage
    try {
      console.log('About to call saveLessons with:', newLessons);
      await saveLessons(newLessons);
      console.log('Successfully saved lessons to MongoDB and localStorage');
    } catch (error) {
      console.error('Error saving lessons:', error);
      alert('Dərs saxlanıldı, amma serverə göndərilmədi. Yenidən cəhd edin.');
    }
    
    setIsModalOpen(false);
  };

  const handleDeleteLesson = async (lessonId: string) => {
    const newLessons = lessons.filter((lesson) => lesson.id !== lessonId);
    setLessons(newLessons);
    
    // Save updated lessons to MongoDB and localStorage
    try {
      await saveLessons(newLessons);
      await deleteLesson(lessonId);
      console.log('Successfully deleted lesson from MongoDB and localStorage');
    } catch (error) {
      console.error('Error deleting lesson:', error);
      alert('Dərs silindi, amma serverdə xəta baş verdi. Yenidən cəhd edin.');
    }
  };

  const handleClearDay = async (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = (date.getMonth() + 1).toString().padStart(2, "0");
    const dd = date.getDate().toString().padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const newLessons = lessons.filter((lesson) => lesson.date !== dateStr);
    setLessons(newLessons);
    
    // Save updated lessons to MongoDB and localStorage
    try {
      await saveLessons(newLessons);
      await clearDayLessons(date);
      console.log('Successfully cleared day lessons from MongoDB and localStorage');
    } catch (error) {
      console.error('Error clearing day lessons:', error);
      alert('Günün dərsləri silindi, amma serverdə xəta baş verdi. Yenidən cəhd edin.');
    }
  };

  const handleLessonsUpdate = async () => {
    try {
      console.log('=== HANDLE LESSONS UPDATE START ===');
      const lessonsData = await loadLessons();
      console.log('Loaded lessons from loadLessons:', lessonsData.length);
      
      // Filter lessons for 2025 to see how many we have
      const lessons2025 = lessonsData.filter(lesson => lesson.date?.startsWith('2025'));
      console.log('Lessons for 2025:', lessons2025.length);
      
      setLessons(lessonsData);
      console.log('=== HANDLE LESSONS UPDATE END ===');
    } catch (error) {
      console.error("Error refreshing lessons:", error);
      // Fallback to localStorage only
      const savedLessons = localStorage.getItem("lessons");
      if (savedLessons) {
        const parsedLessons = JSON.parse(savedLessons);
        // Handle both old format (flat array) and new format (organized by year)
        if (typeof parsedLessons === 'object' && !Array.isArray(parsedLessons)) {
          // New format: organized by year
          const allLessons = Object.values(parsedLessons).flat();
          setLessons(allLessons as Lesson[]);
        } else {
          // Old format: flat array
          setLessons(parsedLessons);
        }
      } else {
        console.warn('No lessons found in localStorage fallback');
      }
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("authUser");
      localStorage.removeItem("authToken");
    }
    router.replace("/login");
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>

        <Calendar
          lessons={lessons}
          onDateClick={handleDateClick}
          onDeleteLesson={handleDeleteLesson}
          onClearDay={handleClearDay}
          onLessonsUpdate={handleLessonsUpdate}
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
