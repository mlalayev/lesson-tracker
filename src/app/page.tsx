"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Calendar from "../components/Calendar";
import LessonModal from "../components/LessonModal";
import { Lesson } from "../types/lesson";
import {
  loadLessons,
  saveLessons,
  deleteLesson,
  clearDayLessons,
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
    console.log('handleSaveLesson called with lesson:', lesson);
    const newLessons = [...lessons, lesson];
    console.log('newLessons array:', newLessons);
    setLessons(newLessons);
    console.log('About to call saveLessons...');
    await saveLessons(newLessons);
    console.log('saveLessons completed');
    setIsModalOpen(false);
  };

  const handleDeleteLesson = async (lessonId: string) => {
    const newLessons = lessons.filter((lesson) => lesson.id !== lessonId);
    setLessons(newLessons);
    await deleteLesson(lessonId);
  };

  const handleClearDay = async (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = (date.getMonth() + 1).toString().padStart(2, "0");
    const dd = date.getDate().toString().padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const newLessons = lessons.filter((lesson) => lesson.date !== dateStr);
    setLessons(newLessons);
    await clearDayLessons(date);
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
