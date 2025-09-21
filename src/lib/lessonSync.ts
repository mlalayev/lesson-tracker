import { Lesson } from '@/types/lesson';

// Get current user ID from localStorage
export const getCurrentUserId = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const authUser = localStorage.getItem('authUser');
    console.log('getCurrentUserId - authUser from localStorage:', authUser);
    
    if (authUser) {
      const user = JSON.parse(authUser);
      console.log('getCurrentUserId - parsed user:', user);
      const userId = user.id || user.email;
      console.log('getCurrentUserId - returning userId:', userId);
      return userId; // Use ID if available, otherwise email
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
      const year = lesson.date.split('-')[0];
      if (!lessonsByYear[year]) {
        lessonsByYear[year] = [];
      }
      lessonsByYear[year].push(lesson);
    });
    localStorage.setItem('lessons', JSON.stringify(lessonsByYear));
    return;
  }

  // Add teacherId to all lessons
  const lessonsWithTeacherId = lessons.map(lesson => ({
    ...lesson,
    teacherId: userId
  }));

  console.log('Saving lessons to MongoDB:', { lessonsWithTeacherId, userId });

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
    } else {
      console.log('Successfully saved lessons to MongoDB');
    }
  } catch (error) {
    console.error('Error saving lessons to MongoDB:', error);
  }

  // Group lessons by year for localStorage backup
  const lessonsByYear: { [year: string]: Lesson[] } = {};
  
  lessonsWithTeacherId.forEach(lesson => {
    const year = lesson.date.split('-')[0]; // Extract year from date (YYYY-MM-DD)
    if (!lessonsByYear[year]) {
      lessonsByYear[year] = [];
    }
    lessonsByYear[year].push(lesson);
  });
  
  // Save to localStorage as backup
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
  let templates = { odd: [], even: [] };
  
  if (userId) {
    try {
      // Try to load from MongoDB first
      const response = await fetch(`/api/lessons?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded data from MongoDB:', data);
        allLessons = data.lessons || [];
        templates = data.templates || { odd: [], even: [] };
        
        // Also update localStorage with MongoDB data
        const lessonsByYear: { [year: string]: Lesson[] } = {};
        allLessons.forEach(lesson => {
          const year = lesson.date.split('-')[0];
          if (!lessonsByYear[year]) {
            lessonsByYear[year] = [];
          }
          lessonsByYear[year].push(lesson);
        });
        localStorage.setItem('lessons', JSON.stringify(lessonsByYear));
        localStorage.setItem('template_odd_days', JSON.stringify(templates.odd));
        localStorage.setItem('template_even_days', JSON.stringify(templates.even));
        
        return { lessons: allLessons, templates };
      }
    } catch (error) {
      console.error('Error loading data from MongoDB:', error);
    }
  }
  
  // Fallback to localStorage
  console.log('Falling back to localStorage for user data');
  const localLessons = localStorage.getItem('lessons');
  const localOddTemplates = localStorage.getItem('template_odd_days');
  const localEvenTemplates = localStorage.getItem('template_even_days');
  
  // Convert lessons by year back to flat array
  if (localLessons) {
    const lessonsData = JSON.parse(localLessons);
    if (typeof lessonsData === 'object' && !Array.isArray(lessonsData)) {
      // New format: organized by year
      allLessons = Object.values(lessonsData).flat();
    } else {
      // Old format: flat array (backward compatibility)
      allLessons = lessonsData;
    }
  }
  
  return {
    lessons: allLessons,
    templates: {
      odd: localOddTemplates ? JSON.parse(localOddTemplates) : [],
      even: localEvenTemplates ? JSON.parse(localEvenTemplates) : []
    }
  };
};

// Load lessons from MongoDB first, then localStorage as fallback
export const loadLessons = async (): Promise<Lesson[]> => {
  const userId = getCurrentUserId();
  
  if (!userId) {
    console.error('No user ID found');
    // Fallback to localStorage
    const userData = await loadUserData();
    return userData.lessons;
  }

  try {
    // Try to load from MongoDB first
    const response = await fetch(`/api/lessons?userId=${userId}`);
    if (response.ok) {
      const data = await response.json();
      return data.lessons || [];
    }
  } catch (error) {
    console.error('Error loading lessons from MongoDB:', error);
  }

  // Fallback to localStorage
  const userData = await loadUserData();
  return userData.lessons;
};

// Delete a lesson from MongoDB and localStorage
export const deleteLesson = async (lessonId: string): Promise<void> => {
  const userId = getCurrentUserId();
  
  if (userId) {
    try {
      // Delete from MongoDB
      const response = await fetch(`/api/lessons?lessonId=${lessonId}&userId=${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        console.error('Failed to delete lesson from MongoDB');
      }
    } catch (error) {
      console.error('Error deleting lesson from MongoDB:', error);
    }
  }

  // Update localStorage
  const localLessons = localStorage.getItem('lessons');
  if (localLessons) {
    const lessonsData = JSON.parse(localLessons);
    
    if (typeof lessonsData === 'object' && !Array.isArray(lessonsData)) {
      // New format: organized by year
      const lessonsByYear: { [year: string]: Lesson[] } = lessonsData;
      Object.keys(lessonsByYear).forEach(year => {
        lessonsByYear[year] = lessonsByYear[year].filter((lesson: Lesson) => lesson.id !== lessonId);
      });
      localStorage.setItem('lessons', JSON.stringify(lessonsByYear));
    } else {
      // Old format: flat array (backward compatibility)
      const lessons = lessonsData;
      const filteredLessons = lessons.filter((lesson: Lesson) => lesson.id !== lessonId);
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
        lessonsByYear[year] = lessonsByYear[year].filter((lesson: Lesson) => lesson.date !== dateStr);
        localStorage.setItem('lessons', JSON.stringify(lessonsByYear));
      }
    } else {
      // Old format: flat array (backward compatibility)
      const lessons = lessonsData;
      const filteredLessons = lessons.filter((lesson: Lesson) => lesson.date !== dateStr);
      localStorage.setItem('lessons', JSON.stringify(filteredLessons));
    }
  }
};
