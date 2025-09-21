// Maaş hesablama strukturu
export interface PricingTier {
  minStudents: number;
  maxStudents?: number;
  price: number;
}

export interface SubjectPricing {
  subject: string;
  tiers: PricingTier[];
}

export const PRICING_CONFIG: SubjectPricing[] = [
  {
    subject: 'İngilis dili',
    tiers: [
      { minStudents: 1, price: 6 },
      { minStudents: 2, price: 8 },
      { minStudents: 3, price: 10 }
    ]
  },
  {
    subject: 'SAT',
    tiers: [
      { minStudents: 1, price: 8 },
      { minStudents: 2, price: 10 },
      { minStudents: 3, price: 12 }
    ]
  },
  {
    subject: 'IELTS',
    tiers: [
      { minStudents: 1, price: 8 },
      { minStudents: 2, price: 10 },
      { minStudents: 3, price: 12 }
    ]
  },
  {
    subject: 'Speaking',
    tiers: [
      { minStudents: 1, price: 3 },
      { minStudents: 2, price: 4 },
      { minStudents: 3, price: 5 },
      { minStudents: 4, price: 6 },
      { minStudents: 5, price: 7 },
      { minStudents: 6, price: 8 }
    ]
  },
  {
    subject: 'Kids',
    tiers: [
      { minStudents: 1, price: 6 },
      { minStudents: 2, price: 8 },
      { minStudents: 3, price: 10 }
    ]
  }
];

// Tələbə sayını hesablamaq üçün funksiya
export function calculateStudentCount(studentNames: string): number {
  if (!studentNames.trim()) return 0;
  
  // Vergüllə böl və boş stringləri sil
  const students = studentNames
    .split(',')
    .map(name => name.trim())
    .filter(name => name.length > 0);
  
  return students.length;
}

// Fənn üçün qiymət hesablamaq üçün funksiya
export function calculatePrice(subject: string, studentCount: number, teacherId?: string): number {
  // Əgər teacherId varsa, localStorage-dən fərdi tarifləri yoxla
  if (teacherId && typeof window !== 'undefined') {
    const teacherKey = `teacher_pricing_${teacherId}`;
    const savedPricing = localStorage.getItem(teacherKey);
    
    if (savedPricing) {
      try {
        const teacherPricing: Record<string, PricingTier[]> = JSON.parse(savedPricing);
        const subjectTiers = teacherPricing[subject];
        
        if (subjectTiers && subjectTiers.length > 0) {
          // Tələbə sayına uyğun qiymət tap
          let selectedTier = subjectTiers[0]; // Default
          
          for (const tier of subjectTiers) {
            if (studentCount >= tier.minStudents) {
              selectedTier = tier;
            } else {
              break;
            }
          }
          
          console.log(`Using custom pricing for teacher ${teacherId}, subject ${subject}, ${studentCount} students: ${selectedTier.price} AZN`);
          return selectedTier.price;
        } else {
          console.log(`No custom pricing found for teacher ${teacherId}, subject ${subject}, using default`);
        }
      } catch (error) {
        console.error('Error parsing teacher pricing:', error);
      }
    } else {
      console.log(`No saved pricing found for teacher ${teacherId}, using default`);
    }
  }
  
  // Default pricing istifadə et
  const subjectPricing = PRICING_CONFIG.find(config => 
    config.subject.toLowerCase() === subject.toLowerCase()
  );
  
  if (!subjectPricing) {
    // Digər fənlər üçün default qiymət
    const defaultPrice = studentCount * 5; // Hər tələbə üçün 5 manat
    console.log(`Using default pricing for unknown subject ${subject}, ${studentCount} students: ${defaultPrice} AZN`);
    return defaultPrice;
  }
  
  // Tələbə sayına uyğun qiymət tap
  let selectedTier = subjectPricing.tiers[0]; // Default
  
  for (const tier of subjectPricing.tiers) {
    if (studentCount >= tier.minStudents) {
      selectedTier = tier;
    } else {
      break;
    }
  }
  
  console.log(`Using default pricing for subject ${subject}, ${studentCount} students: ${selectedTier.price} AZN`);
  return selectedTier.price;
}

// Müəllimin fərdi tariflərini localStorage-dən yüklə
export function getTeacherPricing(teacherId: string): Record<string, PricingTier[]> | null {
  if (typeof window === 'undefined') return null;
  
  const teacherKey = `teacher_pricing_${teacherId}`;
  const savedPricing = localStorage.getItem(teacherKey);
  
  if (savedPricing) {
    try {
      return JSON.parse(savedPricing);
    } catch (error) {
      console.error('Error parsing teacher pricing:', error);
      return null;
    }
  }
  
  return null;
}

