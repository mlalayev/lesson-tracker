export interface Lesson {
  id: string;
  date: string;
  time: string;
  subject: string;
  studentName: string;
  notes?: string;
  duration: number; // dəqiqə ilə
  isGroupLesson?: boolean; // qrup dərsi olub-olmadığı
  groupId?: string; // qrup ID-si
  groupDays?: number[]; // qrupun gəldiyi günlər (1-7, 1=Bazar ertəsi)
}
