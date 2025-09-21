import { Lesson } from '@/types/lesson';

// Simple helper function - no validation, just return true
const isValidLesson = (lesson: any): lesson is Lesson => {
  return lesson && typeof lesson === 'object';
};

// Simple helper function - no validation for templates either
const isValidTemplateLesson = (lesson: any): boolean => {
  return lesson && typeof lesson === 'object';
};

// Clean corrupted lesson data (lessons without dates)
export const clearCorruptedData = async (): Promise<void> => {
  const userId = getCurrentUserId();
  
  if (!userId) {
    console.warn('No user ID found - cannot clear corrupted data');
    return;
  }
  
  try {
    const response = await fetch('/api/clear-corrupted', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('Corrupted data cleanup result:', result);
    } else {
      console.error('Failed to clear corrupted data:', response.status);
    }
  } catch (error) {
    console.error('Error clearing corrupted data:', error);
  }
};

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
      const year = lesson.date ? lesson.date.split('-')[0] : new Date().getFullYear().toString();
      if (!lessonsByYear[year]) {
        lessonsByYear[year] = [];
      }
      lessonsByYear[year].push(lesson);
    });
    localStorage.setItem('lessons', JSON.stringify(lessonsByYear));
    return;
  }

  // Add teacherId to all lessons and ENSURE date field is preserved
  const lessonsWithTeacherId = lessons.map((lesson, index) => {
    console.log(`=== LESSON ${index + 1} BEFORE ADDING TEACHER ID ===`);
    console.log('Original lesson:', lesson);
    console.log('Has date?', !!lesson.date);
    console.log('Date value:', lesson.date);
    
    const lessonWithTeacherId = {
      id: lesson.id,
      date: lesson.date, // EXPLICITLY preserve date
      time: lesson.time,
      subject: lesson.subject,
      studentName: lesson.studentName,
      notes: lesson.notes || '',
      duration: lesson.duration,
      teacherId: userId
    };
    
    // TRIPLE CHECK: Force date field if missing
    if (!lessonWithTeacherId.date && lesson.date) {
      lessonWithTeacherId.date = lesson.date;
    }
    
    // ABSOLUTE FORCE: Set date field using multiple methods
    if (lesson.date) {
      lessonWithTeacherId.date = lesson.date;
      lessonWithTeacherId['date'] = lesson.date;
      Object.defineProperty(lessonWithTeacherId, 'date', { 
        value: lesson.date, 
        writable: true, 
        enumerable: true, 
        configurable: true 
      });
    }
    
    console.log('After adding teacherId:', lessonWithTeacherId);
    console.log('Still has date?', !!lessonWithTeacherId.date);
    console.log('Date value after:', lessonWithTeacherId.date);
    
    // DOUBLE CHECK: Force date if it's missing
    if (!lessonWithTeacherId.date && lesson.date) {
      lessonWithTeacherId.date = lesson.date;
      console.log('FORCED date back:', lessonWithTeacherId.date);
    }
    
    return lessonWithTeacherId;
  });

  console.log('=== FINAL LESSONS TO SAVE ===');
  console.log('Total lessons:', lessonsWithTeacherId.length);
  lessonsWithTeacherId.forEach((lesson, i) => {
    console.log(`Lesson ${i + 1}:`, lesson);
  });

  try {
    // FINAL CHECK before sending to MongoDB
    console.log('=== FINAL CHECK BEFORE MONGODB ===');
    lessonsWithTeacherId.forEach((lesson, i) => {
      console.log(`Final lesson ${i + 1}:`, JSON.stringify(lesson, null, 2));
      if (!lesson.date) {
        console.error(`CRITICAL: Lesson ${i + 1} has NO DATE before MongoDB save!`);
      }
    });
    
    const requestBody = {
      lessons: lessonsWithTeacherId,
      userId: userId
    };
    
    console.log('Request body being sent to MongoDB:', JSON.stringify(requestBody, null, 2));
    
    // Save to MongoDB
    const response = await fetch('/api/lessons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Failed to save lessons to MongoDB:', response.status, errorData);
      console.error('Request body was:', JSON.stringify({
        lessons: lessonsWithTeacherId,
        userId: userId
      }, null, 2));
    } else {
      const responseData = await response.json();
      console.log('Successfully saved lessons to MongoDB:', responseData);
      console.log('Saved', lessonsWithTeacherId.length, 'lessons for user', userId);
    }
  } catch (error) {
    console.error('Error saving lessons to MongoDB:', error);
  }

  // Group lessons by year for localStorage backup
  const lessonsByYear: { [year: string]: Lesson[] } = {};
  
  console.log('saveLessons: Processing', lessonsWithTeacherId.length, 'lessons');
  lessonsWithTeacherId.forEach((lesson, index) => {
    console.log(`saveLessons: Processing lesson ${index + 1}:`, lesson);
    
    try {
      // Use current year if no date exists
      const year = lesson.date ? lesson.date.split('-')[0] : new Date().getFullYear().toString();
      
      if (!lessonsByYear[year]) {
        lessonsByYear[year] = [];
      }
      lessonsByYear[year].push(lesson);
    } catch (error) {
      console.error('Error processing lesson in saveLessons:', lesson, error);
      // Still add the lesson even if there's an error
      const currentYear = new Date().getFullYear().toString();
      if (!lessonsByYear[currentYear]) {
        lessonsByYear[currentYear] = [];
      }
      lessonsByYear[currentYear].push(lesson);
    }
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

// No cleanup function - removed all validation

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
    try {
      const lessonsData = JSON.parse(localLessons);
      if (typeof lessonsData === 'object' && !Array.isArray(lessonsData)) {
        // New format: organized by year
        const flatLessons = Object.values(lessonsData).flat();
        console.log('localStorage fallback: loaded lessons:', flatLessons.length);
        allLessons = flatLessons as Lesson[];
      } else {
        // Old format: flat array (backward compatibility)
        console.log('localStorage fallback: old format lessons:', (lessonsData || []).length);
        allLessons = lessonsData || [];
      }
    } catch (error) {
      console.error('Error parsing lessons from localStorage:', error);
      allLessons = [];
    }
  }
  
  // Parse templates and validate
  let oddTemplates: Lesson[] = [];
  let evenTemplates: Lesson[] = [];
  
  try {
    oddTemplates = localOddTemplates ? JSON.parse(localOddTemplates) : [];
  } catch (error) {
    console.error('Error parsing odd templates from localStorage:', error);
  }
  
  try {
    evenTemplates = localEvenTemplates ? JSON.parse(localEvenTemplates) : [];
  } catch (error) {
    console.error('Error parsing even templates from localStorage:', error);
  }
  
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
  console.log('loadLessons - using localStorage only');
  
  // Load from localStorage only
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
  
  // Update localStorage
  const localLessons = localStorage.getItem('lessons');
  if (localLessons) {
    const lessonsData = JSON.parse(localLessons);
    
    if (typeof lessonsData === 'object' && !Array.isArray(lessonsData)) {
      // New format: organized by year
      const lessonsByYear: { [year: string]: Lesson[] } = lessonsData;
      Object.keys(lessonsByYear).forEach(year => {
        lessonsByYear[year] = lessonsByYear[year].filter((lesson: Lesson) => 
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
