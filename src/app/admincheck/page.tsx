'use client';

import { useState, useEffect } from 'react';
import { Lesson } from '@/types/lesson';
import { calculatePrice, calculateStudentCount } from '@/types/pricing';
import TeacherDetailsModal from '@/components/TeacherDetailsModal';
import styles from './AdminPanel.module.css';

interface Teacher {
  id: string;
  name: string;
  email: string;
  salary?: number; // Admin tərəfindən təyin edilən maaş
  currentMonthLessons?: number;
  currentMonthSalary?: number;
}


export default function AdminPanel() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTeacher, setModalTeacher] = useState<Teacher | null>(null);
  const [modalLessons, setModalLessons] = useState<Lesson[]>([]);
  const [modalMonthName, setModalMonthName] = useState('');
  const [modalYear, setModalYear] = useState(0);

  // Load teachers from MongoDB with current month data
  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const response = await fetch('/api/teachers');
        if (response.ok) {
          const data = await response.json();
          const teachersWithCurrentMonth = await Promise.all(
            data.teachers.map(async (teacher: any) => {
              try {
                // Get current month lessons for this teacher
                const lessonsResponse = await fetch(`/api/lessons?userId=${teacher.id}`);
                if (lessonsResponse.ok) {
                  const lessonsData = await lessonsResponse.json();
                  const currentDate = new Date();
                  const currentYear = currentDate.getFullYear();
                  const currentMonth = currentDate.getMonth() + 1;
                  
                  // Filter lessons for current month
                  const currentMonthLessons = lessonsData.lessons.filter((lesson: any) => {
                    if (!lesson.date) return false;
                    if (!lesson.date) return false;
      const [year, month] = lesson.date.split('-');
                    return parseInt(year) === currentYear && parseInt(month) === currentMonth;
                  });
                  
                  // Calculate current month salary
                  let currentMonthSalary = 0;
                  currentMonthLessons.forEach((lesson: any) => {
                    const studentCount = calculateStudentCount(lesson.studentName);
                    currentMonthSalary += calculatePrice(lesson.subject, studentCount);
                  });
                  
                  return {
                    ...teacher,
                    currentMonthLessons: currentMonthLessons.length,
                    currentMonthSalary: currentMonthSalary
                  };
                }
              } catch (error) {
                console.error(`Error loading lessons for teacher ${teacher.id}:`, error);
              }
              
              return {
                ...teacher,
                currentMonthLessons: 0,
                currentMonthSalary: 0
              };
            })
          );
          
          setTeachers(teachersWithCurrentMonth);
        } else {
          console.error('Failed to fetch teachers');
        }
      } catch (error) {
        console.error('Error loading teachers:', error);
      }
    };

    loadTeachers();
  }, []);


  // Müəllim seçəndə - modal aç
  const handleTeacherSelect = async (teacher: Teacher) => {
    try {
      // MongoDB-dən müəllimin dərslərini yüklə
      const lessonsResponse = await fetch(`/api/lessons?userId=${teacher.id}`);
      if (lessonsResponse.ok) {
        const lessonsData = await lessonsResponse.json();
        const allLessons = lessonsData.lessons;
        
        // Cari ayı avtomatik seç
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth() + 1;
        
        // Cari ayın dərslərini tap
        const currentMonthLessons = allLessons.filter((lesson: any) => {
          if (!lesson.date) return false;
          const [year, month] = lesson.date.split('-');
          return parseInt(year) === currentYear && parseInt(month) === currentMonth;
        });
        
        // Modal məlumatlarını təyin et
        setModalTeacher(teacher);
        setModalLessons(currentMonthLessons);
        setModalMonthName(getMonthName(currentMonth));
        setModalYear(currentYear);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error('Error loading teacher lessons:', error);
    }
  };


  const getMonthName = (month: number) => {
    const months = [
      'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun',
      'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
    ];
    return months[month - 1];
  };

  return (
    <div style={{width: '100vw', backgroundColor: '#030460'}}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Admin Panel</h1>
        </div>
        
        <div className={styles.teachersList}>
          <h2>Müəllimlər</h2>
          <div className={styles.teachersGrid}>
            {teachers.map(teacher => (
              <div 
                key={teacher.id} 
                className={styles.teacherCard}
                onClick={() => handleTeacherSelect(teacher)}
              >
                <div className={styles.teacherInfo}>
                  <h3>{teacher.name}</h3>
                  <p>{teacher.email}</p>
                </div>
                <div className={styles.teacherStats}>
                  <p className={styles.currentMonth}>
                    Bu ay: {teacher.currentMonthLessons || 0} dərs
                  </p>
                  <p className={styles.salary}>
                    {teacher.currentMonthSalary?.toFixed(2) || '0.00'} AZN
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Teacher Details Modal */}
      <TeacherDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        teacher={modalTeacher}
        lessons={modalLessons}
        monthName={modalMonthName}
        year={modalYear}
      />
    </div>
  );
}
