import React, { useState, useEffect } from 'react';
import styles from './TeacherPricingModal.module.css';
import { Lesson } from '@/types/lesson';
import { calculatePrice, calculateStudentCount, PRICING_CONFIG, PricingTier } from '@/types/pricing';

interface Teacher {
  id: string;
  name: string;
  email: string;
}

interface TeacherPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: Teacher | null;
  monthName: string;
  year: number;
  onSavePricing: (subjectPricing: Record<string, PricingTier[]>) => void;
}

export default function TeacherPricingModal({
  isOpen,
  onClose,
  teacher,
  monthName,
  year,
  onSavePricing
}: TeacherPricingModalProps) {
  const [subjectPricing, setSubjectPricing] = useState<Record<string, PricingTier[]>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Initialize pricing with saved values or default values
  useEffect(() => {
    if (isOpen && teacher) {
      const teacherKey = `teacher_pricing_${teacher.id}`;
      const savedPricing = localStorage.getItem(teacherKey);
      
      if (savedPricing) {
        try {
          const parsedPricing = JSON.parse(savedPricing);
          setSubjectPricing(parsedPricing);
        } catch (error) {
          console.error('Error parsing saved pricing:', error);
          // Fallback to default pricing
          initializeDefaultPricing();
        }
      } else {
        // No saved pricing, use defaults
        initializeDefaultPricing();
      }
    }
  }, [isOpen, teacher]);

  const initializeDefaultPricing = () => {
    const initialPricing: Record<string, PricingTier[]> = {};
    PRICING_CONFIG.forEach(config => {
      initialPricing[config.subject] = [...config.tiers];
    });
    setSubjectPricing(initialPricing);
  };

  if (!isOpen || !teacher) return null;

  const handlePriceChange = (subject: string, tierIndex: number, price: number) => {
    setSubjectPricing(prev => ({
      ...prev,
      [subject]: prev[subject].map((tier, index) => 
        index === tierIndex ? { ...tier, price } : tier
      )
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage
      if (teacher) {
        const teacherKey = `teacher_pricing_${teacher.id}`;
        localStorage.setItem(teacherKey, JSON.stringify(subjectPricing));
        console.log(`Saved pricing for teacher ${teacher.name}:`, subjectPricing);
      }
      
      await onSavePricing(subjectPricing);
      onClose();
    } catch (error) {
      console.error('Error saving pricing:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{teacher.name} - Maaş Təyin Et</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.summary}>
            <div className={styles.summaryCard}>
              <div className={styles.summaryValue}>{Object.keys(subjectPricing).length}</div>
              <div className={styles.summaryLabel}>Fənn Sayı</div>
            </div>
            <div className={styles.summaryCard}>
              <div className={styles.summaryValue}>{monthName} {year}</div>
              <div className={styles.summaryLabel}>Ay</div>
            </div>
          </div>

          <div className={styles.pricingSection}>
            <h3>Fənnlər və Maaş Tarifləri</h3>
            <div className={styles.subjectsList}>
              {Object.entries(subjectPricing).map(([subject, tiers]) => (
                <div key={subject} className={styles.subjectCard}>
                  <div className={styles.subjectHeader}>
                    <h4>{subject}</h4>
                  </div>
                  
                  <div className={styles.tiersList}>
                    {tiers.map((tier, tierIndex) => (
                      <div key={tierIndex} className={styles.tierCard}>
                        <div className={styles.tierInfo}>
                          <span className={styles.studentCount}>
                            {tier.minStudents} {tier.maxStudents ? `- ${tier.maxStudents}` : '+'} nəfər
                          </span>
                        </div>
                        <div className={styles.priceInput}>
                          <input
                            type="number"
                            value={tier.price}
                            onChange={(e) => handlePriceChange(subject, tierIndex, parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            className={styles.priceField}
                          />
                          <span className={styles.currency}>AZN</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={onClose}>
            Ləğv et
          </button>
          <button 
            className={styles.saveButton} 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saxlanılır...' : 'Saxla'}
          </button>
        </div>
      </div>
    </div>
  );
}
