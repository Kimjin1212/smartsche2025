export interface RoutineItem {
  id?: string;
  userId: string;
  title: string;
  location?: string;
  day: string; // monday, tuesday, etc.
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  isRoutine: boolean; // To distinguish between routines and tasks
  color?: string;
  createdAt?: any; // Firestore timestamp
  updatedAt?: any; // Firestore timestamp
}

export interface TaskItem {
  id: string;
  userId: string;
  content: string;
  dateTime: any; // Firestore timestamp
  location?: string;
  day?: string; // Calculated from dateTime
  startTime?: string; // Calculated from dateTime
  isRoutine: boolean; // Will be false for tasks
  status: string; // pending, completed
  tags?: string[];
  notes?: string;
  color?: string; // Added color field
  taskType?: 'work' | 'study' | 'exercise' | 'meeting' | 'other';
  priority?: 1 | 2 | 3 | 4 | 5;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  score?: number;
  explanation?: string;
}

export interface SmartTimeSlot {
  startTime: string;
  endTime: string;
  explanation: string;
} 