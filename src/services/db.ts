import { collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, query, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Location, Staff, Task } from '../types';

// Collections
const locationsRef = collection(db, 'locations');
const staffRef = collection(db, 'staff');
const tasksRef = collection(db, 'tasks');

// Subscriptions
export const subscribeToLocations = (callback: (locations: Location[]) => void) => {
  return onSnapshot(locationsRef, (snapshot) => {
    const locations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Location));
    callback(locations);
  });
};

export const subscribeToStaff = (callback: (staff: Staff[]) => void) => {
  return onSnapshot(staffRef, (snapshot) => {
    const staff = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff));
    callback(staff);
  });
};

export const subscribeToTasks = (callback: (tasks: Task[]) => void) => {
  return onSnapshot(tasksRef, (snapshot) => {
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
    callback(tasks);
  });
};

// Operations
export const addStaff = async (staff: Omit<Staff, 'id'>) => {
  await addDoc(staffRef, staff);
};

export const updateStaff = async (id: string, data: Partial<Staff>) => {
  await updateDoc(doc(db, 'staff', id), data);
};

export const deleteStaff = async (id: string) => {
  // Delete associated tasks first
  const q = query(tasksRef);
  const snapshot = await getDocs(q);
  const tasksToDelete = snapshot.docs.filter(doc => doc.data().staff_id === id);
  
  const deletePromises = tasksToDelete.map(taskDoc => deleteDoc(doc(db, 'tasks', taskDoc.id)));
  await Promise.all(deletePromises);
  
  // Then delete staff
  await deleteDoc(doc(db, 'staff', id));
};

export const addTask = async (task: Omit<Task, 'id' | 'created_at'>) => {
  await addDoc(tasksRef, {
    ...task,
    created_at: new Date().toISOString()
  });
};

export const updateTask = async (id: string, data: Partial<Task>) => {
  await updateDoc(doc(db, 'tasks', id), data);
};

export const deleteTask = async (id: string) => {
  await deleteDoc(doc(db, 'tasks', id));
};

export const cleanupDuplicates = async () => {
  const locSnapshot = await getDocs(locationsRef);
  const locMap = new Map<string, string>();
  const locsToDelete: string[] = [];
  const locIdMapping = new Map<string, string>(); // oldId -> newId

  locSnapshot.docs.forEach(doc => {
    const name = doc.data().name;
    if (locMap.has(name)) {
      locsToDelete.push(doc.id);
      locIdMapping.set(doc.id, locMap.get(name)!);
    } else {
      locMap.set(name, doc.id);
    }
  });

  // Update staff that point to deleted locations
  const staffSnapshot = await getDocs(staffRef);
  for (const docSnapshot of staffSnapshot.docs) {
    const data = docSnapshot.data();
    if (locIdMapping.has(data.location_id)) {
      await updateDoc(doc(db, 'staff', docSnapshot.id), {
        location_id: locIdMapping.get(data.location_id)
      });
    }
  }

  for (const id of locsToDelete) {
    await deleteDoc(doc(db, 'locations', id));
  }

  // Also clean up staff that might be duplicated (same name and role)
  const updatedStaffSnapshot = await getDocs(staffRef);
  const staffMap = new Map<string, string>();
  const staffToDelete: string[] = [];
  const staffIdMapping = new Map<string, string>(); // oldId -> newId

  updatedStaffSnapshot.docs.forEach(doc => {
    const key = `${doc.data().name}-${doc.data().role}-${doc.data().location_id}`;
    if (staffMap.has(key)) {
      staffToDelete.push(doc.id);
      staffIdMapping.set(doc.id, staffMap.get(key)!);
    } else {
      staffMap.set(key, doc.id);
    }
  });

  // Update tasks that point to deleted staff
  const tasksSnapshot = await getDocs(tasksRef);
  for (const docSnapshot of tasksSnapshot.docs) {
    const data = docSnapshot.data();
    if (staffIdMapping.has(data.staff_id)) {
      await updateDoc(doc(db, 'tasks', docSnapshot.id), {
        staff_id: staffIdMapping.get(data.staff_id)
      });
    }
  }

  for (const id of staffToDelete) {
    await deleteDoc(doc(db, 'staff', id));
  }

  // Clean up duplicate tasks
  const updatedTasksSnapshot = await getDocs(tasksRef);
  const tasksMap = new Map<string, string>();
  const tasksToDelete: string[] = [];

  updatedTasksSnapshot.docs.forEach(doc => {
    const key = `${doc.data().name}-${doc.data().staff_id}`;
    if (tasksMap.has(key)) {
      tasksToDelete.push(doc.id);
    } else {
      tasksMap.set(key, doc.id);
    }
  });

  for (const id of tasksToDelete) {
    await deleteDoc(doc(db, 'tasks', id));
  }
};

// Seed initial data if needed
export const seedInitialData = async () => {
  const snapshot = await getDocs(locationsRef);
  if (snapshot.empty) {
    const loc1 = await addDoc(locationsRef, { name: '김해부원' });
    const loc2 = await addDoc(locationsRef, { name: '김해아울렛' });

    const staff1 = await addDoc(staffRef, { location_id: loc1.id, name: '김민준', role: '매니저', order: 1 });
    const staff2 = await addDoc(staffRef, { location_id: loc1.id, name: '이서연', role: '스태프', order: 2 });
    const staff3 = await addDoc(staffRef, { location_id: loc2.id, name: '박지훈', role: '매니저', order: 1 });
    const staff4 = await addDoc(staffRef, { location_id: loc2.id, name: '최유진', role: '스태프', order: 2 });

    await addDoc(tasksRef, { staff_id: staff1.id, name: '오픈 준비 및 정산', status: 'Pending', responsibilities: '매표소 및 매점 포스기 오픈', title: '', start_date: '', end_date: '', content: '', created_at: new Date().toISOString() });
    await addDoc(tasksRef, { staff_id: staff2.id, name: '상영관 청소', status: 'In Progress', responsibilities: '1~3관 상영 종료 후 청소', title: '', start_date: '', end_date: '', content: '', created_at: new Date().toISOString() });
    await addDoc(tasksRef, { staff_id: staff3.id, name: '재고 파악', status: 'Completed', responsibilities: '팝콘 및 음료 재고 확인', title: '', start_date: '', end_date: '', content: '', created_at: new Date().toISOString() });
    await addDoc(tasksRef, { staff_id: staff4.id, name: '고객 응대', status: 'Pending', responsibilities: '로비 안내 및 티켓 확인', title: '', start_date: '', end_date: '', content: '', created_at: new Date().toISOString() });
  }
};
