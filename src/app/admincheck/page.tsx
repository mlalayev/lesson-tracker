'use client';

import { useState, useEffect } from 'react';
import { Lesson } from '@/types/lesson';
import { calculatePrice, calculateStudentCount } from '@/types/pricing';
import TeacherDetailsModal from '@/components/TeacherDetailsModal';
import TeacherPricingModal from '@/components/TeacherPricingModal';
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

  // Pricing modal state
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [pricingModalTeacher, setPricingModalTeacher] = useState<Teacher | null>(null);
  const [pricingModalMonthName, setPricingModalMonthName] = useState('');
  const [pricingModalYear, setPricingModalYear] = useState(0);

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
                  
                  // Calculate current month salary using teacher's custom pricing
                  let currentMonthSalary = 0;
                  currentMonthLessons.forEach((lesson: any) => {
                    const studentCount = calculateStudentCount(lesson.studentName);
                    const lessonPrice = calculatePrice(lesson.subject, studentCount, teacher.id);
                    currentMonthSalary += lessonPrice;
                    console.log(`Teacher ${teacher.name} - ${lesson.subject} (${studentCount} students): ${lessonPrice} AZN`);
                  });
                  
                  console.log(`Total salary for ${teacher.name}: ${currentMonthSalary} AZN`);
                  
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

  // View Profile düyməsinə vuranda - pricing modal aç
  const handleViewProfile = async (teacher: Teacher, event: React.MouseEvent) => {
    event.stopPropagation(); // Parent click event-ini dayandır
    
    // Cari ayı avtomatik seç
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    // Pricing modal məlumatlarını təyin et
    setPricingModalTeacher(teacher);
    setPricingModalMonthName(getMonthName(currentMonth));
    setPricingModalYear(currentYear);
    setIsPricingModalOpen(true);
  };

  // Pricing məlumatlarını saxla
  const handleSavePricing = async (subjectPricing: Record<string, any[]>) => {
    try {
      // localStorage-də artıq saxlanılıb, burada əlavə işlər edə bilərik
      console.log('Pricing saved to localStorage for teacher:', pricingModalTeacher?.name);
      console.log('Subject pricing:', subjectPricing);
      
      // TODO: API endpoint yaradıb pricing məlumatlarını MongoDB-yə də saxla
      // const response = await fetch('/api/teacher-pricing', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     teacherId: pricingModalTeacher?.id,
      //     month: pricingModalMonthName,
      //     year: pricingModalYear,
      //     subjectPricing
      //   })
      // });
      
      alert('Maaş tarifləri saxlandı!');
    } catch (error) {
      console.error('Error saving pricing:', error);
      alert('Maaş tarifləri saxlanarkən xəta baş verdi!');
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
                <div className={styles.teacherActions}>
                  <button 
                    className={styles.viewProfileButton}
                    onClick={(e) => handleViewProfile(teacher, e)}
                  >
                    View Profile
                  </button>
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

      {/* Teacher Pricing Modal */}
      <TeacherPricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        teacher={pricingModalTeacher}
        monthName={pricingModalMonthName}
        year={pricingModalYear}
        onSavePricing={handleSavePricing}
      />
    </div>
  );
}
