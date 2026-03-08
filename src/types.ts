export interface Location {
  id: number;
  name: string;
}

export interface Staff {
  id: number;
  location_id: number;
  name: string;
  role: string;
}

export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';

export interface Task {
  id: number;
  staff_id: number;
  name: string;
  title?: string;
  start_date?: string;
  end_date?: string;
  content?: string;
  status: TaskStatus;
  responsibilities?: string;
  created_at: string;
}
