
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { InstructorProfile, DanceClass, StudentDetailedProfile, GroupDetailedProfile, FinancialSummary, SubscriptionPlan, SkillLevel, Lead, AdminTask, InstructorAttendanceRecord, InstructorUnavailability, TaskProject, VacationPeriod } from '../types';
import { MOCK_INSTRUCTORS_DATA, MOCK_CLASSES, MOCK_ADMIN_STUDENTS, MOCK_ADMIN_GROUPS, MOCK_FINANCIAL_DATA, SUBSCRIPTION_PLANS, MOCK_LEADS, MOCK_ADMIN_TASKS, MOCK_INSTRUCTOR_ATTENDANCE, MOCK_INSTRUCTOR_UNAVAILABILITY } from '../constants';
import { db, auth } from '../firebaseConfig';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc,
  getDoc,
  getDocs, 
  writeBatch,
  query,
  orderBy
} from 'firebase/firestore';
import * as FirebaseAuth from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';

interface DataContextType {
  instructors: InstructorProfile[];
  classes: DanceClass[];
  students: StudentDetailedProfile[];
  groups: GroupDetailedProfile[];
  subscriptionPlans: SubscriptionPlan[]; 
  financials: FinancialSummary;
  leads: Lead[];
  tasks: AdminTask[];
  projects: TaskProject[];
  instructorAttendance: InstructorAttendanceRecord[];
  unavailabilities: InstructorUnavailability[];
  vacationPeriods: VacationPeriod[];
  lastFinancialSync: Date | null;
  
  updateInstructor: (id: string, updates: Partial<InstructorProfile>) => Promise<void>;
  deleteInstructor: (id: string) => Promise<void>;
  updateClass: (id: string, updates: Partial<DanceClass>) => Promise<void>;
  updateStudent: (id: string, updates: Partial<StudentDetailedProfile>) => Promise<void>;
  updateGroup: (id: string, updates: Partial<GroupDetailedProfile>) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  addGroup: (group: GroupDetailedProfile) => Promise<void>;
  
  updateMasterSchedule: (groupId: string, newSchedule: { day: string; time: string; room: string; duration: string }, newName?: string, newLevel?: SkillLevel) => Promise<void>;
  mergeGroups: (sourceGroupId: string, targetGroupId: string, deleteSource?: boolean) => Promise<void>;

  addStudent: (student: StudentDetailedProfile) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  removeStudentFromGroup: (studentId: string, groupId: string) => Promise<void>;
  clearAllStudents: () => Promise<void>;
  hardResetDatabase: () => Promise<void>; 
  claimStudentProfile: (user: FirebaseUser) => Promise<boolean>;
  
  addLead: (lead: Lead) => Promise<void>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;

  // Task Management
  addTask: (task: AdminTask) => Promise<void>;
  updateTask: (task: AdminTask) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  reorderTasks: (newTasks: AdminTask[]) => Promise<void>;

  // Project Management
  addProject: (project: TaskProject) => Promise<void>;
  updateProject: (id: string, updates: Partial<TaskProject>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  // Instructor Attendance
  saveInstructorAttendanceBatch: (records: InstructorAttendanceRecord[]) => Promise<void>;
  addInstructorUnavailability: (unavailability: Omit<InstructorUnavailability, 'id'>) => Promise<void>;
  
  addVacationPeriod: (period: VacationPeriod) => Promise<void>;
  deleteVacationPeriod: (id: string) => Promise<void>;

  // Automated Check-in
  performQrCheckIn: (studentId: string, classId: string) => Promise<{ success: boolean; message: string; studentName?: string }>;

  syncFinancials: () => Promise<void>;
  syncStripePlans: () => Promise<void>;
  refreshSubscriptionPlans: () => Promise<void>;
  
  configureStripeKey: (key: string) => Promise<void>;
  fetchStripeCustomers: () => Promise<void>;
  
  loading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const cleanData = <T,>(data: T): T => {
    return JSON.parse(JSON.stringify(data));
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [instructors, setInstructors] = useState<InstructorProfile[]>([]);
  const [classes, setClasses] = useState<DanceClass[]>([]);
  const [students, setStudents] = useState<StudentDetailedProfile[]>([]);
  const [groups, setGroups] = useState<GroupDetailedProfile[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<AdminTask[]>([]);
  const [projects, setProjects] = useState<TaskProject[]>([]);
  const [instructorAttendance, setInstructorAttendance] = useState<InstructorAttendanceRecord[]>([]);
  const [unavailabilities, setUnavailabilities] = useState<InstructorUnavailability[]>([]);
  const [vacationPeriods, setVacationPeriods] = useState<VacationPeriod[]>([]);
  
  const [financials, setFinancials] = useState<FinancialSummary>(MOCK_FINANCIAL_DATA);
  const [lastFinancialSync, setLastFinancialSync] = useState<Date | null>(new Date());

  const [loading, setLoading] = useState(true);
  const localDeletedIds = useRef<Set<string>>(new Set());

  const syncDatabaseWithMocks = async () => {
    try {
      const batch = writeBatch(db);
      let hasUpdates = false;

      const deletedRef = collection(db, 'deleted_records');
      const deletedSnap = await getDocs(deletedRef);
      const deletedIds = new Set(deletedSnap.docs.map(d => d.id));

      // Seeding attendance if empty
      const attendanceRef = collection(db, 'instructor_attendance');
      const attSnap = await getDocs(attendanceRef);
      if (attSnap.empty) {
          MOCK_INSTRUCTOR_ATTENDANCE.forEach(a => batch.set(doc(attendanceRef, a.id), a));
          hasUpdates = true;
      }

      // Seeding unavailabilities if empty
      const unavailRef = collection(db, 'instructor_unavailabilities');
      const unavailSnap = await getDocs(unavailRef);
      if (unavailSnap.empty) {
          MOCK_INSTRUCTOR_UNAVAILABILITY.forEach(u => batch.set(doc(unavailRef, u.id), u));
          hasUpdates = true;
      }

      const tasksRef = collection(db, 'tasks');
      const taskSnap = await getDocs(tasksRef);
      if (taskSnap.empty) {
          MOCK_ADMIN_TASKS.forEach((t, index) => {
              const taskWithOrder = { ...t, order: index };
              batch.set(doc(tasksRef, t.id), taskWithOrder);
          });
          hasUpdates = true;
      }

      const projectsRef = collection(db, 'task_projects');
      const projectSnap = await getDocs(projectsRef);
      if (projectSnap.empty) {
          const { MOCK_TASK_PROJECTS } = await import('../data/tasks');
          MOCK_TASK_PROJECTS.forEach((p, index) => {
              batch.set(doc(projectsRef, p.id), { ...p, order: index });
          });
          hasUpdates = true;
      }

      const studentsRef = collection(db, 'students');
      const studentSnap = await getDocs(studentsRef);
      const existingStudentIds = new Set(studentSnap.docs.map(d => d.id));

      MOCK_ADMIN_STUDENTS.forEach(s => {
          if (!existingStudentIds.has(s.id) && !deletedIds.has(s.id)) {
              batch.set(doc(studentsRef, s.id), s);
              hasUpdates = true;
          }
      });

      const instRef = collection(db, 'instructors');
      const instSnap = await getDocs(instRef);
      const existingInstIds = new Set(instSnap.docs.map(d => d.id));
      MOCK_INSTRUCTORS_DATA.forEach(i => {
          if (!existingInstIds.has(i.id)) {
              batch.set(doc(instRef, i.id), i);
              hasUpdates = true;
          }
      });

      const groupsRef = collection(db, 'groups');
      const groupSnap = await getDocs(groupsRef);
      const existingGroupIds = new Set(groupSnap.docs.map(d => d.id));
      
      MOCK_ADMIN_GROUPS.forEach(g => {
          if (!existingGroupIds.has(g.id) && !deletedIds.has(g.id)) {
              batch.set(doc(groupsRef, g.id), g);
              hasUpdates = true;
          }
      });

      const classesRef = collection(db, 'classes');
      const classSnap = await getDocs(classesRef);
      const existingClassIds = new Set(classSnap.docs.map(d => d.id));

      MOCK_CLASSES.forEach(c => {
          if (!existingClassIds.has(c.id)) {
              batch.set(doc(classesRef, c.id), c);
              hasUpdates = true;
          }
      });

      const leadsRef = collection(db, 'leads');
      const leadsSnap = await getDocs(leadsRef);
      if (leadsSnap.empty) {
          MOCK_LEADS.forEach(l => batch.set(doc(leadsRef, l.id), l));
          hasUpdates = true;
      }

      if (hasUpdates) await batch.commit();

    } catch (e) { 
        console.warn("Sync skipped:", e); 
    }
  };

  const hardResetDatabase = async () => {
      setLoading(true);
      try {
          const batch = writeBatch(db);
          MOCK_ADMIN_STUDENTS.forEach(s => batch.set(doc(db, 'students', s.id), s));
          MOCK_INSTRUCTORS_DATA.forEach(i => batch.set(doc(db, 'instructors', i.id), i));
          MOCK_CLASSES.forEach(c => batch.set(doc(db, 'classes', c.id), c));
          MOCK_ADMIN_GROUPS.forEach(g => batch.set(doc(db, 'groups', g.id), g));
          MOCK_LEADS.forEach(l => batch.set(doc(db, 'leads', l.id), l));
          SUBSCRIPTION_PLANS.forEach(p => batch.set(doc(db, 'subscription_plans', p.id), p));
          MOCK_ADMIN_TASKS.forEach((t, i) => batch.set(doc(db, 'tasks', t.id), { ...t, order: i }));
          const { MOCK_TASK_PROJECTS } = await import('../data/tasks');
          MOCK_TASK_PROJECTS.forEach((p, i) => batch.set(doc(db, 'task_projects', p.id), { ...p, order: i }));
          MOCK_INSTRUCTOR_ATTENDANCE.forEach(a => batch.set(doc(db, 'instructor_attendance', a.id), a));
          MOCK_INSTRUCTOR_UNAVAILABILITY.forEach(u => batch.set(doc(db, 'instructor_unavailabilities', u.id), u));

          const deletedSnap = await getDocs(collection(db, 'deleted_records'));
          deletedSnap.docs.forEach(d => batch.delete(d.ref));

          await batch.commit();
          window.location.reload(); 
      } catch (e) {
          console.error("Hard Reset Failed:", e);
          setLoading(false);
      }
  };

  useEffect(() => {
    let unsubs: (() => void)[] = [];

    const unsubscribeAuth = FirebaseAuth.onAuthStateChanged(auth, async (user) => {
        if (user) {
            setLoading(true);
            try {
                await syncDatabaseWithMocks(); 

                unsubs.push(onSnapshot(collection(db, 'instructors'), (snap) => setInstructors(snap.docs.map(d => ({ id: d.id, ...d.data() } as InstructorProfile)))));
                unsubs.push(onSnapshot(collection(db, 'classes'), (snap) => setClasses(snap.docs.map(d => ({ id: d.id, ...d.data() } as DanceClass)).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.time.localeCompare(b.time)))));
                unsubs.push(onSnapshot(collection(db, 'students'), (snap) => setStudents(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as StudentDetailedProfile).filter(s => !localDeletedIds.current.has(s.id)))));
                unsubs.push(onSnapshot(collection(db, 'groups'), (snap) => setGroups(snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as GroupDetailedProfile).filter(g => !localDeletedIds.current.has(g.id)))));
                unsubs.push(onSnapshot(collection(db, 'leads'), (snap) => setLeads(snap.docs.map(d => ({ id: d.id, ...d.data() } as Lead)))));
                unsubs.push(onSnapshot(collection(db, 'instructor_attendance'), (snap) => setInstructorAttendance(snap.docs.map(d => ({ id: d.id, ...d.data() } as InstructorAttendanceRecord)))));
                unsubs.push(onSnapshot(collection(db, 'instructor_unavailabilities'), (snap) => setUnavailabilities(snap.docs.map(d => ({ id: d.id, ...d.data() } as InstructorUnavailability)))));
                unsubs.push(onSnapshot(collection(db, 'vacation_periods'), (snap) => setVacationPeriods(snap.docs.map(d => ({ id: d.id, ...d.data() } as VacationPeriod)))));
                unsubs.push(onSnapshot(collection(db, 'task_projects'), (snap) => setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() } as TaskProject)).sort((a, b) => (a.order || 0) - (b.order || 0)))));
                
                const tasksQuery = query(collection(db, 'tasks'), orderBy('order', 'asc'));
                unsubs.push(onSnapshot(tasksQuery, (snap) => {
                    const fetchedTasks = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as AdminTask);
                    setTasks(fetchedTasks);
                    
                    // Auto-archive logic: tasks done before today (archive at midnight)
                    const now = new Date();
                    const todayStr = now.toDateString();
                    const batch = writeBatch(db);
                    let hasArchived = false;
                    
                    fetchedTasks.forEach(task => {
                        if (task.status === 'done' && task.completedAt) {
                            const completedDate = new Date(task.completedAt);
                            
                            // If the completed date is not today, it means it's past midnight
                            if (completedDate.toDateString() !== todayStr) {
                                batch.update(doc(db, 'tasks', task.id), { status: 'archived' });
                                hasArchived = true;
                            }
                        }

                        // Auto-inbox logic: tasks missing assignee, date, or tag must be in inbox
                        if (task.status === 'pending') {
                            const hasAllInfo = !!task.assignee && !!task.date && !!task.tag;
                            if (!hasAllInfo) {
                                batch.update(doc(db, 'tasks', task.id), { status: 'inbox' });
                                hasArchived = true;
                            }
                        }
                    });
                    
                    if (hasArchived) {
                        batch.commit().catch(err => console.error("Auto-archive failed:", err));
                    }
                }));

                unsubs.push(onSnapshot(collection(db, 'subscription_plans'), (snap) => {
                    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as SubscriptionPlan);
                    setSubscriptionPlans(data.length > 0 ? data : SUBSCRIPTION_PLANS);
                    setLoading(false);
                }));

            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        } else {
            setInstructors([]); setClasses([]); setStudents([]); setGroups([]); setLeads([]); setTasks([]);
            setLoading(false);
        }
    });

    return () => {
      unsubscribeAuth();
      unsubs.forEach(fn => fn());
    };
  }, []);

  const claimStudentProfile = async (user: FirebaseUser): Promise<boolean> => { return false; };
  const updateInstructor = async (id: string, updates: Partial<InstructorProfile>) => { try { await setDoc(doc(db, 'instructors', id), updates, { merge: true }); } catch (e) { console.error(e); } };
  const deleteInstructor = async (id: string) => { if (!id) return; try { await deleteDoc(doc(db, 'instructors', id)); } catch (e) { console.error(e); } };
  const updateClass = async (id: string, updates: Partial<DanceClass>) => { try { await setDoc(doc(db, 'classes', id), updates, { merge: true }); } catch (e) { console.error(e); } };
  const updateStudent = async (id: string, updates: Partial<StudentDetailedProfile>) => {
    try {
      await setDoc(doc(db, 'students', id), updates, { merge: true });
      setStudents(prevStudents =>
        prevStudents.map(student => (student.id === id ? { ...student, ...updates } : student))
      );
    } catch (e) {
      console.error(e);
    }
  };
  const addStudent = async (student: StudentDetailedProfile) => { try { await setDoc(doc(db, 'students', student.id), cleanData(student)); } catch (e) { console.error(e); } };
  const updateGroup = async (id: string, updates: Partial<GroupDetailedProfile>) => { try { await setDoc(doc(db, 'groups', id), updates, { merge: true }); } catch (e) { console.error(e); } };
  
  const performQrCheckIn = async (studentId: string, classId: string) => {
      const student = students.find(s => s.id === studentId);
      const danceClass = classes.find(c => c.id === classId);
      
      if (!student || !danceClass) return { success: false, message: 'Date invalide' };

      // Validation
      const isStaff = student.subscription?.type === 'Staff';
      const expiryDate = new Date(student.subscription?.expiryDate);
      const isExpired = !isStaff && (expiryDate < new Date() || !student.subscription?.active);

      if (isExpired) return { success: false, message: 'Abonament Expirat', studentName: student.name };

      // Check-in
      const todayStr = new Date().toISOString().split('T')[0];
      const alreadyChecked = student.attendanceHistory?.some(r => r.date === todayStr && r.className === danceClass.title && r.status === 'present');
      
      if (alreadyChecked) return { success: true, message: 'Deja prezent', studentName: student.name };

      const newHistory = [{ date: todayStr, className: danceClass.title, status: 'present' }, ...(student.attendanceHistory || [])];
      const newTotal = (student.stats?.totalClasses || 0) + 1;

      await updateStudent(studentId, {
          attendanceHistory: newHistory,
          stats: { ...student.stats, totalClasses: newTotal }
      });

      return { success: true, message: 'Check-in Reușit', studentName: student.name };
  };

  const saveInstructorAttendanceBatch = async (records: InstructorAttendanceRecord[]) => {
      try {
          const batch = writeBatch(db);
          records.forEach(rec => {
              batch.set(doc(db, 'instructor_attendance', rec.id), cleanData(rec), { merge: true });
          });
          await batch.commit();
      } catch (e) { console.error(e); }
  };

  const addInstructorUnavailability = async (unavailability: Omit<InstructorUnavailability, 'id'>) => {
      try {
          const id = `un_${Date.now()}`;
          await setDoc(doc(db, 'instructor_unavailabilities', id), { id, ...cleanData(unavailability) });
      } catch (e) { console.error(e); }
  };

  const addVacationPeriod = async (period: VacationPeriod) => {
      try {
          await setDoc(doc(db, 'vacation_periods', period.id), cleanData(period));
      } catch (e) { console.error(e); }
  };

  const deleteVacationPeriod = async (id: string) => {
      try {
          await deleteDoc(doc(db, 'vacation_periods', id));
      } catch (e) { console.error(e); }
  };

  const deleteGroup = async (id: string) => { 
      if (!id) return; 
      localDeletedIds.current.add(id); 
      try { 
          const batch = writeBatch(db);
          batch.delete(doc(db, 'groups', id));
          batch.set(doc(db, 'deleted_records', id), { timestamp: new Date().toISOString(), type: 'group' });
          await batch.commit();
      } catch (e) { console.error(e); } 
  };

  const addGroup = async (group: GroupDetailedProfile) => {
      try {
          await setDoc(doc(db, 'groups', group.id), cleanData(group));
      } catch (e) { console.error(e); }
  };

  const updateLead = async (id: string, updates: Partial<Lead>) => { try { await setDoc(doc(db, 'leads', id), updates, { merge: true }); } catch (e) { console.error(e); } };
  const addLead = async (lead: Lead) => { try { await setDoc(doc(db, 'leads', lead.id), cleanData(lead)); } catch (e) { console.error(e); } };

  const addTask = async (task: AdminTask) => {
      try {
          const maxOrder = tasks.length > 0 ? Math.max(...tasks.map(t => t.order || 0)) : -1;
          const newTask = { ...task, order: maxOrder + 1 };
          await setDoc(doc(db, 'tasks', task.id), cleanData(newTask));
      } catch (e) { console.error(e); }
  };

  const updateTask = async (task: AdminTask) => {
      try { 
          const currentTask = tasks.find(t => t.id === task.id);
          let taskToUpdate = { ...task };
          
          // If status changed to 'done', set completedAt
          if (task.status === 'done' && currentTask?.status !== 'done') {
              taskToUpdate.completedAt = new Date().toISOString();
          } else if (task.status !== 'done') {
              // If status changed back from 'done', clear completedAt
              taskToUpdate.completedAt = undefined;
          }

          await setDoc(doc(db, 'tasks', task.id), cleanData(taskToUpdate), { merge: true }); 
      } catch (e) { console.error(e); }
  };

  const deleteTask = async (id: string) => {
      try { await deleteDoc(doc(db, 'tasks', id)); } catch (e) { console.error(e); }
  };

  const reorderTasks = async (newTasks: AdminTask[]) => {
      try {
          const batch = writeBatch(db);
          newTasks.forEach((task, index) => batch.update(doc(db, 'tasks', task.id), { order: index }));
          await batch.commit();
      } catch (e) { console.error(e); }
  };

  const addProject = async (project: TaskProject) => {
      try {
          const maxOrder = projects.length > 0 ? Math.max(...projects.map(p => p.order || 0)) : -1;
          const newProject = { ...project, order: maxOrder + 1 };
          await setDoc(doc(db, 'task_projects', project.id), cleanData(newProject));
      } catch (e) { console.error(e); }
  };

  const updateProject = async (id: string, updates: Partial<TaskProject>) => {
      try { await setDoc(doc(db, 'task_projects', id), cleanData(updates), { merge: true }); } catch (e) { console.error(e); }
  };

  const deleteProject = async (id: string) => {
      try { await deleteDoc(doc(db, 'task_projects', id)); } catch (e) { console.error(e); }
  };

  const updateMasterSchedule = async (groupId: string, newSchedule: { day: string; time: string; room: string; duration: string }, newName?: string, newLevel?: SkillLevel) => {
      try {
          const batch = writeBatch(db);
          const groupRef = doc(db, 'groups', groupId);
          const groupSnap = await getDoc(groupRef);
          if (!groupSnap.exists()) throw new Error('Group not found');
          const groupData = groupSnap.data() as GroupDetailedProfile;
          
          const oldDay = groupData.schedule.day;
          const oldTime = groupData.schedule.time;
          const oldName = groupData.name;
          const oldLevel = groupData.level;
          
          const targetName = newName || oldName;
          const targetLevel = newLevel || oldLevel;

          const dayMap: Record<string, number> = { 'Duminică': 0, 'Luni': 1, 'Marți': 2, 'Miercuri': 3, 'Joi': 4, 'Vineri': 5, 'Sâmbătă': 6 };
          const oldDayIdx = dayMap[oldDay] ?? 1;
          const newDayIdx = dayMap[newSchedule.day] ?? 1;
          const dayDiff = newDayIdx - oldDayIdx;

          batch.update(groupRef, { schedule: newSchedule, name: targetName, level: targetLevel });

          students.forEach(student => {
              let studentChanged = false;
              let newMainGroup = student.mainGroup || '';
              const replaceGroupInfo = (str: string) => {
                  let res = str;
                  if (res && res.includes(oldDay)) res = res.replace(oldDay, newSchedule.day);
                  if (newName && res && res.includes(oldName)) res = res.replace(oldName, targetName);
                  return res;
              };
              if (student.enrollments && student.enrollments.some(e => e.groupId === groupId)) {
                  if (student.mainGroup === oldName) {
                      newMainGroup = targetName;
                      studentChanged = true;
                  } else if (newMainGroup.includes(oldDay) && newMainGroup.includes(groupData.style)) {
                      newMainGroup = replaceGroupInfo(newMainGroup);
                      studentChanged = true;
                  }
                  const newEnrollments = student.enrollments.map(enr => {
                      if (enr.groupId === groupId) {
                          const updatedName = replaceGroupInfo(enr.groupName || targetName);
                          const updatedSchedule = `${newSchedule.day} ${newSchedule.time}`;
                          if (updatedName !== enr.groupName || enr.level !== targetLevel || enr.schedule !== updatedSchedule) {
                              studentChanged = true;
                              return { ...enr, groupName: updatedName, level: targetLevel, schedule: updatedSchedule };
                          }
                      }
                      return enr;
                  });
                  if (studentChanged) batch.update(doc(db, 'students', student.id), { mainGroup: newMainGroup, enrollments: newEnrollments });
              }
          });

          instructors.forEach(instr => {
              let scheduleChanged = false;
              const newScheduleArr = (instr.schedule || []).map(slot => {
                  const isMatch = (slot.day === oldDay && slot.time === oldTime) && (slot.className === oldName || slot.level === oldLevel);
                  if (isMatch) {
                      scheduleChanged = true;
                      return { ...slot, day: newSchedule.day, time: newSchedule.time, level: targetLevel, className: targetName };
                  }
                  return slot;
              });
              if (scheduleChanged) batch.update(doc(db, 'instructors', instr.id), { schedule: newScheduleArr });
          });

          classes.forEach(cls => {
              const clsDate = new Date(cls.date);
              if (clsDate.getDay() === oldDayIdx && cls.time === oldTime && cls.title === oldName) {
                  const newClassDate = new Date(clsDate);
                  newClassDate.setDate(clsDate.getDate() + dayDiff);
                  batch.update(doc(db, 'classes', cls.id), { title: targetName, level: targetLevel, time: newSchedule.time, room: newSchedule.room, duration: newSchedule.duration, date: newClassDate.toISOString().split('T')[0] });
              }
          });
          await batch.commit();
      } catch (e) { throw e; }
  };

  const mergeGroups = async (sourceGroupId: string, targetGroupId: string, deleteSource: boolean = false) => {
      try {
          const batch = writeBatch(db);
          const sourceGroup = groups.find(g => g.id === sourceGroupId);
          const targetGroup = groups.find(g => g.id === targetGroupId);
          if (!sourceGroup || !targetGroup) throw new Error("Groups not found");
          const studentsToMove = students.filter(s => s.enrollments?.some(e => e.groupId === sourceGroupId) || s.mainGroup === sourceGroup.name);
          studentsToMove.forEach(student => {
              let newEnrollments = (student.enrollments || []).filter(e => e.groupId !== sourceGroupId);
              if (!newEnrollments.some(e => e.groupId === targetGroupId)) {
                  newEnrollments.push({ groupId: targetGroup.id, groupName: targetGroup.name, style: targetGroup.style, level: targetGroup.level, role: student.gender === 'M' ? 'Leader' : 'Follower', schedule: `${targetGroup.schedule.day} ${targetGroup.schedule.time}` });
              }
              let newMainGroup = student.mainGroup === sourceGroup.name ? targetGroup.name : student.mainGroup;
              batch.update(doc(db, 'students', student.id), { enrollments: newEnrollments, mainGroup: newMainGroup });
          });
          if (deleteSource) batch.delete(doc(db, 'groups', sourceGroupId));
          else batch.update(doc(db, 'groups', sourceGroupId), { status: 'closed', name: `${sourceGroup.name} (Merged)` });
          await batch.commit();
      } catch (e) { throw e; }
  };

  const deleteStudent = async (id: string) => { 
      if (!id) return; 
      localDeletedIds.current.add(id); 
      try { 
          const batch = writeBatch(db);
          batch.delete(doc(db, 'students', id));
          batch.set(doc(db, 'deleted_records', id), { timestamp: new Date().toISOString(), type: 'student' });
          await batch.commit();
      } catch (e) { console.error(e); } 
  };

  const removeStudentFromGroup = async (studentId: string, groupId: string) => {
      try {
          const student = students.find(s => s.id === studentId);
          if (!student) return;
          const targetGroupName = groups.find(g => g.id === groupId)?.name || '';
          const updatedEnrollments = (student.enrollments || []).filter(e => e.groupId !== groupId && (targetGroupName ? e.groupName !== targetGroupName : true));
          let newMainGroup = student.mainGroup === targetGroupName ? (updatedEnrollments[0]?.groupName || "Fără Grupă") : student.mainGroup;
          await setDoc(doc(db, 'students', studentId), { enrollments: updatedEnrollments, mainGroup: newMainGroup }, { merge: true });
      } catch (error) { console.error(error); }
  };
  
  const clearAllStudents = async () => {
      try {
          const snapshot = await getDocs(collection(db, 'students'));
          const batch = writeBatch(db);
          snapshot.docs.forEach((doc) => batch.delete(doc.ref));
          await batch.commit();
      } catch (e) { console.error(e); }
  };
  const syncStripePlans = async () => {};
  const syncFinancials = async () => {};
  const refreshSubscriptionPlans = async () => {
      try {
          const batch = writeBatch(db);
          SUBSCRIPTION_PLANS.forEach(plan => batch.set(doc(db, 'subscription_plans', plan.id), plan, { merge: true }));
          await batch.commit();
      } catch (e) { throw e; }
  };
  const configureStripeKey = async (apiKey: string) => {
      try {
          const functions = getFunctions();
          const result = await httpsCallable(functions, 'setStripeConfig')({ apiKey });
          const data = result.data as any;
          if (!data.success) throw new Error(data.message);
      } catch (error: any) { throw new Error(error.message || "Eroare."); }
  };
  const fetchStripeCustomers = async () => {
      try {
          const functions = getFunctions();
          const result = await httpsCallable(functions, 'syncStripeCustomers')();
          const data = (result.data as any);
          if (!data.success) throw new Error(data.message);
      } catch (error: any) { throw new Error(error.message || "Eroare."); }
  };

  return (
    <DataContext.Provider value={{ 
        instructors, classes, students, groups, financials, lastFinancialSync, subscriptionPlans, leads, tasks, projects, instructorAttendance, unavailabilities, vacationPeriods,
        updateInstructor, deleteInstructor, updateClass, updateStudent, updateGroup, deleteGroup, addGroup, addStudent, deleteStudent, removeStudentFromGroup, clearAllStudents, hardResetDatabase, claimStudentProfile, 
        addLead, updateLead,
        addTask, updateTask, deleteTask, reorderTasks,
        addProject, updateProject, deleteProject,
        saveInstructorAttendanceBatch, addInstructorUnavailability,
        addVacationPeriod, deleteVacationPeriod,
        syncFinancials, syncStripePlans, refreshSubscriptionPlans,
        configureStripeKey, fetchStripeCustomers, updateMasterSchedule, mergeGroups,
        performQrCheckIn,
        loading 
    }}>
      {!loading ? children : (
        <div className="h-screen w-full flex items-center justify-center bg-white dark:bg-gray-900">
           <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
              <p className="text-sm font-bold text-gray-500 animate-pulse">Se încarcă datele Ginga...</p>
           </div>
        </div>
      )}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
