export interface Location {
  id: string;
  name: string;
}

export interface Staff {
  id: string;
  location_id: string;
  name: string;
  role: string;
  order?: number;
}

export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';

export interface Task {
  id: string;
  staff_id: string;
  name: string;
  title?: string;
  start_date?: string;
  end_date?: string;
  content?: string;
  status: TaskStatus;
  responsibilities?: string;
  created_at: string;
}
