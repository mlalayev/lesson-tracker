'use client';

import { useState, useEffect } from 'react';
import { Lesson } from '@/types/lesson';
import { calculatePrice, calculateStudentCount } from '@/types/pricing';
import styles from './AdminPanel.module.css';

interface Teacher {
  id: string;
  name: string;
  email: string;
  salary?: number; // Admin tərəfindən təyin edilən maaş
  currentMonthLessons?: number;
  currentMonthSalary?: number;
}

interface MonthlyData {
  year: number;
  month: number;
  lessons: Lesson[];
  estimatedSalary: number;
  actualSalary?: number;
}

export default function AdminPanel() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<{ year: number; month: number } | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [salaryInput, setSalaryInput] = useState<string>('');

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

  // Müəllimin aylıq məlumatlarını hesabla
  const calculateMonthlyData = async (teacherId: string, allLessons: any[]) => {
    // Müəllimin dərslərini tapmaq üçün teacherId istifadə edirik
    // Əgər lesson-da teacherId yoxdursa, o lesson bu müəllimə aiddir (köhnə dərslər üçün)
    const teacherLessons = allLessons.filter(lesson => 
      lesson.teacherId === teacherId || !lesson.teacherId
    );

    const monthlyMap = new Map<string, Lesson[]>();
    
    teacherLessons.forEach(lesson => {
      if (!lesson.date) return false;
      const [year, month] = lesson.date.split('-');
      const key = `${year}-${month}`;
      if (!monthlyMap.has(key)) {
        monthlyMap.set(key, []);
      }
      monthlyMap.get(key)!.push(lesson);
    });

    const monthlyData: MonthlyData[] = [];
    
    // Load all salaries for this teacher from MongoDB
    let teacherSalaries: any[] = [];
    try {
      const user = await fetch(`/api/teachers`).then(res => res.json());
      const teacher = user.teachers.find((t: any) => t.id === teacherId);
      if (teacher) {
        const userResponse = await fetch(`/api/lessons?userId=${teacherId}`);
        if (userResponse.ok) {
          const userData = await userResponse.json();
          // Get salaries from user data (we'll need to modify the API to return salaries)
          teacherSalaries = userData.salaries || [];
        }
      }
    } catch (error) {
      console.error('Error loading teacher salaries:', error);
    }
    
    monthlyMap.forEach((lessons, key) => {
      const [year, month] = key.split('-');
      // Calculate estimated salary for all lessons in this month
      let estimatedSalary = 0;
      lessons.forEach(lesson => {
        const studentCount = calculateStudentCount(lesson.studentName);
        estimatedSalary += calculatePrice(lesson.subject, studentCount);
      });
      
      // Find saved salary from MongoDB
      const savedSalary = teacherSalaries.find(s => 
        s.year === parseInt(year) && s.month === parseInt(month)
      );
      
      monthlyData.push({
        year: parseInt(year),
        month: parseInt(month),
        lessons,
        estimatedSalary,
        actualSalary: savedSalary?.salary
      });
    });

    return monthlyData.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  };

  // Müəllim seçəndə - cari ayı göstər
  const handleTeacherSelect = async (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setSelectedMonth(null);
    setLessons([]);
    
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
        
        setLessons(currentMonthLessons);
        setSelectedMonth({ year: currentYear, month: currentMonth });
        
        // Bütün aylıq məlumatları hesabla
        const monthly = await calculateMonthlyData(teacher.id, allLessons);
        setMonthlyData(monthly);
        
        // Cari ay üçün saxlanılmış maaşı MongoDB-dən yüklə
        try {
          const salaryResponse = await fetch(`/api/teacher-salary?teacherId=${teacher.id}&year=${currentYear}&month=${currentMonth}`);
          if (salaryResponse.ok) {
            const salaryData = await salaryResponse.json();
            setSalaryInput(salaryData.salary ? salaryData.salary.toString() : '');
          }
        } catch (error) {
          console.error('Error loading salary:', error);
          setSalaryInput('');
        }
      }
    } catch (error) {
      console.error('Error loading teacher lessons:', error);
    }
  };

  // Ay seçəndə
  const handleMonthSelect = async (year: number, month: number) => {
    setSelectedMonth({ year, month });
    const monthData = monthlyData.find(m => m.year === year && m.month === month);
    if (monthData) {
      setLessons(monthData.lessons);
      
      // Load saved salary from localStorage
      if (selectedTeacher) {
        const salaryKey = `teacher_salary_${selectedTeacher.id}_${year}_${month}`;
        const savedSalary = localStorage.getItem(salaryKey);
        setSalaryInput(savedSalary || '');
      }
    }
  };

  // Maaş təyin et - MongoDB-ə saxla
  const handleSetSalary = async () => {
    if (!selectedTeacher || !selectedMonth || !salaryInput) return;
    
    const salary = parseFloat(salaryInput);
    if (isNaN(salary)) return;

    try {
      // MongoDB-ə maaş məlumatlarını saxla
      const response = await fetch('/api/teacher-salary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teacherId: selectedTeacher.id,
          year: selectedMonth.year,
          month: selectedMonth.month,
          salary: salary
        }),
      });

      if (response.ok) {
        // State-i yenilə
        setMonthlyData(prev => prev.map(m => 
          m.year === selectedMonth.year && m.month === selectedMonth.month
            ? { ...m, actualSalary: salary }
            : m
        ));

        alert('Maaş təyin edildi!');
      } else {
        console.error('Failed to save salary');
        alert('Maaş saxlanarkən xəta baş verdi!');
      }
    } catch (error) {
      console.error('Error saving salary:', error);
      alert('Maaş saxlanarkən xəta baş verdi!');
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
      
      {!selectedTeacher ? (
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
      ) : (
        <div className={styles.teacherDetails}>
          <div className={styles.header}>
            <button 
              className={styles.backButton}
              onClick={() => setSelectedTeacher(null)}
            >
              ← Geri
            </button>
            <h2>{selectedTeacher.name}</h2>
          </div>

          {!selectedMonth ? (
            <div className={styles.monthsList}>
              <h3>Aylar</h3>
              <div className={styles.monthsGrid}>
                {monthlyData.map(month => (
                  <div 
                    key={`${month.year}-${month.month}`}
                    className={styles.monthCard}
                    onClick={() => handleMonthSelect(month.year, month.month)}
                  >
                    <h4>{getMonthName(month.month)} {month.year}</h4>
                    <p>Dərs sayı: {month.lessons.length}</p>
                    <p>Təxmini maaş: {month.estimatedSalary.toFixed(2)} AZN</p>
                    {month.actualSalary && (
                      <p className={styles.actualSalary}>
                        Təyin edilən maaş: {month.actualSalary} AZN
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={styles.monthDetails}>
              <div className={styles.monthHeader}>
                <button 
                  className={styles.backButton}
                  onClick={() => setSelectedMonth(null)}
                >
                  ← Geri
                </button>
                <h3>{getMonthName(selectedMonth.month)} {selectedMonth.year}</h3>
              </div>

              <div className={styles.salarySection}>
                <h4>Maaş Təyin Et</h4>
                <div className={styles.salaryInput}>
                  <input
                    type="number"
                    value={salaryInput}
                    onChange={(e) => setSalaryInput(e.target.value)}
                    placeholder="Maaş məbləği"
                  />
                  <button onClick={handleSetSalary}>Təyin Et</button>
                </div>
              </div>

              <div className={styles.lessonsSection}>
                <h4>Dərslər ({lessons.length})</h4>
                <div className={styles.lessonsList}>
                  {lessons.map(lesson => (
                    <div key={lesson.id} className={styles.lessonCard}>
                      <div className={styles.lessonInfo}>
                        <span className={styles.date}>{lesson.date}</span>
                        <span className={styles.time}>{lesson.time}</span>
                        <span className={styles.subject}>{lesson.subject}</span>
                        <span className={styles.student}>{lesson.studentName}</span>
                      </div>
                      <div className={styles.lessonPrice}>
                        {calculatePrice(lesson.subject, calculateStudentCount(lesson.studentName)).toFixed(2)} AZN
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
</div>
  );
}
