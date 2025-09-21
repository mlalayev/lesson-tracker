import { Lesson } from '@/types/lesson';

// Simple helper function - no validation, just return true
const isValidLesson = (lesson: any): lesson is Lesson => {
  return lesson && typeof lesson === 'object';
};

// Simple helper function - no validation for templates either
const isValidTemplateLesson = (lesson: any): boolean => {
  return lesson && typeof lesson === 'object';
};

// Clear corrupted data from localStorage
export const clearCorruptedData = async (): Promise<void> => {
  try {
    const response = await fetch('/api/clear-corrupted', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      console.log('Corrupted data cleared successfully');
    } else {
      console.error('Failed to clear corrupted data:', response.status);
    }
  } catch (error) {
    console.error('Error clearing corrupted data:', error);
  }
};

// Get current user ID from localStorage
export const getCurrentUserId = (): string | null => {
  try {
    if (typeof window === 'undefined') return null;
    
    const authUser = localStorage.getItem('authUser');
    if (authUser) {
      const user = JSON.parse(authUser);
      console.log('getCurrentUserId - found user:', user);
      return user.id || user.email || null;
    }
  } catch (error) {
    console.error('Error getting user ID:', error);
  }
  
  console.log('getCurrentUserId - returning null');
  return null;
};

// Save lessons to MongoDB and localStorage
export const saveLessons = async (lessons: Lesson[]): Promise<void> => {
  const userId = getCurrentUserId();
  
  console.log('saveLessons called with:', { lessonsCount: lessons.length, userId });
  
  if (!userId) {
    console.error('No user ID found - cannot save lessons to MongoDB');
    // Still save to localStorage as fallback
    const lessonsByYear: { [year: string]: Lesson[] } = {};
    lessons.forEach(lesson => {
      const year = lesson.date ? lesson.date.split('-')[0] : new Date().getFullYear().toString();
      if (!lessonsByYear[year]) {
        lessonsByYear[year] = [];
      }
      lessonsByYear[year].push(lesson);
    });
    localStorage.setItem('lessons', JSON.stringify(lessonsByYear));
    return;
  }

  // Add teacherId to all lessons - keep it simple
  const lessonsWithTeacherId = lessons.map(lesson => ({
    ...lesson,
    teacherId: userId
  }));

  console.log('Lessons with teacherId:', lessonsWithTeacherId.length);
  lessonsWithTeacherId.forEach((lesson, i) => {
    console.log(`Lesson ${i + 1}:`, { id: lesson.id, date: lesson.date, subject: lesson.subject });
  });

  try {
    // Save to MongoDB
    const response = await fetch('/api/lessons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lessons: lessonsWithTeacherId,
        userId: userId
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Failed to save lessons to MongoDB:', response.status, errorData);
      throw new Error(`Failed to save lessons: ${response.status}`);
    } else {
      console.log('Successfully saved lessons to MongoDB');
    }
  } catch (error) {
    console.error('Error saving lessons to MongoDB:', error);
    throw error;
  }

  // Save to localStorage as backup
  const lessonsByYear: { [year: string]: Lesson[] } = {};
  
  lessonsWithTeacherId.forEach(lesson => {
    const year = lesson.date ? lesson.date.split('-')[0] : new Date().getFullYear().toString();
    if (!lessonsByYear[year]) {
      lessonsByYear[year] = [];
    }
    lessonsByYear[year].push(lesson);
  });
  
  localStorage.setItem('lessons', JSON.stringify(lessonsByYear));
  console.log('Saved lessons to localStorage as backup');
};

// Save templates to MongoDB and localStorage
export const saveTemplates = async (templates: { odd: Lesson[], even: Lesson[] }): Promise<void> => {
  const userId = getCurrentUserId();
  
  console.log('saveTemplates called with:', { templatesOddCount: templates.odd.length, templatesEvenCount: templates.even.length, userId });
  
  if (userId) {
    // Add teacherId to all template lessons
    const templatesWithTeacherId = {
      odd: templates.odd.map(lesson => ({ ...lesson, teacherId: userId })),
      even: templates.even.map(lesson => ({ ...lesson, teacherId: userId }))
    };

    console.log('Saving templates to MongoDB:', templatesWithTeacherId);

    try {
      // Save to MongoDB
      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templates: templatesWithTeacherId,
          userId: userId
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Failed to save templates to MongoDB:', response.status, errorData);
      } else {
        console.log('Successfully saved templates to MongoDB');
      }
    } catch (error) {
      console.error('Error saving templates to MongoDB:', error);
    }
  } else {
    console.warn('No user ID found - cannot save templates to MongoDB, saving to localStorage only');
  }

  // Save to localStorage as backup
  localStorage.setItem('template_odd_days', JSON.stringify(templates.odd));
  localStorage.setItem('template_even_days', JSON.stringify(templates.even));
  console.log('Saved templates to localStorage as backup');
};

// Load lessons and templates from MongoDB first, then localStorage as fallback
export const loadUserData = async (): Promise<{ lessons: Lesson[], templates: { odd: Lesson[], even: Lesson[] } }> => {
  const userId = getCurrentUserId();
  
  let allLessons: Lesson[] = [];
  let templates: { odd: Lesson[], even: Lesson[] } = { odd: [], even: [] };
  
  if (userId) {
    try {
      // Try to load from MongoDB first
      const response = await fetch(`/api/lessons?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded data from MongoDB:', data);
        allLessons = data.lessons || [];
        console.log('Loaded all lessons without filtering:', allLessons.length);
        
        templates = data.templates || { odd: [], even: [] };
        
        // No validation or cleanup - keep all lessons as-is
        console.log('All validation disabled - keeping all lessons as-is');
        
        // Update localStorage with all lessons
        const lessonsByYear: { [year: string]: Lesson[] } = {};
        allLessons.forEach(lesson => {
          try {
            // Use current year if no date exists
            const year = lesson.date ? lesson.date.split('-')[0] : new Date().getFullYear().toString();
            if (!lessonsByYear[year]) {
              lessonsByYear[year] = [];
            }
            lessonsByYear[year].push(lesson);
          } catch (error) {
            console.error('Error processing lesson:', lesson, error);
            // Still add the lesson even if there's an error
            const currentYear = new Date().getFullYear().toString();
            if (!lessonsByYear[currentYear]) {
              lessonsByYear[currentYear] = [];
            }
            lessonsByYear[currentYear].push(lesson);
          }
        });
        localStorage.setItem('lessons', JSON.stringify(lessonsByYear));
        localStorage.setItem('template_odd_days', JSON.stringify(templates.odd));
        localStorage.setItem('template_even_days', JSON.stringify(templates.even));
        
        return { lessons: allLessons, templates };
      }
    } catch (error) {
      console.error('Error loading from MongoDB:', error);
    }
  }
  
  // Fallback to localStorage
  console.log('Falling back to localStorage');
  
  const lessonsRaw = typeof window !== "undefined" ? localStorage.getItem("lessons") : null;
  if (lessonsRaw) {
    const lessonsData = JSON.parse(lessonsRaw);
    if (typeof lessonsData === 'object' && !Array.isArray(lessonsData)) {
      // New format: organized by year
      allLessons = Object.values(lessonsData).flat() as Lesson[];
    } else {
      // Old format: flat array
      allLessons = lessonsData;
    }
  }
  
  const oddTemplatesRaw = typeof window !== "undefined" ? localStorage.getItem("template_odd_days") : null;
  const evenTemplatesRaw = typeof window !== "undefined" ? localStorage.getItem("template_even_days") : null;
  
  const oddTemplates = oddTemplatesRaw ? JSON.parse(oddTemplatesRaw) : [];
  const evenTemplates = evenTemplatesRaw ? JSON.parse(evenTemplatesRaw) : [];
  
  return {
    lessons: allLessons,
    templates: {
      odd: oddTemplates,
      even: evenTemplates
    }
  };
};

// Load lessons from MongoDB first, then localStorage as fallback
export const loadLessons = async (): Promise<Lesson[]> => {
  const userId = getCurrentUserId();
  
  if (userId) {
    try {
      // Try to load from MongoDB first
      const response = await fetch(`/api/lessons?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('loadLessons - loaded from MongoDB:', data.lessons?.length || 0, 'lessons');
        
        const lessons = data.lessons || [];
        
        // Update localStorage with MongoDB data
        const lessonsByYear: { [year: string]: Lesson[] } = {};
        lessons.forEach(lesson => {
          try {
            const year = lesson.date ? lesson.date.split('-')[0] : new Date().getFullYear().toString();
            if (!lessonsByYear[year]) {
              lessonsByYear[year] = [];
            }
            lessonsByYear[year].push(lesson);
          } catch (error) {
            console.error('Error processing lesson:', lesson, error);
            const currentYear = new Date().getFullYear().toString();
            if (!lessonsByYear[currentYear]) {
              lessonsByYear[currentYear] = [];
            }
            lessonsByYear[currentYear].push(lesson);
          }
        });
        localStorage.setItem('lessons', JSON.stringify(lessonsByYear));
        
        return lessons;
      }
    } catch (error) {
      console.error('Error loading lessons from MongoDB:', error);
    }
  }
  
  // Fallback to localStorage
  console.log('loadLessons - falling back to localStorage');
  const lessonsRaw = typeof window !== "undefined" ? localStorage.getItem("lessons") : null;
  let lessons: Lesson[] = [];
  
  if (lessonsRaw) {
    const lessonsData = JSON.parse(lessonsRaw);
    if (typeof lessonsData === 'object' && !Array.isArray(lessonsData)) {
      // New format: organized by year
      lessons = Object.values(lessonsData).flat() as Lesson[];
    } else {
      // Old format: flat array
      lessons = lessonsData;
    }
  }
  
  console.log('loadLessons - loaded from localStorage:', lessons.length, 'lessons');
  return lessons;
};

// Delete a lesson from localStorage only
export const deleteLesson = async (lessonId: string): Promise<void> => {
  console.log('deleteLesson - using localStorage only');
  
  const lessonsRaw = typeof window !== "undefined" ? localStorage.getItem("lessons") : null;
  if (lessonsRaw) {
    const lessonsData = JSON.parse(lessonsRaw);
    if (typeof lessonsData === 'object' && !Array.isArray(lessonsData)) {
      // New format: organized by year
      const lessonsByYear: { [year: string]: Lesson[] } = lessonsData;
      Object.keys(lessonsByYear).forEach(year => {
        lessonsByYear[year] = lessonsByYear[year].filter(lesson => 
          lesson && lesson.id && lesson.id !== lessonId
        );
      });
      localStorage.setItem('lessons', JSON.stringify(lessonsByYear));
    } else {
      // Old format: flat array (backward compatibility)
      const lessons = lessonsData;
      const filteredLessons = lessons.filter((lesson: Lesson) => 
        lesson && lesson.id && lesson.id !== lessonId
      );
      localStorage.setItem('lessons', JSON.stringify(filteredLessons));
    }
  }
};

// Clear all lessons for a specific date
export const clearDayLessons = async (date: Date): Promise<void> => {
  const yyyy = date.getFullYear();
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;

  // Update localStorage
  const localLessons = localStorage.getItem('lessons');
  if (localLessons) {
    const lessonsData = JSON.parse(localLessons);
    
    if (typeof lessonsData === 'object' && !Array.isArray(lessonsData)) {
      // New format: organized by year
      const lessonsByYear: { [year: string]: Lesson[] } = lessonsData;
      const year = yyyy.toString();
      if (lessonsByYear[year]) {
        lessonsByYear[year] = lessonsByYear[year].filter((lesson: Lesson) => 
          lesson && lesson.date && lesson.date !== dateStr
        );
        localStorage.setItem('lessons', JSON.stringify(lessonsByYear));
      }
    } else {
      // Old format: flat array (backward compatibility)
      const lessons = lessonsData;
      const filteredLessons = lessons.filter((lesson: Lesson) => 
        lesson && lesson.date && lesson.date !== dateStr
      );
      localStorage.setItem('lessons', JSON.stringify(filteredLessons));
    }
  }
};
