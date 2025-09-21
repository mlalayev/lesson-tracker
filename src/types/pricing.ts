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
export function calculatePrice(subject: string, studentCount: number): number {
  const subjectPricing = PRICING_CONFIG.find(config => 
    config.subject.toLowerCase() === subject.toLowerCase()
  );
  
  if (!subjectPricing) {
    // Digər fənlər üçün default qiymət
    return studentCount * 5; // Hər tələbə üçün 5 manat
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
  
  return selectedTier.price;
}

